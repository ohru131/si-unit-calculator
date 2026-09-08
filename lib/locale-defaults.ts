import type { AppLanguage } from "@/lib/i18n";
import type { MeasuringStandard, UnitSystem } from "@/lib/units";

/**
 * 端末ロケールのうち、既定値の判定に使う手掛かりだけを取り出した形。
 * expo-localization の `Locale` をそのまま受けると、Reactを使わないテストからでも
 * expo → react-native の生Flow構文まで読み込まれてパースできない（`tests/preset-regional-defaults.test.ts`
 * が `@/lib/global-settings` をモックしているのと同じ理由）。構造的な型で受けて純関数に保つ。
 */
export type LocaleHints = {
  measurementSystem?: string | null;
  regionCode?: string | null;
};

const normalizeRegion = (regionCode: string | null | undefined) => regionCode?.trim().toUpperCase() ?? "";

/** 端末ロケールから、単位チップに先に出す単位系を決める。 */
export function resolveDefaultUnitSystem(locale: LocaleHints | undefined): UnitSystem {
  if (locale?.measurementSystem === "us") return "us";
  if (locale?.measurementSystem === "uk") return "uk";
  const region = normalizeRegion(locale?.regionCode);
  if (region === "US") return "us";
  if (region === "GB") return "uk";
  return "metric";
}

/**
 * 端末ロケールから、カップ・大さじ・小さじの規格を決める。
 *
 * **言語ではなく地域で決める**。`resolveDefaultUnitSystem` と同じ手掛かりを使うのが要点で、
 * 以前は言語から決めていたため（`ja` なら jis・他は一律 us）**英国・豪州・アイルランドの
 * 英語ユーザーのカップが米国式(236.6mL)になっていた**。計量カップは電圧と同じ「国で決まるもの」で、
 * 使う言語とは無関係（日本在住で英語UIの人はJIS、米国在住の日本語UIの人は米国式が正しい）。
 *
 * 地域が読めたらそこで確定させ、通貨や言語へ落とさない（`resolvePresetElectricalProfile` と同じ判断。
 * 表に無い＝米国でもJISでも豪州でもない、すなわちメートル法圏ということなので metric でよい）。
 * 地域が全く読めない端末だけ、最後に言語を手掛かりにする。
 */
export function resolveDefaultMeasuringStandard(locale: LocaleHints | undefined, language: AppLanguage): MeasuringStandard {
  const region = normalizeRegion(locale?.regionCode);
  if (region === "JP") return "jis";
  // 豪州だけ大さじが20mL。カップ250mLは metric と同じなので、地域が読めたときだけ区別できる。
  if (region === "AU") return "au";
  if (locale?.measurementSystem === "us" || region === "US") return "us";
  if (region) return "metric";
  // 地域が全く読めない端末だけ言語を手掛かりにする。**`en` は米国式にする**のが要点で、
  // 同じ状況で `FALLBACK_CURRENCY_BY_LANGUAGE.en` は USD、`FALLBACK_ELECTRICAL_BY_LANGUAGE.en` は
  // 米国の120Vを選ぶ。ここだけメートル法にすると「電気代はドル・電圧は120Vなのにカップは250mL」
  // という食い違った端末が生まれる（独立レビューで検出）。英国・豪州の可能性は残るが、
  // 地域が読めない以上どの資源も同じ推測に賭けるほかなく、揃えておく方が説明できる。
  if (language === "ja") return "jis";
  return language === "en" ? "us" : "metric";
}
