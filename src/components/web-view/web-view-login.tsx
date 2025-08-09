import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview/lib/WebViewTypes";
import { useNavigation } from "@react-navigation/native";
// components
import Loading from "@/components/loading/loading";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
import useAuthContext from "@/contexts/hook/use-auth-context";
// utils
import secureStore from "@/utils/secure-store";
import { getWebViewState, saveWebViewState, WebViewState } from "@/utils/web-view-state";

const INITIAL_URL = "https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid";

const LoginWebView = () => {
  const navigation = useNavigation();
  const { palette } = useThemeContext();
  const { loginInteractive } = useAuthContext();

  const webRef = useRef<WebView | null>(null);
  const [savedState, setSavedState] = useState<WebViewState | null>(null);
  const [loading, setLoading] = useState(false);

  const injectCookieClear = useMemo(
    () => `
      (function() {
        try {
          document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
          });
        } catch (_) {}
      })();
      true;
    `,
    []
  );

  const parseTokenFromUrl = useCallback(
    async (url: string) => {
      // Riot puts tokens in the hash fragment of the redirect URL
      if (!url || !url.includes("#")) return false;

      const hash = url.split("#")[1];
      if (!hash) return false;

      const params = new URLSearchParams(hash);
      const access = params.get("access_token");
      const id = params.get("id_token");
      if (!access || !id) return false;

      setLoading(true);
      try {
        await secureStore.setItem("access_token", access);
        await secureStore.setItem("id_token", id);
        // Finish bootstrap (entitlements, user, balances, etc.) and flip auth state
        await loginInteractive();
        // Close this screen
        // @ts-ignore
        navigation.goBack();
      } finally {
        setLoading(false);
      }
      return true;
    },
    [loginInteractive, navigation]
  );

  const onNavChange = useCallback(
    async (event: WebViewNavigation) => {
      const { url } = event;
      // Persist last visited URL (handy if the app gets backgrounded)
      try {
        await saveWebViewState({ url, timestamp: Date.now() });
      } catch {
        // ignore
      }
      // Attempt parse; if tokens found, we will navigate away automatically
      await parseTokenFromUrl(url);
    },
    [parseTokenFromUrl]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const state = await getWebViewState(INITIAL_URL);
        if (mounted && state) setSavedState(state);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
      try {
        webRef.current?.stopLoading?.();
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <Loading />
        </View>
      )}

      <WebView
        ref={webRef}
        incognito
        thirdPartyCookiesEnabled={false}
        sharedCookiesEnabled={false}
        source={{ uri: savedState?.url || INITIAL_URL }}
        onLoadStart={() => webRef.current?.injectJavaScript?.(injectCookieClear)}
        onNavigationStateChange={onNavChange}
        style={styles.webView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  webView: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default React.memo(LoginWebView);
