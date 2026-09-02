import type { NotebookSeed } from "../types";

/** 理科「速さ・運動」。小学校・中学校で学ぶ、速さ・道のり・時間の関係と等加速度運動をまとめている。 */
export const SCIENCE_MOTION_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Speed, distance, and time (the fundamental relation)", ja: "速さ・道のり・時間の関係（はじきの公式）" },
    description: { en: "Using a train that covers 140km in 2 hours as an example, walk through all three forms of the speed-distance-time relation.", ja: "140kmを2時間で走る電車を例に、速さ・道のり・時間の3つの公式を順番に確認します。" },
    formulas: [
      { explanation: { en: "Speed equals distance divided by time.", ja: "速さは、道のりを時間で割って求めます。" }, latex: "v = \\dfrac{d}{t}" },
      { explanation: { en: "Distance equals speed multiplied by time.", ja: "道のりは、速さに時間をかけて求めます。" }, latex: "d = vt" },
      { explanation: { en: "Time equals distance divided by speed.", ja: "時間は、道のりを速さで割って求めます。" }, latex: "t = \\dfrac{d}{v}" },
    ],
    localConstants: [
      { symbol: "d", expression: "140km" },
      { symbol: "t", expression: "2h" },
      { symbol: "t₂", expression: "3h" },
      { symbol: "d₃", expression: "245km" },
    ],
    steps: [
      { title: { en: "Speed v", ja: "速さ v" }, expression: "d/t", targetUnit: "km/h", formulaLatex: "v = \\dfrac{d}{t}", resultSymbol: "v" },
      { title: { en: "Distance covered in 3 hours", ja: "3時間で進む道のり" }, expression: "v*t₂", targetUnit: "km", formulaLatex: "d_2 = v t_2" },
      { title: { en: "Time needed to cover 245km", ja: "245km進むのにかかる時間" }, expression: "d₃/v", targetUnit: "h", formulaLatex: "t_3 = \\dfrac{d_3}{v}" },
    ],
  },
  {
    title: { en: "Average speed", ja: "平均の速さ" },
    description: { en: "Compute average speed by dividing total distance by total time when speed varies between segments.", ja: "区間ごとに速さが違うとき、道のりの合計を時間の合計で割って平均の速さを求めます。" },
    localConstants: [
      { symbol: "d₁", expression: "60km" },
      { symbol: "t₁", expression: "1h" },
      { symbol: "d₂", expression: "90km" },
      { symbol: "t₂", expression: "1.5h" },
    ],
    steps: [
      { title: { en: "Total distance", ja: "道のりの合計" }, expression: "d₁+d₂", targetUnit: "km", formulaLatex: "d = d_1 + d_2" },
      { title: { en: "Total time", ja: "時間の合計" }, expression: "t₁+t₂", targetUnit: "h", formulaLatex: "t = t_1 + t_2" },
      { title: { en: "Average speed", ja: "平均の速さ" }, expression: "s1/s2", targetUnit: "km/h", formulaLatex: "\\bar{v} = \\dfrac{d}{t}" },
    ],
  },
  {
    title: { en: "Converting speed units (per second, per minute, per hour)", ja: "速さの単位換算（秒速・分速・時速）" },
    description: { en: "Express the same speed in units per second, per minute, and per hour to check the conversions.", ja: "同じ速さを秒速・分速・時速のそれぞれで表し、単位換算を確認します。" },
    localConstants: [{ symbol: "v", expression: "10m/s" }],
    steps: [
      { title: { en: "Speed per second", ja: "秒速" }, expression: "v", targetUnit: "m/s", formulaLatex: "v" },
      { title: { en: "Speed per minute", ja: "分速" }, expression: "v", targetUnit: "m/min", formulaLatex: "v" },
      { title: { en: "Speed per hour", ja: "時速" }, expression: "v", targetUnit: "km/h", formulaLatex: "v" },
    ],
  },
  {
    title: { en: "Speed of an interval from a ticker-tape timer", ja: "記録タイマーで区間の速さを求める" },
    description: { en: "A ticker-tape timer makes a dot every 0.02s. Compute the speed over a 5-dot interval spanning 4.5cm.", ja: "1打点0.02秒の記録タイマーで、5打点分の区間（4.5cm）の速さを求めます。" },
    localConstants: [
      { symbol: "n", expression: "5" },
      { symbol: "interval", expression: "0.02s" },
      { symbol: "d", expression: "4.5cm" },
    ],
    steps: [
      { title: { en: "Interval time", ja: "区間の時間" }, expression: "n*interval", targetUnit: "s", formulaLatex: "t = n \\times 0.02\\text{s}" },
      { title: { en: "Interval speed", ja: "区間の速さ" }, expression: "d/s1", targetUnit: "cm/s", formulaLatex: "v = \\dfrac{d}{t}" },
    ],
  },
  {
    title: { en: "Change in speed under uniform acceleration", ja: "等加速度の速さの変化" },
    description: { en: "Compute the acceleration of a cart whose speed changes from 3m/s to 7m/s over 2 seconds.", ja: "台車の速さが2秒間で3m/sから7m/sに変化したときの加速度を求めます。" },
    localConstants: [
      { symbol: "v₁", expression: "3m/s" },
      { symbol: "v₂", expression: "7m/s" },
      { symbol: "t", expression: "2s" },
    ],
    steps: [
      { title: { en: "Change in speed Δv", ja: "速さの変化 Δv" }, expression: "v₂-v₁", targetUnit: "m/s", formulaLatex: "\\Delta v = v_2 - v_1" },
      { title: { en: "Acceleration a", ja: "加速度 a" }, expression: "s1/t", targetUnit: "m/s²", formulaLatex: "a = \\dfrac{\\Delta v}{\\Delta t}" },
    ],
  },
];

