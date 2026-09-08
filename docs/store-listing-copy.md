# Google Play ストア掲載文（6言語）

Google Play Console の文字数上限（短い説明 80字・詳しい説明 4,000字）に収まることを確認済み。
各言語の文字数は Python の `len()`（Unicode文字数）で実測した値。訳語は `docs/i18n-glossary.md` の対訳・表記ルールに揃えてある。

**対象は Android（Google Play）のみ。** iOS向けの文言は用意しない（今回の提出スコープ外）。

**スクリーンショットとフィーチャーグラフィックは6言語すべて用意する**（`docs/screenshot-capture-plan.md` / `submission-assets/README.md`）。
以前は日英だけ撮って es/pt-BR/de/fr には英語の画像を流用していたが、**掲載文だけ言語ごとに書き分けても、
一覧に出る画像が英語のままだとその言語のユーザーには「英語のアプリ」に見える**。
画像は単に翻訳するのではなく、**言語ごとに写すノート・サンプルを変えている**
（独=Spannungsfall と Klausur & Prüfung、西=campo eléctrico と Preparación (EBAU)、
葡=campo elétrico と Preparação (ENEM)、日=電圧降下と試験対策（電験・電工）、
英=Mechanics と Exam prep、仏=Mécanique と Révisions (physique-chimie)）。

新機能の裏取り元（今回追記した機能と根拠）:

- 計算ノート（194件・KaTeX数式・親子2階層カテゴリ） — `CLAUDE.md`「直近の作業履歴」3・5・6・20番（PR #46）、`lib/notebook-formulas/`実測（`PRESET_NOTEBOOK_SEEDS`合計194件・`PRESET_NOTEBOOK_CATEGORIES`38件＝最上位9枚＋サブカテゴリ29枚）。カテゴリ名は各言語とも`PRESET_NOTEBOOK_CATEGORIES`の`label`をそのまま使い、アプリ内表示と一致させている
- 厳密値表示（分数・πの有理数倍・√の有理数倍） — `CLAUDE.md`「直近の作業履歴」19番（PR #42）、`lib/exact-value.ts`。チップ文言は`app/(tabs)/index.tsx`の`decimalForm`/`exactForm`（en `Decimal`/`Exact`、ja `小数`/`分数・π`、es `Decimal`/`Exacto`、pt-BR `Decimal`/`Exato`、de `Dezimal`/`Exakt`、fr `Décimal`/`Exact`）
- 計算ノートの検索（タイトル・説明文・カテゴリ名を横断） — `CLAUDE.md`「直近の作業履歴」21番（PR #48）、`lib/notebook-search.ts`、`app/(tabs)/constants.tsx`の`notebookSearch`
- 地域別の既定値（商用電源の電圧・ブレーカー定格・金額） — 同21番（PR #48）、`lib/preset-regional-defaults.ts`。訳語は`lib/notebook-formulas/source/practical.ts`の「ブレーカー容量」ノート（es `voltaje de la red`/`disyuntor`、pt-BR `tensão da rede`/`disjuntor`、de `Netzspannung`/`Leitungsschutzschalter`、fr `tension du secteur`/`disjoncteur`）に合わせた
- 単位比較表 — `CLAUDE.md`「直近の作業履歴」16番（PR #33）、`lib/unit-comparison.ts`
- ユーザー定義単位（倍率形式・関数形式・オフセット対応） — `CLAUDE.md`「直近の作業履歴」17番（PR #34）、`lib/custom-units.ts`
- 進数（2進・8進・16進）表示・入力 — `CLAUDE.md`「直近の作業履歴」18番（PR #37/#38/#39、#40で修正）、`lib/number-base.ts`
- 6言語対応（UI・単位名・エラーメッセージ・プリセット全件） — `CLAUDE.md`「直近の作業履歴」7〜9番（PR #21〜#23）
- バックアップ／復元（計算ノート・グローバル定数・**自作単位も含む**） — `lib/constants-backup.ts` / `lib/notebooks-backup.ts` の実装（`customUnits`フィールドの存在を確認済み。関連コミット `5ccfa29`）。**注**: `CLAUDE.md`末尾の「次にやりそうなこと」は自作単位のバックアップ対応をまだ未着手のTODOとして書いているが、これは更新漏れで、実際のコードは既に対応済み（本セッションでコミット履歴とソースの両方を確認した）
- メートル馬力 PS / CV（735.49875 W） — `lib/units.ts` の `BASE_UNITS`・`lib/unit-explanations.ts`。英馬力 `hp`（745.7 W）と別記号で、独仏の掲載文だけがこれに触れている
- 燃費の単位（`km/L` / `mpg` / 英ガロンの `mpgUK`）と地域別の既定値 — `lib/units.ts` の `fuelEconomy` グループ・`lib/preset-regional-defaults.ts` の `resolvePresetFuelEconomy`（US `35mpg` / GB `42mpgUK` / その他 `15km/L`）
- 計量カップ・大さじの規格を端末の地域から決める（US / JIS / メートル法 / 豪州） — `lib/locale-defaults.ts` の `resolveDefaultMeasuringStandard`、`tests/locale-defaults.test.ts`
- 言語ごとのターゲットに合わせたサンプル・ノートの並べ替えと追加 — `lib/locale-relevance.ts`、`tests/locale-relevance.test.ts`。掲載文で名指ししたノート（電圧降下と必要な電線の太さ／変圧器の巻数比／モーターの効率・損失・線電流／点電荷の電場と電位）は `lib/notebook-formulas/source/practical.ts`・`physics.ts` に実在し、`tests/notebook-formulas.test.ts` が実エンジンで計算を検証している
- 試験対策・実験レポートのサンプル8件 — `lib/sample-calculations.ts` の `exam` / `lab` カテゴリ。掲載文に書いた値（9.4 V・5.64 mC・20 m/s・1200 kg/m³ ほか）はすべて `tests/sample-calculations.test.ts` が実エンジンで検証している
- 買い切り1本・サブスクなし — `CLAUDE.md`「直近の作業履歴」14番、`docs/market-research-2026-09.md` 第4節
- 無料版でも履歴無制限 — 同上14番
- Proの実際の4特典（広告非表示・CSVエクスポート・マイ単位セット・ノート共有／PDF書き出し） — `app/(tabs)/pro.tsx` の `EN_COPY.features`（読み取りのみ、改変していない）

