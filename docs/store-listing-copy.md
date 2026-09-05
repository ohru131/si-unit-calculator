# Google Play ストア掲載文（6言語）

Google Play Console の文字数上限（短い説明 80字・詳しい説明 4,000字）に収まることを確認済み。
各言語の文字数は Python の `len()`（Unicode文字数）で実測した値。訳語は `docs/i18n-glossary.md` の対訳・表記ルールに揃えてある。

**対象は Android（Google Play）のみ。** iOS向けの文言は用意しない（今回の提出スコープ外）。

**スクリーンショットは日英の2言語分のみ撮影する**（`docs/screenshot-capture-plan.md` 参照）。es/pt-BR/de/fr の掲載ページには**英語のスクリーンショットを流用する**。掲載文だけこの4言語で用意し、画像は差し替えない。

新機能の裏取り元（今回追記した機能と根拠）:

- 計算ノート（184件・KaTeX数式・親子2階層カテゴリ） — `CLAUDE.md`「直近の作業履歴」3・5・6・20番（PR #46）、`lib/notebook-formulas/`実測（`PRESET_NOTEBOOK_SEEDS`合計184件・`PRESET_NOTEBOOK_CATEGORIES`38件＝最上位9枚＋サブカテゴリ29枚）。カテゴリ名は各言語とも`PRESET_NOTEBOOK_CATEGORIES`の`label`をそのまま使い、アプリ内表示と一致させている
- 厳密値表示（分数・πの有理数倍・√の有理数倍） — `CLAUDE.md`「直近の作業履歴」19番（PR #42）、`lib/exact-value.ts`。チップ文言は`app/(tabs)/index.tsx`の`decimalForm`/`exactForm`（en `Decimal`/`Exact`、ja `小数`/`分数・π`、es `Decimal`/`Exacto`、pt-BR `Decimal`/`Exato`、de `Dezimal`/`Exakt`、fr `Décimal`/`Exact`）
- 計算ノートの検索（タイトル・説明文・カテゴリ名を横断） — `CLAUDE.md`「直近の作業履歴」21番（PR #48）、`lib/notebook-search.ts`、`app/(tabs)/constants.tsx`の`notebookSearch`
- 地域別の既定値（商用電源の電圧・ブレーカー定格・金額） — 同21番（PR #48）、`lib/preset-regional-defaults.ts`。訳語は`lib/notebook-formulas/source/practical.ts`の「ブレーカー容量」ノート（es `voltaje de la red`/`disyuntor`、pt-BR `tensão da rede`/`disjuntor`、de `Netzspannung`/`Leitungsschutzschalter`、fr `tension du secteur`/`disjoncteur`）に合わせた
- 単位比較表 — `CLAUDE.md`「直近の作業履歴」16番（PR #33）、`lib/unit-comparison.ts`
- ユーザー定義単位（倍率形式・関数形式・オフセット対応） — `CLAUDE.md`「直近の作業履歴」17番（PR #34）、`lib/custom-units.ts`
- 進数（2進・8進・16進）表示・入力 — `CLAUDE.md`「直近の作業履歴」18番（PR #37/#38/#39、#40で修正）、`lib/number-base.ts`
- 6言語対応（UI・単位名・エラーメッセージ・プリセット全件） — `CLAUDE.md`「直近の作業履歴」7〜9番（PR #21〜#23）
- バックアップ／復元（計算ノート・グローバル定数・**自作単位も含む**） — `lib/constants-backup.ts` / `lib/notebooks-backup.ts` の実装（`customUnits`フィールドの存在を確認済み。関連コミット `5ccfa29`）。**注**: `CLAUDE.md`末尾の「次にやりそうなこと」は自作単位のバックアップ対応をまだ未着手のTODOとして書いているが、これは更新漏れで、実際のコードは既に対応済み（本セッションでコミット履歴とソースの両方を確認した）
- 買い切り1本・サブスクなし — `CLAUDE.md`「直近の作業履歴」14番、`docs/market-research-2026-09.md` 第4節
- 無料版でも履歴無制限 — 同上14番
- Proの実際の4特典（広告非表示・CSVエクスポート・マイ単位セット・ノート共有／PDF書き出し） — `app/(tabs)/pro.tsx` の `EN_COPY.features`（読み取りのみ、改変していない）

