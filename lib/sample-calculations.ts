export type SampleCategory = "basic" | "motion" | "mechanics" | "energy" | "electric" | "ratio";

export type SampleCalculation = {
  id: string;
  category: SampleCategory;
  title: string;
  description: string;
  expression: string;
  targetUnit: string;
};

export const SAMPLE_CATEGORIES: Array<{ id: SampleCategory; label: string }> = [
  { id: "basic", label: "基本" },
  { id: "motion", label: "距離・速度" },
  { id: "mechanics", label: "力・圧力" },
  { id: "energy", label: "エネルギー" },
  { id: "electric", label: "電気" },
  { id: "ratio", label: "割合" },
];

export const SAMPLE_CALCULATIONS: SampleCalculation[] = [
  { id: "length-add", category: "basic", title: "長さを足す", description: "異なる長さの単位をSIでそろえて加算", expression: "5cm + 1mm", targetUnit: "cm" },
  { id: "area", category: "basic", title: "面積を求める", description: "長さ × 長さで面積へ", expression: "3cm × 20mm", targetUnit: "cm²" },
  { id: "speed", category: "motion", title: "速度を求める", description: "距離 ÷ 時間 = 速度", expression: "1km ÷ 1min", targetUnit: "km/h" },
  { id: "distance", category: "motion", title: "距離を求める", description: "速度 × 時間 = 距離", expression: "10m/s × 2min", targetUnit: "km" },
  { id: "time", category: "motion", title: "時間を求める", description: "距離 ÷ 速度 = 時間", expression: "1km ÷ 5m/s", targetUnit: "min" },
  { id: "force", category: "mechanics", title: "力を求める", description: "質量 × 加速度 = 力", expression: "2kg × 9.8m/s²", targetUnit: "N" },
  { id: "pressure", category: "mechanics", title: "圧力を求める", description: "力 ÷ 面積 = 圧力", expression: "100N ÷ 0.01m²", targetUnit: "kPa" },
  { id: "work", category: "energy", title: "仕事を求める", description: "力 × 距離 = エネルギー", expression: "250N × 4m", targetUnit: "kJ" },
  { id: "power", category: "energy", title: "仕事率を求める", description: "エネルギー ÷ 時間 = 電力", expression: "1200J ÷ 2min", targetUnit: "W" },
  { id: "electric-power", category: "electric", title: "電力を求める", description: "電圧 × 電流 = 電力", expression: "12V × 2A", targetUnit: "W" },
  { id: "percentage", category: "ratio", title: "割合を百分率へ", description: "無次元値を % で表示", expression: "0.125", targetUnit: "%" },
];

