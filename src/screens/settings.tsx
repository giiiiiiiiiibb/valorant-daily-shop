import React, { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { TouchableRipple } from "react-native-paper";
// components
import Text from "@/components/typography/text";
// context
import useThemeContext from "@/contexts/hook/use-theme-context";
// utils
import { hexToRgba } from "@/utils/color";

type ModeKey = "system" | "light" | "dark";
const OPTIONS: { key: ModeKey; label: string }[] = [
  { key: "system", label: "System" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

const Settings = (): ReactElement => {
  const { palette, mode, setMode } = useThemeContext();

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.card}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Appearance
        </Text>

        <View
          style={[
            styles.segmented,
            {
              backgroundColor: palette.card,
              borderColor: hexToRgba(palette.text, 0.08),
            },
          ]}
        >
          {OPTIONS.map((opt, idx) => {
            const selected = mode === opt.key;
            const isLast = idx === OPTIONS.length - 1;

            return (
              <TouchableRipple
                key={opt.key}
                borderless
                rippleColor={hexToRgba(palette.text, 0.12)}
                onPress={() => setMode(opt.key)}
                style={[
                  styles.segment,
                  !isLast && {
                    borderRightWidth: StyleSheet.hairlineWidth,
                    borderRightColor: hexToRgba(palette.text, 0.08),
                  },
                  selected && {
                    backgroundColor: hexToRgba(palette.primary, 0.18),
                  },
                ]}
              >
                <Text
                  variant="titleMedium"
                  style={[
                    styles.segmentLabel,
                    { color: selected ? palette.text : hexToRgba(palette.text, 0.75) },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableRipple>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    padding: 16,
  },
  card: {
    gap: 12,
  },
  sectionTitle: {
    textTransform: "uppercase",
    opacity: 0.8,
    fontFamily: "Vandchrome",
  },
  segmented: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentLabel: {
    fontWeight: "600",
  },
  footerHint: {
    textAlign: "center",
  },
});

export default React.memo(Settings);
