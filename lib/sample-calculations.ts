export type SampleCategory = "basic" | "motion" | "mechanics" | "energy" | "electric" | "ratio";

export type SampleCalculation = {
  id: string;
  category: SampleCategory;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  expression: string;
  targetUnit: string;
};

export const SAMPLE_CATEGORIES: Array<{ id: SampleCategory; label: string; labelEn: string }> = [
  { id: "basic", label: "基本", labelEn: "Basics" },
  { id: "motion", label: "距離・速度", labelEn: "Speed" },
  { id: "mechanics", label: "力・圧力", labelEn: "Force & pressure" },
  { id: "energy", label: "エネルギー", labelEn: "Energy" },
  { id: "electric", label: "電気", labelEn: "Electric" },
  { id: "ratio", label: "割合", labelEn: "Ratios" },
];

export const SAMPLE_CALCULATIONS: SampleCalculation[] = [
  { id: "length-add", category: "basic", title: "長さを足す", titleEn: "Add lengths", description: "異なる長さの単位をSIでそろえて加算", descriptionEn: "Normalize mixed lengths to SI before adding", expression: "5cm + 1mm", targetUnit: "cm" },
  { id: "area", category: "basic", title: "面積を求める", titleEn: "Find an area", description: "長さ × 長さで面積へ", descriptionEn: "Length × length gives area", expression: "3cm × 20mm", targetUnit: "cm²" },
  { id: "speed", category: "motion", title: "速度を求める", titleEn: "Find speed", description: "距離 ÷ 時間 = 速度", descriptionEn: "Distance ÷ time = speed", expression: "1km ÷ 1min", targetUnit: "km/h" },
  { id: "distance", category: "motion", title: "距離を求める", titleEn: "Find distance", description: "速度 × 時間 = 距離", descriptionEn: "Speed × time = distance", expression: "10m/s × 2min", targetUnit: "km" },
  { id: "time", category: "motion", title: "時間を求める", titleEn: "Find time", description: "距離 ÷ 速度 = 時間", descriptionEn: "Distance ÷ speed = time", expression: "1km ÷ 5m/s", targetUnit: "min" },
  { id: "force", category: "mechanics", title: "力を求める", titleEn: "Find force", description: "質量 × 加速度 = 力", descriptionEn: "Mass × acceleration = force", expression: "2kg × 9.8m/s²", targetUnit: "N" },
  { id: "pressure", category: "mechanics", title: "圧力を求める", titleEn: "Find pressure", description: "力 ÷ 面積 = 圧力", descriptionEn: "Force ÷ area = pressure", expression: "100N ÷ 0.01m²", targetUnit: "kPa" },
  { id: "work", category: "energy", title: "仕事を求める", titleEn: "Find energy", description: "力 × 距離 = エネルギー", descriptionEn: "Force × distance = energy", expression: "250N × 4m", targetUnit: "kJ" },
  { id: "power", category: "energy", title: "仕事率を求める", titleEn: "Find power", description: "エネルギー ÷ 時間 = 電力", descriptionEn: "Energy ÷ time = power", expression: "1200J ÷ 2min", targetUnit: "W" },
  { id: "electric-power", category: "electric", title: "電力を求める", titleEn: "Electric power", description: "電圧 × 電流 = 電力", descriptionEn: "Voltage × current = power", expression: "12V × 2A", targetUnit: "W" },
  { id: "percentage", category: "ratio", title: "割合を百分率へ", titleEn: "Convert to a percentage", description: "無次元値を % で表示", descriptionEn: "Display a dimensionless value as %", expression: "0.125", targetUnit: "%" },
];
