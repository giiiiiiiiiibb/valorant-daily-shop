import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
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
import user from "@/utils/users";

type Props = {
  activeTab: string;
};

const TabHeader = ({ activeTab }: Props) => {
  const { palette } = useThemeContext();
  const { balance, gameName, tagLine } = useUserContext();
  const { logoutAll, currentUser } = useAuthContext();

  const [accountsCount, setAccountsCount] = useState<number>(0);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const all = await user.getAllUsers();
          if (mounted) setAccountsCount(Object.keys(all ?? {}).length);
        } catch {
          if (mounted) setAccountsCount(0);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const hasAnyAccount = accountsCount > 0;

  const showAccountsTitle = useMemo(() => {
    return activeTab === "Accounts" && !currentUser && hasAnyAccount;
  }, [activeTab, currentUser, hasAnyAccount]);

  const computedTitle = useMemo(() => {
    if (activeTab === "Accounts") {
      return (showAccountsTitle ? "Accounts" : "").toUpperCase();
    }
    return typeof activeTab === "string" ? activeTab.toUpperCase() : "";
  }, [activeTab, showAccountsTitle]);

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
        if (!hasAnyAccount) return null;
        return (
          <Button
            onPress={logoutAll}
            icon={<SvgLogout color={palette.primary} />}
            variant="icon"
            style={styles.logoutButton}
            rippleColor={hexToRgba(palette.text, 0.12)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: palette.background }]}>
      <Text variant="displayMedium" style={styles.title}>
        {computedTitle}
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

export default React.memo(TabHeader);
