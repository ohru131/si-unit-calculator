import { describe, expect, it } from "vitest";

import { localizedText } from "../lib/i18n";
import { PRESET_NOTEBOOK_SEEDS } from "../lib/notebook-formulas";
import { evaluateNotebookSteps, formatNameValue, notebookStepSymbol, parseNameValue, resolveNotebookLocalConstants, trimResultSymbol } from "../lib/notebook-engine";
import { type NotebookLocalConstant } from "../lib/calculator-store";

// テスト名・比較用の文字列はこのリポジトリの慣習に合わせて日本語（ja）を使う。
const ja = (text: { en: string; ja?: string }) => localizedText(text, "ja");

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
    const { resolved, errors } = resolveNotebookLocalConstants(localConstants, [], "ja");
    expect(errors).toEqual({});
    const z = resolved.find((item) => item.symbol === "Z");
    expect(z?.quantity.siValue).toBeCloseTo(0.1 * 0.2 ** 2 / 6);
  });

  it("ローカル定数はグローバル定数と同名でも優先される（シャドーイング）", () => {
    const globalConstants = [{ symbol: "W", expression: "1m", quantity: { siValue: 1, dimension: [1, 0, 0, 0, 0, 0, 0] as [number, number, number, number, number, number, number] }, createdAt: "" }];
    const localConstants = toLocalConstants([{ symbol: "W", expression: "5m" }]);
    const { resolved } = resolveNotebookLocalConstants(localConstants, globalConstants, "ja");
    expect(resolved[0].quantity.siValue).toBe(5);
  });

  it("1行の失敗は他の行の計算を止めない", () => {
    const localConstants = toLocalConstants([
      { symbol: "b", expression: "100mm" },
      { symbol: "bad", expression: "notAUnit" },
      { symbol: "h", expression: "200mm" },
    ]);
    const { resolved, errors } = resolveNotebookLocalConstants(localConstants, [], "ja");
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
      "ja",
      [],
    );
    expect(results[0].error).toBeTruthy();
    expect(results[0].formatted).toContain("m");
  });

  it("式が空の場合はエラーを返す", () => {
    const results = evaluateNotebookSteps([{ id: "step-1", title: "空", expression: "", targetUnit: "" }], [], "ja", []);
    expect(results[0].error).toBeTruthy();
    expect(results[0].quantity).toBeUndefined();
  });

  it("各手順をs1、s2の順に計算し、後続の手順から参照できる（連鎖）", () => {
    const results = evaluateNotebookSteps([step("100N"), step("0.01m^2"), step("s1 ÷ s2")], [], "ja", []);
    expect(results.map((item) => item.symbol)).toEqual(["s1", "s2", "s3"]);
    expect(results[2].error).toBeUndefined();
    expect(results[2].quantity?.siValue).toBeCloseTo(10000);
  });

  it("計算できない手順の結果は後続の手順から参照できず、はっきりエラーになる", () => {
    const results = evaluateNotebookSteps([step("1cm + 1kg"), step(`${notebookStepSymbol(0)} + 1m`)], [], "ja", []);
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
      "ja",
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
    const results = evaluateNotebookSteps([step("100N"), step("0.01m^2")], [], "ja", []);
    expect(results.map((item) => item.symbol)).toEqual(["s1", "s2"]);
  });

  it("resultSymbolが文字列でない壊れたデータでもs1にフォールバックし、実行時エラーにならない", () => {
    // 手編集されたJSONや旧データ由来で resultSymbol が文字列でない場合を想定。
    const malformedStep = { id: "step-1", title: "x", expression: "100N", targetUnit: "", resultSymbol: 123 as unknown as string };
    const results = evaluateNotebookSteps([malformedStep], [], "ja", []);
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

describe("はり・柱プリセットの数値検証", () => {
  const seeds = PRESET_NOTEBOOK_SEEDS["mechanics-of-materials"];

  function computeSeed(title: string) {
    const seed = seeds.find((item) => ja(item.title) === title);
    if (!seed) throw new Error(`seed not found: ${title}`);
    const localConstants = toLocalConstants(seed.localConstants);
    const { resolved, errors } = resolveNotebookLocalConstants(localConstants, [], "ja");
    expect(errors).toEqual({});
    // resultSymbolを渡さないと、後続手順が参照している記号（例: たわみのδ）が未定義になる。
    // PRESET_NOTEBOOK_SEEDSは結果記号を導出済みで、s3のような参照もその記号へ書き換わっているため、
    // アプリ本体と同じように記号ごと渡す必要がある。
    const steps = seed.steps.map((step, index) => ({ id: `step-${index}`, title: ja(step.title), expression: step.expression, targetUnit: step.targetUnit, resultSymbol: step.resultSymbol }));
    return evaluateNotebookSteps(steps, resolved, "ja", []);
  }

  // 既定値は「実在する材料セット × 実在するカタログ断面」で組んである。
  // 検定が通るか落ちるかが分かる値になっていることこそがこのカテゴリの価値なので、
  // 合否の境目（許容たわみとの比）まで含めて固定する。
  it("木造床根太は曲げは持つが、たわみで落ちる", () => {
    const [moment, stress, deflection, verdict] = computeSeed("木造床根太の検定（C24・45×195）");
    expect(moment.quantity!.siValue / 1000).toBeCloseTo(3.24, 2);
    // C24の曲げ強度24MPaに対して11.4MPaなので曲げは持つ。
    expect(stress.quantity!.siValue / 1e6).toBeCloseTo(11.36, 1);
    expect(deflection.quantity!.siValue * 1000).toBeCloseTo(14.3, 1);
    // 許容たわみL/300に対する比。1を超える＝たわみで不合格。
    expect(verdict.quantity!.siValue).toBeCloseTo(1.19, 2);
    expect(verdict.quantity!.siValue).toBeGreaterThan(1);
  });

  it("鋼製はりIPE 200はたわみ制限L/250をぎりぎり満たす", () => {
    const [, stress, deflection] = computeSeed("鋼製はり IPE 200（等分布荷重）");
    expect(stress.quantity!.siValue / 1e6).toBeCloseTo(161.08, 1);
    expect(deflection.quantity!.siValue * 1000).toBeCloseTo(19.94, 1);
    // L=5mなのでL/250=20mm。
    expect(deflection.quantity!.siValue).toBeLessThan(5 / 250);
  });

  it("片持ちはり・先端集中荷重のたわみは約0.581mm", () => {
    const [, , deflection] = computeSeed("片持ちはり・先端集中荷重（鋼の平鋼）");
    expect(deflection.quantity!.siValue * 1000).toBeCloseTo(0.581, 2);
  });

  it("片持ちはり・等分布荷重のたわみは約5.42mm", () => {
    const [, , deflection] = computeSeed("片持ちはり・等分布荷重");
    expect(deflection.quantity!.siValue * 1000).toBeCloseTo(5.42, 1);
  });

  it("オイラー座屈は細長比153で、座屈荷重は約75.9kN", () => {
    const [radius, slenderness, load] = computeSeed("オイラー座屈と細長比（φ60×5 鋼管）");
    expect(radius.quantity!.siValue * 1000).toBeCloseTo(19.52, 1);
    // 細長比が大きい（100超）ので、オイラーの式が適用できる領域にある。
    expect(slenderness.quantity!.siValue).toBeCloseTo(153.65, 1);
    expect(slenderness.quantity!.siValue).toBeGreaterThan(100);
    expect(load.quantity!.siValue / 1000).toBeCloseTo(75.85, 1);
  });

  it("自重の線密度はIPE 200のカタログ値22.4kg/mに一致する", () => {
    const [mass] = computeSeed("はりの自重を等分布荷重に直す");
    expect(mass.quantity!.siValue).toBeCloseTo(22.4, 1);
  });

  it("矩形断面の最大せん断応力は平均の1.5倍", () => {
    const [result] = computeSeed("矩形断面はりのせん断応力");
    // V=12kN、断面50×150mm。平均F/A=1.6MPaの1.5倍。
    expect(result.quantity!.siValue / 1e6).toBeCloseTo(2.4, 2);
  });
});
