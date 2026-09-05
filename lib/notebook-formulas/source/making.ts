import type { NotebookSeed } from "../types";

/**
 * 「DIY・住まい」。塗料・コンクリート・タイル・木材・壁紙・照明・給湯など、
 * 家まわりの「どれだけ要るか」をメートル法基準でまとめている。
 * 地域ごとの建築慣習（尺貫法・フィート）には寄せず、寸法はすべて m / mm で持つ。
 */
export const DIY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Paint quantity from wall area", ja: "壁の面積から必要な塗料の量" },
    description: {
      en: "Compute how much paint a wall needs from its area, the paint's spreading rate, the number of coats, and a loss allowance. Typical interior emulsion covers about 10–12 m² per litre per coat on a smooth primed surface, and closer to 6–7 m²/L on bare plaster or textured render — always check the product data sheet.",
      ja: "壁の面積・塗料の塗り面積（塗布率）・塗り重ね回数・ロス率から、必要な塗料の量を求めます。室内用の水性塗料は下地が平滑なら1回塗りで1リットルあたり10〜12m²、素地のプラスターや凹凸のある下地では6〜7m²/L程度が目安です（製品のデータシートで確認してください）。",
    },
    localConstants: [
      { symbol: "A", expression: "42m^2" },
      // 塗布率（1リットルあたりの塗り面積・1回塗り）。室内用水性塗料の一般的な値は
      // 10〜12m²/L、素地や凹凸下地では6〜7m²/L。
      // 出典: https://www.birlaopus.com/blog/paint-coverage-guide
      { symbol: "c", expression: "11m^2/L" },
      { symbol: "n", expression: "2" },
      { symbol: "waste", expression: "10%" },
      { symbol: "V₁", expression: "5L" },
    ],
    steps: [
      { title: { en: "Paint needed V", ja: "必要な塗料の量 V" }, expression: "A*n/c*(1+waste)", targetUnit: "L", formulaLatex: "V = \\dfrac{A n}{c}\\left(1 + \\text{waste}\\right)" },
      { title: { en: "Area one can covers", ja: "1缶で塗れる面積" }, expression: "V₁*c/n", targetUnit: "m^2", formulaLatex: "A_1 = \\dfrac{V_1 c}{n}" },
    ],
  },
  {
    title: { en: "Concrete volume and mass for a slab", ja: "コンクリート土間の体積と質量" },
    description: {
      en: "Compute the volume of concrete a rectangular slab or footing needs from its length, width and thickness, plus an over-order allowance, and convert it to mass. Ordinary structural concrete is about 2400 kg/m³ (reinforced concrete 2400–2500 kg/m³).",
      ja: "長方形の土間・基礎の縦・横・厚みと余裕率から、必要なコンクリートの体積を求め、質量に換算します。普通コンクリートの密度は約2400kg/m³（鉄筋コンクリートは2400〜2500kg/m³）です。",
    },
    localConstants: [
      { symbol: "L", expression: "3m" },
      { symbol: "W", expression: "2.5m" },
      { symbol: "T", expression: "100mm" },
      // 普通コンクリートの密度。鉄筋入りは2400〜2500kg/m³。
      // 出典: https://www.jkcement.com/blog/basics-of-cement/density-of-concrete/
      { symbol: "ρ", expression: "2400kg/m^3" },
      // 打設ロス。コンクリートのロス率は一般に2〜5%。
      // 出典: https://trybuildcalc.com/knowledge/material/construction-material-wastage-guide
      { symbol: "waste", expression: "5%" },
    ],
    steps: [
      { title: { en: "Concrete volume V", ja: "必要な体積 V" }, expression: "L*W*T*(1+waste)", targetUnit: "m^3", formulaLatex: "V = L W T \\left(1 + \\text{waste}\\right)" },
      { title: { en: "Concrete mass m", ja: "コンクリートの質量 m" }, expression: "ρ*L*W*T*(1+waste)", targetUnit: "t", formulaLatex: "m = \\rho L W T \\left(1 + \\text{waste}\\right)" },
    ],
  },
  {
    title: { en: "Tile and flooring quantity with a waste allowance", ja: "タイル・床材の必要枚数（ロス込み）" },
    description: {
      en: "Compute the area to buy and the number of tiles needed from the room area, one tile's size, and a waste allowance. A straight layout usually needs 10–15% extra for cuts; a diagonal or herringbone layout needs 20–25%. Round the tile count up to the next whole tile (and then up to the next full pack).",
      ja: "部屋の面積・タイル1枚の寸法・ロス率から、購入する面積と必要な枚数を求めます。目地が壁と平行な標準的な張り方でカット分のロスは10〜15%、斜め張りやヘリンボーンでは20〜25%が目安です。枚数は切り上げて（さらに箱単位に切り上げて）注文します。",
    },
    localConstants: [
      { symbol: "A", expression: "12m^2" },
      { symbol: "lₜ", expression: "300mm" },
      { symbol: "wₜ", expression: "300mm" },
      // タイルのロス率。標準的な張り方で10〜15%、斜め張りで20〜25%。
      // 出典: https://trybuildcalc.com/knowledge/material/construction-material-wastage-guide
      { symbol: "waste", expression: "10%" },
    ],
    steps: [
      { title: { en: "Area to buy", ja: "購入する面積" }, expression: "A*(1+waste)", targetUnit: "m^2", formulaLatex: "A_{buy} = A\\left(1 + \\text{waste}\\right)" },
      { title: { en: "Number of tiles N", ja: "必要な枚数 N" }, expression: "A*(1+waste)/(lₜ*wₜ)", targetUnit: "", formulaLatex: "N = \\dfrac{A\\left(1 + \\text{waste}\\right)}{l_t w_t}" },
    ],
  },
  {
    title: { en: "Timber volume and mass", ja: "木材の材積と質量" },
    description: {
      en: "Compute the volume and mass of a batch of sawn timber from its cross-section, length, and piece count. Timber is traded by the cubic metre in metric markets. Air-dry softwood (pine, spruce) is roughly 400–550 kg/m³, oak around 700–770 kg/m³.",
      ja: "断面寸法・長さ・本数から、製材した木材の材積と質量を求めます。メートル法圏では木材は立方メートル（m³）で取引されます。気乾状態の針葉樹（マツ・トウヒ）はおよそ400〜550kg/m³、ナラ・オークは700〜770kg/m³です。",
    },
    localConstants: [
      { symbol: "b", expression: "45mm" },
      { symbol: "h", expression: "90mm" },
      { symbol: "L", expression: "3m" },
      { symbol: "n", expression: "8" },
      // 気乾（含水率12%前後）の針葉樹の密度。マツ約440・トウヒ約370kg/m³で、
      // 建築用製材はおよそ400〜590kg/m³。オークは700〜770kg/m³。
      // 出典: https://amesweb.info/Materials/Density-of-Wood.aspx
      { symbol: "ρ", expression: "500kg/m^3" },
    ],
    steps: [
      { title: { en: "Timber volume V", ja: "材積 V" }, expression: "b*h*L*n", targetUnit: "m^3", formulaLatex: "V = b h L n" },
      { title: { en: "Timber mass m", ja: "質量 m" }, expression: "ρ*b*h*L*n", targetUnit: "kg", formulaLatex: "m = \\rho b h L n" },
    ],
  },
  {
    title: { en: "Wallpaper roll count", ja: "壁紙のロール数" },
    description: {
      en: "Compute how many rolls of wallpaper a room needs from the wall perimeter, the wall height, the pattern repeat, and the roll size. The European standard roll is 0.53 m wide by 10.05 m long. Round the strip count up, the strips-per-roll count down, and the final roll count up — step 3 ignores that rounding, so treat it as a lower bound.",
      ja: "壁の周長・壁の高さ・柄のリピート・ロールの寸法から、必要な壁紙のロール数を求めます。ヨーロッパの標準ロールは幅0.53m×長さ10.05mです。実際は1の枚数を切り上げ、2の本数を切り捨て、その割り算をさらに切り上げます。手順3は端数を無視した連続値なので、下限の目安として読んでください。",
    },
    localConstants: [
      { symbol: "P", expression: "12m" },
      { symbol: "H", expression: "2.4m" },
      // 柄のリピート（同じ柄が現れる縦の間隔）。この分だけ1枚あたりの必要長が伸びる。
      { symbol: "pᵣ", expression: "0.32m" },
      // ヨーロッパ標準ロール（ユーロロール）は幅0.53m×長さ10.05m。
      // 出典: https://www.bricoflor.co.uk/blog/wallpaper-how-to-calculate-how-many-rolls-are-needed
      { symbol: "r", expression: "0.53m" },
      { symbol: "Lᵣ", expression: "10.05m" },
    ],
    steps: [
      { title: { en: "Strips needed n (round up)", ja: "必要な枚数 n（切り上げ）" }, expression: "P/r", targetUnit: "", formulaLatex: "n = \\dfrac{P}{r}" },
      { title: { en: "Strips per roll k (round down)", ja: "1ロールから取れる枚数 k（切り捨て）" }, expression: "Lᵣ/(H+pᵣ)", targetUnit: "", formulaLatex: "k = \\dfrac{L_r}{H + p_r}" },
      { title: { en: "Rolls needed N", ja: "必要なロール数 N" }, expression: "P*(H+pᵣ)/(r*Lᵣ)", targetUnit: "", formulaLatex: "N = \\dfrac{P\\left(H + p_r\\right)}{r L_r}" },
    ],
  },
  {
    title: { en: "Ceiling light output for a room (lumen method)", ja: "部屋に必要な照明の明るさ（光束法）" },
    description: {
      en: "Compute the total luminous flux a room's lighting must deliver, and how many luminaires that takes, from the floor area and the target illuminance. The lumen method divides by a utilisation factor (typically 0.4–0.8, how much of the lamp's light reaches the working plane) and a maintenance factor (0.6–0.8, allowing for ageing and dirt). EN 12464-1 asks for 500 lx at an office desk; 100–300 lx suits general lighting in a living room.",
      ja: "床面積と目標照度から、部屋の照明に必要な総光束と器具の台数を求めます。光束法では、器具の光のうち作業面に届く割合（照明率、通常0.4〜0.8）と、経年劣化・汚れを見込んだ保守率（0.6〜0.8）で割ります。EN 12464-1ではオフィスの机上が500lx、居室の全般照明は100〜300lxが目安です。",
    },
    localConstants: [
      // 目標照度。EN 12464-1 は事務作業の作業面を500lxとしている。居室の全般照明は100〜300lx。
      // 出典: https://www.fagerhult.com/knowledge/light-planning/en-12464-1/lighting-of-indoor-workplaces/standard-en-12464-1-in-brief/
      { symbol: "E", expression: "300lx" },
      { symbol: "A", expression: "20m^2" },
      // 照明率（UF）と保守率（MF）。光束法 N = EA/(Φ·UF·MF) の分母。UFは0.4〜0.8、MFは
      // 清浄な室内で0.8程度。出典: https://www.eaton.com/content/dam/eaton/products/lighting-and-controls/mains-lighting/general-lighting/resources/mains-lighting-design-guide.pdf
      { symbol: "UF", expression: "0.5" },
      { symbol: "MF", expression: "0.8" },
      { symbol: "Φ₁", expression: "1500lm" },
    ],
    steps: [
      { title: { en: "Total luminous flux needed", ja: "必要な総光束" }, expression: "E*A/(UF*MF)", targetUnit: "lm", formulaLatex: "\\Phi = \\dfrac{E A}{\\text{UF} \\cdot \\text{MF}}" },
      { title: { en: "Number of luminaires N", ja: "必要な器具の台数 N" }, expression: "E*A/(Φ₁*UF*MF)", targetUnit: "", formulaLatex: "N = \\dfrac{E A}{\\Phi_1 \\cdot \\text{UF} \\cdot \\text{MF}}" },
    ],
  },
  {
    title: { en: "Bath / tank volume and the energy to heat it", ja: "浴槽・タンクの水量と加熱に要るエネルギー" },
    description: {
      en: "Compute the water volume of a rectangular bath or tank, then the energy, the heating time and the electricity cost needed to raise it by a given temperature difference. Water's specific heat capacity is about 4186 J/(kg·K). The price per kWh is a plain editable constant that starts from your region's typical electricity tariff.",
      ja: "長方形の浴槽・タンクの水量を求め、それを指定の温度差だけ温めるのに必要な熱量・加熱時間・電気代を計算します。水の比熱は約4186J/(kg·K)です。電力量単価は編集できる定数で、初期値は端末の地域の一般的な電気料金が入ります。",
    },
    localConstants: [
      { symbol: "l", expression: "1.2m" },
      { symbol: "w", expression: "0.6m" },
      { symbol: "h", expression: "0.28m" },
      { symbol: "ρ", expression: "1000kg/m^3" },
      // 水の比熱（15℃前後）。
      { symbol: "c", expression: "4186J/kg/K" },
      { symbol: "ΔT", expression: "25K" },
      { symbol: "P", expression: "4kW" },
      // 電力量単価。妥当な値が通貨圏ごとに桁から違うので、投入時に端末の通貨に応じた値へ差し替える
      // （expression は通貨が判別できなかったときのフォールバック）。
      { symbol: "rate", expression: "31", localizedPrice: "electricityPerKWh" },
    ],
    steps: [
      { title: { en: "Water volume V", ja: "水の体積 V" }, expression: "l*w*h", targetUnit: "L", formulaLatex: "V = l w h" },
      { title: { en: "Heat needed Q", ja: "必要な熱量 Q" }, expression: "ρ*l*w*h*c*ΔT", targetUnit: "kWh", formulaLatex: "Q = \\rho l w h \\, c \\, \\Delta T" },
      { title: { en: "Heating time t", ja: "加熱時間 t" }, expression: "ρ*l*w*h*c*ΔT/P", targetUnit: "h", formulaLatex: "t = \\dfrac{\\rho l w h \\, c \\, \\Delta T}{P}" },
      { title: { en: "Electricity cost", ja: "電気代" }, expression: "(ρ*l*w*h*c*ΔT/1kWh)*rate", targetUnit: "", formulaLatex: "\\text{cost} = \\dfrac{Q}{1\\text{kWh}} \\times \\text{rate}" },
    ],
  },
];

