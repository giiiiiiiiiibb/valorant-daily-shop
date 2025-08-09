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

  const handleSelect = useCallback(
    async (username: string) => {
      // Persist selection for downstream providers (UserProvider uses it)
      await AsyncStorage.setItem("current_user", username);

      // Attempt silent reuse; if tokens are missing/invalid, we'll open Login
      const result = await selectAccount(username);
      if (result.needsInteractive) {
        navigation.navigate("Login");
      }
    },
    [navigation, selectAccount]
  );

  const handleRelogin = useCallback(() => navigation.navigate("Login"), [navigation]);

  useFocusEffect(
    useCallback(() => {
      setUsers({});
      user.getAllUsers().then((data) => setUsers(data));
      // proactively clear transient secure tokens so reuse relies on per-user storage
      // (keeps flows deterministic between accounts)
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
