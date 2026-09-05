import type { NotebookSeed } from "../types";

/**
 * 「DIY・住まい」。塗料・コンクリート・タイル・木材・壁紙・照明・給湯など、
 * 家まわりの「どれだけ要るか」をメートル法基準でまとめている。
 * 地域ごとの建築慣習（尺貫法・フィート）には寄せず、寸法はすべて m / mm で持つ。
 */
export const DIY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Paint quantity from wall area", ja: "壁の面積から必要な塗料の量", es: "Cantidad de pintura según la superficie de la pared", "pt-BR": "Quantidade de tinta a partir da área da parede", de: "Farbmenge aus der Wandfläche", fr: "Quantité de peinture d'après la surface du mur" },
    description: {
      en: "Compute how much paint a wall needs from its area, the paint's spreading rate, the number of coats, and a loss allowance. Typical interior emulsion covers about 10–12 m² per litre per coat on a smooth primed surface, and closer to 6–7 m²/L on bare plaster or textured render — always check the product data sheet.",
      ja: "壁の面積・塗料の塗り面積（塗布率）・塗り重ね回数・ロス率から、必要な塗料の量を求めます。室内用の水性塗料は下地が平滑なら1回塗りで1リットルあたり10〜12m²、素地のプラスターや凹凸のある下地では6〜7m²/L程度が目安です（製品のデータシートで確認してください）。",
      es: "Calcula cuánta pintura necesita una pared a partir de su superficie, el rendimiento de la pintura, el número de manos y una merma. Una pintura plástica de interior típica cubre unos 10–12 m² por litro y mano sobre una superficie imprimada lisa, y más bien 6–7 m²/L sobre yeso sin imprimar o revocos texturados; consulta siempre la ficha técnica del producto.",
      "pt-BR": "Calcule quanta tinta uma parede precisa a partir da sua área, do rendimento da tinta, do número de demãos e de uma perda. Uma tinta acrílica de interior típica cobre cerca de 10–12 m² por litro e por demão sobre uma superfície com primer lisa, e mais perto de 6–7 m²/L sobre reboco cru ou texturizado; consulte sempre a ficha técnica do produto.",
      de: "Berechnet aus der Wandfläche, der Ergiebigkeit der Farbe, der Anzahl der Anstriche und einem Verschnittzuschlag, wie viel Farbe eine Wand braucht. Übliche Dispersionsfarbe für innen deckt auf glattem, grundiertem Untergrund etwa 10–12 m² je Liter und Anstrich, auf rohem Putz oder strukturiertem Untergrund eher 6–7 m²/l – prüfe immer das technische Merkblatt des Produkts.",
      fr: "Calculer la quantité de peinture nécessaire pour un mur à partir de sa surface, du rendement de la peinture, du nombre de couches et d'une marge de perte. Une peinture acrylique d'intérieur courante couvre environ 10–12 m² par litre et par couche sur une surface apprêtée lisse, et plutôt 6–7 m²/L sur un plâtre brut ou un enduit texturé ; toujours vérifier la fiche technique du produit.",
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
      { title: { en: "Paint needed V", ja: "必要な塗料の量 V", es: "Pintura necesaria V", "pt-BR": "Tinta necessária V", de: "Benötigte Farbmenge V", fr: "Peinture nécessaire V" }, expression: "A*n/c*(1+waste)", targetUnit: "L", formulaLatex: "V = \\dfrac{A n}{c}\\left(1 + \\text{waste}\\right)" },
      { title: { en: "Area one can covers", ja: "1缶で塗れる面積", es: "Superficie que cubre un bote", "pt-BR": "Área que uma lata cobre", de: "Fläche, die eine Dose deckt", fr: "Surface couverte par un pot" }, expression: "V₁*c/n", targetUnit: "m^2", formulaLatex: "A_1 = \\dfrac{V_1 c}{n}" },
    ],
  },
  {
    title: { en: "Concrete volume and mass for a slab", ja: "コンクリート土間の体積と質量", es: "Volumen y masa de hormigón para una losa", "pt-BR": "Volume e massa de concreto para uma laje", de: "Betonvolumen und Betonmasse für eine Bodenplatte", fr: "Volume et masse de béton pour une dalle" },
    description: {
      en: "Compute the volume of concrete a rectangular slab or footing needs from its length, width and thickness, plus an over-order allowance, and convert it to mass. Ordinary structural concrete is about 2400 kg/m³ (reinforced concrete 2400–2500 kg/m³).",
      ja: "長方形の土間・基礎の縦・横・厚みと余裕率から、必要なコンクリートの体積を求め、質量に換算します。普通コンクリートの密度は約2400kg/m³（鉄筋コンクリートは2400〜2500kg/m³）です。",
      es: "Calcula el volumen de hormigón que necesita una losa o zapata rectangular a partir de su largo, su ancho y su espesor, más un margen de pedido, y conviértelo a masa. El hormigón estructural corriente pesa unos 2400 kg/m³ (el hormigón armado, 2400–2500 kg/m³).",
      "pt-BR": "Calcule o volume de concreto que uma laje ou sapata retangular exige a partir do comprimento, da largura e da espessura, mais uma folga de pedido, e converta-o em massa. O concreto estrutural comum tem cerca de 2400 kg/m³ (concreto armado, 2400–2500 kg/m³).",
      de: "Berechnet aus Länge, Breite und Dicke sowie einem Zuschlag für die Bestellung das Betonvolumen einer rechteckigen Bodenplatte oder eines Fundaments und rechnet es in Masse um. Normalbeton wiegt etwa 2400 kg/m³ (Stahlbeton 2400–2500 kg/m³).",
      fr: "Calculer le volume de béton nécessaire à une dalle ou une semelle rectangulaire à partir de sa longueur, de sa largeur et de son épaisseur, plus une marge de commande, puis le convertir en masse. Le béton de structure courant pèse environ 2400 kg/m³ (béton armé : 2400–2500 kg/m³).",
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
      { title: { en: "Concrete volume V", ja: "必要な体積 V", es: "Volumen de hormigón V", "pt-BR": "Volume de concreto V", de: "Betonvolumen V", fr: "Volume de béton V" }, expression: "L*W*T*(1+waste)", targetUnit: "m^3", formulaLatex: "V = L W T \\left(1 + \\text{waste}\\right)" },
      { title: { en: "Concrete mass m", ja: "コンクリートの質量 m", es: "Masa de hormigón m", "pt-BR": "Massa de concreto m", de: "Betonmasse m", fr: "Masse de béton m" }, expression: "ρ*L*W*T*(1+waste)", targetUnit: "t", formulaLatex: "m = \\rho L W T \\left(1 + \\text{waste}\\right)" },
    ],
  },
  {
    title: { en: "Tile and flooring quantity with a waste allowance", ja: "タイル・床材の必要枚数（ロス込み）", es: "Cantidad de baldosas y suelo con margen de merma", "pt-BR": "Quantidade de pisos e revestimentos com margem de perda", de: "Fliesen- und Bodenbelagsmenge mit Verschnittzuschlag", fr: "Quantité de carrelage et de revêtement de sol avec marge de chutes" },
    description: {
      en: "Compute the area to buy and the number of tiles needed from the room area, one tile's size, and a waste allowance. A straight layout usually needs 10–15% extra for cuts; a diagonal or herringbone layout needs 20–25%. Round the tile count up to the next whole tile (and then up to the next full pack).",
      ja: "部屋の面積・タイル1枚の寸法・ロス率から、購入する面積と必要な枚数を求めます。目地が壁と平行な標準的な張り方でカット分のロスは10〜15%、斜め張りやヘリンボーンでは20〜25%が目安です。枚数は切り上げて（さらに箱単位に切り上げて）注文します。",
      es: "Calcula la superficie que hay que comprar y el número de baldosas necesarias a partir de la superficie de la habitación, el tamaño de una baldosa y una merma. Una colocación recta suele necesitar un 10–15% extra por los cortes; una colocación diagonal o en espiga, un 20–25%. Redondea el número de baldosas hacia arriba hasta la baldosa entera siguiente (y después hasta la caja completa siguiente).",
      "pt-BR": "Calcule a área a comprar e o número de peças necessárias a partir da área do cômodo, do tamanho de uma peça e de uma margem de perda. Um assentamento reto costuma exigir 10–15% a mais por causa dos cortes; um assentamento diagonal ou em espinha de peixe exige 20–25%. Arredonde o número de peças para cima até a peça inteira seguinte (e depois até a caixa completa seguinte).",
      de: "Berechnet aus der Raumfläche, dem Maß einer Fliese und einem Verschnittzuschlag die zu kaufende Fläche und die Anzahl der Fliesen. Eine gerade Verlegung braucht meist 10–15% mehr für den Zuschnitt, eine Diagonal- oder Fischgrätverlegung 20–25%. Runde die Fliesenanzahl auf die nächste ganze Fliese auf (und danach auf das nächste volle Paket).",
      fr: "Calculer la surface à acheter et le nombre de carreaux nécessaires à partir de la surface de la pièce, des dimensions d'un carreau et d'une marge de perte. Une pose droite demande en général 10–15% de plus pour les coupes ; une pose en diagonale ou en chevrons, 20–25%. Arrondir le nombre de carreaux au carreau entier supérieur (puis au paquet complet supérieur).",
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
      { title: { en: "Area to buy", ja: "購入する面積", es: "Superficie a comprar", "pt-BR": "Área a comprar", de: "Zu kaufende Fläche", fr: "Surface à acheter" }, expression: "A*(1+waste)", targetUnit: "m^2", formulaLatex: "A_{buy} = A\\left(1 + \\text{waste}\\right)" },
      { title: { en: "Number of tiles N", ja: "必要な枚数 N", es: "Número de baldosas N", "pt-BR": "Número de peças N", de: "Anzahl der Fliesen N", fr: "Nombre de carreaux N" }, expression: "A*(1+waste)/(lₜ*wₜ)", targetUnit: "", formulaLatex: "N = \\dfrac{A\\left(1 + \\text{waste}\\right)}{l_t w_t}" },
    ],
  },
  {
    title: { en: "Timber volume and mass", ja: "木材の材積と質量", es: "Volumen y masa de la madera", "pt-BR": "Volume e massa da madeira", de: "Holzvolumen und Holzmasse", fr: "Volume et masse du bois" },
    description: {
      en: "Compute the volume and mass of a batch of sawn timber from its cross-section, length, and piece count. Timber is traded by the cubic metre in metric markets. Air-dry softwood (pine, spruce) is roughly 400–550 kg/m³, oak around 700–770 kg/m³.",
      ja: "断面寸法・長さ・本数から、製材した木材の材積と質量を求めます。メートル法圏では木材は立方メートル（m³）で取引されます。気乾状態の針葉樹（マツ・トウヒ）はおよそ400〜550kg/m³、ナラ・オークは700〜770kg/m³です。",
      es: "Calcula el volumen y la masa de un lote de madera aserrada a partir de su sección, su longitud y el número de piezas. En los mercados métricos la madera se vende por metro cúbico. La madera de conífera seca al aire (pino, abeto) ronda los 400–550 kg/m³, y el roble, los 700–770 kg/m³.",
      "pt-BR": "Calcule o volume e a massa de um lote de madeira serrada a partir da seção, do comprimento e do número de peças. Nos mercados métricos a madeira é negociada por metro cúbico. A madeira de conífera seca ao ar (pinho, abeto) fica em torno de 400–550 kg/m³, e o carvalho, em torno de 700–770 kg/m³.",
      de: "Berechnet Volumen und Masse einer Partie Schnittholz aus Querschnitt, Länge und Stückzahl. In metrischen Märkten wird Holz nach Kubikmeter gehandelt. Lufttrockenes Nadelholz (Kiefer, Fichte) liegt bei etwa 400–550 kg/m³, Eiche bei rund 700–770 kg/m³.",
      fr: "Calculer le volume et la masse d'un lot de bois de sciage à partir de sa section, de sa longueur et du nombre de pièces. Sur les marchés métriques, le bois se vend au mètre cube. Un résineux séché à l'air (pin, épicéa) pèse environ 400–550 kg/m³, le chêne environ 700–770 kg/m³.",
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
      { title: { en: "Timber volume V", ja: "材積 V", es: "Volumen de madera V", "pt-BR": "Volume de madeira V", de: "Holzvolumen V", fr: "Volume de bois V" }, expression: "b*h*L*n", targetUnit: "m^3", formulaLatex: "V = b h L n" },
      { title: { en: "Timber mass m", ja: "質量 m", es: "Masa de la madera m", "pt-BR": "Massa da madeira m", de: "Holzmasse m", fr: "Masse du bois m" }, expression: "ρ*b*h*L*n", targetUnit: "kg", formulaLatex: "m = \\rho b h L n" },
    ],
  },
  {
    title: { en: "Wallpaper roll count", ja: "壁紙のロール数", es: "Número de rollos de papel pintado", "pt-BR": "Número de rolos de papel de parede", de: "Anzahl der Tapetenrollen", fr: "Nombre de rouleaux de papier peint" },
    description: {
      en: "Compute how many rolls of wallpaper a room needs from the wall perimeter, the wall height, the pattern repeat, and the roll size. The European standard roll is 0.53 m wide by 10.05 m long. Round the strip count up, the strips-per-roll count down, and the final roll count up — step 3 ignores that rounding, so treat it as a lower bound.",
      ja: "壁の周長・壁の高さ・柄のリピート・ロールの寸法から、必要な壁紙のロール数を求めます。ヨーロッパの標準ロールは幅0.53m×長さ10.05mです。実際は1の枚数を切り上げ、2の本数を切り捨て、その割り算をさらに切り上げます。手順3は端数を無視した連続値なので、下限の目安として読んでください。",
      es: "Calcula cuántos rollos de papel pintado necesita una habitación a partir del perímetro de las paredes, la altura de la pared, la repetición del dibujo (rapport) y el tamaño del rollo. El rollo estándar europeo mide 0,53 m de ancho por 10,05 m de largo. Redondea hacia arriba el número de tiras, hacia abajo el número de tiras por rollo y hacia arriba el número final de rollos; el paso 3 ignora ese redondeo, así que hay que leerlo como una cota inferior.",
      "pt-BR": "Calcule quantos rolos de papel de parede um cômodo exige a partir do perímetro das paredes, da altura da parede, da repetição do padrão (rapport) e do tamanho do rolo. O rolo padrão europeu tem 0,53 m de largura por 10,05 m de comprimento. Arredonde o número de tiras para cima, o número de tiras por rolo para baixo e o número final de rolos para cima; o passo 3 ignora esse arredondamento, portanto ele deve ser lido como um limite inferior.",
      de: "Berechnet aus dem Wandumfang, der Wandhöhe, dem Rapport und dem Rollenmaß, wie viele Tapetenrollen ein Raum braucht. Die europäische Standardrolle ist 0,53 m breit und 10,05 m lang. Runde die Anzahl der Bahnen auf, die Anzahl der Bahnen je Rolle ab und die endgültige Rollenzahl wieder auf – Schritt 3 lässt diese Rundung außer Acht und ist daher nur als Untergrenze zu lesen.",
      fr: "Calculer le nombre de rouleaux de papier peint nécessaires à une pièce à partir du périmètre des murs, de la hauteur du mur, du raccord (rapport) du motif et des dimensions du rouleau. Le rouleau standard européen mesure 0,53 m de large sur 10,05 m de long. Arrondir le nombre de lés à l'entier supérieur, le nombre de lés par rouleau à l'entier inférieur et le nombre final de rouleaux à l'entier supérieur ; l'étape 3 ignore cet arrondi, elle doit donc être lue comme une borne inférieure.",
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
      { title: { en: "Strips needed n (round up)", ja: "必要な枚数 n（切り上げ）", es: "Tiras necesarias n (redondear hacia arriba)", "pt-BR": "Tiras necessárias n (arredondar para cima)", de: "Benötigte Bahnen n (aufrunden)", fr: "Lés nécessaires n (arrondir au supérieur)" }, expression: "P/r", targetUnit: "", formulaLatex: "n = \\dfrac{P}{r}" },
      { title: { en: "Strips per roll k (round down)", ja: "1ロールから取れる枚数 k（切り捨て）", es: "Tiras por rollo k (redondear hacia abajo)", "pt-BR": "Tiras por rolo k (arredondar para baixo)", de: "Bahnen je Rolle k (abrunden)", fr: "Lés par rouleau k (arrondir à l'inférieur)" }, expression: "Lᵣ/(H+pᵣ)", targetUnit: "", formulaLatex: "k = \\dfrac{L_r}{H + p_r}" },
      { title: { en: "Rolls needed N", ja: "必要なロール数 N", es: "Rollos necesarios N", "pt-BR": "Rolos necessários N", de: "Benötigte Rollen N", fr: "Rouleaux nécessaires N" }, expression: "P*(H+pᵣ)/(r*Lᵣ)", targetUnit: "", formulaLatex: "N = \\dfrac{P\\left(H + p_r\\right)}{r L_r}" },
    ],
  },
  {
    title: { en: "Ceiling light output for a room (lumen method)", ja: "部屋に必要な照明の明るさ（光束法）", es: "Flujo luminoso necesario en una habitación (método del lumen)", "pt-BR": "Fluxo luminoso do teto para um cômodo (método dos lúmens)", de: "Lichtstrom der Deckenbeleuchtung für einen Raum (Wirkungsgradverfahren)", fr: "Flux lumineux du plafonnier pour une pièce (méthode du flux lumineux)" },
    description: {
      en: "Compute the total luminous flux a room's lighting must deliver, and how many luminaires that takes, from the floor area and the target illuminance. The lumen method divides by a utilisation factor (typically 0.4–0.8, how much of the lamp's light reaches the working plane) and a maintenance factor (0.6–0.8, allowing for ageing and dirt). EN 12464-1 asks for 500 lx at an office desk; 100–300 lx suits general lighting in a living room.",
      ja: "床面積と目標照度から、部屋の照明に必要な総光束と器具の台数を求めます。光束法では、器具の光のうち作業面に届く割合（照明率、通常0.4〜0.8）と、経年劣化・汚れを見込んだ保守率（0.6〜0.8）で割ります。EN 12464-1ではオフィスの机上が500lx、居室の全般照明は100〜300lxが目安です。",
      es: "Calcula el flujo luminoso total que debe aportar la iluminación de una habitación, y cuántas luminarias hacen falta, a partir de la superficie del suelo y la iluminancia objetivo. El método del lumen divide entre un factor de utilización (normalmente 0,4–0,8, la parte de la luz de la lámpara que llega al plano de trabajo) y un factor de mantenimiento (0,6–0,8, que tiene en cuenta el envejecimiento y la suciedad). La EN 12464-1 pide 500 lx sobre una mesa de oficina; para la iluminación general de un salón bastan 100–300 lx.",
      "pt-BR": "Calcule o fluxo luminoso total que a iluminação de um cômodo deve entregar, e quantas luminárias isso exige, a partir da área do piso e da iluminância desejada. O método dos lúmens divide por um fator de utilização (normalmente 0,4–0,8, a parcela da luz da lâmpada que chega ao plano de trabalho) e por um fator de manutenção (0,6–0,8, que considera o envelhecimento e a sujeira). A EN 12464-1 pede 500 lx sobre uma mesa de escritório; para a iluminação geral de uma sala bastam 100–300 lx.",
      de: "Berechnet aus der Grundfläche und der gewünschten Beleuchtungsstärke den gesamten Lichtstrom, den die Beleuchtung eines Raums liefern muss, und wie viele Leuchten dafür nötig sind. Das Wirkungsgradverfahren teilt durch den Raumwirkungsgrad (üblich 0,4–0,8, der Anteil des Lampenlichts, der die Nutzebene erreicht) und den Wartungsfaktor (0,6–0,8, für Alterung und Verschmutzung). EN 12464-1 fordert 500 lx auf dem Büroschreibtisch; für die Allgemeinbeleuchtung im Wohnzimmer genügen 100–300 lx.",
      fr: "Calculer le flux lumineux total que l'éclairage d'une pièce doit fournir, et le nombre de luminaires nécessaires, à partir de la surface au sol et de l'éclairement visé. La méthode du flux lumineux divise par un facteur d'utilance (typiquement 0,4–0,8, la part de la lumière de la lampe qui atteint le plan utile) et par un facteur de maintenance (0,6–0,8, qui tient compte du vieillissement et de l'encrassement). La norme EN 12464-1 demande 500 lx sur un bureau ; pour l'éclairage général d'un séjour, 100–300 lx suffisent.",
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
      { title: { en: "Total luminous flux needed", ja: "必要な総光束", es: "Flujo luminoso total necesario", "pt-BR": "Fluxo luminoso total necessário", de: "Benötigter Gesamtlichtstrom", fr: "Flux lumineux total nécessaire" }, expression: "E*A/(UF*MF)", targetUnit: "lm", formulaLatex: "\\Phi = \\dfrac{E A}{\\text{UF} \\cdot \\text{MF}}" },
      { title: { en: "Number of luminaires N", ja: "必要な器具の台数 N", es: "Número de luminarias N", "pt-BR": "Número de luminárias N", de: "Anzahl der Leuchten N", fr: "Nombre de luminaires N" }, expression: "E*A/(Φ₁*UF*MF)", targetUnit: "", formulaLatex: "N = \\dfrac{E A}{\\Phi_1 \\cdot \\text{UF} \\cdot \\text{MF}}" },
    ],
  },
  {
    title: { en: "Bath / tank volume and the energy to heat it", ja: "浴槽・タンクの水量と加熱に要るエネルギー", es: "Volumen de una bañera o depósito y la energía para calentarlo", "pt-BR": "Volume de banheira ou reservatório e a energia para aquecê-lo", de: "Volumen von Wanne oder Tank und die Energie zum Aufheizen", fr: "Volume d'une baignoire ou d'une cuve et l'énergie pour la chauffer" },
    description: {
      en: "Compute the water volume of a rectangular bath or tank, then the energy, the heating time and the electricity cost needed to raise it by a given temperature difference. Water's specific heat capacity is about 4186 J/(kg·K). The price per kWh is a plain editable constant that starts from your region's typical electricity tariff.",
      ja: "長方形の浴槽・タンクの水量を求め、それを指定の温度差だけ温めるのに必要な熱量・加熱時間・電気代を計算します。水の比熱は約4186J/(kg·K)です。電力量単価は編集できる定数で、初期値は端末の地域の一般的な電気料金が入ります。",
      es: "Calcula el volumen de agua de una bañera o depósito rectangular y, después, la energía, el tiempo de calentamiento y el costo de electricidad necesarios para elevar su temperatura una diferencia dada. El calor específico del agua es de unos 4186 J/(kg·K). El precio del kWh es una constante editable cuyo valor inicial es la tarifa eléctrica típica de la región del dispositivo.",
      "pt-BR": "Calcule o volume de água de uma banheira ou reservatório retangular e, em seguida, a energia, o tempo de aquecimento e o custo de eletricidade necessários para elevar sua temperatura em uma dada diferença. O calor específico da água é de cerca de 4186 J/(kg·K). O preço do kWh é uma constante editável cujo valor inicial é a tarifa de eletricidade típica da região do dispositivo.",
      de: "Berechnet das Wasservolumen einer rechteckigen Wanne oder eines Tanks und danach die Energie, die Aufheizzeit und die Stromkosten, um es um eine vorgegebene Temperaturdifferenz zu erwärmen. Die spezifische Wärmekapazität von Wasser beträgt etwa 4186 J/(kg·K). Der Arbeitspreis je kWh ist eine frei änderbare Konstante, deren Startwert der übliche Strompreis der Region des Geräts ist.",
      fr: "Calculer le volume d'eau d'une baignoire ou d'une cuve rectangulaire, puis l'énergie, la durée de chauffe et le coût de l'électricité nécessaires pour l'élever d'un écart de température donné. La capacité thermique massique de l'eau vaut environ 4186 J/(kg·K). Le prix du kWh est une constante librement modifiable, initialisée avec le tarif d'électricité habituel de la région de l'appareil.",
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
      { symbol: "rate", expression: "31", regionalDefault: "electricityPerKWh" },
    ],
    steps: [
      { title: { en: "Water volume V", ja: "水の体積 V", es: "Volumen de agua V", "pt-BR": "Volume de água V", de: "Wasservolumen V", fr: "Volume d'eau V" }, expression: "l*w*h", targetUnit: "L", formulaLatex: "V = l w h" },
      { title: { en: "Heat needed Q", ja: "必要な熱量 Q", es: "Calor necesario Q", "pt-BR": "Calor necessário Q", de: "Benötigte Wärme Q", fr: "Chaleur nécessaire Q" }, expression: "ρ*l*w*h*c*ΔT", targetUnit: "kWh", formulaLatex: "Q = \\rho l w h \\, c \\, \\Delta T" },
      { title: { en: "Heating time t", ja: "加熱時間 t", es: "Tiempo de calentamiento t", "pt-BR": "Tempo de aquecimento t", de: "Aufheizzeit t", fr: "Durée de chauffe t" }, expression: "ρ*l*w*h*c*ΔT/P", targetUnit: "h", formulaLatex: "t = \\dfrac{\\rho l w h \\, c \\, \\Delta T}{P}" },
      { title: { en: "Electricity cost", ja: "電気代", es: "Costo de electricidad", "pt-BR": "Custo de eletricidade", de: "Stromkosten", fr: "Coût de l'électricité" }, expression: "(ρ*l*w*h*c*ΔT/1kWh)*rate", targetUnit: "", formulaLatex: "\\text{cost} = \\dfrac{Q}{1\\text{kWh}} \\times \\text{rate}" },
    ],
  },
];

