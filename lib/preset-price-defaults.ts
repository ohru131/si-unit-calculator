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
// 米国はガソリンがガロン建てなので 1 US gal = 3.785411784 L で換算した値を入れる
// （ノートの計算式はリットル基準で、式そのものは地域非依存なので数値だけを合わせる）。
//
// 2026年9月時点の各国の実勢を調べて置いた概数。**厳密な統計値ではなく目安**で、
// ユーザーが編集する前提なので端数は落としてある。
//
// 燃料価格は意図的に「現在の実勢より少し低め」にしてある。2026年2月末以降の
// 燃料危機で米欧英の価格が平時より3〜4割高い状態が続いているが、プリセットの
// 既定値は無保守で長く残るので、今の高値に合わせると相場が戻ったときに大きく
// 外れる。日本・ブラジル・メキシコは補助や価格帯制度で価格転嫁が抑えられており
// 危機の影響が小さいため、そちらは実勢のままにしてある。
//
// 電気料金は地域差が大きく、単一の代表値にはどうしても無理がある点に注意:
// - ユーロ圏はEU平均を採用。ドイツ(約0.39)はスペイン(約0.30)・フランス(約0.26)の
//   1.3〜1.5倍あるので、独語ユーザーには安く見える。
// - ブラジル・メキシコは州や配電会社、階層制で数倍の幅がある（メキシコの
//   基本ブロックは1ペソ前後、超過ブロックは4〜7ペソ）。
export const PRESET_PRICE_PROFILES: Record<string, PresetPriceProfile> = {
  JPY: { electricityPerKWh: 31, fuelPerLiter: 170 },
  USD: { electricityPerKWh: 0.18, fuelPerLiter: 0.95 },
  EUR: { electricityPerKWh: 0.29, fuelPerLiter: 1.75 },
  GBP: { electricityPerKWh: 0.26, fuelPerLiter: 1.5 },
  BRL: { electricityPerKWh: 0.85, fuelPerLiter: 6.4 },
  MXN: { electricityPerKWh: 2, fuelPerLiter: 23.5 },
};

export const DEFAULT_PRESET_PRICE_CURRENCY = "USD";

// 地域コード → 通貨。**Webでは currencyCode が常に null** で返る
// （expo-localization の web 実装の制約。regionCode だけは言語タグから取れる）ため、
// この対応表が無いとWebでは地域を全く見られなくなる。ネイティブでも、端末が
// 通貨を返さない場合の保険になる。
// 表に無い地域は言語からの推測に落ちるので、網羅する必要はない。
const CURRENCY_BY_REGION: Record<string, string> = {
  JP: "JPY",
  US: "USD",
  GB: "GBP",
  BR: "BRL",
  MX: "MXN",
  // ユーロ圏21カ国（2026年1月にブルガリアが加入して21カ国になった）。
  // プリセットの言語(de/fr/es)に関係する国だけでなく、端末の地域がユーロ圏なら
  // 言語を問わずEURになるように並べておく。**ここを1カ国でも落とすと、その国の
  // 英語UIユーザーだけが黙ってUSDの値になる**ので、加入国が増えたら追加する。
  AT: "EUR", BE: "EUR", BG: "EUR", CY: "EUR", DE: "EUR", EE: "EUR", ES: "EUR",
  FI: "EUR", FR: "EUR", GR: "EUR", HR: "EUR", IE: "EUR", IT: "EUR", LT: "EUR",
  LU: "EUR", LV: "EUR", MT: "EUR", NL: "EUR", PT: "EUR", SI: "EUR", SK: "EUR",
  // ユーロ圏ではないがユーロを法定通貨にしている地域。通貨協定を結んでいる
  // ミニ国家(AD/MC/SM/VA)と、協定なしで事実上ユーロを使っている地域(ME/XK)。
  AD: "EUR", MC: "EUR", SM: "EUR", VA: "EUR", ME: "EUR", XK: "EUR",
};

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

// 端末の通貨コード → 端末の地域から引いた通貨 → 言語からの推測 → USD の順に解決する。
// 表に無い通貨（CHF・INR・KRW など）や地域は次の段に落ちるので、例えばスイスの
// ドイツ語なら EUR の値になる（USDよりは近い）。
export function resolvePresetPriceProfile(
  currencyCode: string | null | undefined,
  regionCode: string | null | undefined,
  language: AppLanguage,
): PresetPriceProfile {
  const byCurrency = PRESET_PRICE_PROFILES[currencyCode?.trim().toUpperCase() ?? ""];
  if (byCurrency) return byCurrency;

  const byRegion = PRESET_PRICE_PROFILES[CURRENCY_BY_REGION[regionCode?.trim().toUpperCase() ?? ""] ?? ""];
  if (byRegion) return byRegion;

  const byLanguage = PRESET_PRICE_PROFILES[FALLBACK_CURRENCY_BY_LANGUAGE[language]];
  return byLanguage ?? PRESET_PRICE_PROFILES[DEFAULT_PRESET_PRICE_CURRENCY];
}
