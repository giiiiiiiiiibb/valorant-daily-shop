import React from "react";
import { Skeleton } from "moti/skeleton";
import { DimensionValue } from "react-native";
// hooks
import useThemeContext from "@/contexts/hook/use-theme-context";

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number | "square" | "round";
};

/**
 * Themed skeleton that adapts to current theme mode.
 * Retains file/component name for import stability.
 */
const DarkSkeleton = React.memo(({ width = 32, height = 32, radius = 0 }: SkeletonProps) => {
  const { isDark } = useThemeContext();
  return <Skeleton colorMode={isDark ? "dark" : "light"} width={width} height={height} radius={radius} />;
});

export default DarkSkeleton;
