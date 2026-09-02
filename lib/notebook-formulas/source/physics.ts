import type { NotebookSeed } from "../types";

/** 高校物理「力学」。速度・加速度・エネルギーなど基本的な運動の式をまとめている。 */
export const PHYSICS_MECHANICS_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Uniformly accelerated motion (velocity & displacement)", ja: "等加速度運動（速度・変位）" },
    description: { en: "Compute the velocity and displacement of uniformly accelerated motion from initial velocity, acceleration, and time.", ja: "初速度・加速度・時間から、等加速度運動の速度と変位を求めます。" },
    formulas: [
      { explanation: { en: "Velocity equals the initial velocity plus the product of acceleration and elapsed time.", ja: "速度は、初速度に「加速度×経過時間」を加えたものです。" }, latex: "v = v_0 + at" },
      { explanation: { en: "Displacement equals the distance covered at the initial velocity plus the additional distance from acceleration.", ja: "変位は、初速度による移動距離に、加速度による分を加えたものです。" }, latex: "x = v_0 t + \\dfrac{1}{2}at^2" },
    ],
    localConstants: [
      { symbol: "v₀", expression: "5m/s" },
      { symbol: "a", expression: "2m/s^2" },
      { symbol: "t", expression: "3s" },
    ],
    steps: [
      { title: { en: "Velocity v", ja: "速度 v" }, expression: "v₀+a*t", targetUnit: "m/s", formulaLatex: "v = v_0 + at", resultSymbol: "v" },
      { title: { en: "Displacement x", ja: "変位 x" }, expression: "v₀*t+0.5*a*t^2", targetUnit: "m", formulaLatex: "x = v_0 t + \\dfrac{1}{2}at^2", resultSymbol: "x" },
    ],
  },
  {
    title: { en: "Equation of motion", ja: "運動方程式" },
    description: { en: "Compute the force acting on an object from its mass and acceleration (Newton's second law).", ja: "質量と加速度から、物体に働く力を求めます（ニュートンの第二法則）。" },
    localConstants: [
      { symbol: "m", expression: "2kg" },
      { symbol: "a", expression: "3m/s^2" },
    ],
    steps: [{ title: { en: "Force F", ja: "力 F" }, expression: "m*a", targetUnit: "N", formulaLatex: "F = ma" }],
  },
  {
    title: { en: "Kinetic energy", ja: "運動エネルギー" },
    description: { en: "Compute the kinetic energy of an object from its mass and speed.", ja: "質量と速さから、物体の運動エネルギーを求めます。" },
    localConstants: [
      { symbol: "m", expression: "2kg" },
      { symbol: "v", expression: "10m/s" },
    ],
    steps: [{ title: { en: "Kinetic energy K", ja: "運動エネルギー K" }, expression: "0.5*m*v^2", targetUnit: "J", formulaLatex: "K = \\dfrac{1}{2}mv^2" }],
  },
  {
    title: { en: "Potential energy", ja: "位置エネルギー" },
    description: { en: "Compute the gravitational potential energy of an object from its mass and height.", ja: "質量と高さから、重力による位置エネルギーを求めます。" },
    localConstants: [
      { symbol: "m", expression: "2kg" },
      { symbol: "g", expression: "9.8m/s^2" },
      { symbol: "h", expression: "5m" },
    ],
    steps: [{ title: { en: "Potential energy U", ja: "位置エネルギー U" }, expression: "m*g*h", targetUnit: "J", formulaLatex: "U = mgh" }],
  },
  {
    title: { en: "Free-fall velocity", ja: "自由落下速度" },
    description: { en: "Compute the impact velocity of a freely falling object (ignoring air resistance) from its drop height.", ja: "落下高さから、自由落下した物体の到達速度を求めます。" },
    localConstants: [
      { symbol: "g", expression: "9.8m/s^2" },
      { symbol: "h", expression: "20m" },
    ],
    steps: [{ title: { en: "Velocity v", ja: "速度 v" }, expression: "sqrt(2*g*h)", targetUnit: "m/s", formulaLatex: "v = \\sqrt{2gh}" }],
  },
  {
    title: { en: "Momentum", ja: "運動量" },
    description: { en: "Compute the momentum of an object from its mass and velocity.", ja: "質量と速度から、物体の運動量を求めます。" },
    localConstants: [
      { symbol: "m", expression: "2kg" },
      { symbol: "v", expression: "8m/s" },
    ],
    steps: [{ title: { en: "Momentum p", ja: "運動量 p" }, expression: "m*v", targetUnit: "kg*m/s", formulaLatex: "p = mv" }],
  },
  {
    title: { en: "Uniform circular motion (angular velocity & speed)", ja: "等速円運動（角速度・速さ）" },
    description: { en: "Compute the angular velocity and speed of uniform circular motion from the period and radius.", ja: "周期と半径から、等速円運動の角速度と速さを求めます。" },
    localConstants: [
      { symbol: "T", expression: "2s" },
      { symbol: "r", expression: "0.5m" },
    ],
    steps: [
      { title: { en: "Angular velocity ω", ja: "角速度 ω" }, expression: "2*pi/T", targetUnit: "rad/s", formulaLatex: "\\omega = \\dfrac{2\\pi}{T}" },
      { title: { en: "Speed v", ja: "速さ v" }, expression: "r*s1", targetUnit: "m/s", formulaLatex: "v = r\\omega" },
    ],
  },
  {
    title: { en: "Period of simple harmonic motion (spring pendulum)", ja: "単振動の周期（ばね振り子）" },
    description: { en: "Compute the period of a spring pendulum from its mass and spring constant.", ja: "質量とばね定数から、ばね振り子の周期を求めます。" },
    localConstants: [
      { symbol: "m", expression: "0.5kg" },
      { symbol: "k", expression: "20N/m" },
    ],
    steps: [{ title: { en: "Period T", ja: "周期 T" }, expression: "2*pi*sqrt(m/k)", targetUnit: "s", formulaLatex: "T = 2\\pi\\sqrt{\\dfrac{m}{k}}" }],
  },
  {
    title: { en: "Friction force", ja: "摩擦力" },
    description: { en: "Compute the normal force and friction force from mass and the coefficient of friction.", ja: "質量と摩擦係数から、垂直抗力と摩擦力を求めます。" },
    localConstants: [
      { symbol: "m", expression: "5kg" },
      { symbol: "g", expression: "9.8m/s^2" },
      { symbol: "μ", expression: "0.3" },
    ],
    steps: [
      { title: { en: "Normal force N", ja: "垂直抗力 N" }, expression: "m*g", targetUnit: "N", formulaLatex: "N = mg" },
      { title: { en: "Friction force f", ja: "摩擦力 f" }, expression: "μ*s1", targetUnit: "N", formulaLatex: "f = \\mu N" },
    ],
  },
];

