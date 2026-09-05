# si-unit-calculator（単位付き電卓）— セッション引き継ぎメモ

Expo/React Native製の単位計算アプリ。Shipaton 2026提出に向けて開発中。
このファイルは、別セッションに引き継ぐための知見・状況・規約をまとめたもの。

## リポジトリのワークフロー規約

- **開発ブランチ**: `claude/shipaton-2026-prep-3b0tt7` を使い続ける。
  - このブランチのPRが既にマージ済みの場合は最新mainから作り直す。ただし**作り直す前に必ず`git status --short`と`git log origin/claude/shipaton-2026-prep-3b0tt7..claude/shipaton-2026-prep-3b0tt7`でuntracked/未コミット/未pushの変更がないか確認する**（`git checkout -B`はローカルブランチの参照を丸ごと付け替えるため、未push分のコミットはこの操作でブランチから外れて辿りにくくなる）。何かあれば`git branch backup/<日付>`で退避するか`git stash -u`してから、次のコマンドで作り直す:
    `git fetch origin main && git checkout -B claude/shipaton-2026-prep-3b0tt7 origin/main`
    （マージ済み履歴の上に積み増ししない）。
- **フロー**: ブランチで作業 → コミット → push → PR作成（テンプレートなし、Summary/Test planで書く）→ **CodeRabbitの自動レビューを待つ**（このリポジトリはCodeRabbit導入済み）→ 指摘があれば修正してpush → レビューがminimal riskになったらsquash mergeでmainへ。
- PRを出したら `subscribe_pr_activity` でこのセッションを購読し、CodeRabbitのレビューコメントに対応してからマージする。ただの「レビュー中」通知では何もしない。
- コミットメッセージ・PR本文に自分のモデル名は書かない（チャット内のみでOK）。

### CodeRabbitを実際に動かすための前提（2026-09-04に判明）

- **PR作成はGitHub MCPの `create_pull_request` を使う。** そうすればPRの作者が `ohru131`（人間のアカウント）になり、**CodeRabbitの自動レビューがシート付きで走る**（#36 で確認済み。レビュー依頼のコメントを投げる必要は無い）。
  - **REST直叩き（`POST /repos/.../pulls`）だと作者が `claude[bot]` になり、自動レビューが走らない。** 2026-09-04以前はこちらの方法しか無いと誤認していて、#33〜#35 で「自動レビューが走らないので人間のアカウントから `@coderabbitai review` を投げる」という余計な手順を踏んでいた。**MCPを使えば不要。**
  - `claude[bot]` 名義になってしまった場合は、**`claude[bot]` からのコマンドは無視される**ので依頼は人間のアカウントから投げる必要がある。手動依頼は**オープンソース枠（1時間に1回）** に落ちるため待ち行列になる。
  - レート制限中の依頼は「Review triggered」と表示されたあと**数秒後に「Review rate limited」へ書き換えられる**。最初の返信だけ見て走ったと判断しないこと。
  - なお `gh pr create` はGraphQLがegressポリシーで塞がれていて動かない（`gh api` 経由の書き込みも `claude[bot]` になる）。
- **判定バッジ（Merge Risk）は古いコミット時点で凍結表示される。** `final_review_risk_coverage` の `coveredCommitId` が現在のheadと一致しているかを毎回確認する（実際に #34 で、修正済みなのに「🟡 Moderate・マージ前に解決すべき」と出続けた）。

## アーキテクチャの要点

- `lib/i18n.ts` — **多言語化の土台。`APP_LANGUAGES` 配列が唯一の情報源**で、型（`AppLanguage`）・入力検証（`isAppLanguage`）・端末ロケール判定（`resolveDeviceLanguage`）・Intlロケールと設定画面の言語名（`LANGUAGE_META`、言語名はその言語自身の表記=endonym）を全てここから導出する。**言語を足すときはこの配列に追加するだけ**で、あとは型エラーが出た箇所を埋めていけばよい。
  - 対応言語: `en` / `ja` / `es` / `pt-BR` / `de` / `fr`。RTL（`ar` 等）は対応コストが大きく、KaTeXの数式をRTL文脈でもLTRで出す追加対応が要るため見送り。`ru` はGoogle Playがロシアでの課金を停止しているため見送り。
  - **文言の持ち方が2種類あるので使い分ける**:
    - **UI文言** → `const EN_COPY = {...} as const;` + `const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = { en: EN_COPY, ja: {...}, ... }`。**英語のキー集合が正**で、他の言語でキーが欠けると**その言語ブロックの行に「どのキーが足りないか」の型エラーが出る**（これが翻訳漏れのチェックリストになる）。値に関数や入れ子配列が混ざる場合は `Record<AppLanguage, typeof EN_COPY>`（`as const` は外す）。
    - **コンテンツ** → `LocalizedText`（`{ en: string } & Partial<Record<AppLanguage, string>>`）+ `localizedText(text, language)`。**en必須・他は任意で英語にフォールバック**するので、件数の多いデータ（プリセット計算ノート等）を段階的に翻訳できる。
  - `titleEn` / `labelEn` のように**言語名を型名に埋め込む方式は廃止済み**（3言語目で破綻するため）。復活させないこと。
  - 設定画面の言語選択は `APP_LANGUAGES.map(...)` + `LANGUAGE_META[id].endonym` で作る。`t("english")` のように言語名ごとに翻訳キーを持つと言語数の2乗でキーが増える。
  - **`pt-BR` はキーにハイフンを含む**ので、オブジェクトのキーに書くときは引用符が必要（`"pt-BR": {...}`）。
- `lib/unit-errors.ts` — 計算エンジンのエラーメッセージ。`UnitError`（`code` + `params`）を投げ、表示側で `unitErrorMessage(error, language)` が言語ごとのカタログから引く。**`Error.message` は英語**にしてあるので、翻訳を通さず `cause.message` を直接出している箇所が残っても日本語が漏れない。
  - **設計の使い分け**: `lib/units.ts` は深い再帰評価の中から35箇所throwしていて全内部関数に言語を引き回すのが侵襲的すぎるので**コード方式**。一方 `lib/notebook-engine.ts` やバックアップ系は入り口が1〜2個の浅いモジュールなので**エントリポイントに `language: AppLanguage` 引数を追加する方式**。引数は**デフォルト値を付けない**（付けると渡し忘れた呼び出し元が黙って英語になり気付けない）。
