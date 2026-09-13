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
- 掲載文に書いた実例の値 — `1kΩ × 1mA`→1 V・`470µF × 12V`→5.64 mC・`2kg × 9.8m/s²`→19.6 N は `tests/sample-calculations.test.ts` が実エンジンで検証している。`(500m + 1km) ÷ 1min`→25 m/s（km/h チップで 90 km/h）・`12V/4.7kΩ`→2.553191489 mA・`5cm + 1mm`→5.1 cm・`12ft + 3in`→12.25 ft は 2026-09-13 に `evaluateExpression` + `resolveDisplayUnit` を直接評価して確認した（表示単位の自動選択の結果まで含めて一致）
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
| es-419 | 28 | UnitCalc - Unidades y física | 中南米向けの別掲載（本文だけ差し替え、タイトルは共通） |
| pt-BR | 28 | UnitCalc - Unidades e física | ENEM の física |
| de | 27 | UnitCalc - Einheitenrechner | ASO第一検索語 `Einheitenrechner` |
| fr | 26 | UnitCalc - Calcul d'unités | lycée の physique-chimie（第一検索語 `convertisseur d'unités` は11+22字で30字に入らない） |

**30字は「UnitCalc - 」の11字を引くと19字しか残らない。** 西語の `calculadora con unidades`（24字）と
仏語の `convertisseur d'unités`（22字）は第一検索語をタイトルに入れられないので、
**短い説明と詳しい説明の本文で受ける**（Google Play は本文の語で引くのでタイトルに無くても効く）。

## 短い説明（Short description、上限80字）

| 言語 | 文字数 | 本文 |
|---|---|---|
| en | 77 | Calculates with the units, not just numbers. Readable answers. 1kΩ × 1mA ⇒ 1V |
| ja | 48 | 数字だけでなく、単位まで含めて計算する電卓。答えは読みやすい単位で。1kΩ × 1mA ⇒ 1V |
| es | 76 | Calcula con unidades, no solo con números. Resultado legible. 1kΩ × 1mA ⇒ 1V |
| es-419 | 76 | Calcula con unidades, no solo con números. Resultado legible. 1kΩ × 1mA ⇒ 1V |
| pt-BR | 78 | Calcula com as unidades, não só com números. Resultado legível. 1kΩ × 1mA ⇒ 1V |
| de | 78 | Rechnet mit Einheiten, nicht nur mit Zahlen. Lesbares Ergebnis. 1kΩ × 1mA ⇒ 1V |
| fr | 80 | Calcule avec les unités, pas les seuls nombres. Résultat lisible. 1kΩ × 1mA ⇒ 1V |

**短い説明は、詳しい説明の冒頭と同じ主張（数字だけでなく単位まで含めて計算する → 答えは読みやすい単位で）を
1文ずつに縮めたもの＋実例 `1kΩ × 1mA ⇒ 1V`、で6言語そろえてある**（2026-09-13）。
以前の「Just type the units. Prefixes and significant figures: …」は名詞の羅列で、文として読めなかった。
短い説明は一覧に出る唯一の文章なので、**詳しい説明を開かない人にもアプリの主張が1文で伝わる形**にしてある。
差別化はタイトルの副題（上の表）と詳しい説明の「こんな方に」の段落が担う。

- **実例は必ず本物にする。** `1kΩ × 1mA ⇒ 1V` は `tests/sample-calculations.test.ts` が実エンジンで検証していて、
  アプリアイコン・フィーチャーグラフィック・スクリーンショット `16-ohms-law` と同じ式。**短い説明を変えても
  この式は残す**（変えると図版と食い違う）。
- **80字は es / fr で効いてくる。** `Calcula con las unidades` の `las` を落として76字、仏語は
  `pas seulement les nombres` が入らず `pas les seuls nombres` にしてある（80字ちょうど）。**足すときは必ず測り直すこと。**
- 有効数字・厳密値・ノート件数は短い説明に入れていない。80字では主張と実例で埋まる。

## 詳しい説明（Full description、上限4,000字）

### 掲載文が「入力できない式」を書いていた（2026-09-12に全言語で修正）

**`Escribe 12V/4,7kΩ` は打っても動かない。** エンジンはカンマを**関数の引数の区切り**として扱うので、
`12V/4,7kΩ` は `The expression syntax is invalid.` で落ちる（実際に評価して確認）。
es / es-419 / pt-BR / de / fr の5言語が、**動かない式を「こう打て」と書いていた**（計15箇所）。

**入力と出力で扱いが違う**ので、片方だけ直すこと:

| | 小数点 | 理由 |
|---|---|---|
| **打ち込む式** | **必ず `.`** | 評価器がカンマを受け付けない（`12V/4.7kΩ`） |
| **表示される結果** | ロケールどおり `,` | `formatNumberForLocale` が言語別に整形する（`2,55 mA`。実行して確認） |

散文の中で `12V/4.7kΩ y obtienes 2,55 mA` と混在するのは一見ちぐはぐだが、**画面でもそう見える**
（入力欄はドット、結果はカンマ）ので、これが正しい。修正後の4式は実エンジンで値も確認済み
（`12V/4.7kΩ`→0.002553…A / `2kg × 9.8m/s²`→19.6 / `470µF × 12V`→0.00564 / `1kΩ × 1mA`→1）。

### es-419 に中南米の調査を反映した（2026-09-12）

**調査の結論: EBAU の「0,25点減点」に相当する事実は中南米に無い。**
主要な大学入学試験（Saber 11・PAES・EXANI-II・UNAM の admisión）は**すべて全問マークシート**で、
記述の採点基準そのものが存在しない。つまり「単位を書き落とすと点が引かれる」という仕組みが無い。
**この主張を中南米向けに書くと単純に嘘になる**ので、書いていない。

代わりに入れたもの:

- **試験名は「検算に使える対象」として並べるだけ**（`Saber 11`・`PAES`・`EXANI-II`・`examen de admisión`）。
  減点の主張は付けない。いずれも2026年時点で実在・現行であることを確認した。
- **「単位が成績の一部」と言えるのは `informe de laboratorio`**（大学の物理・化学の実験レポート）。
  ここは採点基準に単位・有効数字・不確かさが明記されるのが普通で、**仏語版の `compte rendu de TP` と同じ筋**。
