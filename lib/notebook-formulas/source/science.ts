import type { NotebookSeed } from "../types";

/** 理科「速さ・運動」。小学校・中学校で学ぶ、速さ・道のり・時間の関係と等加速度運動をまとめている。 */
export const SCIENCE_MOTION_SEEDS: NotebookSeed[] = [
  {
    title: "速さ・道のり・時間の関係（はじきの公式）",
    titleEn: "Speed, distance, and time (the fundamental relation)",
    description: "140kmを2時間で走る電車を例に、速さ・道のり・時間の3つの公式を順番に確認します。",
    descriptionEn: "Using a train that covers 140km in 2 hours as an example, walk through all three forms of the speed-distance-time relation.",
    formulas: [
      { explanation: "速さは、道のりを時間で割って求めます。", explanationEn: "Speed equals distance divided by time.", latex: "v = \\dfrac{d}{t}" },
      { explanation: "道のりは、速さに時間をかけて求めます。", explanationEn: "Distance equals speed multiplied by time.", latex: "d = vt" },
      { explanation: "時間は、道のりを速さで割って求めます。", explanationEn: "Time equals distance divided by speed.", latex: "t = \\dfrac{d}{v}" },
    ],
    localConstants: [
      { symbol: "d", expression: "140km" },
      { symbol: "t", expression: "2h" },
      { symbol: "t₂", expression: "3h" },
      { symbol: "d₃", expression: "245km" },
    ],
    steps: [
      { title: "速さ v", titleEn: "Speed v", expression: "d/t", targetUnit: "km/h", formulaLatex: "v = \\dfrac{d}{t}", resultSymbol: "v" },
      { title: "3時間で進む道のり", titleEn: "Distance covered in 3 hours", expression: "v*t₂", targetUnit: "km", formulaLatex: "d_2 = v t_2" },
      { title: "245km進むのにかかる時間", titleEn: "Time needed to cover 245km", expression: "d₃/v", targetUnit: "h", formulaLatex: "t_3 = \\dfrac{d_3}{v}" },
    ],
  },
  {
    title: "平均の速さ",
    titleEn: "Average speed",
    description: "区間ごとに速さが違うとき、道のりの合計を時間の合計で割って平均の速さを求めます。",
    descriptionEn: "Compute average speed by dividing total distance by total time when speed varies between segments.",
    localConstants: [
      { symbol: "d₁", expression: "60km" },
      { symbol: "t₁", expression: "1h" },
      { symbol: "d₂", expression: "90km" },
      { symbol: "t₂", expression: "1.5h" },
    ],
    steps: [
      { title: "道のりの合計", titleEn: "Total distance", expression: "d₁+d₂", targetUnit: "km", formulaLatex: "d = d_1 + d_2" },
      { title: "時間の合計", titleEn: "Total time", expression: "t₁+t₂", targetUnit: "h", formulaLatex: "t = t_1 + t_2" },
      { title: "平均の速さ", titleEn: "Average speed", expression: "s1/s2", targetUnit: "km/h", formulaLatex: "\\bar{v} = \\dfrac{d}{t}" },
    ],
  },
  {
    title: "速さの単位換算（秒速・分速・時速）",
    titleEn: "Converting speed units (per second, per minute, per hour)",
    description: "同じ速さを秒速・分速・時速のそれぞれで表し、単位換算を確認します。",
    descriptionEn: "Express the same speed in units per second, per minute, and per hour to check the conversions.",
    localConstants: [{ symbol: "v", expression: "10m/s" }],
    steps: [
      { title: "秒速", titleEn: "Speed per second", expression: "v", targetUnit: "m/s", formulaLatex: "v" },
      { title: "分速", titleEn: "Speed per minute", expression: "v", targetUnit: "m/min", formulaLatex: "v" },
      { title: "時速", titleEn: "Speed per hour", expression: "v", targetUnit: "km/h", formulaLatex: "v" },
    ],
  },
  {
    title: "記録タイマーで区間の速さを求める",
    titleEn: "Speed of an interval from a ticker-tape timer",
    description: "1打点0.02秒の記録タイマーで、5打点分の区間（4.5cm）の速さを求めます。",
    descriptionEn: "A ticker-tape timer makes a dot every 0.02s. Compute the speed over a 5-dot interval spanning 4.5cm.",
    localConstants: [
      { symbol: "n", expression: "5" },
      { symbol: "interval", expression: "0.02s" },
      { symbol: "d", expression: "4.5cm" },
    ],
    steps: [
      { title: "区間の時間", titleEn: "Interval time", expression: "n*interval", targetUnit: "s", formulaLatex: "t = n \\times 0.02\\text{s}" },
      { title: "区間の速さ", titleEn: "Interval speed", expression: "d/s1", targetUnit: "cm/s", formulaLatex: "v = \\dfrac{d}{t}" },
    ],
  },
  {
    title: "等加速度の速さの変化",
    titleEn: "Change in speed under uniform acceleration",
    description: "台車の速さが2秒間で3m/sから7m/sに変化したときの加速度を求めます。",
    descriptionEn: "Compute the acceleration of a cart whose speed changes from 3m/s to 7m/s over 2 seconds.",
    localConstants: [
      { symbol: "v₁", expression: "3m/s" },
      { symbol: "v₂", expression: "7m/s" },
      { symbol: "t", expression: "2s" },
    ],
    steps: [
      { title: "速さの変化 Δv", titleEn: "Change in speed Δv", expression: "v₂-v₁", targetUnit: "m/s", formulaLatex: "\\Delta v = v_2 - v_1" },
      { title: "加速度 a", titleEn: "Acceleration a", expression: "s1/t", targetUnit: "m/s²", formulaLatex: "a = \\dfrac{\\Delta v}{\\Delta t}" },
    ],
  },
];

