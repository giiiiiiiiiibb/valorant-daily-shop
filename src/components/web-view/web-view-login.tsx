import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview/lib/WebViewTypes";
// components
import Loading from "@/components/loading/loading";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
import useAuthContext from "@/contexts/hook/use-auth-context";
// utils
import secureStore from "@/utils/secure-store";
import { getWebViewState, saveWebViewState, WebViewState } from "@/utils/web-view-state";
// routes
import { resetToHome } from "@/routes/navigation/navigation-service";

const INITIAL_URL = "https://auth.riotgames.com/authorize?redirect_uri=http%3A%2F%2Flocalhost%2F&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid";

const LoginWebView = () => {
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
      if (!url || !url.includes("#")) return false;
      const hash = url.split("#")[1];
      if (!hash) return false;

      const params = new URLSearchParams(hash);
      const access = params.get("access_token");
      const id = params.get("id_token");
      const expires = params.get("expires_in");

      if (!access || !id) return false;

      setLoading(true);
      try {
        await secureStore.setItem("access_token", access);
        await secureStore.setItem("id_token", id);

        if (expires) {
          const expiresAt = Date.now() + parseInt(expires) * 1000;
          await secureStore.setItem("token_expiry", expiresAt.toString());
        }

        // Trigger the full login flow (user info, balances, etc.)
        await loginInteractive();

        resetToHome();
      } finally {
        setLoading(false);
      }

      return true;
    },
    [loginInteractive]
  );

  const onNavChange = useCallback(
    async (event: WebViewNavigation) => {
      const { url } = event;
      try {
        await saveWebViewState({ url, timestamp: Date.now() });
      } catch {
        // ignore
      }

      if (url.startsWith("http://localhost/")) {
        await parseTokenFromUrl(url);
      }
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
