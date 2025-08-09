import React, { ReactElement, useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { Provider as ReduxProvider } from "react-redux";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import "react-native-reanimated";
// controllers
import { store } from "@/controllers/store";
// providers
import ThemeProvider from "@/contexts/theme/theme-provider";
import AuthProvider from "@/contexts/auth/auth-provider";
import UserProvider from "@/contexts/user/user-provider";
import DailyShopProvider from "@/contexts/daily-shop/daily-shop-provider";
import BundleProvider from "@/contexts/bundle/bundle-provider";
import AccessoryStoreProvider from "@/contexts/accessory-store/accessory-store-provider";
import NightMarketProvider from "@/contexts/night-market/night-market-provider";
import PluginProvider from "@/contexts/plugin/plugin-provider";
import ProfileProvider from "@/contexts/profile/profile-provider";
// hooks
import useAuthContext from "@/contexts/hook/use-auth-context";
import useThemeContext from "@/contexts/hook/use-theme-context";
// routes
import Router from "@/routes/index";

/**
 * Keep the splash visible while we bootstrap to avoid a first-frame flash.
 * Any errors are swallowed to avoid noisy logs.
 */
void SplashScreen.preventAutoHideAsync().catch(() => {});

/** Centralized font map */
const APP_FONTS = {
  DrukWide: require("./assets/fonts/Druk-Wide-Bold.ttf"),
  Vandchrome: require("./assets/fonts/vanchrome-regular.otf"),
  Nota: require("./assets/fonts/nota-bold.ttf"),
} as const;

/** Lightweight error boundary to prevent full app crashes */
class SafeErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    // Deliberately do not log raw error or stack (could contain sensitive data).
  }
  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: "#1B1D21", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
            Something went wrong. Please restart the app.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

/** Combine all providers for clarity */
function AppProviders({ children }: { children: React.ReactNode }): ReactElement {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <UserProvider>
            <DailyShopProvider>
              <BundleProvider>
                <AccessoryStoreProvider>
                  <NightMarketProvider>
                    <PluginProvider>
                      <ProfileProvider>{children}</ProfileProvider>
                    </PluginProvider>
                  </NightMarketProvider>
                </AccessoryStoreProvider>
              </BundleProvider>
            </DailyShopProvider>
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}

/** Root needs ThemeContext so NavigationContainer can be themed */
function ThemedRoot({
  fontsReady,
  fontError,
}: {
  fontsReady: boolean;
  fontError: boolean;
}): ReactElement {
  const { navTheme, palette, isReady: themeReady } = useThemeContext();

  const FontFallback = useMemo(
    () => (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text style={{ color: palette.text, fontSize: 16, textAlign: "center" }}>Loading basic UI…</Text>
      </View>
    ),
    [palette.background, palette.text]
  );

  return (
    <NavigationContainer theme={navTheme}>
      {fontError ? <>{FontFallback}</> : <AppContent fontsReady={fontsReady} themeReady={themeReady} />}
    </NavigationContainer>
  );
}

/** Controls hiding the splash once fonts + theme + auth are ready */
function AppContent({
  fontsReady,
  themeReady,
}: {
  fontsReady: boolean;
  themeReady: boolean;
}): ReactElement {
  const { state: authState } = useAuthContext();

  useEffect(() => {
    if (fontsReady && themeReady && authState !== "initializing") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady, themeReady, authState]);

  // Safety net: never keep users stuck behind splash if a signal fails to flip
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return <Router />;
}

export default function App(): ReactElement {
  const [fontsLoaded, fontError] = useFonts(APP_FONTS);

  return (
    <SafeErrorBoundary>
      <AppProviders>
        <ThemedRoot fontsReady={!!fontsLoaded} fontError={!!fontError} />
      </AppProviders>
    </SafeErrorBoundary>
  );
}
