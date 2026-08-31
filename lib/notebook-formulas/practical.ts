import type { NotebookSeed } from "./types";

/** 「電気の基礎計算」。オームの法則・電気代・ブレーカー容量など、生活に身近な電気の計算をまとめている。 */
export const ELECTRICITY_BASICS_SEEDS: NotebookSeed[] = [
  {
    title: "実用オームの法則（LED回路の抵抗値）",
    titleEn: "Practical Ohm's law (LED resistor sizing)",
    description: "電源電圧・LEDの順方向電圧・希望電流から、必要な抵抗値を求めます。",
    descriptionEn: "Compute the resistor value needed for an LED circuit from the supply voltage, LED forward voltage, and desired current.",
    localConstants: [
      { symbol: "Vsupply", expression: "5V" },
      { symbol: "Vf", expression: "2V" },
      { symbol: "I", expression: "15mA" },
    ],
    steps: [{ title: "必要な抵抗値 R", titleEn: "Required resistance R", expression: "(Vsupply-Vf)/I", targetUnit: "Ohm", formulaLatex: "R = \\dfrac{V_{supply} - V_f}{I}" }],
  },
  {
    title: "消費電力量と電気代",
    titleEn: "Energy consumption and electricity cost",
    description: "消費電力・使用時間・電力量単価から、使用した電力量と電気代を求めます。",
    descriptionEn: "Compute the energy consumed and its cost from the power rating, usage time, and price per kWh.",
    localConstants: [
      { symbol: "P", expression: "1200W" },
      { symbol: "t", expression: "3h" },
      { symbol: "rate", expression: "31" },
    ],
    steps: [
      { title: "使用電力量 E", titleEn: "Energy used E", expression: "P*t", targetUnit: "kWh", formulaLatex: "E = Pt" },
      { title: "電気代", titleEn: "Cost", expression: "(s1/1kWh)*rate", targetUnit: "", formulaLatex: "\\text{cost} = \\dfrac{E}{1\\text{kWh}} \\times \\text{rate}" },
    ],
  },
  {
    title: "ブレーカー容量",
    titleEn: "Circuit breaker capacity",
    description: "契約電圧とブレーカーの許容電流から、使用できる最大電力を求めます。",
    descriptionEn: "Compute the maximum usable power from the contracted voltage and the breaker's rated current.",
    localConstants: [
      { symbol: "V", expression: "100V" },
      { symbol: "Imax", expression: "30A" },
    ],
    steps: [{ title: "最大電力 Pmax", titleEn: "Maximum power Pmax", expression: "V*Imax", targetUnit: "W", formulaLatex: "P_{max} = V \\cdot I_{max}" }],
  },
  {
    title: "抵抗の直列・並列合成",
    titleEn: "Series and parallel resistor combination",
    description: "2つの抵抗値から、直列合成抵抗と並列合成抵抗をそれぞれ求めます。",
    descriptionEn: "Compute the combined resistance of two resistors both in series and in parallel.",
    localConstants: [
      { symbol: "R1", expression: "100Ohm" },
      { symbol: "R2", expression: "200Ohm" },
    ],
    steps: [
      { title: "直列合成抵抗", titleEn: "Series resistance", expression: "R1+R2", targetUnit: "Ohm", formulaLatex: "R_{series} = R_1 + R_2" },
      { title: "並列合成抵抗", titleEn: "Parallel resistance", expression: "(1/R1+1/R2)^-1", targetUnit: "Ohm", formulaLatex: "R_{parallel} = \\left(\\dfrac{1}{R_1} + \\dfrac{1}{R_2}\\right)^{-1}" },
    ],
  },
  {
    title: "力率つき消費電力（交流回路）",
    titleEn: "Power with power factor (AC circuit)",
    description: "電圧・電流・力率から、交流回路の実効消費電力を求めます。",
    descriptionEn: "Compute the real power consumed in an AC circuit from voltage, current, and power factor.",
    localConstants: [
      { symbol: "V", expression: "100V" },
      { symbol: "I", expression: "5A" },
      { symbol: "cosPhi", expression: "0.8" },
    ],
    steps: [{ title: "実効電力 P", titleEn: "Real power P", expression: "V*I*cosPhi", targetUnit: "W", formulaLatex: "P = VI\\cos\\varphi" }],
  },
];

