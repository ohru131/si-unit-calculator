import { describe, expect, it } from "vitest";

import { PRESET_NOTEBOOK_SEEDS } from "../lib/notebook-formulas";
import { evaluateNotebookSteps, formatNameValue, notebookStepSymbol, parseNameValue, resolveNotebookLocalConstants, trimResultSymbol } from "../lib/notebook-engine";
import { type NotebookLocalConstant } from "../lib/calculator-store";

function toLocalConstants(entries: { symbol: string; expression: string }[]): NotebookLocalConstant[] {
  return entries.map((entry, index) => ({ id: `local-${index}`, ...entry }));
}

describe("名前＝式の1行入力パース", () => {
  it("有効な名前=式を分割できる", () => {
    expect(parseNameValue("v0=5m/s")).toEqual({ name: "v0", value: "5m/s" });
  });

  it("=が無ければ全体を式として扱う（名前は空）", () => {
    expect(parseNameValue("5m/s")).toEqual({ name: "", value: "5m/s" });
  });

  it("数字始まりなど不正な名前は解析できず全体が式として残る", () => {
    expect(parseNameValue("1v=5m/s")).toEqual({ name: "", value: "1v=5m/s" });
  });

  it("formatNameValueはparseNameValueの逆変換になる", () => {
    expect(formatNameValue("v0", "5m/s")).toBe("v0=5m/s");
    expect(formatNameValue("", "5m/s")).toBe("5m/s");
  });

  it("下付き文字・ギリシャ文字を含む名前もparseNameValue/formatNameValueで往復できる", () => {
    expect(parseNameValue("mₒ=200g")).toEqual({ name: "mₒ", value: "200g" });
    expect(formatNameValue("mₒ", "200g")).toBe("mₒ=200g");
    expect(parseNameValue("θ₁=30deg")).toEqual({ name: "θ₁", value: "30deg" });
    expect(formatNameValue("θ₁", "30deg")).toBe("θ₁=30deg");
  });
});

describe("計算ノートのローカル定数解決", () => {
  it("後の行が前の行を参照できる（連鎖）", () => {
    const localConstants = toLocalConstants([
      { symbol: "b", expression: "100mm" },
      { symbol: "h", expression: "200mm" },
      { symbol: "Z", expression: "b*h^2/6" },
    ]);
    const { resolved, errors } = resolveNotebookLocalConstants(localConstants, []);
    expect(errors).toEqual({});
    const z = resolved.find((item) => item.symbol === "Z");
    expect(z?.quantity.siValue).toBeCloseTo(0.1 * 0.2 ** 2 / 6);
  });

  it("ローカル定数はグローバル定数と同名でも優先される（シャドーイング）", () => {
    const globalConstants = [{ symbol: "W", expression: "1m", quantity: { siValue: 1, dimension: [1, 0, 0, 0, 0, 0, 0] as [number, number, number, number, number, number, number] }, createdAt: "" }];
    const localConstants = toLocalConstants([{ symbol: "W", expression: "5m" }]);
    const { resolved } = resolveNotebookLocalConstants(localConstants, globalConstants);
    expect(resolved[0].quantity.siValue).toBe(5);
  });

  it("1行の失敗は他の行の計算を止めない", () => {
    const localConstants = toLocalConstants([
      { symbol: "b", expression: "100mm" },
      { symbol: "bad", expression: "notAUnit" },
      { symbol: "h", expression: "200mm" },
    ]);
    const { resolved, errors } = resolveNotebookLocalConstants(localConstants, []);
    expect(resolved.map((item) => item.symbol)).toEqual(["b", "h"]);
    expect(errors["local-1"]).toBeTruthy();
  });
});

