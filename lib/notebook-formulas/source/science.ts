import type { NotebookSeed } from "../types";

/** 理科「速さ・運動」。小学校・中学校で学ぶ、速さ・道のり・時間の関係と等加速度運動をまとめている。 */
export const SCIENCE_MOTION_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Speed, distance, and time (the fundamental relation)", ja: "速さ・道のり・時間の関係（はじきの公式）", es: "Velocidad, distancia y tiempo (la relación fundamental)", "pt-BR": "Velocidade, distância e tempo (a relação fundamental)", de: "Geschwindigkeit, Strecke und Zeit (der Grundzusammenhang)", fr: "Vitesse, distance et temps (la relation fondamentale)" },
    description: { en: "Using a train that covers 140km in 2 hours as an example, walk through all three forms of the speed-distance-time relation.", ja: "140kmを2時間で走る電車を例に、速さ・道のり・時間の3つの公式を順番に確認します。", es: "Usando como ejemplo un tren que recorre 140km en 2 horas, repasamos las tres formas de la relación entre velocidad, distancia y tiempo.", "pt-BR": "Usando como exemplo um trem que percorre 140km em 2 horas, vamos ver as três formas da relação entre velocidade, distância e tempo.", de: "Am Beispiel eines Zuges, der 140km in 2 Stunden zurücklegt, werden alle drei Formen des Zusammenhangs von Geschwindigkeit, Strecke und Zeit durchgegangen.", fr: "À partir de l'exemple d'un train qui parcourt 140km en 2 heures, on passe en revue les trois formes de la relation entre vitesse, distance et temps." },
    formulas: [
      { explanation: { en: "Speed equals distance divided by time.", ja: "速さは、道のりを時間で割って求めます。", es: "La velocidad es igual a la distancia dividida entre el tiempo.", "pt-BR": "A velocidade é igual à distância dividida pelo tempo.", de: "Die Geschwindigkeit ergibt sich aus der Strecke geteilt durch die Zeit.", fr: "La vitesse est égale à la distance divisée par le temps." }, latex: "v = \\dfrac{d}{t}" },
      { explanation: { en: "Distance equals speed multiplied by time.", ja: "道のりは、速さに時間をかけて求めます。", es: "La distancia es igual a la velocidad multiplicada por el tiempo.", "pt-BR": "A distância é igual à velocidade multiplicada pelo tempo.", de: "Die Strecke ergibt sich aus der Geschwindigkeit multipliziert mit der Zeit.", fr: "La distance est égale à la vitesse multipliée par le temps." }, latex: "d = vt" },
      { explanation: { en: "Time equals distance divided by speed.", ja: "時間は、道のりを速さで割って求めます。", es: "El tiempo es igual a la distancia dividida entre la velocidad.", "pt-BR": "O tempo é igual à distância dividida pela velocidade.", de: "Die Zeit ergibt sich aus der Strecke geteilt durch die Geschwindigkeit.", fr: "Le temps est égal à la distance divisée par la vitesse." }, latex: "t = \\dfrac{d}{v}" },
    ],
    localConstants: [
      { symbol: "d", expression: "140km" },
      { symbol: "t", expression: "2h" },
      { symbol: "t₂", expression: "3h" },
      { symbol: "d₃", expression: "245km" },
    ],
    steps: [
      { title: { en: "Speed v", ja: "速さ v", es: "Velocidad v", "pt-BR": "Velocidade v", de: "Geschwindigkeit v", fr: "Vitesse v" }, expression: "d/t", targetUnit: "km/h", formulaLatex: "v = \\dfrac{d}{t}", resultSymbol: "v" },
      { title: { en: "Distance covered in time t₂", ja: "時間 t₂ で進む道のり", es: "Distancia recorrida en el tiempo t₂", "pt-BR": "Distância percorrida no tempo t₂", de: "In der Zeit t₂ zurückgelegte Strecke", fr: "Distance parcourue pendant le temps t₂" }, expression: "v*t₂", targetUnit: "km", formulaLatex: "d_2 = v t_2" },
      { title: { en: "Time needed to cover distance d₃", ja: "道のり d₃ を進むのにかかる時間", es: "Tiempo necesario para recorrer la distancia d₃", "pt-BR": "Tempo necessário para percorrer a distância d₃", de: "Benötigte Zeit für die Strecke d₃", fr: "Temps nécessaire pour parcourir la distance d₃" }, expression: "d₃/v", targetUnit: "h", formulaLatex: "t_3 = \\dfrac{d_3}{v}" },
    ],
  },
  {
    title: { en: "Average speed", ja: "平均の速さ", es: "Velocidad media", "pt-BR": "Velocidade média", de: "Durchschnittsgeschwindigkeit", fr: "Vitesse moyenne" },
    description: { en: "Compute average speed by dividing total distance by total time when speed varies between segments.", ja: "区間ごとに速さが違うとき、道のりの合計を時間の合計で割って平均の速さを求めます。", es: "Cuando la velocidad varía en cada tramo, calcula la velocidad media dividiendo la distancia total entre el tiempo total.", "pt-BR": "Quando a velocidade varia em cada trecho, calcule a velocidade média dividindo a distância total pelo tempo total.", de: "Wenn sich die Geschwindigkeit zwischen den Abschnitten ändert, wird die Durchschnittsgeschwindigkeit berechnet, indem die Gesamtstrecke durch die Gesamtzeit geteilt wird.", fr: "Lorsque la vitesse varie selon les tronçons, calcule la vitesse moyenne en divisant la distance totale par le temps total." },
    localConstants: [
      { symbol: "d₁", expression: "60km" },
      { symbol: "t₁", expression: "1h" },
      { symbol: "d₂", expression: "90km" },
      { symbol: "t₂", expression: "1.5h" },
    ],
    steps: [
      { title: { en: "Total distance", ja: "道のりの合計", es: "Distancia total", "pt-BR": "Distância total", de: "Gesamtstrecke", fr: "Distance totale" }, expression: "d₁+d₂", targetUnit: "km", formulaLatex: "d = d_1 + d_2" },
      { title: { en: "Total time", ja: "時間の合計", es: "Tiempo total", "pt-BR": "Tempo total", de: "Gesamtzeit", fr: "Temps total" }, expression: "t₁+t₂", targetUnit: "h", formulaLatex: "t = t_1 + t_2" },
      { title: { en: "Average speed", ja: "平均の速さ", es: "Velocidad media", "pt-BR": "Velocidade média", de: "Durchschnittsgeschwindigkeit", fr: "Vitesse moyenne" }, expression: "s1/s2", targetUnit: "km/h", formulaLatex: "\\bar{v} = \\dfrac{d}{t}" },
    ],
  },
  {
    title: { en: "Converting speed units (per second, per minute, per hour)", ja: "速さの単位換算（秒速・分速・時速）", es: "Conversión de unidades de velocidad (por segundo, por minuto, por hora)", "pt-BR": "Conversão de unidades de velocidade (por segundo, por minuto, por hora)", de: "Umrechnung von Geschwindigkeitseinheiten (pro Sekunde, pro Minute, pro Stunde)", fr: "Conversion des unités de vitesse (par seconde, par minute, par heure)" },
    description: { en: "Express the same speed in units per second, per minute, and per hour to check the conversions.", ja: "同じ速さを秒速・分速・時速のそれぞれで表し、単位換算を確認します。", es: "Expresa la misma velocidad por segundo, por minuto y por hora para comprobar las conversiones.", "pt-BR": "Expresse a mesma velocidade por segundo, por minuto e por hora para conferir as conversões.", de: "Dieselbe Geschwindigkeit wird pro Sekunde, pro Minute und pro Stunde ausgedrückt, um die Umrechnungen zu überprüfen.", fr: "Exprime la même vitesse par seconde, par minute et par heure afin de vérifier les conversions." },
    localConstants: [{ symbol: "v", expression: "10m/s" }],
    steps: [
      { title: { en: "Speed per second", ja: "秒速", es: "Velocidad por segundo", "pt-BR": "Velocidade por segundo", de: "Geschwindigkeit pro Sekunde", fr: "Vitesse par seconde" }, expression: "v", targetUnit: "m/s", formulaLatex: "v" },
      { title: { en: "Speed per minute", ja: "分速", es: "Velocidad por minuto", "pt-BR": "Velocidade por minuto", de: "Geschwindigkeit pro Minute", fr: "Vitesse par minute" }, expression: "v", targetUnit: "m/min", formulaLatex: "v" },
      { title: { en: "Speed per hour", ja: "時速", es: "Velocidad por hora", "pt-BR": "Velocidade por hora", de: "Geschwindigkeit pro Stunde", fr: "Vitesse par heure" }, expression: "v", targetUnit: "km/h", formulaLatex: "v" },
    ],
  },
  {
    title: { en: "Speed of an interval from a ticker-tape timer", ja: "記録タイマーで区間の速さを求める", es: "Velocidad de un intervalo con un temporizador de cinta de puntos", "pt-BR": "Velocidade de um intervalo com um temporizador de fita de pontos", de: "Geschwindigkeit eines Abschnitts mit dem Zeitmarkengeber", fr: "Vitesse d'un intervalle avec un chronomètre à bande marquant des points" },
    description: { en: "A ticker-tape timer makes a dot every 0.02s. Compute the speed over a 5-dot interval spanning 4.5cm.", ja: "1打点0.02秒の記録タイマーで、5打点分の区間（4.5cm）の速さを求めます。", es: "Un temporizador de cinta de puntos marca un punto cada 0,02s. Calcula la velocidad en un intervalo de 5 puntos que abarca 4,5cm.", "pt-BR": "Um temporizador de fita marca um ponto a cada 0,02s. Calcule a velocidade em um intervalo de 5 pontos que abrange 4,5cm.", de: "Ein Zeitmarkengeber setzt alle 0,02s einen Punkt. Berechne die Geschwindigkeit über einen Abschnitt von 5 Punkten mit einer Länge von 4,5cm.", fr: "Un chronomètre à bande marque un point toutes les 0,02s. Calcule la vitesse sur un intervalle de 5 points s'étendant sur 4,5cm." },
    localConstants: [
      { symbol: "n", expression: "5" },
      { symbol: "interval", expression: "0.02s" },
      { symbol: "d", expression: "4.5cm" },
    ],
    steps: [
      { title: { en: "Interval time", ja: "区間の時間", es: "Tiempo del intervalo", "pt-BR": "Tempo do intervalo", de: "Zeit des Abschnitts", fr: "Durée de l'intervalle" }, expression: "n*interval", targetUnit: "s", formulaLatex: "t = n \\times 0.02\\text{s}" },
      { title: { en: "Interval speed", ja: "区間の速さ", es: "Velocidad del intervalo", "pt-BR": "Velocidade do intervalo", de: "Geschwindigkeit des Abschnitts", fr: "Vitesse de l'intervalle" }, expression: "d/s1", targetUnit: "cm/s", formulaLatex: "v = \\dfrac{d}{t}" },
    ],
  },
  {
    title: { en: "Change in speed under uniform acceleration", ja: "等加速度の速さの変化", es: "Cambio de velocidad en un movimiento uniformemente acelerado", "pt-BR": "Variação de velocidade em um movimento uniformemente acelerado", de: "Geschwindigkeitsänderung bei gleichmäßiger Beschleunigung", fr: "Variation de vitesse en accélération uniforme" },
    description: { en: "Compute the acceleration of a cart whose speed changes from 3m/s to 7m/s over 2 seconds.", ja: "台車の速さが2秒間で3m/sから7m/sに変化したときの加速度を求めます。", es: "Calcula la aceleración de un carrito cuya velocidad cambia de 3m/s a 7m/s en 2 segundos.", "pt-BR": "Calcule a aceleração de um carrinho cuja velocidade muda de 3m/s para 7m/s em 2 segundos.", de: "Berechne die Beschleunigung eines Wagens, dessen Geschwindigkeit sich in 2 Sekunden von 3m/s auf 7m/s ändert.", fr: "Calcule l'accélération d'un chariot dont la vitesse passe de 3m/s à 7m/s en 2 secondes." },
    localConstants: [
      { symbol: "v₁", expression: "3m/s" },
      { symbol: "v₂", expression: "7m/s" },
      { symbol: "t", expression: "2s" },
    ],
    steps: [
      { title: { en: "Change in speed Δv", ja: "速さの変化 Δv", es: "Cambio de velocidad Δv", "pt-BR": "Variação de velocidade Δv", de: "Geschwindigkeitsänderung Δv", fr: "Variation de vitesse Δv" }, expression: "v₂-v₁", targetUnit: "m/s", formulaLatex: "\\Delta v = v_2 - v_1" },
      { title: { en: "Acceleration a", ja: "加速度 a", es: "Aceleración a", "pt-BR": "Aceleração a", de: "Beschleunigung a", fr: "Accélération a" }, expression: "s1/t", targetUnit: "m/s²", formulaLatex: "a = \\dfrac{\\Delta v}{\\Delta t}" },
    ],
  },
];