---

## 短い説明（Short description、上限80字）

| 言語 | 文字数 | 本文 |
|---|---|---|
| en | 73 | Calculate with units, check dimensions, and browse 184 formula notebooks. |
| ja | 34 | 単位付きで計算し、次元をチェック。184件の公式ノートも使える電卓。 |
| es | 65 | Calcula con unidades, valida dimensiones y explora 184 cuadernos. |
| pt-BR | 62 | Calcule com unidades, valide dimensões e explore 184 cadernos. |
| de | 66 | Rechne mit Einheiten, prüfe Dimensionen und nutze 184 Rechenhefte. |
| fr | 71 | Calculez avec unités, vérifiez les dimensions, 184 carnets de formules. |

短い説明には**厳密値表示を入れていない**。en/fr は既に73字・71字で、`exact fractions` 相当の語（+15字前後）を足すと80字を超える。ja だけ足すと6言語で訴求点が揃わなくなるため、厳密値は詳しい説明の機能ブロック先頭に置いた。

## 詳しい説明（Full description、上限4,000字）

### English（3,209字）

```
Unit Calculator is a dimensional calculator: type an expression such as 5cm + 1mm or 100N ÷ 0.01m², and it normalizes every value to SI base units before calculating, checks that the dimensions actually match, then lets you read the result in any compatible unit. Mixing units by mistake shows a clear error instead of a wrong number.

WHAT MAKES IT DIFFERENT
• Real-time calculation with automatic SI normalization and dimension checking, right as you type.
• Read any result as an exact value instead of a rounded decimal: tap Exact and 1/3 stays 1/3, 2*pi*50 becomes 100π, and sqrt(8) becomes 2√2 — typeset as a real fraction or radical, and copied exactly as shown.
• Compare one result across every compatible unit at a glance, in the same order as the unit chips you already know.
• Define your own units, either as a simple multiple (2shaku = 0.606m) or as a formula (for offset units like temperature scales).
• Switch a plain number between decimal, binary, octal, and hexadecimal on the same result card — handy for electronics and programming.
• Save reusable constants such as W = 3cm and reuse them later in any expression.

184 FORMULA NOTEBOOKS
Browse calculation notebooks with real, typeset math (not plain text), in nine libraries:
- School science (speed & motion, density & concentration, pressure & buoyancy, force, work & levers, heat, circuits, light & sound, earth science, chemical change)
- High school physics (mechanics, thermodynamics, waves, electricity, atomic physics)
- Chemistry stoichiometry, and astronomy & space
- Electricity & energy (practical electricity, hobby electronics, solar power & batteries)
- Hobbies & making (photography, sound & audio, DIY & home improvement, 3D printing)
- Home & everyday life (cooking & baking, coffee & home brewing, fitness & running, weather)
- Physics of cars & bicycles
- Mechanical & structural design (stress & strain, beams & columns, shafts & power transmission, machine elements)
Search every notebook at once by title, description, or category to reach the one you need. Every notebook remembers your last values, chains results between steps, and shows the underlying formula so you can see the "why," not just the number.

SIX LANGUAGES, FULLY TRANSLATED
The interface, unit names, error messages, and every one of the 184 notebooks are available in English, Japanese, Spanish, Portuguese (Brazil), German, and French. Notebooks whose values depend on where you live open with defaults that match your region — mains voltage, circuit breaker rating, and electricity prices.

FREE AND UNLIMITED
Your full calculation history is unlimited for everyone — it is never trimmed or locked behind a purchase. Back up your notebooks, global constants, and custom units to a file and restore them on another device.

UNIT CALCULATOR PRO
A single one-time purchase — no subscription, ever — unlocks:
• An ad-free experience
• CSV export of your calculation history
• Your own saved unit sets, for faster entry of the units you use most
• Sharing a notebook as a formatted document you can print or save as PDF

Unit Calculator is built for students, engineers, makers, and anyone who wants to trust the number a calculator gives them.
```

### 日本語（1,341字）

