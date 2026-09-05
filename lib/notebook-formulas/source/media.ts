import type { NotebookSeed } from "../types";

/**
 * 「写真・カメラ」。過焦点距離・被写界深度・露出値（EV）・画角など、
 * レンズの焦点距離とF値から実際の撮影条件を割り出す計算をまとめている。
 * F値は写真の慣習どおり N（レンズのF値）、焦点距離は f として区別している
 * （N はニュートンの単位記号でもあるが、ローカル定数として先に解決されるので数値の直後に置かない限り安全）。
 */
export const PHOTOGRAPHY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Hyperfocal distance", ja: "過焦点距離" },
    description: {
      en: "Compute the hyperfocal distance from focal length, f-number, and circle of confusion. Focusing there keeps everything from half that distance to infinity acceptably sharp. A 50 mm lens at f/8 on full frame (circle of confusion 0.03 mm) gives about 10 m.",
      ja: "焦点距離・F値・許容錯乱円から、過焦点距離を求めます。ここにピントを合わせると、その半分の距離から無限遠までが実用上シャープに写ります。フルサイズ（許容錯乱円0.03mm）の50mmレンズをF8で使うと約10mになります。",
    },
    localConstants: [
      { symbol: "f", expression: "50mm" },
      { symbol: "N", expression: "8" },
      { symbol: "c", expression: "0.03mm" },
    ],
    steps: [
      { title: { en: "Hyperfocal distance H", ja: "過焦点距離 H" }, expression: "f^2/(N*c)+f", targetUnit: "m", formulaLatex: "H = \\dfrac{f^2}{Nc} + f" },
    ],
  },
  {
    title: { en: "Depth of field (near and far limits)", ja: "被写界深度（前後のピント範囲）" },
    description: {
      en: "Compute the near and far limits of acceptable sharpness for a given focus distance, using the hyperfocal distance H as an intermediate value. A 50 mm lens at f/2.8 focused at 3 m on full frame is sharp from about 2.7 m to about 3.3 m.",
      ja: "ピントを合わせた距離に対して、実用上シャープに写る手前側と奥側の限界を、過焦点距離Hを経由して求めます。フルサイズの50mmレンズをF2.8で3mに合わせると、およそ2.7mから3.3mまでが範囲になります。",
    },
    localConstants: [
      { symbol: "f", expression: "50mm" },
      { symbol: "N", expression: "2.8" },
      { symbol: "c", expression: "0.03mm" },
      { symbol: "s", expression: "3m" },
      { symbol: "H", expression: "f^2/(N*c)+f" },
    ],
    steps: [
      { title: { en: "Near limit Dn", ja: "手前側の限界 Dn" }, expression: "H*s/(H+(s-f))", targetUnit: "m", formulaLatex: "D_n = \\dfrac{Hs}{H + (s - f)}" },
      { title: { en: "Far limit Df", ja: "奥側の限界 Df" }, expression: "H*s/(H-(s-f))", targetUnit: "m", formulaLatex: "D_f = \\dfrac{Hs}{H - (s - f)}" },
      { title: { en: "Total depth of field", ja: "被写界深度の全体" }, expression: "H*s/(H-(s-f))-H*s/(H+(s-f))", targetUnit: "m", formulaLatex: "\\text{DoF} = D_f - D_n" },
    ],
  },
  {
    title: { en: "Exposure value (EV) from aperture and shutter speed", ja: "F値とシャッター速度から露出値（EV）" },
    description: {
      en: "Compute the exposure value of a set of camera settings, and the scene brightness it corresponds to at ISO 100. EV is defined against a shutter time of one second, so the expression divides t by 1 s to get the plain number the logarithm needs. f/8 at 1/125 s is EV 13; shooting it at ISO 400 means the scene itself is about EV 11 at ISO 100.",
      ja: "撮影設定そのものの露出値と、それがISO100換算でどれくらいの明るさの被写体にあたるかを求めます。EVは1秒を基準に定義されるので、式では t を1sで割って対数に渡せる裸の数値にしています。F8・1/125秒はEV13で、これをISO400で撮っているなら被写体の明るさはISO100換算で約EV11です。",
    },
    localConstants: [
      { symbol: "N", expression: "8" },
      { symbol: "t", expression: "1s/125" },
      { symbol: "S", expression: "400" },
    ],
    steps: [
      { title: { en: "Exposure value EV of the settings", ja: "撮影設定の露出値 EV" }, expression: "log2(N^2/(t/1s))", targetUnit: "", formulaLatex: "EV = \\log_2 \\dfrac{N^2}{t}" },
      { title: { en: "Scene brightness EV at ISO 100", ja: "ISO100換算の被写体の明るさ EV100" }, expression: "log2(N^2/(t/1s))-log2(S/100)", targetUnit: "", formulaLatex: "EV_{100} = EV - \\log_2 \\dfrac{S}{100}" },
    ],
  },
  {
    title: { en: "Equivalent exposure (changing aperture or ISO)", ja: "等価露出（F値・ISO感度を変えたとき）" },
    description: {
      en: "Keep the same exposure while changing settings: the shutter time that matches a new f-number, how many stops apart the two apertures are, and the shutter time that matches a new ISO. Stopping down from f/2.8 to f/8 is 3 stops, so 1/125 s becomes about 1/15 s.",
      ja: "明るさを保ったまま設定を振り替えます。新しいF値に対応するシャッター速度・2つのF値の段数の差・ISO感度を変えたときのシャッター速度を求めます。F2.8からF8へ絞ると3段ぶんなので、1/125秒は約1/15秒になります。",
    },
    localConstants: [
      { symbol: "N₁", expression: "2.8" },
      { symbol: "t₁", expression: "1s/125" },
      { symbol: "N₂", expression: "8" },
      { symbol: "S₁", expression: "100" },
      { symbol: "S₂", expression: "400" },
    ],
    steps: [
      { title: { en: "Shutter time t2 at the new aperture", ja: "新しいF値でのシャッター速度 t2" }, expression: "t₁*(N₂/N₁)^2", targetUnit: "s", formulaLatex: "t_2 = t_1 \\left(\\dfrac{N_2}{N_1}\\right)^2" },
      { title: { en: "Difference in stops", ja: "段数の差" }, expression: "log2(N₂/N₁)*2", targetUnit: "", formulaLatex: "\\Delta EV = 2\\log_2 \\dfrac{N_2}{N_1}" },
      { title: { en: "Shutter time after the ISO change", ja: "ISO感度を変えたあとのシャッター速度" }, expression: "t₁*S₁/S₂", targetUnit: "s", formulaLatex: "t_{ISO} = t_1 \\dfrac{S_1}{S_2}" },
    ],
  },
  {
    title: { en: "Angle of view and framing", ja: "画角と写る範囲" },
    description: {
      en: "Compute the horizontal and diagonal angle of view from focal length and sensor size, plus how wide a frame is at a given subject distance. A 50 mm lens on full frame (36 mm wide, 43.3 mm diagonal) covers about 39.6° horizontally and frames about 2.2 m at 3 m.",
      ja: "焦点距離とセンサーサイズから、水平画角・対角画角と、被写体までの距離で実際に写る横幅を求めます。フルサイズ（横36mm・対角43.3mm）の50mmレンズは水平約39.6°で、3m先ではおよそ2.2mの幅が写ります。",
    },
    localConstants: [
      { symbol: "f", expression: "50mm" },
      { symbol: "w", expression: "36mm" },
      { symbol: "dᵢ", expression: "43.27mm" },
      { symbol: "D", expression: "3m" },
    ],
    steps: [
      { title: { en: "Horizontal angle of view", ja: "水平画角" }, expression: "atan(w/f/2)*2", targetUnit: "°", formulaLatex: "\\theta_h = 2\\arctan\\dfrac{w}{2f}" },
      { title: { en: "Diagonal angle of view", ja: "対角画角" }, expression: "atan(dᵢ/f/2)*2", targetUnit: "°", formulaLatex: "\\theta_d = 2\\arctan\\dfrac{d_i}{2f}" },
      { title: { en: "Frame width at the subject distance", ja: "被写体距離で写る横幅" }, expression: "D*w/f", targetUnit: "m", formulaLatex: "W = \\dfrac{Dw}{f}" },
    ],
  },
  {
    title: { en: "Star trails: the 500 rule and the NPF rule", ja: "星が流れない露出時間（500ルールとNPFルール）" },
    description: {
      en: "Compute the longest shutter time before stars visibly trail. The 500 rule divides 500 by the effective focal length, where k is the crop factor of the sensor (1 on full frame, 1.5 on APS-C); the stricter NPF rule also accounts for aperture and pixel pitch. The constants C, a, and b carry the units (mm·s) that make these empirical rules come out in seconds. At 24 mm on full frame the 500 rule gives about 21 s, while NPF at f/2.8 with a 5.9 µm pixel pitch gives about 11 s.",
      ja: "星が線状に流れて写り始めるまでの、最長のシャッター速度を求めます。500ルールは500を実効焦点距離で割るだけです（kはセンサーのクロップ係数で、フルサイズなら1、APS-Cなら1.5）。より厳しいNPFルールはF値と画素ピッチも考慮します。定数C・a・bは、この経験則が秒で出るように単位（mm·s）を持たせたものです。フルサイズの24mmなら500ルールで約21秒、F2.8・画素ピッチ5.9µmのNPFルールでは約11秒になります。",
    },
    localConstants: [
      { symbol: "f", expression: "24mm" },
      { symbol: "k", expression: "1" },
      { symbol: "N", expression: "2.8" },
      { symbol: "p", expression: "5.94µm" },
      { symbol: "C", expression: "500mm*s" },
      { symbol: "a", expression: "35mm*s" },
      { symbol: "b", expression: "30mm*s/µm" },
    ],
    steps: [
      { title: { en: "500 rule: maximum shutter time", ja: "500ルールの最長シャッター速度" }, expression: "C/(k*f)", targetUnit: "s", formulaLatex: "t_{500} = \\dfrac{C}{k f}" },
      { title: { en: "NPF rule: maximum shutter time", ja: "NPFルールの最長シャッター速度" }, expression: "(a*N+b*p)/f", targetUnit: "s", formulaLatex: "t_{NPF} = \\dfrac{aN + bp}{f}" },
    ],
  },
  {
    title: { en: "Flash guide number", ja: "フラッシュのガイドナンバー" },
    description: {
      en: "A flash's guide number (quoted in metres at ISO 100) is the product of subject distance and f-number. From it you get the reach at a chosen aperture, the aperture needed at a chosen distance, and the guide number at a different ISO. GN 36 at f/8 reaches 4.5 m.",
      ja: "フラッシュのガイドナンバー（ISO100・メートル表示）は、被写体までの距離とF値の積です。ここから、決めたF値での届く距離・決めた距離で必要なF値・ISO感度を変えたときのガイドナンバーを求めます。GN36をF8で使うと4.5mまで届きます。",
    },
    localConstants: [
      { symbol: "GN", expression: "36m" },
      { symbol: "N", expression: "8" },
      { symbol: "d", expression: "3m" },
      { symbol: "S", expression: "400" },
    ],
    steps: [
      { title: { en: "Reach at the chosen aperture", ja: "そのF値で届く距離" }, expression: "GN/N", targetUnit: "m", formulaLatex: "d_{max} = \\dfrac{GN}{N}" },
      { title: { en: "Aperture needed at the chosen distance", ja: "その距離で必要なF値" }, expression: "GN/d", targetUnit: "", formulaLatex: "N_{req} = \\dfrac{GN}{d}" },
      { title: { en: "Guide number at the new ISO", ja: "ISO感度を変えたときのガイドナンバー" }, expression: "GN*sqrt(S/100)", targetUnit: "m", formulaLatex: "GN_S = GN\\sqrt{\\dfrac{S}{100}}" },
    ],
  },
];

