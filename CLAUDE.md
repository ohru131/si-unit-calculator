# si-unit-calculator（単位付き電卓）— セッション引き継ぎメモ

Expo/React Native製の単位計算アプリ。Shipaton 2026提出に向けて開発中。
このファイルは、別セッションに引き継ぐための知見・状況・規約をまとめたもの。

## リポジトリのワークフロー規約

- **開発ブランチ**: `claude/shipaton-2026-prep-3b0tt7` を使い続ける。
  - このブランチのPRが既にマージ済みの場合は、`git fetch origin main && git checkout -B claude/shipaton-2026-prep-3b0tt7 origin/main` で最新mainから作り直してから作業する（マージ済み履歴の上に積み増ししない）。
- **フロー**: ブランチで作業 → コミット → push → PR作成（テンプレートなし、Summary/Test planで書く）→ **CodeRabbitの自動レビューを待つ**（このリポジトリはCodeRabbit導入済み）→ 指摘があれば修正してpush → レビューがminimal riskになったらsquash mergeでmainへ。
- PRを出したら `subscribe_pr_activity` でこのセッションを購読し、CodeRabbitのレビューコメントに対応してからマージする。ただの「レビュー中」通知では何もしない。
- コミットメッセージ・PR本文に自分のモデル名は書かない（チャット内のみでOK）。

## アーキテクチャの要点

- `lib/units.ts` — 単位計算エンジン。7次元ベクトル `[length, mass, time, current, temperature, amount, luminousIntensity]`。`BASE_UNITS` に完全一致キーがあり、なければ `PREFIXES`（SI接頭辞）で分解を試みる**完全一致優先**の解決順。新しい単位記号を足すときはこの順序のおかげで大抵の接頭辞と衝突しない（例: `cal` は `c`+`al` と誤解釈されない）。
  - `parseUnit`（裸の数値に付く単位サフィックス、例 `"5kN*m"`）は **括弧非対応**。`*` `/` `^` の連続でチェーンする必要がある。
  - `evaluateExpression`（完全な数式）は括弧対応。ローカル定数の式は必ずこちら経由なので括弧が使える。
  - **ハマりどころ**: 数値に単位を直接くっつける形（例 `13.6eV/n^2`）だと、`n` がnanoプレフィックスとして食われて `eV/n^2` を一つの複合単位として誤解析される。ローカル定数を割るときは `13.6eV/(n^2)` のように括弧で区切ると単位サフィックスの貪欲マッチが止まり、正しく完全式として評価される。
  - ローカル定数名はunit記号と同名でも安全にシャドーイングされる（識別子解決が単位解決より先）。ただし紛らわしいので `C`（クーロン）→`Cap`、`N`（ニュートン）→`turns` のように避けている箇所がある。
  - `Ohm`（大文字！）が正式なBASE_UNITSキー。`ohm`小文字はエイリアス未登録なので式中では使えない。
  - 新規追加した単位: `cal`/`kcal`, `bpm`/`rpm`（周波数扱い）, `cup`/`tbsp`/`tsp`（体積）, `au`/`ly`/`yr`, `eV`, `mol`/`mmol`。
- `lib/notebook-engine.ts` — `evaluateNotebookSteps` が手順を上から順に計算し、各結果を `s1, s2...` として後続手順から参照可能にする。`resolveNotebookLocalConstants` はローカル定数を順に解決（グローバル定数をローカルでシャドー可）。
- `lib/notebook-formulas/` — プリセット計算ノートの中身（ディレクトリ構成、旧`notebook-formulas.ts`単一ファイルから移行済み）。
  - `types.ts` — `PresetNotebookCategory`（`parentId?`で親子2階層に対応）、`NotebookSeed`/`NotebookSeedStep`（`formulaLatex?`でLaTeX表示に対応）。
  - `materials.ts`（材料力学・既存7件）, `physics.ts`（高校物理: 力学/熱/波動/電気/原子の5サブカテゴリ）, `practical.ts`（電気の基礎計算/天体・宇宙/フィットネス/化学/車・自転車/料理）。
  - `index.ts` が `PRESET_NOTEBOOK_CATEGORIES` と `PRESET_NOTEBOOK_SEEDS`（`Record<categoryId, NotebookSeed[]>`）を集約してexport。**この2つのexport名・shapeは`lib/calculator-store.tsx`が依存しているので変えない**。
  - 新しいプリセットを足すときは `tests/notebook-formulas.test.ts` が全プリセットの全手順を実際にノートエンジンで計算してエラーがないか自動チェックする（次元不整合・パースエラーを機械的に検出できる）ので、まずそのテストを通すこと。