/** 理科「密度・濃度」。物体の密度・水に浮くか沈むかの判定・水溶液の濃度をまとめている。 */
export const SCIENCE_DENSITY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Density, mass, and volume (a lump of metal)", ja: "密度・質量・体積の関係（金属のかたまり）", es: "Densidad, masa y volumen (un trozo de metal)", "pt-BR": "Densidade, massa e volume (um pedaço de metal)", de: "Dichte, Masse und Volumen (ein Stück Metall)", fr: "Masse volumique, masse et volume (un morceau de métal)" },
    description: { en: "Find the density of a 54g, 20cm³ metal sample, then use that density to find the mass and volume of other amounts of the same metal.", ja: "質量54g・体積20cm³の金属片から密度を求め、同じ金属の別の質量・体積も密度から計算します。", es: "Halla la densidad de una muestra de metal de 54g y 20cm³, y usa esa densidad para calcular la masa y el volumen de otras cantidades del mismo metal.", "pt-BR": "Encontre a densidade de uma amostra de metal de 54g e 20cm³, e use essa densidade para calcular a massa e o volume de outras quantidades do mesmo metal.", de: "Bestimme die Dichte einer Metallprobe mit 54g und 20cm³ und berechne mit dieser Dichte die Masse und das Volumen anderer Mengen desselben Metalls.", fr: "Détermine la masse volumique d'un échantillon de métal de 54g et 20cm³, puis utilise cette valeur pour calculer la masse et le volume d'autres quantités du même métal." },
    formulas: [
      { explanation: { en: "Density equals mass divided by volume.", ja: "密度は、質量を体積で割って求めます。", es: "La densidad es igual a la masa dividida entre el volumen.", "pt-BR": "A densidade é igual à massa dividida pelo volume.", de: "Die Dichte ergibt sich aus der Masse geteilt durch das Volumen.", fr: "La masse volumique est égale à la masse divisée par le volume." }, latex: "\\rho = \\dfrac{m}{V}" },
      { explanation: { en: "Mass equals density multiplied by volume.", ja: "質量は、密度に体積をかけて求めます。", es: "La masa es igual a la densidad multiplicada por el volumen.", "pt-BR": "A massa é igual à densidade multiplicada pelo volume.", de: "Die Masse ergibt sich aus der Dichte multipliziert mit dem Volumen.", fr: "La masse est égale à la masse volumique multipliée par le volume." }, latex: "m = \\rho V" },
      { explanation: { en: "Volume equals mass divided by density.", ja: "体積は、質量を密度で割って求めます。", es: "El volumen es igual a la masa dividida entre la densidad.", "pt-BR": "O volume é igual à massa dividida pela densidade.", de: "Das Volumen ergibt sich aus der Masse geteilt durch die Dichte.", fr: "Le volume est égal à la masse divisée par la masse volumique." }, latex: "V = \\dfrac{m}{\\rho}" },
    ],
    localConstants: [
      { symbol: "m", expression: "54g" },
      { symbol: "V", expression: "20cm³" },
      { symbol: "V₂", expression: "10cm³" },
      { symbol: "m₃", expression: "81g" },
    ],
    steps: [
      { title: { en: "Density ρ", ja: "密度 ρ", es: "Densidad ρ", "pt-BR": "Densidade ρ", de: "Dichte ρ", fr: "Masse volumique ρ" }, expression: "m/V", targetUnit: "g/cm³", formulaLatex: "\\rho = \\dfrac{m}{V}", resultSymbol: "ρ" },
      { title: { en: "Mass of volume V₂ of the same metal", ja: "体積 V₂ の質量", es: "Masa del volumen V₂ del mismo metal", "pt-BR": "Massa do volume V₂ do mesmo metal", de: "Masse des Volumens V₂ desselben Metalls", fr: "Masse du volume V₂ du même métal" }, expression: "ρ*V₂", targetUnit: "g", formulaLatex: "m_2 = \\rho V_2" },
      { title: { en: "Volume of mass m₃ of the same metal", ja: "質量 m₃ の体積", es: "Volumen de la masa m₃ del mismo metal", "pt-BR": "Volume da massa m₃ do mesmo metal", de: "Volumen der Masse m₃ desselben Metalls", fr: "Volume de la masse m₃ du même métal" }, expression: "m₃/ρ", targetUnit: "cm³", formulaLatex: "V_3 = \\dfrac{m_3}{\\rho}" },
    ],
  },
  {
    title: { en: "Does it float or sink? (judging by density)", ja: "水に浮くか沈むか（密度で判断）", es: "¿Flota o se hunde? (según la densidad)", "pt-BR": "Flutua ou afunda? (de acordo com a densidade)", de: "Schwimmt es oder sinkt es? (anhand der Dichte)", fr: "Ça flotte ou ça coule ? (selon la masse volumique)" },
    description: { en: "Find the density of a 50cm³, 40g piece of wood and compare it to the density of water (1g/cm³) to see if it floats or sinks.", ja: "体積50cm³・質量40gの木片の密度を求め、水の密度（1g/cm³）と比べて浮くか沈むかを判定します。", es: "Halla la densidad de un trozo de madera de 50cm³ y 40g, y compárala con la densidad del agua (1g/cm³) para saber si flota o se hunde.", "pt-BR": "Encontre a densidade de um pedaço de madeira de 50cm³ e 40g, e compare com a densidade da água (1g/cm³) para saber se ele flutua ou afunda.", de: "Bestimme die Dichte eines 50cm³ großen, 40g schweren Holzstücks und vergleiche sie mit der Dichte von Wasser (1g/cm³), um zu prüfen, ob es schwimmt oder sinkt.", fr: "Détermine la masse volumique d'un morceau de bois de 50cm³ et 40g, puis compare-la à celle de l'eau (1g/cm³) pour savoir s'il flotte ou coule." },
    localConstants: [
      { symbol: "m", expression: "40g" },
      { symbol: "V", expression: "50cm³" },
    ],
    steps: [
      { title: { en: "Density ρ", ja: "密度 ρ", es: "Densidad ρ", "pt-BR": "Densidade ρ", de: "Dichte ρ", fr: "Masse volumique ρ" }, expression: "m/V", targetUnit: "g/cm³", formulaLatex: "\\rho = \\dfrac{m}{V}" },
      { title: { en: "Ratio to water's density (floats if under 1)", ja: "水の密度との比（1未満なら浮く）", es: "Relación con la densidad del agua (flota si es menor que 1)", "pt-BR": "Razão em relação à densidade da água (flutua se for menor que 1)", de: "Verhältnis zur Dichte von Wasser (schwimmt bei einem Wert unter 1)", fr: "Rapport à la masse volumique de l'eau (flotte si inférieur à 1)" }, expression: "s1/(1g/cm³)", targetUnit: "", formulaLatex: "\\dfrac{\\rho}{\\rho_{water}}" },
    ],
  },
  {
    title: { en: "Mass percent concentration", ja: "質量パーセント濃度", es: "Concentración en porcentaje de masa", "pt-BR": "Concentração em porcentagem de massa", de: "Massenanteil (Massenprozent)", fr: "Pourcentage massique" },
    description: { en: "Compute the mass percent concentration of a solution made by dissolving 20g of solute in 180g of water.", ja: "溶質20gを水180gに溶かした水溶液の、質量パーセント濃度を求めます。", es: "Calcula la concentración en porcentaje de masa de una disolución hecha disolviendo 20g de soluto en 180g de agua.", "pt-BR": "Calcule a concentração em porcentagem de massa de uma solução feita dissolvendo 20g de soluto em 180g de água.", de: "Berechne den Massenanteil einer Lösung, die durch Auflösen von 20g gelöstem Stoff in 180g Wasser entsteht.", fr: "Calcule le pourcentage massique d'une solution obtenue en dissolvant 20g de soluté dans 180g d'eau." },
    localConstants: [
      { symbol: "mₛₒₗᵤₜₑ", expression: "20g" },
      { symbol: "mₛₒₗᵥₑₙₜ", expression: "180g" },
    ],
    steps: [
      { title: { en: "Mass of the solution", ja: "水溶液の質量", es: "Masa de la disolución", "pt-BR": "Massa da solução", de: "Masse der Lösung", fr: "Masse de la solution" }, expression: "mₛₒₗᵤₜₑ+mₛₒₗᵥₑₙₜ", targetUnit: "g", formulaLatex: "m_{sol} = m_{solute} + m_{solvent}" },
      { title: { en: "Mass percent concentration", ja: "質量パーセント濃度", es: "Concentración en porcentaje de masa", "pt-BR": "Concentração em porcentagem de massa", de: "Massenanteil (Massenprozent)", fr: "Pourcentage massique" }, expression: "mₛₒₗᵤₜₑ/s1", targetUnit: "%", formulaLatex: "\\text{percent} = \\dfrac{m_{solute}}{m_{sol}}" },
    ],
  },
  {
    title: { en: "Mass of solute (from mass percent concentration)", ja: "溶質の質量（質量パーセント濃度から）", es: "Masa del soluto (a partir de la concentración en porcentaje de masa)", "pt-BR": "Massa do soluto (a partir da concentração em porcentagem de massa)", de: "Masse des gelösten Stoffs (aus dem Massenanteil)", fr: "Masse du soluté (à partir du pourcentage massique)" },
    description: { en: "Compute the mass of solute contained in 250g of an 8% solution.", ja: "8%の水溶液250gの中に含まれる、溶質の質量を求めます。", es: "Calcula la masa de soluto contenida en 250g de una disolución al 8%.", "pt-BR": "Calcule a massa de soluto contida em 250g de uma solução a 8%.", de: "Berechne die Masse des gelösten Stoffs in 250g einer 8%igen Lösung.", fr: "Calcule la masse de soluté contenue dans 250g d'une solution à 8%." },
    localConstants: [
      { symbol: "mₛₒₗ", expression: "250g" },
      { symbol: "percent", expression: "8%" },
    ],
    steps: [{ title: { en: "Mass of solute", ja: "溶質の質量", es: "Masa del soluto", "pt-BR": "Massa do soluto", de: "Masse des gelösten Stoffs", fr: "Masse du soluté" }, expression: "mₛₒₗ*percent", targetUnit: "g", formulaLatex: "m_{solute} = m_{sol} \\times \\text{percent}" }],
  },
  {
    title: { en: "Mass percent concentration of a saturated solution (from solubility)", ja: "溶解度から飽和水溶液の質量パーセント濃度", es: "Concentración en porcentaje de masa de una disolución saturada (a partir de la solubilidad)", "pt-BR": "Concentração em porcentagem de massa de uma solução saturada (a partir da solubilidade)", de: "Massenanteil einer gesättigten Lösung (aus der Löslichkeit)", fr: "Pourcentage massique d'une solution saturée (à partir de la solubilité)" },
    description: { en: "Potassium nitrate has a solubility of 110g per 100g of water at 60°C. Compute the mass percent concentration of the resulting saturated solution.", ja: "60℃の水100gに硝酸カリウムが110gまで溶ける（溶解度110）とき、飽和水溶液の質量パーセント濃度を求めます。", es: "El nitrato de potasio tiene una solubilidad de 110g por cada 100g de agua a 60°C. Calcula la concentración en porcentaje de masa de la disolución saturada resultante.", "pt-BR": "O nitrato de potássio tem solubilidade de 110g por 100g de água a 60°C. Calcule a concentração em porcentagem de massa da solução saturada resultante.", de: "Kaliumnitrat hat bei 60°C eine Löslichkeit von 110g pro 100g Wasser. Berechne den Massenanteil der entstehenden gesättigten Lösung.", fr: "Le nitrate de potassium a une solubilité de 110g pour 100g d'eau à 60°C. Calcule le pourcentage massique de la solution saturée obtenue." },
    localConstants: [
      { symbol: "solubility", expression: "110g" },
      { symbol: "water", expression: "100g" },
    ],
    steps: [
      { title: { en: "Mass of the saturated solution", ja: "飽和水溶液の質量", es: "Masa de la disolución saturada", "pt-BR": "Massa da solução saturada", de: "Masse der gesättigten Lösung", fr: "Masse de la solution saturée" }, expression: "solubility+water", targetUnit: "g", formulaLatex: "m_{sol} = \\text{solubility} + m_{water}" },
      { title: { en: "Mass percent concentration", ja: "質量パーセント濃度", es: "Concentración en porcentaje de masa", "pt-BR": "Concentração em porcentagem de massa", de: "Massenanteil (Massenprozent)", fr: "Pourcentage massique" }, expression: "solubility/s1", targetUnit: "%", formulaLatex: "\\text{percent} = \\dfrac{\\text{solubility}}{m_{sol}}" },
    ],
  },
];

