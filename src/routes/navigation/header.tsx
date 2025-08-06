import React from "react";
import { View, StyleSheet } from "react-native";
// components
import Text from "@/components/typography/text";
import CostPoint from "@/components/cost/cost-point";
import SvgLogout from "@/components/icon/logout";
import Button from "@/components/button/button";
// contexts
import useUserContext from "@/contexts/hook/use-user-context";
import useAuthContext from "@/contexts/hook/use-auth-context";
import useThemeContext from "@/contexts/hook/use-theme-context";

type Props = {
  activeTab: string;
};

const Header = ({ activeTab }: Props) => {
  const { colors } = useThemeContext();
  const { balance, gameName, tagLine } = useUserContext();
  const { logoutAll } = useAuthContext();

  const renderRightComponent = () => {
    switch (activeTab) {
      case "Shops":
        return (
          <View style={styles.rightGroup}>
            <CostPoint currencyId="vp" cost={balance.valorantPoint ?? 0} textVariant="bodyMedium" />
            <CostPoint currencyId="rp" cost={balance.radianitePoint ?? 0} textVariant="bodyMedium" />
            <CostPoint currencyId="kc" cost={balance.kingdomCredit ?? 0} textVariant="bodyMedium" />
          </View>
        );
      case "Profile":
        return (
          <Text variant="titleSmall" style={styles.userInfo}>
            {gameName}#{tagLine}
          </Text>
        );
      case "Accounts":
        return (
          <Button
            onPress={logoutAll}
            icon={<SvgLogout color={colors.primary} />}
            variant="icon"
            style={{ padding: 8 }}
            underlayColor="#222429"
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <Text variant="displayMedium" style={styles.title}>
        {activeTab.toUpperCase()}
      </Text>
      {renderRightComponent()}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: "Vandchrome",
    textTransform: "uppercase",
  },
  rightGroup: {
    gap: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    opacity: 0.5,
  },
});

export default Header;