/** 理科「密度・濃度」。物体の密度・水に浮くか沈むかの判定・水溶液の濃度をまとめている。 */
export const SCIENCE_DENSITY_SEEDS: NotebookSeed[] = [
  {
    title: "密度・質量・体積の関係（金属のかたまり）",
    titleEn: "Density, mass, and volume (a lump of metal)",
    description: "質量54g・体積20cm³の金属片から密度を求め、同じ金属の別の質量・体積も密度から計算します。",
    descriptionEn: "Find the density of a 54g, 20cm³ metal sample, then use that density to find the mass and volume of other amounts of the same metal.",
    formulas: [
      { explanation: "密度は、質量を体積で割って求めます。", explanationEn: "Density equals mass divided by volume.", latex: "\\rho = \\dfrac{m}{V}" },
      { explanation: "質量は、密度に体積をかけて求めます。", explanationEn: "Mass equals density multiplied by volume.", latex: "m = \\rho V" },
      { explanation: "体積は、質量を密度で割って求めます。", explanationEn: "Volume equals mass divided by density.", latex: "V = \\dfrac{m}{\\rho}" },
    ],
    localConstants: [
      { symbol: "m", expression: "54g" },
      { symbol: "V", expression: "20cm³" },
      { symbol: "V₂", expression: "10cm³" },
      { symbol: "m₃", expression: "81g" },
    ],
    steps: [
      { title: "密度 ρ", titleEn: "Density ρ", expression: "m/V", targetUnit: "g/cm³", formulaLatex: "\\rho = \\dfrac{m}{V}", resultSymbol: "ρ" },
      { title: "体積10cm³の質量", titleEn: "Mass of 10cm³ of the same metal", expression: "ρ*V₂", targetUnit: "g", formulaLatex: "m_2 = \\rho V_2" },
      { title: "質量81gの体積", titleEn: "Volume of 81g of the same metal", expression: "m₃/ρ", targetUnit: "cm³", formulaLatex: "V_3 = \\dfrac{m_3}{\\rho}" },
    ],
  },
  {
    title: "水に浮くか沈むか（密度で判断）",
    titleEn: "Does it float or sink? (judging by density)",
    description: "体積50cm³・質量40gの木片の密度を求め、水の密度（1g/cm³）と比べて浮くか沈むかを判定します。",
    descriptionEn: "Find the density of a 50cm³, 40g piece of wood and compare it to the density of water (1g/cm³) to see if it floats or sinks.",
    localConstants: [
      { symbol: "m", expression: "40g" },
      { symbol: "V", expression: "50cm³" },
    ],
    steps: [
      { title: "密度 ρ", titleEn: "Density ρ", expression: "m/V", targetUnit: "g/cm³", formulaLatex: "\\rho = \\dfrac{m}{V}" },
      { title: "水の密度との比（1未満なら浮く）", titleEn: "Ratio to water's density (floats if under 1)", expression: "s1/(1g/cm³)", targetUnit: "", formulaLatex: "\\dfrac{\\rho}{\\rho_{water}}" },
    ],
  },
  {
    title: "質量パーセント濃度",
    titleEn: "Mass percent concentration",
    description: "溶質20gを水180gに溶かした水溶液の、質量パーセント濃度を求めます。",
    descriptionEn: "Compute the mass percent concentration of a solution made by dissolving 20g of solute in 180g of water.",
    localConstants: [
      { symbol: "mₛₒₗᵤₜₑ", expression: "20g" },
      { symbol: "mₛₒₗᵥₑₙₜ", expression: "180g" },
    ],
    steps: [
      { title: "水溶液の質量", titleEn: "Mass of the solution", expression: "mₛₒₗᵤₜₑ+mₛₒₗᵥₑₙₜ", targetUnit: "g", formulaLatex: "m_{sol} = m_{solute} + m_{solvent}" },
      { title: "質量パーセント濃度", titleEn: "Mass percent concentration", expression: "mₛₒₗᵤₜₑ/s1", targetUnit: "%", formulaLatex: "\\text{percent} = \\dfrac{m_{solute}}{m_{sol}}" },
    ],
  },
  {
    title: "溶質の質量（質量パーセント濃度から）",
    titleEn: "Mass of solute (from mass percent concentration)",
    description: "8%の水溶液250gの中に含まれる、溶質の質量を求めます。",
    descriptionEn: "Compute the mass of solute contained in 250g of an 8% solution.",
    localConstants: [
      { symbol: "mₛₒₗ", expression: "250g" },
      { symbol: "percent", expression: "8%" },
    ],
    steps: [{ title: "溶質の質量", titleEn: "Mass of solute", expression: "mₛₒₗ*percent", targetUnit: "g", formulaLatex: "m_{solute} = m_{sol} \\times \\text{percent}" }],
  },
  {
    title: "溶解度から飽和水溶液の質量パーセント濃度",
    titleEn: "Mass percent concentration of a saturated solution (from solubility)",
    description: "60℃の水100gに硝酸カリウムが110gまで溶ける（溶解度110）とき、飽和水溶液の質量パーセント濃度を求めます。",
    descriptionEn: "Potassium nitrate has a solubility of 110g per 100g of water at 60°C. Compute the mass percent concentration of the resulting saturated solution.",
    localConstants: [
      { symbol: "solubility", expression: "110g" },
      { symbol: "water", expression: "100g" },
    ],
    steps: [
      { title: "飽和水溶液の質量", titleEn: "Mass of the saturated solution", expression: "solubility+water", targetUnit: "g", formulaLatex: "m_{sol} = \\text{solubility} + m_{water}" },
      { title: "質量パーセント濃度", titleEn: "Mass percent concentration", expression: "solubility/s1", targetUnit: "%", formulaLatex: "\\text{percent} = \\dfrac{\\text{solubility}}{m_{sol}}" },
    ],
  },
];

