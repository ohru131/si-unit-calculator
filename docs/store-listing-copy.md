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
| en | 26 | UnitCalc - Unit Calculator | ASO第一検索語 `unit calculator` |
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
| en | 69 | Just type the units. Prefixes and significant figures: 1kΩ × 1mA ⇒ 1V |
| ja | 40 | 単位をつけて計算するだけ。桁合わせも有効数字も自動。1kΩ × 1mA ⇒ 1V |
| es | 70 | Escribe las unidades: prefijos y cifras significativas. 1kΩ × 1mA ⇒ 1V |
| pt-BR | 72 | Digite as unidades: prefixos e algarismos significativos. 1kΩ × 1mA ⇒ 1V |
| de | 72 | Einheiten eintippen. Vorsatzzeichen und geltende Ziffern. 1kΩ × 1mA ⇒ 1V |
| fr | 73 | Saisissez les unités : préfixes et chiffres significatifs. 1kΩ × 1mA ⇒ 1V |

**短い説明は「利用者の動作 → 全部自動 → 実例1つ」の3拍で6言語そろえてある。**
以前は言語ごとに別のフックを立てていたが、**短い説明で言語ごとに主張を変えると、同じアプリの説明とは思えない**ほど
バラけた（en は入力と答え、de は Einheitenfehler、es は採点基準…）。差別化は**タイトルの副題**（上の表）と
詳しい説明のターゲット段落が担うので、短い説明は全言語で同じ構造にして**実例 `1kΩ × 1mA ⇒ 1V` を必ず入れる**。

- **抽象的な約束をやめた。** 旧 ja 版の「単位ごと計算して桁ミスをゼロに」は、アプリの仕組みが主語で
  「で、何が嬉しいのか」を読み手に翻訳させていた。「単位をつけて計算するだけ」は利用者の動作が主語。
- **実例は必ず本物にする。** `1kΩ × 1mA ⇒ 1V` は `tests/sample-calculations.test.ts` が実エンジンで検証している。
- 独語は以前80字ぎりぎり（78字）だったので、**足すときは必ず測り直すこと**（`Einheiten mit eintippen` の
  分離動詞を落として `Einheiten eintippen` にしてある。現在は72字で余裕がある）。

**2拍目を「換算」から「有効数字」に入れ替えた。** 換算はこのジャンルでは当たり前で、他と違うのは
**打った数字から有効数字を読み取って丸める**方（`lib/significant-figures.ts`）。ただし
`cifras significativas` / `algarismos significativos` / `chiffres significatifs` は語が長く、
**換算と有効数字を両立させると es 84字・pt-BR 87字・fr 84字で入らない**（`1kΩ × 1mA` の空白を削れば入るが、
アイコン・フィーチャーグラフィックと実例の表記が食い違う）。6言語そろえて有効数字を採った。

厳密値表示とノート件数はどの言語の短い説明にも入れていない（80字に収まらないため、詳しい説明に置いた）。

## 詳しい説明（Full description、上限4,000字）

### 2026-09-12 に全面的に書き直した理由

**1. 「6言語対応」と「194件」を掲載文から外した。** どちらも読み手の関心事ではない。
言語数は、その言語の掲載ページを見ている時点で自明（英語版しか無ければそもそも読めない）。
件数は「多い」以上の情報が無く、**何ができるノートなのかを一切伝えていない**。
代わりに、電圧降下から必要な電線の太さを逆算する・変圧器の巻数比といった**中身を名指し**し、
旧「6言語」ブロックに埋もれていた**地域別の既定値**（電源電圧・ブレーカー定格・カップの規格）を
ノートの節へ移した。こちらは具体的で、他のアプリが持っていない。

**2. 有効数字の自動判定を全言語に入れた。** `lib/significant-figures.ts`（PR #60）は
掲載文が書かれたあとに入った機能で、**どの言語の掲載文にも一度も出ていなかった**。
打ち込んだ数字から桁数を読んで丸め、丸める前の値と桁数を併記する、という挙動は
このジャンルで珍しく、実例（`12V / 4.7kΩ` → `2.553191489 mA` → 2桁 → `2.6 × 10⁰ mA`）で説明できる。
**加減算が混ざる式では丸めない**という「言わない」側の判断も、そのまま信頼の訴求になるので書いた。

