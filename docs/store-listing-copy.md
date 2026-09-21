# Google Play ストア掲載文（6言語）

Google Play Console の文字数上限（短い説明 80字・詳しい説明 4,000字）に収まることを確認済み。
各言語の文字数は Python の `len()`（Unicode文字数）で実測した値。訳語は `docs/i18n-glossary.md` の対訳・表記ルールに揃えてある。

**対象は Android（Google Play）のみ。** iOS向けの文言は用意しない（今回の提出スコープ外）。

**スクリーンショットとフィーチャーグラフィックは6言語すべて用意する**（`docs/screenshot-capture-plan.md` / `submission-assets/README.md`）。
以前は日英だけ撮って es/pt-BR/de/fr には英語の画像を流用していたが、**掲載文だけ言語ごとに書き分けても、
一覧に出る画像が英語のままだとその言語のユーザーには「英語のアプリ」に見える**。
画像は単に翻訳するのではなく、**言語ごとに写すノート・サンプルを変えている**
（独=Spannungsfall と Elektrotechnik & Prüfung、西=campo eléctrico と Electricidad、
葡=campo elétrico と Eletricidade、日=電圧降下と電気（電験・電工）、
英=Mechanics と Electricity & exams、仏=Mécanique と Électricité）。

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
| ja | 22 | UnitCalc - 単位付き数値 計算電卓 | 詳しい説明の主張そのもの（単位まで含めて計算する）。資格名は本文の「こんな方に」で受ける |
| es | 28 | UnitCalc - Unidades y física | EBAU の física |
| es-419 | 28 | UnitCalc - Unidades y física | 中南米向けの別掲載（本文だけ差し替え、タイトルは共通） |
| pt-BR | 28 | UnitCalc - Unidades e física | ENEM の física |
| de | 27 | UnitCalc - Einheitenrechner | ASO第一検索語 `Einheitenrechner` |
| fr | 26 | UnitCalc - Calcul d'unités | lycée の physique-chimie（第一検索語 `convertisseur d'unités` は11+22字で30字に入らない） |

**30字は「UnitCalc - 」の11字を引くと19字しか残らない。** 西語の `calculadora con unidades`（24字）と
仏語の `convertisseur d'unités`（22字）は第一検索語をタイトルに入れられないので、
**短い説明と詳しい説明の本文で受ける**（Google Play は本文の語で引くのでタイトルに無くても効く）。

**日本語の副題は2026-09-13に「電験・電工の単位計算」から「単位付き数値 計算電卓」に変えた。**
旧副題は対象を電験三種・第二種電気工事士に限定していたが、詳しい説明の「こんな方に」は
理工系1〜2年の実験レポートや機械・建築のジュニアエンジニアも並べて挙げており、**タイトルだけが資格試験に絞られたままだった**。
新しい副題は詳しい説明の冒頭の主張（単位まで含めて計算する）をそのまま名詞句にしたもので、
資格名を検索する層は本文中の `電験三種・電工二種・乙4` で拾う。ASO第一検索語 `単位変換` は本文（`330行目`）に
既に入っているので、タイトル側で担う必要はない。

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
  **物理が試験範囲に含まれることも確認済み**（2026-09-13、CodeRabbitの指摘を受けて裏取り）:
  Saber 11の`Ciencias Naturales`はbiología・química・físicaを評価（ICFES公式ガイド2026）、
  PAESの`Módulo Común`は54問中18問がFísica＋任意の`Módulo Electivo`にFísica軸もある（DEMRE公式2026）、
  EXANI-IIには力学・光学/波動/電磁気の24問からなる`Módulo de Física`専用モジュールがある（CENEVAL）。
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
- **中南米の試験名（`Saber 11`・`PAES`・`EXANI-II`）は入れてある。** この一文は2026-09-12時点の
  古い記述で、当時はまだ物理との関連を裏取りできていなかったため書いていた。**2026-09-13にCodeRabbitの
  指摘で裏取りし直し**（上の「es-419 に中南米の調査を反映した」節を参照）、3試験とも物理が試験範囲に
  含まれることを公式資料で確認できたので、実際の掲載文（`「こんな方に」`の1項目）には名指しで入れている。
- **画像は es のものを流用する**（`scripts/push-play-listing.mjs` の `IMAGE_SOURCE`）。
  アプリ自体のスペイン語は1種類なので、撮り直しても同じ絵になる。
