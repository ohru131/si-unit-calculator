import type { NotebookSeed } from "../types";

/** 「電気の基礎計算」。オームの法則・電気代・ブレーカー容量など、生活に身近な電気の計算をまとめている。 */
export const ELECTRICITY_BASICS_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Practical Ohm's law (LED resistor sizing)", ja: "実用オームの法則（LED回路の抵抗値）", es: "Ley de Ohm práctica (cálculo de resistencia para LED)", "pt-BR": "Lei de Ohm prática (cálculo de resistor para LED)", de: "Praktisches ohmsches Gesetz (Widerstandsberechnung für LED)", fr: "Loi d'Ohm pratique (calcul de la résistance pour LED)" },
    description: { en: "Compute the resistor value needed for an LED circuit from the supply voltage, LED forward voltage, and desired current.", ja: "電源電圧・LEDの順方向電圧・希望電流から、必要な抵抗値を求めます。", es: "Calcula el valor de la resistencia necesaria para un circuito LED a partir del voltaje de alimentación, el voltaje directo del LED y la corriente deseada.", "pt-BR": "Calcule o valor do resistor necessário para um circuito de LED a partir da tensão de alimentação, da tensão direta do LED e da corrente desejada.", de: "Berechnet den benötigten Widerstandswert für eine LED-Schaltung aus der Versorgungsspannung, der Durchlassspannung der LED und dem gewünschten Strom.", fr: "Calculer la valeur de la résistance nécessaire pour un circuit LED à partir de la tension d'alimentation, de la tension directe de la LED et du courant souhaité." },
    localConstants: [
      { symbol: "Vₛ", expression: "5V" },
      { symbol: "Vf", expression: "2V" },
      { symbol: "I", expression: "15mA" },
    ],
    steps: [{ title: { en: "Required resistance R", ja: "必要な抵抗値 R", es: "Resistencia necesaria R", "pt-BR": "Resistência necessária R", de: "Erforderlicher Widerstand R", fr: "Résistance nécessaire R" }, expression: "(Vₛ-Vf)/I", targetUnit: "Ohm", formulaLatex: "R = \\dfrac{V_s - V_f}{I}" }],
  },
  {
    title: { en: "Energy consumption and electricity cost", ja: "消費電力量と電気代", es: "Consumo de energía y costo de electricidad", "pt-BR": "Consumo de energia e custo de eletricidade", de: "Energieverbrauch und Stromkosten", fr: "Consommation d'énergie et coût de l'électricité" },
    description: { en: "Compute the energy consumed and its cost from the power rating, usage time, and price per kWh.", ja: "消費電力・使用時間・電力量単価から、使用した電力量と電気代を求めます。", es: "Calcula la energía consumida y su costo a partir de la potencia, el tiempo de uso y el precio por kWh.", "pt-BR": "Calcule a energia consumida e seu custo a partir da potência, do tempo de uso e do preço por kWh.", de: "Berechnet den verbrauchten Energiebetrag und dessen Kosten aus der Leistung, der Nutzungsdauer und dem Preis pro kWh.", fr: "Calculer l'énergie consommée et son coût à partir de la puissance, de la durée d'utilisation et du prix par kWh." },
    localConstants: [
      { symbol: "P", expression: "1200W" },
      { symbol: "t", expression: "3h" },
      { symbol: "rate", expression: "31" },
    ],
    steps: [
      { title: { en: "Energy used E", ja: "使用電力量 E", es: "Energía usada E", "pt-BR": "Energia usada E", de: "Verbrauchte Energie E", fr: "Énergie utilisée E" }, expression: "P*t", targetUnit: "kWh", formulaLatex: "E = Pt" },
      { title: { en: "Cost", ja: "電気代", es: "Costo", "pt-BR": "Custo", de: "Kosten", fr: "Coût" }, expression: "(s1/1kWh)*rate", targetUnit: "", formulaLatex: "\\text{cost} = \\dfrac{E}{1\\text{kWh}} \\times \\text{rate}" },
    ],
  },
  {
    title: { en: "Circuit breaker capacity", ja: "ブレーカー容量", es: "Capacidad del disyuntor", "pt-BR": "Capacidade do disjuntor", de: "Nennstrom des Leitungsschutzschalters", fr: "Calibre du disjoncteur" },
    description: { en: "Compute the maximum usable power from the contracted voltage and the breaker's rated current.", ja: "契約電圧とブレーカーの許容電流から、使用できる最大電力を求めます。", es: "Calcula la potencia máxima utilizable a partir de la tensión contratada y la corriente nominal del disyuntor.", "pt-BR": "Calcule a potência máxima utilizável a partir da tensão contratada e da corrente nominal do disjuntor.", de: "Berechnet die maximal nutzbare Leistung aus der vertraglich vereinbarten Spannung und dem Nennstrom des Leitungsschutzschalters.", fr: "Calculer la puissance maximale utilisable à partir de la tension du contrat et du courant nominal du disjoncteur." },
    localConstants: [
      { symbol: "V", expression: "100V" },
      { symbol: "Iₘₐₓ", expression: "30A" },
    ],
    steps: [{ title: { en: "Maximum power Pmax", ja: "最大電力 Pmax", es: "Potencia máxima Pmax", "pt-BR": "Potência máxima Pmax", de: "Maximale Leistung Pmax", fr: "Puissance maximale Pmax" }, expression: "V*Iₘₐₓ", targetUnit: "W", formulaLatex: "P_{max} = V \\cdot I_{max}" }],
  },
  {
    title: { en: "Series and parallel resistor combination", ja: "抵抗の直列・並列合成", es: "Combinación de resistencias en serie y en paralelo", "pt-BR": "Associação de resistores em série e em paralelo", de: "Reihen- und Parallelschaltung von Widerständen", fr: "Association de résistances en série et en parallèle" },
    description: { en: "Compute the combined resistance of two resistors both in series and in parallel.", ja: "2つの抵抗値から、直列合成抵抗と並列合成抵抗をそれぞれ求めます。", es: "Calcula la resistencia equivalente de dos resistencias tanto en serie como en paralelo.", "pt-BR": "Calcule a resistência equivalente de dois resistores, tanto em série quanto em paralelo.", de: "Berechnet den Ersatzwiderstand zweier Widerstände sowohl in Reihen- als auch in Parallelschaltung.", fr: "Calculer la résistance équivalente de deux résistances, en série et en parallèle." },
    localConstants: [
      { symbol: "R₁", expression: "100Ohm" },
      { symbol: "R₂", expression: "200Ohm" },
    ],
    steps: [
      { title: { en: "Series resistance", ja: "直列合成抵抗", es: "Resistencia en serie", "pt-BR": "Resistência em série", de: "Reihenwiderstand", fr: "Résistance en série" }, expression: "R₁+R₂", targetUnit: "Ohm", formulaLatex: "R_{series} = R_1 + R_2" },
      { title: { en: "Parallel resistance", ja: "並列合成抵抗", es: "Resistencia en paralelo", "pt-BR": "Resistência em paralelo", de: "Parallelwiderstand", fr: "Résistance en parallèle" }, expression: "(1/R₁+1/R₂)^-1", targetUnit: "Ohm", formulaLatex: "R_{parallel} = \\left(\\dfrac{1}{R_1} + \\dfrac{1}{R_2}\\right)^{-1}" },
    ],
  },
  {
    title: { en: "Power with power factor (AC circuit)", ja: "力率つき消費電力（交流回路）", es: "Potencia con factor de potencia (circuito de CA)", "pt-BR": "Potência com fator de potência (circuito CA)", de: "Leistung mit Leistungsfaktor (Wechselstromkreis)", fr: "Puissance avec facteur de puissance (circuit CA)" },
    description: { en: "Compute the real power consumed in an AC circuit from voltage, current, and power factor.", ja: "電圧・電流・力率から、交流回路の実効消費電力を求めます。", es: "Calcula la potencia real consumida en un circuito de CA a partir de la tensión, la corriente y el factor de potencia.", "pt-BR": "Calcule a potência real consumida em um circuito CA a partir da tensão, da corrente e do fator de potência.", de: "Berechnet die im Wechselstromkreis verbrauchte Wirkleistung aus Spannung, Strom und Leistungsfaktor.", fr: "Calculer la puissance réelle consommée dans un circuit CA à partir de la tension, du courant et du facteur de puissance." },
    localConstants: [
      { symbol: "V", expression: "100V" },
      { symbol: "I", expression: "5A" },
      { symbol: "cosφ", expression: "0.8" },
    ],
    steps: [{ title: { en: "Real power P", ja: "実効電力 P", es: "Potencia real P", "pt-BR": "Potência real P", de: "Wirkleistung P", fr: "Puissance réelle P" }, expression: "V*I*cosφ", targetUnit: "W", formulaLatex: "P = VI\\cos\\varphi" }],
  },
];

