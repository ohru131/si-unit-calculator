import type { NotebookSeed } from "../types";

/** 「電子工作」。分圧回路・RC時定数・リアクタンス・電池の持ちなど、ブレッドボードの上で実際に使う計算をまとめている。 */
export const ELECTRONICS_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Voltage divider output", ja: "分圧回路の出力電圧", es: "Salida de un divisor de voltaje", "pt-BR": "Saída de um divisor de tensão", de: "Ausgangsspannung des Spannungsteilers", fr: "Tension de sortie d'un diviseur de tension" },
    description: { en: "Compute the output voltage of a two-resistor voltage divider from the input voltage and the two resistances, together with the current and power in the divider string.", ja: "入力電圧と2本の抵抗値から、分圧回路の出力電圧と、分圧抵抗に流れる電流・消費電力を求めます。", es: "Calcula el voltaje de salida de un divisor de voltaje de dos resistencias a partir del voltaje de entrada y de los dos valores de resistencia, junto con la corriente y la potencia en la rama del divisor.", "pt-BR": "Calcule a tensão de saída de um divisor de tensão de dois resistores a partir da tensão de entrada e dos dois valores de resistência, junto com a corrente e a potência no ramo do divisor.", de: "Berechnet die Ausgangsspannung eines Spannungsteilers aus zwei Widerständen anhand der Eingangsspannung und der beiden Widerstandswerte sowie den Strom und die Leistung im Teilerzweig.", fr: "Calculer la tension de sortie d'un diviseur de tension à deux résistances à partir de la tension d'entrée et des deux valeurs de résistance, ainsi que le courant et la puissance dans la branche du diviseur." },
    localConstants: [
      { symbol: "Vᵢₙ", expression: "12V" },
      { symbol: "R₁", expression: "10kOhm" },
      { symbol: "R₂", expression: "4.7kOhm" },
    ],
    steps: [
      { title: { en: "Output voltage Vout", ja: "出力電圧 Vout", es: "Voltaje de salida Vout", "pt-BR": "Tensão de saída Vout", de: "Ausgangsspannung Vout", fr: "Tension de sortie Vout" }, expression: "Vᵢₙ*R₂/(R₁+R₂)", targetUnit: "V", formulaLatex: "V_{out} = V_{in} \\dfrac{R_2}{R_1 + R_2}" },
      { title: { en: "Divider current I", ja: "分圧抵抗に流れる電流 I", es: "Corriente del divisor I", "pt-BR": "Corrente do divisor I", de: "Teilerstrom I", fr: "Courant dans le diviseur I" }, expression: "Vᵢₙ/(R₁+R₂)", targetUnit: "mA", formulaLatex: "I = \\dfrac{V_{in}}{R_1 + R_2}" },
      { title: { en: "Power in the divider P", ja: "分圧抵抗の消費電力 P", es: "Potencia en el divisor P", "pt-BR": "Potência no divisor P", de: "Leistung im Teiler P", fr: "Puissance dans le diviseur P" }, expression: "Vᵢₙ^2/(R₁+R₂)", targetUnit: "mW", formulaLatex: "P = \\dfrac{V_{in}^2}{R_1 + R_2}" },
    ],
  },
  {
    title: { en: "RC time constant and charging time", ja: "RC時定数と充電時間", es: "Constante de tiempo RC y tiempo de carga", "pt-BR": "Constante de tempo RC e tempo de carga", de: "RC-Zeitkonstante und Ladezeit", fr: "Constante de temps RC et temps de charge" },
    description: { en: "Compute the time constant of an RC circuit from the resistance and capacitance, and the time it takes the capacitor to charge up to a given voltage.", ja: "抵抗値と静電容量から、RC回路の時定数と、コンデンサが指定の電圧まで充電されるまでの時間を求めます。", es: "Calcula la constante de tiempo de un circuito RC a partir de la resistencia y la capacitancia, y el tiempo que tarda el condensador en cargarse hasta un voltaje dado.", "pt-BR": "Calcule a constante de tempo de um circuito RC a partir da resistência e da capacitância, e o tempo que o capacitor leva para carregar até uma tensão especificada.", de: "Berechnet die Zeitkonstante eines RC-Glieds aus Widerstand und Kapazität sowie die Zeit, bis der Kondensator auf eine vorgegebene elektrische Spannung aufgeladen ist.", fr: "Calculer la constante de temps d'un circuit RC à partir de la résistance et de la capacité, ainsi que le temps nécessaire pour que le condensateur se charge jusqu'à une tension donnée." },
    localConstants: [
      { symbol: "R", expression: "47kOhm" },
      { symbol: "C", expression: "100µF" },
      { symbol: "Vₛ", expression: "5V" },
      { symbol: "Vₜ", expression: "3V" },
    ],
    steps: [
      { title: { en: "Time constant τ", ja: "時定数 τ", es: "Constante de tiempo τ", "pt-BR": "Constante de tempo τ", de: "Zeitkonstante τ", fr: "Constante de temps τ" }, expression: "R*C", targetUnit: "s", formulaLatex: "\\tau = RC" },
      { title: { en: "Time to reach 99% (5τ)", ja: "99%に達するまでの時間（5τ）", es: "Tiempo hasta alcanzar el 99% (5τ)", "pt-BR": "Tempo para atingir 99% (5τ)", de: "Zeit bis 99% (5τ)", fr: "Temps pour atteindre 99% (5τ)" }, expression: "5*R*C", targetUnit: "s", formulaLatex: "t_{99} = 5RC" },
      { title: { en: "Time to charge to Vt", ja: "Vtまで充電される時間", es: "Tiempo de carga hasta Vt", "pt-BR": "Tempo de carga até Vt", de: "Zeit bis zur Ladung auf Vt", fr: "Temps de charge jusqu'à Vt" }, expression: "R*C*ln(Vₛ/(Vₛ-Vₜ))", targetUnit: "s", formulaLatex: "t = RC \\ln \\dfrac{V_s}{V_s - V_t}" },
    ],
  },
  {
    title: { en: "Three resistors in series, parallel and mixed", ja: "抵抗3本の直列・並列・混合合成", es: "Tres resistencias en serie, en paralelo y en combinación mixta", "pt-BR": "Três resistores em série, em paralelo e em associação mista", de: "Drei Widerstände in Reihe, parallel und gemischt", fr: "Trois résistances en série, en parallèle et en montage mixte" },
    description: { en: "Compute the combined resistance of three resistors wired in series, wired all in parallel, and wired as two in parallel followed by the third in series.", ja: "3本の抵抗値から、すべて直列にした場合・すべて並列にした場合・2本を並列にして3本目を直列にした場合の合成抵抗をそれぞれ求めます。", es: "Calcula la resistencia equivalente de tres resistencias conectadas todas en serie, todas en paralelo, y con dos en paralelo seguidas de la tercera en serie.", "pt-BR": "Calcule a resistência equivalente de três resistores ligados todos em série, todos em paralelo, e com dois em paralelo seguidos do terceiro em série.", de: "Berechnet den Ersatzwiderstand von drei Widerständen, wenn alle in Reihe geschaltet sind, wenn alle parallel geschaltet sind und wenn zwei parallel geschaltet sind und der dritte dazu in Reihe liegt.", fr: "Calculer la résistance équivalente de trois résistances montées toutes en série, toutes en parallèle, puis deux en parallèle suivies de la troisième en série." },
    localConstants: [
      { symbol: "R₁", expression: "1kOhm" },
      { symbol: "R₂", expression: "2.2kOhm" },
      { symbol: "R₃", expression: "4.7kOhm" },
    ],
    steps: [
      { title: { en: "All three in series", ja: "3本すべて直列", es: "Las tres en serie", "pt-BR": "Os três em série", de: "Alle drei in Reihe", fr: "Les trois en série" }, expression: "R₁+R₂+R₃", targetUnit: "kOhm", formulaLatex: "R_{series} = R_1 + R_2 + R_3" },
      { title: { en: "All three in parallel", ja: "3本すべて並列", es: "Las tres en paralelo", "pt-BR": "Os três em paralelo", de: "Alle drei parallel", fr: "Les trois en parallèle" }, expression: "(1/R₁+1/R₂+1/R₃)^-1", targetUnit: "Ohm", formulaLatex: "R_{parallel} = \\left(\\dfrac{1}{R_1} + \\dfrac{1}{R_2} + \\dfrac{1}{R_3}\\right)^{-1}" },
      { title: { en: "R1 parallel R2, then R3 in series", ja: "R1・R2を並列にしてR3を直列", es: "R1 en paralelo con R2, y R3 en serie", "pt-BR": "R1 em paralelo com R2, e R3 em série", de: "R1 parallel zu R2, dann R3 in Reihe", fr: "R1 en parallèle avec R2, puis R3 en série" }, expression: "(1/R₁+1/R₂)^-1+R₃", targetUnit: "kOhm", formulaLatex: "R_{mixed} = \\left(\\dfrac{1}{R_1} + \\dfrac{1}{R_2}\\right)^{-1} + R_3" },
    ],
  },
  {
    title: { en: "Charge and energy stored in a capacitor", ja: "コンデンサに蓄えられる電荷とエネルギー", es: "Carga y energía almacenadas en un condensador", "pt-BR": "Carga e energia armazenadas em um capacitor", de: "Ladung und Energie im Kondensator", fr: "Charge et énergie stockées dans un condensateur" },
    description: { en: "Compute the charge and the energy stored in a capacitor from its capacitance and voltage, and how long it can hold up a load before the voltage sags by a given amount.", ja: "静電容量と電圧から、コンデンサに蓄えられる電荷とエネルギーを求め、指定の電圧降下までどれだけ負荷を支えられるかを計算します。", es: "Calcula la carga y la energía almacenadas en un condensador a partir de su capacitancia y su voltaje, y durante cuánto tiempo puede alimentar una carga antes de que el voltaje caiga una cantidad dada.", "pt-BR": "Calcule a carga e a energia armazenadas em um capacitor a partir de sua capacitância e de sua tensão, e por quanto tempo ele consegue sustentar uma carga antes que a tensão caia um valor determinado.", de: "Berechnet die im Kondensator gespeicherte Ladung und Energie aus Kapazität und elektrischer Spannung sowie die Zeit, die er eine Last stützen kann, bevor die Spannung um einen vorgegebenen Betrag einbricht.", fr: "Calculer la charge et l'énergie stockées dans un condensateur à partir de sa capacité et de sa tension, ainsi que la durée pendant laquelle il peut alimenter une charge avant que la tension ne chute d'une valeur donnée." },
    localConstants: [
      { symbol: "C", expression: "470µF" },
      { symbol: "V", expression: "12V" },
      { symbol: "I", expression: "100mA" },
      { symbol: "ΔV", expression: "1V" },
    ],
    steps: [
      { title: { en: "Stored charge Q", ja: "蓄えられる電荷 Q", es: "Carga almacenada Q", "pt-BR": "Carga armazenada Q", de: "Gespeicherte Ladung Q", fr: "Charge stockée Q" }, expression: "C*V", targetUnit: "mC", formulaLatex: "Q = CV" },
      { title: { en: "Stored energy E", ja: "蓄えられるエネルギー E", es: "Energía almacenada E", "pt-BR": "Energia armazenada E", de: "Gespeicherte Energie E", fr: "Énergie stockée E" }, expression: "C*V^2/2", targetUnit: "mJ", formulaLatex: "E = \\dfrac{1}{2}CV^2" },
      { title: { en: "Hold-up time t", ja: "電圧を保てる時間 t", es: "Tiempo de retención (hold-up) t", "pt-BR": "Tempo de retenção (hold-up) t", de: "Überbrückungszeit (Hold-up-Zeit) t", fr: "Temps de maintien (hold-up) t" }, expression: "C*ΔV/I", targetUnit: "ms", formulaLatex: "t = \\dfrac{C \\Delta V}{I}" },
    ],
  },
  {
    title: { en: "Battery runtime from capacity", ja: "電池の容量から求める動作時間", es: "Autonomía de una batería según su capacidad", "pt-BR": "Autonomia da bateria a partir da capacidade", de: "Laufzeit einer Batterie aus der Kapazität", fr: "Autonomie d'une batterie d'après sa capacité" },
    description: { en: "Compute how long a battery lasts from its capacity in mA·h and the current the circuit draws, both ideally and with a usable-capacity factor, plus the energy it stores.", ja: "電池の容量（mA·h）と回路の消費電流から、理想的な動作時間と実際に使える容量を見込んだ動作時間、そして蓄えられているエネルギーを求めます。", es: "Calcula cuánto dura una batería a partir de su capacidad en mA·h y de la corriente que consume el circuito, tanto en el caso ideal como aplicando un factor de capacidad aprovechable, además de la energía que almacena.", "pt-BR": "Calcule quanto tempo uma bateria dura a partir de sua capacidade em mA·h e da corrente consumida pelo circuito, tanto no caso ideal quanto com um fator de capacidade aproveitável, além da energia que ela armazena.", de: "Berechnet, wie lange eine Batterie hält, aus ihrer Kapazität in mA·h und dem Strom, den die Schaltung zieht – im Idealfall und mit einem Faktor für die nutzbare Kapazität – sowie die gespeicherte Energie.", fr: "Calculer la durée de fonctionnement d'une batterie à partir de sa capacité en mA·h et du courant consommé par le circuit, dans le cas idéal puis avec un facteur de capacité utilisable, ainsi que l'énergie qu'elle stocke." },
    localConstants: [
      { symbol: "Q", expression: "2000mA*h" },
      { symbol: "I", expression: "180mA" },
      { symbol: "η", expression: "0.85" },
      { symbol: "V", expression: "3.7V" },
    ],
    steps: [
      { title: { en: "Ideal runtime", ja: "理想的な動作時間", es: "Autonomía ideal", "pt-BR": "Autonomia ideal", de: "Ideale Laufzeit", fr: "Autonomie idéale" }, expression: "Q/I", targetUnit: "h", formulaLatex: "t_{ideal} = \\dfrac{Q}{I}" },
      { title: { en: "Runtime with usable-capacity factor", ja: "実使用率を見込んだ動作時間", es: "Autonomía con el factor de capacidad aprovechable", "pt-BR": "Autonomia com o fator de capacidade aproveitável", de: "Laufzeit mit Faktor für die nutzbare Kapazität", fr: "Autonomie avec le facteur de capacité utilisable" }, expression: "η*Q/I", targetUnit: "h", formulaLatex: "t_{real} = \\dfrac{\\eta Q}{I}" },
      { title: { en: "Stored energy E", ja: "蓄えられているエネルギー E", es: "Energía almacenada E", "pt-BR": "Energia armazenada E", de: "Gespeicherte Energie E", fr: "Énergie stockée E" }, expression: "Q*V", targetUnit: "Wh", formulaLatex: "E = QV" },
    ],
  },
  {
    title: { en: "Capacitive and inductive reactance", ja: "容量リアクタンスと誘導リアクタンス", es: "Reactancia capacitiva e inductiva", "pt-BR": "Reatância capacitiva e indutiva", de: "Kapazitiver und induktiver Blindwiderstand", fr: "Réactance capacitive et inductive" },
    description: { en: "Compute the reactance of a capacitor and of an inductor at a given frequency, and the net reactance when the two are in series.", ja: "ある周波数でのコンデンサとコイルのリアクタンスを求め、両者を直列にしたときの合成リアクタンスを計算します。", es: "Calcula la reactancia de un condensador y la de una bobina a una frecuencia dada, y la reactancia resultante cuando ambos están en serie.", "pt-BR": "Calcule a reatância de um capacitor e a de um indutor em uma frequência dada, e a reatância resultante quando os dois estão em série.", de: "Berechnet den Blindwiderstand eines Kondensators und einer Spule bei einer gegebenen Frequenz sowie den resultierenden Blindwiderstand, wenn beide in Reihe liegen.", fr: "Calculer la réactance d'un condensateur et celle d'une bobine à une fréquence donnée, ainsi que la réactance résultante lorsque les deux sont en série." },
    localConstants: [
      { symbol: "f", expression: "1kHz" },
      { symbol: "C", expression: "100nF" },
      { symbol: "L", expression: "10mH" },
    ],
    steps: [
      { title: { en: "Capacitive reactance XC", ja: "容量リアクタンス XC", es: "Reactancia capacitiva XC", "pt-BR": "Reatância capacitiva XC", de: "Kapazitiver Blindwiderstand XC", fr: "Réactance capacitive XC" }, expression: "1/(2*pi*f*C)", targetUnit: "Ohm", formulaLatex: "X_C = \\dfrac{1}{2\\pi f C}" },
      { title: { en: "Inductive reactance XL", ja: "誘導リアクタンス XL", es: "Reactancia inductiva XL", "pt-BR": "Reatância indutiva XL", de: "Induktiver Blindwiderstand XL", fr: "Réactance inductive XL" }, expression: "2*pi*f*L", targetUnit: "Ohm", formulaLatex: "X_L = 2\\pi f L" },
      { title: { en: "Net series reactance X", ja: "直列合成リアクタンス X", es: "Reactancia resultante en serie X", "pt-BR": "Reatância resultante em série X", de: "Resultierender Blindwiderstand in Reihe X", fr: "Réactance résultante en série X" }, expression: "2*pi*f*L-1/(2*pi*f*C)", targetUnit: "Ohm", formulaLatex: "X = 2\\pi f L - \\dfrac{1}{2\\pi f C}" },
    ],
  },
  {
    title: { en: "LC resonant frequency", ja: "LC共振周波数", es: "Frecuencia de resonancia LC", "pt-BR": "Frequência de ressonância LC", de: "LC-Resonanzfrequenz", fr: "Fréquence de résonance LC" },
    description: { en: "Compute the resonant frequency of an LC tank from the inductance and capacitance, along with its characteristic impedance and the Q factor set by the series resistance.", ja: "コイルのインダクタンスとコンデンサの静電容量から、LC共振回路の共振周波数・特性インピーダンス・直列抵抗で決まるQ値を求めます。", es: "Calcula la frecuencia de resonancia de un circuito LC a partir de la inductancia y la capacitancia, junto con su impedancia característica y el factor Q que fija la resistencia en serie.", "pt-BR": "Calcule a frequência de ressonância de um circuito LC a partir da indutância e da capacitância, junto com sua impedância característica e o fator Q definido pela resistência em série.", de: "Berechnet die Resonanzfrequenz eines LC-Schwingkreises aus Induktivität und Kapazität sowie dessen Kennwiderstand und die Güte (Q-Faktor), die der Reihenwiderstand festlegt.", fr: "Calculer la fréquence de résonance d'un circuit LC à partir de l'inductance et de la capacité, ainsi que son impédance caractéristique et le facteur de qualité (facteur Q) fixé par la résistance série." },
    localConstants: [
      { symbol: "L", expression: "100µH" },
      { symbol: "C", expression: "100pF" },
      { symbol: "R", expression: "5Ohm" },
    ],
    steps: [
      { title: { en: "Resonant frequency f0", ja: "共振周波数 f0", es: "Frecuencia de resonancia f0", "pt-BR": "Frequência de ressonância f0", de: "Resonanzfrequenz f0", fr: "Fréquence de résonance f0" }, expression: "1/(2*pi*sqrt(L*C))", targetUnit: "MHz", formulaLatex: "f_0 = \\dfrac{1}{2\\pi\\sqrt{LC}}" },
      { title: { en: "Characteristic impedance Z0", ja: "特性インピーダンス Z0", es: "Impedancia característica Z0", "pt-BR": "Impedância característica Z0", de: "Kennwiderstand Z0", fr: "Impédance caractéristique Z0" }, expression: "sqrt(L/C)", targetUnit: "Ohm", formulaLatex: "Z_0 = \\sqrt{\\dfrac{L}{C}}" },
      { title: { en: "Q factor", ja: "Q値", es: "Factor Q", "pt-BR": "Fator Q", de: "Güte (Q-Faktor)", fr: "Facteur de qualité (facteur Q)" }, expression: "sqrt(L/C)/R", targetUnit: "", formulaLatex: "Q = \\dfrac{1}{R}\\sqrt{\\dfrac{L}{C}}" },
    ],
  },
  {
    title: { en: "Resistor power dissipation and derating", ja: "抵抗の消費電力とディレーティング", es: "Potencia disipada en una resistencia y reducción de régimen (derating)", "pt-BR": "Potência dissipada em um resistor e derating (redução de regime)", de: "Verlustleistung eines Widerstands und Derating (Leistungsminderung)", fr: "Puissance dissipée dans une résistance et déclassement (derating)" },
    description: { en: "Compute the power a resistor dissipates from the current through it, how much of its rating that uses, and the largest current allowed if you limit it to a given fraction of the rating (δ = 0.5 means using at most half the rated power).", ja: "抵抗に流れる電流から消費電力を求め、定格に対する使用率と、定格の何割かに抑えて使う場合に流せる最大電流を計算します（δ=0.5なら定格電力の半分までで使う、という意味です）。", es: "Calcula la potencia que disipa una resistencia a partir de la corriente que circula por ella, qué parte de su valor nominal supone eso y la corriente máxima admisible si te limitas a una fracción dada del valor nominal (δ = 0,5 significa usar como mucho la mitad de la potencia nominal).", "pt-BR": "Calcule a potência que um resistor dissipa a partir da corrente que passa por ele, que parcela do valor nominal isso representa e a corrente máxima permitida se você se limitar a uma fração dada do valor nominal (δ = 0,5 significa usar no máximo metade da potência nominal).", de: "Berechnet die Verlustleistung eines Widerstands aus dem Strom durch ihn, welchen Anteil des Nennwerts das ausmacht und den größten zulässigen Strom, wenn man sich auf einen vorgegebenen Anteil des Nennwerts beschränkt (δ = 0,5 bedeutet, höchstens die halbe Nennleistung zu nutzen).", fr: "Calculer la puissance dissipée par une résistance à partir du courant qui la traverse, la part de sa valeur nominale que cela représente et le courant maximal admissible si l'on se limite à une fraction donnée de la valeur nominale (δ = 0,5 signifie n'utiliser au plus que la moitié de la puissance nominale)." },
    localConstants: [
      { symbol: "I", expression: "30mA" },
      { symbol: "R", expression: "100Ohm" },
      { symbol: "Pₘₐₓ", expression: "0.25W" },
      { symbol: "δ", expression: "0.5" },
    ],
    steps: [
      { title: { en: "Dissipated power P", ja: "消費電力 P", es: "Potencia disipada P", "pt-BR": "Potência dissipada P", de: "Verlustleistung P", fr: "Puissance dissipée P" }, expression: "I^2*R", targetUnit: "mW", formulaLatex: "P = I^2 R" },
      { title: { en: "Fraction of the rating used", ja: "定格に対する使用率", es: "Grado de aprovechamiento del valor nominal", "pt-BR": "Grau de aproveitamento do valor nominal", de: "Ausnutzungsgrad des Nennwerts", fr: "Taux d'utilisation de la valeur nominale" }, expression: "I^2*R/Pₘₐₓ", targetUnit: "%", formulaLatex: "\\text{use} = \\dfrac{I^2 R}{P_{max}}" },
      { title: { en: "Largest derated current Imax", ja: "ディレーティング後の最大電流 Imax", es: "Corriente máxima tras la reducción de régimen Imax", "pt-BR": "Corrente máxima após o derating Imax", de: "Größter Strom nach dem Derating Imax", fr: "Courant maximal après déclassement Imax" }, expression: "sqrt(δ*Pₘₐₓ/R)", targetUnit: "mA", formulaLatex: "I_{max} = \\sqrt{\\dfrac{\\delta P_{max}}{R}}" },
    ],
  },
];

