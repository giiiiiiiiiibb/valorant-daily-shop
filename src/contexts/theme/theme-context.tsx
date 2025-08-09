import { createContext } from "react";
import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";
import type { IThemeContext, ThemeMode, ThemePalette } from "@/types/context/theme";

export const THEME_STORAGE_KEY = "@app/themeMode";

export const DARK_PALETTE: ThemePalette = {
  primary: "#DC3D4B",
  background: "#1B1D21",
  card: "#222429",
  text: "#FFFFFF",
  border: "#222429",
  notification: "rgb(255, 69, 58)",
};

export const LIGHT_PALETTE: ThemePalette = {
  primary: "#DC3D4B",
  background: "#FFFFFF",
  card: "#F2F3F5",
  text: "#121212",
  border: "#E6E8EB",
  notification: "rgb(255, 69, 58)",
};

export const makeNavTheme = (palette: ThemePalette, isDark: boolean): Theme => {
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: isDark,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.card,
      text: palette.text,
      border: palette.border,
      notification: palette.notification,
    },
  };
};

// Safe defaults until provider initializes
export const initialThemeState: IThemeContext = {
  mode: "system" as ThemeMode,
  isDark: true,
  palette: DARK_PALETTE,
  navTheme: makeNavTheme(DARK_PALETTE, true),
  isReady: false,
  setMode: () => {},
  toggle: () => {},
};

export const ThemeContext = createContext<IThemeContext>(initialThemeState);