- `lib/units.ts` — 単位計算エンジン。7次元ベクトル `[length, mass, time, current, temperature, amount, luminousIntensity]`。`BASE_UNITS` に完全一致キーがあり、なければ `PREFIXES`（SI接頭辞）で分解を試みる**完全一致優先**の解決順。新しい単位記号を足すときはこの順序のおかげで大抵の接頭辞と衝突しない（例: `cal` は `c`+`al` と誤解釈されない）。
  - `parseUnit`（裸の数値に付く単位サフィックス、例 `"5kN*m"`）は **括弧非対応**。`*` `/` `^` の連続でチェーンする必要がある。
  - **数値の直後は識別子より単位解決が先**で、しかも `*` `/` を跨いで**貪欲に**読む（`3m/s^2` は定数 `m` があっても `m/s^2` という1つの単位）。この走査規則は `unitSuffixEnd` としてexportしてあり、評価器と表示側の解析（`lib/unit-input.ts`）が**必ず同じものを使う**。ここを片方だけ独自に実装すると、単位チップの差し替え範囲が複合単位の一部だけになって `3m/G` のような式ができる（実際に踏んだバグ）。
  - `evaluateExpression`（完全な数式）は括弧対応。ローカル定数の式は必ずこちら経由なので括弧が使える。
  - **ハマりどころ**: 数値に単位を直接くっつける形（例 `13.6eV/n^2`）だと、`n` がnanoプレフィックスとして食われて `eV/n^2` を一つの複合単位として誤解析される。ローカル定数を割るときは `13.6eV/(n^2)` のように括弧で区切ると単位サフィックスの貪欲マッチが止まり、正しく完全式として評価される。
  - ローカル定数名はunit記号と同名でも安全にシャドーイングされる（識別子解決が単位解決より先）。例えば `C`（本来はクーロン）をキャパシタンスの定数名に、`N`（本来はニュートン）をコイルの巻数の定数名に使っても、その式の中では定数の値が優先される。
  - `Ohm`（大文字！）が正式なBASE_UNITSキー。`ohm`小文字はエイリアス未登録なので式中では使えない。
  - 新規追加した単位: `cal`/`kcal`, `bpm`/`rpm`（周波数扱い）, `cup`/`tbsp`/`tsp`（体積）, `au`/`ly`/`yr`, `eV`, `mol`/`mmol`。
  - 識別子（定数名）はASCIIの英数字・`_`に加え、下付き文字（`₀-₉`・`ₐ-ₜ`・`ᵢ-ᵪ`・`ⱼ`）とギリシャ文字（`Α-Ψ`・`α-ω`）も使える（`UNICODE_IDENTIFIER_EXTRA_CHARS`・`IDENTIFIER_START_CHAR_CLASS`・`IDENTIFIER_BODY_CHAR_CLASS`としてexport）。数式表示（LaTeX）の変数とそのまま同じ記号を定数名にできるようにするための拡張。`Ω`（オーム、U+03A9）と`µ`（マイクロ記号、U+00B5）は単位専用なので明示的に除外している。ギリシャ小文字の`μ`（mu、U+03BC）はマイクロ記号とは別コードポイントなので定数名として安全（数値直後は単位解決が先に評価されるため、`2μm`は引き続き単位として解釈される）。同じ文字集合を`lib/notebook-engine.ts`の`NAME_VALUE_PATTERN`と`lib/unit-input.ts`の`WORD_START_PATTERN`/`WORD_BODY_PATTERN`/`DEFINITION_PATTERN`でも使っており、ルールがずれないようにしている。
  - **ユーザー定義単位は解決順の一番最後**に引く（`resolveUnitSymbol`）。既存の解決（動的な計量カップ → `BASE_UNITS` の完全一致 → SI接頭辞分解）は `resolveBuiltInUnitSymbol` に切り出してあり、**それが解決できなかった場合にだけ**ユーザー定義を見る。この順序のおかげで「今日すでに解決できている記号」の意味はユーザーが何を登録しても変わらない。登録時にも `isBuiltInUnitSymbol` で衝突を弾くので、`dm` はデシメートルのまま。**この順序を入れ替えないこと。**
  - **オフセットを持つ単位は裸の識別子として使うとoffsetが落ちる**（`evaluateExpression` の識別子フォールバックが `scale`/`dimension` しか見ないため）。組み込みの `°C`/`°F` は記号に `°` を含み識別子トークンにならないので従来は到達不能だったが、**英字のみの単位（＝ユーザー定義単位）を足すと踏む**。現在は `temperatureUnitStandalone` を投げて塞いである（`32fah` は273.15Kだが `2*fah` は1.111Kになっていた）。
- `lib/unit-comparison.ts` — 1つの値を複数単位で並べる比較表の行を組み立てる純関数（`buildUnitComparisonRows`）。換算は既存の `convertQuantity` / `formatNumberForLocale`、候補は既存の `compatibleUnitOptionsFromHints` に任せ、**新しい換算ロジックは持たない**。
  - 電卓の結果カードの単位チップ列のすぐ下に、折りたたみで出している（`app/(tabs)/index.tsx`）。**候補の集合・並び順・タップ時の挙動をチップ列と揃える**ことで「チップ列を縦に開いたもの」として読ませる設計なので、ここで並べ替えないこと（テストで固定してある）。
  - チップ列（`conversionUnits`）は `getCompatibleUnitGroups` だけで作るため合成次元（`N·m²/C²` など）では空になるが、比較表は手掛かり方式を通すので候補を出せる。
- `lib/custom-units.ts` / `lib/custom-unit-messages.ts` — ユーザー定義単位。倍率形式（`0.303m`）と関数形式（`(x-32)*5/9*K + 273.15*K`）の2通り。`UnitDefinition` が元々アフィン（`SI値 = 値*scale + offset`）なので、`offset = f(0)` / `scale = f(1)-f(0)` で摂氏・華氏のようなオフセット付き単位も作れる。
  - **アフィン性を標本抽出だけで判定してはいけない。** x=0,1,2 の2階差分だけを見ると、その3点を根に持つ高次式を通してしまう（`x*x*(x-1)*(x-2)*m+x*m` は 0m/1m/2m を返すが x=3 で21m）。標本点を増やしても同じ手口で回避されるため、**xの現れ方を構造的に検査する**（`isStructurallyAffineInX`: 独立したxがちょうど1回・累乗されていない・関数の引数でない・除数でない）。この4条件を満たせばこの評価器では必ず1次になる。
  - **ただし「定義式のどこかに `^` があれば拒否」にはしないこと。** `x*9.8m/s^2` のように**単位側に指数を持つだけの1次式**まで弾いてしまい、関数形式がほぼ使えなくなる（実際に一度そうなった）。単位サフィックス中の `^` は演算子ですらない。
  - 記号は英字のみ（`^[A-Za-zΩµμ°]+$`）。**数字は使えない**（`parseUnit` の1因子あたりの正規表現が数字をべき乗としてしか受け付けないため、登録できても二度と引けない）。評価器の予約識別子（`e`/`pi`/`sin` 等）も弾く（`2e` と `2*e` が別物に解決されるため）。
  - 記号の検証は `isUsableCustomUnitSymbol` に一本化してある。登録時（`parseCustomUnit`）と**保存データの復元時**（`lib/calculator-store.tsx` の `isCustomUnit`）の両方が通ること。復元側が緩いと、記号 `m` のような「設定画面には出るのに絶対に解決されない幽霊単位」が生まれる。
  - **`UNIT_GROUPS` には入れていない**ので、単位チップ・比較表・単位ピッカーには出ない（`UnitGroup` は次元を1つしか持てず、自作単位は次元がばらばらなため）。式の中では使える。