/** 理科「密度・濃度」。物体の密度・水に浮くか沈むかの判定・水溶液の濃度をまとめている。 */
export const SCIENCE_DENSITY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Density, mass, and volume (a lump of metal)", ja: "密度・質量・体積の関係（金属のかたまり）" },
    description: { en: "Find the density of a 54g, 20cm³ metal sample, then use that density to find the mass and volume of other amounts of the same metal.", ja: "質量54g・体積20cm³の金属片から密度を求め、同じ金属の別の質量・体積も密度から計算します。" },
    formulas: [
      { explanation: { en: "Density equals mass divided by volume.", ja: "密度は、質量を体積で割って求めます。" }, latex: "\\rho = \\dfrac{m}{V}" },
      { explanation: { en: "Mass equals density multiplied by volume.", ja: "質量は、密度に体積をかけて求めます。" }, latex: "m = \\rho V" },
      { explanation: { en: "Volume equals mass divided by density.", ja: "体積は、質量を密度で割って求めます。" }, latex: "V = \\dfrac{m}{\\rho}" },
    ],
    localConstants: [
      { symbol: "m", expression: "54g" },
      { symbol: "V", expression: "20cm³" },
      { symbol: "V₂", expression: "10cm³" },
      { symbol: "m₃", expression: "81g" },
    ],
    steps: [
      { title: { en: "Density ρ", ja: "密度 ρ" }, expression: "m/V", targetUnit: "g/cm³", formulaLatex: "\\rho = \\dfrac{m}{V}", resultSymbol: "ρ" },
      { title: { en: "Mass of 10cm³ of the same metal", ja: "体積10cm³の質量" }, expression: "ρ*V₂", targetUnit: "g", formulaLatex: "m_2 = \\rho V_2" },
      { title: { en: "Volume of 81g of the same metal", ja: "質量81gの体積" }, expression: "m₃/ρ", targetUnit: "cm³", formulaLatex: "V_3 = \\dfrac{m_3}{\\rho}" },
    ],
  },
  {
    title: { en: "Does it float or sink? (judging by density)", ja: "水に浮くか沈むか（密度で判断）" },
    description: { en: "Find the density of a 50cm³, 40g piece of wood and compare it to the density of water (1g/cm³) to see if it floats or sinks.", ja: "体積50cm³・質量40gの木片の密度を求め、水の密度（1g/cm³）と比べて浮くか沈むかを判定します。" },
    localConstants: [
      { symbol: "m", expression: "40g" },
      { symbol: "V", expression: "50cm³" },
    ],
    steps: [
      { title: { en: "Density ρ", ja: "密度 ρ" }, expression: "m/V", targetUnit: "g/cm³", formulaLatex: "\\rho = \\dfrac{m}{V}" },
      { title: { en: "Ratio to water's density (floats if under 1)", ja: "水の密度との比（1未満なら浮く）" }, expression: "s1/(1g/cm³)", targetUnit: "", formulaLatex: "\\dfrac{\\rho}{\\rho_{water}}" },
    ],
  },
  {
    title: { en: "Mass percent concentration", ja: "質量パーセント濃度" },
    description: { en: "Compute the mass percent concentration of a solution made by dissolving 20g of solute in 180g of water.", ja: "溶質20gを水180gに溶かした水溶液の、質量パーセント濃度を求めます。" },
    localConstants: [
      { symbol: "mₛₒₗᵤₜₑ", expression: "20g" },
      { symbol: "mₛₒₗᵥₑₙₜ", expression: "180g" },
    ],
    steps: [
      { title: { en: "Mass of the solution", ja: "水溶液の質量" }, expression: "mₛₒₗᵤₜₑ+mₛₒₗᵥₑₙₜ", targetUnit: "g", formulaLatex: "m_{sol} = m_{solute} + m_{solvent}" },
      { title: { en: "Mass percent concentration", ja: "質量パーセント濃度" }, expression: "mₛₒₗᵤₜₑ/s1", targetUnit: "%", formulaLatex: "\\text{percent} = \\dfrac{m_{solute}}{m_{sol}}" },
    ],
  },
  {
    title: { en: "Mass of solute (from mass percent concentration)", ja: "溶質の質量（質量パーセント濃度から）" },
    description: { en: "Compute the mass of solute contained in 250g of an 8% solution.", ja: "8%の水溶液250gの中に含まれる、溶質の質量を求めます。" },
    localConstants: [
      { symbol: "mₛₒₗ", expression: "250g" },
      { symbol: "percent", expression: "8%" },
    ],
    steps: [{ title: { en: "Mass of solute", ja: "溶質の質量" }, expression: "mₛₒₗ*percent", targetUnit: "g", formulaLatex: "m_{solute} = m_{sol} \\times \\text{percent}" }],
  },
  {
    title: { en: "Mass percent concentration of a saturated solution (from solubility)", ja: "溶解度から飽和水溶液の質量パーセント濃度" },
    description: { en: "Potassium nitrate has a solubility of 110g per 100g of water at 60°C. Compute the mass percent concentration of the resulting saturated solution.", ja: "60℃の水100gに硝酸カリウムが110gまで溶ける（溶解度110）とき、飽和水溶液の質量パーセント濃度を求めます。" },
    localConstants: [
      { symbol: "solubility", expression: "110g" },
      { symbol: "water", expression: "100g" },
    ],
    steps: [
      { title: { en: "Mass of the saturated solution", ja: "飽和水溶液の質量" }, expression: "solubility+water", targetUnit: "g", formulaLatex: "m_{sol} = \\text{solubility} + m_{water}" },
      { title: { en: "Mass percent concentration", ja: "質量パーセント濃度" }, expression: "solubility/s1", targetUnit: "%", formulaLatex: "\\text{percent} = \\dfrac{\\text{solubility}}{m_{sol}}" },
    ],
  },
];

