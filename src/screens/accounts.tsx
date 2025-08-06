import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import React, { ReactElement, useCallback } from "react";
// components
import Text from "@/components/typography/text";
import Button from "@/components/button/button";
import UserList from "@/components/account/user-list";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
// types
import { NavigationProp } from "@/types/router/navigation";

const Accounts = (): ReactElement => {

    const { colors } = useThemeContext();

    const navigate = useNavigation<NavigationProp>();

    const handleAddAccount = useCallback(() => navigate.navigate("Login"), [navigate]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.listContainer}>
                <UserList />
                <View style={styles.buttonContainer}>
                    <Button
                        icon={<Text>+</Text>}
                        text="Add Account"
                        onPress={handleAddAccount}
                        underlayColor="#222429"
                        backgroundColor={colors.primary}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContainer: {
        flex: 1,
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