```
単位付き電卓は、単位ごと数式を入力する電卓です。「5cm + 1mm」や「100N ÷ 0.01m²」のように入力すると、すべての値をまずSI基本単位に正規化してから計算し、次元（単位の種類）が本当に合っているかをチェックし、結果を好きな単位で表示します。単位を間違えて足し引きしようとすると、誤った数値ではなく分かりやすいエラーが表示されます。

このアプリが違う理由
・入力するそばからSI正規化と次元チェックをしてリアルタイムに計算
・答えを丸めた小数ではなく厳密値で読める。「分数・π」に切り替えると 1/3 はそのまま 1/3、2*pi*50 は 100π、sqrt(8) は 2√2 と、本物の分数の横棒・根号で表示（コピーも画面と同じ表記）
・1つの結果を、単位チップと同じ順番・同じ候補で全単位に並べて一覧比較
・自分だけの単位を登録できる。倍率（2尺＝0.606m）でも、摂氏・華氏のようなオフセット付きの式でも作れる
・単位なしの数値を10進・2進・8進・16進で切り替えて表示（電気・組み込み・プログラミング向け）
・「W = 3cm」のような定数を保存し、あとの式で使い回せる

184件の計算ノート
本物の組版された数式（テキストではなく）で読める計算ノートを9分野に収録:
・理科（小・中）: 速さ・運動、密度・濃度、圧力・浮力、力・仕事・てこ、熱・温度、電気・回路、光・音、地学・天気、化学変化
・高校物理: 力学、熱、波動、電気、原子
・化学の量的関係、天体・宇宙
・電気・エネルギー: 電気の基礎計算、電子工作、太陽光発電・蓄電
・趣味・ものづくり: 写真・カメラ、音響・オーディオ、DIY・住まい、3Dプリンタ
・暮らし: 料理・製菓の単位換算、コーヒー・自家醸造、フィットネス・ランニング、天気・大気
・車・自転車の物理
・機械・構造設計: 応力・ひずみ・安全率、はり・柱、軸・ねじり・動力伝達、機械要素・締結
タイトル・説明・カテゴリ名を横断する検索で、目当ての1件にすぐ辿り着けます。各ノートは前回の入力値を覚え、手順の結果を次の手順で使い回せ、数式そのものも表示するので「なぜその答えになるか」まで分かります。

6言語完全対応
UI・単位名・エラーメッセージ・184件のノートの中身まで、すべて日本語・英語・スペイン語・ポルトガル語(ブラジル)・ドイツ語・フランス語に対応しています。電源電圧・ブレーカーの定格電流・電気代のように国で変わる値は、お使いの端末の地域に合った既定値でノートが開きます。

無料でも制限なし
計算履歴は誰でも無制限。件数で切られたり購入を求められたりしません。計算ノート・グローバル定数・自作の単位はファイルへバックアップし、別端末で復元できます。

単位付き電卓 Pro
買い切り1回（サブスクなし）で以下が使えます:
・広告なし
・計算履歴のCSVエクスポート
・よく使う単位をまとめたマイ単位セット（入力が速くなる）
・計算ノートを整形済みの書類として書き出し、印刷やPDF保存が可能

単位付き電卓は、学生・エンジニア・ものづくりをする人など、電卓が出す数値を信頼したいすべての人のためのアプリです。
```

### Español（3,568字）