---

## アプリ名（App name、上限30字）

**アプリ名は `UnitCalc`**（`app.config.ts` の `appName`・アプリ内の電卓タブ名・フィーチャーグラフィックの見出しと同じ）。
**固有名詞なので言語ごとに訳さない。** ストアのタイトルに付く副題だけを言語ごとに変え、
その言語のASO第一検索語かターゲットの試験名を入れる。

| 言語 | 字数 | タイトル | 副題に入れたもの |
|---|---|---|---|
| en | 26 | UnitCalc - UnitCalc | ASO第一検索語 `unit calculator` |
| ja | 21 | UnitCalc - 電験・電工の単位計算 | ターゲットの資格名（電験三種・第二種電気工事士） |
| es | 28 | UnitCalc - Unidades y física | EBAU の física |
| pt-BR | 28 | UnitCalc - Unidades e física | ENEM の física |
| de | 27 | UnitCalc - Einheitenrechner | ASO第一検索語 `Einheitenrechner` |
| fr | 26 | UnitCalc - Calcul d'unités | lycée の physique-chimie（第一検索語 `convertisseur d'unités` は11+22字で30字に入らない） |

**30字は「UnitCalc - 」の11字を引くと19字しか残らない。** 西語の `calculadora con unidades`（24字）と
仏語の `convertisseur d'unités`（22字）は第一検索語をタイトルに入れられないので、
**短い説明と詳しい説明の本文で受ける**（Google Play は本文の語で引くのでタイトルに無くても効く）。

## 短い説明（Short description、上限80字）

| 言語 | 文字数 | 本文 |
|---|---|---|
| en | 75 | Just type the units. Prefixes and conversions are automatic: 1kΩ × 1mA ⇒ 1V |
| ja | 44 | 単位をつけて計算するだけ。桁合わせや単位換算は、すべて自動。1kΩ × 1mA ⇒ 1V |
| es | 73 | Escribe las unidades: prefijos y conversiones automáticos. 1kΩ × 1mA ⇒ 1V |
| pt-BR | 73 | Digite com as unidades: prefixos e conversões automáticos. 1kΩ × 1mA ⇒ 1V |
| de | 78 | Einheiten eintippen. Vorsatzzeichen und Umrechnen: automatisch. 1kΩ × 1mA ⇒ 1V |
| fr | 75 | Saisissez les unités : préfixes et conversions automatiques. 1kΩ × 1mA ⇒ 1V |

**短い説明は「利用者の動作 → 全部自動 → 実例1つ」の3拍で6言語そろえてある。**
以前は言語ごとに別のフックを立てていたが、**短い説明で言語ごとに主張を変えると、同じアプリの説明とは思えない**ほど
バラけた（en は入力と答え、de は Einheitenfehler、es は採点基準…）。差別化は**タイトルの副題**（上の表）と
詳しい説明のターゲット段落が担うので、短い説明は全言語で同じ構造にして**実例 `1kΩ × 1mA ⇒ 1V` を必ず入れる**。

- **抽象的な約束をやめた。** 旧 ja 版の「単位ごと計算して桁ミスをゼロに」は、アプリの仕組みが主語で
  「で、何が嬉しいのか」を読み手に翻訳させていた。「単位をつけて計算するだけ」は利用者の動作が主語。
- **実例は必ず本物にする。** `1kΩ × 1mA ⇒ 1V` は `tests/sample-calculations.test.ts` が実エンジンで検証している。
- 独語だけ80字にほぼ張り付いている（78字）ので、**足すときは必ず測り直すこと**（`Einheiten mit eintippen` の
  分離動詞を落として `Einheiten eintippen` にして2字空けた）。

厳密値表示とノート件数はどの言語の短い説明にも入れていない（80字に収まらないため、詳しい説明の機能ブロックに置いた）。

