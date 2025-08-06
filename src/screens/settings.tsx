import { StyleSheet, View } from "react-native";
import React, { ReactElement } from "react";
// components
import Text from "@/components/typography/text";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";

const Settings = (): ReactElement => {
    const { colors } = useThemeContext();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={styles.placeholder} variant="bodyLarge">
                No settings available yet.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    placeholder: {
        opacity: 0.5,
        textAlign: "center",
    },
});

export default React.memo(Settings);