```
Unit Calculator es una calculadora dimensional: escribe una expresión como 5cm + 1mm o 100N ÷ 0,01 m², y la app normaliza cada valor a unidades base del SI antes de calcular, comprueba que las dimensiones realmente coincidan y te deja leer el resultado en cualquier unidad compatible. Si mezclas unidades por error, verás un aviso claro en vez de un número incorrecto.

QUÉ LA HACE DIFERENTE
• Cálculo en tiempo real con normalización SI y verificación de dimensiones mientras escribes.
• Lee cualquier resultado como valor exacto en vez de un decimal redondeado: pulsa Exacto y 1/3 sigue siendo 1/3, 2*pi*50 pasa a 100π y sqrt(8) pasa a 2√2, compuestos tipográficamente como fracción y raíz reales, y se copian tal como se ven.
• Compara un resultado en todas las unidades compatibles de un vistazo, en el mismo orden que ya conoces de los chips de unidad.
• Define tus propias unidades: como múltiplo simple (2shaku = 0,606 m) o como fórmula (para unidades con desplazamiento, como las escalas de temperatura).
• Cambia un número sin unidad entre decimal, binario, octal y hexadecimal en la misma tarjeta de resultado — útil para electrónica y programación.
• Guarda constantes reutilizables como W = 3cm y úsalas después en cualquier expresión.

184 CUADERNOS DE FÓRMULAS
Explora cuadernos de cálculo con matemáticas reales, compuestas tipográficamente (no texto plano), en nueve bibliotecas:
- Ciencias naturales (velocidad y movimiento, densidad y concentración, presión y flotabilidad, fuerza, trabajo y palancas, calor, circuitos, luz y sonido, ciencias de la Tierra, cambio químico)
- Física de bachillerato (mecánica, termodinámica, ondas, electricidad, física atómica)
- Estequiometría química, y astronomía y espacio
- Electricidad y energía (electricidad práctica, electrónica para aficionados, energía solar y baterías)
- Aficiones y creación (fotografía, sonido y audio, bricolaje y reformas, impresión 3D)
- Hogar y vida diaria (cocina y repostería, café y elaboración casera, fitness y running, tiempo y atmósfera)
- Física de los vehículos
- Diseño mecánico y estructural (esfuerzo y deformación, vigas y columnas, ejes y transmisión de potencia, elementos de máquinas)
Busca en todos los cuadernos a la vez por título, descripción o categoría para llegar al que necesitas. Cada cuaderno recuerda tus últimos valores, encadena resultados entre pasos y muestra la fórmula subyacente para que veas el "por qué", no solo el número.

SEIS IDIOMAS, TOTALMENTE TRADUCIDOS
La interfaz, los nombres de unidades, los mensajes de error y los 184 cuadernos están disponibles en inglés, japonés, español, portugués (Brasil), alemán y francés. Los cuadernos cuyos valores dependen del país se abren con valores predeterminados acordes a tu región: voltaje de la red, corriente nominal del disyuntor y precio de la electricidad.

GRATIS Y SIN LÍMITES
El historial de cálculos es ilimitado para todos, nunca se recorta ni se bloquea tras una compra. Haz copia de seguridad de tus cuadernos, constantes globales y unidades personalizadas en un archivo, y restáuralas en otro dispositivo.

UNIT CALCULATOR PRO
Una única compra — sin suscripción, nunca — desbloquea:
• Experiencia sin anuncios
• Exportación CSV de tu historial de cálculos
• Tus propios conjuntos de unidades guardados, para escribir más rápido con las unidades que más usas
• Compartir un cuaderno como documento con formato que puedes imprimir o guardar como PDF

Unit Calculator está pensada para estudiantes, ingenieros, makers y cualquiera que quiera confiar en el número que le da su calculadora.
```

### Português (Brasil)（3,476字）

