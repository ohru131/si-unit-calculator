import type { NotebookSeed } from "../types";

/**
 * 「コーヒー・自家醸造」。抽出比率・収率・希釈・アルコール度数など、家で淹れる／仕込むときの
 * 分量と温度の計算をまとめている。
 *
 * 抽出比率は「粉1に対して湯R」という無次元の比で持ち、水の密度（ρ）を掛けて質量↔体積を渡す。
 * こうしておけば g でもオンスでも mL でもユーザーが単位チップで読み替えられる。
 *
 * 温度を混ぜる計算（抽出温度の調整）だけは °C を「そのままの絶対温度」として使っている。
 * 加重平均も温度差もオフセットが打ち消し合うので、この2式に限っては °C の定数をそのまま
 * 入れて正しい答えになる（マグヌス式のような経験式は逆に生の摂氏の数値が要るので、
 * WEATHER_SEEDS 側では無次元の定数にしてある）。
 *
 * 比重計の温度補正は入れていない。実務で使われている補正式は OIML R44 由来の3次多項式で、
 * 変数が華氏でしか定義されておらず（1.00130346 - 1.34722124e-4·T + … , T は℉）、
 * 地域中立という方針に合わないうえ、係数の羅列になって計算ノートとして読めないため。
 * 代わりに、コーヒーにも茶にも使えて温度の扱いを正しく見せられる「抽出温度の調整」を入れた。
 */
