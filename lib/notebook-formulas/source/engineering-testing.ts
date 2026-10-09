import type { NotebookSeed } from "../types";

/**
 * 材料試験のカテゴリ。試験片から材料の値（降伏点・引張強さ・ヤング率・硬さ・衝撃値）を読み出す計算で、
 * 出てきた σ_y・σ_B は「応力・ひずみ・安全率」や「疲労・破壊力学」のノートにそのまま持ち込める。
 * 既定値は規格の標準試験片（ASTM E8/E8M の Ø12.5mm 丸棒、ASTM E23 のVノッチ、ASTM C39 のφ100×200）
 * と、それに見合う実在の材料（機械構造用炭素鋼 S45C・AISI 1045 相当）から取っている。
 */
export const ENG_TESTING_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Tensile test: yield, tensile strength, elongation & reduction of area", ja: "引張試験：降伏点・引張強さ・破断伸び・絞り" },
    description: { en: "A standard ASTM E8/E8M round specimen (Ø12.5 mm, 50 mm gauge length) of AISI 1045 steel yields at 40 kN and breaks after a maximum load of 76.7 kN. The marks end up 58.5 mm apart and the neck shrinks to Ø8.9 mm. Dividing the loads by the original cross-section gives the engineering yield and tensile strengths; the two percentages describe ductility.", ja: "ASTM E8/E8M の標準丸棒試験片（直径12.5mm・標点距離50mm）でS45C相当の炭素鋼を引っ張り、40kNで降伏、最大荷重76.7kNで破断した場合です。破断後の標点間は58.5mm、くびれた部分の直径は8.9mmでした。荷重を元の断面積で割ると降伏点と引張強さが、2つの百分率から延性が分かります。" },
    // 下付きの y は Unicode に無いので、このノートの記号は全部 ASCII の `_` に寄せる（CLAUDE.md の表記ルール）。
    localConstants: [
      { symbol: "d_0", expression: "12.5mm" },
      { symbol: "L_0", expression: "50.0mm" },
      { symbol: "F_y", expression: "40.0kN" },
      { symbol: "F_m", expression: "76.7kN" },
      { symbol: "L_u", expression: "58.5mm" },
      { symbol: "d_u", expression: "8.90mm" },
    ],
    steps: [
      { title: { en: "Original cross-section A_0", ja: "元の断面積 A_0" }, expression: "π*d_0^2/4", targetUnit: "mm²", resultSymbol: "A_0", formulaLatex: "A_0 = \\dfrac{\\pi d_0^2}{4}" },
      { title: { en: "Yield strength σ_y", ja: "降伏点 σ_y" }, expression: "F_y/A_0", targetUnit: "MPa", formulaLatex: "\\sigma_y = \\dfrac{F_y}{A_0}" },
      { title: { en: "Tensile strength σ_B", ja: "引張強さ σ_B" }, expression: "F_m/A_0", targetUnit: "MPa", formulaLatex: "\\sigma_B = \\dfrac{F_m}{A_0}" },
      { title: { en: "Elongation after fracture", ja: "破断伸び" }, expression: "(L_u-L_0)/L_0", targetUnit: "%", formulaLatex: "\\delta = \\dfrac{L_u - L_0}{L_0}" },
      { title: { en: "Reduction of area", ja: "絞り" }, expression: "1-(d_u/d_0)^2", targetUnit: "%", formulaLatex: "\\varphi = \\dfrac{A_0 - A_u}{A_0} = 1 - \\left(\\dfrac{d_u}{d_0}\\right)^2" },
    ],
  },
  {
    title: { en: "Young's modulus & 0.2% proof strain from a stress–strain curve", ja: "応力-ひずみ線図からヤング率と0.2%耐力のひずみ" },
    description: { en: "Two points read off the straight, elastic part of a stress–strain curve give Young's modulus as the slope. Materials without a clear yield point use the 0.2% proof stress instead: the stress where a line of that slope, shifted by 0.2% strain, meets the curve. The second step gives the total strain at that point, i.e. how far along the strain axis to look.", ja: "応力-ひずみ線図の直線部分（弾性域）から2点を読むと、その傾きがヤング率になります。はっきりした降伏点が無い材料では、同じ傾きの直線をひずみ0.2%だけずらして曲線と交わる応力を0.2%耐力とします。2つ目の手順は、その点での全ひずみ＝線図の横軸のどこを見ればよいかを出します。" },
    localConstants: [
      { symbol: "σ₁", expression: "40.0MPa" },
      { symbol: "ε₁", expression: "0.000200" },
      { symbol: "σ₂", expression: "200MPa" },
      { symbol: "ε₂", expression: "0.000980" },
      { symbol: "σₚ", expression: "330MPa" },
    ],
    steps: [
      { title: { en: "Young's modulus E (slope of the elastic line)", ja: "ヤング率 E（弾性域の傾き）" }, expression: "(σ₂-σ₁)/(ε₂-ε₁)", targetUnit: "GPa", formulaLatex: "E = \\dfrac{\\sigma_2 - \\sigma_1}{\\varepsilon_2 - \\varepsilon_1}" },
      { title: { en: "Total strain at the 0.2% proof stress", ja: "0.2%耐力での全ひずみ" }, expression: "σₚ/E + 0.002", targetUnit: "%", formulaLatex: "\\varepsilon = \\dfrac{\\sigma_p}{E} + 0.002" },
    ],
  },
  {
    title: { en: "True stress & true strain", ja: "真応力と真ひずみ" },
    description: { en: "Engineering stress divides by the original area, but the specimen gets thinner as it stretches. As long as it deforms uniformly (before necking) and keeps its volume, the true stress and true (logarithmic) strain follow directly from the engineering values. Here 500 MPa at 10% strain becomes 550 MPa at a true strain of 9.5%.", ja: "公称応力は元の断面積で割りますが、試験片は伸びるにつれて細くなります。くびれが始まる前（一様伸びの範囲）で体積が変わらないとみなせば、真応力と真ひずみ（対数ひずみ）は公称値からそのまま求まります。公称で500MPa・ひずみ10%のとき、真応力は550MPa、真ひずみは9.5%になります。" },
    localConstants: [
      { symbol: "σₙ", expression: "500MPa" },
      { symbol: "εₙ", expression: "0.100" },
    ],
    steps: [
      { title: { en: "True stress σ_t", ja: "真応力 σ_t" }, expression: "σₙ*(1+εₙ)", targetUnit: "MPa", formulaLatex: "\\sigma_t = \\sigma_n (1 + \\varepsilon_n)" },
      { title: { en: "True strain ε_t", ja: "真ひずみ ε_t" }, expression: "ln(1+εₙ)", targetUnit: "%", formulaLatex: "\\varepsilon_t = \\ln(1 + \\varepsilon_n)" },
    ],
  },
  {
    title: { en: "Vickers hardness & estimated tensile strength", ja: "ビッカース硬さと引張強さの目安" },
    description: { en: "An HV10 test presses a diamond pyramid in with a 10 kgf force; the mean diagonal of the indent is 0.250 mm. Hardness is the force over the indent's surface area in kgf/mm², which works out to 0.1891·F/d² with F in newtons. For steels, the tensile strength is roughly 3.3 × HV in MPa (a rule of thumb, not a substitute for a tensile test).", ja: "HV10の試験で、10kgfの力でダイヤモンドの四角錐を押し込み、くぼみの対角線の平均が0.250mmだった場合です。ビッカース硬さは「力÷くぼみの表面積」をkgf/mm²で表した値で、力をNで書くと 0.1891·F/d² になります。鋼なら引張強さは HV の約3.3倍（MPa）が目安です（引張試験の代わりにはなりません）。" },
    localConstants: [
      // 試験力 HV10 は規格で決まる値（測定値ではない）。
      { symbol: "F", expression: "10kgf", exact: true },
      { symbol: "d", expression: "0.250mm" },
    ],
    steps: [
      { title: { en: "Vickers hardness HV", ja: "ビッカース硬さ HV" }, expression: "0.1891*F/d^2/(N/mm^2)", targetUnit: "", formulaLatex: "HV = 0.1891\\,\\dfrac{F}{d^2}" },
      { title: { en: "Estimated tensile strength (steel)", ja: "引張強さの目安（鋼）" }, expression: "3.3*s1*MPa", targetUnit: "MPa", formulaLatex: "\\sigma_B \\approx 3.3\\,HV" },
    ],
  },
  {
    title: { en: "Charpy impact test: absorbed energy", ja: "シャルピー衝撃試験の吸収エネルギー" },
    description: { en: "A pendulum hammer (27 kg, 0.8 m arm) is released from 140° and swings through after breaking an ASTM E23 V-notch specimen, rising only to 70°. The potential energy it lost went into breaking the specimen. Dividing by the 8 × 10 mm ligament under the notch gives the impact value per area that older standards quote.", ja: "質量27kg・腕の長さ0.8mの振り子ハンマーを140°から振り下ろし、ASTM E23 のVノッチ試験片を割ったあと70°までしか振り上がらなかった場合です。失った位置エネルギーが試験片を割るのに使われた吸収エネルギーです。ノッチ下の断面（8×10mm）で割ると、古い規格で使われる単位面積あたりの衝撃値になります。" },
    localConstants: [
      { symbol: "m", expression: "27.0kg" },
      { symbol: "R", expression: "0.800m" },
      { symbol: "g", expression: "9.80665m/s^2", exact: true },
      { symbol: "α", expression: "140deg" },
      { symbol: "β", expression: "70.0deg" },
      { symbol: "A", expression: "80.0mm^2" },
    ],
    steps: [
      { title: { en: "Absorbed energy E", ja: "吸収エネルギー E" }, expression: "m*g*R*(cos(β)-cos(α))", targetUnit: "J", formulaLatex: "E = mgR(\\cos\\beta - \\cos\\alpha)" },
      { title: { en: "Impact value per area", ja: "衝撃値（単位面積あたり）" }, expression: "s1/A", targetUnit: "J/cm²", formulaLatex: "a_k = \\dfrac{E}{A}" },
    ],
  },
  {
    title: { en: "Compressive strength of a concrete cylinder (Ø100 × 200)", ja: "コンクリート円柱供試体（φ100×200）の圧縮強度" },
    description: { en: "A Ø100 × 200 mm concrete cylinder (ASTM C39 / JIS A 1108) fails at 314 kN. The compressive strength is the failure load over the circular cross-section; 40 MPa is a typical value for structural concrete at 28 days.", ja: "φ100×200mmのコンクリート円柱供試体（ASTM C39 / JIS A 1108）が314kNで破壊した場合です。圧縮強度は破壊荷重を円形断面で割った値で、40MPaは構造用コンクリートの材齢28日として標準的な値です。" },
    localConstants: [
      { symbol: "P", expression: "314kN" },
      { symbol: "d", expression: "100mm" },
    ],
    steps: [
      { title: { en: "Cross-sectional area A", ja: "断面積 A" }, expression: "π*d^2/4", targetUnit: "mm²", formulaLatex: "A = \\dfrac{\\pi d^2}{4}" },
      { title: { en: "Compressive strength f_c", ja: "圧縮強度 f_c" }, expression: "P/s1", targetUnit: "MPa", formulaLatex: "f_c = \\dfrac{P}{A}" },
    ],
  },
];