- **かつて `14-exam-samples` のカットに「Preparación (EBAU)」が写るのが es-419 の唯一の弱点だった**が、
  2026-09-21 に旧 `exam` タブを電気へ統合した際、西語のラベルを中立な「Electricidad」にしたので解消した
  （EBAU は一般物理の試験で、電気の計算しか入っていないタブにその名前を付けていたのが元々の誤り）。

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

### 2026-09-13 にユーザー提供の日本語ベース文面へ全面的に組み直した理由

ユーザーから「これをベースに各言語作成し直して」と、次の構成の日本語文面が渡された:
宣言文（単位まで含めて計算する）→ 箇条書きの「こんな方に」（4項目）→ 単位付き式を入力するだけで
自動計算・変換はチップをタップの1文＋実例4つ（`km/h`チップの一段階を含む）→ 短いラベル見出し付きの節
（有効数字／厳密値／自分の単位と定数／計算ノート／UnitCalc Pro について）。**この構成をそのまま7掲載の型にした**
（以前の「WHO IT IS FOR」を段落で書く形から、箇条書きの「こんな方に」へ変更）。

- **「こんな方に」の4項目は、言語ごとに実在する対象へ差し替えた。** ユーザーの日本語版は
  電験三種・電工二種・乙4／実験レポート／機械・建築エンジニア／高校物理の4つだが、これをそのまま
  他言語へ逐語訳すると意味を持たない（他国に電験三種は無い）。`docs/target-users-by-locale-2026-09.md`
  第1節の各言語の主・副ターゲットに置き換えている（en: FE試験・City & Guilds 2365、de: Ausbildung
  Elektroniker・Klausur、fr: lycée・Bac Pro MELEC、es: EBAU・FP Instalaciones Eléctricas、
  es-419: Saber 11/PAES/EXANI-II・RETIE/NTC 2050 等、pt-BR: ENEM・NR-10）。
- **有効数字の実例はA単位の桁**（`0.002553191489 A` → `≈ 2.6 × 10⁻³ A`）**に統一した。**
  既定のmAのままだと`2.6 × 10⁰ mA`と指数が0になり科学表記の意味が伝わらないため（前回のコミットで判明済み）。
  値は`evaluateExpression("12V/4.7kΩ")`を`A`単位でフォーマットして実測（`0.002553191489 A`）。
- **`(500m + 1km) ÷ 1min` は25 m/sで、90 km/hはkm/hチップを押した後の値。** ユーザーの原文どおり
  「⇒25 m/s。[km/h]を押す⇒90 km/h」の2段で書き、表示単位の自動選択とチップの実際の挙動に一致させている。
- **「プリセット計算ノートの詳細」は説明文ではなく、各ジャンルの具体的な計算例だと後から指摘があり、書き直した。**
  当初は「各ノートは前回の値を覚えている・検索できる・地域で開く」という**機能説明**を追加していたが、
  ユーザーの意図は**各ジャンルにどんな計算があるかを「：」の後に具体的に列挙すること**だった。
  最上位9カテゴリ（`lib/notebook-formulas/source/categories.ts`の`science`/`high-school-physics`/
  `chemistry`/`astronomy`/`electricity-energy`/`hobbies-making`/`home-life`/`vehicles`/
  `engineering-design`）それぞれに、実在するプリセットの`title`を3〜5件ずつ挙げた
  （例: 機械・構造設計＝鋼製はりの曲げ応力とたわみ・オイラー座屈・軸のねじり応力・ボルトの締付けトルクと軸力・
  玉軸受のL10寿命）。**すべて`lib/notebook-formulas/source/*.ts`の実データから抜き出し、各言語は
  そのノートの実際の`title`翻訳をそのまま使っている**（掲載文で独自訳を作らない、という既存の方針どおり）。
  機能説明（前回値を覚える・検索・地域反映）は削らず、ジャンル別の具体例の後に短く残してある。
- **日本語は1,336字・英語は2,929字と、以前よりだいぶ短くなった。** ユーザー提供の型が簡潔だったため、
  結果として全言語とも4,000字の半分〜8割程度に収まっている。空いた分は主に「計算ノート」節の
  ジャンル別具体例に使ったが、無理に埋めていない（読みやすさを優先）。
