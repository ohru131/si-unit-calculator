import { AppLanguage } from "./i18n";

// プリセット計算ノートに入れる「地域によって妥当な値が違う既定値」をまとめた場所。
// 電気代・燃料単価のような金額と、商用電源の電圧・ブレーカーの定格電流がここに載る。
// どちらも式が正しくても既定値が地域とちぐはぐだと、計算は通るのに何も教えないノートになる。
//
// **金額は通貨、電気は地域で決まる**（別の解決経路を持つ理由）。
// 金額は通貨圏ごとに桁から違う（31円/kWh と 0.28ユーロ/kWh）ので通貨を第一の手がかりにする。
// 一方、商用電源の電圧は通貨とは無関係で、100V(日本)・120V(北米)・230V(欧州ほか大半)と
// **国で決まる**。通貨表に無い国（オーストラリア・インド・韓国など）は金額こそUSDに落ちるが、
// 電圧まで120Vにしてしまうと明確な誤りになるため、電気だけは地域表を先に引き、
// **表に無い地域は世界の多数派である230Vを既定にする**。
export type PresetPriceKind = "electricityPerKWh" | "fuelPerLiter" | "filamentPerKg";

export type PresetPriceProfile = Record<PresetPriceKind, number>;

// 単位は「その通貨の1単位 / kWh」「その通貨の1単位 / リットル」「その通貨の1単位 / kg」。
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
// filamentPerKg は3Dプリンタ用フィラメント（PLA）1kgスプールの実勢価格。
// 電気・燃料と違って為替に素直に連動しやすいが、日本円だけ桁が3つ違うので
// 裸の数値で持つと必ず事故る（25円/kgのような値になる）。
export const PRESET_PRICE_PROFILES: Record<string, PresetPriceProfile> = {
  JPY: { electricityPerKWh: 31, fuelPerLiter: 170, filamentPerKg: 3000 },
  USD: { electricityPerKWh: 0.18, fuelPerLiter: 0.95, filamentPerKg: 22 },
  EUR: { electricityPerKWh: 0.29, fuelPerLiter: 1.75, filamentPerKg: 22 },
  GBP: { electricityPerKWh: 0.26, fuelPerLiter: 1.5, filamentPerKg: 20 },
  BRL: { electricityPerKWh: 0.85, fuelPerLiter: 6.4, filamentPerKg: 130 },
  MXN: { electricityPerKWh: 2, fuelPerLiter: 23.5, filamentPerKg: 450 },
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

// ここから下は「電気」の既定値。商用電源の電圧とブレーカーの定格電流を持つ。
//
// breakerCurrent は「その地域の家庭で普通に突き当たる遮断器の定格」。**国ごとに指している
// ものが違う**点に注意する: 日本の30Aはアンペア契約の主幹ブレーカー、北米の20Aは分岐回路
// (branch circuit)、欧州の16Aは最終回路(final circuit)、英国・アイルランドの32Aはリング
// ファイナル回路。「ブレーカーが落ちるまでに使える電力」という問いの答えとしてはどれも妥当だが、
// **ノートの説明文を「契約電圧」のような日本固有の言い回しにしないこと**（他の地域で意味を成さない）。
export type PresetElectricalKind = "mainsVoltage" | "breakerCurrent";

export type PresetElectricalProfile = Record<PresetElectricalKind, number>;

// 表に無い地域はこれになる。230Vは世界の大多数（欧州・アジア・アフリカ・オセアニア・南米の
// 大半）で、100〜127Vの方が少数派なので、**未知の地域を120Vに倒すと誤る確率の方が高い**。
export const DEFAULT_PRESET_ELECTRICAL_PROFILE: PresetElectricalProfile = { mainsVoltage: 230, breakerCurrent: 16 };

// 100〜127V圏（と、230Vでも定格が違う英国・アイルランド）だけを列挙する。ここに無い地域は
// 上のDEFAULT_PRESET_ELECTRICAL_PROFILEになるので、網羅する必要があるのは低電圧側だけ。
const ELECTRICAL_PROFILE_BY_REGION: Record<string, PresetElectricalProfile> = {
  JP: { mainsVoltage: 100, breakerCurrent: 30 },
  US: { mainsVoltage: 120, breakerCurrent: 20 },
  CA: { mainsVoltage: 120, breakerCurrent: 20 },
  // メキシコ・ブラジルは公称127V（ブラジルは南部・北東部に220Vの州もあるが、
  // 人口の多いサンパウロ・リオが127Vなのでこちらを既定にする）。
  MX: { mainsVoltage: 127, breakerCurrent: 20 },
  BR: { mainsVoltage: 127, breakerCurrent: 20 },
  // 中米・カリブ海と、南米北部の120V圏。台湾も110Vでこちら側。
  CO: { mainsVoltage: 120, breakerCurrent: 20 }, CR: { mainsVoltage: 120, breakerCurrent: 20 },
  DO: { mainsVoltage: 120, breakerCurrent: 20 }, EC: { mainsVoltage: 120, breakerCurrent: 20 },
  GT: { mainsVoltage: 120, breakerCurrent: 20 }, HN: { mainsVoltage: 120, breakerCurrent: 20 },
  NI: { mainsVoltage: 120, breakerCurrent: 20 }, PA: { mainsVoltage: 120, breakerCurrent: 20 },
  PR: { mainsVoltage: 120, breakerCurrent: 20 }, SV: { mainsVoltage: 120, breakerCurrent: 20 },
  TW: { mainsVoltage: 110, breakerCurrent: 20 }, VE: { mainsVoltage: 120, breakerCurrent: 20 },
  // 電圧は230Vだが、コンセント回路がリングファイナル(32A)なのでヨーロッパ大陸とは定格が違う。
  GB: { mainsVoltage: 230, breakerCurrent: 32 }, IE: { mainsVoltage: 230, breakerCurrent: 32 },
};

// 地域が分からないときの当て。通貨は地域よりは粗いが、JPY・USD・BRL・MXNは
// 電圧圏がはっきりしているので手掛かりになる（EUR・GBPは既定の230Vと同じなので置かない）。
const ELECTRICAL_PROFILE_BY_CURRENCY: Record<string, PresetElectricalProfile> = {
  JPY: ELECTRICAL_PROFILE_BY_REGION.JP,
  USD: ELECTRICAL_PROFILE_BY_REGION.US,
  BRL: ELECTRICAL_PROFILE_BY_REGION.BR,
  MXN: ELECTRICAL_PROFILE_BY_REGION.MX,
  GBP: ELECTRICAL_PROFILE_BY_REGION.GB,
};

// 地域も通貨も分からないときの最後の当て。金額側のFALLBACK_CURRENCY_BY_LANGUAGEと
// 揃えてある（en→USD→120V、ja→JPY→100V、pt-BR→BRL→127V、es/de/fr→EUR→230V）。
const FALLBACK_ELECTRICAL_BY_LANGUAGE: Record<AppLanguage, PresetElectricalProfile> = {
  en: ELECTRICAL_PROFILE_BY_REGION.US,
  ja: ELECTRICAL_PROFILE_BY_REGION.JP,
  es: DEFAULT_PRESET_ELECTRICAL_PROFILE,
  "pt-BR": ELECTRICAL_PROFILE_BY_REGION.BR,
  de: DEFAULT_PRESET_ELECTRICAL_PROFILE,
  fr: DEFAULT_PRESET_ELECTRICAL_PROFILE,
};

// 端末の地域 → 端末の通貨 → 言語からの推測 → 230V/16A の順に解決する。
// **金額(resolvePresetPriceProfile)と違って地域を先に見る**。電圧は通貨ではなく国で
// 決まるので、ユーロを使うモンテネグロもユーロ圏と同じ230Vでよいが、USDを使う
// エクアドル(120V)とオーストラリア(230V・USDではない)を通貨だけで区別はできない。
export function resolvePresetElectricalProfile(
  currencyCode: string | null | undefined,
  regionCode: string | null | undefined,
  language: AppLanguage,
): PresetElectricalProfile {
  const region = regionCode?.trim().toUpperCase() ?? "";
  // **地域が読めた時点で答えは確定する**。表に無い＝低電圧圏ではないということなので、
  // そこから通貨や言語へ落ちてはいけない（オーストラリアの英語UIが en→米国→120V に
  // 落ちて黙って誤る。金額と違い、電圧は地域さえ分かれば推測の余地が無い）。
  if (region) return ELECTRICAL_PROFILE_BY_REGION[region] ?? DEFAULT_PRESET_ELECTRICAL_PROFILE;

  const byCurrency = ELECTRICAL_PROFILE_BY_CURRENCY[currencyCode?.trim().toUpperCase() ?? ""];
  if (byCurrency) return byCurrency;

  return FALLBACK_ELECTRICAL_BY_LANGUAGE[language] ?? DEFAULT_PRESET_ELECTRICAL_PROFILE;
}

// シードのローカル定数が指定できる「地域依存の既定値」の種類。金額と電気を1つの
// unionにまとめてあるのは、シード側（NotebookSeedConstant.regionalDefault）から見ると
// 「投入時に端末の地域へ合わせて差し替えるもの」という同じ1つの概念だから。
export type PresetRegionalDefaultKind = PresetPriceKind | PresetElectricalKind;

// 解決済みの既定値。**値ではなく「そのまま定数の式として使える文字列」**で持つ。
// 金額は裸の数値（"0.29"。通貨記号はノート側で扱わない）、電気は単位付き（"230V"・"16A"）と
// 種類ごとに形が違うので、単位を付ける場所が呼び出し側に散らばらないようここで確定させる。
export type PresetRegionalDefaults = Record<PresetRegionalDefaultKind, string>;

export function resolvePresetRegionalDefaults(
  currencyCode: string | null | undefined,
  regionCode: string | null | undefined,
  language: AppLanguage,
): PresetRegionalDefaults {
  const price = resolvePresetPriceProfile(currencyCode, regionCode, language);
  const electrical = resolvePresetElectricalProfile(currencyCode, regionCode, language);
  return {
    electricityPerKWh: String(price.electricityPerKWh),
    fuelPerLiter: String(price.fuelPerLiter),
    filamentPerKg: String(price.filamentPerKg),
    mainsVoltage: `${electrical.mainsVoltage}V`,
    breakerCurrent: `${electrical.breakerCurrent}A`,
  };
}
