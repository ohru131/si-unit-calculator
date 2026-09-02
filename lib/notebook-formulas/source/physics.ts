import type { NotebookSeed } from "../types";

/** 高校物理「力学」。速度・加速度・エネルギーなど基本的な運動の式をまとめている。 */
export const PHYSICS_MECHANICS_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Uniformly accelerated motion (velocity & displacement)", ja: "等加速度運動（速度・変位）", es: "Movimiento uniformemente acelerado (velocidad y desplazamiento)", "pt-BR": "Movimento uniformemente acelerado (velocidade e deslocamento)", de: "Gleichmäßig beschleunigte Bewegung (Geschwindigkeit und Weg)", fr: "Mouvement uniformément accéléré (vitesse et déplacement)" },
    description: { en: "Compute the velocity and displacement of uniformly accelerated motion from initial velocity, acceleration, and time.", ja: "初速度・加速度・時間から、等加速度運動の速度と変位を求めます。", es: "Calcula la velocidad y el desplazamiento de un movimiento uniformemente acelerado a partir de la velocidad inicial, la aceleración y el tiempo.", "pt-BR": "Calcule a velocidade e o deslocamento de um movimento uniformemente acelerado a partir da velocidade inicial, da aceleração e do tempo.", de: "Berechnet die Geschwindigkeit und den Weg einer gleichmäßig beschleunigten Bewegung aus Anfangsgeschwindigkeit, Beschleunigung und Zeit.", fr: "Calculer la vitesse et le déplacement d'un mouvement uniformément accéléré à partir de la vitesse initiale, de l'accélération et du temps." },
    formulas: [
      { explanation: { en: "Velocity equals the initial velocity plus the product of acceleration and elapsed time.", ja: "速度は、初速度に「加速度×経過時間」を加えたものです。", es: "La velocidad es igual a la velocidad inicial más el producto de la aceleración por el tiempo transcurrido.", "pt-BR": "A velocidade é igual à velocidade inicial mais o produto da aceleração pelo tempo decorrido.", de: "Die Geschwindigkeit ergibt sich aus der Anfangsgeschwindigkeit zuzüglich des Produkts aus Beschleunigung und verstrichener Zeit.", fr: "La vitesse est égale à la vitesse initiale plus le produit de l'accélération par le temps écoulé." }, latex: "v = v_0 + at" },
      { explanation: { en: "Displacement equals the distance covered at the initial velocity plus the additional distance from acceleration.", ja: "変位は、初速度による移動距離に、加速度による分を加えたものです。", es: "El desplazamiento es igual a la distancia recorrida a la velocidad inicial más la distancia adicional debida a la aceleración.", "pt-BR": "O deslocamento é igual à distância percorrida na velocidade inicial mais a distância adicional devida à aceleração.", de: "Der Weg ergibt sich aus der bei Anfangsgeschwindigkeit zurückgelegten Strecke zuzüglich der durch die Beschleunigung zusätzlich zurückgelegten Strecke.", fr: "Le déplacement est égal à la distance parcourue à la vitesse initiale plus la distance supplémentaire due à l'accélération." }, latex: "x = v_0 t + \\dfrac{1}{2}at^2" },
    ],
    localConstants: [
      { symbol: "v₀", expression: "5m/s" },
      { symbol: "a", expression: "2m/s^2" },
      { symbol: "t", expression: "3s" },
    ],
    steps: [
      { title: { en: "Velocity v", ja: "速度 v", es: "Velocidad v", "pt-BR": "Velocidade v", de: "Geschwindigkeit v", fr: "Vitesse v" }, expression: "v₀+a*t", targetUnit: "m/s", formulaLatex: "v = v_0 + at", resultSymbol: "v" },
      { title: { en: "Displacement x", ja: "変位 x", es: "Desplazamiento x", "pt-BR": "Deslocamento x", de: "Weg x", fr: "Déplacement x" }, expression: "v₀*t+0.5*a*t^2", targetUnit: "m", formulaLatex: "x = v_0 t + \\dfrac{1}{2}at^2", resultSymbol: "x" },
    ],
  },
  {
    title: { en: "Equation of motion", ja: "運動方程式", es: "Ecuación de movimiento", "pt-BR": "Equação de movimento", de: "Bewegungsgleichung", fr: "Équation du mouvement" },
    description: { en: "Compute the force acting on an object from its mass and acceleration (Newton's second law).", ja: "質量と加速度から、物体に働く力を求めます（ニュートンの第二法則）。", es: "Calcula la fuerza que actúa sobre un objeto a partir de su masa y aceleración (segunda ley de Newton).", "pt-BR": "Calcule a força que atua sobre um objeto a partir de sua massa e aceleração (segunda lei de Newton).", de: "Berechnet die auf einen Körper wirkende Kraft aus seiner Masse und Beschleunigung (zweites newtonsches Gesetz).", fr: "Calculer la force exercée sur un objet à partir de sa masse et de son accélération (deuxième loi de Newton)." },
    localConstants: [
      { symbol: "m", expression: "2kg" },
      { symbol: "a", expression: "3m/s^2" },
    ],
    steps: [{ title: { en: "Force F", ja: "力 F", es: "Fuerza F", "pt-BR": "Força F", de: "Kraft F", fr: "Force F" }, expression: "m*a", targetUnit: "N", formulaLatex: "F = ma" }],
  },
  {
    title: { en: "Kinetic energy", ja: "運動エネルギー", es: "Energía cinética", "pt-BR": "Energia cinética", de: "Kinetische Energie", fr: "Énergie cinétique" },
    description: { en: "Compute the kinetic energy of an object from its mass and speed.", ja: "質量と速さから、物体の運動エネルギーを求めます。", es: "Calcula la energía cinética de un objeto a partir de su masa y velocidad.", "pt-BR": "Calcule a energia cinética de um objeto a partir de sua massa e velocidade.", de: "Berechnet die kinetische Energie eines Körpers aus seiner Masse und Geschwindigkeit.", fr: "Calculer l'énergie cinétique d'un objet à partir de sa masse et de sa vitesse." },
    localConstants: [
      { symbol: "m", expression: "2kg" },
      { symbol: "v", expression: "10m/s" },
    ],
    steps: [{ title: { en: "Kinetic energy K", ja: "運動エネルギー K", es: "Energía cinética K", "pt-BR": "Energia cinética K", de: "Kinetische Energie K", fr: "Énergie cinétique K" }, expression: "0.5*m*v^2", targetUnit: "J", formulaLatex: "K = \\dfrac{1}{2}mv^2" }],
  },
  {
    title: { en: "Potential energy", ja: "位置エネルギー", es: "Energía potencial", "pt-BR": "Energia potencial", de: "Potenzielle Energie", fr: "Énergie potentielle" },
    description: { en: "Compute the gravitational potential energy of an object from its mass and height.", ja: "質量と高さから、重力による位置エネルギーを求めます。", es: "Calcula la energía potencial gravitatoria de un objeto a partir de su masa y altura.", "pt-BR": "Calcule a energia potencial gravitacional de um objeto a partir de sua massa e altura.", de: "Berechnet die potenzielle Energie eines Körpers im Schwerefeld aus seiner Masse und Höhe.", fr: "Calculer l'énergie potentielle de pesanteur d'un objet à partir de sa masse et de sa hauteur." },
    localConstants: [
      { symbol: "m", expression: "2kg" },
      { symbol: "g", expression: "9.8m/s^2" },
      { symbol: "h", expression: "5m" },
    ],
    steps: [{ title: { en: "Potential energy U", ja: "位置エネルギー U", es: "Energía potencial U", "pt-BR": "Energia potencial U", de: "Potenzielle Energie U", fr: "Énergie potentielle U" }, expression: "m*g*h", targetUnit: "J", formulaLatex: "U = mgh" }],
  },
  {
    title: { en: "Free-fall velocity", ja: "自由落下速度", es: "Velocidad de caída libre", "pt-BR": "Velocidade de queda livre", de: "Fallgeschwindigkeit (freier Fall)", fr: "Vitesse de chute libre" },
    description: { en: "Compute the impact velocity of a freely falling object (ignoring air resistance) from its drop height.", ja: "落下高さから、自由落下した物体の到達速度を求めます。", es: "Calcula la velocidad de impacto de un objeto en caída libre (sin considerar la resistencia del aire) a partir de la altura de caída.", "pt-BR": "Calcule a velocidade de impacto de um objeto em queda livre (desprezando a resistência do ar) a partir da altura de queda.", de: "Berechnet die Aufprallgeschwindigkeit eines frei fallenden Körpers (ohne Luftwiderstand) aus der Fallhöhe.", fr: "Calculer la vitesse d'impact d'un objet en chute libre (résistance de l'air négligée) à partir de la hauteur de chute." },
    localConstants: [
      { symbol: "g", expression: "9.8m/s^2" },
      { symbol: "h", expression: "20m" },
    ],
    steps: [{ title: { en: "Velocity v", ja: "速度 v", es: "Velocidad v", "pt-BR": "Velocidade v", de: "Geschwindigkeit v", fr: "Vitesse v" }, expression: "sqrt(2*g*h)", targetUnit: "m/s", formulaLatex: "v = \\sqrt{2gh}" }],
  },
  {
    title: { en: "Momentum", ja: "運動量", es: "Cantidad de movimiento", "pt-BR": "Quantidade de movimento", de: "Impuls", fr: "Quantité de mouvement" },
    description: { en: "Compute the momentum of an object from its mass and velocity.", ja: "質量と速度から、物体の運動量を求めます。", es: "Calcula la cantidad de movimiento de un objeto a partir de su masa y velocidad.", "pt-BR": "Calcule a quantidade de movimento de um objeto a partir de sua massa e velocidade.", de: "Berechnet den Impuls eines Körpers aus seiner Masse und Geschwindigkeit.", fr: "Calculer la quantité de mouvement d'un objet à partir de sa masse et de sa vitesse." },
    localConstants: [
      { symbol: "m", expression: "2kg" },
      { symbol: "v", expression: "8m/s" },
    ],
    steps: [{ title: { en: "Momentum p", ja: "運動量 p", es: "Cantidad de movimiento p", "pt-BR": "Quantidade de movimento p", de: "Impuls p", fr: "Quantité de mouvement p" }, expression: "m*v", targetUnit: "kg*m/s", formulaLatex: "p = mv" }],
  },
  {
    title: { en: "Uniform circular motion (angular velocity & speed)", ja: "等速円運動（角速度・速さ）", es: "Movimiento circular uniforme (velocidad angular y velocidad)", "pt-BR": "Movimento circular uniforme (velocidade angular e velocidade)", de: "Gleichförmige Kreisbewegung (Winkelgeschwindigkeit und Geschwindigkeit)", fr: "Mouvement circulaire uniforme (vitesse angulaire et vitesse)" },
    description: { en: "Compute the angular velocity and speed of uniform circular motion from the period and radius.", ja: "周期と半径から、等速円運動の角速度と速さを求めます。", es: "Calcula la velocidad angular y la velocidad de un movimiento circular uniforme a partir del periodo y el radio.", "pt-BR": "Calcule a velocidade angular e a velocidade de um movimento circular uniforme a partir do período e do raio.", de: "Berechnet die Winkelgeschwindigkeit und die Geschwindigkeit einer gleichförmigen Kreisbewegung aus der Periode und dem Radius.", fr: "Calculer la vitesse angulaire et la vitesse d'un mouvement circulaire uniforme à partir de la période et du rayon." },
    localConstants: [
      { symbol: "T", expression: "2s" },
      { symbol: "r", expression: "0.5m" },
    ],
    steps: [
      { title: { en: "Angular velocity ω", ja: "角速度 ω", es: "Velocidad angular ω", "pt-BR": "Velocidade angular ω", de: "Winkelgeschwindigkeit ω", fr: "Vitesse angulaire ω" }, expression: "2*pi/T", targetUnit: "rad/s", formulaLatex: "\\omega = \\dfrac{2\\pi}{T}" },
      { title: { en: "Speed v", ja: "速さ v", es: "Velocidad v", "pt-BR": "Velocidade v", de: "Geschwindigkeit v", fr: "Vitesse v" }, expression: "r*s1", targetUnit: "m/s", formulaLatex: "v = r\\omega" },
    ],
  },
  {
    title: { en: "Period of simple harmonic motion (spring pendulum)", ja: "単振動の周期（ばね振り子）", es: "Periodo del movimiento armónico simple (péndulo elástico)", "pt-BR": "Período do movimento harmônico simples (pêndulo elástico)", de: "Schwingungsdauer der harmonischen Schwingung (Federpendel)", fr: "Période du mouvement harmonique simple (pendule élastique)" },
    description: { en: "Compute the period of a spring pendulum from its mass and spring constant.", ja: "質量とばね定数から、ばね振り子の周期を求めます。", es: "Calcula el periodo de un péndulo elástico a partir de su masa y la constante elástica del resorte.", "pt-BR": "Calcule o período de um pêndulo elástico a partir de sua massa e da constante elástica da mola.", de: "Berechnet die Schwingungsdauer eines Federpendels aus seiner Masse und der Federkonstante.", fr: "Calculer la période d'un pendule élastique à partir de sa masse et de la constante de raideur du ressort." },
    localConstants: [
      { symbol: "m", expression: "0.5kg" },
      { symbol: "k", expression: "20N/m" },
    ],
    steps: [{ title: { en: "Period T", ja: "周期 T", es: "Periodo T", "pt-BR": "Período T", de: "Schwingungsdauer T", fr: "Période T" }, expression: "2*pi*sqrt(m/k)", targetUnit: "s", formulaLatex: "T = 2\\pi\\sqrt{\\dfrac{m}{k}}" }],
  },
  {
    title: { en: "Friction force", ja: "摩擦力", es: "Fuerza de fricción", "pt-BR": "Força de atrito", de: "Reibungskraft", fr: "Force de frottement" },
    description: { en: "Compute the normal force and friction force from mass and the coefficient of friction.", ja: "質量と摩擦係数から、垂直抗力と摩擦力を求めます。", es: "Calcula la fuerza normal y la fuerza de fricción a partir de la masa y el coeficiente de fricción.", "pt-BR": "Calcule a força normal e a força de atrito a partir da massa e do coeficiente de atrito.", de: "Berechnet die Normalkraft und die Reibungskraft aus der Masse und dem Reibungskoeffizienten.", fr: "Calculer la force normale et la force de frottement à partir de la masse et du coefficient de frottement." },
    localConstants: [
      { symbol: "m", expression: "5kg" },
      { symbol: "g", expression: "9.8m/s^2" },
      { symbol: "μ", expression: "0.3" },
    ],
    steps: [
      { title: { en: "Normal force N", ja: "垂直抗力 N", es: "Fuerza normal N", "pt-BR": "Força normal N", de: "Normalkraft N", fr: "Force normale N" }, expression: "m*g", targetUnit: "N", formulaLatex: "N = mg" },
      { title: { en: "Friction force f", ja: "摩擦力 f", es: "Fuerza de fricción f", "pt-BR": "Força de atrito f", de: "Reibungskraft f", fr: "Force de frottement f" }, expression: "μ*s1", targetUnit: "N", formulaLatex: "f = \\mu N" },
    ],
  },
];

