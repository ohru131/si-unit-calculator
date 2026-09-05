import type { NotebookSeed } from "../types";

/** 「電子工作」。分圧回路・RC時定数・リアクタンス・電池の持ちなど、ブレッドボードの上で実際に使う計算をまとめている。 */
export const ELECTRONICS_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Voltage divider output", ja: "分圧回路の出力電圧" },
    description: { en: "Compute the output voltage of a two-resistor voltage divider from the input voltage and the two resistances, together with the current and power in the divider string.", ja: "入力電圧と2本の抵抗値から、分圧回路の出力電圧と、分圧抵抗に流れる電流・消費電力を求めます。" },
    localConstants: [
      { symbol: "Vᵢₙ", expression: "12V" },
      { symbol: "R₁", expression: "10kOhm" },
      { symbol: "R₂", expression: "4.7kOhm" },
    ],
    steps: [
      { title: { en: "Output voltage Vout", ja: "出力電圧 Vout" }, expression: "Vᵢₙ*R₂/(R₁+R₂)", targetUnit: "V", formulaLatex: "V_{out} = V_{in} \\dfrac{R_2}{R_1 + R_2}" },
      { title: { en: "Divider current I", ja: "分圧抵抗に流れる電流 I" }, expression: "Vᵢₙ/(R₁+R₂)", targetUnit: "mA", formulaLatex: "I = \\dfrac{V_{in}}{R_1 + R_2}" },
      { title: { en: "Power in the divider P", ja: "分圧抵抗の消費電力 P" }, expression: "Vᵢₙ^2/(R₁+R₂)", targetUnit: "mW", formulaLatex: "P = \\dfrac{V_{in}^2}{R_1 + R_2}" },
    ],
  },
  {
    title: { en: "RC time constant and charging time", ja: "RC時定数と充電時間" },
    description: { en: "Compute the time constant of an RC circuit from the resistance and capacitance, and the time it takes the capacitor to charge up to a given voltage.", ja: "抵抗値と静電容量から、RC回路の時定数と、コンデンサが指定の電圧まで充電されるまでの時間を求めます。" },
    localConstants: [
      { symbol: "R", expression: "47kOhm" },
      { symbol: "C", expression: "100µF" },
      { symbol: "Vₛ", expression: "5V" },
      { symbol: "Vₜ", expression: "3V" },
    ],
    steps: [
      { title: { en: "Time constant τ", ja: "時定数 τ" }, expression: "R*C", targetUnit: "s", formulaLatex: "\\tau = RC" },
      { title: { en: "Time to reach 99% (5τ)", ja: "99%に達するまでの時間（5τ）" }, expression: "5*R*C", targetUnit: "s", formulaLatex: "t_{99} = 5RC" },
      { title: { en: "Time to charge to Vt", ja: "Vtまで充電される時間" }, expression: "R*C*ln(Vₛ/(Vₛ-Vₜ))", targetUnit: "s", formulaLatex: "t = RC \\ln \\dfrac{V_s}{V_s - V_t}" },
    ],
  },
  {
    title: { en: "Three resistors in series, parallel and mixed", ja: "抵抗3本の直列・並列・混合合成" },
    description: { en: "Compute the combined resistance of three resistors wired in series, wired all in parallel, and wired as two in parallel followed by the third in series.", ja: "3本の抵抗値から、すべて直列にした場合・すべて並列にした場合・2本を並列にして3本目を直列にした場合の合成抵抗をそれぞれ求めます。" },
    localConstants: [
      { symbol: "R₁", expression: "1kOhm" },
      { symbol: "R₂", expression: "2.2kOhm" },
      { symbol: "R₃", expression: "4.7kOhm" },
    ],
    steps: [
      { title: { en: "All three in series", ja: "3本すべて直列" }, expression: "R₁+R₂+R₃", targetUnit: "kOhm", formulaLatex: "R_{series} = R_1 + R_2 + R_3" },
      { title: { en: "All three in parallel", ja: "3本すべて並列" }, expression: "(1/R₁+1/R₂+1/R₃)^-1", targetUnit: "Ohm", formulaLatex: "R_{parallel} = \\left(\\dfrac{1}{R_1} + \\dfrac{1}{R_2} + \\dfrac{1}{R_3}\\right)^{-1}" },
      { title: { en: "R1 parallel R2, then R3 in series", ja: "R1・R2を並列にしてR3を直列" }, expression: "(1/R₁+1/R₂)^-1+R₃", targetUnit: "kOhm", formulaLatex: "R_{mixed} = \\left(\\dfrac{1}{R_1} + \\dfrac{1}{R_2}\\right)^{-1} + R_3" },
    ],
  },
  {
    title: { en: "Charge and energy stored in a capacitor", ja: "コンデンサに蓄えられる電荷とエネルギー" },
    description: { en: "Compute the charge and the energy stored in a capacitor from its capacitance and voltage, and how long it can hold up a load before the voltage sags by a given amount.", ja: "静電容量と電圧から、コンデンサに蓄えられる電荷とエネルギーを求め、指定の電圧降下までどれだけ負荷を支えられるかを計算します。" },
    localConstants: [
      { symbol: "C", expression: "470µF" },
      { symbol: "V", expression: "12V" },
      { symbol: "I", expression: "100mA" },
      { symbol: "ΔV", expression: "1V" },
    ],
    steps: [
      { title: { en: "Stored charge Q", ja: "蓄えられる電荷 Q" }, expression: "C*V", targetUnit: "mC", formulaLatex: "Q = CV" },
      { title: { en: "Stored energy E", ja: "蓄えられるエネルギー E" }, expression: "C*V^2/2", targetUnit: "mJ", formulaLatex: "E = \\dfrac{1}{2}CV^2" },
      { title: { en: "Hold-up time t", ja: "電圧を保てる時間 t" }, expression: "C*ΔV/I", targetUnit: "ms", formulaLatex: "t = \\dfrac{C \\Delta V}{I}" },
    ],
  },
  {
    title: { en: "Battery runtime from capacity", ja: "電池の容量から求める動作時間" },
    description: { en: "Compute how long a battery lasts from its capacity in mA·h and the current the circuit draws, both ideally and with a usable-capacity factor, plus the energy it stores.", ja: "電池の容量（mA·h）と回路の消費電流から、理想的な動作時間と実際に使える容量を見込んだ動作時間、そして蓄えられているエネルギーを求めます。" },
    localConstants: [
      { symbol: "Q", expression: "2000mA*h" },
      { symbol: "I", expression: "180mA" },
      { symbol: "η", expression: "0.85" },
      { symbol: "V", expression: "3.7V" },
    ],
    steps: [
      { title: { en: "Ideal runtime", ja: "理想的な動作時間" }, expression: "Q/I", targetUnit: "h", formulaLatex: "t_{ideal} = \\dfrac{Q}{I}" },
      { title: { en: "Runtime with usable-capacity factor", ja: "実使用率を見込んだ動作時間" }, expression: "η*Q/I", targetUnit: "h", formulaLatex: "t_{real} = \\dfrac{\\eta Q}{I}" },
      { title: { en: "Stored energy E", ja: "蓄えられているエネルギー E" }, expression: "Q*V", targetUnit: "Wh", formulaLatex: "E = QV" },
    ],
  },
  {
    title: { en: "Capacitive and inductive reactance", ja: "容量リアクタンスと誘導リアクタンス" },
    description: { en: "Compute the reactance of a capacitor and of an inductor at a given frequency, and the net reactance when the two are in series.", ja: "ある周波数でのコンデンサとコイルのリアクタンスを求め、両者を直列にしたときの合成リアクタンスを計算します。" },
    localConstants: [
      { symbol: "f", expression: "1kHz" },
      { symbol: "C", expression: "100nF" },
      { symbol: "L", expression: "10mH" },
    ],
    steps: [
      { title: { en: "Capacitive reactance XC", ja: "容量リアクタンス XC" }, expression: "1/(2*pi*f*C)", targetUnit: "Ohm", formulaLatex: "X_C = \\dfrac{1}{2\\pi f C}" },
      { title: { en: "Inductive reactance XL", ja: "誘導リアクタンス XL" }, expression: "2*pi*f*L", targetUnit: "Ohm", formulaLatex: "X_L = 2\\pi f L" },
      { title: { en: "Net series reactance X", ja: "直列合成リアクタンス X" }, expression: "2*pi*f*L-1/(2*pi*f*C)", targetUnit: "Ohm", formulaLatex: "X = 2\\pi f L - \\dfrac{1}{2\\pi f C}" },
    ],
  },
  {
    title: { en: "LC resonant frequency", ja: "LC共振周波数" },
    description: { en: "Compute the resonant frequency of an LC tank from the inductance and capacitance, along with its characteristic impedance and the Q factor set by the series resistance.", ja: "コイルのインダクタンスとコンデンサの静電容量から、LC共振回路の共振周波数・特性インピーダンス・直列抵抗で決まるQ値を求めます。" },
    localConstants: [
      { symbol: "L", expression: "100µH" },
      { symbol: "C", expression: "100pF" },
      { symbol: "R", expression: "5Ohm" },
    ],
    steps: [
      { title: { en: "Resonant frequency f0", ja: "共振周波数 f0" }, expression: "1/(2*pi*sqrt(L*C))", targetUnit: "MHz", formulaLatex: "f_0 = \\dfrac{1}{2\\pi\\sqrt{LC}}" },
      { title: { en: "Characteristic impedance Z0", ja: "特性インピーダンス Z0" }, expression: "sqrt(L/C)", targetUnit: "Ohm", formulaLatex: "Z_0 = \\sqrt{\\dfrac{L}{C}}" },
      { title: { en: "Q factor", ja: "Q値" }, expression: "sqrt(L/C)/R", targetUnit: "", formulaLatex: "Q = \\dfrac{1}{R}\\sqrt{\\dfrac{L}{C}}" },
    ],
  },
  {
    title: { en: "Resistor power dissipation and derating", ja: "抵抗の消費電力とディレーティング" },
    description: { en: "Compute the power a resistor dissipates from the current through it, how much of its rating that uses, and the largest current allowed if you limit it to a given fraction of the rating (δ = 0.5 means using at most half the rated power).", ja: "抵抗に流れる電流から消費電力を求め、定格に対する使用率と、定格の何割かに抑えて使う場合に流せる最大電流を計算します（δ=0.5なら定格電力の半分までで使う、という意味です）。" },
    localConstants: [
      { symbol: "I", expression: "30mA" },
      { symbol: "R", expression: "100Ohm" },
      { symbol: "Pₘₐₓ", expression: "0.25W" },
      { symbol: "δ", expression: "0.5" },
    ],
    steps: [
      { title: { en: "Dissipated power P", ja: "消費電力 P" }, expression: "I^2*R", targetUnit: "mW", formulaLatex: "P = I^2 R" },
      { title: { en: "Fraction of the rating used", ja: "定格に対する使用率" }, expression: "I^2*R/Pₘₐₓ", targetUnit: "%", formulaLatex: "\\text{use} = \\dfrac{I^2 R}{P_{max}}" },
      { title: { en: "Largest derated current Imax", ja: "ディレーティング後の最大電流 Imax" }, expression: "sqrt(δ*Pₘₐₓ/R)", targetUnit: "mA", formulaLatex: "I_{max} = \\sqrt{\\dfrac{\\delta P_{max}}{R}}" },
    ],
  },
];

