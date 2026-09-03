import { describe, expect, it } from "vitest";

import { notebookFormulaRows } from "@/lib/notebook-formula-rows";

describe("notebookFormulaRows", () => {
  it("formulasがあるときはそれをそのまま行にする", () => {
    const formulas = [{ id: "f1", explanation: "速さは道のり÷時間", latex: "v = \\dfrac{d}{t}" }];
    const rows = notebookFormulaRows(formulas, [{ id: "s1", formulaLatex: "d = vt" }]);
    expect(rows).toEqual(formulas);
    // 参照は切っておく（編集画面のstateがノート本体を直接書き換えないようにするため）。
    expect(rows[0]).not.toBe(formulas[0]);
  });

  // プリセット112件のうち108件はformulasを持たず、手順のformulaLatexだけで数式を出している。
  // 編集画面がformulasしか見ていなかったため、運動方程式のような「数式だけのノート」は
  // 数式の解説欄が空で、そこから数式を編集できなかった。
  it("formulasが空なら手順のformulaLatexを説明文なしの行として拾う", () => {
    const rows = notebookFormulaRows([], [
      { id: "s1", formulaLatex: "F = ma" },
      { id: "s2" },
      { id: "s3", formulaLatex: "K = \\dfrac{1}{2}mv^2" },
    ]);
    expect(rows).toEqual([
      { id: "formula-from-s1", explanation: "", latex: "F = ma" },
      { id: "formula-from-s3", explanation: "", latex: "K = \\dfrac{1}{2}mv^2" },
    ]);
  });

  it("空白だけのformulaLatexは行にしない", () => {
    expect(notebookFormulaRows([], [{ id: "s1", formulaLatex: "   " }])).toEqual([]);
  });

  it("どちらも無ければ空", () => {
    expect(notebookFormulaRows([], [{ id: "s1" }])).toEqual([]);
  });
});