/** 「太陽光発電・蓄電」。1日の消費電力量からパネル容量・蓄電池容量・充電時間・配線の電圧降下までを見積もる計算をまとめている。 */
export const SOLAR_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Daily energy demand of a load list", ja: "使用機器から求める1日の消費電力量", es: "Consumo diario de energía de una lista de aparatos", "pt-BR": "Consumo diário de energia de uma lista de aparelhos", de: "Tagesenergiebedarf einer Geräteliste", fr: "Consommation journalière d'énergie d'une liste d'appareils" },
    description: { en: "Compute the daily energy demand of three loads from each one's power and running time, then the monthly total and the average continuous power.", ja: "3つの機器の消費電力と使用時間から、1日の消費電力量・1か月の合計・平均消費電力を求めます。", es: "Calcula el consumo diario de energía de tres aparatos a partir de la potencia y el tiempo de uso de cada uno, y después el total mensual y la potencia media continua.", "pt-BR": "Calcule o consumo diário de energia de três aparelhos a partir da potência e do tempo de uso de cada um, e depois o total mensal e a potência média contínua.", de: "Berechnet den Tagesenergiebedarf von drei Verbrauchern aus Leistung und Betriebsdauer jedes Geräts sowie anschließend die Monatssumme und die mittlere Dauerleistung.", fr: "Calculer la consommation journalière d'énergie de trois appareils à partir de la puissance et de la durée de fonctionnement de chacun, puis le total mensuel et la puissance moyenne continue." },
    localConstants: [
      { symbol: "P₁", expression: "40W" },
      { symbol: "t₁", expression: "5h" },
      { symbol: "P₂", expression: "60W" },
      { symbol: "t₂", expression: "24h" },
      { symbol: "P₃", expression: "65W" },
      { symbol: "t₃", expression: "6h" },
    ],
    steps: [
      { title: { en: "Daily energy", ja: "1日の消費電力量", es: "Energía diaria", "pt-BR": "Energia diária", de: "Tagesenergie", fr: "Énergie journalière" }, expression: "P₁*t₁+P₂*t₂+P₃*t₃", targetUnit: "Wh", formulaLatex: "E_{day} = P_1 t_1 + P_2 t_2 + P_3 t_3" },
      { title: { en: "Monthly energy (30 days)", ja: "1か月（30日）の消費電力量", es: "Energía mensual (30 días)", "pt-BR": "Energia mensal (30 dias)", de: "Monatsenergie (30 Tage)", fr: "Énergie mensuelle (30 jours)" }, expression: "(P₁*t₁+P₂*t₂+P₃*t₃)*30", targetUnit: "kWh", formulaLatex: "E_{month} = 30 (P_1 t_1 + P_2 t_2 + P_3 t_3)" },
      { title: { en: "Average continuous power", ja: "平均消費電力", es: "Potencia media continua", "pt-BR": "Potência média contínua", de: "Mittlere Dauerleistung", fr: "Puissance moyenne continue" }, expression: "(P₁*t₁+P₂*t₂+P₃*t₃)/1d", targetUnit: "W", formulaLatex: "P_{avg} = \\dfrac{P_1 t_1 + P_2 t_2 + P_3 t_3}{1\\,\\mathrm{d}}" },
    ],
  },
  {
    title: { en: "PV array size from daily energy", ja: "1日の消費電力量から求める太陽光パネルの容量", es: "Tamaño del campo fotovoltaico según el consumo diario", "pt-BR": "Tamanho do arranjo fotovoltaico a partir do consumo diário", de: "Größe des Solargenerators aus dem Tagesenergiebedarf", fr: "Taille du champ photovoltaïque d'après la consommation journalière" },
    description: { en: "Compute the photovoltaic array power needed from the daily energy demand, the peak sun hours of the site, and a system efficiency covering wiring, controller and inverter losses.", ja: "1日の消費電力量・設置場所のピーク日照時間・配線やコントローラの損失を見込んだシステム効率から、必要な太陽光パネルの容量を求めます。", es: "Calcula la potencia necesaria del campo fotovoltaico a partir del consumo diario de energía, las horas solares pico (HSP) del emplazamiento y un rendimiento del sistema que incluye las pérdidas del cableado, el controlador y el inversor.", "pt-BR": "Calcule a potência necessária do arranjo fotovoltaico a partir do consumo diário de energia, das horas de sol pleno (HSP) do local e de um rendimento do sistema que cobre as perdas na fiação, no controlador e no inversor.", de: "Berechnet die benötigte Leistung des Solargenerators aus dem Tagesenergiebedarf, den Peak-Sonnenstunden (volle Sonnenstunden) des Standorts und einem Systemwirkungsgrad, der die Verluste in Verkabelung, Laderegler und Wechselrichter abdeckt.", fr: "Calculer la puissance nécessaire du champ photovoltaïque à partir de la consommation journalière d'énergie, des heures de plein soleil (heures d'ensoleillement équivalent) du site et d'un rendement du système couvrant les pertes du câblage, du régulateur et de l'onduleur." },
    localConstants: [
      { symbol: "E", expression: "2000Wh" },
      { symbol: "PSH", expression: "4.2h" },
      { symbol: "η", expression: "0.75" },
      { symbol: "Pₚ", expression: "400W" },
    ],
    steps: [
      { title: { en: "Array power needed", ja: "必要なパネル容量", es: "Potencia necesaria del campo fotovoltaico", "pt-BR": "Potência necessária do arranjo", de: "Benötigte Leistung des Solargenerators", fr: "Puissance nécessaire du champ" }, expression: "E/(PSH*η)", targetUnit: "W", formulaLatex: "P_{array} = \\dfrac{E}{PSH \\cdot \\eta}" },
      { title: { en: "Number of panels", ja: "必要なパネル枚数", es: "Número de paneles", "pt-BR": "Número de painéis", de: "Anzahl der Module", fr: "Nombre de panneaux" }, expression: "E/(PSH*η*Pₚ)", targetUnit: "", formulaLatex: "n = \\dfrac{E}{PSH \\cdot \\eta \\cdot P_p}" },
    ],
  },
  {
    title: { en: "Battery bank capacity for days of autonomy", ja: "自立日数から求める蓄電池の容量", es: "Capacidad del banco de baterías para los días de autonomía", "pt-BR": "Capacidade do banco de baterias para os dias de autonomia", de: "Kapazität der Batteriebank für die Autonomietage", fr: "Capacité du parc de batteries pour les jours d'autonomie" },
    description: { en: "Compute the battery bank capacity needed from the daily energy demand, how many days you want to run without sun, the depth of discharge you allow, and the discharge efficiency.", ja: "1日の消費電力量・日照が無くても動かしたい日数・許容する放電深度・放電効率から、必要な蓄電池の容量を求めます。", es: "Calcula la capacidad necesaria del banco de baterías a partir del consumo diario de energía, los días que quieres funcionar sin sol, la profundidad de descarga (DoD) que admites y el rendimiento de descarga.", "pt-BR": "Calcule a capacidade necessária do banco de baterias a partir do consumo diário de energia, de quantos dias você quer funcionar sem sol, da profundidade de descarga (DoD) admitida e do rendimento de descarga.", de: "Berechnet die benötigte Kapazität der Batteriebank aus dem Tagesenergiebedarf, der Anzahl der Tage, die ohne Sonne überbrückt werden sollen, der zugelassenen Entladetiefe (DoD) und dem Entladewirkungsgrad.", fr: "Calculer la capacité nécessaire du parc de batteries à partir de la consommation journalière d'énergie, du nombre de jours à tenir sans soleil, de la profondeur de décharge (DoD) admise et du rendement de décharge." },
    localConstants: [
      { symbol: "E", expression: "2000Wh" },
      { symbol: "D", expression: "2" },
      { symbol: "DoD", expression: "0.5" },
      { symbol: "η", expression: "0.9" },
      { symbol: "V", expression: "24V" },
    ],
    steps: [
      { title: { en: "Energy to draw from the bank", ja: "蓄電池から取り出す電力量", es: "Energía que hay que extraer del banco", "pt-BR": "Energia a retirar do banco", de: "Aus der Batteriebank zu entnehmende Energie", fr: "Énergie à prélever sur le parc" }, expression: "E*D/η", targetUnit: "kWh", formulaLatex: "E_{store} = \\dfrac{E D}{\\eta}" },
      { title: { en: "Nominal bank energy", ja: "蓄電池の公称容量（電力量）", es: "Energía nominal del banco", "pt-BR": "Energia nominal do banco", de: "Nennenergie der Batteriebank", fr: "Énergie nominale du parc" }, expression: "E*D/(η*DoD)", targetUnit: "kWh", formulaLatex: "E_{bank} = \\dfrac{E D}{\\eta \\cdot DoD}" },
      { title: { en: "Bank capacity in A·h", ja: "蓄電池の容量（A·h）", es: "Capacidad del banco en A·h", "pt-BR": "Capacidade do banco em A·h", de: "Kapazität der Batteriebank in A·h", fr: "Capacité du parc en A·h" }, expression: "E*D/(η*DoD*V)", targetUnit: "A*h", formulaLatex: "C_{bank} = \\dfrac{E D}{\\eta \\cdot DoD \\cdot V}" },
    ],
  },
  {
    title: { en: "Battery charge time from panel power", ja: "パネル出力から求める蓄電池の充電時間", es: "Tiempo de carga de la batería según la potencia del panel", "pt-BR": "Tempo de carga da bateria a partir da potência do painel", de: "Ladezeit der Batterie aus der Modulleistung", fr: "Temps de charge de la batterie d'après la puissance du panneau" },
    description: { en: "Compute how long a panel takes to fill a battery from the panel power, the battery capacity and voltage, and a charging efficiency.", ja: "パネルの出力・蓄電池の容量と電圧・充電効率から、蓄電池を満充電にするまでの時間を求めます。", es: "Calcula cuánto tarda un panel en cargar por completo una batería a partir de la potencia del panel, la capacidad y el voltaje de la batería, y un rendimiento de carga.", "pt-BR": "Calcule quanto tempo um painel leva para carregar totalmente uma bateria a partir da potência do painel, da capacidade e da tensão da bateria, e de um rendimento de carga.", de: "Berechnet, wie lange ein Modul braucht, um eine Batterie vollzuladen, aus der Modulleistung, der Batteriekapazität, der Batteriespannung und einem Ladewirkungsgrad.", fr: "Calculer le temps que met un panneau à charger complètement une batterie à partir de la puissance du panneau, de la capacité et de la tension de la batterie, et d'un rendement de charge." },
    localConstants: [
      { symbol: "P", expression: "200W" },
      { symbol: "η", expression: "0.8" },
      { symbol: "Q", expression: "100A*h" },
      { symbol: "V", expression: "12V" },
    ],
    steps: [
      { title: { en: "Energy the battery holds", ja: "蓄電池が蓄えられる電力量", es: "Energía que almacena la batería", "pt-BR": "Energia que a bateria armazena", de: "In der Batterie gespeicherte Energie", fr: "Énergie stockée par la batterie" }, expression: "Q*V", targetUnit: "Wh", formulaLatex: "E = QV" },
      { title: { en: "Charging current", ja: "充電電流", es: "Corriente de carga", "pt-BR": "Corrente de carga", de: "Ladestrom", fr: "Courant de charge" }, expression: "P*η/V", targetUnit: "A", formulaLatex: "I = \\dfrac{\\eta P}{V}" },
      { title: { en: "Charge time", ja: "充電時間", es: "Tiempo de carga", "pt-BR": "Tempo de carga", de: "Ladezeit", fr: "Temps de charge" }, expression: "Q*V/(P*η)", targetUnit: "h", formulaLatex: "t = \\dfrac{QV}{\\eta P}" },
    ],
  },
  {
    title: { en: "Voltage drop in a DC cable run", ja: "直流配線の電圧降下", es: "Caída de voltaje en un tramo de cable de corriente continua", "pt-BR": "Queda de tensão em um trecho de cabo de corrente contínua", de: "Spannungsabfall in einer Gleichstromleitung", fr: "Chute de tension dans une ligne en courant continu" },
    description: { en: "Compute the round-trip resistance of a DC cable run from the resistivity, one-way length and conductor cross-section, then the voltage it drops at a given current and what fraction of the system voltage that is.", ja: "導体の抵抗率・片道の配線長・導体断面積から往復の配線抵抗を求め、流れる電流による電圧降下と、それがシステム電圧の何%にあたるかを計算します。", es: "Calcula la resistencia de ida y vuelta de un tramo de cable de corriente continua a partir de la resistividad, la longitud de un solo sentido y la sección del conductor, y después la caída de voltaje con una corriente dada y qué parte del voltaje del sistema representa.", "pt-BR": "Calcule a resistência de ida e volta de um trecho de cabo de corrente contínua a partir da resistividade, do comprimento de ida e da seção do condutor, e depois a queda de tensão com uma corrente dada e que parcela da tensão do sistema ela representa.", de: "Berechnet den Widerstand einer Gleichstromleitung für Hin- und Rückleiter aus dem spezifischen Widerstand, der einfachen Länge und dem Leiterquerschnitt, danach den Spannungsabfall bei einem gegebenen Strom und welchen Anteil der Systemspannung er ausmacht.", fr: "Calculer la résistance aller-retour d'une ligne en courant continu à partir de la résistivité, de la longueur aller et de la section du conducteur, puis la chute de tension pour un courant donné et la part de la tension du système qu'elle représente." },
    localConstants: [
      { symbol: "ρ", expression: "1.68e-8Ohm*m" },
      { symbol: "L", expression: "8m" },
      { symbol: "A", expression: "10mm^2" },
      { symbol: "I", expression: "20A" },
      { symbol: "V", expression: "12V" },
    ],
    steps: [
      { title: { en: "Round-trip cable resistance R", ja: "往復の配線抵抗 R", es: "Resistencia de ida y vuelta del cable R", "pt-BR": "Resistência de ida e volta do cabo R", de: "Leitungswiderstand für Hin- und Rückleiter R", fr: "Résistance aller-retour du câble R" }, expression: "2*ρ*L/A", targetUnit: "Ohm", formulaLatex: "R = \\dfrac{2 \\rho L}{A}" },
      { title: { en: "Voltage drop ΔV", ja: "電圧降下 ΔV", es: "Caída de voltaje ΔV", "pt-BR": "Queda de tensão ΔV", de: "Spannungsabfall ΔV", fr: "Chute de tension ΔV" }, expression: "2*ρ*L*I/A", targetUnit: "V", formulaLatex: "\\Delta V = \\dfrac{2 \\rho L I}{A}" },
      { title: { en: "Drop as a fraction of the system voltage", ja: "システム電圧に対する電圧降下の割合", es: "Caída respecto al voltaje del sistema", "pt-BR": "Queda em relação à tensão do sistema", de: "Anteil des Spannungsabfalls an der Systemspannung", fr: "Chute rapportée à la tension du système" }, expression: "2*ρ*L*I/(A*V)", targetUnit: "%", formulaLatex: "\\text{drop} = \\dfrac{2 \\rho L I}{A V}" },
    ],
  },
  {
    title: { en: "Panel output derating for temperature", ja: "温度によるパネル出力の低下", es: "Reducción de la potencia del panel por temperatura", "pt-BR": "Redução da potência do painel pela temperatura", de: "Leistungsminderung des Moduls durch Temperatur", fr: "Baisse de puissance du panneau due à la température" },
    description: { en: "Compute the output of a photovoltaic panel at a hot cell temperature from its rating at 25°C and its temperature coefficient of power.", ja: "25°C基準の定格出力とパネルの出力温度係数から、セル温度が上がったときの実際の出力を求めます。", es: "Calcula la potencia de salida de un panel fotovoltaico con las células calientes a partir de su valor nominal a 25°C y de su coeficiente de temperatura de potencia.", "pt-BR": "Calcule a potência de saída de um painel fotovoltaico com as células quentes a partir de seu valor nominal a 25°C e de seu coeficiente de temperatura de potência.", de: "Berechnet die Leistung eines PV-Moduls bei hoher Zelltemperatur aus dem Nennwert bei 25°C und dem Temperaturkoeffizienten der Leistung.", fr: "Calculer la puissance d'un panneau photovoltaïque à température de cellule élevée à partir de sa valeur nominale à 25°C et de son coefficient de température de puissance." },
    localConstants: [
      { symbol: "P₀", expression: "400W" },
      { symbol: "γ", expression: "-0.35%/K" },
      { symbol: "T", expression: "55°C" },
      { symbol: "T₀", expression: "25°C" },
    ],
    steps: [
      { title: { en: "Temperature rise above 25°C", ja: "25°Cからの温度上昇", es: "Aumento de temperatura por encima de 25°C", "pt-BR": "Aumento de temperatura acima de 25°C", de: "Temperaturerhöhung über 25°C", fr: "Élévation de température au-dessus de 25°C" }, expression: "T-T₀", targetUnit: "K", formulaLatex: "\\Delta T = T - T_0" },
      { title: { en: "Output at the hot cell temperature", ja: "高温時の出力", es: "Potencia a la temperatura de célula caliente", "pt-BR": "Potência na temperatura de célula quente", de: "Leistung bei hoher Zelltemperatur", fr: "Puissance à la température de cellule élevée" }, expression: "P₀*(1+γ*(T-T₀))", targetUnit: "W", formulaLatex: "P = P_0 \\left(1 + \\gamma (T - T_0)\\right)" },
      { title: { en: "Output lost to temperature", ja: "温度による出力低下の割合", es: "Pérdida de potencia por temperatura", "pt-BR": "Perda de potência pela temperatura", de: "Leistungsverlust durch Temperatur", fr: "Perte de puissance due à la température" }, expression: "γ*(T₀-T)", targetUnit: "%", formulaLatex: "\\text{loss} = \\gamma (T_0 - T)" },
    ],
  },
];