- 7掲載すべてで、各言語のASO第一検索語が本文に残っていることを確認済み
  （`en: unit calculator` / `ja: 単位変換` / `de: Einheitenrechner` / `fr: convertisseur d'unités` /
  `es・es-419: calculadora con unidades` / `pt-BR: calculadora de unidades`）。開始文で宣言を書くと
  第一検索語がそのまま入らない言語があったため、宣言文に軽く組み込み直している
  （例: `UnitCalc ist ein Einheitenrechner: Er rechnet mit den Einheiten...`）。

### English（2,929字）

```
UnitCalc is a unit calculator that computes with the units, not just the numbers.

• For the FE exam and engineering coursework, where units are part of the answer
• For university lab reports
• For engineers checking a hand calculation
• For high school and college physics

Type an expression with units and it calculates automatically. Converting units is one tap away.

(500m + 1km) ÷ 1min ⇒ 25 m/s. Tap the km/h chip ⇒ 90 km/h.
1kΩ × 1mA ⇒ 1 V.
470µF × 12V ⇒ 5.64 mC.
2kg × 9.8m/s² ⇒ 19.6 N.

SIGNIFICANT FIGURES, READ AUTOMATICALLY FROM YOUR INPUT
12V ÷ 4.7kΩ ⇒ 0.002553191489 A. Tap the 10ⁿ chip ⇒ ≈ 2.6 × 10⁻³ A (with the unrounded value shown underneath when you only typed two digits).

EXACT VALUES (FRACTIONS, π, √)
Results can display as fractions, or as multiples of π or √, instead of decimals: 1/3 stays 1/3, 2*pi*50 becomes 100π, sqrt(8) becomes 2√2.

YOUR OWN UNITS AND CONSTANTS
Define your own units (shaku = 0.303m). Save constants like W = 3cm and use them directly in any expression.

FORMULA NOTEBOOKS
Save a formula once, then reuse it for any unit-aware calculation just by plugging in new values.
Hundreds of ready-made notebooks are already built in, across genres including:
• School science: speed and distance, floating or sinking by density, Ohm's law, reflection of light
• High school physics: uniformly accelerated motion, the equation of motion, simple harmonic motion, Coulomb's law
• Chemistry stoichiometry: molar concentration, the ideal gas law, heat of reaction, mass percent concentration
• Astronomy & space: first cosmic velocity, Kepler's third law, gravitational force, light travel time from a star
• Electricity & energy: voltage drop and the cable cross-section it needs, transformer turns ratio, motor efficiency and line current, RC time constant, solar panel sizing
• Hobbies & making: depth of field and exposure value, combining two sound sources in dB, concrete volume for a slab, filament length from model volume
• Home & everyday life: coffee brew ratio, dew point, calories burned, recipe serving size scaling
• Physics of cars & bicycles: braking distance, gear ratio and speed, fuel economy and trip cost
• Mechanical & structural design: bending stress and deflection of a steel beam, Euler buckling, torsional shear stress in a shaft, bolt tightening torque and preload, ball bearing L10 life
Each notebook remembers your last values, and you can search across every title, description and category at once. Notebooks whose answer depends on where you live open with your region's mains voltage, breaker rating, and electricity and fuel prices.

ABOUT UNITCALC PRO
Every calculation feature and every notebook is free.
UnitCalc Pro is a one-time purchase that removes ads, exports your history as CSV, saves your own unit sets, and lets you save or share a notebook as a PDF.

No account to create. Your calculations, notebooks and custom units stay on your device.
```

### 日本語（1,285字）