- `lib/calculator-store.tsx` — アプリの状態管理本体。`CalculationNotebook`（`categoryId`, `localConstants`, `steps`, `pinned`, `isPreset`）。プリセットは`isPreset: true`で削除不可（UI・store両方でガード）。プリセットの投入はカテゴリID単位で冪等（新カテゴリを追加しても既存データは壊れない）。
- `components/notebooks/notebook-category-grid.tsx` + `app/(tabs)/constants.tsx` — カテゴリグリッドは2階層ナビゲーション対応（大分類→サブカテゴリ→ノート一覧）。`parentCategoryId` propで表示階層を切替。ユーザー作成カテゴリ（`NotebookCategory`）は今のところ親子階層に非対応（あくまでプリセットの高校物理のみ階層化。スコープを広げすぎないための判断）。
- `components/ui/latex-view.tsx` / `.web.tsx` — KaTeXによる本物のLaTeX描画。ネイティブはWebView（`react-native-webview`）+ `postMessage`で高さ自動調整、Webは`katex.renderToString`を直接DOMに挿入。フォント込みのKaTeXアセットは `scripts/generate-katex-assets.mjs` で `lib/katex-assets.generated.ts` に事前生成・コミット済み（`pnpm katex:generate`で再生成可能。中身は自動生成なので手編集しない）。
- ユーザー作成ノートの手順には`formulaLatex`は付かない（プリセットのみ）。`notebook-detail.tsx`は`formulaLatex`があればLatexView、なければプレーンテキストにフォールバックする設計。

## 既知の注意点・誤検知

- `pnpm lint` は本セッション開始時点で**7エラー・4警告がすでにmain上に存在**する（`react-hooks/set-state-in-effect`系、`array-type`警告など）。新しい変更でこの件数が増えていないかを都度 `git stash` で比較して確認するとよい。
- `pnpm test` で `tests/revenuecat.credentials.test.ts` の2件が失敗するのは、サンドボックス環境にRevenueCatの環境変数が無いため（**この環境固有の問題で、コードのバグではない**）。
- CodeRabbitの「Docstring Coverage」pre-mergeチェックは閾値80%に対しほぼ毎回引っかかる。このコードベースは日本語のWHYコメント方式でJSDocを書かない慣習なので、**this warning自体は無視して良い**（ブロッキングではなくwarning）。
- CodeRabbitが指摘した実際のバグ例: 物理的に不正確な用語（自由落下の`sqrt(2gh)`を"terminal velocity"と誤記していた→"impact velocity"に修正済み）。この種の物理用語の正確性チェックは有用なので、指摘が来たら真面目に検証する。

## 直近の作業履歴（要約）

1. RevenueCat連携・UI改善（アニメーション/ハプティクス/オンボーディング/空状態）
2. テンプレート/自作関数タブを廃止し、「計算ノート」（notebooks）に統合。カテゴリ・ピン留め・プリセット削除保護を実装
3. **[完了・PR #5でmainにマージ済み]** 計算ノートに高校物理（5サブカテゴリ）・電気の基礎計算・天体宇宙・フィットネス・化学・車/自転車・料理の約60件のプリセットを追加。KaTeXによる本物のLaTeX数式表示を導入。カテゴリの親子2階層ナビゲーションを実装。

## 次にやりそうなこと（ユーザーから明示的な指示待ち）

- ユーザー作成カテゴリにもサブカテゴリ機能を広げるか（今は未対応、スコープ外と判断した）
- 他の実単位を使う分野の追加（要望があれば）
- Shipaton 2026提出に向けた残タスクの確認
