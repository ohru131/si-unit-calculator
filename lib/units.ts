import { APP_LANGUAGES, type LocalizedText } from "./i18n";
import { dimensionlessLabel, languageFromLocale, UnitError } from "./unit-errors";

export type Dimension = [number, number, number, number, number, number, number];

export type Quantity = {
  siValue: number;
  dimension: Dimension;
};

export type SavedConstant = {
  symbol: string;
  expression: string;
  quantity: Quantity;
  createdAt: string;
};

export type CustomFunctionDefinition = {
  name: string;
  parameters: string[];
  expression: string;
};

export type UnitOption = {
  symbol: string;
  label: string;
  /** 同じ単位を指す別表記。入力の解釈、検索、表記ゆれの修正候補に使う。 */
  aliases?: string[];
  /** 記号だけでは分かりにくい単位に添える読み。 */
  name?: LocalizedText;
};

export type UnitSystem = "metric" | "us" | "uk";

export type UnitGroup = {
  id: string;
  label: string;
  dimension: Dimension;
  units: UnitOption[];
};

export type UnitRegistration = {
  status: "registered" | "supported" | "unknown";
  group?: UnitGroup;
  unit?: UnitOption;
  /** 別表記で入力された場合の正式な記号。 */
  canonical?: string;
  /** 一致した別表記そのもの。 */
  matchedAlias?: string;
};

type UnitDefinition = {
  scale: number;
  dimension: Dimension;
  offset?: number;
};

type Token =
  | { type: "quantity"; value: Quantity }
  | { type: "identifier"; value: string }
  | { type: "operator"; value: "+" | "-" | "*" | "/" | "^" }
  | { type: "comma" }
  | { type: "leftParen" }
  | { type: "rightParen" };

/**
 * 識別子（ローカル定数名など）で追加的に使えるUnicode文字。
 * 数式表示（LaTeX）の変数と揃えた記号（下付き文字・ギリシャ文字）をそのまま実体の記号名として
 * 使えるようにするための拡張。tokenize()・parseConstantDefinition()（本ファイル）に加え、
 * lib/notebook-engine.ts・lib/unit-input.ts でも同じ文字集合を使い、ルールがずれないようにする。
 *
 * 除外した文字とその理由:
 * - Ω（ギリシャ大文字オメガ、U+03A9）: オーム単位の記号そのもの。ギリシャ大文字の範囲は
 *   Α-Ψ（U+0391-U+03A8）までにして明示的にΩを外している。
 * - µ（マイクロ記号、U+00B5）: SI接頭辞（マイクロ）専用の文字。識別子には含めない。
 * - %, °: 単位の記号。tokenize() には単位専用のフォールバック分岐が別にある。
 * ギリシャ小文字のμ（mu, U+03BC。マイクロ記号µ U+00B5とは別のコードポイント）は識別子として
 * 許可しても安全: tokenize() では「数値の直後に続く単位」の分岐が識別子の分岐より先に評価されるため、
 * 「2μm」は引き続き2マイクロメートルという単位として解釈され、式中に単独で現れる「μ」だけが
 * 識別子（定数名）として解決される。
 */
export const UNICODE_IDENTIFIER_EXTRA_CHARS =
  "Α-Ψ" + // ギリシャ大文字 Α-Ψ（Ωは除外）
  "α-ω" + // ギリシャ小文字 α-ω（μを含む）
  "₀-₉" + // 下付き数字 ₀-₉
  "ₐ-ₜ" + // 下付き小文字 ₐₑₕₖₗₘₙₒₚₛₜ など
  "ᵢ-ᵪ" + // 下付き小文字 ᵢᵣᵤᵥ とギリシャ下付き ᵦᵧᵨᵩᵪ
  "ⱼ"; // 下付き小文字 j（ⱼ）

/** 識別子の1文字目・2文字目以降に使える文字クラス（角括弧の中身のみ。両方とも同じ集合で問題ない）。 */
export const IDENTIFIER_START_CHAR_CLASS = `A-Za-z_${UNICODE_IDENTIFIER_EXTRA_CHARS}`;
export const IDENTIFIER_BODY_CHAR_CLASS = `A-Za-z0-9_${UNICODE_IDENTIFIER_EXTRA_CHARS}`;

/** 識別子（定数名）全体にマッチする正規表現。入力の先頭からの部分一致に使う（^始まり、末尾アンカーなし）。 */
/**
 * 数値トークンの規則（指数表記を含む）。
 *
 * 評価器と、入力解析（lib/unit-input.ts の analyzeExpression）で**必ず同じ規則を使う**ためにexportする。
 * 以前は解析側が独自に `[0-9.]` の並びだけを数値とみなしていたため、`2e-6C` の指数部が
 * `e` / `-` / `6` に割れて `e` が「使えない単位」として赤く表示され、`8.99e9N` に至っては
 * `e9N` ごと不明な単位になっていた（エンジンは正しく計算できているのに解析側だけが誤判定する、
 * という食い違い）。規則を2箇所に持つとまた必ずずれるので、ここを唯一の情報源にする。
 */
export const NUMBER_TOKEN_PATTERN = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/;

export const IDENTIFIER_PATTERN = new RegExp(`^[${IDENTIFIER_START_CHAR_CLASS}][${IDENTIFIER_BODY_CHAR_CLASS}]*`, "u");

const ZERO: Dimension = [0, 0, 0, 0, 0, 0, 0];
const DIMENSIONS = {
  length: [1, 0, 0, 0, 0, 0, 0],
  mass: [0, 1, 0, 0, 0, 0, 0],
  time: [0, 0, 1, 0, 0, 0, 0],
  current: [0, 0, 0, 1, 0, 0, 0],
  temperature: [0, 0, 0, 0, 1, 0, 0],
  amount: [0, 0, 0, 0, 0, 1, 0],
  luminousIntensity: [0, 0, 0, 0, 0, 0, 1],
} as const satisfies Record<string, Dimension>;

