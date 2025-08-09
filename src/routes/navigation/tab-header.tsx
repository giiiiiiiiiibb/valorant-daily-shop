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
// utils
import { hexToRgba } from "@/utils/color";

type Props = {
  activeTab: string;
};

const TabHeader = ({ activeTab }: Props) => {
  const { palette } = useThemeContext();
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
            icon={<SvgLogout color={palette.primary} />}
            variant="icon"
            style={styles.logoutButton}
            underlayColor={hexToRgba(palette.text, 0.08)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: palette.background }]}>
      <Text variant="displayMedium" style={styles.title}>
        {typeof activeTab === "string" ? activeTab.toUpperCase() : ""}
      </Text>
      <View style={styles.rightComponentWrapper}>{renderRightComponent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "Vandchrome",
    textTransform: "uppercase",
  },
  rightComponentWrapper: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
  rightGroup: {
    gap: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    opacity: 0.5,
  },
  logoutButton: {
    padding: 8,
  },
});

export default TabHeader;
