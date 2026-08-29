import { describe, expect, it } from "vitest";

import { evaluateNoteSteps, noteStepSymbol, resolveNoteStepExpression } from "../lib/calculation-note";
import type { CalculationNoteStep } from "../lib/calculator-store";
import { evaluateExpression } from "../lib/units";

const step = (expression: string, targetUnit = ""): CalculationNoteStep => ({
  id: expression,
  title: "",
  expression,
  targetUnit,
});

describe("計算ノートの手順評価", () => {
  it("各手順をs1、s2の順に計算し、後続の手順から参照できる", () => {
    const results = evaluateNoteSteps([step("100N"), step("0.01m^2"), step("s1 ÷ s2")]);
    expect(results.map((item) => item.symbol)).toEqual(["s1", "s2", "s3"]);
    expect(results[2].error).toBeNull();
    expect(results[2].quantity?.siValue).toBeCloseTo(10000);
  });

  it("保存済みの定数・自作関数も手順の計算に使える", () => {
    const results = evaluateNoteSteps(
      [step("W × H")],
      [
        { symbol: "W", expression: "3cm", quantity: { siValue: 0.03, dimension: [1, 0, 0, 0, 0, 0, 0] }, createdAt: "" },
        { symbol: "H", expression: "20mm", quantity: { siValue: 0.02, dimension: [1, 0, 0, 0, 0, 0, 0] }, createdAt: "" },
      ],
    );
    expect(results[0].quantity?.siValue).toBeCloseTo(0.0006);
  });

  it("計算できない手順の結果は後続の手順から参照できず、はっきりエラーになる", () => {
    const results = evaluateNoteSteps([step("1cm + 1kg"), step(`${noteStepSymbol(0)} + 1m`)]);
    expect(results[0].error).not.toBeNull();
    expect(results[0].quantity).toBeNull();
    expect(results[1].error).not.toBeNull();
  });

  it("式が空の手順は結果もエラーも出さない", () => {
    const results = evaluateNoteSteps([step("")]);
    expect(results[0].quantity).toBeNull();
    expect(results[0].error).toBeNull();
  });
});

describe("手順参照を含む式の展開", () => {
  it("s1・s2への参照を前の手順の式へ再帰的に展開し、他画面でも自己完結して評価できる", () => {
    const steps = [step("100N"), step("0.01m^2"), step("s1 ÷ s2")];
    const expanded = resolveNoteStepExpression(steps, 2);
    expect(expanded).toBe("(100N) ÷ (0.01m^2)");
    expect(evaluateExpression(expanded).siValue).toBeCloseTo(10000);
  });

  it("前方参照や存在しない手順番号はそのまま残し、参照を含まない式は変更しない", () => {
    const steps = [step("s2 + 1m"), step("2m")];
    expect(resolveNoteStepExpression(steps, 0)).toBe("s2 + 1m");
    expect(resolveNoteStepExpression(steps, 1)).toBe("2m");
  });
});