```
UnitCalc は、数字だけでなく単位を含めて計算できる電卓です。

・電験三種・第二種電気工事士・危険物乙4の勉強中の検算に
・理工系の実験レポートに
・機械・建築のエンジニアの、手計算の確認に
・高校物理の計算に

数値に単位をつけた式を入力するだけで自動計算します。単位変換も、チップをタップするだけです。

「(500m + 1km) ÷ 1min」⇒「25 m/s」。[km/h]チップを押すと⇒「90 km/h」
「1kΩ × 1mA」⇒「1 V」
「470µF × 12V」⇒「5.64 mC」
「2kg × 9.8m/s²」⇒「19.6 N」

有効数字も、入力式から自動判定
「12V ÷ 4.7kΩ」⇒「0.002553191489 A」 [10ⁿ]チップを押すと⇒「≈ 2.6 × 10⁻³ A」（丸める前の値も小さく表示されます）。

厳密値（分数・π・√）
結果を、小数ではなく分数やπ・√の形でも表示できます。1/3 は 1/3 のまま、2*pi*50 は 100π、sqrt(8) は 2√2 になります。

自分の単位と定数
独自の単位も登録できます（shaku = 0.303m）。W = 3cm のように任意の定数も保存でき、式の中でそのまま使えます。

計算ノート
数式を1つ登録しておけば、値を入れ替えるだけで複雑な単位付き計算をいつでも再利用できます。
すぐ使えるプリセットの計算ノートを、以下のジャンルにわたって多数収録しています。
・理科（小・中）：速さ・道のりの計算、密度で浮き沈みを判断、オームの法則、光の反射
・高校物理：等加速度運動、運動方程式、単振動の周期、クーロンの法則
・化学の量的関係：モル濃度、気体の状態方程式、反応熱、質量パーセント濃度
・天体・宇宙：第一宇宙速度、ケプラーの第三法則、万有引力、恒星までの光の到達時間
・電気・エネルギー：電圧降下と必要な電線の太さ、変圧器の巻数比、モーターの効率・損失・線電流、RC時定数と充電時間、太陽光パネルの容量
・趣味・ものづくり：被写界深度と露出値、音圧レベルの合成、コンクリート土間の体積、フィラメント長の見積もり
・暮らし：コーヒーの抽出比率、露点温度、消費カロリー、レシピの人数スケール変換
・車・自転車の物理：制動距離、ギア比と速度、燃費と走行コスト
・機械・構造設計：鋼製はりの曲げ応力とたわみ、オイラー座屈、軸のねじり応力、ボルトの締付けトルクと軸力、玉軸受のL10寿命
各ノートは前回入れた値を覚えていて、タイトル・説明・カテゴリを横断して検索できます。住んでいる地域で答えが変わるノート（電源電圧、ブレーカーの定格、電気代と燃料の単価など）は、お住まいの地域の値で開きます。

UnitCalc Pro について
計算機能・計算ノートはすべて無料で使えます。
UnitCalc Pro（買い切り）を購入すると、広告が非表示になり、履歴をCSVで書き出せ、よく使う単位のセットを保存でき、ノートをPDFとして保存・共有できるようになります。

```

### Español（3,213字）

```
UnitCalc es una calculadora con unidades: calcula con las unidades, no solo con los números.

• Para la física de la EBAU
• Para la FP de Instalaciones Eléctricas y Automáticas
• Para el informe de laboratorio
• Para comprobar un cálculo a mano (ingenieros)

Escribes una expresión con sus unidades y se calcula automáticamente. Convertir de unidad es un toque.

(500m + 1km) ÷ 1min ⇒ 25 m/s. Pulsa el chip km/h ⇒ 90 km/h.
1kΩ × 1mA ⇒ 1 V.
470µF × 12V ⇒ 5,64 mC.
2kg × 9.8m/s² ⇒ 19,6 N.

CIFRAS SIGNIFICATIVAS, LEÍDAS AUTOMÁTICAMENTE DE TU ENTRADA
12V ÷ 4.7kΩ ⇒ 0,002553191489 A. Pulsa el chip 10ⁿ ⇒ ≈ 2,6 × 10⁻³ A (el valor sin redondear queda debajo si solo escribiste dos cifras).

VALORES EXACTOS (FRACCIONES, π, √)
Un resultado puede mostrarse como fracción, o como múltiplo de π o de √, en lugar de decimal: 1/3 sigue siendo 1/3, 2*pi*50 pasa a 100π, sqrt(8) pasa a 2√2.

TUS UNIDADES Y TUS CONSTANTES
Define tus propias unidades (shaku = 0.303m). Guarda constantes como W = 3cm y reutilízalas directamente en cualquier expresión.

CUADERNOS QUE CALCULAN
Guarda una fórmula una vez y reutilízala para cualquier cálculo con unidades con solo cambiar los valores.
Ya incluye cientos de cuadernos listos para usar, en ámbitos como:
• Ciencias naturales: velocidad y distancia, flota o se hunde según la densidad, ley de Ohm, reflexión de la luz
• Física (bachillerato): movimiento uniformemente acelerado, la ecuación de movimiento, movimiento armónico simple, la ley de Coulomb
• Estequiometría química: concentración molar, la ecuación de estado del gas ideal, calor de reacción, porcentaje en masa
• Astronomía y espacio: primera velocidad cósmica, la tercera ley de Kepler, fuerza gravitacional, tiempo que tarda la luz de una estrella
• Electricidad y energía: caída de voltaje y sección de cable necesaria, relación de transformación, rendimiento y corriente de un motor, constante de tiempo RC, tamaño del campo fotovoltaico
• Aficiones y creación: profundidad de campo y valor de exposición, suma de niveles de dos fuentes sonoras, volumen de hormigón para una losa, longitud de filamento según el volumen de la pieza
• Hogar y vida diaria: ratio de extracción del café, punto de rocío, calorías quemadas, escalado de una receta
• Física de los vehículos: distancia de frenado, relación de transmisión y velocidad, consumo de combustible y costo del trayecto
• Diseño mecánico y estructural: esfuerzo de flexión y flecha de una viga de acero, pandeo de Euler, esfuerzo cortante por torsión de un eje, par de apriete y precarga de un perno, vida L10 de un rodamiento de bolas
Cada cuaderno recuerda tus últimos valores, y puedes buscar a la vez por título, descripción o categoría. Los cuadernos cuyo resultado depende de dónde vives se abren con el voltaje de la red, la corriente del disyuntor y los precios de electricidad y combustible de tu región.

SOBRE UNITCALC PRO
Todas las funciones de cálculo y todos los cuadernos son gratuitos.
UnitCalc Pro se compra una sola vez. Quita la publicidad, exporta el historial en CSV, guarda tus juegos de unidades y te deja guardar o compartir un cuaderno en PDF.

Sin cuenta que crear. Tus cálculos, tus cuadernos y tus unidades se quedan en el dispositivo.
```

