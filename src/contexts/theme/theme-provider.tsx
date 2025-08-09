import React, { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { Appearance, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ThemeContext,
  initialThemeState,
  THEME_STORAGE_KEY,
  DARK_PALETTE,
  LIGHT_PALETTE,
  makeNavTheme,
} from "@/contexts/theme/theme-context";
import type { ThemeMode } from "@/types/context/theme";

type Props = { children: ReactElement };

const ThemeProvider = ({ children }: Props) => {
  const system = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setMode] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (mounted && (raw === "light" || raw === "dark" || raw === "system")) {
          setMode(raw);
        }
      } catch {
        // Silent fallback
      } finally {
        if (mounted) setReady(true);
      }
    })();

    const sub = Appearance.addChangeListener(() => {
      // No explicit state change; useColorScheme() triggers re-render.
    });
    return () => sub.remove();
  }, []);

  const isDark = useMemo(() => {
    if (mode === "dark") return true;
    if (mode === "light") return false;
    return system === "dark";
  }, [mode, system]);

  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const navTheme = useMemo(() => makeNavTheme(palette, isDark), [palette, isDark]);

  const persist = useCallback(async (next: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Silent fail
    }
  }, []);

  const setThemeMode = useCallback((next: ThemeMode) => {
    setMode(next);
    void persist(next);
  }, [persist]);

  const toggle = useCallback(() => {
    setThemeMode(isDark ? "light" : "dark");
  }, [isDark, setThemeMode]);

  const value = useMemo(
    () => ({
      mode,
      isDark,
      palette,
      navTheme,
      isReady: ready,
      setMode: setThemeMode,
      toggle,
    }),
    [mode, isDark, palette, navTheme, ready, setThemeMode, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
