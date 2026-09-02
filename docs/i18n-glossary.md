# si-unit-calculator 多言語用語集（es / pt-BR / de / fr）

対象: `lib/notebook-formulas/source/{materials,physics,practical,science,categories}.ts`、
`lib/units.ts`（`UNIT_META` 97件・`BASE_UNIT_GROUPS` 18件）、`lib/unit-explanations.ts`、`lib/sample-calculations.ts`
から実際に使われている `{ en, ja }` 文字列を抽出し、そこから訳がブレやすい専門用語を選定した。

**凡例**: `※要確認` = 確信度が低い・地域差/レジスター差がある・複数の定訳が競合している語。後続の翻訳エージェントと人間レビュアーは重点的に確認すること。

---

## A. 言語ごとの表記ルール

### 共通
- **単位記号は翻訳しない**（`m`, `kg`, `N·m`, `Pa`, `Ω` など）。ローカライズするのは単位の**名称**のみ（例: "meter" → "metro" / "Meter" / "mètre"）。`lib/units.ts` の `UNIT_GROUPS[].units[].label` は記号のまま画面に出る設計（CLAUDE.mdに明記）なので、`label` フィールド自体は変更しない。`UNIT_META[].name`（正式名称）と `unit-explanations.ts` の `name`/`summary`/`usage` が翻訳対象。
- **数式表示（LaTeX, `formulaLatex`）は変更しない**。変数記号（下付き文字・ギリシャ文字含む）はそのまま維持し、`title`/`description`/`explanation` の自然文だけを翻訳する。
- **小数点表記**: アプリの入力欄（`expression`, `localConstants[].expression` など）は engine 仕様上 ASCII ドット固定なので**絶対に変更しない**（`5kN*m` のような値をコンマにしない）。一方、`title`/`description`/`explanation` などの**地の文（散文）中に出てくる数値**（例: "The result should be about 7.9 km/s."）は、es/pt-BR/de/fr いずれも慣習的に**コンマを小数点として使う**言語なので、地の文では各言語の慣習（`7,9 km/s`）に従うことを推奨する。ただし迷った場合は既存の en 版と同じくASCIIドットのままでも実害はない（読み手が誤解しない範囲で統一されていればよい）ため、**同一PR内で表記を統一する**ことを優先する。
- **大文字化の慣習**: 英語のタイトルケース（Second Moment Of Area のように主要語を大文字化する書き方）を es/pt-BR/fr にそのまま持ち込まない。この3言語は**文頭と固有名詞のみ大文字**（例: "Segundo momento de área", "Loi de Coulomb"）。**ドイツ語だけは名詞を常に大文字化する**（"Flächenträgheitsmoment", "Elastizitätsmodul" など、文中でも）。

### スペイン語 (es)
- 疑問符・感嘆符の前に開き記号（¿ ¡）を使うのは口語的な完全文のみ。ノートのタイトルのような名詞句には不要。
- 地域差に注意（本用語集では中南米・スペイン中立表現を優先し、地域固有の訳語には`※要確認`を付けた。例: 「応力」= esfuerzo（中南米で広く使用）/ tensión（スペインの一部教科書で併用）。

### ポルトガル語 (pt-BR)
- ブラジル・ポルトガル語（pt-PT ではない）を対象とする。「モル濃度」= concentração molar/molaridade、「たわみ」= flecha のように pt-PT と語彙が近い場合が多いが、正書法（アクセント記号など）はブラジル式の現行正書法（Acordo Ortográfico）に従う。

### ドイツ語 (de)
- **名詞は常に大文字**（見出し・本文どちらでも）。合成語（Flächenträgheitsmoment, Widerstandsmoment, Elastizitätsmomentなど）はハイフンなしで1語に連結するのがドイツ語の標準。
- 単位記号の直後に名詞が続く場合のスペースの入れ方に注意（"5 kN·m" のように単位と数値の間に半角スペースを入れるのがドイツの慣習だが、本アプリの `expression` フィールドは変更しないので、これは地の文にのみ適用）。

