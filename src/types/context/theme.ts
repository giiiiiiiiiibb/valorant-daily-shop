import type { Theme } from "@react-navigation/native";

export type ThemeMode = "light" | "dark" | "system";

export type ThemePalette = {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
};

export type IThemeContext = {
  mode: ThemeMode;
  isDark: boolean;
  palette: ThemePalette;
  navTheme: Theme;
  isReady: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};
