import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AppLanguage, isAppLanguage, LANGUAGE_META, resolveDeviceLanguage } from "@/lib/i18n";
import { MeasuringStandard, setMeasuringStandard as applyMeasuringStandard, UnitSystem } from "@/lib/units";

// AppLanguage の唯一の定義は lib/i18n.ts。既存のimport元（他ファイルが
// "@/lib/global-settings" から AppLanguage をimportしている）を壊さないよう、ここではre-exportする。
export type { AppLanguage };

type GlobalSettings = {
  language: AppLanguage;
  locale: string;
  unitSystem: UnitSystem;
  measuringStandard: MeasuringStandard;
  isReady: boolean;
  hasSeenOnboarding: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setUnitSystem: (system: UnitSystem) => Promise<void>;
  setMeasuringStandard: (standard: MeasuringStandard) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  t: (key: TranslationKey) => string;
  unitGroupLabel: (groupId: string) => string;
};

type TranslationKey = keyof typeof EN_COPY;

const LANGUAGE_KEY = "si-unit-calculator.language.v1";
const UNIT_SYSTEM_KEY = "si-unit-calculator.unit-system.v1";
const ONBOARDING_SEEN_KEY = "si-unit-calculator.onboarding-seen.v1";
const MEASURING_STANDARD_KEY = "si-unit-calculator.measuring-standard.v1";

// 英語のキー集合を正にして、他の言語は同じキーが全部揃っていないと型エラーにする。
// COPY 全体を satisfies Record<AppLanguage, Record<string, string>> とするとキー漏れをその場で検出できず、
// t() の定義行で「どの言語の何のキーが足りないのか分からないエラー」になってしまう。
const EN_COPY = {
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
  theme: "Appearance",
  themeSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  themeHint: "Choose Light or Dark to override your device setting, or follow System.",
  adsTitle: "Ads",
  adsHint: "The free version shows a small banner ad. Upgrade to Pro, or enter a code, to remove it.",
  adsFreeActive: "Ads are hidden.",
  adsUpgrade: "See Pro plans",
  adsRedeemPlaceholder: "Enter a code",
  adsRedeemButton: "Apply",
  accessibility: "Accessible by design",
  accessibilityHint: "VoiceOver and TalkBack labels describe controls; text follows your device size settings.",
  region: "Region",
  saved: "Saved",
  measuringStandard: "Cup & spoon standard",
  measuringStandardHint: "Sets the actual size used for cup, tbsp, and tsp everywhere in the app.",
  standardUS: "US customary (cup ≈ 236.6 mL)",
  standardJIS: "Japanese JIS (cup = 200 mL)",
} as const;

const COPY: Record<AppLanguage, Record<TranslationKey, string>> = {
  en: EN_COPY,
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
    theme: "外観",
    themeSystem: "端末設定に従う",
    themeLight: "ライト",
    themeDark: "ダーク",
    themeHint: "ライト・ダークを選ぶと端末設定に関わらず固定できます。",
    adsTitle: "広告",
    adsHint: "フリー版には小さなバナー広告が表示されます。Proへのアップグレード、またはコードの入力で非表示にできます。",
    adsFreeActive: "広告は非表示になっています。",
    adsUpgrade: "Proプランを見る",
    adsRedeemPlaceholder: "コードを入力",
    adsRedeemButton: "適用",
    accessibility: "アクセシビリティ",
    accessibilityHint: "VoiceOver・TalkBack向けの説明を付け、端末の文字サイズ設定に対応します。",
    region: "地域",
    saved: "保存済み",
    measuringStandard: "カップ・大さじ・小さじの規格",
    measuringStandardHint: "アプリ内すべてのカップ・大さじ・小さじの実際の量をまとめて切り替えます。",
    standardUS: "米国基準（カップ ≈ 236.6mL）",
    standardJIS: "日本のJIS規格（カップ = 200mL）",
  },
};

// lib/units.ts の BASE_UNIT_GROUPS（18グループ）と1対1で揃える必要がある。
// キーが欠けると unitGroupLabel が生の group id をそのままUIに出してしまう
// （実際に amount が抜けていて "amount" という文字列が表示されるバグがあった）。
const GROUP_NAMES: Record<string, Record<AppLanguage, string>> = {
  length: { en: "Length", ja: "長さ" }, area: { en: "Area", ja: "面積" }, volume: { en: "Volume", ja: "体積" }, time: { en: "Time", ja: "時間" }, mass: { en: "Mass", ja: "質量" }, temperature: { en: "Temperature", ja: "温度" }, velocity: { en: "Speed", ja: "速度" }, acceleration: { en: "Acceleration", ja: "加速度" }, force: { en: "Force", ja: "力" }, pressure: { en: "Pressure", ja: "圧力" }, energy: { en: "Energy", ja: "エネルギー" }, power: { en: "Power", ja: "電力" }, current: { en: "Current", ja: "電流" }, voltage: { en: "Voltage", ja: "電圧" }, frequency: { en: "Frequency", ja: "周波数" }, angle: { en: "Angle", ja: "角度" }, ratio: { en: "Ratio", ja: "割合・無次元" }, amount: { en: "Amount of substance", ja: "物質量" },
};