const BASE_UNIT_GROUPS: UnitGroup[] = [
  { id: "length", label: "長さ", dimension: DIMENSIONS.length, units: [{ symbol: "m", label: "m" }, { symbol: "km", label: "km" }, { symbol: "cm", label: "cm" }, { symbol: "mm", label: "mm" }, { symbol: "µm", label: "µm" }, { symbol: "in", label: "in" }, { symbol: "ft", label: "ft" }, { symbol: "yd", label: "yd" }, { symbol: "mi", label: "mi" }, { symbol: "au", label: "au" }, { symbol: "ly", label: "ly" }] },
  { id: "area", label: "面積", dimension: [2, 0, 0, 0, 0, 0, 0], units: [{ symbol: "m²", label: "m²" }, { symbol: "km²", label: "km²" }, { symbol: "cm²", label: "cm²" }, { symbol: "mm²", label: "mm²" }, { symbol: "in²", label: "in²" }, { symbol: "ft²", label: "ft²" }, { symbol: "yd²", label: "yd²" }, { symbol: "acre", label: "acre" }] },
  { id: "volume", label: "体積", dimension: [3, 0, 0, 0, 0, 0, 0], units: [{ symbol: "m³", label: "m³" }, { symbol: "L", label: "L" }, { symbol: "mL", label: "mL" }, { symbol: "cm³", label: "cm³" }, { symbol: "gal", label: "gal" }, { symbol: "qt", label: "qt" }, { symbol: "pt", label: "pt" }, { symbol: "cup", label: "cup" }, { symbol: "tbsp", label: "tbsp" }, { symbol: "tsp", label: "tsp" }] },
  { id: "time", label: "時間", dimension: DIMENSIONS.time, units: [{ symbol: "s", label: "s" }, { symbol: "ms", label: "ms" }, { symbol: "min", label: "min" }, { symbol: "h", label: "h" }, { symbol: "d", label: "d" }, { symbol: "yr", label: "yr" }] },
  { id: "mass", label: "質量", dimension: DIMENSIONS.mass, units: [{ symbol: "kg", label: "kg" }, { symbol: "g", label: "g" }, { symbol: "mg", label: "mg" }, { symbol: "t", label: "t" }, { symbol: "lb", label: "lb" }, { symbol: "oz", label: "oz" }, { symbol: "st", label: "st" }] },
  { id: "temperature", label: "温度", dimension: DIMENSIONS.temperature, units: [{ symbol: "K", label: "K" }, { symbol: "°C", label: "°C" }, { symbol: "°F", label: "°F" }] },
  { id: "velocity", label: "速度", dimension: [1, 0, -1, 0, 0, 0, 0], units: [{ symbol: "m/s", label: "m/s" }, { symbol: "km/s", label: "km/s" }, { symbol: "m/min", label: "m/min" }, { symbol: "km/min", label: "km/min" }, { symbol: "m/h", label: "m/h" }, { symbol: "km/h", label: "km/h" }, { symbol: "cm/s", label: "cm/s" }, { symbol: "kine", label: "kine" }, { symbol: "ft/s", label: "ft/s" }, { symbol: "mph", label: "mph" }, { symbol: "kt", label: "kt" }] },
  // units[].label は単位チップとしてそのまま画面に出るので、記号だけにして言語非依存に保つ。
  // 以前 G だけ "G (標準重力)" と日本語の補足が入っていて、英語UIでも日本語が出ていた。
  // 単位の正式名称は UNIT_META の name(LocalizedText) と lib/unit-explanations.ts が持っている。
  { id: "acceleration", label: "加速度", dimension: [1, 0, -2, 0, 0, 0, 0], units: [{ symbol: "m/s²", label: "m/s²" }, { symbol: "cm/s²", label: "cm/s²" }, { symbol: "Gal", label: "Gal (gal)" }, { symbol: "mGal", label: "mGal" }, { symbol: "µGal", label: "µGal" }, { symbol: "G", label: "G" }, { symbol: "ft/s²", label: "ft/s²" }] },
  { id: "force", label: "力", dimension: [1, 1, -2, 0, 0, 0, 0], units: [{ symbol: "N", label: "N" }, { symbol: "kN", label: "kN" }] },
  { id: "pressure", label: "圧力", dimension: [-1, 1, -2, 0, 0, 0, 0], units: [{ symbol: "Pa", label: "Pa" }, { symbol: "kPa", label: "kPa" }, { symbol: "MPa", label: "MPa" }, { symbol: "bar", label: "bar" }, { symbol: "psi", label: "psi" }, { symbol: "atm", label: "atm" }] },
  { id: "energy", label: "エネルギー", dimension: [2, 1, -2, 0, 0, 0, 0], units: [{ symbol: "J", label: "J" }, { symbol: "kJ", label: "kJ" }, { symbol: "Wh", label: "Wh" }, { symbol: "BTU", label: "BTU" }, { symbol: "cal", label: "cal" }, { symbol: "kcal", label: "kcal" }, { symbol: "eV", label: "eV" }] },
  { id: "power", label: "電力", dimension: [2, 1, -3, 0, 0, 0, 0], units: [{ symbol: "W", label: "W" }, { symbol: "kW", label: "kW" }, { symbol: "MW", label: "MW" }, { symbol: "hp", label: "hp" }] },
  { id: "current", label: "電流", dimension: DIMENSIONS.current, units: [{ symbol: "A", label: "A" }, { symbol: "mA", label: "mA" }, { symbol: "µA", label: "µA" }] },
  { id: "voltage", label: "電圧", dimension: [2, 1, -3, -1, 0, 0, 0], units: [{ symbol: "V", label: "V" }, { symbol: "mV", label: "mV" }, { symbol: "kV", label: "kV" }] },
  { id: "frequency", label: "周波数", dimension: [0, 0, -1, 0, 0, 0, 0], units: [{ symbol: "Hz", label: "Hz" }, { symbol: "kHz", label: "kHz" }, { symbol: "MHz", label: "MHz" }, { symbol: "rpm", label: "rpm" }, { symbol: "bpm", label: "bpm" }] },
  { id: "angle", label: "角度", dimension: ZERO, units: [{ symbol: "rad", label: "rad" }, { symbol: "deg", label: "deg" }, { symbol: "°", label: "°" }] },
  { id: "ratio", label: "割合・無次元", dimension: ZERO, units: [{ symbol: "%", label: "%" }, { symbol: "ppm", label: "ppm" }] },
  { id: "amount", label: "物質量", dimension: DIMENSIONS.amount, units: [{ symbol: "mol", label: "mol" }, { symbol: "mmol", label: "mmol" }] },
  // 以下は計算ノートのプリセット定数を全件洗い出した結果、次元に対応するグループが無く単位チップが
  // 0件になっていた定数・手順のうち、物理量として名前が付いて単位のバリエーションが意味を持つものを追加した
  // （lib/unit-options.ts の compatibleUnitOptions からの参照先。詳細はnotebook-detail.tsxの単位チップ表示を参照）。
  { id: "density", label: "密度", dimension: [-3, 1, 0, 0, 0, 0, 0], units: [{ symbol: "kg/m³", label: "kg/m³" }, { symbol: "g/cm³", label: "g/cm³" }, { symbol: "g/mL", label: "g/mL" }, { symbol: "g/L", label: "g/L" }, { symbol: "g/m³", label: "g/m³" }] },
  { id: "resistance", label: "抵抗", dimension: [2, 1, -3, -2, 0, 0, 0], units: [{ symbol: "Ω", label: "Ω" }, { symbol: "mΩ", label: "mΩ" }, { symbol: "kΩ", label: "kΩ" }, { symbol: "MΩ", label: "MΩ" }] },
  { id: "charge", label: "電荷", dimension: [0, 0, 1, 1, 0, 0, 0], units: [{ symbol: "C", label: "C" }, { symbol: "mC", label: "mC" }, { symbol: "µC", label: "µC" }, { symbol: "nC", label: "nC" }, { symbol: "pC", label: "pC" }] },
  { id: "capacitance", label: "静電容量", dimension: [-2, -1, 4, 2, 0, 0, 0], units: [{ symbol: "F", label: "F" }, { symbol: "mF", label: "mF" }, { symbol: "µF", label: "µF" }, { symbol: "nF", label: "nF" }, { symbol: "pF", label: "pF" }] },
  { id: "magneticFlux", label: "磁束", dimension: [2, 1, -2, -1, 0, 0, 0], units: [{ symbol: "Wb", label: "Wb" }, { symbol: "mWb", label: "mWb" }, { symbol: "µWb", label: "µWb" }] },
  { id: "springConstant", label: "ばね定数", dimension: [0, 1, -2, 0, 0, 0, 0], units: [{ symbol: "N/m", label: "N/m" }, { symbol: "N/mm", label: "N/mm" }, { symbol: "N/cm", label: "N/cm" }, { symbol: "kN/m", label: "kN/m" }] },
  { id: "specificHeatCapacity", label: "比熱", dimension: [2, 0, -2, 0, -1, 0, 0], units: [{ symbol: "J/kg/K", label: "J/(kg·K)" }, { symbol: "kJ/kg/K", label: "kJ/(kg·K)" }, { symbol: "cal/g/K", label: "cal/(g·K)" }] },
  { id: "molarMass", label: "モル質量", dimension: [0, 1, 0, 0, 0, -1, 0], units: [{ symbol: "g/mol", label: "g/mol" }, { symbol: "kg/mol", label: "kg/mol" }] },
  { id: "molarEnergy", label: "モルエネルギー", dimension: [2, 1, -2, 0, 0, -1, 0], units: [{ symbol: "J/mol", label: "J/mol" }, { symbol: "kJ/mol", label: "kJ/mol" }] },
  { id: "molarConcentration", label: "モル濃度", dimension: [-3, 0, 0, 0, 0, 1, 0], units: [{ symbol: "mol/m³", label: "mol/m³" }, { symbol: "mol/L", label: "mol/L" }, { symbol: "mmol/L", label: "mmol/L" }] },
  { id: "areaMomentOfInertia", label: "断面二次モーメント", dimension: [4, 0, 0, 0, 0, 0, 0], units: [{ symbol: "m⁴", label: "m⁴" }, { symbol: "mm⁴", label: "mm⁴" }, { symbol: "cm⁴", label: "cm⁴" }, { symbol: "in⁴", label: "in⁴" }] },
];

type UnitMeta = { aliases?: string[]; name?: LocalizedText };

/**
 * 記号だけでは伝わりにくい単位に読みと別表記を添える。
 * aliases は入力の表記ゆれ検索・修正候補に使い、name は候補一覧の説明に使う。
 */