/** 「天体・宇宙」。第一宇宙速度やケプラーの法則など、スケールの大きさが楽しい天文計算をまとめている。 */
export const ASTRONOMY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "First cosmic velocity", ja: "第一宇宙速度", es: "Primera velocidad cósmica", "pt-BR": "Primeira velocidade cósmica", de: "Erste kosmische Geschwindigkeit", fr: "Première vitesse cosmique" },
    description: { en: "Compute the orbital speed for a circular orbit just above Earth's surface (first cosmic velocity) from Earth's mass and radius. The result should be about 7.9 km/s.", ja: "地球の質量と半径から、地表すれすれを回る円軌道の速さ（第一宇宙速度）を求めます。約7.9km/sになります。", es: "Calcula la velocidad orbital de una órbita circular justo sobre la superficie terrestre (primera velocidad cósmica) a partir de la masa y el radio de la Tierra. El resultado debería ser de aproximadamente 7,9 km/s.", "pt-BR": "Calcule a velocidade orbital de uma órbita circular rente à superfície da Terra (primeira velocidade cósmica) a partir da massa e do raio da Terra. O resultado deve ser de aproximadamente 7,9 km/s.", de: "Berechnet die Bahngeschwindigkeit einer Kreisbahn knapp über der Erdoberfläche (erste kosmische Geschwindigkeit) aus Masse und Radius der Erde. Das Ergebnis sollte etwa 7,9 km/s betragen.", fr: "Calculer la vitesse orbitale d'une orbite circulaire juste au-dessus de la surface terrestre (première vitesse cosmique) à partir de la masse et du rayon de la Terre. Le résultat devrait être d'environ 7,9 km/s." },
    localConstants: [
      { symbol: "G", expression: "6.674e-11N*m^2/kg^2" },
      { symbol: "M", expression: "5.972e24kg" },
      { symbol: "R", expression: "6371km" },
    ],
    steps: [{ title: { en: "First cosmic velocity v", ja: "第一宇宙速度 v", es: "Primera velocidad cósmica v", "pt-BR": "Primeira velocidade cósmica v", de: "Erste kosmische Geschwindigkeit v", fr: "Première vitesse cosmique v" }, expression: "sqrt(G*M/R)", targetUnit: "km/s", formulaLatex: "v_1 = \\sqrt{\\dfrac{GM}{R}}" }],
  },
  {
    title: { en: "Second cosmic velocity (escape velocity)", ja: "第二宇宙速度（脱出速度）", es: "Segunda velocidad cósmica (velocidad de escape)", "pt-BR": "Segunda velocidade cósmica (velocidade de escape)", de: "Zweite kosmische Geschwindigkeit (Fluchtgeschwindigkeit)", fr: "Deuxième vitesse cosmique (vitesse de libération)" },
    description: { en: "Compute the escape velocity needed to break free of Earth's gravity (second cosmic velocity) from Earth's mass and radius. The result should be about 11.2 km/s.", ja: "地球の質量と半径から、地球の重力を振り切るために必要な脱出速度（第二宇宙速度）を求めます。約11.2km/sになります。", es: "Calcula la velocidad de escape necesaria para vencer la gravedad terrestre (segunda velocidad cósmica) a partir de la masa y el radio de la Tierra. El resultado debería ser de aproximadamente 11,2 km/s.", "pt-BR": "Calcule a velocidade de escape necessária para vencer a gravidade da Terra (segunda velocidade cósmica) a partir da massa e do raio da Terra. O resultado deve ser de aproximadamente 11,2 km/s.", de: "Berechnet die Fluchtgeschwindigkeit, die nötig ist, um der Erdanziehung zu entkommen (zweite kosmische Geschwindigkeit), aus Masse und Radius der Erde. Das Ergebnis sollte etwa 11,2 km/s betragen.", fr: "Calculer la vitesse de libération nécessaire pour échapper à la gravité terrestre (deuxième vitesse cosmique) à partir de la masse et du rayon de la Terre. Le résultat devrait être d'environ 11,2 km/s." },
    localConstants: [
      { symbol: "G", expression: "6.674e-11N*m^2/kg^2" },
      { symbol: "M", expression: "5.972e24kg" },
      { symbol: "R", expression: "6371km" },
    ],
    steps: [{ title: { en: "Second cosmic velocity v", ja: "第二宇宙速度 v", es: "Segunda velocidad cósmica v", "pt-BR": "Segunda velocidade cósmica v", de: "Zweite kosmische Geschwindigkeit v", fr: "Deuxième vitesse cosmique v" }, expression: "sqrt(2*G*M/R)", targetUnit: "km/s", formulaLatex: "v_2 = \\sqrt{\\dfrac{2GM}{R}}" }],
  },
  {
    title: { en: "Kepler's third law (Earth's orbital period)", ja: "ケプラーの第三法則（地球の公転周期）", es: "Tercera ley de Kepler (periodo orbital de la Tierra)", "pt-BR": "Terceira lei de Kepler (período orbital da Terra)", de: "Drittes Kepler-Gesetz (Umlaufzeit der Erde)", fr: "Troisième loi de Kepler (période orbitale de la Terre)" },
    description: { en: "Compute Earth's orbital period from the Sun's mass and Earth's orbital radius (1 astronomical unit). The result should be about 1 year.", ja: "太陽の質量と地球の公転半径（1天文単位）から、地球の公転周期を求めます。約1年になります。", es: "Calcula el periodo orbital de la Tierra a partir de la masa del Sol y el radio orbital de la Tierra (1 unidad astronómica). El resultado debería ser de aproximadamente 1 año.", "pt-BR": "Calcule o período orbital da Terra a partir da massa do Sol e do raio orbital da Terra (1 unidade astronômica). O resultado deve ser de aproximadamente 1 ano.", de: "Berechnet die Umlaufzeit der Erde aus der Masse der Sonne und dem Bahnradius der Erde (1 astronomische Einheit). Das Ergebnis sollte etwa 1 Jahr betragen.", fr: "Calculer la période orbitale de la Terre à partir de la masse du Soleil et du rayon orbital de la Terre (1 unité astronomique). Le résultat devrait être d'environ 1 an." },
    localConstants: [
      { symbol: "G", expression: "6.674e-11N*m^2/kg^2" },
      { symbol: "Mₛᵤₙ", expression: "1.989e30kg" },
      { symbol: "a", expression: "1au" },
    ],
    steps: [{ title: { en: "Orbital period T", ja: "公転周期 T", es: "Periodo orbital T", "pt-BR": "Período orbital T", de: "Umlaufzeit T", fr: "Période orbitale T" }, expression: "sqrt(4*pi^2*a^3/(G*Mₛᵤₙ))", targetUnit: "yr", formulaLatex: "T = \\sqrt{\\dfrac{4\\pi^2 a^3}{GM_{sun}}}" }],
  },
  {
    title: { en: "Gravitational force (Earth's pull on a person)", ja: "万有引力（体重にはたらく地球の引力）", es: "Fuerza gravitacional (atracción de la Tierra sobre una persona)", "pt-BR": "Força gravitacional (atração da Terra sobre uma pessoa)", de: "Gravitationskraft (Erdanziehung auf eine Person)", fr: "Force gravitationnelle (attraction de la Terre sur une personne)" },
    description: { en: "Compute the gravitational force Earth exerts on a person at its surface using Newton's law of gravitation. The result should closely match mg.", ja: "万有引力の法則から、地表にいる人にはたらく地球の重力を求めます。mgとほぼ一致することを確認できます。", es: "Calcula la fuerza gravitacional que la Tierra ejerce sobre una persona en su superficie mediante la ley de gravitación de Newton. El resultado debería coincidir estrechamente con mg.", "pt-BR": "Calcule a força gravitacional que a Terra exerce sobre uma pessoa em sua superfície usando a lei da gravitação de Newton. O resultado deve coincidir de perto com mg.", de: "Berechnet die Gravitationskraft, die die Erde auf eine Person an ihrer Oberfläche ausübt, mithilfe des newtonschen Gravitationsgesetzes. Das Ergebnis sollte nahezu mit mg übereinstimmen.", fr: "Calculer la force gravitationnelle exercée par la Terre sur une personne à sa surface à l'aide de la loi de la gravitation de Newton. Le résultat devrait correspondre de très près à mg." },
    localConstants: [
      { symbol: "G", expression: "6.674e-11N*m^2/kg^2" },
      { symbol: "M", expression: "5.972e24kg" },
      { symbol: "m", expression: "70kg" },
      { symbol: "r", expression: "6371km" },
    ],
    steps: [{ title: { en: "Gravitational force F", ja: "引力 F", es: "Fuerza gravitacional F", "pt-BR": "Força gravitacional F", de: "Gravitationskraft F", fr: "Force gravitationnelle F" }, expression: "G*M*m/r^2", targetUnit: "N", formulaLatex: "F = \\dfrac{GMm}{r^2}" }],
  },
  {
    title: { en: "Light travel time from the nearest star", ja: "隣の恒星からの光が届く時間", es: "Tiempo que tarda la luz de la estrella más cercana", "pt-BR": "Tempo que a luz da estrela mais próxima leva para chegar", de: "Lichtlaufzeit vom nächsten Stern", fr: "Temps de parcours de la lumière depuis l'étoile la plus proche" },
    description: { en: "Compute how long light takes to reach us from the nearest star (Proxima Centauri). By definition of the light-year, the result should be about 4.24 years.", ja: "最も近い恒星（プロキシマ・ケンタウリ）までの距離から、光が届くまでの時間を求めます。光年の定義どおり約4.24年になります。", es: "Calcula cuánto tarda la luz en llegar desde la estrella más cercana (Próxima Centauri). Según la definición del año luz, el resultado debería ser de aproximadamente 4,24 años.", "pt-BR": "Calcule quanto tempo a luz leva para chegar a partir da estrela mais próxima (Próxima Centauri). Pela definição de ano-luz, o resultado deve ser de aproximadamente 4,24 anos.", de: "Berechnet, wie lange das Licht vom nächsten Stern (Proxima Centauri) bis zu uns braucht. Gemäß der Definition des Lichtjahrs sollte das Ergebnis etwa 4,24 Jahre betragen.", fr: "Calculer le temps que met la lumière à nous parvenir depuis l'étoile la plus proche (Proxima du Centaure). Par définition de l'année-lumière, le résultat devrait être d'environ 4,24 ans." },
    localConstants: [
      { symbol: "d", expression: "4.24ly" },
      { symbol: "c", expression: "299792458m/s" },
    ],
    steps: [{ title: { en: "Travel time t", ja: "到達時間 t", es: "Tiempo de viaje t", "pt-BR": "Tempo de viagem t", de: "Laufzeit t", fr: "Temps de trajet t" }, expression: "d/c", targetUnit: "yr", formulaLatex: "t = \\dfrac{d}{c}" }],
  },
  {
    title: { en: "Light travel time to the Moon", ja: "月までの光の到達時間", es: "Tiempo que tarda la luz en llegar a la Luna", "pt-BR": "Tempo que a luz leva para chegar à Lua", de: "Lichtlaufzeit zum Mond", fr: "Temps de parcours de la lumière jusqu'à la Lune" },
    description: { en: "Compute how long light takes to travel from Earth to the Moon. The result should be about 1.28 seconds.", ja: "地球から月までの距離から、光が届くまでの時間を求めます。約1.28秒になります。", es: "Calcula cuánto tarda la luz en viajar de la Tierra a la Luna. El resultado debería ser de aproximadamente 1,28 segundos.", "pt-BR": "Calcule quanto tempo a luz leva para viajar da Terra até a Lua. O resultado deve ser de aproximadamente 1,28 segundos.", de: "Berechnet, wie lange das Licht von der Erde zum Mond braucht. Das Ergebnis sollte etwa 1,28 Sekunden betragen.", fr: "Calculer le temps que met la lumière pour aller de la Terre à la Lune. Le résultat devrait être d'environ 1,28 seconde." },
    localConstants: [
      { symbol: "d", expression: "384400km" },
      { symbol: "c", expression: "299792458m/s" },
    ],
    steps: [{ title: { en: "Travel time t", ja: "到達時間 t", es: "Tiempo de viaje t", "pt-BR": "Tempo de viagem t", de: "Laufzeit t", fr: "Temps de trajet t" }, expression: "d/c", targetUnit: "s", formulaLatex: "t = \\dfrac{d}{c}" }],
  },
];