/** 理科「圧力・浮力」。圧力の基本公式・水圧・大気圧・浮力（アルキメデスの原理）をまとめている。 */
export const SCIENCE_PRESSURE_SEEDS: NotebookSeed[] = [
  {
    title: "圧力＝力÷面積",
    titleEn: "Pressure equals force divided by area",
    description: "面を垂直に押す力と、力がはたらく面積から、圧力を求めます。",
    descriptionEn: "Compute pressure from the force pressing perpendicular to a surface and the area of that surface.",
    localConstants: [
      { symbol: "F", expression: "60N" },
      { symbol: "A", expression: "0.02m²" },
    ],
    steps: [{ title: "圧力 P", titleEn: "Pressure P", expression: "F/A", targetUnit: "Pa", formulaLatex: "P = \\dfrac{F}{A}" }],
  },
  {
    title: "スポンジのへこみ（接地面積を変えたときの圧力）",
    titleEn: "Denting a sponge (pressure with different contact areas)",
    description: "同じ40Nのブロックを、接地面積0.01m²で置いた場合と0.04m²で置いた場合の圧力を比べます。",
    descriptionEn: "Compare the pressure of the same 40N block when it rests on a 0.01m² face versus a 0.04m² face.",
    localConstants: [
      { symbol: "F", expression: "40N" },
      { symbol: "A₁", expression: "0.01m²" },
      { symbol: "A₂", expression: "0.04m²" },
    ],
    steps: [
      { title: "面積0.01m²のときの圧力 P1", titleEn: "Pressure P1 with a 0.01m² face", expression: "F/A₁", targetUnit: "Pa", formulaLatex: "P_1 = \\dfrac{F}{A_1}" },
      { title: "面積0.04m²のときの圧力 P2", titleEn: "Pressure P2 with a 0.04m² face", expression: "F/A₂", targetUnit: "Pa", formulaLatex: "P_2 = \\dfrac{F}{A_2}" },
    ],
  },
  {
    title: "水圧 P=ρgh",
    titleEn: "Water pressure P=ρgh",
    description: "水の密度・重力加速度・水面からの深さから、水中の圧力（水圧）を求めます。",
    descriptionEn: "Compute the water pressure at a given depth from the density of water, gravitational acceleration, and depth.",
    localConstants: [
      { symbol: "ρ", expression: "1000kg/m³" },
      { symbol: "g", expression: "9.8m/s²" },
      { symbol: "h", expression: "5m" },
    ],
    steps: [{ title: "水圧 P", titleEn: "Water pressure P", expression: "ρ*g*h", targetUnit: "kPa", formulaLatex: "P = \\rho g h" }],
  },
  {
    title: "大気圧の単位換算（hPa・Pa・atm）",
    titleEn: "Converting atmospheric pressure units (hPa, Pa, atm)",
    description: "天気予報でおなじみの1013hPaを、パスカルと気圧（atm）で表します。",
    descriptionEn: "Express the familiar weather-forecast value of 1013hPa in pascals and in standard atmospheres.",
    localConstants: [{ symbol: "P", expression: "1013hPa" }],
    steps: [
      { title: "パスカルに変換", titleEn: "Convert to pascals", expression: "P", targetUnit: "Pa", formulaLatex: "P" },
      { title: "気圧(atm)に変換", titleEn: "Convert to standard atmospheres", expression: "P", targetUnit: "atm", formulaLatex: "P" },
    ],
  },
  {
    title: "浮力（アルキメデスの原理）",
    titleEn: "Buoyant force (Archimedes' principle)",
    description: "水中に沈んだ部分の体積から、物体が受ける浮力（押しのけた水の重さ）を求めます。",
    descriptionEn: "Compute the buoyant force on an object—the weight of the water it displaces—from the submerged volume.",
    localConstants: [
      { symbol: "ρ", expression: "1000kg/m³" },
      { symbol: "V", expression: "0.002m³" },
      { symbol: "g", expression: "9.8m/s²" },
    ],
    steps: [{ title: "浮力 F", titleEn: "Buoyant force F", expression: "ρ*V*g", targetUnit: "N", formulaLatex: "F_b = \\rho V g" }],
  },
];

