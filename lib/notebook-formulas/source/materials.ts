import type { NotebookSeed } from "../types";

/** 幅・高さ・スパン・荷重などの記号はカテゴリ内で使い回し、統一感を持たせている。 */
export const MATERIALS_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Second moment of area & section modulus (rectangular section)", ja: "断面二次モーメント・断面係数（矩形断面）", es: "Segundo momento de área y módulo de sección (sección rectangular)", "pt-BR": "Momento de inércia de área e módulo de resistência (seção retangular)", de: "Flächenträgheitsmoment und Widerstandsmoment (Rechteckquerschnitt)", fr: "Moment quadratique et module de flexion (section rectangulaire)" },
    description: { en: "Compute the second moment of area and section modulus of a rectangular cross-section from its width and height.", ja: "矩形断面の幅・高さから、断面二次モーメントと断面係数を求めます。", es: "Calcula el segundo momento de área y el módulo de sección de una sección transversal rectangular a partir de su ancho y altura.", "pt-BR": "Calcule o momento de inércia de área e o módulo de resistência de uma seção transversal retangular a partir de sua largura e altura.", de: "Berechnet das Flächenträgheitsmoment und das Widerstandsmoment eines rechteckigen Querschnitts aus seiner Breite und Höhe.", fr: "Calculer le moment quadratique et le module de flexion d'une section transversale rectangulaire à partir de sa largeur et de sa hauteur." },
    localConstants: [
      { symbol: "b", expression: "100mm" },
      { symbol: "h", expression: "200mm" },
    ],
    steps: [
      { title: { en: "Second moment of area I", ja: "断面二次モーメント I", es: "Segundo momento de área I", "pt-BR": "Momento de inércia de área I", de: "Flächenträgheitsmoment I", fr: "Moment quadratique I" }, expression: "b*h^3/12", targetUnit: "mm^4", formulaLatex: "I = \\dfrac{bh^3}{12}" },
      { title: { en: "Section modulus Z", ja: "断面係数 Z", es: "Módulo de sección Z", "pt-BR": "Módulo de resistência Z", de: "Widerstandsmoment Z", fr: "Module de flexion Z" }, expression: "b*h^2/6", targetUnit: "mm^3", formulaLatex: "Z = \\dfrac{bh^2}{6}" },
    ],
  },
  {
    title: { en: "Bending stress (rectangular beam)", ja: "曲げ応力（矩形断面の梁）", es: "Esfuerzo de flexión (viga de sección rectangular)", "pt-BR": "Tensão de flexão (viga de seção retangular)", de: "Biegespannung (Balken mit Rechteckquerschnitt)", fr: "Contrainte de flexion (poutre de section rectangulaire)" },
    description: { en: "Compute the bending stress in a rectangular beam section from its dimensions and the applied bending moment.", ja: "断面寸法と曲げモーメントから、矩形断面の梁に生じる曲げ応力を求めます。", es: "Calcula el esfuerzo de flexión en una sección de viga rectangular a partir de sus dimensiones y el momento flector aplicado.", "pt-BR": "Calcule a tensão de flexão em uma seção de viga retangular a partir de suas dimensões e do momento fletor aplicado.", de: "Berechnet die Biegespannung in einem rechteckigen Balkenquerschnitt aus seinen Abmessungen und dem einwirkenden Biegemoment.", fr: "Calculer la contrainte de flexion dans une section de poutre rectangulaire à partir de ses dimensions et du moment fléchissant appliqué." },
    localConstants: [
      { symbol: "b", expression: "100mm" },
      { symbol: "h", expression: "200mm" },
      { symbol: "M", expression: "5kN*m" },
      { symbol: "Z", expression: "b*h^2/6" },
    ],
    steps: [{ title: { en: "Bending stress σ", ja: "曲げ応力 σ", es: "Esfuerzo de flexión σ", "pt-BR": "Tensão de flexão σ", de: "Biegespannung σ", fr: "Contrainte de flexion σ" }, expression: "M/Z", targetUnit: "MPa", formulaLatex: "\\sigma = \\dfrac{M}{Z}" }],
  },
  {
    title: { en: "Max deflection of a simple beam (uniform load)", ja: "単純梁の最大たわみ（等分布荷重）", es: "Flecha máxima de una viga simplemente apoyada (carga uniformemente distribuida)", "pt-BR": "Flecha máxima de uma viga simplesmente apoiada (carga uniformemente distribuída)", de: "Maximale Durchbiegung eines beidseitig gelenkig gelagerten Balkens (gleichmäßig verteilte Last)", fr: "Flèche maximale d'une poutre simplement appuyée (charge uniformément répartie)" },
    description: { en: "Compute the maximum midspan deflection of a simply supported beam under a uniformly distributed load.", ja: "等分布荷重を受ける単純梁の、スパン中央での最大たわみを求めます。", es: "Calcula la flecha máxima en el centro del vano de una viga simplemente apoyada bajo una carga uniformemente distribuida.", "pt-BR": "Calcule a flecha máxima no meio do vão de uma viga simplesmente apoiada sob uma carga uniformemente distribuída.", de: "Berechnet die maximale Durchbiegung in Feldmitte eines beidseitig gelenkig gelagerten Balkens unter einer gleichmäßig verteilten Last.", fr: "Calculer la flèche maximale à mi-portée d'une poutre simplement appuyée sous une charge uniformément répartie." },
    localConstants: [
      { symbol: "b", expression: "100mm" },
      { symbol: "h", expression: "200mm" },
      { symbol: "L", expression: "3m" },
      { symbol: "w", expression: "5kN/m" },
      { symbol: "E", expression: "205GPa" },
      { symbol: "I", expression: "b*h^3/12" },
    ],
    steps: [{ title: { en: "Maximum deflection δ", ja: "最大たわみ δ", es: "Flecha máxima δ", "pt-BR": "Flecha máxima δ", de: "Maximale Durchbiegung δ", fr: "Flèche maximale δ" }, expression: "5*w*L^4/(384*E*I)", targetUnit: "mm", formulaLatex: "\\delta = \\dfrac{5wL^4}{384EI}" }],
  },
  {
    title: { en: "Max deflection of a simple beam (point load)", ja: "単純梁の最大たわみ（集中荷重）", es: "Flecha máxima de una viga simplemente apoyada (carga puntual)", "pt-BR": "Flecha máxima de uma viga simplesmente apoiada (carga concentrada)", de: "Maximale Durchbiegung eines beidseitig gelenkig gelagerten Balkens (Einzellast)", fr: "Flèche maximale d'une poutre simplement appuyée (charge ponctuelle)" },
    description: { en: "Compute the maximum deflection of a simply supported beam under a concentrated load at midspan.", ja: "スパン中央に集中荷重を受ける単純梁の、最大たわみを求めます。", es: "Calcula la flecha máxima de una viga simplemente apoyada bajo una carga puntual aplicada en el centro del vano.", "pt-BR": "Calcule a flecha máxima de uma viga simplesmente apoiada sob uma carga concentrada aplicada no meio do vão.", de: "Berechnet die maximale Durchbiegung eines beidseitig gelenkig gelagerten Balkens unter einer in Feldmitte angreifenden Einzellast.", fr: "Calculer la flèche maximale d'une poutre simplement appuyée sous une charge ponctuelle appliquée à mi-portée." },
    localConstants: [
      { symbol: "b", expression: "100mm" },
      { symbol: "h", expression: "200mm" },
      { symbol: "L", expression: "3m" },
      { symbol: "P", expression: "10kN" },
      { symbol: "E", expression: "205GPa" },
      { symbol: "I", expression: "b*h^3/12" },
    ],
    steps: [{ title: { en: "Maximum deflection δ", ja: "最大たわみ δ", es: "Flecha máxima δ", "pt-BR": "Flecha máxima δ", de: "Maximale Durchbiegung δ", fr: "Flèche maximale δ" }, expression: "P*L^3/(48*E*I)", targetUnit: "mm", formulaLatex: "\\delta = \\dfrac{PL^3}{48EI}" }],
  },
  {
    title: { en: "Hooke's law (stress & strain)", ja: "フックの法則（応力とひずみ）", es: "Ley de Hooke (esfuerzo y deformación)", "pt-BR": "Lei de Hooke (tensão e deformação)", de: "Hookesches Gesetz (Spannung und Dehnung)", fr: "Loi de Hooke (contrainte et déformation)" },
    description: { en: "Convert between stress and strain using Young's modulus (Hooke's law).", ja: "縦弾性係数（ヤング率）を使って、応力とひずみを相互に換算します。", es: "Convierte entre esfuerzo y deformación mediante el módulo de Young (ley de Hooke).", "pt-BR": "Converta entre tensão e deformação usando o módulo de elasticidade (lei de Hooke).", de: "Rechnet mithilfe des Elastizitätsmoduls (hookesches Gesetz) zwischen Spannung und Dehnung um.", fr: "Convertir entre contrainte et déformation à l'aide du module de Young (loi de Hooke)." },
    localConstants: [
      { symbol: "E", expression: "205GPa" },
      { symbol: "ε", expression: "0.001" },
      { symbol: "σ₀", expression: "100MPa" },
    ],
    steps: [
      { title: { en: "Stress σ = E×ε", ja: "応力 σ = E×ε", es: "Esfuerzo σ = E×ε", "pt-BR": "Tensão σ = E×ε", de: "Spannung σ = E×ε", fr: "Contrainte σ = E×ε" }, expression: "E*ε", targetUnit: "MPa", formulaLatex: "\\sigma = E\\varepsilon" },
      { title: { en: "Strain ε = σ₀/E", ja: "ひずみ ε = σ₀/E", es: "Deformación ε = σ₀/E", "pt-BR": "Deformação ε = σ₀/E", de: "Dehnung ε = σ₀/E", fr: "Déformation ε = σ₀/E" }, expression: "σ₀/E", targetUnit: "", formulaLatex: "\\varepsilon = \\dfrac{\\sigma_0}{E}" },
    ],
  },
  {
    title: { en: "Shear stress", ja: "せん断応力", es: "Esfuerzo cortante", "pt-BR": "Tensão de cisalhamento", de: "Schubspannung", fr: "Contrainte de cisaillement" },
    description: { en: "Compute the average shear stress from a shear force acting over a cross-sectional area.", ja: "断面積に生じるせん断力から、平均せん断応力を求めます。", es: "Calcula el esfuerzo cortante medio a partir de una fuerza cortante que actúa sobre un área de sección transversal.", "pt-BR": "Calcule a tensão de cisalhamento média a partir de uma força cortante atuando sobre uma área de seção transversal.", de: "Berechnet die mittlere Schubspannung aus einer Querkraft, die auf eine Querschnittsfläche wirkt.", fr: "Calculer la contrainte de cisaillement moyenne à partir d'un effort tranchant agissant sur une aire de section transversale." },
    localConstants: [
      { symbol: "F", expression: "20kN" },
      { symbol: "A", expression: "500mm^2" },
    ],
    steps: [{ title: { en: "Shear stress τ", ja: "せん断応力 τ", es: "Esfuerzo cortante τ", "pt-BR": "Tensão de cisalhamento τ", de: "Schubspannung τ", fr: "Contrainte de cisaillement τ" }, expression: "F/A", targetUnit: "MPa", formulaLatex: "\\tau = \\dfrac{F}{A}" }],
  },
  {
    title: { en: "Euler buckling load", ja: "オイラー座屈荷重", es: "Carga de pandeo de Euler", "pt-BR": "Carga de flambagem de Euler", de: "Eulersche Knicklast", fr: "Charge critique de flambement d'Euler" },
    description: { en: "Compute the critical buckling load of a slender column using Euler's formula. The effective length factor k is 1 for pinned-pinned ends.", ja: "細長い柱の座屈荷重を、オイラーの座屈公式から求めます。座屈長さ係数kは両端ピン支持で1です。", es: "Calcula la carga crítica de pandeo de una columna esbelta mediante la fórmula de Euler. El coeficiente de longitud efectiva k es 1 para extremos articulados en ambos lados.", "pt-BR": "Calcule a carga crítica de flambagem de uma coluna esbelta usando a fórmula de Euler. O fator de comprimento efetivo k é 1 para extremidades birrotuladas.", de: "Berechnet die kritische Knicklast eines schlanken Stabes mithilfe der eulerschen Knickformel. Der Knicklängenbeiwert k beträgt 1 bei beidseitig gelenkiger Lagerung.", fr: "Calculer la charge critique de flambement d'une colonne élancée à l'aide de la formule d'Euler. Le coefficient de longueur effective k vaut 1 pour des extrémités articulées aux deux bouts." },
    localConstants: [
      { symbol: "E", expression: "205GPa" },
      { symbol: "I", expression: "8.5e6mm^4" },
      { symbol: "k", expression: "1" },
      { symbol: "L", expression: "3m" },
    ],
    steps: [{ title: { en: "Euler buckling load Pcr", ja: "オイラー座屈荷重 Pcr", es: "Carga de pandeo de Euler Pcr", "pt-BR": "Carga de flambagem de Euler Pcr", de: "Eulersche Knicklast Pcr", fr: "Charge critique de flambement d'Euler Pcr" }, expression: "pi^2*E*I/(k*L)^2", targetUnit: "kN", formulaLatex: "P_{cr} = \\dfrac{\\pi^2 EI}{(kL)^2}" }],
  },
];
