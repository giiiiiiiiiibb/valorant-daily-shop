import React, { useCallback, useEffect, useState } from "react";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import { View } from "react-native";
// components
import UserItem from "@/components/account/user-item";
// contexts
import useAuthContext from "@/contexts/hook/use-auth-context";
import useUserContext from "@/contexts/hook/use-user-context";
// types
import { IUserData } from "@/types/context/user";
import { EAuthContextType } from "@/types/context/auth";
// utils
import userUtil from "@/utils/users";

const UserList = ({ reorderMode = false }: { reorderMode?: boolean }) => {
    const { users, setUsers, currentUser } = useUserContext();
    const { dispatch } = useAuthContext();

    const [orderedUsers, setOrderedUsers] = useState<IUserData[]>([]);

    useEffect(() => {
        const sorted = [...(users || [])];
        sorted.sort((a, b) => (a.uuid === userUtil.getDefaultUserSync() ? -1 : b.uuid === userUtil.getDefaultUserSync() ? 1 : 0));
        setOrderedUsers(sorted);
    }, [users]);

    const handleLogin = async (user: IUserData) => {
        await userUtil.setUser(user);
        dispatch({
            type: EAuthContextType.LOGIN,
            payload: { currentUser: user },
        });
    };

    const handleLogout = async (user: IUserData) => {
        await userUtil.logout(user);
        const updatedUsers = (await userUtil.getAllUsers()).filter((u) => u.uuid !== user.uuid);
        setUsers(updatedUsers);
        if (currentUser?.uuid === user.uuid) {
            dispatch({
                type: EAuthContextType.INITIAL,
                payload: { currentUser: null },
            });
        }
    };

    const handleRelogin = () => {
        dispatch({ type: EAuthContextType.INITIAL, payload: { currentUser: null } });
    };

    const handleSetDefault = async (id: string) => {
        await userUtil.setDefaultUser(id);
        const all = await userUtil.getAllUsers();
        setUsers(all);
    };

    const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<IUserData>) => (
        <View style={{ opacity: isActive ? 0.9 : 1 }}>
            <UserItem
                index={0}
                user={item}
                isDefault={item.uuid === userUtil.getDefaultUserSync()}
                handleLogin={() => handleLogin(item)}
                handleLogout={() => handleLogout(item)}
                handleRelogin={handleRelogin}
                onSetDefault={handleSetDefault}
            />
        </View>
    ), []);

    const handleDragEnd = async ({ data }: { data: IUserData[] }) => {
        setOrderedUsers(data);
        await userUtil.reorderUsers(data);
        const all = await userUtil.getAllUsers();
        setUsers(all);
    };

    return (
        <DraggableFlatList
            data={orderedUsers}
            keyExtractor={(item) => item.uuid}
            renderItem={renderItem}
            onDragEnd={handleDragEnd}
            scrollEnabled
            containerStyle={{ gap: 16 }}
            activationDistance={reorderMode ? 1 : Number.MAX_SAFE_INTEGER}
        />
    );
};

export default UserList;