/** 高校物理「熱」。気体・熱量・熱膨張など熱分野の式をまとめている。 */
export const PHYSICS_THERMAL_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Ideal gas law", ja: "理想気体の状態方程式", es: "Ecuación de estado del gas ideal", "pt-BR": "Equação de estado dos gases ideais", de: "Ideale Gasgleichung", fr: "Loi des gaz parfaits" },
    description: { en: "Compute the pressure of an ideal gas from the amount of substance, temperature, and volume.", ja: "物質量・温度・体積から、理想気体の圧力を求めます。", es: "Calcula la presión de un gas ideal a partir de la cantidad de sustancia, la temperatura y el volumen.", "pt-BR": "Calcule a pressão de um gás ideal a partir da quantidade de matéria, da temperatura e do volume.", de: "Berechnet den Druck eines idealen Gases aus der Stoffmenge, der Temperatur und dem Volumen.", fr: "Calculer la pression d'un gaz parfait à partir de la quantité de matière, de la température et du volume." },
    localConstants: [
      { symbol: "n", expression: "1mol" },
      { symbol: "R", expression: "8.314J/mol/K" },
      { symbol: "T", expression: "300K" },
      { symbol: "V", expression: "0.0246m^3" },
    ],
    steps: [{ title: { en: "Pressure P", ja: "圧力 P", es: "Presión P", "pt-BR": "Pressão P", de: "Druck P", fr: "Pression P" }, expression: "n*R*T/V", targetUnit: "Pa", formulaLatex: "P = \\dfrac{nRT}{V}" }],
  },
  {
    title: { en: "Heat quantity", ja: "熱量", es: "Cantidad de calor", "pt-BR": "Quantidade de calor", de: "Wärmemenge", fr: "Quantité de chaleur" },
    description: { en: "Compute the heat absorbed or released by an object from its mass, specific heat, and temperature change.", ja: "質量・比熱・温度変化から、物体が得る（または失う）熱量を求めます。", es: "Calcula el calor absorbido o liberado por un objeto a partir de su masa, calor específico y variación de temperatura.", "pt-BR": "Calcule o calor absorvido ou liberado por um objeto a partir de sua massa, calor específico e variação de temperatura.", de: "Berechnet die von einem Körper aufgenommene oder abgegebene Wärmemenge aus seiner Masse, spezifischen Wärmekapazität und Temperaturänderung.", fr: "Calculer la chaleur absorbée ou libérée par un objet à partir de sa masse, de sa chaleur massique et de sa variation de température." },
    localConstants: [
      { symbol: "m", expression: "0.2kg" },
      { symbol: "c", expression: "4200J/kg/K" },
      { symbol: "ΔT", expression: "30K" },
    ],
    steps: [{ title: { en: "Heat Q", ja: "熱量 Q", es: "Calor Q", "pt-BR": "Calor Q", de: "Wärmemenge Q", fr: "Chaleur Q" }, expression: "m*c*ΔT", targetUnit: "J", formulaLatex: "Q = mc\\Delta T" }],
  },
  {
    title: { en: "Thermal efficiency", ja: "熱効率", es: "Eficiencia térmica", "pt-BR": "Eficiência térmica", de: "Thermischer Wirkungsgrad", fr: "Rendement thermique" },
    description: { en: "Compute the thermal efficiency of a heat engine from the work done and the heat input.", ja: "熱機関がした仕事と受け取った熱量から、熱効率を求めます。", es: "Calcula la eficiencia térmica de una máquina térmica a partir del trabajo realizado y el calor recibido.", "pt-BR": "Calcule a eficiência térmica de uma máquina térmica a partir do trabalho realizado e do calor recebido.", de: "Berechnet den thermischen Wirkungsgrad einer Wärmekraftmaschine aus der verrichteten Arbeit und der zugeführten Wärmemenge.", fr: "Calculer le rendement thermique d'une machine thermique à partir du travail fourni et de la chaleur reçue." },
    localConstants: [
      { symbol: "W", expression: "300J" },
      { symbol: "Qᵢₙ", expression: "1000J" },
    ],
    steps: [{ title: { en: "Thermal efficiency η", ja: "熱効率 η", es: "Eficiencia térmica η", "pt-BR": "Eficiência térmica η", de: "Thermischer Wirkungsgrad η", fr: "Rendement thermique η" }, expression: "W/Qᵢₙ", targetUnit: "%", formulaLatex: "\\eta = \\dfrac{W}{Q_{in}}" }],
  },
  {
    title: { en: "Thermal expansion", ja: "熱膨張", es: "Dilatación térmica", "pt-BR": "Dilatação térmica", de: "Wärmeausdehnung", fr: "Dilatation thermique" },
    description: { en: "Compute the elongation of an object from its coefficient of linear expansion, original length, and temperature change.", ja: "線膨張率・元の長さ・温度変化から、物体の伸びを求めます。", es: "Calcula el alargamiento de un objeto a partir de su coeficiente de dilatación lineal, la longitud inicial y la variación de temperatura.", "pt-BR": "Calcule o alongamento de um objeto a partir de seu coeficiente de dilatação linear, do comprimento inicial e da variação de temperatura.", de: "Berechnet die Längenausdehnung eines Körpers aus seinem linearen Ausdehnungskoeffizienten, der Ausgangslänge und der Temperaturänderung.", fr: "Calculer l'allongement d'un objet à partir de son coefficient de dilatation linéaire, de la longueur initiale et de la variation de température." },
    localConstants: [
      { symbol: "α", expression: "1.2e-5/K" },
      { symbol: "L₀", expression: "10m" },
      { symbol: "ΔT", expression: "40K" },
    ],
    steps: [{ title: { en: "Elongation ΔL", ja: "伸び ΔL", es: "Alargamiento ΔL", "pt-BR": "Alongamento ΔL", de: "Längenänderung ΔL", fr: "Allongement ΔL" }, expression: "α*L₀*ΔT", targetUnit: "mm", formulaLatex: "\\Delta L = \\alpha L_0 \\Delta T" }],
  },
  {
    title: { en: "Isobaric process (Charles's law)", ja: "気体の等圧変化（シャルルの法則）", es: "Proceso isobárico (ley de Charles)", "pt-BR": "Processo isobárico (lei de Charles)", de: "Isobare Zustandsänderung (Gesetz von Gay-Lussac)", fr: "Transformation isobare (loi de Charles)" },
    description: { en: "Compute the volume after a temperature change at constant pressure using Charles's law.", ja: "圧力一定のもとで、温度変化後の体積をシャルルの法則から求めます。", es: "Calcula el volumen después de un cambio de temperatura a presión constante mediante la ley de Charles.", "pt-BR": "Calcule o volume após uma variação de temperatura a pressão constante usando a lei de Charles.", de: "Berechnet das Volumen nach einer Temperaturänderung bei konstantem Druck mithilfe des Gesetzes von Gay-Lussac.", fr: "Calculer le volume après une variation de température à pression constante à l'aide de la loi de Charles." },
    localConstants: [
      { symbol: "V₁", expression: "2L" },
      { symbol: "T₁", expression: "300K" },
      { symbol: "T₂", expression: "450K" },
    ],
    steps: [{ title: { en: "Volume after change V2", ja: "変化後の体積 V2", es: "Volumen después del cambio V2", "pt-BR": "Volume após a variação V2", de: "Volumen nach der Änderung V2", fr: "Volume après variation V2" }, expression: "V₁*T₂/T₁", targetUnit: "L", formulaLatex: "V_2 = V_1\\dfrac{T_2}{T_1}" }],
  },
];