/**
 * 「音響・オーディオ」。音圧レベル・音源の合成・距離減衰・部屋の定在波など、
 * 音まわりの計算をまとめている。
 * デシベルは対数の量なので単位を持たせられない。この電卓にdBという単位は無く、
 * dBで表す値はすべて無次元の数（targetUnitは空）として扱い、手順名と説明でdBだと伝える。
 */
export const AUDIO_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Sound pressure level in dB (and back to pressure)", ja: "音圧レベル（dB）と音圧の相互変換" },
    description: {
      en: "Convert between sound pressure and sound pressure level. The results marked dB are plain numbers — decibels are a logarithmic ratio, not a unit. A pressure of 0.1 Pa is about 74 dB, and 94 dB corresponds to 1 Pa (the level of a standard calibrator).",
      ja: "音圧と音圧レベルを相互に変換します。dBと書いた結果は単なる数値です（デシベルは対数の比であって単位ではありません）。音圧0.1Paは約74dBで、94dBはちょうど1Pa（校正器の基準レベル）にあたります。",
    },
    localConstants: [
      { symbol: "p", expression: "0.1Pa" },
      { symbol: "p₀", expression: "20µPa" },
      { symbol: "L", expression: "94" },
    ],
    steps: [
      { title: { en: "Sound pressure level (dB)", ja: "音圧レベル（dB）" }, expression: "log(p/p₀)*20", targetUnit: "", formulaLatex: "L_p = 20\\log_{10}\\dfrac{p}{p_0}" },
      { title: { en: "Sound pressure for a given level", ja: "そのレベルに対応する音圧" }, expression: "p₀*10^(L/20)", targetUnit: "Pa", formulaLatex: "p_L = p_0 \\cdot 10^{L/20}" },
    ],
  },
  {
    title: { en: "Combining two sound sources (dB addition)", ja: "2つの音源の合成（デシベルの加算）" },
    description: {
      en: "Decibels do not add arithmetically: you must convert back to power, sum, and take the logarithm again. All values here are plain numbers in dB. 85 dB plus 82 dB is about 86.8 dB, and two identical sources are only about 3 dB louder than one.",
      ja: "デシベルはそのまま足し算できません。いったん音のパワー（強さ）に戻して足し、もう一度対数を取ります。ここでの値はすべてdBを表す数値です。85dBと82dBを合わせると約86.8dBで、同じ大きさの音源を2つにしても約3dB増えるだけです。",
    },
    localConstants: [
      { symbol: "L₁", expression: "85" },
      { symbol: "L₂", expression: "82" },
    ],
    steps: [
      { title: { en: "Combined level (dB)", ja: "合成した音圧レベル（dB）" }, expression: "log(10^(L₁/10)+10^(L₂/10))*10", targetUnit: "", formulaLatex: "L_{sum} = 10\\log_{10}\\left(10^{L_1/10} + 10^{L_2/10}\\right)" },
      { title: { en: "Two identical sources (dB)", ja: "同じ音源を2つにしたとき（dB）" }, expression: "L₁+log(2)*10", targetUnit: "", formulaLatex: "L_{2x} = L_1 + 10\\log_{10} 2" },
    ],
  },
  {
    title: { en: "Level drop with distance (inverse-square law)", ja: "距離による音圧レベルの減衰（逆二乗則）" },
    description: {
      en: "In a free field the level falls by 6 dB every time the distance doubles. The dB values here are plain numbers. Starting from 100 dB at 1 m, ten times the distance costs 20 dB, and the level is down to 85 dB at about 5.6 m.",
      ja: "遮るもののない空間では、距離が2倍になるごとに音圧レベルは6dB下がります。dBの値は単なる数値です。1mで100dBなら、距離10倍で20dB下がり、85dBまで下がるのは約5.6m先です。",
    },
    localConstants: [
      { symbol: "L₁", expression: "100" },
      { symbol: "r₁", expression: "1m" },
      { symbol: "r₂", expression: "10m" },
      { symbol: "Lₜ", expression: "85" },
    ],
    steps: [
      { title: { en: "Level at the new distance (dB)", ja: "離れた地点の音圧レベル（dB）" }, expression: "L₁-log(r₂/r₁)*20", targetUnit: "", formulaLatex: "L_2 = L_1 - 20\\log_{10}\\dfrac{r_2}{r_1}" },
      { title: { en: "Distance where the level reaches the target", ja: "目標レベルまで下がる距離" }, expression: "r₁*10^((L₁-Lₜ)/20)", targetUnit: "m", formulaLatex: "r_t = r_1 \\cdot 10^{(L_1 - L_t)/20}" },
    ],
  },
  {
    title: { en: "Room modes (axial standing waves)", ja: "部屋の定在波（軸モード）" },
    description: {
      en: "Each pair of parallel walls supports a standing wave whose fundamental is half a wavelength across the room. These axial modes are what makes bass uneven in a listening room. For a 4.5 × 3.6 × 2.4 m room the fundamentals land near 38, 48, and 71 Hz.",
      ja: "向かい合った壁のあいだには、部屋の寸法が半波長になる定在波が立ちます。この軸モードが、リスニングルームで低音のむらを生む原因です。4.5×3.6×2.4mの部屋なら、それぞれ約38Hz・48Hz・71Hzになります。",
    },
    localConstants: [
      { symbol: "c", expression: "343m/s" },
      { symbol: "L", expression: "4.5m" },
      { symbol: "W", expression: "3.6m" },
      { symbol: "H", expression: "2.4m" },
    ],
    steps: [
      { title: { en: "Mode along the length", ja: "長さ方向のモード" }, expression: "c/(L*2)", targetUnit: "Hz", formulaLatex: "f_L = \\dfrac{c}{2L}" },
      { title: { en: "Mode across the width", ja: "幅方向のモード" }, expression: "c/(W*2)", targetUnit: "Hz", formulaLatex: "f_W = \\dfrac{c}{2W}" },
      { title: { en: "Mode between floor and ceiling", ja: "床と天井のあいだのモード" }, expression: "c/(H*2)", targetUnit: "Hz", formulaLatex: "f_H = \\dfrac{c}{2H}" },
      { title: { en: "Wavelength of the length mode", ja: "長さ方向のモードの波長" }, expression: "L*2", targetUnit: "m", formulaLatex: "\\lambda_L = 2L" },
    ],
  },
  {
    title: { en: "Speaker sensitivity, amplifier power and SPL", ja: "スピーカーの出力音圧レベルとアンプ出力から音圧レベル" },
    description: {
      en: "A speaker's sensitivity is the level it produces with 1 W at 1 m. Add 10 dB per tenfold power increase and subtract the distance loss to get the level at the listening position; the dB values are plain numbers. An 88 dB speaker driven with 50 W gives about 95 dB at 3 m, and reaching 105 dB there would need roughly 450 W.",
      ja: "スピーカーの出力音圧レベル（カタログの「能率」表記）は、1Wを入れて1m離れた地点で出る音圧レベルです。出力が10倍になるごとに10dB足し、距離による減衰を引けば、リスニングポジションでのレベルが出ます（dBの値は単なる数値です）。出力音圧レベル88dBのスピーカーを50Wで鳴らすと3mで約95dB、そこで105dBを出すにはおよそ450W必要です。",
    },
    localConstants: [
      { symbol: "Sₑ", expression: "88" },
      { symbol: "P", expression: "50W" },
      { symbol: "P₀", expression: "1W" },
      { symbol: "r", expression: "3m" },
      { symbol: "r₀", expression: "1m" },
      { symbol: "Lₜ", expression: "105" },
    ],
    steps: [
      { title: { en: "Level at the listening position (dB)", ja: "リスニングポジションの音圧レベル（dB）" }, expression: "Sₑ+log(P/P₀)*10-log(r/r₀)*20", targetUnit: "", formulaLatex: "L_p = S_e + 10\\log_{10}\\dfrac{P}{P_0} - 20\\log_{10}\\dfrac{r}{r_0}" },
      { title: { en: "Power needed for the target level", ja: "目標レベルに必要な出力" }, expression: "P₀*10^((Lₜ-Sₑ+log(r/r₀)*20)/10)", targetUnit: "W", formulaLatex: "P_t = P_0 \\cdot 10^{(L_t - S_e + 20\\log_{10}(r/r_0))/10}" },
    ],
  },
];