const UNIT_META: Record<string, UnitMeta> = {
  m: { aliases: ["meter", "metre", "meters", "メートル"], name: { en: "meter", ja: "メートル", es: "metro", "pt-BR": "metro", de: "Meter", fr: "mètre" } },
  km: { aliases: ["kilometer", "kilometre", "kilometers", "キロメートル"], name: { en: "kilometer", ja: "キロメートル", es: "kilómetro", "pt-BR": "quilômetro", de: "Kilometer", fr: "kilomètre" } },
  cm: { aliases: ["centimeter", "centimetre", "centimeters", "センチメートル"], name: { en: "centimeter", ja: "センチメートル", es: "centímetro", "pt-BR": "centímetro", de: "Zentimeter", fr: "centimètre" } },
  mm: { aliases: ["millimeter", "millimetre", "millimeters", "ミリメートル"], name: { en: "millimeter", ja: "ミリメートル", es: "milímetro", "pt-BR": "milímetro", de: "Millimeter", fr: "millimètre" } },
  "µm": { aliases: ["um", "micrometer", "micron", "マイクロメートル"], name: { en: "micrometer", ja: "マイクロメートル", es: "micrómetro", "pt-BR": "micrômetro", de: "Mikrometer", fr: "micromètre" } },
  in: { aliases: ["inch", "inches", "インチ"], name: { en: "inch", ja: "インチ", es: "pulgada", "pt-BR": "polegada", de: "Zoll", fr: "pouce" } },
  ft: { aliases: ["foot", "feet", "フィート"], name: { en: "foot", ja: "フィート", es: "pie", "pt-BR": "pé", de: "Fuß", fr: "pied" } },
  yd: { aliases: ["yard", "yards", "ヤード"], name: { en: "yard", ja: "ヤード", es: "yarda", "pt-BR": "jarda", de: "Yard", fr: "yard" } },
  mi: { aliases: ["mile", "miles", "マイル"], name: { en: "mile", ja: "マイル", es: "milla", "pt-BR": "milha", de: "Meile", fr: "mile terrestre" } },
  "m²": { aliases: ["m2", "m^2", "sqm", "平方メートル"], name: { en: "square meter", ja: "平方メートル", es: "metro cuadrado", "pt-BR": "metro quadrado", de: "Quadratmeter", fr: "mètre carré" } },
  "km²": { aliases: ["km2", "km^2", "平方キロメートル"], name: { en: "square kilometer", ja: "平方キロメートル", es: "kilómetro cuadrado", "pt-BR": "quilômetro quadrado", de: "Quadratkilometer", fr: "kilomètre carré" } },
  "cm²": { aliases: ["cm2", "cm^2", "平方センチメートル"], name: { en: "square centimeter", ja: "平方センチメートル", es: "centímetro cuadrado", "pt-BR": "centímetro quadrado", de: "Quadratzentimeter", fr: "centimètre carré" } },
  "mm²": { aliases: ["mm2", "mm^2", "平方ミリメートル"], name: { en: "square millimeter", ja: "平方ミリメートル", es: "milímetro cuadrado", "pt-BR": "milímetro quadrado", de: "Quadratmillimeter", fr: "millimètre carré" } },
  "in²": { aliases: ["in2", "in^2", "sqin", "平方インチ"], name: { en: "square inch", ja: "平方インチ", es: "pulgada cuadrada", "pt-BR": "polegada quadrada", de: "Quadratzoll", fr: "pouce carré" } },
  "ft²": { aliases: ["ft2", "ft^2", "sqft", "平方フィート"], name: { en: "square foot", ja: "平方フィート", es: "pie cuadrado", "pt-BR": "pé quadrado", de: "Quadratfuß", fr: "pied carré" } },
  "yd²": { aliases: ["yd2", "yd^2", "平方ヤード"], name: { en: "square yard", ja: "平方ヤード", es: "yarda cuadrada", "pt-BR": "jarda quadrada", de: "Quadratyard", fr: "yard carré" } },
  acre: { aliases: ["acres", "エーカー"], name: { en: "acre", ja: "エーカー", es: "acre", "pt-BR": "acre", de: "Acre", fr: "acre" } },
  "m³": { aliases: ["m3", "m^3", "立方メートル"], name: { en: "cubic meter", ja: "立方メートル", es: "metro cúbico", "pt-BR": "metro cúbico", de: "Kubikmeter", fr: "mètre cube" } },
  L: { aliases: ["l", "liter", "litre", "liters", "リットル"], name: { en: "liter", ja: "リットル", es: "litro", "pt-BR": "litro", de: "Liter", fr: "litre" } },
  mL: { aliases: ["ml", "milliliter", "millilitre", "ミリリットル"], name: { en: "milliliter", ja: "ミリリットル", es: "mililitro", "pt-BR": "mililitro", de: "Milliliter", fr: "millilitre" } },
  "cm³": { aliases: ["cm3", "cm^3", "cc", "立方センチメートル"], name: { en: "cubic centimeter", ja: "立方センチメートル", es: "centímetro cúbico", "pt-BR": "centímetro cúbico", de: "Kubikzentimeter", fr: "centimètre cube" } },
  gal: { aliases: ["gallon", "gallons", "ガロン"], name: { en: "gallon", ja: "ガロン", es: "galón", "pt-BR": "galão", de: "Gallone", fr: "gallon" } },
  qt: { aliases: ["quart", "quarts", "クォート"], name: { en: "quart", ja: "クォート", es: "cuarto de galón", "pt-BR": "quarto de galão", de: "Quart", fr: "quart de gallon" } },
  pt: { aliases: ["pint", "pints", "パイント"], name: { en: "pint", ja: "パイント", es: "pinta (unidad de volumen)", "pt-BR": "pinta (unidade de volume)", de: "Pint", fr: "pinte" } },
  s: { aliases: ["sec", "secs", "second", "seconds", "秒"], name: { en: "second", ja: "秒", es: "segundo", "pt-BR": "segundo", de: "Sekunde", fr: "seconde" } },
  ms: { aliases: ["msec", "msecs", "millisecond", "milliseconds", "ミリ秒"], name: { en: "millisecond", ja: "ミリ秒", es: "milisegundo", "pt-BR": "milissegundo", de: "Millisekunde", fr: "milliseconde" } },
  min: { aliases: ["mins", "minute", "minutes", "分"], name: { en: "minute", ja: "分", es: "minuto", "pt-BR": "minuto", de: "Minute", fr: "minute" } },
  h: { aliases: ["hr", "hrs", "hour", "hours", "時間"], name: { en: "hour", ja: "時間", es: "hora", "pt-BR": "hora", de: "Stunde", fr: "heure" } },
  d: { aliases: ["day", "days", "日"], name: { en: "day", ja: "日", es: "día", "pt-BR": "dia", de: "Tag", fr: "jour" } },
  kg: { aliases: ["kilogram", "kilograms", "キログラム"], name: { en: "kilogram", ja: "キログラム", es: "kilogramo", "pt-BR": "quilograma", de: "Kilogramm", fr: "kilogramme" } },
  g: { aliases: ["gram", "grams", "グラム"], name: { en: "gram", ja: "グラム", es: "gramo", "pt-BR": "grama", de: "Gramm", fr: "gramme" } },
  mg: { aliases: ["milligram", "milligrams", "ミリグラム"], name: { en: "milligram", ja: "ミリグラム", es: "miligramo", "pt-BR": "miligrama", de: "Milligramm", fr: "milligramme" } },
  t: { aliases: ["ton", "tonne", "tons", "トン"], name: { en: "tonne", ja: "トン", es: "tonelada", "pt-BR": "tonelada", de: "Tonne", fr: "tonne" } },
  lb: { aliases: ["lbs", "pound", "pounds", "ポンド"], name: { en: "pound", ja: "ポンド", es: "libra", "pt-BR": "libra", de: "Avoirdupois-Pfund", fr: "livre" } },
  oz: { aliases: ["ounce", "ounces", "オンス"], name: { en: "ounce", ja: "オンス", es: "onza", "pt-BR": "onça", de: "Unze", fr: "once" } },
  st: { aliases: ["stone", "stones", "ストーン"], name: { en: "stone", ja: "ストーン", es: "stone (unidad de masa británica)", "pt-BR": "stone (unidade de massa britânica)", de: "Stone (britische Masseeinheit)", fr: "stone (unité de masse britannique)" } },
  K: { aliases: ["kelvin", "ケルビン"], name: { en: "kelvin", ja: "ケルビン", es: "kelvin", "pt-BR": "kelvin", de: "Kelvin", fr: "kelvin" } },
  "°C": { aliases: ["degC", "celsius", "摂氏"], name: { en: "degree Celsius", ja: "摂氏", es: "grado Celsius", "pt-BR": "grau Celsius", de: "Grad Celsius", fr: "degré Celsius" } },
  "°F": { aliases: ["degF", "fahrenheit", "華氏"], name: { en: "degree Fahrenheit", ja: "華氏", es: "grado Fahrenheit", "pt-BR": "grau Fahrenheit", de: "Grad Fahrenheit", fr: "degré Fahrenheit" } },
  "m/s": { aliases: ["m/sec", "mps", "メートル毎秒"], name: { en: "meter per second", ja: "メートル毎秒", es: "metro por segundo", "pt-BR": "metro por segundo", de: "Meter pro Sekunde", fr: "mètre par seconde" } },
  "km/h": { aliases: ["km/hr", "km/hour", "kph", "kmh", "キロメートル毎時"], name: { en: "kilometer per hour", ja: "キロメートル毎時", es: "kilómetro por hora", "pt-BR": "quilômetro por hora", de: "Kilometer pro Stunde", fr: "kilomètre par heure" } },
  "m/min": { aliases: ["m/minute", "メートル毎分"], name: { en: "meter per minute", ja: "メートル毎分", es: "metro por minuto", "pt-BR": "metro por minuto", de: "Meter pro Minute", fr: "mètre par minute" } },
  "km/min": { aliases: ["キロメートル毎分"], name: { en: "kilometer per minute", ja: "キロメートル毎分", es: "kilómetro por minuto", "pt-BR": "quilômetro por minuto", de: "Kilometer pro Minute", fr: "kilomètre par minute" } },
  "km/s": { aliases: ["km/sec", "キロメートル毎秒"], name: { en: "kilometer per second", ja: "キロメートル毎秒", es: "kilómetro por segundo", "pt-BR": "quilômetro por segundo", de: "Kilometer pro Sekunde", fr: "kilomètre par seconde" } },
  "m/h": { aliases: ["m/hr", "m/hour", "メートル毎時"], name: { en: "meter per hour", ja: "メートル毎時", es: "metro por hora", "pt-BR": "metro por hora", de: "Meter pro Stunde", fr: "mètre par heure" } },
  "cm/s": { aliases: ["cm/sec", "センチメートル毎秒"], name: { en: "centimeter per second", ja: "センチメートル毎秒", es: "centímetro por segundo", "pt-BR": "centímetro por segundo", de: "Zentimeter pro Sekunde", fr: "centimètre par seconde" } },
  "ft/s": { aliases: ["ft/sec", "fps", "フィート毎秒"], name: { en: "foot per second", ja: "フィート毎秒", es: "pie por segundo", "pt-BR": "pé por segundo", de: "Fuß pro Sekunde", fr: "pied par seconde" } },
  mph: { aliases: ["mi/h", "mi/hr", "マイル毎時"], name: { en: "mile per hour", ja: "マイル毎時", es: "milla por hora", "pt-BR": "milha por hora", de: "Meile pro Stunde", fr: "mile terrestre par heure" } },
  kt: { aliases: ["knot", "knots", "ノット"], name: { en: "knot", ja: "ノット", es: "nudo", "pt-BR": "nó", de: "Knoten", fr: "nœud" } },
  "m/s²": { aliases: ["m/s2", "m/s^2", "メートル毎秒毎秒"], name: { en: "meter per second squared", ja: "メートル毎秒毎秒", es: "metro por segundo al cuadrado", "pt-BR": "metro por segundo ao quadrado", de: "Meter pro Sekunde zum Quadrat", fr: "mètre par seconde carrée" } },
  "cm/s²": { aliases: ["cm/s2", "cm/s^2"], name: { en: "centimeter per second squared", ja: "センチメートル毎秒毎秒", es: "centímetro por segundo al cuadrado", "pt-BR": "centímetro por segundo ao quadrado", de: "Zentimeter pro Sekunde zum Quadrat", fr: "centimètre par seconde carrée" } },
  "ft/s²": { aliases: ["ft/s2", "ft/s^2"], name: { en: "foot per second squared", ja: "フィート毎秒毎秒", es: "pie por segundo al cuadrado", "pt-BR": "pé por segundo ao quadrado", de: "Fuß pro Sekunde zum Quadrat", fr: "pied par seconde carrée" } },
  N: { aliases: ["newton", "newtons", "ニュートン"], name: { en: "newton", ja: "ニュートン", es: "newton", "pt-BR": "newton", de: "Newton", fr: "newton" } },
  kN: { aliases: ["kilonewton", "キロニュートン"], name: { en: "kilonewton", ja: "キロニュートン", es: "kilonewton", "pt-BR": "quilonewton", de: "Kilonewton", fr: "kilonewton" } },
  Pa: { aliases: ["pascal", "pascals", "パスカル"], name: { en: "pascal", ja: "パスカル", es: "pascal", "pt-BR": "pascal", de: "Pascal", fr: "pascal" } },
  kPa: { aliases: ["kilopascal", "キロパスカル"], name: { en: "kilopascal", ja: "キロパスカル", es: "kilopascal", "pt-BR": "quilopascal", de: "Kilopascal", fr: "kilopascal" } },
  MPa: { aliases: ["megapascal", "メガパスカル"], name: { en: "megapascal", ja: "メガパスカル", es: "megapascal", "pt-BR": "megapascal", de: "Megapascal", fr: "mégapascal" } },
  bar: { aliases: ["bars", "バール"], name: { en: "bar", ja: "バール", es: "bar", "pt-BR": "bar", de: "Bar", fr: "bar" } },
  psi: { aliases: ["lbf/in²"], name: { en: "pound per square inch", ja: "重量ポンド毎平方インチ", es: "libra-fuerza por pulgada cuadrada", "pt-BR": "libra-força por polegada quadrada", de: "Pfund-Kraft pro Quadratzoll", fr: "livre-force par pouce carré" } },
  atm: { aliases: ["atmosphere", "気圧"], name: { en: "standard atmosphere", ja: "気圧", es: "atmósfera estándar", "pt-BR": "atmosfera padrão", de: "physikalische Atmosphäre", fr: "atmosphère normale" } },
  J: { aliases: ["joule", "joules", "ジュール"], name: { en: "joule", ja: "ジュール", es: "julio", "pt-BR": "joule", de: "Joule", fr: "joule" } },
  kJ: { aliases: ["kilojoule", "キロジュール"], name: { en: "kilojoule", ja: "キロジュール", es: "kilojulio", "pt-BR": "quilojoule", de: "Kilojoule", fr: "kilojoule" } },
  Wh: { aliases: ["watthour", "ワット時"], name: { en: "watt hour", ja: "ワット時", es: "vatio-hora", "pt-BR": "watt-hora", de: "Wattstunde", fr: "wattheure" } },
  BTU: { aliases: ["btu"], name: { en: "British thermal unit", ja: "英熱量", es: "unidad térmica británica (BTU)", "pt-BR": "unidade térmica britânica (BTU)", de: "britische thermische Einheit (BTU)", fr: "unité thermique britannique (BTU)" } },
  W: { aliases: ["watt", "watts", "ワット"], name: { en: "watt", ja: "ワット", es: "vatio", "pt-BR": "watt", de: "Watt", fr: "watt" } },
  kW: { aliases: ["kilowatt", "キロワット"], name: { en: "kilowatt", ja: "キロワット", es: "kilovatio", "pt-BR": "quilowatt", de: "Kilowatt", fr: "kilowatt" } },
  MW: { aliases: ["megawatt", "メガワット"], name: { en: "megawatt", ja: "メガワット", es: "megavatio", "pt-BR": "megawatt", de: "Megawatt", fr: "mégawatt" } },
  hp: { aliases: ["horsepower", "馬力"], name: { en: "horsepower", ja: "馬力", es: "caballo de fuerza (hp, imperial)", "pt-BR": "horsepower (hp)", de: "britische Horsepower (hp)", fr: "horsepower anglais (hp)" } },
  A: { aliases: ["amp", "ampere", "amps", "アンペア"], name: { en: "ampere", ja: "アンペア", es: "amperio", "pt-BR": "ampere", de: "Ampere", fr: "ampère" } },
  mA: { aliases: ["milliamp", "milliampere", "ミリアンペア"], name: { en: "milliampere", ja: "ミリアンペア", es: "miliamperio", "pt-BR": "miliampere", de: "Milliampere", fr: "milliampère" } },
  "µA": { aliases: ["uA", "microampere", "マイクロアンペア"], name: { en: "microampere", ja: "マイクロアンペア", es: "microamperio", "pt-BR": "microampere", de: "Mikroampere", fr: "microampère" } },
  V: { aliases: ["volt", "volts", "ボルト"], name: { en: "volt", ja: "ボルト", es: "voltio", "pt-BR": "volt", de: "Volt", fr: "volt" } },
  mV: { aliases: ["millivolt", "ミリボルト"], name: { en: "millivolt", ja: "ミリボルト", es: "milivoltio", "pt-BR": "milivolt", de: "Millivolt", fr: "millivolt" } },
  kV: { aliases: ["kilovolt", "キロボルト"], name: { en: "kilovolt", ja: "キロボルト", es: "kilovoltio", "pt-BR": "quilovolt", de: "Kilovolt", fr: "kilovolt" } },
  Hz: { aliases: ["hertz", "ヘルツ"], name: { en: "hertz", ja: "ヘルツ", es: "hercio", "pt-BR": "hertz", de: "Hertz", fr: "hertz" } },
  kHz: { aliases: ["kilohertz", "キロヘルツ"], name: { en: "kilohertz", ja: "キロヘルツ", es: "kilohercio", "pt-BR": "quilohertz", de: "Kilohertz", fr: "kilohertz" } },
  MHz: { aliases: ["megahertz", "メガヘルツ"], name: { en: "megahertz", ja: "メガヘルツ", es: "megahercio", "pt-BR": "megahertz", de: "Megahertz", fr: "mégahertz" } },
  rad: { aliases: ["radian", "radians", "ラジアン"], name: { en: "radian", ja: "ラジアン", es: "radián", "pt-BR": "radiano", de: "Radiant", fr: "radian" } },
  deg: { aliases: ["degree", "degrees", "度"], name: { en: "degree", ja: "度", es: "grado", "pt-BR": "grau", de: "Grad", fr: "degré" } },
  "°": { aliases: ["degree", "度"], name: { en: "degree", ja: "度", es: "grado", "pt-BR": "grau", de: "Grad", fr: "degré" } },
  "%": { aliases: ["percent", "パーセント"], name: { en: "percent", ja: "パーセント", es: "por ciento", "pt-BR": "por cento", de: "Prozent", fr: "pour cent" } },
  ppm: { aliases: ["partspermillion", "百万分率"], name: { en: "parts per million", ja: "百万分率", es: "partes por millón", "pt-BR": "partes por milhão", de: "Teile pro Million", fr: "parties par million" } },
  Gal: { aliases: ["gal(acceleration)"], name: { en: "gal", ja: "ガル", es: "gal", "pt-BR": "gal", de: "Gal", fr: "gal" } },
  mGal: { name: { en: "milligal", ja: "ミリガル", es: "miligal", "pt-BR": "miligal", de: "Milligal", fr: "milligal" } },
  "µGal": { aliases: ["uGal"], name: { en: "microgal", ja: "マイクロガル", es: "microgal", "pt-BR": "microgal", de: "Mikrogal", fr: "microgal" } },
  G: { aliases: ["g0"], name: { en: "standard gravity", ja: "標準重力", es: "gravedad estándar", "pt-BR": "gravidade padrão", de: "Normfallbeschleunigung", fr: "gravité normale" } },
  kine: { name: { en: "kine", ja: "カイン", es: "kine", "pt-BR": "kine", de: "Kine", fr: "kine" } },
  cal: { aliases: ["calorie", "calories", "カロリー"], name: { en: "calorie", ja: "カロリー", es: "caloría", "pt-BR": "caloria", de: "Kalorie", fr: "calorie" } },
  kcal: { aliases: ["kilocalorie", "kilocalories", "キロカロリー"], name: { en: "kilocalorie", ja: "キロカロリー", es: "kilocaloría", "pt-BR": "quilocaloria", de: "Kilokalorie", fr: "kilocalorie" } },
  eV: { aliases: ["electronvolt", "electron-volt", "電子ボルト"], name: { en: "electronvolt", ja: "電子ボルト", es: "electronvoltio", "pt-BR": "elétron-volt", de: "Elektronenvolt", fr: "électron-volt" } },
  bpm: { aliases: ["beatsperminute", "拍毎分"], name: { en: "beat per minute", ja: "心拍数", es: "latido por minuto", "pt-BR": "batimento por minuto", de: "Schlag pro Minute", fr: "battement par minute" } },
  rpm: { aliases: ["revolutionsperminute", "回転毎分"], name: { en: "revolution per minute", ja: "回転数", es: "revolución por minuto", "pt-BR": "rotação por minuto", de: "Umdrehung pro Minute", fr: "tour par minute" } },
  cup: { aliases: ["cups", "カップ"], name: { en: "cup (US or JIS, set in Preferences)", ja: "カップ（設定で米国基準・JISを切替）", es: "taza (EE. UU. o JIS, configurable en Preferencias)", "pt-BR": "xícara (EUA ou JIS, configurável em Preferências)", de: "Tasse (US oder JIS, einstellbar unter Einstellungen)", fr: "tasse (US ou JIS, réglable dans les Préférences)" } },
  tbsp: { aliases: ["tablespoon", "tablespoons", "大さじ"], name: { en: "tablespoon (US or JIS, set in Preferences)", ja: "大さじ（設定で米国基準・JISを切替）", es: "cucharada (EE. UU. o JIS, configurable en Preferencias)", "pt-BR": "colher de sopa (EUA ou JIS, configurável em Preferências)", de: "Esslöffel (US oder JIS, einstellbar unter Einstellungen)", fr: "cuillère à soupe (US ou JIS, réglable dans les Préférences)" } },
  tsp: { aliases: ["teaspoon", "teaspoons", "小さじ"], name: { en: "teaspoon (US or JIS, set in Preferences)", ja: "小さじ（設定で米国基準・JISを切替）", es: "cucharadita (EE. UU. o JIS, configurable en Preferencias)", "pt-BR": "colher de chá (EUA ou JIS, configurável em Preferências)", de: "Teelöffel (US oder JIS, einstellbar unter Einstellungen)", fr: "cuillère à café (US ou JIS, réglable dans les Préférences)" } },
  au: { aliases: ["AU", "astronomicalunit", "天文単位"], name: { en: "astronomical unit", ja: "天文単位", es: "unidad astronómica", "pt-BR": "unidade astronômica", de: "astronomische Einheit", fr: "unité astronomique" } },
  ly: { aliases: ["lightyear", "lightyears", "光年"], name: { en: "light year", ja: "光年", es: "año luz", "pt-BR": "ano-luz", de: "Lichtjahr", fr: "année-lumière" } },
  yr: { aliases: ["year", "years", "年"], name: { en: "year", ja: "年", es: "año", "pt-BR": "ano", de: "Jahr", fr: "année" } },
  mol: { aliases: ["mole", "moles", "モル"], name: { en: "mole", ja: "モル", es: "mol", "pt-BR": "mol", de: "Mol", fr: "mole" } },
  mmol: { aliases: ["millimole", "millimoles", "ミリモル"], name: { en: "millimole", ja: "ミリモル", es: "milimol", "pt-BR": "milimol", de: "Millimol", fr: "millimole" } },
  // 以下、単位チップが0件だった定数（密度・抵抗・電荷・静電容量・磁束・ばね定数・比熱・モル質量・
  // モルエネルギー・モル濃度・断面二次モーメント）のために追加した単位。
  "kg/m³": { aliases: ["kg/m3", "kg/m^3"], name: { en: "kilogram per cubic meter", ja: "キログラム毎立方メートル", es: "kilogramo por metro cúbico", "pt-BR": "quilograma por metro cúbico", de: "Kilogramm pro Kubikmeter", fr: "kilogramme par mètre cube" } },
  "g/cm³": { aliases: ["g/cm3", "g/cm^3"], name: { en: "gram per cubic centimeter", ja: "グラム毎立方センチメートル", es: "gramo por centímetro cúbico", "pt-BR": "grama por centímetro cúbico", de: "Gramm pro Kubikzentimeter", fr: "gramme par centimètre cube" } },
  "g/mL": { aliases: ["g/ml"], name: { en: "gram per milliliter", ja: "グラム毎ミリリットル", es: "gramo por mililitro", "pt-BR": "grama por mililitro", de: "Gramm pro Milliliter", fr: "gramme par millilitre" } },
  "g/L": { aliases: ["g/l"], name: { en: "gram per liter", ja: "グラム毎リットル", es: "gramo por litro", "pt-BR": "grama por litro", de: "Gramm pro Liter", fr: "gramme par litre" } },
  "g/m³": { aliases: ["g/m3", "g/m^3"], name: { en: "gram per cubic meter", ja: "グラム毎立方メートル", es: "gramo por metro cúbico", "pt-BR": "grama por metro cúbico", de: "Gramm pro Kubikmeter", fr: "gramme par mètre cube" } },
  "Ω": { aliases: ["Ohm"], name: { en: "ohm", ja: "オーム", es: "ohmio", "pt-BR": "ohm", de: "Ohm", fr: "ohm" } },
  "mΩ": { name: { en: "milliohm", ja: "ミリオーム", es: "miliohmio", "pt-BR": "miliohm", de: "Milliohm", fr: "milliohm" } },
  "kΩ": { name: { en: "kiloohm", ja: "キロオーム", es: "kilohmio", "pt-BR": "kilohm", de: "Kiloohm", fr: "kiloohm" } },
  "MΩ": { name: { en: "megaohm", ja: "メガオーム", es: "megaohmio", "pt-BR": "megaohm", de: "Megaohm", fr: "mégaohm" } },
  C: { aliases: ["coulomb", "coulombs", "クーロン"], name: { en: "coulomb", ja: "クーロン", es: "culombio", "pt-BR": "coulomb", de: "Coulomb", fr: "coulomb" } },
  mC: { aliases: ["millicoulomb", "ミリクーロン"], name: { en: "millicoulomb", ja: "ミリクーロン", es: "milicoulombio", "pt-BR": "milicoulomb", de: "Millicoulomb", fr: "millicoulomb" } },
  "µC": { aliases: ["uC", "microcoulomb", "マイクロクーロン"], name: { en: "microcoulomb", ja: "マイクロクーロン", es: "microcoulombio", "pt-BR": "microcoulomb", de: "Mikrocoulomb", fr: "microcoulomb" } },
  nC: { aliases: ["nanocoulomb", "ナノクーロン"], name: { en: "nanocoulomb", ja: "ナノクーロン", es: "nanocoulombio", "pt-BR": "nanocoulomb", de: "Nanocoulomb", fr: "nanocoulomb" } },
  pC: { aliases: ["picocoulomb", "ピコクーロン"], name: { en: "picocoulomb", ja: "ピコクーロン", es: "picocoulombio", "pt-BR": "picocoulomb", de: "Picocoulomb", fr: "picocoulomb" } },
  F: { aliases: ["farad", "farads", "ファラド"], name: { en: "farad", ja: "ファラド", es: "faradio", "pt-BR": "farad", de: "Farad", fr: "farad" } },
  mF: { aliases: ["millifarad", "ミリファラド"], name: { en: "millifarad", ja: "ミリファラド", es: "milifaradio", "pt-BR": "milifarad", de: "Millifarad", fr: "millifarad" } },
  "µF": { aliases: ["uF", "microfarad", "マイクロファラド"], name: { en: "microfarad", ja: "マイクロファラド", es: "microfaradio", "pt-BR": "microfarad", de: "Mikrofarad", fr: "microfarad" } },
  nF: { aliases: ["nanofarad", "ナノファラド"], name: { en: "nanofarad", ja: "ナノファラド", es: "nanofaradio", "pt-BR": "nanofarad", de: "Nanofarad", fr: "nanofarad" } },
  pF: { aliases: ["picofarad", "ピコファラド"], name: { en: "picofarad", ja: "ピコファラド", es: "picofaradio", "pt-BR": "picofarad", de: "Picofarad", fr: "picofarad" } },
  Wb: { aliases: ["weber", "webers", "ウェーバ"], name: { en: "weber", ja: "ウェーバ", es: "weber", "pt-BR": "weber", de: "Weber", fr: "weber" } },
  mWb: { aliases: ["milliweber", "ミリウェーバ"], name: { en: "milliweber", ja: "ミリウェーバ", es: "miliweber", "pt-BR": "miliweber", de: "Milliweber", fr: "milliweber" } },
  "µWb": { aliases: ["uWb", "microweber", "マイクロウェーバ"], name: { en: "microweber", ja: "マイクロウェーバ", es: "microweber", "pt-BR": "microweber", de: "Mikroweber", fr: "microweber" } },
  "N/m": { name: { en: "newton per meter", ja: "ニュートン毎メートル", es: "newton por metro", "pt-BR": "newton por metro", de: "Newton pro Meter", fr: "newton par mètre" } },
  "N/mm": { name: { en: "newton per millimeter", ja: "ニュートン毎ミリメートル", es: "newton por milímetro", "pt-BR": "newton por milímetro", de: "Newton pro Millimeter", fr: "newton par millimètre" } },
  "N/cm": { name: { en: "newton per centimeter", ja: "ニュートン毎センチメートル", es: "newton por centímetro", "pt-BR": "newton por centímetro", de: "Newton pro Zentimeter", fr: "newton par centimètre" } },
  "kN/m": { name: { en: "kilonewton per meter", ja: "キロニュートン毎メートル", es: "kilonewton por metro", "pt-BR": "quilonewton por metro", de: "Kilonewton pro Meter", fr: "kilonewton par mètre" } },
  "J/kg/K": { aliases: ["J/(kg*K)", "J/(kg·K)"], name: { en: "joule per kilogram-kelvin", ja: "ジュール毎キログラム毎ケルビン", es: "julio por kilogramo y kelvin", "pt-BR": "joule por quilograma-kelvin", de: "Joule pro Kilogramm und Kelvin", fr: "joule par kilogramme-kelvin" } },
  "kJ/kg/K": { aliases: ["kJ/(kg*K)", "kJ/(kg·K)"], name: { en: "kilojoule per kilogram-kelvin", ja: "キロジュール毎キログラム毎ケルビン", es: "kilojulio por kilogramo y kelvin", "pt-BR": "quilojoule por quilograma-kelvin", de: "Kilojoule pro Kilogramm und Kelvin", fr: "kilojoule par kilogramme-kelvin" } },
  "cal/g/K": { aliases: ["cal/(g*K)", "cal/(g·K)"], name: { en: "calorie per gram-kelvin", ja: "カロリー毎グラム毎ケルビン", es: "caloría por gramo y kelvin", "pt-BR": "caloria por grama-kelvin", de: "Kalorie pro Gramm und Kelvin", fr: "calorie par gramme-kelvin" } },
  "g/mol": { name: { en: "gram per mole", ja: "グラム毎モル", es: "gramo por mol", "pt-BR": "grama por mol", de: "Gramm pro Mol", fr: "gramme par mole" } },
  "kg/mol": { name: { en: "kilogram per mole", ja: "キログラム毎モル", es: "kilogramo por mol", "pt-BR": "quilograma por mol", de: "Kilogramm pro Mol", fr: "kilogramme par mole" } },
  "J/mol": { name: { en: "joule per mole", ja: "ジュール毎モル", es: "julio por mol", "pt-BR": "joule por mol", de: "Joule pro Mol", fr: "joule par mole" } },
  "kJ/mol": { name: { en: "kilojoule per mole", ja: "キロジュール毎モル", es: "kilojulio por mol", "pt-BR": "quilojoule por mol", de: "Kilojoule pro Mol", fr: "kilojoule par mole" } },
  "mol/m³": { aliases: ["mol/m3", "mol/m^3"], name: { en: "mole per cubic meter", ja: "モル毎立方メートル", es: "mol por metro cúbico", "pt-BR": "mol por metro cúbico", de: "Mol pro Kubikmeter", fr: "mole par mètre cube" } },
  "mol/L": { aliases: ["mol/l"], name: { en: "mole per liter", ja: "モル毎リットル", es: "mol por litro", "pt-BR": "mol por litro", de: "Mol pro Liter", fr: "mole par litre" } },
  "mmol/L": { aliases: ["mmol/l"], name: { en: "millimole per liter", ja: "ミリモル毎リットル", es: "milimol por litro", "pt-BR": "milimol por litro", de: "Millimol pro Liter", fr: "millimole par litre" } },
  "m⁴": { aliases: ["m4", "m^4"], name: { en: "meter to the fourth power", ja: "メートルの4乗", es: "metro a la cuarta potencia", "pt-BR": "metro à quarta potência", de: "Meter hoch vier", fr: "mètre à la puissance quatre" } },
  "mm⁴": { aliases: ["mm4", "mm^4"], name: { en: "millimeter to the fourth power", ja: "ミリメートルの4乗", es: "milímetro a la cuarta potencia", "pt-BR": "milímetro à quarta potência", de: "Millimeter hoch vier", fr: "millimètre à la puissance quatre" } },
  "cm⁴": { aliases: ["cm4", "cm^4"], name: { en: "centimeter to the fourth power", ja: "センチメートルの4乗", es: "centímetro a la cuarta potencia", "pt-BR": "centímetro à quarta potência", de: "Zentimeter hoch vier", fr: "centimètre à la puissance quatre" } },
  "in⁴": { aliases: ["in4", "in^4"], name: { en: "inch to the fourth power", ja: "インチの4乗", es: "pulgada a la cuarta potencia", "pt-BR": "polegada à quarta potência", de: "Zoll hoch vier", fr: "pouce à la puissance quatre" } },
};

