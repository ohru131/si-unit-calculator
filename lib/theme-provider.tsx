import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Appearance, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

export type ThemePreference = "system" | "light" | "dark";

const THEME_PREFERENCE_KEY = "si-unit-calculator.theme-preference.v1";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme: ColorScheme = useSystemColorScheme() === "dark" ? "dark" : "light";
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const colorScheme: ColorScheme = themePreference === "system" ? systemScheme : themePreference;

  useEffect(() => {
    AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then((stored) => {
        if (stored === "system" || stored === "light" || stored === "dark") setThemePreferenceState(stored);
      })
      .catch(() => undefined);
  }, []);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    void AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
  }, []);

  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
    }
  }, []);

  // 明暗切替のたびに配色が瞬時に切り替わるのを和らげるため、短いフェードを挟む。
  const themeFade = useSharedValue(1);
  const themeFadeStyle = useAnimatedStyle(() => ({ opacity: themeFade.value }));
  const isFirstSchemeRender = useRef(true);

  useEffect(() => {
    applyScheme(colorScheme);
    if (isFirstSchemeRender.current) {
      isFirstSchemeRender.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    themeFade.value = withSequence(withTiming(0.4, { duration: 90 }), withTiming(1, { duration: 220 }));
  }, [applyScheme, colorScheme, themeFade]);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": SchemeColors[colorScheme].primary,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface": SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted": SchemeColors[colorScheme].muted,
        "color-border": SchemeColors[colorScheme].border,
        "color-success": SchemeColors[colorScheme].success,
        "color-warning": SchemeColors[colorScheme].warning,
        "color-error": SchemeColors[colorScheme].error,
      }),
    [colorScheme],
  );

  const value = useMemo(
    () => ({
      colorScheme,
      themePreference,
      setThemePreference,
    }),
    [colorScheme, themePreference, setThemePreference],
  );
  return (
    <ThemeContext.Provider value={value}>
      <Animated.View style={[{ flex: 1 }, themeVariables, themeFadeStyle]}>{children}</Animated.View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
