import type { NotebookSeed } from "./types";

/** 高校物理「力学」。速度・加速度・エネルギーなど基本的な運動の式をまとめている。 */
export const PHYSICS_MECHANICS_SEEDS: NotebookSeed[] = [
  {
    title: "等加速度運動（速度）",
    titleEn: "Uniformly accelerated motion (velocity)",
    description: "初速度・加速度・時間から、等加速度運動の速度を求めます。",
    descriptionEn: "Compute the velocity of uniformly accelerated motion from initial velocity, acceleration, and time.",
    localConstants: [
      { symbol: "v0", expression: "5m/s", displaySymbol: "v₀" },
      { symbol: "a", expression: "2m/s^2" },
      { symbol: "t", expression: "3s" },
    ],
    steps: [{ title: "速度 v", titleEn: "Velocity v", expression: "v0+a*t", targetUnit: "m/s", formulaLatex: "v = v_0 + at" }],
  },
  {
    title: "等加速度運動（変位）",
    titleEn: "Uniformly accelerated motion (displacement)",
    description: "初速度・加速度・時間から、等加速度運動の変位を求めます。",
    descriptionEn: "Compute the displacement of uniformly accelerated motion from initial velocity, acceleration, and time.",
    localConstants: [
      { symbol: "v0", expression: "5m/s", displaySymbol: "v₀" },
      { symbol: "a", expression: "2m/s^2" },
      { symbol: "t", expression: "3s" },
    ],
    steps: [{ title: "変位 x", titleEn: "Displacement x", expression: "v0*t+0.5*a*t^2", targetUnit: "m", formulaLatex: "x = v_0 t + \\dfrac{1}{2}at^2" }],
  },
  {
    title: "運動方程式",
    titleEn: "Equation of motion",
    description: "質量と加速度から、物体に働く力を求めます（ニュートンの第二法則）。",
    descriptionEn: "Compute the force acting on an object from its mass and acceleration (Newton's second law).",
    localConstants: [
      { symbol: "m", expression: "2kg" },
      { symbol: "a", expression: "3m/s^2" },
    ],
    steps: [{ title: "力 F", titleEn: "Force F", expression: "m*a", targetUnit: "N", formulaLatex: "F = ma" }],
  },
  {
    title: "運動エネルギー",
    titleEn: "Kinetic energy",
    description: "質量と速さから、物体の運動エネルギーを求めます。",
    descriptionEn: "Compute the kinetic energy of an object from its mass and speed.",
    localConstants: [
      { symbol: "m", expression: "2kg" },
      { symbol: "v", expression: "10m/s" },
    ],
    steps: [{ title: "運動エネルギー K", titleEn: "Kinetic energy K", expression: "0.5*m*v^2", targetUnit: "J", formulaLatex: "K = \\dfrac{1}{2}mv^2" }],
  },
  {
    title: "位置エネルギー",
    titleEn: "Potential energy",
    description: "質量と高さから、重力による位置エネルギーを求めます。",
    descriptionEn: "Compute the gravitational potential energy of an object from its mass and height.",
    localConstants: [
      { symbol: "m", expression: "2kg" },
      { symbol: "g", expression: "9.8m/s^2" },
      { symbol: "h", expression: "5m" },
    ],
    steps: [{ title: "位置エネルギー U", titleEn: "Potential energy U", expression: "m*g*h", targetUnit: "J", formulaLatex: "U = mgh" }],
  },
  {
    title: "自由落下速度",
    titleEn: "Free-fall velocity",
    description: "落下高さから、自由落下した物体の到達速度を求めます。",
    descriptionEn: "Compute the impact velocity of a freely falling object (ignoring air resistance) from its drop height.",
    localConstants: [
      { symbol: "g", expression: "9.8m/s^2" },
      { symbol: "h", expression: "20m" },
    ],
    steps: [{ title: "速度 v", titleEn: "Velocity v", expression: "sqrt(2*g*h)", targetUnit: "m/s", formulaLatex: "v = \\sqrt{2gh}" }],
  },
  {
    title: "運動量",
    titleEn: "Momentum",
    description: "質量と速度から、物体の運動量を求めます。",
    descriptionEn: "Compute the momentum of an object from its mass and velocity.",
    localConstants: [
      { symbol: "m", expression: "2kg" },
      { symbol: "v", expression: "8m/s" },
    ],
    steps: [{ title: "運動量 p", titleEn: "Momentum p", expression: "m*v", targetUnit: "kg*m/s", formulaLatex: "p = mv" }],
  },
  {
    title: "等速円運動（角速度・速さ）",
    titleEn: "Uniform circular motion (angular velocity & speed)",
    description: "周期と半径から、等速円運動の角速度と速さを求めます。",
    descriptionEn: "Compute the angular velocity and speed of uniform circular motion from the period and radius.",
    localConstants: [
      { symbol: "T", expression: "2s" },
      { symbol: "r", expression: "0.5m" },
    ],
    steps: [
      { title: "角速度 ω", titleEn: "Angular velocity ω", expression: "2*pi/T", targetUnit: "rad/s", formulaLatex: "\\omega = \\dfrac{2\\pi}{T}" },
      { title: "速さ v", titleEn: "Speed v", expression: "r*s1", targetUnit: "m/s", formulaLatex: "v = r\\omega" },
    ],
  },
  {
    title: "単振動の周期（ばね振り子）",
    titleEn: "Period of simple harmonic motion (spring pendulum)",
    description: "質量とばね定数から、ばね振り子の周期を求めます。",
    descriptionEn: "Compute the period of a spring pendulum from its mass and spring constant.",
    localConstants: [
      { symbol: "m", expression: "0.5kg" },
      { symbol: "k", expression: "20N/m" },
    ],
    steps: [{ title: "周期 T", titleEn: "Period T", expression: "2*pi*sqrt(m/k)", targetUnit: "s", formulaLatex: "T = 2\\pi\\sqrt{\\dfrac{m}{k}}" }],
  },
  {
    title: "摩擦力",
    titleEn: "Friction force",
    description: "質量と摩擦係数から、垂直抗力と摩擦力を求めます。",
    descriptionEn: "Compute the normal force and friction force from mass and the coefficient of friction.",
    localConstants: [
      { symbol: "m", expression: "5kg" },
      { symbol: "g", expression: "9.8m/s^2" },
      { symbol: "mu", expression: "0.3", displaySymbol: "μ" },
    ],
    steps: [
      { title: "垂直抗力 N", titleEn: "Normal force N", expression: "m*g", targetUnit: "N", formulaLatex: "N = mg" },
      { title: "摩擦力 f", titleEn: "Friction force f", expression: "mu*s1", targetUnit: "N", formulaLatex: "f = \\mu N" },
    ],
  },
];