/** 高校物理「熱」。気体・熱量・熱膨張など熱分野の式をまとめている。 */
export const PHYSICS_THERMAL_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Ideal gas law", ja: "理想気体の状態方程式" },
    description: { en: "Compute the pressure of an ideal gas from the amount of substance, temperature, and volume.", ja: "物質量・温度・体積から、理想気体の圧力を求めます。" },
    localConstants: [
      { symbol: "n", expression: "1mol" },
      { symbol: "R", expression: "8.314J/mol/K" },
      { symbol: "T", expression: "300K" },
      { symbol: "V", expression: "0.0246m^3" },
    ],
    steps: [{ title: { en: "Pressure P", ja: "圧力 P" }, expression: "n*R*T/V", targetUnit: "Pa", formulaLatex: "P = \\dfrac{nRT}{V}" }],
  },
  {
    title: { en: "Heat quantity", ja: "熱量の保存" },
    description: { en: "Compute the heat absorbed or released by an object from its mass, specific heat, and temperature change.", ja: "質量・比熱・温度変化から、物体が得る（または失う）熱量を求めます。" },
    localConstants: [
      { symbol: "m", expression: "0.2kg" },
      { symbol: "c", expression: "4200J/kg/K" },
      { symbol: "ΔT", expression: "30K" },
    ],
    steps: [{ title: { en: "Heat Q", ja: "熱量 Q" }, expression: "m*c*ΔT", targetUnit: "J", formulaLatex: "Q = mc\\Delta T" }],
  },
  {
    title: { en: "Thermal efficiency", ja: "熱効率" },
    description: { en: "Compute the thermal efficiency of a heat engine from the work done and the heat input.", ja: "熱機関がした仕事と受け取った熱量から、熱効率を求めます。" },
    localConstants: [
      { symbol: "W", expression: "300J" },
      { symbol: "Qᵢₙ", expression: "1000J" },
    ],
    steps: [{ title: { en: "Thermal efficiency η", ja: "熱効率 η" }, expression: "W/Qᵢₙ", targetUnit: "%", formulaLatex: "\\eta = \\dfrac{W}{Q_{in}}" }],
  },
  {
    title: { en: "Thermal expansion", ja: "熱膨張" },
    description: { en: "Compute the elongation of an object from its coefficient of linear expansion, original length, and temperature change.", ja: "線膨張率・元の長さ・温度変化から、物体の伸びを求めます。" },
    localConstants: [
      { symbol: "α", expression: "1.2e-5/K" },
      { symbol: "L₀", expression: "10m" },
      { symbol: "ΔT", expression: "40K" },
    ],
    steps: [{ title: { en: "Elongation ΔL", ja: "伸び ΔL" }, expression: "α*L₀*ΔT", targetUnit: "mm", formulaLatex: "\\Delta L = \\alpha L_0 \\Delta T" }],
  },
  {
    title: { en: "Isobaric process (Charles's law)", ja: "気体の等圧変化（シャルルの法則）" },
    description: { en: "Compute the volume after a temperature change at constant pressure using Charles's law.", ja: "圧力一定のもとで、温度変化後の体積をシャルルの法則から求めます。" },
    localConstants: [
      { symbol: "V₁", expression: "2L" },
      { symbol: "T₁", expression: "300K" },
      { symbol: "T₂", expression: "450K" },
    ],
    steps: [{ title: { en: "Volume after change V2", ja: "変化後の体積 V2" }, expression: "V₁*T₂/T₁", targetUnit: "L", formulaLatex: "V_2 = V_1\\dfrac{T_2}{T_1}" }],
  },
];

