import { WebView } from "react-native-webview";
import { StyleSheet, View } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { WebViewNativeEvent } from "react-native-webview/lib/WebViewTypes";
// components
import Loading from "@/components/loading/loading";
// contexts
import useAuthContext from "@/contexts/hook/use-auth-context";
import useThemeContext from "@/contexts/hook/use-theme-context";
// types
import { LogoutScreenProps } from "@/types/router/navigation";
// utils
import { getWebViewState, saveWebViewState, WebViewState } from "@/utils/web-view-state";

const LOGOUT_URL = "https://auth.riotgames.com/logout";

const LogoutWebView = ({ route, navigation }: LogoutScreenProps) => {
  const { username } = route.params;
  const webViewRef = useRef<WebView | null>(null);
  const { logoutUser } = useAuthContext();
  const { palette } = useThemeContext();
  const [savedState, setSavedState] = useState<WebViewState | null>(null);

  // Load saved state when component mounts
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const state = await getWebViewState(LOGOUT_URL);
        if (mounted && state) setSavedState(state);
      } catch {
        // Silent fail: no sensitive logging
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleNavigationStateChange = useCallback(
    async (event: WebViewNativeEvent) => {
      const { url } = event;

      // Save WebView state (URL + timestamp)
      try {
        const currentState: WebViewState = { url, timestamp: Date.now() };
        await saveWebViewState(currentState);
      } catch {
        // Silent fail
      }

      if (url === LOGOUT_URL) {
        try {
          webViewRef.current?.stopLoading();
        } catch {
          // ignore
        } finally {
          webViewRef.current = null;
        }

        await logoutUser(username);
        navigation.navigate("Accounts");
      }
    },
    [logoutUser, username, navigation]
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.loadingOverlay}>
        <Loading />
      </View>
      <WebView
        ref={webViewRef}
        style={styles.hiddenWebView}
        onNavigationStateChange={handleNavigationStateChange}
        source={{ uri: savedState?.url || LOGOUT_URL }}
        sharedCookiesEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    display: "none",
  },
});

export default React.memo(LogoutWebView);