/** 「太陽光発電・蓄電」。1日の消費電力量からパネル容量・蓄電池容量・充電時間・配線の電圧降下までを見積もる計算をまとめている。 */
export const SOLAR_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Daily energy demand of a load list", ja: "使用機器から求める1日の消費電力量" },
    description: { en: "Compute the daily energy demand of three loads from each one's power and running time, then the monthly total and the average continuous power.", ja: "3つの機器の消費電力と使用時間から、1日の消費電力量・1か月の合計・平均消費電力を求めます。" },
    localConstants: [
      { symbol: "P₁", expression: "40W" },
      { symbol: "t₁", expression: "5h" },
      { symbol: "P₂", expression: "60W" },
      { symbol: "t₂", expression: "24h" },
      { symbol: "P₃", expression: "65W" },
      { symbol: "t₃", expression: "6h" },
    ],
    steps: [
      { title: { en: "Daily energy", ja: "1日の消費電力量" }, expression: "P₁*t₁+P₂*t₂+P₃*t₃", targetUnit: "Wh", formulaLatex: "E_{day} = P_1 t_1 + P_2 t_2 + P_3 t_3" },
      { title: { en: "Monthly energy (30 days)", ja: "1か月（30日）の消費電力量" }, expression: "(P₁*t₁+P₂*t₂+P₃*t₃)*30", targetUnit: "kWh", formulaLatex: "E_{month} = 30 (P_1 t_1 + P_2 t_2 + P_3 t_3)" },
      { title: { en: "Average continuous power", ja: "平均消費電力" }, expression: "(P₁*t₁+P₂*t₂+P₃*t₃)/1d", targetUnit: "W", formulaLatex: "P_{avg} = \\dfrac{P_1 t_1 + P_2 t_2 + P_3 t_3}{1\\,\\mathrm{d}}" },
    ],
  },
  {
    title: { en: "PV array size from daily energy", ja: "1日の消費電力量から求める太陽光パネルの容量" },
    description: { en: "Compute the photovoltaic array power needed from the daily energy demand, the peak sun hours of the site, and a system efficiency covering wiring, controller and inverter losses.", ja: "1日の消費電力量・設置場所のピーク日照時間・配線やコントローラの損失を見込んだシステム効率から、必要な太陽光パネルの容量を求めます。" },
    localConstants: [
      { symbol: "E", expression: "2000Wh" },
      { symbol: "PSH", expression: "4.2h" },
      { symbol: "η", expression: "0.75" },
      { symbol: "Pₚ", expression: "400W" },
    ],
    steps: [
      { title: { en: "Array power needed", ja: "必要なパネル容量" }, expression: "E/(PSH*η)", targetUnit: "W", formulaLatex: "P_{array} = \\dfrac{E}{PSH \\cdot \\eta}" },
      { title: { en: "Number of panels", ja: "必要なパネル枚数" }, expression: "E/(PSH*η*Pₚ)", targetUnit: "", formulaLatex: "n = \\dfrac{E}{PSH \\cdot \\eta \\cdot P_p}" },
    ],
  },
  {
    title: { en: "Battery bank capacity for days of autonomy", ja: "自立日数から求める蓄電池の容量" },
    description: { en: "Compute the battery bank capacity needed from the daily energy demand, how many days you want to run without sun, the depth of discharge you allow, and the discharge efficiency.", ja: "1日の消費電力量・日照が無くても動かしたい日数・許容する放電深度・放電効率から、必要な蓄電池の容量を求めます。" },
    localConstants: [
      { symbol: "E", expression: "2000Wh" },
      { symbol: "D", expression: "2" },
      { symbol: "DoD", expression: "0.5" },
      { symbol: "η", expression: "0.9" },
      { symbol: "V", expression: "24V" },
    ],
    steps: [
      { title: { en: "Energy to draw from the bank", ja: "蓄電池から取り出す電力量" }, expression: "E*D/η", targetUnit: "kWh", formulaLatex: "E_{store} = \\dfrac{E D}{\\eta}" },
      { title: { en: "Nominal bank energy", ja: "蓄電池の公称容量（電力量）" }, expression: "E*D/(η*DoD)", targetUnit: "kWh", formulaLatex: "E_{bank} = \\dfrac{E D}{\\eta \\cdot DoD}" },
      { title: { en: "Bank capacity in A·h", ja: "蓄電池の容量（A·h）" }, expression: "E*D/(η*DoD*V)", targetUnit: "A*h", formulaLatex: "C_{bank} = \\dfrac{E D}{\\eta \\cdot DoD \\cdot V}" },
    ],
  },
  {
    title: { en: "Battery charge time from panel power", ja: "パネル出力から求める蓄電池の充電時間" },
    description: { en: "Compute how long a panel takes to fill a battery from the panel power, the battery capacity and voltage, and a charging efficiency.", ja: "パネルの出力・蓄電池の容量と電圧・充電効率から、蓄電池を満充電にするまでの時間を求めます。" },
    localConstants: [
      { symbol: "P", expression: "200W" },
      { symbol: "η", expression: "0.8" },
      { symbol: "Q", expression: "100A*h" },
      { symbol: "V", expression: "12V" },
    ],
    steps: [
      { title: { en: "Energy the battery holds", ja: "蓄電池が蓄えられる電力量" }, expression: "Q*V", targetUnit: "Wh", formulaLatex: "E = QV" },
      { title: { en: "Charging current", ja: "充電電流" }, expression: "P*η/V", targetUnit: "A", formulaLatex: "I = \\dfrac{\\eta P}{V}" },
      { title: { en: "Charge time", ja: "充電時間" }, expression: "Q*V/(P*η)", targetUnit: "h", formulaLatex: "t = \\dfrac{QV}{\\eta P}" },
    ],
  },
  {
    title: { en: "Voltage drop in a DC cable run", ja: "直流配線の電圧降下" },
    description: { en: "Compute the round-trip resistance of a DC cable run from the resistivity, one-way length and conductor cross-section, then the voltage it drops at a given current and what fraction of the system voltage that is.", ja: "導体の抵抗率・片道の配線長・導体断面積から往復の配線抵抗を求め、流れる電流による電圧降下と、それがシステム電圧の何%にあたるかを計算します。" },
    localConstants: [
      { symbol: "ρ", expression: "1.68e-8Ohm*m" },
      { symbol: "L", expression: "8m" },
      { symbol: "A", expression: "10mm^2" },
      { symbol: "I", expression: "20A" },
      { symbol: "V", expression: "12V" },
    ],
    steps: [
      { title: { en: "Round-trip cable resistance R", ja: "往復の配線抵抗 R" }, expression: "2*ρ*L/A", targetUnit: "Ohm", formulaLatex: "R = \\dfrac{2 \\rho L}{A}" },
      { title: { en: "Voltage drop ΔV", ja: "電圧降下 ΔV" }, expression: "2*ρ*L*I/A", targetUnit: "V", formulaLatex: "\\Delta V = \\dfrac{2 \\rho L I}{A}" },
      { title: { en: "Drop as a fraction of the system voltage", ja: "システム電圧に対する電圧降下の割合" }, expression: "2*ρ*L*I/(A*V)", targetUnit: "%", formulaLatex: "\\text{drop} = \\dfrac{2 \\rho L I}{A V}" },
    ],
  },
  {
    title: { en: "Panel output derating for temperature", ja: "温度によるパネル出力の低下" },
    description: { en: "Compute the output of a photovoltaic panel at a hot cell temperature from its rating at 25°C and its temperature coefficient of power.", ja: "25°C基準の定格出力とパネルの出力温度係数から、セル温度が上がったときの実際の出力を求めます。" },
    localConstants: [
      { symbol: "P₀", expression: "400W" },
      { symbol: "γ", expression: "-0.35%/K" },
      { symbol: "T", expression: "55°C" },
      { symbol: "T₀", expression: "25°C" },
    ],
    steps: [
      { title: { en: "Temperature rise above 25°C", ja: "25°Cからの温度上昇" }, expression: "T-T₀", targetUnit: "K", formulaLatex: "\\Delta T = T - T_0" },
      { title: { en: "Output at the hot cell temperature", ja: "高温時の出力" }, expression: "P₀*(1+γ*(T-T₀))", targetUnit: "W", formulaLatex: "P = P_0 \\left(1 + \\gamma (T - T_0)\\right)" },
      { title: { en: "Output lost to temperature", ja: "温度による出力低下の割合" }, expression: "γ*(T₀-T)", targetUnit: "%", formulaLatex: "\\text{loss} = \\gamma (T_0 - T)" },
    ],
  },
];
