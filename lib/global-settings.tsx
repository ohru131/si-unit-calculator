import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { UnitSystem } from "@/lib/units";

export type AppLanguage = "en" | "ja";
export type CalculatorMode = "simple" | "advanced";

type GlobalSettings = {
  language: AppLanguage;
  locale: string;
  unitSystem: UnitSystem;
  calculatorMode: CalculatorMode;
  isReady: boolean;
  hasSeenOnboarding: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setUnitSystem: (system: UnitSystem) => Promise<void>;
  setCalculatorMode: (mode: CalculatorMode) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  t: (key: TranslationKey) => string;
  unitGroupLabel: (groupId: string) => string;
};

type TranslationKey = keyof typeof COPY.en;

const LANGUAGE_KEY = "si-unit-calculator.language.v1";
const UNIT_SYSTEM_KEY = "si-unit-calculator.unit-system.v1";
const CALCULATOR_MODE_KEY = "si-unit-calculator.calculator-mode.v1";
const ONBOARDING_SEEN_KEY = "si-unit-calculator.onboarding-seen.v1";

const COPY = {
  en: {
    calculator: "Unit Calculator",
    calculatorSubtitle: "Calculate in SI. Display in compatible units.",
    constants: "Library",
    pro: "Pro",
    examples: "Start with examples",
    examplesHint: "Choose an example to load the expression, display unit, and result.",
    expression: "Expression",
    expressionHint: "Supports ×, ÷, parentheses, constants, and advanced math",
    result: "Result",
    displayUnit: "Display unit",
    compatibleOnly: "Only units with the same dimension are shown.",
    enterUnit: "Enter a unit",
    enterUnitHint: "Choose a category, then tap a unit to add it to the expression.",
    settings: "Preferences",
    settingsSubtitle: "Language, regional units, and accessible display choices.",
    language: "App language",
    units: "Preferred unit system",
    systemMetric: "Metric",
    systemUS: "US customary",
    systemUK: "Imperial / UK",
    systemHint: "Your preference prioritizes familiar units without changing SI calculation accuracy.",
    displayMode: "Calculator display",
    simpleMode: "Simple",
    advancedMode: "Advanced",
    displayModeHint: "Simple keeps uncommon units and functions out of view. Advanced shows angles, scientific units, and math functions.",
    accessibility: "Accessible by design",
    accessibilityHint: "VoiceOver and TalkBack labels describe controls; text follows your device size settings.",
    region: "Region",
    saved: "Saved",
    english: "English",
    japanese: "Japanese",
  },
  ja: {
    calculator: "単位付き電卓",
    calculatorSubtitle: "SIで計算し、互換性のある単位で表示します。",
    constants: "ライブラリ",
    pro: "Pro",
    examples: "サンプルから始める",
    examplesHint: "例を選ぶと、式・表示単位・結果をまとめて設定します。",
    expression: "式",
    expressionHint: "×・÷・括弧・定数・上級関数に対応",
    result: "結果",
    displayUnit: "表示単位",
    compatibleOnly: "計算結果と同じ次元の単位のみ表示します。",
    enterUnit: "単位を式に入力",
    enterUnitHint: "次元を選択してから、使いたい単位をタップします。",
    settings: "設定",
    settingsSubtitle: "言語、地域の単位系、見やすい表示を調整します。",
    language: "アプリの言語",
    units: "優先する単位系",
    systemMetric: "メートル法",
    systemUS: "米国慣用単位",
    systemUK: "英・帝国単位",
    systemHint: "SIによる正確な計算は維持したまま、慣用的な単位を先に表示します。",
    displayMode: "電卓の表示モード",
    simpleMode: "シンプル",
    advancedMode: "上級",
    displayModeHint: "シンプルでは一般的でない単位・関数を隠します。上級では角度、科学単位、数学関数も表示します。",
    accessibility: "アクセシビリティ",
    accessibilityHint: "VoiceOver・TalkBack向けの説明を付け、端末の文字サイズ設定に対応します。",
    region: "地域",
    saved: "保存済み",
    english: "English",
    japanese: "日本語",
  },
} as const;