- **電気の規格は具体的に書ける**（試験と違い裏取りができた）。`RETIE`・`NTC 2050`（コロンビア）、
  `NOM-001-SEDE`（メキシコ）、`AEA 90364`（アルゼンチン）。電圧降下と電線の断面積はまさにこれらの計算。

**絶対に書いてはいけない名前**（廃止・改称済み。書くと即座に古いと分かる）:

| 書かない | 理由 |
|---|---|
| `COMIPEMS` | 2025年に廃止され ECOEMS に移行 |
| `PSU` / `PDT` | 2022年の PAES で置き換え済み |
| `Ser Bachiller` / `EAES` | エクアドルで2度改称（現行は Prueba Transformar。しかも物理が無い） |
| `Pruebas FARO` | コスタリカで改称、2026年にさらに変更 |
| アルゼンチンの「入学試験」 | **存在しない**（UBA は無選抜。CBC は入試ではなく1年目） |
| `NOM-001-SEDE` の版数 | 2012 / 2018 / 2022 で資料が食い違う。**年を書かない** |

**言い回しも中南米向けに直した**（Google 自身の es-419 のヘルプに合わせた）:
`Pulsa` → `Toca`（`pulsa` はスペインの言い方で、UI文では最も目立つ違い）、
燃費は `consumo`（スペインは L/100km）ではなく `rendimiento`（中南米は km/L。アプリの既定値も km/L）。
**`tú` のまま**にしてある（アルゼンチンの `vos` は中南米全体では少数派で、19か国に1つの掲載を出す以上
どの地域でも「間違いではない」`tú` が最善。Google も Microsoft の「中立スペイン語」も同じ判断）。

#### アプリ側に残っている用語の問題（次のバージョンで）

**`disyuntor` はアルゼンチンでは漏電遮断器（人を守る方）を指す。** 配線用遮断器は `llave térmica` で、
別物。アプリの `lib/notebook-formulas/source/practical.ts` は `Capacidad del disyuntor` と表記しており、
**アルゼンチンの利用者には意味が違って伝わる**。中南米で通じる正式名は `interruptor termomagnético`。
掲載文だけ直すとストアとアプリで名前が食い違うので、**掲載文では語自体を避けた**（`el interruptor`）。
同様に `caída de voltaje` は、NOM-001-SEDE・RETIE の本文では `caída de tensión`。
**どちらもアプリ本体の訳語を直す話**なので、`docs/i18n-glossary.md` の方針（応力との衝突を避けて
`voltaje` を使う）と併せて検討する必要がある。

### es-419（スペイン語圏の中南米）を別掲載として足した（2026-09-12）

**ブラジルは pt-BR で最初から対応済み**（ENEM をターゲットに名指しした本文・専用のスクショ・図版がそろっている）。
足りていなかったのは**スペイン語圏の中南米**（メキシコ・コロンビア・アルゼンチンなど）で、ここは
ポルトガル語のブラジルとは別の市場。`docs/target-users-by-locale-2026-09.md` 第60行が
「es（ES + 中南米）」と1つに束ねているが、**掲載は分けないと中身が合わない。**

**スペイン向け（es-ES）はそのまま残す。** Play は同じアプリに複数のスペイン語掲載を持てるので、
es-419 を足してもスペインの掲載は消えない。

**本文を差し替えた箇所は3つだけ**（残りは es と同一。`es-419` の本文は es から機械的に導いていて、
差分は「こんな方に」の段落・地域別既定値の1文・`Pulsa`→`Toca` の3か所に閉じている）:

| 箇所 | es-ES | es-419 |
|---|---|---|
| 「こんな方に」 | EBAU の `resta 0,25 puntos por apartado`、FP Instalaciones Eléctricas | Saber 11 / PAES / EXANI-II / examen de admisión（減点の主張なし）、informe de laboratorio、RETIE / NTC 2050 / NOM-001-SEDE / AEA 90364 |
| 地域別の既定値 | `voltaje de la red`・`disyuntor`（一般） | `127 V en México, 120 V en Colombia, 230 V en Argentina o Chile`・`interruptor`・`rendimiento en km/L` |
| UI動詞 | `Pulsa` | `Toca` |

- **EBAU はスペインの大学入試なので中南米では通じない。** 逆に強みになるのが2つ目で、
  **中南米は国ごとに電源電圧が本当に違う**（`lib/preset-regional-defaults.ts` を実行して確認:
  MX 127V / CO 120V / AR・CL・PE 230V / ES 230V）。スペイン向けには書く意味の薄い機能が、
  中南米では「自分の国の値で開く」という具体的な訴求になる。
- **中南米の試験名は入れていない。** 調査資料に裏取りが無く、EXANI や Saber のような名前を
  推測で書くと「その国で実在するか」を確かめずに掲載することになる。必要なら先に調査する。
- **画像は es のものを流用する**（`scripts/push-play-listing.mjs` の `IMAGE_SOURCE`）。
  アプリ自体のスペイン語は1種類なので、撮り直しても同じ絵になる。
- **ただし `14-exam-samples` のカットには「Preparación (EBAU)」が写る。**
  これはアプリ側のサンプルカテゴリのラベル（`lib/sample-calculations.ts`）なので、
  掲載文だけでは直せない。**中南米で違和感が出るのを承知で流用している**（8枚中1枚）。
  本気で分けるなら、アプリの `es` のラベルを中立な語にするか、言語とは別に地域で
  ラベルを出し分ける必要があり、別作業になる。

### 2026-09-13 に「単位まで含めて計算する」を軸に書き直した理由

**1. 冒頭を「間違いを止める」から「単位まで含めて計算する」へ変えた。** 旧版は6言語とも
「`3m + 2kg` と打てばエラーになる。大事なのは後者だ」で始まっていて、**最初に見せるのがエラー画面**だった。
このアプリの主張は「数字だけでなく単位まで含めて計算する。計算の前に単位をそろえ、次元を確かめる。
だから種類の違う量を間違って計算しない。答えも SI基本単位の羅列ではなく人が読む単位で返す」で、
次元エラーはその**結果として**ついてくるもの。冒頭はこの順で書き、実例4つ
（`(500m + 1km) ÷ 1min`・`1kΩ × 1mA`・`470µF × 12V`・`2kg × 9.8m/s²`）を続けてから、
「打ちながら確かめられる」の節で `3m + 2kg` を出している。