- `lib/notebook-engine.ts` — `evaluateNotebookSteps` が手順を上から順に計算し、各結果を `s1, s2...` として後続手順から参照可能にする。
  - **重要な落とし穴**: 手順に`resultSymbol`（例 `"v"`）を付けると、その手順は`s1`ではなく`v`で登録される（`s1`は**使えなくなる**）。しかも`s1`は未定義エラーにならず**単位の`s`（1秒）として黙って解釈される**ため、次元が合ってしまう式では気付かないまま間違った答えが出る（実際に`s1*t₂`が`10800 s²`になるバグを踏んだ）。`resultSymbol`を付けた手順を後続から参照するときは必ずその記号名で書く。
`resolveNotebookLocalConstants` はローカル定数を順に解決（グローバル定数をローカルでシャドー可）。
- `lib/notebook-formulas/` — プリセット計算ノートの中身。ビルド生成物は無く、`source/`配下のTypeScriptが唯一の情報源（旧`default-notebooks.json` + `scripts/generate-default-notebooks.ts`による生成ステップは廃止済み）。
  - **`index.ts`は`source/categories.ts`の生シードをそのまま出さない**。`withDerivedResultSymbols`（`lib/notebook-result-symbols.ts`）を通し、`resultSymbol`が無い手順に**数式(`formulaLatex`)の左辺から導いた記号**を補ってからexportする（結果欄を「m*a」ではなく「F = m*a」と等式で読めるようにするため。156手順中133件に付く）。生シードは`PRESET_NOTEBOOK_SEEDS_AS_SEEDED`として別途export（既存インストールへの後追い反映で「式が投入時のままか」を判定するのに使う）。
  - 記号を補うと`s1`参照が壊れるので**後続手順の`s1`・`s2`…参照も同時に書き換える**。この不変条件は`tests/notebook-result-symbols.test.ts`が全プリセットに対して機械的に検証する。左辺が分数・プライム記号・数字始まり、または既存の記号と衝突する場合は補わない（従来どおり式だけの表示）。
  - `types.ts` — `PresetNotebookCategory`（`parentId?`で親子2階層に対応）、`NotebookSeed`/`NotebookSeedStep`（`formulaLatex?`でLaTeX表示に対応）。`NotebookSeedConstant`の`symbol`はその式の`formulaLatex`内の変数と同じ記号にする（下付き文字・ギリシャ文字も識別子として使えるため、表示専用の別名フィールドは無い）。
  - `source/materials.ts`（材料力学・既存7件）, `source/physics.ts`（高校物理: 力学/熱/波動/電気/原子の5サブカテゴリ）, `source/practical.ts`（電気の基礎計算/天体・宇宙/フィットネス/化学/車・自転車/料理）, `source/science.ts`（小中理科: 速さ・運動/密度・濃度/圧力・浮力/力・仕事・てこ/熱・温度/電気・回路/光・音/地学・天気/化学変化の9サブカテゴリ・46件）。
  - `source/categories.ts` — `PRESET_NOTEBOOK_CATEGORIES`（カテゴリ一覧）に加え、カテゴリID→ノート配列（上記の各ドメインファイルからexportした配列）の対応表`PRESET_NOTEBOOK_SEEDS`もここに集約している。新しいカテゴリを追加するときは、この対応表とカテゴリ一覧の両方をここで1ファイルだけ触ればよい。
  - **カテゴリグリッドの表示順は`PRESET_NOTEBOOK_CATEGORIES`の配列順そのまま**。親カテゴリとその子（`parentId`付き）は隣接させて並べる。現在の順は 理科（小・中）→ 高校物理 → 電気の基礎計算 → 天体・宇宙 → フィットネス → 化学 → 車・自転車 → 料理 → 材料力学（最後）。
  - `index.ts` は `source/categories.ts` の `PRESET_NOTEBOOK_CATEGORIES` と `PRESET_NOTEBOOK_SEEDS`（`Record<categoryId, NotebookSeed[]>`）をそのまま再exportするだけ。**この2つのexport名・shapeは`lib/calculator-store.tsx`が依存しているので変えない**。
  - 新しいプリセットを足すときは `tests/notebook-formulas.test.ts` が全プリセットの全手順を実際にノートエンジンで計算してエラーがないか自動チェックする（次元不整合・パースエラーを機械的に検出できる）ので、まずそのテストを通すこと。このテストは`resultSymbol`もアプリ本体と同じように渡している（渡さないと上記の`s1`落とし穴を検出できない）。
  - ただしテストで検出できるのはエラーだけで、**数値が物理的に正しいかは検出できない**（`s1`が1秒と解釈されるようなケースは次元が通ってしまう）。プリセットを足したら実際にアプリを開いて表示される値を確認すること。
- `app/(tabs)/index.tsx`（電卓） — **計算結果は state ではなく式から導出する**（`previewCalculatorInput`）。`=` を押さなくてもリアルタイムに結果が出る。`=` は「履歴に残す・定数を保存する・エラーを出す」確定操作だけを担当する。リアルタイム表示と確定計算は `lib/calculator-input.ts` の同じ関数（`evaluateCalculatorInput`）を通すこと（定数定義 `W = 3cm` の扱いが2箇所に分かれると、片方だけ値を出せない食い違いになる）。
- `lib/calculator-store.tsx` — アプリの状態管理本体。`CalculationNotebook`（`categoryId`, `localConstants`, `steps`, `pinned`, `isPreset`）。プリセットは`isPreset: true`で削除不可（UI・store両方でガード）。プリセットの投入はカテゴリID単位で冪等（新カテゴリを追加しても既存データは壊れない）。
- `components/notebooks/notebook-category-grid.tsx` + `app/(tabs)/constants.tsx` — カテゴリグリッドは2階層ナビゲーション対応（大分類→サブカテゴリ→ノート一覧）。`parentCategoryId` propで表示階層を切替。ユーザー作成カテゴリ（`NotebookCategory`）は今のところ親子階層に非対応（あくまでプリセットの高校物理のみ階層化。スコープを広げすぎないための判断）。
- `components/ui/latex-view.tsx` / `.web.tsx` — KaTeXによる本物のLaTeX描画。ネイティブはWebView（`react-native-webview`）+ `postMessage`で高さ・幅の自動調整、Webは`katex.renderToString`を直接DOMに挿入。フォント込みのKaTeXアセットは `scripts/generate-katex-assets.mjs` で `lib/katex-assets.generated.ts` に事前生成・コミット済み（`pnpm katex:generate`で再生成可能。中身は自動生成なので手編集しない）。
  - **`latex` が変わってもWebViewを読み直さない。** `source` に渡すHTMLは初回の1回だけ組み立てて固定し（初期値関数付きの`useState`）、以降は `injectJavaScript` で `renderLatex()` を呼び直す。`source` を差し替えると646KBのKaTeXアセットを毎回読み直すことになり、電卓の結果のように**数式が1文字ごとに変わる画面では描画が追いつかない**。読み込み完了前の変更を取りこぼさないよう `onLoadEnd` でも同じ関数を呼ぶ。
  - `fitContent` を付けると数式の幅ぶんだけ場所を取る（右に単位ラベル等を並べたいとき）。幅は**折り返しを止めたうえで `scrollWidth` も見る**こと。一度幅を縮めたあとに長い数式へ変わると、`getBoundingClientRect` だけでは縮んだビューポート幅しか返らず幅が戻らなくなる。実測できるまでは全幅で描く（最初から1pxにするとWebView内の描画自体が潰れて測り直しても正しい幅にならない）。
  - **WebViewに`ref`を渡すと型が壊れる。** 宣言が `class WebView<P = undefined> extends Component<WebViewProps & P>` で、`WebViewProps & undefined` が `never` に潰れるため。`useRef<ComponentRef<typeof WebView>>(null)` にすると通る。