## 詳しい説明（Full description、上限4,000字）

### English（3,924字）

```
Type 12V/4.7kΩ and read 2.55 mA. Type 3m + 2kg and it tells you that a length and a mass cannot be added. UnitCalc is a unit calculator and unit converter in one: it normalizes every value to SI base units before calculating, checks that the dimensions actually match, then converts the result into any compatible unit.

WHAT MAKES IT DIFFERENT
• Real-time dimensional analysis as you type: every value is normalized to SI and the dimensions are checked as you type.
• Read any result as an exact value instead of a rounded decimal: tap Exact and 1/3 stays 1/3, 2*pi*50 becomes 100π, and sqrt(8) becomes 2√2 — typeset as a real fraction or radical, and copied exactly as shown.
• Compare one result across every compatible unit at a glance, in the same order as the unit chips you already know.
• Define your own units, either as a simple multiple (2shaku = 0.606m) or as a formula (for offset units like temperature scales).
• Switch a plain number between decimal, binary, octal, and hexadecimal on the same result card — handy for electronics and programming.
• Save reusable constants such as W = 3cm and reuse them later in any expression.
• Imperial and US units too: 12ft + 3in, 72°F to °C, 30psi to bar, fuel economy in mpg (US or imperial gallons) or km/L.

BUILT FOR THE MOMENT YOU CHECK YOUR OWN WORK
Most calculators let a slipped unit through and hand you a confident wrong answer. This one refuses — which matters while you prepare for the FE exam, work through a City & Guilds electrical course, write up a lab report, or check an engineering calculation by hand. The ready-made samples are those conversions: prefixes that cancel, the six decades hidden in µ, km/h to m/s, three-phase power, W × h to kWh, g/cm³ to kg/m³, moles per millilitre, °C to K.

194 FORMULA NOTEBOOKS
Browse calculation notebooks with real, typeset math (not plain text), in nine libraries:
- School science (speed & motion, density & concentration, circuits, light & sound, and more)
- High school physics (mechanics, thermodynamics, waves, electricity, atomic physics)
- Chemistry stoichiometry, and astronomy & space
- Electricity & energy: practical electricity — voltage drop and the cable cross-section it needs, transformer turns ratio, motor efficiency and line current — plus hobby electronics and solar power & batteries
- Hobbies & making (photography, audio, DIY, 3D printing)
- Home & everyday life (cooking & baking, coffee & home brewing, fitness & running, weather)
- Physics of cars & bicycles
- Mechanical & structural design (stress & strain, beams & columns, shafts & power transmission, machine elements)
Search every notebook at once by title, description, or category to reach the one you need. Every notebook remembers your last values, chains results between steps, and shows the formula itself.

SIX LANGUAGES, FULLY TRANSLATED
The interface, unit names, error messages, and every one of the 194 notebooks are available in English, Japanese, Spanish, Portuguese (Brazil), German, and French. Notebooks whose values depend on where you live open with defaults that match your region — mains voltage, breaker rating, electricity and fuel prices, fuel economy in mpg or km/L, and the cup and tablespoon sizes used where you are.

FREE AND UNLIMITED
Your full calculation history is unlimited for everyone — it is never trimmed or locked behind a purchase. Back up your notebooks, global constants, and custom units to a file and restore them on another device.

UNITCALC PRO
A single one-time purchase — no subscription, ever — unlocks:
• An ad-free experience
• CSV export of your calculation history
• Your own saved unit sets, for faster entry of the units you use most
• Sharing a notebook as a formatted document you can print or save as PDF

UnitCalc is built for engineering and science students, FE and City & Guilds candidates, makers, and anyone who wants to trust the number a calculator gives them.
```

### 日本語（1,946字）