**`(500m + 1km) ÷ 1min` の答えは 25 m/s であって 90 km/h ではない。** 表示単位の自動選択
（`lib/display-unit.ts`）は式に速度の単位が無いので SI接頭語の m/s を選ぶ。90 km/h は結果カードの
km/h チップを押した後の値なので、掲載文では「25 m/s、チップを1つ押せば 90 km/h」と2段で書いてある。
**実エンジンで評価して確認した**（`m + km` の足し算・`min` での割り算がそのまま通るのがこの例の要点）。

**2. 「こんな方に」の段落を、`docs/target-users-by-locale-2026-09.md` 第1節のターゲットで書いた。**
旧版はターゲットの記述が1〜2文（独 `Punktabzug`・西 `0,25 puntos`）しか無く、**誰のためのアプリかが
どの言語でも読めなかった**。現在は言語ごとに主・副ターゲットと「決定的な瞬間」を1段落で書く:

| 言語 | 主ターゲット | 決定的な瞬間 | 副ターゲット |
|---|---|---|---|
| ja | 電験三種・電工二種・乙4の学習者 | 学習中の検算（本番は持ち込み不可） | 理工系1〜2年の実験レポート、機械・建築のジュニアエンジニア |
| en | 工学部生・FE受験者 | `units are part of the answer`、単位換算に潜む1000倍 | City & Guilds 2365 の電気訓練生（電圧降下・電線サイズ） |
| de | Ausbildung Elektroniker、Techniker / Meister | Zehnerpotenzen・Vorsatzzeichen、Einheitenfehler = Punktabzug | Physik / Chemie の Klausur・Abitur |
| fr | lycée の physique-chimie、prépa / BTS | 「単位を各段階に書く」という指導そのもの、mL→L の1000倍 | Bac Pro MELEC / BTS électrotechnique |
| es | EBAU の física | 単位の誤り・記載漏れで0,25点減点（中間結果も） | 実験レポート、FP Instalaciones Eléctricas y Automáticas |
| es-419 | Saber 11 / PAES / EXANI-II / examen de admisión | 換算の途中放棄・接頭語の未打ち消し（**減点の主張はしない**） | informe de laboratorio、RETIE / NTC 2050 / NOM-001-SEDE / AEA 90364 |
| pt-BR | ENEM / vestibular | 同上 | relatório de laboratório、NR-10 / técnico em eletrotécnica |

**全言語で「試験本番には承認電卓しか持ち込めないので、UnitCalc の出番は勉強・宿題・レポート」と書いた。**
同資料の第0節にあるとおり、この JTBD（学習中の検算）は日本限定ではなく FE 試験・Klausur・EBAU に共通する。
**逆に、資料が「取りに行かない」と決めた米国の職人（分数インチ・AWG）向けの文言は入れていない。**

**3. 「サブスクはありません」の見出しをやめた。** 存在しないものを見出しにすると、読み手はまず
「サブスクがあるアプリなのか」と考えてから否定を読むことになる。現在は「料金について」
（en `FREE TO USE, WITH A ONE-TIME PRO UPGRADE`）として、**無料で使える範囲 → Pro は買い切り**の順で
事実だけを書く。サブスクが無いことは「一度だけの買い切りで、月々の支払いはありません」の中で伝わる。
**pt-BR だけは Pro を「広告が邪魔なら」と控えめに書いてある**（同資料の方針: ブラジルは母数最大・単価最小で、
買い切りを押し込まない）。

**4. 文体を「読める散文」に寄せた。** 旧版の
「もっともらしい間違いを返すくらいなら止まる」「知っている以上のことを主張しません」のような
擬人化の決め文句を減らし、各節を「何が起きるか」の平叙文で書いた。見出しも `IT READS YOUR PRECISION
OFF YOUR OWN NUMBERS` のような凝った文から、節の中身が分かる短い名詞句（`WHO IT IS FOR` /
`YOUR OWN UNITS AND CONSTANTS`）に戻した。**その言語だけに効く一文は残してある**
（独 `Punktabzug`・西 `0,25 puntos`・仏「単位を各段階に」・葡 ENEM）。

**5. 4,000字に収めるために削ったもの**（es 3,830 / es-419 3,908 / de 3,861 / fr 3,963 / pt-BR 3,710）:
進数（2/8/16進）の箇条、「趣味・ものづくり」「暮らし」のサブカテゴリ列挙、書きかけの式で赤くならない話、
ノートの検索、計量カップの規格、履歴が「切られない・購入で塞がれない」の言い回し。**足すなら同じ量を先に削ること**
（仏語は残り37字）。日本語は1,735字で余裕があるが、6言語で節の構成をそろえるために同じものを削っている。

**6. 自作単位の例を `2shaku = 0.606m` から `shaku = 0.303m` に直した。** 前者は「単位を定義する式」として
読めない（`2shaku` は記号ではない）。1尺 = 0.30303 m。

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
このジャンルで珍しく、実例（`12V / 4.7kΩ` → `2.553191489 mA` → 2桁 → `2.6 × 10⁻³ A`）で説明できる。
**掲載文では単位チップで A を選んでから科学表記にする手順で書いてある**（2026-09-13）。既定の mA のままだと
`2.6 × 10⁰ mA` と指数が0になり、科学表記にした意味が伝わらない（スクリーンショット `17-significant-figures` も同じ手順で撮っている）。
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

### English（3,624字）

