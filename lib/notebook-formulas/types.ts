export type PresetNotebookCategory = {
  id: string;
  label: string;
  labelEn: string;
  /** 親カテゴリのid。未設定なら最上位（大分類）として扱う。 */
  parentId?: string;
};

export type NotebookSeedConstant = { symbol: string; expression: string };
export type NotebookSeedStep = {
  title: string;
  titleEn: string;
  expression: string;
  targetUnit: string;
  /** 見やすい表示用のLaTeX数式。省略時は式（expression）をそのまま表示する。 */
  formulaLatex?: string;
};
export type NotebookSeed = {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  localConstants: NotebookSeedConstant[];
  steps: NotebookSeedStep[];
};