**3. 入力中のプレビューの色分けを入れた。** これも未掲載だった（単位=青・定数=黄・使えない綴り=赤い下線、
赤をタップすると修正候補）。**スクリーンショットには毎回写っているのに、文章で説明したことが無かった。**

**4. AIっぽさの正体は「6言語が同じ見出し・同じ順・同じ項目数」だったので、そこを崩した。**
旧版は6言語すべてが `WHAT MAKES IT DIFFERENT` / `194 FORMULA NOTEBOOKS` / `SIX LANGUAGES…` を
同じ順に並べた**機能カテゴリ名の見出し**で、締めも全言語が
`…, and anyone who wants to trust the number a calculator gives them.` の同型だった。
見出しを主張のある文に変え（`IT READS YOUR PRECISION OFF YOUR OWN NUMBERS` など）、
テンプレの締めは捨てて「アカウント登録はありません。計算は端末の中に残ります」という事実で終えている。
`— … —` の挿入句、`at a glance`・`de un vistazo` のような中身の無い副詞句、
3語並列の多用も削った。**独語の `Punktabzug`・西語の `0,25 puntos`・葡語の ENEM のように、
その言語だけに効く一文は残してある**（ここは翻訳ではなく、その市場のために書いた部分）。

**5. 「9分野」と書いて箇条書きが8個しかなかったのを直した。** 化学と天体を1行にまとめたためで、
数えた読み手には合わない。現在は分野名を9つとも本文に出している。

**6. 到達できない機能を消した。** 旧版には無かったが、書き足す候補に挙がっていた「単位をタップすると
説明が出る」は、`app/(tabs)/index.tsx` の `setUnitInfoSymbol` が**全箇所 `null`（閉じる側）でしか
呼ばれておらず、利用者には開けない**。`lib/unit-explanations.ts` は存在するが到達不能なので掲載しない。

### English（3,699字）

```
Type 12V/4.7kΩ and you get 2.55 mA. Type 3m + 2kg and you get told that a length and a mass cannot be added. The second one is the point. UnitCalc is a unit calculator that would rather stop than hand you a confident wrong answer.

Units go in with the numbers. Every value is normalized to SI before the arithmetic happens, the dimensions are checked, and the answer comes back in the unit a person would have written. 1kΩ × 1mA is 1 V. 470µF × 12V is 5.64 mC. 2kg × 9.8m/s² is 19.6 N, not 19.6 m·kg/s².

IT READS YOUR PRECISION OFF YOUR OWN NUMBERS
12V / 4.7kΩ gives 2.553191489 mA, but you only typed two significant figures. Tap the 10ⁿ chip and the answer becomes 2.6 × 10⁰ mA, with the unrounded value still printed underneath and a badge showing the digit count it used. Where precision cannot honestly be read from what you typed, it declines to round at all: addition depends on decimal places rather than significant digits, and 5cm + 1mm mixes two different steps. It would rather say nothing than overstate what you know.

YOU SEE THE MISTAKE BEFORE YOU PRESS EQUALS
The preview under the input is colour-coded while you type. Units in blue, your saved constants in amber, anything that is not a usable unit underlined in red — tap it and corrections are offered. Half-finished expressions stay quiet instead of scolding you on every keystroke.

MORE THAN ONE WAY TO READ AN ANSWER
• Exact instead of rounded: 1/3 stays 1/3, 2*pi*50 becomes 100π, sqrt(8) becomes 2√2, sin(60deg) becomes √3/2. Typeset as real fractions and radicals, and copied exactly as shown.
• One result across every compatible unit, in a table you pull open under the card.
• Whole numbers in decimal, binary, octal and hexadecimal on that same card.
• Prefix keys (p n µ m c k M G) so MΩ and nF can be typed without the system keyboard.

YOUR OWN UNITS AND CONSTANTS
Define a unit as a multiple (2shaku = 0.606m) or as a formula, which covers offset scales like temperature. Save constants such as W = 3cm and use them in any later expression. Imperial and US units are first-class: 12ft + 3in, 72°F to °C, 30psi to bar, mpg in US or imperial gallons. PS and CV (metric horsepower, 735.5 W) are separate units from hp (745.7 W), which is 1.4% away.

FORMULA NOTEBOOKS, NOT A PICTURE OF A FORMULA
Nine libraries of ready-made calculations with real typeset math, each step showing its own result:
- School science, and High school physics
- Chemistry stoichiometry, and Astronomy & space
- Electricity & energy: voltage drop and the cable cross-section it needs, transformer turns ratio, motor efficiency and line current, plus hobby electronics and solar
- Hobbies & making: photography, audio, DIY, 3D printing
- Home & everyday life: cooking, coffee, fitness, weather
- Physics of cars & bicycles
- Mechanical & structural design: stress and strain, beams and columns, shafts, machine elements
Search them all at once by title, description or category. Each notebook remembers the values you last put in. The ones whose answers depend on where you live open already set to your region: mains voltage, breaker rating, electricity and fuel prices, mpg or km/L, and the cup and tablespoon sizes used where you are.

NO SUBSCRIPTION
Your calculation history is unlimited for everyone and is never trimmed or locked behind a purchase. Back up notebooks, constants and custom units to a file and restore them on another device.

UnitCalc Pro is one payment, once. It removes ads, exports your history as CSV, saves your own unit sets for faster entry, and shares a notebook as a formatted document you can print or keep as a PDF.

No account to create. Your calculations, notebooks and custom units stay on the device.
```