describe("計算ノートのステップ評価", () => {
  const step = (expression: string, targetUnit = ""): { id: string; title: string; expression: string; targetUnit: string } => ({
    id: expression || "empty",
    title: "",
    expression,
    targetUnit,
  });

  it("表示単位に合わない場合はSI標準へフォールバックしてエラーを添える", () => {
    const results = evaluateNotebookSteps(
      [{ id: "step-1", title: "長さ", expression: "5m", targetUnit: "kg" }],
      [],
      [],
    );
    expect(results[0].error).toBeTruthy();
    expect(results[0].formatted).toContain("m");
  });

  it("式が空の場合はエラーを返す", () => {
    const results = evaluateNotebookSteps([{ id: "step-1", title: "空", expression: "", targetUnit: "" }], [], []);
    expect(results[0].error).toBeTruthy();
    expect(results[0].quantity).toBeUndefined();
  });

  it("各手順をs1、s2の順に計算し、後続の手順から参照できる（連鎖）", () => {
    const results = evaluateNotebookSteps([step("100N"), step("0.01m^2"), step("s1 ÷ s2")], [], []);
    expect(results.map((item) => item.symbol)).toEqual(["s1", "s2", "s3"]);
    expect(results[2].error).toBeUndefined();
    expect(results[2].quantity?.siValue).toBeCloseTo(10000);
  });

  it("計算できない手順の結果は後続の手順から参照できず、はっきりエラーになる", () => {
    const results = evaluateNotebookSteps([step("1cm + 1kg"), step(`${notebookStepSymbol(0)} + 1m`)], [], []);
    expect(results[0].error).toBeTruthy();
    expect(results[0].quantity).toBeUndefined();
    expect(results[1].error).toBeTruthy();
  });

  it("resultSymbolを設定すると、s1の代わりにその名前で結果と参照ができる（v = v0 + a*t 形式）", () => {
    const results = evaluateNotebookSteps(
      [
        { id: "s1", title: "v", expression: "v0+a*t", targetUnit: "", resultSymbol: "v" },
        { id: "s2", title: "v+1", expression: "v+1m/s", targetUnit: "" },
      ],
      [
        { symbol: "v0", expression: "5m/s", quantity: { siValue: 5, dimension: [1, 0, -1, 0, 0, 0, 0] as [number, number, number, number, number, number, number] }, createdAt: "" },
        { symbol: "a", expression: "2m/s^2", quantity: { siValue: 2, dimension: [1, 0, -2, 0, 0, 0, 0] as [number, number, number, number, number, number, number] }, createdAt: "" },
        { symbol: "t", expression: "3s", quantity: { siValue: 3, dimension: [0, 0, 1, 0, 0, 0, 0] as [number, number, number, number, number, number, number] }, createdAt: "" },
      ],
      [],
    );
    expect(results[0].symbol).toBe("v");
    expect(results[0].error).toBeUndefined();
    expect(results[0].quantity?.siValue).toBeCloseTo(11);
    // 後続の手順が resultSymbol（v）を availableConstants 経由で参照できることも確認する。
    expect(results[1].symbol).toBe("s2");
    expect(results[1].error).toBeUndefined();
    expect(results[1].quantity?.siValue).toBeCloseTo(12);
  });

  it("resultSymbolが省略されていれば従来通りs1、s2にフォールバックする", () => {
    const results = evaluateNotebookSteps([step("100N"), step("0.01m^2")], [], []);
    expect(results.map((item) => item.symbol)).toEqual(["s1", "s2"]);
  });

  it("resultSymbolが文字列でない壊れたデータでもs1にフォールバックし、実行時エラーにならない", () => {
    // 手編集されたJSONや旧データ由来で resultSymbol が文字列でない場合を想定。
    const malformedStep = { id: "step-1", title: "x", expression: "100N", targetUnit: "", resultSymbol: 123 as unknown as string };
    const results = evaluateNotebookSteps([malformedStep], [], []);
    expect(results[0].symbol).toBe("s1");
    expect(results[0].error).toBeUndefined();
  });

  it("trimResultSymbolはresultSymbolが数値やオブジェクトでも例外を投げず空文字を返す", () => {
    expect(trimResultSymbol({ resultSymbol: 0 as unknown as string })).toBe("");
    expect(trimResultSymbol({ resultSymbol: {} as unknown as string })).toBe("");
    expect(trimResultSymbol({ resultSymbol: undefined })).toBe("");
    expect(trimResultSymbol({ resultSymbol: " v " })).toBe("v");
  });
});

describe("材料力学プリセットの数値検証", () => {
  const seeds = PRESET_NOTEBOOK_SEEDS["mechanics-of-materials"];

  function computeSeed(title: string) {
    const seed = seeds.find((item) => item.title === title);
    if (!seed) throw new Error(`seed not found: ${title}`);
    const localConstants = toLocalConstants(seed.localConstants);
    const { resolved, errors } = resolveNotebookLocalConstants(localConstants, []);
    expect(errors).toEqual({});
    const steps = seed.steps.map((step, index) => ({ id: `step-${index}`, title: step.title, expression: step.expression, targetUnit: step.targetUnit }));
    return evaluateNotebookSteps(steps, resolved, []);
  }

  it("断面二次モーメント・断面係数", () => {
    const results = computeSeed("断面二次モーメント・断面係数（矩形断面）");
    expect(results[0].error).toBeUndefined();
    expect(results[1].error).toBeUndefined();
  });

  it("曲げ応力は7.5 MPa", () => {
    const [result] = computeSeed("曲げ応力（矩形断面の梁）");
    expect(result.quantity?.siValue).toBeCloseTo(7.5e6, 0);
    expect(result.formatted).toContain("7.5");
  });

  it("単純梁の最大たわみ・等分布荷重は約0.386mm", () => {
    const [result] = computeSeed("単純梁の最大たわみ（等分布荷重）");
    expect(result.quantity!.siValue * 1000).toBeCloseTo(0.386, 2);
  });

  it("単純梁の最大たわみ・集中荷重は約0.412mm", () => {
    const [result] = computeSeed("単純梁の最大たわみ（集中荷重）");
    expect(result.quantity!.siValue * 1000).toBeCloseTo(0.412, 2);
  });

  it("フックの法則は応力205MPa、ひずみ約4.878e-4", () => {
    const [stress, strain] = computeSeed("フックの法則（応力とひずみ）");
    expect(stress.quantity?.siValue).toBeCloseTo(205e6, 0);
    expect(strain.quantity?.siValue).toBeCloseTo(4.878e-4, 6);
  });

  it("せん断応力は40MPa", () => {
    const [result] = computeSeed("せん断応力");
    expect(result.quantity?.siValue).toBeCloseTo(40e6, 0);
  });

  it("オイラー座屈荷重は約1911kN", () => {
    const [result] = computeSeed("オイラー座屈荷重");
    expect(result.quantity!.siValue / 1000).toBeCloseTo(1911, 0);
  });
});
