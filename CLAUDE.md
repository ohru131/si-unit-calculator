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

## アーキテクチャの要点

- `lib/units.ts` — 単位計算エンジン。7次元ベクトル `[length, mass, time, current, temperature, amount, luminousIntensity]`。`BASE_UNITS` に完全一致キーがあり、なければ `PREFIXES`（SI接頭辞）で分解を試みる**完全一致優先**の解決順。新しい単位記号を足すときはこの順序のおかげで大抵の接頭辞と衝突しない（例: `cal` は `c`+`al` と誤解釈されない）。
  - `parseUnit`（裸の数値に付く単位サフィックス、例 `"5kN*m"`）は **括弧非対応**。`*` `/` `^` の連続でチェーンする必要がある。
  - `evaluateExpression`（完全な数式）は括弧対応。ローカル定数の式は必ずこちら経由なので括弧が使える。
  - **ハマりどころ**: 数値に単位を直接くっつける形（例 `13.6eV/n^2`）だと、`n` がnanoプレフィックスとして食われて `eV/n^2` を一つの複合単位として誤解析される。ローカル定数を割るときは `13.6eV/(n^2)` のように括弧で区切ると単位サフィックスの貪欲マッチが止まり、正しく完全式として評価される。
  - ローカル定数名はunit記号と同名でも安全にシャドーイングされる（識別子解決が単位解決より先）。例えば `C`（本来はクーロン）をキャパシタンスの定数名に、`N`（本来はニュートン）をコイルの巻数の定数名に使っても、その式の中では定数の値が優先される。
  - `Ohm`（大文字！）が正式なBASE_UNITSキー。`ohm`小文字はエイリアス未登録なので式中では使えない。
  - 新規追加した単位: `cal`/`kcal`, `bpm`/`rpm`（周波数扱い）, `cup`/`tbsp`/`tsp`（体積）, `au`/`ly`/`yr`, `eV`, `mol`/`mmol`。
  - 識別子（定数名）はASCIIの英数字・`_`に加え、下付き文字（`₀-₉`・`ₐ-ₜ`・`ᵢ-ᵪ`・`ⱼ`）とギリシャ文字（`Α-Ψ`・`α-ω`）も使える（`UNICODE_IDENTIFIER_EXTRA_CHARS`・`IDENTIFIER_START_CHAR_CLASS`・`IDENTIFIER_BODY_CHAR_CLASS`としてexport）。数式表示（LaTeX）の変数とそのまま同じ記号を定数名にできるようにするための拡張。`Ω`（オーム、U+03A9）と`µ`（マイクロ記号、U+00B5）は単位専用なので明示的に除外している。ギリシャ小文字の`μ`（mu、U+03BC）はマイクロ記号とは別コードポイントなので定数名として安全（数値直後は単位解決が先に評価されるため、`2μm`は引き続き単位として解釈される）。同じ文字集合を`lib/notebook-engine.ts`の`NAME_VALUE_PATTERN`と`lib/unit-input.ts`の`WORD_START_PATTERN`/`WORD_BODY_PATTERN`/`DEFINITION_PATTERN`でも使っており、ルールがずれないようにしている。
- `lib/notebook-engine.ts` — `evaluateNotebookSteps` が手順を上から順に計算し、各結果を `s1, s2...` として後続手順から参照可能にする。`resolveNotebookLocalConstants` はローカル定数を順に解決（グローバル定数をローカルでシャドー可）。
- `lib/notebook-formulas/` — プリセット計算ノートの中身。ビルド生成物は無く、`source/`配下のTypeScriptが唯一の情報源（旧`default-notebooks.json` + `scripts/generate-default-notebooks.ts`による生成ステップは廃止済み）。
  - `types.ts` — `PresetNotebookCategory`（`parentId?`で親子2階層に対応）、`NotebookSeed`/`NotebookSeedStep`（`formulaLatex?`でLaTeX表示に対応）。`NotebookSeedConstant`の`symbol`はその式の`formulaLatex`内の変数と同じ記号にする（下付き文字・ギリシャ文字も識別子として使えるため、表示専用の別名フィールドは無い）。
  - `source/materials.ts`（材料力学・既存7件）, `source/physics.ts`（高校物理: 力学/熱/波動/電気/原子の5サブカテゴリ）, `source/practical.ts`（電気の基礎計算/天体・宇宙/フィットネス/化学/車・自転車/料理）。
  - `source/categories.ts` — `PRESET_NOTEBOOK_CATEGORIES`（カテゴリ一覧）に加え、カテゴリID→ノート配列（上記の各ドメインファイルからexportした配列）の対応表`PRESET_NOTEBOOK_SEEDS`もここに集約している。新しいカテゴリを追加するときは、この対応表とカテゴリ一覧の両方をここで1ファイルだけ触ればよい。
  - `index.ts` は `source/categories.ts` の `PRESET_NOTEBOOK_CATEGORIES` と `PRESET_NOTEBOOK_SEEDS`（`Record<categoryId, NotebookSeed[]>`）をそのまま再exportするだけ。**この2つのexport名・shapeは`lib/calculator-store.tsx`が依存しているので変えない**。
  - 新しいプリセットを足すときは `tests/notebook-formulas.test.ts` が全プリセットの全手順を実際にノートエンジンで計算してエラーがないか自動チェックする（次元不整合・パースエラーを機械的に検出できる）ので、まずそのテストを通すこと。