### 日本語（1,661字）

```
「12V ÷ 4.7kΩ」と打てば「2.55 mA」。「3m + 2kg」と打てば「長さ (m) と 質量 (kg) は足し引きできません」と返ってきます。大事なのは後者です。UnitCalc は、もっともらしい間違いを返すくらいなら止まる単位変換電卓です。

数値と一緒に単位を打ちます。計算の前にすべてSIへ直し、次元が合っているかを確かめてから、人が書くときの単位で答えを返します。1kΩ × 1mA は 1 V。470µF × 12V は 5.64 mC。2kg × 9.8m/s² は 19.6 N で、19.6 m·kg/s² とは出しません。

有効数字は、あなたが打った数字から読み取ります
「12V ÷ 4.7kΩ」の答えは 2.553191489 mA ですが、打ち込んだ数字は2桁です。10ⁿ のチップを押すと 2.6 × 10⁰ mA になり、丸める前の値と「何桁で丸めたか」が下に小さく残ります。打った式から精度を正直に読めないときは、丸めること自体をやめます。足し算の精度は有効数字ではなく小数点以下の位で決まり、5cm + 1mm のように単位が混ざると式の字面からは位が読めないからです。知っている以上のことを主張しません。

= を押す前に、間違いが見えます
入力欄の下のプレビューは、打ちながら色が付きます。単位は青、保存した定数は黄、単位として使えない綴りは赤い下線。赤い部分を押せば修正候補が出ます。書きかけの式では黙っているので、一文字打つごとに赤くなることはありません。

答えの読み方を選べます
・小数ではなく厳密値：1/3 は 1/3 のまま、2*pi*50 は 100π、sqrt(8) は 2√2、sin(60deg) は √3/2。本物の分数・根号として組版し、表示されたままの形でコピーできます。
・同じ答えを、互換のあるすべての単位で。結果カードの下から表を開きます。
・整数なら、同じカードで10進・2進・8進・16進を切り替えられます。
・接頭語キー（p n µ m c k M G）があるので、MΩ や nF もOSのキーボードを出さずに打てます。

自分の単位と定数
倍率（2尺＝0.606m）でも、式でも単位を定義できます。式にすれば温度目盛りのようなオフセットのある単位も作れます。W = 3cm のような定数を保存して、あとの式でそのまま使えます。ヤード・ポンド法も同じ扱いです（12ft + 3in、72°F を °C へ、30psi を bar へ、燃費は mpg か km/L）。

数式の画像ではなく、動く計算ノート
組版された数式と、手順ごとの計算結果が付いたノートを9分野ぶん収録しています。
・理科（小・中）、高校物理
・化学の量的関係、天体・宇宙
・電気・エネルギー：電圧降下から必要な電線の太さを逆算、変圧器の巻数比、モーターの効率と線電流、電子工作、太陽光
・趣味・ものづくり：写真、音響、DIY、3Dプリンタ
・暮らし：料理、コーヒー、フィットネス、天気
・車・自転車の物理
・機械・構造設計：応力とひずみ、はりと柱、軸、機械要素
タイトル・説明文・カテゴリ名を横断して一度に検索できます。各ノートは前回入れた値を覚えています。住んでいる地域で答えが変わるノートは、その地域の値で開きます（電源電圧、ブレーカーの定格、電気代と燃料の単価、mpg か km/L、計量カップと大さじの規格）。

サブスクはありません
計算履歴は誰でも無制限で、途中で切られることも、購入しないと見られなくなることもありません。ノート・定数・自作単位はファイルに書き出して、別の端末で戻せます。

UnitCalc Pro は買い切りです。広告が消え、履歴をCSVで書き出せ、よく使う単位のセットを保存でき、ノートを印刷やPDF保存ができる書式付きの文書として共有できます。

アカウント登録はありません。計算・ノート・自作単位は端末の中に残ります。
```