```
UnitCalc は、単位変換と単位計算を1つにした、単位ごと数式を入力する電卓です。「12V ÷ 4.7kΩ」と入力すればその場で「2.55 mA」、「3m + 2kg」と入力すれば「長さ (m) と 質量 (kg) は足し引きできません」と返します。すべての値をまずSI基本単位に正規化してから計算し、次元（単位の種類）が本当に合っているかをチェックし、結果を好きな単位に換算して表示します。単位を間違えて足し引きしようとすると、誤った数値ではなく分かりやすいエラーが表示されます。

このアプリが違う理由
・入力するそばからSI正規化と次元チェックをしてリアルタイムに計算
・答えを丸めた小数ではなく厳密値で読める。「分数・π」に切り替えると 1/3 はそのまま 1/3、2*pi*50 は 100π、sqrt(8) は 2√2 と、本物の分数の横棒・根号で表示（コピーも画面と同じ表記）
・1つの結果を、単位チップと同じ順番・同じ候補で全単位に並べて一覧比較
・自分だけの単位を登録できる。倍率（2尺＝0.606m）でも、摂氏・華氏のようなオフセット付きの式でも作れる
・単位なしの数値を10進・2進・8進・16進で切り替えて表示（電気・組み込み・プログラミング向け）
・「W = 3cm」のような定数を保存し、あとの式で使い回せる
・接頭語は自分で打ち消さなくていい。「4.7kΩ × 2mA」は 9.4 V、「470µF × 12V」は 5.64 mC と、k・m・µ の桁はアプリ側で処理

検算のための電卓
電験三種・第二種電気工事士・危険物取扱者乙4の学習中、大学の実験レポート、機械・建築の手計算のチェック——「自分の答えが合っているかを自分で確かめたい」場面のための電卓です。試験会場には持ち込めませんが、学習中の検算はここでできます。電圧降下から必要な電線の太さを逆算するノート、変圧器の巻数比、モーターの効率と線電流のように、電工二種・電験の筆記でそのまま問われる計算をノートとして収録しています。サンプルには「試験対策」「実験レポート」の2カテゴリを用意し、その場面で落としやすい換算をそのまま入れてあります: 接頭語の打ち消し（kΩ × mA）、µの6桁飛び、km/h → m/s、三相電力、W × h → kWh、g/cm³ → kg/m³、mol ÷ mL、°C → K。

194件の計算ノート
本物の組版された数式（テキストではなく）で読める計算ノートを9分野に収録:
・理科（小・中）: 速さ・運動、密度・濃度、圧力・浮力、力・仕事・てこ、熱・温度、電気・回路、光・音、地学・天気、化学変化
・高校物理: 力学、熱、波動、電気、原子
・化学の量的関係、天体・宇宙
・電気・エネルギー: 電気の基礎計算（電圧降下と必要な電線の太さ、変圧器の巻数比、モーターの効率・損失・線電流）、電子工作、太陽光発電・蓄電
・趣味・ものづくり: 写真・カメラ、音響・オーディオ、DIY・住まい、3Dプリンタ
・暮らし: 料理・製菓の単位換算、コーヒー・自家醸造、フィットネス・ランニング、天気・大気
・車・自転車の物理
・機械・構造設計: 応力・ひずみ・安全率、はり・柱、軸・ねじり・動力伝達、機械要素・締結
タイトル・説明・カテゴリ名を横断する検索で、目当ての1件にすぐ辿り着けます。各ノートは前回の入力値を覚え、手順の結果を次の手順で使い回せ、数式そのものも表示するので「なぜその答えになるか」まで分かります。

6言語完全対応
UI・単位名・エラーメッセージ・194件のノートの中身まで、すべて日本語・英語・スペイン語・ポルトガル語(ブラジル)・ドイツ語・フランス語に対応しています。電源電圧・ブレーカーの定格電流・電気代や燃料単価・燃費（mpg か km/L）・計量カップと大さじの規格のように国で変わる値は、お使いの端末の地域に合った既定値でノートが開きます。

無料でも制限なし
計算履歴は誰でも無制限。件数で切られたり購入を求められたりしません。計算ノート・グローバル定数・自作の単位はファイルへバックアップし、別端末で復元できます。

UnitCalc Pro
買い切り1回（サブスクなし）で以下が使えます:
・広告なし
・計算履歴のCSVエクスポート
・よく使う単位をまとめたマイ単位セット（入力が速くなる）
・計算ノートを整形済みの書類として書き出し、印刷やPDF保存が可能

UnitCalc は、電験・電工・乙4の受験者、理工系の学生、機械・建築のエンジニア、電子工作やDIYをする人など、電卓が出す数値を信頼したいすべての人のためのアプリです。
```

### Español（3,974字）