/** 理科「力・仕事・てこ」。重さと質量・フックの法則・仕事の原理・てこのつり合いをまとめている。 */
export const SCIENCE_FORCE_WORK_SEEDS: NotebookSeed[] = [
  {
    title: "重さと質量（W=mg）",
    titleEn: "Weight and mass (W=mg)",
    description: "質量100gの物体にはたらく重力（重さ）を求めます。100gの物体はおよそ0.98Nになります。",
    descriptionEn: "Compute the weight (gravitational force) of a 100g object. The result should be about 0.98N.",
    localConstants: [
      { symbol: "m", expression: "100g" },
      { symbol: "g", expression: "9.8m/s²" },
    ],
    steps: [{ title: "重さ W", titleEn: "Weight W", expression: "m*g", targetUnit: "N", formulaLatex: "W = mg" }],
  },
  {
    title: "フックの法則（ばねの伸び）",
    titleEn: "Hooke's law (spring extension)",
    description: "ばね定数と加えた力から、ばねの伸びを求めます。",
    descriptionEn: "Compute the extension of a spring from its spring constant and the applied force.",
    localConstants: [
      { symbol: "k", expression: "50N/m" },
      { symbol: "F", expression: "2N" },
    ],
    steps: [{ title: "伸び x", titleEn: "Extension x", expression: "F/k", targetUnit: "cm", formulaLatex: "x = \\dfrac{F}{k}" }],
  },
  {
    title: "仕事と仕事率",
    titleEn: "Work and power",
    description: "力と移動距離から仕事を求め、それにかかった時間から仕事率を求めます。",
    descriptionEn: "Compute the work done from force and distance, then compute the power from the time it took.",
    localConstants: [
      { symbol: "F", expression: "20N" },
      { symbol: "d", expression: "3m" },
      { symbol: "t", expression: "5s" },
    ],
    steps: [
      { title: "仕事 W", titleEn: "Work W", expression: "F*d", targetUnit: "J", formulaLatex: "W = Fd" },
      { title: "仕事率 P", titleEn: "Power P", expression: "s1/t", targetUnit: "W", formulaLatex: "P = \\dfrac{W}{t}" },
    ],
  },
  {
    title: "動滑車と仕事の原理",
    titleEn: "Movable pulley and the principle of work",
    description: "動滑車を使うと必要な力は半分になりますが、引くひもの長さは2倍になり、仕事の総量は変わらないことを確かめます。",
    descriptionEn: "A movable pulley halves the force needed but doubles the length of rope pulled, so the total work done stays the same.",
    localConstants: [
      { symbol: "F", expression: "60N" },
      { symbol: "d", expression: "2m" },
    ],
    steps: [
      { title: "直接持ち上げる仕事 W", titleEn: "Work lifting directly W", expression: "F*d", targetUnit: "J", formulaLatex: "W = Fd" },
      { title: "動滑車で必要な力", titleEn: "Force needed with a movable pulley", expression: "F/2", targetUnit: "N", formulaLatex: "F_{pull} = \\dfrac{F}{2}" },
      { title: "引くひもの長さ", titleEn: "Length of rope pulled", expression: "d*2", targetUnit: "m", formulaLatex: "d_{pull} = 2d" },
      { title: "動滑車を使った仕事", titleEn: "Work done using the pulley", expression: "s2*s3", targetUnit: "J", formulaLatex: "W_{pull} = F_{pull} \\cdot d_{pull}" },
    ],
  },
  {
    title: "てこのつり合い",
    titleEn: "Lever equilibrium",
    description: "支点からの距離と一方の力から、もう一方に必要な力を、てこのつり合いの式から求めます。",
    descriptionEn: "Using the lever equilibrium equation, compute the force needed on one side from the distances and the force on the other side.",
    localConstants: [
      { symbol: "F₁", expression: "30N" },
      { symbol: "L₁", expression: "0.6m" },
      { symbol: "L₂", expression: "0.2m" },
    ],
    steps: [{ title: "必要な力 F2", titleEn: "Required force F2", expression: "F₁*L₁/L₂", targetUnit: "N", formulaLatex: "F_2 = F_1\\dfrac{L_1}{L_2}" }],
  },
  {
    title: "斜面を使った仕事（仕事の原理）",
    titleEn: "Work on an inclined plane (the principle of work)",
    description: "質量5kgの物体を高さ2mまで持ち上げる仕事を求め、長さ5mの斜面を使う場合に必要な力を求めます。仕事の量は変わりません。",
    descriptionEn: "Compute the work needed to lift a 5kg object 2m straight up, then find the force needed to push it up a 5m-long ramp instead—the work stays the same.",
    localConstants: [
      { symbol: "m", expression: "5kg" },
      { symbol: "g", expression: "9.8m/s²" },
      { symbol: "h", expression: "2m" },
      { symbol: "L", expression: "5m" },
    ],
    steps: [
      { title: "直接持ち上げる仕事 W", titleEn: "Work lifting directly W", expression: "m*g*h", targetUnit: "J", formulaLatex: "W = mgh" },
      { title: "斜面に沿って引く力 F", titleEn: "Force needed along the ramp F", expression: "s1/L", targetUnit: "N", formulaLatex: "F = \\dfrac{W}{L}" },
    ],
  },
];