```
Unit Calculator é uma calculadora dimensional: digite uma expressão como 5cm + 1mm ou 100N ÷ 0,01 m², e o app normaliza cada valor para unidades base do SI antes de calcular, verifica se as dimensões realmente coincidem e permite ler o resultado em qualquer unidade compatível. Se você misturar unidades por engano, aparece um aviso claro em vez de um número errado.

O QUE TORNA O APP DIFERENTE
• Cálculo em tempo real com normalização SI e verificação de dimensões enquanto você digita.
• Leia qualquer resultado como valor exato em vez de um decimal arredondado: toque em Exato e 1/3 continua 1/3, 2*pi*50 vira 100π e sqrt(8) vira 2√2, tipografados como fração e raiz de verdade, e copiados exatamente como aparecem.
• Compare um resultado em todas as unidades compatíveis de uma vez, na mesma ordem dos chips de unidade que você já conhece.
• Defina suas próprias unidades: como múltiplo simples (2shaku = 0,606 m) ou como fórmula (para unidades com deslocamento, como escalas de temperatura).
• Alterne um número sem unidade entre decimal, binário, octal e hexadecimal no mesmo cartão de resultado — útil para eletrônica e programação.
• Salve constantes reutilizáveis como W = 3cm e use-as depois em qualquer expressão.

184 CADERNOS DE FÓRMULAS
Explore cadernos de cálculo com matemática real, tipografada (não texto simples), em nove bibliotecas:
- Ciências (velocidade e movimento, densidade e concentração, pressão e empuxo, força, trabalho e alavancas, calor, circuitos, luz e som, ciências da Terra, mudança química)
- Física do ensino médio (mecânica, termodinâmica, ondas, eletricidade, física atômica)
- Estequiometria química, e astronomia e espaço
- Eletricidade e energia (eletricidade prática, eletrônica para hobby, energia solar e baterias)
- Hobbies e criação (fotografia, som e áudio, faça você mesmo e reformas, impressão 3D)
- Casa e dia a dia (culinária e confeitaria, café e produção caseira, fitness e corrida, tempo e atmosfera)
- Física dos veículos
- Projeto mecânico e estrutural (tensão e deformação, vigas e colunas, eixos e transmissão de potência, elementos de máquinas)
Busque em todos os cadernos de uma vez por título, descrição ou categoria para chegar ao que você precisa. Cada caderno lembra os últimos valores usados, encadeia resultados entre etapas e mostra a fórmula em si, para você entender o "porquê", não só o número.

SEIS IDIOMAS, TOTALMENTE TRADUZIDO
A interface, os nomes das unidades, as mensagens de erro e todos os 184 cadernos estão disponíveis em inglês, japonês, espanhol, português (Brasil), alemão e francês. Os cadernos cujos valores dependem do país abrem com padrões condizentes com a sua região: tensão da rede, corrente nominal do disjuntor e preço da energia elétrica.

GRATUITO E SEM LIMITES
O histórico de cálculos é ilimitado para todos — nunca é reduzido nem bloqueado por trás de uma compra. Faça backup dos seus cadernos, constantes globais e unidades personalizadas em um arquivo e restaure-os em outro dispositivo.

UNIT CALCULATOR PRO
Uma única compra avulsa — sem assinatura, nunca — desbloqueia:
• Experiência sem anúncios
• Exportação em CSV do seu histórico de cálculos
• Seus próprios conjuntos de unidades salvos, para digitar mais rápido as unidades que mais usa
• Compartilhar um caderno como documento formatado que você pode imprimir ou salvar em PDF

O Unit Calculator foi feito para estudantes, engenheiros, makers e qualquer pessoa que queira confiar no número que a calculadora mostra.
```

### Deutsch（3,538字）

