import type { NotebookSeed } from "./types";

/** 幅・高さ・スパン・荷重などの記号はカテゴリ内で使い回し、統一感を持たせている。 */
export const MATERIALS_SEEDS: NotebookSeed[] = [
  {
    title: "断面二次モーメント・断面係数（矩形断面）",
    titleEn: "Second moment of area & section modulus (rectangular section)",
    description: "矩形断面の幅・高さから、断面二次モーメントと断面係数を求めます。",
    descriptionEn: "Compute the second moment of area and section modulus of a rectangular cross-section from its width and height.",
    localConstants: [
      { symbol: "b", expression: "100mm" },
      { symbol: "h", expression: "200mm" },
    ],
    steps: [
      { title: "断面二次モーメント I", titleEn: "Second moment of area I", expression: "b*h^3/12", targetUnit: "mm^4", formulaLatex: "I = \\dfrac{bh^3}{12}" },
      { title: "断面係数 Z", titleEn: "Section modulus Z", expression: "b*h^2/6", targetUnit: "mm^3", formulaLatex: "Z = \\dfrac{bh^2}{6}" },
    ],
  },
  {
    title: "曲げ応力（矩形断面の梁）",
    titleEn: "Bending stress (rectangular beam)",
    description: "断面寸法と曲げモーメントから、矩形断面の梁に生じる曲げ応力を求めます。",
    descriptionEn: "Compute the bending stress in a rectangular beam section from its dimensions and the applied bending moment.",
    localConstants: [
      { symbol: "b", expression: "100mm" },
      { symbol: "h", expression: "200mm" },
      { symbol: "M", expression: "5kN*m" },
      { symbol: "Z", expression: "b*h^2/6" },
    ],
    steps: [{ title: "曲げ応力 σ", titleEn: "Bending stress σ", expression: "M/Z", targetUnit: "MPa", formulaLatex: "\\sigma = \\dfrac{M}{Z}" }],
  },
  {
    title: "単純梁の最大たわみ（等分布荷重）",
    titleEn: "Max deflection of a simple beam (uniform load)",
    description: "等分布荷重を受ける単純梁の、スパン中央での最大たわみを求めます。",
    descriptionEn: "Compute the maximum midspan deflection of a simply supported beam under a uniformly distributed load.",
    localConstants: [
      { symbol: "b", expression: "100mm" },
      { symbol: "h", expression: "200mm" },
      { symbol: "L", expression: "3m" },
      { symbol: "w", expression: "5kN/m" },
      { symbol: "E", expression: "205GPa" },
      { symbol: "I", expression: "b*h^3/12" },
    ],
    steps: [{ title: "最大たわみ δ", titleEn: "Maximum deflection δ", expression: "5*w*L^4/(384*E*I)", targetUnit: "mm", formulaLatex: "\\delta = \\dfrac{5wL^4}{384EI}" }],
  },
  {
    title: "単純梁の最大たわみ（集中荷重）",
    titleEn: "Max deflection of a simple beam (point load)",
    description: "スパン中央に集中荷重を受ける単純梁の、最大たわみを求めます。",
    descriptionEn: "Compute the maximum deflection of a simply supported beam under a concentrated load at midspan.",
    localConstants: [
      { symbol: "b", expression: "100mm" },
      { symbol: "h", expression: "200mm" },
      { symbol: "L", expression: "3m" },
      { symbol: "P", expression: "10kN" },
      { symbol: "E", expression: "205GPa" },
      { symbol: "I", expression: "b*h^3/12" },
    ],
    steps: [{ title: "最大たわみ δ", titleEn: "Maximum deflection δ", expression: "P*L^3/(48*E*I)", targetUnit: "mm", formulaLatex: "\\delta = \\dfrac{PL^3}{48EI}" }],
  },
  {
    title: "フックの法則（応力とひずみ）",
    titleEn: "Hooke's law (stress & strain)",
    description: "縦弾性係数（ヤング率）を使って、応力とひずみを相互に換算します。",
    descriptionEn: "Convert between stress and strain using Young's modulus (Hooke's law).",
    localConstants: [
      { symbol: "E", expression: "205GPa" },
      { symbol: "epsilon", expression: "0.001", displaySymbol: "ε" },
      { symbol: "sigma0", expression: "100MPa", displaySymbol: "σ₀" },
    ],
    steps: [
      { title: "応力 σ = E×ε", titleEn: "Stress σ = E×ε", expression: "E*epsilon", targetUnit: "MPa", formulaLatex: "\\sigma = E\\varepsilon" },
      { title: "ひずみ ε = σ₀/E", titleEn: "Strain ε = σ₀/E", expression: "sigma0/E", targetUnit: "", formulaLatex: "\\varepsilon = \\dfrac{\\sigma_0}{E}" },
    ],
  },
  {
    title: "せん断応力",
    titleEn: "Shear stress",
    description: "断面積に生じるせん断力から、平均せん断応力を求めます。",
    descriptionEn: "Compute the average shear stress from a shear force acting over a cross-sectional area.",
    localConstants: [
      { symbol: "F", expression: "20kN" },
      { symbol: "A", expression: "500mm^2" },
    ],
    steps: [{ title: "せん断応力 τ", titleEn: "Shear stress τ", expression: "F/A", targetUnit: "MPa", formulaLatex: "\\tau = \\dfrac{F}{A}" }],
  },
  {
    title: "オイラー座屈荷重",
    titleEn: "Euler buckling load",
    description: "細長い柱の座屈荷重を、オイラーの座屈公式から求めます。座屈長さ係数kは両端ピン支持で1です。",
    descriptionEn: "Compute the critical buckling load of a slender column using Euler's formula. The effective length factor k is 1 for pinned-pinned ends.",
    localConstants: [
      { symbol: "E", expression: "205GPa" },
      { symbol: "I", expression: "8.5e6mm^4" },
      { symbol: "k", expression: "1" },
      { symbol: "L", expression: "3m" },
    ],
    steps: [{ title: "オイラー座屈荷重 Pcr", titleEn: "Euler buckling load Pcr", expression: "pi^2*E*I/(k*L)^2", targetUnit: "kN", formulaLatex: "P_{cr} = \\dfrac{\\pi^2 EI}{(kL)^2}" }],
  },
];