/** 「フィットネス・ランニング」。ペース・消費カロリー・心拍数ゾーンなど、トレーニングに使える計算をまとめている。 */
export const FITNESS_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Running pace", ja: "ランニングペース", es: "Ritmo de carrera", "pt-BR": "Ritmo de corrida", de: "Lauftempo", fr: "Allure de course" },
    description: { en: "Compute the pace per kilometer from the running time and distance.", ja: "走った時間と距離から、1kmあたりのペースを求めます。", es: "Calcula el ritmo por kilómetro a partir del tiempo y la distancia recorridos.", "pt-BR": "Calcule o ritmo por quilômetro a partir do tempo e da distância percorridos na corrida.", de: "Berechnet das Tempo pro Kilometer aus Laufzeit und Distanz.", fr: "Calculer l'allure par kilomètre à partir du temps de course et de la distance." },
    localConstants: [
      { symbol: "t", expression: "30min" },
      { symbol: "d", expression: "5km" },
    ],
    steps: [{ title: { en: "Pace", ja: "ペース", es: "Ritmo", "pt-BR": "Ritmo", de: "Tempo", fr: "Allure" }, expression: "t/d", targetUnit: "min/km", formulaLatex: "\\text{pace} = \\dfrac{t}{d}" }],
  },
  {
    title: { en: "Calories burned (METs method)", ja: "消費カロリー（METs法）", es: "Calorías quemadas (método METs)", "pt-BR": "Calorias queimadas (método METs)", de: "Verbrannte Kalorien (MET-Methode)", fr: "Calories brûlées (méthode des METs)" },
    description: { en: "Compute calories burned from exercise intensity (METs), body weight, and duration.", ja: "運動強度（METs）・体重・運動時間から、消費カロリーを求めます。", es: "Calcula las calorías quemadas a partir de la intensidad del ejercicio (METs), el peso corporal y la duración.", "pt-BR": "Calcule as calorias queimadas a partir da intensidade do exercício (METs), do peso corporal e da duração.", de: "Berechnet die verbrannten Kalorien aus Trainingsintensität (METs), Körpergewicht und Dauer.", fr: "Calculer les calories brûlées à partir de l'intensité de l'exercice (METs), du poids corporel et de la durée." },
    localConstants: [
      { symbol: "METs", expression: "8" },
      { symbol: "weight", expression: "65kg" },
      { symbol: "time", expression: "0.5h" },
      { symbol: "factor", expression: "1.05kcal/kg/h" },
    ],
    steps: [{ title: { en: "Calories burned", ja: "消費カロリー", es: "Calorías quemadas", "pt-BR": "Calorias queimadas", de: "Verbrannte Kalorien", fr: "Calories brûlées" }, expression: "METs*weight*time*factor", targetUnit: "kcal", formulaLatex: "\\text{kcal} = \\text{METs} \\times \\text{weight} \\times \\text{time} \\times 1.05" }],
  },
  {
    title: { en: "Heart rate zone (Karvonen method)", ja: "心拍数ゾーン（カルボーネン法）", es: "Zona de frecuencia cardíaca (método de Karvonen)", "pt-BR": "Zona de frequência cardíaca (método de Karvonen)", de: "Herzfrequenzzone (Karvonen-Methode)", fr: "Zone de fréquence cardiaque (méthode de Karvonen)" },
    description: { en: "Compute the target heart rate from age, resting heart rate, and desired exercise intensity.", ja: "年齢・安静時心拍数・運動強度から、目標心拍数を求めます。", es: "Calcula la frecuencia cardíaca objetivo a partir de la edad, la frecuencia cardíaca en reposo y la intensidad de ejercicio deseada.", "pt-BR": "Calcule a frequência cardíaca alvo a partir da idade, da frequência cardíaca em repouso e da intensidade de exercício desejada.", de: "Berechnet die Ziel-Herzfrequenz aus Alter, Ruheherzfrequenz und gewünschter Trainingsintensität.", fr: "Calculer la fréquence cardiaque cible à partir de l'âge, de la fréquence cardiaque au repos et de l'intensité d'exercice souhaitée." },
    localConstants: [
      { symbol: "age", expression: "30" },
      { symbol: "HRᵣₑₛₜ", expression: "60bpm" },
      { symbol: "intensity", expression: "0.7" },
    ],
    steps: [
      { title: { en: "Max heart rate HRmax", ja: "最大心拍数 HRmax", es: "Frecuencia cardíaca máxima HRmax", "pt-BR": "Frequência cardíaca máxima HRmax", de: "Maximale Herzfrequenz HRmax", fr: "Fréquence cardiaque maximale HRmax" }, expression: "(220-age)*1bpm", targetUnit: "bpm", formulaLatex: "HR_{max} = 220 - \\text{age}" },
      { title: { en: "Target heart rate", ja: "目標心拍数", es: "Frecuencia cardíaca objetivo", "pt-BR": "Frequência cardíaca alvo", de: "Ziel-Herzfrequenz", fr: "Fréquence cardiaque cible" }, expression: "(s1-HRᵣₑₛₜ)*intensity+HRᵣₑₛₜ", targetUnit: "bpm", formulaLatex: "HR_{target} = (HR_{max} - HR_{rest}) \\times \\text{intensity} + HR_{rest}" },
    ],
  },
  {
    title: { en: "BMI (body mass index)", ja: "BMI（体格指数）", es: "IMC (índice de masa corporal)", "pt-BR": "IMC (índice de massa corporal)", de: "BMI (Body-Mass-Index)", fr: "IMC (indice de masse corporelle)" },
    description: { en: "Compute the body mass index from body weight and height.", ja: "体重と身長から、BMIを求めます。", es: "Calcula el índice de masa corporal a partir del peso corporal y la estatura.", "pt-BR": "Calcule o índice de massa corporal a partir do peso corporal e da altura.", de: "Berechnet den Body-Mass-Index aus Körpergewicht und Körpergröße.", fr: "Calculer l'indice de masse corporelle à partir du poids corporel et de la taille." },
    localConstants: [
      { symbol: "weight", expression: "65kg" },
      { symbol: "height", expression: "1.7m" },
    ],
    steps: [{ title: { en: "BMI", ja: "BMI", es: "IMC", "pt-BR": "IMC", de: "BMI", fr: "IMC" }, expression: "weight/height^2", targetUnit: "kg/m^2", formulaLatex: "BMI = \\dfrac{\\text{weight}}{\\text{height}^2}" }],
  },
  {
    title: { en: "Estimated 1RM (Epley formula)", ja: "1RM推定（エプリー式）", es: "1RM estimado (fórmula de Epley)", "pt-BR": "1RM estimado (fórmula de Epley)", de: "Geschätztes 1RM (Epley-Formel)", fr: "1RM estimé (formule d'Epley)" },
    description: { en: "Estimate the one-repetition maximum (1RM) from the weight lifted and the number of repetitions performed.", ja: "扱った重量とその回数から、1回だけ挙げられる最大重量（1RM）を推定します。", es: "Estima el máximo de una repetición (1RM) a partir del peso levantado y el número de repeticiones realizadas.", "pt-BR": "Estime a carga máxima de uma repetição (1RM) a partir do peso levantado e do número de repetições realizadas.", de: "Schätzt das Einwiederholungsmaximum (1RM) aus dem gehobenen Gewicht und der Anzahl der ausgeführten Wiederholungen.", fr: "Estimer la charge maximale sur une répétition (1RM) à partir du poids soulevé et du nombre de répétitions effectuées." },
    localConstants: [
      { symbol: "weight", expression: "60kg" },
      { symbol: "reps", expression: "8" },
    ],
    steps: [{ title: { en: "Estimated 1RM", ja: "推定1RM", es: "1RM estimado", "pt-BR": "1RM estimado", de: "Geschätztes 1RM", fr: "1RM estimé" }, expression: "weight*(1+reps/30)", targetUnit: "kg", formulaLatex: "1RM = \\text{weight} \\times \\left(1 + \\dfrac{\\text{reps}}{30}\\right)" }],
  },
];