/** 高校物理「熱」。気体・熱量・熱膨張など熱分野の式をまとめている。 */
export const PHYSICS_THERMAL_SEEDS: NotebookSeed[] = [
  {
    title: "理想気体の状態方程式",
    titleEn: "Ideal gas law",
    description: "物質量・温度・体積から、理想気体の圧力を求めます。",
    descriptionEn: "Compute the pressure of an ideal gas from the amount of substance, temperature, and volume.",
    localConstants: [
      { symbol: "n", expression: "1mol" },
      { symbol: "R", expression: "8.314J/mol/K" },
      { symbol: "T", expression: "300K" },
      { symbol: "V", expression: "0.0246m^3" },
    ],
    steps: [{ title: "圧力 P", titleEn: "Pressure P", expression: "n*R*T/V", targetUnit: "Pa", formulaLatex: "P = \\dfrac{nRT}{V}" }],
  },
  {
    title: "熱量の保存",
    titleEn: "Heat quantity",
    description: "質量・比熱・温度変化から、物体が得る（または失う）熱量を求めます。",
    descriptionEn: "Compute the heat absorbed or released by an object from its mass, specific heat, and temperature change.",
    localConstants: [
      { symbol: "m", expression: "0.2kg" },
      { symbol: "c", expression: "4200J/kg/K" },
      { symbol: "deltaT", expression: "30K", displaySymbol: "ΔT" },
    ],
    steps: [{ title: "熱量 Q", titleEn: "Heat Q", expression: "m*c*deltaT", targetUnit: "J", formulaLatex: "Q = mc\\Delta T" }],
  },
  {
    title: "熱効率",
    titleEn: "Thermal efficiency",
    description: "熱機関がした仕事と受け取った熱量から、熱効率を求めます。",
    descriptionEn: "Compute the thermal efficiency of a heat engine from the work done and the heat input.",
    localConstants: [
      { symbol: "W", expression: "300J" },
      { symbol: "Qin", expression: "1000J", displaySymbol: "Qᵢₙ" },
    ],
    steps: [{ title: "熱効率 η", titleEn: "Thermal efficiency η", expression: "W/Qin", targetUnit: "%", formulaLatex: "\\eta = \\dfrac{W}{Q_{in}}" }],
  },
  {
    title: "熱膨張",
    titleEn: "Thermal expansion",
    description: "線膨張率・元の長さ・温度変化から、物体の伸びを求めます。",
    descriptionEn: "Compute the elongation of an object from its coefficient of linear expansion, original length, and temperature change.",
    localConstants: [
      { symbol: "alpha", expression: "1.2e-5/K", displaySymbol: "α" },
      { symbol: "L0", expression: "10m", displaySymbol: "L₀" },
      { symbol: "deltaT", expression: "40K", displaySymbol: "ΔT" },
    ],
    steps: [{ title: "伸び ΔL", titleEn: "Elongation ΔL", expression: "alpha*L0*deltaT", targetUnit: "mm", formulaLatex: "\\Delta L = \\alpha L_0 \\Delta T" }],
  },
  {
    title: "気体の等圧変化（シャルルの法則）",
    titleEn: "Isobaric process (Charles's law)",
    description: "圧力一定のもとで、温度変化後の体積をシャルルの法則から求めます。",
    descriptionEn: "Compute the volume after a temperature change at constant pressure using Charles's law.",
    localConstants: [
      { symbol: "V1", expression: "2L", displaySymbol: "V₁" },
      { symbol: "T1", expression: "300K", displaySymbol: "T₁" },
      { symbol: "T2", expression: "450K", displaySymbol: "T₂" },
    ],
    steps: [{ title: "変化後の体積 V2", titleEn: "Volume after change V2", expression: "V1*T2/T1", targetUnit: "L", formulaLatex: "V_2 = V_1\\dfrac{T_2}{T_1}" }],
  },
];