/** 理科「熱・温度」。熱量の計算・電熱線の発熱・カロリーとの換算・混合後の温度をまとめている。 */
export const SCIENCE_HEAT_SEEDS: NotebookSeed[] = [
  {
    title: "熱量 Q=mcΔT",
    titleEn: "Heat quantity Q=mcΔT",
    description: "水の質量・比熱・温度変化から、水が得た熱量を求めます。水の比熱は4.2J/(g・K)です。",
    descriptionEn: "Compute the heat absorbed by water from its mass, specific heat, and temperature change. Water's specific heat is 4.2J/(g·K).",
    localConstants: [
      { symbol: "m", expression: "200g" },
      { symbol: "c", expression: "4.2J/(g*K)" },
      { symbol: "ΔT", expression: "30K" },
    ],
    steps: [{ title: "熱量 Q", titleEn: "Heat Q", expression: "m*c*ΔT", targetUnit: "kJ", formulaLatex: "Q = mc\\Delta T" }],
  },
  {
    title: "電熱線の発熱 Q=VIt",
    titleEn: "Heat from a resistance wire Q=VIt",
    description: "電圧・電流・通電時間から、電熱線が発生する熱量を求めます。",
    descriptionEn: "Compute the heat generated by a resistance wire from the voltage, current, and time it is energized.",
    localConstants: [
      { symbol: "V", expression: "6V" },
      { symbol: "I", expression: "1.5A" },
      { symbol: "t", expression: "300s" },
    ],
    steps: [{ title: "熱量 Q", titleEn: "Heat Q", expression: "V*I*t", targetUnit: "kJ", formulaLatex: "Q = VIt" }],
  },
  {
    title: "熱量とカロリーの換算",
    titleEn: "Converting between joules and calories",
    description: "250calの熱量を、ジュールとキロカロリーのそれぞれで表します。",
    descriptionEn: "Express a heat quantity of 250cal in both joules and kilocalories.",
    localConstants: [{ symbol: "Q", expression: "250cal" }],
    steps: [
      { title: "ジュールに変換", titleEn: "Convert to joules", expression: "Q", targetUnit: "J", formulaLatex: "Q" },
      { title: "キロカロリーに変換", titleEn: "Convert to kilocalories", expression: "Q", targetUnit: "kcal", formulaLatex: "Q" },
    ],
  },
  {
    title: "セ氏とケルビンの換算",
    titleEn: "Converting between Celsius and Kelvin",
    description: "20℃の気温を、絶対温度（ケルビン）に換算します。",
    descriptionEn: "Convert an air temperature of 20°C to the Kelvin (absolute) scale.",
    localConstants: [{ symbol: "T", expression: "20°C" }],
    steps: [{ title: "絶対温度 T", titleEn: "Absolute temperature T", expression: "T", targetUnit: "K", formulaLatex: "T_K = T_C + 273.15" }],
  },
  {
    title: "湯と水を混ぜたときの温度（熱量保存）",
    titleEn: "Temperature after mixing hot and cold water (conservation of heat)",
    description: "80℃のお湯200gと20℃の水300gを混ぜたとき、熱量保存の法則から混合後の温度を求めます。",
    descriptionEn: "Mix 200g of 80°C hot water with 300g of 20°C cold water. Use conservation of heat to find the resulting temperature.",
    localConstants: [
      { symbol: "m₁", expression: "200g" },
      { symbol: "T₁", expression: "80°C" },
      { symbol: "m₂", expression: "300g" },
      { symbol: "T₂", expression: "20°C" },
    ],
    steps: [{ title: "混合後の温度 Tf", titleEn: "Resulting temperature Tf", expression: "(m₁*T₁+m₂*T₂)/(m₁+m₂)", targetUnit: "°C", formulaLatex: "T_f = \\dfrac{m_1T_1+m_2T_2}{m_1+m_2}" }],
  },
];