export const UNIT_GROUPS: UnitGroup[] = BASE_UNIT_GROUPS.map((group) => ({
  ...group,
  units: group.units.map((unitOption) => ({ ...unitOption, ...UNIT_META[unitOption.symbol] })),
}));

/** 記号・別表記のどちらからでも登録済み単位を引く。 */
export function findRegisteredUnit(input: string): { group: UnitGroup; unit: UnitOption; matchedAlias?: string } | undefined {
  const source = input.trim();
  if (!source) return undefined;
  for (const group of UNIT_GROUPS) {
    const exact = group.units.find((unitOption) => unitOption.symbol === source);
    if (exact) return { group, unit: exact };
  }
  const lowered = source.toLowerCase();
  for (const group of UNIT_GROUPS) {
    for (const unitOption of group.units) {
      const matchedAlias = unitOption.aliases?.find((alias) => alias.toLowerCase() === lowered);
      if (matchedAlias) return { group, unit: unitOption, matchedAlias };
    }
  }
  return undefined;
}

/** 単位の別表記を正式な記号へ寄せる。未知の入力はそのまま返す。 */
export function canonicalUnitSymbol(input: string): string {
  const source = input.trim();
  const found = findRegisteredUnit(source);
  return found ? found.unit.symbol : source;
}

/** 候補一覧に使う検索用テキスト。記号・読み・別表記・カテゴリ名をまとめる。 */
export function unitSearchText(group: UnitGroup, unitOption: UnitOption): string {
  const localizedNames = APP_LANGUAGES.map((language) => unitOption.name?.[language]);
  return [group.id, group.label, unitOption.symbol, unitOption.label, ...localizedNames, ...(unitOption.aliases ?? [])].filter(Boolean).join(" ").toLowerCase();
}

