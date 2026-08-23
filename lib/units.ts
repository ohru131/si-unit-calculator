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
  name?: { en: string; ja: string };
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
  { id: "length", label: "長さ", dimension: DIMENSIONS.length, units: [{ symbol: "m", label: "m" }, { symbol: "km", label: "km" }, { symbol: "cm", label: "cm" }, { symbol: "mm", label: "mm" }, { symbol: "µm", label: "µm" }, { symbol: "in", label: "in" }, { symbol: "ft", label: "ft" }, { symbol: "yd", label: "yd" }, { symbol: "mi", label: "mi" }] },
  { id: "area", label: "面積", dimension: [2, 0, 0, 0, 0, 0, 0], units: [{ symbol: "m²", label: "m²" }, { symbol: "km²", label: "km²" }, { symbol: "cm²", label: "cm²" }, { symbol: "mm²", label: "mm²" }, { symbol: "in²", label: "in²" }, { symbol: "ft²", label: "ft²" }, { symbol: "yd²", label: "yd²" }, { symbol: "acre", label: "acre" }] },
  { id: "volume", label: "体積", dimension: [3, 0, 0, 0, 0, 0, 0], units: [{ symbol: "m³", label: "m³" }, { symbol: "L", label: "L" }, { symbol: "mL", label: "mL" }, { symbol: "cm³", label: "cm³" }, { symbol: "gal", label: "gal" }, { symbol: "qt", label: "qt" }, { symbol: "pt", label: "pt" }] },
  { id: "time", label: "時間", dimension: DIMENSIONS.time, units: [{ symbol: "s", label: "s" }, { symbol: "ms", label: "ms" }, { symbol: "min", label: "min" }, { symbol: "h", label: "h" }, { symbol: "d", label: "d" }] },
  { id: "mass", label: "質量", dimension: DIMENSIONS.mass, units: [{ symbol: "kg", label: "kg" }, { symbol: "g", label: "g" }, { symbol: "mg", label: "mg" }, { symbol: "t", label: "t" }, { symbol: "lb", label: "lb" }, { symbol: "oz", label: "oz" }, { symbol: "st", label: "st" }] },
  { id: "temperature", label: "温度", dimension: DIMENSIONS.temperature, units: [{ symbol: "K", label: "K" }, { symbol: "°C", label: "°C" }, { symbol: "°F", label: "°F" }] },
  { id: "velocity", label: "速度", dimension: [1, 0, -1, 0, 0, 0, 0], units: [{ symbol: "m/s", label: "m/s" }, { symbol: "km/s", label: "km/s" }, { symbol: "m/min", label: "m/min" }, { symbol: "km/min", label: "km/min" }, { symbol: "m/h", label: "m/h" }, { symbol: "km/h", label: "km/h" }, { symbol: "cm/s", label: "cm/s" }, { symbol: "kine", label: "kine" }, { symbol: "ft/s", label: "ft/s" }, { symbol: "mph", label: "mph" }, { symbol: "kt", label: "kt" }] },
  { id: "acceleration", label: "加速度", dimension: [1, 0, -2, 0, 0, 0, 0], units: [{ symbol: "m/s²", label: "m/s²" }, { symbol: "cm/s²", label: "cm/s²" }, { symbol: "Gal", label: "Gal (gal)" }, { symbol: "mGal", label: "mGal" }, { symbol: "µGal", label: "µGal" }, { symbol: "G", label: "G (標準重力)" }, { symbol: "ft/s²", label: "ft/s²" }] },
  { id: "force", label: "力", dimension: [1, 1, -2, 0, 0, 0, 0], units: [{ symbol: "N", label: "N" }, { symbol: "kN", label: "kN" }] },
  { id: "pressure", label: "圧力", dimension: [-1, 1, -2, 0, 0, 0, 0], units: [{ symbol: "Pa", label: "Pa" }, { symbol: "kPa", label: "kPa" }, { symbol: "MPa", label: "MPa" }, { symbol: "bar", label: "bar" }, { symbol: "psi", label: "psi" }, { symbol: "atm", label: "atm" }] },
  { id: "energy", label: "エネルギー", dimension: [2, 1, -2, 0, 0, 0, 0], units: [{ symbol: "J", label: "J" }, { symbol: "kJ", label: "kJ" }, { symbol: "Wh", label: "Wh" }, { symbol: "BTU", label: "BTU" }] },
  { id: "power", label: "電力", dimension: [2, 1, -3, 0, 0, 0, 0], units: [{ symbol: "W", label: "W" }, { symbol: "kW", label: "kW" }, { symbol: "MW", label: "MW" }, { symbol: "hp", label: "hp" }] },
  { id: "current", label: "電流", dimension: DIMENSIONS.current, units: [{ symbol: "A", label: "A" }, { symbol: "mA", label: "mA" }, { symbol: "µA", label: "µA" }] },
  { id: "voltage", label: "電圧", dimension: [2, 1, -3, -1, 0, 0, 0], units: [{ symbol: "V", label: "V" }, { symbol: "mV", label: "mV" }, { symbol: "kV", label: "kV" }] },
  { id: "frequency", label: "周波数", dimension: [0, 0, -1, 0, 0, 0, 0], units: [{ symbol: "Hz", label: "Hz" }, { symbol: "kHz", label: "kHz" }, { symbol: "MHz", label: "MHz" }] },
  { id: "angle", label: "角度", dimension: ZERO, units: [{ symbol: "rad", label: "rad" }, { symbol: "deg", label: "deg" }, { symbol: "°", label: "°" }] },
  { id: "ratio", label: "割合・無次元", dimension: ZERO, units: [{ symbol: "%", label: "%" }, { symbol: "ppm", label: "ppm" }] },
];

