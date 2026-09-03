export type { NotebookSeed, NotebookSeedConstant, NotebookSeedFormula, NotebookSeedStep, PresetNotebookCategory } from "./types";

import { withDerivedResultSymbols } from "@/lib/notebook-result-symbols";

import { PRESET_NOTEBOOK_SEEDS as RAW_PRESET_NOTEBOOK_SEEDS } from "./source/categories";
import type { NotebookSeed } from "./types";

// プリセット計算ノートの中身は lib/notebook-formulas/source/ 配下のTypeScriptが唯一の情報源。
// カテゴリ一覧とカテゴリID→ノート対応表は source/categories.ts にまとまっている
// （ビルド生成物は無く、常にソースと一致する）。
export { PRESET_NOTEBOOK_CATEGORIES } from "./source/categories";

// 結果記号を導出する前のシード。既存インストールへの反映（presetResultSymbolPatch）で
// 「保存されている式が投入時のままか＝ユーザーが編集していないか」を判定するために要る。
export { PRESET_NOTEBOOK_SEEDS as PRESET_NOTEBOOK_SEEDS_AS_SEEDED } from "./source/categories";

// 手順の結果記号（resultSymbol）は、数式（formulaLatex）の左辺から機械的に導く。
// 156手順のうち5件しか明示しておらず、残りは結果欄が「m*a」のような式だけの表示になっていた。
// 記号を補うと「F = m*a」という等式として読めるようになる。156件を手で書き足す代わりに
// ここで一度だけ導出することで、新しいプリセットにも自動で効き、規則が1箇所に収まる。
export const PRESET_NOTEBOOK_SEEDS: Record<string, NotebookSeed[]> = Object.fromEntries(
  Object.entries(RAW_PRESET_NOTEBOOK_SEEDS).map(([categoryId, seeds]) => [categoryId, seeds.map(withDerivedResultSymbols)]),
);
