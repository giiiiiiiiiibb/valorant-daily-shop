import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReactNode, useCallback, useEffect, useMemo, useReducer } from "react";
// api & auth logic
import valorantProvider from "@/api/valorant-provider";
import authLogic from "@/auth/auth-logic";
// types
import { EAuthContextType, IAuthAction, IAuthContext } from "@/types/context/auth";
// utils
import user from "@/utils/users";
import { AuthContext, initialAuthState } from "./auth-context";

const reducer = (state: IAuthContext, action: IAuthAction<EAuthContextType>) => {
  switch (action.type) {
    case EAuthContextType.INITIAL:
      return { ...initialAuthState, ...action.payload, isInitialized: true };
    case EAuthContextType.LOGOUT:
      return { ...initialAuthState, isInitialized: true, isSignout: true };
    default:
      return state;
  }
};

type AuthProviderProps = { children: ReactNode };

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialAuthState);

  const initialize = useCallback(async () => {
    dispatch({ type: EAuthContextType.INITIAL, payload: { currentUser: null } });
  }, []);

  const reauthWithCookie = async (ssid: string) => {
    try {
      await AsyncStorage.setItem("ssid_cookie", ssid);

      const params = new URLSearchParams({
        redirect_uri: "https://playvalorant.com/opt_in",
        client_id: "play-valorant-web-prod",
        response_type: "token id_token",
        nonce: "1",
        scope: "account openid",
      });
      const reauthUrl = `https://auth.riotgames.com/authorize?${params}`;

      const response = await fetch(reauthUrl, {
        credentials: "include",
        headers: { Cookie: `ssid=${ssid}` },
      });

      if (!response.ok) throw new Error(`Reauth failed: ${response.status}`);

      const fragment = response.url.split("#")[1] || "";
      const urlParams = new URLSearchParams(fragment);
      const accessToken = urlParams.get("access_token");
      const idToken = urlParams.get("id_token");

      if (!accessToken || !idToken) throw new Error("Token extraction failed");

      await AsyncStorage.multiSet([
        ["access_token", accessToken],
        ["id_token", idToken],
      ]);

      return { accessToken, idToken };
    } catch {
      Toast.show({
        type: "error",
        text1: "Reauthentication Failed",
        text2: "Please sign in again.",
        position: "bottom",
      });
      throw new Error("Reauth failed");
    }
  };

  const login = async (ssidCookie?: string) => {
    try {
      if (ssidCookie) await reauthWithCookie(ssidCookie);

      await authLogic.getEntitlement();
      await valorantProvider.getUserInfo();
      await valorantProvider.getRiotGeo();
      await valorantProvider.getRiotVersion();
      await valorantProvider.getUserBalance();
      await valorantProvider.getAccountXP();
      await valorantProvider.getPlayerLoadout();
      await valorantProvider.getPlayerRankAndRR();

      const currentUser = await AsyncStorage.getItem("current_user");

      dispatch({ type: EAuthContextType.INITIAL, payload: { currentUser } });

      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: `Welcome back, ${currentUser ?? "player"}!`,
        position: "bottom",
      });
    } catch (err: any) {
      console.warn("Login issue:", err);

      if (err.response?.status === 401) {
        Toast.show({
          type: "error",
          text1: "Unauthorized",
          text2: "Session expired or invalid. Please log in again.",
          position: "bottom",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Login Error",
          text2: err.message ?? "An unexpected error occurred.",
          position: "bottom",
        });
      }

      dispatch({ type: EAuthContextType.LOGOUT, payload: {} });
      throw err;
    }
  };

  const logoutUser = async (username?: string) => {
    if (username) user.removeUser(username);
    dispatch({ type: EAuthContextType.LOGOUT, payload: {} });
  };

  useEffect(() => {
    initialize();
  }, [initialize]);

  const contextValue = useMemo(
    () => ({
      ...state,
      login,
      logoutUser,
    }),
    [state]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