export const BREWING_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Coffee brew ratio (grounds and water)", ja: "コーヒーの抽出比率（粉と湯の量）" },
    description: {
      en: "From the brew ratio (1 part grounds to R parts water by mass), compute the grounds needed for a given amount of water — and the water needed for a given amount of grounds. R = 16.7 corresponds to the widely used 60 g of coffee per litre of water.",
      ja: "抽出比率（粉1に対して湯R、いずれも質量）から、湯の量に必要な粉の量と、手持ちの粉に必要な湯の量を求めます。R = 16.7 は「湯1Lに粉60g」としてよく使われる比率です。",
    },
    localConstants: [
      { symbol: "V", expression: "250mL" },
      { symbol: "R", expression: "16.7" },
      { symbol: "ρ", expression: "1g/mL" },
      { symbol: "mₚ", expression: "15g" },
    ],
    steps: [
      {
        title: { en: "Grounds for the given water", ja: "湯の量に必要な粉の量" },
        expression: "V*ρ/R",
        targetUnit: "g",
        formulaLatex: "m = \\dfrac{V \\times \\rho}{R}",
      },
      {
        title: { en: "Water for the given grounds", ja: "粉の量に必要な湯の量" },
        expression: "mₚ*R/ρ",
        targetUnit: "mL",
        formulaLatex: "V_w = \\dfrac{m_p \\times R}{\\rho}",
      },
    ],
  },
  {
    title: { en: "Espresso ratio and flow rate", ja: "エスプレッソの抽出比率と流量" },
    description: {
      en: "From the dose in the basket, the mass of espresso in the cup, and the shot time, compute the brew ratio and the flow rate. A ratio near 1:2 in about 25–30 s is the usual starting point.",
      ja: "バスケットに詰めた粉の量・カップに出た液体の量・抽出時間から、抽出比率と流量を求めます。1:2 前後を25〜30秒で、が調整の出発点です。",
    },
    localConstants: [
      { symbol: "mᵢ", expression: "18g" },
      { symbol: "mₒ", expression: "36g" },
      { symbol: "t", expression: "28s" },
    ],
    steps: [
      {
        title: { en: "Brew ratio", ja: "抽出比率" },
        expression: "mₒ/mᵢ",
        targetUnit: "",
        formulaLatex: "R = \\dfrac{m_o}{m_i}",
      },
      {
        title: { en: "Flow rate", ja: "流量" },
        expression: "mₒ/t",
        targetUnit: "g/s",
        formulaLatex: "Q = \\dfrac{m_o}{t}",
      },
    ],
  },
  {
    title: { en: "Cold brew concentrate dilution", ja: "コールドブリュー原液の希釈" },
    description: {
      en: "Cold brew is often steeped as a concentrate and diluted before serving. From the amount of concentrate and how many parts of water you add per part of concentrate, compute the water to add and the finished volume.",
      ja: "コールドブリューは原液で抽出し、飲むときに薄めることが多いです。原液の量と、原液1に対して加える水の割合から、加える水の量とできあがりの量を求めます。",
    },
    localConstants: [
      { symbol: "Vₒ", expression: "100mL" },
      { symbol: "n", expression: "3" },
    ],
    steps: [
      {
        title: { en: "Water to add", ja: "加える水の量" },
        expression: "Vₒ*n",
        targetUnit: "mL",
        formulaLatex: "V_w = V_o \\times n",
      },
      {
        title: { en: "Finished volume", ja: "できあがりの量" },
        expression: "Vₒ*(1+n)",
        targetUnit: "mL",
        formulaLatex: "V_t = V_o \\times (1 + n)",
      },
    ],
  },
  {
    title: { en: "Extraction yield from TDS", ja: "TDSから求める抽出収率" },
    description: {
      en: "A refractometer gives the total dissolved solids (TDS) of the brewed coffee. Multiplied by the beverage mass it gives how much coffee actually dissolved, and divided by the dry dose it gives the extraction yield. 18–22 % is the commonly cited target band.",
      ja: "屈折計で測った抽出液の濃度（TDS）に抽出液の質量を掛けると、実際に溶け出したコーヒーの質量になります。それを粉の質量で割ったものが抽出収率で、18〜22%が目安とされます。",
    },
    localConstants: [
      { symbol: "TDS", expression: "1.35%" },
      { symbol: "mₛ", expression: "220g" },
      { symbol: "mₚ", expression: "15g" },
    ],
    steps: [
      {
        title: { en: "Dissolved coffee solids", ja: "溶け出した固形分の質量" },
        expression: "TDS*mₛ",
        targetUnit: "g",
        formulaLatex: "m_r = TDS \\times m_s",
      },
      {
        title: { en: "Extraction yield", ja: "抽出収率" },
        expression: "TDS*mₛ/mₚ",
        targetUnit: "%",
        formulaLatex: "EY = \\dfrac{TDS \\times m_s}{m_p}",
      },
    ],
  },
  {
    title: { en: "Beer ABV from original and final gravity", ja: "ビールのアルコール度数（初期比重と最終比重）" },
    description: {
      en: "From the specific gravity before fermentation (OG) and after it (FG), compute the alcohol by volume and the apparent attenuation. Typical ales finish around 75–80 % attenuation.",
      ja: "発酵前の比重（OG）と発酵後の比重（FG）から、アルコール度数と見かけの発酵度を求めます。一般的なエールの発酵度は75〜80%程度です。",
    },
    localConstants: [
      { symbol: "OG", expression: "1.050" },
      { symbol: "FG", expression: "1.010" },
    ],
    steps: [
      {
        // 係数131.25は自家醸造で広く使われる簡易式 ABV(%) = (OG - FG) × 131.25 のもの。
        // 131.25% は無次元の1.3125なので、比重差(0.040)に掛けると 0.0525 ＝ 5.25% になる。
        // 参考: https://www.brewersfriend.com/abv-calculator/
        title: { en: "Alcohol by volume", ja: "アルコール度数" },
        expression: "(OG-FG)*131.25%",
        targetUnit: "%",
        formulaLatex: "ABV = (OG - FG) \\times 131.25\\,\\%",
      },
      {
        title: { en: "Apparent attenuation", ja: "見かけの発酵度" },
        expression: "(OG-FG)/(OG-1)",
        targetUnit: "%",
        formulaLatex: "AA = \\dfrac{OG - FG}{OG - 1}",
      },
    ],
  },
  {
    title: { en: "Blending hot and cold water to a brewing temperature", ja: "抽出温度の調整（熱湯と水を混ぜる）" },
    description: {
      en: "Pour-over coffee is usually brewed near 93 °C and green tea much cooler, so freshly boiled water has to be brought down. Compute the temperature of a blend of hot and cold water, and how much cold water to add to hit a target temperature.",
      ja: "ハンドドリップは93℃前後、緑茶はもっと低い温度で淹れるため、沸かしたての湯は温度を下げる必要があります。熱湯と水を混ぜたときの温度と、目標温度にするために加える水の量を求めます。",
    },
    localConstants: [
      { symbol: "m₁", expression: "200g" },
      { symbol: "T₁", expression: "100°C" },
      { symbol: "m₂", expression: "100g" },
      { symbol: "T₂", expression: "20°C" },
      { symbol: "Tₜ", expression: "93°C" },
    ],
    steps: [
      {
        // 加重平均なので、°C の定数をそのまま（＝絶対温度で）入れてもオフセットが打ち消し合い、
        // 摂氏で計算したのと同じ答えになる。温度差を取る2つ目の手順も同様。
        title: { en: "Temperature after blending", ja: "混ぜたあとの温度" },
        expression: "(m₁*T₁+m₂*T₂)/(m₁+m₂)",
        targetUnit: "°C",
        formulaLatex: "T_m = \\dfrac{m_1 T_1 + m_2 T_2}{m_1 + m_2}",
      },
      {
        title: { en: "Cold water needed for the target temperature", ja: "目標温度にするために加える水の量" },
        expression: "m₁*(T₁-Tₜ)/(Tₜ-T₂)",
        targetUnit: "g",
        formulaLatex: "m_a = m_1 \\times \\dfrac{T_1 - T_t}{T_t - T_2}",
      },
    ],
  },
];