### Español (Latinoamérica)（3,379字）

```
UnitCalc es una calculadora con unidades: calcula con las unidades, no solo con los números.

• Para repasar física del Saber 11, la PAES, el EXANI-II o el examen de admisión
• Para electricidad con el RETIE y la NTC 2050, la NOM-001-SEDE o la AEA 90364
• Para el informe de laboratorio
• Para comprobar un cálculo a mano (ingenieros)

Escribes una expresión con sus unidades y se calcula automáticamente. Convertir de unidad es un toque.

(500m + 1km) ÷ 1min ⇒ 25 m/s. Toca el chip km/h ⇒ 90 km/h.
1kΩ × 1mA ⇒ 1 V.
470µF × 12V ⇒ 5,64 mC.
2kg × 9.8m/s² ⇒ 19,6 N.

CIFRAS SIGNIFICATIVAS, LEÍDAS AUTOMÁTICAMENTE DE TU ENTRADA
12V ÷ 4.7kΩ ⇒ 0,002553191489 A. Toca el chip 10ⁿ ⇒ ≈ 2,6 × 10⁻³ A (el valor sin redondear queda debajo si solo escribiste dos cifras).

VALORES EXACTOS (FRACCIONES, π, √)
Un resultado puede mostrarse como fracción, o como múltiplo de π o de √, en lugar de decimal: 1/3 sigue siendo 1/3, 2*pi*50 pasa a 100π, sqrt(8) pasa a 2√2.

TUS UNIDADES Y TUS CONSTANTES
Define tus propias unidades (shaku = 0.303m). Guarda constantes como W = 3cm y reutilízalas directamente en cualquier expresión.

CUADERNOS QUE CALCULAN
Guarda una fórmula una vez y reutilízala para cualquier cálculo con unidades con solo cambiar los valores.
Ya incluye cientos de cuadernos listos para usar, en ámbitos como:
• Ciencias naturales: velocidad y distancia, flota o se hunde según la densidad, ley de Ohm, reflexión de la luz
• Física (bachillerato): movimiento uniformemente acelerado, la ecuación de movimiento, movimiento armónico simple, la ley de Coulomb
• Estequiometría química: concentración molar, la ecuación de estado del gas ideal, calor de reacción, porcentaje en masa
• Astronomía y espacio: primera velocidad cósmica, la tercera ley de Kepler, fuerza gravitacional, tiempo que tarda la luz de una estrella
• Electricidad y energía: caída de voltaje y sección de cable necesaria, relación de transformación, rendimiento y corriente de un motor, constante de tiempo RC, tamaño del campo fotovoltaico
• Aficiones y creación: profundidad de campo y valor de exposición, suma de niveles de dos fuentes sonoras, volumen de hormigón para una losa, longitud de filamento según el volumen de la pieza
• Hogar y vida diaria: ratio de extracción del café, punto de rocío, calorías quemadas, escalado de una receta
• Física de los vehículos: distancia de frenado, relación de transmisión y velocidad, consumo de combustible y costo del trayecto
• Diseño mecánico y estructural: esfuerzo de flexión y flecha de una viga de acero, pandeo de Euler, esfuerzo cortante por torsión de un eje, par de apriete y precarga de un perno, vida L10 de un rodamiento de bolas
Cada cuaderno recuerda tus últimos valores, y puedes buscar a la vez por título, descripción o categoría. Los cuadernos cuyo resultado depende de dónde vives se abren con los valores de tu país: 127 V en México, 120 V en Colombia, 230 V en Argentina o Chile, con la corriente nominal del interruptor, los precios de electricidad y combustible y el rendimiento en km/L.

SOBRE UNITCALC PRO
Todas las funciones de cálculo y todos los cuadernos son gratuitos.
UnitCalc Pro se compra una sola vez. Quita la publicidad, exporta el historial en CSV, guarda tus juegos de unidades y te deja guardar o compartir un cuaderno en PDF.

Sin cuenta que crear. Tus cálculos, tus cuadernos y tus unidades se quedan en el dispositivo.
```