```
UnitCalc is a unit calculator built around one idea: calculate with the units, not just with the numbers.

Type the units in with the values. Before any arithmetic happens, everything is brought to a common base and the dimensions are checked, so a length never gets added to a mass by mistake. The answer comes back in a unit a person would actually write, not as a pile of SI base units.

(500m + 1km) ÷ 1min gives 25 m/s, and one tap turns it into 90 km/h.
1kΩ × 1mA gives 1 V.
470µF × 12V gives 5.64 mC.
2kg × 9.8m/s² gives 19.6 N, not 19.6 m·kg/s².

WHO IT IS FOR
Engineering students and anyone preparing for the FE exam, where units are part of the answer rather than an optional extra. Lab reports, where a factor of 1000 hides inside a unit conversion. Electrical trainees working through City & Guilds 2365, who need voltage drop and cable sizing to come out right. Exam rooms only admit approved calculators, so UnitCalc belongs in the studying, the homework and the write-up, where the habit of carrying units is built.

YOU SEE PROBLEMS WHILE YOU TYPE
The preview under the input is colour-coded as you go: units in blue, saved constants in amber, anything that is not a recognised unit underlined in red. Tap the red and corrections are offered. Type 3m + 2kg and the result card tells you a length and a mass cannot be added, before you press equals.

SIGNIFICANT FIGURES, READ FROM YOUR OWN INPUT
12V / 4.7kΩ works out to 2.553191489 mA, but you typed two significant figures. Pick A and tap the 10ⁿ chip, and you get 2.6 × 10⁻³ A, with the unrounded value and the digit count shown underneath. Where the precision cannot be read honestly from what you typed, as in a sum like 5cm + 1mm, it does not round at all.

MORE WAYS TO READ A RESULT
• Exact form: 1/3 stays 1/3, 2*pi*50 becomes 100π, sqrt(8) becomes 2√2, as real fractions and radicals.
• The same result in every compatible unit, in a table under the result card.
• Prefix keys (p n µ m c k M G), so MΩ and nF go in without the system keyboard.

YOUR OWN UNITS AND CONSTANTS
Define a unit as a multiple (shaku = 0.303m) or as a formula, which also covers offset scales such as temperature. Save constants like W = 3cm and use them in later expressions. Imperial and US customary units are fully supported: 12ft + 3in gives 12.25 ft, and 72°F or 30psi convert to °C or bar with a tap.

FORMULA NOTEBOOKS THAT CALCULATE
Nine libraries of ready-made, step-by-step calculations with properly typeset formulas, each step showing its own result:
• School science, and High school physics
• Chemistry stoichiometry, and Astronomy & space
• Electricity & energy: voltage drop and the cable cross-section it needs, transformer turns ratio, motor efficiency and line current, hobby electronics, solar
• Hobbies & making
• Home & everyday life
• Physics of cars & bicycles
• Mechanical & structural design: stress and strain, beams and columns, shafts, machine elements
Each notebook remembers your last values, and the ones that depend on where you live open with your region's mains voltage, breaker rating and electricity and fuel prices.

FREE TO USE, WITH A ONE-TIME PRO UPGRADE
Every calculation feature is free and your history is unlimited. Notebooks, constants and custom units can be backed up to a file and restored on another device.
UnitCalc Pro is a single purchase with no recurring charge. It removes ads, exports your history as CSV, saves your own unit sets for faster entry, and shares a notebook as a formatted document you can print or save as PDF.

No account to create. Your calculations, notebooks and custom units stay on your device.
```

### 日本語（1,735字）

```
UnitCalc が大切にしているのは、数字だけで計算するのではなく、単位まで含めて計算することです。

数値と一緒に単位を打ち込みます。計算の前に単位をそろえ、次元が合っているかを確かめる。だから、長さと質量のように種類の違う量を、うっかり足してしまうことがありません。答えも、SI基本単位の組み合わせをそのまま並べるのではなく、人が読みやすい単位に直して表示します。

「(500m + 1km) ÷ 1min」なら「25 m/s」。チップを1つ押せば「90 km/h」。
「1kΩ × 1mA」なら「1 V」。
「470µF × 12V」なら「5.64 mC」。
「2kg × 9.8m/s²」なら「19.6 N」。19.6 m·kg/s² とは出しません。

こんな方に
電験三種・第二種電気工事士・危険物乙4の勉強中の検算に。理工系1〜2年の実験レポートで、単位変換の1000倍のずれを出したくないときに。機械・建築のジュニアエンジニアの、手計算の確認に。試験本番に持ち込める電卓は決まっていますから、UnitCalc の出番は勉強・宿題・レポートです。単位を最後まで持ち歩く癖は、そこで身につきます。

打ちながら確かめられます
入力欄の下のプレビューは、打った瞬間に色が付きます。単位は青、保存した定数は黄、単位として認識できない綴りは赤い下線。赤い部分を押せば修正候補が出ます。「3m + 2kg」と打てば、= を押す前に結果カードが「長さ (m) と 質量 (kg) は足し引きできません」と教えてくれます。書きかけの式には口を出さないので、一文字打つごとに赤くなることはありません。

有効数字は、打った数字から読み取ります
「12V ÷ 4.7kΩ」の答えは 2.553191489 mA ですが、打ち込んだ数字は2桁です。単位を A にして 10ⁿ のチップを押すと 2.6 × 10⁻³ A になり、丸める前の値と「何桁で丸めたか」がその下に残ります。「5cm + 1mm」のように足し算で位が読めない式では、無理に丸めません。

答えの読み方を選べます
・厳密値（分数・π）：1/3 は 1/3 のまま、2*pi*50 は 100π、sqrt(8) は 2√2、sin(60deg) は √3/2。本物の分数・根号として表示します。
・同じ答えを、互換のある単位すべてで。結果カードの下に表として開けます。
・接頭語キー（p n µ m c k M G）で、MΩ や nF もOSのキーボードを出さずに打てます。

自分の単位と定数
倍率（shaku = 0.303m）でも式でも単位を定義できます。式にすれば、温度のようにゼロ点がずれた単位も作れます。W = 3cm のような定数を保存して、あとの式でそのまま使えます。ヤード・ポンド法も同じ扱いです（12ft + 3in、72°F、30psi）。

計算ノートは、数式の画像ではなく動く計算です
組版された数式と、手順ごとの計算結果が付いたノートを9分野ぶん収録しています。
・理科（小・中）、高校物理
・化学の量的関係、天体・宇宙
・電気・エネルギー：電圧降下と必要な電線の太さ、変圧器の巻数比、モーターの効率・損失・線電流、電子工作、太陽光
・趣味・ものづくり
・暮らし
・車・自転車の物理
・機械・構造設計：応力とひずみ、はりと柱、軸、機械要素
タイトル・説明文・カテゴリ名を横断して検索できます。各ノートは前回入れた値を覚えていて、地域で答えが変わるノート（電源電圧、ブレーカーの定格、電気代と燃料の単価、計量カップの規格）は、お住まいの地域の値で開きます。

料金について
計算機能はすべて無料で使えます。計算履歴に上限はありません。ノート・定数・自作単位はファイルに書き出して、別の端末で復元できます。
UnitCalc Pro は一度だけの買い切りで、月々の支払いはありません。広告が消え、履歴をCSVで書き出せ、よく使う単位のセットを保存でき、ノートを印刷・PDF保存できる文書として共有できます。

アカウント登録は不要です。計算・ノート・自作単位は端末の中に残ります。
```

