import React, { useCallback, useState } from "react";
import { FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
// contexts
import useAuthContext from "@/contexts/hook/use-auth-context";
// components
import UserItem from "@/components/account/user-item";
// types
import { IUsersData } from "@/types/context/user";
import { NavigationProp } from "@/types/router/navigation";
// utils
import user from "@/utils/users";
import secureStore from "@/utils/secure-store";

const UserList = () => {
  const [users, setUsers] = useState<IUsersData>({});
  const { selectAccount } = useAuthContext();
  const navigation = useNavigation<NavigationProp>();

  const handleLogout = useCallback(
    (username: string) => navigation.navigate("Logout", { username }),
    [navigation]
  );

  /**
   * Silent re-auth path:
   * - Set current user
   * - Ask auth provider to select account and re-bootstrap quietly
   * - Do NOT open login modal here; leave it to the +Add Account button only.
   */
  const handleSelect = useCallback(
    async (username: string) => {
      await AsyncStorage.setItem("current_user", username);
      await selectAccount(username, { interactive: false }); // provider should re-auth or surface a toast on failure
    },
    [selectAccount]
  );

  const handleRelogin = useCallback(() => navigation.navigate("Login"), [navigation]);

  useFocusEffect(
    useCallback(() => {
      setUsers({});
      user.getAllUsers().then((data) => setUsers(data));
      // Clear transient tokens to avoid cross-account leakage
      secureStore.removeItem("access_token").catch(() => {});
      secureStore.removeItem("id_token").catch(() => {});
    }, [])
  );

  return (
    <FlatList
      data={Object.keys(users)}
      style={{ flex: 2, padding: 16, gap: 16, marginBottom: 16 }}
      contentContainerStyle={{ gap: 16, paddingBottom: 16 }}
      showsVerticalScrollIndicator={false}
      keyExtractor={(k) => k}
      renderItem={({ item, index }) => (
        <UserItem
          key={item}
          user={users[item]}
          index={index}
          handleLogin={() => handleSelect(item)}
          handleLogout={() => handleLogout(item)}
          handleRelogin={handleRelogin}
        />
      )}
    />
  );
};

export default React.memo(UserList);
