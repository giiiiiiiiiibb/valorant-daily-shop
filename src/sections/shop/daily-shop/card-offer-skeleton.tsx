import React from "react";
import { Skeleton } from "moti/skeleton";
import { MotiView } from "moti";
import { Dimensions, StyleSheet, View } from "react-native";
// hooks
import useThemeContext from "@/contexts/hook/use-theme-context";

const { width } = Dimensions.get("window");

const CardOfferSkeleton = () => {
  const { isDark, palette } = useThemeContext();

  return (
    <MotiView
      from={{
        opacity: 0.5,
        transform: [{ scale: 0.95 }],
        width: width / 2 - 24,
      }}
      animate={{
        opacity: 1,
        transform: [{ scale: 1 }],
      }}
      // @ts-ignore - Moti typing
      transition={{ type: "timing" }}
      style={[styles.card, { backgroundColor: palette.card }]}
    >
      <View style={styles.container}>
        <Skeleton colorMode={isDark ? "dark" : "light"} width="100%" />
        <View style={styles.row}>
          <Skeleton colorMode={isDark ? "dark" : "light"} radius="round" width={24} height={24} />
          <Skeleton colorMode={isDark ? "dark" : "light"} width={width / 2 - 120} height={24} />
        </View>
        <View style={styles.flexEnd}>
          <Skeleton colorMode={isDark ? "dark" : "light"} width="100%" />
        </View>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 8,
  },
  container: {
    gap: 16,
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  flexEnd: {
    flex: 1,
    justifyContent: "flex-end",
  },
});

export default React.memo(CardOfferSkeleton);
