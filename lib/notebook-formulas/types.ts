export type PresetNotebookCategory = {
  id: string;
  label: string;
  labelEn: string;
  /** 親カテゴリのid。未設定なら最上位（大分類）として扱う。 */
  parentId?: string;
};

export type NotebookSeedConstant = {
  symbol: string;
  expression: string;
  /** 定数一覧での表示用記号。数式（formulaLatex）の変数と揃えるためのUnicode下付き文字など。省略時はsymbolをそのまま表示する。 */
  displaySymbol?: string;
};
export type NotebookSeedStep = {
  title: string;
  titleEn: string;
  expression: string;
  targetUnit: string;
  /** 見やすい表示用のLaTeX数式。省略時は式（expression）をそのまま表示する。 */
  formulaLatex?: string;
  /** 結果の入力式欄に「symbol=expression」の形で表示するための名前（例："v"）。省略時は式のみ表示する。 */
  resultSymbol?: string;
};
/** 「説明文＋数式」のペア。手順（steps）の計算結果とは独立に、複数個並べて解説できる。 */
export type NotebookSeedFormula = {
  explanation: string;
  explanationEn: string;
  latex: string;
};
export type NotebookSeed = {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  /** 解説＋数式のペア一覧。省略時は各手順のformulaLatexをそのまま「数式」欄に並べる（従来どおり）。 */
  formulas?: NotebookSeedFormula[];
  localConstants: NotebookSeedConstant[];
  steps: NotebookSeedStep[];
};