/** 高校物理「波動」。波の基本式・弦や気柱の振動・ドップラー効果などをまとめている。 */
export const PHYSICS_WAVES_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Basic wave equation", ja: "波の基本式" },
    description: { en: "Compute the wave speed from its frequency and wavelength.", ja: "振動数と波長から、波の速さを求めます。" },
    localConstants: [
      { symbol: "f", expression: "440Hz" },
      { symbol: "λ", expression: "0.77m" },
    ],
    steps: [{ title: { en: "Speed v", ja: "速さ v" }, expression: "f*λ", targetUnit: "m/s", formulaLatex: "v = f\\lambda" }],
  },
  {
    title: { en: "Vibration of a string (fundamental frequency)", ja: "弦の振動（基本振動数）" },
    description: { en: "Compute the fundamental frequency of a vibrating string from the wave speed and string length.", ja: "弦を伝わる波の速さと弦の長さから、基本振動数を求めます。" },
    localConstants: [
      { symbol: "v", expression: "200m/s" },
      { symbol: "L", expression: "0.5m" },
    ],
    steps: [{ title: { en: "Fundamental frequency f", ja: "基本振動数 f" }, expression: "v/(2*L)", targetUnit: "Hz", formulaLatex: "f = \\dfrac{v}{2L}" }],
  },
  {
    title: { en: "Vibration of an air column (closed pipe fundamental)", ja: "気柱の振動（閉管の基本振動数）" },
    description: { en: "Compute the fundamental frequency of a closed pipe from the speed of sound and pipe length.", ja: "音速と管の長さから、閉管の基本振動数を求めます。" },
    localConstants: [
      { symbol: "v", expression: "340m/s" },
      { symbol: "L", expression: "0.2m" },
    ],
    steps: [{ title: { en: "Fundamental frequency f", ja: "基本振動数 f" }, expression: "v/(4*L)", targetUnit: "Hz", formulaLatex: "f = \\dfrac{v}{4L}" }],
  },
  {
    title: { en: "Doppler effect (approaching source)", ja: "ドップラー効果（音源が近づく場合）" },
    description: { en: "Compute the frequency heard by a stationary observer as a sound source approaches.", ja: "音速・音源の振動数・音源の速さから、観測者が聞く振動数を求めます。" },
    localConstants: [
      { symbol: "v", expression: "340m/s" },
      { symbol: "f", expression: "500Hz" },
      { symbol: "vₛ", expression: "20m/s" },
    ],
    steps: [{ title: { en: "Observed frequency f'", ja: "観測振動数 f'" }, expression: "f*v/(v-vₛ)", targetUnit: "Hz", formulaLatex: "f' = f\\dfrac{v}{v - v_s}" }],
  },
  {
    title: { en: "Law of refraction (Snell's law)", ja: "屈折の法則（スネルの法則）" },
    description: { en: "Compute the refraction angle from the angle of incidence and the refractive indices.", ja: "入射角と屈折率から、屈折角を求めます。" },
    localConstants: [
      { symbol: "n₁", expression: "1" },
      { symbol: "n₂", expression: "1.5" },
      { symbol: "θ₁", expression: "30deg" },
    ],
    steps: [{ title: { en: "Refraction angle θ2", ja: "屈折角 θ2" }, expression: "asin(n₁*sin(θ₁)/n₂)", targetUnit: "deg", formulaLatex: "\\theta_2 = \\arcsin\\!\\left(\\dfrac{n_1 \\sin\\theta_1}{n_2}\\right)" }],
  },
];