### Português (Brasil)（3,199字）

```
O UnitCalc é uma calculadora de unidades: calcula com as unidades, não só com os números.

• Para física do ENEM e dos vestibulares
• Para NR-10 e o técnico em eletrotécnica
• Para o relatório de laboratório
• Para conferir uma conta feita à mão (engenheiros)

Você digita uma expressão com as unidades e o cálculo é automático. Converter de unidade é um toque.

(500m + 1km) ÷ 1min ⇒ 25 m/s. Toque no chip km/h ⇒ 90 km/h.
1kΩ × 1mA ⇒ 1 V.
470µF × 12V ⇒ 5,64 mC.
2kg × 9.8m/s² ⇒ 19,6 N.

ALGARISMOS SIGNIFICATIVOS, LIDOS AUTOMATICAMENTE DO QUE VOCÊ DIGITA
12V ÷ 4.7kΩ ⇒ 0,002553191489 A. Toque no chip 10ⁿ ⇒ ≈ 2,6 × 10⁻³ A (o valor sem arredondar fica logo abaixo quando você digita só dois algarismos).

VALORES EXATOS (FRAÇÕES, π, √)
Um resultado pode aparecer como fração, ou como múltiplo de π ou de √, em vez de decimal: 1/3 continua 1/3, 2*pi*50 vira 100π, sqrt(8) vira 2√2.

SUAS UNIDADES E SUAS CONSTANTES
Defina suas próprias unidades (shaku = 0.303m). Salve constantes como W = 3cm e use de novo em qualquer expressão.

CADERNOS QUE CALCULAM
Salve uma fórmula uma vez e reutilize para qualquer conta com unidades só trocando os valores.
Já vêm centenas de cadernos prontos, em áreas como:
• Ciências: velocidade e distância, flutua ou afunda de acordo com a densidade, lei de Ohm, reflexão da luz
• Física (Ensino Médio): movimento uniformemente acelerado, a equação de movimento, movimento harmônico simples, a lei de Coulomb
• Estequiometria química: concentração molar, a equação de estado dos gases ideais, calor de reação, concentração em porcentagem de massa
• Astronomia e espaço: primeira velocidade cósmica, a terceira lei de Kepler, força gravitacional, tempo que a luz de uma estrela leva para chegar
• Eletricidade e energia: queda de tensão e a seção de cabo necessária, relação de espiras do transformador, rendimento e corrente de um motor, constante de tempo RC, tamanho do arranjo fotovoltaico
• Hobbies e criação: profundidade de campo e valor de exposição, soma de níveis de duas fontes sonoras, volume de concreto para uma laje, comprimento de filamento a partir do volume da peça
• Casa e dia a dia: proporção café-água, ponto de orvalho, calorias queimadas, ajuste de receita por porções
• Física dos veículos: distância de frenagem, relação de transmissão e velocidade, consumo de combustível e custo do trajeto
• Projeto mecânico e estrutural: tensão de flexão e flecha de uma viga de aço, flambagem de Euler, tensão de cisalhamento por torção de um eixo, torque de aperto e pré-carga de um parafuso, vida L10 de um rolamento de esferas
Cada caderno lembra os últimos valores que você colocou, e você pode buscar por título, descrição ou categoria ao mesmo tempo. Os cadernos cujo resultado depende de onde você mora abrem com a tensão da rede, a corrente do disjuntor e os preços de energia e combustível da sua região.

SOBRE O UNITCALC PRO
Todas as funções de cálculo e todos os cadernos são gratuitos.
O UnitCalc Pro é uma compra única. Ele tira os anúncios, exporta o histórico em CSV, salva seus conjuntos de unidades e deixa você salvar ou compartilhar um caderno em PDF.

Sem conta para criar. Seus cálculos, seus cadernos e suas unidades ficam no aparelho.
```