/** 「化学の量的関係」。モル質量・モル濃度・気体の状態方程式など、化学計算の基本をまとめている。 */
export const CHEMISTRY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Amount of substance from molar mass", ja: "モル質量からの物質量", es: "Cantidad de sustancia a partir de la masa molar", "pt-BR": "Quantidade de matéria a partir da massa molar", de: "Stoffmenge aus der molaren Masse", fr: "Quantité de matière à partir de la masse molaire" },
    description: { en: "Compute the amount of substance (in moles) from mass and molar mass.", ja: "質量とモル質量から、物質量（mol）を求めます。", es: "Calcula la cantidad de sustancia (en moles) a partir de la masa y la masa molar.", "pt-BR": "Calcule a quantidade de matéria (em mols) a partir da massa e da massa molar.", de: "Berechnet die Stoffmenge (in Mol) aus Masse und molarer Masse.", fr: "Calculer la quantité de matière (en moles) à partir de la masse et de la masse molaire." },
    localConstants: [
      { symbol: "m", expression: "36g" },
      { symbol: "M", expression: "18g/mol" },
    ],
    steps: [{ title: { en: "Amount of substance n", ja: "物質量 n", es: "Cantidad de sustancia n", "pt-BR": "Quantidade de matéria n", de: "Stoffmenge n", fr: "Quantité de matière n" }, expression: "m/M", targetUnit: "mol", formulaLatex: "n = \\dfrac{m}{M}" }],
  },
  {
    title: { en: "Molar concentration", ja: "モル濃度", es: "Concentración molar", "pt-BR": "Concentração molar", de: "Stoffmengenkonzentration", fr: "Concentration molaire" },
    description: { en: "Compute the molar concentration from the amount of solute and the volume of solution.", ja: "溶質の物質量と溶液の体積から、モル濃度を求めます。", es: "Calcula la concentración molar a partir de la cantidad de soluto y el volumen de la disolución.", "pt-BR": "Calcule a concentração molar a partir da quantidade de soluto e do volume da solução.", de: "Berechnet die Stoffmengenkonzentration aus der Stoffmenge des gelösten Stoffs und dem Volumen der Lösung.", fr: "Calculer la concentration molaire à partir de la quantité de soluté et du volume de la solution." },
    localConstants: [
      { symbol: "n", expression: "0.5mol" },
      { symbol: "V", expression: "2L" },
    ],
    steps: [{ title: { en: "Molar concentration c", ja: "モル濃度 c", es: "Concentración molar c", "pt-BR": "Concentração molar c", de: "Stoffmengenkonzentration c", fr: "Concentration molaire c" }, expression: "n/V", targetUnit: "mol/L", formulaLatex: "c = \\dfrac{n}{V}" }],
  },
  {
    title: { en: "Ideal gas law (molar volume at STP)", ja: "気体の状態方程式（標準状態のモル体積）", es: "Ecuación de estado del gas ideal (volumen molar en condiciones normales)", "pt-BR": "Equação de estado dos gases ideais (volume molar nas CNTP)", de: "Ideale Gasgleichung (molares Volumen bei Normbedingungen)", fr: "Loi des gaz parfaits (volume molaire dans les CNTP)" },
    description: { en: "Compute the volume of a gas from the amount of substance, temperature, and pressure. At STP (0°C, 1 atm) the result should be about 22.4 L.", ja: "物質量・温度・圧力から気体の体積を求めます。標準状態（0℃・1atm）では約22.4Lになります。", es: "Calcula el volumen de un gas a partir de la cantidad de sustancia, la temperatura y la presión. En condiciones normales (0 °C, 1 atm) el resultado debería ser de aproximadamente 22,4 L.", "pt-BR": "Calcule o volume de um gás a partir da quantidade de matéria, da temperatura e da pressão. Nas CNTP (0 °C, 1 atm) o resultado deve ser de aproximadamente 22,4 L.", de: "Berechnet das Volumen eines Gases aus Stoffmenge, Temperatur und Druck. Bei Normbedingungen (0 °C, 1 atm) sollte das Ergebnis etwa 22,4 L betragen.", fr: "Calculer le volume d'un gaz à partir de la quantité de matière, de la température et de la pression. Dans les conditions normales (0 °C, 1 atm), le résultat devrait être d'environ 22,4 L." },
    localConstants: [
      { symbol: "n", expression: "1mol" },
      { symbol: "R", expression: "8.314J/mol/K" },
      { symbol: "T", expression: "273.15K" },
      { symbol: "P", expression: "101325Pa" },
    ],
    steps: [{ title: { en: "Volume V", ja: "体積 V", es: "Volumen V", "pt-BR": "Volume V", de: "Volumen V", fr: "Volume V" }, expression: "n*R*T/P", targetUnit: "L", formulaLatex: "V = \\dfrac{nRT}{P}" }],
  },
  {
    title: { en: "Heat of reaction", ja: "反応熱", es: "Calor de reacción", "pt-BR": "Calor de reação", de: "Reaktionswärme", fr: "Chaleur de réaction" },
    description: { en: "Compute the heat released from the amount of substance reacted and the molar heat of reaction.", ja: "反応した物質量とモルあたりの反応熱から、発生する熱量を求めます。", es: "Calcula el calor liberado a partir de la cantidad de sustancia que reacciona y el calor de reacción molar.", "pt-BR": "Calcule o calor liberado a partir da quantidade de matéria que reage e do calor de reação molar.", de: "Berechnet die freigesetzte Wärme aus der umgesetzten Stoffmenge und der molaren Reaktionswärme.", fr: "Calculer la chaleur libérée à partir de la quantité de matière ayant réagi et de la chaleur de réaction molaire." },
    localConstants: [
      { symbol: "n", expression: "0.2mol" },
      { symbol: "ΔH", expression: "890kJ/mol" },
    ],
    steps: [{ title: { en: "Heat of reaction Q", ja: "反応熱 Q", es: "Calor de reacción Q", "pt-BR": "Calor de reação Q", de: "Reaktionswärme Q", fr: "Chaleur de réaction Q" }, expression: "n*ΔH", targetUnit: "kJ", formulaLatex: "Q = n \\cdot \\Delta H" }],
  },
  {
    title: { en: "Mass percent concentration", ja: "質量パーセント濃度", es: "Porcentaje en masa", "pt-BR": "Concentração em porcentagem de massa", de: "Massenanteil (Massenprozent)", fr: "Pourcentage massique" },
    description: { en: "Compute the mass of solute from the mass of solution and its mass percent concentration.", ja: "溶液の質量と質量パーセント濃度から、溶質の質量を求めます。", es: "Calcula la masa del soluto a partir de la masa de la disolución y su porcentaje en masa.", "pt-BR": "Calcule a massa do soluto a partir da massa da solução e de sua concentração em porcentagem de massa.", de: "Berechnet die Masse des gelösten Stoffs aus der Masse der Lösung und ihrem Massenanteil.", fr: "Calculer la masse du soluté à partir de la masse de la solution et de son pourcentage massique." },
    localConstants: [
      { symbol: "mₛₒₗᵤₜᵢₒₙ", expression: "500g" },
      { symbol: "percent", expression: "10%" },
    ],
    steps: [{ title: { en: "Mass of solute", ja: "溶質の質量", es: "Masa del soluto", "pt-BR": "Massa do soluto", de: "Masse des gelösten Stoffs", fr: "Masse du soluté" }, expression: "mₛₒₗᵤₜᵢₒₙ*percent", targetUnit: "g", formulaLatex: "m_{solute} = m_{solution} \\times \\text{percent}" }],
  },
];