/** 高校物理「波動」。波の基本式・弦や気柱の振動・ドップラー効果などをまとめている。 */
export const PHYSICS_WAVES_SEEDS: NotebookSeed[] = [
  {
    title: "波の基本式",
    titleEn: "Basic wave equation",
    description: "振動数と波長から、波の速さを求めます。",
    descriptionEn: "Compute the wave speed from its frequency and wavelength.",
    localConstants: [
      { symbol: "f", expression: "440Hz" },
      { symbol: "lambda", expression: "0.77m", displaySymbol: "λ" },
    ],
    steps: [{ title: "速さ v", titleEn: "Speed v", expression: "f*lambda", targetUnit: "m/s", formulaLatex: "v = f\\lambda" }],
  },
  {
    title: "弦の振動（基本振動数）",
    titleEn: "Vibration of a string (fundamental frequency)",
    description: "弦を伝わる波の速さと弦の長さから、基本振動数を求めます。",
    descriptionEn: "Compute the fundamental frequency of a vibrating string from the wave speed and string length.",
    localConstants: [
      { symbol: "v", expression: "200m/s" },
      { symbol: "L", expression: "0.5m" },
    ],
    steps: [{ title: "基本振動数 f", titleEn: "Fundamental frequency f", expression: "v/(2*L)", targetUnit: "Hz", formulaLatex: "f = \\dfrac{v}{2L}" }],
  },
  {
    title: "気柱の振動（閉管の基本振動数）",
    titleEn: "Vibration of an air column (closed pipe fundamental)",
    description: "音速と管の長さから、閉管の基本振動数を求めます。",
    descriptionEn: "Compute the fundamental frequency of a closed pipe from the speed of sound and pipe length.",
    localConstants: [
      { symbol: "v", expression: "340m/s" },
      { symbol: "L", expression: "0.2m" },
    ],
    steps: [{ title: "基本振動数 f", titleEn: "Fundamental frequency f", expression: "v/(4*L)", targetUnit: "Hz", formulaLatex: "f = \\dfrac{v}{4L}" }],
  },
  {
    title: "ドップラー効果（音源が近づく場合）",
    titleEn: "Doppler effect (approaching source)",
    description: "音速・音源の振動数・音源の速さから、観測者が聞く振動数を求めます。",
    descriptionEn: "Compute the frequency heard by a stationary observer as a sound source approaches.",
    localConstants: [
      { symbol: "v", expression: "340m/s" },
      { symbol: "f", expression: "500Hz" },
      { symbol: "vs", expression: "20m/s", displaySymbol: "vₛ" },
    ],
    steps: [{ title: "観測振動数 f'", titleEn: "Observed frequency f'", expression: "f*v/(v-vs)", targetUnit: "Hz", formulaLatex: "f' = f\\dfrac{v}{v - v_s}" }],
  },
  {
    title: "屈折の法則（スネルの法則）",
    titleEn: "Law of refraction (Snell's law)",
    description: "入射角と屈折率から、屈折角を求めます。",
    descriptionEn: "Compute the refraction angle from the angle of incidence and the refractive indices.",
    localConstants: [
      { symbol: "n1", expression: "1", displaySymbol: "n₁" },
      { symbol: "n2", expression: "1.5", displaySymbol: "n₂" },
      { symbol: "theta1", expression: "30deg", displaySymbol: "θ₁" },
    ],
    steps: [{ title: "屈折角 θ2", titleEn: "Refraction angle θ2", expression: "asin(n1*sin(theta1)/n2)", targetUnit: "deg", formulaLatex: "\\theta_2 = \\arcsin\\!\\left(\\dfrac{n_1 \\sin\\theta_1}{n_2}\\right)" }],
  },
];