### Deutsch（3,227字）

```
UnitCalc ist ein Einheitenrechner: Er rechnet mit den Einheiten, nicht nur mit den Zahlen.

• Für die Ausbildung zum Elektroniker und die Techniker- oder Meisterprüfung
• Für Physik- und Chemieklausuren bis zum Abitur
• Für Laborberichte im Studium
• Für Ingenieure, die eine Handrechnung gegenprüfen

Du tippst einen Ausdruck mit Einheiten ein, und er wird automatisch berechnet. Einheiten umrechnen geht mit einem Tipp.

(500m + 1km) ÷ 1min ⇒ 25 m/s. Ein Tipp auf den km/h-Chip ⇒ 90 km/h.
1kΩ × 1mA ⇒ 1 V.
470µF × 12V ⇒ 5,64 mC.
2kg × 9.8m/s² ⇒ 19,6 N.

GELTENDE ZIFFERN, AUTOMATISCH AUS DEINER EINGABE
12V ÷ 4.7kΩ ⇒ 0,002553191489 A. Ein Tipp auf den 10ⁿ-Chip ⇒ ≈ 2,6 × 10⁻³ A (der ungerundete Wert bleibt darunter stehen, wenn du nur zwei Ziffern getippt hast).

EXAKTE WERTE (BRÜCHE, π, √)
Ergebnisse lassen sich als Bruch oder als Vielfaches von π oder √ anzeigen, statt als Dezimalzahl: 1/3 bleibt 1/3, aus 2*pi*50 wird 100π, aus sqrt(8) wird 2√2.

EIGENE EINHEITEN UND KONSTANTEN
Lege eigene Einheiten an (shaku = 0.303m). Speichere Konstanten wie W = 3cm und nutze sie direkt in jedem Ausdruck.

RECHENHEFTE
Speichere eine Formel einmal und nutze sie danach für jede Rechnung mit Einheiten wieder, indem du nur neue Werte einträgst.
Hunderte fertige Rechenhefte sind schon enthalten, unter anderem aus diesen Bereichen:
• Naturwissenschaften: Geschwindigkeit und Strecke, Schwimmen oder Sinken nach Dichte, Ohmsches Gesetz, Lichtreflexion
• Physik (Oberstufe): gleichmäßig beschleunigte Bewegung, die Bewegungsgleichung, harmonische Schwingung, das Coulombsche Gesetz
• Stöchiometrie: Stoffmengenkonzentration, die ideale Gasgleichung, Reaktionswärme, Massenanteil
• Astronomie & Weltraum: erste kosmische Geschwindigkeit, das dritte Kepler-Gesetz, Gravitationskraft, Lichtlaufzeit von einem Stern
• Elektrizität & Energie: Spannungsfall und der nötige Leiterquerschnitt, Übersetzungsverhältnis des Transformators, Wirkungsgrad und Strom eines Motors, RC-Zeitkonstante, Größe des Solargenerators
• Hobby & Selbermachen: Schärfentiefe und Lichtwert, Pegeladdition zweier Schallquellen, Betonvolumen für eine Bodenplatte, Filamentlänge aus dem Modellvolumen
• Haushalt & Alltag: Brühverhältnis für Kaffee, Taupunkt, verbrannte Kalorien, Skalierung der Rezeptmenge
• Physik von Autos & Fahrrädern: Bremsweg, Übersetzungsverhältnis und Geschwindigkeit, Kraftstoffverbrauch und Fahrtkosten
• Maschinen- & Tragwerksentwurf: Biegespannung und Durchbiegung eines Stahlträgers, Eulersches Knicken, Torsionsspannung einer Welle, Anziehdrehmoment und Vorspannkraft einer Schraube, L10-Lebensdauer eines Kugellagers
Jedes Rechenheft merkt sich deine letzten Werte, und du kannst nach Titel, Beschreibung oder Kategorie zugleich suchen. Rechenhefte, deren Ergebnis vom Wohnort abhängt, starten mit Netzspannung, Nennstrom sowie Strom- und Kraftstoffpreis deiner Region.

ÜBER UNITCALC PRO
Alle Rechenfunktionen und alle Rechenhefte sind kostenlos.
UnitCalc Pro kaufst du einmal. Es entfernt die Werbung, exportiert den Verlauf als CSV, speichert eigene Einheitensätze und lässt dich ein Rechenheft als PDF sichern oder teilen.

Ein Konto brauchst du nicht. Deine Rechnungen, Rechenhefte und eigenen Einheiten bleiben auf dem Gerät.
```