/** 高校物理「電気」。クーロンの法則・オームの法則・コンデンサーなど電気分野の式をまとめている。 */
export const PHYSICS_ELECTRICITY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Coulomb's law", ja: "クーロンの法則" },
    description: { en: "Compute the electrostatic force between two point charges using Coulomb's law.", ja: "2つの点電荷間に働く静電気力を、クーロンの法則から求めます。" },
    localConstants: [
      { symbol: "k", expression: "8.99e9N*m^2/C^2" },
      { symbol: "q₁", expression: "2e-6C" },
      { symbol: "q₂", expression: "3e-6C" },
      { symbol: "r", expression: "0.1m" },
    ],
    steps: [{ title: { en: "Electrostatic force F", ja: "静電気力 F" }, expression: "k*q₁*q₂/r^2", targetUnit: "N", formulaLatex: "F = k\\dfrac{q_1 q_2}{r^2}" }],
  },
  {
    title: { en: "Ohm's law", ja: "オームの法則" },
    description: { en: "Compute the voltage from the current and resistance.", ja: "電流と抵抗から、電圧を求めます。" },
    localConstants: [
      { symbol: "I", expression: "0.5A" },
      { symbol: "R", expression: "20Ohm" },
    ],
    steps: [{ title: { en: "Voltage V", ja: "電圧 V" }, expression: "I*R", targetUnit: "V", formulaLatex: "V = IR" }],
  },
  {
    title: { en: "Electric power", ja: "電力" },
    description: { en: "Compute the electric power consumed from the current and voltage.", ja: "電流と電圧から、消費電力を求めます。" },
    localConstants: [
      { symbol: "I", expression: "0.5A" },
      { symbol: "V", expression: "10V" },
    ],
    steps: [{ title: { en: "Power P", ja: "電力 P" }, expression: "I*V", targetUnit: "W", formulaLatex: "P = IV" }],
  },
  {
    title: { en: "Capacitor charge and stored energy", ja: "コンデンサーの電気量と静電エネルギー" },
    description: { en: "Compute the stored charge and electrostatic energy of a capacitor from its capacitance and voltage.", ja: "静電容量と電圧から、蓄えられる電気量と静電エネルギーを求めます。" },
    localConstants: [
      { symbol: "C", expression: "100uF" },
      { symbol: "V", expression: "12V" },
    ],
    steps: [
      { title: { en: "Charge Q", ja: "電気量 Q" }, expression: "C*V", targetUnit: "mC", formulaLatex: "Q = CV" },
      { title: { en: "Stored energy U", ja: "静電エネルギー U" }, expression: "0.5*C*V^2", targetUnit: "mJ", formulaLatex: "U = \\dfrac{1}{2}CV^2" },
    ],
  },
  {
    title: { en: "Electromagnetic induction (induced EMF)", ja: "電磁誘導（誘導起電力）" },
    description: { en: "Compute the induced EMF of a coil from the number of turns and the rate of change of magnetic flux.", ja: "コイルの巻数と磁束の変化から、誘導起電力を求めます。" },
    localConstants: [
      { symbol: "N", expression: "200" },
      { symbol: "ΔΦ", expression: "0.02Wb" },
      { symbol: "Δt", expression: "0.1s" },
    ],
    steps: [{ title: { en: "Induced EMF V", ja: "誘導起電力 V" }, expression: "N*ΔΦ/Δt", targetUnit: "V", formulaLatex: "V = N\\dfrac{\\Delta\\Phi}{\\Delta t}" }],
  },
];