### Español（3,827字）

```
Escribe 12V/4,7kΩ y obtienes 2,55 mA. Escribe 3m + 2kg y te responde que una longitud y una masa no se pueden sumar. Lo importante es lo segundo. UnitCalc es una calculadora con unidades que prefiere detenerse antes que darte un resultado equivocado con toda seguridad.

Las unidades se escriben junto a los números. Cada valor pasa a SI antes de calcular, se comprueba que las dimensiones encajen y el resultado vuelve en la unidad que habría escrito una persona. 1kΩ × 1mA son 1 V. 470µF × 12V son 5,64 mC. 2kg × 9,8m/s² son 19,6 N, no 19,6 m·kg/s².

LA PRECISIÓN LA LEE DE TUS PROPIOS NÚMEROS
12V / 4,7kΩ da 2,553191489 mA, pero solo escribiste dos cifras significativas. Pulsa el chip 10ⁿ y el resultado pasa a 2,6 × 10⁰ mA, con el valor sin redondear debajo en pequeño y las cifras que ha usado. Donde la precisión no se puede leer con honestidad de lo que escribiste, renuncia a redondear: en una suma manda el decimal y no la cifra significativa, y 5cm + 1mm pone juntos dos pasos distintos. Prefiere callarse a afirmar más de lo que sabes.

VES EL ERROR ANTES DE PULSAR IGUAL
La vista previa bajo el campo se colorea mientras escribes: unidades en azul, constantes guardadas en amarillo y subrayado en rojo todo lo que no es una unidad utilizable. Pulsa el rojo y te ofrece correcciones. Con una expresión a medias se queda callada en vez de corregirte en cada tecla.

Es justo donde se pierden puntos: en la EBAU un error u omisión de unidades resta 0,25 puntos por apartado, tanto en los resultados intermedios como en el final. Las unidades no son decoración, son parte de la respuesta.

VARIAS FORMAS DE LEER UN RESULTADO
• Exacto en lugar de redondeado: 1/3 sigue siendo 1/3, 2*pi*50 pasa a 100π, sqrt(8) pasa a 2√2 y sin(60deg) pasa a √3/2, compuestos como fracciones y radicales de verdad, y copiados tal cual.
• Un resultado en todas las unidades compatibles, en una tabla bajo la tarjeta.
• Los enteros en decimal, binario, octal y hexadecimal en esa misma tarjeta.
• Teclas de prefijo (p n µ m c k M G) para escribir MΩ o nF sin el teclado del sistema.

TUS UNIDADES Y TUS CONSTANTES
Define una unidad como múltiplo (2shaku = 0,606m) o mediante una fórmula, lo que cubre escalas con desplazamiento como las de temperatura. Guarda constantes como W = 3cm y reutilízalas en cualquier expresión posterior.

CUADERNOS QUE CALCULAN, NO LA FOTO DE UNA FÓRMULA
Nueve bibliotecas de cálculos ya hechos, con matemáticas compuestas de verdad y el resultado de cada paso a la vista:
- Ciencias naturales, y Física (bachillerato)
- Estequiometría química, y Astronomía y espacio
- Electricidad y energía: caída de voltaje y la sección de cable que hace falta, relación de transformación, rendimiento y corriente de un motor, electrónica y solar
- Aficiones y creación: fotografía, audio, bricolaje, impresión 3D
- Hogar y vida diaria: cocina, café, forma física, meteorología
- Física de los vehículos
- Diseño mecánico y estructural: esfuerzo y deformación, vigas y columnas, ejes, elementos de máquinas
Búscalos todos a la vez por título, descripción o categoría. Cada cuaderno recuerda los últimos valores que pusiste. Los que dependen de dónde vives se abren ya ajustados a tu región: voltaje de la red, corriente del disyuntor, precios de electricidad y combustible, consumo y las medidas de taza y cuchara de tu país.

SIN SUSCRIPCIÓN
El historial es ilimitado para todos y nunca se recorta ni se guarda detrás de una compra. Haz copia de cuadernos, constantes y unidades propias en un archivo y restáuralos en otro dispositivo.

UnitCalc Pro es un pago único. Quita la publicidad, exporta el historial en CSV, guarda tus juegos de unidades y comparte un cuaderno como documento maquetado para imprimir o guardar en PDF.

Sin cuenta que crear. Tus cálculos, tus cuadernos y tus unidades se quedan en el dispositivo.
```