```
Las unidades no son decoración: son parte de la respuesta. Escribe 12V ÷ 4,7kΩ y lee 2,55 mA; escribe 3m + 2kg y la app te dice que una longitud y una masa no se pueden sumar. UnitCalc es una calculadora con unidades y un conversor de unidades a la vez: normaliza cada valor a unidades base del SI, comprueba que las dimensiones coincidan y te deja leer el resultado en cualquier unidad compatible.

QUÉ LA HACE DIFERENTE
• Cálculo en tiempo real con normalización SI y verificación de dimensiones mientras escribes.
• Lee cualquier resultado como valor exacto en vez de un decimal redondeado: pulsa Exacto y 1/3 sigue siendo 1/3, 2*pi*50 pasa a 100π y sqrt(8) pasa a 2√2, como fracción y raíz de verdad, y se copian tal como se ven.
• Compara un resultado en todas las unidades compatibles de un vistazo.
• Define tus propias unidades: como múltiplo simple (2shaku = 0,606 m) o como fórmula (para unidades con desplazamiento, como las escalas de temperatura).
• Cambia un número sin unidad entre decimal, binario, octal y hexadecimal — útil para electrónica y programación.
• Guarda constantes como W = 3cm y reutilízalas en cualquier expresión.
• Los prefijos se cancelan solos: 4,7kΩ × 2mA da 9,4 V y 470µF × 12V da 5,64 mC.

PENSADA PARA LA EBAU Y LA FP
En física de la EBAU, un error u omisión de unidades resta 0,25 puntos por apartado, tanto en los resultados intermedios como en el final. La app trabaja justo ahí: pasa los datos del enunciado al SI, mantiene las unidades en cada paso y avisa en cuanto dejan de simplificarse. Los ejemplos incluidos son justo esos cambios de unidad, los del examen y los del laboratorio. Y hay cuadernos para ambos perfiles: campo eléctrico y potencial de una carga puntual (µC y cm) para la EBAU, y caída de voltaje y sección de cable para la FP eléctrica.

194 CUADERNOS DE FÓRMULAS
Explora cuadernos de cálculo con matemáticas reales, compuestas tipográficamente (no texto plano), en nueve bibliotecas:
- Ciencias naturales (velocidad, densidad y concentración, circuitos, luz y sonido, y más)
- Física de bachillerato (mecánica, termodinámica, ondas, electricidad, física atómica)
- Estequiometría química, y astronomía y espacio
- Electricidad y energía (electricidad práctica, electrónica para aficionados, energía solar y baterías)
- Aficiones y creación (fotografía, audio, bricolaje, impresión 3D)
- Hogar y vida diaria (cocina y repostería, café, fitness y running, tiempo)
- Física de los vehículos
- Diseño mecánico y estructural (esfuerzo y deformación, vigas y columnas, ejes y transmisión de potencia, elementos de máquinas)
Busca en todos los cuadernos a la vez por título, descripción o categoría para llegar al que necesitas. Cada cuaderno recuerda tus últimos valores, encadena resultados entre pasos y muestra la fórmula en sí.

SEIS IDIOMAS, TOTALMENTE TRADUCIDOS
La interfaz, los nombres de unidades, los mensajes de error y los 194 cuadernos están disponibles en inglés, japonés, español, portugués (Brasil), alemán y francés. Los cuadernos cuyos valores dependen del país se abren acordes a tu región: voltaje de la red, corriente del disyuntor, precios de electricidad y combustible, consumo en mpg o km/L y medidas de cocina.

GRATIS Y SIN LÍMITES
El historial de cálculos es ilimitado para todos, nunca se recorta ni se bloquea tras una compra. Haz copia de seguridad de tus cuadernos, constantes globales y unidades personalizadas en un archivo, y restáuralas en otro dispositivo.

UNITCALC PRO
Una única compra — sin suscripción, nunca — desbloquea:
• Experiencia sin anuncios
• Exportación CSV de tu historial de cálculos
• Tus propios conjuntos de unidades guardados, para escribir más rápido
• Compartir un cuaderno como documento con formato que puedes imprimir o guardar como PDF

UnitCalc está pensada para quienes preparan la EBAU, para el alumnado de FP de electricidad y electrónica, para estudiantes de ingeniería, makers y cualquiera que quiera confiar en el número que le da su calculadora.
```

### Português (Brasil)（3,938字）

```
Calcule com as unidades juntas. Digite 12V ÷ 4,7kΩ e leia 2,55 mA; digite 3m + 2kg e o app avisa que comprimento e massa não podem ser somados. O UnitCalc é uma calculadora de unidades e um conversor de unidades: normaliza cada valor para unidades base do SI, verifica se as dimensões coincidem e permite ler o resultado em qualquer unidade compatível.

O QUE TORNA O APP DIFERENTE
• Cálculo em tempo real com normalização SI e verificação de dimensões enquanto você digita.
• Leia qualquer resultado como valor exato em vez de um decimal arredondado: toque em Exato e 1/3 continua 1/3, 2*pi*50 vira 100π e sqrt(8) vira 2√2, como fração e raiz de verdade.
• Compare um resultado em todas as unidades compatíveis de uma vez.
• Defina suas próprias unidades: como múltiplo simples (2shaku = 0,606 m) ou como fórmula (para unidades com deslocamento, como escalas de temperatura).
• Alterne um número sem unidade entre decimal, binário, octal e hexadecimal — útil para eletrônica e programação.
• Salve constantes como W = 3cm e reutilize-as em qualquer expressão.
• Os prefixos se cancelam sozinhos: 4,7kΩ × 2mA dá 9,4 V e 470µF × 12V dá 5,64 mC.

PARA O ENEM, O VESTIBULAR E A NR-10
Nas questões de física do ENEM e dos vestibulares, o enunciado vem em uma unidade e a resposta é pedida em outra — e é aí que a conta se perde. O app mantém a unidade em cada passo e recusa a soma quando as dimensões não coincidem. Os exemplos prontos cobrem exatamente essas passagens, as do vestibular e as do laboratório. Há cadernos para os dois perfis: campo elétrico e potencial de uma carga pontual (µC e cm) para o ENEM, e queda de tensão com a seção de cabo necessária para a NR-10 e o técnico em eletrotécnica — já abrindo com a tensão da sua região, 127 V ou 220 V.

194 CADERNOS DE FÓRMULAS
Explore cadernos de cálculo com matemática real, tipografada (não texto simples), em nove bibliotecas:
- Ciências (velocidade, densidade e concentração, circuitos, luz e som e mais)
- Física do ensino médio (mecânica, termodinâmica, ondas, eletricidade, física atômica)
- Estequiometria química, e astronomia e espaço
- Eletricidade e energia (eletricidade prática, eletrônica para hobby, energia solar e baterias)
- Hobbies e criação (fotografia, áudio, reformas, impressão 3D)
- Casa e dia a dia (culinária e confeitaria, café, fitness e corrida, tempo)
- Física dos veículos
- Projeto mecânico e estrutural (tensão e deformação, vigas e colunas, eixos, elementos de máquinas)
Busque em todos os cadernos de uma vez por título, descrição ou categoria para chegar ao que você precisa. Cada caderno lembra os últimos valores, encadeia resultados entre etapas e mostra a fórmula em si.

SEIS IDIOMAS, TOTALMENTE TRADUZIDO
A interface, os nomes das unidades, as mensagens de erro e todos os 194 cadernos estão disponíveis em inglês, japonês, espanhol, português (Brasil), alemão e francês. Os cadernos cujos valores dependem do país abrem com padrões da sua região: tensão da rede, corrente do disjuntor, preços de energia e combustível, consumo em mpg ou km/L e medidas de cozinha.

GRATUITO E SEM LIMITES
O histórico de cálculos é ilimitado para todos: nunca é reduzido nem bloqueado por trás de uma compra. Faça backup dos seus cadernos, constantes e unidades personalizadas em um arquivo e restaure-os em outro dispositivo.

UNITCALC PRO
Uma única compra avulsa — sem assinatura, nunca — desbloqueia:
• Experiência sem anúncios
• Exportação em CSV do seu histórico de cálculos
• Seus próprios conjuntos de unidades salvos, para digitar mais rápido
• Compartilhar um caderno como documento formatado que você pode imprimir ou salvar em PDF

Gratuito e completo para estudar: histórico ilimitado e os 194 cadernos inclusos; o Pro é só para quem preferir usar sem anúncios. Feito para quem presta o ENEM e os vestibulares, técnicos em eletrotécnica, estudantes de engenharia, makers e qualquer pessoa que queira confiar no número que a calculadora mostra.
```

