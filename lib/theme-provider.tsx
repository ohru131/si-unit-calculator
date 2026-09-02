import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Appearance } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

export type ThemePreference = "system" | "light" | "dark";

const THEME_PREFERENCE_KEY = "si-unit-calculator.theme-preference.v1";

function readSystemScheme(): ColorScheme {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

type ThemeContextValue = {
  colorScheme: ColorScheme;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // React NativeのuseColorScheme()はAndroidでコールドスタート直後、実際のOSテーマ（既にダーク）
  // より古い値（ライト）を初期値として返すことがあり、その後OS側で実際のテーマ変更イベントが
  // 発生しない限り更新されない（起動時から既にダークモードだと変更イベント自体が起きないため）。
  // これにより「初回起動時は白背景のまま、設定画面で手動でダークに切り替えると正しく黒になる」
  // という症状が起きるため、Appearanceを直接使い、マウント後の再取得とフォアグラウンド復帰時の
  // 再同期で補正する。
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(readSystemScheme);
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const colorScheme: ColorScheme = themePreference === "system" ? systemScheme : themePreference;

  useEffect(() => {
    setSystemScheme(readSystemScheme());
    const appearanceSubscription = Appearance.addChangeListener(({ colorScheme: nextScheme }) => {
      setSystemScheme(nextScheme === "dark" ? "dark" : "light");
    });
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") setSystemScheme(readSystemScheme());
    });
    return () => {
      appearanceSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

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

  const applyScheme = useCallback((scheme: ColorScheme, preference: ThemePreference) => {
    nativewindColorScheme.set(scheme);
    // "system"のときはOS側の値をそのまま上書き固定してしまわず、"unspecified"を渡して
    // Appearanceにシステム追従を保たせる（そうしないと、後でOS側のテーマを切り替えても
    // Appearance.getColorScheme()/useColorScheme()を直接参照する他のコード・ライブラリ側が
    // 追従できなくなる）。ライト/ダークを明示選択したときだけ実際に固定する。
    Appearance.setColorScheme?.(preference === "system" ? "unspecified" : scheme);
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
    applyScheme(colorScheme, themePreference);
    if (isFirstSchemeRender.current) {
      isFirstSchemeRender.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    themeFade.value = withSequence(withTiming(0.4, { duration: 90 }), withTiming(1, { duration: 220 }));
  }, [applyScheme, colorScheme, themeFade, themePreference]);

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
