import type { LocalizedText } from "../i18n";
import type { PresetRegionalDefaultKind } from "../preset-regional-defaults";

export type PresetNotebookCategory = {
  id: string;
  label: LocalizedText;
  /** 親カテゴリのid。未設定なら最上位（大分類）として扱う。 */
  parentId?: string;
};

export type NotebookSeedConstant = {
  /** 数式（formulaLatex）の変数と同じ記号にする（下付き文字・ギリシャ文字も識別子として使えるため、表示用の別名は不要）。 */
  symbol: string;
  expression: string;
  /**
   * 地域依存の既定値。妥当な値が地域によって全く違うもの（電気代・燃料単価のような金額、
   * 商用電源の電圧・ブレーカーの定格電流）だけ指定する。指定すると投入時に端末の地域に
   * 応じた式へ差し替わり、expression は地域が判別できなかったときのフォールバックになる。
   */
  regionalDefault?: PresetRegionalDefaultKind;
};
export type NotebookSeedStep = {
  title: LocalizedText;
  expression: string;
  targetUnit: string;
  /** 見やすい表示用のLaTeX数式。省略時は式（expression）をそのまま表示する。 */
  formulaLatex?: string;
  /** 結果の入力式欄に「symbol=expression」の形で表示するための名前（例："v"）。省略時は式のみ表示する。 */
  resultSymbol?: string;
};
/** 「説明文＋数式」のペア。手順（steps）の計算結果とは独立に、複数個並べて解説できる。 */
export type NotebookSeedFormula = {
  explanation: LocalizedText;
  latex: string;
};
export type NotebookSeed = {
  title: LocalizedText;
  description: LocalizedText;
  /** 解説＋数式のペア一覧。省略時は各手順のformulaLatexをそのまま「数式」欄に並べる（従来どおり）。 */
  formulas?: NotebookSeedFormula[];
  localConstants: NotebookSeedConstant[];
  steps: NotebookSeedStep[];
};
