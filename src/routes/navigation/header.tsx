import { View } from "react-native";
import React, { ReactElement } from "react";
// components
import CostPoint from "@/components/cost/cost-point";
import Button from "@/components/button/button";
import Text from "@/components/typography/text";
// contexts
import useUserContext from "@/contexts/hook/use-user-context";
import useThemeContext from "@/contexts/hook/use-theme-context";
import useAuthContext from "@/contexts/hook/use-auth-context";
import { EAuthContextType } from "@/types/context/auth";
// navigation
import { useRoute } from "@react-navigation/native";

type HeaderProps = {
    leftComponent?: ReactElement;
    rightComponent?: ReactElement;
};

const Header = ({ leftComponent, rightComponent }: HeaderProps): ReactElement => {

    const { balance } = useUserContext();
    const { dispatch } = useAuthContext();
    const { colors } = useThemeContext();

    const route = useRoute();
    const currentTab = route.name.toLowerCase();

    const showCurrencies = currentTab === "shops" || currentTab === "profile";
    const showLogoutAll = currentTab === "accounts";

    const handleLogoutAll = () => {
        dispatch({
            type: EAuthContextType.INITIAL,
            payload: { currentUser: null },
        });
    };

    return (
        <View
            style={{
                height: 64,
                alignItems: "center",
                flexDirection: "row",
                paddingHorizontal: 16,
                justifyContent: "space-between",
                backgroundColor: colors.background,
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                {leftComponent ? (
                    leftComponent
                ) : (
                    <>
                        <Text variant="headlineSmall" style={{ color: colors.text }}>
                            {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
                        </Text>
                        {showLogoutAll && (
                            <Button
                                text="Logout All"
                                variant="secondary"
                                onPress={handleLogoutAll}
                                compact
                            />
                        )}
                    </>
                )}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                {rightComponent
                    ? rightComponent
                    : showCurrencies && (
                        <>
                            <CostPoint currencyId="vp" cost={balance.valorantPoint ?? 0} textVariant="bodyMedium" />
                            <CostPoint currencyId="rp" cost={balance.radianitePoint ?? 0} textVariant="bodyMedium" />
                            <CostPoint currencyId="kc" cost={balance.kingdomCredit ?? 0} textVariant="bodyMedium" />
                        </>
                    )}
            </View>
        </View>
    );
};

export default Header;