```
Unit Calculator ist ein dimensionsbewusster Rechner: Gib einen Ausdruck wie 5cm + 1mm oder 100N ÷ 0,01 m² ein, und die App normiert jeden Wert zuerst auf SI-Basiseinheiten, prüft, ob die Dimensionen wirklich zusammenpassen, und zeigt das Ergebnis in jeder passenden Einheit an. Vermischst du Einheiten versehentlich, erscheint eine klare Fehlermeldung statt einer falschen Zahl.

WAS DIE APP ANDERS MACHT
• Echtzeitberechnung mit automatischer SI-Normierung und Dimensionsprüfung, während du tippst.
• Lies jedes Ergebnis als exakten Wert statt als gerundete Dezimalzahl: Tippe auf Exakt, und 1/3 bleibt 1/3, 2*pi*50 wird zu 100π, sqrt(8) wird zu 2√2 — als echter Bruch und echtes Wurzelzeichen gesetzt und genau so kopiert, wie es dasteht.
• Vergleiche ein Ergebnis auf einen Blick in allen passenden Einheiten, in derselben Reihenfolge wie die bekannten Einheiten-Chips.
• Definiere eigene Einheiten: als einfaches Vielfaches (2shaku = 0,606 m) oder als Formel (für Einheiten mit Offset, wie Temperaturskalen).
• Schalte eine einheitenlose Zahl auf derselben Ergebniskarte zwischen Dezimal, Binär, Oktal und Hexadezimal um — praktisch für Elektronik und Programmierung.
• Speichere wiederverwendbare Konstanten wie W = 3cm und nutze sie später in jedem Ausdruck.

184 RECHENHEFTE
Durchstöbere Rechenhefte mit echter, gesetzter Mathematik (kein reiner Text) in neun Bibliotheken:
- Naturwissenschaften (Geschwindigkeit & Bewegung, Dichte & Konzentration, Druck & Auftrieb, Kraft, Arbeit & Hebel, Wärme, Stromkreise, Licht & Schall, Geowissenschaften, chemische Veränderung)
- Physik (Oberstufe) (Mechanik, Thermodynamik, Wellen, Elektrizität, Atomphysik)
- Stöchiometrie sowie Astronomie & Weltraum
- Elektrizität & Energie (praktische Elektrotechnik, Hobby-Elektronik, Solarstrom & Batterien)
- Hobby & Selbermachen (Fotografie, Ton & Audio, Heimwerken & Renovieren, 3D-Druck)
- Haushalt & Alltag (Kochen & Backen, Kaffee & Hausbrauen, Fitness & Laufen, Wetter & Atmosphäre)
- Physik von Autos & Fahrrädern
- Maschinen- & Tragwerksentwurf (Spannung & Dehnung, Balken & Stützen, Wellen & Antriebstechnik, Maschinenelemente)
Durchsuche alle Rechenhefte auf einmal nach Titel, Beschreibung oder Kategorie, um genau das passende zu finden. Jedes Rechenheft merkt sich deine letzten Werte, verkettet Ergebnisse zwischen Schritten und zeigt die zugrunde liegende Formel, damit du das „Warum" siehst, nicht nur die Zahl.

SECHS SPRACHEN, VOLLSTÄNDIG ÜBERSETZT
Die Oberfläche, Einheitennamen, Fehlermeldungen und alle 184 Rechenhefte gibt es auf Englisch, Japanisch, Spanisch, brasilianischem Portugiesisch, Deutsch und Französisch. Rechenhefte, deren Werte vom Land abhängen, starten mit Vorgaben passend zu deiner Region: Netzspannung, Nennstrom des Leitungsschutzschalters und Strompreis.

KOSTENLOS UND UNBEGRENZT
Der komplette Berechnungsverlauf ist für alle unbegrenzt — er wird nie gekürzt oder hinter einem Kauf versteckt. Sichere deine Rechenhefte, globalen Konstanten und eigenen Einheiten in einer Datei und stelle sie auf einem anderen Gerät wieder her.

UNIT CALCULATOR PRO
Ein einmaliger Kauf — nie ein Abo — schaltet frei:
• Werbefreie Nutzung
• CSV-Export deines Berechnungsverlaufs
• Deine eigenen gespeicherten Einheitensets für schnellere Eingabe deiner meistgenutzten Einheiten
• Ein Rechenheft als formatiertes Dokument teilen, das du drucken oder als PDF speichern kannst

Unit Calculator ist für Schülerinnen und Schüler, Ingenieure, Makerinnen und Maker und alle gemacht, die der Zahl aus ihrem Rechner vertrauen wollen.
```

### Français（3,812字）