/** 「天体・宇宙」。第一宇宙速度やケプラーの法則など、スケールの大きさが楽しい天文計算をまとめている。 */
export const ASTRONOMY_SEEDS: NotebookSeed[] = [
  {
    title: "第一宇宙速度",
    titleEn: "First cosmic velocity",
    description: "地球の質量と半径から、地表すれすれを回る円軌道の速さ（第一宇宙速度）を求めます。約7.9km/sになります。",
    descriptionEn: "Compute the orbital speed for a circular orbit just above Earth's surface (first cosmic velocity) from Earth's mass and radius. The result should be about 7.9 km/s.",
    localConstants: [
      { symbol: "G", expression: "6.674e-11N*m^2/kg^2" },
      { symbol: "M", expression: "5.972e24kg" },
      { symbol: "R", expression: "6371km" },
    ],
    steps: [{ title: "第一宇宙速度 v", titleEn: "First cosmic velocity v", expression: "sqrt(G*M/R)", targetUnit: "km/s", formulaLatex: "v_1 = \\sqrt{\\dfrac{GM}{R}}" }],
  },
  {
    title: "第二宇宙速度（脱出速度）",
    titleEn: "Second cosmic velocity (escape velocity)",
    description: "地球の質量と半径から、地球の重力を振り切るために必要な脱出速度（第二宇宙速度）を求めます。約11.2km/sになります。",
    descriptionEn: "Compute the escape velocity needed to break free of Earth's gravity (second cosmic velocity) from Earth's mass and radius. The result should be about 11.2 km/s.",
    localConstants: [
      { symbol: "G", expression: "6.674e-11N*m^2/kg^2" },
      { symbol: "M", expression: "5.972e24kg" },
      { symbol: "R", expression: "6371km" },
    ],
    steps: [{ title: "第二宇宙速度 v", titleEn: "Second cosmic velocity v", expression: "sqrt(2*G*M/R)", targetUnit: "km/s", formulaLatex: "v_2 = \\sqrt{\\dfrac{2GM}{R}}" }],
  },
  {
    title: "ケプラーの第三法則（地球の公転周期）",
    titleEn: "Kepler's third law (Earth's orbital period)",
    description: "太陽の質量と地球の公転半径（1天文単位）から、地球の公転周期を求めます。約1年になります。",
    descriptionEn: "Compute Earth's orbital period from the Sun's mass and Earth's orbital radius (1 astronomical unit). The result should be about 1 year.",
    localConstants: [
      { symbol: "G", expression: "6.674e-11N*m^2/kg^2" },
      { symbol: "Msun", expression: "1.989e30kg" },
      { symbol: "a", expression: "1au" },
    ],
    steps: [{ title: "公転周期 T", titleEn: "Orbital period T", expression: "sqrt(4*pi^2*a^3/(G*Msun))", targetUnit: "yr", formulaLatex: "T = \\sqrt{\\dfrac{4\\pi^2 a^3}{GM_{sun}}}" }],
  },
  {
    title: "万有引力（体重にはたらく地球の引力）",
    titleEn: "Gravitational force (Earth's pull on a person)",
    description: "万有引力の法則から、地表にいる人にはたらく地球の重力を求めます。mgとほぼ一致することを確認できます。",
    descriptionEn: "Compute the gravitational force Earth exerts on a person at its surface using Newton's law of gravitation. The result should closely match mg.",
    localConstants: [
      { symbol: "G", expression: "6.674e-11N*m^2/kg^2" },
      { symbol: "M", expression: "5.972e24kg" },
      { symbol: "m", expression: "70kg" },
      { symbol: "r", expression: "6371km" },
    ],
    steps: [{ title: "引力 F", titleEn: "Gravitational force F", expression: "G*M*m/r^2", targetUnit: "N", formulaLatex: "F = \\dfrac{GMm}{r^2}" }],
  },
  {
    title: "隣の恒星からの光が届く時間",
    titleEn: "Light travel time from the nearest star",
    description: "最も近い恒星（プロキシマ・ケンタウリ）までの距離から、光が届くまでの時間を求めます。光年の定義どおり約4.24年になります。",
    descriptionEn: "Compute how long light takes to reach us from the nearest star (Proxima Centauri). By definition of the light-year, the result should be about 4.24 years.",
    localConstants: [
      { symbol: "d", expression: "4.24ly" },
      { symbol: "c", expression: "299792458m/s" },
    ],
    steps: [{ title: "到達時間 t", titleEn: "Travel time t", expression: "d/c", targetUnit: "yr", formulaLatex: "t = \\dfrac{d}{c}" }],
  },
  {
    title: "月までの光の到達時間",
    titleEn: "Light travel time to the Moon",
    description: "地球から月までの距離から、光が届くまでの時間を求めます。約1.28秒になります。",
    descriptionEn: "Compute how long light takes to travel from Earth to the Moon. The result should be about 1.28 seconds.",
    localConstants: [
      { symbol: "d", expression: "384400km" },
      { symbol: "c", expression: "299792458m/s" },
    ],
    steps: [{ title: "到達時間 t", titleEn: "Travel time t", expression: "d/c", targetUnit: "s", formulaLatex: "t = \\dfrac{d}{c}" }],
  },
];

