import { View } from "react-native";
import { ReactElement } from "react";
// components
import Text from "@/components/typography/text";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
// utils
import { hexToRgba } from "@/utils/color";

type Props = {
  discount: number;
};

const DiscountBadge = ({ discount }: Props): ReactElement => {
  const { palette } = useThemeContext();

  return (
    <View
      style={{
        position: "absolute",
        right: 0,
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
      }}
    >
      <View
        style={{
          position: "absolute",
          right: -1,
          width: 0,
          height: 0,
          borderStyle: "solid",
          borderTopWidth: 100,
          borderLeftWidth: 100,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          borderLeftColor: "transparent",
          borderTopColor: hexToRgba(palette.text, 0.4),
        }}
      />
      <Text variant="titleMedium" style={{ color: palette.primary, opacity: 1 }} numberOfLines={1}>
        -{discount}%
      </Text>
    </View>
  );
};

export default DiscountBadge;