/** 高校物理「電気」。クーロンの法則・オームの法則・コンデンサーなど電気分野の式をまとめている。 */
export const PHYSICS_ELECTRICITY_SEEDS: NotebookSeed[] = [
  {
    title: "クーロンの法則",
    titleEn: "Coulomb's law",
    description: "2つの点電荷間に働く静電気力を、クーロンの法則から求めます。",
    descriptionEn: "Compute the electrostatic force between two point charges using Coulomb's law.",
    localConstants: [
      { symbol: "k", expression: "8.99e9N*m^2/C^2" },
      { symbol: "q1", expression: "2e-6C", displaySymbol: "q₁" },
      { symbol: "q2", expression: "3e-6C", displaySymbol: "q₂" },
      { symbol: "r", expression: "0.1m" },
    ],
    steps: [{ title: "静電気力 F", titleEn: "Electrostatic force F", expression: "k*q1*q2/r^2", targetUnit: "N", formulaLatex: "F = k\\dfrac{q_1 q_2}{r^2}" }],
  },
  {
    title: "オームの法則",
    titleEn: "Ohm's law",
    description: "電流と抵抗から、電圧を求めます。",
    descriptionEn: "Compute the voltage from the current and resistance.",
    localConstants: [
      { symbol: "I", expression: "0.5A" },
      { symbol: "R", expression: "20Ohm" },
    ],
    steps: [{ title: "電圧 V", titleEn: "Voltage V", expression: "I*R", targetUnit: "V", formulaLatex: "V = IR" }],
  },
  {
    title: "電力",
    titleEn: "Electric power",
    description: "電流と電圧から、消費電力を求めます。",
    descriptionEn: "Compute the electric power consumed from the current and voltage.",
    localConstants: [
      { symbol: "I", expression: "0.5A" },
      { symbol: "V", expression: "10V" },
    ],
    steps: [{ title: "電力 P", titleEn: "Power P", expression: "I*V", targetUnit: "W", formulaLatex: "P = IV" }],
  },
  {
    title: "コンデンサーの電気量と静電エネルギー",
    titleEn: "Capacitor charge and stored energy",
    description: "静電容量と電圧から、蓄えられる電気量と静電エネルギーを求めます。",
    descriptionEn: "Compute the stored charge and electrostatic energy of a capacitor from its capacitance and voltage.",
    localConstants: [
      { symbol: "Cap", expression: "100uF", displaySymbol: "C" },
      { symbol: "V", expression: "12V" },
    ],
    steps: [
      { title: "電気量 Q", titleEn: "Charge Q", expression: "Cap*V", targetUnit: "mC", formulaLatex: "Q = CV" },
      { title: "静電エネルギー U", titleEn: "Stored energy U", expression: "0.5*Cap*V^2", targetUnit: "mJ", formulaLatex: "U = \\dfrac{1}{2}CV^2" },
    ],
  },
  {
    title: "電磁誘導（誘導起電力）",
    titleEn: "Electromagnetic induction (induced EMF)",
    description: "コイルの巻数と磁束の変化から、誘導起電力を求めます。",
    descriptionEn: "Compute the induced EMF of a coil from the number of turns and the rate of change of magnetic flux.",
    localConstants: [
      { symbol: "turns", expression: "200", displaySymbol: "N" },
      { symbol: "deltaPhi", expression: "0.02Wb", displaySymbol: "ΔΦ" },
      { symbol: "deltaT", expression: "0.1s", displaySymbol: "Δt" },
    ],
    steps: [{ title: "誘導起電力 V", titleEn: "Induced EMF V", expression: "turns*deltaPhi/deltaT", targetUnit: "V", formulaLatex: "V = N\\dfrac{\\Delta\\Phi}{\\Delta t}" }],
  },
];