/** 高校物理「波動」。波の基本式・弦や気柱の振動・ドップラー効果などをまとめている。 */
export const PHYSICS_WAVES_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Basic wave equation", ja: "波の基本式", es: "Ecuación fundamental de las ondas", "pt-BR": "Equação fundamental das ondas", de: "Grundgleichung der Wellen", fr: "Équation fondamentale des ondes" },
    description: { en: "Compute the wave speed from its frequency and wavelength.", ja: "振動数と波長から、波の速さを求めます。", es: "Calcula la velocidad de una onda a partir de su frecuencia y longitud de onda.", "pt-BR": "Calcule a velocidade de uma onda a partir de sua frequência e comprimento de onda.", de: "Berechnet die Ausbreitungsgeschwindigkeit einer Welle aus ihrer Frequenz und Wellenlänge.", fr: "Calculer la vitesse d'une onde à partir de sa fréquence et de sa longueur d'onde." },
    localConstants: [
      { symbol: "f", expression: "440Hz" },
      { symbol: "λ", expression: "0.77m" },
    ],
    steps: [{ title: { en: "Speed v", ja: "速さ v", es: "Velocidad v", "pt-BR": "Velocidade v", de: "Geschwindigkeit v", fr: "Vitesse v" }, expression: "f*λ", targetUnit: "m/s", formulaLatex: "v = f\\lambda" }],
  },
  {
    title: { en: "Vibration of a string (fundamental frequency)", ja: "弦の振動（基本振動数）", es: "Vibración de una cuerda (frecuencia fundamental)", "pt-BR": "Vibração de uma corda (frequência fundamental)", de: "Schwingung einer Saite (Grundfrequenz)", fr: "Vibration d'une corde (fréquence fondamentale)" },
    description: { en: "Compute the fundamental frequency of a vibrating string from the wave speed and string length.", ja: "弦を伝わる波の速さと弦の長さから、基本振動数を求めます。", es: "Calcula la frecuencia fundamental de una cuerda vibrante a partir de la velocidad de la onda y la longitud de la cuerda.", "pt-BR": "Calcule a frequência fundamental de uma corda vibrante a partir da velocidade da onda e do comprimento da corda.", de: "Berechnet die Grundfrequenz einer schwingenden Saite aus der Wellengeschwindigkeit und der Saitenlänge.", fr: "Calculer la fréquence fondamentale d'une corde vibrante à partir de la vitesse de l'onde et de la longueur de la corde." },
    localConstants: [
      { symbol: "v", expression: "200m/s" },
      { symbol: "L", expression: "0.5m" },
    ],
    steps: [{ title: { en: "Fundamental frequency f", ja: "基本振動数 f", es: "Frecuencia fundamental f", "pt-BR": "Frequência fundamental f", de: "Grundfrequenz f", fr: "Fréquence fondamentale f" }, expression: "v/(2*L)", targetUnit: "Hz", formulaLatex: "f = \\dfrac{v}{2L}" }],
  },
  {
    title: { en: "Vibration of an air column (closed pipe fundamental)", ja: "気柱の振動（閉管の基本振動数）", es: "Vibración de una columna de aire (frecuencia fundamental de un tubo cerrado)", "pt-BR": "Vibração de uma coluna de ar (frequência fundamental de um tubo fechado)", de: "Schwingung einer Luftsäule (Grundfrequenz eines einseitig geschlossenen Rohrs)", fr: "Vibration d'une colonne d'air (fréquence fondamentale d'un tuyau fermé)" },
    description: { en: "Compute the fundamental frequency of a closed pipe from the speed of sound and pipe length.", ja: "音速と管の長さから、閉管の基本振動数を求めます。", es: "Calcula la frecuencia fundamental de un tubo cerrado a partir de la velocidad del sonido y la longitud del tubo.", "pt-BR": "Calcule a frequência fundamental de um tubo fechado a partir da velocidade do som e do comprimento do tubo.", de: "Berechnet die Grundfrequenz eines einseitig geschlossenen Rohrs aus der Schallgeschwindigkeit und der Rohrlänge.", fr: "Calculer la fréquence fondamentale d'un tuyau fermé à partir de la vitesse du son et de la longueur du tuyau." },
    localConstants: [
      { symbol: "v", expression: "340m/s" },
      { symbol: "L", expression: "0.2m" },
    ],
    steps: [{ title: { en: "Fundamental frequency f", ja: "基本振動数 f", es: "Frecuencia fundamental f", "pt-BR": "Frequência fundamental f", de: "Grundfrequenz f", fr: "Fréquence fondamentale f" }, expression: "v/(4*L)", targetUnit: "Hz", formulaLatex: "f = \\dfrac{v}{4L}" }],
  },
  {
    title: { en: "Doppler effect (approaching source)", ja: "ドップラー効果（音源が近づく場合）", es: "Efecto Doppler (fuente que se acerca)", "pt-BR": "Efeito Doppler (fonte se aproximando)", de: "Dopplereffekt (sich nähernde Schallquelle)", fr: "Effet Doppler (source qui s'approche)" },
    description: { en: "Compute the frequency heard by a stationary observer as a sound source approaches.", ja: "音速・音源の振動数・音源の速さから、観測者が聞く振動数を求めます。", es: "Calcula la frecuencia percibida por un observador en reposo cuando una fuente sonora se acerca.", "pt-BR": "Calcule a frequência percebida por um observador parado quando uma fonte sonora se aproxima.", de: "Berechnet die von einem ruhenden Beobachter wahrgenommene Frequenz, wenn sich eine Schallquelle nähert.", fr: "Calculer la fréquence perçue par un observateur immobile lorsqu'une source sonore s'approche." },
    localConstants: [
      { symbol: "v", expression: "340m/s" },
      { symbol: "f", expression: "500Hz" },
      { symbol: "vₛ", expression: "20m/s" },
    ],
    steps: [{ title: { en: "Observed frequency f'", ja: "観測振動数 f'", es: "Frecuencia observada f'", "pt-BR": "Frequência observada f'", de: "Beobachtete Frequenz f'", fr: "Fréquence observée f'" }, expression: "f*v/(v-vₛ)", targetUnit: "Hz", formulaLatex: "f' = f\\dfrac{v}{v - v_s}" }],
  },
  {
    title: { en: "Law of refraction (Snell's law)", ja: "屈折の法則（スネルの法則）", es: "Ley de la refracción (ley de Snell)", "pt-BR": "Lei da refração (lei de Snell)", de: "Brechungsgesetz (Snelliussches Gesetz)", fr: "Loi de la réfraction (loi de Snell-Descartes)" },
    description: { en: "Compute the refraction angle from the angle of incidence and the refractive indices.", ja: "入射角と屈折率から、屈折角を求めます。", es: "Calcula el ángulo de refracción a partir del ángulo de incidencia y los índices de refracción.", "pt-BR": "Calcule o ângulo de refração a partir do ângulo de incidência e dos índices de refração.", de: "Berechnet den Brechungswinkel aus dem Einfallswinkel und den Brechzahlen.", fr: "Calculer l'angle de réfraction à partir de l'angle d'incidence et des indices de réfraction." },
    localConstants: [
      { symbol: "n₁", expression: "1" },
      { symbol: "n₂", expression: "1.5" },
      { symbol: "θ₁", expression: "30deg" },
    ],
    steps: [{ title: { en: "Refraction angle θ2", ja: "屈折角 θ2", es: "Ángulo de refracción θ2", "pt-BR": "Ângulo de refração θ2", de: "Brechungswinkel θ2", fr: "Angle de réfraction θ2" }, expression: "asin(n₁*sin(θ₁)/n₂)", targetUnit: "deg", formulaLatex: "\\theta_2 = \\arcsin\\!\\left(\\dfrac{n_1 \\sin\\theta_1}{n_2}\\right)" }],
  },
];