### Français（3,412字）

```
UnitCalc est une calculatrice et un convertisseur d'unités : il calcule avec les unités, pas seulement avec les nombres.

• Pour la physique-chimie au lycée
• Pour le Bac Pro MELEC et le BTS électrotechnique
• Pour les comptes rendus de TP
• Pour vérifier un calcul à la main (ingénieurs)

Tapez une expression avec ses unités, le calcul se fait automatiquement. Convertir une unité tient en une touche.

(500m + 1km) ÷ 1min ⇒ 25 m/s. Touchez la pastille km/h ⇒ 90 km/h.
1kΩ × 1mA ⇒ 1 V.
470µF × 12V ⇒ 5,64 mC.
2kg × 9.8m/s² ⇒ 19,6 N.

LES CHIFFRES SIGNIFICATIFS, LUS AUTOMATIQUEMENT DANS VOTRE SAISIE
12V ÷ 4.7kΩ ⇒ 0,002553191489 A. Touchez la pastille 10ⁿ ⇒ ≈ 2,6 × 10⁻³ A (la valeur non arrondie reste affichée dessous si vous n'avez tapé que deux chiffres).

VALEURS EXACTES (FRACTIONS, π, √)
Un résultat peut s'afficher en fraction, ou comme un multiple de π ou de √, plutôt qu'en décimal : 1/3 reste 1/3, 2*pi*50 devient 100π, sqrt(8) devient 2√2.

VOS UNITÉS ET VOS CONSTANTES
Définissez vos propres unités (shaku = 0.303m). Enregistrez des constantes comme W = 3cm et réutilisez-les directement dans n'importe quelle expression.

DES CARNETS QUI CALCULENT
Enregistrez une formule une fois, puis réutilisez-la pour tout calcul avec unités en changeant simplement les valeurs.
Des centaines de carnets prêts à l'emploi sont déjà inclus, dans des domaines comme :
• Sciences : vitesse et distance, flotter ou couler selon la masse volumique, loi d'Ohm, réflexion de la lumière
• Physique (lycée) : mouvement uniformément accéléré, l'équation du mouvement, mouvement harmonique simple, la loi de Coulomb
• Stœchiométrie : concentration molaire, la loi des gaz parfaits, chaleur de réaction, pourcentage massique
• Astronomie et espace : première vitesse cosmique, la troisième loi de Kepler, force gravitationnelle, temps de parcours de la lumière depuis une étoile
• Électricité et énergie : chute de tension et section de câble nécessaire, rapport de transformation, rendement et courant d'un moteur, constante de temps RC, taille du champ photovoltaïque
• Loisirs et fabrication : profondeur de champ et indice de lumination, addition des niveaux de deux sources sonores, volume de béton pour une dalle, longueur de filament d'après le volume du modèle
• Maison et vie quotidienne : ratio d'extraction du café, point de rosée, calories brûlées, mise à l'échelle d'une recette
• Physique des voitures et vélos : distance de freinage, rapport de démultiplication et vitesse, consommation de carburant et coût du trajet
• Conception mécanique et structurale : contrainte de flexion et flèche d'une poutre en acier, flambement d'Euler, contrainte de torsion d'un arbre, couple de serrage et précontrainte d'un boulon, durée de vie L10 d'un roulement à billes
Chaque carnet retient vos dernières valeurs, et vous pouvez chercher dans tous les titres, descriptions et catégories à la fois. Les carnets dont le résultat dépend du pays s'ouvrent avec la tension du secteur, le calibre du disjoncteur et les prix de l'électricité et du carburant de votre région.

À PROPOS D'UNITCALC PRO
Toutes les fonctions de calcul et tous les carnets sont gratuits.
UnitCalc Pro s'achète une seule fois. Il retire la publicité, exporte l'historique en CSV, enregistre vos jeux d'unités et vous permet de garder ou partager un carnet en PDF.

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
