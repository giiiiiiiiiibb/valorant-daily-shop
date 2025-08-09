import { WebView } from "react-native-webview";
import { Modal, StyleSheet, View } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { WebViewNavigation } from "react-native-webview/lib/WebViewTypes";
// components
import Loading from "@/components/loading/loading";
// contexts
import useAuthContext from "@/contexts/hook/use-auth-context";
import useThemeContext from "@/contexts/hook/use-theme-context";
// utils
import secureStore from "@/utils/secure-store";
import { getWebViewState, saveWebViewState, WebViewState } from "@/utils/web-view-state";

const initialUrl = "https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid";

const LoginWebView = () => {
  const { login } = useAuthContext();
  const { palette } = useThemeContext();
  const webViewRef = useRef<WebView | null>(null);

  const [shownSignIn, setShownSignIn] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedState, setSavedState] = useState<WebViewState | null>(null);

  const cleanupWebView = useCallback(() => {
    try {
      webViewRef.current?.stopLoading?.();
    } catch {
      // ignore: avoid leaking errors/tokens
    }
    setShownSignIn(false);
  }, []);

  const parseTokenFromUrl = useCallback(
    async (url: string) => {
      try {
        if (url.includes("access_token") && url.includes("id_token")) {
          const searchParams = new URLSearchParams(new URL(url).hash.slice(1));
          const access_token = searchParams.get("access_token");
          const id_token = searchParams.get("id_token");

          if (access_token && id_token) {
            setLoading(true);
            // Store tokens securely; do not log them
            await secureStore.setItem("access_token", access_token);
            await secureStore.setItem("id_token", id_token);

            setModalVisible(false);
            await login();
            setLoading(false);
          }
        }
      } catch {
        // Swallow errors silently to avoid printing sensitive payloads
      }
    },
    [login]
  );

  const handleNavigationStateChange = useCallback(
    async (event: WebViewNavigation) => {
      const { url } = event;

      await saveWebViewState({ url, timestamp: Date.now() });

      if (url.startsWith("https://authenticate.riotgames.com") && !shownSignIn) {
        setShownSignIn(true);
        setModalVisible(true);
      }

      await parseTokenFromUrl(url);
    },
    [shownSignIn, parseTokenFromUrl]
  );

  const clearWebViewData = useCallback(async () => {
    try {
      webViewRef.current?.clearCache?.(true);
      webViewRef.current?.clearHistory?.();
      webViewRef.current?.injectJavaScript?.(`
        (function() {
          try {
            document.cookie.split(";").forEach(function(c) {
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
            });
          } catch(_) {}
        })();
        true;
      `);

      const emptyState: WebViewState = {
        url: initialUrl,
        timestamp: Date.now(),
      };
      await saveWebViewState(emptyState);
      setSavedState(emptyState);
      setModalVisible(false);
      setShownSignIn(false);
    } catch {
      // Avoid logging raw errors to prevent leaking sensitive info
    }
  }, []);

  // Load saved state on mount
  useEffect(() => {
    const loadState = async () => {
      const state = await getWebViewState(initialUrl);
      if (state) setSavedState(state);
    };
    loadState();
  }, []);

  useEffect(() => {
    clearWebViewData();
    return () => {
      cleanupWebView();
      setLoading(false);
    };
  }, [clearWebViewData, cleanupWebView]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.loadingOverlay}>
          <Loading />
        </View>
      </View>
    );
  }

  const commonWebViewProps = {
    ref: webViewRef,
    incognito: true,
    sharedCookiesEnabled: false,
    thirdPartyCookiesEnabled: false,
    source: { uri: savedState?.url || initialUrl },
    style: shownSignIn ? styles.webView : styles.hiddenWebView,
    onLoadStart: () => {
      webViewRef.current?.injectJavaScript?.(`
        (function() {
          try {
            document.cookie.split(";").forEach(function(c) {
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
            });
          } catch(_) {}
        })();
        true;
      `);
    },
    onNavigationStateChange: handleNavigationStateChange,
  } as const;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.loadingOverlay}>
        <Loading />
      </View>

      <Modal
        visible={modalVisible}
        onRequestClose={() => {
          clearWebViewData();
          cleanupWebView();
        }}
        animationType="slide"
      >
        <WebView {...commonWebViewProps} />
      </Modal>

      {!shownSignIn && <WebView {...commonWebViewProps} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingOverlay: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: "absolute",
  },
  webView: { flex: 1 },
  hiddenWebView: { display: "none" },
});

export default React.memo(LoginWebView);
