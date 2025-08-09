import React, { ReactElement, useMemo } from "react";
import { StatusBar, View } from "react-native";
import { IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// screens (auth flow)
import Accounts from "@/screens/accounts";
import LoginWebView from "@/components/web-view/web-view-login";
import LogoutWebView from "@/components/web-view/web-view-logout";
// screens (app flow)
import Plugin from "@/screens/plugin/plugin";
import SkinDetails from "@/screens/offer-details/skin-details";
import BuddyDetails from "@/screens/offer-details/buddy-details";
import SprayDetails from "@/screens/offer-details/spray-details";
import PlayerCardDetails from "@/screens/offer-details/player-card-details";
import CollectionDetailsScreen from "@/screens/profile/collection/collection-details-screen";
// routes
import TabBar from "@/routes/navigation/tab-bar";
import TabHeader from "@/routes/navigation/tab-header";
// contexts
import useAuthContext from "@/contexts/hook/use-auth-context";
import useThemeContext from "@/contexts/hook/use-theme-context";
// types
import { RootStackParamList } from "@/types/router/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Accounts" component={Accounts} />
    <Stack.Screen
      name="Login"
      component={LoginWebView}
      options={{ presentation: "modal", animation: "slide_from_bottom" }}
    />
    <Stack.Screen
      name="Logout"
      component={LogoutWebView}
      options={{ presentation: "modal", animation: "slide_from_bottom" }}
    />
  </Stack.Navigator>
);

const AppStack = () => {
  const navigation = useNavigation();
  const { palette } = useThemeContext();

  const optionsDetailsScreen = useMemo(
    () => ({
      headerShown: true,
      header: () => (
        <TabHeader
          leftComponent={
            <IconButton
              size={32}
              icon="arrow-left"
              onPress={() => navigation.goBack()}
              iconColor={palette.text}
            />
          }
        />
      ),
      animationTypeForReplace: "pop" as const,
    }),
    [navigation, palette.text]
  );

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={TabBar} />
      <Stack.Screen
        name="Plugin"
        component={Plugin}
        options={{ animationTypeForReplace: "pop" }}
      />
      <Stack.Screen name="SkinDetails" component={SkinDetails} options={optionsDetailsScreen} />
      <Stack.Screen name="PlayerCardDetails" component={PlayerCardDetails} options={optionsDetailsScreen} />
      <Stack.Screen name="BuddyDetails" component={BuddyDetails} options={optionsDetailsScreen} />
      <Stack.Screen name="SprayDetails" component={SprayDetails} options={optionsDetailsScreen} />
      <Stack.Screen name="CollectionDetails" component={CollectionDetailsScreen} options={optionsDetailsScreen} />
    </Stack.Navigator>
  );
};

const Router = (): ReactElement => {
  const { palette, isDark } = useThemeContext();
  const { state } = useAuthContext();

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.background}
      />
      {state === "initializing" ? (
        <View style={{ flex: 1, backgroundColor: palette.background }} />
      ) : state === "authenticated" ? (
        <AppStack />
      ) : (
        <AuthStack />
      )}
    </>
  );
};

export default Router;