const GROUP_NAMES: Record<string, { en: string; ja: string }> = {
  length: { en: "Length", ja: "長さ" }, area: { en: "Area", ja: "面積" }, volume: { en: "Volume", ja: "体積" }, time: { en: "Time", ja: "時間" }, mass: { en: "Mass", ja: "質量" }, temperature: { en: "Temperature", ja: "温度" }, velocity: { en: "Speed", ja: "速度" }, acceleration: { en: "Acceleration", ja: "加速度" }, force: { en: "Force", ja: "力" }, pressure: { en: "Pressure", ja: "圧力" }, energy: { en: "Energy", ja: "エネルギー" }, power: { en: "Power", ja: "電力" }, current: { en: "Current", ja: "電流" }, voltage: { en: "Voltage", ja: "電圧" }, frequency: { en: "Frequency", ja: "周波数" }, angle: { en: "Angle", ja: "角度" }, ratio: { en: "Ratio", ja: "割合・無次元" },
};

const GlobalSettingsContext = createContext<GlobalSettings | null>(null);

function defaultUnitSystem(locale: Localization.Locale | undefined): UnitSystem {
  if (locale?.measurementSystem === "us") return "us";
  if (locale?.measurementSystem === "uk") return "uk";
  if (locale?.regionCode === "US") return "us";
  if (locale?.regionCode === "GB") return "uk";
  return "metric";
}

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const deviceLocale = Localization.useLocales()[0];
  const defaultLanguage: AppLanguage = deviceLocale?.languageCode === "ja" ? "ja" : "en";
  const [language, setLanguageState] = useState<AppLanguage>(defaultLanguage);
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => defaultUnitSystem(deviceLocale));
  const [calculatorMode, setCalculatorModeState] = useState<CalculatorMode>("simple");
  const [isReady, setIsReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(LANGUAGE_KEY), AsyncStorage.getItem(UNIT_SYSTEM_KEY), AsyncStorage.getItem(CALCULATOR_MODE_KEY), AsyncStorage.getItem(ONBOARDING_SEEN_KEY)])
      .then(([storedLanguage, storedUnitSystem, storedCalculatorMode, storedOnboardingSeen]) => {
        if (storedLanguage === "en" || storedLanguage === "ja") setLanguageState(storedLanguage);
        if (storedUnitSystem === "metric" || storedUnitSystem === "us" || storedUnitSystem === "uk") setUnitSystemState(storedUnitSystem);
        if (storedCalculatorMode === "simple" || storedCalculatorMode === "advanced") setCalculatorModeState(storedCalculatorMode);
        if (storedOnboardingSeen === "true") setHasSeenOnboarding(true);
      })
      .catch(() => undefined)
      .finally(() => setIsReady(true));
  }, []);

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage);
  }, []);

  const setUnitSystem = useCallback(async (nextSystem: UnitSystem) => {
    setUnitSystemState(nextSystem);
    await AsyncStorage.setItem(UNIT_SYSTEM_KEY, nextSystem);
  }, []);

  const setCalculatorMode = useCallback(async (nextMode: CalculatorMode) => {
    setCalculatorModeState(nextMode);
    await AsyncStorage.setItem(CALCULATOR_MODE_KEY, nextMode);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
  }, []);

  const locale = language === "ja" ? "ja-JP" : deviceLocale?.languageTag?.startsWith("en") ? deviceLocale.languageTag : "en-US";
  const value = useMemo<GlobalSettings>(() => ({
    language,
    locale,
    unitSystem,
    calculatorMode,
    isReady,
    hasSeenOnboarding,
    setLanguage,
    setUnitSystem,
    setCalculatorMode,
    completeOnboarding,
    t: (key) => COPY[language][key],
    unitGroupLabel: (groupId) => GROUP_NAMES[groupId]?.[language] ?? groupId,
  }), [calculatorMode, completeOnboarding, hasSeenOnboarding, isReady, language, locale, setCalculatorMode, setLanguage, setUnitSystem, unitSystem]);

  return <GlobalSettingsContext.Provider value={value}>{children}</GlobalSettingsContext.Provider>;
}

export function useGlobalSettings() {
  const value = useContext(GlobalSettingsContext);
  if (!value) throw new Error("GlobalSettingsProvider の内部で使用してください。");
  return value;
}
