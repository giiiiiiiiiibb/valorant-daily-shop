import React from "react";
import { TouchableRipple } from "react-native-paper";
import { Image, StyleSheet, View } from "react-native";
// components
import SvgLock from "@/components/icon/lock";
import SvgCheck from "@/components/icon/check";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
// utils
import { hexToRgba } from "@/utils/color";

type Props = {
  index: number;
  owned: boolean;
  agentIndex: number;
  displayIcon: string;
  onPress: () => void;
};

const AgentCard = ({ index, owned, agentIndex, displayIcon, onPress }: Props) => {
  const { palette } = useThemeContext();

  return (
    <TouchableRipple
      borderless
      key={index}
      onPress={onPress}
      style={[
        styles.touchable,
        {
          backgroundColor: palette.card,
          borderColor: agentIndex === index ? palette.primary : palette.card,
        },
      ]}
      rippleColor={hexToRgba(palette.primary, 0.2)}
    >
      <>
        {owned ? (
          <View style={[styles.overlayBase, { backgroundColor: hexToRgba(palette.text, 0.2) }]}>
            <SvgCheck color={palette.text} width={32} height={32} />
          </View>
        ) : (
          <View style={[styles.overlayBase, { backgroundColor: hexToRgba(palette.text, 0.5), alignItems: "center" }]}>
            <SvgLock color={palette.text} width={32} height={32} />
          </View>
        )}
        <Image source={{ uri: displayIcon }} style={styles.agentImage} />
      </>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  touchable: {
    gap: 4,
    borderWidth: 2,
    borderRadius: 8,
    position: "relative",
  },
  overlayBase: {
    zIndex: 10,
    position: "absolute",
    justifyContent: "flex-end",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
  },
  agentImage: {
    width: 96,
    height: 96,
  },
});

export default React.memo(AgentCard);
