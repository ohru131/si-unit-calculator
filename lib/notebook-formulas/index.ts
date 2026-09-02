export type { NotebookSeed, NotebookSeedConstant, NotebookSeedFormula, NotebookSeedStep, PresetNotebookCategory } from "./types";

// プリセット計算ノートの中身は lib/notebook-formulas/source/ 配下のTypeScriptが唯一の情報源。
// カテゴリ一覧とカテゴリID→ノート対応表は source/categories.ts にまとまっており、
// ここではそれをそのまま再exportするだけ（ビルド生成物は無く、常にソースと一致する）。
export { PRESET_NOTEBOOK_CATEGORIES, PRESET_NOTEBOOK_SEEDS } from "./source/categories";
