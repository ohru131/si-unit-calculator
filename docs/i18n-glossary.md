# si-unit-calculator 多言語用語集（es / pt-BR / de / fr）

対象: `lib/notebook-formulas/source/` 配下の全ファイル
（`materials` / `physics` / `practical` / `science` / `categories` に加え、2026-09に追加した
`electronics` / `media` / `lifestyle` / `making` / `engineering-power` / `engineering-stress`）、
`lib/units.ts`（`UNIT_META` 100件・`BASE_UNIT_GROUPS` 18件）、`lib/unit-explanations.ts`、`lib/sample-calculations.ts`
から実際に使われている `{ en, ja }` 文字列を抽出し、そこから訳がブレやすい専門用語を選定した。

**凡例**: `※要確認` = 確信度が低い・地域差/レジスター差がある・複数の定訳が競合している語。後続の翻訳エージェントと人間レビュアーは重点的に確認すること。

**分担翻訳を始める前に必ず読む順**: A節（表記ルール）→ **G節（新規ドメインの罠）** → B節（訳語を引く）。
G節は「型チェック・lint・テストが全部通るのに間違っている」種類の問題だけを集めてあり、
`Spannung`（応力/電圧）・`tensão`（同）・`densité` vs `masse volumique`・「体感温度」の1語潰れなど、
**分担すると必ず割れる語**の決着をまとめてある。

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
| 空走距離 | reaction distance | distancia de reacción | distância de reação | Reaktionsweg | distance parcourue pendant le temps de réaction（仏語のみ一語の定訳がなく説明的） |
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
| 屈折率 | refractive index | índice de refracción | índice de refração | Brechzahl（大学レベルの `Brechungsindex` ではなく学校教育寄りの語を採用） | indice de réfraction |
| 屈折の法則（スネルの法則） ※要確認 | law of refraction (Snell's law) | ley de Snell(-Descartes) | lei de Snell | Snelliussches Brechungsgesetz | loi de Snell-Descartes |
| 入射角 | angle of incidence | ángulo de incidencia | ângulo de incidência | Einfallswinkel | angle d'incidence |
| 反射角 | angle of reflection | ángulo de reflexión | ângulo de reflexão | Reflexionswinkel | angle de réflexion |
| 凸レンズ | convex lens | lente convexa / convergente | lente convexa / convergente | Sammellinse (konvexe Linse) | lentille convergente |
| 焦点距離 | focal length | distancia focal | distância focal | Brennweite | distance focale |
| 倍率 | magnification | aumento | ampliação / aumento | Vergrößerung | grandissement |

### 電気 (Electricity)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 電圧 | voltage | **voltaje**（`tensión (eléctrica)` はスペインで併用される同義語だが、本アプリでは「応力」との衝突を避けるため使わない） | tensão (elétrica) | (elektrische) Spannung | tension (électrique) |
| 電流 | electric current | corriente (eléctrica) | corrente (elétrica) | Stromstärke | courant (électrique) |
| 抵抗 | (electrical) resistance | resistencia (eléctrica) | resistência (elétrica) | (elektrischer) Widerstand | résistance (électrique) |
| 合成抵抗（直列・並列） | combined / equivalent resistance | resistencia equivalente | resistência equivalente | Ersatzwiderstand / Gesamtwiderstand | résistance équivalente |
| 電力 | electric power | potencia eléctrica | potência elétrica | elektrische Leistung | puissance électrique |
| 電力量 | energy consumption (electric energy) | energía eléctrica consumida | energia elétrica consumida | elektrische Arbeit / Energieverbrauch | énergie électrique consommée |
| クーロンの法則 | Coulomb's law | ley de Coulomb | lei de Coulomb | coulombsches Gesetz | loi de Coulomb |
| 静電容量 | capacitance | capacitancia / capacidad (eléctrica) | capacitância | Kapazität | capacité (électrique) |
| 誘導起電力 | induced electromotive force (EMF) | fem inducida | fem induzida | induzierte Spannung（大学レベルの `induzierte EMK` ではなく高校物理寄りの語を採用） | f.é.m. induite |
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
| 震源（本アプリでは震央距離の意味） | epicenter | epicentro | epicentro | Epizentrum | épicentre |
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
| ベーカーズパーセント（水分率） | baker's percentage (hydration) | porcentaje panadero (hidratación) | percentual do padeiro (hidratação) | Bäckerprozent (Hydration) | pourcentage boulanger (hydratation) |

### 単位名 (Unit names, `UNIT_META` より抜粋)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| オーム | ohm | ohmio | ohm | Ohm | ohm |
| カロリー | calorie | caloría | caloria | Kalorie | calorie |
| モル | mole | mol | mol | Mol | mole |
| 気圧 (atm) | standard atmosphere | atmósfera (atm) | atmosfera (atm) | (physikalische) Atmosphäre | atmosphère (atm) |
| 馬力（英馬力 745.7 W） | horsepower | caballo de fuerza (hp, imperial) | horsepower (hp) | britische Horsepower (hp) | horsepower anglais (hp) |
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


### （以下 2026-09 追加分）新規81ノート・16カテゴリの用語

`source/{electronics,media,lifestyle,making,engineering-power,engineering-stress,materials}.ts` で
新しく使われるようになった語のうち、**訳が2通り以上に割れうるもの**を分野別に並べる。
上のB節前半（力学〜単位グループ名）と重複する語はここに再掲していないので、両方を引くこと。

### 電子工作・太陽光 (Hobby electronics / Solar & batteries)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 分圧回路 | voltage divider | divisor de voltaje | divisor de tensão | Spannungsteiler | diviseur de tension |
| 入力電圧／出力電圧 | input / output voltage | voltaje de entrada / de salida | tensão de entrada / de saída | Eingangs- / Ausgangsspannung | tension d'entrée / de sortie |
| 時定数 | time constant | constante de tiempo | constante de tempo | Zeitkonstante | constante de temps |
| リアクタンス | reactance | reactancia | reatância | Blindwiderstand (Reaktanz) | réactance |
| 容量リアクタンス | capacitive reactance | reactancia capacitiva | reatância capacitiva | kapazitiver Blindwiderstand | réactance capacitive |
| 誘導リアクタンス | inductive reactance | reactancia inductiva | reatância indutiva | induktiver Blindwiderstand | réactance inductive |
| インダクタンス | inductance | inductancia | indutância | Induktivität | inductance |
| 共振周波数 | resonant frequency | frecuencia de resonancia | frequência de ressonância | Resonanzfrequenz | fréquence de résonance |
| 特性インピーダンス ※要確認 | characteristic impedance | impedancia característica | impedância característica | Kennwiderstand (Wellenwiderstand) | impédance caractéristique |
| Q値 | Q factor | factor Q (factor de calidad) | fator Q (fator de qualidade) | Güte (Q-Faktor) | facteur de qualité (facteur Q) |
| 消費電力（抵抗が消費する） | power dissipation | potencia disipada | potência dissipada | Verlustleistung | puissance dissipée |
| 定格（定格値・定格電力） | rating (rated value / power) | valor nominal (potencia nominal) | valor nominal (potência nominal) | Nennwert (Nennleistung) | valeur nominale (puissance nominale) |
| ディレーティング | derating | reducción de régimen (derating) | derating (redução de regime) | Derating (Leistungsminderung) | déclassement (derating) |
| 使用率（定格に対する割合） | fraction of the rating used | grado de aprovechamiento | grau de aproveitamento | Ausnutzungsgrad | taux d'utilisation |
| 電荷 | charge | carga (eléctrica) | carga (elétrica) | Ladung | charge (électrique) |
| 電圧を保てる時間 ※要確認 | hold-up time | tiempo de retención (hold-up) | tempo de retenção (hold-up) | Überbrückungszeit (Hold-up-Zeit) | temps de maintien (hold-up) |
| 電池容量（mA·h） | battery capacity | capacidad de la batería | capacidade da bateria | Batterie-/Akkukapazität | capacité de la batterie |
| 動作時間 | runtime | autonomía (tiempo de funcionamiento) | autonomia (tempo de funcionamento) | Laufzeit (Betriebsdauer) | autonomie |
| ピーク日照時間 ※要確認 | peak sun hours (PSH) | horas solares pico (HSP) | horas de sol pleno (HSP) | Peak-Sonnenstunden (volle Sonnenstunden) | heures de plein soleil (heures d'ensoleillement équivalent) |
| 放電深度 | depth of discharge (DoD) | profundidad de descarga (DoD) | profundidade de descarga (DoD) | Entladetiefe (DoD) | profondeur de décharge (DoD) |
| 充電状態 | state of charge (SoC) | estado de carga (SoC) | estado de carga (SoC) | Ladezustand (SoC) | état de charge (SoC) |
| 自立日数 | days of autonomy | días de autonomía | dias de autonomia | Autonomietage | jours d'autonomie |
| 蓄電池（バンク） ※要確認 | battery bank | banco de baterías | banco de baterias | Batteriebank (Akkubank) | parc de batteries |
| 充電効率／放電効率 | charging / discharge efficiency | rendimiento de carga / descarga | rendimento de carga / descarga | Lade- / Entladewirkungsgrad | rendement de charge / décharge |
| 電圧降下 | voltage drop | caída de voltaje | queda de tensão | Spannungsabfall（VDEの規格語は `Spannungsfall`） | chute de tension |
| 抵抗率 | resistivity | resistividad | resistividade | spezifischer Widerstand | résistivité |
| 導体断面積 | conductor cross-section | sección del conductor | seção do condutor | Leiterquerschnitt | section du conducteur |
| 太陽光パネル（アレイ） | PV panel / array | panel (campo) fotovoltaico | painel (arranjo) fotovoltaico | PV-Modul (Solargenerator) | panneau (champ) photovoltaïque |
| 出力温度係数 | temperature coefficient of power | coeficiente de temperatura de potencia | coeficiente de temperatura de potência | Temperaturkoeffizient der Leistung | coefficient de température de puissance |
| システム効率 | system efficiency | rendimiento del sistema | rendimento do sistema | Systemwirkungsgrad | rendement du système |
| 1日の消費電力量 | daily energy demand | consumo diario de energía | consumo diário de energia | Tagesenergiebedarf | consommation journalière d'énergie |

### 写真 (Photography)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 過焦点距離 | hyperfocal distance | distancia hiperfocal | distância hiperfocal | hyperfokale Distanz | distance hyperfocale |
| 被写界深度 | depth of field | profundidad de campo | profundidade de campo | **Schärfentiefe**（`Tiefenschärfe` は俗用・使わない） | profondeur de champ |
| 許容錯乱円 | circle of confusion | círculo de confusión | círculo de confusão | (zulässiger) Zerstreuungskreis | cercle de confusion |
| 露出値（EV） | exposure value (EV) | valor de exposición (EV) | valor de exposição (EV) | Lichtwert (LW / EV) | indice de lumination (IL / EV) |
| 段（露出の1段） | stop | paso (punto de diafragma) | ponto (stop) | Blendenstufe (Lichtwertstufe) | IL (« un diaph ») |
| F値（絞り値） | f-number | número f (número de diafragma) | número f (abertura) | Blendenzahl | nombre d'ouverture |
| 絞り | aperture | abertura (diafragma) | abertura (diafragma) | Blende | ouverture (diaphragme = 機構そのもの) |
| シャッター速度 | shutter speed / shutter time | velocidad de obturación | velocidade do obturador | Belichtungszeit (Verschlusszeit) | vitesse d'obturation (temps de pose) |
| ISO感度 | ISO sensitivity | sensibilidad ISO | sensibilidade ISO | ISO-Empfindlichkeit | sensibilité ISO |
| 焦点距離 | focal length | distancia focal | distância focal | Brennweite | distance focale |
| 実効焦点距離（換算） | effective (equivalent) focal length | distancia focal efectiva (equivalente) | distância focal efetiva (equivalente) | effektive (KB-äquivalente) Brennweite | distance focale effective (équivalente) |
| 画角 | angle of view | ángulo de visión (campo) | ângulo de visão (campo) | Bildwinkel | angle de champ |
| センサーサイズ | sensor size | tamaño del sensor | tamanho do sensor | Sensorgröße | taille du capteur |
| フルサイズ | full frame | formato completo (full frame) | full frame (quadro completo) | Kleinbild (Vollformat) | plein format (24×36) |
| 画素ピッチ | pixel pitch | tamaño (paso) de píxel | tamanho de pixel | Pixelgröße (Pixelpitch) | taille de photosite (pas de pixel) |
| ガイドナンバー | guide number (GN) | número guía (NG) | número-guia (NG) | Leitzahl (LZ) | nombre-guide (NG) |
| 等価露出 | equivalent exposure | exposición equivalente | exposição equivalente | äquivalente Belichtung | exposition équivalente |
| 星が流れる（星の軌跡） | star trails | trazas de estrellas (startrails) | rastros de estrelas (startrails) | Sternspuren (Startrails) | filés d'étoiles |
| 500ルール／NPFルール | 500 rule / NPF rule | regla del 500 / regla NPF | regra dos 500 / regra NPF | 500er-Regel / NPF-Regel | règle des 500 / règle NPF |
| 被写体距離 | subject distance | distancia al sujeto | distância ao motivo | Motivabstand (Aufnahmeabstand) | distance au sujet |

### 音響 (Sound & audio)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 音圧 | sound pressure | presión sonora | pressão sonora | Schalldruck | pression acoustique |
| 音圧レベル（SPL） | sound pressure level (SPL) | nivel de presión sonora (NPS) | nível de pressão sonora (NPS) | Schalldruckpegel | niveau de pression acoustique |
| 基準音圧（20 µPa） | reference sound pressure | presión sonora de referencia | pressão sonora de referência | Bezugsschalldruck | pression acoustique de référence |
| デシベル（記号 dB は翻訳しない） | decibel | decibelio | decibel | Dezibel | décibel |
| 逆二乗則 | inverse-square law | ley del inverso del cuadrado (de la distancia) | lei do inverso do quadrado (da distância) | (quadratisches) Abstandsgesetz | loi de l'inverse du carré (de la distance) |
| 自由音場 | free field | campo libre | campo livre | Freifeld | champ libre |
| 距離減衰 | level drop with distance | atenuación con la distancia | atenuação com a distância | Pegelabnahme mit der Entfernung | atténuation avec la distance |
| デシベルの加算（音源の合成） | dB addition (combining sources) | suma de niveles en dB | soma de níveis em dB | Pegeladdition | addition des niveaux en dB |
| 定在波 | standing wave | onda estacionaria | onda estacionária | stehende Welle | onde stationnaire |
| 部屋の（軸）モード | (axial) room mode | modo (axial) de sala | modo (axial) da sala | Raummode (Axialmode) | mode propre (axial) de la salle |
| リスニングルーム | listening room | sala de escucha | sala de escuta | Hörraum | salle d'écoute |
| スピーカー | speaker (loudspeaker) | altavoz ※要確認（中南米では bocina / parlante） | alto-falante | Lautsprecher | haut-parleur (enceinte) |
| スピーカーの能率（出力音圧レベル） | speaker sensitivity | sensibilidad del altavoz | sensibilidade do alto-falante | **Kennschalldruck**（`Wirkungsgrad` は%表示の別量・使わない） | sensibilité (rendement) du haut-parleur |
| アンプ出力 | amplifier power | potencia del amplificador | potência do amplificador | Verstärkerleistung | puissance de l'amplificateur |
| 音速 | speed of sound | velocidad del sonido | velocidade do som | Schallgeschwindigkeit | vitesse du son |
| 低音のむら（ブーミング） | uneven bass (booming) | graves irregulares (retumbe) | graves irregulares (ressonância) | ungleichmäßiger Bass (Dröhnen) | basses irrégulières (résonance) |

### コーヒー・醸造 (Coffee & home brewing)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 抽出比率（粉と湯の比） | brew ratio | ratio de extracción (proporción café-agua) | proporção café-água (ratio) | Brührverhältnis (Kaffee-Wasser-Verhältnis) | ratio d'extraction (ratio café/eau) |
| 粉（挽いた豆）・ドーズ | grounds / dose | café molido (dosis) | café moído (dose) | Kaffeemehl (Einwaage, Dosis) | café moulu (dose) |
| 抽出収率 | extraction yield | rendimiento de extracción | rendimento de extração | Extraktionsausbeute (Extraktionsrate) | rendement d'extraction |
| TDS（総溶解固形分・略語は残す） | total dissolved solids (TDS) | sólidos disueltos totales (TDS) | sólidos dissolvidos totais (TDS) | gelöste Feststoffe (TDS) | matières sèches dissoutes (TDS) |
| 屈折計 | refractometer | refractómetro | refratômetro | Refraktometer | réfractomètre |
| エスプレッソ | espresso | espresso | espresso | Espresso | espresso |
| 流量（g/s） | flow rate | caudal | vazão | Flussrate (Durchflussrate) | débit |
| コールドブリュー | cold brew | cold brew (café en frío) | cold brew (café gelado) | Cold Brew | cold brew (café infusé à froid) |
| 原液（濃縮） | concentrate | concentrado | concentrado | Konzentrat | concentré |
| 希釈 | dilution | dilución | diluição | Verdünnung | dilution |
| ハンドドリップ | pour-over | café de filtro (vertido, V60) | café coado (pour over) | Handfilter (Pour Over) | café filtre (slow coffee) |
| 抽出温度 | brewing temperature | temperatura de extracción | temperatura de extração | Brühtemperatur | température d'infusion |
| 初期比重（OG） | original gravity (OG) | densidad original (OG) | densidade original (OG) | Anfangsdichte / Ausgangsdichte (OG)（**`Stammwürze` にしない**・G節参照） | densité initiale (DI / OG) |
| 最終比重（FG） | final gravity (FG) | densidad final (FG) | densidade final (FG) | Enddichte / Restdichte (FG)（`Restextrakt` は °P の量） | densité finale (DF / FG) |
| アルコール度数（ABV） | alcohol by volume (ABV) | graduación alcohólica (% vol) | teor alcoólico (% ABV) | Alkoholgehalt (Vol.-%) | titre alcoométrique volumique (degré d'alcool, % vol) |
| 見かけの発酵度 | apparent attenuation | atenuación aparente | atenuação aparente | scheinbarer Vergärungsgrad | atténuation apparente |
| 発酵 | fermentation | fermentación | fermentação | Gärung | fermentation |
| エール | ale | ale | ale | Ale (obergäriges Bier) | ale |
| 麦汁 | wort | mosto | mosto | Würze | moût |

### 気象 (Weather & atmosphere)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 水蒸気圧 | water vapour pressure | presión de vapor de agua | pressão de vapor d'água | Wasserdampfdruck | pression de vapeur d'eau |
| 飽和水蒸気圧 | saturation vapour pressure | presión de vapor saturante | pressão de vapor saturante | Sättigungsdampfdruck | pression de vapeur saturante |
| マグヌス式 | Magnus formula | fórmula de Magnus | fórmula de Magnus | Magnus-Formel | formule de Magnus |
| 体感温度（風による寒さ） | wind chill | sensación térmica por viento (windchill) | sensação térmica pelo vento (windchill) | Windchill(-Temperatur) | refroidissement éolien |
| 体感温度（蒸し暑さ） | apparent temperature | temperatura aparente (por calor y humedad) | temperatura aparente (por calor e umidade) | gefühlte Temperatur (Hitze und Luftfeuchte) | température ressentie |
| 空気の密度 | air density | densidad del aire | densidade do ar | Luftdichte | **masse volumique de l'air**（`densité de l'air` にしない） |
| 乾燥空気の比気体定数 | specific gas constant of dry air | constante específica del aire seco | constante específica do ar seco | spezifische Gaskonstante trockener Luft | constante spécifique de l'air sec |
| 気圧高度公式 | barometric (pressure–altitude) formula | fórmula barométrica de la altura | fórmula barométrica (do nivelamento) | barometrische Höhenformel | formule du nivellement barométrique |
| 標準大気（ISA） | standard atmosphere (ISA) | atmósfera estándar (ISA) | atmosfera padrão (ISA) | Normatmosphäre (Standardatmosphäre) | atmosphère standard (ISA) |
| 気温減率 | temperature lapse rate | gradiente térmico vertical | gradiente térmico vertical | Temperaturgradient | gradient thermique vertical |
| 高度計 | altimeter | altímetro | altímetro | Höhenmesser | altimètre |
| 降水量（深さ） | rainfall (depth) | precipitación (altura de lluvia) | precipitação (altura de chuva) | Niederschlagshöhe | hauteur de précipitations |
| 集水効率 ※要確認 | collection efficiency | eficiencia de recogida | eficiência de captação | Sammelwirkungsgrad (Abflussbeiwert) | rendement de collecte |
| 水平投影面積 | plan area (horizontal projection) | superficie en planta | área em planta | Grundfläche (horizontale Projektion) | surface en plan (projection horizontale) |
| 降り始めの汚れた分（ファーストフラッシュ） ※要確認 | first flush | primer lavado (first flush) | primeira lavagem (first flush) | erster Spülstoß (First Flush) | premières eaux (first flush) |

### DIY・3Dプリンタ (DIY / 3D printing)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 塗布率（1Lで塗れる面積） | spreading rate / coverage | rendimiento (m²/L) | rendimento (m²/L) | Ergiebigkeit (m²/l) | rendement (m²/L), pouvoir couvrant |
| 塗り重ね回数 | number of coats | número de manos | número de demãos | Anzahl der Anstriche | nombre de couches |
| ロス率（余裕率） | waste allowance | merma (desperdicio) | perda (desperdício) | Verschnitt(zuschlag) | chutes (marge de perte) |
| 下地（プライマー） | primed surface (primer) | superficie imprimada (imprimación) | superfície com primer | grundierte Fläche (Grundierung) | surface apprêtée (primaire) |
| 水性塗料 | emulsion paint | pintura plástica (al agua) | tinta acrílica (látex) | Dispersionsfarbe (Wandfarbe) | peinture acrylique (à l'eau) |
| 土間・基礎 | slab / footing | losa / zapata | laje / sapata | Bodenplatte / Fundament | dalle / semelle |
| 打設（コンクリート） | pouring (placing) concrete | vertido del hormigón | concretagem | Betonieren | coulage du béton |
| 斜め張り・ヘリンボーン | diagonal / herringbone layout | colocación diagonal / en espiga | assentamento diagonal / espinha de peixe | Diagonal- / Fischgrätverlegung | pose en diagonale / en chevrons |
| 目地 | joint (grout joint) | junta | junta | Fuge | joint |
| 製材（材積） | sawn timber (volume) | madera aserrada (volumen) | madeira serrada (volume) | Schnittholz (Volumen) | bois de sciage (volume) |
| 気乾（含水率12%前後） | air-dry | seco al aire | seco ao ar | lufttrocken (darrtrocken ではない) | séché à l'air |
| 針葉樹 | softwood | madera de conífera | madeira de conífera | Nadelholz | résineux |
| 壁紙のロール | wallpaper roll | rollo de papel pintado | rolo de papel de parede | Tapetenrolle | rouleau de papier peint |
| 柄のリピート | pattern repeat | repetición del dibujo (rapport) | repetição do padrão (rapport) | Rapport (Musterversatz) | raccord (rapport) du motif |
| 壁の周長 | wall perimeter | perímetro de las paredes | perímetro das paredes | Wandumfang | périmètre des murs |
| 光束法 | lumen method | método del lumen (del flujo) | método dos lúmens | **Wirkungsgradverfahren**（直訳の「Lumen-Methode」は使わない） | méthode du flux lumineux |
| 光束 | luminous flux | flujo luminoso | fluxo luminoso | Lichtstrom | flux lumineux |
| 照度 | illuminance | iluminancia | iluminância | Beleuchtungsstärke（`Helligkeit` にしない） | éclairement (lumineux) |
| 照明率（UF） ※要確認 | utilisation factor (UF) | factor de utilización | fator de utilização | Raumwirkungsgrad | facteur d'utilance (rendement du local) |
| 保守率（MF） | maintenance factor (MF) | factor de mantenimiento | fator de manutenção | Wartungsfaktor | facteur de maintenance |
| 照明器具 | luminaire | luminaria | luminária | Leuchte | luminaire |
| 作業面 | working plane | plano de trabajo | plano de trabalho | Nutzebene (Arbeitsebene) | plan utile (plan de travail) |
| 電力量単価 | price per kWh (tariff) | precio del kWh (tarifa) | preço do kWh (tarifa) | Arbeitspreis je kWh (Strompreis) | prix du kWh (tarif) |
| フィラメント | filament | filamento | filamento | Filament | filament |
| スプール | spool | bobina | bobina (carretel) | Spule (Filamentrolle) | bobine |
| スライサ | slicer | laminador (slicer) | fatiador (slicer) | Slicer | trancheur (slicer) |
| ノズル | nozzle | boquilla | bico | Düse | buse |
| ホットエンド | hotend | hotend | hotend | Hotend | hotend |
| 積層ピッチ（レイヤー高さ） | layer height | altura de capa | altura de camada | Schichthöhe | hauteur de couche |
| 積層数 | layer count | número de capas | número de camadas | Schichtanzahl | nombre de couches |
| 線幅（押出幅） | extrusion width | ancho de extrusión | largura de extrusão | Extrusionsbreite (Linienbreite) | largeur d'extrusion |
| 体積流量（吐出量） | volumetric flow rate | caudal volumétrico | vazão volumétrica | Volumenstrom (Durchfluss) | débit volumique |
| 押出係数（フロー） | extrusion multiplier (flow) | multiplicador de extrusión (flow) | multiplicador de extrusão (flow) | Extrusionsmultiplikator (Flow) | multiplicateur d'extrusion (flow, débit) |
| 吐出不足 | under-extrusion | subextrusión | subextrusão | Unterextrusion | sous-extrusion |
| ノギス | calipers | calibre (pie de rey) | paquímetro | Messschieber | pied à coulisse |
| 造形時間 | print time | tiempo de impresión | tempo de impressão | Druckzeit | temps d'impression |
| 捨て線（プライムライン） ※要確認 | purge line | línea de purga | linha de purga | Reinigungslinie (Purge Line) | ligne de purge |
| 原点復帰 | homing | referenciado (homing) | referenciamento (homing) | Referenzfahrt (Homing) | prise d'origine (homing) |

### 機械設計・動力伝達 (Shafts, torsion & power transmission)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| トルク ※要確認（es の地域差） | torque | par de torsión (torque) | torque | Drehmoment | **couple (de torsion)**（英語の `torque` は使わない） |
| 回転数（回転速度） | rotational speed | velocidad de rotación (de giro) | rotação (velocidade de rotação) | Drehzahl | vitesse de rotation |
| 軸動力 | shaft power | potencia en el eje | potência no eixo | Wellenleistung | puissance à l'arbre |
| 軸 | shaft | eje (árbol) | eixo (árvore) | Welle | arbre |
| 中実軸／中空軸 | solid / hollow shaft | eje macizo / hueco | eixo maciço / oco | Vollwelle / Hohlwelle | arbre plein / creux |
| ねじり | torsion | torsión | torção | Torsion (Verdrehung) | torsion |
| ねじり応力 | torsional shear stress | esfuerzo cortante por torsión | tensão de cisalhamento por torção | Torsionsspannung | contrainte de torsion (de cisaillement) |
| ねじれ角 | angle of twist | ángulo de torsión | ângulo de torção | Verdrehwinkel (Torsionswinkel) | angle de torsion |
| 断面二次極モーメント | polar second moment of area | momento polar de inercia de área | momento polar de inércia de área | polares Flächenträgheitsmoment | moment quadratique polaire |
| 慣性モーメント（質量の） | (mass) moment of inertia | momento de inercia (de masa) | momento de inércia (de massa) | Massenträgheitsmoment | moment d'inertie (de masse) |
| 横弾性係数（せん断弾性係数） | shear modulus | módulo de rigidez (de cortante) | módulo de cisalhamento | Schubmodul (Gleitmodul) | module de cisaillement (module de Coulomb) |
| 歯車比（減速比） | gear ratio | relación de transmisión | relação de transmissão | Übersetzungsverhältnis | rapport de réduction (de transmission) |
| 歯数 | tooth count | número de dientes | número de dentes | Zähnezahl | nombre de dents |
| かみあい効率 | mesh efficiency | rendimiento del engrane | rendimento do engrenamento | Verzahnungswirkungsgrad | rendement de l'engrènement |
| ベルト伝動 | belt drive | transmisión por correa | transmissão por correia | Riementrieb | transmission par courroie |
| ベルト速度 | belt speed | velocidad de la correa | velocidade da correia | Riemengeschwindigkeit | vitesse de la courroie |
| 駆動プーリ／従動プーリ | driving / driven pulley | polea motriz / conducida | polia motora / movida | treibende / getriebene Riemenscheibe | poulie menante / menée |
| 角加速度 | angular acceleration | aceleración angular | aceleração angular | Winkelbeschleunigung | accélération angulaire |
| 加速トルク | acceleration torque | par de aceleración | torque de aceleração | Beschleunigungsmoment | couple d'accélération |
| はずみ車（フライホイール） | flywheel | volante de inercia | volante de inércia | Schwungrad | volant d'inertie |
| 起動時間 | run-up time | tiempo de arranque | tempo de partida | Hochlaufzeit | temps de démarrage |
| 回転エネルギー | rotational kinetic energy | energía cinética de rotación | energia cinética de rotação | Rotationsenergie | énergie cinétique de rotation |

### 機械要素・締結 (Machine elements & joints)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| ボルト | bolt | perno (tornillo) | parafuso | **Schraube**（`Bolzen` は「ピン」の意味・G節参照） | boulon (vis) |
| 締付けトルク | tightening torque | par de apriete | torque de aperto | Anziehdrehmoment | couple de serrage |
| 軸力（ボルトの初期締付け力） | preload (clamp force) | precarga (fuerza de apriete) | pré-carga (força de aperto) | **Vorspannkraft**（`Vorspannung` にしない・G節参照） | précontrainte (effort de serrage) |
| ナットファクタ K ※要確認 | nut factor K | factor K (factor de par) | fator K | K-Faktor (Reibungsbeiwert) | coefficient de couple K |
| 有効断面積（ボルトの） | tensile stress area | área resistente a tracción | área resistente (de tensão) | Spannungsquerschnitt | section résistante |
| 保証応力 | proof stress | tensión de prueba | tensão de prova | Prüfspannung (ISO 898-1) | contrainte d'épreuve |
| 強度区分 8.8 | property class 8.8 | clase de resistencia 8.8 | classe de resistência 8.8 | Festigkeitsklasse 8.8 | classe de qualité 8.8 |
| 使用率（強度限界に対する） | utilisation (of a strength limit) | grado de aprovechamiento | grau de aproveitamento | Ausnutzungsgrad | taux de travail (taux d'utilisation) |
| すみ肉溶接 | fillet weld | soldadura en ángulo (de filete) | solda de filete | Kehlnaht | soudure d'angle |
| 脚長 | leg length | longitud del cateto | perna (comprimento do cateto) | Schenkellänge (z-Maß) | longueur du côté (cathète) |
| のど厚 | throat thickness | espesor de garganta | espessura da garganta | Nahtdicke (a-Maß) | épaisseur de gorge |
| 圧縮コイルばね | helical compression spring | resorte helicoidal de compresión | mola helicoidal de compressão | Schraubendruckfeder | ressort hélicoïdal de compression |
| ばね定数（ばね剛性） | spring rate | constante (rigidez) del resorte | constante (rigidez) da mola | Federrate（理科の `Federkonstante` と同義・G節参照） | raideur du ressort |
| 線径 | wire diameter | diámetro del alambre | diâmetro do arame | Drahtdurchmesser | diamètre du fil |
| コイル平均径 | mean coil diameter | diámetro medio de la espira | diâmetro médio da espira | mittlerer Windungsdurchmesser | diamètre moyen d'enroulement |
| 有効巻数 | number of active coils | número de espiras activas | número de espiras ativas | Anzahl der federnden Windungen | nombre de spires actives |
| 薄肉圧力容器 | thin-walled pressure vessel | recipiente a presión de pared delgada | vaso de pressão de parede fina | dünnwandiger Druckbehälter | réservoir sous pression à paroi mince |
| 円周応力（フープ応力） | hoop (circumferential) stress | esfuerzo circunferencial | tensão circunferencial | Umfangsspannung (Tangentialspannung) | contrainte circonférentielle |
| 軸方向応力 | longitudinal (axial) stress | esfuerzo longitudinal | tensão longitudinal | Längsspannung | contrainte longitudinale |
| 内圧 | internal pressure | presión interna | pressão interna | Innendruck | pression interne |
| 最小板厚 | minimum wall thickness | espesor mínimo de pared | espessura mínima de parede | Mindestwanddicke | épaisseur minimale de paroi |
| 転がり軸受 | rolling bearing | rodamiento | rolamento | Wälzlager | roulement |
| 玉軸受 | ball bearing | rodamiento de bolas | rolamento de esferas | Kugellager | roulement à billes |
| 基本定格寿命 L10 | basic rating life L10 | vida nominal básica L10 | vida nominal básica L10 | nominelle Lebensdauer L10 | durée de vie nominale L10 |
| 動定格荷重 | basic dynamic load rating | capacidad de carga dinámica | capacidade de carga dinâmica | dynamische Tragzahl | charge dynamique de base |
| 等価荷重 | equivalent (dynamic) load | carga equivalente | carga equivalente | äquivalente Lagerbelastung | charge équivalente |
| 百万回転 | million revolutions | millones de revoluciones | milhões de revoluções | Millionen Umdrehungen | millions de tours |
| キー（平行キー） | key (parallel key) | chaveta (paralela) | chaveta (paralela) | **Passfeder**（`Schlüssel` にしない） | clavette (parallèle) |
| ボス（ハブ） | hub | cubo | cubo | Nabe | moyeu |
| 接線力 | tangential force | fuerza tangencial | força tangencial | Umfangskraft | effort tangentiel |

### 応力・はり (Stress, strain, safety / Beams & columns)

| ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| 主応力 | principal stress | esfuerzo principal | tensão principal | Hauptspannung | contrainte principale |
| モールの円 | Mohr's circle | círculo de Mohr | círculo de Mohr | Mohrscher Spannungskreis | cercle de Mohr |
| 最大せん断応力 | maximum shear stress | esfuerzo cortante máximo | tensão de cisalhamento máxima | maximale Schubspannung | contrainte de cisaillement maximale |
| 安全率 | factor of safety | factor de seguridad | fator (coeficiente) de segurança | Sicherheitsfaktor (Sicherheitsbeiwert) | coefficient de sécurité |
| 許容応力 | allowable stress | esfuerzo admisible | tensão admissível | zulässige Spannung | contrainte admissible |
| 降伏応力（降伏点） | yield strength | límite elástico (de fluencia) | tensão de escoamento | Streckgrenze | limite d'élasticité |
| 軸応力（引張応力） | axial (tensile) stress | esfuerzo axial (de tracción) | tensão axial (de tração) | Zugspannung (Normalspannung) | contrainte axiale (de traction) |
| 伸び | elongation | alargamiento | alongamento | Verlängerung (Dehnung) | allongement |
| ポアソン比 | Poisson's ratio | coeficiente de Poisson | coeficiente de Poisson | Poissonzahl (Querkontraktionszahl) | coefficient de Poisson |
| 横ひずみ | lateral strain | deformación transversal | deformação transversal | Querdehnung | déformation transversale |
| マイクロストレイン（µε） | microstrain (µε) | microdeformación (µε) | microdeformação (µε) | Mikrodehnung (µε) | microdéformation (µε) |
| 熱応力 | thermal stress | esfuerzo térmico | tensão térmica | Wärmespannung | contrainte thermique |
| 拘束（完全拘束） | (fully) constrained | coacción (impedida) | restrição (impedida) | (vollständig) behinderte Dehnung | dilatation (totalement) empêchée |
| 支圧応力 | bearing stress | esfuerzo de aplastamiento | tensão de esmagamento | Lochleibungsspannung | pression diamétrale (matage) |
| 二面せん断 | double shear | doble cortadura (cizalladura doble) | corte duplo (cisalhamento duplo) | zweischnittige Scherung (zweischnittig) | double cisaillement |
| ピン | pin | pasador | pino | Bolzen | axe (goupille) |
| 応力集中 | stress concentration | concentración de esfuerzos | concentração de tensões | Spannungskonzentration (Kerbwirkung) | concentration de contraintes |
| 応力集中係数 K_t | stress concentration factor | factor de concentración de esfuerzos | fator de concentração de tensões | Formzahl (Kerbformzahl) K_t | coefficient de concentration de contraintes K_t |
| 公称応力 | nominal stress | esfuerzo nominal | tensão nominal | Nennspannung | contrainte nominale |
| 正味断面 | net section | sección neta | seção líquida | Restquerschnitt (Nettoquerschnitt) | section nette |
| 疲労き裂 | fatigue crack | grieta por fatiga | trinca por fadiga | Ermüdungsriss | fissure de fatigue |
| 引張材（タイロッド） | tie rod | tirante | tirante | Zugstab (Zuganker) | tirant |
| 細長比 | slenderness ratio | esbeltez (relación de esbeltez) | índice de esbeltez | Schlankheitsgrad | élancement |
| 断面二次半径 | radius of gyration | radio de giro | raio de giração | Trägheitsradius | rayon de giration |
| 座屈応力 | critical (buckling) stress | esfuerzo crítico de pandeo | tensão crítica de flambagem | Knickspannung | contrainte critique de flambement |
| 圧縮材（柱） | strut / column | pilar (barra comprimida) | pilar (barra comprimida) | Druckstab (Stütze) | poteau (barre comprimée) |
| 片持ちはり | cantilever | viga en voladizo | viga em balanço | Kragträger (Kragarm) | poutre en console (encastrée-libre) |
| 固定端 | fixed end | extremo empotrado | extremo engastado | Einspannung (Einspannstelle) | encastrement |
| スパン | span | vano (luz) | vão | Spannweite | portée |
| スパン中央のたわみ | midspan deflection | flecha en el centro del vano | flecha no meio do vão | Durchbiegung in Feldmitte | flèche à mi-portée |
| 先端のたわみ | tip deflection | flecha en el extremo | flecha na extremidade | Durchbiegung am freien Ende | flèche à l'extrémité |
| たわみ制限（スパン/300） | deflection limit (span/300) | límite de flecha (luz/300) | limite de flecha (vão/300) | Durchbiegungsgrenze (l/300) | limite de flèche (portée/300) |
| 曲げモーメント | bending moment | momento flector | momento fletor | Biegemoment | moment fléchissant |
| 曲げ応力 | bending stress | esfuerzo de flexión | tensão de flexão | Biegespannung | contrainte de flexion |
| 曲げ強度（材料の） | bending strength | resistencia a flexión | resistência à flexão | Biegefestigkeit | résistance à la flexion |
| 中立軸 | neutral axis | eje neutro | linha neutra | neutrale Faser (Nulllinie) | axe neutre (fibre neutre) |
| 自重 | self-weight | peso propio | peso próprio | Eigengewicht | poids propre |
| 根太 | floor joist | vigueta (de forjado) | vigota (barrote) | Deckenbalken | solive |
| 検定（合否の判定） | check (pass / fail) | comprobación (cumple / no cumple) | verificação (atende / não atende) | Nachweis (erfüllt / nicht erfüllt) | vérification (satisfait / non satisfait) |
| 強度等級 C24 / 鋼種 S275 | strength class C24 / steel grade S275 | clase resistente C24 / acero S275 | classe de resistência C24 / aço S275 | Festigkeitsklasse C24 / Stahlsorte S275 | classe de résistance C24 / nuance d'acier S275 |
| 圧延形鋼（IPE 200） | rolled section (IPE 200) | perfil laminado (IPE 200) | perfil laminado (IPE 200) | Walzprofil (IPE 200) | profilé laminé (IPE 200) |
| 平鋼 | flat bar | pletina (barra plana) | barra chata | Flachstahl | fer plat (barre plate) |

### 新設カテゴリ名（`source/categories.ts`、現在 en/ja のみ）

新設16件のカテゴリラベルはまだ4言語が入っていない。翻訳時はここを正とする。

| id | ja | en | es | pt-BR | de | fr |
|---|---|---|---|---|---|---|
| electricity-energy | 電気・エネルギー | Electricity & energy | Electricidad y energía | Eletricidade e energia | Elektrizität & Energie | Électricité et énergie |
| electronics | 電子工作 | Hobby electronics | Electrónica para aficionados | Eletrônica para hobby | Hobby-Elektronik | Électronique de loisir |
| solar | 太陽光発電・蓄電 | Solar power & batteries | Energía solar y baterías | Energia solar e baterias | Solarstrom & Batterien | Énergie solaire et batteries |
| hobbies-making | 趣味・ものづくり ※要確認 | Hobbies & making | Aficiones y creación | Hobbies e criação | Hobby & Selbermachen | Loisirs et fabrication |
| photography | 写真・カメラ | Photography | Fotografía | Fotografia | Fotografie | Photographie |
| audio | 音響・オーディオ | Sound & audio | Sonido y audio | Som e áudio | Ton & Audio | Son et audio |
| diy | DIY・住まい | DIY & home improvement | Bricolaje y reformas | Faça você mesmo e reformas | Heimwerken & Renovieren | Bricolage et rénovation |
| printing-3d | 3Dプリンタ | 3D printing | Impresión 3D | Impressão 3D | 3D-Druck | Impression 3D |
| home-life | 暮らし | Home & everyday life | Hogar y vida diaria | Casa e dia a dia | Haushalt & Alltag | Maison et vie quotidienne |
| brewing | コーヒー・自家醸造 | Coffee & home brewing | Café y elaboración casera | Café e produção caseira | Kaffee & Hausbrauen | Café et brassage maison |
| weather | 天気・大気 | Weather & atmosphere | Tiempo y atmósfera | Tempo e atmosfera | Wetter & Atmosphäre | Météo et atmosphère |
| engineering-design | 機械・構造設計 | Mechanical & structural design | Diseño mecánico y estructural | Projeto mecânico e estrutural | Maschinen- & Tragwerksentwurf ※要確認 | Conception mécanique et structurale |
| eng-stress | 応力・ひずみ・安全率 | Stress, strain & safety | Esfuerzo, deformación y seguridad | Tensão, deformação e segurança | Spannung, Dehnung & Sicherheit | Contrainte, déformation et sécurité |
| mechanics-of-materials | はり・柱 | Beams & columns | Vigas y columnas | Vigas e colunas | Balken & Stützen | Poutres et poteaux |
| eng-power | 軸・ねじり・動力伝達 | Shafts, torsion & power transmission | Ejes, torsión y transmisión de potencia | Eixos, torção e transmissão de potência | Wellen, Torsion & Antriebstechnik | Arbres, torsion et transmission de puissance |
| eng-elements | 機械要素・締結 | Machine elements & joints | Elementos de máquinas y uniones | Elementos de máquinas e uniões | Maschinenelemente & Verbindungen | Éléments de machines et assemblages |


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

## D. 判断が分かれた用語 — 迷った理由と、実装での決着

**B節の表が正**（実装済みの訳語と一致させてある）。この節はその訳語を選んだ理由を残すためのもので、B節と食い違う記述があればB節を優先する。`※要確認` が残っている語は今も未確定で、ネイティブレビューの重点対象。

1. **応力（stress）**: スペイン語は地域によって "esfuerzo"（中南米で優勢）と "tensión"（スペインの教科書で併用、ただし"tensión"は電圧とも訳語衝突しうる）が競合。本用語集では esfuerzo を第一候補としたが、翻訳担当が別の一次資料を根拠に tensión を選ぶ可能性がある。**CLAUDE.mdが挙げる「応力」のブレ例そのもの**なので最優先で確認すべき。
2. **電圧（voltage）とドイツ語/スペイン語の訳語衝突**: ドイツ語では「電圧」も「応力」もどちらも文脈で "Spannung" になりうる（力学のSpannung=stress、電気のSpannung=voltage、同一語で意味が別）。スペイン語も「電圧」="tensión (eléctrica)"と「応力」="tensión"が同形になりうる。誤訳ではなく多義語なので実害は小さいが、レビュー時に文脈を混同しないよう注意喚起。
3. **屈折率／スネルの法則の訳語**: ドイツ語で "Brechzahl"（学校教育でよく使われる）と "Brechungsindex"（一般・大学レベル）が競合。**→ 対象読者が高校生なので `Brechzahl` に決着**。スネルの法則は `Brechungsgesetz (Snelliussches Gesetz)` を採用したが、独語名は複数の言い方があり単一の定訳は確認しきれていない（この点は未確定のまま）。
4. **誘導起電力（induced EMF）**: ドイツ語の "induzierte Spannung"（高校物理でよく使う簡易表現）と "induzierte EMK"（大学レベルの正式表現）のレジスター差。**→ 対象読者から `induzierte Spannung` に決着**。es/pt-BR は `fem`、fr は `f.é.m.` と各言語で定着した略記をそのまま使う。
5. **飽和水蒸気量**: 日本の理科教育特有の「1m³あたりの水蒸気の質量[g]」という定義。海外では露点・相対湿度の計算に別のアプローチ（飽和水蒸気圧ベース）を使うことが多く、直訳が現地の教科書表現と一致するか未確認。
6. **震源（epicenter/hypocenter）**: 日本語の「震源」は本来3次元の破壊開始点（＝hypocenter、震央epicenterとは別語）だが、本アプリの文中では「震源までの距離」を地表からの距離として扱っており、英語版もepicenterと訳している。**→ 英語版と実際の計算内容（大森公式が求めるのは震央距離）に合わせて epicenter 系に決着**（`epicentro` / `epicentro` / `Epizentrum` / `épicentre`）。日本語の原義に寄せる案は採らなかった。
7. **初期微動継続時間・大森公式**: 日本の中学理科特有の用語・公式名。海外の地学教育で同じ公式が同名で扱われているか未確認（"S-Pタイム"に相当する語がそのまま定訳として通じるか要確認）。
8. **空走距離／ブレーカー容量／座屈長さ係数／仕事の原理／ベーカーズパーセント**: 日本の教科書・実務でよく使う複合語で、海外の教科書に一語の定訳があるとは限らない。実装時に調べた結果:
   - **ベーカーズパーセント → 4言語すべてに定訳が実在した**（`porcentaje panadero` / `percentual do padeiro` / `Bäckerprozent` / `pourcentage boulanger`）。借用語のままになるという当初の推測は外れ。
   - **空走距離 → es/de/pt-BR は定訳あり**（`distancia de reacción` / `Reaktionsweg` / `distância de reação`）。**仏語のみ一語の定訳がなく**、`distance parcourue pendant le temps de réaction` と説明的に訳した。
   - **ブレーカー容量・座屈長さ係数**はB節の表の語を採用したが、確認できたのは一部の言語だけなので `※要確認` を残している。**仕事の原理**も定訳を確認しきれず `※要確認` のまま。
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

### 2026-09 追加分（新規81ノート）で参照したもの

- [Schärfentiefe oder Tiefenschärfe? (de, Calumet)](https://www.calumet.de/magazin/schaerfentiefe-tiefenschaerfe)
- [Lichtwert – Wikipedia (de)](https://de.wikipedia.org/wiki/Lichtwert)
- [Indice de lumination — Wikipédia (fr)](https://fr.wikipedia.org/wiki/Indice_de_lumination)
- [Kennschalldruck – Wikipedia (de)](https://de.wikipedia.org/wiki/Kennschalldruck)
- [Raummode – Wikipedia (de)](https://de.wikipedia.org/wiki/Raummode)
- [Refraktometer – TDS & Extraktion (de, 19grams)](https://19grams.coffee/blogs/kaffeelexikon/refraktometer)
- [Rendement d'extraction (fr, Le Coffee Lab)](https://lecoffeelab.fr/glossaire/rendement-extraction/)
- [Endvergärungsgrad (de, Hobbybrauer Wiki)](https://hobbybrauer.de/forum/wiki/doku.php/endvergaerungsgrad)
- [Calculadora de ABV / densidade original e final (pt-BR, Maltímetro)](https://maltimetro.com/calculadoras/abv/)
- [La sensación térmica por viento y humedad (es, Meteored)](https://www.meteored.mx/noticias/divulgacion/la-sensacion-termica-por-viento-y-humedad.html)
- [Refroidissement éolien — Wikipédia (fr)](https://fr.wikipedia.org/wiki/Refroidissement_%C3%A9olien)
- [Les calculatrices de refroidissement éolien et humidex (fr, Environnement Canada)](https://meteo.gc.ca/windchill/wind_chill_f.html)
- [Barometrische Höhenformel – Wikipedia (de)](https://de.wikipedia.org/wiki/Barometrische_H%C3%B6henformel)
- [Hora Solar Pico (HSP) (es, Efimarket)](https://efimarket.com/blog/la-hora-solar-pico-hsp-sirve-calcularlo/)
- [Spannungsabfall / Spannungsfall (de, KBE Glossar)](https://www.kbe-elektrotechnik.com/service/fachbegriffe-und-glossar/spannungsabfall-spannungsfall/)
- [Beleuchtungsplanung nach dem Wirkungsgradverfahren (de, licht.de)](https://www.licht.de/de/lichtplanung/planung-in-der-praxis/wirkungsgradverfahren)
- [Farbmenge berechnen – Ergiebigkeit & Verschnitt (de, sanier.de)](https://www.sanier.de/malerarbeiten/farbe/farbmenge-berechnen)
- [Lexique de l'impression 3D (fr, Polyfab3D)](https://www.polyfab3d.fr/ressources/lexique-comprendre-limpression-3d/)
- [Tout savoir sur le couple de serrage (fr, TDI)](https://www.tdi.fr/post/tout-savoir-sur-le-couple-de-serrage)
- [Formelsammlung Passfeder, Stifte, Bolzenverbindung (de, schweizer-fn)](https://www.schweizer-fn.de/maschinenelemente/passfeder-bolzen/passfeder-bolzen.php)
- [Berechnung und Auslegung einer Schweißnahtverbindung / a-Maß (de, schweizer-fn)](https://schweizer-fn.de/maschinenelemente/schweissnaht/schweissverbindung.php)

---

## F. 実装後に判明した訂正の記録

**B節の表とD節はすでにこの節の内容を反映済み**なので、訳語を引くときはB節を見ればよい。この節は「当初の推測が実装時にどう覆ったか」の記録として残す（同じ推測を繰り返さないため）。

この用語集を使って実際に翻訳（PR #22 / #23）した結果、以下は当初の記載を訂正・確定した。

- **ベーカーズパーセント**: D節8で「借用語のままかも」と推測していたが、**4言語すべてに定訳が実在した** — es `porcentaje panadero` / pt-BR `percentual do padeiro` / de `Bäckerprozent` / fr `pourcentage boulanger`。
- **震源**: D節6は `hipocentro` 系（原義のhypocenter）を候補にしていたが、**epicenter系を採用した** — es `epicentro` / de `Epizentrum` / fr `épicentre`。理由は、英語版が既に "epicenter" であり、大森公式が実際に計算しているのは震央距離に相当するため。
- **シャルルの法則**: 独語には `Gesetz von Gay-Lussac`（等圧変化に対して最も頻繁に使われる。[LEIFIphysik](https://www.leifiphysik.de/waermelehre/allgemeines-gasgesetz/grundwissen/gesetz-von-gay-lussac)）・`Gesetz von Charles`・`Charlessches Gesetz` の3通りがあり、いずれも同じ等圧の体積-温度関係を指す（[de.wikipedia: Allgemeine Gasgleichung](https://de.wikipedia.org/wiki/Allgemeine_Gasgleichung)）。**本アプリは `Isobare Zustandsänderung (Gesetz von Gay-Lussac)` を採用**（法則名だけに頼らず、どの状態変化かを併記して曖昧さを避ける方針）。`Gesetz von Charles` / `Charlessches Gesetz` も誤りではないので、既存訳を見かけても直す必要はない。他3言語は「シャルルの法則」の直訳（`ley de Charles` / `lei de Charles` / `loi de Charles`）。
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

---

## G. 新規ドメイン（電子工作・写真・音響・コーヒー・気象・DIY・3Dプリンタ・機械設計）で先に潰しておく罠

2026-09に81件のプリセットを en/ja のみで追加した時点で、**翻訳を分担する前に**洗い出した言語別の注意点。
CLAUDE.md の「多言語化で踏んだ、テストでは検出できない罠」と同じ性質のもの（型チェック・lint・テストが全部通るのに間違っている）だけを挙げる。
**B節の新しい表がこの節の結論を反映済み**なので、訳語を引くだけならB節を見ればよい。

### G-1. ドイツ語 `Spannung` — 今回から「応力」と「電圧」が同じアプリに同居する

これまでは材料力学（応力）と電気（電圧）が別カテゴリに離れていたが、新カテゴリでは
**電子工作・太陽光（電圧）と応力・ひずみ／機械要素（応力）が同じカテゴリグリッドに並ぶ**。
`Spannung` 一語だとどちらか読めないので、次のルールで統一する。

- **裸の `Spannung` をノートのタイトル・手順名に使わない。** 必ず複合語か限定語を付ける。
  - 機械: `Biegespannung`, `Schubspannung`, `Torsionsspannung`, `Umfangsspannung`, `Längsspannung`,
    `Zugspannung`, `Nennspannung`, `Hauptspannung`, `Wärmespannung`, `Lochleibungsspannung`,
    `zulässige Spannung`, `Knickspannung`。
  - 電気: `Ausgangsspannung`, `Eingangsspannung`, `Systemspannung`, `Spannungsteiler`,
    `Spannungsabfall`。本文で一般名詞として最初に出すときだけ `elektrische Spannung` と書く。
- **`Vorspannung` を「ボルトの軸力」に使わない。** ボルトの軸力は力（kN）なので **`Vorspannkraft`**（VDI 2230の語）にする。
  `Vorspannung` はコンクリートのプレストレスや電気的バイアスにもなり、しかも `Spannung` を含むので二重に紛らわしい。
- 頭が同じでも別分野の語がある: `Spannungskonzentration`（応力集中・機械）と `Spannungsteiler`（分圧・電気）。
  **どちらのカテゴリのノートを訳しているかを確認してから語を選ぶ。**
- 電気の抵抗まわり: `Widerstand`（抵抗）と `Blindwiderstand`（リアクタンス）を混ぜない。
  `spezifischer Widerstand` は抵抗率で、`Widerstand` とは別量。
- `Spannungsabfall` と `Spannungsfall`: VDEの規格語は `Spannungsfall`、一般・実務で通りがよいのは `Spannungsabfall`
  （[KBE用語集](https://www.kbe-elektrotechnik.com/service/fachbegriffe-und-glossar/spannungsabfall-spannungsfall/)）。
  **一般ユーザー向けの本アプリでは `Spannungsabfall` に統一**し、両方を混ぜない。

### G-2. スペイン語・ポルトガル語の「応力／電圧」— es は逃げられるが pt-BR は逃げられない

- **es**: B節の既定どおり、**電圧＝`voltaje` / 応力＝`esfuerzo`** を維持する。`tensión` はどちらにも使えてしまうので**新規ファイルでは使わない**
  （`esfuerzo admisible`, `esfuerzo principal`, `esfuerzo de flexión`）。`tensión admisible` 等も誤りではないが、混在させると読者が判別できなくなる。
- **pt-BR**: 応力も電圧も `tensão` で、**pt-BR には逃げ道がない**（`voltagem` は口語的で技術文には使わない）。
  そこで**限定語で必ず区別する**: 電気は `tensão elétrica` / `tensão de entrada` / `tensão de saída` / `queda de tensão`、
  機械は `tensão de flexão` / `tensão de cisalhamento` / `tensão admissível` / `tensão principal`。
  **裸の `tensão` をタイトルにしない。**
- **pt-BR の `esforço` は「応力」ではない。** 既存の用語集どおり `esforço cortante`（せん断力）のように**断面力**に使う語で、
  応力（単位面積あたり）は `tensão`。es の `esfuerzo`（＝応力）とは意味がずれるので、es→pt を直訳しないこと。
- **es の `esfuerzo` は日常語では「努力」。** フィットネス・DIYの地の文で「力を入れる」の意味に読めてしまう文脈では言い換える。

### G-3. フランス語 `densité` と `masse volumique` — 今回は「`densité` が正しい唯一の場所」がある

A節のルール（単位付きの密度は必ず `masse volumique`）は今回さらに効く。

- **天気ノートの「空気の密度」は kg/m³ なので `masse volumique de l'air`。`densité de l'air` は誤訳。**
  コンクリート・木材・フィラメント・水（コーヒー）の ρ も同じく `masse volumique`。
- **例外: 醸造ノートの OG / FG は無次元の相対密度（1.050 など）なので、フランス語では `densité` が正しい。**
  `densité initiale (OG)` / `densité finale (FG)`。ここだけは `masse volumique` にしないこと
  （[Masse volumique — Wikipédia](https://fr.wikipedia.org/wiki/Masse_volumique)）。
  アプリ全体で「`densité` は醸造ノートだけ」と覚えておくと迷わない。

### G-4. 写真用語 — 4言語とも定訳があるので英語のまま残さない

「写真用語は英語のままのことが多い」は今回の6言語には当てはまらない。**下記はすべて現地語に訳す。**

- **de の被写界深度は `Schärfentiefe`。** `Tiefenschärfe` は口語で広く使われるが、DIN 19040-3 とDudenの見出し語は `Schärfentiefe`
  （[Calumet](https://www.calumet.de/magazin/schaerfentiefe-tiefenschaerfe) / [Sir Apfelot](https://www.sir-apfelot.de/heisst-es-schaerfentiefe-oder-tiefenschaerfe-26547/)）。
  語構成上も「Schärfe の Tiefe」が正しい。**`Tiefenschärfe` を使わない。**
- **EV（露出値）の現地語**: de `Lichtwert (LW)`（[de.wikipedia: Lichtwert](https://de.wikipedia.org/wiki/Lichtwert)）、
  fr **`indice de lumination (IL)`**（[fr.wikipedia: Indice de lumination](https://fr.wikipedia.org/wiki/Indice_de_lumination)）、
  es `valor de exposición (EV)`、pt-BR `valor de exposição (EV)`。
  **`EV` という記号自体（式・LaTeX・手順名の中）は翻訳しない**。地の文で `Lichtwert (EV)` / `indice de lumination (IL ou EV)` のように併記する。
- **fr の絞りまわりは3語が別物**: `ouverture`（開口＝絞りそのもの）、`nombre d'ouverture`（F値＝数値のN）、
  `diaphragme`（機構としての絞り羽根、口語で「1 diaph」＝1段）。**F値を `diaphragme` と訳さない。**
- **de**: F値 `Blendenzahl`、絞り `Blende`、シャッター速度 `Belichtungszeit`（`Verschlusszeit` も可だがどちらかに統一）、
  ガイドナンバー `Leitzahl (LZ)`、画角 `Bildwinkel`、フルサイズ `Kleinbild`/`Vollformat`。
- **英語のまま残してよいのは、現地語の定訳が実際に無いものだけ**: `full frame`（併記可）、`startrails`、`NPF`、`TDS`、`hotend`、`cold brew`。
  「500ルール」「NPFルール」は名前なので `règle des 500` / `500er-Regel` のように**ルールの語だけ訳す**。

### G-5. 「体感温度」が es / pt-BR / de で1語に潰れる（同一カテゴリに2ノート並ぶ）

天気カテゴリには**ウィンドチル**と**蒸し暑さの体感温度**の2ノートがあり、素直に訳すと衝突する。

- **es**: どちらも `sensación térmica` になる（[Meteored](https://www.meteored.mx/noticias/divulgacion/la-sensacion-termica-por-viento-y-humedad.html)）。
  → 風の方を `Sensación térmica por viento (windchill)`、暑さの方を `Temperatura aparente (calor y humedad)` と**必ず限定する**。
- **pt-BR**: 同様に `sensação térmica` が衝突する。→ `Sensação térmica pelo vento (windchill)` / `Temperatura aparente (calor e umidade)`。
- **de**: どちらも `gefühlte Temperatur` になりうる。→ 風は `Windchill(-Temperatur)`、暑さは `gefühlte Temperatur (Hitze und Luftfeuchte)`。
- **fr は衝突しない**（`refroidissement éolien` と `température ressentie`。[Environnement Canada](https://meteo.gc.ca/windchill/wind_chill_f.html)）。
  ただし**`humidex` を使わないこと**。humidexはカナダ独自の別指数で係数が違い、このノートが実装しているのは Steadman/BOM の Apparent Temperature。
- **`peak sun hours` も同種の罠**: 「日照時間 / Sonnenstunden / heures d'ensoleillement」だけに訳すと、
  気象でいう日照時間（直達日射がある時間）という**別の量**になる。1 kW/m² 換算の時間だと分かる語（HSP / Peak-Sonnenstunden / heures de plein soleil）にする。

### G-6. コーヒー・醸造の借用語は「訳すもの／残すもの」を決めておく

- **残す（4言語とも現地でそのまま通る）**: `TDS`, `espresso`, `cold brew`, `barista`, `ABV`, `OG`, `FG`。
- **訳す（4言語とも定訳が実在した）**: 抽出比率・抽出収率・ドーズ・流量・原液・希釈・見かけの発酵度。
  fr は [Le Coffee Lab](https://lecoffeelab.fr/glossaire/rendement-extraction/) で `ratio d'extraction` / `rendement d'extraction`、
  de は [19grams](https://19grams.coffee/blogs/kaffeelexikon/refraktometer) で `Brührverhältnis` / `Extraktionsausbeute`、
  pt-BR は `proporção café-água` / `rendimento de extração`（[Maltímetro](https://maltimetro.com/calculadoras/abv/)）。
- **ドイツ語の最大の罠: OG を `Stammwürze`、FG を `Restextrakt` と訳さない。**
  ドイツの自家醸造では `Stammwürze` / `Restextrakt` は **°Plato（12.4 °P など）で表す量**で、
  本ノートの定数は**比重（1.050 / 1.010）**（[Hobbybrauer Wiki](https://hobbybrauer.de/forum/wiki/doku.php/endvergaerungsgrad)）。
  `Stammwürze` と書くと読者は 12.4 を入力し、131.25 の式が**エラーも出さずに桁違いの答え**を返す。
  → `Anfangsdichte (OG)` / `Enddichte (FG)` を使い、必要なら「als spezifisches Gewicht, z. B. 1,050」と補う。
  `scheinbarer Vergärungsgrad`（見かけの発酵度）はそのままドイツ語の定訳でよい。
- fr / es / pt-BR は比重（1.050形式）が一般的なので同じ問題は起きないが、**°Brix / °Plato に読み替えない**点は同じ。
- ABV: fr は法定表現が `titre alcoométrique volumique (% vol)`、口語が `degré d'alcool`。es `graduación alcohólica (% vol)`、
  pt-BR `teor alcoólico (% ABV)`、de `Alkoholgehalt (Vol.-%)`。

### G-7. 記号・略号・規格名は翻訳しない

- **単位記号・数式記号は従来どおり不変**（A節）。今回新しく増えたぶんも同じ: `dB`, `lx`, `lm`, `mA·h`, `A·h`, `mm³/s`, `ppm`, `µε`。
- **略号もラテン文字のまま残す**: `EV`, `ISO`, `TDS`, `OG`, `FG`, `ABV`, `DoD`, `SoC`, `PSH`, `UF`, `MF`, `L10`, `K_t`, `GN`, `EM`。
  現地の略号（es `HSP`、fr `IL`、de `LW`、es/pt `NG`）は**括弧で併記**してよいが、式・LaTeX・定数名に出てくる記号は絶対に触らない。
- **es では `decibelio` が RAE の語形だが、記号は `dB` のまま**（既存の `ohmio` / `vatio` と同じ方針）。
- **規格・材料・型番も訳さない**: `EN 12464-1`, `ISO 898-1`, `ASTM A36`, `S275`, `C24`, `IPE 200`, `M12`, `8.8`, `E3D V6`, `PLA/PETG/ABS`。
  pt-BR の照明規格は本来 NBR ISO/CIE 8995-1 だが、**ノートが引用しているのは EN 12464-1 の 500 lx なので規格名を差し替えない**
  （名前だけ差し替えると出典の付け替えになる）。
- **`hp` / 9550 / 5252 も数値のまま**。動力伝達ノートの「9550 や 5252 が消える」という説明は換算定数の話なので、
  D節9の `hp`（英馬力）を `PS` / `CV`（メートル馬力）に読み替えない。

### G-8. 同じ英単語が別の意味で3回出てくる — "utilisation" と "J"

- **"utilisation"**:
  1. 電子工作・3Dプリンタ・ボルト＝「定格（限界）のうち何%使っているか」→ de `Ausnutzungsgrad` / fr `taux d'utilisation`（ボルトは `taux de travail`）/ es `grado de aprovechamiento` / pt-BR `grau de aproveitamento`。
  2. 照明の `utilisation factor (UF)`＝**光束法の設計係数**（別概念）→ de **`Raumwirkungsgrad`** / fr `facteur d'utilance` / es `factor de utilización` / pt-BR `fator de utilização`。
  **1と2に同じ語を当てないこと。**
- **`J` が2つの量を指す**（`source/engineering-power.ts`）:
  - ねじりのノート＝**断面二次極モーメント**（mm⁴）→ de `polares Flächenträgheitsmoment` / fr `moment quadratique polaire`。
  - はずみ車のノート＝**質量の慣性モーメント**（kg·m²）→ de `Massenträgheitsmoment` / fr `moment d'inertie`。
  **fr は特に注意**: `moment d'inertie` は普通「質量の」慣性モーメントを指すので、ねじりのノートを
  `moment d'inertie polaire` と訳すとB節の `moment quadratique` と食い違う。
- **de の `Federrate` と `Federkonstante`** は同じ量。理科のばね（B節・力学）は `Federkonstante` のまま、
  機械要素のコイルばねは業界語の `Federrate` を使う。**どちらかに一本化したいレビュアーは `Federkonstante` に寄せてよい**（誤りではない）。
  逆に理科側を `Federrate` に変えるのはレジスターが合わないので避ける。

### G-9. 分野をまたぐ偽の友 (false friends)

- **de `Bolzen` は bolt ではない。** ねじ部品（M12 8.8 のボルト）は **`Schraube`**、
  応力ノートの「二面せん断を受ける Ø16 のピン」が **`Bolzen`**。この2つは隣り合うカテゴリにあるので、取り違えると2ノートが入れ替わる。
  es: bolt=`perno/tornillo` / pin=`pasador`、pt-BR: `parafuso` / `pino`、fr: `boulon` / `axe`。
- **de キー（軸とボスの締結）は `Passfeder`。** `Schlüssel`（鍵）ではない。es/pt-BR `chaveta`、fr `clavette`。
- **fr の torque は `couple`。** 英語の `torque` はフランス語では別語（装身具・解剖）。締付けトルクは `couple de serrage`
  （[TDI](https://www.tdi.fr/post/tout-savoir-sur-le-couple-de-serrage)）。内部のねじりモーメントを指すときだけ `moment de torsion` が使える。
- **es のトルクは地域差** — スペインは `par (de torsión)`、中南米は `torque`。本用語集は中立方針なので
  `par de torsión (torque)` を初出で併記し、以降 `par` に統一する案を第一候補とした（`※要確認`）。
- **de のスピーカー能率は `Kennschalldruck`。** `Wirkungsgrad` は%で表す**別の量**（電気→音響の効率）で、
  ドイツ語のオーディオ記事では両者が混用されているが、dB/W/m の値は `Kennschalldruck`
  （[de.wikipedia: Kennschalldruck](https://de.wikipedia.org/wiki/Kennschalldruck)）。
  なお**日本語原文の「能率」も厳密には出力音圧レベルの意味で使っている**ので、翻訳は日本語ではなく英語の "sensitivity" に従うこと。
- **de の照度は `Beleuchtungsstärke`**（`Helligkeit` は主観的な明るさで別物）。光束は `Lichtstrom`。
  光束法は **`Wirkungsgradverfahren`** が定訳で、直訳の「Lumen-Methode」は使わない
  （[licht.de](https://www.licht.de/de/lichtplanung/planung-in-der-praxis/wirkungsgradverfahren)）。
- **de の DIY 用語は専用語がある**: 塗布率＝`Ergiebigkeit`（m²/l）、ロス率＝`Verschnitt`、柄のリピート＝`Rapport`。
  一般語（`Abdeckung`, `Abfall`, `Wiederholung`）に訳すと通じない。
- **pt-BR は BR 語形に統一**: `alto-falante`（×`altifalante`）、`paquímetro`（×`craveira`）、`bico`（ノズル）、`demão`（塗り重ね1回）。
- **fr の `rendement`** は文脈で「効率」「収率」「塗布率」のいずれにもなる。同じノート内で複数の `rendement` が並ぶときは
  `rendement du système` / `rendement d'extraction` / `rendement (m²/L)` のように必ず限定する。

### G-10. 地域差のある数値は「訳さない・直さない」

- DIYの塗料ノートは英語原文が「1回塗りで 10〜12 m²/L」としているが、独仏の市販品のデータシートは 6〜8 m²/l が普通
  （[sanier.de](https://www.sanier.de/malerarbeiten/farbe/farbmenge-berechnen)）。
  **定数 `c = 11 m²/L` と地の文の数値は必ず一致させる必要があるので、翻訳側で数値を「直さない」。**
  原文の「製品のデータシートで確認してください」の一文は必ず残すこと。
- 壁紙の「ヨーロッパ標準ロール 0.53 m × 10.05 m」、照明の「500 lx」、ボルトの「84.3 mm² / 640 MPa」なども同じ。
  **数値・単位・型番は原文のまま**にし、翻訳するのは説明文だけ。

### G-11. 「単位を付けずに数値だけ入れる」という但し書きは省略できない

新規ノートには、**その一文を落とすと答えが黙って狂う**説明文がいくつかある。訳文を短くまとめる際に消さないこと。

- 天気の露点・ウィンドチル・体感温度: "T is the air temperature **as a plain number in °C**"（「T は摂氏の数値をそのまま入れます」）。
  これらは摂氏の数値を係数に掛ける経験式で、`°C` はオフセット付き単位なので `25°C` と入力すると 298.15 K として評価され、
  **エラーにならずに別の答えが出る**。「en °C」「in °C」だけに縮めず、「単位を付けずに数値だけ」というニュアンスを必ず残す。
  逆に空気の密度ノートは「ここでの温度は本当の絶対温度なので ℃・℉・K のどれで入れてもよい」と**逆のことを言っている**ので、
  2つのノートで説明を使い回さない。
- 音響の全ノート: "The results marked dB are **plain numbers** — decibels are a logarithmic ratio, not a unit"。
  この電卓に dB という単位は無いので、この断りが無いと利用者は `85dB` と入力して詰まる。
- 壁紙のロール数: "Round the strip count up, the strips-per-roll count down, and the final roll count up — **step 3 ignores that rounding**"。
  切り上げ／切り捨ての向きと、手順3が下限であることの両方を残す。
- 3Dプリンタの吐出量: "Exceeding the limit shows up as **under-extrusion, not as an error**"。
- ボルト・ばね・軸受など設計系: 「〜が目安」「〜で確認してください」の逃げの一文を落とさない（数値をそのまま設計に使われるのを避けるため）。