### Deutsch（3,974字）

```
Der Rechner, der mit Einheiten rechnet – und Einheitenfehler findet, bevor die Klausur sie findet. Gib 12V ÷ 4,7kΩ ein und lies 2,55 mA; gib 3m + 2kg ein, und die App sagt dir, dass sich eine Länge und eine Masse nicht addieren lassen. UnitCalc ist ein Einheitenrechner: Er normiert jeden Wert auf SI-Basiseinheiten, prüft die Dimensionen und kann das Ergebnis in jede passende Einheit umrechnen.

WAS DIE APP ANDERS MACHT
• Echtzeitberechnung mit automatischer SI-Normierung und Dimensionsprüfung, während du tippst.
• Lies jedes Ergebnis als exakten Wert statt als gerundete Dezimalzahl: Tippe auf Exakt, und 1/3 bleibt 1/3, 2*pi*50 wird zu 100π, sqrt(8) zu 2√2 – als echter Bruch und echtes Wurzelzeichen gesetzt.
• Vergleiche ein Ergebnis auf einen Blick in allen passenden Einheiten.
• Definiere eigene Einheiten: als einfaches Vielfaches (2shaku = 0,606 m) oder als Formel (für Einheiten mit Offset, wie Temperaturskalen).
• Schalte eine einheitenlose Zahl zwischen Dezimal, Binär, Oktal und Hexadezimal um – praktisch für Elektronik und Programmierung.
• Speichere Konstanten wie W = 3cm und nutze sie später in jedem Ausdruck.
• PS und CV (metrische Pferdestärke, 735,5 W) sind eigene Einheiten – nicht das englische hp (745,7 W), das um 1,4 % daneben liegt.

FÜR AUSBILDUNG, KLAUSUR UND PRÜFUNG
In der Elektro-Ausbildung, in Physik- und Chemie-Klausuren und in der Techniker- oder Meisterprüfung ist eine falsche Einheit kein Schönheitsfehler, sondern Punktabzug. Die mitgelieferten Beispiele decken genau diese Stellen ab – von Vorsatzzeichen und Zehnerpotenzen bis zu Dichte, Konzentration und absoluter Temperatur für den Laborbericht. Die Rechenhefte treffen die Ausbildungsinhalte: Spannungsfall und der nötige Leiterquerschnitt, Übersetzungsverhältnis des Transformators, Wirkungsgrad und Strom eines Motors.

194 RECHENHEFTE
Durchstöbere Rechenhefte mit echter, gesetzter Mathematik in neun Bibliotheken:
- Naturwissenschaften (Geschwindigkeit, Dichte & Konzentration, Stromkreise, Licht & Schall u. a.)
- Physik (Oberstufe) (Mechanik, Thermodynamik, Wellen, Elektrizität, Atomphysik)
- Stöchiometrie sowie Astronomie & Weltraum
- Elektrizität & Energie (praktische Elektrotechnik, Hobby-Elektronik, Solarstrom & Batterien)
- Hobby & Selbermachen (Fotografie, Audio, Heimwerken, 3D-Druck)
- Haushalt & Alltag (Kochen & Backen, Kaffee, Fitness & Laufen, Wetter)
- Physik von Autos & Fahrrädern
- Maschinen- & Tragwerksentwurf (Spannung & Dehnung, Balken & Stützen, Wellen, Maschinenelemente)
Durchsuche alle Rechenhefte auf einmal nach Titel, Beschreibung oder Kategorie, um genau das passende zu finden. Jedes Rechenheft merkt sich deine letzten Werte, verkettet Ergebnisse zwischen Schritten und zeigt die Formel selbst.

SECHS SPRACHEN, VOLLSTÄNDIG ÜBERSETZT
Die Oberfläche, Einheitennamen, Fehlermeldungen und alle 194 Rechenhefte gibt es auf Englisch, Japanisch, Spanisch, brasilianischem Portugiesisch, Deutsch und Französisch. Rechenhefte, deren Werte vom Land abhängen, starten mit Vorgaben für deine Region: Netzspannung, Nennstrom, Strom- und Kraftstoffpreis, Verbrauch in mpg oder km/L sowie die üblichen Tassen- und Löffelmaße.

KOSTENLOS UND UNBEGRENZT
Der komplette Berechnungsverlauf ist für alle unbegrenzt – er wird nie gekürzt oder hinter einem Kauf versteckt. Sichere deine Rechenhefte, globalen Konstanten und eigenen Einheiten in einer Datei und stelle sie auf einem anderen Gerät wieder her.

UNITCALC PRO
Ein einmaliger Kauf – nie ein Abo – schaltet frei:
• Werbefreie Nutzung
• CSV-Export deines Berechnungsverlaufs
• Deine eigenen gespeicherten Einheitensets für schnellere Eingabe deiner meistgenutzten Einheiten
• Ein Rechenheft als formatiertes Dokument teilen, das du drucken oder als PDF speichern kannst

UnitCalc ist für Auszubildende in der Elektrotechnik, für Schülerinnen und Schüler, Studierende, Technikerinnen und Techniker, Ingenieurinnen und Ingenieure und alle gemacht, die der Zahl aus ihrem Rechner vertrauen wollen.
```