/** 「フィットネス・ランニング」。ペース・消費カロリー・心拍数ゾーンなど、トレーニングに使える計算をまとめている。 */
export const FITNESS_SEEDS: NotebookSeed[] = [
  {
    title: "ランニングペース",
    titleEn: "Running pace",
    description: "走った時間と距離から、1kmあたりのペースを求めます。",
    descriptionEn: "Compute the pace per kilometer from the running time and distance.",
    localConstants: [
      { symbol: "t", expression: "30min" },
      { symbol: "d", expression: "5km" },
    ],
    steps: [{ title: "ペース", titleEn: "Pace", expression: "t/d", targetUnit: "min/km", formulaLatex: "\\text{pace} = \\dfrac{t}{d}" }],
  },
  {
    title: "消費カロリー（METs法）",
    titleEn: "Calories burned (METs method)",
    description: "運動強度（METs）・体重・運動時間から、消費カロリーを求めます。",
    descriptionEn: "Compute calories burned from exercise intensity (METs), body weight, and duration.",
    localConstants: [
      { symbol: "mets", expression: "8" },
      { symbol: "weight", expression: "65kg" },
      { symbol: "time", expression: "0.5h" },
      { symbol: "factor", expression: "1.05kcal/kg/h" },
    ],
    steps: [{ title: "消費カロリー", titleEn: "Calories burned", expression: "mets*weight*time*factor", targetUnit: "kcal", formulaLatex: "\\text{kcal} = \\text{METs} \\times \\text{weight} \\times \\text{time} \\times 1.05" }],
  },
  {
    title: "心拍数ゾーン（カルボーネン法）",
    titleEn: "Heart rate zone (Karvonen method)",
    description: "年齢・安静時心拍数・運動強度から、目標心拍数を求めます。",
    descriptionEn: "Compute the target heart rate from age, resting heart rate, and desired exercise intensity.",
    localConstants: [
      { symbol: "age", expression: "30" },
      { symbol: "restHR", expression: "60bpm" },
      { symbol: "intensity", expression: "0.7" },
    ],
    steps: [
      { title: "最大心拍数 HRmax", titleEn: "Max heart rate HRmax", expression: "(220-age)*1bpm", targetUnit: "bpm", formulaLatex: "HR_{max} = 220 - \\text{age}" },
      { title: "目標心拍数", titleEn: "Target heart rate", expression: "(s1-restHR)*intensity+restHR", targetUnit: "bpm", formulaLatex: "HR_{target} = (HR_{max} - HR_{rest}) \\times \\text{intensity} + HR_{rest}" },
    ],
  },
  {
    title: "BMI（体格指数）",
    titleEn: "BMI (body mass index)",
    description: "体重と身長から、BMIを求めます。",
    descriptionEn: "Compute the body mass index from body weight and height.",
    localConstants: [
      { symbol: "weight", expression: "65kg" },
      { symbol: "height", expression: "1.7m" },
    ],
    steps: [{ title: "BMI", titleEn: "BMI", expression: "weight/height^2", targetUnit: "kg/m^2", formulaLatex: "BMI = \\dfrac{\\text{weight}}{\\text{height}^2}" }],
  },
  {
    title: "1RM推定（エプリー式）",
    titleEn: "Estimated 1RM (Epley formula)",
    description: "扱った重量とその回数から、1回だけ挙げられる最大重量（1RM）を推定します。",
    descriptionEn: "Estimate the one-repetition maximum (1RM) from the weight lifted and the number of repetitions performed.",
    localConstants: [
      { symbol: "weight", expression: "60kg" },
      { symbol: "reps", expression: "8" },
    ],
    steps: [{ title: "推定1RM", titleEn: "Estimated 1RM", expression: "weight*(1+reps/30)", targetUnit: "kg", formulaLatex: "1RM = \\text{weight} \\times \\left(1 + \\dfrac{\\text{reps}}{30}\\right)" }],
  },
];