/**
 * 疲労・破壊力学のカテゴリ。前半が疲労試験と疲労設計（応力の振幅・試験時間・疲労限度・グッドマン・S-N・
 * マイナー則）、後半が破壊力学（試験片ごとの応力拡大係数・J積分・有効性判定・臨界き裂長さ・パリス則）。
 * 試験片の式は ASTM E399 / E647 / E1820 の付属書の形のまま書いてある（係数を丸めないこと）。
 * K の単位 MPa√m はエンジンが次元の指数を0.5刻みまで扱えるようになって初めて書ける（2026-10）。
 */
export const ENG_FATIGUE_FRACTURE_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Stress amplitude, mean stress & stress ratio", ja: "応力振幅・平均応力・応力比" },
    description: { en: "Every fatigue calculation starts by splitting a cyclic load into its amplitude and its mean. Here the stress swings between +300 MPa and −100 MPa. The stress ratio R = σ_min/σ_max labels the test condition: R = −1 is fully reversed, R = 0 is pulsating tension, R = 0.1 is the usual crack-growth test.", ja: "疲労の計算は、繰り返す応力を「振幅」と「平均」に分けるところから始まります。ここでは応力が +300MPa と −100MPa の間を往復します。応力比 R = σ_min/σ_max は試験条件の呼び名で、R = −1 が両振り、R = 0 が片振り（引張）、R = 0.1 がき裂進展試験でよく使う条件です。" },
    localConstants: [
      { symbol: "σₘₐₓ", expression: "300MPa" },
      { symbol: "σₘᵢₙ", expression: "-100MPa" },
    ],
    steps: [
      { title: { en: "Stress amplitude σ_a", ja: "応力振幅 σ_a" }, expression: "(σₘₐₓ-σₘᵢₙ)/2", targetUnit: "MPa", formulaLatex: "\\sigma_a = \\dfrac{\\sigma_{max} - \\sigma_{min}}{2}" },
      { title: { en: "Mean stress σ_m", ja: "平均応力 σ_m" }, expression: "(σₘₐₓ+σₘᵢₙ)/2", targetUnit: "MPa", formulaLatex: "\\sigma_m = \\dfrac{\\sigma_{max} + \\sigma_{min}}{2}" },
      { title: { en: "Stress ratio R", ja: "応力比 R" }, expression: "σₘᵢₙ/σₘₐₓ", targetUnit: "", formulaLatex: "R = \\dfrac{\\sigma_{min}}{\\sigma_{max}}" },
    ],
  },
  {
    title: { en: "Fatigue test duration from cycles & frequency", ja: "疲労試験の所要時間（繰返し数と周波数）" },
    description: { en: "How long does a run-out test take? 10⁷ cycles is the usual limit for declaring a steel specimen run-out, and 100 Hz is typical for a resonant or servo-hydraulic machine. The time is simply cycles ÷ frequency: about 28 hours, a little over a day per specimen.", ja: "打ち切りまで回すと何時間かかるかの計算です。鋼の疲労試験は10⁷回で打ち切り（未破断）とするのが一般的で、共振型や油圧サーボ式の試験機なら100Hz前後で回します。時間は「回数÷周波数」で、1本あたり約28時間＝1日強です。" },
    localConstants: [
      // 繰返し数は数えた量（打ち切り回数の設定値）なので測定値ではない。
      { symbol: "N", expression: "1e7", exact: true },
      { symbol: "f", expression: "100Hz" },
    ],
    steps: [
      { title: { en: "Test duration t (hours)", ja: "所要時間 t（時間）" }, expression: "N/f", targetUnit: "h", formulaLatex: "t = \\dfrac{N}{f}" },
      { title: { en: "Test duration (days)", ja: "所要時間（日）" }, expression: "N/f", targetUnit: "d" },
    ],
  },
  {
    title: { en: "Estimating the endurance limit (surface & size factors)", ja: "疲労限度の推定（表面・寸法の補正）" },
    description: { en: "Without test data, a steel's rotating-bending endurance limit is about half its tensile strength (up to 1400 MPa). A real part is weaker than the polished lab specimen: a machined surface and a Ø30 mm diameter each knock it down (Marin factors, as in Shigley). For S45C/1045 at 625 MPa this gives about 220 MPa.", ja: "試験データが無いとき、鋼の回転曲げ疲労限度は引張強さの約半分（1400MPaまで）が目安です。実際の部品は磨いた試験片より弱く、機械加工の表面と直径30mmという寸法がそれぞれ割り引きます（マリンの係数。シグリーの教科書の形）。S45C相当（625MPa）ではおよそ220MPaになります。" },
    localConstants: [
      { symbol: "σ_B", expression: "625MPa" },
      { symbol: "d", expression: "30.0mm" },
    ],
    steps: [
      { title: { en: "Specimen endurance limit σ_w0", ja: "試験片の疲労限度 σ_w0" }, expression: "σ_B/2", targetUnit: "MPa", resultSymbol: "σ_w0", formulaLatex: "\\sigma_{w0} \\approx 0.5\\,\\sigma_B" },
      { title: { en: "Surface factor k_a (machined)", ja: "表面係数 k_a（機械加工）" }, expression: "4.51*(σ_B/MPa)^-0.265", targetUnit: "", resultSymbol: "k_a", formulaLatex: "k_a = 4.51\\,\\sigma_B^{-0.265}" },
      { title: { en: "Size factor k_b (rotating shaft)", ja: "寸法係数 k_b（回転軸）" }, expression: "1.24*(d/mm)^-0.107", targetUnit: "", formulaLatex: "k_b = 1.24\\,d^{-0.107}" },
      { title: { en: "Endurance limit of the part σ_w", ja: "部品の疲労限度 σ_w" }, expression: "k_a*k_b*σ_w0", targetUnit: "MPa", formulaLatex: "\\sigma_w = k_a k_b\\,\\sigma_{w0}" },
    ],
  },
  {
    title: { en: "Fatigue safety factor (modified Goodman)", ja: "疲労安全率（修正グッドマン線図）" },
    description: { en: "A mean stress lowers how much amplitude a part can take. The modified Goodman line joins the endurance limit on the amplitude axis to the tensile strength on the mean-stress axis; the safety factor is how far the working point sits inside that line. With 150 MPa amplitude on 100 MPa mean, the 1045 shaft above comes out at about 1.2.", ja: "平均応力が加わると、耐えられる振幅は小さくなります。修正グッドマン線図は、振幅の軸の疲労限度と平均応力の軸の引張強さを結んだ直線で、安全率は使用点がその線の内側にどれだけ余裕があるかです。平均100MPaに振幅150MPaが重なると、上のS45C軸ではおよそ1.2になります。" },
    localConstants: [
      { symbol: "σ_a", expression: "150MPa" },
      { symbol: "σ_m", expression: "100MPa" },
      { symbol: "σ_w", expression: "220MPa" },
      { symbol: "σ_B", expression: "625MPa" },
    ],
    steps: [
      { title: { en: "Fatigue safety factor n", ja: "疲労安全率 n" }, expression: "1/(σ_a/σ_w + σ_m/σ_B)", targetUnit: "", formulaLatex: "\\dfrac{1}{n} = \\dfrac{\\sigma_a}{\\sigma_w} + \\dfrac{\\sigma_m}{\\sigma_B}" },
    ],
  },
  {
    title: { en: "Fatigue life from the S–N curve (Basquin)", ja: "S-N曲線から疲労寿命（バスキン則）" },
    description: { en: "Above the endurance limit, the S–N curve is a straight line on log–log axes: σ_a = σ_f′(2N)^b. Turned around, it gives the number of cycles to failure for a given amplitude. With typical values for normalized 1045 steel (σ_f′ = 930 MPa, b = −0.085), 300 MPa amplitude lasts about 3 × 10⁵ cycles.", ja: "疲労限度より上では、S-N曲線は両対数で直線になります：σ_a = σ_f′(2N)^b。これを逆に解くと、ある振幅で何回もつかが出ます。焼ならしたS45C相当の代表値（σ_f′ = 930MPa、b = −0.085）では、振幅300MPaでおよそ3×10⁵回です。" },
    localConstants: [
      { symbol: "σ_a", expression: "300MPa" },
      { symbol: "σ_f", expression: "930MPa" },
      { symbol: "b", expression: "-0.085" },
    ],
    steps: [
      { title: { en: "Cycles to failure N", ja: "破断までの繰返し数 N" }, expression: "(σ_a/σ_f)^(1/b)/2", targetUnit: "", formulaLatex: "N = \\dfrac{1}{2}\\left(\\dfrac{\\sigma_a}{\\sigma_f'}\\right)^{1/b}" },
    ],
  },
  {
    title: { en: "Cumulative damage (Miner's rule)", ja: "累積損傷（マイナー則）" },
    description: { en: "A part rarely sees one stress level. Miner's rule adds up, for each level, the cycles applied divided by the cycles that level would take to failure. Failure is expected when the sum D reaches 1, so 1/D says how many times the whole load history could be repeated.", ja: "部品が1つの応力レベルだけを受けることはまれです。マイナー則は、レベルごとに「加えた回数÷そのレベルでの寿命」を足し合わせ、その和 D が1に達したら破壊すると考えます。1/D は、同じ荷重履歴をあと何回繰り返せるかを表します。" },
    localConstants: [
      { symbol: "n₁", expression: "2.0e4", exact: true },
      { symbol: "N₁", expression: "1.0e5" },
      { symbol: "n₂", expression: "1.0e5", exact: true },
      { symbol: "N₂", expression: "1.0e6" },
      { symbol: "n₃", expression: "5.0e5", exact: true },
      { symbol: "N₃", expression: "1.0e7" },
    ],
    steps: [
      { title: { en: "Damage sum D", ja: "損傷和 D" }, expression: "n₁/N₁ + n₂/N₂ + n₃/N₃", targetUnit: "", formulaLatex: "D = \\sum \\dfrac{n_i}{N_i}" },
      { title: { en: "Repeats of the load history until failure", ja: "破壊までに荷重履歴を繰り返せる回数" }, expression: "1/s1", targetUnit: "", formulaLatex: "\\dfrac{1}{D}" },
    ],
  },
  {
    title: { en: "Fatigue notch factor from K_t", ja: "応力集中係数から切欠き係数" },
    description: { en: "A notch does not hurt fatigue strength by the full elastic stress concentration K_t; how much it does depends on the material's notch sensitivity q (0 = insensitive, 1 = fully sensitive). The fatigue notch factor K_f then divides the endurance limit. With the hole from the stress-concentration notebook (K_t = 2.4) and q = 0.85, the 220 MPa limit drops to about 100 MPa.", ja: "切欠きは、弾性の応力集中係数 K_t の分だけそのまま疲労強度を下げるわけではありません。どれだけ効くかは材料の切欠き感度 q（0＝鈍感、1＝敏感）で決まり、切欠き係数 K_f で疲労限度を割ります。応力集中のノートの穴（K_t = 2.4）と q = 0.85 では、220MPaの疲労限度がおよそ100MPaまで下がります。" },
    localConstants: [
      { symbol: "Kₜ", expression: "2.4" },
      { symbol: "q", expression: "0.85" },
      { symbol: "σ_w", expression: "220MPa" },
    ],
    steps: [
      { title: { en: "Fatigue notch factor K_f", ja: "切欠き係数 K_f" }, expression: "1+q*(Kₜ-1)", targetUnit: "", formulaLatex: "K_f = 1 + q(K_t - 1)" },
      { title: { en: "Endurance limit at the notch", ja: "切欠き部の疲労限度" }, expression: "σ_w/s1", targetUnit: "MPa", formulaLatex: "\\sigma_{wk} = \\dfrac{\\sigma_w}{K_f}" },
    ],
  },
  {
    title: { en: "Stress intensity of a compact tension C(T) specimen (ASTM E399 / E647)", ja: "CT試験片の応力拡大係数（ASTM E399 / E647）" },
    description: { en: "The compact tension specimen is the workhorse of fracture-toughness and crack-growth testing. Its K is the load over B√W times a geometry function of a/W, given in ASTM E399 and E647 (valid for 0.2 ≤ a/W ≤ 1). For a 1T specimen (W = 50 mm, B = 25 mm) with a/W = 0.5 at 10 kN, K is about 17 MPa√m.", ja: "CT試験片は破壊靭性試験・き裂進展試験で最もよく使う試験片です。K は「荷重÷(B√W)」に a/W の形状関数を掛けたもので、式は ASTM E399・E647 にあります（0.2 ≤ a/W ≤ 1 で有効）。1T試験片（W = 50mm、B = 25mm）で a/W = 0.5、荷重10kNなら K はおよそ17MPa√mです。" },
    localConstants: [
      { symbol: "P", expression: "10.0kN" },
      { symbol: "B", expression: "25.0mm" },
      { symbol: "W", expression: "50.0mm" },
      { symbol: "a", expression: "25.0mm" },
    ],
    steps: [
      { title: { en: "Relative crack length α = a/W", ja: "き裂長さ比 α = a/W" }, expression: "a/W", targetUnit: "", formulaLatex: "\\alpha = \\dfrac{a}{W}" },
      { title: { en: "Geometry function f(α)", ja: "形状関数 f(α)" }, expression: "(2+s1)/(1-s1)^1.5*(0.886+4.64*s1-13.32*s1^2+14.72*s1^3-5.6*s1^4)", targetUnit: "", formulaLatex: "f = \\dfrac{2+\\alpha}{(1-\\alpha)^{3/2}}\\left(0.886 + 4.64\\alpha - 13.32\\alpha^2 + 14.72\\alpha^3 - 5.6\\alpha^4\\right)" },
      { title: { en: "Stress intensity factor K", ja: "応力拡大係数 K" }, expression: "P/(B*√W)*s2", targetUnit: "MPa√m", formulaLatex: "K = \\dfrac{P}{B\\sqrt{W}}\\,f(\\alpha)" },
    ],
  },
  {
    title: { en: "Stress intensity of a three-point bend SE(B) specimen (ASTM E1820 / E399)", ja: "三点曲げSE(B)試験片の応力拡大係数（ASTM E1820 / E399）" },
    description: { en: "The single-edge bend specimen is loaded in three-point bending over a span S = 4W. ASTM E1820 and E399 give K as P·S/(B·W^1.5) times a geometry function of a/W. For W = 20 mm, B = 10 mm, a/W = 0.5 and 5 kN, K is about 38 MPa√m. With side grooves, E1820 replaces B by √(B·B_N).", ja: "SE(B)試験片は、スパン S = 4W の三点曲げで荷重をかける試験片です。ASTM E1820・E399 では K を「P·S/(B·W^1.5)」に a/W の形状関数を掛けて求めます。W = 20mm、B = 10mm、a/W = 0.5、荷重5kNなら K はおよそ38MPa√mです。サイドグルーブ付きでは E1820 は B を √(B·B_N) に置き換えます。" },
    localConstants: [
      { symbol: "P", expression: "5.00kN" },
      { symbol: "B", expression: "10.0mm" },
      { symbol: "W", expression: "20.0mm" },
      { symbol: "S", expression: "80.0mm" },
      { symbol: "a", expression: "10.0mm" },
    ],
    steps: [
      { title: { en: "Relative crack length α = a/W", ja: "き裂長さ比 α = a/W" }, expression: "a/W", targetUnit: "", formulaLatex: "\\alpha = \\dfrac{a}{W}" },
      { title: { en: "Geometry function f(α)", ja: "形状関数 f(α)" }, expression: "3*√s1*(1.99-s1*(1-s1)*(2.15-3.93*s1+2.7*s1^2))/(2*(1+2*s1)*(1-s1)^1.5)", targetUnit: "", formulaLatex: "f = \\dfrac{3\\sqrt{\\alpha}\\left[1.99 - \\alpha(1-\\alpha)(2.15 - 3.93\\alpha + 2.7\\alpha^2)\\right]}{2(1+2\\alpha)(1-\\alpha)^{3/2}}" },
      { title: { en: "Stress intensity factor K", ja: "応力拡大係数 K" }, expression: "P*S/(B*W^1.5)*s2", targetUnit: "MPa√m", formulaLatex: "K = \\dfrac{PS}{BW^{3/2}}\\,f(\\alpha)" },
    ],
  },
  {
    title: { en: "ΔK of a middle-crack tension M(T) specimen (ASTM E647)", ja: "中央き裂M(T)試験片のΔK（ASTM E647）" },
    description: { en: "The middle-crack tension panel is the thin-sheet specimen of ASTM E647, used for aluminium alloys and aircraft skins. W is the full width and 2a the total crack length. A load range of 20 kN on a 100 mm × 6 mm panel with a 20 mm crack gives ΔK of about 6 MPa√m — near the start of a typical da/dN curve.", ja: "M(T)試験片は ASTM E647 の薄板用の試験片で、アルミ合金や航空機の外板に使います。W は全幅、2a はき裂の全長です。幅100mm・厚さ6mmの板に長さ20mmのき裂があり、荷重範囲が20kNなら ΔK はおよそ6MPa√m で、典型的な da/dN 曲線の出だし付近です。" },
    localConstants: [
      { symbol: "ΔP", expression: "20.0kN" },
      { symbol: "B", expression: "6.00mm" },
      { symbol: "W", expression: "100mm" },
      { symbol: "a", expression: "10.0mm" },
    ],
    steps: [
      { title: { en: "Relative crack length α = 2a/W", ja: "き裂長さ比 α = 2a/W" }, expression: "2*a/W", targetUnit: "", formulaLatex: "\\alpha = \\dfrac{2a}{W}" },
      { title: { en: "Stress intensity range ΔK", ja: "応力拡大係数範囲 ΔK" }, expression: "ΔP/B*√(π*s1/(2*W)/cos(π*s1/2))", targetUnit: "MPa√m", formulaLatex: "\\Delta K = \\dfrac{\\Delta P}{B}\\sqrt{\\dfrac{\\pi\\alpha}{2W}\\sec\\dfrac{\\pi\\alpha}{2}}" },
    ],
  },
  {
    title: { en: "Fatigue crack growth rate (Paris law, ASTM E647)", ja: "疲労き裂進展速度（パリス則・ASTM E647）" },
    description: { en: "In the middle of the da/dN curve, crack growth per cycle follows a power law of ΔK. Barsom's values for ferrite–pearlite steels are C = 6.9 × 10⁻¹² m/cycle and n = 3.0 with ΔK in MPa√m. At ΔK = 20 MPa√m the crack grows about 0.055 µm per cycle, so 1 mm of growth takes some 18,000 cycles (at constant ΔK).", ja: "da/dN 曲線の中間域では、1サイクルあたりのき裂進展量が ΔK のべき乗に従います。フェライト・パーライト鋼のバーソムの値は C = 6.9×10⁻¹² m/cycle、n = 3.0（ΔK は MPa√m）です。ΔK = 20MPa√m では1サイクルに約0.055µm進むので、1mm進むのにおよそ1.8万サイクルかかります（ΔK一定とした場合）。" },
    localConstants: [
      { symbol: "C", expression: "6.9e-12m" },
      { symbol: "n", expression: "3.0" },
      { symbol: "ΔK", expression: "20.0MPa√m" },
      { symbol: "Δa", expression: "1.00mm" },
    ],
    steps: [
      { title: { en: "Crack growth per cycle da/dN", ja: "1サイクルあたりの進展量 da/dN" }, expression: "C*(ΔK/(MPa√m))^n", targetUnit: "µm", formulaLatex: "\\dfrac{da}{dN} = C\\,(\\Delta K)^n" },
      { title: { en: "Cycles to grow Δa (constant ΔK)", ja: "Δa 進むまでのサイクル数（ΔK一定）" }, expression: "Δa/s1", targetUnit: "", formulaLatex: "N = \\dfrac{\\Delta a}{da/dN}" },
    ],
  },
  {
    title: { en: "Fracture toughness from the J-integral (ASTM E1820)", ja: "J積分から破壊靭性 K_J（ASTM E1820）" },
    description: { en: "Tough steels yield too much for a valid linear-elastic K_IC test, so ASTM E1820 measures the J-integral instead and converts it to an equivalent K under plane strain. J = 50 kJ/m² on a steel with E = 205 GPa and ν = 0.3 corresponds to about 106 MPa√m.", ja: "靭性の高い鋼は降伏が大きすぎて線形弾性の K_IC 試験が成立しないので、ASTM E1820 では J積分を測り、平面ひずみの等価な K に換算します。E = 205GPa・ν = 0.3 の鋼で J = 50kJ/m² なら、およそ106MPa√mです。" },
    localConstants: [
      { symbol: "J", expression: "50.0kJ/m^2" },
      { symbol: "E", expression: "205GPa" },
      { symbol: "ν", expression: "0.30" },
    ],
    steps: [
      { title: { en: "Equivalent fracture toughness K_J", ja: "等価な破壊靭性 K_J" }, expression: "√(J*E/(1-ν^2))", targetUnit: "MPa√m", formulaLatex: "K_J = \\sqrt{\\dfrac{JE}{1-\\nu^2}}" },
    ],
  },
  {
    title: { en: "Validity of a K_IC test: specimen size (ASTM E399)", ja: "K_IC試験の有効性：試験片寸法（ASTM E399）" },
    description: { en: "A K_Q result only counts as the plane-strain toughness K_IC if the specimen is large compared with the plastic zone: thickness B and crack length a must both exceed 2.5(K_Q/σ_YS)². For a high-strength steel (σ_YS = 1000 MPa) with K_Q = 60 MPa√m that is 9 mm, so the 1T C(T) specimen (B = 25 mm, a = 25 mm) qualifies.", ja: "K_Q の結果が平面ひずみ破壊靭性 K_IC として認められるのは、塑性域に比べて試験片が十分大きいときだけです。板厚 B とき裂長さ a がどちらも 2.5(K_Q/σ_YS)² 以上でなければなりません。高強度鋼（σ_YS = 1000MPa）で K_Q = 60MPa√m なら9mmで、1TのCT試験片（B = 25mm、a = 25mm）は条件を満たします。" },
    localConstants: [
      { symbol: "K_Q", expression: "60.0MPa√m" },
      { symbol: "σ_YS", expression: "1000MPa" },
      { symbol: "B", expression: "25.0mm" },
    ],
    steps: [
      { title: { en: "Required minimum B and a", ja: "必要な最小の B と a" }, expression: "2.5*(K_Q/σ_YS)^2", targetUnit: "mm", formulaLatex: "B,\\ a \\ge 2.5\\left(\\dfrac{K_Q}{\\sigma_{YS}}\\right)^2" },
      { title: { en: "Margin: B / required size", ja: "余裕：B ÷ 必要寸法" }, expression: "B/s1", targetUnit: "" },
    ],
  },
  {
    title: { en: "Critical crack length from fracture toughness", ja: "破壊靭性から臨界き裂長さ" },
    description: { en: "K = Yσ√(πa) links the stress, the crack size and the stress intensity. A 2 mm surface crack (Y = 1.12) under 400 MPa gives K ≈ 35 MPa√m. Turning the formula around with the material's K_IC = 60 MPa√m gives the crack length at which the part fractures: about 5.7 mm. That length is what inspection intervals are planned against.", ja: "K = Yσ√(πa) は、応力・き裂の大きさ・応力拡大係数を結ぶ式です。400MPaの応力下にある深さ2mmの表面き裂（Y = 1.12）では K ≈ 35MPa√m。これを材料の K_IC = 60MPa√m で逆に解くと、破壊するき裂長さはおよそ5.7mmです。点検間隔はこの長さを基準に決めます。" },
    localConstants: [
      { symbol: "Y", expression: "1.12" },
      { symbol: "σ", expression: "400MPa" },
      { symbol: "a", expression: "2.00mm" },
      { symbol: "K_IC", expression: "60.0MPa√m" },
    ],
    steps: [
      { title: { en: "Stress intensity K at the present crack", ja: "現在のき裂の応力拡大係数 K" }, expression: "Y*σ*√(π*a)", targetUnit: "MPa√m", formulaLatex: "K = Y\\sigma\\sqrt{\\pi a}" },
      { title: { en: "Critical crack length a_c", ja: "臨界き裂長さ a_c" }, expression: "(K_IC/(Y*σ))^2/π", targetUnit: "mm", formulaLatex: "a_c = \\dfrac{1}{\\pi}\\left(\\dfrac{K_{IC}}{Y\\sigma}\\right)^2" },
    ],
  },
];