### Français（3,966字）

```
La calculatrice qui garde les unités à chaque étape : si elles ne se simplifient pas, l'erreur devient visible. Saisissez 12V ÷ 4,7kΩ et lisez 2,55 mA ; saisissez 3m + 2kg et l'application refuse d'additionner une longueur et une masse. UnitCalc est une calculatrice d'unités et un convertisseur d'unités : il normalise chaque valeur en unités de base du SI, vérifie les dimensions, puis convertit le résultat dans l'unité que vous voulez.

CE QUI LA REND DIFFÉRENTE
• Calcul en temps réel avec normalisation SI et vérification des dimensions pendant la saisie.
• Lisez n'importe quel résultat sous forme exacte plutôt qu'en décimal arrondi : appuyez sur Exact et 1/3 reste 1/3, 2*pi*50 devient 100π, sqrt(8) devient 2√2 — composés comme une vraie fraction et un vrai radical.
• Comparez un résultat dans toutes les unités compatibles.
• Définissez vos propres unités : comme un simple multiple (2shaku = 0,606 m) ou comme une formule (pour les unités à décalage, comme les échelles de température).
• Basculez un nombre sans unité entre décimal, binaire, octal et hexadécimal — pratique pour l'électronique et la programmation.
• Enregistrez des constantes comme W = 3cm et réutilisez-les dans n'importe quelle expression.
• CV (cheval-vapeur, 735,5 W) est une unité distincte du hp anglais (745,7 W), dont il diffère de 1,4 %.

POUR LE LYCÉE, LA PRÉPA ET LE BTS
En physique-chimie, on demande d'écrire les unités à chaque étape du calcul, pour que l'erreur saute aux yeux quand elles ne se simplifient pas. C'est ce que fait cette application, à chaque frappe. Les exemples fournis reprennent ces conversions, du lycée au compte rendu de TP. Les carnets suivent les deux publics : champ électrique et potentiel d'une charge ponctuelle (µC et cm) pour le lycée, chute de tension et section de câble pour le Bac Pro MELEC.

194 CARNETS DE FORMULES
Parcourez des carnets de calcul avec de vraies formules composées, en neuf bibliothèques :
- Sciences (vitesse, masse volumique et concentration, circuits, lumière et son, etc.)
- Physique du lycée (mécanique, thermodynamique, ondes, électricité, physique atomique)
- Stœchiométrie, astronomie et espace
- Électricité et énergie (électricité pratique, électronique de loisir, énergie solaire et batteries)
- Loisirs et fabrication (photographie, audio, bricolage, impression 3D)
- Maison et vie quotidienne (cuisine et pâtisserie, café, fitness et course à pied, météo)
- Physique des voitures et vélos
- Conception mécanique et structurale (contrainte et déformation, poutres et poteaux, arbres, éléments de machines)
Recherchez dans tous les carnets par titre, description ou catégorie. Chaque carnet mémorise vos dernières valeurs, enchaîne les résultats entre les étapes et affiche la formule elle-même.

SIX LANGUES, ENTIÈREMENT TRADUITES
L'interface, les noms d'unités, les messages d'erreur et les 194 carnets sont disponibles en anglais, japonais, espagnol, portugais (Brésil), allemand et français. Les carnets dont les valeurs dépendent du pays s'ouvrent adaptés à votre région : tension du secteur, calibre du disjoncteur, prix de l'électricité et du carburant, consommation en mpg ou km/L et mesures de cuisine.

GRATUIT ET SANS LIMITE
L'historique des calculs est illimité pour tout le monde : jamais réduit, jamais verrouillé derrière un achat. Sauvegardez carnets, constantes et unités personnalisées dans un fichier, et restaurez-les sur un autre appareil.

UNITCALC PRO
Un achat unique — jamais d'abonnement — débloque :
• Une expérience sans publicité
• L'export CSV de votre historique de calculs
• Vos propres ensembles d'unités enregistrés, pour saisir plus vite
• Le partage d'un carnet en document mis en forme, à imprimer ou enregistrer en PDF

UnitCalc est conçue pour les lycéens et lycéennes en physique-chimie, les étudiants de prépa, de BTS et d'école d'ingénieurs, les électriciens en formation, les makers et toute personne qui veut faire confiance au nombre affiché par sa calculatrice.
```