/** 理科「圧力・浮力」。圧力の基本公式・水圧・大気圧・浮力（アルキメデスの原理）をまとめている。 */
export const SCIENCE_PRESSURE_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Pressure equals force divided by area", ja: "圧力＝力÷面積" },
    description: { en: "Compute pressure from the force pressing perpendicular to a surface and the area of that surface.", ja: "面を垂直に押す力と、力がはたらく面積から、圧力を求めます。" },
    localConstants: [
      { symbol: "F", expression: "60N" },
      { symbol: "A", expression: "0.02m²" },
    ],
    steps: [{ title: { en: "Pressure P", ja: "圧力 P" }, expression: "F/A", targetUnit: "Pa", formulaLatex: "P = \\dfrac{F}{A}" }],
  },
  {
    title: { en: "Denting a sponge (pressure with different contact areas)", ja: "スポンジのへこみ（接地面積を変えたときの圧力）" },
    description: { en: "Compare the pressure of the same 40N block when it rests on a 0.01m² face versus a 0.04m² face.", ja: "同じ40Nのブロックを、接地面積0.01m²で置いた場合と0.04m²で置いた場合の圧力を比べます。" },
    localConstants: [
      { symbol: "F", expression: "40N" },
      { symbol: "A₁", expression: "0.01m²" },
      { symbol: "A₂", expression: "0.04m²" },
    ],
    steps: [
      { title: { en: "Pressure P1 with a 0.01m² face", ja: "面積0.01m²のときの圧力 P1" }, expression: "F/A₁", targetUnit: "Pa", formulaLatex: "P_1 = \\dfrac{F}{A_1}" },
      { title: { en: "Pressure P2 with a 0.04m² face", ja: "面積0.04m²のときの圧力 P2" }, expression: "F/A₂", targetUnit: "Pa", formulaLatex: "P_2 = \\dfrac{F}{A_2}" },
    ],
  },
  {
    title: { en: "Water pressure P=ρgh", ja: "水圧 P=ρgh" },
    description: { en: "Compute the water pressure at a given depth from the density of water, gravitational acceleration, and depth.", ja: "水の密度・重力加速度・水面からの深さから、水中の圧力（水圧）を求めます。" },
    localConstants: [
      { symbol: "ρ", expression: "1000kg/m³" },
      { symbol: "g", expression: "9.8m/s²" },
      { symbol: "h", expression: "5m" },
    ],
    steps: [{ title: { en: "Water pressure P", ja: "水圧 P" }, expression: "ρ*g*h", targetUnit: "kPa", formulaLatex: "P = \\rho g h" }],
  },
  {
    title: { en: "Converting atmospheric pressure units (hPa, Pa, atm)", ja: "大気圧の単位換算（hPa・Pa・atm）" },
    description: { en: "Express the familiar weather-forecast value of 1013hPa in pascals and in standard atmospheres.", ja: "天気予報でおなじみの1013hPaを、パスカルと気圧（atm）で表します。" },
    localConstants: [{ symbol: "P", expression: "1013hPa" }],
    steps: [
      { title: { en: "Convert to pascals", ja: "パスカルに変換" }, expression: "P", targetUnit: "Pa", formulaLatex: "P" },
      { title: { en: "Convert to standard atmospheres", ja: "気圧(atm)に変換" }, expression: "P", targetUnit: "atm", formulaLatex: "P" },
    ],
  },
  {
    title: { en: "Buoyant force (Archimedes' principle)", ja: "浮力（アルキメデスの原理）" },
    description: { en: "Compute the buoyant force on an object—the weight of the water it displaces—from the submerged volume.", ja: "水中に沈んだ部分の体積から、物体が受ける浮力（押しのけた水の重さ）を求めます。" },
    localConstants: [
      { symbol: "ρ", expression: "1000kg/m³" },
      { symbol: "V", expression: "0.002m³" },
      { symbol: "g", expression: "9.8m/s²" },
    ],
    steps: [{ title: { en: "Buoyant force F", ja: "浮力 F" }, expression: "ρ*V*g", targetUnit: "N", formulaLatex: "F_b = \\rho V g" }],
  },
];

