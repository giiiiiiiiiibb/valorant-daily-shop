import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReactNode, useCallback, useEffect, useMemo, useReducer } from "react";
// api
import valorantProvider from "@/api/valorant-provider";
// auth
import authLogic from "@/auth/auth-logic";
// types
import { EAuthContextType, IAuthAction, IAuthContext } from "@/types/context/auth";
// utils
import user from "@/utils/users";
// contexts
import { AuthContext, initialAuthState } from "./auth-context";

const reducer = (state: IAuthContext, action: IAuthAction<EAuthContextType>) => {
    switch (action.type) {
        case EAuthContextType.INITIAL:
            return {
                ...state,
                ...action.payload,
                isInitialized: true,
            };
        case EAuthContextType.LOGOUT:
            return {
                ...initialAuthState,
                isSignout: true,
                isInitialized: true,
            };
        default:
            return state;
    }
};

type AuthProviderProps = {
    children: ReactNode;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
    const [state, dispatch] = useReducer(reducer, initialAuthState);

    const initialize = useCallback(async () => {
        try {
            const currentUser = await AsyncStorage.getItem("current_user");

            if (currentUser) {
                await login();
            } else {
                dispatch({
                    type: EAuthContextType.INITIAL,
                    payload: { currentUser: null },
                });
            }
        } catch (e) {
            console.warn("Auto-login failed:", e);
            dispatch({
                type: EAuthContextType.INITIAL,
                payload: { currentUser: null },
            });
        }
    }, []);

    const reauthWithCookie = async (ssidCookie: string) => {
        try {
            await AsyncStorage.setItem('ssid_cookie', ssidCookie);

            const reauthUrl = 'https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid';

            const response = await fetch(reauthUrl, {
                headers: {
                    'Cookie': `ssid=${ssidCookie}`,
                },
            });

            if (!response.ok) throw new Error('Reauth failed');

            const redirectUrl = response.url;
            const urlParams = new URLSearchParams(redirectUrl.split('#')[1]);
            const accessToken = urlParams.get('access_token');
            const idToken = urlParams.get('id_token');

            if (!accessToken || !idToken) throw new Error('Failed to extract tokens');

            await AsyncStorage.setItem('access_token', accessToken);
            await AsyncStorage.setItem('id_token', idToken);

            return { accessToken, idToken };
        } catch (error: any) {
            console.error('[Reauth] Error:', error.message);
            Toast.show({
                type: 'error',
                text1: 'Reauth Failed',
                text2: 'Failed to refresh authentication. Please login again.',
                position: 'bottom',
            });
            throw error;
        }
    };

    const login = async (ssidCookie?: string) => {
        try {
            if (ssidCookie) {
                await reauthWithCookie(ssidCookie);
            }

            await authLogic.getEntitlement();
            await valorantProvider.getUserInfo();
            await valorantProvider.getRiotGeo();
            await valorantProvider.getRiotVersion();
            await valorantProvider.getUserBalance();
            await valorantProvider.getAccountXP();
            await valorantProvider.getPlayerLoadout();
            await valorantProvider.getPlayerRankAndRR();

            const currentUser = await AsyncStorage.getItem("current_user");

            // Important: Always set currentUser explicitly
            dispatch({
                type: EAuthContextType.INITIAL,
                payload: { currentUser: currentUser ?? null },
            });

            Toast.show({
                type: 'success',
                text1: 'Login Successful',
                text2: 'Welcome back!',
                position: 'bottom',
            });
        } catch (error: any) {
            console.error('[Login] Error:', error.message);

            if (error?.response) {
                const status = error.response.status;
                const message = error.response.data?.message || 'An error occurred during login';
                const toastContent = {
                    type: 'error',
                    position: 'bottom' as const,
                    text1: 'Login Failed',
                    text2: message,
                };

                switch (status) {
                    case 401:
                        toastContent.text1 = 'Authentication Failed';
                        toastContent.text2 = 'Invalid credentials.';
                        break;
                    case 403:
                        toastContent.text1 = 'Access Denied';
                        toastContent.text2 = 'You do not have permission to access this account.';
                        break;
                    case 429:
                        toastContent.text1 = 'Too Many Requests';
                        toastContent.text2 = 'Try again later.';
                        break;
                }

                Toast.show(toastContent);
            } else if (error?.request) {
                Toast.show({
                    type: 'error',
                    text1: 'Network Error',
                    text2: 'Check your internet connection.',
                    position: 'bottom',
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Login Error',
                    text2: error?.message || 'Unexpected error occurred',
                    position: 'bottom',
                });
            }

            dispatch({
                type: EAuthContextType.INITIAL,
                payload: { currentUser: null },
            });

            throw error;
        }
    };

    const logoutUser = async (username: string): Promise<void> => {
        if (!username) return;
        await user.removeUser(username);
    };

    useEffect(() => {
        initialize();
    }, []);

    const memoizedValue = useMemo(() => ({
        isLoading: state.isLoading,
        isSignout: state.isSignout,
        isInitialized: state.isInitialized,
        currentUser: state.currentUser,
        login,
        logoutUser,
        dispatch,
    }), [state]);

    return (
        <AuthContext.Provider value={memoizedValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