- `lib/exact-value.ts` — 小数で出た結果を**分数・πの有理数倍・√の有理数倍**として言い当てる純関数（`findExactValue`）。電卓の結果カードで「小数 ⇔ 厳密値」を切り替えるために使う。
  - **値そのものを有理数で持ち回る（記号計算にする）方向へは進めないこと。** `lib/units.ts` は7次元ベクトルと`number`の組で換算・べき乗・三角関数まで全部組み立てられていて、そこへ有理数型を混ぜると全面書き直しになる。**表示のときだけ推定する**なら影響範囲がこのファイルに閉じる。
  - 判定順は **有理数 → π倍 → √倍** で固定。πや√を先に見ると `2.5` のような素直な分数まで「0.7957…π」に化ける。整数は`null`（小数表示のままで過不足がない）。
  - 近似探索は**連分数**（`bestRational`）。総当たりにしないのは「分母N以下で最も近い分数」が漸化式で必ず現れるため。収束分数は必ず既約なので約分し直す必要も無い。
  - √は**平方因子の抽出をしない**。`v²`を有理数化して素因数分解すると探索範囲が1e15規模になるので、代わりに**平方因子を持たない根号候補（2〜50）を列挙して `v/√r` が有理数か**を見る。この向きなら `√8` ではなく `2√2` の形が自動的に出る。
  - 相対誤差 `1e-12`・分母上限1000。この幅に無関係な値が偶然入る確率は1e-6程度で実用上無視できる。**緩めると打ち込んだだけの小数（1234.5678）まで分数化して読みにくくなる。**
- `components/notebooks/notebook-detail.tsx` — ルートは`View(flex:1)`で、**戻る/ピン留め/編集＋ノート名を固定ヘッダー**、値を編集したときの保存バーを**固定フッター**にしている（下までスクロールしても戻れる・保存できるようにするため）。狭い端末幅ではタイトルが潰れるので固定ヘッダーは上段（戻る＋ボタン）／下段（ノート名）の2段構成。`NotebookCategoryGrid`・`NotebookList`も戻る行をスクロール外に出し、中身だけをスクロールさせる（グリッドは以前`ScrollView`が無く、カテゴリが増えると画面外にはみ出して押せなかった）。
- **数式の編集口は「数式の解説」（`formulas`）に一本化してある**。編集画面（`constants.tsx`）は手順ごとの`formulaLatex`を編集せず、保存時に`formulaLatex`を落として`formulas`へ寄せる。`formulas`が空のノート（プリセット112件中108件）は`notebookFormulaRows`（`lib/notebook-formula-rows.ts`）が手順の`formulaLatex`を**説明文なしの行**として拾い上げるので、数式だけのノートも同じ1箇所で編集できる。手順カードにLaTeX欄を復活させないこと（2箇所で設定できるうえ、表示側は`formulas`を優先するのでどちらが効くか分からなくなる）。
- 表示側（`notebook-detail.tsx`）は`formulas`があればそれを、無ければ各手順の`formulaLatex`を数式カードに並べる。
- `lib/notebook-export-model.ts` / `lib/notebook-export-html.ts` / `lib/notebook-export.ts` — 計算ノートのPDFエクスポート（Pro機能）。
  - **画面のスクリーンショットは撮らない。** 自己完結したHTMLを1枚組んでファイルとして共有する。数式はネイティブでは1つずつ別のWebViewで非同期ロードされるので、ビューのスナップショットでは半分だけ写る。KaTeXアセット（`lib/katex-assets.generated.ts`）はフォントまでbase64で埋め込み済みなのでHTMLならオフラインで同じ数式が出る。受け取った側はブラウザ・OSの印刷メニューからPDF保存できる。
  - **`resolveNotebookStepDisplay` を画面とエクスポートの両方が通ること。** 結果は保存されておらず描画時に導出している（表示単位の上書き・次元が合わないときのSI表記へのフォールバック・単位ラベルの見栄え差し替え）。2箇所で実装すると`unitSuffixEnd`と同じ構造でPDFと画面の値がズレる。
  - **`expo-print` は入れない**（一度入れて撤去した）。**ネイティブモジュールを増やすとEASリビルドが必要になり、Expo Goで動かせなくなる**ため。加えて `expo-print` のWeb実装（`node_modules/expo-print/src/ExponentPrint.web.ts`）は `printAsync`・`printToFileAsync` のどちらも**オプションを一切見ず `window.print()` を呼ぶだけ**で、渡したHTMLではなく「今表示中のアプリ画面」を印刷してしまうので、Webでは最初から使えない。ネイティブは既存の `expo-file-system` + `expo-sharing`、Webは既存パターン（Blob + `<a download>`）で揃える。
  - HTML生成側では**ユーザー入力（ノート名・手順名・式・定数）をHTMLエスケープし、LaTeXは `JSON.stringify` + `<`→`\u003c`** で埋め込む。LaTeXはKaTeXに渡すのでHTMLエスケープできず、素朴に埋めると数式中の `</script>` でスクリプトブロックが途中終了する。
  - KaTeXアセット（約646KB）と各言語の見出しは**引数で受け取る**。純関数のまま保ち、テストを軽くするため。
