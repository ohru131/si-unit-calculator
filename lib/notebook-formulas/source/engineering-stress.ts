import type { NotebookSeed } from "../types";

/**
 * 応力・ひずみ・安全率のカテゴリ。断面や支持条件に依らない「材料そのものの性質」を扱う
 * （はり・柱のように断面形状で決まる計算は source/materials.ts 側に置いている）。
 * 定数の既定値は実在の材料（ASTM A36 相当の炭素鋼: E=200GPa・σ_y=250MPa）から取り、
 * 出てくる数値がそのまま設計の判断材料として読めるようにしてある。
 */
export const ENG_STRESS_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Axial stress & elongation of a tie rod", ja: "引張材の軸応力と伸び" },
    description: { en: "A 200 mm² tie rod of ASTM A36 structural steel (E = 200 GPa, yield σ_y = 250 MPa) carries 25 kN of tension. The stress comes out at 125 MPa, exactly half the yield strength, and the 2 m rod stretches 1.25 mm.", ja: "断面積200mm²の引張材（ASTM A36相当の構造用鋼: E=200GPa、降伏応力 σ_y=250MPa）に25kNの引張力が働く場合を計算します。応力は125MPa＝降伏応力のちょうど半分、長さ2mの材の伸びは1.25mmになります。" },
    localConstants: [
      { symbol: "F", expression: "25kN" },
      { symbol: "A", expression: "200mm^2" },
      { symbol: "L", expression: "2m" },
      { symbol: "E", expression: "200GPa" },
    ],
    steps: [
      { title: { en: "Axial stress σ", ja: "軸応力 σ" }, expression: "F/A", targetUnit: "MPa", formulaLatex: "\\sigma = \\dfrac{F}{A}" },
      { title: { en: "Elongation δ", ja: "伸び δ" }, expression: "F*L/(A*E)", targetUnit: "mm", formulaLatex: "\\delta = \\dfrac{FL}{AE}" },
    ],
  },
  {
    title: { en: "Hooke's law for materials (σ = Eε) & microstrain", ja: "材料のフックの法則（σ = Eε）とマイクロストレイン" },
    description: { en: "This is the material form of Hooke's law: stress and strain are linked by Young's modulus alone, so it describes the steel itself and not one particular part. The spring form F = kx in the school science notebooks is different — its stiffness k changes with every length and cross-section. Strain is dimensionless, so the strain at yield of A36 steel (σ_y = 250 MPa, E = 200 GPa) reads naturally in ppm, which engineers call microstrain (µε).", ja: "こちらは「材料の」フックの法則です。応力とひずみを結ぶのは縦弾性係数（ヤング率）だけなので、部品の形に依らず鋼という材料そのものを表します。理科のノートにある「ばねの伸び」F = kx とは別物で、ばね定数kは長さや断面が変わるたびに変わります。ひずみは無次元なので、A36鋼（σ_y=250MPa、E=200GPa）の降伏時のひずみはppm＝マイクロストレイン（µε）で読むと分かりやすくなります。" },
    localConstants: [
      { symbol: "E", expression: "200GPa" },
      { symbol: "ε", expression: "0.0012" },
      { symbol: "σ_y", expression: "250MPa" },
    ],
    steps: [
      { title: { en: "Stress from strain σ = Eε", ja: "ひずみから応力 σ = Eε" }, expression: "E*ε", targetUnit: "MPa", formulaLatex: "\\sigma = E\\varepsilon" },
      { title: { en: "Strain at yield, in microstrain", ja: "降伏時のひずみ（マイクロストレイン）" }, expression: "σ_y/E", targetUnit: "ppm", formulaLatex: "\\varepsilon = \\dfrac{\\sigma_y}{E}" },
    ],
  },
  {
    title: { en: "Poisson's ratio & lateral contraction", ja: "ポアソン比と横ひずみ" },
    description: { en: "A bar stretched along its axis gets thinner across it. Poisson's ratio ν ties the lateral strain to the axial strain (ν ≈ 0.3 for steel, ≈ 0.33 for aluminium). Here a Ø20 mm bar is pulled to 0.001 axial strain, so it loses 6 µm of diameter.", ja: "軸方向に引き伸ばされた棒は、その分だけ横方向に細くなります。ポアソン比νは横ひずみと軸ひずみの比です（鋼で約0.3、アルミで約0.33）。ここでは直径20mmの丸棒を軸ひずみ0.001まで引っ張った場合を計算し、直径が6µm縮むことを確かめます。" },
    localConstants: [
      { symbol: "ν", expression: "0.3" },
      { symbol: "ε", expression: "0.001" },
      { symbol: "d", expression: "20mm" },
    ],
    steps: [
      { title: { en: "Lateral strain ε_lat", ja: "横ひずみ ε_lat" }, expression: "-ν*ε", targetUnit: "", formulaLatex: "\\varepsilon_{lat} = -\\nu\\varepsilon" },
      { title: { en: "Change in diameter Δd", ja: "直径の変化 Δd" }, expression: "-ν*ε*d", targetUnit: "mm", formulaLatex: "\\Delta d = -\\nu\\varepsilon d" },
    ],
  },
  {
    title: { en: "Factor of safety & allowable stress", ja: "安全率と許容応力" },
    description: { en: "Two ways of using the same number. Dividing the yield strength of A36 steel (σ_y = 250 MPa) by the stress actually present gives the factor of safety of the part as built; dividing it by a required factor of safety instead gives the allowable stress you are permitted to design to.", ja: "同じ数字の2通りの使い方です。A36鋼の降伏応力（σ_y=250MPa）を実際に生じている応力で割ると、その部材の安全率が出ます。逆に必要な安全率で割ると、設計で超えてはいけない許容応力が出ます。" },
    localConstants: [
      { symbol: "σ_y", expression: "250MPa" },
      { symbol: "σ", expression: "125MPa" },
      { symbol: "n", expression: "2" },
    ],
    steps: [
      { title: { en: "Factor of safety n", ja: "安全率 n" }, expression: "σ_y/σ", targetUnit: "", formulaLatex: "n = \\dfrac{\\sigma_y}{\\sigma}" },
      { title: { en: "Allowable stress σ_allow", ja: "許容応力 σ_allow" }, expression: "σ_y/n", targetUnit: "MPa", formulaLatex: "\\sigma_{allow} = \\dfrac{\\sigma_y}{n}" },
    ],
  },
  {
    title: { en: "Thermal expansion & constrained thermal stress", ja: "熱膨張と拘束による熱応力" },
    description: { en: "A 6 m steel member (α = 12×10⁻⁶ /K, E = 200 GPa) warmed by 40 K wants to grow 2.88 mm. If both ends are held so it cannot grow at all, that same movement turns into 96 MPa of compressive stress — and note that the stress does not depend on the length at all.", ja: "長さ6mの鋼材（α=12×10⁻⁶ /K、E=200GPa）が40K温まると、2.88mm伸びようとします。両端を完全に拘束して伸びを止めると、その伸びがそのまま96MPaの圧縮応力に変わります。応力の方は長さに全く依らない点に注目してください。" },
    localConstants: [
      { symbol: "α", expression: "12e-6/K" },
      { symbol: "ΔT", expression: "40K" },
      { symbol: "E", expression: "200GPa" },
      { symbol: "L", expression: "6m" },
    ],
    steps: [
      { title: { en: "Free expansion δ_T", ja: "自由な伸び δ_T" }, expression: "α*L*ΔT", targetUnit: "mm", formulaLatex: "\\delta_T = \\alpha L \\Delta T" },
      { title: { en: "Fully constrained stress σ_th", ja: "完全拘束時の熱応力 σ_th" }, expression: "E*α*ΔT", targetUnit: "MPa", formulaLatex: "\\sigma_{th} = E\\alpha\\Delta T" },
    ],
  },
  {
    title: { en: "Pin in double shear & bearing stress", ja: "ピンの二面せん断と支圧応力" },
    description: { en: "A Ø16 mm pin joining a 10 mm plate carries 30 kN. In a double-shear joint the pin is cut by two planes, so each one takes half the load — that is the factor of 2. The bearing stress the pin presses onto the hole wall is a different check with a different area (d×t), and here it is the larger of the two.", ja: "厚さ10mmの板を留める直径16mmのピンに30kNが働く場合です。二面せん断の継手ではピンが2つの面で切られるので、1面あたりの荷重は半分になります（式の2はこれです）。一方、ピンが穴の内壁を押す支圧応力は、面積の取り方（d×t）が異なる別の検定で、この例では支圧応力の方が大きくなります。" },
    localConstants: [
      { symbol: "F", expression: "30kN" },
      { symbol: "d", expression: "16mm" },
      { symbol: "t", expression: "10mm" },
      { symbol: "A", expression: "pi*d^2/4" },
    ],
    steps: [
      { title: { en: "Shear stress in double shear τ", ja: "二面せん断のせん断応力 τ" }, expression: "F/(2*A)", targetUnit: "MPa", formulaLatex: "\\tau = \\dfrac{F}{2A}" },
      { title: { en: "Bearing stress σ_b", ja: "支圧応力 σ_b" }, expression: "F/(d*t)", targetUnit: "MPa", formulaLatex: "\\sigma_b = \\dfrac{F}{dt}" },
    ],
  },
  {
    title: { en: "Principal stresses & maximum shear (Mohr's circle)", ja: "主応力と最大せん断応力（モールの円）" },
    description: { en: "A point under σx = 120 MPa, σy = 40 MPa and τxy = 30 MPa. Mohr's circle is centred at the average of the two normal stresses with radius R; the principal stresses are the two ends of that circle, and R itself is the maximum shear stress. Rotate the element to that angle and the shear disappears — 130 MPa and 30 MPa are all that is left.", ja: "σx=120MPa、σy=40MPa、τxy=30MPaが働く点を考えます。モールの円は2つの垂直応力の平均を中心とし、半径がRです。主応力はこの円の両端で、半径Rそのものが最大せん断応力になります。この角度まで要素を回転させるとせん断応力が消え、130MPaと30MPaだけが残ります。" },
    localConstants: [
      { symbol: "σₓ", expression: "120MPa" },
      { symbol: "σ_y", expression: "40MPa" },
      { symbol: "τ_xy", expression: "30MPa" },
      { symbol: "R", expression: "sqrt(((σₓ-σ_y)/2)^2+τ_xy^2)" },
    ],
    steps: [
      { title: { en: "Major principal stress σ₁", ja: "第1主応力 σ₁" }, expression: "(σₓ+σ_y)/2+R", targetUnit: "MPa", formulaLatex: "\\sigma_1 = \\dfrac{\\sigma_x+\\sigma_y}{2} + R" },
      { title: { en: "Minor principal stress σ₂", ja: "第2主応力 σ₂" }, expression: "(σₓ+σ_y)/2-R", targetUnit: "MPa", formulaLatex: "\\sigma_2 = \\dfrac{\\sigma_x+\\sigma_y}{2} - R" },
      { title: { en: "Maximum shear stress τ_max", ja: "最大せん断応力 τ_max" }, expression: "R", targetUnit: "MPa", formulaLatex: "\\tau_{max} = R" },
    ],
  },
  {
    title: { en: "Stress concentration at a hole", ja: "穴まわりの応力集中" },
    description: { en: "A 60 mm wide, 8 mm thick strap with a Ø20 mm hole carries 15 kN. Spreading the load over the remaining net section gives only 46.9 MPa, but the stress crowds around the edge of the hole: with a concentration factor K_t of about 2.4 the real peak is 112.5 MPa. This peak, not the nominal value, is what starts a fatigue crack.", ja: "幅60mm・厚さ8mmの帯板に直径20mmの穴が開き、15kNが働く場合です。穴を除いた正味断面で荷重を均すと46.9MPaにしかなりませんが、応力は穴の縁に集中します。応力集中係数K_tを2.4とすると実際のピークは112.5MPaです。疲労き裂の起点になるのは公称応力ではなくこのピーク値です。" },
    localConstants: [
      { symbol: "F", expression: "15kN" },
      { symbol: "w", expression: "60mm" },
      { symbol: "d", expression: "20mm" },
      { symbol: "t", expression: "8mm" },
      { symbol: "Kₜ", expression: "2.4" },
    ],
    steps: [
      { title: { en: "Nominal stress on the net section σ_nom", ja: "正味断面の公称応力 σ_nom" }, expression: "F/((w-d)*t)", targetUnit: "MPa", formulaLatex: "\\sigma_{nom} = \\dfrac{F}{(w-d)t}" },
      { title: { en: "Peak stress at the hole σ_max", ja: "穴の縁のピーク応力 σ_max" }, expression: "Kₜ*F/((w-d)*t)", targetUnit: "MPa", formulaLatex: "\\sigma_{max} = K_t\\dfrac{F}{(w-d)t}" },
    ],
  },
];