const multiplyDimensions = (left: Dimension, right: Dimension): Dimension =>
  left.map((value, index) => value + right[index]) as Dimension;

const divideDimensions = (left: Dimension, right: Dimension): Dimension =>
  left.map((value, index) => value - right[index]) as Dimension;

const isDimensionless = (dimension: Dimension) => dimension.every((value) => value === 0);

const powerDimension = (dimension: Dimension, power: number): Dimension =>
  dimension.map((value) => value * power) as Dimension;

const sameDimension = (left: Dimension, right: Dimension) =>
  left.every((value, index) => value === right[index]);

const unit = (scale: number, dimension: Dimension, offset?: number): UnitDefinition => ({ scale, dimension, offset });
const multipliedUnit = (left: UnitDefinition, right: UnitDefinition): UnitDefinition =>
  unit(left.scale * right.scale, multiplyDimensions(left.dimension, right.dimension));
const dividedUnit = (left: UnitDefinition, right: UnitDefinition): UnitDefinition =>
  unit(left.scale / right.scale, divideDimensions(left.dimension, right.dimension));

const BASE_UNITS: Record<string, UnitDefinition> = {
  m: unit(1, DIMENSIONS.length),
  kg: unit(1, DIMENSIONS.mass),
  g: unit(1e-3, DIMENSIONS.mass),
  s: unit(1, DIMENSIONS.time),
  A: unit(1, DIMENSIONS.current),
  K: unit(1, DIMENSIONS.temperature),
  mol: unit(1, DIMENSIONS.amount),
  cd: unit(1, DIMENSIONS.luminousIntensity),
  rad: unit(1, ZERO),
  sr: unit(1, ZERO),
  deg: unit(Math.PI / 180, ZERO),
  "°": unit(Math.PI / 180, ZERO),
  "%": unit(1e-2, ZERO),
  ppm: unit(1e-6, ZERO),
  min: unit(60, DIMENSIONS.time),
  h: unit(3600, DIMENSIONS.time),
  d: unit(86400, DIMENSIONS.time),
  L: unit(1e-3, [3, 0, 0, 0, 0, 0, 0]),
  l: unit(1e-3, [3, 0, 0, 0, 0, 0, 0]),
  t: unit(1e3, DIMENSIONS.mass),
  bar: unit(1e5, [-1, 1, -2, 0, 0, 0, 0]),
  Wh: unit(3600, [2, 1, -2, 0, 0, 0, 0]),
  in: unit(0.0254, DIMENSIONS.length),
  ft: unit(0.3048, DIMENSIONS.length),
  yd: unit(0.9144, DIMENSIONS.length),
  mi: unit(1609.344, DIMENSIONS.length),
  acre: unit(4046.8564224, [2, 0, 0, 0, 0, 0, 0]),
  gal: unit(0.003785411784, [3, 0, 0, 0, 0, 0, 0]),
  qt: unit(0.000946352946, [3, 0, 0, 0, 0, 0, 0]),
  pt: unit(0.000473176473, [3, 0, 0, 0, 0, 0, 0]),
  lb: unit(0.45359237, DIMENSIONS.mass),
  oz: unit(0.028349523125, DIMENSIONS.mass),
  st: unit(6.35029318, DIMENSIONS.mass),
  mph: unit(0.44704, [1, 0, -1, 0, 0, 0, 0]),
  kt: unit(0.514444444, [1, 0, -1, 0, 0, 0, 0]),
  kine: unit(1e-2, [1, 0, -1, 0, 0, 0, 0]),
  psi: unit(6894.757293168, [-1, 1, -2, 0, 0, 0, 0]),
  atm: unit(101325, [-1, 1, -2, 0, 0, 0, 0]),
  BTU: unit(1055.05585262, [2, 1, -2, 0, 0, 0, 0]),
  hp: unit(745.699871582, [2, 1, -3, 0, 0, 0, 0]),
  Gal: unit(1e-2, [1, 0, -2, 0, 0, 0, 0]),
  mGal: unit(1e-5, [1, 0, -2, 0, 0, 0, 0]),
  "µGal": unit(1e-8, [1, 0, -2, 0, 0, 0, 0]),
  G: unit(9.80665, [1, 0, -2, 0, 0, 0, 0]),
  g0: unit(9.80665, [1, 0, -2, 0, 0, 0, 0]),
  "°C": unit(1, DIMENSIONS.temperature, 273.15),
  "°F": unit(5 / 9, DIMENSIONS.temperature, 255.3722222222222),
  cal: unit(4.184, [2, 1, -2, 0, 0, 0, 0]),
  bpm: unit(1 / 60, [0, 0, -1, 0, 0, 0, 0]),
  rpm: unit(1 / 60, [0, 0, -1, 0, 0, 0, 0]),
  au: unit(1.495978707e11, DIMENSIONS.length),
  ly: unit(9.4607304725808e15, DIMENSIONS.length),
  yr: unit(31557600, DIMENSIONS.time),
  eV: unit(1.602176634e-19, [2, 1, -2, 0, 0, 0, 0]),
};