/** 理科「力・仕事・てこ」。重さと質量・フックの法則・仕事の原理・てこのつり合いをまとめている。 */
export const SCIENCE_FORCE_WORK_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Weight and mass (W=mg)", ja: "重さと質量（W=mg）" },
    description: { en: "Compute the weight (gravitational force) of a 100g object. The result should be about 0.98N.", ja: "質量100gの物体にはたらく重力（重さ）を求めます。100gの物体はおよそ0.98Nになります。" },
    localConstants: [
      { symbol: "m", expression: "100g" },
      { symbol: "g", expression: "9.8m/s²" },
    ],
    steps: [{ title: { en: "Weight W", ja: "重さ W" }, expression: "m*g", targetUnit: "N", formulaLatex: "W = mg" }],
  },
  {
    title: { en: "Hooke's law (spring extension)", ja: "フックの法則（ばねの伸び）" },
    description: { en: "Compute the extension of a spring from its spring constant and the applied force.", ja: "ばね定数と加えた力から、ばねの伸びを求めます。" },
    localConstants: [
      { symbol: "k", expression: "50N/m" },
      { symbol: "F", expression: "2N" },
    ],
    steps: [{ title: { en: "Extension x", ja: "伸び x" }, expression: "F/k", targetUnit: "cm", formulaLatex: "x = \\dfrac{F}{k}" }],
  },
  {
    title: { en: "Work and power", ja: "仕事と仕事率" },
    description: { en: "Compute the work done from force and distance, then compute the power from the time it took.", ja: "力と移動距離から仕事を求め、それにかかった時間から仕事率を求めます。" },
    localConstants: [
      { symbol: "F", expression: "20N" },
      { symbol: "d", expression: "3m" },
      { symbol: "t", expression: "5s" },
    ],
    steps: [
      { title: { en: "Work W", ja: "仕事 W" }, expression: "F*d", targetUnit: "J", formulaLatex: "W = Fd" },
      { title: { en: "Power P", ja: "仕事率 P" }, expression: "s1/t", targetUnit: "W", formulaLatex: "P = \\dfrac{W}{t}" },
    ],
  },
  {
    title: { en: "Movable pulley and the principle of work", ja: "動滑車と仕事の原理" },
    description: { en: "A movable pulley halves the force needed but doubles the length of rope pulled, so the total work done stays the same.", ja: "動滑車を使うと必要な力は半分になりますが、引くひもの長さは2倍になり、仕事の総量は変わらないことを確かめます。" },
    localConstants: [
      { symbol: "F", expression: "60N" },
      { symbol: "d", expression: "2m" },
    ],
    steps: [
      { title: { en: "Work lifting directly W", ja: "直接持ち上げる仕事 W" }, expression: "F*d", targetUnit: "J", formulaLatex: "W = Fd" },
      { title: { en: "Force needed with a movable pulley", ja: "動滑車で必要な力" }, expression: "F/2", targetUnit: "N", formulaLatex: "F_{pull} = \\dfrac{F}{2}" },
      { title: { en: "Length of rope pulled", ja: "引くひもの長さ" }, expression: "d*2", targetUnit: "m", formulaLatex: "d_{pull} = 2d" },
      { title: { en: "Work done using the pulley", ja: "動滑車を使った仕事" }, expression: "s2*s3", targetUnit: "J", formulaLatex: "W_{pull} = F_{pull} \\cdot d_{pull}" },
    ],
  },
  {
    title: { en: "Lever equilibrium", ja: "てこのつり合い" },
    description: { en: "Using the lever equilibrium equation, compute the force needed on one side from the distances and the force on the other side.", ja: "支点からの距離と一方の力から、もう一方に必要な力を、てこのつり合いの式から求めます。" },
    localConstants: [
      { symbol: "F₁", expression: "30N" },
      { symbol: "L₁", expression: "0.6m" },
      { symbol: "L₂", expression: "0.2m" },
    ],
    steps: [{ title: { en: "Required force F2", ja: "必要な力 F2" }, expression: "F₁*L₁/L₂", targetUnit: "N", formulaLatex: "F_2 = F_1\\dfrac{L_1}{L_2}" }],
  },
  {
    title: { en: "Work on an inclined plane (the principle of work)", ja: "斜面を使った仕事（仕事の原理）" },
    description: { en: "Compute the work needed to lift a 5kg object 2m straight up, then find the force needed to push it up a 5m-long ramp instead—the work stays the same.", ja: "質量5kgの物体を高さ2mまで持ち上げる仕事を求め、長さ5mの斜面を使う場合に必要な力を求めます。仕事の量は変わりません。" },
    localConstants: [
      { symbol: "m", expression: "5kg" },
      { symbol: "g", expression: "9.8m/s²" },
      { symbol: "h", expression: "2m" },
      { symbol: "L", expression: "5m" },
    ],
    steps: [
      { title: { en: "Work lifting directly W", ja: "直接持ち上げる仕事 W" }, expression: "m*g*h", targetUnit: "J", formulaLatex: "W = mgh" },
      { title: { en: "Force needed along the ramp F", ja: "斜面に沿って引く力 F" }, expression: "s1/L", targetUnit: "N", formulaLatex: "F = \\dfrac{W}{L}" },
    ],
  },
];