type UnitMeta = { aliases?: string[]; name?: { en: string; ja: string } };

/**
 * 記号だけでは伝わりにくい単位に読みと別表記を添える。
 * aliases は入力の表記ゆれ検索・修正候補に使い、name は候補一覧の説明に使う。
 */
const UNIT_META: Record<string, UnitMeta> = {
  m: { aliases: ["meter", "metre", "meters", "メートル"], name: { en: "meter", ja: "メートル" } },
  km: { aliases: ["kilometer", "kilometre", "kilometers", "キロメートル"], name: { en: "kilometer", ja: "キロメートル" } },
  cm: { aliases: ["centimeter", "centimetre", "centimeters", "センチメートル"], name: { en: "centimeter", ja: "センチメートル" } },
  mm: { aliases: ["millimeter", "millimetre", "millimeters", "ミリメートル"], name: { en: "millimeter", ja: "ミリメートル" } },
  "µm": { aliases: ["um", "micrometer", "micron", "マイクロメートル"], name: { en: "micrometer", ja: "マイクロメートル" } },
  in: { aliases: ["inch", "inches", "インチ"], name: { en: "inch", ja: "インチ" } },
  ft: { aliases: ["foot", "feet", "フィート"], name: { en: "foot", ja: "フィート" } },
  yd: { aliases: ["yard", "yards", "ヤード"], name: { en: "yard", ja: "ヤード" } },
  mi: { aliases: ["mile", "miles", "マイル"], name: { en: "mile", ja: "マイル" } },
  "m²": { aliases: ["m2", "m^2", "sqm", "平方メートル"], name: { en: "square meter", ja: "平方メートル" } },
  "km²": { aliases: ["km2", "km^2", "平方キロメートル"], name: { en: "square kilometer", ja: "平方キロメートル" } },
  "cm²": { aliases: ["cm2", "cm^2", "平方センチメートル"], name: { en: "square centimeter", ja: "平方センチメートル" } },
  "mm²": { aliases: ["mm2", "mm^2", "平方ミリメートル"], name: { en: "square millimeter", ja: "平方ミリメートル" } },
  "in²": { aliases: ["in2", "in^2", "sqin", "平方インチ"], name: { en: "square inch", ja: "平方インチ" } },
  "ft²": { aliases: ["ft2", "ft^2", "sqft", "平方フィート"], name: { en: "square foot", ja: "平方フィート" } },
  "yd²": { aliases: ["yd2", "yd^2", "平方ヤード"], name: { en: "square yard", ja: "平方ヤード" } },
  acre: { aliases: ["acres", "エーカー"], name: { en: "acre", ja: "エーカー" } },
  "m³": { aliases: ["m3", "m^3", "立方メートル"], name: { en: "cubic meter", ja: "立方メートル" } },
  L: { aliases: ["l", "liter", "litre", "liters", "リットル"], name: { en: "liter", ja: "リットル" } },
  mL: { aliases: ["ml", "milliliter", "millilitre", "ミリリットル"], name: { en: "milliliter", ja: "ミリリットル" } },
  "cm³": { aliases: ["cm3", "cm^3", "cc", "立方センチメートル"], name: { en: "cubic centimeter", ja: "立方センチメートル" } },
  gal: { aliases: ["gallon", "gallons", "ガロン"], name: { en: "gallon", ja: "ガロン" } },
  qt: { aliases: ["quart", "quarts", "クォート"], name: { en: "quart", ja: "クォート" } },
  pt: { aliases: ["pint", "pints", "パイント"], name: { en: "pint", ja: "パイント" } },
  s: { aliases: ["sec", "secs", "second", "seconds", "秒"], name: { en: "second", ja: "秒" } },
  ms: { aliases: ["msec", "msecs", "millisecond", "milliseconds", "ミリ秒"], name: { en: "millisecond", ja: "ミリ秒" } },
  min: { aliases: ["mins", "minute", "minutes", "分"], name: { en: "minute", ja: "分" } },
  h: { aliases: ["hr", "hrs", "hour", "hours", "時間"], name: { en: "hour", ja: "時間" } },
  d: { aliases: ["day", "days", "日"], name: { en: "day", ja: "日" } },
  kg: { aliases: ["kilogram", "kilograms", "キログラム"], name: { en: "kilogram", ja: "キログラム" } },
  g: { aliases: ["gram", "grams", "グラム"], name: { en: "gram", ja: "グラム" } },
  mg: { aliases: ["milligram", "milligrams", "ミリグラム"], name: { en: "milligram", ja: "ミリグラム" } },
  t: { aliases: ["ton", "tonne", "tons", "トン"], name: { en: "tonne", ja: "トン" } },
  lb: { aliases: ["lbs", "pound", "pounds", "ポンド"], name: { en: "pound", ja: "ポンド" } },
  oz: { aliases: ["ounce", "ounces", "オンス"], name: { en: "ounce", ja: "オンス" } },
  st: { aliases: ["stone", "stones", "ストーン"], name: { en: "stone", ja: "ストーン" } },
  K: { aliases: ["kelvin", "ケルビン"], name: { en: "kelvin", ja: "ケルビン" } },
  "°C": { aliases: ["degC", "celsius", "摂氏"], name: { en: "degree Celsius", ja: "摂氏" } },
  "°F": { aliases: ["degF", "fahrenheit", "華氏"], name: { en: "degree Fahrenheit", ja: "華氏" } },
  "m/s": { aliases: ["m/sec", "mps", "メートル毎秒"], name: { en: "meter per second", ja: "メートル毎秒" } },
  "km/h": { aliases: ["km/hr", "km/hour", "kph", "kmh", "キロメートル毎時"], name: { en: "kilometer per hour", ja: "キロメートル毎時" } },
  "m/min": { aliases: ["m/minute", "メートル毎分"], name: { en: "meter per minute", ja: "メートル毎分" } },
  "km/min": { aliases: ["キロメートル毎分"], name: { en: "kilometer per minute", ja: "キロメートル毎分" } },
  "km/s": { aliases: ["km/sec", "キロメートル毎秒"], name: { en: "kilometer per second", ja: "キロメートル毎秒" } },
  "m/h": { aliases: ["m/hr", "m/hour", "メートル毎時"], name: { en: "meter per hour", ja: "メートル毎時" } },
  "cm/s": { aliases: ["cm/sec", "センチメートル毎秒"], name: { en: "centimeter per second", ja: "センチメートル毎秒" } },
  "ft/s": { aliases: ["ft/sec", "fps", "フィート毎秒"], name: { en: "foot per second", ja: "フィート毎秒" } },
  mph: { aliases: ["mi/h", "mi/hr", "マイル毎時"], name: { en: "mile per hour", ja: "マイル毎時" } },
  kt: { aliases: ["knot", "knots", "ノット"], name: { en: "knot", ja: "ノット" } },
  "m/s²": { aliases: ["m/s2", "m/s^2", "メートル毎秒毎秒"], name: { en: "meter per second squared", ja: "メートル毎秒毎秒" } },
  "cm/s²": { aliases: ["cm/s2", "cm/s^2"], name: { en: "centimeter per second squared", ja: "センチメートル毎秒毎秒" } },
  "ft/s²": { aliases: ["ft/s2", "ft/s^2"], name: { en: "foot per second squared", ja: "フィート毎秒毎秒" } },
  N: { aliases: ["newton", "newtons", "ニュートン"], name: { en: "newton", ja: "ニュートン" } },
  kN: { aliases: ["kilonewton", "キロニュートン"], name: { en: "kilonewton", ja: "キロニュートン" } },
  Pa: { aliases: ["pascal", "pascals", "パスカル"], name: { en: "pascal", ja: "パスカル" } },
  kPa: { aliases: ["kilopascal", "キロパスカル"], name: { en: "kilopascal", ja: "キロパスカル" } },
  MPa: { aliases: ["megapascal", "メガパスカル"], name: { en: "megapascal", ja: "メガパスカル" } },
  bar: { aliases: ["bars", "バール"], name: { en: "bar", ja: "バール" } },
  psi: { aliases: ["lbf/in²"], name: { en: "pound per square inch", ja: "重量ポンド毎平方インチ" } },
  atm: { aliases: ["atmosphere", "気圧"], name: { en: "standard atmosphere", ja: "気圧" } },
  J: { aliases: ["joule", "joules", "ジュール"], name: { en: "joule", ja: "ジュール" } },
  kJ: { aliases: ["kilojoule", "キロジュール"], name: { en: "kilojoule", ja: "キロジュール" } },
  Wh: { aliases: ["watthour", "ワット時"], name: { en: "watt hour", ja: "ワット時" } },
  BTU: { aliases: ["btu"], name: { en: "British thermal unit", ja: "英熱量" } },
  W: { aliases: ["watt", "watts", "ワット"], name: { en: "watt", ja: "ワット" } },
  kW: { aliases: ["kilowatt", "キロワット"], name: { en: "kilowatt", ja: "キロワット" } },
  MW: { aliases: ["megawatt", "メガワット"], name: { en: "megawatt", ja: "メガワット" } },
  hp: { aliases: ["horsepower", "馬力"], name: { en: "horsepower", ja: "馬力" } },
  A: { aliases: ["amp", "ampere", "amps", "アンペア"], name: { en: "ampere", ja: "アンペア" } },
  mA: { aliases: ["milliamp", "milliampere", "ミリアンペア"], name: { en: "milliampere", ja: "ミリアンペア" } },
  "µA": { aliases: ["uA", "microampere", "マイクロアンペア"], name: { en: "microampere", ja: "マイクロアンペア" } },
  V: { aliases: ["volt", "volts", "ボルト"], name: { en: "volt", ja: "ボルト" } },
  mV: { aliases: ["millivolt", "ミリボルト"], name: { en: "millivolt", ja: "ミリボルト" } },
  kV: { aliases: ["kilovolt", "キロボルト"], name: { en: "kilovolt", ja: "キロボルト" } },
  Hz: { aliases: ["hertz", "ヘルツ"], name: { en: "hertz", ja: "ヘルツ" } },
  kHz: { aliases: ["kilohertz", "キロヘルツ"], name: { en: "kilohertz", ja: "キロヘルツ" } },
  MHz: { aliases: ["megahertz", "メガヘルツ"], name: { en: "megahertz", ja: "メガヘルツ" } },
  rad: { aliases: ["radian", "radians", "ラジアン"], name: { en: "radian", ja: "ラジアン" } },
  deg: { aliases: ["degree", "degrees", "度"], name: { en: "degree", ja: "度" } },
  "°": { aliases: ["degree", "度"], name: { en: "degree", ja: "度" } },
  "%": { aliases: ["percent", "パーセント"], name: { en: "percent", ja: "パーセント" } },
  ppm: { aliases: ["partspermillion", "百万分率"], name: { en: "parts per million", ja: "百万分率" } },
  Gal: { aliases: ["gal(acceleration)"], name: { en: "gal", ja: "ガル" } },
  mGal: { name: { en: "milligal", ja: "ミリガル" } },
  "µGal": { aliases: ["uGal"], name: { en: "microgal", ja: "マイクロガル" } },
  G: { aliases: ["g0"], name: { en: "standard gravity", ja: "標準重力" } },
  kine: { name: { en: "kine", ja: "カイン" } },
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
  return [group.id, group.label, unitOption.symbol, unitOption.label, unitOption.name?.en, unitOption.name?.ja, ...(unitOption.aliases ?? [])].filter(Boolean).join(" ").toLowerCase();
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
    .replace(/π/g, "pi")
    .replace(/\s+/g, " ")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (character) => SUPERSCRIPTS[character]);