/** 高校物理「電気」。クーロンの法則・オームの法則・コンデンサーなど電気分野の式をまとめている。 */
export const PHYSICS_ELECTRICITY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Coulomb's law", ja: "クーロンの法則", es: "Ley de Coulomb", "pt-BR": "Lei de Coulomb", de: "Coulombsches Gesetz", fr: "Loi de Coulomb" },
    description: { en: "Compute the electrostatic force between two point charges using Coulomb's law.", ja: "2つの点電荷間に働く静電気力を、クーロンの法則から求めます。", es: "Calcula la fuerza electrostática entre dos cargas puntuales mediante la ley de Coulomb.", "pt-BR": "Calcule a força eletrostática entre duas cargas puntiformes usando a lei de Coulomb.", de: "Berechnet die elektrostatische Kraft zwischen zwei Punktladungen mithilfe des coulombschen Gesetzes.", fr: "Calculer la force électrostatique entre deux charges ponctuelles à l'aide de la loi de Coulomb." },
    localConstants: [
      { symbol: "k", expression: "8.99e9N*m^2/C^2" },
      { symbol: "q₁", expression: "2e-6C" },
      { symbol: "q₂", expression: "3e-6C" },
      { symbol: "r", expression: "0.1m" },
    ],
    steps: [{ title: { en: "Electrostatic force F", ja: "静電気力 F", es: "Fuerza electrostática F", "pt-BR": "Força eletrostática F", de: "Elektrostatische Kraft F", fr: "Force électrostatique F" }, expression: "k*q₁*q₂/r^2", targetUnit: "N", formulaLatex: "F = k\\dfrac{q_1 q_2}{r^2}" }],
  },
  {
    title: { en: "Ohm's law", ja: "オームの法則", es: "Ley de Ohm", "pt-BR": "Lei de Ohm", de: "Ohmsches Gesetz", fr: "Loi d'Ohm" },
    description: { en: "Compute the voltage from the current and resistance.", ja: "電流と抵抗から、電圧を求めます。", es: "Calcula el voltaje a partir de la corriente y la resistencia.", "pt-BR": "Calcule a tensão a partir da corrente e da resistência.", de: "Berechnet die Spannung aus der Stromstärke und dem Widerstand.", fr: "Calculer la tension à partir du courant et de la résistance." },
    localConstants: [
      { symbol: "I", expression: "0.5A" },
      { symbol: "R", expression: "20Ohm" },
    ],
    steps: [{ title: { en: "Voltage V", ja: "電圧 V", es: "Voltaje V", "pt-BR": "Tensão V", de: "Spannung V", fr: "Tension V" }, expression: "I*R", targetUnit: "V", formulaLatex: "V = IR" }],
  },
  {
    title: { en: "Electric power", ja: "電力", es: "Potencia eléctrica", "pt-BR": "Potência elétrica", de: "Elektrische Leistung", fr: "Puissance électrique" },
    description: { en: "Compute the electric power consumed from the current and voltage.", ja: "電流と電圧から、消費電力を求めます。", es: "Calcula la potencia eléctrica consumida a partir de la corriente y el voltaje.", "pt-BR": "Calcule a potência elétrica consumida a partir da corrente e da tensão.", de: "Berechnet die aufgenommene elektrische Leistung aus der Stromstärke und der Spannung.", fr: "Calculer la puissance électrique consommée à partir du courant et de la tension." },
    localConstants: [
      { symbol: "I", expression: "0.5A" },
      { symbol: "V", expression: "10V" },
    ],
    steps: [{ title: { en: "Power P", ja: "電力 P", es: "Potencia P", "pt-BR": "Potência P", de: "Leistung P", fr: "Puissance P" }, expression: "I*V", targetUnit: "W", formulaLatex: "P = IV" }],
  },
  {
    title: { en: "Capacitor charge and stored energy", ja: "コンデンサーの電気量と静電エネルギー", es: "Carga y energía almacenada en un condensador", "pt-BR": "Carga e energia armazenada em um capacitor", de: "Ladung und gespeicherte Energie eines Kondensators", fr: "Charge et énergie stockée dans un condensateur" },
    description: { en: "Compute the stored charge and electrostatic energy of a capacitor from its capacitance and voltage.", ja: "静電容量と電圧から、蓄えられる電気量と静電エネルギーを求めます。", es: "Calcula la carga almacenada y la energía electrostática de un condensador a partir de su capacitancia y voltaje.", "pt-BR": "Calcule a carga armazenada e a energia eletrostática de um capacitor a partir de sua capacitância e tensão.", de: "Berechnet die gespeicherte Ladung und die elektrostatische Energie eines Kondensators aus seiner Kapazität und Spannung.", fr: "Calculer la charge stockée et l'énergie électrostatique d'un condensateur à partir de sa capacité et de sa tension." },
    localConstants: [
      { symbol: "C", expression: "100uF" },
      { symbol: "V", expression: "12V" },
    ],
    steps: [
      { title: { en: "Charge Q", ja: "電気量 Q", es: "Carga Q", "pt-BR": "Carga Q", de: "Ladung Q", fr: "Charge Q" }, expression: "C*V", targetUnit: "mC", formulaLatex: "Q = CV" },
      { title: { en: "Stored energy U", ja: "静電エネルギー U", es: "Energía almacenada U", "pt-BR": "Energia armazenada U", de: "Gespeicherte Energie U", fr: "Énergie stockée U" }, expression: "0.5*C*V^2", targetUnit: "mJ", formulaLatex: "U = \\dfrac{1}{2}CV^2" },
    ],
  },
  {
    title: { en: "Electromagnetic induction (induced EMF)", ja: "電磁誘導（誘導起電力）", es: "Inducción electromagnética (fem inducida)", "pt-BR": "Indução eletromagnética (fem induzida)", de: "Elektromagnetische Induktion (induzierte Spannung)", fr: "Induction électromagnétique (f.é.m. induite)" },
    description: { en: "Compute the induced EMF of a coil from the number of turns and the rate of change of magnetic flux.", ja: "コイルの巻数と磁束の変化から、誘導起電力を求めます。", es: "Calcula la fem inducida en una bobina a partir del número de espiras y la variación del flujo magnético.", "pt-BR": "Calcule a fem induzida em uma bobina a partir do número de espiras e da variação do fluxo magnético.", de: "Berechnet die in einer Spule induzierte Spannung aus der Windungszahl und der Änderung des magnetischen Flusses.", fr: "Calculer la f.é.m. induite dans une bobine à partir du nombre de spires et de la variation du flux magnétique." },
    localConstants: [
      { symbol: "N", expression: "200" },
      { symbol: "ΔΦ", expression: "0.02Wb" },
      { symbol: "Δt", expression: "0.1s" },
    ],
    steps: [{ title: { en: "Induced EMF V", ja: "誘導起電力 V", es: "Fem inducida V", "pt-BR": "Fem induzida V", de: "Induzierte Spannung V", fr: "F.é.m. induite V" }, expression: "N*ΔΦ/Δt", targetUnit: "V", formulaLatex: "V = N\\dfrac{\\Delta\\Phi}{\\Delta t}" }],
  },
];