/** 理科「熱・温度」。熱量の計算・電熱線の発熱・カロリーとの換算・混合後の温度をまとめている。 */
export const SCIENCE_HEAT_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Heat quantity Q=mcΔT", ja: "熱量 Q=mcΔT" },
    description: { en: "Compute the heat absorbed by water from its mass, specific heat, and temperature change. Water's specific heat is 4.2J/(g·K).", ja: "水の質量・比熱・温度変化から、水が得た熱量を求めます。水の比熱は4.2J/(g・K)です。" },
    localConstants: [
      { symbol: "m", expression: "200g" },
      { symbol: "c", expression: "4.2J/(g*K)" },
      { symbol: "ΔT", expression: "30K" },
    ],
    steps: [{ title: { en: "Heat Q", ja: "熱量 Q" }, expression: "m*c*ΔT", targetUnit: "kJ", formulaLatex: "Q = mc\\Delta T" }],
  },
  {
    title: { en: "Heat from a resistance wire Q=VIt", ja: "電熱線の発熱 Q=VIt" },
    description: { en: "Compute the heat generated by a resistance wire from the voltage, current, and time it is energized.", ja: "電圧・電流・通電時間から、電熱線が発生する熱量を求めます。" },
    localConstants: [
      { symbol: "V", expression: "6V" },
      { symbol: "I", expression: "1.5A" },
      { symbol: "t", expression: "300s" },
    ],
    steps: [{ title: { en: "Heat Q", ja: "熱量 Q" }, expression: "V*I*t", targetUnit: "kJ", formulaLatex: "Q = VIt" }],
  },
  {
    title: { en: "Converting between joules and calories", ja: "熱量とカロリーの換算" },
    description: { en: "Express a heat quantity of 250cal in both joules and kilocalories.", ja: "250calの熱量を、ジュールとキロカロリーのそれぞれで表します。" },
    localConstants: [{ symbol: "Q", expression: "250cal" }],
    steps: [
      { title: { en: "Convert to joules", ja: "ジュールに変換" }, expression: "Q", targetUnit: "J", formulaLatex: "Q" },
      { title: { en: "Convert to kilocalories", ja: "キロカロリーに変換" }, expression: "Q", targetUnit: "kcal", formulaLatex: "Q" },
    ],
  },
  {
    title: { en: "Converting between Celsius and Kelvin", ja: "セ氏とケルビンの換算" },
    description: { en: "Convert an air temperature of 20°C to the Kelvin (absolute) scale.", ja: "20℃の気温を、絶対温度（ケルビン）に換算します。" },
    localConstants: [{ symbol: "T", expression: "20°C" }],
    steps: [{ title: { en: "Absolute temperature T", ja: "絶対温度 T" }, expression: "T", targetUnit: "K", formulaLatex: "T_K = T_C + 273.15" }],
  },
  {
    title: { en: "Temperature after mixing hot and cold water (conservation of heat)", ja: "湯と水を混ぜたときの温度（熱量保存）" },
    description: { en: "Mix 200g of 80°C hot water with 300g of 20°C cold water. Use conservation of heat to find the resulting temperature.", ja: "80℃のお湯200gと20℃の水300gを混ぜたとき、熱量保存の法則から混合後の温度を求めます。" },
    localConstants: [
      { symbol: "m₁", expression: "200g" },
      { symbol: "T₁", expression: "80°C" },
      { symbol: "m₂", expression: "300g" },
      { symbol: "T₂", expression: "20°C" },
    ],
    steps: [{ title: { en: "Resulting temperature Tf", ja: "混合後の温度 Tf" }, expression: "(m₁*T₁+m₂*T₂)/(m₁+m₂)", targetUnit: "°C", formulaLatex: "T_f = \\dfrac{m_1T_1+m_2T_2}{m_1+m_2}" }],
  },
];

