import React, { ReactNode, useCallback, useEffect, useMemo, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
// api
import valorantProvider from "@/api/valorant-provider";
// auth
import authLogic from "@/auth/auth-logic";
// types
import { EAuthContextType, IAuthAction, IAuthContext, SelectAccountResult } from "@/types/context/auth";
// utils
import user from "@/utils/users";
import secureStore from "@/utils/secure-store";
// contexts
import { AuthContext, initialAuthState } from "./auth-context";
import { resetStore } from "@/controllers/store";

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

const AuthProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(reducer, { state: "initializing", currentUser: null });

  const initialize = useCallback(async () => {
    dispatch({ type: EAuthContextType.INIT });
    dispatch({ type: EAuthContextType.INIT_DONE_UNAUTH });
  }, []);

  const isLikelyJWT = (t?: string | null) => !!t && t.split(".").length >= 3;

  const tryReuseTokens = useCallback(async (username: string): Promise<boolean> => {
    const access = await user.getUserInfoFor(username, "access_token");
    const id = await user.getUserInfoFor(username, "id_token");
    if (!isLikelyJWT(String(access)) || !isLikelyJWT(String(id))) return false;

    await secureStore.setItem("access_token", String(access));
    await secureStore.setItem("id_token", String(id));

    // Minimal bootstrap to ensure tokens work
    await authLogic.getEntitlement();
    await valorantProvider.getUserInfo();
    await valorantProvider.getRiotGeo();
    await valorantProvider.getRiotVersion();
    await valorantProvider.getUserBalance();
    await valorantProvider.getAccountXP();
    await valorantProvider.getPlayerLoadout();
    await valorantProvider.getPlayerRankAndRR();

    dispatch({ type: EAuthContextType.LOGIN_SUCCESS, username });
    Toast.show({ type: "success", text1: "Login Successful", text2: "Welcome back!", position: "bottom" });
    return true;
  }, []);

  const selectAccount = useCallback(async (username: string): Promise<SelectAccountResult> => {
    try {
      await AsyncStorage.setItem("current_user", username);
      const ok = await tryReuseTokens(username);
      return { needsInteractive: !ok };
    } catch {
      return { needsInteractive: true };
    }
  }, [tryReuseTokens]);

  const loginInteractive = useCallback(async () => {
    try {
      await authLogic.getEntitlement();
      await valorantProvider.getUserInfo();
      await valorantProvider.getRiotGeo();
      await valorantProvider.getRiotVersion();
      await valorantProvider.getUserBalance();
      await valorantProvider.getAccountXP();
      await valorantProvider.getPlayerLoadout();
      await valorantProvider.getPlayerRankAndRR();

      const username = await AsyncStorage.getItem("current_user");
      dispatch({ type: EAuthContextType.LOGIN_SUCCESS, username: username ?? null });

      Toast.show({ type: "success", text1: "Login Successful", text2: "Welcome back!", position: "bottom" });
    } catch {
      Toast.show({ type: "error", text1: "Login Failed", text2: "Please try again.", position: "bottom" });
      throw new Error("interactive login failed");
    }
  }, []);

  const logoutUser = useCallback(async (username: string) => {
    try {
      await user.removeUser(username);

      // If this was the current user, also clear volatile tokens to force reauth
      const current = await AsyncStorage.getItem("current_user");
      if (current && current.toLowerCase() === username.toLowerCase()) {
        await AsyncStorage.removeItem("current_user");
        await secureStore.removeItem("access_token");
        await secureStore.removeItem("id_token");
        resetStore();
        dispatch({ type: EAuthContextType.INIT_DONE_UNAUTH });
      }

      Toast.show({ type: "success", text1: "Removed", text2: "Account removed from this device.", position: "bottom" });
    } catch {
      Toast.show({ type: "error", text1: "Failed", text2: "Could not remove account.", position: "bottom" });
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(["access_token", "id_token", "ssid_cookie", "current_user"]);
      await user.clearAllUsers();
      resetStore();
      dispatch({ type: EAuthContextType.LOGOUT_ALL });
      Toast.show({ type: "success", text1: "Logged out", text2: "Signed out from all accounts.", position: "bottom" });
    } catch {
      Toast.show({ type: "error", text1: "Logout Failed", text2: "An error occurred.", position: "bottom" });
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