BASE_UNITS.Hz = unit(1, [0, 0, -1, 0, 0, 0, 0]);
BASE_UNITS.N = unit(1, [1, 1, -2, 0, 0, 0, 0]);
BASE_UNITS.Pa = unit(1, [-1, 1, -2, 0, 0, 0, 0]);
BASE_UNITS.J = unit(1, [2, 1, -2, 0, 0, 0, 0]);
BASE_UNITS.W = unit(1, [2, 1, -3, 0, 0, 0, 0]);
BASE_UNITS.C = unit(1, [0, 0, 1, 1, 0, 0, 0]);
BASE_UNITS.V = unit(1, [2, 1, -3, -1, 0, 0, 0]);
BASE_UNITS.Ohm = unit(1, [2, 1, -3, -2, 0, 0, 0]);
BASE_UNITS["Ω"] = BASE_UNITS.Ohm;
BASE_UNITS.S = unit(1, [-2, -1, 3, 2, 0, 0, 0]);
BASE_UNITS.F = unit(1, [-2, -1, 4, 2, 0, 0, 0]);
BASE_UNITS.Wb = unit(1, [2, 1, -2, -1, 0, 0, 0]);
BASE_UNITS.T = unit(1, [0, 1, -2, -1, 0, 0, 0]);
BASE_UNITS.H = unit(1, [2, 1, -2, -2, 0, 0, 0]);
BASE_UNITS.lm = unit(1, DIMENSIONS.luminousIntensity);
BASE_UNITS.lx = unit(1, [-2, 0, 0, 0, 0, 0, 1]);
BASE_UNITS.Bq = BASE_UNITS.Hz;
BASE_UNITS.Gy = unit(1, [2, 0, -2, 0, 0, 0, 0]);
BASE_UNITS.Sv = BASE_UNITS.Gy;

const PREFIXES: Array<[string, number]> = [
  ["da", 1e1],
  ["Y", 1e24],
  ["Z", 1e21],
  ["E", 1e18],
  ["P", 1e15],
  ["T", 1e12],
  ["G", 1e9],
  ["M", 1e6],
  ["k", 1e3],
  ["h", 1e2],
  ["d", 1e-1],
  ["c", 1e-2],
  ["m", 1e-3],
  ["u", 1e-6],
  ["µ", 1e-6],
  ["μ", 1e-6],
  ["n", 1e-9],
  ["p", 1e-12],
  ["f", 1e-15],
  ["a", 1e-18],
  ["z", 1e-21],
  ["y", 1e-24],
];

const SUPERSCRIPTS: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁻": "-",
};

const toSuperscript = (value: number) =>
  String(value)
    .replace(/-/g, "⁻")
    .replace(/0/g, "⁰")
    .replace(/1/g, "¹")
    .replace(/2/g, "²")
    .replace(/3/g, "³")
    .replace(/4/g, "⁴")
    .replace(/5/g, "⁵")
    .replace(/6/g, "⁶")
    .replace(/7/g, "⁷")
    .replace(/8/g, "⁸")
    .replace(/9/g, "⁹");

const normalize = (input: string) =>
  input
    .trim()
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (character) => SUPERSCRIPTS[character]);

export type MeasuringStandard = "us" | "jis";

/** カップ・大さじ・小さじは、米国基準とJIS規格で値が異なる。設定でまとめて切り替える。 */
const MEASURING_STANDARD_VALUES: Record<MeasuringStandard, { cup: number; tbsp: number; tsp: number }> = {
  us: { cup: 2.365882365e-4, tbsp: 1.478676478125e-5, tsp: 4.92892159375e-6 },
  jis: { cup: 2e-4, tbsp: 1.5e-5, tsp: 5e-6 },
};

let measuringStandard: MeasuringStandard = "us";

export function setMeasuringStandard(standard: MeasuringStandard) {
  measuringStandard = standard;
}

export function getMeasuringStandard(): MeasuringStandard {
  return measuringStandard;
}

// cup/tbsp/tsp（と別表記）は measuringStandard に応じて値が変わるため、BASE_UNITS には固定値を持たせずここで解決する。
const DYNAMIC_VOLUME_ALIASES: Record<string, "cup" | "tbsp" | "tsp"> = {
  cup: "cup",
  cups: "cup",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
};