## ASOキーワード（言語ごと・英語からの直訳をしない）

Google Play に iOS のようなキーワード欄は無く、**タイトル・短い説明・詳しい説明の語がそのまま検索対象**になる。
そのため「英語のキーワードを訳したもの」を並べても、その言語で実際に打たれている語から外れる。
以下は言語ごとに**その言語で検索されている形**を優先して並べたもの（`docs/target-users-by-locale-2026-09.md` 第4節）。
**Google Play はキーワード欄ではなく本文の語で引くので、表を作るだけでは効かない。**
`docs/android-submission-checklist.md` の手順でこのファイルをPlay Consoleへコピーすると、本文の語がそのまま検索対象になる。
そのため**表と本文が食い違っていると、狙った語で引けないのに引けているつもりになる**
（実際に一度、表に `dimensional analysis` と書いてあるのに英語本文に無く、日本語も表の `単位 電卓` と
本文の `UnitCalc` が一致していなかった。CodeRabbitが検出）。

**第一検索語**は本文に**必ずその並びで**入れる（下の照合コマンドで確認できる）。
**その他の検索語**は狙ってはいるが本文に無くてよい欄で、そもそも本文に書けないものも混ざる
（独語の `Einheiten umrechnen` は文中では分離動詞になる。日本語の `単位 電卓` は分かち書きの検索形で、
本文では両方の語を含む `UnitCalc` で受ける）。**この2列を混ぜないこと。**

| 言語 | 第一検索語（本文に必ず入れる） | その他の検索語（本文に無くてよい） |
|---|---|---|
| en | **unit calculator** | unit converter, dimensional analysis, SI units, engineering calculator, physics calculator, FE exam, metric conversion |
| ja | **単位変換** | 単位 電卓, 単位計算, SI単位, 電験三種, 電気工事士, 換算, 物理 計算 |
| de | **Einheitenrechner** | Einheiten umrechnen, Einheitenumrechner, Maßeinheiten, Zehnerpotenzen, Vorsatzzeichen, Physik Rechner, Klausur |
| fr | **convertisseur d'unités** | calculatrice d'unités, conversion d'unités, unités SI, physique-chimie, calculatrice scientifique, lycée |
| es | **calculadora con unidades** | conversor de unidades, cambio de unidades, factores de conversión, unidades SI, física, EBAU |
| pt-BR | **calculadora de unidades** | conversor de unidades, conversão de unidades, unidades SI, física, ENEM, cálculo com unidades |

掲載文を書き換えたら、第一検索語が本文に残っているかをこれで照合する（機械的なテストは無い）:

```bash
python3 - <<'EOF'
import re
src = open("docs/store-listing-copy.md", encoding="utf-8").read()
bodies = {m[0]: m[1] for m in re.findall(r"### ([^\n（]+)（[\d,]+字）\n\n```\n(.*?)\n```", src, re.S)}
LEAD = {"English": "unit calculator", "日本語": "単位変換", "Deutsch": "Einheitenrechner",
        "Français": "convertisseur d'unités", "Español": "calculadora con unidades",
        "Português (Brasil)": "calculadora de unidades"}
for name, term in LEAD.items():
    print(f"{name:20s} {len(bodies[name]):5d}字 {'OK' if term.lower() in bodies[name].lower() else 'MISSING'} {term}")
EOF
```

**`unit converter` の直訳を各言語の第一検索語に置くのはやめること。**
独語の `Einheitenrechner`（単位で計算する電卓）と `Umrechner`（換算器）は意味が違い、当アプリは前者に当たる。
西語の `calculadora con unidades` も「単位付きで計算する」側の語で、`conversor` とは別の意図の検索。

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