/** 理科「圧力・浮力」。圧力の基本公式・水圧・大気圧・浮力（アルキメデスの原理）をまとめている。 */
export const SCIENCE_PRESSURE_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Pressure equals force divided by area", ja: "圧力＝力÷面積", es: "La presión es igual a la fuerza dividida entre el área", "pt-BR": "A pressão é igual à força dividida pela área", de: "Der Druck ergibt sich aus der Kraft geteilt durch die Fläche", fr: "La pression est égale à la force divisée par la surface" },
    description: { en: "Compute pressure from the force pressing perpendicular to a surface and the area of that surface.", ja: "面を垂直に押す力と、力がはたらく面積から、圧力を求めます。", es: "Calcula la presión a partir de la fuerza que empuja perpendicularmente sobre una superficie y el área de esa superficie.", "pt-BR": "Calcule a pressão a partir da força que empurra perpendicularmente sobre uma superfície e da área dessa superfície.", de: "Berechne den Druck aus der senkrecht auf eine Fläche wirkenden Kraft und der Größe dieser Fläche.", fr: "Calcule la pression à partir de la force qui appuie perpendiculairement sur une surface et de l'aire de cette surface." },
    localConstants: [
      { symbol: "F", expression: "60N" },
      { symbol: "A", expression: "0.02m²" },
    ],
    steps: [{ title: { en: "Pressure P", ja: "圧力 P", es: "Presión P", "pt-BR": "Pressão P", de: "Druck P", fr: "Pression P" }, expression: "F/A", targetUnit: "Pa", formulaLatex: "P = \\dfrac{F}{A}" }],
  },
  {
    title: { en: "Denting a sponge (pressure with different contact areas)", ja: "スポンジのへこみ（接地面積を変えたときの圧力）", es: "Hundir una esponja (presión con distintas áreas de contacto)", "pt-BR": "Afundando uma esponja (pressão com diferentes áreas de contato)", de: "Einen Schwamm eindrücken (Druck bei unterschiedlichen Kontaktflächen)", fr: "Enfoncer une éponge (pression selon différentes surfaces de contact)" },
    description: { en: "Compare the pressure of the same 40N block when it rests on a 0.01m² face versus a 0.04m² face.", ja: "同じ40Nのブロックを、接地面積0.01m²で置いた場合と0.04m²で置いた場合の圧力を比べます。", es: "Compara la presión del mismo bloque de 40N cuando descansa sobre una cara de 0,01m² y sobre una cara de 0,04m².", "pt-BR": "Compare a pressão do mesmo bloco de 40N quando ele está apoiado sobre uma face de 0,01m² e sobre uma face de 0,04m².", de: "Vergleiche den Druck desselben 40N schweren Blocks, wenn er auf einer Fläche von 0,01m² bzw. auf einer Fläche von 0,04m² aufliegt.", fr: "Compare la pression du même bloc de 40N lorsqu'il repose sur une face de 0,01m² puis sur une face de 0,04m²." },
    localConstants: [
      { symbol: "F", expression: "40N" },
      { symbol: "A₁", expression: "0.01m²" },
      { symbol: "A₂", expression: "0.04m²" },
    ],
    steps: [
      { title: { en: "Pressure P1 with a face of area A₁", ja: "面積 A₁ のときの圧力 P1", es: "Presión P1 con una cara de área A₁", "pt-BR": "Pressão P1 com uma face de área A₁", de: "Druck P1 bei einer Fläche von A₁", fr: "Pression P1 avec une face d'aire A₁" }, expression: "F/A₁", targetUnit: "Pa", formulaLatex: "P_1 = \\dfrac{F}{A_1}" },
      { title: { en: "Pressure P2 with a face of area A₂", ja: "面積 A₂ のときの圧力 P2", es: "Presión P2 con una cara de área A₂", "pt-BR": "Pressão P2 com uma face de área A₂", de: "Druck P2 bei einer Fläche von A₂", fr: "Pression P2 avec une face d'aire A₂" }, expression: "F/A₂", targetUnit: "Pa", formulaLatex: "P_2 = \\dfrac{F}{A_2}" },
    ],
  },
  {
    title: { en: "Water pressure P=ρgh", ja: "水圧 P=ρgh", es: "Presión del agua P=ρgh", "pt-BR": "Pressão da água P=ρgh", de: "Wasserdruck P=ρgh", fr: "Pression de l'eau P=ρgh" },
    description: { en: "Compute the water pressure at a given depth from the density of water, gravitational acceleration, and depth.", ja: "水の密度・重力加速度・水面からの深さから、水中の圧力（水圧）を求めます。", es: "Calcula la presión del agua a una profundidad determinada a partir de la densidad del agua, la aceleración de la gravedad y la profundidad.", "pt-BR": "Calcule a pressão da água em uma determinada profundidade a partir da densidade da água, da aceleração da gravidade e da profundidade.", de: "Berechne den Wasserdruck in einer bestimmten Tiefe aus der Dichte des Wassers, der Fallbeschleunigung und der Tiefe.", fr: "Calcule la pression de l'eau à une profondeur donnée à partir de la masse volumique de l'eau, de l'accélération de la pesanteur et de la profondeur." },
    localConstants: [
      { symbol: "ρ", expression: "1000kg/m³" },
      { symbol: "g", expression: "9.8m/s²" },
      { symbol: "h", expression: "5m" },
    ],
    steps: [{ title: { en: "Water pressure P", ja: "水圧 P", es: "Presión del agua P", "pt-BR": "Pressão da água P", de: "Wasserdruck P", fr: "Pression de l'eau P" }, expression: "ρ*g*h", targetUnit: "kPa", formulaLatex: "P = \\rho g h" }],
  },
  {
    title: { en: "Converting atmospheric pressure units (hPa, Pa, atm)", ja: "大気圧の単位換算（hPa・Pa・atm）", es: "Conversión de unidades de presión atmosférica (hPa, Pa, atm)", "pt-BR": "Conversão de unidades de pressão atmosférica (hPa, Pa, atm)", de: "Umrechnung von Luftdruckeinheiten (hPa, Pa, atm)", fr: "Conversion des unités de pression atmosphérique (hPa, Pa, atm)" },
    description: { en: "Express the familiar weather-forecast value of 1013hPa in pascals and in standard atmospheres.", ja: "天気予報でおなじみの1013hPaを、パスカルと気圧（atm）で表します。", es: "Expresa el conocido valor de 1013hPa de la previsión meteorológica en pascales y en atmósferas.", "pt-BR": "Expresse o conhecido valor de 1013hPa da previsão do tempo em pascals e em atmosferas.", de: "Der aus der Wettervorhersage bekannte Wert von 1013hPa wird in Pascal und in (physikalischen) Atmosphären ausgedrückt.", fr: "Exprime la valeur bien connue de 1013hPa des prévisions météo en pascals et en atmosphères." },
    localConstants: [{ symbol: "P", expression: "1013hPa" }],
    steps: [
      { title: { en: "Convert to pascals", ja: "パスカルに変換", es: "Convertir a pascales", "pt-BR": "Converter para pascals", de: "In Pascal umrechnen", fr: "Convertir en pascals" }, expression: "P", targetUnit: "Pa", formulaLatex: "P" },
      { title: { en: "Convert to standard atmospheres", ja: "気圧(atm)に変換", es: "Convertir a atmósferas", "pt-BR": "Converter para atmosferas", de: "In (physikalische) Atmosphären umrechnen", fr: "Convertir en atmosphères" }, expression: "P", targetUnit: "atm", formulaLatex: "P" },
    ],
  },
  {
    title: { en: "Buoyant force (Archimedes' principle)", ja: "浮力（アルキメデスの原理）", es: "Fuerza de flotación (principio de Arquímedes)", "pt-BR": "Força de flutuação (princípio de Arquimedes)", de: "Auftriebskraft (archimedisches Prinzip)", fr: "Poussée d'Archimède" },
    description: { en: "Compute the buoyant force on an object—the weight of the water it displaces—from the submerged volume.", ja: "水中に沈んだ部分の体積から、物体が受ける浮力（押しのけた水の重さ）を求めます。", es: "Calcula la fuerza de flotación sobre un objeto —el peso del agua que desplaza— a partir del volumen sumergido.", "pt-BR": "Calcule a força de flutuação sobre um objeto — o peso da água que ele desloca — a partir do volume submerso.", de: "Berechne die Auftriebskraft auf einen Körper – das Gewicht des von ihm verdrängten Wassers – aus dem eingetauchten Volumen.", fr: "Calcule la poussée d'Archimède exercée sur un objet — le poids de l'eau qu'il déplace — à partir du volume immergé." },
    localConstants: [
      { symbol: "ρ", expression: "1000kg/m³" },
      { symbol: "V", expression: "0.002m³" },
      { symbol: "g", expression: "9.8m/s²" },
    ],
    steps: [{ title: { en: "Buoyant force F", ja: "浮力 F", es: "Fuerza de flotación F", "pt-BR": "Força de flutuação F", de: "Auftriebskraft F", fr: "Poussée d'Archimède F" }, expression: "ρ*V*g", targetUnit: "N", formulaLatex: "F_b = \\rho V g" }],
  },
];