/** 高校物理「原子」。光子のエネルギー・光電効果・半減期・ボーアモデルをまとめている。 */
export const PHYSICS_ATOMIC_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Photon energy", ja: "光子のエネルギー" },
    description: { en: "Compute the energy of a single photon from Planck's constant and the light frequency.", ja: "プランク定数と振動数から、光子1個のエネルギーを求めます。" },
    localConstants: [
      { symbol: "h", expression: "6.626e-34J*s" },
      { symbol: "f", expression: "5e14Hz" },
    ],
    steps: [{ title: { en: "Photon energy E", ja: "光子のエネルギー E" }, expression: "h*f", targetUnit: "eV", formulaLatex: "E = hf" }],
  },
  {
    title: { en: "Photoelectric effect (max kinetic energy)", ja: "光電効果（最大運動エネルギー）" },
    description: { en: "Compute the maximum kinetic energy of an emitted electron from the incident light frequency and the work function.", ja: "入射光の振動数と仕事関数から、飛び出す電子の最大運動エネルギーを求めます。" },
    localConstants: [
      { symbol: "h", expression: "6.626e-34J*s" },
      { symbol: "f", expression: "1.2e15Hz" },
      { symbol: "W", expression: "3eV" },
    ],
    steps: [
      { title: { en: "Photon energy hf", ja: "光子のエネルギー hf" }, expression: "h*f", targetUnit: "eV", formulaLatex: "hf" },
      { title: { en: "Max kinetic energy Kmax", ja: "最大運動エネルギー Kmax" }, expression: "s1-W", targetUnit: "eV", formulaLatex: "K_{max} = hf - W" },
    ],
  },
  {
    title: { en: "Radioactive decay (half-life)", ja: "放射性崩壊（半減期）" },
    description: { en: "Compute the remaining number of atoms from the half-life, elapsed time, and initial atom count.", ja: "半減期・経過時間・初期の原子数から、残っている原子数を求めます。" },
    localConstants: [
      { symbol: "N₀", expression: "1000000" },
      { symbol: "T", expression: "5.3yr" },
      { symbol: "t", expression: "10.6yr" },
    ],
    steps: [{ title: { en: "Remaining count N", ja: "残っている数 N" }, expression: "N₀*0.5^(t/T)", targetUnit: "", formulaLatex: "N = N_0 \\cdot 0.5^{t/T}" }],
  },
  {
    title: { en: "Bohr model (hydrogen energy levels)", ja: "ボーアモデル（水素原子のエネルギー準位）" },
    description: { en: "Compute the energy level of a hydrogen atom from its quantum number using the Bohr model.", ja: "量子数から、水素原子のエネルギー準位を求めます。" },
    localConstants: [{ symbol: "n", expression: "2" }],
    steps: [{ title: { en: "Energy level En", ja: "エネルギー準位 En" }, expression: "-13.6eV/(n^2)", targetUnit: "eV", formulaLatex: "E_n = -\\dfrac{13.6\\text{eV}}{n^2}" }],
  },
];
