import type { NotebookSeed } from "../types";

/**
 * 「軸・ねじり・動力伝達」。回転数（rpm）を本物の単位として扱えるので、教科書の9550・5252・/60
 * といった換算定数を持ち出さずに、動力・トルク・回転数をそのまま行き来できる。
 * 記号は T（トルク）・n（回転数）・J（断面二次極モーメント／慣性モーメント）で統一している。
 */
export const ENG_POWER_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Power, torque and rotational speed", ja: "動力・トルク・回転数" },
    description: { en: "Convert between shaft power, torque and rotational speed in either direction. The familiar 9550 (kW, N·m, rpm) and 5252 (hp, lb-ft, rpm) constants disappear here, because rpm is a real unit rather than a bare number: the formula stays P = 2πnT and the units do the conversion themselves.", ja: "軸の動力・トルク・回転数を、どちらの向きにも換算します。ここではrpmを本物の単位として扱うため、おなじみの9550（kW・N·m・rpm）や5252（hp・lb-ft・rpm）といった換算定数は出てきません。式は P = 2πnT のままで、換算は単位が引き受けます。" },
    // 2つの手順は向きが逆（動力を出す／トルクを出す）なので、与える側の定数は
    // 添字付きで分けてある。結果記号は数式の左辺から導かれるが、左辺と同じ名前の
    // ローカル定数があると導出を見送る仕様なので、定数を P・T のままにすると
    // この2手順だけ「P = ...」の等式にならず、式だけの表示になってしまう。
    localConstants: [
      { symbol: "T₁", expression: "50N*m" },
      { symbol: "n₁", expression: "1500rpm" },
      { symbol: "P₂", expression: "5.5kW" },
      { symbol: "n₂", expression: "1450rpm" },
    ],
    steps: [
      { title: { en: "Shaft power P", ja: "軸動力 P" }, expression: "2*pi*n₁*T₁", targetUnit: "kW", formulaLatex: "P = 2\\pi n_1 T_1" },
      { title: { en: "Torque T from power and speed", ja: "動力と回転数から求めるトルク T" }, expression: "P₂/(2*pi*n₂)", targetUnit: "N*m", formulaLatex: "T = \\dfrac{P_2}{2\\pi n_2}" },
    ],
  },
  {
    title: { en: "Torsional shear stress in a solid shaft", ja: "中実軸のねじり応力" },
    description: { en: "Compute the polar second moment of area of a solid round shaft and the torsional shear stress at its surface, where the stress is highest.", ja: "中実丸軸の断面二次極モーメントと、応力が最大になる外表面でのねじり応力を求めます。" },
    localConstants: [
      { symbol: "T", expression: "250N*m" },
      { symbol: "d", expression: "30mm" },
      { symbol: "J", expression: "pi*d^4/32" },
    ],
    steps: [
      { title: { en: "Polar second moment of area J", ja: "断面二次極モーメント J" }, expression: "J", targetUnit: "mm^4", formulaLatex: "J = \\dfrac{\\pi d^4}{32}" },
      { title: { en: "Torsional shear stress τ", ja: "ねじり応力 τ" }, expression: "T*d/(2*J)", targetUnit: "MPa", formulaLatex: "\\tau = \\dfrac{Tr}{J} = \\dfrac{Td}{2J}" },
    ],
  },
  {
    title: { en: "Angle of twist of a shaft", ja: "軸のねじれ角" },
    description: { en: "Compute how far one end of a shaft twists relative to the other under torque. The same expression is shown in radians and in degrees, since the answer is easier to judge in degrees.", ja: "トルクを受けた軸の一端が、他端に対してどれだけねじれるかを求めます。同じ式をラジアンと度の両方で表示しています（大きさの見当をつけるには度の方が読みやすいため）。" },
    localConstants: [
      { symbol: "T", expression: "250N*m" },
      { symbol: "L", expression: "1m" },
      { symbol: "G", expression: "79GPa" },
      { symbol: "d", expression: "30mm" },
      { symbol: "J", expression: "pi*d^4/32" },
    ],
    steps: [
      { title: { en: "Angle of twist θ (radians)", ja: "ねじれ角 θ（ラジアン）" }, expression: "T*L/(G*J)", targetUnit: "rad", formulaLatex: "\\theta = \\dfrac{TL}{GJ}" },
      { title: { en: "Angle of twist θ (degrees)", ja: "ねじれ角 θ（度）" }, expression: "T*L/(G*J)", targetUnit: "deg", formulaLatex: "\\theta = \\dfrac{TL}{GJ}" },
    ],
  },
  {
    title: { en: "Hollow shaft: polar moment and shear stress", ja: "中空軸の断面二次極モーメントとねじり応力" },
    description: { en: "Compute the polar second moment of area and the surface shear stress of a hollow shaft. Carrying the same 250 N·m, a Ø40/Ø30 tube sees about 29.10 MPa against 47.16 MPa for the solid Ø30 shaft: the material near the axis barely contributes to torsional strength, so removing it buys weight savings cheaply.", ja: "中空軸の断面二次極モーメントと、外表面のせん断応力を求めます。同じ250N·mを伝えるとき、Ø40/Ø30の中空軸は約29.10MPaで、中実Ø30軸の47.16MPaより低くなります。軸心の近くの材料はねじり強度にほとんど寄与しないため、そこを抜くと軽量化の効率が良いことがわかります。" },
    localConstants: [
      { symbol: "D", expression: "40mm" },
      { symbol: "d", expression: "30mm" },
      { symbol: "T", expression: "250N*m" },
      { symbol: "J", expression: "pi*(D^4-d^4)/32" },
    ],
    steps: [
      { title: { en: "Polar second moment of area J", ja: "断面二次極モーメント J" }, expression: "J", targetUnit: "mm^4", formulaLatex: "J = \\dfrac{\\pi (D^4 - d^4)}{32}" },
      { title: { en: "Torsional shear stress τ at the outer surface", ja: "外表面のねじり応力 τ" }, expression: "T*D/(2*J)", targetUnit: "MPa", formulaLatex: "\\tau = \\dfrac{TD}{2J}" },
    ],
  },
  {
    title: { en: "Gear ratio, output speed and torque", ja: "歯車比・出力回転数・出力トルク" },
    description: { en: "Compute the ratio of a single reduction stage from the tooth counts, then the output speed and the output torque, the latter reduced by the mesh efficiency.", ja: "歯数から1段減速の歯車比を求め、続けて出力回転数と、かみあい効率を見込んだ出力トルクを計算します。" },
    localConstants: [
      { symbol: "z₁", expression: "20" },
      { symbol: "z₂", expression: "60" },
      { symbol: "n₁", expression: "1450rpm" },
      { symbol: "T₁", expression: "36N*m" },
      { symbol: "η", expression: "0.97" },
    ],
    steps: [
      { title: { en: "Gear ratio i", ja: "歯車比 i" }, expression: "z₂/z₁", targetUnit: "", formulaLatex: "i = \\dfrac{z_2}{z_1}" },
      { title: { en: "Output speed n₂", ja: "出力回転数 n₂" }, expression: "n₁*z₁/z₂", targetUnit: "rpm", formulaLatex: "n_2 = \\dfrac{n_1 z_1}{z_2}" },
      { title: { en: "Output torque T₂", ja: "出力トルク T₂" }, expression: "T₁*(z₂/z₁)*η", targetUnit: "N*m", formulaLatex: "T_2 = T_1 \\dfrac{z_2}{z_1} \\eta" },
    ],
  },
  {
    title: { en: "Belt drive: belt speed and driven pulley speed", ja: "ベルト伝動のベルト速度と従動プーリ回転数" },
    description: { en: "Compute the linear speed of the belt at the driving pulley and the speed of the driven pulley from the two pulley diameters.", ja: "駆動プーリでのベルト速度と、2つのプーリ径から決まる従動プーリの回転数を求めます。" },
    localConstants: [
      { symbol: "D₁", expression: "100mm" },
      { symbol: "D₂", expression: "250mm" },
      { symbol: "n₁", expression: "1450rpm" },
    ],
    steps: [
      { title: { en: "Belt speed v", ja: "ベルト速度 v" }, expression: "pi*D₁*n₁", targetUnit: "m/s", formulaLatex: "v = \\pi D_1 n_1" },
      { title: { en: "Driven pulley speed n₂", ja: "従動プーリの回転数 n₂" }, expression: "n₁*D₁/D₂", targetUnit: "rpm", formulaLatex: "n_2 = \\dfrac{n_1 D_1}{D_2}" },
    ],
  },
  {
    title: { en: "Acceleration torque and flywheel energy", ja: "加速トルクとはずみ車のエネルギー" },
    description: { en: "Compute the angular velocity of a rotor, the angular acceleration needed to reach it within a given run-up time, the torque that acceleration demands, and the kinetic energy stored once it is up to speed.", ja: "回転体の角速度と、指定した起動時間でそこまで加速するのに必要な角加速度・トルク、そして定常回転に達したときに蓄えられる回転エネルギーを求めます。" },
    localConstants: [
      { symbol: "J", expression: "0.05kg*m^2" },
      { symbol: "n", expression: "1500rpm" },
      { symbol: "t", expression: "2s" },
      { symbol: "ω", expression: "2*pi*n" },
    ],
    steps: [
      { title: { en: "Angular velocity ω", ja: "角速度 ω" }, expression: "ω", targetUnit: "rad/s", formulaLatex: "\\omega = 2\\pi n" },
      { title: { en: "Angular acceleration α", ja: "角加速度 α" }, expression: "ω/t", targetUnit: "rad/s^2", formulaLatex: "\\alpha = \\dfrac{\\omega}{t}" },
      { title: { en: "Acceleration torque T", ja: "加速トルク T" }, expression: "J*ω/t", targetUnit: "N*m", formulaLatex: "T = J\\alpha" },
      { title: { en: "Stored kinetic energy E", ja: "蓄えられる回転エネルギー E" }, expression: "J*ω^2/2", targetUnit: "J", formulaLatex: "E = \\tfrac{1}{2} J\\omega^2" },
    ],
  },
];