/** 理科「力・仕事・てこ」。重さと質量・フックの法則・仕事の原理・てこのつり合いをまとめている。 */
export const SCIENCE_FORCE_WORK_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Weight and mass (W=mg)", ja: "重さと質量（W=mg）", es: "Peso y masa (W=mg)", "pt-BR": "Peso e massa (W=mg)", de: "Gewicht und Masse (W=mg)", fr: "Poids et masse (W=mg)" },
    description: { en: "Compute the weight (gravitational force) of a 100g object. The result should be about 0.98N.", ja: "質量100gの物体にはたらく重力（重さ）を求めます。100gの物体はおよそ0.98Nになります。", es: "Calcula el peso (fuerza de la gravedad) de un objeto de 100g. El resultado debería ser de aproximadamente 0,98N.", "pt-BR": "Calcule o peso (força da gravidade) de um objeto de 100g. O resultado deve ser de aproximadamente 0,98N.", de: "Berechne das Gewicht (die Gewichtskraft) eines 100g schweren Objekts. Das Ergebnis sollte etwa 0,98N betragen.", fr: "Calcule le poids (force de gravité) d'un objet de 100g. Le résultat devrait être d'environ 0,98N." },
    localConstants: [
      { symbol: "m", expression: "100g" },
      { symbol: "g", expression: "9.8m/s²" },
    ],
    steps: [{ title: { en: "Weight W", ja: "重さ W", es: "Peso W", "pt-BR": "Peso W", de: "Gewicht W", fr: "Poids W" }, expression: "m*g", targetUnit: "N", formulaLatex: "W = mg" }],
  },
  {
    title: { en: "Hooke's law (spring extension)", ja: "フックの法則（ばねの伸び）", es: "Ley de Hooke (elongación de un resorte)", "pt-BR": "Lei de Hooke (deformação de uma mola)", de: "Hookesches Gesetz (Federverlängerung)", fr: "Loi de Hooke (allongement d'un ressort)" },
    description: { en: "Compute the extension of a spring from its spring constant and the applied force.", ja: "ばね定数と加えた力から、ばねの伸びを求めます。", es: "Calcula la elongación de un resorte a partir de su constante elástica y la fuerza aplicada.", "pt-BR": "Calcule a deformação de uma mola a partir de sua constante elástica e da força aplicada.", de: "Berechne die Verlängerung einer Feder aus ihrer Federkonstante und der einwirkenden Kraft.", fr: "Calcule l'allongement d'un ressort à partir de sa constante de raideur et de la force appliquée." },
    localConstants: [
      { symbol: "k", expression: "50N/m" },
      { symbol: "F", expression: "2N" },
    ],
    steps: [{ title: { en: "Extension x", ja: "伸び x", es: "Elongación x", "pt-BR": "Deformação x", de: "Verlängerung x", fr: "Allongement x" }, expression: "F/k", targetUnit: "cm", formulaLatex: "x = \\dfrac{F}{k}" }],
  },
  {
    title: { en: "Work and power", ja: "仕事と仕事率", es: "Trabajo y potencia", "pt-BR": "Trabalho e potência", de: "Arbeit und Leistung", fr: "Travail et puissance" },
    description: { en: "Compute the work done from force and distance, then compute the power from the time it took.", ja: "力と移動距離から仕事を求め、それにかかった時間から仕事率を求めます。", es: "Calcula el trabajo realizado a partir de la fuerza y la distancia, y luego calcula la potencia a partir del tiempo empleado.", "pt-BR": "Calcule o trabalho realizado a partir da força e da distância, e depois calcule a potência a partir do tempo gasto.", de: "Berechne die verrichtete Arbeit aus Kraft und Strecke und daraus mit der benötigten Zeit die Leistung.", fr: "Calcule le travail effectué à partir de la force et de la distance, puis calcule la puissance à partir du temps mis." },
    localConstants: [
      { symbol: "F", expression: "20N" },
      { symbol: "d", expression: "3m" },
      { symbol: "t", expression: "5s" },
    ],
    steps: [
      { title: { en: "Work W", ja: "仕事 W", es: "Trabajo W", "pt-BR": "Trabalho W", de: "Arbeit W", fr: "Travail W" }, expression: "F*d", targetUnit: "J", formulaLatex: "W = Fd" },
      { title: { en: "Power P", ja: "仕事率 P", es: "Potencia P", "pt-BR": "Potência P", de: "Leistung P", fr: "Puissance P" }, expression: "s1/t", targetUnit: "W", formulaLatex: "P = \\dfrac{W}{t}" },
    ],
  },
  {
    title: { en: "Movable pulley and the principle of work", ja: "動滑車と仕事の原理", es: "Polea móvil y el principio del trabajo", "pt-BR": "Polia móvel e o princípio dos trabalhos", de: "Lose Rolle und das Prinzip der Arbeit", fr: "Poulie mobile et le principe des travaux" },
    description: { en: "A movable pulley halves the force needed but doubles the length of rope pulled, so the total work done stays the same.", ja: "動滑車を使うと必要な力は半分になりますが、引くひもの長さは2倍になり、仕事の総量は変わらないことを確かめます。", es: "Una polea móvil reduce a la mitad la fuerza necesaria, pero duplica la longitud de cuerda que hay que tirar, por lo que el trabajo total no cambia.", "pt-BR": "Uma polia móvel reduz a força necessária pela metade, mas dobra o comprimento da corda puxada, de modo que o trabalho total permanece o mesmo.", de: "Eine lose Rolle halbiert die benötigte Kraft, verdoppelt aber die Länge des gezogenen Seils, sodass die insgesamt verrichtete Arbeit gleich bleibt.", fr: "Une poulie mobile réduit de moitié la force nécessaire, mais double la longueur de corde à tirer, si bien que le travail total reste le même." },
    localConstants: [
      { symbol: "F", expression: "60N" },
      { symbol: "d", expression: "2m" },
    ],
    steps: [
      { title: { en: "Work lifting directly W", ja: "直接持ち上げる仕事 W", es: "Trabajo al levantar directamente W", "pt-BR": "Trabalho ao levantar diretamente W", de: "Arbeit beim direkten Heben W", fr: "Travail en soulevant directement W" }, expression: "F*d", targetUnit: "J", formulaLatex: "W = Fd" },
      { title: { en: "Force needed with a movable pulley", ja: "動滑車で必要な力", es: "Fuerza necesaria con una polea móvil", "pt-BR": "Força necessária com uma polia móvel", de: "Benötigte Kraft mit einer losen Rolle", fr: "Force nécessaire avec une poulie mobile" }, expression: "F/2", targetUnit: "N", formulaLatex: "F_{pull} = \\dfrac{F}{2}" },
      { title: { en: "Length of rope pulled", ja: "引くひもの長さ", es: "Longitud de cuerda tirada", "pt-BR": "Comprimento da corda puxada", de: "Länge des gezogenen Seils", fr: "Longueur de corde tirée" }, expression: "d*2", targetUnit: "m", formulaLatex: "d_{pull} = 2d" },
      { title: { en: "Work done using the pulley", ja: "動滑車を使った仕事", es: "Trabajo realizado usando la polea", "pt-BR": "Trabalho realizado usando a polia", de: "Mit der Rolle verrichtete Arbeit", fr: "Travail effectué avec la poulie" }, expression: "s2*s3", targetUnit: "J", formulaLatex: "W_{pull} = F_{pull} \\cdot d_{pull}" },
    ],
  },
  {
    title: { en: "Lever equilibrium", ja: "てこのつり合い", es: "Equilibrio de la palanca", "pt-BR": "Equilíbrio da alavanca", de: "Hebelgleichgewicht", fr: "Équilibre du levier" },
    description: { en: "Using the lever equilibrium equation, compute the force needed on one side from the distances and the force on the other side.", ja: "支点からの距離と一方の力から、もう一方に必要な力を、てこのつり合いの式から求めます。", es: "Usando la ecuación de equilibrio de la palanca, calcula la fuerza necesaria en un lado a partir de las distancias y la fuerza en el otro lado.", "pt-BR": "Usando a equação de equilíbrio da alavanca, calcule a força necessária em um lado a partir das distâncias e da força no outro lado.", de: "Mithilfe der Gleichgewichtsbedingung des Hebels wird aus den Abständen und der Kraft auf der einen Seite die benötigte Kraft auf der anderen Seite berechnet.", fr: "À l'aide de l'équation d'équilibre du levier, calcule la force nécessaire d'un côté à partir des distances et de la force de l'autre côté." },
    localConstants: [
      { symbol: "F₁", expression: "30N" },
      { symbol: "L₁", expression: "0.6m" },
      { symbol: "L₂", expression: "0.2m" },
    ],
    steps: [{ title: { en: "Required force F2", ja: "必要な力 F2", es: "Fuerza necesaria F2", "pt-BR": "Força necessária F2", de: "Benötigte Kraft F2", fr: "Force nécessaire F2" }, expression: "F₁*L₁/L₂", targetUnit: "N", formulaLatex: "F_2 = F_1\\dfrac{L_1}{L_2}" }],
  },
  {
    title: { en: "Work on an inclined plane (the principle of work)", ja: "斜面を使った仕事（仕事の原理）", es: "Trabajo en un plano inclinado (el principio del trabajo)", "pt-BR": "Trabalho em um plano inclinado (o princípio dos trabalhos)", de: "Arbeit auf einer schiefen Ebene (das Prinzip der Arbeit)", fr: "Travail sur un plan incliné (le principe des travaux)" },
    description: { en: "Compute the work needed to lift a 5kg object 2m straight up, then find the force needed to push it up a 5m-long ramp instead—the work stays the same.", ja: "質量5kgの物体を高さ2mまで持ち上げる仕事を求め、長さ5mの斜面を使う場合に必要な力を求めます。仕事の量は変わりません。", es: "Calcula el trabajo necesario para levantar un objeto de 5kg 2m en línea recta hacia arriba, y luego halla la fuerza necesaria para empujarlo por una rampa de 5m de longitud: el trabajo no cambia.", "pt-BR": "Calcule o trabalho necessário para levantar um objeto de 5kg 2m na vertical, e depois encontre a força necessária para empurrá-lo por uma rampa de 5m de comprimento: o trabalho permanece o mesmo.", de: "Berechne die Arbeit, die nötig ist, um ein 5kg schweres Objekt 2m senkrecht anzuheben, und ermittle dann die Kraft, die nötig ist, um es stattdessen eine 5m lange Rampe hinaufzuschieben – die Arbeit bleibt gleich.", fr: "Calcule le travail nécessaire pour soulever un objet de 5kg de 2m à la verticale, puis détermine la force nécessaire pour le pousser sur une rampe de 5m de long : le travail reste le même." },
    localConstants: [
      { symbol: "m", expression: "5kg" },
      { symbol: "g", expression: "9.8m/s²" },
      { symbol: "h", expression: "2m" },
      { symbol: "L", expression: "5m" },
    ],
    steps: [
      { title: { en: "Work lifting directly W", ja: "直接持ち上げる仕事 W", es: "Trabajo al levantar directamente W", "pt-BR": "Trabalho ao levantar diretamente W", de: "Arbeit beim direkten Heben W", fr: "Travail en soulevant directement W" }, expression: "m*g*h", targetUnit: "J", formulaLatex: "W = mgh" },
      { title: { en: "Force needed along the ramp F", ja: "斜面に沿って引く力 F", es: "Fuerza necesaria a lo largo de la rampa F", "pt-BR": "Força necessária ao longo da rampa F", de: "Entlang der Rampe benötigte Kraft F", fr: "Force nécessaire le long de la rampe F" }, expression: "s1/L", targetUnit: "N", formulaLatex: "F = \\dfrac{W}{L}" },
    ],
  },
];

