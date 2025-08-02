import { Alert, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import React, { ReactElement, useCallback, useState } from "react";
// components
import Button from "@/components/button/button";
import UserList from "@/components/account/user-list";
import SvgReorder from "@/components/icon/reorder";
import SvgPlus from "@/components/icon/plus";
import SvgLogout from "@/components/icon/logout";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
// types
import { NavigationProp } from "@/types/router/navigation";
// utils
import user from "@/utils/users";

const Accounts = (): ReactElement => {
    const { colors } = useThemeContext();
    const navigate = useNavigation<NavigationProp>();
    const [reorderMode, setReorderMode] = useState(false);

    const handleAddAccount = useCallback(() => {
        navigate.navigate("Login");
    }, [navigate]);

    const handleLogoutAll = useCallback(() => {
        Alert.alert(
            "Logout All Accounts",
            "Are you sure you want to log out of all Riot accounts?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout All",
                    style: "destructive",
                    onPress: async () => {
                        await user.logoutAll();
                        navigate.reset({
                            index: 0,
                            routes: [{ name: "Accounts" }],
                        });
                    },
                },
            ]
        );
    }, [navigate]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.listContainer}>
                <UserList reorderMode={reorderMode} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    listContainer: {
        flex: 1,
    },
});

export default Accounts;
