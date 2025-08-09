import React from "react";
import { MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import { StyleSheet, View } from "react-native";
// hooks
import useThemeContext from "@/contexts/hook/use-theme-context";

const NightMarketCardSkeleton = () => {
  const { isDark, palette } = useThemeContext();
  return (
    <MotiView
      // @ts-ignore - Moti typing
      transition={{ type: "timing" }}
      animate={[styles.motiView, { backgroundColor: palette.card }]}
    >
      <View style={styles.container}>
        <Skeleton colorMode={isDark ? "dark" : "light"} width={200} />
        <Skeleton colorMode={isDark ? "dark" : "light"} width={100} height={24} />
        <View style={styles.bottomRow}>
          <View style={styles.leftColumn}>
            <Skeleton colorMode={isDark ? "dark" : "light"} width={50} height={24} />
            <View style={styles.smallRow}>
              <Skeleton colorMode={isDark ? "dark" : "light"} radius="round" width={24} height={24} />
              <Skeleton colorMode={isDark ? "dark" : "light"} width={100} height={24} />
            </View>
          </View>
          <Skeleton colorMode={isDark ? "dark" : "light"} radius="round" width={32} height={32} />
        </View>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  motiView: {
    borderRadius: 16,
    padding: 8,
    width: "100%",
  },
  container: {
    gap: 16,
    flex: 1,
    height: 225,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flex: 1,
  },
  leftColumn: {
    gap: 8,
  },
  smallRow: {
    flexDirection: "row",
    gap: 8,
  },
});

export default React.memo(NightMarketCardSkeleton);
