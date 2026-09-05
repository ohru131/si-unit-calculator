# Google Play ストア掲載文（6言語）

Google Play Console の文字数上限（短い説明 80字・詳しい説明 4,000字）に収まることを確認済み。
各言語の文字数は Python の `len()`（Unicode文字数）で実測した値。訳語は `docs/i18n-glossary.md` の対訳・表記ルールに揃えてある。

**対象は Android（Google Play）のみ。** iOS向けの文言は用意しない（今回の提出スコープ外）。

**スクリーンショットは日英の2言語分のみ撮影する**（`docs/screenshot-capture-plan.md` 参照）。es/pt-BR/de/fr の掲載ページには**英語のスクリーンショットを流用する**。掲載文だけこの4言語で用意し、画像は差し替えない。

新機能の裏取り元（今回追記した機能と根拠）:

- 計算ノート（112件超・KaTeX数式・親子2階層カテゴリ） — `CLAUDE.md`「直近の作業履歴」3・5・6番、`lib/notebook-formulas/`実測（`PRESET_NOTEBOOK_SEEDS`合計112件・`PRESET_NOTEBOOK_CATEGORIES`23件）
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
| en | 74 | Calculate with units, check dimensions, and browse 112+ formula notebooks. |
| ja | 35 | 単位付きで計算し、次元をチェック。112件超の公式ノートも使える電卓。 |
| es | 72 | Calcula con unidades, valida dimensiones y explora más de 112 cuadernos. |
| pt-BR | 70 | Calcule com unidades, valide dimensões e explore mais de 112 cadernos. |
| de | 71 | Rechne mit Einheiten, prüfe Dimensionen und nutze über 112 Rechenhefte. |
| fr | 72 | Calculez avec unités, vérifiez les dimensions, 112+ carnets de formules. |

## 詳しい説明（Full description、上限4,000字）

### English（2,398字）

```
Unit Calculator is a dimensional calculator: type an expression such as 5cm + 1mm or 100N ÷ 0.01m², and it normalizes every value to SI base units before calculating, checks that the dimensions actually match, then lets you read the result in any compatible unit. Mixing units by mistake shows a clear error instead of a wrong number.

WHAT MAKES IT DIFFERENT
• Real-time calculation with automatic SI normalization and dimension checking, right as you type.
• Compare one result across every compatible unit at a glance, in the same order as the unit chips you already know.
• Define your own units, either as a simple multiple (2shaku = 0.606m) or as a formula (for offset units like temperature scales).
• Switch a plain number between decimal, binary, octal, and hexadecimal on the same result card — handy for electronics and programming.
• Save reusable constants such as W = 3cm and reuse them later in any expression.

112+ FORMULA NOTEBOOKS
Browse calculation notebooks with real, typeset math (not plain text) covering:
- Elementary and middle-school science (speed, density, pressure, levers, heat, electricity, light and sound, earth science, chemistry)
- High-school physics (mechanics, thermodynamics, waves, electricity, atomic physics)
- Everyday electricity costs and driving costs, astronomy, fitness, chemistry, cars & bikes, cooking
- Structural/materials engineering formulas
Every notebook remembers your last values, chains results between steps, and shows the underlying formula so you can see the "why," not just the number.

SIX LANGUAGES, FULLY TRANSLATED
The interface, unit names, error messages, and every one of the 112+ notebooks are available in English, Japanese, Spanish, Portuguese (Brazil), German, and French.

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

### 日本語（977字）

```
単位付き電卓は、単位ごと数式を入力する電卓です。「5cm + 1mm」や「100N ÷ 0.01m²」のように入力すると、すべての値をまずSI基本単位に正規化してから計算し、次元（単位の種類）が本当に合っているかをチェックし、結果を好きな単位で表示します。単位を間違えて足し引きしようとすると、誤った数値ではなく分かりやすいエラーが表示されます。

