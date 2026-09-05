import type { NotebookSeed } from "../types";

/**
 * はり・柱のカテゴリ。幅b・高さh・スパンL・等分布荷重wなどの記号はカテゴリ内で使い回し、統一感を持たせている。
 * 既定値はカタログに実在する断面（C24の45×195根太、IPE 200、φ60×5パイプ）と、その材料の
 * 実際の値（構造用鋼S275: E=210GPa・f_y=275MPa／製材C24: E=11GPa・f_m,k=24MPa）を組み合わせてある。
 * 断面と材料が噛み合っていないと、出てくる応力もたわみも設計の判断に使えない数字になるため。
 */
export const MATERIALS_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Timber floor joist check (C24, 45×195)", ja: "木造床根太の検定（C24・45×195）" },
    description: { en: "A 45×195 mm C24 timber joist (E = 11 GPa, bending strength f_m,k = 24 MPa) spanning 3.6 m carries 2 kN/m. Strength passes easily at 11.4 MPa, under half of f_m,k — but the last step divides the deflection by the usual floor limit of span/300 (12 mm). The ratio comes out above 1, so this joist fails on deflection: the floor would feel bouncy long before it broke. Deflection, not strength, is what sizes most timber floors.", ja: "スパン3.6mに45×195mmのC24製材の根太（E=11GPa、曲げ強度 f_m,k=24MPa）を架け、2kN/mの荷重を受ける場合です。曲げ応力は11.4MPaでf_m,kの半分以下、強度は余裕で満たします。ところが最後の手順でたわみを床の一般的な制限値スパン/300（12mm）で割ると、比が1を超えて不合格になります。壊れるずっと手前で床がふわふわして使えないということです。木造の床の断面は、強度ではなくたわみで決まるのが普通です。" },
    localConstants: [
      { symbol: "b", expression: "45mm" },
      { symbol: "h", expression: "195mm" },
      { symbol: "L", expression: "3.6m" },
      { symbol: "w", expression: "2kN/m" },
      { symbol: "E", expression: "11GPa" },
      { symbol: "I", expression: "b*h^3/12" },
      { symbol: "Z", expression: "b*h^2/6" },
    ],
    steps: [
      { title: { en: "Maximum bending moment M", ja: "最大曲げモーメント M" }, expression: "w*L^2/8", targetUnit: "kN*m", formulaLatex: "M = \\dfrac{wL^2}{8}" },
      { title: { en: "Bending stress σ (vs f_m,k = 24 MPa)", ja: "曲げ応力 σ（f_m,k=24MPaと比較）" }, expression: "w*L^2/(8*Z)", targetUnit: "MPa", formulaLatex: "\\sigma = \\dfrac{wL^2}{8Z}" },
      { title: { en: "Midspan deflection δ", ja: "スパン中央のたわみ δ" }, expression: "5*w*L^4/(384*E*I)", targetUnit: "mm", formulaLatex: "\\delta = \\dfrac{5wL^4}{384EI}" },
      { title: { en: "Deflection check δ ÷ (L/300) — over 1 means fail", ja: "たわみの検定 δ ÷ (L/300)（1を超えたら不合格）" }, expression: "s3/(L/300)", targetUnit: "", formulaLatex: "\\dfrac{\\delta}{L/300}" },
    ],
  },
  {
    title: { en: "Steel beam IPE 200 under a uniform load", ja: "鋼製はり IPE 200（等分布荷重）" },
    description: { en: "An IPE 200 rolled section in S275 steel (E = 210 GPa, f_y = 275 MPa) spanning 5 m under 10 kN/m. Section properties come straight off the catalogue in the units it prints them in — I = 1943 cm⁴ and Z = 194 cm³ — and the calculator converts them, which is the real point of this notebook. Stress lands at 161 MPa against f_y = 275 MPa, and the deflection just squeaks under the span/250 limit of 20 mm.", ja: "スパン5mにS275鋼のIPE 200（E=210GPa、f_y=275MPa）を架け、10kN/mを受ける場合です。断面性能はカタログの表記のまま I=1943cm⁴、Z=194cm³ と入力しています。これを電卓側が換算してくれるところがこのノートの要点です。曲げ応力は161MPaでf_y=275MPaに対し余裕があり、たわみはスパン/250＝20mmをぎりぎり満たします。" },
    localConstants: [
      { symbol: "L", expression: "5m" },
      { symbol: "w", expression: "10kN/m" },
      { symbol: "E", expression: "210GPa" },
      { symbol: "I", expression: "1943cm^4" },
      { symbol: "Z", expression: "194cm^3" },
    ],
    steps: [
      { title: { en: "Maximum bending moment M", ja: "最大曲げモーメント M" }, expression: "w*L^2/8", targetUnit: "kN*m", formulaLatex: "M = \\dfrac{wL^2}{8}" },
      { title: { en: "Bending stress σ (vs f_y = 275 MPa)", ja: "曲げ応力 σ（f_y=275MPaと比較）" }, expression: "w*L^2/(8*Z)", targetUnit: "MPa", formulaLatex: "\\sigma = \\dfrac{wL^2}{8Z}" },
      { title: { en: "Midspan deflection δ (limit L/250 = 20 mm)", ja: "スパン中央のたわみ δ（制限値 L/250＝20mm）" }, expression: "5*w*L^4/(384*E*I)", targetUnit: "mm", formulaLatex: "\\delta = \\dfrac{5wL^4}{384EI}" },
    ],
  },
  {
    title: { en: "Cantilever with an end point load (steel flat bar)", ja: "片持ちはり・先端集中荷重（鋼の平鋼）" },
    description: { en: "A 500 mm long 8×80 mm steel flat bar (S275, E = 210 GPa) bolted flat-side-vertical to a wall, with 1 kN hung on the free end — a shelf bracket or a small machine arm. A cantilever bends far more than a simply supported beam of the same span, and the fixed end is where both the moment and the stress peak.", ja: "長さ500mmの8×80mm平鋼（S275、E=210GPa）を壁に片持ちで取り付け、先端に1kNを吊るす場合です（棚受けや小さな機械アームを想像してください）。片持ちはりは同じスパンの単純ばりよりはるかに大きくたわみ、モーメントも応力も固定端で最大になります。" },
    localConstants: [
      { symbol: "P", expression: "1kN" },
      { symbol: "L", expression: "0.5m" },
      { symbol: "b", expression: "8mm" },
      { symbol: "h", expression: "80mm" },
      { symbol: "E", expression: "210GPa" },
      { symbol: "I", expression: "b*h^3/12" },
      { symbol: "Z", expression: "b*h^2/6" },
    ],
    steps: [
      { title: { en: "Moment at the fixed end M", ja: "固定端の曲げモーメント M" }, expression: "P*L", targetUnit: "N*m", formulaLatex: "M = PL" },
      { title: { en: "Bending stress σ", ja: "曲げ応力 σ" }, expression: "P*L/Z", targetUnit: "MPa", formulaLatex: "\\sigma = \\dfrac{PL}{Z}" },
      { title: { en: "Tip deflection δ", ja: "先端のたわみ δ" }, expression: "P*L^3/(3*E*I)", targetUnit: "mm", formulaLatex: "\\delta = \\dfrac{PL^3}{3EI}" },
    ],
  },
  {
    title: { en: "Cantilever under a uniform load", ja: "片持ちはり・等分布荷重" },
    description: { en: "The same 8×80 mm steel section (S275, E = 210 GPa), now 1.2 m long and carrying 1.5 kN/m spread along it instead of a point load at the tip — a canopy rib or a shelf loaded over its whole length. Compare the coefficients with the point-load case: wL²/2 and wL⁴/(8EI).", ja: "同じ8×80mmの鋼断面（S275、E=210GPa）を長さ1.2mの片持ちとし、先端の集中荷重ではなく1.5kN/mの等分布荷重を受ける場合です（庇の骨組みや、全長にわたって物を載せる棚など）。先端集中荷重の場合と係数を見比べてください（wL²/2 と wL⁴/(8EI)）。" },
    localConstants: [
      { symbol: "w", expression: "1.5kN/m" },
      { symbol: "L", expression: "1.2m" },
      { symbol: "E", expression: "210GPa" },
      { symbol: "I", expression: "341333mm^4" },
      { symbol: "Z", expression: "8533mm^3" },
    ],
    steps: [
      { title: { en: "Moment at the fixed end M", ja: "固定端の曲げモーメント M" }, expression: "w*L^2/2", targetUnit: "N*m", formulaLatex: "M = \\dfrac{wL^2}{2}" },
      { title: { en: "Bending stress σ", ja: "曲げ応力 σ" }, expression: "w*L^2/(2*Z)", targetUnit: "MPa", formulaLatex: "\\sigma = \\dfrac{wL^2}{2Z}" },
      { title: { en: "Tip deflection δ", ja: "先端のたわみ δ" }, expression: "w*L^4/(8*E*I)", targetUnit: "mm", formulaLatex: "\\delta = \\dfrac{wL^4}{8EI}" },
    ],
  },
  {
    title: { en: "Euler buckling & slenderness (Ø60×5 steel tube)", ja: "オイラー座屈と細長比（φ60×5 鋼管）" },
    description: { en: "A 3 m pin-ended strut of Ø60×5 steel tube (S275, E = 210 GPa, f_y = 275 MPa; A = 864 mm², I = 329375 mm⁴). Work out the radius of gyration and the slenderness ratio first: Euler's formula is only valid while the critical stress stays below yield, which needs a slenderness above about π√(E/f_y) ≈ 87. At 154 this strut is comfortably slender, and the critical stress of 88 MPa confirms it buckles long before it yields.", ja: "長さ3m・両端ピンのφ60×5鋼管（S275、E=210GPa、f_y=275MPa、A=864mm²、I=329375mm⁴）の圧縮材です。まず断面二次半径と細長比を求めます。オイラーの式が使えるのは座屈応力が降伏応力より小さい範囲、つまり細長比がおよそ π√(E/f_y)≒87 を超えるときだけだからです。この材は細長比154で十分に細長く、座屈応力88MPaという結果も「降伏よりずっと手前で座屈する」ことを裏づけています。" },
    localConstants: [
      { symbol: "E", expression: "210GPa" },
      { symbol: "A", expression: "864mm^2" },
      { symbol: "I", expression: "329375mm^4" },
      { symbol: "k", expression: "1" },
      { symbol: "L", expression: "3m" },
      { symbol: "r", expression: "sqrt(I/A)" },
    ],
    steps: [
      { title: { en: "Radius of gyration r", ja: "断面二次半径 r" }, expression: "r", targetUnit: "mm", formulaLatex: "r = \\sqrt{\\dfrac{I}{A}}" },
      { title: { en: "Slenderness ratio λ (Euler needs λ > ≈87)", ja: "細長比 λ（オイラーの式が使えるのは λ>約87）" }, expression: "k*L/r", targetUnit: "", formulaLatex: "\\lambda = \\dfrac{kL}{r}" },
      { title: { en: "Euler buckling load P_cr", ja: "オイラー座屈荷重 P_cr" }, expression: "pi^2*E*I/(k*L)^2", targetUnit: "kN", formulaLatex: "P_{cr} = \\dfrac{\\pi^2 EI}{(kL)^2}" },
      { title: { en: "Critical stress σ_cr (vs f_y = 275 MPa)", ja: "座屈応力 σ_cr（f_y=275MPaと比較）" }, expression: "pi^2*E*I/((k*L)^2*A)", targetUnit: "MPa", formulaLatex: "\\sigma_{cr} = \\dfrac{\\pi^2 EI}{(kL)^2 A}" },
    ],
  },
  {
    title: { en: "Beam self-weight as a distributed load", ja: "はりの自重を等分布荷重に直す" },
    description: { en: "Density times cross-sectional area gives mass per metre. For the IPE 200 of the earlier notebook (steel ρ = 7850 kg/m³, A = 28.5 cm²) that lands on 22.37 kg/m — the catalogue value for IPE 200 is 22.4 kg/m, a satisfying check that the section area and the density agree. Multiply by g to get the self-weight as a distributed load you can add to w.", ja: "密度に断面積を掛ければ1mあたりの質量が出ます。先のノートで使ったIPE 200（鋼の密度 ρ=7850kg/m³、A=28.5cm²）では22.37kg/mとなり、カタログのIPE 200の値22.4kg/mとぴたりと一致します。断面積と密度が噛み合っていることの気持ちのよい確認になります。これにgを掛ければ、そのままwに足せる自重の等分布荷重になります。" },
    localConstants: [
      { symbol: "ρ", expression: "7850kg/m^3" },
      { symbol: "A", expression: "28.5cm^2" },
      { symbol: "g", expression: "9.80665m/s^2" },
      { symbol: "L", expression: "5m" },
    ],
    steps: [
      { title: { en: "Mass per metre m′ (catalogue: 22.4 kg/m)", ja: "1mあたりの質量 m′（カタログ値 22.4kg/m）" }, expression: "ρ*A", targetUnit: "kg/m", formulaLatex: "m' = \\rho A" },
      { title: { en: "Self-weight as a distributed load w_g", ja: "自重の等分布荷重 w_g" }, expression: "ρ*A*g", targetUnit: "N/m", formulaLatex: "w_g = \\rho A g" },
      { title: { en: "Total mass of the beam m", ja: "はり全体の質量 m" }, expression: "ρ*A*L", targetUnit: "kg", formulaLatex: "m = \\rho A L" },
    ],
  },
  {
    title: { en: "Shear stress in a rectangular beam", ja: "矩形断面はりのせん断応力" },
    description: { en: "Shear stress is not spread evenly over the depth of a beam. On a rectangular section it follows a parabola: zero at the top and bottom faces, maximum at the neutral axis, where it reaches exactly 1.5 times the average V/A. That factor of 1.5 is why dividing the shear force by the area on its own understates the real peak by half again.", ja: "せん断応力ははりの高さ方向に一様には分布しません。矩形断面では放物線状に分布し、上下面でゼロ、中立軸で最大となって、平均値V/Aのちょうど1.5倍になります。この1.5倍があるため、せん断力を断面積で割っただけの値では実際のピークを5割も小さく見積もってしまいます。" },
    localConstants: [
      { symbol: "V", expression: "12kN" },
      { symbol: "b", expression: "50mm" },
      { symbol: "h", expression: "150mm" },
      { symbol: "A", expression: "b*h" },
    ],
    steps: [
      { title: { en: "Maximum shear stress τ_max at the neutral axis", ja: "中立軸の最大せん断応力 τ_max" }, expression: "1.5*V/A", targetUnit: "MPa", formulaLatex: "\\tau_{max} = \\dfrac{3V}{2A}" },
    ],
  },
];
