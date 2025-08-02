import { View, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// components
import CostPoint from "@/components/cost/cost-point";
import SvgPlus from "@/components/icon/plus";
import SvgLogout from "@/components/icon/logout";
import Button from "@/components/button/button";
// contexts
import useUserContext from "@/contexts/hook/use-user-context";
import { useNavigation } from "@react-navigation/native";

const Header = () => {
    const route = useRoute();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { balance } = useUserContext();
    const navigation = useNavigation();

    const getTitle = () => {
        switch (route.name) {
            case "Shops": return "Shop";
            case "Profile": return "Profile";
            case "Accounts": return "Accounts";
            case "Settings": return "Settings";
            default: return "";
        }
    };

    const renderRightContent = () => {
        if (route.name === "Accounts") {
            return (
                <View style={{ flexDirection: "row", gap: 12 }}>
                    <Button icon={<SvgPlus />} onPress={() => navigation.navigate("Login")} variant="icon" />
                    <Button icon={<SvgLogout />} onPress={() => {
                        // Navigation reset sollte in accounts.tsx ausgelagert werden
                        navigation.reset({ index: 0, routes: [{ name: "Accounts" }] });
                    }} variant="icon" />
                </View>
            );
        }

        if (["Shops", "Profile"].includes(route.name)) {
            return (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    <CostPoint currencyId="vp" cost={balance.valorantPoint ?? 0} textVariant="bodyMedium" />
                    <CostPoint currencyId="rp" cost={balance.radianitePoint ?? 0} textVariant="bodyMedium" />
                    <CostPoint currencyId="kc" cost={balance.kingdomCredit ?? 0} textVariant="bodyMedium" />
                </View>
            );
        }

        return <View />;
    };

    return (
        <View
            style={{
                height: 64 + insets.top,
                paddingTop: insets.top,
                paddingHorizontal: 16,
                backgroundColor: colors.background,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>
                {getTitle()}
            </Text>
            {renderRightContent()}
        </View>
    );
};

export default Header;
