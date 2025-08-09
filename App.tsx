import React, { ReactElement, useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import { DefaultTheme, NavigationContainer, Theme } from "@react-navigation/native";
import { Provider as ReduxProvider } from "react-redux";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import "react-native-reanimated";
// controllers
import { store } from "@/controllers/store";
// contexts (providers)
import ThemeProvider from "@/contexts/theme/theme-provider";
import AuthProvider from "@/contexts/auth/auth-provider";
import UserProvider from "@/contexts/user/user-provider";
import DailyShopProvider from "@/contexts/daily-shop/daily-shop-provider";
import BundleProvider from "@/contexts/bundle/bundle-provider";
import AccessoryStoreProvider from "@/contexts/accessory-store/accessory-store-provider";
import NightMarketProvider from "@/contexts/night-market/night-market-provider";
import PluginProvider from "@/contexts/plugin/plugin-provider";
import ProfileProvider from "@/contexts/profile/profile-provider";
// contexts (hooks)
import useAuthContext from "@/contexts/hook/use-auth-context";
// routes
import Router from "@/routes/index";

/**
 * Keep the splash screen visible while we bootstrap.
 * We intentionally call this at module scope to avoid a flashing splash on first frame.
 * If this throws, we swallow the error to avoid noisy logs with sensitive payloads.
 */
void SplashScreen.preventAutoHideAsync().catch(() => {});

/** Centralized font map (extensible) */
const APP_FONTS = {
  DrukWide: require("./assets/fonts/Druk-Wide-Bold.ttf"),
  Vandchrome: require("./assets/fonts/vanchrome-regular.otf"),
  Nota: require("./assets/fonts/nota-bold.ttf"),
} as const;

/** App theme (extendable without scattering defaults) */
const APP_THEME: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#1B1D21",
  },
};

/**
 * Lightweight render error boundary to prevent full app crashes.
 * Avoids dumping raw error objects to logs/UIs to reduce risk of leaking sensitive data.
 */
class SafeErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  componentDidCatch(): void {
    // Deliberately do not log the raw error or stack (could contain tokens/PII).
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

/** Combine all providers to reduce deep JSX nesting and make order explicit. */
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

/**
 * Separate component that can access AuthContext (since it's rendered within providers).
 * Controls when to hide the splash screen based on readiness signals.
 */
function AppContent({ fontsReady }: { fontsReady: boolean }): ReactElement {
  const { isInitialized } = useAuthContext();

  // Hide the splash screen once critical bootstrapping is complete.
  useEffect(() => {
    if (fontsReady && isInitialized) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady, isInitialized]);

  // Safety net: never keep users stuck behind splash if a signal fails to flip.
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 5000); // 5s hard cap
    return () => clearTimeout(timer);
  }, []);

  // We render the app immediately; inner screens can manage their own skeletons.
  return <Router />;
}

export default function App(): ReactElement {
  const [fontsLoaded, fontError] = useFonts(APP_FONTS);

  // Memoize a minimal, non-sensitive fallback in case font loading fails.
  const FontFallback = useMemo(
    () => (
      <View style={{ flex: 1, backgroundColor: "#1B1D21", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
          Loading basic UI…
        </Text>
      </View>
    ),
    []
  );

  // We always mount navigation + providers; font readiness only affects splash and typography.
  // If fonts fail to load, we still run the app (with default system fonts).
  return (
    <NavigationContainer theme={APP_THEME}>
      <SafeErrorBoundary>
        <AppProviders>
          {fontError ? FontFallback : <AppContent fontsReady={!!fontsLoaded} />}
        </AppProviders>
      </SafeErrorBoundary>
    </NavigationContainer>
  );
}
