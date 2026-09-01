import defaultNotebooksData from "./default-notebooks.json";
import type { NotebookSeed, PresetNotebookCategory } from "./types";

export type { NotebookSeed, NotebookSeedConstant, NotebookSeedFormula, NotebookSeedStep, PresetNotebookCategory } from "./types";

// プリセット計算ノートの中身は default-notebooks.json（デフォルトファイル）から読み取って生成する。
// 中身自体を編集するときは lib/notebook-formulas/source/ 配下を直し、
// `pnpm notebooks:generate` で default-notebooks.json を再生成すること
// （中身は自動生成なので default-notebooks.json 自体は手編集しない）。
export const PRESET_NOTEBOOK_CATEGORIES: PresetNotebookCategory[] = defaultNotebooksData.categories;
export const PRESET_NOTEBOOK_SEEDS: Record<string, NotebookSeed[]> = defaultNotebooksData.seeds;