/** 「車・自転車の物理」。制動距離やギア比など、乗り物にまつわる身近な物理計算をまとめている。 */
export const VEHICLES_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Braking distance", ja: "制動距離", es: "Distancia de frenado", "pt-BR": "Distância de frenagem", de: "Bremsweg", fr: "Distance de freinage" },
    description: { en: "Compute the braking distance from speed and the coefficient of friction.", ja: "速度と摩擦係数から、ブレーキをかけてから停止するまでの制動距離を求めます。", es: "Calcula la distancia de frenado a partir de la velocidad y el coeficiente de fricción.", "pt-BR": "Calcule a distância de frenagem a partir da velocidade e do coeficiente de atrito.", de: "Berechnet den Bremsweg aus der Geschwindigkeit und dem Reibungskoeffizienten.", fr: "Calculer la distance de freinage à partir de la vitesse et du coefficient de frottement." },
    localConstants: [
      { symbol: "v", expression: "60km/h" },
      { symbol: "μ", expression: "0.7" },
      { symbol: "g", expression: "9.8m/s^2" },
    ],
    steps: [{ title: { en: "Braking distance d", ja: "制動距離 d", es: "Distancia de frenado d", "pt-BR": "Distância de frenagem d", de: "Bremsweg d", fr: "Distance de freinage d" }, expression: "v^2/(2*μ*g)", targetUnit: "m", formulaLatex: "d = \\dfrac{v^2}{2\\mu g}" }],
  },
  {
    title: { en: "Reaction distance and total stopping distance", ja: "空走距離と停止距離", es: "Distancia de reacción y distancia total de detención", "pt-BR": "Distância de reação e distância total de parada", de: "Reaktionsweg und Anhalteweg", fr: "Distance parcourue pendant le temps de réaction et distance d'arrêt totale" },
    description: { en: "Compute the reaction distance traveled during the driver's reaction time and add the braking distance to get the total stopping distance.", ja: "反応時間中に進む空走距離と、ブレーキによる制動距離を合わせた停止距離を求めます。", es: "Calcula la distancia de reacción recorrida durante el tiempo de reacción del conductor y la suma a la distancia de frenado para obtener la distancia total de detención.", "pt-BR": "Calcule a distância de reação percorrida durante o tempo de reação do motorista e some a distância de frenagem para obter a distância total de parada.", de: "Berechnet den während der Reaktionszeit des Fahrers zurückgelegten Reaktionsweg und addiert den Bremsweg, um den gesamten Anhalteweg zu erhalten.", fr: "Calculer la distance parcourue pendant le temps de réaction du conducteur, puis l'additionner à la distance de freinage pour obtenir la distance d'arrêt totale." },
    localConstants: [
      { symbol: "v", expression: "60km/h" },
      { symbol: "tᵣ", expression: "0.75s" },
      { symbol: "μ", expression: "0.7" },
      { symbol: "g", expression: "9.8m/s^2" },
    ],
    steps: [
      { title: { en: "Reaction distance", ja: "空走距離", es: "Distancia de reacción", "pt-BR": "Distância de reação", de: "Reaktionsweg", fr: "Distance parcourue pendant le temps de réaction" }, expression: "v*tᵣ", targetUnit: "m", formulaLatex: "d_{reaction} = v \\cdot t_r" },
      { title: { en: "Braking distance", ja: "制動距離", es: "Distancia de frenado", "pt-BR": "Distância de frenagem", de: "Bremsweg", fr: "Distance de freinage" }, expression: "v^2/(2*μ*g)", targetUnit: "m", formulaLatex: "d_{brake} = \\dfrac{v^2}{2\\mu g}" },
      { title: { en: "Total stopping distance", ja: "停止距離", es: "Distancia total de detención", "pt-BR": "Distância total de parada", de: "Gesamter Anhalteweg", fr: "Distance d'arrêt totale" }, expression: "s1+s2", targetUnit: "m", formulaLatex: "d_{stop} = d_{reaction} + d_{brake}" },
    ],
  },
  {
    title: { en: "Gear ratio and speed (bicycle)", ja: "ギア比と速度（自転車）", es: "Relación de transmisión y velocidad (bicicleta)", "pt-BR": "Relação de transmissão e velocidade (bicicleta)", de: "Übersetzungsverhältnis und Geschwindigkeit (Fahrrad)", fr: "Rapport de démultiplication et vitesse (vélo)" },
    description: { en: "Compute a bicycle's speed from the pedaling cadence, gear ratio, and wheel circumference.", ja: "ペダルの回転数・ギア比・タイヤの周長から、自転車の速度を求めます。", es: "Calcula la velocidad de una bicicleta a partir de la cadencia de pedaleo, la relación de transmisión y la circunferencia de la rueda.", "pt-BR": "Calcule a velocidade de uma bicicleta a partir da cadência de pedalada, da relação de transmissão e da circunferência da roda.", de: "Berechnet die Geschwindigkeit eines Fahrrads aus der Trittfrequenz, dem Übersetzungsverhältnis und dem Radumfang.", fr: "Calculer la vitesse d'un vélo à partir de la cadence de pédalage, du rapport de démultiplication et de la circonférence de la roue." },
    localConstants: [
      { symbol: "cadence", expression: "80rpm" },
      { symbol: "gearRatio", expression: "2.5" },
      { symbol: "Cₕ", expression: "2.1m" },
    ],
    steps: [{ title: { en: "Speed v", ja: "速度 v", es: "Velocidad v", "pt-BR": "Velocidade v", de: "Geschwindigkeit v", fr: "Vitesse v" }, expression: "cadence*gearRatio*Cₕ", targetUnit: "km/h", formulaLatex: "v = \\text{cadence} \\times \\text{gearRatio} \\times C_h" }],
  },
  {
    title: { en: "Fuel economy and trip cost", ja: "燃費と走行コスト", es: "Consumo de combustible y costo del trayecto", "pt-BR": "Consumo de combustível e custo do trajeto", de: "Kraftstoffverbrauch und Fahrtkosten", fr: "Consommation de carburant et coût du trajet" },
    description: { en: "Compute the fuel needed and the trip cost from distance traveled, fuel economy, and fuel price.", ja: "走行距離・燃費・燃料単価から、必要な燃料の量と走行にかかる費用を求めます。", es: "Calcula el combustible necesario y el costo del viaje a partir de la distancia recorrida, el consumo y el precio del combustible.", "pt-BR": "Calcule o combustível necessário e o custo da viagem a partir da distância percorrida, do consumo e do preço do combustível.", de: "Berechnet den benötigten Kraftstoff und die Fahrtkosten aus der zurückgelegten Strecke, dem Kraftstoffverbrauch und dem Kraftstoffpreis.", fr: "Calculer le carburant nécessaire et le coût du trajet à partir de la distance parcourue, de la consommation et du prix du carburant." },
    localConstants: [
      { symbol: "distance", expression: "300km" },
      { symbol: "fuelEconomy", expression: "15km/L" },
      { symbol: "price", expression: "170" },
    ],
    steps: [
      { title: { en: "Fuel needed", ja: "必要な燃料", es: "Combustible necesario", "pt-BR": "Combustível necessário", de: "Benötigter Kraftstoff", fr: "Carburant nécessaire" }, expression: "distance/fuelEconomy", targetUnit: "L", formulaLatex: "\\text{fuel} = \\dfrac{\\text{distance}}{\\text{fuelEconomy}}" },
      { title: { en: "Trip cost", ja: "走行コスト", es: "Costo del viaje", "pt-BR": "Custo da viagem", de: "Fahrtkosten", fr: "Coût du trajet" }, expression: "(s1/1L)*price", targetUnit: "", formulaLatex: "\\text{cost} = \\dfrac{\\text{fuel}}{1\\text{L}} \\times \\text{price}" },
    ],
  },
  {
    title: { en: "Safe cornering speed", ja: "カーブを安全に曲がれる速度", es: "Velocidad segura en curva", "pt-BR": "Velocidade segura em curva", de: "Sichere Kurvengeschwindigkeit", fr: "Vitesse sûre en virage" },
    description: { en: "Estimate the safe cornering speed from the road's coefficient of friction and the curve radius.", ja: "路面の摩擦係数とカーブの半径から、安全に曲がれる速度の目安を求めます。", es: "Estima la velocidad segura en una curva a partir del coeficiente de fricción de la calzada y el radio de la curva.", "pt-BR": "Estime a velocidade segura em uma curva a partir do coeficiente de atrito da pista e do raio da curva.", de: "Schätzt die sichere Kurvengeschwindigkeit aus dem Reibungskoeffizienten der Fahrbahn und dem Kurvenradius.", fr: "Estimer la vitesse sûre en virage à partir du coefficient de frottement de la route et du rayon de la courbe." },
    localConstants: [
      { symbol: "μ", expression: "0.8" },
      { symbol: "g", expression: "9.8m/s^2" },
      { symbol: "r", expression: "50m" },
    ],
    steps: [{ title: { en: "Safe speed v", ja: "安全速度 v", es: "Velocidad segura v", "pt-BR": "Velocidade segura v", de: "Sichere Geschwindigkeit v", fr: "Vitesse sûre v" }, expression: "sqrt(μ*g*r)", targetUnit: "km/h", formulaLatex: "v = \\sqrt{\\mu g r}" }],
  },
];