/** 理科「熱・温度」。熱量の計算・電熱線の発熱・カロリーとの換算・混合後の温度をまとめている。 */
export const SCIENCE_HEAT_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Heat quantity Q=mcΔT", ja: "熱量 Q=mcΔT", es: "Cantidad de calor Q=mcΔT", "pt-BR": "Quantidade de calor Q=mcΔT", de: "Wärmemenge Q=mcΔT", fr: "Quantité de chaleur Q=mcΔT" },
    description: { en: "Compute the heat absorbed by water from its mass, specific heat, and temperature change. Water's specific heat is 4.2J/(g·K).", ja: "水の質量・比熱・温度変化から、水が得た熱量を求めます。水の比熱は4.2J/(g・K)です。", es: "Calcula el calor absorbido por el agua a partir de su masa, su calor específico y el cambio de temperatura. El calor específico del agua es 4,2J/(g·K).", "pt-BR": "Calcule o calor absorvido pela água a partir de sua massa, seu calor específico e a variação de temperatura. O calor específico da água é 4,2J/(g·K).", de: "Berechne die von Wasser aufgenommene Wärme aus seiner Masse, seiner spezifischen Wärmekapazität und der Temperaturänderung. Die spezifische Wärmekapazität von Wasser beträgt 4,2J/(g·K).", fr: "Calcule la chaleur absorbée par l'eau à partir de sa masse, de sa chaleur massique et de la variation de température. La chaleur massique de l'eau est de 4,2J/(g·K)." },
    localConstants: [
      { symbol: "m", expression: "200g" },
      { symbol: "c", expression: "4.2J/(g*K)" },
      { symbol: "ΔT", expression: "30K" },
    ],
    steps: [{ title: { en: "Heat Q", ja: "熱量 Q", es: "Calor Q", "pt-BR": "Calor Q", de: "Wärme Q", fr: "Chaleur Q" }, expression: "m*c*ΔT", targetUnit: "kJ", formulaLatex: "Q = mc\\Delta T" }],
  },
  {
    title: { en: "Heat from a resistance wire Q=VIt", ja: "電熱線の発熱 Q=VIt", es: "Calor de un hilo resistivo Q=VIt", "pt-BR": "Calor de um fio resistivo Q=VIt", de: "Wärme eines Heizdrahts Q=VIt", fr: "Chaleur d'un fil résistif Q=VIt" },
    description: { en: "Compute the heat generated by a resistance wire from the voltage, current, and time it is energized.", ja: "電圧・電流・通電時間から、電熱線が発生する熱量を求めます。", es: "Calcula el calor generado por un hilo resistivo a partir del voltaje, la corriente y el tiempo que está conectado.", "pt-BR": "Calcule o calor gerado por um fio resistivo a partir da tensão, da corrente e do tempo em que fica ligado.", de: "Berechne die von einem Heizdraht erzeugte Wärme aus der Spannung, der Stromstärke und der Zeit, in der er bestromt wird.", fr: "Calcule la chaleur produite par un fil résistif à partir de la tension, du courant et de la durée du passage du courant." },
    localConstants: [
      { symbol: "V", expression: "6V" },
      { symbol: "I", expression: "1.5A" },
      { symbol: "t", expression: "300s" },
    ],
    steps: [{ title: { en: "Heat Q", ja: "熱量 Q", es: "Calor Q", "pt-BR": "Calor Q", de: "Wärme Q", fr: "Chaleur Q" }, expression: "V*I*t", targetUnit: "kJ", formulaLatex: "Q = VIt" }],
  },
  {
    title: { en: "Converting between joules and calories", ja: "熱量とカロリーの換算", es: "Conversión entre julios y calorías", "pt-BR": "Conversão entre joules e calorias", de: "Umrechnung zwischen Joule und Kalorien", fr: "Conversion entre joules et calories" },
    description: { en: "Express a heat quantity of 250cal in both joules and kilocalories.", ja: "250calの熱量を、ジュールとキロカロリーのそれぞれで表します。", es: "Expresa una cantidad de calor de 250cal en julios y en kilocalorías.", "pt-BR": "Expresse uma quantidade de calor de 250cal em joules e em quilocalorias.", de: "Eine Wärmemenge von 250cal wird in Joule und in Kilokalorien ausgedrückt.", fr: "Exprime une quantité de chaleur de 250cal en joules et en kilocalories." },
    localConstants: [{ symbol: "Q", expression: "250cal" }],
    steps: [
      { title: { en: "Convert to joules", ja: "ジュールに変換", es: "Convertir a julios", "pt-BR": "Converter para joules", de: "In Joule umrechnen", fr: "Convertir en joules" }, expression: "Q", targetUnit: "J", formulaLatex: "Q" },
      { title: { en: "Convert to kilocalories", ja: "キロカロリーに変換", es: "Convertir a kilocalorías", "pt-BR": "Converter para quilocalorias", de: "In Kilokalorien umrechnen", fr: "Convertir en kilocalories" }, expression: "Q", targetUnit: "kcal", formulaLatex: "Q" },
    ],
  },
  {
    title: { en: "Converting between Celsius and Kelvin", ja: "セ氏とケルビンの換算", es: "Conversión entre grados Celsius y kelvin", "pt-BR": "Conversão entre graus Celsius e kelvin", de: "Umrechnung zwischen Celsius und Kelvin", fr: "Conversion entre degrés Celsius et kelvin" },
    description: { en: "Convert an air temperature of 20°C to the Kelvin (absolute) scale.", ja: "20℃の気温を、絶対温度（ケルビン）に換算します。", es: "Convierte una temperatura del aire de 20°C a la escala Kelvin (absoluta).", "pt-BR": "Converta uma temperatura do ar de 20°C para a escala Kelvin (absoluta).", de: "Eine Lufttemperatur von 20°C wird in die Kelvin-Skala (absolute Temperatur) umgerechnet.", fr: "Convertis une température de l'air de 20°C dans l'échelle Kelvin (température absolue)." },
    localConstants: [{ symbol: "T", expression: "20°C" }],
    steps: [{ title: { en: "Absolute temperature T", ja: "絶対温度 T", es: "Temperatura absoluta T", "pt-BR": "Temperatura absoluta T", de: "Absolute Temperatur T", fr: "Température absolue T" }, expression: "T", targetUnit: "K", formulaLatex: "T_K = T_C + 273.15" }],
  },
  {
    title: { en: "Temperature after mixing hot and cold water (conservation of heat)", ja: "湯と水を混ぜたときの温度（熱量保存）", es: "Temperatura tras mezclar agua caliente y fría (conservación del calor)", "pt-BR": "Temperatura após misturar água quente e fria (conservação do calor)", de: "Temperatur nach dem Mischen von warmem und kaltem Wasser (Wärmeausgleich)", fr: "Température après le mélange d'eau chaude et froide (conservation de la chaleur)" },
    description: { en: "Mix 200g of 80°C hot water with 300g of 20°C cold water. Use conservation of heat to find the resulting temperature.", ja: "80℃のお湯200gと20℃の水300gを混ぜたとき、熱量保存の法則から混合後の温度を求めます。", es: "Mezcla 200g de agua caliente a 80°C con 300g de agua fría a 20°C. Usa la conservación del calor para hallar la temperatura resultante.", "pt-BR": "Misture 200g de água quente a 80°C com 300g de água fria a 20°C. Use a conservação do calor para encontrar a temperatura resultante.", de: "200g heißes Wasser mit 80°C werden mit 300g kaltem Wasser mit 20°C gemischt. Mithilfe des Wärmeausgleichs wird die entstehende Temperatur bestimmt.", fr: "Mélange 200g d'eau chaude à 80°C avec 300g d'eau froide à 20°C. Utilise la conservation de la chaleur pour trouver la température finale." },
    localConstants: [
      { symbol: "m₁", expression: "200g" },
      { symbol: "T₁", expression: "80°C" },
      { symbol: "m₂", expression: "300g" },
      { symbol: "T₂", expression: "20°C" },
    ],
    steps: [{ title: { en: "Resulting temperature Tf", ja: "混合後の温度 Tf", es: "Temperatura resultante Tf", "pt-BR": "Temperatura resultante Tf", de: "Resultierende Temperatur Tf", fr: "Température finale Tf" }, expression: "(m₁*T₁+m₂*T₂)/(m₁+m₂)", targetUnit: "°C", formulaLatex: "T_f = \\dfrac{m_1T_1+m_2T_2}{m_1+m_2}" }],
  },
];

/** 理科「電気・回路」。オームの法則・直列/並列回路・電力と電力量をまとめている。 */
export const SCIENCE_ELECTRICITY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Ohm's law (resistance, current, and voltage)", ja: "オームの法則（抵抗・電流・電圧の関係）", es: "Ley de Ohm (resistencia, corriente y voltaje)", "pt-BR": "Lei de Ohm (resistência, corrente e tensão)", de: "Ohmsches Gesetz (Widerstand, Stromstärke und Spannung)", fr: "Loi d'Ohm (résistance, courant et tension)" },
    description: { en: "Find the resistance of a resistor with 6V across it and 0.3A through it, then use that resistance to find the current and voltage in other conditions.", ja: "電圧6V・電流0.3Aの抵抗器の抵抗を求め、その抵抗を使って別の条件での電流・電圧を求めます。", es: "Halla la resistencia de una resistencia con 6V en sus extremos y 0,3A circulando por ella, y usa esa resistencia para hallar la corriente y el voltaje en otras condiciones.", "pt-BR": "Encontre a resistência de um resistor com 6V em seus terminais e 0,3A passando por ele, e use essa resistência para encontrar a corrente e a tensão em outras condições.", de: "Bestimme den Widerstand eines Widerstands, an dem 6V anliegen und durch den 0,3A fließen, und berechne damit Stromstärke und Spannung unter anderen Bedingungen.", fr: "Détermine la résistance d'une résistance soumise à une tension de 6V et traversée par un courant de 0,3A, puis utilise cette résistance pour trouver le courant et la tension dans d'autres conditions." },
    formulas: [
      { explanation: { en: "Voltage equals current multiplied by resistance.", ja: "電圧は、電流と抵抗をかけて求めます。", es: "El voltaje es igual a la corriente multiplicada por la resistencia.", "pt-BR": "A tensão é igual à corrente multiplicada pela resistência.", de: "Die Spannung ergibt sich aus der Stromstärke multipliziert mit dem Widerstand.", fr: "La tension est égale au courant multiplié par la résistance." }, latex: "V = IR" },
      { explanation: { en: "Resistance equals voltage divided by current.", ja: "抵抗は、電圧を電流で割って求めます。", es: "La resistencia es igual al voltaje dividido entre la corriente.", "pt-BR": "A resistência é igual à tensão dividida pela corrente.", de: "Der Widerstand ergibt sich aus der Spannung geteilt durch die Stromstärke.", fr: "La résistance est égale à la tension divisée par le courant." }, latex: "R = \\dfrac{V}{I}" },
      { explanation: { en: "Current equals voltage divided by resistance.", ja: "電流は、電圧を抵抗で割って求めます。", es: "La corriente es igual al voltaje dividido entre la resistencia.", "pt-BR": "A corrente é igual à tensão dividida pela resistência.", de: "Die Stromstärke ergibt sich aus der Spannung geteilt durch den Widerstand.", fr: "Le courant est égal à la tension divisée par la résistance." }, latex: "I = \\dfrac{V}{R}" },
    ],
    localConstants: [
      { symbol: "V", expression: "6V" },
      { symbol: "I", expression: "0.3A" },
      { symbol: "I₂", expression: "0.5A" },
      { symbol: "V₃", expression: "15V" },
    ],
    steps: [
      { title: { en: "Resistance R", ja: "抵抗 R", es: "Resistencia R", "pt-BR": "Resistência R", de: "Widerstand R", fr: "Résistance R" }, expression: "V/I", targetUnit: "Ohm", formulaLatex: "R = \\dfrac{V}{I}", resultSymbol: "R" },
      { title: { en: "Voltage V2 when the current is I₂", ja: "電流 I₂ のときの電圧 V2", es: "Voltaje V2 cuando la corriente es I₂", "pt-BR": "Tensão V2 quando a corrente é I₂", de: "Spannung V2 bei einer Stromstärke von I₂", fr: "Tension V2 lorsque le courant vaut I₂" }, expression: "I₂*R", targetUnit: "V", formulaLatex: "V_2 = I_2 R" },
      { title: { en: "Current I3 when the voltage is V₃", ja: "電圧 V₃ のときの電流 I3", es: "Corriente I3 cuando el voltaje es V₃", "pt-BR": "Corrente I3 quando a tensão é V₃", de: "Stromstärke I3 bei einer Spannung von V₃", fr: "Courant I3 lorsque la tension vaut V₃" }, expression: "V₃/R", targetUnit: "A", formulaLatex: "I_3 = \\dfrac{V_3}{R}" },
    ],
  },
  {
    title: { en: "Combined resistance in a series circuit", ja: "直列回路の合成抵抗", es: "Resistencia equivalente en un circuito en serie", "pt-BR": "Resistência equivalente em um circuito em série", de: "Ersatzwiderstand in einer Reihenschaltung", fr: "Résistance équivalente dans un circuit en série" },
    description: { en: "Compute the combined resistance when two resistors are connected in series.", ja: "2つの抵抗を直列につないだときの、合成抵抗を求めます。", es: "Calcula la resistencia equivalente cuando dos resistencias se conectan en serie.", "pt-BR": "Calcule a resistência equivalente quando dois resistores são conectados em série.", de: "Berechne den Ersatzwiderstand, wenn zwei Widerstände in Reihe geschaltet werden.", fr: "Calcule la résistance équivalente lorsque deux résistances sont connectées en série." },
    localConstants: [
      { symbol: "R₁", expression: "10Ohm" },
      { symbol: "R₂", expression: "15Ohm" },
    ],
    steps: [{ title: { en: "Combined resistance R", ja: "合成抵抗 R", es: "Resistencia equivalente R", "pt-BR": "Resistência equivalente R", de: "Ersatzwiderstand R", fr: "Résistance équivalente R" }, expression: "R₁+R₂", targetUnit: "Ohm", formulaLatex: "R = R_1 + R_2" }],
  },
  {
    title: { en: "Combined resistance in a parallel circuit", ja: "並列回路の合成抵抗", es: "Resistencia equivalente en un circuito en paralelo", "pt-BR": "Resistência equivalente em um circuito em paralelo", de: "Ersatzwiderstand in einer Parallelschaltung", fr: "Résistance équivalente dans un circuit en parallèle" },
    description: { en: "Compute the combined resistance when two resistors are connected in parallel.", ja: "2つの抵抗を並列につないだときの、合成抵抗を求めます。", es: "Calcula la resistencia equivalente cuando dos resistencias se conectan en paralelo.", "pt-BR": "Calcule a resistência equivalente quando dois resistores são conectados em paralelo.", de: "Berechne den Ersatzwiderstand, wenn zwei Widerstände parallel geschaltet werden.", fr: "Calcule la résistance équivalente lorsque deux résistances sont connectées en parallèle." },
    localConstants: [
      { symbol: "R₁", expression: "10Ohm" },
      { symbol: "R₂", expression: "15Ohm" },
    ],
    steps: [{ title: { en: "Combined resistance R", ja: "合成抵抗 R", es: "Resistencia equivalente R", "pt-BR": "Resistência equivalente R", de: "Ersatzwiderstand R", fr: "Résistance équivalente R" }, expression: "(1/R₁+1/R₂)^-1", targetUnit: "Ohm", formulaLatex: "R = \\left(\\dfrac{1}{R_1} + \\dfrac{1}{R_2}\\right)^{-1}" }],
  },
  {
    title: { en: "Electric power P=VI", ja: "電力 P=VI", es: "Potencia eléctrica P=VI", "pt-BR": "Potência elétrica P=VI", de: "Elektrische Leistung P=VI", fr: "Puissance électrique P=VI" },
    description: { en: "Compute the electric power consumed by an appliance from its voltage and current.", ja: "電圧と電流から、電気器具が消費する電力を求めます。", es: "Calcula la potencia eléctrica consumida por un aparato a partir de su voltaje y su corriente.", "pt-BR": "Calcule a potência elétrica consumida por um aparelho a partir de sua tensão e corrente.", de: "Berechne die von einem Gerät aufgenommene elektrische Leistung aus seiner Spannung und Stromstärke.", fr: "Calcule la puissance électrique consommée par un appareil à partir de sa tension et de son courant." },
    localConstants: [
      { symbol: "V", expression: "100V" },
      { symbol: "I", expression: "6A" },
    ],
    steps: [{ title: { en: "Power P", ja: "電力 P", es: "Potencia P", "pt-BR": "Potência P", de: "Leistung P", fr: "Puissance P" }, expression: "V*I", targetUnit: "W", formulaLatex: "P = VI" }],
  },
  {
    title: { en: "Energy consumption and electricity cost (kWh and cost)", ja: "電力量と電気代（kWhと電気代）", es: "Consumo de energía y coste eléctrico (kWh y coste)", "pt-BR": "Consumo de energia e custo de eletricidade (kWh e custo)", de: "Energieverbrauch und Stromkosten (kWh und Kosten)", fr: "Consommation d'énergie et coût de l'électricité (kWh et coût)" },
    description: { en: "Compute the energy consumed and its cost from the power rating, usage time, and price per kWh.", ja: "消費電力・使用時間・電力量単価から、使用した電力量と電気代を求めます。", es: "Calcula la energía consumida y su coste a partir de la potencia nominal, el tiempo de uso y el precio por kWh.", "pt-BR": "Calcule a energia consumida e seu custo a partir da potência nominal, do tempo de uso e do preço por kWh.", de: "Berechne den Energieverbrauch und die Kosten aus der Leistungsaufnahme, der Nutzungsdauer und dem Preis pro kWh.", fr: "Calcule l'énergie consommée et son coût à partir de la puissance nominale, du temps d'utilisation et du prix par kWh." },
    localConstants: [
      { symbol: "P", expression: "1000W" },
      { symbol: "t", expression: "2h" },
      { symbol: "rate", expression: "30" },
    ],
    steps: [
      { title: { en: "Energy used E", ja: "使用電力量 E", es: "Energía utilizada E", "pt-BR": "Energia utilizada E", de: "Verbrauchte Energie E", fr: "Énergie utilisée E" }, expression: "P*t", targetUnit: "kWh", formulaLatex: "E = Pt" },
      { title: { en: "Cost", ja: "電気代", es: "Coste", "pt-BR": "Custo", de: "Kosten", fr: "Coût" }, expression: "(s1/1kWh)*rate", targetUnit: "", formulaLatex: "\\text{cost} = \\dfrac{E}{1\\text{kWh}} \\times \\text{rate}" },
    ],
  },
];

