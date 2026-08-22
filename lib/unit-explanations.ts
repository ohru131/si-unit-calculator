export type SupportedLanguage = "en" | "ja";

export type UnitExplanation = {
  symbol: string;
  name: Record<SupportedLanguage, string>;
  summary: Record<SupportedLanguage, string>;
  siConversion: string;
  usage: Record<SupportedLanguage, string>;
};

const ACCELERATION_DIMENSION = "加速度";

export const SPECIAL_UNIT_EXPLANATIONS: Record<string, UnitExplanation> = {
  Gal: {
    symbol: "Gal",
    name: { ja: "ガル", en: "Gal" },
    summary: { ja: "測地・地球物理で使われる加速度単位です。", en: "An acceleration unit used in geodesy and geophysics." },
    siConversion: "1 Gal = 0.01 m/s²",
    usage: { ja: "重力・地震・地盤の微小な加速度変化", en: "Gravity, earthquakes, and small ground-motion changes" },
  },
  mGal: {
    symbol: "mGal",
    name: { ja: "ミリガル", en: "Milligal" },
    summary: { ja: "Galの1,000分の1で、重力変化の表現に使われます。", en: "One thousandth of a Gal, used for gravity variations." },
    siConversion: "1 mGal = 1×10⁻⁵ m/s²",
    usage: { ja: "重力探査・地殻変動", en: "Gravity surveys and crustal deformation" },
  },
  "µGal": {
    symbol: "µGal",
    name: { ja: "マイクロガル", en: "Microgal" },
    summary: { ja: "Galの100万分の1で、非常に小さな重力変化を表します。", en: "One millionth of a Gal for very small gravity variations." },
    siConversion: "1 µGal = 1×10⁻⁸ m/s²",
    usage: { ja: "高精度重力計測", en: "High-precision gravimetry" },
  },
  G: {
    symbol: "G",
    name: { ja: "標準重力", en: "Standard gravity" },
    summary: { ja: "地球上の基準加速度を表す慣用単位です。", en: "A conventional unit representing standard Earth gravity." },
    siConversion: "1 G = 9.80665 m/s²",
    usage: { ja: "加速度計・振動・G荷重", en: "Accelerometers, vibration, and G-loads" },
  },
  g0: {
    symbol: "g0",
    name: { ja: "標準重力", en: "Standard gravity" },
    summary: { ja: "Gと同じ標準重力を明示する別記法です。", en: "An alternate notation for the same standard gravity as G." },
    siConversion: "1 g0 = 9.80665 m/s²",
    usage: { ja: "科学・技術文書", en: "Scientific and technical documentation" },
  },
  kine: {
    symbol: "kine",
    name: { ja: "カイン", en: "Kine" },
    summary: { ja: "CGS系で使われる速度単位です。", en: "A speed unit used in the CGS system." },
    siConversion: "1 kine = 1 cm/s = 0.01 m/s",
    usage: { ja: "古いCGS系の科学・工学資料", en: "Legacy CGS scientific and engineering sources" },
  },
  kt: {
    symbol: "kt",
    name: { ja: "ノット", en: "Knot" },
    summary: { ja: "海里毎時で表す航海・航空の速度単位です。", en: "A nautical and aviation speed unit expressed in nautical miles per hour." },
    siConversion: "1 kt = 0.514444444 m/s",
    usage: { ja: "船舶・航空・気象", en: "Marine, aviation, and meteorology" },
  },
  mph: {
    symbol: "mph",
    name: { ja: "マイル毎時", en: "Miles per hour" },
    summary: { ja: "1時間に進むマイル数で表す速度単位です。", en: "A speed unit expressed in miles travelled per hour." },
    siConversion: "1 mph = 0.44704 m/s",
    usage: { ja: "米国・英国の道路速度", en: "Road speeds in the US and UK" },
  },
  "ft/s": {
    symbol: "ft/s",
    name: { ja: "フィート毎秒", en: "Feet per second" },
    summary: { ja: "1秒に進むフィート数で表す速度単位です。", en: "A speed unit expressed in feet travelled per second." },
    siConversion: "1 ft/s = 0.3048 m/s",
    usage: { ja: "工学・航空・流体計測", en: "Engineering, aviation, and flow measurement" },
  },
};

export function getUnitExplanation(symbol: string): UnitExplanation | undefined {
  return SPECIAL_UNIT_EXPLANATIONS[symbol];
}

export const SPECIAL_UNIT_EXPLANATION_DIMENSION = ACCELERATION_DIMENSION;