/** 理科「電気・回路」。オームの法則・直列/並列回路・電力と電力量をまとめている。 */
export const SCIENCE_ELECTRICITY_SEEDS: NotebookSeed[] = [
  {
    title: "オームの法則（抵抗・電流・電圧の関係）",
    titleEn: "Ohm's law (resistance, current, and voltage)",
    description: "電圧6V・電流0.3Aの抵抗器の抵抗を求め、その抵抗を使って別の条件での電流・電圧を求めます。",
    descriptionEn: "Find the resistance of a resistor with 6V across it and 0.3A through it, then use that resistance to find the current and voltage in other conditions.",
    formulas: [
      { explanation: "電圧は、電流と抵抗をかけて求めます。", explanationEn: "Voltage equals current multiplied by resistance.", latex: "V = IR" },
      { explanation: "抵抗は、電圧を電流で割って求めます。", explanationEn: "Resistance equals voltage divided by current.", latex: "R = \\dfrac{V}{I}" },
      { explanation: "電流は、電圧を抵抗で割って求めます。", explanationEn: "Current equals voltage divided by resistance.", latex: "I = \\dfrac{V}{R}" },
    ],
    localConstants: [
      { symbol: "V", expression: "6V" },
      { symbol: "I", expression: "0.3A" },
      { symbol: "I₂", expression: "0.5A" },
      { symbol: "V₃", expression: "15V" },
    ],
    steps: [
      { title: "抵抗 R", titleEn: "Resistance R", expression: "V/I", targetUnit: "Ohm", formulaLatex: "R = \\dfrac{V}{I}", resultSymbol: "R" },
      { title: "電流0.5Aのときの電圧 V2", titleEn: "Voltage V2 when the current is 0.5A", expression: "I₂*R", targetUnit: "V", formulaLatex: "V_2 = I_2 R" },
      { title: "電圧15Vのときの電流 I3", titleEn: "Current I3 when the voltage is 15V", expression: "V₃/R", targetUnit: "A", formulaLatex: "I_3 = \\dfrac{V_3}{R}" },
    ],
  },
  {
    title: "直列回路の合成抵抗",
    titleEn: "Combined resistance in a series circuit",
    description: "2つの抵抗を直列につないだときの、合成抵抗を求めます。",
    descriptionEn: "Compute the combined resistance when two resistors are connected in series.",
    localConstants: [
      { symbol: "R₁", expression: "10Ohm" },
      { symbol: "R₂", expression: "15Ohm" },
    ],
    steps: [{ title: "合成抵抗 R", titleEn: "Combined resistance R", expression: "R₁+R₂", targetUnit: "Ohm", formulaLatex: "R = R_1 + R_2" }],
  },
  {
    title: "並列回路の合成抵抗",
    titleEn: "Combined resistance in a parallel circuit",
    description: "2つの抵抗を並列につないだときの、合成抵抗を求めます。",
    descriptionEn: "Compute the combined resistance when two resistors are connected in parallel.",
    localConstants: [
      { symbol: "R₁", expression: "10Ohm" },
      { symbol: "R₂", expression: "15Ohm" },
    ],
    steps: [{ title: "合成抵抗 R", titleEn: "Combined resistance R", expression: "(1/R₁+1/R₂)^-1", targetUnit: "Ohm", formulaLatex: "R = \\left(\\dfrac{1}{R_1} + \\dfrac{1}{R_2}\\right)^{-1}" }],
  },
  {
    title: "電力 P=VI",
    titleEn: "Electric power P=VI",
    description: "電圧と電流から、電気器具が消費する電力を求めます。",
    descriptionEn: "Compute the electric power consumed by an appliance from its voltage and current.",
    localConstants: [
      { symbol: "V", expression: "100V" },
      { symbol: "I", expression: "6A" },
    ],
    steps: [{ title: "電力 P", titleEn: "Power P", expression: "V*I", targetUnit: "W", formulaLatex: "P = VI" }],
  },
  {
    title: "電力量と電気代（kWhと電気代）",
    titleEn: "Energy consumption and electricity cost (kWh and cost)",
    description: "消費電力・使用時間・電力量単価から、使用した電力量と電気代を求めます。",
    descriptionEn: "Compute the energy consumed and its cost from the power rating, usage time, and price per kWh.",
    localConstants: [
      { symbol: "P", expression: "1000W" },
      { symbol: "t", expression: "2h" },
      { symbol: "rate", expression: "30" },
    ],
    steps: [
      { title: "使用電力量 E", titleEn: "Energy used E", expression: "P*t", targetUnit: "kWh", formulaLatex: "E = Pt" },
      { title: "電気代", titleEn: "Cost", expression: "(s1/1kWh)*rate", targetUnit: "", formulaLatex: "\\text{cost} = \\dfrac{E}{1\\text{kWh}} \\times \\text{rate}" },
    ],
  },
];

/** 理科「光・音」。音の速さ・波の基本式・凸レンズ・光の反射をまとめている。 */
export const SCIENCE_LIGHT_SOUND_SEEDS: NotebookSeed[] = [
  {
    title: "音の速さで距離を求める（雷が光ってから音まで）",
    titleEn: "Finding distance from the speed of sound (lightning to thunder)",
    description: "雷が光ってから雷鳴が聞こえるまでの時間から、雷までのおよその距離を求めます。",
    descriptionEn: "Estimate the distance to a lightning strike from the time between seeing the flash and hearing the thunder.",
    localConstants: [
      { symbol: "v", expression: "340m/s" },
      { symbol: "t", expression: "3s" },
    ],
    steps: [{ title: "距離 d", titleEn: "Distance d", expression: "v*t", targetUnit: "m", formulaLatex: "d = vt" }],
  },
  {
    title: "音の速さ v=fλ",
    titleEn: "Speed of sound v=fλ",
    description: "音の速さと振動数から、波長を求めます。",
    descriptionEn: "Compute the wavelength of a sound from its speed and frequency.",
    localConstants: [
      { symbol: "v", expression: "340m/s" },
      { symbol: "f", expression: "440Hz" },
    ],
    steps: [{ title: "波長 λ", titleEn: "Wavelength λ", expression: "v/f", targetUnit: "m", formulaLatex: "\\lambda = \\dfrac{v}{f}" }],
  },
  {
    title: "弦の振動数と波長",
    titleEn: "Frequency and wavelength of a vibrating string",
    description: "弦を伝わる波の速さと波長から、弦の振動数を求めます。",
    descriptionEn: "Compute the frequency of a vibrating string from the wave speed and wavelength.",
    localConstants: [
      { symbol: "v", expression: "120m/s" },
      { symbol: "λ", expression: "0.6m" },
    ],
    steps: [{ title: "振動数 f", titleEn: "Frequency f", expression: "v/λ", targetUnit: "Hz", formulaLatex: "f = \\dfrac{v}{\\lambda}" }],
  },
  {
    title: "凸レンズ（像の位置と倍率）",
    titleEn: "Convex lens (image position and magnification)",
    description: "焦点距離15cmの凸レンズの前方20cmに物体を置いたときの、像の位置と倍率を求めます。",
    descriptionEn: "Find the image position and magnification for an object placed 20cm in front of a convex lens with a 15cm focal length.",
    localConstants: [
      { symbol: "f", expression: "15cm" },
      { symbol: "a", expression: "20cm" },
    ],
    steps: [
      { title: "像の位置 b", titleEn: "Image position b", expression: "(1/f-1/a)^-1", targetUnit: "cm", formulaLatex: "\\dfrac{1}{a} + \\dfrac{1}{b} = \\dfrac{1}{f}" },
      { title: "倍率 m", titleEn: "Magnification m", expression: "s1/a", targetUnit: "", formulaLatex: "m = \\dfrac{b}{a}" },
    ],
  },
  {
    title: "光の反射（入射角と反射角）",
    titleEn: "Reflection of light (angle of incidence and reflection)",
    description: "反射の法則（入射角＝反射角）から反射角を求め、入射光と反射光のなす角も求めます。",
    descriptionEn: "Use the law of reflection (angle of incidence equals angle of reflection) to find the reflection angle and the angle between the incident and reflected rays.",
    localConstants: [{ symbol: "θᵢ", expression: "32deg" }],
    steps: [
      { title: "反射角 θr", titleEn: "Angle of reflection θr", expression: "θᵢ", targetUnit: "deg", formulaLatex: "\\theta_r = \\theta_i" },
      { title: "入射光と反射光のなす角", titleEn: "Angle between incident and reflected rays", expression: "2*θᵢ", targetUnit: "deg", formulaLatex: "\\theta = \\theta_i + \\theta_r = 2\\theta_i" },
    ],
  },
];