/** 高校物理「原子」。光子のエネルギー・光電効果・半減期・ボーアモデルをまとめている。 */
export const PHYSICS_ATOMIC_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Photon energy", ja: "光子のエネルギー", es: "Energía de un fotón", "pt-BR": "Energia de um fóton", de: "Photonenenergie", fr: "Énergie d'un photon" },
    description: { en: "Compute the energy of a single photon from Planck's constant and the light frequency.", ja: "プランク定数と振動数から、光子1個のエネルギーを求めます。", es: "Calcula la energía de un solo fotón a partir de la constante de Planck y la frecuencia de la luz.", "pt-BR": "Calcule a energia de um único fóton a partir da constante de Planck e da frequência da luz.", de: "Berechnet die Energie eines einzelnen Photons aus dem planckschen Wirkungsquantum und der Lichtfrequenz.", fr: "Calculer l'énergie d'un photon unique à partir de la constante de Planck et de la fréquence de la lumière." },
    localConstants: [
      { symbol: "h", expression: "6.626e-34J*s" },
      { symbol: "f", expression: "5e14Hz" },
    ],
    steps: [{ title: { en: "Photon energy E", ja: "光子のエネルギー E", es: "Energía del fotón E", "pt-BR": "Energia do fóton E", de: "Photonenenergie E", fr: "Énergie du photon E" }, expression: "h*f", targetUnit: "eV", formulaLatex: "E = hf" }],
  },
  {
    title: { en: "Photoelectric effect (max kinetic energy)", ja: "光電効果（最大運動エネルギー）", es: "Efecto fotoeléctrico (energía cinética máxima)", "pt-BR": "Efeito fotoelétrico (energia cinética máxima)", de: "Photoelektrischer Effekt (maximale kinetische Energie)", fr: "Effet photoélectrique (énergie cinétique maximale)" },
    description: { en: "Compute the maximum kinetic energy of an emitted electron from the incident light frequency and the work function.", ja: "入射光の振動数と仕事関数から、飛び出す電子の最大運動エネルギーを求めます。", es: "Calcula la energía cinética máxima de un electrón emitido a partir de la frecuencia de la luz incidente y la función de trabajo.", "pt-BR": "Calcule a energia cinética máxima de um elétron emitido a partir da frequência da luz incidente e da função trabalho.", de: "Berechnet die maximale kinetische Energie eines emittierten Elektrons aus der Frequenz des einfallenden Lichts und der Austrittsarbeit.", fr: "Calculer l'énergie cinétique maximale d'un électron émis à partir de la fréquence de la lumière incidente et du travail d'extraction." },
    localConstants: [
      { symbol: "h", expression: "6.626e-34J*s" },
      { symbol: "f", expression: "1.2e15Hz" },
      { symbol: "W", expression: "3eV" },
    ],
    steps: [
      { title: { en: "Photon energy hf", ja: "光子のエネルギー hf", es: "Energía del fotón hf", "pt-BR": "Energia do fóton hf", de: "Photonenenergie hf", fr: "Énergie du photon hf" }, expression: "h*f", targetUnit: "eV", formulaLatex: "hf" },
      { title: { en: "Max kinetic energy Kmax", ja: "最大運動エネルギー Kmax", es: "Energía cinética máxima Kmax", "pt-BR": "Energia cinética máxima Kmax", de: "Maximale kinetische Energie Kmax", fr: "Énergie cinétique maximale Kmax" }, expression: "s1-W", targetUnit: "eV", formulaLatex: "K_{max} = hf - W" },
    ],
  },
  {
    title: { en: "Radioactive decay (half-life)", ja: "放射性崩壊（半減期）", es: "Desintegración radiactiva (semivida)", "pt-BR": "Decaimento radioativo (meia-vida)", de: "Radioaktiver Zerfall (Halbwertszeit)", fr: "Désintégration radioactive (demi-vie)" },
    description: { en: "Compute the remaining number of atoms from the half-life, elapsed time, and initial atom count.", ja: "半減期・経過時間・初期の原子数から、残っている原子数を求めます。", es: "Calcula el número de átomos restantes a partir de la semivida, el tiempo transcurrido y el número inicial de átomos.", "pt-BR": "Calcule o número de átomos restantes a partir da meia-vida, do tempo decorrido e do número inicial de átomos.", de: "Berechnet die verbleibende Anzahl an Atomen aus der Halbwertszeit, der verstrichenen Zeit und der anfänglichen Atomanzahl.", fr: "Calculer le nombre d'atomes restants à partir de la demi-vie, du temps écoulé et du nombre initial d'atomes." },
    localConstants: [
      { symbol: "N₀", expression: "1000000" },
      { symbol: "T", expression: "5.3yr" },
      { symbol: "t", expression: "10.6yr" },
    ],
    steps: [{ title: { en: "Remaining count N", ja: "残っている数 N", es: "Cantidad restante N", "pt-BR": "Quantidade restante N", de: "Verbleibende Anzahl N", fr: "Nombre restant N" }, expression: "N₀*0.5^(t/T)", targetUnit: "", formulaLatex: "N = N_0 \\cdot 0.5^{t/T}" }],
  },
  {
    title: { en: "Bohr model (hydrogen energy levels)", ja: "ボーアモデル（水素原子のエネルギー準位）", es: "Modelo de Bohr (niveles de energía del átomo de hidrógeno)", "pt-BR": "Modelo de Bohr (níveis de energia do átomo de hidrogênio)", de: "Bohrsches Atommodell (Energieniveaus des Wasserstoffatoms)", fr: "Modèle de Bohr (niveaux d'énergie de l'atome d'hydrogène)" },
    description: { en: "Compute the energy level of a hydrogen atom from its quantum number using the Bohr model.", ja: "量子数から、水素原子のエネルギー準位を求めます。", es: "Calcula el nivel de energía de un átomo de hidrógeno a partir de su número cuántico mediante el modelo de Bohr.", "pt-BR": "Calcule o nível de energia de um átomo de hidrogênio a partir de seu número quântico usando o modelo de Bohr.", de: "Berechnet das Energieniveau eines Wasserstoffatoms aus seiner Quantenzahl mithilfe des bohrschen Atommodells.", fr: "Calculer le niveau d'énergie d'un atome d'hydrogène à partir de son nombre quantique à l'aide du modèle de Bohr." },
    localConstants: [{ symbol: "n", expression: "2" }],
    steps: [{ title: { en: "Energy level En", ja: "エネルギー準位 En", es: "Nivel de energía En", "pt-BR": "Nível de energia En", de: "Energieniveau En", fr: "Niveau d'énergie En" }, expression: "-13.6eV/(n^2)", targetUnit: "eV", formulaLatex: "E_n = -\\dfrac{13.6\\text{eV}}{n^2}" }],
  },
];