### Español（3,830字）

```
UnitCalc es una calculadora con unidades construida sobre una idea sencilla: se calcula con las unidades, no solo con los números.

Escribes las unidades junto a los valores. Antes de operar, UnitCalc lleva cada magnitud a una base común y comprueba las dimensiones, así que una longitud nunca se suma por descuido a una masa. El resultado vuelve en la unidad que escribiría una persona, y no como un montón de unidades básicas del SI.

(500m + 1km) ÷ 1min da 25 m/s, y con un toque pasa a 90 km/h.
1kΩ × 1mA da 1 V.
470µF × 12V da 5,64 mC.
2kg × 9.8m/s² da 19,6 N, no 19,6 m·kg/s².

PARA QUIÉN ES
Para la física de la EBAU, donde un error u omisión de unidades resta 0,25 puntos por apartado, también en los resultados intermedios. Las unidades no son decoración: son parte de la respuesta, y UnitCalc te acostumbra a llevarlas hasta el final. Para el informe de laboratorio, donde un factor 1000 se esconde en un cambio de unidades. Para la FP de Instalaciones Eléctricas y Automáticas, donde la caída de voltaje y la sección del cable tienen que salir bien. En el examen solo entra la calculadora permitida, así que UnitCalc es para estudiar, para los ejercicios y para los informes: ahí es donde se forma el hábito.

VES EL ERROR MIENTRAS ESCRIBES
La vista previa bajo el campo se colorea sobre la marcha: unidades en azul, constantes guardadas en amarillo y subrayado en rojo lo que no es una unidad reconocida. Pulsa el rojo y te propone correcciones. Escribe 3m + 2kg y la tarjeta de resultado te dice, antes de pulsar igual, que una longitud y una masa no se pueden sumar.

CIFRAS SIGNIFICATIVAS LEÍDAS DE LO QUE ESCRIBES
12V / 4.7kΩ da 2,553191489 mA, pero solo escribiste dos cifras significativas. Elige A, pulsa el chip 10ⁿ y el resultado pasa a 2,6 × 10⁻³ A, con el valor sin redondear y el número de cifras justo debajo. Cuando la precisión no se puede leer con honestidad, como en una suma del tipo 5cm + 1mm, no se redondea nada.

VARIAS FORMAS DE LEER UN RESULTADO
• Valor exacto: 1/3 sigue siendo 1/3, 2*pi*50 pasa a 100π, sqrt(8) a 2√2, como fracciones y radicales de verdad.
• El mismo resultado en todas las unidades compatibles, en una tabla bajo la tarjeta.
• Teclas de prefijo (p n µ m c k M G) para escribir MΩ o nF sin el teclado del sistema.

TUS UNIDADES Y TUS CONSTANTES
Define una unidad como múltiplo (shaku = 0.303m) o mediante una fórmula, lo que cubre también escalas desplazadas como las de temperatura. Guarda constantes como W = 3cm y reutilízalas en cualquier expresión posterior.

CUADERNOS QUE CALCULAN DE VERDAD
Nueve bibliotecas de cálculos paso a paso, con fórmulas compuestas de verdad y el resultado de cada paso a la vista:
• Ciencias naturales, y Física (bachillerato)
• Estequiometría química, y Astronomía y espacio
• Electricidad y energía: caída de voltaje y sección de cable necesaria, relación de transformación, rendimiento y corriente de un motor, electrónica, solar
• Aficiones y creación
• Hogar y vida diaria
• Física de los vehículos
• Diseño mecánico y estructural: esfuerzo y deformación, vigas y columnas, ejes, elementos de máquinas
Cada cuaderno recuerda los últimos valores que pusiste, y los que dependen de dónde vives se abren con el voltaje de la red, la corriente del disyuntor y los precios de electricidad y combustible de tu región.

GRATIS, CON UNA COMPRA PRO ÚNICA
Todas las funciones de cálculo son gratuitas y el historial es ilimitado. Cuadernos, constantes y unidades propias se guardan en un archivo y se restauran en otro dispositivo.
UnitCalc Pro se compra una sola vez, sin cargos periódicos. Quita la publicidad, exporta el historial en CSV, guarda tus juegos de unidades y comparte un cuaderno como documento maquetado para imprimir o guardar en PDF.

Sin cuenta que crear. Tus cálculos, tus cuadernos y tus unidades se quedan en el dispositivo.
```

### Español (Latinoamérica)（3,908字）