/**
 * 「天気・大気」。露点・体感温度・空気の密度・気圧と高度・雨量など、身のまわりの空気の計算。
 *
 * 「理科（小・中）」の地学カテゴリにある湿度（飽和水蒸気量の表を引く形）や台風の気圧とは別物で、
 * こちらは天気アプリに出てくる数値を自分で出してみる側の切り口にしてある。
 *
 * **温度の扱いに注意**: マグヌス式・ウィンドチル・体感温度は「摂氏の数値」をそのまま係数に
 * 掛ける経験式なので、気温は無次元の定数（例 T = 25）にしてある。°C は オフセット付き単位で
 * 25°C = 298.15K の絶対温度になり、T*0.6215 のような掛け算が別物になってしまうため。
 * 逆に結果は `(...)*K + 273.15*K` で摂氏の絶対温度に戻しているので、単位チップで ℉ にも
 * 読み替えられる。理想気体の式（空気の密度）は本当に絶対温度が要るので、そちらは °C の定数を
 * そのまま使っている。
 */
export const WEATHER_SEEDS: NotebookSeed[] = [
  {
    // マグヌス式の係数 a = 17.62 / b = 243.12℃、飽和水蒸気圧 6.112hPa は WMO(CIMO Guide)・
    // Sonntag(1990) 由来のもので、-45〜60℃ で誤差 0.6% 程度とされる組み合わせ。
    // 検算: 25℃・60% → 露点 16.69℃、水蒸気圧 18.96hPa（25℃の飽和水蒸気圧 約31.6hPa の6割）。
    // 参考: https://www.npl.co.uk/resources/q-a/dew-point-and-relative-humidity
    title: { en: "Dew point from temperature and humidity", ja: "気温と湿度から求める露点温度" },
    description: {
      en: "The Magnus formula turns air temperature and relative humidity into the dew point — the temperature at which windows fog up and dew forms. T is the air temperature as a plain number in °C. It also gives the actual water vapour pressure of the air.",
      ja: "マグヌス式で、気温と相対湿度から露点温度（窓が曇り露がつく温度）を求めます。T は摂氏の数値をそのまま入れます。あわせて空気中の実際の水蒸気圧も求めます。",
    },
    localConstants: [
      { symbol: "T", expression: "25" },
      { symbol: "RH", expression: "60%" },
      { symbol: "γ", expression: "17.62*T/(243.12+T)+ln(RH)" },
    ],
    steps: [
      {
        title: { en: "Water vapour pressure", ja: "水蒸気圧" },
        expression: "RH*(6.112hPa)*e^(17.62*T/(243.12+T))",
        targetUnit: "hPa",
        formulaLatex: "e_a = RH \\times 6.112\\,\\text{hPa} \\times e^{\\frac{17.62\\,T}{243.12 + T}}",
      },
      {
        title: { en: "Dew point", ja: "露点温度" },
        expression: "(243.12*γ/(17.62-γ))*K+273.15*K",
        targetUnit: "°C",
        formulaLatex: "T_d = \\dfrac{243.12\\,\\gamma}{17.62 - \\gamma}",
      },
    ],
  },
  {
    // 北米の気象機関が2001年から使っているウィンドチル指数（JAG/TI）。
    // W = 13.12 + 0.6215T - 11.37v^0.16 + 0.3965Tv^0.16（T は℃、v は高さ10mの風速 km/h）。
    // 検算: -5℃・20km/h → -11.55℃。カナダ環境省の早見表の -12 と一致する（表は整数に丸めている）。
    // 参考: https://www.canada.ca/en/services/environment/weather/severeweather/wind-chill-index.html
    title: { en: "Wind chill temperature", ja: "風を考えた体感温度（ウィンドチル）" },
    description: {
      en: "Wind strips away the thin layer of warm air around the skin, so cold air feels colder. T is the air temperature as a plain number in °C; the wind speed keeps its unit, so it can be entered in km/h, m/s, mph or knots. The index is defined for T of 10 °C or below and winds above about 5 km/h.",
      ja: "風が肌のまわりの暖かい空気を奪うため、同じ気温でも風が強いほど寒く感じます。T は摂氏の数値をそのまま、風速は単位付きで入れます（km/h・m/s・mph・ノットのいずれでも構いません）。気温10℃以下・風速およそ5km/h以上での目安です。",
    },
    localConstants: [
      { symbol: "T", expression: "-5" },
      { symbol: "v", expression: "20km/h" },
    ],
    steps: [
      {
        title: { en: "Wind chill temperature", ja: "体感温度" },
        expression: "(13.12+0.6215*T+(0.3965*T-11.37)*(v/(1km/h))^0.16)*K+273.15*K",
        targetUnit: "°C",
        formulaLatex: "T_{wc} = 13.12 + 0.6215\\,T - 11.37\\,v^{0.16} + 0.3965\\,T\\,v^{0.16}",
      },
    ],
  },
  {
    // オーストラリア気象局(BOM)が使う Steadman の体感温度（Apparent Temperature）。
    // AT = Ta + 0.33e - 0.70ws - 4.00（Ta は℃、e は水蒸気圧 hPa、ws は高さ10mの風速 m/s）。
    // 水蒸気圧は e = (rh/100) * 6.105 * exp(17.27*Ta/(237.7+Ta))。RH を 60% （＝0.6）で持てば
    // rh/100 の部分がそのまま表現できる。
    // 米国のheat index（華氏の多項式）と違い係数がそのままメートル法なので、どの地域でも同じ式で使える。
    // 検算: 30℃・60%・2m/s → 水蒸気圧 25.37hPa、体感温度 32.97℃（気温より約3℃高い）。
    // 参考: http://www.bom.gov.au/info/thermal_stress/
    title: { en: "Apparent temperature in heat and humidity", ja: "蒸し暑さの体感温度" },
    description: {
      en: "In hot weather, humidity slows the evaporation of sweat and wind speeds it up, so the same air temperature can feel very different. Tₐ is the air temperature as a plain number in °C; the wind speed keeps its unit.",
      ja: "暑いときは、湿度が高いほど汗が蒸発しにくく、風があるほど蒸発しやすくなるため、同じ気温でも感じ方が変わります。Tₐ は摂氏の数値をそのまま、風速は単位付きで入れます。",
    },
    localConstants: [
      { symbol: "Tₐ", expression: "30" },
      { symbol: "RH", expression: "60%" },
      { symbol: "w", expression: "2m/s" },
      { symbol: "eₐ", expression: "RH*(6.105hPa)*e^(17.27*Tₐ/(237.7+Tₐ))" },
    ],
    steps: [
      {
        title: { en: "Apparent temperature", ja: "体感温度" },
        expression: "(Tₐ+0.33*(eₐ/(1hPa))-0.70*(w/(1m/s))-4.00)*K+273.15*K",
        targetUnit: "°C",
        formulaLatex: "AT = T_a + 0.33\\,e_a - 0.70\\,w - 4.00",
      },
      {
        title: { en: "Difference from the air temperature", ja: "気温との差" },
        expression: "(0.33*(eₐ/(1hPa))-0.70*(w/(1m/s))-4.00)*K",
        targetUnit: "K",
        formulaLatex: "\\Delta T = 0.33\\,e_a - 0.70\\,w - 4.00",
      },
    ],
  },
  {
    // 乾燥空気の比気体定数 R = 287.05 J/(kg·K)。単位サフィックスは括弧を使えないので
    // "287.05J/kg/K" と連ねて書く（"287.05J/(kg*K)" は解析できない）。
    title: { en: "Air density from pressure and temperature", ja: "気圧と気温から求める空気の密度" },
    description: {
      en: "Treating air as an ideal gas, its density follows from the pressure and the temperature. Here the temperature really is an absolute temperature, so it can be entered as °C, °F or K directly. Multiplying by a room's volume gives the mass of the air inside it.",
      ja: "空気を理想気体とみなすと、密度は気圧と気温から求まります。ここでの温度は本当の絶対温度なので、℃・℉・K のどれで入れても構いません。部屋の体積を掛ければ、その中の空気の質量になります。",
    },
    localConstants: [
      { symbol: "p", expression: "1013.25hPa" },
      { symbol: "T", expression: "15°C" },
      { symbol: "R", expression: "287.05J/kg/K" },
      { symbol: "V", expression: "50m^3" },
    ],
    steps: [
      {
        title: { en: "Air density", ja: "空気の密度" },
        expression: "p/(R*T)",
        targetUnit: "kg/m³",
        formulaLatex: "\\rho = \\dfrac{p}{R\\,T}",
      },
      {
        title: { en: "Mass of the air in the room", ja: "部屋の中の空気の質量" },
        expression: "p*V/(R*T)",
        targetUnit: "kg",
        formulaLatex: "m = \\dfrac{p\\,V}{R\\,T}",
      },
    ],
  },
  {
    // 国際標準大気(ISA)の対流圏の式。気温減率 L = 6.5K/km、海面気温 T₀ = 288.15K、
    // 指数 gM/(RL) = 5.25588。検算: 1000m → 898.75hPa（ISAの表の 898.75hPa と一致）、
    // 900hPa → 988.5m。
    // 参考: https://www.calculate.co.nz/air-pressure-at-altitude-calculator.php
    title: { en: "Air pressure and altitude", ja: "高度と気圧（気圧高度公式）" },
    description: {
      en: "In the standard atmosphere, temperature falls steadily with height and pressure falls with it. Compute the pressure at a given altitude, and the altitude that a measured pressure corresponds to — the calculation an altimeter does.",
      ja: "標準大気では、高度が上がるにつれて気温が一定の割合で下がり、それにつれて気圧も下がります。ある高度での気圧と、測った気圧に対応する高度（高度計がしている計算）を求めます。",
    },
    localConstants: [
      { symbol: "p₀", expression: "1013.25hPa" },
      { symbol: "L", expression: "0.0065K/m" },
      { symbol: "T₀", expression: "288.15K" },
      { symbol: "h", expression: "1000m" },
      { symbol: "p", expression: "900hPa" },
    ],
    steps: [
      {
        title: { en: "Pressure at the given altitude", ja: "その高度での気圧" },
        expression: "p₀*(1-L*h/T₀)^5.25588",
        targetUnit: "hPa",
        formulaLatex: "p_h = p_0 \\left(1 - \\dfrac{L\\,h}{T_0}\\right)^{5.25588}",
      },
      {
        title: { en: "Altitude for the measured pressure", ja: "その気圧にあたる高度" },
        expression: "T₀/L*(1-(p/p₀)^(1/5.25588))",
        targetUnit: "m",
        formulaLatex: "h_p = \\dfrac{T_0}{L}\\left(1 - \\left(\\dfrac{p}{p_0}\\right)^{1/5.25588}\\right)",
      },
    ],
  },
  {
    title: { en: "Rainwater collected from a roof", ja: "屋根に降った雨水の量" },
    description: {
      en: "Rainfall is reported as a depth, so the volume that lands on a roof is simply that depth times the plan area — 1 mm over 1 m² is 1 litre. Part of it is lost to splash, evaporation and the first flush, so a collection efficiency is applied as well.",
      ja: "降水量は深さで表されるので、屋根に降る雨の体積は深さ×水平投影面積で求まります（1m²に1mmで1L）。実際には跳ね返りや蒸発、降り始めの汚れた分などで一部は失われるため、集水効率も掛けます。",
    },
    localConstants: [
      { symbol: "R", expression: "25mm" },
      { symbol: "A", expression: "60m^2" },
      { symbol: "η", expression: "85%" },
    ],
    steps: [
      {
        title: { en: "Rain falling on the roof", ja: "屋根に降る雨の量" },
        expression: "R*A",
        targetUnit: "L",
        formulaLatex: "V = R \\times A",
      },
      {
        title: { en: "Water actually collected", ja: "実際にためられる量" },
        expression: "R*A*η",
        targetUnit: "L",
        formulaLatex: "V_u = R \\times A \\times \\eta",
      },
    ],
  },
];