/** 「化学の量的関係」。モル質量・モル濃度・気体の状態方程式など、化学計算の基本をまとめている。 */
export const CHEMISTRY_SEEDS: NotebookSeed[] = [
  {
    title: "モル質量からの物質量",
    titleEn: "Amount of substance from molar mass",
    description: "質量とモル質量から、物質量（mol）を求めます。",
    descriptionEn: "Compute the amount of substance (in moles) from mass and molar mass.",
    localConstants: [
      { symbol: "m", expression: "36g" },
      { symbol: "M", expression: "18g/mol" },
    ],
    steps: [{ title: "物質量 n", titleEn: "Amount of substance n", expression: "m/M", targetUnit: "mol", formulaLatex: "n = \\dfrac{m}{M}" }],
  },
  {
    title: "モル濃度",
    titleEn: "Molar concentration",
    description: "溶質の物質量と溶液の体積から、モル濃度を求めます。",
    descriptionEn: "Compute the molar concentration from the amount of solute and the volume of solution.",
    localConstants: [
      { symbol: "n", expression: "0.5mol" },
      { symbol: "V", expression: "2L" },
    ],
    steps: [{ title: "モル濃度 c", titleEn: "Molar concentration c", expression: "n/V", targetUnit: "mol/L", formulaLatex: "c = \\dfrac{n}{V}" }],
  },
  {
    title: "気体の状態方程式（標準状態のモル体積）",
    titleEn: "Ideal gas law (molar volume at STP)",
    description: "物質量・温度・圧力から気体の体積を求めます。標準状態（0℃・1atm）では約22.4Lになります。",
    descriptionEn: "Compute the volume of a gas from the amount of substance, temperature, and pressure. At STP (0°C, 1 atm) the result should be about 22.4 L.",
    localConstants: [
      { symbol: "n", expression: "1mol" },
      { symbol: "R", expression: "8.314J/mol/K" },
      { symbol: "T", expression: "273.15K" },
      { symbol: "P", expression: "101325Pa" },
    ],
    steps: [{ title: "体積 V", titleEn: "Volume V", expression: "n*R*T/P", targetUnit: "L", formulaLatex: "V = \\dfrac{nRT}{P}" }],
  },
  {
    title: "反応熱",
    titleEn: "Heat of reaction",
    description: "反応した物質量とモルあたりの反応熱から、発生する熱量を求めます。",
    descriptionEn: "Compute the heat released from the amount of substance reacted and the molar heat of reaction.",
    localConstants: [
      { symbol: "n", expression: "0.2mol" },
      { symbol: "deltaH", expression: "890kJ/mol" },
    ],
    steps: [{ title: "反応熱 Q", titleEn: "Heat of reaction Q", expression: "n*deltaH", targetUnit: "kJ", formulaLatex: "Q = n \\cdot \\Delta H" }],
  },
  {
    title: "質量パーセント濃度",
    titleEn: "Mass percent concentration",
    description: "溶液の質量と質量パーセント濃度から、溶質の質量を求めます。",
    descriptionEn: "Compute the mass of solute from the mass of solution and its mass percent concentration.",
    localConstants: [
      { symbol: "massSolution", expression: "500g" },
      { symbol: "percent", expression: "10%" },
    ],
    steps: [{ title: "溶質の質量", titleEn: "Mass of solute", expression: "massSolution*percent", targetUnit: "g", formulaLatex: "m_{solute} = m_{solution} \\times \\text{percent}" }],
  },
];