// UNIT_META の英字の別表記（sec, hour, millisecond など）を、計算にも使える表記として自動登録する。
// ms のように接頭辞から導かれる単位も resolveUnitSymbol で解決してから登録する。
// 日本語の読みなど計算式に入力できない別表記はここでは対象外にする。
const ALIAS_SYMBOL_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/;
Object.entries(UNIT_META).forEach(([symbol, meta]) => {
  if (!meta.aliases) return;
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
  if (BASE_UNITS[symbol]) return BASE_UNITS[symbol];

  for (const [prefix, scale] of PREFIXES) {
    if (symbol.startsWith(prefix) && symbol.length > prefix.length) {
      const baseSymbol = symbol.slice(prefix.length);
      const base = BASE_UNITS[baseSymbol];
      if (base && baseSymbol !== "kg" && base.offset === undefined) return unit(base.scale * scale, base.dimension);
    }
  }

  throw new Error(`未対応の単位「${symbol}」です。`);
}

export function parseUnit(input: string): UnitDefinition {
  const source = normalize(input).replace(/\*/g, "·");
  if (!source || source === "1" || source === "無次元") return unit(1, ZERO);

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
    if (!match) throw new Error(`単位「${input}」の書式を解釈できません。`);
    const [, symbol, rawPower] = match;
    const power = rawPower ? Number(rawPower) : 1;
    const resolved = resolveUnitSymbol(symbol);
    if (resolved.offset !== undefined && (power !== 1 || factors.length !== 1)) throw new Error("摂氏・華氏は単独の温度値として入力してください。");
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
  if (!Number.isFinite(value)) throw new Error("有限の数値を入力してください。");
  return { siValue: value, dimension: [...dimension] as Dimension };
}

function add(left: Quantity, right: Quantity): Quantity {
  if (!sameDimension(left.dimension, right.dimension)) {
    throw new Error("加算・減算できるのは同じ次元の値だけです。");
  }
  return quantity(left.siValue + right.siValue, left.dimension);
}

function subtract(left: Quantity, right: Quantity): Quantity {
  if (!sameDimension(left.dimension, right.dimension)) {
    throw new Error("加算・減算できるのは同じ次元の値だけです。");
  }
  return quantity(left.siValue - right.siValue, left.dimension);
}

function multiply(left: Quantity, right: Quantity): Quantity {
  return quantity(left.siValue * right.siValue, multiplyDimensions(left.dimension, right.dimension));
}

function divide(left: Quantity, right: Quantity): Quantity {
  if (right.siValue === 0) throw new Error("0では割れません。");
  return quantity(left.siValue / right.siValue, divideDimensions(left.dimension, right.dimension));
}

function exponentiate(base: Quantity, exponent: Quantity): Quantity {
  if (!isDimensionless(exponent.dimension)) throw new Error("べき指数は無次元の値にしてください。");
  if (!Number.isFinite(exponent.siValue)) throw new Error("べき指数は有限の数値にしてください。");
  if (base.siValue < 0 && !Number.isInteger(exponent.siValue)) throw new Error("負の値には整数のべき指数だけを使用できます。");
  if (!isDimensionless(base.dimension) && !Number.isInteger(exponent.siValue)) {
    throw new Error("単位付きの値には整数のべき指数だけを使用できます。");
  }
  return quantity(base.siValue ** exponent.siValue, powerDimension(base.dimension, exponent.siValue));
}

function squareRoot(input: Quantity): Quantity {
  if (input.siValue < 0) throw new Error("負の値の平方根は計算できません。");
  if (input.dimension.some((power) => power % 2 !== 0)) throw new Error("単位付きの平方根では、各次元の指数が偶数である必要があります。");
  return quantity(Math.sqrt(input.siValue), input.dimension.map((power) => power / 2) as Dimension);
}

function applyMathFunction(name: string, input: Quantity): Quantity {
  if (name === "sqrt") return squareRoot(input);
  if (!isDimensionless(input.dimension)) throw new Error(`${name}() の引数は角度または無次元の値にしてください。`);
  if (["asin", "acos"].includes(name) && (input.siValue < -1 || input.siValue > 1)) {
    throw new Error(`${name}() の引数は -1 から 1 の範囲にしてください。`);
  }
  if (["ln", "log", "log2"].includes(name) && input.siValue <= 0) {
    throw new Error(`${name}() の引数は0より大きい値にしてください。`);
  }
  const functions: Record<string, (value: number) => number> = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    ln: Math.log, log: Math.log10, log2: Math.log2,
  };
  const evaluator = functions[name];
  if (!evaluator) throw new Error(`未対応の関数「${name}」です。`);
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

    const numberMatch = source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
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

    const identifierMatch = source.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/u);
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

    throw new Error(`「${current}」を解釈できません。`);
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
  if (!tokens.length) throw new Error("式を入力してください。");
  const constantMap = new Map(constants.map((item) => [item.symbol, item.quantity]));
  let position = 0;

  const parsePrimary = (): Quantity => {
    const token = tokens[position];
    if (!token) throw new Error("式が途中で終わっています。");
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
        if (activeFunctionNames.includes(customFunction.name)) throw new Error(`自作関数「${customFunction.name}」が再帰的に呼び出されています。`);
        position += 1;
        const argumentsList: Quantity[] = [];
        if (tokens[position]?.type !== "rightParen") {
          while (true) {
            argumentsList.push(parseAddSubtract());
            if (tokens[position]?.type !== "comma") break;
            position += 1;
          }
        }
        if (tokens[position]?.type !== "rightParen") throw new Error(`自作関数「${customFunction.name}」の閉じ括弧が不足しています。`);
        position += 1;
        if (argumentsList.length !== customFunction.parameters.length) {
          throw new Error(`自作関数「${customFunction.name}」は${customFunction.parameters.length}個の引数を必要とします。`);
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
        if (tokens[position]?.type !== "leftParen") throw new Error("atan2() の後に括弧を付けてください。");
        position += 1;
        const y = parseAddSubtract();
        if (tokens[position]?.type !== "comma") throw new Error("atan2() は atan2(y, x) の形式で入力してください。");
        position += 1;
        const x = parseAddSubtract();
        if (tokens[position]?.type !== "rightParen") throw new Error("atan2() の閉じ括弧が不足しています。");
        position += 1;
        if (!sameDimension(y.dimension, x.dimension)) throw new Error("atan2() の2つの引数は同じ次元にしてください。");
        return quantity(Math.atan2(y.siValue, x.siValue));
      }
      if (["sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "ln", "log", "log2"].includes(token.value)) {
        if (tokens[position]?.type !== "leftParen") throw new Error(`${token.value}() の後に括弧を付けてください。`);
        position += 1;
        const inner = parseAddSubtract();
        if (tokens[position]?.type !== "rightParen") throw new Error(`${token.value}() の閉じ括弧が不足しています。`);
        position += 1;
        return applyMathFunction(token.value, inner);
      }
      if (token.value === "pi") return quantity(Math.PI);
      if (token.value === "e") return quantity(Math.E);
      try {
        const parsed = parseUnit(token.value);
        return quantity(parsed.scale, parsed.dimension);
      } catch {
        throw new Error(`定数または単位「${token.value}」が見つかりません。`);
      }
    }
    if (token.type === "leftParen") {
      position += 1;
      const inner = parseAddSubtract();
      if (tokens[position]?.type !== "rightParen") throw new Error("閉じ括弧が不足しています。");
      position += 1;
      return inner;
    }
    throw new Error("式の構文が正しくありません。");
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
  if (position !== tokens.length) throw new Error("式の構文が正しくありません。");
  return result;
}