```
UnitCalc es una calculadora con unidades construida sobre una idea sencilla: se calcula con las unidades, no solo con los números.

Escribes las unidades junto a los valores. Antes de operar, UnitCalc lleva cada magnitud a una base común y comprueba las dimensiones, así que una longitud nunca se suma por descuido a una masa. El resultado vuelve en la unidad que escribiría una persona, y no como un montón de unidades básicas del SI.

(500m + 1km) ÷ 1min da 25 m/s, y con un toque pasa a 90 km/h.
1kΩ × 1mA da 1 V.
470µF × 12V da 5,64 mC.
2kg × 9.8m/s² da 19,6 N, no 19,6 m·kg/s².

PARA QUIÉN ES
Para repasar física de cara al Saber 11, la PAES, el EXANI-II o el examen de admisión, donde los problemas se caen por la conversión que quedó a medias o el prefijo que no se canceló. Para el informe de laboratorio, donde las unidades y las cifras significativas son parte de la nota. Para quien estudia electricidad con el RETIE y la NTC 2050, la NOM-001-SEDE o la AEA 90364, donde la caída de voltaje y la sección del conductor tienen que salir bien. En el examen solo entra la calculadora permitida, así que UnitCalc es para estudiar, para los ejercicios y para los informes: ahí es donde se forma el hábito.

VES EL ERROR MIENTRAS ESCRIBES
La vista previa bajo el campo se colorea sobre la marcha: unidades en azul, constantes guardadas en amarillo y subrayado en rojo lo que no es una unidad reconocida. Toca el rojo y te propone correcciones. Escribe 3m + 2kg y la tarjeta de resultado te dice, antes de tocar igual, que una longitud y una masa no se pueden sumar.

CIFRAS SIGNIFICATIVAS LEÍDAS DE LO QUE ESCRIBES
12V / 4.7kΩ da 2,553191489 mA, pero solo escribiste dos cifras significativas. Elige A, toca el chip 10ⁿ y el resultado pasa a 2,6 × 10⁻³ A, con el valor sin redondear y el número de cifras justo debajo. Cuando la precisión no se puede leer con honestidad, como en una suma del tipo 5cm + 1mm, no se redondea nada.

VARIAS FORMAS DE LEER UN RESULTADO
• Valor exacto: 1/3 sigue siendo 1/3, 2*pi*50 pasa a 100π, sqrt(8) a 2√2, como fracciones y radicales de verdad.
• El mismo resultado en todas las unidades compatibles, en una tabla bajo la tarjeta.
• Teclas de prefijo (p n µ m c k M G) para escribir MΩ o nF sin el teclado del sistema.

TUS UNIDADES Y TUS CONSTANTES
Define una unidad como múltiplo (shaku = 0.303m) o mediante una fórmula, lo que cubre también escalas desplazadas como las de temperatura. Guarda constantes como W = 3cm y reutilízalas en cualquier expresión posterior.

CUADERNOS QUE CALCULAN DE VERDAD
Nueve bibliotecas de cálculos paso a paso, con fórmulas compuestas de verdad y el resultado de cada paso a la vista:
• Ciencias naturales, y Física (bachillerato)
• Estequiometría química, y Astronomía y espacio
• Electricidad y energía: caída de voltaje y sección de cable necesaria, relación de transformación, rendimiento y corriente de un motor, electrónica, solar
• Aficiones y creación
• Hogar y vida diaria
• Física de los vehículos
• Diseño mecánico y estructural: esfuerzo y deformación, vigas y columnas, ejes, elementos de máquinas
Cada cuaderno recuerda los últimos valores que pusiste, y los que dependen de dónde vives se abren con los valores de tu país: 127 V en México, 120 V en Colombia, 230 V en Argentina o Chile, con la corriente nominal del interruptor, los precios de electricidad y combustible y el rendimiento en km/L.

GRATIS, CON UNA COMPRA PRO ÚNICA
Todas las funciones de cálculo son gratuitas y el historial es ilimitado. Cuadernos, constantes y unidades propias se guardan en un archivo y se restauran en otro dispositivo.
UnitCalc Pro se compra una sola vez, sin cargos periódicos. Quita la publicidad, exporta el historial en CSV, guarda tus juegos de unidades y comparte un cuaderno como documento maquetado para imprimir o guardar en PDF.

Sin cuenta que crear. Tus cálculos, tus cuadernos y tus unidades se quedan en el dispositivo.
```

### Português (Brasil)（3,710字）

```
O UnitCalc é uma calculadora de unidades construída sobre uma ideia simples: a conta é feita com as unidades, não só com os números.

Você digita as unidades junto com os valores. Antes de qualquer operação, o UnitCalc leva cada grandeza a uma base comum e confere as dimensões, então um comprimento nunca é somado a uma massa por descuido. O resultado volta na unidade que uma pessoa escreveria, e não como um amontoado de unidades básicas do SI.

(500m + 1km) ÷ 1min dá 25 m/s, e um toque transforma em 90 km/h.
1kΩ × 1mA dá 1 V.
470µF × 12V dá 5,64 mC.
2kg × 9.8m/s² dá 19,6 N, e não 19,6 m·kg/s².

PARA QUEM É
Para quem estuda física para o ENEM e os vestibulares, onde a questão se perde na conversão que ficou pela metade ou no prefixo que não foi cancelado. Para o relatório de laboratório, onde unidades e algarismos significativos fazem parte da nota. Para quem faz NR-10 ou o técnico em eletrotécnica e precisa que queda de tensão e seção de cabo saiam certas. Na prova só entra a calculadora permitida, então o UnitCalc é para o estudo, os exercícios e os relatórios: é ali que o hábito de carregar as unidades se forma.

VOCÊ VÊ O ERRO ENQUANTO DIGITA
A prévia embaixo do campo vai ganhando cor: unidades em azul, constantes salvas em amarelo e sublinhado em vermelho o que não é uma unidade reconhecida. Toque no vermelho e ele sugere correções. Digite 3m + 2kg e o cartão de resultado avisa, antes de apertar igual, que um comprimento e uma massa não podem ser somados.

ALGARISMOS SIGNIFICATIVOS LIDOS DO QUE VOCÊ DIGITOU
12V / 4.7kΩ dá 2,553191489 mA, mas você digitou só dois algarismos significativos. Escolha A, toque no chip 10ⁿ e o resultado vira 2,6 × 10⁻³ A, com o valor sem arredondar e a quantidade de algarismos logo abaixo. Quando a precisão não dá para ler com honestidade, como numa soma do tipo 5cm + 1mm, ele não arredonda nada.

MAIS DE UM JEITO DE LER UM RESULTADO
• Valor exato: 1/3 continua 1/3, 2*pi*50 vira 100π, sqrt(8) vira 2√2, como frações e radicais de verdade.
• O mesmo resultado em todas as unidades compatíveis, numa tabela embaixo do cartão.
• Teclas de prefixo (p n µ m c k M G) para digitar MΩ ou nF sem o teclado do sistema.

SUAS UNIDADES E SUAS CONSTANTES
Defina uma unidade como múltiplo (shaku = 0.303m) ou por uma fórmula, o que cobre também escalas deslocadas como as de temperatura. Salve constantes como W = 3cm e use de novo em qualquer expressão.

CADERNOS QUE CALCULAM DE VERDADE
Nove bibliotecas de cálculos prontos, passo a passo, com fórmulas compostas de verdade e o resultado de cada passo à vista:
• Ciências, e Física (Ensino Médio)
• Estequiometria química, e Astronomia e espaço
• Eletricidade e energia: queda de tensão e a seção de cabo necessária, relação de espiras do transformador, rendimento e corrente de um motor, eletrônica, solar
• Hobbies e criação
• Casa e dia a dia
• Física dos veículos
• Projeto mecânico e estrutural: tensão e deformação, vigas e colunas, eixos, elementos de máquinas
Cada caderno lembra os últimos valores que você colocou, e os que dependem de onde você mora abrem com a tensão da rede, a corrente do disjuntor e os preços de energia e combustível da sua região.

GRÁTIS, E O PRO É COMPRA ÚNICA
Todas as funções de cálculo são gratuitas e o histórico é ilimitado. Cadernos, constantes e unidades próprias podem ser salvos num arquivo e restaurados em outro aparelho.
Se os anúncios incomodarem, o UnitCalc Pro é uma compra única, sem cobrança mensal. Ele tira os anúncios, exporta o histórico em CSV, salva seus conjuntos de unidades e compartilha um caderno como documento diagramado para imprimir ou guardar em PDF.

Sem conta para criar. Seus cálculos, seus cadernos e suas unidades ficam no aparelho.
```