/**
 * 「3Dプリンタ」。フィラメントの長さ・質量・単価と、吐出量・造形時間・押出量の校正をまとめている。
 * 既定値はFDM機で最も一般的な構成（ノズル0.4mm・フィラメント1.75mm・PLA）に合わせてある。
 */
export const PRINTING_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Filament length from model volume", ja: "造形物の体積から必要なフィラメント長", es: "Longitud de filamento a partir del volumen de la pieza", "pt-BR": "Comprimento de filamento a partir do volume da peça", de: "Filamentlänge aus dem Modellvolumen", fr: "Longueur de filament d'après le volume du modèle" },
    description: {
      en: "Compute how much filament a model consumes from the model's solid volume and the filament diameter. Slicers report the volume directly; the filament is just that volume drawn out into a round strand, so the length is the volume divided by the strand's cross-section.",
      ja: "造形物の体積とフィラメントの直径から、必要なフィラメントの長さを求めます。体積はスライサが表示します。フィラメントは同じ体積を細い丸棒に引き延ばしたものなので、長さは体積を断面積で割るだけで求まります。",
      es: "Calcula cuánto filamento consume una pieza a partir de su volumen macizo y del diámetro del filamento. El laminador (slicer) muestra el volumen directamente; el filamento no es más que ese mismo volumen estirado en un hilo redondo, así que la longitud es el volumen dividido entre la sección del hilo.",
      "pt-BR": "Calcule quanto filamento uma peça consome a partir do volume maciço da peça e do diâmetro do filamento. O fatiador (slicer) informa o volume diretamente; o filamento é apenas esse volume esticado em um fio redondo, então o comprimento é o volume dividido pela seção do fio.",
      de: "Berechnet aus dem Volumen des Modells und dem Filamentdurchmesser, wie viel Filament ein Druck verbraucht. Der Slicer zeigt das Volumen direkt an; das Filament ist nur dasselbe Volumen zu einem runden Strang ausgezogen, die Länge ist also das Volumen geteilt durch den Querschnitt des Strangs.",
      fr: "Calculer la quantité de filament que consomme une pièce à partir de son volume plein et du diamètre du filament. Le trancheur (slicer) affiche directement le volume ; le filament n'est que ce même volume étiré en un brin rond, la longueur est donc le volume divisé par la section du brin.",
    },
    localConstants: [
      { symbol: "V", expression: "20cm^3" },
      { symbol: "d", expression: "1.75mm" },
    ],
    steps: [
      { title: { en: "Filament cross-section A", ja: "フィラメントの断面積 A", es: "Sección del filamento A", "pt-BR": "Seção do filamento A", de: "Filamentquerschnitt A", fr: "Section du filament A" }, expression: "pi*d^2/4", targetUnit: "mm^2", formulaLatex: "A = \\dfrac{\\pi d^2}{4}" },
      { title: { en: "Filament length L", ja: "必要なフィラメント長 L", es: "Longitud de filamento L", "pt-BR": "Comprimento de filamento L", de: "Filamentlänge L", fr: "Longueur de filament L" }, expression: "4*V/(pi*d^2)", targetUnit: "m", formulaLatex: "L = \\dfrac{4V}{\\pi d^2}" },
    ],
  },
  {
    title: { en: "Filament mass, spool length and cost", ja: "フィラメントの質量・スプール長・材料費", es: "Masa del filamento, longitud de la bobina y costo", "pt-BR": "Massa do filamento, comprimento da bobina e custo", de: "Filamentmasse, Rollenlänge und Materialkosten", fr: "Masse du filament, longueur de la bobine et coût" },
    description: {
      en: "Compute the mass of a given length of filament, how many metres a spool holds, and what the print costs in material, from the filament diameter and the material's density. PLA is about 1.24 g/cm³, PETG 1.27 g/cm³ and ABS 1.04 g/cm³. The price per kilogram is a plain editable constant — enter the price of your own spool.",
      ja: "フィラメントの直径と材料の密度から、ある長さの質量・1スプールに巻かれている長さ・その造形にかかる材料費を求めます。密度はPLAが約1.24g/cm³、PETGが1.27g/cm³、ABSが1.04g/cm³です。1kgあたりの単価は編集できる定数なので、手持ちのスプールの価格を入れてください。",
      es: "Calcula, a partir del diámetro del filamento y la densidad del material, la masa de una longitud dada de filamento, cuántos metros lleva una bobina y cuánto cuesta el material de la pieza. El PLA tiene unos 1,24 g/cm³, el PETG 1,27 g/cm³ y el ABS 1,04 g/cm³. El precio por kilogramo es una constante editable: introduce el precio de la bobina que vayas a usar.",
      "pt-BR": "Calcule, a partir do diâmetro do filamento e da densidade do material, a massa de um dado comprimento de filamento, quantos metros cabem em uma bobina e quanto custa o material da peça. O PLA tem cerca de 1,24 g/cm³, o PETG 1,27 g/cm³ e o ABS 1,04 g/cm³. O preço por quilograma é uma constante editável: informe o preço da bobina que for usar.",
      de: "Berechnet aus dem Filamentdurchmesser und der Dichte des Materials die Masse einer bestimmten Filamentlänge, wie viele Meter auf eine Rolle passen und was der Druck an Material kostet. PLA hat etwa 1,24 g/cm³, PETG 1,27 g/cm³ und ABS 1,04 g/cm³. Der Preis je Kilogramm ist eine frei änderbare Konstante – trage den Preis der tatsächlich verwendeten Rolle ein.",
      fr: "Calculer, à partir du diamètre du filament et de la masse volumique du matériau, la masse d'une longueur donnée de filament, le nombre de mètres que contient une bobine et le coût matière de l'impression. Le PLA fait environ 1,24 g/cm³, le PETG 1,27 g/cm³ et l'ABS 1,04 g/cm³. Le prix au kilogramme est une constante librement modifiable : saisir le prix de la bobine réellement utilisée.",
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
      { symbol: "price", expression: "3000", regionalDefault: "filamentPerKg" },
    ],
    steps: [
      { title: { en: "Mass of that length m", ja: "その長さの質量 m", es: "Masa de esa longitud m", "pt-BR": "Massa desse comprimento m", de: "Masse dieser Länge m", fr: "Masse de cette longueur m" }, expression: "ρ*pi*d^2/4*L", targetUnit: "g", formulaLatex: "m = \\rho \\dfrac{\\pi d^2}{4} L" },
      { title: { en: "Length on a spool", ja: "スプールに巻かれている長さ", es: "Longitud que lleva una bobina", "pt-BR": "Comprimento em uma bobina", de: "Länge auf einer Rolle", fr: "Longueur sur une bobine" }, expression: "4*mₛ/(ρ*pi*d^2)", targetUnit: "m", formulaLatex: "L_{spool} = \\dfrac{4 m_s}{\\rho \\pi d^2}" },
      { title: { en: "Material cost", ja: "材料費", es: "Costo del material", "pt-BR": "Custo do material", de: "Materialkosten", fr: "Coût matière" }, expression: "(ρ*pi*d^2/4*L/1kg)*price", targetUnit: "", formulaLatex: "\\text{cost} = \\dfrac{m}{1\\text{kg}} \\times \\text{price}" },
    ],
  },
  {
    title: { en: "Volumetric flow rate and the hotend limit", ja: "吐出量（体積流量）とホットエンドの上限", es: "Caudal volumétrico y el límite del hotend", "pt-BR": "Vazão volumétrica e o limite do hotend", de: "Volumenstrom und die Grenze des Hotends", fr: "Débit volumique et la limite du hotend" },
    description: {
      en: "Compute the volumetric flow rate the extruder has to deliver from the layer height, the extrusion width and the print speed, and compare it with the hotend's limit. A plain E3D V6-class hotend melts roughly 11 mm³/s of PLA through a 0.4 mm nozzle (advertised as 15 mm³/s under ideal conditions); high-flow hotends go well beyond that. Exceeding the limit shows up as under-extrusion, not as an error.",
      ja: "積層ピッチ・線幅・造形速度から、押出機が送り出す体積流量を求め、ホットエンドの上限と比べます。E3D V6 相当の一般的なホットエンドは0.4mmノズルでPLAをおよそ11mm³/s溶かせます（理想条件での公称値は15mm³/s）。ハイフロー型はこれを大きく上回ります。上限を超えるとエラーにはならず、吐出不足として現れます。",
      es: "Calcula el caudal volumétrico que debe entregar el extrusor a partir de la altura de capa, el ancho de extrusión y la velocidad de impresión, y compáralo con el límite del hotend. Un hotend corriente de clase E3D V6 funde aproximadamente 11 mm³/s de PLA por una boquilla de 0,4 mm (15 mm³/s según el fabricante, en condiciones ideales); los hotends de alto caudal superan con creces esa cifra. Superar el límite no da un error: se manifiesta como subextrusión.",
      "pt-BR": "Calcule a vazão volumétrica que o extrusor precisa entregar a partir da altura de camada, da largura de extrusão e da velocidade de impressão, e compare-a com o limite do hotend. Um hotend comum da classe E3D V6 funde cerca de 11 mm³/s de PLA por um bico de 0,4 mm (15 mm³/s segundo o fabricante, em condições ideais); hotends de alta vazão vão bem além disso. Ultrapassar o limite não gera erro: aparece como subextrusão.",
      de: "Berechnet aus Schichthöhe, Extrusionsbreite und Druckgeschwindigkeit den Volumenstrom, den der Extruder liefern muss, und vergleicht ihn mit der Grenze des Hotends. Ein gewöhnliches Hotend der Klasse E3D V6 schmilzt durch eine 0,4-mm-Düse rund 11 mm³/s PLA (angegeben sind 15 mm³/s unter idealen Bedingungen); High-Flow-Hotends liegen deutlich darüber. Ein Überschreiten der Grenze führt nicht zu einer Fehlermeldung, sondern zeigt sich als Unterextrusion.",
      fr: "Calculer le débit volumique que l'extrudeur doit fournir à partir de la hauteur de couche, de la largeur d'extrusion et de la vitesse d'impression, puis le comparer à la limite du hotend. Un hotend courant de classe E3D V6 fond environ 11 mm³/s de PLA à travers une buse de 0,4 mm (15 mm³/s annoncés dans des conditions idéales) ; les hotends à haut débit vont bien au-delà. Dépasser la limite ne provoque pas d'erreur : cela se traduit par de la sous-extrusion.",
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
      { title: { en: "Volumetric flow rate Q", ja: "体積流量 Q", es: "Caudal volumétrico Q", "pt-BR": "Vazão volumétrica Q", de: "Volumenstrom Q", fr: "Débit volumique Q" }, expression: "h*w*v", targetUnit: "mm^3/s", formulaLatex: "Q = h w v" },
      { title: { en: "Fastest speed this hotend allows", ja: "このホットエンドで出せる最高速度", es: "Velocidad máxima que permite este hotend", "pt-BR": "Velocidade máxima que este hotend permite", de: "Höchste Geschwindigkeit, die dieses Hotend zulässt", fr: "Vitesse maximale que permet ce hotend" }, expression: "Qₘₐₓ/(h*w)", targetUnit: "mm/s", formulaLatex: "v_{max} = \\dfrac{Q_{max}}{h w}" },
      { title: { en: "Share of the hotend limit used", ja: "上限に対する使用率", es: "Grado de aprovechamiento del límite del hotend", "pt-BR": "Grau de aproveitamento do limite do hotend", de: "Ausnutzungsgrad der Hotend-Grenze", fr: "Taux d'utilisation de la limite du hotend" }, expression: "h*w*v/Qₘₐₓ", targetUnit: "%", formulaLatex: "u = \\dfrac{h w v}{Q_{max}}" },
    ],
  },
  {
    title: { en: "Estimated print time from the layer count", ja: "積層数から見積もる造形時間", es: "Tiempo de impresión estimado a partir del número de capas", "pt-BR": "Tempo de impressão estimado a partir do número de camadas", de: "Geschätzte Druckzeit aus der Schichtanzahl", fr: "Temps d'impression estimé d'après le nombre de couches" },
    description: {
      en: "Estimate how long a print takes from the model height, the layer height, and the average time one layer takes. Add the machine's fixed overhead — heating the bed and nozzle, homing, the purge line — to get the wall-clock time. The per-layer time varies with the cross-section, so use the average a slicer preview or a previous print gives you.",
      ja: "造形物の高さ・積層ピッチ・1層あたりの平均所要時間から、造形にかかる時間を見積もります。ベッドとノズルの加熱・原点復帰・捨て線といった固定の準備時間を足すと実際の所要時間になります。1層の時間は断面積によって変わるので、スライサのプレビューや前回の造形から平均値を取ってください。",
      es: "Estima cuánto dura una impresión a partir de la altura de la pieza, la altura de capa y el tiempo medio de una capa. Suma el tiempo fijo de la máquina —calentar la cama y la boquilla, el referenciado, la línea de purga— para obtener el tiempo real transcurrido. El tiempo por capa varía con la sección, así que conviene usar el promedio que dé la vista previa del laminador o una impresión anterior.",
      "pt-BR": "Estime quanto tempo dura uma impressão a partir da altura da peça, da altura de camada e do tempo médio de uma camada. Some o tempo fixo da máquina — aquecer a mesa e o bico, o referenciamento, a linha de purga — para obter o tempo real decorrido. O tempo por camada varia com a seção, então use a média fornecida pela pré-visualização do fatiador ou por uma impressão anterior.",
      de: "Schätzt aus der Modellhöhe, der Schichthöhe und der mittleren Zeit je Schicht, wie lange ein Druck dauert. Rechne die feste Rüstzeit der Maschine hinzu – Aufheizen von Druckbett und Düse, Referenzfahrt, Reinigungslinie –, um die tatsächlich vergehende Zeit zu erhalten. Die Zeit je Schicht hängt vom Querschnitt ab, nimm daher den Mittelwert aus der Slicer-Vorschau oder aus einem früheren Druck.",
      fr: "Estimer la durée d'une impression à partir de la hauteur du modèle, de la hauteur de couche et du temps moyen d'une couche. Ajouter le temps fixe de la machine — chauffage du plateau et de la buse, prise d'origine, ligne de purge — pour obtenir le temps réellement écoulé. Le temps par couche varie avec la section, il faut donc utiliser la moyenne donnée par l'aperçu du trancheur ou par une impression précédente.",
    },
    localConstants: [
      { symbol: "H", expression: "60mm" },
      { symbol: "h", expression: "0.2mm" },
      { symbol: "tₗ", expression: "25s" },
      { symbol: "t₀", expression: "5min" },
    ],
    steps: [
      { title: { en: "Layer count n", ja: "積層数 n", es: "Número de capas n", "pt-BR": "Número de camadas n", de: "Schichtanzahl n", fr: "Nombre de couches n" }, expression: "H/h", targetUnit: "", formulaLatex: "n = \\dfrac{H}{h}" },
      { title: { en: "Printing time t", ja: "造形時間 t", es: "Tiempo de impresión t", "pt-BR": "Tempo de impressão t", de: "Druckzeit t", fr: "Temps d'impression t" }, expression: "H/h*tₗ", targetUnit: "h", formulaLatex: "t = \\dfrac{H}{h} t_l" },
      { title: { en: "Total time including warm-up", ja: "準備時間を含む所要時間", es: "Tiempo total, calentamiento incluido", "pt-BR": "Tempo total, incluindo o aquecimento", de: "Gesamtzeit einschließlich Aufheizen", fr: "Temps total, chauffage compris" }, expression: "t₀+H/h*tₗ", targetUnit: "h", formulaLatex: "t_{total} = t_0 + \\dfrac{H}{h} t_l" },
    ],
  },
  {
    title: { en: "Extrusion multiplier from a measured wall", ja: "壁の実測値から求める押出量（フロー）", es: "Multiplicador de extrusión a partir de una pared medida", "pt-BR": "Multiplicador de extrusão a partir de uma parede medida", de: "Extrusionsmultiplikator aus einer gemessenen Wand", fr: "Multiplicateur d'extrusion d'après une paroi mesurée" },
    description: {
      en: "Correct the extrusion multiplier (flow) from a single-wall test cube: print a wall one extrusion wide, measure it with calipers at several points, and scale the current multiplier by the ratio of the nominal width to the measured width. Measuring thicker than nominal means the printer is over-extruding, so the multiplier goes down.",
      ja: "1周1本だけで壁を作ったテストキューブから、押出量（フロー）を補正します。壁をノギスで数か所測り、現在の押出係数に「設定した線幅 ÷ 実測の壁厚」を掛けます。実測が設定より厚ければ出しすぎなので、係数は下がります。",
      es: "Corrige el multiplicador de extrusión (flow) con un cubo de prueba de pared simple: imprime una pared de un solo cordón de ancho, mídela con un calibre en varios puntos y multiplica el multiplicador actual por la razón entre el ancho nominal y el ancho medido. Si la medida sale más gruesa que la nominal, la impresora está extruyendo de más, así que el multiplicador baja.",
      "pt-BR": "Corrija o multiplicador de extrusão (flow) com um cubo de teste de parede simples: imprima uma parede com a largura de um único filete, meça-a com um paquímetro em vários pontos e multiplique o multiplicador atual pela razão entre a largura nominal e a largura medida. Se a medida sair mais grossa que a nominal, a impressora está extrudando demais, então o multiplicador diminui.",
      de: "Korrigiert den Extrusionsmultiplikator (Flow) mit einem Testwürfel aus einer einzigen Wand: Drucke eine Wand mit der Breite genau einer Extrusion, miss sie an mehreren Stellen mit dem Messschieber und multipliziere den aktuellen Multiplikator mit dem Verhältnis von Sollbreite zu gemessener Breite. Fällt die Messung dicker aus als die Sollbreite, extrudiert der Drucker zu viel, der Multiplikator sinkt also.",
      fr: "Corriger le multiplicateur d'extrusion (flow) à l'aide d'un cube de test à paroi simple : imprimer une paroi de la largeur d'un seul cordon, la mesurer au pied à coulisse en plusieurs points, puis multiplier le multiplicateur actuel par le rapport entre la largeur nominale et la largeur mesurée. Si la mesure est plus épaisse que la valeur nominale, l'imprimante extrude trop et le multiplicateur diminue.",
    },
    localConstants: [
      { symbol: "EM₀", expression: "0.98" },
      { symbol: "wₑ", expression: "0.45mm" },
      { symbol: "wₘ", expression: "0.47mm" },
    ],
    steps: [
      // 新しい押出係数 = 現在の係数 × 設定線幅 ÷ 実測壁厚。
      // 出典: https://help.prusa3d.com/article/extrusion-multiplier-calibration_2257
      { title: { en: "Corrected extrusion multiplier", ja: "補正後の押出係数", es: "Multiplicador de extrusión corregido", "pt-BR": "Multiplicador de extrusão corrigido", de: "Korrigierter Extrusionsmultiplikator", fr: "Multiplicateur d'extrusion corrigé" }, expression: "EM₀*wₑ/wₘ", targetUnit: "", formulaLatex: "\\text{EM} = \\text{EM}_0 \\dfrac{w_e}{w_m}" },
      { title: { en: "Wall thickness error", ja: "壁厚の誤差", es: "Error del espesor de la pared", "pt-BR": "Erro da espessura da parede", de: "Abweichung der Wanddicke", fr: "Écart d'épaisseur de la paroi" }, expression: "(wₘ-wₑ)/wₑ", targetUnit: "%", formulaLatex: "\\delta = \\dfrac{w_m - w_e}{w_e}" },
    ],
  },
];
