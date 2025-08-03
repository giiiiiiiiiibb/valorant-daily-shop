import { StatusBar } from "react-native";
import React, { ReactElement, useMemo } from "react";
import { IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// api
import { useGetThemeByIdQuery } from "@/api/rtk-valorant-api";
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
import Header from "@/routes/navigation/header";
import MainBottomTab from "@/routes/main-bottom-tab";
// types
import { RootStackParamList } from "@/types/router/navigation";
import { useAccounts } from "@/stores/useAccounts";

const Stack = createNativeStackNavigator<RootStackParamList>();

const Router = (): ReactElement | null => {
    const { isLoading: isLoadingTheme } = useGetThemeByIdQuery("");
    const { currentUser, isInitialized } = useAuthContext();
    const { colors } = useThemeContext();
    const navigation = useNavigation();
    const { accounts } = useAccounts();

    const initialRouteName = useMemo(() => {
        const hasLoggedIn = accounts.some(acc => acc.access_token && acc.entitlement_token && acc.puuid);
        return hasLoggedIn ? "Home" : "Accounts";
    }, [accounts]);

    if (!isInitialized || isLoadingTheme) return null;

    const optionsDetailsScreen = {
        headerShown: true,
        header: () => (
            <Header
                leftComponent={
                    <IconButton
                        size={32}
                        icon="arrow-left"
                        onPress={() => navigation.goBack()}
                        iconColor="#fff"
                    />
                }
            />
        ),
        animationTypeForReplace: "pop" as const,
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />
            <Stack.Navigator initialRouteName={initialRouteName}>
                {currentUser == null ? (
                    <>
                        <Stack.Screen name="Accounts" component={Accounts} />
                        <Stack.Screen name="LoginWebView" component={LoginWebView} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Home" component={MainBottomTab} />
                        <Stack.Screen name="LogoutWebView" component={LogoutWebView} />
                        <Stack.Screen name="LoginWebView" component={LoginWebView} />
                        <Stack.Screen name="SkinDetails" component={SkinDetails} options={optionsDetailsScreen} />
                        <Stack.Screen name="BuddyDetails" component={BuddyDetails} options={optionsDetailsScreen} />
                        <Stack.Screen name="SprayDetails" component={SprayDetails} options={optionsDetailsScreen} />
                        <Stack.Screen name="PlayerCardDetails" component={PlayerCardDetails} options={optionsDetailsScreen} />
                        <Stack.Screen name="CollectionDetails" component={CollectionDetailsScreen} options={optionsDetailsScreen} />
                        <Stack.Screen name="Plugin" component={Plugin} />
                    </>
                )}
            </Stack.Navigator>
        </>
    );
};

export default Router;