/**
 * 「3Dプリンタ」。フィラメントの長さ・質量・単価と、吐出量・造形時間・押出量の校正をまとめている。
 * 既定値はFDM機で最も一般的な構成（ノズル0.4mm・フィラメント1.75mm・PLA）に合わせてある。
 */
export const PRINTING_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Filament length from model volume", ja: "造形物の体積から必要なフィラメント長" },
    description: {
      en: "Compute how much filament a model consumes from the model's solid volume and the filament diameter. Slicers report the volume directly; the filament is just that volume drawn out into a round strand, so the length is the volume divided by the strand's cross-section.",
      ja: "造形物の体積とフィラメントの直径から、必要なフィラメントの長さを求めます。体積はスライサが表示します。フィラメントは同じ体積を細い丸棒に引き延ばしたものなので、長さは体積を断面積で割るだけで求まります。",
    },
    localConstants: [
      { symbol: "V", expression: "20cm^3" },
      { symbol: "d", expression: "1.75mm" },
    ],
    steps: [
      { title: { en: "Filament cross-section A", ja: "フィラメントの断面積 A" }, expression: "pi*d^2/4", targetUnit: "mm^2", formulaLatex: "A = \\dfrac{\\pi d^2}{4}" },
      { title: { en: "Filament length L", ja: "必要なフィラメント長 L" }, expression: "4*V/(pi*d^2)", targetUnit: "m", formulaLatex: "L = \\dfrac{4V}{\\pi d^2}" },
    ],
  },
  {
    title: { en: "Filament mass, spool length and cost", ja: "フィラメントの質量・スプール長・材料費" },
    description: {
      en: "Compute the mass of a given length of filament, how many metres a spool holds, and what the print costs in material, from the filament diameter and the material's density. PLA is about 1.24 g/cm³, PETG 1.27 g/cm³ and ABS 1.04 g/cm³. The price per kilogram is a plain editable constant — enter the price of your own spool.",
      ja: "フィラメントの直径と材料の密度から、ある長さの質量・1スプールに巻かれている長さ・その造形にかかる材料費を求めます。密度はPLAが約1.24g/cm³、PETGが1.27g/cm³、ABSが1.04g/cm³です。1kgあたりの単価は編集できる定数なので、手持ちのスプールの価格を入れてください。",
    },
    localConstants: [
      { symbol: "L", expression: "100m" },
      { symbol: "d", expression: "1.75mm" },
      // PLAの密度。PETGは1.27、ABSは1.04g/cm³。
      { symbol: "ρ", expression: "1.24g/cm^3" },
      { symbol: "mₛ", expression: "1kg" },
      // 1kgスプールの価格。通貨単位は付けず、端末の地域から解決する
      // （日本円だけ桁が3つ違うので、裸の数値だと必ずどこかの通貨で事故る）。
      // expression は通貨が判別できなかったときのフォールバック。
      { symbol: "price", expression: "3000", localizedPrice: "filamentPerKg" },
    ],
    steps: [
      { title: { en: "Mass of that length m", ja: "その長さの質量 m" }, expression: "ρ*pi*d^2/4*L", targetUnit: "g", formulaLatex: "m = \\rho \\dfrac{\\pi d^2}{4} L" },
      { title: { en: "Length on a spool", ja: "スプールに巻かれている長さ" }, expression: "4*mₛ/(ρ*pi*d^2)", targetUnit: "m", formulaLatex: "L_{spool} = \\dfrac{4 m_s}{\\rho \\pi d^2}" },
      { title: { en: "Material cost", ja: "材料費" }, expression: "(ρ*pi*d^2/4*L/1kg)*price", targetUnit: "", formulaLatex: "\\text{cost} = \\dfrac{m}{1\\text{kg}} \\times \\text{price}" },
    ],
  },
  {
    title: { en: "Volumetric flow rate and the hotend limit", ja: "吐出量（体積流量）とホットエンドの上限" },
    description: {
      en: "Compute the volumetric flow rate the extruder has to deliver from the layer height, the extrusion width and the print speed, and compare it with the hotend's limit. A plain E3D V6-class hotend melts roughly 11 mm³/s of PLA through a 0.4 mm nozzle (advertised as 15 mm³/s under ideal conditions); high-flow hotends go well beyond that. Exceeding the limit shows up as under-extrusion, not as an error.",
      ja: "積層ピッチ・線幅・造形速度から、押出機が送り出す体積流量を求め、ホットエンドの上限と比べます。E3D V6 相当の一般的なホットエンドは0.4mmノズルでPLAをおよそ11mm³/s溶かせます（理想条件での公称値は15mm³/s）。ハイフロー型はこれを大きく上回ります。上限を超えるとエラーにはならず、吐出不足として現れます。",
    },
    localConstants: [
      { symbol: "h", expression: "0.2mm" },
      { symbol: "w", expression: "0.45mm" },
      { symbol: "v", expression: "60mm/s" },
      // ホットエンドの最大体積流量。ノーマルのE3D V6でPLAが実用上11mm³/s前後
      // （公称15mm³/s）。出典: https://www.cnckitchen.com/blog/flow-rate-benchmarking-of-a-hotend
      { symbol: "Qₘₐₓ", expression: "11mm^3/s" },
    ],
    steps: [
      { title: { en: "Volumetric flow rate Q", ja: "体積流量 Q" }, expression: "h*w*v", targetUnit: "mm^3/s", formulaLatex: "Q = h w v" },
      { title: { en: "Fastest speed this hotend allows", ja: "このホットエンドで出せる最高速度" }, expression: "Qₘₐₓ/(h*w)", targetUnit: "mm/s", formulaLatex: "v_{max} = \\dfrac{Q_{max}}{h w}" },
      { title: { en: "Share of the hotend limit used", ja: "上限に対する使用率" }, expression: "h*w*v/Qₘₐₓ", targetUnit: "%", formulaLatex: "u = \\dfrac{h w v}{Q_{max}}" },
    ],
  },
  {
    title: { en: "Estimated print time from the layer count", ja: "積層数から見積もる造形時間" },
    description: {
      en: "Estimate how long a print takes from the model height, the layer height, and the average time one layer takes. Add the machine's fixed overhead — heating the bed and nozzle, homing, the purge line — to get the wall-clock time. The per-layer time varies with the cross-section, so use the average a slicer preview or a previous print gives you.",
      ja: "造形物の高さ・積層ピッチ・1層あたりの平均所要時間から、造形にかかる時間を見積もります。ベッドとノズルの加熱・原点復帰・捨て線といった固定の準備時間を足すと実際の所要時間になります。1層の時間は断面積によって変わるので、スライサのプレビューや前回の造形から平均値を取ってください。",
    },
    localConstants: [
      { symbol: "H", expression: "60mm" },
      { symbol: "h", expression: "0.2mm" },
      { symbol: "tₗ", expression: "25s" },
      { symbol: "t₀", expression: "5min" },
    ],
    steps: [
      { title: { en: "Layer count n", ja: "積層数 n" }, expression: "H/h", targetUnit: "", formulaLatex: "n = \\dfrac{H}{h}" },
      { title: { en: "Printing time t", ja: "造形時間 t" }, expression: "H/h*tₗ", targetUnit: "h", formulaLatex: "t = \\dfrac{H}{h} t_l" },
      { title: { en: "Total time including warm-up", ja: "準備時間を含む所要時間" }, expression: "t₀+H/h*tₗ", targetUnit: "h", formulaLatex: "t_{total} = t_0 + \\dfrac{H}{h} t_l" },
    ],
  },
  {
    title: { en: "Extrusion multiplier from a measured wall", ja: "壁の実測値から求める押出量（フロー）" },
    description: {
      en: "Correct the extrusion multiplier (flow) from a single-wall test cube: print a wall one extrusion wide, measure it with calipers at several points, and scale the current multiplier by the ratio of the nominal width to the measured width. Measuring thicker than nominal means the printer is over-extruding, so the multiplier goes down.",
      ja: "1周1本だけで壁を作ったテストキューブから、押出量（フロー）を補正します。壁をノギスで数か所測り、現在の押出係数に「設定した線幅 ÷ 実測の壁厚」を掛けます。実測が設定より厚ければ出しすぎなので、係数は下がります。",
    },
    localConstants: [
      { symbol: "EM₀", expression: "0.98" },
      { symbol: "wₑ", expression: "0.45mm" },
      { symbol: "wₘ", expression: "0.47mm" },
    ],
    steps: [
      // 新しい押出係数 = 現在の係数 × 設定線幅 ÷ 実測壁厚。
      // 出典: https://help.prusa3d.com/article/extrusion-multiplier-calibration_2257
      { title: { en: "Corrected extrusion multiplier", ja: "補正後の押出係数" }, expression: "EM₀*wₑ/wₘ", targetUnit: "", formulaLatex: "\\text{EM} = \\text{EM}_0 \\dfrac{w_e}{w_m}" },
      { title: { en: "Wall thickness error", ja: "壁厚の誤差" }, expression: "(wₘ-wₑ)/wₑ", targetUnit: "%", formulaLatex: "\\delta = \\dfrac{w_m - w_e}{w_e}" },
    ],
  },
];