### Português (Brasil)（3,719字）

```
Digite 12V/4,7kΩ e você recebe 2,55 mA. Digite 3m + 2kg e você recebe o aviso de que um comprimento e uma massa não podem ser somados. O que importa é o segundo caso. O UnitCalc é uma calculadora de unidades que prefere parar a te entregar um resultado errado com toda a confiança.

As unidades você digita junto com os números. Cada valor vai para o SI antes da conta, as dimensões são conferidas e o resultado volta na unidade que uma pessoa teria escrito. 1kΩ × 1mA dão 1 V. 470µF × 12V dão 5,64 mC. 2kg × 9,8m/s² dão 19,6 N, e não 19,6 m·kg/s².

A PRECISÃO ELE LÊ DOS SEUS PRÓPRIOS NÚMEROS
12V / 4,7kΩ dá 2,553191489 mA, mas você digitou só dois algarismos significativos. Toque no chip 10ⁿ e o resultado vira 2,6 × 10⁰ mA, com o valor sem arredondar logo abaixo em letra pequena e a quantidade de algarismos usada. Onde a precisão não dá para ler com honestidade do que você digitou, ele desiste de arredondar: numa soma quem manda é a casa decimal, não o algarismo significativo, e 5cm + 1mm junta dois passos diferentes. Ele prefere não dizer nada a afirmar mais do que você sabe.

VOCÊ VÊ O ERRO ANTES DE APERTAR IGUAL
A prévia embaixo do campo vai ganhando cor enquanto você digita: unidades em azul, constantes salvas em amarelo e sublinhado em vermelho tudo o que não é uma unidade utilizável. Toque no vermelho e ele sugere correções. Com a expressão pela metade ele fica quieto, em vez de te corrigir a cada tecla.

É exatamente aí que se perde ponto no ENEM e nos vestibulares: a conversão que ficou para trás. As unidades fazem parte da resposta.

MAIS DE UM JEITO DE LER UM RESULTADO
• Exato em vez de arredondado: 1/3 continua 1/3, 2*pi*50 vira 100π, sqrt(8) vira 2√2 e sin(60deg) vira √3/2, compostos como frações e radicais de verdade, e copiados do jeito que aparecem.
• Um resultado em todas as unidades compatíveis, numa tabela embaixo do cartão.
• Os inteiros em decimal, binário, octal e hexadecimal nesse mesmo cartão.
• Teclas de prefixo (p n µ m c k M G) para digitar MΩ ou nF sem o teclado do sistema.

SUAS UNIDADES E SUAS CONSTANTES
Defina uma unidade como múltiplo (2shaku = 0,606m) ou por uma fórmula, o que cobre escalas deslocadas como as de temperatura. Salve constantes como W = 3cm e use de novo em qualquer expressão.

CADERNOS QUE CALCULAM, NÃO A FOTO DE UMA FÓRMULA
Nove bibliotecas de cálculos prontos, com matemática de verdade composta na tela e o resultado de cada passo à vista:
- Ciências, e Física (Ensino Médio)
- Estequiometria química, e Astronomia e espaço
- Eletricidade e energia: queda de tensão elétrica e a seção de cabo necessária, relação de transformação, rendimento e corrente de um motor, eletrônica e solar
- Hobbies e criação: fotografia, áudio, faça você mesmo, impressão 3D
- Casa e dia a dia: cozinha, café, preparo físico, tempo
- Física dos veículos
- Projeto mecânico e estrutural: tensão e deformação, vigas e colunas, eixos, elementos de máquinas
Procure em todos de uma vez por título, descrição ou categoria. Cada caderno lembra os últimos valores que você colocou. Os que dependem de onde você mora já abrem ajustados à sua região: tensão elétrica da rede, corrente do disjuntor, preços de energia e combustível, consumo e as medidas de xícara e colher.

SEM ASSINATURA
O histórico é ilimitado para todo mundo e nunca é cortado nem trancado atrás de uma compra. Faça backup de cadernos, constantes e unidades próprias num arquivo e restaure em outro aparelho.

O UnitCalc Pro é uma compra única. Tira os anúncios, exporta o histórico em CSV, salva seus conjuntos de unidades e compartilha um caderno como documento diagramado para imprimir ou guardar em PDF.

Sem conta para criar. Seus cálculos, seus cadernos e suas unidades ficam no aparelho.
```