// UNIT_META の英字の別表記（sec, hour, millisecond など）を、計算にも使える表記として自動登録する。
// ms のように接頭辞から導かれる単位も resolveUnitSymbol で解決してから登録する。
// 日本語の読みなど計算式に入力できない別表記はここでは対象外にする。
const ALIAS_SYMBOL_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/;
Object.entries(UNIT_META).forEach(([symbol, meta]) => {
  if (!meta.aliases || DYNAMIC_VOLUME_ALIASES[symbol]) return;
  let base: UnitDefinition;
  try {
    base = resolveUnitSymbol(symbol);
  } catch {
    return;
  }
  meta.aliases.forEach((alias) => {
    if (!ALIAS_SYMBOL_PATTERN.test(alias) || BASE_UNITS[alias]) return;
    BASE_UNITS[alias] = base;
  });
});

function resolveUnitSymbol(symbol: string): UnitDefinition {
  const dynamicKey = DYNAMIC_VOLUME_ALIASES[symbol];
  if (dynamicKey) return unit(MEASURING_STANDARD_VALUES[measuringStandard][dynamicKey], [3, 0, 0, 0, 0, 0, 0]);

  if (BASE_UNITS[symbol]) return BASE_UNITS[symbol];

  for (const [prefix, scale] of PREFIXES) {
    if (symbol.startsWith(prefix) && symbol.length > prefix.length) {
      const baseSymbol = symbol.slice(prefix.length);
      const base = BASE_UNITS[baseSymbol];
      if (base && baseSymbol !== "kg" && base.offset === undefined) return unit(base.scale * scale, base.dimension);
    }
  }

  throw new UnitError("unsupportedUnit", { symbol });
}

export function parseUnit(input: string): UnitDefinition {
  const source = normalize(input).replace(/\*/g, "·");
  // "無次元"はformatQuantity/formatDimensionが返す無次元ラベルの日本語文言、"dimensionless"は
  // その英語文言。どちらを単位欄に貼り戻しても空単位として解釈できるよう両方を受け付ける。
  if (!source || source === "1" || source === "無次元" || source.toLowerCase() === "dimensionless") return unit(1, ZERO);

  let result = unit(1, ZERO);
  let operation: "multiply" | "divide" = "multiply";
  const factors = source.split(/([/·])/).filter(Boolean);

  for (const factor of factors) {
    if (factor === "·") {
      operation = "multiply";
      continue;
    }
    if (factor === "/") {
      operation = "divide";
      continue;
    }

    const match = factor.match(/^([A-Za-zΩµμ%°]+)(?:\^?(-?\d+))?$/);
    if (!match) throw new UnitError("unparsableUnitFormat", { input });
    const [, symbol, rawPower] = match;
    const power = rawPower ? Number(rawPower) : 1;
    const resolved = resolveUnitSymbol(symbol);
    if (resolved.offset !== undefined && (power !== 1 || factors.length !== 1)) throw new UnitError("temperatureUnitStandalone");
    if (resolved.offset !== undefined) {
      result = resolved;
      continue;
    }
    const powered = unit(resolved.scale ** power, powerDimension(resolved.dimension, power), resolved.offset);
    result = operation === "multiply" ? multipliedUnit(result, powered) : dividedUnit(result, powered);
  }

  return result;
}

export function getUnitRegistration(input: string): UnitRegistration {
  const source = input.trim();
  if (!source) return { status: "unknown" };
  const found = findRegisteredUnit(source);
  if (found) return { status: "registered", group: found.group, unit: found.unit, canonical: found.unit.symbol, matchedAlias: found.matchedAlias };
  try {
    parseUnit(source);
    return { status: "supported" };
  } catch {
    return { status: "unknown" };
  }
}

function quantity(value: number, dimension: Dimension = ZERO): Quantity {
  if (!Number.isFinite(value)) throw new UnitError("nonFiniteNumber");
  return { siValue: value, dimension: [...dimension] as Dimension };
}

function add(left: Quantity, right: Quantity): Quantity {
  if (!sameDimension(left.dimension, right.dimension)) {
    throw new UnitError("dimensionMismatchAddSubtract");
  }
  return quantity(left.siValue + right.siValue, left.dimension);
}

function subtract(left: Quantity, right: Quantity): Quantity {
  if (!sameDimension(left.dimension, right.dimension)) {
    throw new UnitError("dimensionMismatchAddSubtract");
  }
  return quantity(left.siValue - right.siValue, left.dimension);
}

function multiply(left: Quantity, right: Quantity): Quantity {
  return quantity(left.siValue * right.siValue, multiplyDimensions(left.dimension, right.dimension));
}

function divide(left: Quantity, right: Quantity): Quantity {
  if (right.siValue === 0) throw new UnitError("divideByZero");
  return quantity(left.siValue / right.siValue, divideDimensions(left.dimension, right.dimension));
}

function exponentiate(base: Quantity, exponent: Quantity): Quantity {
  if (!isDimensionless(exponent.dimension)) throw new UnitError("exponentMustBeDimensionless");
  if (!Number.isFinite(exponent.siValue)) throw new UnitError("exponentMustBeFinite");
  if (base.siValue < 0 && !Number.isInteger(exponent.siValue)) throw new UnitError("negativeBaseRequiresIntegerExponent");
  if (!isDimensionless(base.dimension) && !Number.isInteger(exponent.siValue)) {
    throw new UnitError("unitValueRequiresIntegerExponent");
  }
  return quantity(base.siValue ** exponent.siValue, powerDimension(base.dimension, exponent.siValue));
}

function squareRoot(input: Quantity): Quantity {
  if (input.siValue < 0) throw new UnitError("negativeSquareRoot");
  if (input.dimension.some((power) => power % 2 !== 0)) throw new UnitError("squareRootRequiresEvenDimension");
  return quantity(Math.sqrt(input.siValue), input.dimension.map((power) => power / 2) as Dimension);
}

function applyMathFunction(name: string, input: Quantity): Quantity {
  if (name === "sqrt") return squareRoot(input);
  if (!isDimensionless(input.dimension)) throw new UnitError("functionArgMustBeDimensionless", { name });
  if (["asin", "acos"].includes(name) && (input.siValue < -1 || input.siValue > 1)) {
    throw new UnitError("functionArgOutOfRange", { name });
  }
  if (["ln", "log", "log2"].includes(name) && input.siValue <= 0) {
    throw new UnitError("functionArgMustBePositive", { name });
  }
  const functions: Record<string, (value: number) => number> = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    ln: Math.log, log: Math.log10, log2: Math.log2,
  };
  const evaluator = functions[name];
  if (!evaluator) throw new UnitError("unsupportedFunction", { name });
  return quantity(evaluator(input.siValue));
}

function isUnitStart(character: string | undefined) {
  return Boolean(character && /[A-Za-zΩµμ%°]/.test(character));
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const source = normalize(input);
  let index = 0;

  while (index < source.length) {
    const current = source[index];
    if (/\s/.test(current)) {
      index += 1;
      continue;
    }

    if (/[+\-*/^]/.test(current)) {
      tokens.push({ type: "operator", value: current as "+" | "-" | "*" | "/" | "^" });
      index += 1;
      continue;
    }
    if (current === "(") {
      tokens.push({ type: "leftParen" });
      index += 1;
      continue;
    }
    if (current === ")") {
      tokens.push({ type: "rightParen" });
      index += 1;
      continue;
    }
    if (current === ",") {
      tokens.push({ type: "comma" });
      index += 1;
      continue;
    }

    const numberMatch = source.slice(index).match(NUMBER_TOKEN_PATTERN);
    if (numberMatch) {
      const numericValue = Number(numberMatch[0]);
      index += numberMatch[0].length;

      const whitespaceStart = index;
      while (/\s/.test(source[index] ?? "")) index += 1;
      if (isUnitStart(source[index])) {
        const unitStart = index;
        while (/[A-Za-zΩµμ%°0-9^*/]/.test(source[index] ?? "")) {
          if (
            (source[index] === "/" || source[index] === "*") &&
            !isUnitStart(source[index + 1])
          ) {
            break;
          }
          index += 1;
        }
        const unitText = source.slice(unitStart, index);
        const parsed = parseUnit(unitText);
        tokens.push({ type: "quantity", value: quantity(numericValue * parsed.scale + (parsed.offset ?? 0), parsed.dimension) });
      } else {
        index = whitespaceStart;
        tokens.push({ type: "quantity", value: quantity(numericValue) });
      }
      continue;
    }

    const identifierMatch = source.slice(index).match(IDENTIFIER_PATTERN);
    if (identifierMatch) {
      tokens.push({ type: "identifier", value: identifierMatch[0] });
      index += identifierMatch[0].length;
      continue;
    }

    if (current === "Ω" || current === "%" || current === "°") {
      tokens.push({ type: "identifier", value: current });
      index += 1;
      continue;
    }

    throw new UnitError("unparsableCharacter", { character: current });
  }

  return tokens;
}

