import { Alert, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import React, { ReactElement, useCallback } from "react";
// components
import Text from "@/components/typography/text";
import Button from "@/components/button/button";
import UserList from "@/components/account/user-list";
import Tooltip from "@/components/tooltip";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
// types
import { NavigationProp } from "@/types/router/navigation";
// utils
import user from "@/utils/users";

const Accounts = (): ReactElement => {
    const { colors } = useThemeContext();
    const navigate = useNavigation<NavigationProp>();

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
            <View style={styles.header}>
                <Text variant="displayMedium" style={styles.title}>Accounts</Text>
                <View style={styles.actions}>
                    <Tooltip text="Add a new Riot account">
                        <Button
                            icon={<Text style={styles.icon}>＋</Text>}
                            onPress={handleAddAccount}
                            style={styles.iconButton}
                            variant="icon"
                        />
                    </Tooltip>
                    <Tooltip text="Logout all accounts">
                        <Button
                            icon={<Text style={styles.icon}>⇥</Text>}
                            onPress={handleLogoutAll}
                            style={styles.iconButton}
                            variant="icon"
                        />
                    </Tooltip>
                </View>
            </View>
            <View style={styles.listContainer}>
                <UserList />
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    title: {
        fontWeight: "bold",
    },
    actions: {
        flexDirection: "row",
        gap: 12,
    },
    icon: {
        fontSize: 20,
    },
    iconButton: {
        padding: 8,
    },
    listContainer: {
        flex: 1,
    },
});

export default Accounts;