const GlobalSettingsContext = createContext<GlobalSettings | null>(null);

function defaultMeasuringStandard(language: AppLanguage): MeasuringStandard {
  return language === "ja" ? "jis" : "us";
}

function defaultUnitSystem(locale: Localization.Locale | undefined): UnitSystem {
  if (locale?.measurementSystem === "us") return "us";
  if (locale?.measurementSystem === "uk") return "uk";
  if (locale?.regionCode === "US") return "us";
  if (locale?.regionCode === "GB") return "uk";
  return "metric";
}

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const deviceLocale = Localization.useLocales()[0];
  const defaultLanguage: AppLanguage = resolveDeviceLanguage(deviceLocale?.languageTag, deviceLocale?.languageCode);
  const [language, setLanguageState] = useState<AppLanguage>(defaultLanguage);
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => defaultUnitSystem(deviceLocale));
  const [measuringStandard, setMeasuringStandardState] = useState<MeasuringStandard>(() => defaultMeasuringStandard(defaultLanguage));
  const [isReady, setIsReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // lib/units.ts はモジュール内の可変状態でcup/tbsp/tspの値を持つため、Reactのstateより先に
    // （同じ関数の中で）反映させる。useEffectの依存配列経由で追従させると1回分遅れて反映される。
    applyMeasuringStandard(defaultMeasuringStandard(defaultLanguage));

    Promise.all([AsyncStorage.getItem(LANGUAGE_KEY), AsyncStorage.getItem(UNIT_SYSTEM_KEY), AsyncStorage.getItem(ONBOARDING_SEEN_KEY), AsyncStorage.getItem(MEASURING_STANDARD_KEY)])
      .then(([storedLanguage, storedUnitSystem, storedOnboardingSeen, storedMeasuringStandard]) => {
        const resolvedLanguage = isAppLanguage(storedLanguage) ? storedLanguage : defaultLanguage;
        if (isAppLanguage(storedLanguage)) setLanguageState(storedLanguage);
        if (storedUnitSystem === "metric" || storedUnitSystem === "us" || storedUnitSystem === "uk") setUnitSystemState(storedUnitSystem);
        if (storedOnboardingSeen === "true") setHasSeenOnboarding(true);
        const resolvedStandard = storedMeasuringStandard === "us" || storedMeasuringStandard === "jis" ? storedMeasuringStandard : defaultMeasuringStandard(resolvedLanguage);
        applyMeasuringStandard(resolvedStandard);
        setMeasuringStandardState(resolvedStandard);
      })
      .catch(() => undefined)
      .finally(() => setIsReady(true));
  }, [defaultLanguage]);

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage);
  }, []);

  const setUnitSystem = useCallback(async (nextSystem: UnitSystem) => {
    setUnitSystemState(nextSystem);
    await AsyncStorage.setItem(UNIT_SYSTEM_KEY, nextSystem);
  }, []);

  const setMeasuringStandard = useCallback(async (nextStandard: MeasuringStandard) => {
    applyMeasuringStandard(nextStandard);
    setMeasuringStandardState(nextStandard);
    await AsyncStorage.setItem(MEASURING_STANDARD_KEY, nextStandard);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
  }, []);

  // 端末のlanguageTagが選択中の言語と同じ言語コードなら、それをそのまま使う
  // （例: 選択言語が"en"で端末が"en-GB"/"en-AU"なら地域差のある実際のタグを尊重する）。
  // 一致しない場合はLANGUAGE_METAのデフォルトロケールにフォールバックする。
  // 比較は必ず「両側の言語コード部分」で行う。選択言語側にも pt-BR のように地域が付くことが
  // あるため、選択言語をそのまま比べると pt-BR を選んだ端末の pt-PT / pt-BR が一致せず、
  // 数値の地域差(小数点・桁区切り)が既定ロケールに落ちてしまう。
  const deviceLanguageTag = deviceLocale?.languageTag;
  const deviceLanguageCode = deviceLanguageTag?.split("-")[0]?.toLowerCase();
  const selectedLanguageCode = language.split("-")[0].toLowerCase();
  const locale = deviceLanguageTag && deviceLanguageCode === selectedLanguageCode ? deviceLanguageTag : LANGUAGE_META[language].locale;
  const value = useMemo<GlobalSettings>(() => ({
    language,
    locale,
    unitSystem,
    measuringStandard,
    isReady,
    hasSeenOnboarding,
    setLanguage,
    setUnitSystem,
    setMeasuringStandard,
    completeOnboarding,
    t: (key) => COPY[language][key],
    unitGroupLabel: (groupId) => GROUP_NAMES[groupId]?.[language] ?? groupId,
  }), [completeOnboarding, hasSeenOnboarding, isReady, language, locale, measuringStandard, setLanguage, setMeasuringStandard, setUnitSystem, unitSystem]);

  return <GlobalSettingsContext.Provider value={value}>{children}</GlobalSettingsContext.Provider>;
}

export function useGlobalSettings() {
  const value = useContext(GlobalSettingsContext);
  if (!value) throw new Error("GlobalSettingsProvider の内部で使用してください。");
  return value;
}
