import React from "react";
import { TouchableRipple } from "react-native-paper";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
// components
import Text from "@/components/typography/text";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
// utils
import { hexToRgba } from "@/utils/color";

type ButtonProps = {
  text?: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  onPress?: VoidFunction;
  disabled?: boolean;
  textStyle?: StyleProp<TextStyle>;
  rippleColor?: string;
  onLongPress?: VoidFunction;
  /**
   * Deprecated (TouchableRipple ignores this). Kept for backwards compatibility.
   * Prefer adjusting `rippleColor` instead.
   */
  underlayColor?: string;
  backgroundColor?: string;
};

const Button: React.FC<ButtonProps> = ({
  text,
  icon,
  style,
  loading = false,
  onPress,
  disabled = false,
  textStyle,
  rippleColor,
  onLongPress,
  underlayColor, // eslint-disable-line @typescript-eslint/no-unused-vars
  backgroundColor,
}) => {
  const { palette } = useThemeContext();

  const resolvedRipple = rippleColor ?? hexToRgba(palette.text, 0.12);
  const resolvedBg = backgroundColor ?? palette.card;

  return (
    <TouchableRipple
      key={typeof text === "string" ? text : undefined}
      style={[styles.button, { backgroundColor: resolvedBg, opacity: disabled ? 0.5 : 1 }, style]}
      borderless
      onPress={onPress}
      disabled={disabled}
      rippleColor={resolvedRipple}
      onLongPress={onLongPress}
    >
      <View style={styles.content}>
        {icon}
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : (
          text !== undefined && (
            <Text style={[styles.text, textStyle]} allowFontScaling>
              {text}
            </Text>
          )
        )}
      </View>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    padding: 16,
    maxHeight: 56,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default Button;