/** 理科「電気・回路」。オームの法則・直列/並列回路・電力と電力量をまとめている。 */
export const SCIENCE_ELECTRICITY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Ohm's law (resistance, current, and voltage)", ja: "オームの法則（抵抗・電流・電圧の関係）" },
    description: { en: "Find the resistance of a resistor with 6V across it and 0.3A through it, then use that resistance to find the current and voltage in other conditions.", ja: "電圧6V・電流0.3Aの抵抗器の抵抗を求め、その抵抗を使って別の条件での電流・電圧を求めます。" },
    formulas: [
      { explanation: { en: "Voltage equals current multiplied by resistance.", ja: "電圧は、電流と抵抗をかけて求めます。" }, latex: "V = IR" },
      { explanation: { en: "Resistance equals voltage divided by current.", ja: "抵抗は、電圧を電流で割って求めます。" }, latex: "R = \\dfrac{V}{I}" },
      { explanation: { en: "Current equals voltage divided by resistance.", ja: "電流は、電圧を抵抗で割って求めます。" }, latex: "I = \\dfrac{V}{R}" },
    ],
    localConstants: [
      { symbol: "V", expression: "6V" },
      { symbol: "I", expression: "0.3A" },
      { symbol: "I₂", expression: "0.5A" },
      { symbol: "V₃", expression: "15V" },
    ],
    steps: [
      { title: { en: "Resistance R", ja: "抵抗 R" }, expression: "V/I", targetUnit: "Ohm", formulaLatex: "R = \\dfrac{V}{I}", resultSymbol: "R" },
      { title: { en: "Voltage V2 when the current is 0.5A", ja: "電流0.5Aのときの電圧 V2" }, expression: "I₂*R", targetUnit: "V", formulaLatex: "V_2 = I_2 R" },
      { title: { en: "Current I3 when the voltage is 15V", ja: "電圧15Vのときの電流 I3" }, expression: "V₃/R", targetUnit: "A", formulaLatex: "I_3 = \\dfrac{V_3}{R}" },
    ],
  },
  {
    title: { en: "Combined resistance in a series circuit", ja: "直列回路の合成抵抗" },
    description: { en: "Compute the combined resistance when two resistors are connected in series.", ja: "2つの抵抗を直列につないだときの、合成抵抗を求めます。" },
    localConstants: [
      { symbol: "R₁", expression: "10Ohm" },
      { symbol: "R₂", expression: "15Ohm" },
    ],
    steps: [{ title: { en: "Combined resistance R", ja: "合成抵抗 R" }, expression: "R₁+R₂", targetUnit: "Ohm", formulaLatex: "R = R_1 + R_2" }],
  },
  {
    title: { en: "Combined resistance in a parallel circuit", ja: "並列回路の合成抵抗" },
    description: { en: "Compute the combined resistance when two resistors are connected in parallel.", ja: "2つの抵抗を並列につないだときの、合成抵抗を求めます。" },
    localConstants: [
      { symbol: "R₁", expression: "10Ohm" },
      { symbol: "R₂", expression: "15Ohm" },
    ],
    steps: [{ title: { en: "Combined resistance R", ja: "合成抵抗 R" }, expression: "(1/R₁+1/R₂)^-1", targetUnit: "Ohm", formulaLatex: "R = \\left(\\dfrac{1}{R_1} + \\dfrac{1}{R_2}\\right)^{-1}" }],
  },
  {
    title: { en: "Electric power P=VI", ja: "電力 P=VI" },
    description: { en: "Compute the electric power consumed by an appliance from its voltage and current.", ja: "電圧と電流から、電気器具が消費する電力を求めます。" },
    localConstants: [
      { symbol: "V", expression: "100V" },
      { symbol: "I", expression: "6A" },
    ],
    steps: [{ title: { en: "Power P", ja: "電力 P" }, expression: "V*I", targetUnit: "W", formulaLatex: "P = VI" }],
  },
  {
    title: { en: "Energy consumption and electricity cost (kWh and cost)", ja: "電力量と電気代（kWhと電気代）" },
    description: { en: "Compute the energy consumed and its cost from the power rating, usage time, and price per kWh.", ja: "消費電力・使用時間・電力量単価から、使用した電力量と電気代を求めます。" },
    localConstants: [
      { symbol: "P", expression: "1000W" },
      { symbol: "t", expression: "2h" },
      { symbol: "rate", expression: "30" },
    ],
    steps: [
      { title: { en: "Energy used E", ja: "使用電力量 E" }, expression: "P*t", targetUnit: "kWh", formulaLatex: "E = Pt" },
      { title: { en: "Cost", ja: "電気代" }, expression: "(s1/1kWh)*rate", targetUnit: "", formulaLatex: "\\text{cost} = \\dfrac{E}{1\\text{kWh}} \\times \\text{rate}" },
    ],
  },
];

/** 理科「光・音」。音の速さ・波の基本式・凸レンズ・光の反射をまとめている。 */
export const SCIENCE_LIGHT_SOUND_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Finding distance from the speed of sound (lightning to thunder)", ja: "音の速さで距離を求める（雷が光ってから音まで）" },
    description: { en: "Estimate the distance to a lightning strike from the time between seeing the flash and hearing the thunder.", ja: "雷が光ってから雷鳴が聞こえるまでの時間から、雷までのおよその距離を求めます。" },
    localConstants: [
      { symbol: "v", expression: "340m/s" },
      { symbol: "t", expression: "3s" },
    ],
    steps: [{ title: { en: "Distance d", ja: "距離 d" }, expression: "v*t", targetUnit: "m", formulaLatex: "d = vt" }],
  },
  {
    title: { en: "Speed of sound v=fλ", ja: "音の速さ v=fλ" },
    description: { en: "Compute the wavelength of a sound from its speed and frequency.", ja: "音の速さと振動数から、波長を求めます。" },
    localConstants: [
      { symbol: "v", expression: "340m/s" },
      { symbol: "f", expression: "440Hz" },
    ],
    steps: [{ title: { en: "Wavelength λ", ja: "波長 λ" }, expression: "v/f", targetUnit: "m", formulaLatex: "\\lambda = \\dfrac{v}{f}" }],
  },
  {
    title: { en: "Frequency and wavelength of a vibrating string", ja: "弦の振動数と波長" },
    description: { en: "Compute the frequency of a vibrating string from the wave speed and wavelength.", ja: "弦を伝わる波の速さと波長から、弦の振動数を求めます。" },
    localConstants: [
      { symbol: "v", expression: "120m/s" },
      { symbol: "λ", expression: "0.6m" },
    ],
    steps: [{ title: { en: "Frequency f", ja: "振動数 f" }, expression: "v/λ", targetUnit: "Hz", formulaLatex: "f = \\dfrac{v}{\\lambda}" }],
  },
  {
    title: { en: "Convex lens (image position and magnification)", ja: "凸レンズ（像の位置と倍率）" },
    description: { en: "Find the image position and magnification for an object placed 20cm in front of a convex lens with a 15cm focal length.", ja: "焦点距離15cmの凸レンズの前方20cmに物体を置いたときの、像の位置と倍率を求めます。" },
    localConstants: [
      { symbol: "f", expression: "15cm" },
      { symbol: "a", expression: "20cm" },
    ],
    steps: [
      { title: { en: "Image position b", ja: "像の位置 b" }, expression: "(1/f-1/a)^-1", targetUnit: "cm", formulaLatex: "\\dfrac{1}{a} + \\dfrac{1}{b} = \\dfrac{1}{f}" },
      { title: { en: "Magnification m", ja: "倍率 m" }, expression: "s1/a", targetUnit: "", formulaLatex: "m = \\dfrac{b}{a}" },
    ],
  },
  {
    title: { en: "Reflection of light (angle of incidence and reflection)", ja: "光の反射（入射角と反射角）" },
    description: { en: "Use the law of reflection (angle of incidence equals angle of reflection) to find the reflection angle and the angle between the incident and reflected rays.", ja: "反射の法則（入射角＝反射角）から反射角を求め、入射光と反射光のなす角も求めます。" },
    localConstants: [{ symbol: "θᵢ", expression: "32deg" }],
    steps: [
      { title: { en: "Angle of reflection θr", ja: "反射角 θr" }, expression: "θᵢ", targetUnit: "deg", formulaLatex: "\\theta_r = \\theta_i" },
      { title: { en: "Angle between incident and reflected rays", ja: "入射光と反射光のなす角" }, expression: "2*θᵢ", targetUnit: "deg", formulaLatex: "\\theta = \\theta_i + \\theta_r = 2\\theta_i" },
    ],
  },
];