このアプリが違う理由
・入力するそばからSI正規化と次元チェックをしてリアルタイムに計算
・1つの結果を、単位チップと同じ順番・同じ候補で全単位に並べて一覧比較
・自分だけの単位を登録できる。倍率（2尺＝0.606m）でも、摂氏・華氏のようなオフセット付きの式でも作れる
・単位なしの数値を10進・2進・8進・16進で切り替えて表示（電気・組み込み・プログラミング向け）
・「W = 3cm」のような定数を保存し、あとの式で使い回せる

112件超の計算ノート
本物の組版された数式（テキストではなく）で読める計算ノートを多数収録:
・理科（小・中学校）: 速さ・密度・圧力・てこ・熱・電気・光と音・地学・化学変化
・高校物理: 力学・熱・波動・電気・原子
・電気代・走行コストの目安計算、天体・宇宙、フィットネス、化学、車・自転車、料理
・材料力学の公式
各ノートは前回の入力値を覚え、手順の結果を次の手順で使い回せ、数式そのものも表示するので「なぜその答えになるか」まで分かります。

6言語完全対応
UI・単位名・エラーメッセージ・112件超のノートの中身まで、すべて日本語・英語・スペイン語・ポルトガル語(ブラジル)・ドイツ語・フランス語に対応しています。

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

### Español（2,616字）

```
Unit Calculator es una calculadora dimensional: escribe una expresión como 5cm + 1mm o 100N ÷ 0,01 m², y la app normaliza cada valor a unidades base del SI antes de calcular, comprueba que las dimensiones realmente coincidan y te deja leer el resultado en cualquier unidad compatible. Si mezclas unidades por error, verás un aviso claro en vez de un número incorrecto.

QUÉ LA HACE DIFERENTE
• Cálculo en tiempo real con normalización SI y verificación de dimensiones mientras escribes.
• Compara un resultado en todas las unidades compatibles de un vistazo, en el mismo orden que ya conoces de los chips de unidad.
• Define tus propias unidades: como múltiplo simple (2shaku = 0,606 m) o como fórmula (para unidades con desplazamiento, como las escalas de temperatura).
• Cambia un número sin unidad entre decimal, binario, octal y hexadecimal en la misma tarjeta de resultado — útil para electrónica y programación.
• Guarda constantes reutilizables como W = 3cm y úsalas después en cualquier expresión.

MÁS DE 112 CUADERNOS DE FÓRMULAS
Explora cuadernos de cálculo con matemáticas reales, compuestas tipográficamente (no texto plano):
- Ciencias de primaria y secundaria (velocidad, densidad, presión, palancas, calor, electricidad, luz y sonido, ciencias de la Tierra, química)
- Física de bachillerato (mecánica, termodinámica, ondas, electricidad, física atómica)
- Costo de electricidad y de conducción, astronomía, fitness, química, autos y bicicletas, cocina
- Fórmulas de resistencia de materiales
Cada cuaderno recuerda tus últimos valores, encadena resultados entre pasos y muestra la fórmula subyacente para que veas el "por qué", no solo el número.

SEIS IDIOMAS, TOTALMENTE TRADUCIDOS
La interfaz, los nombres de unidades, los mensajes de error y los más de 112 cuadernos están disponibles en inglés, japonés, español, portugués (Brasil), alemán y francés.

GRATIS Y SIN LÍMITES
El historial de cálculos es ilimitado para todos, nunca se recorta ni se bloquea tras una compra. Haz copia de seguridad de tus cuadernos, constantes globales y unidades personalizadas en un archivo, y restáuralas en otro dispositivo.

UNIT CALCULATOR PRO
Una única compra única — sin suscripción, nunca — desbloquea:
• Experiencia sin anuncios
• Exportación CSV de tu historial de cálculos
• Tus propios conjuntos de unidades guardados, para escribir más rápido con las unidades que más usas
• Compartir un cuaderno como documento con formato que puedes imprimir o guardar como PDF

Unit Calculator está pensada para estudiantes, ingenieros, makers y cualquiera que quiera confiar en el número que le da su calculadora.
```

