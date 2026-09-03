/** 編集画面の「数式の解説」1行ぶん。説明文は任意で、数式（LaTeX）だけの行も成立する。 */
export type NotebookFormulaRow = { id: string; explanation: string; latex: string };

type StepWithFormula = { id: string; formulaLatex?: string };

/**
 * 編集画面の「数式の解説」に出す行を組み立てる。
 *
 * プリセットの大半（108/112件）は formulas を持たず、各手順の formulaLatex だけで数式を
 * 表示している。編集画面が formulas しか見ていなかったため、運動方程式のような
 * 「数式だけで解説文が無いノート」は数式の解説欄が空で、そこから数式を編集できなかった。
 * formulas が空のときは手順の formulaLatex を説明文なしの行として拾い上げ、どちらの形の
 * ノートも同じ1箇所で編集できるようにする。
 */
export function notebookFormulaRows(formulas: NotebookFormulaRow[], steps: StepWithFormula[]): NotebookFormulaRow[] {
  if (formulas.length) return formulas.map((formula) => ({ ...formula }));
  return steps
    .filter((step) => step.formulaLatex?.trim())
    .map((step) => ({ id: `formula-from-${step.id}`, explanation: "", latex: step.formulaLatex!.trim() }));
}
