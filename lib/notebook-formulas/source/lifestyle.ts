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
    title: { en: "Coffee brew ratio (grounds and water)", ja: "コーヒーの抽出比率（粉と湯の量）", es: "Ratio de extracción del café (café molido y agua)", "pt-BR": "Proporção café-água (café moído e água)", de: "Brührverhältnis für Kaffee (Kaffeemehl und Wasser)", fr: "Ratio d'extraction du café (café moulu et eau)" },
    description: {
      en: "From the brew ratio (1 part grounds to R parts water by mass), compute the grounds needed for a given amount of water — and the water needed for a given amount of grounds. R = 16.7 corresponds to the widely used 60 g of coffee per litre of water.",
      ja: "抽出比率（粉1に対して湯R、いずれも質量）から、湯の量に必要な粉の量と、手持ちの粉に必要な湯の量を求めます。R = 16.7 は「湯1Lに粉60g」としてよく使われる比率です。",
      es: "A partir del ratio de extracción (1 parte de café molido por R partes de agua, en masa), calcula el café molido necesario para una cantidad de agua dada y el agua necesaria para una cantidad de café molido dada. R = 16,7 corresponde a los 60 g de café por litro de agua que se usan habitualmente.",
      "pt-BR": "A partir da proporção café-água (1 parte de café moído para R partes de água, em massa), calcule o café moído necessário para uma dada quantidade de água e a água necessária para uma dada quantidade de café moído. R = 16,7 corresponde aos 60 g de café por litro de água amplamente usados.",
      de: "Aus dem Brührverhältnis (1 Teil Kaffeemehl auf R Teile Wasser, jeweils nach Masse) ergeben sich die Einwaage für eine bestimmte Wassermenge und die Wassermenge für eine bestimmte Einwaage. R = 16,7 entspricht den weit verbreiteten 60 g Kaffee je Liter Wasser.",
      fr: "À partir du ratio d'extraction (1 part de café moulu pour R parts d'eau, en masse), calculer la dose de café moulu nécessaire pour une quantité d'eau donnée et l'eau nécessaire pour une dose donnée. R = 16,7 correspond aux 60 g de café par litre d'eau couramment utilisés.",
    },
    localConstants: [
      { symbol: "V", expression: "250mL" },
      { symbol: "R", expression: "16.7" },
      { symbol: "ρ", expression: "1g/mL" },
      { symbol: "mₚ", expression: "15g" },
    ],
    steps: [
      {
        title: { en: "Grounds for the given water", ja: "湯の量に必要な粉の量", es: "Café molido para el agua indicada", "pt-BR": "Café moído para a água indicada", de: "Kaffeemehl für die angegebene Wassermenge", fr: "Café moulu pour l'eau indiquée" },
        expression: "V*ρ/R",
        targetUnit: "g",
        formulaLatex: "m = \\dfrac{V \\times \\rho}{R}",
      },
      {
        title: { en: "Water for the given grounds", ja: "粉の量に必要な湯の量", es: "Agua para el café molido indicado", "pt-BR": "Água para o café moído indicado", de: "Wasser für die angegebene Einwaage", fr: "Eau pour le café moulu indiqué" },
        expression: "mₚ*R/ρ",
        targetUnit: "mL",
        formulaLatex: "V_w = \\dfrac{m_p \\times R}{\\rho}",
      },
    ],
  },
  {
    title: { en: "Espresso ratio and flow rate", ja: "エスプレッソの抽出比率と流量", es: "Ratio de extracción y caudal del espresso", "pt-BR": "Proporção de extração e vazão do espresso", de: "Brührverhältnis und Flussrate beim Espresso", fr: "Ratio d'extraction et débit de l'espresso" },
    description: {
      en: "From the dose in the basket, the mass of espresso in the cup, and the shot time, compute the brew ratio and the flow rate. A ratio near 1:2 in about 25–30 s is the usual starting point.",
      ja: "バスケットに詰めた粉の量・カップに出た液体の量・抽出時間から、抽出比率と流量を求めます。1:2 前後を25〜30秒で、が調整の出発点です。",
      es: "A partir de la dosis del portafiltro, la masa de espresso en la taza y el tiempo de extracción, calcula el ratio de extracción y el caudal. Un ratio cercano a 1:2 en unos 25–30 s es el punto de partida habitual.",
      "pt-BR": "A partir da dose no cesto, da massa de espresso na xícara e do tempo de extração, calcule a proporção de extração e a vazão. Uma proporção perto de 1:2 em cerca de 25–30 s é o ponto de partida usual.",
      de: "Aus der Einwaage im Sieb, der Masse des Espresso in der Tasse und der Bezugszeit ergeben sich das Brührverhältnis und die Flussrate. Ein Verhältnis um 1:2 in etwa 25–30 s ist der übliche Ausgangspunkt.",
      fr: "À partir de la dose dans le panier, de la masse d'espresso dans la tasse et du temps d'extraction, calculer le ratio d'extraction et le débit. Un ratio proche de 1:2 en 25–30 s environ est le point de départ habituel.",
    },
    localConstants: [
      { symbol: "mᵢ", expression: "18g" },
      { symbol: "mₒ", expression: "36g" },
      { symbol: "t", expression: "28s" },
    ],
    steps: [
      {
        title: { en: "Brew ratio", ja: "抽出比率", es: "Ratio de extracción", "pt-BR": "Proporção de extração", de: "Brührverhältnis", fr: "Ratio d'extraction" },
        expression: "mₒ/mᵢ",
        targetUnit: "",
        formulaLatex: "R = \\dfrac{m_o}{m_i}",
      },
      {
        title: { en: "Flow rate", ja: "流量", es: "Caudal", "pt-BR": "Vazão", de: "Flussrate", fr: "Débit" },
        expression: "mₒ/t",
        targetUnit: "g/s",
        formulaLatex: "Q = \\dfrac{m_o}{t}",
      },
    ],
  },
  {
    title: { en: "Cold brew concentrate dilution", ja: "コールドブリュー原液の希釈", es: "Dilución del concentrado de cold brew", "pt-BR": "Diluição do concentrado de cold brew", de: "Verdünnung von Cold-Brew-Konzentrat", fr: "Dilution du concentré de cold brew" },
    description: {
      en: "Cold brew is often steeped as a concentrate and diluted before serving. From the amount of concentrate and how many parts of water you add per part of concentrate, compute the water to add and the finished volume.",
      ja: "コールドブリューは原液で抽出し、飲むときに薄めることが多いです。原液の量と、原液1に対して加える水の割合から、加える水の量とできあがりの量を求めます。",
      es: "El cold brew suele prepararse como concentrado y diluirse antes de servir. A partir de la cantidad de concentrado y de cuántas partes de agua se añaden por cada parte de concentrado, calcula el agua que hay que añadir y el volumen final.",
      "pt-BR": "O cold brew costuma ser preparado como concentrado e diluído na hora de servir. A partir da quantidade de concentrado e de quantas partes de água se acrescentam por parte de concentrado, calcule a água a acrescentar e o volume final.",
      de: "Cold Brew wird oft als Konzentrat angesetzt und erst vor dem Servieren verdünnt. Aus der Menge des Konzentrats und der Anzahl Teile Wasser je Teil Konzentrat ergeben sich die zuzugebende Wassermenge und die fertige Menge.",
      fr: "Le cold brew est souvent préparé sous forme de concentré puis dilué au moment de servir. À partir de la quantité de concentré et du nombre de parts d'eau ajoutées par part de concentré, calculer l'eau à ajouter et le volume final.",
    },
    localConstants: [
      { symbol: "Vₒ", expression: "100mL" },
      { symbol: "n", expression: "3" },
    ],
    steps: [
      {
        title: { en: "Water to add", ja: "加える水の量", es: "Agua que añadir", "pt-BR": "Água a acrescentar", de: "Zuzugebendes Wasser", fr: "Eau à ajouter" },
        expression: "Vₒ*n",
        targetUnit: "mL",
        formulaLatex: "V_w = V_o \\times n",
      },
      {
        title: { en: "Finished volume", ja: "できあがりの量", es: "Volumen final", "pt-BR": "Volume final", de: "Fertige Menge", fr: "Volume final" },
        expression: "Vₒ*(1+n)",
        targetUnit: "mL",
        formulaLatex: "V_t = V_o \\times (1 + n)",
      },
    ],
  },
  {
    title: { en: "Extraction yield from TDS", ja: "TDSから求める抽出収率", es: "Rendimiento de extracción a partir del TDS", "pt-BR": "Rendimento de extração a partir do TDS", de: "Extraktionsausbeute aus dem TDS", fr: "Rendement d'extraction à partir du TDS" },
    description: {
      en: "A refractometer gives the total dissolved solids (TDS) of the brewed coffee. Multiplied by the beverage mass it gives how much coffee actually dissolved, and divided by the dry dose it gives the extraction yield. 18–22 % is the commonly cited target band.",
      ja: "屈折計で測った抽出液の濃度（TDS）に抽出液の質量を掛けると、実際に溶け出したコーヒーの質量になります。それを粉の質量で割ったものが抽出収率で、18〜22%が目安とされます。",
      es: "Un refractómetro da los sólidos disueltos totales (TDS) del café ya extraído. Multiplicado por la masa de la bebida indica cuánto café se disolvió realmente, y dividido por la dosis de café seco da el rendimiento de extracción. El intervalo objetivo que se cita habitualmente es del 18–22 %.",
      "pt-BR": "Um refratômetro fornece os sólidos dissolvidos totais (TDS) do café já extraído. Multiplicado pela massa da bebida, indica quanto café realmente se dissolveu e, dividido pela dose de café seco, dá o rendimento de extração. A faixa-alvo normalmente citada é de 18–22 %.",
      de: "Ein Refraktometer liefert die gelösten Feststoffe (TDS) des fertigen Kaffees. Multipliziert mit der Masse des Getränks ergibt sich, wie viel Kaffee tatsächlich in Lösung gegangen ist; geteilt durch die trockene Einwaage ergibt sich die Extraktionsausbeute. Als Zielbereich werden üblicherweise 18–22 % genannt.",
      fr: "Un réfractomètre donne les matières sèches dissoutes (TDS) du café extrait. Multipliées par la masse de la boisson, elles indiquent la quantité de café réellement dissoute ; divisées par la dose de café sec, elles donnent le rendement d'extraction. La plage visée couramment citée est de 18–22 %.",
    },
    localConstants: [
      { symbol: "TDS", expression: "1.35%" },
      { symbol: "mₛ", expression: "220g" },
      { symbol: "mₚ", expression: "15g" },
    ],
    steps: [
      {
        title: { en: "Dissolved coffee solids", ja: "溶け出した固形分の質量", es: "Sólidos de café disueltos", "pt-BR": "Sólidos de café dissolvidos", de: "Gelöste Kaffeefeststoffe", fr: "Matières de café dissoutes" },
        expression: "TDS*mₛ",
        targetUnit: "g",
        formulaLatex: "m_r = TDS \\times m_s",
      },
      {
        title: { en: "Extraction yield", ja: "抽出収率", es: "Rendimiento de extracción", "pt-BR": "Rendimento de extração", de: "Extraktionsausbeute", fr: "Rendement d'extraction" },
        expression: "TDS*mₛ/mₚ",
        targetUnit: "%",
        formulaLatex: "EY = \\dfrac{TDS \\times m_s}{m_p}",
      },
    ],
  },
  {
    title: { en: "Beer ABV from original and final gravity", ja: "ビールのアルコール度数（初期比重と最終比重）", es: "Graduación alcohólica de la cerveza a partir de la densidad original y la final", "pt-BR": "Teor alcoólico da cerveja a partir da densidade original e da final", de: "Alkoholgehalt des Biers aus Anfangsdichte und Enddichte", fr: "Titre alcoométrique de la bière à partir de la densité initiale et finale" },
    description: {
      en: "From the specific gravity before fermentation (OG) and after it (FG), compute the alcohol by volume and the apparent attenuation. Typical ales finish around 75–80 % attenuation.",
      ja: "発酵前の比重（OG）と発酵後の比重（FG）から、アルコール度数と見かけの発酵度を求めます。一般的なエールの発酵度は75〜80%程度です。",
      es: "A partir de la densidad relativa antes de la fermentación (OG) y después de ella (FG), calcula la graduación alcohólica en volumen y la atenuación aparente. Las ales típicas terminan en torno a un 75–80 % de atenuación.",
      "pt-BR": "A partir da densidade relativa antes da fermentação (OG) e depois dela (FG), calcule o teor alcoólico em volume e a atenuação aparente. As ales típicas terminam por volta de 75–80 % de atenuação.",
      de: "Aus der Dichte vor der Gärung (OG) und danach (FG) ergeben sich der Alkoholgehalt in Volumenprozent und der scheinbare Vergärungsgrad. OG und FG werden dabei als spezifisches Gewicht eingegeben (z. B. 1,050), nicht in °Plato. Typische Ales enden bei etwa 75–80 % Vergärungsgrad.",
      fr: "À partir de la densité avant la fermentation (OG) et après celle-ci (FG), calculer le titre alcoométrique volumique et l'atténuation apparente. Les ales typiques terminent autour de 75–80 % d'atténuation.",
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
        title: { en: "Alcohol by volume", ja: "アルコール度数", es: "Graduación alcohólica (% vol)", "pt-BR": "Teor alcoólico (% ABV)", de: "Alkoholgehalt (Vol.-%)", fr: "Titre alcoométrique volumique (% vol)" },
        expression: "(OG-FG)*131.25%",
        targetUnit: "%",
        formulaLatex: "ABV = (OG - FG) \\times 131.25\\,\\%",
      },
      {
        title: { en: "Apparent attenuation", ja: "見かけの発酵度", es: "Atenuación aparente", "pt-BR": "Atenuação aparente", de: "Scheinbarer Vergärungsgrad", fr: "Atténuation apparente" },
        expression: "(OG-FG)/(OG-1)",
        targetUnit: "%",
        formulaLatex: "AA = \\dfrac{OG - FG}{OG - 1}",
      },
    ],
  },
  {
    title: { en: "Blending hot and cold water to a brewing temperature", ja: "抽出温度の調整（熱湯と水を混ぜる）", es: "Mezclar agua caliente y fría hasta la temperatura de extracción", "pt-BR": "Misturar água quente e fria até a temperatura de extração", de: "Heißes und kaltes Wasser auf Brühtemperatur mischen", fr: "Mélanger eau chaude et eau froide pour atteindre la température d'infusion" },
    description: {
      en: "Pour-over coffee is usually brewed near 93 °C and green tea much cooler, so freshly boiled water has to be brought down. Compute the temperature of a blend of hot and cold water, and how much cold water to add to hit a target temperature.",
      ja: "ハンドドリップは93℃前後、緑茶はもっと低い温度で淹れるため、沸かしたての湯は温度を下げる必要があります。熱湯と水を混ぜたときの温度と、目標温度にするために加える水の量を求めます。",
      es: "El café de filtro se extrae normalmente cerca de 93 °C y el té verde bastante más frío, así que hay que bajar la temperatura del agua recién hervida. Calcula la temperatura de la mezcla de agua caliente y fría, y cuánta agua fría hay que añadir para llegar a la temperatura objetivo.",
      "pt-BR": "O café coado costuma ser extraído perto de 93 °C e o chá verde bem mais frio, então a água recém-fervida precisa ser resfriada. Calcule a temperatura da mistura de água quente e fria e quanta água fria acrescentar para chegar à temperatura desejada.",
      de: "Handfilterkaffee wird meist bei etwa 93 °C aufgebrüht, Grüntee deutlich kühler, frisch gekochtes Wasser muss also heruntergekühlt werden. Berechnet die Temperatur einer Mischung aus heißem und kaltem Wasser sowie die Menge kalten Wassers, die für eine Zieltemperatur nötig ist.",
      fr: "Le café filtre s'infuse en général vers 93 °C et le thé vert bien plus frais : l'eau tout juste bouillie doit donc être refroidie. Calculer la température d'un mélange d'eau chaude et d'eau froide, et la quantité d'eau froide à ajouter pour atteindre une température visée.",
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
        title: { en: "Temperature after blending", ja: "混ぜたあとの温度", es: "Temperatura de la mezcla", "pt-BR": "Temperatura após a mistura", de: "Temperatur nach dem Mischen", fr: "Température après mélange" },
        expression: "(m₁*T₁+m₂*T₂)/(m₁+m₂)",
        targetUnit: "°C",
        formulaLatex: "T_m = \\dfrac{m_1 T_1 + m_2 T_2}{m_1 + m_2}",
      },
      {
        title: { en: "Cold water needed for the target temperature", ja: "目標温度にするために加える水の量", es: "Agua fría necesaria para la temperatura objetivo", "pt-BR": "Água fria necessária para a temperatura desejada", de: "Für die Zieltemperatur nötiges kaltes Wasser", fr: "Eau froide nécessaire pour la température visée" },
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
    title: { en: "Dew point from temperature and humidity", ja: "気温と湿度から求める露点温度", es: "Punto de rocío a partir de la temperatura y la humedad", "pt-BR": "Ponto de orvalho a partir da temperatura e da umidade", de: "Taupunkt aus Temperatur und Luftfeuchtigkeit", fr: "Point de rosée à partir de la température et de l'humidité" },
    description: {
      en: "The Magnus formula turns air temperature and relative humidity into the dew point — the temperature at which windows fog up and dew forms. T is the air temperature as a plain number in °C. It also gives the actual water vapour pressure of the air.",
      ja: "マグヌス式で、気温と相対湿度から露点温度（窓が曇り露がつく温度）を求めます。T は摂氏の数値をそのまま入れます。あわせて空気中の実際の水蒸気圧も求めます。",
      es: "La fórmula de Magnus convierte la temperatura del aire y la humedad relativa en el punto de rocío: la temperatura a la que se empañan las ventanas y se forma rocío. T es la temperatura del aire como número solo, sin unidad, en °C. También se obtiene la presión de vapor de agua real del aire.",
      "pt-BR": "A fórmula de Magnus converte a temperatura do ar e a umidade relativa no ponto de orvalho: a temperatura em que os vidros embaçam e o orvalho se forma. T é a temperatura do ar como número puro, sem unidade, em °C. Também se obtém a pressão de vapor d'água real do ar.",
      de: "Die Magnus-Formel macht aus Lufttemperatur und relativer Luftfeuchtigkeit den Taupunkt: die Temperatur, bei der Fenster beschlagen und sich Tau bildet. T ist die Lufttemperatur als reine Zahl in °C, also ohne Einheit eingegeben. Außerdem ergibt sich der tatsächliche Wasserdampfdruck der Luft.",
      fr: "La formule de Magnus transforme la température de l'air et l'humidité relative en point de rosée, c'est-à-dire la température à laquelle les vitres s'embuent et la rosée se forme. T est la température de l'air sous forme de nombre seul, sans unité, en °C. On obtient aussi la pression de vapeur d'eau réelle de l'air.",
    },
    localConstants: [
      { symbol: "T", expression: "25" },
      { symbol: "RH", expression: "60%" },
      { symbol: "γ", expression: "17.62*T/(243.12+T)+ln(RH)" },
    ],
    steps: [
      {
        title: { en: "Water vapour pressure", ja: "水蒸気圧", es: "Presión de vapor de agua", "pt-BR": "Pressão de vapor d'água", de: "Wasserdampfdruck", fr: "Pression de vapeur d'eau" },
        expression: "RH*(6.112hPa)*e^(17.62*T/(243.12+T))",
        targetUnit: "hPa",
        formulaLatex: "e_a = RH \\times 6.112\\,\\text{hPa} \\times e^{\\frac{17.62\\,T}{243.12 + T}}",
      },
      {
        title: { en: "Dew point", ja: "露点温度", es: "Punto de rocío", "pt-BR": "Ponto de orvalho", de: "Taupunkt", fr: "Point de rosée" },
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
    title: { en: "Wind chill temperature", ja: "風を考えた体感温度（ウィンドチル）", es: "Sensación térmica por viento (windchill)", "pt-BR": "Sensação térmica pelo vento (windchill)", de: "Windchill-Temperatur", fr: "Refroidissement éolien" },
    description: {
      en: "Wind strips away the thin layer of warm air around the skin, so cold air feels colder. T is the air temperature as a plain number in °C; the wind speed keeps its unit, so it can be entered in km/h, m/s, mph or knots. The index is defined for T of 10 °C or below and winds above about 5 km/h.",
      ja: "風が肌のまわりの暖かい空気を奪うため、同じ気温でも風が強いほど寒く感じます。T は摂氏の数値をそのまま、風速は単位付きで入れます（km/h・m/s・mph・ノットのいずれでも構いません）。気温10℃以下・風速およそ5km/h以上での目安です。",
      es: "El viento se lleva la fina capa de aire templado que rodea la piel, por lo que el aire frío se siente más frío. T es la temperatura del aire como número solo, sin unidad, en °C; la velocidad del viento, en cambio, conserva su unidad, así que puede introducirse en km/h, m/s, mph o nudos. El índice está definido para T de 10 °C o menos y vientos superiores a unos 5 km/h.",
      "pt-BR": "O vento retira a fina camada de ar aquecido junto à pele, por isso o ar frio parece ainda mais frio. T é a temperatura do ar como número puro, sem unidade, em °C; a velocidade do vento, ao contrário, mantém sua unidade e pode ser inserida em km/h, m/s, mph ou nós. O índice é definido para T de 10 °C ou menos e ventos acima de cerca de 5 km/h.",
      de: "Der Wind trägt die dünne Schicht erwärmter Luft an der Haut ab, deshalb fühlt sich kalte Luft noch kälter an. T ist die Lufttemperatur als reine Zahl in °C, also ohne Einheit eingegeben; die Windgeschwindigkeit behält dagegen ihre Einheit und kann in km/h, m/s, mph oder Knoten eingegeben werden. Der Index gilt für T von 10 °C oder darunter und Wind über etwa 5 km/h.",
      fr: "Le vent balaie la fine couche d'air réchauffé autour de la peau, si bien que l'air froid paraît encore plus froid. T est la température de l'air sous forme de nombre seul, sans unité, en °C ; la vitesse du vent, elle, conserve son unité et peut être saisie en km/h, m/s, mph ou nœuds. L'indice est défini pour une valeur de T inférieure ou égale à 10 °C et des vents supérieurs à environ 5 km/h.",
    },
    localConstants: [
      { symbol: "T", expression: "-5" },
      { symbol: "v", expression: "20km/h" },
    ],
    steps: [
      {
        title: { en: "Wind chill temperature", ja: "体感温度", es: "Sensación térmica por viento", "pt-BR": "Sensação térmica pelo vento", de: "Windchill-Temperatur", fr: "Température de refroidissement éolien" },
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
    title: { en: "Apparent temperature in heat and humidity", ja: "蒸し暑さの体感温度", es: "Temperatura aparente (calor y humedad)", "pt-BR": "Temperatura aparente (calor e umidade)", de: "Gefühlte Temperatur (Hitze und Luftfeuchte)", fr: "Température ressentie par temps chaud et humide" },
    description: {
      en: "In hot weather, humidity slows the evaporation of sweat and wind speeds it up, so the same air temperature can feel very different. Tₐ is the air temperature as a plain number in °C; the wind speed keeps its unit.",
      ja: "暑いときは、湿度が高いほど汗が蒸発しにくく、風があるほど蒸発しやすくなるため、同じ気温でも感じ方が変わります。Tₐ は摂氏の数値をそのまま、風速は単位付きで入れます。",
      es: "Con calor, la humedad frena la evaporación del sudor y el viento la acelera, así que una misma temperatura del aire puede sentirse muy distinta. Tₐ es la temperatura del aire como número solo, sin unidad, en °C; la velocidad del viento, en cambio, conserva su unidad.",
      "pt-BR": "No calor, a umidade retarda a evaporação do suor e o vento a acelera, de modo que a mesma temperatura do ar pode parecer bem diferente. Tₐ é a temperatura do ar como número puro, sem unidade, em °C; a velocidade do vento, ao contrário, mantém sua unidade.",
      de: "Bei Hitze verlangsamt hohe Luftfeuchte die Verdunstung des Schweißes, Wind beschleunigt sie, sodass sich dieselbe Lufttemperatur sehr unterschiedlich anfühlen kann. Tₐ ist die Lufttemperatur als reine Zahl in °C, also ohne Einheit eingegeben; die Windgeschwindigkeit behält dagegen ihre Einheit.",
      fr: "Par temps chaud, l'humidité ralentit l'évaporation de la sueur et le vent l'accélère : une même température de l'air peut donc être ressentie très différemment. Tₐ est la température de l'air sous forme de nombre seul, sans unité, en °C ; la vitesse du vent, elle, conserve son unité.",
    },
    localConstants: [
      { symbol: "Tₐ", expression: "30" },
      { symbol: "RH", expression: "60%" },
      { symbol: "w", expression: "2m/s" },
      { symbol: "eₐ", expression: "RH*(6.105hPa)*e^(17.27*Tₐ/(237.7+Tₐ))" },
    ],
    steps: [
      {
        title: { en: "Apparent temperature", ja: "体感温度", es: "Temperatura aparente", "pt-BR": "Temperatura aparente", de: "Gefühlte Temperatur", fr: "Température ressentie" },
        expression: "(Tₐ+0.33*(eₐ/(1hPa))-0.70*(w/(1m/s))-4.00)*K+273.15*K",
        targetUnit: "°C",
        formulaLatex: "AT = T_a + 0.33\\,e_a - 0.70\\,w - 4.00",
      },
      {
        title: { en: "Difference from the air temperature", ja: "気温との差", es: "Diferencia con la temperatura del aire", "pt-BR": "Diferença em relação à temperatura do ar", de: "Unterschied zur Lufttemperatur", fr: "Écart avec la température de l'air" },
        expression: "(0.33*(eₐ/(1hPa))-0.70*(w/(1m/s))-4.00)*K",
        targetUnit: "K",
        formulaLatex: "\\Delta T = 0.33\\,e_a - 0.70\\,w - 4.00",
      },
    ],
  },
  {
    // 乾燥空気の比気体定数 R = 287.05 J/(kg·K)。単位サフィックスは括弧を使えないので
    // "287.05J/kg/K" と連ねて書く（"287.05J/(kg*K)" は解析できない）。
    title: { en: "Air density from pressure and temperature", ja: "気圧と気温から求める空気の密度", es: "Densidad del aire a partir de la presión y la temperatura", "pt-BR": "Densidade do ar a partir da pressão e da temperatura", de: "Luftdichte aus Druck und Temperatur", fr: "Masse volumique de l'air à partir de la pression et de la température" },
    description: {
      en: "Treating air as an ideal gas, its density follows from the pressure and the temperature. Here the temperature really is an absolute temperature, so it can be entered as °C, °F or K directly. Multiplying by a room's volume gives the mass of the air inside it.",
      ja: "空気を理想気体とみなすと、密度は気圧と気温から求まります。ここでの温度は本当の絶対温度なので、℃・℉・K のどれで入れても構いません。部屋の体積を掛ければ、その中の空気の質量になります。",
      es: "Si se trata el aire como un gas ideal, su densidad se deduce de la presión y la temperatura. Aquí la temperatura sí es una temperatura absoluta, así que puede introducirse directamente en °C, °F o K. Multiplicándola por el volumen de una habitación se obtiene la masa del aire que contiene.",
      "pt-BR": "Tratando o ar como gás ideal, sua densidade decorre da pressão e da temperatura. Aqui a temperatura é de fato uma temperatura absoluta, então pode ser inserida diretamente em °C, °F ou K. Multiplicando pelo volume de um cômodo, obtém-se a massa do ar que ele contém.",
      de: "Betrachtet man Luft als ideales Gas, folgt ihre Dichte aus Druck und Temperatur. Hier ist die Temperatur wirklich eine absolute Temperatur, sie kann also direkt in °C, °F oder K eingegeben werden. Multipliziert mit dem Volumen eines Raums ergibt sich die Masse der darin enthaltenen Luft.",
      fr: "En traitant l'air comme un gaz parfait, sa masse volumique découle de la pression et de la température. Ici la température est réellement une température absolue : elle peut donc être saisie directement en °C, °F ou K. En la multipliant par le volume d'une pièce, on obtient la masse de l'air qu'elle contient.",
    },
    localConstants: [
      { symbol: "p", expression: "1013.25hPa" },
      { symbol: "T", expression: "15°C" },
      { symbol: "R", expression: "287.05J/kg/K" },
      { symbol: "V", expression: "50m^3" },
    ],
    steps: [
      {
        title: { en: "Air density", ja: "空気の密度", es: "Densidad del aire", "pt-BR": "Densidade do ar", de: "Luftdichte", fr: "Masse volumique de l'air" },
        expression: "p/(R*T)",
        targetUnit: "kg/m³",
        formulaLatex: "\\rho = \\dfrac{p}{R\\,T}",
      },
      {
        title: { en: "Mass of the air in the room", ja: "部屋の中の空気の質量", es: "Masa del aire de la habitación", "pt-BR": "Massa do ar no cômodo", de: "Masse der Luft im Raum", fr: "Masse de l'air dans la pièce" },
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
    title: { en: "Air pressure and altitude", ja: "高度と気圧（気圧高度公式）", es: "Presión atmosférica y altitud (fórmula barométrica)", "pt-BR": "Pressão atmosférica e altitude (fórmula barométrica)", de: "Luftdruck und Höhe (barometrische Höhenformel)", fr: "Pression atmosphérique et altitude (formule du nivellement barométrique)" },
    description: {
      en: "In the standard atmosphere, temperature falls steadily with height and pressure falls with it. Compute the pressure at a given altitude, and the altitude that a measured pressure corresponds to — the calculation an altimeter does.",
      ja: "標準大気では、高度が上がるにつれて気温が一定の割合で下がり、それにつれて気圧も下がります。ある高度での気圧と、測った気圧に対応する高度（高度計がしている計算）を求めます。",
      es: "En la atmósfera estándar, la temperatura baja de forma constante con la altura y la presión baja con ella. Calcula la presión a una altitud dada y la altitud que corresponde a una presión medida, que es el cálculo que hace un altímetro.",
      "pt-BR": "Na atmosfera padrão, a temperatura cai de forma constante com a altura e a pressão cai junto com ela. Calcule a pressão em uma dada altitude e a altitude correspondente a uma pressão medida, que é o cálculo feito por um altímetro.",
      de: "In der Normatmosphäre nimmt die Temperatur gleichmäßig mit der Höhe ab und der Luftdruck mit ihr. Berechnet den Druck in einer bestimmten Höhe und die Höhe, die zu einem gemessenen Druck gehört, also genau die Rechnung eines Höhenmessers.",
      fr: "Dans l'atmosphère standard, la température décroît régulièrement avec l'altitude et la pression décroît avec elle. Calculer la pression à une altitude donnée et l'altitude correspondant à une pression mesurée, c'est-à-dire le calcul que fait un altimètre.",
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
        title: { en: "Pressure at the given altitude", ja: "その高度での気圧", es: "Presión a esa altitud", "pt-BR": "Pressão nessa altitude", de: "Druck in dieser Höhe", fr: "Pression à cette altitude" },
        expression: "p₀*(1-L*h/T₀)^5.25588",
        targetUnit: "hPa",
        formulaLatex: "p_h = p_0 \\left(1 - \\dfrac{L\\,h}{T_0}\\right)^{5.25588}",
      },
      {
        title: { en: "Altitude for the measured pressure", ja: "その気圧にあたる高度", es: "Altitud correspondiente a esa presión", "pt-BR": "Altitude correspondente a essa pressão", de: "Höhe zu diesem gemessenen Druck", fr: "Altitude correspondant à cette pression" },
        expression: "T₀/L*(1-(p/p₀)^(1/5.25588))",
        targetUnit: "m",
        formulaLatex: "h_p = \\dfrac{T_0}{L}\\left(1 - \\left(\\dfrac{p}{p_0}\\right)^{1/5.25588}\\right)",
      },
    ],
  },
  {
    title: { en: "Rainwater collected from a roof", ja: "屋根に降った雨水の量", es: "Agua de lluvia recogida de un tejado", "pt-BR": "Água da chuva captada de um telhado", de: "Regenwasser vom Dach", fr: "Eau de pluie récupérée sur un toit" },
    description: {
      en: "Rainfall is reported as a depth, so the volume that lands on a roof is simply that depth times the plan area — 1 mm over 1 m² is 1 litre. Part of it is lost to splash, evaporation and the first flush, so a collection efficiency is applied as well.",
      ja: "降水量は深さで表されるので、屋根に降る雨の体積は深さ×水平投影面積で求まります（1m²に1mmで1L）。実際には跳ね返りや蒸発、降り始めの汚れた分などで一部は失われるため、集水効率も掛けます。",
      es: "La precipitación se expresa como una altura de lluvia, así que el volumen que cae sobre un tejado es simplemente esa altura por la superficie en planta: 1 mm sobre 1 m² es 1 litro. Una parte se pierde por salpicaduras, evaporación y el primer lavado, así que se aplica además una eficiencia de recogida.",
      "pt-BR": "A precipitação é informada como altura de chuva, então o volume que cai sobre um telhado é simplesmente essa altura vezes a área em planta: 1 mm sobre 1 m² é 1 litro. Parte dela se perde por respingos, evaporação e primeira lavagem, por isso também se aplica uma eficiência de captação.",
      de: "Niederschlag wird als Niederschlagshöhe angegeben, das auf ein Dach fallende Volumen ist also einfach diese Höhe mal der Grundfläche: 1 mm auf 1 m² sind 1 Liter. Ein Teil geht durch Spritzwasser, Verdunstung und den ersten Spülstoß verloren, deshalb kommt noch ein Sammelwirkungsgrad dazu.",
      fr: "Les précipitations sont exprimées en hauteur de pluie : le volume qui tombe sur un toit est donc simplement cette hauteur multipliée par la surface en plan, soit 1 litre pour 1 mm sur 1 m². Une partie est perdue par éclaboussures, évaporation et premières eaux, on applique donc aussi un rendement de collecte.",
    },
    localConstants: [
      { symbol: "R", expression: "25mm" },
      { symbol: "A", expression: "60m^2" },
      { symbol: "η", expression: "85%" },
    ],
    steps: [
      {
        title: { en: "Rain falling on the roof", ja: "屋根に降る雨の量", es: "Lluvia que cae sobre el tejado", "pt-BR": "Chuva que cai sobre o telhado", de: "Auf das Dach fallender Regen", fr: "Pluie tombant sur le toit" },
        expression: "R*A",
        targetUnit: "L",
        formulaLatex: "V = R \\times A",
      },
      {
        title: { en: "Water actually collected", ja: "実際にためられる量", es: "Agua realmente recogida", "pt-BR": "Água realmente captada", de: "Tatsächlich gesammeltes Wasser", fr: "Eau réellement récupérée" },
        expression: "R*A*η",
        targetUnit: "L",
        formulaLatex: "V_u = R \\times A \\times \\eta",
      },
    ],
  },
];
