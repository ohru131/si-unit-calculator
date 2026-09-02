import type { LocalizedText } from "./i18n";

export type SampleCategory = "basic" | "motion" | "mechanics" | "energy" | "electric" | "math" | "ratio";

export type SampleCalculation = {
  id: string;
  category: SampleCategory;
  title: LocalizedText;
  description: LocalizedText;
  expression: string;
  targetUnit: string;
};

export const SAMPLE_CATEGORIES: Array<{ id: SampleCategory; label: LocalizedText }> = [
  { id: "basic", label: { en: "Basics", ja: "基本" } },
  { id: "motion", label: { en: "Speed", ja: "距離・速度" } },
  { id: "mechanics", label: { en: "Force & pressure", ja: "力・圧力" } },
  { id: "energy", label: { en: "Energy", ja: "エネルギー" } },
  { id: "electric", label: { en: "Electric", ja: "電気" } },
  { id: "math", label: { en: "Angles & math", ja: "角度・関数" } },
  { id: "ratio", label: { en: "Ratios", ja: "割合" } },
];

export const SAMPLE_CALCULATIONS: SampleCalculation[] = [
  { id: "length-add", category: "basic", title: { en: "Add lengths", ja: "長さを足す" }, description: { en: "Normalize mixed lengths to SI before adding", ja: "異なる長さの単位をSIでそろえて加算" }, expression: "5cm + 1mm", targetUnit: "cm" },
  { id: "area", category: "basic", title: { en: "Find an area", ja: "面積を求める" }, description: { en: "Length × length gives area", ja: "長さ × 長さで面積へ" }, expression: "3cm × 20mm", targetUnit: "cm²" },
  { id: "speed", category: "motion", title: { en: "Find speed", ja: "速度を求める" }, description: { en: "Distance ÷ time = speed", ja: "距離 ÷ 時間 = 速度" }, expression: "1km ÷ 1min", targetUnit: "km/h" },
  { id: "kine", category: "motion", title: { en: "Convert kine", ja: "kineを換算" }, description: { en: "Convert the CGS speed unit to SI speed", ja: "CGS速度単位をSI速度へ" }, expression: "100kine", targetUnit: "km/h" },
  { id: "distance", category: "motion", title: { en: "Find distance", ja: "距離を求める" }, description: { en: "Speed × time = distance", ja: "速度 × 時間 = 距離" }, expression: "10m/s × 2min", targetUnit: "km" },
  { id: "time", category: "motion", title: { en: "Find time", ja: "時間を求める" }, description: { en: "Distance ÷ speed = time", ja: "距離 ÷ 速度 = 時間" }, expression: "1km ÷ 5m/s", targetUnit: "min" },
  { id: "sine-degrees", category: "math", title: { en: "Sine in degrees", ja: "度数法の正弦" }, description: { en: "Calculate the dimensionless sine of 30 degrees", ja: "30度のsinを無次元値として計算" }, expression: "sin(30deg)", targetUnit: "" },
  { id: "atan2-angle", category: "math", title: { en: "Find an angle from two sides", ja: "2辺から角度を求める" }, description: { en: "Use atan2 with two values of the same dimension", ja: "atan2で同じ次元の2辺から角度を出す" }, expression: "atan2(1m, 1m)", targetUnit: "deg" },
  { id: "logarithm", category: "math", title: { en: "Base-10 logarithm", ja: "常用対数" }, description: { en: "Calculate the base-10 logarithm of 1000", ja: "1000の常用対数を計算" }, expression: "log(1000)", targetUnit: "" },
  { id: "square-root-area", category: "math", title: { en: "Square root of area", ja: "面積の平方根" }, description: { en: "Find a side length from an area", ja: "面積から一辺の長さを求める" }, expression: "sqrt(144cm²)", targetUnit: "cm" },
  { id: "power-length", category: "math", title: { en: "Power of length", ja: "長さのべき乗" }, description: { en: "Find volume by cubing a length", ja: "長さの3乗から体積を求める" }, expression: "(2m)^3", targetUnit: "m³" },
  { id: "force", category: "mechanics", title: { en: "Find force", ja: "力を求める" }, description: { en: "Mass × acceleration = force", ja: "質量 × 加速度 = 力" }, expression: "2kg × 9.8m/s²", targetUnit: "N" },
  { id: "standard-gravity", category: "mechanics", title: { en: "Convert standard gravity", ja: "標準重力を換算" }, description: { en: "Convert 1G to Gal for gravimetry", ja: "1G を地球物理で用いる Gal へ" }, expression: "1G", targetUnit: "Gal" },
  { id: "pressure", category: "mechanics", title: { en: "Find pressure", ja: "圧力を求める" }, description: { en: "Force ÷ area = pressure", ja: "力 ÷ 面積 = 圧力" }, expression: "100N ÷ 0.01m²", targetUnit: "kPa" },
  { id: "work", category: "energy", title: { en: "Find energy", ja: "仕事を求める" }, description: { en: "Force × distance = energy", ja: "力 × 距離 = エネルギー" }, expression: "250N × 4m", targetUnit: "kJ" },
  { id: "power", category: "energy", title: { en: "Find power", ja: "仕事率を求める" }, description: { en: "Energy ÷ time = power", ja: "エネルギー ÷ 時間 = 電力" }, expression: "1200J ÷ 2min", targetUnit: "W" },
  { id: "electric-power", category: "electric", title: { en: "Electric power", ja: "電力を求める" }, description: { en: "Voltage × current = power", ja: "電圧 × 電流 = 電力" }, expression: "12V × 2A", targetUnit: "W" },
  { id: "percentage", category: "ratio", title: { en: "Convert to a percentage", ja: "割合を百分率へ" }, description: { en: "Display a dimensionless value as %", ja: "無次元値を % で表示" }, expression: "0.125", targetUnit: "%" },
];