### Português (Brasil)（2,584字）

```
Unit Calculator é uma calculadora dimensional: digite uma expressão como 5cm + 1mm ou 100N ÷ 0,01 m², e o app normaliza cada valor para unidades base do SI antes de calcular, verifica se as dimensões realmente coincidem e permite ler o resultado em qualquer unidade compatível. Se você misturar unidades por engano, aparece um aviso claro em vez de um número errado.

O QUE TORNA O APP DIFERENTE
• Cálculo em tempo real com normalização SI e verificação de dimensões enquanto você digita.
• Compare um resultado em todas as unidades compatíveis de uma vez, na mesma ordem dos chips de unidade que você já conhece.
• Defina suas próprias unidades: como múltiplo simples (2shaku = 0,606 m) ou como fórmula (para unidades com deslocamento, como escalas de temperatura).
• Alterne um número sem unidade entre decimal, binário, octal e hexadecimal no mesmo cartão de resultado — útil para eletrônica e programação.
• Salve constantes reutilizáveis como W = 3cm e use-as depois em qualquer expressão.

MAIS DE 112 CADERNOS DE FÓRMULAS
Explore cadernos de cálculo com matemática real, tipografada (não texto simples):
- Ciências do ensino fundamental (velocidade, densidade, pressão, alavancas, calor, eletricidade, luz e som, ciências da Terra, química)
- Física do ensino médio (mecânica, termodinâmica, ondas, eletricidade, física atômica)
- Custo de energia elétrica e de rodagem, astronomia, fitness, química, carros e bicicletas, culinária
- Fórmulas de resistência dos materiais
Cada caderno lembra os últimos valores usados, encadeia resultados entre etapas e mostra a fórmula em si, para você entender o "porquê", não só o número.

SEIS IDIOMAS, TOTALMENTE TRADUZIDO
A interface, os nomes das unidades, as mensagens de erro e todos os mais de 112 cadernos estão disponíveis em inglês, japonês, espanhol, português (Brasil), alemão e francês.

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

### Deutsch（2,636字）

```
Unit Calculator ist ein dimensionsbewusster Rechner: Gib einen Ausdruck wie 5cm + 1mm oder 100N ÷ 0,01 m² ein, und die App normiert jeden Wert zuerst auf SI-Basiseinheiten, prüft, ob die Dimensionen wirklich zusammenpassen, und zeigt das Ergebnis in jeder passenden Einheit an. Vermischst du Einheiten versehentlich, erscheint eine klare Fehlermeldung statt einer falschen Zahl.

WAS DIE APP ANDERS MACHT
• Echtzeitberechnung mit automatischer SI-Normierung und Dimensionsprüfung, während du tippst.
• Vergleiche ein Ergebnis auf einen Blick in allen passenden Einheiten, in derselben Reihenfolge wie die bekannten Einheiten-Chips.
• Definiere eigene Einheiten: als einfaches Vielfaches (2shaku = 0,606 m) oder als Formel (für Einheiten mit Offset, wie Temperaturskalen).
• Schalte eine einheitenlose Zahl auf derselben Ergebniskarte zwischen Dezimal, Binär, Oktal und Hexadezimal um — praktisch für Elektronik und Programmierung.
• Speichere wiederverwendbare Konstanten wie W = 3cm und nutze sie später in jedem Ausdruck.

