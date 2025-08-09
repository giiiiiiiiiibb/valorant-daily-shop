import React, { ReactElement, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { TouchableRipple } from "react-native-paper";
// components
import Text from "@/components/typography/text";
// context
import useThemeContext from "@/contexts/hook/use-theme-context";
// utils
import { hexToRgba } from "@/utils/color";

type ModeOption = { key: "system" | "light" | "dark"; label: string; description?: string };

const OPTIONS: ModeOption[] = [
  { key: "system", label: "Use system theme" },
  { key: "light", label: "Use light theme" },
  { key: "dark", label: "Use dark theme" },
];

const Settings = (): ReactElement => {
  const { palette, mode, setMode, isDark } = useThemeContext();

  const infoText = useMemo(() => {
    if (mode !== "system") return `App theme set to ${mode}.`;
    return `Following device theme (${isDark ? "dark" : "light"}).`;
  }, [mode, isDark]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.card}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Appearance
        </Text>

        <View style={styles.optionList}>
          {OPTIONS.map((opt) => {
            const selected = mode === opt.key;
            return (
              <TouchableRipple
                key={opt.key}
                borderless
                onPress={() => setMode(opt.key)}
                rippleColor={hexToRgba(palette.text, 0.12)}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: palette.card,
                    borderColor: selected ? palette.primary : palette.card,
                  },
                ]}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionTextWrap}>
                    <Text variant="titleMedium">{opt.label}</Text>
                    {opt.description ? (
                      <Text variant="bodySmall" style={styles.optionDescription}>
                        {opt.description}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: selected ? palette.primary : hexToRgba(palette.text, 0.3) },
                    ]}
                  >
                    {selected ? <View style={[styles.radioInner, { backgroundColor: palette.primary }]} /> : null}
                  </View>
                </View>
              </TouchableRipple>
            );
          })}
        </View>

        <Text variant="bodySmall" style={[styles.helper, { color: hexToRgba(palette.text, 0.6) }]}>
          {infoText}
        </Text>
      </View>

      <Text style={[styles.placeholder, { color: hexToRgba(palette.text, 0.6) }]} variant="bodyLarge">
        More settings coming soon.
      </Text>
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
  optionList: {
    gap: 8,
  },
  optionRow: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionContent: {
    gap: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionTextWrap: {
    flex: 1,
    gap: 4,
  },
  optionDescription: {
    opacity: 0.6,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  helper: {
    marginTop: 4,
  },
  placeholder: {
    textAlign: "center",
  },
});

export default React.memo(Settings);