/** 理科「地学・天気」。湿度・地震波の伝わり方・地層の堆積・台風の気圧をまとめている。 */
export const SCIENCE_EARTH_SEEDS: NotebookSeed[] = [
  {
    title: "湿度の求め方（水蒸気量から・露点から）",
    titleEn: "Finding relative humidity (from vapor content and from dew point)",
    description: "空気1m³中の水蒸気量とその気温での飽和水蒸気量から湿度を求め、露点（別の気温での飽和水蒸気量）からも同じように求めます。",
    descriptionEn: "Compute relative humidity from the actual water vapor content and the saturation vapor density at the air temperature, then compute it again using the dew point instead.",
    localConstants: [
      { symbol: "a", expression: "18.0g/m³" },
      { symbol: "aₛₐₜ", expression: "23.1g/m³" },
      { symbol: "a_dew", expression: "17.3g/m³" },
    ],
    steps: [
      { title: "水蒸気量からの湿度", titleEn: "Humidity from vapor content", expression: "a/aₛₐₜ", targetUnit: "%", formulaLatex: "RH = \\dfrac{a}{a_{sat}} \\times 100\\%" },
      { title: "露点(20℃)からの湿度", titleEn: "Humidity from the dew point (20°C)", expression: "a_dew/aₛₐₜ", targetUnit: "%", formulaLatex: "RH = \\dfrac{a_{dew}}{a_{sat}} \\times 100\\%" },
    ],
  },
  {
    title: "大森公式（初期微動継続時間から震源までの距離）",
    titleEn: "Omori's formula (epicentral distance from the P-S time)",
    description: "初期微動継続時間（P波とS波の到達時刻の差）から、大森公式で震源までの距離を求めます。",
    descriptionEn: "Use Omori's formula to compute the distance to the epicenter from the P-S time (the interval between P-wave and S-wave arrivals).",
    localConstants: [
      { symbol: "k", expression: "8km/s" },
      { symbol: "Tₛ", expression: "12s" },
    ],
    steps: [{ title: "震源までの距離 d", titleEn: "Distance to the epicenter d", expression: "k*Tₛ", targetUnit: "km", formulaLatex: "d = k T_s" }],
  },
  {
    title: "P波・S波の速さ",
    titleEn: "Speed of P-waves and S-waves",
    description: "震源からの距離と、P波・S波それぞれの到達時間から、それぞれの伝わる速さを求めます。",
    descriptionEn: "Compute the speed of the P-wave and S-wave from the distance to the epicenter and each wave's arrival time.",
    localConstants: [
      { symbol: "d", expression: "80km" },
      { symbol: "tₚ", expression: "10s" },
      { symbol: "tₛ", expression: "20s" },
    ],
    steps: [
      { title: "P波の速さ Vp", titleEn: "P-wave speed Vp", expression: "d/tₚ", targetUnit: "km/s", formulaLatex: "V_p = \\dfrac{d}{t_p}" },
      { title: "S波の速さ Vs", titleEn: "S-wave speed Vs", expression: "d/tₛ", targetUnit: "km/s", formulaLatex: "V_s = \\dfrac{d}{t_s}" },
    ],
  },
  {
    title: "地層の堆積速度",
    titleEn: "Sedimentation rate of a rock layer",
    description: "地層の厚さと堆積にかかった年数から、堆積速度を求めます。",
    descriptionEn: "Compute the sedimentation rate from the thickness of a rock layer and the number of years it took to form.",
    localConstants: [
      { symbol: "thickness", expression: "2m" },
      { symbol: "years", expression: "10000yr" },
    ],
    steps: [{ title: "堆積速度", titleEn: "Sedimentation rate", expression: "thickness/years", targetUnit: "mm/yr", formulaLatex: "\\text{rate} = \\dfrac{\\text{thickness}}{\\text{years}}" }],
  },
  {
    title: "台風の中心気圧（hPaの換算）",
    titleEn: "Central pressure of a typhoon (converting hPa)",
    description: "台風の中心気圧935hPaを、パスカルと気圧（atm）に換算します。",
    descriptionEn: "Convert a typhoon's central pressure of 935hPa into pascals and standard atmospheres.",
    localConstants: [{ symbol: "P", expression: "935hPa" }],
    steps: [
      { title: "パスカルに変換", titleEn: "Convert to pascals", expression: "P", targetUnit: "Pa", formulaLatex: "P" },
      { title: "気圧(atm)に変換", titleEn: "Convert to standard atmospheres", expression: "P", targetUnit: "atm", formulaLatex: "P" },
    ],
  },
];