ÜBER 112 RECHENHEFTE
Durchstöbere Rechenhefte mit echter, gesetzter Mathematik (kein reiner Text):
- Naturwissenschaften für Grund- und Mittelschule (Geschwindigkeit, Dichte, Druck, Hebel, Wärme, Elektrizität, Licht und Schall, Geowissenschaften, Chemie)
- Gymnasialphysik (Mechanik, Thermodynamik, Wellen, Elektrizität, Atomphysik)
- Stromkosten und Fahrtkosten im Alltag, Astronomie, Fitness, Chemie, Autos & Fahrräder, Kochen
- Formeln aus der Festigkeitslehre
Jedes Rechenheft merkt sich deine letzten Werte, verkettet Ergebnisse zwischen Schritten und zeigt die zugrunde liegende Formel, damit du das „Warum" siehst, nicht nur die Zahl.

SECHS SPRACHEN, VOLLSTÄNDIG ÜBERSETZT
Die Oberfläche, Einheitennamen, Fehlermeldungen und alle über 112 Rechenhefte gibt es auf Englisch, Japanisch, Spanisch, brasilianischem Portugiesisch, Deutsch und Französisch.

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

### Français（2,816字）

```
Unit Calculator est une calculatrice dimensionnelle : saisissez une expression telle que 5cm + 1mm ou 100N ÷ 0,01 m², et l'application normalise chaque valeur en unités de base du SI avant de calculer, vérifie que les dimensions correspondent réellement, puis affiche le résultat dans n'importe quelle unité compatible. Si vous mélangez des unités par erreur, un message d'erreur clair s'affiche au lieu d'un résultat faux.

CE QUI LA REND DIFFÉRENTE
• Calcul en temps réel avec normalisation SI et vérification des dimensions pendant la saisie.
• Comparez un résultat dans toutes les unités compatibles d'un coup d'œil, dans le même ordre que les puces d'unité que vous connaissez déjà.
• Définissez vos propres unités : comme un simple multiple (2shaku = 0,606 m) ou comme une formule (pour les unités à décalage, comme les échelles de température).
• Basculez un nombre sans unité entre décimal, binaire, octal et hexadécimal sur la même carte de résultat — pratique pour l'électronique et la programmation.
• Enregistrez des constantes réutilisables comme W = 3cm et réutilisez-les ensuite dans n'importe quelle expression.

PLUS DE 112 CARNETS DE FORMULES
Parcourez des carnets de calcul avec de vraies formules composées typographiquement (pas du texte brut) :
- Sciences du primaire et du collège (vitesse, masse volumique, pression, leviers, chaleur, électricité, lumière et son, sciences de la Terre, chimie)
- Physique du lycée (mécanique, thermodynamique, ondes, électricité, physique atomique)
- Coût de l'électricité et de la conduite au quotidien, astronomie, fitness, chimie, voitures et vélos, cuisine
- Formules de résistance des matériaux
Chaque carnet mémorise vos dernières valeurs, enchaîne les résultats entre les étapes et affiche la formule elle-même, pour voir le « pourquoi », pas seulement le nombre.

SIX LANGUES, ENTIÈREMENT TRADUITES
L'interface, les noms d'unités, les messages d'erreur et les plus de 112 carnets sont disponibles en anglais, japonais, espagnol, portugais (Brésil), allemand et français.

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
- 仏語の「密度」は `masse volumique`（`densité`は無次元の別概念のため誤訳、同用語集A節）。
- 独語名詞は常に大文字化（`Rechenheft`、`Einheiten`、`Formeln` など）。
- 数字の小数点は、地の文（散文）中では各言語の慣習に合わせてコンマ（`0,01 m²`）。ただし英語のみASCIIドット。
- 「自作単位」の訳（`unidades personalizadas` / `eigene Einheiten` / `unités personnalisées`）は `app/(tabs)/settings.tsx` の実装済みUI文言（`lib/global-settings.tsx`の`customUnits`キー）に合わせた。
- 短い説明・詳しい説明とも、Pro特典の呼称は`app/(tabs)/pro.tsx`の`EN_COPY.features`4点（Ad-free / CSV export / My unit sets / Notebook sharing）の実際の文言に対応させてあり、憶測の機能名を使っていない。