### フランス語 (fr)
- **コロン・疑問符・感嘆符・セミコロンの前にノーブレークスペース**を入れるのが正式なフランス語タイポグラフィ（例: "Vitesse : 5 m/s"）。本アプリのようなモバイルUIでは半角スペースまたは省略でも実用上問題ない、というのがこのセッションでの判断。**ただし同一PR内・同一アプリ内で統一すること**（一部だけノーブレークスペース、一部だけ通常スペースは避ける）。
- **「密度」の訳語に注意**: フランス語では **masse volumique**（質量÷体積、単位あり、例: kg/m³）と **densité**（水との比、無次元）が明確に区別される。本アプリの「密度」ノート（`science-density`, `science-pressure` の水圧など）は単位付きの物理量なので、**必ず `masse volumique` を使う**。`densité` を使うと無次元の相対密度という別概念になり誤訳になる（[出典](https://fr.wikipedia.org/wiki/Masse_volumique)）。es/pt-BR/de にはこの区別はなく、"densidad"/"densidade"/"Dichte" がそのまま単位付きの密度を指すので影響なし。

---

## B. 用語対訳表

### 力学 (Mechanics)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 速さ・速度 | speed / velocity | velocidad | velocidade | Geschwindigkeit | vitesse |
| 加速度 | acceleration | aceleración | aceleração | Beschleunigung | accélération |
| 変位 | displacement | desplazamiento | deslocamento | Verschiebung / Weg | déplacement |
| 質量 | mass | masa | massa | Masse | masse |
| 力 | force | fuerza | força | Kraft | force |
| 運動方程式 | equation of motion | ecuación de movimiento | equação de movimento | Bewegungsgleichung | équation du mouvement |
| 運動エネルギー | kinetic energy | energía cinética | energia cinética | kinetische Energie | énergie cinétique |
| 位置エネルギー | potential energy | energía potencial | energia potencial | potenzielle Energie | énergie potentielle |
| 運動量 | momentum | cantidad de movimiento / momento lineal | momento linear / quantidade de movimento | Impuls | quantité de mouvement |
| 角速度 | angular velocity | velocidad angular | velocidade angular | Winkelgeschwindigkeit | vitesse angulaire |
| 周期（振動・回転） | period | periodo | período | Periode / Schwingungsdauer | période |
| 単振動 | simple harmonic motion | movimiento armónico simple (MAS) | movimento harmônico simples (MHS) | harmonische Schwingung | mouvement harmonique simple |
| ばね定数 | spring constant | constante elástica / constante del resorte | constante elástica da mola | Federkonstante | constante de raideur |
| 摩擦力 | friction force | fuerza de fricción / rozamiento | força de atrito | Reibungskraft | force de frottement |
| 摩擦係数 | coefficient of friction | coeficiente de fricción / rozamiento | coeficiente de atrito | Reibungskoeffizient | coefficient de frottement |
| 垂直抗力 | normal force | fuerza normal | força normal | Normalkraft | réaction normale / force normale |
| 仕事 | work | trabajo | trabalho | Arbeit | travail |
| 仕事率 | power | potencia | potência | Leistung | puissance |
| てこのつり合い | lever equilibrium | equilibrio de la palanca | equilíbrio da alavanca | Hebelgesetz | équilibre du levier |
| 動滑車 | movable pulley | polea móvil | polia móvel | lose Rolle | poulie mobile |
| 仕事の原理 ※要確認 | principle of work | principio del trabajo | princípio dos trabalhos (conservação do trabalho) | Prinzip der Arbeit(sersparnis) | principe des travaux (conservation du travail) |
| 斜面 | inclined plane | plano inclinado | plano inclinado | schiefe Ebene | plan incliné |
| 万有引力 | universal gravitation | gravitación universal | gravitação universal | Gravitationsgesetz | gravitation universelle |
| 第一宇宙速度 | first cosmic velocity | primera velocidad cósmica | primeira velocidade cósmica | erste kosmische Geschwindigkeit | première vitesse cosmique |
| 第二宇宙速度（脱出速度） | second cosmic velocity (escape velocity) | segunda velocidad cósmica (velocidad de escape) | segunda velocidade cósmica (velocidade de escape) | zweite kosmische Geschwindigkeit (Fluchtgeschwindigkeit) | deuxième vitesse cosmique (vitesse de libération) |
| 制動距離 | braking distance | distancia de frenado | distância de frenagem | Bremsweg | distance de freinage |
| 空走距離 ※要確認 | reaction distance | distancia de reacción | distância percorrida durante o tempo de reação | Reaktionsweg | distance parcourue pendant le temps de réaction |
| 停止距離 | total stopping distance | distancia total de detención | distância total de parada | Anhalteweg | distance d'arrêt |
| ギア比 | gear ratio | relación de transmisión / relación de marchas | relação de transmissão / marchas | Übersetzungsverhältnis | rapport de démultiplication |
| 重さ（重力）と質量 | weight vs. mass | peso vs. masa | peso vs. massa | Gewicht(skraft) vs. Masse | poids vs. masse |

### 熱 (Thermodynamics)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 熱量 | heat (quantity of heat) | calor / cantidad de calor | quantidade de calor | Wärmemenge | quantité de chaleur |
| 比熱 | specific heat | calor específico | calor específico | spezifische Wärmekapazität | chaleur massique |
| 熱効率 | thermal efficiency | eficiencia térmica / rendimiento térmico | eficiência térmica / rendimento térmico | thermischer Wirkungsgrad | rendement thermique |
| 熱膨張 | thermal expansion | dilatación térmica | dilatação térmica | Wärmeausdehnung | dilatation thermique |
| 線膨張率 | coefficient of linear expansion | coeficiente de dilatación lineal | coeficiente de dilatação linear | linearer Ausdehnungskoeffizient | coefficient de dilatation linéaire |
| 理想気体の状態方程式 | ideal gas law | ecuación de estado del gas ideal | equação de estado dos gases ideais | ideale Gasgleichung | loi des gaz parfaits |
| 絶対温度 | absolute temperature | temperatura absoluta | temperatura absoluta | absolute Temperatur | température absolue |
| 熱量保存（混合後の温度） | conservation of heat | conservación del calor / equilibrio térmico | conservação do calor / equilíbrio térmico | Wärmeausgleich (Kalorimetrie) | conservation de la chaleur (équilibre thermique) |

### 波動・光・音 (Waves, Light, Sound)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 波長 | wavelength | longitud de onda | comprimento de onda | Wellenlänge | longueur d'onde |
| 振動数 | frequency | frecuencia | frequência | Frequenz | fréquence |
| 基本振動数 | fundamental frequency | frecuencia fundamental | frequência fundamental | Grundfrequenz | fréquence fondamentale |
| ドップラー効果 | Doppler effect | efecto Doppler | efeito Doppler | Dopplereffekt | effet Doppler |
| 屈折率 ※要確認 | refractive index | índice de refracción | índice de refração | Brechzahl (Brechungsindex) | indice de réfraction |
| 屈折の法則（スネルの法則） ※要確認 | law of refraction (Snell's law) | ley de Snell(-Descartes) | lei de Snell | Snelliussches Brechungsgesetz | loi de Snell-Descartes |
| 入射角 | angle of incidence | ángulo de incidencia | ângulo de incidência | Einfallswinkel | angle d'incidence |
| 反射角 | angle of reflection | ángulo de reflexión | ângulo de reflexão | Reflexionswinkel | angle de réflexion |
| 凸レンズ | convex lens | lente convexa / convergente | lente convexa / convergente | Sammellinse (konvexe Linse) | lentille convergente |
| 焦点距離 | focal length | distancia focal | distância focal | Brennweite | distance focale |
| 倍率 | magnification | aumento | ampliação / aumento | Vergrößerung | grandissement |

### 電気 (Electricity)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 電圧 ※要確認 | voltage | voltaje / tensión (eléctrica) | tensão (elétrica) / voltagem | (elektrische) Spannung | tension (électrique) |
| 電流 | electric current | corriente (eléctrica) | corrente (elétrica) | Stromstärke | courant (électrique) |
| 抵抗 | (electrical) resistance | resistencia (eléctrica) | resistência (elétrica) | (elektrischer) Widerstand | résistance (électrique) |
| 合成抵抗（直列・並列） | combined / equivalent resistance | resistencia equivalente | resistência equivalente | Ersatzwiderstand / Gesamtwiderstand | résistance équivalente |
| 電力 | electric power | potencia eléctrica | potência elétrica | elektrische Leistung | puissance électrique |
| 電力量 | energy consumption (electric energy) | energía eléctrica consumida | energia elétrica consumida | elektrische Arbeit / Energieverbrauch | énergie électrique consommée |
| クーロンの法則 | Coulomb's law | ley de Coulomb | lei de Coulomb | coulombsches Gesetz | loi de Coulomb |
| 静電容量 | capacitance | capacitancia / capacidad (eléctrica) | capacitância | Kapazität | capacité (électrique) |
| 誘導起電力 ※要確認 | induced electromotive force (EMF) | fem inducida | fem induzida | induzierte Spannung | f.é.m. induite |
| 力率 | power factor | factor de potencia | fator de potência | Leistungsfaktor | facteur de puissance |
| ブレーカー容量 ※要確認 | breaker capacity (rated current) | capacidad del interruptor / disyuntor | capacidade do disjuntor | Nennstrom des Leitungsschutzschalters | calibre du disjoncteur |

### 化学 (Chemistry)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 物質量 | amount of substance | cantidad de sustancia | quantidade de matéria | Stoffmenge | quantité de matière |
| モル濃度 | molar concentration | concentración molar / molaridad | concentração molar / molaridade | Stoffmengenkonzentration (Molarität) | concentration molaire |
| モル質量 | molar mass | masa molar | massa molar | molare Masse | masse molaire |
| 質量パーセント濃度 | mass percent concentration | porcentaje en masa | concentração em porcentagem de massa (título em massa) | Massenanteil (Massenprozent) | pourcentage massique |
| 溶質 | solute | soluto | soluto | gelöster Stoff | soluté |
| 溶媒 | solvent | disolvente / solvente | solvente | Lösungsmittel | solvant |
| 溶液 | solution | disolución / solución | solução | Lösung | solution |
| 溶解度 | solubility | solubilidad | solubilidade | Löslichkeit | solubilité |
| 反応熱 | heat of reaction | calor de reacción | calor de reação | Reaktionswärme | chaleur de réaction |
| 質量保存の法則 | law of conservation of mass | ley de conservación de la masa | lei de conservação da massa | Gesetz von der Erhaltung der Masse | loi de conservation de la masse |
| 仕事関数 | work function | función de trabajo / trabajo de extracción | função trabalho / trabalho de extração | Austrittsarbeit | travail d'extraction |
| 半減期 | half-life | vida media / periodo de semidesintegración | meia-vida | Halbwertszeit | demi-vie |
| 光電効果 | photoelectric effect | efecto fotoeléctrico | efeito fotoelétrico | photoelektrischer Effekt | effet photoélectrique |

### 地学 (Earth Science)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 湿度 | (relative) humidity | humedad (relativa) | umidade (relativa) | (relative) Luftfeuchtigkeit | humidité (relative) |
| 露点 | dew point | punto de rocío | ponto de orvalho | Taupunkt | point de rosée |
| 飽和水蒸気量 ※要確認 | saturation vapor density | densidad de vapor de agua saturado | quantidade de vapor de água saturado | Sättigungsdampfdichte | quantité de vapeur d'eau saturante |
| 震源 ※要確認 | epicenter / hypocenter | hipocentro (foco) | hipocentro | Hypozentrum (Erdbebenherd) | hypocentre |
| 初期微動継続時間（大森公式） ※要確認 | P–S time (Omori's formula) | tiempo S-P (fórmula de Omori) | intervalo P-S (fórmula de Omori) | S-P-Zeit (Omori-Formel) | durée S-P (formule d'Omori) |
| P波 | P-wave (primary wave) | onda P (onda primaria) | onda P (onda primária) | P-Welle (Primärwelle) | onde P (onde primaire) |
| S波 | S-wave (secondary wave) | onda S (onda secundaria) | onda S (onda secundária) | S-Welle (Sekundärwelle) | onde S (onde secondaire) |
| 堆積速度 | sedimentation rate | tasa de sedimentación | taxa de sedimentação | Sedimentationsrate | taux de sédimentation |
| 気圧 | atmospheric pressure | presión atmosférica | pressão atmosférica | Luftdruck | pression atmosphérique |
| 台風 | typhoon | tifón | tufão | Taifun | typhon |

### 材料力学 (Mechanics of Materials)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 断面二次モーメント | second moment of area | segundo momento de área (momento de inercia de área) | momento de inércia de área | Flächenträgheitsmoment | moment quadratique |
| 断面係数 | section modulus | módulo de sección (módulo resistente) | módulo de resistência | Widerstandsmoment | module de flexion (module de section) |
| 応力 ※要確認 | stress | esfuerzo (tensión, según región) | tensão | Spannung | contrainte |
| ひずみ | strain | deformación (unitaria) | deformação | Dehnung | déformation |
| ヤング率（縦弾性係数） | Young's modulus | módulo de Young / módulo de elasticidad | módulo de elasticidade / módulo de Young | Elastizitätsmodul (E-Modul) | module de Young (module d'élasticité) |
| たわみ | deflection | flecha | flecha | Durchbiegung | flèche |
| 単純梁 | simply supported beam | viga simplemente apoyada | viga simplesmente apoiada | beidseitig gelenkig gelagerter Balken | poutre simplement appuyée |
| 等分布荷重 | uniformly distributed load | carga uniformemente distribuida | carga uniformemente distribuída | gleichmäßig verteilte Last | charge uniformément répartie |
| 集中荷重 | point load (concentrated load) | carga puntual / concentrada | carga concentrada / pontual | Einzellast | charge ponctuelle |
| せん断応力 | shear stress | esfuerzo cortante | tensão de cisalhamento | Schubspannung | contrainte de cisaillement |
| せん断力 | shear force | fuerza cortante | força cortante | Querkraft | effort tranchant |
| 座屈荷重（オイラー座屈荷重） | (Euler) buckling load | carga de pandeo (de Euler) | carga de flambagem (de Euler) | (Eulersche) Knicklast | charge critique de flambement (d'Euler) |
| 座屈長さ係数 ※要確認 | effective length factor | coeficiente de longitud efectiva | fator de comprimento efetivo | Knicklängenbeiwert | coefficient de longueur effective |
| フックの法則 | Hooke's law | ley de Hooke | lei de Hooke | hookesches Gesetz | loi de Hooke |

### 密度・圧力・浮力（複数分野で共通）

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 密度 ※要注意（Aルール参照） | density | densidad | densidade | Dichte | masse volumique（"densité"にしない） |
| 濃度 | concentration | concentración | concentração | Konzentration | concentration |
| 圧力 | pressure | presión | pressão | Druck | pression |
| 水圧 | water pressure | presión hidrostática (del agua) | pressão da água (hidrostática) | Wasserdruck | pression de l'eau |
| 浮力 | buoyant force / buoyancy | fuerza de flotación (empuje) | força de flutuação (empuxo) | Auftrieb(skraft) | poussée d'Archimède |
| アルキメデスの原理 | Archimedes' principle | principio de Arquímedes | princípio de Arquimedes | archimedisches Prinzip | principe d'Archimède |

### フィットネス・車・料理 (Practical / everyday domains)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 心拍数 | heart rate | frecuencia cardíaca | frequência cardíaca | Herzfrequenz | fréquence cardiaque |
| 消費カロリー | calories burned | calorías quemadas | calorias queimadas | verbrannte Kalorien | calories brûlées |
| 体格指数（BMI） | body mass index (BMI) | índice de masa corporal (IMC) | índice de massa corporal (IMC) | Body-Mass-Index (BMI) | indice de masse corporelle (IMC) |
| 燃費 | fuel economy | consumo de combustible | consumo de combustível | Kraftstoffverbrauch | consommation de carburant |
| ベーカーズパーセント（水分率） ※要確認 | baker's percentage (hydration) | porcentaje de panadero (hidratación) | percentual de padeiro (hidratação) | Bäckerprozent (Hydration) | pourcentage boulanger (hydratation) |

### 単位名 (Unit names, `UNIT_META` より抜粋)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| オーム | ohm | ohmio | ohm | Ohm | ohm |
| カロリー | calorie | caloría | caloria | Kalorie | calorie |
| モル | mole | mol | mol | Mol | mole |
| 気圧 (atm) | standard atmosphere | atmósfera (atm) | atmosfera (atm) | (physikalische) Atmosphäre | atmosphère (atm) |
| 馬力 ※要確認 | horsepower | caballo de fuerza (hp) | horsepower (hp) | Horsepower (hp, ≠PS) | horsepower (hp) |
| 標準重力 (G) | standard gravity | gravedad estándar | gravidade padrão | Erdbeschleunigung (Normfallbeschleunigung) | gravité standard |
| カップ | cup | taza | xícara | Tasse | tasse |
| 大さじ | tablespoon | cucharada | colher de sopa | Esslöffel | cuillère à soupe |
| 小さじ | teaspoon | cucharadita | colher de chá | Teelöffel | cuillère à café |
| 電子ボルト | electronvolt | electronvoltio | elétron-volt | Elektronenvolt | électron-volt |
| 光年 | light year | año luz | ano-luz | Lichtjahr | année-lumière |
| 天文単位 | astronomical unit | unidad astronómica | unidade astronômica | astronomische Einheit | unité astronomique |

### 単位グループ名 (`BASE_UNIT_GROUPS.label`、UIのカテゴリタブに相当)

| ja | en(参考) | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 長さ | length | longitud | comprimento | Länge | longueur |
| 面積 | area | área | área | Fläche | superficie |
| 体積 | volume | volumen | volume | Volumen | volume |
| 時間 | time | tiempo | tempo | Zeit | temps |
| 質量 | mass | masa | massa | Masse | masse |
| 温度 | temperature | temperatura | temperatura | Temperatur | température |
| 速度 | velocity | velocidad | velocidade | Geschwindigkeit | vitesse |
| 加速度 | acceleration | aceleración | aceleração | Beschleunigung | accélération |
| 力 | force | fuerza | força | Kraft | force |
| 圧力 | pressure | presión | pressão | Druck | pression |
| エネルギー | energy | energía | energia | Energie | énergie |
| 電力 | power | potencia | potência | Leistung | puissance |
| 電流 | current | corriente | corrente | Stromstärke | courant |
| 電圧 | voltage | voltaje / tensión | tensão | Spannung | tension |
| 周波数 | frequency | frecuencia | frequência | Frequenz | fréquence |
| 角度 | angle | ángulo | ângulo | Winkel | angle |
| 割合・無次元 | ratio | proporción / relación | razão / proporção | Verhältnis | rapport |
| 物質量 | amount of substance | cantidad de sustancia | quantidade de matéria | Stoffmenge | quantité de matière |

---

## C. 定型表現集

| パターン (ja) | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 「〜を求める」（タイトル） | Find ~ / Compute ~ | Calcular ~ / Hallar ~ | Calcular ~ | ~ berechnen | Calculer ~ |
| 「〜の関係」 | the relation of ~ | la relación entre ~ | a relação entre ~ | der Zusammenhang zwischen ~ | la relation entre ~ |
| description冒頭「Compute Xから、Yを求めます」 | Compute X from Y. | Calcula X a partir de Y. | Calcule X a partir de Y. | X aus Y berechnen. | Calculer X à partir de Y. |
| 「〜の法則」 | ~'s law | ley de ~ | lei de ~ | ~sches Gesetz / Gesetz von ~ | loi de ~ |
| 「〜換算」「〜変換」 | convert ~ | convertir ~ | converter ~ | ~ umrechnen | convertir ~ |
| 「約Nになります」（結果の目安） | The result should be about N. | El resultado debería ser de aproximadamente N. | O resultado deve ser de aproximadamente N. | Das Ergebnis sollte etwa N betragen. | Le résultat devrait être d'environ N. |
| 「〜の求め方」 | How to find ~ | Cómo calcular ~ | Como calcular ~ | ~ berechnen (Vorgehen) | Comment calculer ~ |
| タイトルの括弧補足「X（Yの場合）」 | X (for Y) | X (para Y) | X (para Y) | X (bei Y) | X (pour Y) |

---

## D. `※要確認` 一覧と理由

1. **応力（stress）**: スペイン語は地域によって "esfuerzo"（中南米で優勢）と "tensión"（スペインの教科書で併用、ただし"tensión"は電圧とも訳語衝突しうる）が競合。本用語集では esfuerzo を第一候補としたが、翻訳担当が別の一次資料を根拠に tensión を選ぶ可能性がある。**CLAUDE.mdが挙げる「応力」のブレ例そのもの**なので最優先で確認すべき。
2. **電圧（voltage）とドイツ語/スペイン語の訳語衝突**: ドイツ語では「電圧」も「応力」もどちらも文脈で "Spannung" になりうる（力学のSpannung=stress、電気のSpannung=voltage、同一語で意味が別）。スペイン語も「電圧」="tensión (eléctrica)"と「応力」="tensión"が同形になりうる。誤訳ではなく多義語なので実害は小さいが、レビュー時に文脈を混同しないよう注意喚起。
3. **屈折率／スネルの法則の訳語**: ドイツ語で "Brechzahl"（学校教育でよく使われる）と "Brechungsindex"（より一般的・大学レベル）のどちらを採用するか未確定。スネルの法則の正式独語名も複数の言い方があり、検索で単一の定訳を確認しきれなかった。
4. **誘導起電力（induced EMF）**: ドイツ語の "induzierte Spannung"（高校物理でよく使う簡易表現）と "induzierte EMK"（大学レベルの正式表現）のレジスター差。本アプリの対象読者（中高生〜一般）にはinduzierte Spannungが妥当と判断したが未確認。
5. **飽和水蒸気量**: 日本の理科教育特有の「1m³あたりの水蒸気の質量[g]」という定義。海外では露点・相対湿度の計算に別のアプローチ（飽和水蒸気圧ベース）を使うことが多く、直訳が現地の教科書表現と一致するか未確認。
6. **震源（epicenter/hypocenter）**: 日本語の「震源」は本来3次元の破壊開始点（＝hypocenter、震央epicenterとは別語）だが、本アプリの文中では「震源までの距離」を地表からの距離として扱っており、英語版もepicenterと訳している（対象データが厳密に震央の意味で使われている可能性）。es/pt/de/fr訳もこの英語版の解釈（epicenter寄り）に合わせるべきか、日本語の原義（震源=hypocenter）に合わせるべきか要判断。
7. **初期微動継続時間・大森公式**: 日本の中学理科特有の用語・公式名。海外の地学教育で同じ公式が同名で扱われているか未確認（"S-Pタイム"に相当する語がそのまま定訳として通じるか要確認）。
8. **空走距離／ブレーカー容量／座屈長さ係数／仕事の原理／ベーカーズパーセント**: これらは日本の教科書・実務でよく使う複合語だが、対応する定訳が海外の教科書に一語で存在するとは限らず、意訳（説明的な言い換え）になっている。特にベーカーズパーセントは英語圏でも「baker's percentage」という専門的借用語のまま使われることが多く、es/pt-BR/de/frでもそのままカタカナ的に借用される可能性がある。
9. **馬力（horsepower）**: メートル馬力（PS/CV、735.5W）と英馬力（hp、745.7W）は値が異なる。`lib/units.ts`のBASE_UNITSでは `hp: unit(745.699871582, ...)` と**英馬力（hp）で定義**されている。ドイツ語・フランス語圏では日常的に「PS」「CV」（メートル馬力）を使うため、単位名の翻訳時に**hpのまま**なのかPS/CVに変えるべきかは実装判断（本用語集では単位定義に忠実に「hp」のまま訳語を当てた）。

---

## E. 参考URL

- [Segundo momento de área - Wikipedia (es)](https://es.wikipedia.org/wiki/Segundo_momento_de_%C3%A1rea)
- [Flächenträgheitsmoment – Wikipedia (de)](https://de.wikipedia.org/wiki/Fl%C3%A4chentr%C3%A4gheitsmoment)
- [Formeln für Widerstands- & Flächenträgheitsmomente (de)](https://www.johannes-strommer.com/formeln/flaechentraegheitsmoment-widerstandsmoment/)
- [Moment quadratique — Wikipédia (fr)](https://fr.wikipedia.org/wiki/Moment_quadratique)
- [Momento de inércia de área – Wikipédia (pt)](https://pt.wikipedia.org/wiki/Momento_de_in%C3%A9rcia_de_%C3%A1rea)
- [Calculadora de Módulo de Resistência (pt)](https://www.omnicalculator.com/pt/fisica/calculadora-modulo-de-resistencia)
- [Module #6a Contraintes de flexion dans les poutres (fr, Polytechnique Montréal)](https://profs.polymtl.ca/jagoulet/Site/Teaching_material/CIV1150/CIV1150_6a_Contraintes_flexion.pdf)
- [Mécanique des structures et résistance des matériaux (fr)](https://usergeweb.github.io/cours_rdm_sollicitations_simples.pdf)
- [Clase digital 7. Esfuerzos normales, deformación unitaria, ley de Hooke (es)](https://blogs.ugto.mx/rea/clase-digital-7-esfuerzos-normales-deformacion-unitaria-ley-de-hooke/)
- [Hookesches Gesetz – Wikipedia (de)](https://de.wikipedia.org/wiki/Hookesches_Gesetz)
- [Esforço cortante – Wikipédia (pt)](https://pt.wikipedia.org/wiki/Esfor%C3%A7o_cortante)
- [Ley de Snell - Wikipedia (es)](https://es.wikipedia.org/wiki/Ley_de_Snell)
- [Índice de refracción: Fórmula y aplicaciones (es)](https://www.studysmarter.es/resumenes/fisica/ondas/indice-de-refraccion/)
- [Distancia de frenado - Wikipedia (es)](https://es.wikipedia.org/wiki/Distancia_de_frenado)
- [Resistencias equivalentes - Teoría de electricidad (es)](https://www.picuino.com/es/electric-serie-paralelo-resistencias.html)
- [Calor Específico: o que é, fórmula e exercícios (pt)](https://www.todamateria.com.br/calor-especifico/)
- [Molaridade – Wikipédia (pt)](https://pt.wikipedia.org/wiki/Molaridade)
- [Concentração em quantidade de matéria ou em mol/L (pt)](https://www.preparaenem.com/quimica/concentracao-quantidade-materia-ou-mol-l.htm)
- [Auftriebskraft und das Archimedische Gesetz in der Physik (de)](https://www.lernort-mint.de/physik/mechanik/anwendungen/die-auftriebskraft-und-das-archimedische-gesetz/)
- [Poussée d'Archimède — Wikipédia (fr)](https://fr.wikipedia.org/wiki/Pouss%C3%A9e_d'Archim%C3%A8de)
- [Masse volumique — Wikipédia (fr)](https://fr.wikipedia.org/wiki/Masse_volumique)
- [Masse Volumique et Densité (fr, Superprof)](https://www.superprof.fr/ressources/physique-chimie/physique-chimie-2nde/masse-volumique-v2.html)
- [Efecto fotoeléctrico - Wikipedia (es)](https://es.wikipedia.org/wiki/Efecto_fotoel%C3%A9ctrico)
- [Função Trabalho - Revista de Ciência Elementar (pt)](https://rce.casadasciencias.org/rceapp/art/2015/221/)
- [Primera velocidad cósmica - EcuRed (es)](https://www.ecured.cu/Primera_velocidad_c%C3%B3smica)
- [Velocidad de escape - Wikipedia (es)](https://es.wikipedia.org/wiki/Velocidad_de_escape)
- [Erste kosmische Geschwindigkeit | LEIFIphysik (de)](https://www.leifiphysik.de/mechanik/gravitationsgesetz-und-feld/aufgabe/erste-kosmische-geschwindigkeit)
- [Kosmische Geschwindigkeiten | LEIFIphysik (de)](https://www.leifiphysik.de/mechanik/gravitationsgesetz-und-feld/grundwissen/kosmische-geschwindigkeiten)
- [Vitesse de satellisation minimale — Wikipédia (fr)](https://fr.wikipedia.org/wiki/Vitesse_de_satellisation_minimale)
- [première vitesse cosmique — Wiktionnaire (fr)](https://fr.wiktionary.org/wiki/premi%C3%A8re_vitesse_cosmique)
- [Órbitas e velocidade de escape em Física (pt, Descomplica)](https://descomplica.com.br/d/vs/aula/orbitas-e-velocidade-de-escape2/)

---

## F. 実装後に判明した訂正・確定事項

この用語集を使って実際に翻訳（PR #22 / #23）した結果、以下は当初の記載を訂正・確定した。

- **ベーカーズパーセント**: D節8で「借用語のままかも」と推測していたが、**4言語すべてに定訳が実在した** — es `porcentaje panadero` / pt-BR `percentual do padeiro` / de `Bäckerprozent` / fr `pourcentage du boulanger`。
- **震源**: D節6は `hipocentro` 系（原義のhypocenter）を候補にしていたが、**epicenter系を採用した** — es `epicentro` / de `Epizentrum` / fr `épicentre`。理由は、英語版が既に "epicenter" であり、大森公式が実際に計算しているのは震央距離に相当するため。
- **シャルルの法則**: 用語集に記載がなかったが、**独語圏では `Gesetz von Gay-Lussac` と呼ぶのが標準**（[LEIFIphysik](https://www.leifiphysik.de/waermelehre/allgemeines-gasgesetz/grundwissen/gesetz-von-gay-lussac)）。独語だけこの呼び方にし、他3言語は「シャルルの法則」の直訳。
- **屈折率**: D節3の未確定を、対象読者が高校生であることから **`Brechzahl`** に確定。
- **誘導起電力**: D節4の未確定を、同じ理由で **`induzierte Spannung`** に確定。
- **空走距離**: es/de/pt-BR は定訳あり（`distancia de reacción` / `Reaktionsweg` / `distância de reação`）。**仏語のみ一語の定訳が無く**、`distance parcourue pendant le temps de réaction` と説明的に訳した。
- **記録タイマー（ticker-tape timer）**: 独語のみ定訳 `Zeitmarkengeber` が実在。es/pt-BR/fr は説明的に訳した。
- **`lb`（ポンド）**: 用語集に記載がなかったが、**ドイツ語の慣用「Pfund」は500g**で `lb`（453.6g）とは値が違うため `Avoirdupois-Pfund` とした。同様に **`mi`/`mph` はフランス語の `mille`（=1000）と紛れる**ため `mille terrestre`。
- **スペイン語の人名由来単位**: RAEがスペイン語化した綴りを採用した（`ohmio`, `vatio`, `amperio`, `voltio`, `hercio`, `julio`）。大文字化はドイツ語のみ名詞化規則を優先し、es/pt-BR/fr はSIの慣習どおり小文字始まり。
- **「計算ノート」の訳語（確定）**: es `cuaderno (de cálculo)` / pt-BR `caderno (de cálculo)` / de **`Rechenheft`** / fr `carnet (de calcul)`。**独語で `Notizbuch` は使わない**（「メモ帳」の意味で、手順を計算するシートというこのアプリの概念に合わない）。
- **独語の人称（確定）**: **親称（du）で統一**する。`Tippe`, `deine`, `Prüfe` など。敬称（Sie/Ihre）を混ぜない。
- **仏語の人称（確定）**: **vous 形で統一**する。`Saisissez`, `Appuyez`, `Choisissez` など。
- **仏語のアポストロフィ（確定）**: アプリ全体で**直線引用符 `'`** を使う（活字体の `’` は混ぜない）。