### Deutsch（3,908字）

```
Tippe 12V/4,7kΩ und du bekommst 2,55 mA. Tippe 3m + 2kg und du bekommst die Auskunft, dass sich eine Länge und eine Masse nicht addieren lassen. Das Zweite ist der Punkt. UnitCalc ist ein Einheitenrechner, der lieber stehen bleibt, als dir ein selbstbewusstes falsches Ergebnis zu geben.

Die Einheiten tippst du mit. Vor dem Rechnen wird jeder Wert auf SI gebracht, die Dimensionen werden geprüft, und das Ergebnis kommt in der Einheit zurück, die ein Mensch hingeschrieben hätte. 1kΩ × 1mA sind 1 V. 470µF × 12V sind 5,64 mC. 2kg × 9,8m/s² sind 19,6 N und nicht 19,6 m·kg/s².

DIE GENAUIGKEIT LIEST ER AUS DEINEN EIGENEN ZAHLEN
12V / 4,7kΩ ergibt 2,553191489 mA, getippt hast du aber nur zwei geltende Ziffern. Ein Tipp auf den 10ⁿ-Chip macht daraus 2,6 × 10⁰ mA, darunter bleiben der ungerundete Wert und die Zahl der Ziffern stehen. Wo sich die Genauigkeit nicht ehrlich ablesen lässt, rundet er gar nicht: Beim Addieren entscheidet die Nachkommastelle, und bei 5cm + 1mm stehen zwei Schrittweiten nebeneinander. Lieber sagt er nichts, als mehr zu behaupten, als du weißt.

FEHLER SIEHST DU, BEVOR DU AUF GLEICH DRÜCKST
Die Vorschau unter der Eingabe färbt sich beim Tippen: Einheiten blau, gespeicherte Konstanten gelb, alles, was keine brauchbare Einheit ist, rot unterstrichen. Tippe auf das Rote, und du bekommst Korrekturvorschläge. Bei halbfertigen Ausdrücken bleibt er still, statt dich bei jedem Anschlag zu ermahnen.

In der Ausbildung und in der Klausur gehen genau hier die Punkte verloren: Zehnerpotenzen und Vorsatzzeichen. Eine falsche Einheit ist kein Schönheitsfehler, sondern Punktabzug.

MEHR ALS EINE ART, EIN ERGEBNIS ZU LESEN
• Exakt statt gerundet: 1/3 bleibt 1/3, aus 2*pi*50 wird 100π, aus sqrt(8) wird 2√2, aus sin(60deg) wird √3/2 — als echter Bruch und echtes Wurzelzeichen gesetzt und genau so kopiert.
• Ein Ergebnis in allen passenden Einheiten, als Tabelle unter der Karte.
• Ganze Zahlen dezimal, binär, oktal und hexadezimal auf derselben Karte.
• Vorsatztasten (p n µ m c k M G), damit MΩ und nF ohne Systemtastatur gehen.

DEINE EIGENEN EINHEITEN UND KONSTANTEN
Lege eine Einheit als Vielfaches an (2shaku = 0,606m) oder als Formel, womit auch Temperaturskalen mit Nullpunktversatz gehen. Speichere Konstanten wie W = 3cm und nutze sie in jedem späteren Ausdruck. PS und CV (metrische Pferdestärke, 735,5 W) sind eigene Einheiten und nicht das englische hp (745,7 W), das um 1,4 % danebenliegt.

RECHENHEFTE STATT EINES BILDES VON EINER FORMEL
Neun Sammlungen fertiger Rechnungen mit echtem Formelsatz, bei denen jeder Schritt sein eigenes Ergebnis zeigt:
- Naturwissenschaften und Physik (Oberstufe)
- Stöchiometrie sowie Astronomie & Weltraum
- Elektrizität & Energie: Spannungsfall und der nötige Leiterquerschnitt, Übersetzungsverhältnis des Transformators, Wirkungsgrad und Strom eines Motors, dazu Elektronik und Solar
- Hobby & Selbermachen: Fotografie, Audio, Heimwerken, 3D-Druck
- Haushalt & Alltag: Kochen, Kaffee, Fitness, Wetter
- Physik von Autos & Fahrrädern
- Maschinen- & Tragwerksentwurf: Spannung und Dehnung, Balken und Stützen, Wellen, Maschinenelemente
Durchsuche alle auf einmal nach Titel, Beschreibung oder Kategorie. Jedes Rechenheft merkt sich deine letzten Werte. Die, deren Ergebnis vom Wohnort abhängt, starten mit deinen regionalen Werten: Netzspannung, Nennstrom, Strom- und Kraftstoffpreis, Verbrauch, Tassen- und Löffelmaß.

KEIN ABO
Der Verlauf ist für alle unbegrenzt und wird weder gekürzt noch hinter einem Kauf weggesperrt. Sichere Rechenhefte, Konstanten und eigene Einheiten in eine Datei und stelle sie auf einem anderen Gerät her.

UnitCalc Pro ist ein einmaliger Kauf. Er entfernt die Werbung, exportiert den Verlauf als CSV, speichert eigene Einheitensätze und teilt ein Rechenheft als gesetztes Dokument zum Drucken oder als PDF.

Kein Konto nötig. Deine Rechnungen, Rechenhefte und eigenen Einheiten bleiben auf dem Gerät.
```