export function evaluateExpression(
  input: string,
  constants: SavedConstant[] = [],
  customFunctions: CustomFunctionDefinition[] = [],
  activeFunctionNames: string[] = [],
): Quantity {
  const tokens = tokenize(input);
  if (!tokens.length) throw new UnitError("emptyExpression");
  const constantMap = new Map(constants.map((item) => [item.symbol, item.quantity]));
  let position = 0;

  const parsePrimary = (): Quantity => {
    const token = tokens[position];
    if (!token) throw new UnitError("unexpectedEndOfExpression");
    if (token.type === "operator" && (token.value === "+" || token.value === "-")) {
      position += 1;
      const inner = parsePrimary();
      return token.value === "-" ? quantity(-inner.siValue, inner.dimension) : inner;
    }
    if (token.type === "quantity") {
      position += 1;
      return token.value;
    }
    if (token.type === "identifier") {
      position += 1;
      const constant = constantMap.get(token.value);
      if (constant) return constant;
      const customFunction = customFunctions.find((item) => item.name === token.value);
      if (customFunction && tokens[position]?.type === "leftParen") {
        if (activeFunctionNames.includes(customFunction.name)) throw new UnitError("recursiveCustomFunction", { name: customFunction.name });
        position += 1;
        const argumentsList: Quantity[] = [];
        if (tokens[position]?.type !== "rightParen") {
          while (true) {
            argumentsList.push(parseAddSubtract());
            if (tokens[position]?.type !== "comma") break;
            position += 1;
          }
        }
        if (tokens[position]?.type !== "rightParen") throw new UnitError("customFunctionMissingClosingParen", { name: customFunction.name });
        position += 1;
        if (argumentsList.length !== customFunction.parameters.length) {
          throw new UnitError("customFunctionArgumentCountMismatch", { name: customFunction.name, count: customFunction.parameters.length });
        }
        const parameterConstants: SavedConstant[] = customFunction.parameters.map((symbol, index) => ({
          symbol,
          expression: "",
          quantity: argumentsList[index],
          createdAt: "",
        }));
        return evaluateExpression(customFunction.expression, [...constants, ...parameterConstants], customFunctions, [...activeFunctionNames, customFunction.name]);
      }
      if (token.value === "atan2") {
        if (tokens[position]?.type !== "leftParen") throw new UnitError("atan2MissingOpenParen");
        position += 1;
        const y = parseAddSubtract();
        if (tokens[position]?.type !== "comma") throw new UnitError("atan2MissingComma");
        position += 1;
        const x = parseAddSubtract();
        if (tokens[position]?.type !== "rightParen") throw new UnitError("atan2MissingClosingParen");
        position += 1;
        if (!sameDimension(y.dimension, x.dimension)) throw new UnitError("atan2DimensionMismatch");
        return quantity(Math.atan2(y.siValue, x.siValue));
      }
      if (["sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "ln", "log", "log2"].includes(token.value)) {
        if (tokens[position]?.type !== "leftParen") throw new UnitError("functionMissingOpenParen", { name: token.value });
        position += 1;
        const inner = parseAddSubtract();
        if (tokens[position]?.type !== "rightParen") throw new UnitError("functionMissingClosingParen", { name: token.value });
        position += 1;
        return applyMathFunction(token.value, inner);
      }
      // πは識別子として使える文字なので、normalize()で"pi"へ書き換えずそのままトークン化する
      // （書き換えてしまうと、ユーザーが「π = 3」と定義しても定数表の引き当てに失敗し、
      // 円周率で上書きされてしまう）。定義が無いときだけ、ここで円周率として解決する。
      if (token.value === "pi" || token.value === "π") return quantity(Math.PI);
      if (token.value === "e") return quantity(Math.E);
      try {
        const parsed = parseUnit(token.value);
        return quantity(parsed.scale, parsed.dimension);
      } catch {
        throw new UnitError("unknownIdentifier", { name: token.value });
      }
    }
    if (token.type === "leftParen") {
      position += 1;
      const inner = parseAddSubtract();
      if (tokens[position]?.type !== "rightParen") throw new UnitError("missingClosingParen");
      position += 1;
      return inner;
    }
    throw new UnitError("invalidExpressionSyntax");
  };

  const parsePower = (): Quantity => {
    const left = parsePrimary();
    const nextToken = tokens[position];
    if (nextToken?.type === "operator" && nextToken.value === "^") {
      position += 1;
      return exponentiate(left, parsePower());
    }
    return left;
  };

  const parseMultiplyDivide = (): Quantity => {
    let left = parsePower();
    while (true) {
      const nextToken = tokens[position];
      if (!nextToken || nextToken.type !== "operator" || !["*", "/"].includes(nextToken.value)) break;
      const operator = nextToken.value;
      position += 1;
      const right = parsePower();
      left = operator === "*" ? multiply(left, right) : divide(left, right);
    }
    return left;
  };

  const parseAddSubtract = (): Quantity => {
    let left = parseMultiplyDivide();
    while (true) {
      const nextToken = tokens[position];
      if (!nextToken || nextToken.type !== "operator" || !["+", "-"].includes(nextToken.value)) break;
      const operator = nextToken.value;
      position += 1;
      const right = parseMultiplyDivide();
      left = operator === "+" ? add(left, right) : subtract(left, right);
    }
    return left;
  };

  const result = parseAddSubtract();
  if (position !== tokens.length) throw new UnitError("invalidExpressionSyntax");
  return result;
}

const CONSTANT_DEFINITION_PATTERN = new RegExp(`^([${IDENTIFIER_START_CHAR_CLASS}][${IDENTIFIER_BODY_CHAR_CLASS}]*)\\s*=\\s*(.+)$`);

export function parseConstantDefinition(input: string, constants: SavedConstant[] = []) {
  const match = input.trim().match(CONSTANT_DEFINITION_PATTERN);
  if (!match) throw new UnitError("invalidConstantDefinitionFormat");
  const [, symbol, expression] = match;
  return { symbol, expression, quantity: evaluateExpression(expression, constants) };
}

export function formatNumber(value: number): string {
  if (Object.is(value, -0)) return "0";
  if (value === 0) return "0";
  if (Math.abs(value) >= 1e7 || Math.abs(value) < 1e-6) return value.toExponential(6).replace(/\.?(0+)e/, "e");
  return Number(value.toPrecision(10)).toString();
}

export function formatNumberForLocale(value: number, locale?: string): string {
  if (!locale || Math.abs(value) >= 1e7 || (Math.abs(value) < 1e-6 && value !== 0)) return formatNumber(value);
  return new Intl.NumberFormat(locale, { maximumSignificantDigits: 10, useGrouping: false }).format(Object.is(value, -0) ? 0 : value);
}

// dimension・localeから組み立てる文字列自体は無次元かどうかの判定に使わず、
// isDimensionless(dimension)を直接見て判定する（言語によって文言が変わるため、
// 以前のような「戻り値の文字列が"無次元"かどうかを比較する」実装だと英語UIで壊れる）。
export function formatDimension(dimension: Dimension, locale?: string): string {
  const labels = ["m", "kg", "s", "A", "K", "mol", "cd"];
  const numerator: string[] = [];
  const denominator: string[] = [];
  dimension.forEach((power, index) => {
    if (power > 0) numerator.push(`${labels[index]}${power === 1 ? "" : toSuperscript(power)}`);
    if (power < 0) denominator.push(`${labels[index]}${power === -1 ? "" : toSuperscript(-power)}`);
  });
  if (!numerator.length && !denominator.length) return dimensionlessLabel(languageFromLocale(locale));
  if (!denominator.length) return numerator.join("·");
  return `${numerator.length ? numerator.join("·") : "1"}/${denominator.join("·")}`;
}

export function convertQuantity(input: Quantity, targetUnit: string, locale?: string): { value: number; unit: string } {
  const parsed = parseUnit(targetUnit);
  if (!sameDimension(input.dimension, parsed.dimension)) {
    throw new UnitError("incompatibleTargetUnit", { targetUnit });
  }
  return { value: (input.siValue - (parsed.offset ?? 0)) / parsed.scale, unit: targetUnit.trim() || dimensionlessLabel(languageFromLocale(locale)) };
}

export function formatQuantity(input: Quantity, targetUnit?: string, locale?: string): string {
  if (targetUnit?.trim()) {
    const converted = convertQuantity(input, targetUnit, locale);
    return `${formatNumberForLocale(converted.value, locale)} ${converted.unit}`;
  }
  if (isDimensionless(input.dimension)) return formatNumberForLocale(input.siValue, locale);
  return `${formatNumberForLocale(input.siValue, locale)} ${formatDimension(input.dimension, locale)}`;
}

export function hasSameDimension(left: Quantity, right: Quantity) {
  return sameDimension(left.dimension, right.dimension);
}

export function getCompatibleUnitGroups(dimension: Dimension): UnitGroup[] {
  return UNIT_GROUPS.filter((group) => sameDimension(group.dimension, dimension));
}

const REGIONAL_PRIORITY: Record<UnitSystem, Record<string, string[]>> = {
  metric: { length: ["m", "km", "cm", "mm"], area: ["m²", "km²", "cm²"], volume: ["L", "mL", "m³"], mass: ["kg", "g", "mg"], temperature: ["°C", "K"], velocity: ["m/s", "km/h", "cm/s", "kine", "kt"], acceleration: ["m/s²", "Gal", "mGal", "G"], pressure: ["Pa", "kPa", "bar"], energy: ["J", "kJ", "Wh"], power: ["W", "kW"] },
  // areaMomentOfInertia のみ、既存グループと違って米国式(in⁴)を先頭にする実益があるため追加する。
  // それ以外の新規グループ（density/resistance/charge/capacitance/magneticFlux/springConstant/
  // specificHeatCapacity/molarMass/molarEnergy/molarConcentration）は地域ごとの慣用単位が
  // 存在しない（SI単位のみ）ため、あえて優先度を設定しない。未設定でも getRegionalUnits は
  // `?? []` で空配列にフォールバックし、そのままgroup.units全件を返すため壊れない。
  us: { length: ["in", "ft", "yd", "mi"], area: ["in²", "ft²", "yd²", "acre"], volume: ["gal", "qt", "pt"], mass: ["lb", "oz"], temperature: ["°F"], velocity: ["mph", "ft/s", "kt", "m/s"], acceleration: ["ft/s²", "G", "m/s²", "Gal", "mGal"], pressure: ["psi", "atm"], energy: ["BTU", "Wh"], power: ["hp", "W"], areaMomentOfInertia: ["in⁴", "mm⁴", "cm⁴", "m⁴"] },
  uk: { length: ["mm", "m", "km", "mi"], area: ["m²", "acre"], volume: ["L", "pt"], mass: ["kg", "st", "lb"], temperature: ["°C"], velocity: ["mph", "km/h", "kt", "m/s"], acceleration: ["m/s²", "G", "Gal"], pressure: ["bar", "psi"], energy: ["kJ", "Wh"], power: ["kW", "hp"] },
};

/** 地域の優先単位を先頭に置きつつ、そのカテゴリの全単位を返す。 */
export function getGroupUnitsForSystem(group: UnitGroup, system: UnitSystem): UnitOption[] {
  const prioritized = getRegionalUnits(group, system);
  const rest = group.units.filter((unitOption) => !prioritized.includes(unitOption));
  return [...prioritized, ...rest];
}

export function getRegionalUnits(group: UnitGroup, system: UnitSystem): UnitOption[] {
  const priority = REGIONAL_PRIORITY[system][group.id] ?? [];
  const selected = priority.map((symbol) => group.units.find((unitOption) => unitOption.symbol === symbol)).filter((unitOption): unitOption is UnitOption => Boolean(unitOption));
  return selected.length ? selected : group.units;
}

export type UnitSearchResult = { group: UnitGroup; unit: UnitOption };

export function searchUnitOptions(query: string, system: UnitSystem, limit = 12): UnitSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const results = UNIT_GROUPS.flatMap((group) => getRegionalUnits(group, system).map((unitOption) => ({ group, unit: unitOption })))
    .filter(({ group, unit: unitOption }) => unitSearchText(group, unitOption).includes(normalized));
  return results.slice(0, limit);
}