- `lib/revenuecat-provider.tsx` / `lib/purchase-offering.ts` — 課金は**買い切り（非消費型）1本**。サブスクは提供しない（電卓ジャンルはサブスクへの反発が突出して強い。根拠は `docs/market-research-2026-09.md` 第4節）。
  - **RevenueCatのofferingからサブスクを絶対に買わせない**のが最重要の不変条件。`selectOneTimePackage` は `productCategory === "SUBSCRIPTION"` と `subscriptionPeriod` を持つものを弾き、**`lifetime` スロットに入っていても弾く**（dashboardの設定ミスを想定）。判定を緩めると「買い切りと表示して継続課金させる」最悪の事故になるので、`tests/purchase-offering.test.ts` の該当テストを消さないこと。
  - 選択関数は**ジェネリック**にしてSDKの `PurchasesPackage` をそのまま返す（narrowな型に落とすと `Purchases.purchasePackage()` に渡す際にキャストが必要になる）。
  - 価格はストアのローカライズ済み文字列（`product.priceString`）をそのまま出す。自前で通貨記号を組まない。
  - 買い切り商品に**無料トライアルは設定できない**（App Store/Playの導入価格・トライアルはサブスク専用機能）。審査員向けはプロモコードで通す。
  - **ユーザーのキャンセルはエラーではない**。RevenueCatは `userCancelled` を持つオブジェクトでrejectするので、それを「購入に失敗しました」と出さないこと。
  - **`RevenueCatUI.presentPaywallIfNeeded` にフォールバックしないこと**（一度入れて撤去した）。この関数はentitlementの有無しか見ず、**dashboardのofferingに入っている商品をそのまま表示する**ため、サブスク商品が残っていれば上の不変条件を迂回して継続課金を売ってしまう。買い切り商品が取れないときは購入させず理由（`productLoadFailed`）を出す。これで `react-native-purchases-ui` は未使用になっている。
  - 購入・復元は**同期フラグ（`purchaseLockRef`）で直列化**する。`isPurchasing` state と `Pressable` の `disabled` はどちらもコミット後の値なので、同じフレームで `onPress` が2回走ると両方すり抜ける。課金APIを叩く経路なのでstateだけでは不十分。
  - SDKキー未設定・`configure()` 完了前は購入も復元も**受け付けない**（`blockedReasonKey` / `isReady` で早期return）。叩けば必ず失敗し、「商品を読み込めません」「復元できません」と出て**本当の原因を隠す**ため。
  - **`purchasePackage()` が成功しても `pro` entitlement が付いてくるとは限らない**（dashboardで商品をentitlementに紐付け忘れている等。サブスク→買い切りの移行中はまさにこの状態になりうる）。`hasProEntitlement` を確認できたときだけ「ご購入ありがとうございます」を出し、そうでなければ復元とサポートへ導く（`purchaseNotApplied`）。支払ったのにProが有効にならないユーザーに成功メッセージを出すのが最悪の体験なので、`setIsPro` と成功メッセージを別々に判断しないこと。
  - 購入メッセージは**Proが有効になった時点で矛盾するものを落とす**（`lib/purchase-message.ts` の `resolvePurchaseMessageKey`）。`purchaseNotApplied` / `noRestorablePurchase` は「Proが無い」と主張する文言なので、あとからリスナー経由でProが有効になると「Pro利用中」カードと並んで表示されてしまう（表示側はメッセージを `isPro` に関係なく出す）。リスナーでstateを消しに行くのではなくレンダー時に落とすのは、Proが有効になる経路が購入・復元・リスナーの3つあるため。

## 既知の注意点・誤検知

> 以下は **2026-08-31時点、mainのコミット `b9bb79e`（PR #5マージ直前）** で確認した内容。時間が経つほど古くなるので、鵜呑みにせず**都度`pnpm lint`/`pnpm test`を実際に実行して現状を確認すること**。ここに書かれた件数・原因はあくまで「この時点ではこうだった」という参考情報であり、新しい失敗を無条件にこれらのせいだと決めつけない。

- `pnpm lint`: 上記コミット時点で**7エラー・4警告**が存在した（`app/(tabs)/constants.tsx`・`app/(tabs)/index.tsx`・`components/notebooks/notebook-detail.tsx`の`react-hooks/set-state-in-effect`系エラー3ファイル、`app/(tabs)/index.tsx`の`react-hooks/purity`エラー1件、`app/(tabs)/constants.tsx`・`app/(tabs)/settings.tsx`の`@typescript-eslint/array-type`警告）。新しい変更でこの内訳・件数が増えていないかは、`git stash`で変更を退避した状態の`pnpm lint`結果と比較して確認する（このセッションで実際に行った手順）。
- `pnpm test`: 同時点で `tests/revenuecat.credentials.test.ts` の2件（iOS/Android SDKキー検証）が失敗する。原因はこのサンドボックス環境にRevenueCatの公開SDKキーの環境変数が設定されていないため（**コードのバグではなく実行環境固有の問題**）。他のテストファイルはこの時点で全てpassしていた。
- CodeRabbitの「Docstring Coverage」pre-mergeチェックは閾値80%に対し、関数にJSDocを書いていないファイルを含むPRでほぼ毎回引っかかる。このコードベースは日本語のWHYコメント方式でJSDocを書かない慣習（プロジェクトの方針）なので、**この特定のwarning自体は無視して良い**（ブロッキングのエラーではなくwarning）。ただし他のCodeRabbit指摘（正確性・データ整合性など）は毎回きちんと検証すること。
- CodeRabbitが指摘した実際のバグ例: 物理的に不正確な用語（自由落下の`sqrt(2gh)`を"terminal velocity"と誤記していた→"impact velocity"に修正済み）。この種の物理用語の正確性チェックは有用なので、指摘が来たら真面目に検証する。
- CodeRabbit側の**ESLint実行が失敗する**ことがある（`Error: File 'expo/tsconfig.base' not found`）。これは向こうのサンドボックスが依存を解決できていないだけで、こちらの `npx expo lint` は通る。こちらのlint結果と食い違ったら、まず自分の環境で実際に走らせて確認する。

### 現在の基準値（2026-09-05時点、mainのコミット `65ae6bc`＝PR #39マージ後）

上と同じ理由で古くなるが、**新しい失敗が自分の変更のせいかを切り分けるための基準**として置いておく。着手前に一度実行して、この数字と一致することを確かめてから作業を始めるとよい。

- `npx tsc --noEmit` → **エラー0**
- `npx vitest run` → **577 passed / 2 failed / 1 skipped**。失敗2件は上記の `tests/revenuecat.credentials.test.ts`（環境依存）。**それ以外が落ちたら自分の変更のせい。**
- `npx expo lint` → **2エラー・0警告**。どちらも `app/(tabs)/index.tsx` の既存分（`react-hooks/purity` と `react-hooks/set-state-in-effect`）。
- `npx expo export --platform web` が通ることも確認できる。型チェックでは拾えない「バンドル時に落ちる変更」の検出に使える（UIを実際に触れない環境での簡易確認）。

## 直近の作業履歴（要約）