/** 理科「地学・天気」。湿度・地震波の伝わり方・地層の堆積・台風の気圧をまとめている。 */
export const SCIENCE_EARTH_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Finding relative humidity (from vapor content and from dew point)", ja: "湿度の求め方（水蒸気量から・露点から）" },
    description: { en: "Compute relative humidity from the actual water vapor content and the saturation vapor density at the air temperature, then compute it again using the dew point instead.", ja: "空気1m³中の水蒸気量とその気温での飽和水蒸気量から湿度を求め、露点（別の気温での飽和水蒸気量）からも同じように求めます。" },
    localConstants: [
      { symbol: "a", expression: "18.0g/m³" },
      { symbol: "aₛₐₜ", expression: "23.1g/m³" },
      { symbol: "a_dew", expression: "17.3g/m³" },
    ],
    steps: [
      { title: { en: "Humidity from vapor content", ja: "水蒸気量からの湿度" }, expression: "a/aₛₐₜ", targetUnit: "%", formulaLatex: "RH = \\dfrac{a}{a_{sat}} \\times 100\\%" },
      { title: { en: "Humidity from the dew point (20°C)", ja: "露点(20℃)からの湿度" }, expression: "a_dew/aₛₐₜ", targetUnit: "%", formulaLatex: "RH = \\dfrac{a_{dew}}{a_{sat}} \\times 100\\%" },
    ],
  },
  {
    title: { en: "Omori's formula (epicentral distance from the P-S time)", ja: "大森公式（初期微動継続時間から震源までの距離）" },
    description: { en: "Use Omori's formula to compute the distance to the epicenter from the P-S time (the interval between P-wave and S-wave arrivals).", ja: "初期微動継続時間（P波とS波の到達時刻の差）から、大森公式で震源までの距離を求めます。" },
    localConstants: [
      { symbol: "k", expression: "8km/s" },
      { symbol: "Tₛ", expression: "12s" },
    ],
    steps: [{ title: { en: "Distance to the epicenter d", ja: "震源までの距離 d" }, expression: "k*Tₛ", targetUnit: "km", formulaLatex: "d = k T_s" }],
  },
  {
    title: { en: "Speed of P-waves and S-waves", ja: "P波・S波の速さ" },
    description: { en: "Compute the speed of the P-wave and S-wave from the distance to the epicenter and each wave's arrival time.", ja: "震源からの距離と、P波・S波それぞれの到達時間から、それぞれの伝わる速さを求めます。" },
    localConstants: [
      { symbol: "d", expression: "80km" },
      { symbol: "tₚ", expression: "10s" },
      { symbol: "tₛ", expression: "20s" },
    ],
    steps: [
      { title: { en: "P-wave speed Vp", ja: "P波の速さ Vp" }, expression: "d/tₚ", targetUnit: "km/s", formulaLatex: "V_p = \\dfrac{d}{t_p}" },
      { title: { en: "S-wave speed Vs", ja: "S波の速さ Vs" }, expression: "d/tₛ", targetUnit: "km/s", formulaLatex: "V_s = \\dfrac{d}{t_s}" },
    ],
  },
  {
    title: { en: "Sedimentation rate of a rock layer", ja: "地層の堆積速度" },
    description: { en: "Compute the sedimentation rate from the thickness of a rock layer and the number of years it took to form.", ja: "地層の厚さと堆積にかかった年数から、堆積速度を求めます。" },
    localConstants: [
      { symbol: "thickness", expression: "2m" },
      { symbol: "years", expression: "10000yr" },
    ],
    steps: [{ title: { en: "Sedimentation rate", ja: "堆積速度" }, expression: "thickness/years", targetUnit: "mm/yr", formulaLatex: "\\text{rate} = \\dfrac{\\text{thickness}}{\\text{years}}" }],
  },
  {
    title: { en: "Central pressure of a typhoon (converting hPa)", ja: "台風の中心気圧（hPaの換算）" },
    description: { en: "Convert a typhoon's central pressure of 935hPa into pascals and standard atmospheres.", ja: "台風の中心気圧935hPaを、パスカルと気圧（atm）に換算します。" },
    localConstants: [{ symbol: "P", expression: "935hPa" }],
    steps: [
      { title: { en: "Convert to pascals", ja: "パスカルに変換" }, expression: "P", targetUnit: "Pa", formulaLatex: "P" },
      { title: { en: "Convert to standard atmospheres", ja: "気圧(atm)に変換" }, expression: "P", targetUnit: "atm", formulaLatex: "P" },
    ],
  },
];

