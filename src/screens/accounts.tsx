import React, { ReactElement, useMemo } from "react";
import { StyleSheet, View } from "react-native";
// components
import Button from "@/components/button/button";
import Text from "@/components/typography/text";
import UserList from "@/components/account/user-list";
// theme
import useThemeContext from "@/contexts/hook/use-theme-context";
// navigation
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@/types/router/navigation";
// utils
import { hexToRgba } from "@/utils/color";
import userStore from "@/utils/users";
import useAuthContext from "@/contexts/hook/use-auth-context";

const Accounts = (): ReactElement => {
  const { palette } = useThemeContext();
  const navigation = useNavigation<NavigationProp>();
  const { state } = useAuthContext();

  const hasAnyUser = useMemo(() => userStore.peekHasUsersSync(), []);

  const showTitle = state !== "authenticated" && hasAnyUser;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {showTitle && (
        <View style={styles.header}>
          <Text variant="displaySmall" style={[styles.title]}>
            ACCOUNTS
          </Text>
        </View>
      )}
      <View style={styles.listContainer}>
        <UserList />
        <View style={styles.buttonContainer}>
          <Button
            text="+ Add Account"
            onPress={() => navigation.navigate("Login")}
            underlayColor={hexToRgba(palette.text, 0.08)}
            backgroundColor={palette.primary}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContainer: { flex: 1 },
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
  buttonContainer: {
    gap: 16,
    flex: 1,
    width: "100%",
    padding: 16,
    maxHeight: 88,
    alignItems: "center",
    borderRadius: 32,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default React.memo(Accounts);
