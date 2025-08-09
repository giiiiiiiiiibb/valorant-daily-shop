import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview/lib/WebViewTypes";
// components
import Loading from "@/components/loading/loading";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
import useAuthContext from "@/contexts/hook/use-auth-context";
// types
import { LogoutScreenProps } from "@/types/router/navigation";

const LOGOUT_URL = "https://auth.riotgames.com/logout";

/**
 * Logs out from Riot's web session (optional) and removes the selected local account.
 * Dismisses itself once done so it works from either auth or app flows.
 */
const LogoutWebView = ({ route, navigation }: LogoutScreenProps) => {
  const { username } = route.params;
  const { palette } = useThemeContext();
  const { logoutUser } = useAuthContext();

  const onNavChange = useCallback(
    async (event: WebViewNavigation) => {
      if (!event?.url) return;
      if (event.url.startsWith(LOGOUT_URL)) {
        try {
          await logoutUser(username);
        } finally {
          navigation.goBack();
        }
      }
    },
    [logoutUser, navigation, username]
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.loadingOverlay}>
        <Loading />
      </View>
      <WebView
        incognito
        sharedCookiesEnabled={false}
        thirdPartyCookiesEnabled={false}
        source={{ uri: LOGOUT_URL }}
        onNavigationStateChange={onNavChange}
        style={styles.hidden}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject },
  hidden: { width: 0, height: 0, opacity: 0 },
});

export default React.memo(LogoutWebView);