/** 高校物理「原子」。光子のエネルギー・光電効果・半減期・ボーアモデルをまとめている。 */
export const PHYSICS_ATOMIC_SEEDS: NotebookSeed[] = [
  {
    title: "光子のエネルギー",
    titleEn: "Photon energy",
    description: "プランク定数と振動数から、光子1個のエネルギーを求めます。",
    descriptionEn: "Compute the energy of a single photon from Planck's constant and the light frequency.",
    localConstants: [
      { symbol: "h", expression: "6.626e-34J*s" },
      { symbol: "f", expression: "5e14Hz" },
    ],
    steps: [{ title: "光子のエネルギー E", titleEn: "Photon energy E", expression: "h*f", targetUnit: "eV", formulaLatex: "E = hf" }],
  },
  {
    title: "光電効果（最大運動エネルギー）",
    titleEn: "Photoelectric effect (max kinetic energy)",
    description: "入射光の振動数と仕事関数から、飛び出す電子の最大運動エネルギーを求めます。",
    descriptionEn: "Compute the maximum kinetic energy of an emitted electron from the incident light frequency and the work function.",
    localConstants: [
      { symbol: "h", expression: "6.626e-34J*s" },
      { symbol: "f", expression: "1.2e15Hz" },
      { symbol: "W", expression: "3eV" },
    ],
    steps: [
      { title: "光子のエネルギー hf", titleEn: "Photon energy hf", expression: "h*f", targetUnit: "eV", formulaLatex: "hf" },
      { title: "最大運動エネルギー Kmax", titleEn: "Max kinetic energy Kmax", expression: "s1-W", targetUnit: "eV", formulaLatex: "K_{max} = hf - W" },
    ],
  },
  {
    title: "放射性崩壊（半減期）",
    titleEn: "Radioactive decay (half-life)",
    description: "半減期・経過時間・初期の原子数から、残っている原子数を求めます。",
    descriptionEn: "Compute the remaining number of atoms from the half-life, elapsed time, and initial atom count.",
    localConstants: [
      { symbol: "N0", expression: "1000000", displaySymbol: "N₀" },
      { symbol: "T", expression: "5.3yr" },
      { symbol: "t", expression: "10.6yr" },
    ],
    steps: [{ title: "残っている数 N", titleEn: "Remaining count N", expression: "N0*0.5^(t/T)", targetUnit: "", formulaLatex: "N = N_0 \\cdot 0.5^{t/T}" }],
  },
  {
    title: "ボーアモデル（水素原子のエネルギー準位）",
    titleEn: "Bohr model (hydrogen energy levels)",
    description: "量子数から、水素原子のエネルギー準位を求めます。",
    descriptionEn: "Compute the energy level of a hydrogen atom from its quantum number using the Bohr model.",
    localConstants: [{ symbol: "n", expression: "2" }],
    steps: [{ title: "エネルギー準位 En", titleEn: "Energy level En", expression: "-13.6eV/(n^2)", targetUnit: "eV", formulaLatex: "E_n = -\\dfrac{13.6\\text{eV}}{n^2}" }],
  },
];