```
Unit Calculator est une calculatrice dimensionnelle : saisissez une expression telle que 5cm + 1mm ou 100N ÷ 0,01 m², et l'application normalise chaque valeur en unités de base du SI avant de calculer, vérifie que les dimensions correspondent réellement, puis affiche le résultat dans n'importe quelle unité compatible. Si vous mélangez des unités par erreur, un message d'erreur clair s'affiche au lieu d'un résultat faux.

CE QUI LA REND DIFFÉRENTE
• Calcul en temps réel avec normalisation SI et vérification des dimensions pendant la saisie.
• Lisez n'importe quel résultat sous forme exacte plutôt qu'en décimal arrondi : appuyez sur Exact et 1/3 reste 1/3, 2*pi*50 devient 100π, sqrt(8) devient 2√2 — composés comme une vraie fraction et un vrai radical, et copiés tels qu'affichés.
• Comparez un résultat dans toutes les unités compatibles d'un coup d'œil, dans le même ordre que les puces d'unité que vous connaissez déjà.
• Définissez vos propres unités : comme un simple multiple (2shaku = 0,606 m) ou comme une formule (pour les unités à décalage, comme les échelles de température).
• Basculez un nombre sans unité entre décimal, binaire, octal et hexadécimal sur la même carte de résultat — pratique pour l'électronique et la programmation.
• Enregistrez des constantes réutilisables comme W = 3cm et réutilisez-les ensuite dans n'importe quelle expression.

184 CARNETS DE FORMULES
Parcourez des carnets de calcul avec de vraies formules composées typographiquement (pas du texte brut), répartis en neuf bibliothèques :
- Sciences (vitesse et mouvement, masse volumique et concentration, pression et flottabilité, force, travail et leviers, chaleur, circuits, lumière et son, sciences de la Terre, transformation chimique)
- Physique du lycée (mécanique, thermodynamique, ondes, électricité, physique atomique)
- Stœchiométrie, astronomie et espace
- Électricité et énergie (électricité pratique, électronique de loisir, énergie solaire et batteries)
- Loisirs et fabrication (photographie, son et audio, bricolage et rénovation, impression 3D)
- Maison et vie quotidienne (cuisine et pâtisserie, café et brassage maison, fitness et course à pied, météo et atmosphère)
- Physique des voitures et vélos
- Conception mécanique et structurale (contrainte et déformation, poutres et poteaux, arbres et transmission de puissance, éléments de machines)
Recherchez dans tous les carnets à la fois par titre, description ou catégorie pour aller droit à celui qu'il vous faut. Chaque carnet mémorise vos dernières valeurs, enchaîne les résultats entre les étapes et affiche la formule elle-même, pour voir le « pourquoi », pas seulement le nombre.

SIX LANGUES, ENTIÈREMENT TRADUITES
L'interface, les noms d'unités, les messages d'erreur et les 184 carnets sont disponibles en anglais, japonais, espagnol, portugais (Brésil), allemand et français. Les carnets dont les valeurs dépendent du pays s'ouvrent avec des valeurs par défaut adaptées à votre région : tension du secteur, calibre du disjoncteur et prix de l'électricité.

GRATUIT ET SANS LIMITE
L'historique des calculs est illimité pour tout le monde — il n'est jamais réduit ni verrouillé derrière un achat. Sauvegardez vos carnets, vos constantes globales et vos unités personnalisées dans un fichier et restaurez-les sur un autre appareil.

UNIT CALCULATOR PRO
Un achat unique — jamais d'abonnement — débloque :
• Une expérience sans publicité
• L'export CSV de votre historique de calculs
• Vos propres ensembles d'unités enregistrés, pour saisir plus vite les unités que vous utilisez le plus
• Le partage d'un carnet sous forme de document mis en forme, à imprimer ou enregistrer en PDF

Unit Calculator est conçue pour les étudiants, les ingénieurs, les makers et toute personne qui veut faire confiance au nombre affiché par sa calculatrice.
```

## 訳語チェックの注記

- 「計算ノート」= es `cuaderno (de cálculo)` / pt-BR `caderno (de cálculo)` / de `Rechenheft` / fr `carnet (de calcul)`（`docs/i18n-glossary.md` F節の確定訳）。
- 仏語の「密度」は `masse volumique`（`densité`は無次元の別概念のため誤訳、同用語集A節）。カテゴリ名の列挙でも `masse volumique et concentration` を使っている。
- 厳密値表示の呼称は、アプリのチップ文言（`Exact` / `分数・π` / `Exacto` / `Exato` / `Exakt` / `Exact`）をそのまま掲載文に出し、画面と読み手の語彙がずれないようにした。日本語だけチップが「分数・π」なので、掲載文でも「厳密値」と併記している。
- 9つの最上位カテゴリとサブカテゴリの名称は、`lib/notebook-formulas/source/categories.ts` の `label`（6言語分）をそのまま引き写した。掲載文で独自訳を作ると、ストアで見た名前がアプリ内に存在しないことになる。
- 電圧の訳は西語のみ `voltaje`（`tensión` は「応力」とも訳語衝突するため、アプリ本体でも `voltaje` を採用済み）。独語 `Netzspannung`・仏語 `tension du secteur` は複合語・限定句で曖昧さが無いのでそのまま。
- 独語名詞は常に大文字化（`Rechenheft`、`Einheiten`、`Formeln` など）。
- 数字の小数点は、地の文（散文）中では各言語の慣習に合わせてコンマ（`0,01 m²`）。ただし英語のみASCIIドット。
- 「自作単位」の訳（`unidades personalizadas` / `eigene Einheiten` / `unités personnalisées`）は `app/(tabs)/settings.tsx` の実装済みUI文言（`lib/global-settings.tsx`の`customUnits`キー）に合わせた。
- 短い説明・詳しい説明とも、Pro特典の呼称は`app/(tabs)/pro.tsx`の`EN_COPY.features`4点（Ad-free / CSV export / My unit sets / Notebook sharing）の実際の文言に対応させてあり、憶測の機能名を使っていない。
