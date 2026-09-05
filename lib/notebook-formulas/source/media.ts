import type { NotebookSeed } from "../types";

/**
 * 「写真・カメラ」。過焦点距離・被写界深度・露出値（EV）・画角など、
 * レンズの焦点距離とF値から実際の撮影条件を割り出す計算をまとめている。
 * F値は写真の慣習どおり N（レンズのF値）、焦点距離は f として区別している
 * （N はニュートンの単位記号でもあるが、ローカル定数として先に解決されるので数値の直後に置かない限り安全）。
 */
export const PHOTOGRAPHY_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Hyperfocal distance", ja: "過焦点距離", es: "Distancia hiperfocal", "pt-BR": "Distância hiperfocal", de: "Hyperfokale Distanz", fr: "Distance hyperfocale" },
    description: {
      en: "Compute the hyperfocal distance from focal length, f-number, and circle of confusion. Focusing there keeps everything from half that distance to infinity acceptably sharp. A 50 mm lens at f/8 on full frame (circle of confusion 0.03 mm) gives about 10 m.",
      ja: "焦点距離・F値・許容錯乱円から、過焦点距離を求めます。ここにピントを合わせると、その半分の距離から無限遠までが実用上シャープに写ります。フルサイズ（許容錯乱円0.03mm）の50mmレンズをF8で使うと約10mになります。",
      es: "Calcula la distancia hiperfocal a partir de la distancia focal, el número f y el círculo de confusión. Al enfocar ahí, todo queda aceptablemente nítido desde la mitad de esa distancia hasta el infinito. Un objetivo de 50 mm a f/8 en formato completo (círculo de confusión de 0,03 mm) da unos 10 m.",
      "pt-BR": "Calcule a distância hiperfocal a partir da distância focal, do número f e do círculo de confusão. Focando ali, tudo fica aceitavelmente nítido da metade dessa distância até o infinito. Uma lente de 50 mm a f/8 em full frame (círculo de confusão de 0,03 mm) dá cerca de 10 m.",
      de: "Berechnet die hyperfokale Distanz aus Brennweite, Blendenzahl und Zerstreuungskreis. Stellt man darauf scharf, bleibt alles von der halben Entfernung bis unendlich ausreichend scharf. Ein 50-mm-Objektiv bei f/8 im Kleinbildformat (Zerstreuungskreis 0,03 mm) ergibt etwa 10 m.",
      fr: "Calculer la distance hyperfocale à partir de la distance focale, du nombre d'ouverture et du cercle de confusion. En faisant la mise au point à cette distance, tout reste suffisamment net depuis la moitié de cette distance jusqu'à l'infini. Un objectif de 50 mm à f/8 en plein format (cercle de confusion de 0,03 mm) donne environ 10 m.",
    },
    localConstants: [
      { symbol: "f", expression: "50mm" },
      { symbol: "N", expression: "8" },
      { symbol: "c", expression: "0.03mm" },
    ],
    steps: [
      { title: { en: "Hyperfocal distance H", ja: "過焦点距離 H", es: "Distancia hiperfocal H", "pt-BR": "Distância hiperfocal H", de: "Hyperfokale Distanz H", fr: "Distance hyperfocale H" }, expression: "f^2/(N*c)+f", targetUnit: "m", formulaLatex: "H = \\dfrac{f^2}{Nc} + f" },
    ],
  },
  {
    title: { en: "Depth of field (near and far limits)", ja: "被写界深度（前後のピント範囲）", es: "Profundidad de campo (límites cercano y lejano)", "pt-BR": "Profundidade de campo (limites próximo e distante)", de: "Schärfentiefe (vordere und hintere Grenze)", fr: "Profondeur de champ (limites avant et arrière)" },
    description: {
      en: "Compute the near and far limits of acceptable sharpness for a given focus distance, using the hyperfocal distance H as an intermediate value. A 50 mm lens at f/2.8 focused at 3 m on full frame is sharp from about 2.7 m to about 3.3 m.",
      ja: "ピントを合わせた距離に対して、実用上シャープに写る手前側と奥側の限界を、過焦点距離Hを経由して求めます。フルサイズの50mmレンズをF2.8で3mに合わせると、およそ2.7mから3.3mまでが範囲になります。",
      es: "Calcula los límites cercano y lejano de nitidez aceptable para una distancia de enfoque dada, usando la distancia hiperfocal H como valor intermedio. Un objetivo de 50 mm a f/2,8 enfocado a 3 m en formato completo es nítido desde unos 2,7 m hasta unos 3,3 m.",
      "pt-BR": "Calcule os limites próximo e distante de nitidez aceitável para uma dada distância de foco, usando a distância hiperfocal H como valor intermediário. Uma lente de 50 mm a f/2,8 focada a 3 m em full frame fica nítida de cerca de 2,7 m até cerca de 3,3 m.",
      de: "Berechnet die vordere und die hintere Grenze der ausreichenden Schärfe für eine bestimmte Fokusentfernung; die hyperfokale Distanz H dient dabei als Zwischenwert. Ein 50-mm-Objektiv bei f/2,8 auf 3 m fokussiert ist im Kleinbildformat von etwa 2,7 m bis etwa 3,3 m scharf.",
      fr: "Calculer les limites avant et arrière de netteté acceptable pour une distance de mise au point donnée, en passant par la distance hyperfocale H comme valeur intermédiaire. Un objectif de 50 mm à f/2,8 mis au point à 3 m en plein format est net d'environ 2,7 m à environ 3,3 m.",
    },
    localConstants: [
      { symbol: "f", expression: "50mm" },
      { symbol: "N", expression: "2.8" },
      { symbol: "c", expression: "0.03mm" },
      { symbol: "s", expression: "3m" },
      { symbol: "H", expression: "f^2/(N*c)+f" },
    ],
    steps: [
      { title: { en: "Near limit Dn", ja: "手前側の限界 Dn", es: "Límite cercano Dn", "pt-BR": "Limite próximo Dn", de: "Vordere Grenze Dn", fr: "Limite avant Dn" }, expression: "H*s/(H+(s-f))", targetUnit: "m", formulaLatex: "D_n = \\dfrac{Hs}{H + (s - f)}" },
      { title: { en: "Far limit Df", ja: "奥側の限界 Df", es: "Límite lejano Df", "pt-BR": "Limite distante Df", de: "Hintere Grenze Df", fr: "Limite arrière Df" }, expression: "H*s/(H-(s-f))", targetUnit: "m", formulaLatex: "D_f = \\dfrac{Hs}{H - (s - f)}" },
      { title: { en: "Total depth of field", ja: "被写界深度の全体", es: "Profundidad de campo total", "pt-BR": "Profundidade de campo total", de: "Gesamte Schärfentiefe", fr: "Profondeur de champ totale" }, expression: "H*s/(H-(s-f))-H*s/(H+(s-f))", targetUnit: "m", formulaLatex: "\\text{DoF} = D_f - D_n" },
    ],
  },
  {
    title: { en: "Exposure value (EV) from aperture and shutter speed", ja: "F値とシャッター速度から露出値（EV）", es: "Valor de exposición (EV) a partir de la abertura y la velocidad de obturación", "pt-BR": "Valor de exposição (EV) a partir da abertura e da velocidade do obturador", de: "Lichtwert (LW / EV) aus Blendenzahl und Belichtungszeit", fr: "Indice de lumination (IL / EV) à partir de l'ouverture et de la vitesse d'obturation" },
    description: {
      en: "Compute the exposure value of a set of camera settings, and the scene brightness it corresponds to at ISO 100. EV is defined against a shutter time of one second, so the expression divides t by 1 s to get the plain number the logarithm needs. f/8 at 1/125 s is EV 13; shooting it at ISO 400 means the scene itself is about EV 11 at ISO 100.",
      ja: "撮影設定そのものの露出値と、それがISO100換算でどれくらいの明るさの被写体にあたるかを求めます。EVは1秒を基準に定義されるので、式では t を1sで割って対数に渡せる裸の数値にしています。F8・1/125秒はEV13で、これをISO400で撮っているなら被写体の明るさはISO100換算で約EV11です。",
      es: "Calcula el valor de exposición de unos ajustes de cámara y el brillo de escena al que corresponde en ISO 100. El EV se define respecto a un tiempo de obturación de un segundo, por eso la expresión divide t entre 1 s para obtener el número sin unidad que necesita el logaritmo. f/8 a 1/125 s es EV 13; si se dispara en ISO 400, la escena en sí está en torno a EV 11 en ISO 100.",
      "pt-BR": "Calcule o valor de exposição de um conjunto de ajustes da câmera e o brilho de cena a que ele corresponde em ISO 100. O EV é definido em relação a um tempo de obturação de um segundo, por isso a expressão divide t por 1 s para obter o número puro de que o logaritmo precisa. f/8 a 1/125 s é EV 13; fotografando em ISO 400, a cena em si fica por volta de EV 11 em ISO 100.",
      de: "Berechnet den Lichtwert einer Kameraeinstellung und die Motivhelligkeit, der er bei ISO 100 entspricht. Der Lichtwert (EV) ist auf eine Belichtungszeit von einer Sekunde bezogen, deshalb teilt der Ausdruck t durch 1 s, um die reine Zahl für den Logarithmus zu erhalten. f/8 bei 1/125 s ergibt EV 13; wird dabei mit ISO 400 fotografiert, liegt das Motiv selbst bei etwa EV 11 auf ISO 100 bezogen.",
      fr: "Calculer l'indice de lumination d'un réglage de prise de vue et la luminosité de la scène à laquelle il correspond à ISO 100. L'IL (EV) est défini par rapport à un temps de pose d'une seconde : l'expression divise donc t par 1 s pour obtenir le nombre sans unité qu'attend le logarithme. f/8 au 1/125 s vaut EV 13 ; en photographiant à ISO 400, la scène elle-même est à environ EV 11 en ISO 100.",
    },
    localConstants: [
      { symbol: "N", expression: "8" },
      { symbol: "t", expression: "1s/125" },
      { symbol: "S", expression: "400" },
    ],
    steps: [
      { title: { en: "Exposure value EV of the settings", ja: "撮影設定の露出値 EV", es: "Valor de exposición EV de los ajustes", "pt-BR": "Valor de exposição EV dos ajustes", de: "Lichtwert EV der Einstellung", fr: "Indice de lumination EV du réglage" }, expression: "log2(N^2/(t/1s))", targetUnit: "", formulaLatex: "EV = \\log_2 \\dfrac{N^2}{t}" },
      { title: { en: "Scene brightness EV at ISO 100", ja: "ISO100換算の被写体の明るさ EV100", es: "Brillo de la escena EV en ISO 100", "pt-BR": "Brilho da cena EV em ISO 100", de: "Motivhelligkeit EV bei ISO 100", fr: "Luminosité de la scène EV à ISO 100" }, expression: "log2(N^2/(t/1s))-log2(S/100)", targetUnit: "", formulaLatex: "EV_{100} = EV - \\log_2 \\dfrac{S}{100}" },
    ],
  },
  {
    title: { en: "Equivalent exposure (changing aperture or ISO)", ja: "等価露出（F値・ISO感度を変えたとき）", es: "Exposición equivalente (al cambiar la abertura o el ISO)", "pt-BR": "Exposição equivalente (ao mudar a abertura ou o ISO)", de: "Äquivalente Belichtung (bei geänderter Blende oder ISO-Empfindlichkeit)", fr: "Exposition équivalente (en changeant l'ouverture ou l'ISO)" },
    description: {
      en: "Keep the same exposure while changing settings: the shutter time that matches a new f-number, how many stops apart the two apertures are, and the shutter time that matches a new ISO. Stopping down from f/2.8 to f/8 is 3 stops, so 1/125 s becomes about 1/15 s.",
      ja: "明るさを保ったまま設定を振り替えます。新しいF値に対応するシャッター速度・2つのF値の段数の差・ISO感度を変えたときのシャッター速度を求めます。F2.8からF8へ絞ると3段ぶんなので、1/125秒は約1/15秒になります。",
      es: "Mantén la misma exposición al cambiar los ajustes: la velocidad de obturación que corresponde a un nuevo número f, cuántos pasos separan las dos aberturas y la velocidad de obturación que corresponde a un nuevo ISO. Cerrar de f/2,8 a f/8 son 3 pasos, así que 1/125 s pasa a ser aproximadamente 1/15 s.",
      "pt-BR": "Mantenha a mesma exposição ao mudar os ajustes: a velocidade do obturador que corresponde a um novo número f, quantos pontos separam as duas aberturas e a velocidade do obturador que corresponde a um novo ISO. Fechar de f/2,8 para f/8 são 3 pontos, então 1/125 s passa a ser cerca de 1/15 s.",
      de: "Die Belichtung bleibt gleich, während die Einstellungen geändert werden: die Belichtungszeit zu einer neuen Blendenzahl, der Abstand der beiden Blenden in Blendenstufen und die Belichtungszeit zu einer neuen ISO-Empfindlichkeit. Von f/2,8 auf f/8 abzublenden sind 3 Blendenstufen, aus 1/125 s werden also etwa 1/15 s.",
      fr: "Conserver la même exposition en changeant les réglages : le temps de pose correspondant à un nouveau nombre d'ouverture, l'écart en IL entre les deux ouvertures, et le temps de pose correspondant à une nouvelle sensibilité ISO. Fermer de f/2,8 à f/8 représente 3 IL, donc 1/125 s devient environ 1/15 s.",
    },
    localConstants: [
      { symbol: "N₁", expression: "2.8" },
      { symbol: "t₁", expression: "1s/125" },
      { symbol: "N₂", expression: "8" },
      { symbol: "S₁", expression: "100" },
      { symbol: "S₂", expression: "400" },
    ],
    steps: [
      { title: { en: "Shutter time t2 at the new aperture", ja: "新しいF値でのシャッター速度 t2", es: "Velocidad de obturación t2 con la nueva abertura", "pt-BR": "Velocidade do obturador t2 na nova abertura", de: "Belichtungszeit t2 bei der neuen Blende", fr: "Temps de pose t2 à la nouvelle ouverture" }, expression: "t₁*(N₂/N₁)^2", targetUnit: "s", formulaLatex: "t_2 = t_1 \\left(\\dfrac{N_2}{N_1}\\right)^2" },
      { title: { en: "Difference in stops", ja: "段数の差", es: "Diferencia en pasos", "pt-BR": "Diferença em pontos", de: "Unterschied in Blendenstufen", fr: "Écart en IL" }, expression: "log2(N₂/N₁)*2", targetUnit: "", formulaLatex: "\\Delta EV = 2\\log_2 \\dfrac{N_2}{N_1}" },
      { title: { en: "Shutter time after the ISO change", ja: "ISO感度を変えたあとのシャッター速度", es: "Velocidad de obturación tras cambiar el ISO", "pt-BR": "Velocidade do obturador após mudar o ISO", de: "Belichtungszeit nach dem Wechsel der ISO-Empfindlichkeit", fr: "Temps de pose après le changement d'ISO" }, expression: "t₁*S₁/S₂", targetUnit: "s", formulaLatex: "t_{ISO} = t_1 \\dfrac{S_1}{S_2}" },
    ],
  },
  {
    title: { en: "Angle of view and framing", ja: "画角と写る範囲", es: "Ángulo de visión y encuadre", "pt-BR": "Ângulo de visão e enquadramento", de: "Bildwinkel und Bildausschnitt", fr: "Angle de champ et cadrage" },
    description: {
      en: "Compute the horizontal and diagonal angle of view from focal length and sensor size, plus how wide a frame is at a given subject distance. A 50 mm lens on full frame (36 mm wide, 43.3 mm diagonal) covers about 39.6° horizontally and frames about 2.2 m at 3 m.",
      ja: "焦点距離とセンサーサイズから、水平画角・対角画角と、被写体までの距離で実際に写る横幅を求めます。フルサイズ（横36mm・対角43.3mm）の50mmレンズは水平約39.6°で、3m先ではおよそ2.2mの幅が写ります。",
      es: "Calcula el ángulo de visión horizontal y diagonal a partir de la distancia focal y el tamaño del sensor, y también qué anchura abarca el encuadre a una distancia dada del sujeto. Un objetivo de 50 mm en formato completo (36 mm de ancho, 43,3 mm de diagonal) cubre unos 39,6° en horizontal y encuadra unos 2,2 m a 3 m.",
      "pt-BR": "Calcule o ângulo de visão horizontal e diagonal a partir da distância focal e do tamanho do sensor, além da largura que o enquadramento abrange a uma dada distância do motivo. Uma lente de 50 mm em full frame (36 mm de largura, 43,3 mm de diagonal) cobre cerca de 39,6° na horizontal e enquadra cerca de 2,2 m a 3 m.",
      de: "Berechnet den horizontalen und den diagonalen Bildwinkel aus Brennweite und Sensorgröße sowie die Breite des Bildausschnitts in einer bestimmten Motiventfernung. Ein 50-mm-Objektiv im Kleinbildformat (36 mm Breite, 43,3 mm Diagonale) erfasst horizontal etwa 39,6° und bildet auf 3 m rund 2,2 m Breite ab.",
      fr: "Calculer l'angle de champ horizontal et diagonal à partir de la distance focale et de la taille du capteur, ainsi que la largeur cadrée à une distance donnée du sujet. Un objectif de 50 mm en plein format (36 mm de large, 43,3 mm de diagonale) couvre environ 39,6° à l'horizontale et cadre environ 2,2 m à 3 m.",
    },
    localConstants: [
      { symbol: "f", expression: "50mm" },
      { symbol: "w", expression: "36mm" },
      { symbol: "dᵢ", expression: "43.27mm" },
      { symbol: "D", expression: "3m" },
    ],
    steps: [
      { title: { en: "Horizontal angle of view", ja: "水平画角", es: "Ángulo de visión horizontal", "pt-BR": "Ângulo de visão horizontal", de: "Horizontaler Bildwinkel", fr: "Angle de champ horizontal" }, expression: "atan(w/f/2)*2", targetUnit: "°", formulaLatex: "\\theta_h = 2\\arctan\\dfrac{w}{2f}" },
      { title: { en: "Diagonal angle of view", ja: "対角画角", es: "Ángulo de visión diagonal", "pt-BR": "Ângulo de visão diagonal", de: "Diagonaler Bildwinkel", fr: "Angle de champ diagonal" }, expression: "atan(dᵢ/f/2)*2", targetUnit: "°", formulaLatex: "\\theta_d = 2\\arctan\\dfrac{d_i}{2f}" },
      { title: { en: "Frame width at the subject distance", ja: "被写体距離で写る横幅", es: "Anchura encuadrada a la distancia del sujeto", "pt-BR": "Largura enquadrada na distância do motivo", de: "Bildbreite im Motivabstand", fr: "Largeur cadrée à la distance du sujet" }, expression: "D*w/f", targetUnit: "m", formulaLatex: "W = \\dfrac{Dw}{f}" },
    ],
  },
  {
    title: { en: "Star trails: the 500 rule and the NPF rule", ja: "星が流れない露出時間（500ルールとNPFルール）", es: "Trazas de estrellas: la regla del 500 y la regla NPF", "pt-BR": "Rastros de estrelas: a regra dos 500 e a regra NPF", de: "Sternspuren: 500er-Regel und NPF-Regel", fr: "Filés d'étoiles : la règle des 500 et la règle NPF" },
    description: {
      en: "Compute the longest shutter time before stars visibly trail. The 500 rule divides 500 by the effective focal length, where k is the crop factor of the sensor (1 on full frame, 1.5 on APS-C); the stricter NPF rule also accounts for aperture and pixel pitch. The constants C, a, and b carry the units (mm·s) that make these empirical rules come out in seconds. At 24 mm on full frame the 500 rule gives about 21 s, while NPF at f/2.8 with a 5.9 µm pixel pitch gives about 11 s.",
      ja: "星が線状に流れて写り始めるまでの、最長のシャッター速度を求めます。500ルールは500を実効焦点距離で割るだけです（kはセンサーのクロップ係数で、フルサイズなら1、APS-Cなら1.5）。より厳しいNPFルールはF値と画素ピッチも考慮します。定数C・a・bは、この経験則が秒で出るように単位（mm·s）を持たせたものです。フルサイズの24mmなら500ルールで約21秒、F2.8・画素ピッチ5.9µmのNPFルールでは約11秒になります。",
      es: "Calcula el tiempo de obturación más largo antes de que las estrellas dejen trazas visibles. La regla del 500 divide 500 entre la distancia focal efectiva, donde k es el factor de recorte del sensor (1 en formato completo, 1,5 en APS-C); la regla NPF, más estricta, tiene en cuenta además la abertura y el tamaño de píxel. Las constantes C, a y b llevan las unidades (mm·s) que hacen que estas reglas empíricas salgan en segundos. A 24 mm en formato completo, la regla del 500 da unos 21 s, mientras que la NPF a f/2,8 con un tamaño de píxel de 5,9 µm da unos 11 s.",
      "pt-BR": "Calcule o maior tempo de obturação antes que as estrelas deixem rastros visíveis. A regra dos 500 divide 500 pela distância focal efetiva, em que k é o fator de corte do sensor (1 em full frame, 1,5 em APS-C); a regra NPF, mais rigorosa, também leva em conta a abertura e o tamanho de pixel. As constantes C, a e b carregam as unidades (mm·s) que fazem essas regras empíricas resultarem em segundos. A 24 mm em full frame, a regra dos 500 dá cerca de 21 s, enquanto a NPF a f/2,8 com tamanho de pixel de 5,9 µm dá cerca de 11 s.",
      de: "Berechnet die längste Belichtungszeit, bevor Sterne sichtbar zu Strichen werden. Die 500er-Regel teilt 500 durch die effektive Brennweite, wobei k der Crop-Faktor des Sensors ist (1 im Kleinbildformat, 1,5 bei APS-C); die strengere NPF-Regel berücksichtigt zusätzlich Blendenzahl und Pixelgröße. Die Konstanten C, a und b tragen die Einheiten (mm·s), damit diese Faustregeln in Sekunden herauskommen. Bei 24 mm im Kleinbildformat ergibt die 500er-Regel etwa 21 s, die NPF-Regel bei f/2,8 mit 5,9 µm Pixelgröße dagegen etwa 11 s.",
      fr: "Calculer le temps de pose le plus long avant que les étoiles ne laissent des filés visibles. La règle des 500 divise 500 par la distance focale effective, où k est le facteur de recadrage du capteur (1 en plein format, 1,5 en APS-C) ; la règle NPF, plus stricte, tient aussi compte de l'ouverture et du pas de pixel. Les constantes C, a et b portent les unités (mm·s) qui font sortir ces règles empiriques en secondes. À 24 mm en plein format, la règle des 500 donne environ 21 s, tandis que la règle NPF à f/2,8 avec un pas de pixel de 5,9 µm donne environ 11 s.",
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
      { title: { en: "500 rule: maximum shutter time", ja: "500ルールの最長シャッター速度", es: "Regla del 500: tiempo de obturación máximo", "pt-BR": "Regra dos 500: tempo de obturação máximo", de: "500er-Regel: längste Belichtungszeit", fr: "Règle des 500 : temps de pose maximal" }, expression: "C/(k*f)", targetUnit: "s", formulaLatex: "t_{500} = \\dfrac{C}{k f}" },
      { title: { en: "NPF rule: maximum shutter time", ja: "NPFルールの最長シャッター速度", es: "Regla NPF: tiempo de obturación máximo", "pt-BR": "Regra NPF: tempo de obturação máximo", de: "NPF-Regel: längste Belichtungszeit", fr: "Règle NPF : temps de pose maximal" }, expression: "(a*N+b*p)/f", targetUnit: "s", formulaLatex: "t_{NPF} = \\dfrac{aN + bp}{f}" },
    ],
  },
  {
    title: { en: "Flash guide number", ja: "フラッシュのガイドナンバー", es: "Número guía del flash", "pt-BR": "Número-guia do flash", de: "Leitzahl des Blitzgeräts", fr: "Nombre-guide du flash" },
    description: {
      en: "A flash's guide number (quoted in metres at ISO 100) is the product of subject distance and f-number. From it you get the reach at a chosen aperture, the aperture needed at a chosen distance, and the guide number at a different ISO. GN 36 at f/8 reaches 4.5 m.",
      ja: "フラッシュのガイドナンバー（ISO100・メートル表示）は、被写体までの距離とF値の積です。ここから、決めたF値での届く距離・決めた距離で必要なF値・ISO感度を変えたときのガイドナンバーを求めます。GN36をF8で使うと4.5mまで届きます。",
      es: "El número guía de un flash (indicado en metros para ISO 100) es el producto de la distancia al sujeto por el número f. A partir de él se obtienen el alcance con una abertura elegida, la abertura necesaria a una distancia elegida y el número guía con otro ISO. Un NG de 36 a f/8 alcanza 4,5 m.",
      "pt-BR": "O número-guia de um flash (informado em metros para ISO 100) é o produto da distância ao motivo pelo número f. A partir dele obtêm-se o alcance com uma abertura escolhida, a abertura necessária a uma distância escolhida e o número-guia com outro ISO. Um NG de 36 a f/8 alcança 4,5 m.",
      de: "Die Leitzahl eines Blitzgeräts (in Metern für ISO 100 angegeben) ist das Produkt aus Motivabstand und Blendenzahl. Daraus ergeben sich die Reichweite bei einer gewählten Blende, die bei einer gewählten Entfernung nötige Blendenzahl und die Leitzahl bei einer anderen ISO-Empfindlichkeit. LZ 36 reicht bei f/8 bis 4,5 m.",
      fr: "Le nombre-guide d'un flash (indiqué en mètres pour ISO 100) est le produit de la distance au sujet par le nombre d'ouverture. Il en découle la portée à une ouverture choisie, l'ouverture nécessaire à une distance choisie et le nombre-guide à une autre sensibilité ISO. Un NG de 36 porte à 4,5 m à f/8.",
    },
    localConstants: [
      { symbol: "GN", expression: "36m" },
      { symbol: "N", expression: "8" },
      { symbol: "d", expression: "3m" },
      { symbol: "S", expression: "400" },
    ],
    steps: [
      { title: { en: "Reach at the chosen aperture", ja: "そのF値で届く距離", es: "Alcance con esa abertura", "pt-BR": "Alcance com essa abertura", de: "Reichweite bei dieser Blende", fr: "Portée à cette ouverture" }, expression: "GN/N", targetUnit: "m", formulaLatex: "d_{max} = \\dfrac{GN}{N}" },
      { title: { en: "Aperture needed at the chosen distance", ja: "その距離で必要なF値", es: "Abertura necesaria a esa distancia", "pt-BR": "Abertura necessária nessa distância", de: "Bei dieser Entfernung nötige Blendenzahl", fr: "Ouverture nécessaire à cette distance" }, expression: "GN/d", targetUnit: "", formulaLatex: "N_{req} = \\dfrac{GN}{d}" },
      { title: { en: "Guide number at the new ISO", ja: "ISO感度を変えたときのガイドナンバー", es: "Número guía con el nuevo ISO", "pt-BR": "Número-guia com o novo ISO", de: "Leitzahl bei der neuen ISO-Empfindlichkeit", fr: "Nombre-guide à la nouvelle sensibilité ISO" }, expression: "GN*sqrt(S/100)", targetUnit: "m", formulaLatex: "GN_S = GN\\sqrt{\\dfrac{S}{100}}" },
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
    title: { en: "Sound pressure level in dB (and back to pressure)", ja: "音圧レベル（dB）と音圧の相互変換", es: "Nivel de presión sonora en dB (y vuelta a la presión)", "pt-BR": "Nível de pressão sonora em dB (e de volta à pressão)", de: "Schalldruckpegel in dB (und zurück zum Schalldruck)", fr: "Niveau de pression acoustique en dB (et retour à la pression)" },
    description: {
      en: "Convert between sound pressure and sound pressure level. The results marked dB are plain numbers — decibels are a logarithmic ratio, not a unit. A pressure of 0.1 Pa is about 74 dB, and 94 dB corresponds to 1 Pa (the level of a standard calibrator).",
      ja: "音圧と音圧レベルを相互に変換します。dBと書いた結果は単なる数値です（デシベルは対数の比であって単位ではありません）。音圧0.1Paは約74dBで、94dBはちょうど1Pa（校正器の基準レベル）にあたります。",
      es: "Convierte entre presión sonora y nivel de presión sonora. Los resultados marcados como dB son números sin unidad: el decibelio es una relación logarítmica, no una unidad. Una presión de 0,1 Pa equivale a unos 74 dB, y 94 dB corresponden a 1 Pa (el nivel de un calibrador estándar).",
      "pt-BR": "Converta entre pressão sonora e nível de pressão sonora. Os resultados marcados como dB são números puros: o decibel é uma razão logarítmica, não uma unidade. Uma pressão de 0,1 Pa equivale a cerca de 74 dB, e 94 dB correspondem a 1 Pa (o nível de um calibrador padrão).",
      de: "Rechnet zwischen Schalldruck und Schalldruckpegel um. Die mit dB gekennzeichneten Ergebnisse sind reine Zahlen: Dezibel ist ein logarithmisches Verhältnis, keine Einheit. Ein Schalldruck von 0,1 Pa entspricht etwa 74 dB, und 94 dB entsprechen 1 Pa (dem Pegel eines Standard-Kalibrators).",
      fr: "Convertir entre pression acoustique et niveau de pression acoustique. Les résultats notés dB sont des nombres sans unité : le décibel est un rapport logarithmique, pas une unité. Une pression de 0,1 Pa vaut environ 74 dB, et 94 dB correspondent à 1 Pa (le niveau d'un calibreur étalon).",
    },
    localConstants: [
      { symbol: "p", expression: "0.1Pa" },
      { symbol: "p₀", expression: "20µPa" },
      { symbol: "L", expression: "94" },
    ],
    steps: [
      { title: { en: "Sound pressure level (dB)", ja: "音圧レベル（dB）", es: "Nivel de presión sonora (dB)", "pt-BR": "Nível de pressão sonora (dB)", de: "Schalldruckpegel (dB)", fr: "Niveau de pression acoustique (dB)" }, expression: "log(p/p₀)*20", targetUnit: "", formulaLatex: "L_p = 20\\log_{10}\\dfrac{p}{p_0}" },
      { title: { en: "Sound pressure for a given level", ja: "そのレベルに対応する音圧", es: "Presión sonora correspondiente a ese nivel", "pt-BR": "Pressão sonora correspondente a esse nível", de: "Schalldruck zu diesem Pegel", fr: "Pression acoustique correspondant à ce niveau" }, expression: "p₀*10^(L/20)", targetUnit: "Pa", formulaLatex: "p_L = p_0 \\cdot 10^{L/20}" },
    ],
  },
  {
    title: { en: "Combining two sound sources (dB addition)", ja: "2つの音源の合成（デシベルの加算）", es: "Suma de dos fuentes sonoras (suma de niveles en dB)", "pt-BR": "Soma de duas fontes sonoras (soma de níveis em dB)", de: "Zwei Schallquellen zusammen (Pegeladdition)", fr: "Combinaison de deux sources sonores (addition des niveaux en dB)" },
    description: {
      en: "Decibels do not add arithmetically: you must convert back to power, sum, and take the logarithm again. All values here are plain numbers in dB. 85 dB plus 82 dB is about 86.8 dB, and two identical sources are only about 3 dB louder than one.",
      ja: "デシベルはそのまま足し算できません。いったん音のパワー（強さ）に戻して足し、もう一度対数を取ります。ここでの値はすべてdBを表す数値です。85dBと82dBを合わせると約86.8dBで、同じ大きさの音源を2つにしても約3dB増えるだけです。",
      es: "Los decibelios no se suman aritméticamente: hay que volver a la potencia, sumar y tomar de nuevo el logaritmo. Todos los valores de aquí son números sin unidad expresados en dB. 85 dB más 82 dB dan unos 86,8 dB, y dos fuentes idénticas suenan solo unos 3 dB más fuerte que una sola.",
      "pt-BR": "Os decibéis não se somam aritmeticamente: é preciso voltar à potência, somar e tirar o logaritmo de novo. Todos os valores aqui são números puros expressos em dB. 85 dB mais 82 dB dão cerca de 86,8 dB, e duas fontes idênticas soam apenas cerca de 3 dB mais alto do que uma só.",
      de: "Dezibel lassen sich nicht einfach addieren: Man muss zur Leistung zurückrechnen, summieren und erneut logarithmieren. Alle Werte hier sind reine Zahlen in dB. 85 dB und 82 dB ergeben zusammen etwa 86,8 dB, und zwei gleich laute Quellen sind nur etwa 3 dB lauter als eine.",
      fr: "Les décibels ne s'additionnent pas arithmétiquement : il faut revenir à la puissance, sommer, puis reprendre le logarithme. Toutes les valeurs ici sont des nombres sans unité exprimés en dB. 85 dB plus 82 dB font environ 86,8 dB, et deux sources identiques ne sont que 3 dB plus fortes qu'une seule.",
    },
    localConstants: [
      { symbol: "L₁", expression: "85" },
      { symbol: "L₂", expression: "82" },
    ],
    steps: [
      { title: { en: "Combined level (dB)", ja: "合成した音圧レベル（dB）", es: "Nivel combinado (dB)", "pt-BR": "Nível combinado (dB)", de: "Gesamtpegel (dB)", fr: "Niveau combiné (dB)" }, expression: "log(10^(L₁/10)+10^(L₂/10))*10", targetUnit: "", formulaLatex: "L_{sum} = 10\\log_{10}\\left(10^{L_1/10} + 10^{L_2/10}\\right)" },
      { title: { en: "Two identical sources (dB)", ja: "同じ音源を2つにしたとき（dB）", es: "Dos fuentes idénticas (dB)", "pt-BR": "Duas fontes idênticas (dB)", de: "Zwei gleiche Quellen (dB)", fr: "Deux sources identiques (dB)" }, expression: "L₁+log(2)*10", targetUnit: "", formulaLatex: "L_{2x} = L_1 + 10\\log_{10} 2" },
    ],
  },
  {
    title: { en: "Level drop with distance (inverse-square law)", ja: "距離による音圧レベルの減衰（逆二乗則）", es: "Atenuación del nivel con la distancia (ley del inverso del cuadrado)", "pt-BR": "Atenuação do nível com a distância (lei do inverso do quadrado)", de: "Pegelabnahme mit der Entfernung (quadratisches Abstandsgesetz)", fr: "Atténuation du niveau avec la distance (loi de l'inverse du carré)" },
    description: {
      en: "In a free field the level falls by 6 dB every time the distance doubles. The dB values here are plain numbers. Starting from 100 dB at 1 m, ten times the distance costs 20 dB, and the level is down to 85 dB at about 5.6 m.",
      ja: "遮るもののない空間では、距離が2倍になるごとに音圧レベルは6dB下がります。dBの値は単なる数値です。1mで100dBなら、距離10倍で20dB下がり、85dBまで下がるのは約5.6m先です。",
      es: "En campo libre, el nivel baja 6 dB cada vez que se duplica la distancia. Los valores en dB son números sin unidad. Partiendo de 100 dB a 1 m, multiplicar la distancia por diez cuesta 20 dB, y el nivel baja a 85 dB a unos 5,6 m.",
      "pt-BR": "Em campo livre, o nível cai 6 dB cada vez que a distância dobra. Os valores em dB são números puros. Partindo de 100 dB a 1 m, multiplicar a distância por dez custa 20 dB, e o nível chega a 85 dB a cerca de 5,6 m.",
      de: "Im Freifeld sinkt der Pegel um 6 dB, sobald sich die Entfernung verdoppelt. Die dB-Werte sind reine Zahlen. Ausgehend von 100 dB in 1 m kostet die zehnfache Entfernung 20 dB, und auf 85 dB ist der Pegel bei etwa 5,6 m gefallen.",
      fr: "En champ libre, le niveau baisse de 6 dB chaque fois que la distance double. Les valeurs en dB sont des nombres sans unité. En partant de 100 dB à 1 m, multiplier la distance par dix coûte 20 dB, et le niveau descend à 85 dB vers 5,6 m.",
    },
    localConstants: [
      { symbol: "L₁", expression: "100" },
      { symbol: "r₁", expression: "1m" },
      { symbol: "r₂", expression: "10m" },
      { symbol: "Lₜ", expression: "85" },
    ],
    steps: [
      { title: { en: "Level at the new distance (dB)", ja: "離れた地点の音圧レベル（dB）", es: "Nivel a la nueva distancia (dB)", "pt-BR": "Nível na nova distância (dB)", de: "Pegel in der neuen Entfernung (dB)", fr: "Niveau à la nouvelle distance (dB)" }, expression: "L₁-log(r₂/r₁)*20", targetUnit: "", formulaLatex: "L_2 = L_1 - 20\\log_{10}\\dfrac{r_2}{r_1}" },
      { title: { en: "Distance where the level reaches the target", ja: "目標レベルまで下がる距離", es: "Distancia a la que se alcanza el nivel objetivo", "pt-BR": "Distância em que o nível chega ao valor alvo", de: "Entfernung, in der der Zielpegel erreicht wird", fr: "Distance à laquelle le niveau visé est atteint" }, expression: "r₁*10^((L₁-Lₜ)/20)", targetUnit: "m", formulaLatex: "r_t = r_1 \\cdot 10^{(L_1 - L_t)/20}" },
    ],
  },
  {
    title: { en: "Room modes (axial standing waves)", ja: "部屋の定在波（軸モード）", es: "Modos de sala (ondas estacionarias axiales)", "pt-BR": "Modos da sala (ondas estacionárias axiais)", de: "Raummoden (axiale stehende Wellen)", fr: "Modes propres de la salle (ondes stationnaires axiales)" },
    description: {
      en: "Each pair of parallel walls supports a standing wave whose fundamental is half a wavelength across the room. These axial modes are what makes bass uneven in a listening room. For a 4.5 × 3.6 × 2.4 m room the fundamentals land near 38, 48, and 71 Hz.",
      ja: "向かい合った壁のあいだには、部屋の寸法が半波長になる定在波が立ちます。この軸モードが、リスニングルームで低音のむらを生む原因です。4.5×3.6×2.4mの部屋なら、それぞれ約38Hz・48Hz・71Hzになります。",
      es: "Cada par de paredes paralelas sostiene una onda estacionaria cuya frecuencia fundamental corresponde a media longitud de onda entre ellas. Estos modos axiales son los que hacen que los graves suenen irregulares en una sala de escucha. En una sala de 4,5 × 3,6 × 2,4 m las fundamentales quedan cerca de 38, 48 y 71 Hz.",
      "pt-BR": "Cada par de paredes paralelas sustenta uma onda estacionária cuja frequência fundamental corresponde a meio comprimento de onda entre elas. Esses modos axiais são o que deixa os graves irregulares em uma sala de escuta. Em uma sala de 4,5 × 3,6 × 2,4 m, as fundamentais ficam perto de 38, 48 e 71 Hz.",
      de: "Zwischen je zwei parallelen Wänden bildet sich eine stehende Welle, deren Grundfrequenz einer halben Wellenlänge über die Raumabmessung entspricht. Diese Axialmoden sind die Ursache für ungleichmäßigen Bass im Hörraum. In einem Raum von 4,5 × 3,6 × 2,4 m liegen die Grundfrequenzen bei etwa 38, 48 und 71 Hz.",
      fr: "Entre chaque paire de parois parallèles s'installe une onde stationnaire dont la fréquence fondamentale correspond à une demi-longueur d'onde. Ces modes axiaux sont ce qui rend les basses irrégulières dans une salle d'écoute. Pour une salle de 4,5 × 3,6 × 2,4 m, les fondamentales se situent vers 38, 48 et 71 Hz.",
    },
    localConstants: [
      { symbol: "c", expression: "343m/s" },
      { symbol: "L", expression: "4.5m" },
      { symbol: "W", expression: "3.6m" },
      { symbol: "H", expression: "2.4m" },
    ],
    steps: [
      { title: { en: "Mode along the length", ja: "長さ方向のモード", es: "Modo en el sentido del largo", "pt-BR": "Modo no sentido do comprimento", de: "Mode in Längsrichtung", fr: "Mode dans le sens de la longueur" }, expression: "c/(L*2)", targetUnit: "Hz", formulaLatex: "f_L = \\dfrac{c}{2L}" },
      { title: { en: "Mode across the width", ja: "幅方向のモード", es: "Modo en el sentido del ancho", "pt-BR": "Modo no sentido da largura", de: "Mode in Querrichtung", fr: "Mode dans le sens de la largeur" }, expression: "c/(W*2)", targetUnit: "Hz", formulaLatex: "f_W = \\dfrac{c}{2W}" },
      { title: { en: "Mode between floor and ceiling", ja: "床と天井のあいだのモード", es: "Modo entre el suelo y el techo", "pt-BR": "Modo entre o piso e o teto", de: "Mode zwischen Boden und Decke", fr: "Mode entre le sol et le plafond" }, expression: "c/(H*2)", targetUnit: "Hz", formulaLatex: "f_H = \\dfrac{c}{2H}" },
      { title: { en: "Wavelength of the length mode", ja: "長さ方向のモードの波長", es: "Longitud de onda del modo del largo", "pt-BR": "Comprimento de onda do modo do comprimento", de: "Wellenlänge der Längsmode", fr: "Longueur d'onde du mode de la longueur" }, expression: "L*2", targetUnit: "m", formulaLatex: "\\lambda_L = 2L" },
    ],
  },
  {
    title: { en: "Speaker sensitivity, amplifier power and SPL", ja: "スピーカーの出力音圧レベルとアンプ出力から音圧レベル", es: "Sensibilidad del altavoz, potencia del amplificador y nivel de presión sonora", "pt-BR": "Sensibilidade do alto-falante, potência do amplificador e nível de pressão sonora", de: "Kennschalldruck, Verstärkerleistung und Schalldruckpegel", fr: "Sensibilité du haut-parleur, puissance de l'amplificateur et niveau de pression acoustique" },
    description: {
      en: "A speaker's sensitivity is the level it produces with 1 W at 1 m. Add 10 dB per tenfold power increase and subtract the distance loss to get the level at the listening position; the dB values are plain numbers. An 88 dB speaker driven with 50 W gives about 95 dB at 3 m, and reaching 105 dB there would need roughly 450 W.",
      ja: "スピーカーの出力音圧レベル（カタログの「能率」表記）は、1Wを入れて1m離れた地点で出る音圧レベルです。出力が10倍になるごとに10dB足し、距離による減衰を引けば、リスニングポジションでのレベルが出ます（dBの値は単なる数値です）。出力音圧レベル88dBのスピーカーを50Wで鳴らすと3mで約95dB、そこで105dBを出すにはおよそ450W必要です。",
      es: "La sensibilidad de un altavoz es el nivel que produce con 1 W a 1 m. Suma 10 dB por cada multiplicación de la potencia por diez y resta la atenuación con la distancia para obtener el nivel en el punto de escucha; los valores en dB son números sin unidad. Un altavoz de 88 dB alimentado con 50 W da unos 95 dB a 3 m, y alcanzar allí 105 dB necesitaría alrededor de 450 W.",
      "pt-BR": "A sensibilidade de um alto-falante é o nível que ele produz com 1 W a 1 m. Some 10 dB a cada multiplicação da potência por dez e subtraia a atenuação com a distância para obter o nível na posição de escuta; os valores em dB são números puros. Um alto-falante de 88 dB acionado com 50 W dá cerca de 95 dB a 3 m, e chegar a 105 dB ali exigiria por volta de 450 W.",
      de: "Der Kennschalldruck eines Lautsprechers ist der Pegel, den er mit 1 W in 1 m Entfernung erzeugt. Pro Verzehnfachung der Leistung kommen 10 dB dazu; zieht man die Pegelabnahme mit der Entfernung ab, ergibt sich der Pegel am Hörplatz. Die dB-Werte sind reine Zahlen. Ein Lautsprecher mit 88 dB liefert mit 50 W etwa 95 dB in 3 m, und für 105 dB an dieser Stelle wären rund 450 W nötig.",
      fr: "La sensibilité d'un haut-parleur est le niveau qu'il produit avec 1 W à 1 m. Ajouter 10 dB par multiplication de la puissance par dix, puis retrancher l'atténuation due à la distance, donne le niveau à la position d'écoute ; les valeurs en dB sont des nombres sans unité. Un haut-parleur de 88 dB alimenté par 50 W donne environ 95 dB à 3 m, et atteindre 105 dB à cet endroit demanderait environ 450 W.",
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
      { title: { en: "Level at the listening position (dB)", ja: "リスニングポジションの音圧レベル（dB）", es: "Nivel en el punto de escucha (dB)", "pt-BR": "Nível na posição de escuta (dB)", de: "Pegel am Hörplatz (dB)", fr: "Niveau à la position d'écoute (dB)" }, expression: "Sₑ+log(P/P₀)*10-log(r/r₀)*20", targetUnit: "", formulaLatex: "L_p = S_e + 10\\log_{10}\\dfrac{P}{P_0} - 20\\log_{10}\\dfrac{r}{r_0}" },
      { title: { en: "Power needed for the target level", ja: "目標レベルに必要な出力", es: "Potencia necesaria para el nivel objetivo", "pt-BR": "Potência necessária para o nível alvo", de: "Für den Zielpegel nötige Leistung", fr: "Puissance nécessaire pour le niveau visé" }, expression: "P₀*10^((Lₜ-Sₑ+log(r/r₀)*20)/10)", targetUnit: "W", formulaLatex: "P_t = P_0 \\cdot 10^{(L_t - S_e + 20\\log_{10}(r/r_0))/10}" },
    ],
  },
];