/** 「料理・製菓の単位換算」。計量カップやオーブン温度など、キッチンで役立つ単位換算をまとめている。 */
export const COOKING_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Measuring cup, tablespoon, teaspoon to mL conversion", ja: "計量カップ・大さじ・小さじ⇔mL変換", es: "Conversión de taza, cucharada y cucharadita a mL", "pt-BR": "Conversão de xícara, colher de sopa e colher de chá para mL", de: "Umrechnung von Tasse, Esslöffel und Teelöffel in mL", fr: "Conversion tasse, cuillère à soupe et cuillère à café en mL" },
    description: { en: "Convert a quantity in measuring cups to mL, tablespoons, and teaspoons. Use the unit-switching chips to compare them directly.", ja: "計量カップの分量を、mL・大さじ(tbsp)・小さじ(tsp)に換算します。単位の切替チップでそのまま比較できます。", es: "Convierte una cantidad en tazas medidoras a mL, cucharadas y cucharaditas. Usa los chips de cambio de unidad para compararlas directamente.", "pt-BR": "Converta uma quantidade em xícaras medidoras para mL, colheres de sopa e colheres de chá. Use os chips de troca de unidade para compará-las diretamente.", de: "Rechnet eine Menge in Messbechern (Tassen) in mL, Esslöffel und Teelöffel um. Mit den Einheiten-Chips lassen sich die Werte direkt vergleichen.", fr: "Convertir une quantité en tasses à mesurer en mL, cuillères à soupe et cuillères à café. Utiliser les puces de changement d'unité pour les comparer directement." },
    localConstants: [{ symbol: "amount", expression: "1.5cup" }],
    steps: [{ title: { en: "Volume", ja: "体積", es: "Volumen", "pt-BR": "Volume", de: "Volumen", fr: "Volume" }, expression: "amount", targetUnit: "mL", formulaLatex: "V = \\text{amount}" }],
  },
  {
    title: { en: "Oven temperature conversion (°F to °C)", ja: "オーブン温度換算（℉⇔℃）", es: "Conversión de temperatura del horno (°F a °C)", "pt-BR": "Conversão de temperatura do forno (°F para °C)", de: "Umrechnung der Ofentemperatur (°F in °C)", fr: "Conversion de la température du four (°F en °C)" },
    description: { en: "Convert an oven temperature given in Fahrenheit, as commonly used in overseas recipes, to Celsius.", ja: "海外レシピでよく使われる華氏（℉）表記のオーブン温度を、摂氏（℃）に換算します。", es: "Convierte a Celsius una temperatura de horno indicada en Fahrenheit, como suele aparecer en recetas extranjeras.", "pt-BR": "Converta para Celsius uma temperatura de forno indicada em Fahrenheit, como costuma aparecer em receitas estrangeiras.", de: "Rechnet eine in Fahrenheit angegebene Ofentemperatur, wie sie in ausländischen Rezepten üblich ist, in Celsius um.", fr: "Convertir en Celsius une température de four indiquée en Fahrenheit, comme c'est courant dans les recettes étrangères." },
    localConstants: [{ symbol: "tempF", expression: "350°F" }],
    steps: [{ title: { en: "Temperature in Celsius", ja: "摂氏温度", es: "Temperatura en Celsius", "pt-BR": "Temperatura em Celsius", de: "Temperatur in Celsius", fr: "Température en Celsius" }, expression: "tempF", targetUnit: "°C", formulaLatex: "T_{°C} = \\dfrac{5}{9}(T_{°F} - 32)" }],
  },
  {
    title: { en: "Recipe serving size scaling", ja: "レシピの人数スケール変換", es: "Escalado de la receta según el número de comensales", "pt-BR": "Ajuste da receita conforme o número de porções", de: "Skalierung der Rezeptmenge nach Portionenzahl", fr: "Mise à l'échelle de la recette selon le nombre de portions" },
    description: { en: "Compute the ingredient amount needed for a target number of servings, scaled from the original recipe.", ja: "元のレシピの分量と人数から、目標の人数分に必要な分量を求めます。", es: "Calcula la cantidad de ingrediente necesaria para un número objetivo de porciones, escalada a partir de la receta original.", "pt-BR": "Calcule a quantidade de ingrediente necessária para um número desejado de porções, ajustada a partir da receita original.", de: "Berechnet die benötigte Zutatenmenge für eine gewünschte Portionenzahl, skaliert aus dem Originalrezept.", fr: "Calculer la quantité d'ingrédient nécessaire pour un nombre de portions souhaité, mise à l'échelle à partir de la recette originale." },
    localConstants: [
      { symbol: "mₒ", expression: "200g" },
      { symbol: "nₒ", expression: "2" },
      { symbol: "nₜ", expression: "5" },
    ],
    steps: [{ title: { en: "Scaled amount", ja: "必要な分量", es: "Cantidad ajustada", "pt-BR": "Quantidade ajustada", de: "Skalierte Menge", fr: "Quantité mise à l'échelle" }, expression: "mₒ*(nₜ/nₒ)", targetUnit: "g", formulaLatex: "m_t = m_o \\times \\dfrac{n_t}{n_o}" }],
  },
  {
    title: { en: "Baker's percentage (hydration)", ja: "ベーカーズパーセント（水分率）", es: "Porcentaje panadero (hidratación)", "pt-BR": "Percentual do padeiro (hidratação)", de: "Bäckerprozent (Hydration)", fr: "Pourcentage boulanger (hydratation)" },
    description: { en: "Compute the ratio of water weight to flour weight (baker's percentage / hydration).", ja: "小麦粉の重さに対する水の重さの割合（ベーカーズパーセント）を求めます。", es: "Calcula la proporción entre el peso del agua y el peso de la harina (porcentaje panadero / hidratación).", "pt-BR": "Calcule a proporção entre o peso da água e o peso da farinha (percentual do padeiro / hidratação).", de: "Berechnet das Verhältnis von Wassergewicht zu Mehlgewicht (Bäckerprozent / Hydration).", fr: "Calculer le rapport entre le poids de l'eau et le poids de la farine (pourcentage boulanger / hydratation)." },
    localConstants: [
      { symbol: "mₐ", expression: "300g" },
      { symbol: "mₗ", expression: "500g" },
    ],
    steps: [{ title: { en: "Hydration", ja: "水分率", es: "Hidratación", "pt-BR": "Hidratação", de: "Hydration", fr: "Hydratation" }, expression: "mₐ/mₗ", targetUnit: "%", formulaLatex: "\\text{hydration} = \\dfrac{m_a}{m_l}" }],
  },
  {
    title: { en: "Gram conversion from density (sugar per tablespoon)", ja: "密度からのグラム換算（砂糖大さじ何g）", es: "Conversión a gramos a partir de la densidad (azúcar por cucharada)", "pt-BR": "Conversão para gramas a partir da densidade (açúcar por colher de sopa)", de: "Umrechnung in Gramm anhand der Dichte (Zucker pro Esslöffel)", fr: "Conversion en grammes à partir de la masse volumique (sucre par cuillère à soupe)" },
    description: { en: "Compute the mass in grams from the density of sugar and a volume measured in tablespoons.", ja: "砂糖の密度と体積（大さじ）から、質量をグラムで求めます。", es: "Calcula la masa en gramos a partir de la densidad del azúcar y un volumen medido en cucharadas.", "pt-BR": "Calcule a massa em gramas a partir da densidade do açúcar e de um volume medido em colheres de sopa.", de: "Berechnet die Masse in Gramm aus der Dichte von Zucker und einem in Esslöffeln gemessenen Volumen.", fr: "Calculer la masse en grammes à partir de la masse volumique du sucre et d'un volume mesuré en cuillères à soupe." },
    localConstants: [
      { symbol: "ρ", expression: "0.9g/mL" },
      { symbol: "V", expression: "3tbsp" },
    ],
    steps: [{ title: { en: "Mass", ja: "質量", es: "Masa", "pt-BR": "Massa", de: "Masse", fr: "Masse" }, expression: "ρ*V", targetUnit: "g", formulaLatex: "m = \\rho \\times V" }],
  },
];