- `lib/calculator-store.tsx` — アプリの状態管理本体。`CalculationNotebook`（`categoryId`, `localConstants`, `steps`, `pinned`, `isPreset`）。プリセットは`isPreset: true`で削除不可（UI・store両方でガード）。プリセットの投入はカテゴリID単位で冪等（新カテゴリを追加しても既存データは壊れない）。
- `components/notebooks/notebook-category-grid.tsx` + `app/(tabs)/constants.tsx` — カテゴリグリッドは2階層ナビゲーション対応（大分類→サブカテゴリ→ノート一覧）。`parentCategoryId` propで表示階層を切替。ユーザー作成カテゴリ（`NotebookCategory`）は今のところ親子階層に非対応（あくまでプリセットの高校物理のみ階層化。スコープを広げすぎないための判断）。
- `components/ui/latex-view.tsx` / `.web.tsx` — KaTeXによる本物のLaTeX描画。ネイティブはWebView（`react-native-webview`）+ `postMessage`で高さ自動調整、Webは`katex.renderToString`を直接DOMに挿入。フォント込みのKaTeXアセットは `scripts/generate-katex-assets.mjs` で `lib/katex-assets.generated.ts` に事前生成・コミット済み（`pnpm katex:generate`で再生成可能。中身は自動生成なので手編集しない）。
- ユーザー作成ノートの手順には`formulaLatex`は付かない（プリセットのみ）。`notebook-detail.tsx`は`formulaLatex`があればLatexView、なければプレーンテキストにフォールバックする設計。

## 既知の注意点・誤検知

> 以下は **2026-08-31時点、mainのコミット `b9bb79e`（PR #5マージ直前）** で確認した内容。時間が経つほど古くなるので、鵜呑みにせず**都度`pnpm lint`/`pnpm test`を実際に実行して現状を確認すること**。ここに書かれた件数・原因はあくまで「この時点ではこうだった」という参考情報であり、新しい失敗を無条件にこれらのせいだと決めつけない。

- `pnpm lint`: 上記コミット時点で**7エラー・4警告**が存在した（`app/(tabs)/constants.tsx`・`app/(tabs)/index.tsx`・`components/notebooks/notebook-detail.tsx`の`react-hooks/set-state-in-effect`系エラー3ファイル、`app/(tabs)/index.tsx`の`react-hooks/purity`エラー1件、`app/(tabs)/constants.tsx`・`app/(tabs)/settings.tsx`の`@typescript-eslint/array-type`警告）。新しい変更でこの内訳・件数が増えていないかは、`git stash`で変更を退避した状態の`pnpm lint`結果と比較して確認する（このセッションで実際に行った手順）。
- `pnpm test`: 同時点で `tests/revenuecat.credentials.test.ts` の2件（iOS/Android SDKキー検証）が失敗する。原因はこのサンドボックス環境にRevenueCatの公開SDKキーの環境変数が設定されていないため（**コードのバグではなく実行環境固有の問題**）。他のテストファイルはこの時点で全てpassしていた。
- CodeRabbitの「Docstring Coverage」pre-mergeチェックは閾値80%に対し、関数にJSDocを書いていないファイルを含むPRでほぼ毎回引っかかる。このコードベースは日本語のWHYコメント方式でJSDocを書かない慣習（プロジェクトの方針）なので、**この特定のwarning自体は無視して良い**（ブロッキングのエラーではなくwarning）。ただし他のCodeRabbit指摘（正確性・データ整合性など）は毎回きちんと検証すること。
- CodeRabbitが指摘した実際のバグ例: 物理的に不正確な用語（自由落下の`sqrt(2gh)`を"terminal velocity"と誤記していた→"impact velocity"に修正済み）。この種の物理用語の正確性チェックは有用なので、指摘が来たら真面目に検証する。

## 直近の作業履歴（要約）

1. RevenueCat連携・UI改善（アニメーション/ハプティクス/オンボーディング/空状態）
2. テンプレート/自作関数タブを廃止し、「計算ノート」（notebooks）に統合。カテゴリ・ピン留め・プリセット削除保護を実装
3. **[完了・PR #5でmainにマージ済み]** 計算ノートに高校物理（5サブカテゴリ）・電気の基礎計算・天体宇宙・フィットネス・化学・車/自転車・料理の約60件のプリセットを追加。KaTeXによる本物のLaTeX数式表示を導入。カテゴリの親子2階層ナビゲーションを実装。

## 次にやりそうなこと（ユーザーから明示的な指示待ち）

- ユーザー作成カテゴリにもサブカテゴリ機能を広げるか（今は未対応、スコープ外と判断した）
- 他の実単位を使う分野の追加（要望があれば）
- Shipaton 2026提出に向けた残タスクの確認