### Deutsch（3,861字）

```
UnitCalc ist ein Einheitenrechner mit einem einfachen Grundsatz: Gerechnet wird mit den Einheiten, nicht nur mit den Zahlen.

Du tippst die Einheiten mit den Werten ein. Vor dem Rechnen bringt UnitCalc alles auf eine gemeinsame Basis und prüft die Dimensionen. Eine Länge lässt sich also nicht versehentlich zu einer Masse addieren. Das Ergebnis kommt in der Einheit zurück, die ein Mensch hinschreiben würde, und nicht als Haufen von SI-Basiseinheiten.

(500m + 1km) ÷ 1min ergibt 25 m/s, ein Tipp macht daraus 90 km/h.
1kΩ × 1mA ergibt 1 V.
470µF × 12V ergibt 5,64 mC.
2kg × 9.8m/s² ergibt 19,6 N und nicht 19,6 m·kg/s².

FÜR WEN
Für die Ausbildung zum Elektroniker, für die Vorbereitung auf Techniker und Meister, für Physik- und Chemieklausuren bis zum Abitur. Genau dort gehen die Punkte verloren: bei Zehnerpotenzen und Vorsatzzeichen, und eine falsche Einheit ist kein Schönheitsfehler, sondern Punktabzug. UnitCalc rechnet die Vorsatzzeichen mit und zeigt das Ergebnis mit dem passenden. In die Prüfung darf nur der zugelassene Taschenrechner, deshalb gehört UnitCalc ins Lernen, in die Hausaufgabe und ins Protokoll, wo die Gewohnheit entsteht, Einheiten mitzuführen.

FEHLER SIEHST DU BEIM TIPPEN
Die Vorschau unter der Eingabe färbt sich beim Tippen: Einheiten blau, gespeicherte Konstanten gelb, alles, was keine bekannte Einheit ist, rot unterstrichen. Tippe auf das Rote und du bekommst Korrekturvorschläge. Bei 3m + 2kg sagt dir die Ergebniskarte schon vor dem Gleichheitszeichen, dass sich Länge und Masse nicht addieren lassen.

GELTENDE ZIFFERN AUS DEINER EINGABE
12V / 4.7kΩ ergibt 2,553191489 mA, getippt hast du aber nur zwei geltende Ziffern. Wähle A und tippe auf den 10ⁿ-Chip: daraus wird 2,6 × 10⁻³ A, der ungerundete Wert bleibt mit der Ziffernzahl darunter stehen. Wo sich die Genauigkeit nicht ehrlich ablesen lässt, etwa bei einer Summe wie 5cm + 1mm, wird gar nicht gerundet.

MEHRERE ARTEN, EIN ERGEBNIS ZU LESEN
• Exakt statt gerundet: 1/3 bleibt 1/3, aus 2*pi*50 wird 100π, aus sqrt(8) wird 2√2, als echte Brüche und Wurzeln.
• Dasselbe Ergebnis in allen passenden Einheiten, als Tabelle unter der Karte.
• Vorsatztasten (p n µ m c k M G), damit MΩ und nF ohne Systemtastatur gehen.

EIGENE EINHEITEN UND KONSTANTEN
Lege eine Einheit als Vielfaches an (shaku = 0.303m) oder als Formel, womit auch Temperaturskalen mit verschobenem Nullpunkt gehen. Speichere Konstanten wie W = 3cm und nutze sie in späteren Ausdrücken. PS ist die metrische Pferdestärke mit 735,5 W, eine eigene Einheit neben dem englischen hp mit 745,7 W.

RECHENHEFTE, DIE WIRKLICH RECHNEN
Neun Sammlungen fertiger Rechnungen mit echtem Formelsatz, bei denen jeder Schritt sein eigenes Ergebnis zeigt:
• Naturwissenschaften und Physik (Oberstufe)
• Stöchiometrie sowie Astronomie & Weltraum
• Elektrizität & Energie: Spannungsfall und der nötige Leiterquerschnitt, Übersetzungsverhältnis des Transformators, Wirkungsgrad und Strom eines Motors, Elektronik, Solar
• Hobby & Selbermachen
• Haushalt & Alltag
• Physik von Autos & Fahrrädern
• Maschinen- & Tragwerksentwurf: Spannung und Dehnung, Balken und Stützen, Wellen, Maschinenelemente
Jedes Rechenheft merkt sich deine letzten Werte, und die, deren Ergebnis vom Wohnort abhängt, starten mit Netzspannung, Nennstrom sowie Strom- und Kraftstoffpreis deiner Region.

KOSTENLOS, MIT EINMALIGEM PRO-KAUF
Alle Rechenfunktionen sind kostenlos, der Verlauf ist unbegrenzt. Rechenhefte, Konstanten und eigene Einheiten lassen sich als Datei sichern und auf einem anderen Gerät wiederherstellen.
UnitCalc Pro kaufst du einmal, ohne laufende Kosten. Es entfernt die Werbung, exportiert den Verlauf als CSV, speichert eigene Einheitensätze und teilt ein Rechenheft als gesetztes Dokument zum Drucken oder als PDF.

Ein Konto brauchst du nicht. Deine Rechnungen, Rechenhefte und eigenen Einheiten bleiben auf dem Gerät.
```