/** 「車・自転車の物理」。制動距離やギア比など、乗り物にまつわる身近な物理計算をまとめている。 */
export const VEHICLES_SEEDS: NotebookSeed[] = [
  {
    title: "制動距離",
    titleEn: "Braking distance",
    description: "速度と摩擦係数から、ブレーキをかけてから停止するまでの制動距離を求めます。",
    descriptionEn: "Compute the braking distance from speed and the coefficient of friction.",
    localConstants: [
      { symbol: "v", expression: "60km/h" },
      { symbol: "mu", expression: "0.7" },
      { symbol: "g", expression: "9.8m/s^2" },
    ],
    steps: [{ title: "制動距離 d", titleEn: "Braking distance d", expression: "v^2/(2*mu*g)", targetUnit: "m", formulaLatex: "d = \\dfrac{v^2}{2\\mu g}" }],
  },
  {
    title: "空走距離と停止距離",
    titleEn: "Reaction distance and total stopping distance",
    description: "反応時間中に進む空走距離と、ブレーキによる制動距離を合わせた停止距離を求めます。",
    descriptionEn: "Compute the reaction distance traveled during the driver's reaction time and add the braking distance to get the total stopping distance.",
    localConstants: [
      { symbol: "v", expression: "60km/h" },
      { symbol: "reactionTime", expression: "0.75s" },
      { symbol: "mu", expression: "0.7" },
      { symbol: "g", expression: "9.8m/s^2" },
    ],
    steps: [
      { title: "空走距離", titleEn: "Reaction distance", expression: "v*reactionTime", targetUnit: "m", formulaLatex: "d_{reaction} = v \\cdot t_{reaction}" },
      { title: "制動距離", titleEn: "Braking distance", expression: "v^2/(2*mu*g)", targetUnit: "m", formulaLatex: "d_{brake} = \\dfrac{v^2}{2\\mu g}" },
      { title: "停止距離", titleEn: "Total stopping distance", expression: "s1+s2", targetUnit: "m", formulaLatex: "d_{stop} = d_{reaction} + d_{brake}" },
    ],
  },
  {
    title: "ギア比と速度（自転車）",
    titleEn: "Gear ratio and speed (bicycle)",
    description: "ペダルの回転数・ギア比・タイヤの周長から、自転車の速度を求めます。",
    descriptionEn: "Compute a bicycle's speed from the pedaling cadence, gear ratio, and wheel circumference.",
    localConstants: [
      { symbol: "cadence", expression: "80rpm" },
      { symbol: "gearRatio", expression: "2.5" },
      { symbol: "wheelCircumference", expression: "2.1m" },
    ],
    steps: [{ title: "速度 v", titleEn: "Speed v", expression: "cadence*gearRatio*wheelCircumference", targetUnit: "km/h", formulaLatex: "v = \\text{cadence} \\times \\text{gearRatio} \\times C_{wheel}" }],
  },
  {
    title: "燃費と走行コスト",
    titleEn: "Fuel economy and trip cost",
    description: "走行距離・燃費・燃料単価から、必要な燃料の量と走行にかかる費用を求めます。",
    descriptionEn: "Compute the fuel needed and the trip cost from distance traveled, fuel economy, and fuel price.",
    localConstants: [
      { symbol: "distance", expression: "300km" },
      { symbol: "fuelEconomy", expression: "15km/L" },
      { symbol: "price", expression: "170" },
    ],
    steps: [
      { title: "必要な燃料", titleEn: "Fuel needed", expression: "distance/fuelEconomy", targetUnit: "L", formulaLatex: "\\text{fuel} = \\dfrac{\\text{distance}}{\\text{fuel economy}}" },
      { title: "走行コスト", titleEn: "Trip cost", expression: "(s1/1L)*price", targetUnit: "", formulaLatex: "\\text{cost} = \\dfrac{\\text{fuel}}{1\\text{L}} \\times \\text{price}" },
    ],
  },
  {
    title: "カーブを安全に曲がれる速度",
    titleEn: "Safe cornering speed",
    description: "路面の摩擦係数とカーブの半径から、安全に曲がれる速度の目安を求めます。",
    descriptionEn: "Estimate the safe cornering speed from the road's coefficient of friction and the curve radius.",
    localConstants: [
      { symbol: "mu", expression: "0.8" },
      { symbol: "g", expression: "9.8m/s^2" },
      { symbol: "r", expression: "50m" },
    ],
    steps: [{ title: "安全速度 v", titleEn: "Safe speed v", expression: "sqrt(mu*g*r)", targetUnit: "km/h", formulaLatex: "v = \\sqrt{\\mu g r}" }],
  },
];

