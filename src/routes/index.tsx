import { StatusBar, View } from "react-native";
import React, { ReactElement, useMemo } from "react";
import { IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// components
import LogoutWebView from "@/components/web-view/web-view-logout";
import LoginWebView from "@/components/web-view/web-view-login";
// contexts
import useAuthContext from "@/contexts/hook/use-auth-context";
import useThemeContext from "@/contexts/hook/use-theme-context";
// screens
import Accounts from "@/screens/accounts";
import Plugin from "@/screens/plugin/plugin";
import SkinDetails from "@/screens/offer-details/skin-details";
import BuddyDetails from "@/screens/offer-details/buddy-details";
import SprayDetails from "@/screens/offer-details/spray-details";
import PlayerCardDetails from "@/screens/offer-details/player-card-details";
import CollectionDetailsScreen from "@/screens/profile/collection/collection-details-screen";
// routes
import TabHeader from "@/routes/navigation/tab-header";
import TabBar from "@/routes/navigation/tab-bar";
// types
import { RootStackParamList } from "@/types/router/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

const Router = (): ReactElement | null => {
  const { currentUser, isInitialized } = useAuthContext();
  const { palette, isDark } = useThemeContext();
  const navigation = useNavigation();

  const initialRouteName = useMemo(
    () => (currentUser ? "Home" : "Accounts"),
    [currentUser]
  );

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

  // If auth not initialized yet, render a tiny placeholder (after hooks)
  if (!isInitialized) {
    return (
      <>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={palette.background}
        />
        <View style={{ flex: 1, backgroundColor: palette.background }} />
      </>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.background}
      />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
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

        {currentUser == null ? (
          <Stack.Screen name="Accounts" component={Accounts} />
        ) : (
          <>
            <Stack.Screen name="Home" component={TabBar} />
            <Stack.Screen name="Plugin" component={Plugin} options={{ animationTypeForReplace: "pop" }} />
            <Stack.Screen name="SkinDetails" component={SkinDetails} options={optionsDetailsScreen} />
            <Stack.Screen name="PlayerCardDetails" component={PlayerCardDetails} options={optionsDetailsScreen} />
            <Stack.Screen name="BuddyDetails" component={BuddyDetails} options={optionsDetailsScreen} />
            <Stack.Screen name="SprayDetails" component={SprayDetails} options={optionsDetailsScreen} />
            <Stack.Screen name="CollectionDetails" component={CollectionDetailsScreen} options={optionsDetailsScreen} />
          </>
        )}
      </Stack.Navigator>
    </>
  );
};

export default Router;
