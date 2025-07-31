import React, { useCallback, useState, useEffect } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
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

type Props = {
    reorderMode: boolean;
};

const UserList = ({ reorderMode }: Props) => {
    const [users, setUsers] = useState<IUsersData>({});
    const [order, setOrder] = useState<string[]>([]);
    const [defaultUser, setDefaultUser] = useState<string | null>(null);

    const { login } = useAuthContext();
    const navigate = useNavigation<NavigationProp>();

    const loadUsers = useCallback(async () => {
        const raw = await secureStore.getItem("users");
        const userOrder = await user.getUserOrder();
        const defaultU = await user.getDefaultUser();

        if (raw) {
            const parsed: IUsersData = JSON.parse(raw);
            setUsers(parsed);

            const sorted = userOrder.filter(id => parsed[id]);
            const fallback = Object.keys(parsed).filter(id => !userOrder.includes(id));
            setOrder([...sorted, ...fallback]);
        }

        setDefaultUser(defaultU);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadUsers();
        }, [loadUsers])
    );

    const handleLogout = useCallback(
        (username: string) => navigate.navigate("Logout", { username }),
        [navigate]
    );

    const handleLogin = useCallback(
        async (username: string) => {
            await AsyncStorage.setItem("current_user", username);

            const access_token = await user.getUserInfo("access_token");
            const id_token = await user.getUserInfo("id_token");

            if (typeof access_token !== "string" || typeof id_token !== "string") {
                return;
            }

            await secureStore.setItem("access_token", access_token);
            await secureStore.setItem("id_token", id_token);
            await login();
        },
        [login]
    );

    const handleRelogin = () => {
        loadUsers();
    };

    const handleSetDefault = async (username: string) => {
        await user.setDefaultUser(username);
        setDefaultUser(username);
    };

    const renderItem = ({ item, drag, isActive, index }: RenderItemParams<string>) => {
        const u = users[item];
        if (!u) return null;

        return (
            <UserItem
                index={index}
                user={u}
                handleLogin={() => handleLogin(item)}
                handleLogout={() => handleLogout(item)}
                handleRelogin={handleRelogin}
                isDefault={defaultUser === item}
                onSetDefault={() => handleSetDefault(item)}
                showDragHandle={reorderMode}
                drag={reorderMode ? drag : undefined}
            />
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <DraggableFlatList
                data={order}
                keyExtractor={(item) => item}
                onDragEnd={({ data }) => {
                    setOrder(data);
                    user.setUserOrder(data);
                }}
                renderItem={renderItem}
                scrollEnabled
                activationDistance={8}
                containerStyle={{ paddingBottom: 32 }}
            />
        </View>
    );
};

export default UserList;