export function parseConstantDefinition(input: string, constants: SavedConstant[] = []) {
  const match = input.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
  if (!match) throw new Error("定数は「W = 3cm」の形式で定義してください。");
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

export function formatDimension(dimension: Dimension): string {
  const labels = ["m", "kg", "s", "A", "K", "mol", "cd"];
  const numerator: string[] = [];
  const denominator: string[] = [];
  dimension.forEach((power, index) => {
    if (power > 0) numerator.push(`${labels[index]}${power === 1 ? "" : toSuperscript(power)}`);
    if (power < 0) denominator.push(`${labels[index]}${power === -1 ? "" : toSuperscript(-power)}`);
  });
  if (!numerator.length && !denominator.length) return "無次元";
  if (!denominator.length) return numerator.join("·");
  return `${numerator.length ? numerator.join("·") : "1"}/${denominator.join("·")}`;
}

export function convertQuantity(input: Quantity, targetUnit: string): { value: number; unit: string } {
  const parsed = parseUnit(targetUnit);
  if (!sameDimension(input.dimension, parsed.dimension)) {
    throw new Error(`結果を「${targetUnit}」へ変換できません。次元が一致していません。`);
  }
  return { value: (input.siValue - (parsed.offset ?? 0)) / parsed.scale, unit: targetUnit.trim() || "無次元" };
}

export function formatQuantity(input: Quantity, targetUnit?: string, locale?: string): string {
  if (targetUnit?.trim()) {
    const converted = convertQuantity(input, targetUnit);
    return `${formatNumberForLocale(converted.value, locale)} ${converted.unit}`;
  }
  const dimension = formatDimension(input.dimension);
  return dimension === "無次元" ? formatNumberForLocale(input.siValue, locale) : `${formatNumberForLocale(input.siValue, locale)} ${dimension}`;
}

export function hasSameDimension(left: Quantity, right: Quantity) {
  return sameDimension(left.dimension, right.dimension);
}

export function getCompatibleUnitGroups(dimension: Dimension): UnitGroup[] {
  return UNIT_GROUPS.filter((group) => sameDimension(group.dimension, dimension));
}

const REGIONAL_PRIORITY: Record<UnitSystem, Record<string, string[]>> = {
  metric: { length: ["m", "km", "cm", "mm"], area: ["m²", "km²", "cm²"], volume: ["L", "mL", "m³"], mass: ["kg", "g", "mg"], temperature: ["°C", "K"], velocity: ["m/s", "km/h", "cm/s", "kine", "kt"], acceleration: ["m/s²", "Gal", "mGal", "G"], pressure: ["Pa", "kPa", "bar"], energy: ["J", "kJ", "Wh"], power: ["W", "kW"] },
  us: { length: ["in", "ft", "yd", "mi"], area: ["in²", "ft²", "yd²", "acre"], volume: ["gal", "qt", "pt"], mass: ["lb", "oz"], temperature: ["°F"], velocity: ["mph", "ft/s", "kt", "m/s"], acceleration: ["ft/s²", "G", "m/s²", "Gal", "mGal"], pressure: ["psi", "atm"], energy: ["BTU", "Wh"], power: ["hp", "W"] },
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
