import type { NotebookSeed } from "../types";

/**
 * 「軸・ねじり・動力伝達」。回転数（rpm）を本物の単位として扱えるので、教科書の9550・5252・/60
 * といった換算定数を持ち出さずに、動力・トルク・回転数をそのまま行き来できる。
 * 記号は T（トルク）・n（回転数）・J（断面二次極モーメント／慣性モーメント）で統一している。
 */
export const ENG_POWER_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Power, torque and rotational speed", ja: "動力・トルク・回転数", es: "Potencia, par de torsión y velocidad de rotación", "pt-BR": "Potência, torque e velocidade de rotação", de: "Leistung, Drehmoment und Drehzahl", fr: "Puissance, couple et vitesse de rotation" },
    description: { en: "Convert between shaft power, torque and rotational speed in either direction. The familiar 9550 (kW, N·m, rpm) and 5252 (hp, lb-ft, rpm) constants disappear here, because rpm is a real unit rather than a bare number: the formula stays P = 2πnT and the units do the conversion themselves.", ja: "軸の動力・トルク・回転数を、どちらの向きにも換算します。ここではrpmを本物の単位として扱うため、おなじみの9550（kW・N·m・rpm）や5252（hp・lb-ft・rpm）といった換算定数は出てきません。式は P = 2πnT のままで、換算は単位が引き受けます。", es: "Convierte en ambos sentidos entre la potencia en el eje, el par de torsión (torque) y la velocidad de rotación. Aquí desaparecen las conocidas constantes 9550 (kW, N·m, rpm) y 5252 (hp, lb-ft, rpm), porque rpm es una unidad real y no un número sin unidades: la fórmula sigue siendo P = 2πnT y la conversión la hacen las propias unidades.", "pt-BR": "Converta nos dois sentidos entre a potência no eixo, o torque e a velocidade de rotação. Aqui desaparecem as conhecidas constantes 9550 (kW, N·m, rpm) e 5252 (hp, lb-ft, rpm), porque rpm é uma unidade de verdade e não um número puro: a fórmula continua sendo P = 2πnT e a conversão fica por conta das próprias unidades.", de: "Rechnet Wellenleistung, Drehmoment und Drehzahl in beide Richtungen ineinander um. Die bekannten Konstanten 9550 (kW, N·m, rpm) und 5252 (hp, lb-ft, rpm) entfallen hier, weil rpm eine echte Einheit ist und keine bloße Zahl: Die Formel bleibt P = 2πnT, und die Umrechnung übernehmen die Einheiten selbst.", fr: "Convertir dans les deux sens entre la puissance à l'arbre, le couple et la vitesse de rotation. Les constantes bien connues 9550 (kW, N·m, rpm) et 5252 (hp, lb-ft, rpm) disparaissent ici, car rpm est une véritable unité et non un simple nombre : la formule reste P = 2πnT et ce sont les unités qui font la conversion." },
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
      { title: { en: "Shaft power P", ja: "軸動力 P", es: "Potencia en el eje P", "pt-BR": "Potência no eixo P", de: "Wellenleistung P", fr: "Puissance à l'arbre P" }, expression: "2*pi*n₁*T₁", targetUnit: "kW", formulaLatex: "P = 2\\pi n_1 T_1" },
      { title: { en: "Torque T from power and speed", ja: "動力と回転数から求めるトルク T", es: "Par de torsión T a partir de la potencia y la velocidad de rotación", "pt-BR": "Torque T a partir da potência e da velocidade de rotação", de: "Drehmoment T aus Leistung und Drehzahl", fr: "Couple T à partir de la puissance et de la vitesse de rotation" }, expression: "P₂/(2*pi*n₂)", targetUnit: "N*m", formulaLatex: "T = \\dfrac{P_2}{2\\pi n_2}" },
    ],
  },
  {
    title: { en: "Torsional shear stress in a solid shaft", ja: "中実軸のねじり応力", es: "Esfuerzo cortante por torsión en un eje macizo", "pt-BR": "Tensão de cisalhamento por torção em um eixo maciço", de: "Torsionsspannung in einer Vollwelle", fr: "Contrainte de torsion dans un arbre plein" },
    description: { en: "Compute the polar second moment of area of a solid round shaft and the torsional shear stress at its surface, where the stress is highest.", ja: "中実丸軸の断面二次極モーメントと、応力が最大になる外表面でのねじり応力を求めます。", es: "Calcula el momento polar de inercia de área de un eje macizo de sección circular y el esfuerzo cortante por torsión en su superficie, donde el esfuerzo es máximo.", "pt-BR": "Calcule o momento polar de inércia de área de um eixo maciço de seção circular e a tensão de cisalhamento por torção na sua superfície, onde a tensão é máxima.", de: "Berechnet das polare Flächenträgheitsmoment einer runden Vollwelle und die Torsionsspannung an ihrer Oberfläche, wo die Spannung am größten ist.", fr: "Calculer le moment quadratique polaire d'un arbre plein de section circulaire et la contrainte de torsion à sa surface, là où la contrainte est maximale." },
    localConstants: [
      { symbol: "T", expression: "250N*m" },
      { symbol: "d", expression: "30mm" },
      { symbol: "J", expression: "pi*d^4/32" },
    ],
    steps: [
      { title: { en: "Polar second moment of area J", ja: "断面二次極モーメント J", es: "Momento polar de inercia de área J", "pt-BR": "Momento polar de inércia de área J", de: "Polares Flächenträgheitsmoment J", fr: "Moment quadratique polaire J" }, expression: "J", targetUnit: "mm^4", formulaLatex: "J = \\dfrac{\\pi d^4}{32}" },
      { title: { en: "Torsional shear stress τ", ja: "ねじり応力 τ", es: "Esfuerzo cortante por torsión τ", "pt-BR": "Tensão de cisalhamento por torção τ", de: "Torsionsspannung τ", fr: "Contrainte de torsion τ" }, expression: "T*d/(2*J)", targetUnit: "MPa", formulaLatex: "\\tau = \\dfrac{Tr}{J} = \\dfrac{Td}{2J}" },
    ],
  },
  {
    title: { en: "Angle of twist of a shaft", ja: "軸のねじれ角", es: "Ángulo de torsión de un eje", "pt-BR": "Ângulo de torção de um eixo", de: "Verdrehwinkel einer Welle", fr: "Angle de torsion d'un arbre" },
    description: { en: "Compute how far one end of a shaft twists relative to the other under torque. The same expression is shown in radians and in degrees, since the answer is easier to judge in degrees.", ja: "トルクを受けた軸の一端が、他端に対してどれだけねじれるかを求めます。同じ式をラジアンと度の両方で表示しています（大きさの見当をつけるには度の方が読みやすいため）。", es: "Calcula cuánto gira un extremo del eje respecto del otro cuando se le aplica un par de torsión. La misma expresión se muestra en radianes y en grados, porque el resultado es más fácil de valorar en grados.", "pt-BR": "Calcule quanto uma extremidade do eixo gira em relação à outra sob a ação de um torque. A mesma expressão é mostrada em radianos e em graus, porque o resultado é mais fácil de avaliar em graus.", de: "Berechnet, wie weit sich ein Wellenende unter Drehmoment gegenüber dem anderen verdreht. Derselbe Ausdruck wird in Radiant und in Grad angezeigt, weil sich das Ergebnis in Grad leichter einschätzen lässt.", fr: "Calculer de combien une extrémité de l'arbre tourne par rapport à l'autre sous l'effet d'un couple. La même expression est affichée en radians et en degrés, car le résultat est plus facile à apprécier en degrés." },
    localConstants: [
      { symbol: "T", expression: "250N*m" },
      { symbol: "L", expression: "1m" },
      { symbol: "G", expression: "79GPa" },
      { symbol: "d", expression: "30mm" },
      { symbol: "J", expression: "pi*d^4/32" },
    ],
    steps: [
      { title: { en: "Angle of twist θ (radians)", ja: "ねじれ角 θ（ラジアン）", es: "Ángulo de torsión θ (radianes)", "pt-BR": "Ângulo de torção θ (radianos)", de: "Verdrehwinkel θ (Radiant)", fr: "Angle de torsion θ (radians)" }, expression: "T*L/(G*J)", targetUnit: "rad", formulaLatex: "\\theta = \\dfrac{TL}{GJ}" },
      { title: { en: "Angle of twist θ (degrees)", ja: "ねじれ角 θ（度）", es: "Ángulo de torsión θ (grados)", "pt-BR": "Ângulo de torção θ (graus)", de: "Verdrehwinkel θ (Grad)", fr: "Angle de torsion θ (degrés)" }, expression: "T*L/(G*J)", targetUnit: "deg", formulaLatex: "\\theta = \\dfrac{TL}{GJ}" },
    ],
  },
  {
    title: { en: "Hollow shaft: polar moment and shear stress", ja: "中空軸の断面二次極モーメントとねじり応力", es: "Eje hueco: momento polar de inercia de área y esfuerzo cortante", "pt-BR": "Eixo oco: momento polar de inércia de área e tensão de cisalhamento", de: "Hohlwelle: polares Flächenträgheitsmoment und Schubspannung", fr: "Arbre creux : moment quadratique polaire et contrainte de cisaillement" },
    description: { en: "Compute the polar second moment of area and the surface shear stress of a hollow shaft. Carrying the same 250 N·m, a Ø40/Ø30 tube sees about 29.10 MPa against 47.16 MPa for the solid Ø30 shaft: the material near the axis barely contributes to torsional strength, so removing it buys weight savings cheaply.", ja: "中空軸の断面二次極モーメントと、外表面のせん断応力を求めます。同じ250N·mを伝えるとき、Ø40/Ø30の中空軸は約29.10MPaで、中実Ø30軸の47.16MPaより低くなります。軸心の近くの材料はねじり強度にほとんど寄与しないため、そこを抜くと軽量化の効率が良いことがわかります。", es: "Calcula el momento polar de inercia de área y el esfuerzo cortante en la superficie de un eje hueco. Transmitiendo los mismos 250 N·m, un tubo Ø40/Ø30 alcanza unos 29,10 MPa frente a los 47,16 MPa del eje macizo Ø30: el material cercano al eje apenas contribuye a la resistencia a la torsión, así que quitarlo permite aligerar a bajo costo.", "pt-BR": "Calcule o momento polar de inércia de área e a tensão de cisalhamento na superfície de um eixo oco. Transmitindo os mesmos 250 N·m, um tubo Ø40/Ø30 chega a cerca de 29,10 MPa contra 47,16 MPa do eixo maciço Ø30: o material próximo ao eixo quase não contribui para a resistência à torção, então removê-lo permite reduzir peso a baixo custo.", de: "Berechnet das polare Flächenträgheitsmoment und die Schubspannung an der Oberfläche einer Hohlwelle. Bei denselben 250 N·m erreicht ein Rohr Ø40/Ø30 etwa 29,10 MPa gegenüber 47,16 MPa bei der Vollwelle Ø30: Der Werkstoff nahe der Achse trägt kaum zur Torsionsfestigkeit bei, sein Weglassen spart also günstig Gewicht.", fr: "Calculer le moment quadratique polaire et la contrainte de cisaillement en surface d'un arbre creux. Pour le même couple de 250 N·m, un tube Ø40/Ø30 atteint environ 29,10 MPa contre 47,16 MPa pour l'arbre plein Ø30 : la matière proche de l'axe ne contribue presque pas à la résistance à la torsion, la retirer permet donc d'alléger à peu de frais." },
    localConstants: [
      { symbol: "D", expression: "40mm" },
      { symbol: "d", expression: "30mm" },
      { symbol: "T", expression: "250N*m" },
      { symbol: "J", expression: "pi*(D^4-d^4)/32" },
    ],
    steps: [
      { title: { en: "Polar second moment of area J", ja: "断面二次極モーメント J", es: "Momento polar de inercia de área J", "pt-BR": "Momento polar de inércia de área J", de: "Polares Flächenträgheitsmoment J", fr: "Moment quadratique polaire J" }, expression: "J", targetUnit: "mm^4", formulaLatex: "J = \\dfrac{\\pi (D^4 - d^4)}{32}" },
      { title: { en: "Torsional shear stress τ at the outer surface", ja: "外表面のねじり応力 τ", es: "Esfuerzo cortante por torsión τ en la superficie exterior", "pt-BR": "Tensão de cisalhamento por torção τ na superfície externa", de: "Torsionsspannung τ an der Außenfläche", fr: "Contrainte de torsion τ à la surface extérieure" }, expression: "T*D/(2*J)", targetUnit: "MPa", formulaLatex: "\\tau = \\dfrac{TD}{2J}" },
    ],
  },
  {
    title: { en: "Gear ratio, output speed and torque", ja: "歯車比・出力回転数・出力トルク", es: "Relación de transmisión, velocidad de salida y par de salida", "pt-BR": "Relação de transmissão, rotação de saída e torque de saída", de: "Übersetzungsverhältnis, Abtriebsdrehzahl und Abtriebsdrehmoment", fr: "Rapport de réduction, vitesse de sortie et couple de sortie" },
    description: { en: "Compute the ratio of a single reduction stage from the tooth counts, then the output speed and the output torque, the latter reduced by the mesh efficiency.", ja: "歯数から1段減速の歯車比を求め、続けて出力回転数と、かみあい効率を見込んだ出力トルクを計算します。", es: "Calcula la relación de transmisión de una etapa de reducción a partir del número de dientes y, a continuación, la velocidad de salida y el par de salida, este último reducido por el rendimiento del engrane.", "pt-BR": "Calcule a relação de transmissão de um estágio de redução a partir do número de dentes e, em seguida, a rotação de saída e o torque de saída, este último reduzido pelo rendimento do engrenamento.", de: "Berechnet aus den Zähnezahlen das Übersetzungsverhältnis einer einstufigen Untersetzung und daraus die Abtriebsdrehzahl sowie das Abtriebsdrehmoment, letzteres vermindert um den Verzahnungswirkungsgrad.", fr: "Calculer le rapport de réduction d'un étage à partir des nombres de dents, puis la vitesse de sortie et le couple de sortie, ce dernier diminué par le rendement de l'engrènement." },
    localConstants: [
      { symbol: "z₁", expression: "20" },
      { symbol: "z₂", expression: "60" },
      { symbol: "n₁", expression: "1450rpm" },
      { symbol: "T₁", expression: "36N*m" },
      { symbol: "η", expression: "0.97" },
    ],
    steps: [
      { title: { en: "Gear ratio i", ja: "歯車比 i", es: "Relación de transmisión i", "pt-BR": "Relação de transmissão i", de: "Übersetzungsverhältnis i", fr: "Rapport de réduction i" }, expression: "z₂/z₁", targetUnit: "", formulaLatex: "i = \\dfrac{z_2}{z_1}" },
      { title: { en: "Output speed n₂", ja: "出力回転数 n₂", es: "Velocidad de salida n₂", "pt-BR": "Rotação de saída n₂", de: "Abtriebsdrehzahl n₂", fr: "Vitesse de sortie n₂" }, expression: "n₁*z₁/z₂", targetUnit: "rpm", formulaLatex: "n_2 = \\dfrac{n_1 z_1}{z_2}" },
      { title: { en: "Output torque T₂", ja: "出力トルク T₂", es: "Par de salida T₂", "pt-BR": "Torque de saída T₂", de: "Abtriebsdrehmoment T₂", fr: "Couple de sortie T₂" }, expression: "T₁*(z₂/z₁)*η", targetUnit: "N*m", formulaLatex: "T_2 = T_1 \\dfrac{z_2}{z_1} \\eta" },
    ],
  },
  {
    title: { en: "Belt drive: belt speed and driven pulley speed", ja: "ベルト伝動のベルト速度と従動プーリ回転数", es: "Transmisión por correa: velocidad de la correa y de la polea conducida", "pt-BR": "Transmissão por correia: velocidade da correia e rotação da polia movida", de: "Riementrieb: Riemengeschwindigkeit und Drehzahl der getriebenen Riemenscheibe", fr: "Transmission par courroie : vitesse de la courroie et vitesse de la poulie menée" },
    description: { en: "Compute the linear speed of the belt at the driving pulley and the speed of the driven pulley from the two pulley diameters.", ja: "駆動プーリでのベルト速度と、2つのプーリ径から決まる従動プーリの回転数を求めます。", es: "Calcula la velocidad lineal de la correa en la polea motriz y la velocidad de giro de la polea conducida a partir de los diámetros de las dos poleas.", "pt-BR": "Calcule a velocidade linear da correia na polia motora e a rotação da polia movida a partir dos diâmetros das duas polias.", de: "Berechnet die Umfangsgeschwindigkeit des Riemens an der treibenden Riemenscheibe und die Drehzahl der getriebenen Riemenscheibe aus den beiden Scheibendurchmessern.", fr: "Calculer la vitesse linéaire de la courroie au niveau de la poulie menante et la vitesse de rotation de la poulie menée à partir des diamètres des deux poulies." },
    localConstants: [
      { symbol: "D₁", expression: "100mm" },
      { symbol: "D₂", expression: "250mm" },
      { symbol: "n₁", expression: "1450rpm" },
    ],
    steps: [
      { title: { en: "Belt speed v", ja: "ベルト速度 v", es: "Velocidad de la correa v", "pt-BR": "Velocidade da correia v", de: "Riemengeschwindigkeit v", fr: "Vitesse de la courroie v" }, expression: "pi*D₁*n₁", targetUnit: "m/s", formulaLatex: "v = \\pi D_1 n_1" },
      { title: { en: "Driven pulley speed n₂", ja: "従動プーリの回転数 n₂", es: "Velocidad de la polea conducida n₂", "pt-BR": "Rotação da polia movida n₂", de: "Drehzahl der getriebenen Riemenscheibe n₂", fr: "Vitesse de la poulie menée n₂" }, expression: "n₁*D₁/D₂", targetUnit: "rpm", formulaLatex: "n_2 = \\dfrac{n_1 D_1}{D_2}" },
    ],
  },
  {
    title: { en: "Acceleration torque and flywheel energy", ja: "加速トルクとはずみ車のエネルギー", es: "Par de aceleración y energía del volante de inercia", "pt-BR": "Torque de aceleração e energia do volante de inércia", de: "Beschleunigungsmoment und Schwungradenergie", fr: "Couple d'accélération et énergie du volant d'inertie" },
    description: { en: "Compute the angular velocity of a rotor, the angular acceleration needed to reach it within a given run-up time, the torque that acceleration demands, and the kinetic energy stored once it is up to speed.", ja: "回転体の角速度と、指定した起動時間でそこまで加速するのに必要な角加速度・トルク、そして定常回転に達したときに蓄えられる回転エネルギーを求めます。", es: "Calcula la velocidad angular de un rotor, la aceleración angular necesaria para alcanzarla dentro de un tiempo de arranque dado, el par que exige esa aceleración y la energía cinética almacenada una vez alcanzada la velocidad de régimen.", "pt-BR": "Calcule a velocidade angular de um rotor, a aceleração angular necessária para atingi-la dentro de um tempo de partida dado, o torque que essa aceleração exige e a energia cinética armazenada depois que a rotação de regime é atingida.", de: "Berechnet die Winkelgeschwindigkeit eines Rotors, die Winkelbeschleunigung, die zum Erreichen dieser Drehzahl innerhalb einer vorgegebenen Hochlaufzeit nötig ist, das dafür erforderliche Beschleunigungsmoment und die bei Betriebsdrehzahl gespeicherte Rotationsenergie.", fr: "Calculer la vitesse angulaire d'un rotor, l'accélération angulaire nécessaire pour l'atteindre dans un temps de démarrage donné, le couple qu'exige cette accélération et l'énergie cinétique emmagasinée une fois la vitesse de régime atteinte." },
    localConstants: [
      { symbol: "J", expression: "0.05kg*m^2" },
      { symbol: "n", expression: "1500rpm" },
      { symbol: "t", expression: "2s" },
      { symbol: "ω", expression: "2*pi*n" },
    ],
    steps: [
      { title: { en: "Angular velocity ω", ja: "角速度 ω", es: "Velocidad angular ω", "pt-BR": "Velocidade angular ω", de: "Winkelgeschwindigkeit ω", fr: "Vitesse angulaire ω" }, expression: "ω", targetUnit: "rad/s", formulaLatex: "\\omega = 2\\pi n" },
      { title: { en: "Angular acceleration α", ja: "角加速度 α", es: "Aceleración angular α", "pt-BR": "Aceleração angular α", de: "Winkelbeschleunigung α", fr: "Accélération angulaire α" }, expression: "ω/t", targetUnit: "rad/s^2", formulaLatex: "\\alpha = \\dfrac{\\omega}{t}" },
      { title: { en: "Acceleration torque T", ja: "加速トルク T", es: "Par de aceleración T", "pt-BR": "Torque de aceleração T", de: "Beschleunigungsmoment T", fr: "Couple d'accélération T" }, expression: "J*ω/t", targetUnit: "N*m", formulaLatex: "T = J\\alpha" },
      { title: { en: "Stored kinetic energy E", ja: "蓄えられる回転エネルギー E", es: "Energía cinética almacenada E", "pt-BR": "Energia cinética armazenada E", de: "Gespeicherte Rotationsenergie E", fr: "Énergie cinétique emmagasinée E" }, expression: "J*ω^2/2", targetUnit: "J", formulaLatex: "E = \\tfrac{1}{2} J\\omega^2" },
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
    title: { en: "Bolt tightening torque and preload", ja: "ボルトの締付けトルクと軸力", es: "Par de apriete y precarga de un perno", "pt-BR": "Torque de aperto e pré-carga de um parafuso", de: "Anziehdrehmoment und Vorspannkraft einer Schraube", fr: "Couple de serrage et précontrainte d'un boulon" },
    description: { en: "Convert between the tightening torque of a bolt and the preload it produces, using the nut factor K (about 0.2 for a plain, lightly oiled steel bolt).", ja: "ナットファクタK（無処理で軽く油を塗った鋼ボルトなら約0.2）を使って、ボルトの締付けトルクと、それによって生じる軸力を相互に換算します。", es: "Convierte entre el par de apriete de un perno y la precarga que genera, usando el factor K (unos 0,2 para un perno de acero sin recubrimiento y ligeramente aceitado).", "pt-BR": "Converta entre o torque de aperto de um parafuso e a pré-carga que ele gera, usando o fator K (cerca de 0,2 para um parafuso de aço sem revestimento e levemente lubrificado).", de: "Rechnet das Anziehdrehmoment einer Schraube und die dadurch erzeugte Vorspannkraft ineinander um, und zwar mit dem K-Faktor (etwa 0,2 für eine blanke, leicht geölte Stahlschraube).", fr: "Convertir entre le couple de serrage d'un boulon et la précontrainte qu'il produit, à l'aide du coefficient de couple K (environ 0,2 pour un boulon en acier brut légèrement huilé)." },
    localConstants: [
      { symbol: "K", expression: "0.2" },
      { symbol: "d", expression: "12mm" },
      { symbol: "F", expression: "25kN" },
      { symbol: "T", expression: "60N*m" },
    ],
    steps: [
      { title: { en: "Tightening torque T", ja: "締付けトルク T", es: "Par de apriete T", "pt-BR": "Torque de aperto T", de: "Anziehdrehmoment T", fr: "Couple de serrage T" }, expression: "K*F*d", targetUnit: "N*m", formulaLatex: "T = KFd" },
      { title: { en: "Preload F from a given torque", ja: "トルクから求める軸力 F", es: "Precarga F a partir de un par de apriete dado", "pt-BR": "Pré-carga F a partir de um torque de aperto dado", de: "Vorspannkraft F aus einem gegebenen Anziehdrehmoment", fr: "Précontrainte F à partir d'un couple de serrage donné" }, expression: "T/(K*d)", targetUnit: "kN", formulaLatex: "F = \\dfrac{T}{Kd}" },
    ],
  },
  {
    title: { en: "Bolt tensile stress and utilisation (M12, class 8.8)", ja: "ボルトの引張応力と使用率（M12・強度区分8.8）", es: "Esfuerzo de tracción y grado de aprovechamiento del perno (M12, clase de resistencia 8.8)", "pt-BR": "Tensão de tração e grau de aproveitamento do parafuso (M12, classe de resistência 8.8)", de: "Zugspannung und Ausnutzungsgrad einer Schraube (M12, Festigkeitsklasse 8.8)", fr: "Contrainte de traction et taux de travail du boulon (M12, classe de qualité 8.8)" },
    description: { en: "Compute the tensile stress in a bolt from the preload and the tensile stress area, and how much of the proof stress that uses up. For an M12 bolt of property class 8.8 the tensile stress area is 84.3 mm² and the proof stress is 640 MPa.", ja: "軸力とボルトの有効断面積から引張応力を求め、それが保証応力の何パーセントにあたるかを計算します。強度区分8.8のM12ボルトでは、有効断面積は84.3mm²、保証応力は640MPaです。", es: "Calcula el esfuerzo de tracción en un perno a partir de la precarga y del área resistente a tracción, y qué parte del esfuerzo de prueba consume. En un perno M12 de clase de resistencia 8.8, el área resistente a tracción es de 84,3 mm² y el esfuerzo de prueba es de 640 MPa.", "pt-BR": "Calcule a tensão de tração em um parafuso a partir da pré-carga e da área resistente e quanto isso consome da tensão de prova. Em um parafuso M12 de classe de resistência 8.8, a área resistente é de 84,3 mm² e a tensão de prova é de 640 MPa.", de: "Berechnet die Zugspannung in einer Schraube aus der Vorspannkraft und dem Spannungsquerschnitt sowie den Anteil der Prüfspannung, der damit ausgeschöpft wird. Bei einer Schraube M12 der Festigkeitsklasse 8.8 beträgt der Spannungsquerschnitt 84,3 mm² und die Prüfspannung 640 MPa.", fr: "Calculer la contrainte de traction dans un boulon à partir de la précontrainte et de la section résistante, ainsi que la part de la contrainte d'épreuve que cela consomme. Pour un boulon M12 de classe de qualité 8.8, la section résistante vaut 84,3 mm² et la contrainte d'épreuve 640 MPa." },
    localConstants: [
      { symbol: "F", expression: "25kN" },
      { symbol: "A_s", expression: "84.3mm^2" },
      { symbol: "σ_p", expression: "640MPa" },
    ],
    steps: [
      { title: { en: "Tensile stress σ", ja: "引張応力 σ", es: "Esfuerzo de tracción σ", "pt-BR": "Tensão de tração σ", de: "Zugspannung σ", fr: "Contrainte de traction σ" }, expression: "F/A_s", targetUnit: "MPa", formulaLatex: "\\sigma = \\dfrac{F}{A_s}" },
      { title: { en: "Utilisation of the proof stress", ja: "保証応力に対する使用率", es: "Grado de aprovechamiento del esfuerzo de prueba", "pt-BR": "Grau de aproveitamento da tensão de prova", de: "Ausnutzungsgrad der Prüfspannung", fr: "Taux de travail par rapport à la contrainte d'épreuve" }, expression: "F/(A_s*σ_p)", targetUnit: "%", formulaLatex: "u = \\dfrac{F}{A_s \\sigma_p}" },
    ],
  },
  {
    title: { en: "Fillet weld throat and shear stress", ja: "すみ肉溶接ののど厚とせん断応力", es: "Espesor de garganta y esfuerzo cortante de una soldadura en ángulo", "pt-BR": "Espessura da garganta e tensão de cisalhamento de uma solda de filete", de: "Nahtdicke und Schubspannung einer Kehlnaht", fr: "Épaisseur de gorge et contrainte de cisaillement d'une soudure d'angle" },
    description: { en: "Compute the design throat thickness of a fillet weld from its leg length, then the average shear stress carried by the throat area.", ja: "すみ肉溶接の脚長からのど厚を求め、のど断面が受け持つ平均せん断応力を計算します。", es: "Calcula el espesor de garganta de cálculo de una soldadura en ángulo a partir de la longitud del cateto y, después, el esfuerzo cortante medio que soporta la sección de garganta.", "pt-BR": "Calcule a espessura de garganta de cálculo de uma solda de filete a partir do comprimento do cateto e, em seguida, a tensão de cisalhamento média suportada pela seção da garganta.", de: "Berechnet die rechnerische Nahtdicke (a-Maß) einer Kehlnaht aus der Schenkellänge und anschließend die mittlere Schubspannung im Nahtquerschnitt.", fr: "Calculer l'épaisseur de gorge de calcul d'une soudure d'angle à partir de la longueur du côté, puis la contrainte de cisaillement moyenne reprise par la section de gorge." },
    localConstants: [
      { symbol: "z", expression: "5mm" },
      { symbol: "L_w", expression: "400mm" },
      { symbol: "F", expression: "40kN" },
      { symbol: "a", expression: "0.7*z" },
    ],
    steps: [
      { title: { en: "Throat thickness a", ja: "のど厚 a", es: "Espesor de garganta a", "pt-BR": "Espessura da garganta a", de: "Nahtdicke a", fr: "Épaisseur de gorge a" }, expression: "a", targetUnit: "mm", formulaLatex: "a = 0.7z" },
      { title: { en: "Shear stress on the throat τ", ja: "のど断面のせん断応力 τ", es: "Esfuerzo cortante en la garganta τ", "pt-BR": "Tensão de cisalhamento na garganta τ", de: "Schubspannung im Nahtquerschnitt τ", fr: "Contrainte de cisaillement dans la gorge τ" }, expression: "F/(a*L_w)", targetUnit: "MPa", formulaLatex: "\\tau = \\dfrac{F}{a L_w}" },
    ],
  },
  {
    title: { en: "Helical compression spring: rate, deflection and stress", ja: "圧縮コイルばねのばね定数・たわみ・応力", es: "Resorte helicoidal de compresión: rigidez, flecha y esfuerzo cortante", "pt-BR": "Mola helicoidal de compressão: rigidez, deflexão e tensão de cisalhamento", de: "Schraubendruckfeder: Federrate, Federweg und Torsionsspannung", fr: "Ressort hélicoïdal de compression : raideur, flèche et contrainte de torsion" },
    description: { en: "Compute the rate of a helical compression spring from the wire diameter, the mean coil diameter and the number of active coils, then the deflection under a load and the torsional shear stress in the wire. The stress here is the uncorrected value: it does not include the Wahl curvature factor, which raises the peak stress at the inner surface of the coil by roughly 18% at the spring index D/d = 8 used here.", ja: "線径・コイル平均径・有効巻数から圧縮コイルばねのばね定数を求め、荷重によるたわみと、素線に生じるねじり応力を計算します。ここでの応力は修正前の値で、ワールの応力修正係数は掛けていません。この例のばね指数 D/d = 8 では、コイル内側の最大応力は修正後で約18%高くなります。", es: "Calcula la rigidez de un resorte helicoidal de compresión a partir del diámetro del alambre, el diámetro medio de la espira y el número de espiras activas y, después, la flecha bajo una carga y el esfuerzo cortante por torsión en el alambre. El esfuerzo que se muestra aquí es el valor sin corregir: no incluye el factor de curvatura de Wahl, que con el índice del resorte D/d = 8 usado aquí eleva el esfuerzo máximo en la cara interior de la espira alrededor de un 18%.", "pt-BR": "Calcule a rigidez de uma mola helicoidal de compressão a partir do diâmetro do arame, do diâmetro médio da espira e do número de espiras ativas e, em seguida, a deflexão sob uma carga e a tensão de cisalhamento por torção no arame. A tensão mostrada aqui é o valor não corrigido: não inclui o fator de curvatura de Wahl, que com o índice de mola D/d = 8 usado aqui eleva a tensão máxima na face interna da espira em cerca de 18%.", de: "Berechnet die Federrate einer Schraubendruckfeder aus Drahtdurchmesser, mittlerem Windungsdurchmesser und Anzahl der federnden Windungen und daraus den Federweg unter einer Last sowie die Torsionsspannung im Draht. Die hier angegebene Spannung ist der unkorrigierte Wert: Der Wahl-Spannungsbeiwert ist nicht enthalten, der beim hier verwendeten Wickelverhältnis D/d = 8 die Höchstspannung an der Windungsinnenseite um rund 18% erhöht.", fr: "Calculer la raideur d'un ressort hélicoïdal de compression à partir du diamètre du fil, du diamètre moyen d'enroulement et du nombre de spires actives, puis la flèche sous une charge et la contrainte de torsion dans le fil. La contrainte indiquée ici est la valeur non corrigée : elle n'inclut pas le facteur de courbure de Wahl, qui augmente d'environ 18% la contrainte maximale sur la face intérieure de la spire pour l'indice de ressort D/d = 8 utilisé ici." },
    localConstants: [
      { symbol: "G", expression: "79.3GPa" },
      { symbol: "d", expression: "2mm" },
      { symbol: "D", expression: "16mm" },
      { symbol: "N", expression: "8" },
      { symbol: "F", expression: "50N" },
      { symbol: "k", expression: "G*d^4/(8*D^3*N)" },
    ],
    steps: [
      { title: { en: "Spring rate k", ja: "ばね定数 k", es: "Rigidez del resorte k", "pt-BR": "Rigidez da mola k", de: "Federrate k", fr: "Raideur du ressort k" }, expression: "k", targetUnit: "N/mm", formulaLatex: "k = \\dfrac{Gd^4}{8D^3 N}" },
      { title: { en: "Deflection δ under the load", ja: "荷重によるたわみ δ", es: "Flecha δ bajo la carga", "pt-BR": "Deflexão δ sob a carga", de: "Federweg δ unter der Last", fr: "Flèche δ sous la charge" }, expression: "F/k", targetUnit: "mm", formulaLatex: "\\delta = \\dfrac{F}{k}" },
      { title: { en: "Torsional shear stress τ in the wire", ja: "素線のねじり応力 τ", es: "Esfuerzo cortante por torsión τ en el alambre", "pt-BR": "Tensão de cisalhamento por torção τ no arame", de: "Torsionsspannung τ im Draht", fr: "Contrainte de torsion τ dans le fil" }, expression: "8*F*D/(pi*d^3)", targetUnit: "MPa", formulaLatex: "\\tau = \\dfrac{8FD}{\\pi d^3}" },
    ],
  },
  {
    title: { en: "Thin-walled pressure vessel stresses", ja: "薄肉圧力容器に生じる応力", es: "Esfuerzos en un recipiente a presión de pared delgada", "pt-BR": "Tensões circunferencial e longitudinal em um vaso de pressão de parede fina", de: "Umfangs- und Längsspannung im dünnwandigen Druckbehälter", fr: "Contraintes dans un réservoir sous pression à paroi mince" },
    description: { en: "Compute the hoop and longitudinal stresses in a thin-walled cylinder under internal pressure, and the minimum wall thickness that keeps the hoop stress within an allowable value.", ja: "内圧を受ける薄肉円筒に生じる円周応力・軸方向応力と、円周応力を許容応力以内に収めるための最小板厚を求めます。", es: "Calcula los esfuerzos circunferencial y longitudinal en un cilindro de pared delgada sometido a presión interna, y el espesor mínimo de pared que mantiene el esfuerzo circunferencial dentro del valor admisible.", "pt-BR": "Calcule as tensões circunferencial e longitudinal em um cilindro de parede fina sob pressão interna e a espessura mínima de parede que mantém a tensão circunferencial dentro do valor admissível.", de: "Berechnet die Umfangsspannung und die Längsspannung in einem dünnwandigen Zylinder unter Innendruck sowie die Mindestwanddicke, mit der die Umfangsspannung innerhalb der zulässigen Spannung bleibt.", fr: "Calculer les contraintes circonférentielle et longitudinale dans un cylindre à paroi mince soumis à une pression interne, ainsi que l'épaisseur minimale de paroi qui maintient la contrainte circonférentielle sous la valeur admissible." },
    localConstants: [
      { symbol: "p", expression: "1.6MPa" },
      { symbol: "D", expression: "500mm" },
      { symbol: "t", expression: "6mm" },
      { symbol: "σ_a", expression: "120MPa" },
    ],
    steps: [
      { title: { en: "Hoop stress σh", ja: "円周応力 σh", es: "Esfuerzo circunferencial σh", "pt-BR": "Tensão circunferencial σh", de: "Umfangsspannung σh", fr: "Contrainte circonférentielle σh" }, expression: "p*D/(2*t)", targetUnit: "MPa", formulaLatex: "\\sigma_h = \\dfrac{pD}{2t}" },
      { title: { en: "Longitudinal stress σl", ja: "軸方向応力 σl", es: "Esfuerzo longitudinal σl", "pt-BR": "Tensão longitudinal σl", de: "Längsspannung σl", fr: "Contrainte longitudinale σl" }, expression: "p*D/(4*t)", targetUnit: "MPa", formulaLatex: "\\sigma_l = \\dfrac{pD}{4t}" },
      { title: { en: "Minimum wall thickness tmin", ja: "最小板厚 tmin", es: "Espesor mínimo de pared tmin", "pt-BR": "Espessura mínima de parede tmin", de: "Mindestwanddicke tmin", fr: "Épaisseur minimale de paroi tmin" }, expression: "p*D/(2*σ_a)", targetUnit: "mm", formulaLatex: "t_{min} = \\dfrac{pD}{2\\sigma_a}" },
    ],
  },
  {
    title: { en: "Ball bearing L10 life", ja: "玉軸受のL10寿命", es: "Vida L10 de un rodamiento de bolas", "pt-BR": "Vida L10 de um rolamento de esferas", de: "L10-Lebensdauer eines Kugellagers", fr: "Durée de vie L10 d'un roulement à billes" },
    description: { en: "Compute the basic rating life of a ball bearing from its dynamic load rating and the equivalent load, first in millions of revolutions and then in hours. The exponent 3 applies to ball bearings only — roller bearings use 10/3. The /60 of the textbook formula disappears here, because rpm is a real unit: dividing a number of revolutions by a rotational speed already gives a time.", ja: "動定格荷重と等価荷重から、玉軸受の基本定格寿命を、まず百万回転で、続いて時間で求めます。指数の3は玉軸受のもので、ころ軸受では10/3になります。ここではrpmを本物の単位として扱うため、教科書の式に出てくる/60は要りません。回転数を回転速度で割れば、そのまま時間の次元になります。", es: "Calcula la vida nominal básica de un rodamiento de bolas a partir de su capacidad de carga dinámica y de la carga equivalente, primero en millones de revoluciones y después en horas. El exponente 3 vale solo para los rodamientos de bolas: los de rodillos usan 10/3. Aquí no hace falta el /60 de la fórmula de los libros de texto, porque rpm es una unidad real: dividir un número de revoluciones entre una velocidad de rotación ya da un tiempo.", "pt-BR": "Calcule a vida nominal básica de um rolamento de esferas a partir da capacidade de carga dinâmica e da carga equivalente, primeiro em milhões de revoluções e depois em horas. O expoente 3 vale apenas para rolamentos de esferas: os de rolos usam 10/3. Aqui o /60 da fórmula dos livros não é necessário, porque rpm é uma unidade de verdade: dividir um número de revoluções por uma velocidade de rotação já resulta em um tempo.", de: "Berechnet die nominelle Lebensdauer eines Kugellagers aus der dynamischen Tragzahl und der äquivalenten Lagerbelastung, zuerst in Millionen Umdrehungen und dann in Stunden. Der Exponent 3 gilt nur für Kugellager: Rollenlager rechnen mit 10/3. Das /60 der Lehrbuchformel entfällt hier, weil rpm eine echte Einheit ist: Eine Umdrehungszahl durch eine Drehzahl geteilt ergibt bereits eine Zeit.", fr: "Calculer la durée de vie nominale d'un roulement à billes à partir de sa charge dynamique de base et de la charge équivalente, d'abord en millions de tours puis en heures. L'exposant 3 ne vaut que pour les roulements à billes : les roulements à rouleaux utilisent 10/3. Le /60 de la formule des manuels disparaît ici, car rpm est une véritable unité : diviser un nombre de tours par une vitesse de rotation donne déjà un temps." },
    localConstants: [
      { symbol: "C", expression: "25.5kN" },
      { symbol: "P_r", expression: "4kN" },
      { symbol: "n", expression: "1500rpm" },
    ],
    steps: [
      { title: { en: "Basic rating life L10 (million revolutions)", ja: "基本定格寿命 L10（百万回転）", es: "Vida nominal básica L10 (millones de revoluciones)", "pt-BR": "Vida nominal básica L10 (milhões de revoluções)", de: "Nominelle Lebensdauer L10 (Millionen Umdrehungen)", fr: "Durée de vie nominale L10 (millions de tours)" }, expression: "(C/P_r)^3", targetUnit: "", formulaLatex: "L_{10} = \\left(\\dfrac{C}{P_r}\\right)^3" },
      { title: { en: "Basic rating life in hours", ja: "基本定格寿命（時間）", es: "Vida nominal básica en horas", "pt-BR": "Vida nominal básica em horas", de: "Nominelle Lebensdauer in Stunden", fr: "Durée de vie nominale en heures" }, expression: "(C/P_r)^3*1e6/n", targetUnit: "h", formulaLatex: "L_{10h} = \\dfrac{10^6 L_{10}}{n}" },
    ],
  },
  {
    title: { en: "Key (shaft-hub joint) shear stress", ja: "キー（軸とボスの締結）のせん断応力", es: "Esfuerzo cortante en la chaveta (unión eje-cubo)", "pt-BR": "Tensão de cisalhamento na chaveta (união eixo-cubo)", de: "Schubspannung in der Passfeder (Welle-Nabe-Verbindung)", fr: "Contrainte de cisaillement dans la clavette (assemblage arbre-moyeu)" },
    description: { en: "Compute the tangential force a parallel key transmits at the shaft surface, and the average shear stress on its shear plane.", ja: "平行キーが軸表面で伝える接線力と、せん断面に生じる平均せん断応力を求めます。", es: "Calcula la fuerza tangencial que transmite una chaveta paralela en la superficie del eje y el esfuerzo cortante medio en su plano de corte.", "pt-BR": "Calcule a força tangencial que uma chaveta paralela transmite na superfície do eixo e a tensão de cisalhamento média no seu plano de corte.", de: "Berechnet die Umfangskraft, die eine Passfeder an der Wellenoberfläche überträgt, und die mittlere Schubspannung in ihrer Scherfläche.", fr: "Calculer l'effort tangentiel qu'une clavette parallèle transmet à la surface de l'arbre et la contrainte de cisaillement moyenne dans son plan de cisaillement." },
    localConstants: [
      { symbol: "T", expression: "250N*m" },
      { symbol: "d", expression: "30mm" },
      { symbol: "b", expression: "8mm" },
      { symbol: "L_k", expression: "40mm" },
    ],
    steps: [
      { title: { en: "Tangential force F at the shaft surface", ja: "軸表面の接線力 F", es: "Fuerza tangencial F en la superficie del eje", "pt-BR": "Força tangencial F na superfície do eixo", de: "Umfangskraft F an der Wellenoberfläche", fr: "Effort tangentiel F à la surface de l'arbre" }, expression: "2*T/d", targetUnit: "kN", formulaLatex: "F = \\dfrac{2T}{d}" },
      { title: { en: "Shear stress τ on the key", ja: "キーのせん断応力 τ", es: "Esfuerzo cortante τ en la chaveta", "pt-BR": "Tensão de cisalhamento τ na chaveta", de: "Schubspannung τ in der Passfeder", fr: "Contrainte de cisaillement τ dans la clavette" }, expression: "2*T/(d*b*L_k)", targetUnit: "MPa", formulaLatex: "\\tau = \\dfrac{2T}{d b L_k}" },
    ],
  },
];