/** 理科「光・音」。音の速さ・波の基本式・凸レンズ・光の反射をまとめている。 */
export const SCIENCE_LIGHT_SOUND_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Finding distance from the speed of sound (lightning to thunder)", ja: "音の速さで距離を求める（雷が光ってから音まで）", es: "Cálculo de la distancia con la velocidad del sonido (del relámpago al trueno)", "pt-BR": "Cálculo da distância com a velocidade do som (do relâmpago ao trovão)", de: "Entfernungsbestimmung über die Schallgeschwindigkeit (vom Blitz zum Donner)", fr: "Calcul de la distance à partir de la vitesse du son (de l'éclair au tonnerre)" },
    description: { en: "Estimate the distance to a lightning strike from the time between seeing the flash and hearing the thunder.", ja: "雷が光ってから雷鳴が聞こえるまでの時間から、雷までのおよその距離を求めます。", es: "Estima la distancia hasta un rayo a partir del tiempo transcurrido entre ver el relámpago y oír el trueno.", "pt-BR": "Estime a distância até um raio a partir do tempo entre ver o relâmpago e ouvir o trovão.", de: "Die Entfernung zu einem Blitzeinschlag wird aus der Zeit zwischen dem Sehen des Blitzes und dem Hören des Donners geschätzt.", fr: "Estime la distance jusqu'à un éclair à partir du temps écoulé entre le moment où on le voit et celui où on entend le tonnerre." },
    localConstants: [
      { symbol: "v", expression: "340m/s" },
      { symbol: "t", expression: "3s" },
    ],
    steps: [{ title: { en: "Distance d", ja: "距離 d", es: "Distancia d", "pt-BR": "Distância d", de: "Entfernung d", fr: "Distance d" }, expression: "v*t", targetUnit: "m", formulaLatex: "d = vt" }],
  },
  {
    title: { en: "Speed of sound v=fλ", ja: "音の速さ v=fλ", es: "Velocidad del sonido v=fλ", "pt-BR": "Velocidade do som v=fλ", de: "Schallgeschwindigkeit v=fλ", fr: "Vitesse du son v=fλ" },
    description: { en: "Compute the wavelength of a sound from its speed and frequency.", ja: "音の速さと振動数から、波長を求めます。", es: "Calcula la longitud de onda de un sonido a partir de su velocidad y su frecuencia.", "pt-BR": "Calcule o comprimento de onda de um som a partir de sua velocidade e frequência.", de: "Berechne die Wellenlänge eines Schalls aus seiner Geschwindigkeit und seiner Frequenz.", fr: "Calcule la longueur d'onde d'un son à partir de sa vitesse et de sa fréquence." },
    localConstants: [
      { symbol: "v", expression: "340m/s" },
      { symbol: "f", expression: "440Hz" },
    ],
    steps: [{ title: { en: "Wavelength λ", ja: "波長 λ", es: "Longitud de onda λ", "pt-BR": "Comprimento de onda λ", de: "Wellenlänge λ", fr: "Longueur d'onde λ" }, expression: "v/f", targetUnit: "m", formulaLatex: "\\lambda = \\dfrac{v}{f}" }],
  },
  {
    title: { en: "Frequency and wavelength of a vibrating string", ja: "弦の振動数と波長", es: "Frecuencia y longitud de onda de una cuerda vibrante", "pt-BR": "Frequência e comprimento de onda de uma corda vibrante", de: "Frequenz und Wellenlänge einer schwingenden Saite", fr: "Fréquence et longueur d'onde d'une corde vibrante" },
    description: { en: "Compute the frequency of a vibrating string from the wave speed and wavelength.", ja: "弦を伝わる波の速さと波長から、弦の振動数を求めます。", es: "Calcula la frecuencia de una cuerda vibrante a partir de la velocidad de la onda y la longitud de onda.", "pt-BR": "Calcule a frequência de uma corda vibrante a partir da velocidade da onda e do comprimento de onda.", de: "Berechne die Frequenz einer schwingenden Saite aus der Wellengeschwindigkeit und der Wellenlänge.", fr: "Calcule la fréquence d'une corde vibrante à partir de la vitesse de l'onde et de la longueur d'onde." },
    localConstants: [
      { symbol: "v", expression: "120m/s" },
      { symbol: "λ", expression: "0.6m" },
    ],
    steps: [{ title: { en: "Frequency f", ja: "振動数 f", es: "Frecuencia f", "pt-BR": "Frequência f", de: "Frequenz f", fr: "Fréquence f" }, expression: "v/λ", targetUnit: "Hz", formulaLatex: "f = \\dfrac{v}{\\lambda}" }],
  },
  {
    title: { en: "Convex lens (image position and magnification)", ja: "凸レンズ（像の位置と倍率）", es: "Lente convexa (posición de la imagen y aumento)", "pt-BR": "Lente convexa (posição da imagem e ampliação)", de: "Sammellinse (Bildposition und Vergrößerung)", fr: "Lentille convergente (position de l'image et grandissement)" },
    description: { en: "Find the image position and magnification for an object placed 20cm in front of a convex lens with a 15cm focal length.", ja: "焦点距離15cmの凸レンズの前方20cmに物体を置いたときの、像の位置と倍率を求めます。", es: "Halla la posición de la imagen y el aumento para un objeto colocado a 20cm delante de una lente convexa con una distancia focal de 15cm.", "pt-BR": "Encontre a posição da imagem e a ampliação de um objeto colocado a 20cm na frente de uma lente convexa com distância focal de 15cm.", de: "Bestimme die Bildposition und die Vergrößerung für einen Gegenstand, der 20cm vor einer Sammellinse mit 15cm Brennweite steht.", fr: "Détermine la position de l'image et le grandissement pour un objet placé à 20cm devant une lentille convergente de 15cm de distance focale." },
    localConstants: [
      { symbol: "f", expression: "15cm" },
      { symbol: "a", expression: "20cm" },
    ],
    steps: [
      { title: { en: "Image position b", ja: "像の位置 b", es: "Posición de la imagen b", "pt-BR": "Posição da imagem b", de: "Bildposition b", fr: "Position de l'image b" }, expression: "(1/f-1/a)^-1", targetUnit: "cm", formulaLatex: "\\dfrac{1}{a} + \\dfrac{1}{b} = \\dfrac{1}{f}" },
      { title: { en: "Magnification m", ja: "倍率 m", es: "Aumento m", "pt-BR": "Ampliação m", de: "Vergrößerung m", fr: "Grandissement m" }, expression: "s1/a", targetUnit: "", formulaLatex: "m = \\dfrac{b}{a}" },
    ],
  },
  {
    title: { en: "Reflection of light (angle of incidence and reflection)", ja: "光の反射（入射角と反射角）", es: "Reflexión de la luz (ángulo de incidencia y de reflexión)", "pt-BR": "Reflexão da luz (ângulo de incidência e de reflexão)", de: "Lichtreflexion (Einfallswinkel und Reflexionswinkel)", fr: "Réflexion de la lumière (angle d'incidence et de réflexion)" },
    description: { en: "Use the law of reflection (angle of incidence equals angle of reflection) to find the reflection angle and the angle between the incident and reflected rays.", ja: "反射の法則（入射角＝反射角）から反射角を求め、入射光と反射光のなす角も求めます。", es: "Usa la ley de la reflexión (el ángulo de incidencia es igual al ángulo de reflexión) para hallar el ángulo de reflexión y el ángulo entre el rayo incidente y el reflejado.", "pt-BR": "Use a lei da reflexão (o ângulo de incidência é igual ao ângulo de reflexão) para encontrar o ângulo de reflexão e o ângulo entre o raio incidente e o refletido.", de: "Mithilfe des Reflexionsgesetzes (Einfallswinkel gleich Reflexionswinkel) werden der Reflexionswinkel und der Winkel zwischen einfallendem und reflektiertem Strahl bestimmt.", fr: "Utilise la loi de la réflexion (l'angle d'incidence est égal à l'angle de réflexion) pour trouver l'angle de réflexion et l'angle entre le rayon incident et le rayon réfléchi." },
    localConstants: [{ symbol: "θᵢ", expression: "32deg" }],
    steps: [
      { title: { en: "Angle of reflection θr", ja: "反射角 θr", es: "Ángulo de reflexión θr", "pt-BR": "Ângulo de reflexão θr", de: "Reflexionswinkel θr", fr: "Angle de réflexion θr" }, expression: "θᵢ", targetUnit: "deg", formulaLatex: "\\theta_r = \\theta_i" },
      { title: { en: "Angle between incident and reflected rays", ja: "入射光と反射光のなす角", es: "Ángulo entre el rayo incidente y el reflejado", "pt-BR": "Ângulo entre o raio incidente e o refletido", de: "Winkel zwischen einfallendem und reflektiertem Strahl", fr: "Angle entre le rayon incident et le rayon réfléchi" }, expression: "2*θᵢ", targetUnit: "deg", formulaLatex: "\\theta = \\theta_i + \\theta_r = 2\\theta_i" },
    ],
  },
];

