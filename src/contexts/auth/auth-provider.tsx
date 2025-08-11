import React, { ReactNode, useCallback, useEffect, useMemo, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
// api
import valorantProvider from "@/api/valorant-provider";
// auth
import authLogic from "@/auth/auth-logic";
// types
import {
  EAuthContextType,
  IAuthAction,
  IAuthContext,
  SelectAccountResult,
} from "@/types/context/auth";
// utils
import user from "@/utils/users";
import secureStore from "@/utils/secure-store";
// contexts
import { AuthContext, initialAuthState } from "./auth-context";
import { resetStore } from "@/controllers/store";

/** Local shape to drive the reducer */
type State = {
  state: "initializing" | "unauthenticated" | "authenticated";
  currentUser: string | null;
};

const reducer = (state: State, action: IAuthAction): State => {
  switch (action.type) {
    case EAuthContextType.INIT:
      return { ...state, state: "initializing" };
    case EAuthContextType.INIT_DONE_UNAUTH:
      return { ...state, state: "unauthenticated", currentUser: null };
    case EAuthContextType.LOGIN_SUCCESS:
      return { ...state, state: "authenticated", currentUser: action.username ?? null };
    case EAuthContextType.LOGOUT_ALL:
      return { ...state, state: "unauthenticated", currentUser: null };
    default:
      return state;
  }
};

type Props = { children: ReactNode };

/** Constants */
const AUTHORIZE_URL =
  "https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid";

/** Narrow helper for very basic JWT plausibility (avoid obviously bad headers) */
const isLikelyJWT = (t?: string | null) => !!t && typeof t === "string" && t.split(".").length >= 3;

/** Parse access & id tokens from a URL that encodes them in the hash fragment */
const parseTokensFromUrlHash = (url: string) => {
  if (!url || !url.includes("#")) return null;
  const hash = url.split("#")[1];
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const access = params.get("access_token");
  const id = params.get("id_token");
  if (!access || !id) return null;
  return { access, id };
};

/** Persist tokens to secure store (never log tokens) */
const persistTokens = async (access: string, id: string) => {
  await secureStore.setItem("access_token", access);
  await secureStore.setItem("id_token", id);
};

/** Full bootstrap after tokens are present in secure store */
const bootstrapAfterTokens = async (): Promise<void> => {
  // Order matters a bit: entitlements -> identity -> geo -> version -> game endpoints
  await authLogic.getEntitlement();
  await valorantProvider.getUserInfo();
  await valorantProvider.getRiotGeo();       // can throw AUTH_UNAUTHORIZED_GEO if token stale
  await valorantProvider.getRiotVersion();
  await valorantProvider.getUserBalance();
  await valorantProvider.getAccountXP();
  await valorantProvider.getPlayerLoadout();
  await valorantProvider.getPlayerRankAndRR();
};

const AuthProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(reducer, { state: "initializing", currentUser: null });

  /** INIT: keep behavior unchanged (no auto-login to avoid surprising UIs) */
  const initialize = useCallback(async () => {
    dispatch({ type: EAuthContextType.INIT });
    dispatch({ type: EAuthContextType.INIT_DONE_UNAUTH });
  }, []);

  /**
   * Silent token reuse for a saved username.
   * 1) Load per-user tokens from vault.
   * 2) Put them into secureStore.
   * 3) Run bootstrap (calls will validate & fetch all dependencies).
   */
  const tryReuseTokens = useCallback(
    async (username: string): Promise<boolean> => {
      const access = String(await user.getUserInfoFor(username, "access_token") || "");
      const id = String(await user.getUserInfoFor(username, "id_token") || "");
      if (!isLikelyJWT(access) || !isLikelyJWT(id)) return false;

      await persistTokens(access, id);
      await bootstrapAfterTokens();

      // Successful bootstrap -> update current user and state
      await AsyncStorage.setItem("current_user", username);
      dispatch({ type: EAuthContextType.LOGIN_SUCCESS, username });
      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: "Welcome back!",
        position: "bottom",
      });
      return true;
    },
    []
  );

  /**
   * Silent re-auth using per-user SSID cookie.
   * 1) Read SSID from vault.
   * 2) Call authorize with Cookie header.
   * 3) Parse tokens from redirect, persist, and bootstrap.
   * Returns true on success, false otherwise.
   */
  const tryReauthWithSsid = useCallback(
    async (username: string): Promise<boolean> => {
      // Ensure writes go to the right user when we persist via users.ts (which uses "current_user")
      await AsyncStorage.setItem("current_user", username);

      const ssidRaw = await user.getUserInfoFor(username, "ssid");
      const ssid = typeof ssidRaw === "string" ? ssidRaw : "";
      if (!ssid) return false;

      try {
        const response = await fetch(AUTHORIZE_URL, {
          method: "GET",
          headers: { Cookie: `ssid=${ssid}` },
        });

        // Some environments keep the same URL; others return redirected URL containing tokens in hash
        const location = response.url || "";
        const tokens = parseTokensFromUrlHash(location);
        if (!tokens) return false;

        await persistTokens(tokens.access, tokens.id);

        // Mirror per-user tokens for future reuse (users.ts writes to current_user)
        await user.setUserInfo("access_token", tokens.access);
        await user.setUserInfo("id_token", tokens.id);

        await bootstrapAfterTokens();
        dispatch({ type: EAuthContextType.LOGIN_SUCCESS, username });

        Toast.show({
          type: "success",
          text1: "Re-authenticated",
          text2: "Session refreshed silently.",
          position: "bottom",
        });
        return true;
      } catch {
        // Avoid logging sensitive details; just signal failure.
        return false;
      }
    },
    []
  );

  /**
   * Public: select an account by username.
   * Strategy:
   *  - Try to reuse saved tokens (fast path).
   *  - If that fails (or geo returns 401), try SSID silent reauth.
   *  - If both fail, tell caller to open interactive login.
   */
  const selectAccount = useCallback(
    async (username: string): Promise<SelectAccountResult> => {
      try {
        await AsyncStorage.setItem("current_user", username);

        // 1) Fast path: token reuse
        try {
          const ok = await tryReuseTokens(username);
          if (ok) return { needsInteractive: false };
        } catch (err: any) {
          // If Riot Geo specifically failed with 401, attempt SSID path next.
          if (typeof err?.message === "string" && err.message === "AUTH_UNAUTHORIZED_GEO") {
            // fall through to SSID
          } else {
            // Any other error: attempt SSID as well; if it fails we'll signal interactive.
          }
        }

        // 2) SSID silent reauth
        const refreshed = await tryReauthWithSsid(username);
        if (refreshed) return { needsInteractive: false };

        // 3) Interactive required
        Toast.show({
          type: "info",
          text1: "Sign-in required",
          text2: "Please log in to continue.",
          position: "bottom",
        });
        return { needsInteractive: true };
      } catch {
        return { needsInteractive: true };
      }
    },
    [tryReauthWithSsid, tryReuseTokens]
  );

  /**
   * Called by LoginWebView on success (it already saved tokens to secure store).
   * We bootstrap all dependent data and mark the session as authenticated.
   */
  const loginInteractive = useCallback(async () => {
    try {
      await bootstrapAfterTokens();

      const username = (await AsyncStorage.getItem("current_user")) ?? null;
      dispatch({ type: EAuthContextType.LOGIN_SUCCESS, username });

      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: "Welcome!",
        position: "bottom",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: "Please try again.",
        position: "bottom",
      });
      throw new Error("interactive login failed");
    }
  }, []);

  /**
   * Remove a single account from the vault.
   * If it's the current user, clear volatile tokens and reset to unauthenticated.
   */
  const logoutUser = useCallback(async (username: string) => {
    try {
      await user.removeUser(username);

      const current = await AsyncStorage.getItem("current_user");
      if (current && current.toLowerCase() === username.toLowerCase()) {
        await AsyncStorage.removeItem("current_user");
        await secureStore.removeItem("access_token");
        await secureStore.removeItem("id_token");
        await secureStore.removeItem("entitlements_token");
        resetStore();
        dispatch({ type: EAuthContextType.INIT_DONE_UNAUTH });
      }

      Toast.show({
        type: "success",
        text1: "Removed",
        text2: "Account removed from this device.",
        position: "bottom",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed",
        text2: "Could not remove account.",
        position: "bottom",
      });
    }
  }, []);

  /**
   * Remove everything (tokens and all saved accounts).
   */
  const logoutAll = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(["access_token", "id_token", "entitlements_token", "ssid_cookie", "current_user"]);
      await user.clearAllUsers();
      resetStore();
      dispatch({ type: EAuthContextType.LOGOUT_ALL });
      Toast.show({
        type: "success",
        text1: "Logged out",
        text2: "Signed out from all accounts.",
        position: "bottom",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: "An error occurred.",
        position: "bottom",
      });
    }
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const value: IAuthContext = useMemo(
    () => ({
      state: state.state,
      currentUser: state.currentUser,
      initialize,
      selectAccount,
      loginInteractive,
      logoutUser,
      logoutAll,
    }),
    [state, initialize, selectAccount, loginInteractive, logoutUser, logoutAll]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