### Français（3,963字）

```
UnitCalc est une calculatrice et un convertisseur d'unités construits sur un principe simple : on calcule avec les unités, pas seulement avec les nombres.

Vous tapez les unités avec les valeurs. Avant tout calcul, UnitCalc ramène chaque grandeur à une base commune et vérifie les dimensions : une longueur ne s'additionne jamais par mégarde à une masse. Le résultat revient dans l'unité qu'une personne écrirait, et non comme un empilement d'unités SI de base.

(500m + 1km) ÷ 1min donne 25 m/s, et une touche le convertit en 90 km/h.
1kΩ × 1mA donne 1 V.
470µF × 12V donne 5,64 mC.
2kg × 9.8m/s² donne 19,6 N, et non 19,6 m·kg/s².

POUR QUI
Pour la physique-chimie au lycée, puis en prépa ou en BTS. La consigne y est toujours la même : garder l'unité à chaque étape, pour que l'erreur se voie quand les unités ne se simplifient pas. C'est exactement ce que fait UnitCalc : plus de concentration mille fois trop grande parce que des mL sont restés des mL. Pour le Bac Pro MELEC et le BTS électrotechnique, où la chute de tension et la section de câble doivent tomber juste. En examen, seule la calculatrice autorisée entre : UnitCalc sert pour les exercices, les devoirs et les comptes rendus, là où l'habitude des unités se construit.

VOUS VOYEZ L'ERREUR EN TAPANT
L'aperçu sous la saisie se colore au fur et à mesure : unités en bleu, constantes en jaune, et souligné en rouge tout ce qui n'est pas une unité reconnue. Touchez le rouge, des corrections sont proposées. Tapez 3m + 2kg et la carte de résultat vous dit, avant d'appuyer sur égal, qu'une longueur et une masse ne s'additionnent pas.

LES CHIFFRES SIGNIFICATIFS, LUS DANS VOTRE SAISIE
12V / 4.7kΩ donne 2,553191489 mA, mais vous n'avez tapé que deux chiffres significatifs. Choisissez A, touchez la pastille 10ⁿ et le résultat devient 2,6 × 10⁻³ A, la valeur non arrondie et le nombre de chiffres restant affichés dessous. Quand la précision ne se lit pas honnêtement dans la saisie, comme dans une somme telle que 5cm + 1mm, il n'y a pas d'arrondi du tout.

PLUSIEURS FAÇONS DE LIRE UN RÉSULTAT
• Valeur exacte : 1/3 reste 1/3, 2*pi*50 devient 100π, sqrt(8) devient 2√2, en vraies fractions et vrais radicaux.
• Le même résultat dans toutes les unités compatibles, dans un tableau sous la carte.
• Des touches de préfixes (p n µ m c k M G) pour taper MΩ ou nF sans le clavier du système.

VOS UNITÉS ET VOS CONSTANTES
Définissez une unité comme un multiple (shaku = 0.303m) ou par une formule, ce qui couvre aussi les échelles décalées comme les températures. Enregistrez des constantes comme W = 3cm et réutilisez-les. Le CV (cheval-vapeur, 735,5 W) est une unité à part du hp anglais (745,7 W).

DES CARNETS QUI CALCULENT VRAIMENT
Neuf bibliothèques de calculs pas à pas, chaque étape affichant son propre résultat :
• Sciences, et Physique (lycée)
• Stœchiométrie, et Astronomie et espace
• Électricité et énergie : chute de tension et section de câble nécessaire, rapport de transformation, rendement et courant d'un moteur, électronique, solaire
• Loisirs et fabrication
• Maison et vie quotidienne
• Physique des voitures et vélos
• Conception mécanique et structurale : contraintes et déformations, poutres et poteaux, arbres, éléments de machines
Chaque carnet retient vos dernières valeurs, et ceux dont le résultat dépend du pays s'ouvrent avec la tension du secteur, le calibre du disjoncteur et les prix de l'électricité et du carburant de votre région.

GRATUIT, AVEC UN ACHAT PRO UNIQUE
Toutes les fonctions de calcul sont gratuites et l'historique est illimité. Carnets, constantes et unités se sauvegardent dans un fichier et se restaurent sur un autre appareil.
UnitCalc Pro s'achète une seule fois, sans frais récurrents. Il retire la publicité, exporte l'historique en CSV, enregistre vos jeux d'unités et partage un carnet sous forme de document mis en page, à imprimer ou à garder en PDF.

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
- 厳密値表示の呼称は、アプリのチップ文言（`Exact` / `分数・π` / `Exacto` / `Exato` / `Exakt` / `Exact`）に合わせる。日本語だけチップが「分数・π」なので、掲載文では「厳密値（分数・π）」と併記している。
- 9つの最上位カテゴリとサブカテゴリの名称は、`lib/notebook-formulas/source/categories.ts` の `label`（6言語分）をそのまま引き写した。掲載文で独自訳を作ると、ストアで見た名前がアプリ内に存在しないことになる。
- 電圧の訳は西語のみ `voltaje`（`tensión` は「応力」とも訳語衝突するため、アプリ本体でも `voltaje` を採用済み）。独語 `Netzspannung`・仏語 `tension du secteur` は複合語・限定句で曖昧さが無いのでそのまま。
- 独語名詞は常に大文字化（`Rechenheft`、`Einheiten`、`Formeln` など）。
- 数字の小数点は、地の文（散文）中では各言語の慣習に合わせてコンマ（`0,01 m²`）。ただし英語のみASCIIドット。
- 「自作単位」の訳（`unidades personalizadas` / `eigene Einheiten` / `unités personnalisées`）は `app/(tabs)/settings.tsx` の実装済みUI文言（`lib/global-settings.tsx`の`customUnits`キー）に合わせた。
- 短い説明・詳しい説明とも、Pro特典の呼称は`app/(tabs)/pro.tsx`の`EN_COPY.features`4点（Ad-free / CSV export / My unit sets / Notebook sharing）の実際の文言に対応させてあり、憶測の機能名を使っていない。