/** 理科「化学変化」。質量保存の法則・金属の酸化の質量比・電気分解の体積比をまとめている。 */
export const SCIENCE_CHEMISTRY_SEEDS: NotebookSeed[] = [
  {
    title: "質量保存の法則（反応前後の質量）",
    titleEn: "Conservation of mass (mass before and after a reaction)",
    description: "密閉した容器の中で反応させる場合、反応前の物質の質量の合計と、反応後の質量は変わりません。",
    descriptionEn: "In a sealed container, the total mass before a reaction equals the total mass after it, since nothing enters or leaves the system.",
    localConstants: [
      { symbol: "m₁", expression: "35.0g" },
      { symbol: "m₂", expression: "45.0g" },
    ],
    steps: [{ title: "反応後の質量", titleEn: "Mass after the reaction", expression: "m₁+m₂", targetUnit: "g", formulaLatex: "m_{after} = m_{before} = m_1 + m_2" }],
  },
  {
    title: "銅の酸化の質量比（Cu:O=4:1）",
    titleEn: "Mass ratio in copper oxidation (Cu:O=4:1)",
    description: "銅を加熱すると酸素と4:1の質量比で結びついて酸化銅になります。銅8.0gに結びつく酸素と、できる酸化銅の質量を求めます。",
    descriptionEn: "When heated, copper combines with oxygen in a 4:1 mass ratio to form copper oxide. Compute the mass of oxygen that combines with 8.0g of copper, and the resulting mass of copper oxide.",
    localConstants: [{ symbol: "mCu", expression: "8.0g" }],
    steps: [
      { title: "結びつく酸素の質量", titleEn: "Mass of oxygen combined", expression: "mCu*(1/4)", targetUnit: "g", formulaLatex: "m_O = m_{Cu} \\times \\dfrac{1}{4}" },
      { title: "できる酸化銅の質量", titleEn: "Mass of copper oxide formed", expression: "mCu+s1", targetUnit: "g", formulaLatex: "m_{CuO} = m_{Cu} + m_O" },
    ],
  },
  {
    title: "マグネシウムの燃焼（Mg:O=3:2）",
    titleEn: "Combustion of magnesium (Mg:O=3:2)",
    description: "マグネシウムを燃焼させると酸素と3:2の質量比で結びついて酸化マグネシウムになります。マグネシウム6.0gに結びつく酸素と、できる酸化マグネシウムの質量を求めます。",
    descriptionEn: "When burned, magnesium combines with oxygen in a 3:2 mass ratio to form magnesium oxide. Compute the mass of oxygen that combines with 6.0g of magnesium, and the resulting mass of magnesium oxide.",
    localConstants: [{ symbol: "mMg", expression: "6.0g" }],
    steps: [
      { title: "結びつく酸素の質量", titleEn: "Mass of oxygen combined", expression: "mMg*(2/3)", targetUnit: "g", formulaLatex: "m_O = m_{Mg} \\times \\dfrac{2}{3}" },
      { title: "できる酸化マグネシウムの質量", titleEn: "Mass of magnesium oxide formed", expression: "mMg+s1", targetUnit: "g", formulaLatex: "m_{MgO} = m_{Mg} + m_O" },
    ],
  },
  {
    title: "化学反応で発生した気体の質量",
    titleEn: "Mass of gas produced by a chemical reaction",
    description: "開放した容器で石灰石に塩酸を加えると、発生した二酸化炭素が空気中に逃げて全体の質量が減ります。質量保存の法則から、逃げた気体の質量を求めます。",
    descriptionEn: "Adding hydrochloric acid to limestone in an open container releases carbon dioxide gas into the air, reducing the total mass. Use conservation of mass to find the mass of gas released.",
    localConstants: [
      { symbol: "mBefore", expression: "45.0g" },
      { symbol: "mAfter", expression: "43.6g" },
    ],
    steps: [{ title: "発生した気体の質量", titleEn: "Mass of gas released", expression: "mBefore-mAfter", targetUnit: "g", formulaLatex: "m_{gas} = m_{before} - m_{after}" }],
  },
  {
    title: "水の電気分解で生じる水素と酸素の体積比",
    titleEn: "Volume ratio of hydrogen to oxygen from electrolysis of water",
    description: "水を電気分解すると、水素と酸素が2:1の体積比で発生します。発生した酸素の体積から、水素の体積を求めます。",
    descriptionEn: "Electrolysis of water produces hydrogen and oxygen gas in a 2:1 volume ratio. Compute the volume of hydrogen produced from the volume of oxygen produced.",
    localConstants: [{ symbol: "Vₒ₂", expression: "15mL" }],
    steps: [{ title: "水素の体積", titleEn: "Volume of hydrogen", expression: "Vₒ₂*2", targetUnit: "mL", formulaLatex: "V_{H_2} = 2V_{O_2}" }],
  },
];