### Français（3,898字）

```
Tapez 12V/4,7kΩ, vous obtenez 2,55 mA. Tapez 3m + 2kg, on vous répond qu'une longueur et une masse ne s'additionnent pas. C'est le second cas qui compte. UnitCalc est un convertisseur d'unités et une calculatrice qui préfère s'arrêter plutôt que de vous donner un résultat faux avec assurance.

Les unités se tapent avec les nombres. Chaque valeur passe en SI avant le calcul, les dimensions sont vérifiées, et le résultat revient dans l'unité qu'une personne aurait écrite. 1kΩ × 1mA font 1 V. 470µF × 12V font 5,64 mC. 2kg × 9,8m/s² font 19,6 N, et non 19,6 m·kg/s².

LA PRÉCISION EST LUE DANS VOS PROPRES CHIFFRES
12V / 4,7kΩ donne 2,553191489 mA, mais vous n'avez tapé que deux chiffres significatifs. Touchez la pastille 10ⁿ et le résultat devient 2,6 × 10⁰ mA, la valeur non arrondie restant en petit dessous avec le nombre de chiffres retenus. Là où la précision ne se lit pas honnêtement dans ce que vous avez tapé, elle renonce à arrondir : dans une addition c'est la décimale qui décide, et 5cm + 1mm met côte à côte deux pas différents. Elle préfère se taire qu'affirmer plus que vous ne savez.

VOUS VOYEZ L'ERREUR AVANT D'APPUYER SUR ÉGAL
L'aperçu sous la saisie se colore au fur et à mesure : unités en bleu, constantes en jaune, et souligné en rouge tout ce qui n'est pas une unité utilisable. Touchez le rouge, des corrections vous sont proposées. Sur une expression inachevée, elle se tait au lieu de vous reprendre à chaque touche.

C'est la consigne du lycée : garder l'unité à chaque étape, pour que l'erreur devienne visible quand elle ne se simplifie pas.

PLUSIEURS FAÇONS DE LIRE UN RÉSULTAT
• Exact plutôt qu'arrondi : 1/3 reste 1/3, 2*pi*50 devient 100π, sqrt(8) devient 2√2, sin(60deg) devient √3/2, composés en vraies fractions et vrais radicaux, et copiés tels quels.
• Un résultat dans toutes les unités compatibles, dans un tableau sous la carte.
• Les entiers en décimal, binaire, octal et hexadécimal sur cette même carte.
• Des touches de préfixes (p n µ m c k M G) pour taper MΩ ou nF sans le clavier du système.

VOS UNITÉS ET VOS CONSTANTES
Définissez une unité comme un multiple (2shaku = 0,606m) ou par une formule, ce qui couvre les échelles décalées comme les températures. Enregistrez des constantes comme W = 3cm et réutilisez-les. PS et CV (cheval-vapeur, 735,5 W) sont des unités distinctes du hp anglais (745,7 W), qui s'en écarte de 1,4 %.

DES CARNETS QUI CALCULENT, PAS UNE IMAGE DE FORMULE
Neuf bibliothèques de calculs prêts à l'emploi, en écriture mathématique composée, chaque étape affichant son propre résultat :
- Sciences, et Physique (lycée)
- Stœchiométrie, et Astronomie et espace
- Électricité et énergie : chute de tension et section de câble nécessaire, rapport de transformation, rendement et courant d'un moteur, électronique et solaire
- Loisirs et fabrication : photo, audio, bricolage, impression 3D
- Maison et vie quotidienne : cuisine, café, forme physique, météo
- Physique des voitures et vélos
- Conception mécanique et structurale : contraintes et déformations, poutres et poteaux, arbres, éléments de machines
Cherchez dans tous à la fois par titre, description ou catégorie. Chaque carnet retient vos dernières valeurs. Ceux dont le résultat dépend du pays s'ouvrent déjà réglés sur votre région : tension du secteur, calibre du disjoncteur, prix de l'électricité et du carburant, consommation, mesures de tasse et de cuillère.

SANS ABONNEMENT
L'historique est illimité pour tout le monde, jamais tronqué ni réservé aux acheteurs. Sauvegardez carnets, constantes et unités dans un fichier, et restaurez-les sur un autre appareil.

UnitCalc Pro est un achat unique. Il retire la publicité, exporte l'historique en CSV, enregistre vos jeux d'unités et partage un carnet sous forme de document mis en page, à imprimer ou à garder en PDF.

Aucun compte à créer. Vos calculs, vos carnets et vos unités restent sur l'appareil.
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