1. RevenueCat連携・UI改善（アニメーション/ハプティクス/オンボーディング/空状態）
2. テンプレート/自作関数タブを廃止し、「計算ノート」（notebooks）に統合。カテゴリ・ピン留め・プリセット削除保護を実装
3. **[完了・PR #5でmainにマージ済み]** 計算ノートに高校物理（5サブカテゴリ）・電気の基礎計算・天体宇宙・フィットネス・化学・車/自転車・料理の約60件のプリセットを追加。KaTeXによる本物のLaTeX数式表示を導入。カテゴリの親子2階層ナビゲーションを実装。
4. **[完了・PR #17でマージ済み]** 初回起動時（OSがダークモード）に背景が白いままになるバグを修正（`useSyncExternalStore`で`Appearance`/`AppState`を購読）。
5. **[完了・PR #18でマージ済み]** プリセットの定数名をLaTeX数式の記号そのもの（Unicodeの下付き・ギリシャ文字）に変更し、エンジンの識別子解析を拡張。ノート定義を`source/`配下に一元化。単位の置換・挿入をカーソル位置基準に。式欄の下に定数の挿入ボタン列を追加。
6. **[完了]** 計算ノートに「理科（小・中）」カテゴリ（9サブカテゴリ・46件）を追加し、カテゴリ順を 理科 先頭・材料力学 最後に変更。ノート詳細画面の戻る/保存を固定ヘッダー・フッター化し、カテゴリグリッドをスクロール可能に修正。
7. **[完了・PR #21でマージ済み]** 多言語化の土台を整備（`lib/i18n.ts` / `LocalizedText` / UI文言のRecord化）。あわせて既存の穴を全部塞いだ: `pro.tsx` の全文日本語決め打ち、`units.ts` のエラー35箇所、`lib`配下の表示文言29件、課金・広告12件、`GROUP_NAMES` の `amount` 欠落、言語切替後もプリセット112件が投入時の言語のまま残る問題。**ユーザーに表示される日本語決め打ちは0件**になった（残るのは `useCalculatorStore()` 等をProvider外で呼んだときの開発者向け`throw` 3件のみ）。
8. **[完了・PR #22でマージ済み]** `es` / `pt-BR` / `de` / `fr` を追加し、UI文言・単位名(100件)・エラーメッセージ(33コード)・iOSウィジェットを4言語分埋めた（約320キー×4）。`tests/unit-names-localization.test.ts` を追加し、全単位・全解説が全言語そろっているかを検証する。
9. **[完了・PR #23でマージ済み]** プリセット計算ノートの457フィールド（science 178 / practical 99 / physics 91 / materials 23 / categories 23 / sample-calculations 43）を4言語に翻訳。**アプリ全体が6言語対応になった**。
10. **[完了]** 「電気代」「走行コスト」のプリセットの単価が日本円前提だったのを地域別にした（`lib/preset-price-defaults.ts`）。**通貨は言語ではなく地域で決める**（日本在住で英語UIのユーザーは円建てになるべき）。`currencyCode` → `regionCode`から引いた通貨 → 言語からの推測 → USD の順に解決する。**Webでは `currencyCode` が常に null で返る**（expo-localizationのweb実装の制約）ので、`regionCode` の段が無いとWebでは地域を全く見られない。差し替えは投入時の1回だけで、`localConstants` は言語切替時にも触らない決まりを維持している。

### 多言語化で踏んだ、テストでは検出できない罠（次に言語を足すとき用）

**訳語は `docs/i18n-glossary.md` に集約してある**（4言語の対訳115語＋言語ごとの表記ルール＋定型表現＋実装後の訂正）。言語を足すときや訳語に迷ったときはまずこれを見る。**複数人・複数エージェントで分担翻訳するなら、先に用語集を更新してから分担する**こと。

型チェック・lint・テストが全部通るのに間違っている、という種類のものだけを挙げる。

- **仏語の「密度」**: 単位付き(kg/m³)は `masse volumique`。`densité` は水との比で**無次元の別概念**なので誤訳。
- **独 `Spannung` / 西 `tensión` は「応力」と「電圧」の両方**になりうる。材料力学と電気で同じ語を使うと誤訳。西語の電圧は `voltaje` にして回避した。
- **独語圏ではシャルルの法則を `Gesetz von Gay-Lussac` と呼ぶ**のが標準。
- **`hp` は英馬力(745.7W)**。独仏で日常的な `PS`/`CV` はメートル馬力(735.5W)で**値が違う**。同様に **`lb`(453.6g) と独語慣用の `Pfund`(500g)**、**`mi` と仏語の `mille`(=1000)**。名称側で区別が必要。
- **並行翻訳すると訳語がファイル間でブレる**。実際に「計算ノート」の独語訳が `Rechenheft` と `Notizbuch` に割れ、独語で敬称(Sie)と親称(du)が混在した。**先に用語集を作ってから分担すること**。それでも最後に横断チェックが必要。
- **既存の日本語が間違っていると4言語に伝播する**。`physics.ts` の「熱量」ノートが日本語だけ「熱量の保存」という誤ラベルで、翻訳担当が日本語に従ったため4言語に「保存」の意味が伝播した（CodeRabbitが検出）。翻訳前に en/ja の食い違いを疑うこと。
- 日本の理科教育に固有の概念（飽和水蒸気量・初期微動継続時間・空走距離など）は**造語しない**。定訳を探す→無ければ説明的に訳す→それも無理なら `LocalizedText` の英語フォールバックに任せる。

11. **[完了・PR #25でマージ済み]** 手順タイトルの固定数値をやめ、編集画面に記号・変数レールと表示タイトル欄を追加。結果一覧の「最終結果」バッジを削除。
12. **[完了・PR #26でマージ済み]** レールをフォーカスに連動させず常時表示に、編集画面に単位ボタン、電卓に「ノート」ボタン（使用履歴）とAC、起動時の式を最後に計算した式に、単位グループを11追加。
13. **[完了]** 単位チップが複合単位を丸ごと置き換えない不具合（`3m/s^2` → `3m/G`）を修正。電卓を `=` 前でもリアルタイム計算に。ノート履歴を「実際に使ったもの」に絞り1件ずつ削除可能に。数式の編集口を「数式の解説」へ一本化。プリセット133手順に結果記号を導出して結果欄を等式（`F = m*a`）に。

14. **[完了]** 課金設計を見直し、サブスク（月額・年額）をやめて**買い切り1本**にした。あわせて**無料版の履歴5件制限を撤廃**（`app/(tabs)/index.tsx` の `visibleHistory`）し、Proの特典一覧から「無制限の履歴」を外した。`docs/market-research-2026-09.md` 第4節・第8節の推奨アクション3の実装。

15. **[完了]** 計算ノートの書き出し（Proの4点目の特典）を実装。ネイティブモジュールは増やさず、印刷・PDF保存できるHTMLを共有する形。表示ロジックを `resolveNotebookStepDisplay` に一本化し、画面とPDFで値がズレないようにした。`docs/market-research-2026-09.md` 第3節P0の実装。

16. **[完了・PR #33でマージ済み]** 電卓の結果カードに**単位比較表ビュー**を追加（`docs/market-research-2026-09.md` 第3節P1）。判断は `lib/unit-comparison.ts` の純関数に切り出し、チップ列と同じ候補・同じ並び順で「縦に開いたもの」として出す。新しい換算ロジックは書いていない。

17. **[完了・PR #34でマージ済み]** **ユーザー定義単位**を追加（同P1）。倍率形式と関数形式（ConvertPad方式の `2*x+5`）に対応し、摂氏・華氏のようなオフセット付き単位も作れる。解決順は組み込み優先のまま変えていない（上の `lib/units.ts` の項を参照）。

### この2件で踏んだ、テストでは検出できなかった罠

- **CodeRabbitの指摘を直すと別の穴が開くことがある。** 非アフィン式の指摘に対して「`^` があれば拒否」で塞いだところ、`x*9.8m/s^2` のような実用的な1次式が全滅した。指摘への対応そのものを、元の指摘と同じ厳しさで見直すこと。
- **`await` の順序を変えると、別のバグの窓が広がる。** 「保存が成功してからstateを公開する」ように直した結果、`saveCustomUnit`/`deleteCustomUnit` がstateのクロージャから直前の一覧を読む問題（自作単位を続けて削除すると1件復活する）の窓がI/O時間ぶん広がった。このリポジトリの既存の対処は**refを同期更新する方式**（`notebooksRef` / `notebookHistoryRef`）なので、それに合わせる。
- **`String.prototype.matchAll` や後読みのような、このコードベースに前例の無いJS機能は避ける。** Hermesで落ちると「テストは全部通るのに実機だけ起動しない」形になる。`exec` ループで書ける範囲に留める（gフラグの正規表現を使い回すときは `lastIndex` を明示的に戻すこと）。
- **正規表現で出現回数を数えるときは、前後の1文字を消費するパターンをgフラグで使い回さない。** `(^|[^body])x($|[^body])` で `x*x` を数えると、2件目のxの直前の `*` が1件目に食われて **1件しか取れない**。識別子そのものを列挙して数えること。

18. **[完了・PR #37/#38/#39でマージ済み]** 電卓に**進数（2/8/16進）**を追加。あわせて「サンプル」と「数学」のボタンを用途別に分離した（サンプルは式を丸ごと置き換える破壊的操作なので画面上部の導線に、数学はキーパッドの延長なのでキーパッド直上に）。
    - #37でシート形式として入れたが、縦積みで場所を取るうえ「全基数を同時表示するので選択する意味がない」ため**作り直した**（#39）。現在の形は、結果カードの単位チップ列の下に `DEC/BIN/OCT/HEX` のチップ列を出すだけ。

### 進数機能の設計（`lib/number-base.ts` + `app/(tabs)/index.tsx`）

- **進数は単位ではない。** 単位は値そのものを変換する（`siValue = value * scale + offset`）が、進数は同じ値の**表記**を変えるだけ。`convertQuantity` は `Quantity` を返し、`formatQuantity` は必ず `formatNumberForLocale`（10進固定）を通すので、進数を `BASE_UNITS` に足しても表示段で10進に戻る。加えて `parseUnit` の1因子あたりの正規表現は**単位記号に数字を許さない**（数字はべき乗としてしか受け付けない）ので `16` のような記号自体が登録できない。**進数を単位として実装しようとしないこと。**
- **対象は無次元の安全整数だけ**（`canRepresentInBase`）。`Number.isSafeInteger` を満たさない値は `formatInBaseParts` が `null` を返す。負数は**符号＋絶対値**（`-0xFF`）で、2の補数は使わない（ビット幅という概念がこのアプリに無く、幅を決めないと表現が定まらないため）。
- **表示単位（`targetUnit`）が空のときだけ基数表記を出す。** 基数表記は `siValue` から作るので、表示単位が付いていると画面の数値と食い違う（例: `200%` は画面表示が200・`siValue` は2）。
- **表示用チップと入力用バーは別物。兼用に戻さないこと（#40で分離済み）。** かつては1つのチップ列が「式が空なら入力モードの開始／式があれば表示基数の切り替え」を兼ねていた。内部状態としては排他だが、**ユーザーから見ると同じ見た目で意味が2通りになり区別できない**（実際に「押すと入力欄が変わるのか表示が変わるのか分からない」と指摘された）。現在は次のとおり:
  - **表示用チップ**（結果カード・単位チップの下）＝ 出た答えをどの基数で読むか。押しても入力欄は変わらない。ハイライトは**常に `activeBase` だけ**を見る（`baseInputMode ?? activeBase` のような兼用の値を作ると、10進の値を出しながらHEXが光る食い違いになる）。条件は `canRepresentInBase(result) && !targetUnit.trim()`。
  - **入力用バー**（入力欄の直下）＝ いま何進数で打っているか。入口は「単位付け」レールの `0x` ボタン（横スクロールの隣なので、使わない人に縦幅を増やさない）。式が空か10進の整数のときだけ押せる。
  - 入力モード中は**単位候補レール（hintRow）ごと出さない**。`FF` のような生の桁を式として解析するので、「使えない単位」の赤い警告や見当違いの候補が並ぶ。
- **基数の切り替えで入力を捨てないこと。** 値を保ったまま表記だけ書き換える（`reinterpretBaseInput`）。`FF` でBINなら `11111111`、DECなら `255`。かつては「新しい基数で使えない桁が残ると固まる」対策として無条件にクリアしていたが、**DECを押しただけで打った値が消える**という別の不具合になっていた。値さえ保てば固まる問題も同時に消える。
- **変換できない桁のまま基数だけ切り替えてはいけない**（`canSwitchBaseInput`）。安全整数を超えていると `reinterpretBaseInput` はnullを返すが、基数だけ変わると**同じ桁の並びが新しい基数では妥当な別の値として通ってしまう**。例: 16進の `1111111111111111` は範囲外だが、DECにすると10進の `1111111111111111` として確定できる（利用者は気付けない）。CodeRabbitが🟠Majorとして検出した。
- **`sanitizeBaseInput` は先頭のマイナスを落とさない。** `-255` から入ると入力欄は `-FF` になるので、符号を桁でない文字として落とすと編集した瞬間に**値が正へ反転する**（`-4090` が `4090` になっていた）。`parseBaseInput` が先頭の符号を受け付ける以上、落としてよい文字ではない。2文字目以降の符号は桁として不正なので落とす。
- **式を丸ごと差し替える経路では必ず `setBaseInputMode(null)` する。** 進数入力モードのまま通常の式が入ると、桁の制限が効いたまま計算もできない宙ぶらりんの状態で固まる。該当するのは `restoreHistory` / `applySample` / `AC` と、**3つのeffect**（起動時の履歴復元・クイックショートカット・プリセットのルートパラメータ）。`setExpression(` の呼び出し元を全部たどって確認すること。
- **入力の絞り込みは経路が3つある。** キーパッドの `disabled`、数学シート（`pressKey("sin(")` を直接呼ぶので `pressKey` 内でも弾く）、`TextInput` への直接入力・貼り付け（`onChangeText` で `sanitizeBaseInput`）。**どれか1つでも塞ぎ漏らすと確定できない桁が混ざる。**
- **確定は `submitCalculation` に一本化する。** `=` キー・入力欄右の結果ボタン・`onSubmitEditing` の3経路があり、経路ごとに書くと必ず漏れる（実際に `=` 以外は進数の生の桁を通常の式として評価しようとしていた）。
- 入力モード中は結果を `display` 経由で出さず、必ず `parseBaseInput` の結果を見せる。2進の `1010` のように**生の桁が偶然そのまま10進として妥当**なケースがあり、`display` を見せると今どの基数で打っているかと画面表示が食い違う。

- **`targetUnit` の初期値・AC後は空文字（＝SI標準）にしてある**（`DEFAULT_TARGET_UNIT`）。以前は `"cm"` 固定で、`3` のような無次元の値を打つだけで「cmへ変換できません」という的外れなエラーが出るうえ、進数チップの表示条件（表示単位が空）も満たせず**機能が丸ごと到達不能**だった。長さの単位が要るときは結果カードの単位チップから1タップで選べる。`"cm"` に戻さないこと。

### 進行管理で踏んだこと（#39・#40）

- **CodeRabbitのレビュー実行中にpushしない。** レビュー中に無関係のマージコミットを積んだら「Head commit changed」でレビューが中断し、レート制限枠を1回分無駄にした。
- **GitHub MCPの `create_pull_request` が使えるかはセッションによって違う。** #39・#40のセッションでは利用できず、REST直叩き（＝作者が `claude[bot]` になり自動レビューが走らない）しか無かったため、人間のアカウントから `@coderabbitai review` を投げる運用に戻した。#42のセッションでは使えて作者が `ohru131` になった。**着手時に実際に使えるか確かめること。**
- **PRを作る前に `git fetch origin main` すること。** #42では、このブランチの前半6コミットが先に #41 としてsquashマージされていたのに気付かずPRを作り、`mergeable_state: dirty`（同じ内容・別履歴の競合）になった。**squashマージ済みの履歴の上に積み増ししない**という既存の規約（このファイル冒頭）は、着手時だけでなく**PRを出す直前にも効く**。作り直しは `git branch backup/<日付> <HEAD>` で退避してから `git checkout -B <branch> origin/main` + `git cherry-pick <未マージのコミット>`。
- **CodeRabbitの指摘件数をレビュー本文の "Actionable comments posted: N" だけで数えないこと。** この数字は**diff外のコメントしか数えていないことがある**。#40では本文が「1件」と言っていたが、実際にはインラインのreview commentに🟠Majorがもう1件付いていて、危うく見落とすところだった（実際に「1件」と誤って返信し、訂正した）。**`gh api .../pulls/N/comments`（インライン）と `.../pulls/N/reviews`（本文）の両方を必ず引く。**

19. **[完了]** 電卓の結果に**厳密値表示**（分数・π・√）を追加し、`小数 ⇔ 厳密値` のチップで切り替えられるようにした。表示はKaTeXで本物の分数・根号として描く。あわせて進数入力の入口（`0x`）を単位検索ボタンと同じ見た目・並びから外し、レールの一番右のwarning系の丸ピルに変えた（単位まわりの導線の仲間に見えていたため）。

### 厳密値表示で判断したこと

- **厳密値チップは「厳密な形が見つかったとき」だけ出す。** 常時出すと、押しても何も変わらないボタンが並ぶ。
- **進数チップとは排他になる**（厳密な形が出るのは整数でない値だけ、進数表示は安全整数のときだけ）ので、両方が同時に光ることはない。
- **単位はLaTeXの外にTextで並べる。** 単位記号には `²` や `°` や `µ` が混ざり、`\text{}` に入れると環境によって描けない文字が出る。
- **`\displaystyle` を付けないと分数が本文サイズで小さく組まれる**（隣の小数表示より明らかに小さく見える）。`displayMode: true` の方は中央寄せと上下の余白が付いて結果カードの詰まった配置に合わないので使わない。
- **コピーは画面に出ているのと同じ表記を渡す。** 厳密値に切り替えているのに小数がコピーされると、画面と手元のメモが食い違う（Unicode表記は `ExactValue.text`）。

### 現在の基準値（2026-09-05時点、`claude/shipaton-2026-prep-3b0tt7` の厳密値表示コミット時点）

- `npx tsc --noEmit` → **エラー0**
- `npx vitest run` → **618 passed / 2 failed / 1 skipped**。失敗2件は `tests/revenuecat.credentials.test.ts`（環境依存）。
- `npx expo lint` → **2エラー・0警告**。どちらも `app/(tabs)/index.tsx` の既存分（`react-hooks/purity` と `react-hooks/set-state-in-effect`）。
- `npx expo export --platform web` が通る。**UIを実際に触れない環境では、この`dist`を`python3 -m http.server`で配ってPlaywright（`/opt/pw-browsers/chromium`）で叩くと画面を確認できる**（初回はオンボーディングのモーダルが被さるので "Skip" を先に押す）。

## 次にやりそうなこと（ユーザーから明示的な指示待ち）

- **自作単位がバックアップに含まれていない**（`lib/constants-backup.ts` / `lib/notebooks-backup.ts`）。`2shaku` を参照するノートを別端末へ復元すると評価に失敗する。バックアップ形式の変更を伴うため #34 のスコープ外にした。**次にやるならここが最優先。**
- 自作単位を単位チップ・比較表・単位ピッカーにも出すか（`UNIT_GROUPS` が次元1つ前提なので、次元ごとの合成グループを作るか `compatibleUnitOptions` 側に足すかの判断が要る）
- 進数を**バイナリ演算**（AND/OR/XOR/シフト）まで広げるか。今は表示と入力だけで、桁のまま演算に入る経路は塞いである（まず `=` で10進へ確定させる運用）

- さらに言語を増やすか（調査での次候補は `ko` / `zh-Hant` / `id`）。`APP_LANGUAGES` に足すと `Record<AppLanguage,T>` が一斉に型エラーになり、それが翻訳漏れのチェックリストになる。単位名の漏れは `tests/unit-names-localization.test.ts` が検出する
- iOSのApp Tracking Transparencyダイアログ文言（`app.config.ts`）の多言語化。Expoの`locales`機能はSDK 57に存在するが、実際に言語別に切り替わるかの検証にネイティブビルドが必要で未確認のため見送っている
- ユーザー作成カテゴリにもサブカテゴリ機能を広げるか（今は未対応、スコープ外と判断した）
- 他の実単位を使う分野の追加（要望があれば）
- Shipaton 2026提出に向けた残タスクの確認