/** 「料理・製菓の単位換算」。計量カップやオーブン温度など、キッチンで役立つ単位換算をまとめている。 */
export const COOKING_SEEDS: NotebookSeed[] = [
  {
    title: "計量カップ・大さじ・小さじ⇔mL変換",
    titleEn: "Measuring cup, tablespoon, teaspoon to mL conversion",
    description: "計量カップの分量を、mL・大さじ・小さじに換算します。単位の切替チップでそのまま比較できます。",
    descriptionEn: "Convert a quantity in measuring cups to mL, tablespoons, and teaspoons. Use the unit-switching chips to compare them directly.",
    localConstants: [{ symbol: "amount", expression: "1.5cup" }],
    steps: [{ title: "体積", titleEn: "Volume", expression: "amount", targetUnit: "mL", formulaLatex: "V = \\text{amount}" }],
  },
  {
    title: "オーブン温度換算（℉⇔℃）",
    titleEn: "Oven temperature conversion (°F to °C)",
    description: "海外レシピでよく使われる華氏（℉）表記のオーブン温度を、摂氏（℃）に換算します。",
    descriptionEn: "Convert an oven temperature given in Fahrenheit, as commonly used in overseas recipes, to Celsius.",
    localConstants: [{ symbol: "tempF", expression: "350°F" }],
    steps: [{ title: "摂氏温度", titleEn: "Temperature in Celsius", expression: "tempF", targetUnit: "°C", formulaLatex: "T_{°C} = \\dfrac{5}{9}(T_{°F} - 32)" }],
  },
  {
    title: "レシピの人数スケール変換",
    titleEn: "Recipe serving size scaling",
    description: "元のレシピの分量と人数から、目標の人数分に必要な分量を求めます。",
    descriptionEn: "Compute the ingredient amount needed for a target number of servings, scaled from the original recipe.",
    localConstants: [
      { symbol: "originalAmount", expression: "200g" },
      { symbol: "originalServings", expression: "2" },
      { symbol: "targetServings", expression: "5" },
    ],
    steps: [{ title: "必要な分量", titleEn: "Scaled amount", expression: "originalAmount*(targetServings/originalServings)", targetUnit: "g", formulaLatex: "m_{target} = m_{original} \\times \\dfrac{n_{target}}{n_{original}}" }],
  },
  {
    title: "ベーカーズパーセント（水分率）",
    titleEn: "Baker's percentage (hydration)",
    description: "小麦粉の重さに対する水の重さの割合（ベーカーズパーセント）を求めます。",
    descriptionEn: "Compute the ratio of water weight to flour weight (baker's percentage / hydration).",
    localConstants: [
      { symbol: "waterWeight", expression: "300g" },
      { symbol: "flourWeight", expression: "500g" },
    ],
    steps: [{ title: "水分率", titleEn: "Hydration", expression: "waterWeight/flourWeight", targetUnit: "%", formulaLatex: "\\text{hydration} = \\dfrac{m_{water}}{m_{flour}}" }],
  },
  {
    title: "密度からのグラム換算（砂糖大さじ何g）",
    titleEn: "Gram conversion from density (sugar per tablespoon)",
    description: "砂糖の密度と体積（大さじ）から、質量をグラムで求めます。",
    descriptionEn: "Compute the mass in grams from the density of sugar and a volume measured in tablespoons.",
    localConstants: [
      { symbol: "sugarDensity", expression: "0.9g/mL" },
      { symbol: "amount", expression: "3tbsp" },
    ],
    steps: [{ title: "質量", titleEn: "Mass", expression: "sugarDensity*amount", targetUnit: "g", formulaLatex: "m = \\rho \\times V" }],
  },
];