/** 理科「化学変化」。質量保存の法則・金属の酸化の質量比・電気分解の体積比をまとめている。 */
export const SCIENCE_CHEMISTRY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Conservation of mass (mass before and after a reaction)", ja: "質量保存の法則（反応前後の質量）" },
    description: { en: "In a sealed container, the total mass before a reaction equals the total mass after it, since nothing enters or leaves the system.", ja: "密閉した容器の中で反応させる場合、反応前の物質の質量の合計と、反応後の質量は変わりません。" },
    localConstants: [
      { symbol: "m₁", expression: "35.0g" },
      { symbol: "m₂", expression: "45.0g" },
    ],
    steps: [{ title: { en: "Mass after the reaction", ja: "反応後の質量" }, expression: "m₁+m₂", targetUnit: "g", formulaLatex: "m_{after} = m_{before} = m_1 + m_2" }],
  },
  {
    title: { en: "Mass ratio in copper oxidation (Cu:O=4:1)", ja: "銅の酸化の質量比（Cu:O=4:1）" },
    description: { en: "When heated, copper combines with oxygen in a 4:1 mass ratio to form copper oxide. Compute the mass of oxygen that combines with 8.0g of copper, and the resulting mass of copper oxide.", ja: "銅を加熱すると酸素と4:1の質量比で結びついて酸化銅になります。銅8.0gに結びつく酸素と、できる酸化銅の質量を求めます。" },
    localConstants: [{ symbol: "mCu", expression: "8.0g" }],
    steps: [
      { title: { en: "Mass of oxygen combined", ja: "結びつく酸素の質量" }, expression: "mCu*(1/4)", targetUnit: "g", formulaLatex: "m_O = m_{Cu} \\times \\dfrac{1}{4}" },
      { title: { en: "Mass of copper oxide formed", ja: "できる酸化銅の質量" }, expression: "mCu+s1", targetUnit: "g", formulaLatex: "m_{CuO} = m_{Cu} + m_O" },
    ],
  },
  {
    title: { en: "Combustion of magnesium (Mg:O=3:2)", ja: "マグネシウムの燃焼（Mg:O=3:2）" },
    description: { en: "When burned, magnesium combines with oxygen in a 3:2 mass ratio to form magnesium oxide. Compute the mass of oxygen that combines with 6.0g of magnesium, and the resulting mass of magnesium oxide.", ja: "マグネシウムを燃焼させると酸素と3:2の質量比で結びついて酸化マグネシウムになります。マグネシウム6.0gに結びつく酸素と、できる酸化マグネシウムの質量を求めます。" },
    localConstants: [{ symbol: "mMg", expression: "6.0g" }],
    steps: [
      { title: { en: "Mass of oxygen combined", ja: "結びつく酸素の質量" }, expression: "mMg*(2/3)", targetUnit: "g", formulaLatex: "m_O = m_{Mg} \\times \\dfrac{2}{3}" },
      { title: { en: "Mass of magnesium oxide formed", ja: "できる酸化マグネシウムの質量" }, expression: "mMg+s1", targetUnit: "g", formulaLatex: "m_{MgO} = m_{Mg} + m_O" },
    ],
  },
  {
    title: { en: "Mass of gas produced by a chemical reaction", ja: "化学反応で発生した気体の質量" },
    description: { en: "Adding hydrochloric acid to limestone in an open container releases carbon dioxide gas into the air, reducing the total mass. Use conservation of mass to find the mass of gas released.", ja: "開放した容器で石灰石に塩酸を加えると、発生した二酸化炭素が空気中に逃げて全体の質量が減ります。質量保存の法則から、逃げた気体の質量を求めます。" },
    localConstants: [
      { symbol: "mBefore", expression: "45.0g" },
      { symbol: "mAfter", expression: "43.6g" },
    ],
    steps: [{ title: { en: "Mass of gas released", ja: "発生した気体の質量" }, expression: "mBefore-mAfter", targetUnit: "g", formulaLatex: "m_{gas} = m_{before} - m_{after}" }],
  },
  {
    title: { en: "Volume ratio of hydrogen to oxygen from electrolysis of water", ja: "水の電気分解で生じる水素と酸素の体積比" },
    description: { en: "Electrolysis of water produces hydrogen and oxygen gas in a 2:1 volume ratio. Compute the volume of hydrogen produced from the volume of oxygen produced.", ja: "水を電気分解すると、水素と酸素が2:1の体積比で発生します。発生した酸素の体積から、水素の体積を求めます。" },
    localConstants: [{ symbol: "Vₒ₂", expression: "15mL" }],
    steps: [{ title: { en: "Volume of hydrogen", ja: "水素の体積" }, expression: "Vₒ₂*2", targetUnit: "mL", formulaLatex: "V_{H_2} = 2V_{O_2}" }],
  },
];
