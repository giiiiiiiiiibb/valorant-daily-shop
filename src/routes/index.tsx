import React, { ReactElement, useMemo } from "react";
import { StatusBar } from "react-native";
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
    <>
      <Stack.Screen name="Home" component={TabBar} options={{ headerShown: false }} />
      <Stack.Screen name="Plugin" component={Plugin} options={{ animationTypeForReplace: "pop", headerShown: false }} />
      <Stack.Screen name="SkinDetails" component={SkinDetails} options={optionsDetailsScreen} />
      <Stack.Screen name="PlayerCardDetails" component={PlayerCardDetails} options={optionsDetailsScreen} />
      <Stack.Screen name="BuddyDetails" component={BuddyDetails} options={optionsDetailsScreen} />
      <Stack.Screen name="SprayDetails" component={SprayDetails} options={optionsDetailsScreen} />
      <Stack.Screen name="CollectionDetails" component={CollectionDetailsScreen} options={optionsDetailsScreen} />
    </>
  );
};

const AuthStack = () => (
  <>
    <Stack.Screen name="Accounts" component={Accounts} options={{ headerShown: false }} />
  </>
);

const Router = (): ReactElement => {
  const { palette, isDark } = useThemeContext();
  const { state } = useAuthContext();

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.background}
      />

      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={state === "authenticated" ? "Home" : "Accounts"}>
        <Stack.Group screenOptions={{ presentation: "modal", animation: "slide_from_bottom" }}>
          <Stack.Screen name="Login" component={LoginWebView} />
          <Stack.Screen name="Logout" component={LogoutWebView} />
        </Stack.Group>

        {state === "authenticated" ? (
          <Stack.Group>{AppStack()}</Stack.Group>
        ) : (
          <Stack.Group>{AuthStack()}</Stack.Group>
        )}
      </Stack.Navigator>
    </>
  );
};

export default Router;
