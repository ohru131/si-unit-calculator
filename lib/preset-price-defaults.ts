import { AppLanguage } from "./i18n";

// プリセット計算ノートに入れる金額の既定値。「電気代」「走行コスト」のノートは
// 単価をローカル定数として持つが、妥当な値は通貨圏ごとに桁から違う
// （31円/kWh と 0.28ユーロ/kWh のように）ため、地域別に持つ必要がある。
//
// **通貨は言語ではなく地域で決まる**。日本在住のユーザーがアプリを英語で使っている場合、
// 言語基準だとドル建ての値が入ってしまうが、地域基準なら正しく円建てになる。
// ドイツ語話者がスイスにいる場合も同様。そのため expo-localization の currencyCode を
// 第一の手がかりにする。
export type PresetPriceKind = "electricityPerKWh" | "fuelPerLiter";

export type PresetPriceProfile = Record<PresetPriceKind, number>;

// 単位は「その通貨の1単位 / kWh」と「その通貨の1単位 / リットル」。
// ガソリンがガロン建ての国もリットルに換算した値を入れる（ノートの計算式が
// リットル基準で、式そのものは地域非依存なので数値だけを合わせる）。
// あくまでユーザーが編集する前の目安なので、細かい端数は落としてある。
export const PRESET_PRICE_PROFILES: Record<string, PresetPriceProfile> = {
  JPY: { electricityPerKWh: 31, fuelPerLiter: 175 },
  USD: { electricityPerKWh: 0.18, fuelPerLiter: 0.85 },
  EUR: { electricityPerKWh: 0.28, fuelPerLiter: 1.75 },
  GBP: { electricityPerKWh: 0.27, fuelPerLiter: 1.35 },
  BRL: { electricityPerKWh: 0.79, fuelPerLiter: 6.1 },
  MXN: { electricityPerKWh: 2.0, fuelPerLiter: 24 },
};

export const DEFAULT_PRESET_PRICE_CURRENCY = "USD";

// 端末が通貨コードを返さなかったときの当て。地域が分からないので言語から推測するしかない。
// 完全な推測なので、あくまで最後の手段として使う。
const FALLBACK_CURRENCY_BY_LANGUAGE: Record<AppLanguage, string> = {
  en: "USD",
  ja: "JPY",
  es: "EUR",
  "pt-BR": "BRL",
  de: "EUR",
  fr: "EUR",
};

// 端末の通貨コード → 言語からの推測 → USD の順に解決する。
// 表に無い通貨（CHF・INR・KRW など）は言語からの推測に落ちるので、
// 例えばスイスのドイツ語なら EUR の値になる（USDよりは近い）。
export function resolvePresetPriceProfile(currencyCode: string | null | undefined, language: AppLanguage): PresetPriceProfile {
  const normalized = currencyCode?.trim().toUpperCase();
  if (normalized && PRESET_PRICE_PROFILES[normalized]) return PRESET_PRICE_PROFILES[normalized];

  const byLanguage = PRESET_PRICE_PROFILES[FALLBACK_CURRENCY_BY_LANGUAGE[language]];
  return byLanguage ?? PRESET_PRICE_PROFILES[DEFAULT_PRESET_PRICE_CURRENCY];
}