/** 理科「地学・天気」。湿度・地震波の伝わり方・地層の堆積・台風の気圧をまとめている。 */
export const SCIENCE_EARTH_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Finding relative humidity (from vapor content and from dew point)", ja: "湿度の求め方（水蒸気量から・露点から）", es: "Cálculo de la humedad relativa (a partir del vapor de agua y del punto de rocío)", "pt-BR": "Cálculo da umidade relativa (a partir do vapor de água e do ponto de orvalho)", de: "Bestimmung der relativen Luftfeuchtigkeit (aus dem Wasserdampfgehalt und aus dem Taupunkt)", fr: "Calcul de l'humidité relative (à partir de la vapeur d'eau et du point de rosée)" },
    description: { en: "Compute relative humidity from the actual water vapor content and the saturation vapor density at the air temperature, then compute it again using the dew point instead.", ja: "空気1m³中の水蒸気量とその気温での飽和水蒸気量から湿度を求め、露点（別の気温での飽和水蒸気量）からも同じように求めます。", es: "Calcula la humedad relativa a partir del vapor de agua presente y de la cantidad máxima de vapor de agua que puede contener el aire (a la temperatura del aire), y vuelve a calcularla usando en su lugar el punto de rocío.", "pt-BR": "Calcule a umidade relativa a partir do vapor de água presente e da quantidade máxima de vapor de água que o ar pode conter (na temperatura do ar), e calcule-a novamente usando o ponto de orvalho.", de: "Berechne die relative Luftfeuchtigkeit aus dem tatsächlichen Wasserdampfgehalt und der maximal möglichen Wasserdampfmenge der Luft (Sättigungsdampfdichte) bei der Lufttemperatur, und berechne sie anschließend erneut anhand des Taupunkts.", fr: "Calcule l'humidité relative à partir de la quantité de vapeur d'eau présente et de la quantité maximale de vapeur d'eau que l'air peut contenir à cette température, puis recalcule-la à partir du point de rosée." },
    localConstants: [
      { symbol: "a", expression: "18.0g/m³" },
      { symbol: "aₛₐₜ", expression: "23.1g/m³" },
      { symbol: "a_dew", expression: "17.3g/m³" },
    ],
    steps: [
      { title: { en: "Humidity from vapor content", ja: "水蒸気量からの湿度", es: "Humedad a partir del vapor de agua", "pt-BR": "Umidade a partir do vapor de água", de: "Luftfeuchtigkeit aus dem Wasserdampfgehalt", fr: "Humidité à partir de la vapeur d'eau" }, expression: "a/aₛₐₜ", targetUnit: "%", formulaLatex: "RH = \\dfrac{a}{a_{sat}} \\times 100\\%" },
      { title: { en: "Humidity from the dew point", ja: "露点からの湿度", es: "Humedad a partir del punto de rocío", "pt-BR": "Umidade a partir do ponto de orvalho", de: "Luftfeuchtigkeit aus dem Taupunkt", fr: "Humidité à partir du point de rosée" }, expression: "a_dew/aₛₐₜ", targetUnit: "%", formulaLatex: "RH = \\dfrac{a_{dew}}{a_{sat}} \\times 100\\%" },
    ],
  },
  {
    title: { en: "Omori's formula (epicentral distance from the P-S time)", ja: "大森公式（初期微動継続時間から震源までの距離）", es: "Fórmula de Omori (distancia al epicentro a partir del tiempo S-P)", "pt-BR": "Fórmula de Omori (distância ao epicentro a partir do intervalo P-S)", de: "Omori-Formel (Epizentrumsentfernung aus der S-P-Zeit)", fr: "Formule d'Omori (distance à l'épicentre à partir de la durée S-P)" },
    description: { en: "Use Omori's formula to compute the distance to the epicenter from the P-S time (the interval between P-wave and S-wave arrivals).", ja: "初期微動継続時間（P波とS波の到達時刻の差）から、大森公式で震源までの距離を求めます。", es: "Usa la fórmula de Omori para calcular la distancia al epicentro a partir del tiempo S-P (el intervalo entre la llegada de las ondas P y S).", "pt-BR": "Use a fórmula de Omori para calcular a distância ao epicentro a partir do intervalo P-S (o intervalo entre a chegada das ondas P e S).", de: "Mit der Omori-Formel wird aus der S-P-Zeit (dem Zeitabstand zwischen dem Eintreffen der P-Welle und der S-Welle) die Entfernung zum Epizentrum berechnet.", fr: "Utilise la formule d'Omori pour calculer la distance à l'épicentre à partir de la durée S-P (l'intervalle entre l'arrivée des ondes P et des ondes S)." },
    localConstants: [
      { symbol: "k", expression: "8km/s" },
      { symbol: "Tₛ", expression: "12s" },
    ],
    steps: [{ title: { en: "Distance to the epicenter d", ja: "震源までの距離 d", es: "Distancia al epicentro d", "pt-BR": "Distância ao epicentro d", de: "Entfernung zum Epizentrum d", fr: "Distance à l'épicentre d" }, expression: "k*Tₛ", targetUnit: "km", formulaLatex: "d = k T_s" }],
  },
  {
    title: { en: "Speed of P-waves and S-waves", ja: "P波・S波の速さ", es: "Velocidad de las ondas P y S", "pt-BR": "Velocidade das ondas P e S", de: "Geschwindigkeit von P-Wellen und S-Wellen", fr: "Vitesse des ondes P et des ondes S" },
    description: { en: "Compute the speed of the P-wave and S-wave from the distance to the epicenter and each wave's arrival time.", ja: "震源からの距離と、P波・S波それぞれの到達時間から、それぞれの伝わる速さを求めます。", es: "Calcula la velocidad de la onda P y de la onda S a partir de la distancia al epicentro y del tiempo de llegada de cada onda.", "pt-BR": "Calcule a velocidade da onda P e da onda S a partir da distância ao epicentro e do tempo de chegada de cada onda.", de: "Berechne die Geschwindigkeit der P-Welle und der S-Welle aus der Entfernung zum Epizentrum und der Ankunftszeit jeder Welle.", fr: "Calcule la vitesse de l'onde P et de l'onde S à partir de la distance à l'épicentre et du temps d'arrivée de chaque onde." },
    localConstants: [
      { symbol: "d", expression: "80km" },
      { symbol: "tₚ", expression: "10s" },
      { symbol: "tₛ", expression: "20s" },
    ],
    steps: [
      { title: { en: "P-wave speed Vp", ja: "P波の速さ Vp", es: "Velocidad de la onda P Vp", "pt-BR": "Velocidade da onda P Vp", de: "Geschwindigkeit der P-Welle Vp", fr: "Vitesse de l'onde P Vp" }, expression: "d/tₚ", targetUnit: "km/s", formulaLatex: "V_p = \\dfrac{d}{t_p}" },
      { title: { en: "S-wave speed Vs", ja: "S波の速さ Vs", es: "Velocidad de la onda S Vs", "pt-BR": "Velocidade da onda S Vs", de: "Geschwindigkeit der S-Welle Vs", fr: "Vitesse de l'onde S Vs" }, expression: "d/tₛ", targetUnit: "km/s", formulaLatex: "V_s = \\dfrac{d}{t_s}" },
    ],
  },
  {
    title: { en: "Sedimentation rate of a rock layer", ja: "地層の堆積速度", es: "Tasa de sedimentación de una capa de roca", "pt-BR": "Taxa de sedimentação de uma camada de rocha", de: "Sedimentationsrate einer Gesteinsschicht", fr: "Taux de sédimentation d'une couche rocheuse" },
    description: { en: "Compute the sedimentation rate from the thickness of a rock layer and the number of years it took to form.", ja: "地層の厚さと堆積にかかった年数から、堆積速度を求めます。", es: "Calcula la tasa de sedimentación a partir del espesor de una capa de roca y del número de años que tardó en formarse.", "pt-BR": "Calcule a taxa de sedimentação a partir da espessura de uma camada de rocha e do número de anos que levou para se formar.", de: "Berechne die Sedimentationsrate aus der Dicke einer Gesteinsschicht und der Anzahl der Jahre, die für ihre Entstehung nötig waren.", fr: "Calcule le taux de sédimentation à partir de l'épaisseur d'une couche rocheuse et du nombre d'années nécessaires à sa formation." },
    localConstants: [
      { symbol: "thickness", expression: "2m" },
      { symbol: "years", expression: "10000yr" },
    ],
    steps: [{ title: { en: "Sedimentation rate", ja: "堆積速度", es: "Tasa de sedimentación", "pt-BR": "Taxa de sedimentação", de: "Sedimentationsrate", fr: "Taux de sédimentation" }, expression: "thickness/years", targetUnit: "mm/yr", formulaLatex: "\\text{rate} = \\dfrac{\\text{thickness}}{\\text{years}}" }],
  },
  {
    title: { en: "Central pressure of a typhoon (converting hPa)", ja: "台風の中心気圧（hPaの換算）", es: "Presión central de un tifón (conversión de hPa)", "pt-BR": "Pressão central de um tufão (conversão de hPa)", de: "Kerndruck eines Taifuns (Umrechnung von hPa)", fr: "Pression centrale d'un typhon (conversion de hPa)" },
    description: { en: "Convert a typhoon's central pressure of 935hPa into pascals and standard atmospheres.", ja: "台風の中心気圧935hPaを、パスカルと気圧（atm）に換算します。", es: "Convierte la presión central de un tifón de 935hPa a pascales y a atmósferas.", "pt-BR": "Converta a pressão central de um tufão de 935hPa para pascals e atmosferas.", de: "Der Kerndruck eines Taifuns von 935hPa wird in Pascal und in (physikalische) Atmosphären umgerechnet.", fr: "Convertis la pression centrale d'un typhon de 935hPa en pascals et en atmosphères." },
    localConstants: [{ symbol: "P", expression: "935hPa" }],
    steps: [
      { title: { en: "Convert to pascals", ja: "パスカルに変換", es: "Convertir a pascales", "pt-BR": "Converter para pascals", de: "In Pascal umrechnen", fr: "Convertir en pascals" }, expression: "P", targetUnit: "Pa", formulaLatex: "P" },
      { title: { en: "Convert to standard atmospheres", ja: "気圧(atm)に変換", es: "Convertir a atmósferas", "pt-BR": "Converter para atmosferas", de: "In (physikalische) Atmosphären umrechnen", fr: "Convertir en atmosphères" }, expression: "P", targetUnit: "atm", formulaLatex: "P" },
    ],
  },
];