/**
 * 「機械要素・締結」。ボルト・溶接・ばね・軸受・キーなど、設計の現場で寸法を決めるときに
 * 実際に手を動かす計算をまとめている。使用率のように比で出るものは % 表示にしてある
 * （% は生の比をそのまま受け取るので、式の側で100倍しないこと）。
 */
export const ENG_ELEMENTS_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Bolt tightening torque and preload", ja: "ボルトの締付けトルクと軸力" },
    description: { en: "Convert between the tightening torque of a bolt and the preload it produces, using the nut factor K (about 0.2 for a plain, lightly oiled steel bolt).", ja: "ナットファクタK（無処理で軽く油を塗った鋼ボルトなら約0.2）を使って、ボルトの締付けトルクと、それによって生じる軸力を相互に換算します。" },
    localConstants: [
      { symbol: "K", expression: "0.2" },
      { symbol: "d", expression: "12mm" },
      { symbol: "F", expression: "25kN" },
      { symbol: "T", expression: "60N*m" },
    ],
    steps: [
      { title: { en: "Tightening torque T", ja: "締付けトルク T" }, expression: "K*F*d", targetUnit: "N*m", formulaLatex: "T = KFd" },
      { title: { en: "Preload F from a given torque", ja: "トルクから求める軸力 F" }, expression: "T/(K*d)", targetUnit: "kN", formulaLatex: "F = \\dfrac{T}{Kd}" },
    ],
  },
  {
    title: { en: "Bolt tensile stress and utilisation (M12, class 8.8)", ja: "ボルトの引張応力と使用率（M12・強度区分8.8）" },
    description: { en: "Compute the tensile stress in a bolt from the preload and the tensile stress area, and how much of the proof stress that uses up. For an M12 bolt of property class 8.8 the tensile stress area is 84.3 mm² and the proof stress is 640 MPa.", ja: "軸力とボルトの有効断面積から引張応力を求め、それが保証応力の何パーセントにあたるかを計算します。強度区分8.8のM12ボルトでは、有効断面積は84.3mm²、保証応力は640MPaです。" },
    localConstants: [
      { symbol: "F", expression: "25kN" },
      { symbol: "A_s", expression: "84.3mm^2" },
      { symbol: "σ_p", expression: "640MPa" },
    ],
    steps: [
      { title: { en: "Tensile stress σ", ja: "引張応力 σ" }, expression: "F/A_s", targetUnit: "MPa", formulaLatex: "\\sigma = \\dfrac{F}{A_s}" },
      { title: { en: "Utilisation of the proof stress", ja: "保証応力に対する使用率" }, expression: "F/(A_s*σ_p)", targetUnit: "%", formulaLatex: "u = \\dfrac{F}{A_s \\sigma_p}" },
    ],
  },
  {
    title: { en: "Fillet weld throat and shear stress", ja: "すみ肉溶接ののど厚とせん断応力" },
    description: { en: "Compute the design throat thickness of a fillet weld from its leg length, then the average shear stress carried by the throat area.", ja: "すみ肉溶接の脚長からのど厚を求め、のど断面が受け持つ平均せん断応力を計算します。" },
    localConstants: [
      { symbol: "z", expression: "5mm" },
      { symbol: "L_w", expression: "400mm" },
      { symbol: "F", expression: "40kN" },
      { symbol: "a", expression: "0.7*z" },
    ],
    steps: [
      { title: { en: "Throat thickness a", ja: "のど厚 a" }, expression: "a", targetUnit: "mm", formulaLatex: "a = 0.7z" },
      { title: { en: "Shear stress on the throat τ", ja: "のど断面のせん断応力 τ" }, expression: "F/(a*L_w)", targetUnit: "MPa", formulaLatex: "\\tau = \\dfrac{F}{a L_w}" },
    ],
  },
  {
    title: { en: "Helical compression spring: rate, deflection and stress", ja: "圧縮コイルばねのばね定数・たわみ・応力" },
    description: { en: "Compute the rate of a helical compression spring from the wire diameter, the mean coil diameter and the number of active coils, then the deflection under a load and the torsional shear stress in the wire. The stress here is the uncorrected value: it does not include the Wahl curvature factor, which raises the peak stress at the inner surface of the coil by roughly 18% at the spring index D/d = 8 used here.", ja: "線径・コイル平均径・有効巻数から圧縮コイルばねのばね定数を求め、荷重によるたわみと、素線に生じるねじり応力を計算します。ここでの応力は修正前の値で、ワールの応力修正係数は掛けていません。この例のばね指数 D/d = 8 では、コイル内側の最大応力は修正後で約18%高くなります。" },
    localConstants: [
      { symbol: "G", expression: "79.3GPa" },
      { symbol: "d", expression: "2mm" },
      { symbol: "D", expression: "16mm" },
      { symbol: "N", expression: "8" },
      { symbol: "F", expression: "50N" },
      { symbol: "k", expression: "G*d^4/(8*D^3*N)" },
    ],
    steps: [
      { title: { en: "Spring rate k", ja: "ばね定数 k" }, expression: "k", targetUnit: "N/mm", formulaLatex: "k = \\dfrac{Gd^4}{8D^3 N}" },
      { title: { en: "Deflection δ under the load", ja: "荷重によるたわみ δ" }, expression: "F/k", targetUnit: "mm", formulaLatex: "\\delta = \\dfrac{F}{k}" },
      { title: { en: "Torsional shear stress τ in the wire", ja: "素線のねじり応力 τ" }, expression: "8*F*D/(pi*d^3)", targetUnit: "MPa", formulaLatex: "\\tau = \\dfrac{8FD}{\\pi d^3}" },
    ],
  },
  {
    title: { en: "Thin-walled pressure vessel stresses", ja: "薄肉圧力容器に生じる応力" },
    description: { en: "Compute the hoop and longitudinal stresses in a thin-walled cylinder under internal pressure, and the minimum wall thickness that keeps the hoop stress within an allowable value.", ja: "内圧を受ける薄肉円筒に生じる円周応力・軸方向応力と、円周応力を許容応力以内に収めるための最小板厚を求めます。" },
    localConstants: [
      { symbol: "p", expression: "1.6MPa" },
      { symbol: "D", expression: "500mm" },
      { symbol: "t", expression: "6mm" },
      { symbol: "σ_a", expression: "120MPa" },
    ],
    steps: [
      { title: { en: "Hoop stress σh", ja: "円周応力 σh" }, expression: "p*D/(2*t)", targetUnit: "MPa", formulaLatex: "\\sigma_h = \\dfrac{pD}{2t}" },
      { title: { en: "Longitudinal stress σl", ja: "軸方向応力 σl" }, expression: "p*D/(4*t)", targetUnit: "MPa", formulaLatex: "\\sigma_l = \\dfrac{pD}{4t}" },
      { title: { en: "Minimum wall thickness tmin", ja: "最小板厚 tmin" }, expression: "p*D/(2*σ_a)", targetUnit: "mm", formulaLatex: "t_{min} = \\dfrac{pD}{2\\sigma_a}" },
    ],
  },
  {
    title: { en: "Ball bearing L10 life", ja: "玉軸受のL10寿命" },
    description: { en: "Compute the basic rating life of a ball bearing from its dynamic load rating and the equivalent load, first in millions of revolutions and then in hours. The exponent 3 applies to ball bearings only — roller bearings use 10/3. The /60 of the textbook formula disappears here, because rpm is a real unit: dividing a number of revolutions by a rotational speed already gives a time.", ja: "動定格荷重と等価荷重から、玉軸受の基本定格寿命を、まず百万回転で、続いて時間で求めます。指数の3は玉軸受のもので、ころ軸受では10/3になります。ここではrpmを本物の単位として扱うため、教科書の式に出てくる/60は要りません。回転数を回転速度で割れば、そのまま時間の次元になります。" },
    localConstants: [
      { symbol: "C", expression: "25.5kN" },
      { symbol: "P_r", expression: "4kN" },
      { symbol: "n", expression: "1500rpm" },
    ],
    steps: [
      { title: { en: "Basic rating life L10 (million revolutions)", ja: "基本定格寿命 L10（百万回転）" }, expression: "(C/P_r)^3", targetUnit: "", formulaLatex: "L_{10} = \\left(\\dfrac{C}{P_r}\\right)^3" },
      { title: { en: "Basic rating life in hours", ja: "基本定格寿命（時間）" }, expression: "(C/P_r)^3*1e6/n", targetUnit: "h", formulaLatex: "L_{10h} = \\dfrac{10^6 L_{10}}{n}" },
    ],
  },
  {
    title: { en: "Key (shaft-hub joint) shear stress", ja: "キー（軸とボスの締結）のせん断応力" },
    description: { en: "Compute the tangential force a parallel key transmits at the shaft surface, and the average shear stress on its shear plane.", ja: "平行キーが軸表面で伝える接線力と、せん断面に生じる平均せん断応力を求めます。" },
    localConstants: [
      { symbol: "T", expression: "250N*m" },
      { symbol: "d", expression: "30mm" },
      { symbol: "b", expression: "8mm" },
      { symbol: "L_k", expression: "40mm" },
    ],
    steps: [
      { title: { en: "Tangential force F at the shaft surface", ja: "軸表面の接線力 F" }, expression: "2*T/d", targetUnit: "kN", formulaLatex: "F = \\dfrac{2T}{d}" },
      { title: { en: "Shear stress τ on the key", ja: "キーのせん断応力 τ" }, expression: "2*T/(d*b*L_k)", targetUnit: "MPa", formulaLatex: "\\tau = \\dfrac{2T}{d b L_k}" },
    ],
  },
];