/** 理科「化学変化」。質量保存の法則・金属の酸化の質量比・電気分解の体積比をまとめている。 */
export const SCIENCE_CHEMISTRY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Conservation of mass (mass before and after a reaction)", ja: "質量保存の法則（反応前後の質量）", es: "Conservación de la masa (masa antes y después de una reacción)", "pt-BR": "Conservação da massa (massa antes e depois de uma reação)", de: "Erhaltung der Masse (Masse vor und nach einer Reaktion)", fr: "Conservation de la masse (masse avant et après une réaction)" },
    description: { en: "In a sealed container, the total mass before a reaction equals the total mass after it, since nothing enters or leaves the system.", ja: "密閉した容器の中で反応させる場合、反応前の物質の質量の合計と、反応後の質量は変わりません。", es: "En un recipiente cerrado, la masa total antes de una reacción es igual a la masa total después de ella, ya que nada entra ni sale del sistema.", "pt-BR": "Em um recipiente fechado, a massa total antes de uma reação é igual à massa total depois dela, já que nada entra ou sai do sistema.", de: "In einem geschlossenen Behälter ist die Gesamtmasse vor einer Reaktion gleich der Gesamtmasse danach, da nichts in das System hinein- oder aus ihm herausgelangt.", fr: "Dans un récipient fermé, la masse totale avant une réaction est égale à la masse totale après, car rien n'entre ni ne sort du système." },
    localConstants: [
      { symbol: "m₁", expression: "35.0g" },
      { symbol: "m₂", expression: "45.0g" },
    ],
    steps: [{ title: { en: "Mass after the reaction", ja: "反応後の質量", es: "Masa después de la reacción", "pt-BR": "Massa depois da reação", de: "Masse nach der Reaktion", fr: "Masse après la réaction" }, expression: "m₁+m₂", targetUnit: "g", formulaLatex: "m_{after} = m_{before} = m_1 + m_2" }],
  },
  {
    title: { en: "Mass ratio in copper oxidation (Cu:O=4:1)", ja: "銅の酸化の質量比（Cu:O=4:1）", es: "Relación de masas en la oxidación del cobre (Cu:O=4:1)", "pt-BR": "Razão de massas na oxidação do cobre (Cu:O=4:1)", de: "Massenverhältnis bei der Oxidation von Kupfer (Cu:O=4:1)", fr: "Rapport de masse dans l'oxydation du cuivre (Cu:O=4:1)" },
    description: { en: "When heated, copper combines with oxygen in a 4:1 mass ratio to form copper oxide. Compute the mass of oxygen that combines with 8.0g of copper, and the resulting mass of copper oxide.", ja: "銅を加熱すると酸素と4:1の質量比で結びついて酸化銅になります。銅8.0gに結びつく酸素と、できる酸化銅の質量を求めます。", es: "Al calentarse, el cobre se combina con el oxígeno en una proporción de masas de 4:1 para formar óxido de cobre. Calcula la masa de oxígeno que se combina con 8,0g de cobre, y la masa resultante de óxido de cobre.", "pt-BR": "Ao ser aquecido, o cobre se combina com o oxigênio em uma proporção de massas de 4:1 para formar óxido de cobre. Calcule a massa de oxigênio que se combina com 8,0g de cobre, e a massa resultante de óxido de cobre.", de: "Beim Erhitzen verbindet sich Kupfer mit Sauerstoff im Massenverhältnis 4:1 zu Kupferoxid. Berechne die Masse des Sauerstoffs, der sich mit 8,0g Kupfer verbindet, sowie die entstehende Masse an Kupferoxid.", fr: "En chauffant, le cuivre se combine à l'oxygène selon un rapport de masse de 4:1 pour former de l'oxyde de cuivre. Calcule la masse d'oxygène qui se combine à 8,0g de cuivre, ainsi que la masse d'oxyde de cuivre obtenue." },
    localConstants: [{ symbol: "mCu", expression: "8.0g" }],
    steps: [
      { title: { en: "Mass of oxygen combined", ja: "結びつく酸素の質量", es: "Masa de oxígeno combinada", "pt-BR": "Massa de oxigênio combinada", de: "Masse des gebundenen Sauerstoffs", fr: "Masse d'oxygène combinée" }, expression: "mCu*(1/4)", targetUnit: "g", formulaLatex: "m_O = m_{Cu} \\times \\dfrac{1}{4}" },
      { title: { en: "Mass of copper oxide formed", ja: "できる酸化銅の質量", es: "Masa de óxido de cobre formada", "pt-BR": "Massa de óxido de cobre formada", de: "Masse des entstandenen Kupferoxids", fr: "Masse d'oxyde de cuivre formée" }, expression: "mCu+s1", targetUnit: "g", formulaLatex: "m_{CuO} = m_{Cu} + m_O" },
    ],
  },
  {
    title: { en: "Combustion of magnesium (Mg:O=3:2)", ja: "マグネシウムの燃焼（Mg:O=3:2）", es: "Combustión del magnesio (Mg:O=3:2)", "pt-BR": "Combustão do magnésio (Mg:O=3:2)", de: "Verbrennung von Magnesium (Mg:O=3:2)", fr: "Combustion du magnésium (Mg:O=3:2)" },
    description: { en: "When burned, magnesium combines with oxygen in a 3:2 mass ratio to form magnesium oxide. Compute the mass of oxygen that combines with 6.0g of magnesium, and the resulting mass of magnesium oxide.", ja: "マグネシウムを燃焼させると酸素と3:2の質量比で結びついて酸化マグネシウムになります。マグネシウム6.0gに結びつく酸素と、できる酸化マグネシウムの質量を求めます。", es: "Al arder, el magnesio se combina con el oxígeno en una proporción de masas de 3:2 para formar óxido de magnesio. Calcula la masa de oxígeno que se combina con 6,0g de magnesio, y la masa resultante de óxido de magnesio.", "pt-BR": "Ao queimar, o magnésio se combina com o oxigênio em uma proporção de massas de 3:2 para formar óxido de magnésio. Calcule a massa de oxigênio que se combina com 6,0g de magnésio, e a massa resultante de óxido de magnésio.", de: "Beim Verbrennen verbindet sich Magnesium mit Sauerstoff im Massenverhältnis 3:2 zu Magnesiumoxid. Berechne die Masse des Sauerstoffs, der sich mit 6,0g Magnesium verbindet, sowie die entstehende Masse an Magnesiumoxid.", fr: "En brûlant, le magnésium se combine à l'oxygène selon un rapport de masse de 3:2 pour former de l'oxyde de magnésium. Calcule la masse d'oxygène qui se combine à 6,0g de magnésium, ainsi que la masse d'oxyde de magnésium obtenue." },
    localConstants: [{ symbol: "mMg", expression: "6.0g" }],
    steps: [
      { title: { en: "Mass of oxygen combined", ja: "結びつく酸素の質量", es: "Masa de oxígeno combinada", "pt-BR": "Massa de oxigênio combinada", de: "Masse des gebundenen Sauerstoffs", fr: "Masse d'oxygène combinée" }, expression: "mMg*(2/3)", targetUnit: "g", formulaLatex: "m_O = m_{Mg} \\times \\dfrac{2}{3}" },
      { title: { en: "Mass of magnesium oxide formed", ja: "できる酸化マグネシウムの質量", es: "Masa de óxido de magnesio formada", "pt-BR": "Massa de óxido de magnésio formada", de: "Masse des entstandenen Magnesiumoxids", fr: "Masse d'oxyde de magnésium formée" }, expression: "mMg+s1", targetUnit: "g", formulaLatex: "m_{MgO} = m_{Mg} + m_O" },
    ],
  },
  {
    title: { en: "Mass of gas produced by a chemical reaction", ja: "化学反応で発生した気体の質量", es: "Masa de gas producido por una reacción química", "pt-BR": "Massa de gás produzido por uma reação química", de: "Masse des durch eine chemische Reaktion entstandenen Gases", fr: "Masse de gaz produit par une réaction chimique" },
    description: { en: "Adding hydrochloric acid to limestone in an open container releases carbon dioxide gas into the air, reducing the total mass. Use conservation of mass to find the mass of gas released.", ja: "開放した容器で石灰石に塩酸を加えると、発生した二酸化炭素が空気中に逃げて全体の質量が減ります。質量保存の法則から、逃げた気体の質量を求めます。", es: "Al añadir ácido clorhídrico a la piedra caliza en un recipiente abierto, se libera dióxido de carbono al aire, reduciendo la masa total. Usa la conservación de la masa para hallar la masa de gas liberado.", "pt-BR": "Ao adicionar ácido clorídrico ao calcário em um recipiente aberto, libera-se dióxido de carbono no ar, reduzindo a massa total. Use a conservação da massa para encontrar a massa de gás liberado.", de: "Gibt man Salzsäure in einem offenen Gefäß zu Kalkstein, entweicht Kohlenstoffdioxid in die Luft, wodurch sich die Gesamtmasse verringert. Mithilfe der Massenerhaltung wird die Masse des entwichenen Gases bestimmt.", fr: "Lorsqu'on ajoute de l'acide chlorhydrique à du calcaire dans un récipient ouvert, du dioxyde de carbone s'échappe dans l'air, ce qui réduit la masse totale. Utilise la conservation de la masse pour trouver la masse de gaz dégagé." },
    localConstants: [
      { symbol: "mBefore", expression: "45.0g" },
      { symbol: "mAfter", expression: "43.6g" },
    ],
    steps: [{ title: { en: "Mass of gas released", ja: "発生した気体の質量", es: "Masa de gas liberado", "pt-BR": "Massa de gás liberado", de: "Masse des entwichenen Gases", fr: "Masse de gaz dégagé" }, expression: "mBefore-mAfter", targetUnit: "g", formulaLatex: "m_{gas} = m_{before} - m_{after}" }],
  },
  {
    title: { en: "Volume ratio of hydrogen to oxygen from electrolysis of water", ja: "水の電気分解で生じる水素と酸素の体積比", es: "Relación de volúmenes entre hidrógeno y oxígeno en la electrólisis del agua", "pt-BR": "Razão de volumes entre hidrogênio e oxigênio na eletrólise da água", de: "Volumenverhältnis von Wasserstoff zu Sauerstoff bei der Elektrolyse von Wasser", fr: "Rapport des volumes d'hydrogène et d'oxygène lors de l'électrolyse de l'eau" },
    description: { en: "Electrolysis of water produces hydrogen and oxygen gas in a 2:1 volume ratio. Compute the volume of hydrogen produced from the volume of oxygen produced.", ja: "水を電気分解すると、水素と酸素が2:1の体積比で発生します。発生した酸素の体積から、水素の体積を求めます。", es: "La electrólisis del agua produce hidrógeno y oxígeno gaseosos en una proporción de volúmenes de 2:1. Calcula el volumen de hidrógeno producido a partir del volumen de oxígeno producido.", "pt-BR": "A eletrólise da água produz hidrogênio e oxigênio gasosos em uma proporção de volumes de 2:1. Calcule o volume de hidrogênio produzido a partir do volume de oxigênio produzido.", de: "Bei der Elektrolyse von Wasser entstehen Wasserstoff und Sauerstoff im Volumenverhältnis 2:1. Berechne das Volumen des entstehenden Wasserstoffs aus dem Volumen des entstehenden Sauerstoffs.", fr: "L'électrolyse de l'eau produit de l'hydrogène et de l'oxygène gazeux selon un rapport de volumes de 2:1. Calcule le volume d'hydrogène produit à partir du volume d'oxygène produit." },
    localConstants: [{ symbol: "Vₒ₂", expression: "15mL" }],
    steps: [{ title: { en: "Volume of hydrogen", ja: "水素の体積", es: "Volumen de hidrógeno", "pt-BR": "Volume de hidrogênio", de: "Volumen des Wasserstoffs", fr: "Volume d'hydrogène" }, expression: "Vₒ₂*2", targetUnit: "mL", formulaLatex: "V_{H_2} = 2V_{O_2}" }],
  },
];
