import { describe, expect, it } from "vitest";

import { type CalculationNoteStep, type NotebookLocalConstant } from "../lib/calculator-store";
import {
  getLocalConstantFieldSuggestions,
  getStepFieldSuggestions,
  insertConstantSymbol,
  mapCombinedSelectionToExpressionRange,
} from "../lib/notebook-constant-suggestions";
import { type SavedConstant } from "../lib/units";

const dimensionless = [0, 0, 0, 0, 0, 0, 0] as [number, number, number, number, number, number, number];

function localConstant(symbol: string, expression: string, extra: Partial<NotebookLocalConstant> = {}): NotebookLocalConstant {
  return { id: `local-${symbol}`, symbol, expression, ...extra };
}

function globalConstant(symbol: string): SavedConstant {
  return { symbol, expression: "1", quantity: { siValue: 1, dimension: dimensionless }, createdAt: "" };
}

function step(expression: string, resultSymbol?: string): CalculationNoteStep {
  return { id: `step-${expression}-${resultSymbol ?? ""}`, title: "", expression, targetUnit: "", resultSymbol };
}

describe("ローカル定数フィールドの挿入候補", () => {
  it("自分より前の定数だけを、グローバル定数と合わせて返す（自分自身・後の定数は含めない）", () => {
    const locals = [localConstant("a", "1m"), localConstant("b", "2m"), localConstant("c", "3m")];
    const chips = getLocalConstantFieldSuggestions(locals, [globalConstant("g")], 1);
    expect(chips).toEqual(["a", "g"]);
  });

  it("先頭（index=0）では自分より前の定数が無いのでグローバル定数のみ", () => {
    const locals = [localConstant("a", "1m"), localConstant("b", "2m")];
    const chips = getLocalConstantFieldSuggestions(locals, [globalConstant("g")], 0);
    expect(chips).toEqual(["g"]);
  });

  it("記号や式が空（未入力）の行はスキップする", () => {
    const locals = [localConstant("a", "1m"), localConstant("", "2m"), localConstant("b", "")];
    const chips = getLocalConstantFieldSuggestions(locals, [], 3);
    expect(chips).toEqual(["a"]);
  });

  it("Unicodeの下付き文字の記号もそのまま候補になる（記号自体が識別子なので変換しない）", () => {
    const locals = [localConstant("mₒ", "200g"), localConstant("nₜ", "5")];
    expect(getLocalConstantFieldSuggestions(locals, [], 2)).toEqual(["mₒ", "nₜ"]);
  });

  it("ローカル定数とグローバル定数が同じ記号のときは重複させない（ローカル優先）", () => {
    const locals = [localConstant("g", "9.8m/s^2")];
    const chips = getLocalConstantFieldSuggestions(locals, [globalConstant("g")], 1);
    expect(chips).toEqual(["g"]);
  });
});

describe("手順フィールドの挿入候補", () => {
  it("ローカル定数・グローバル定数・自分より前の手順の結果記号をこの順で返す", () => {
    const locals = [localConstant("a", "1m")];
    const globals = [globalConstant("g")];
    const steps = [step("a*2", "s1"), step("s1*3")];
    const chips = getStepFieldSuggestions(locals, globals, steps, 1);
    expect(chips).toEqual(["a", "g", "s1"]);
  });

  it("自分自身・後の手順の記号は含めない（前方参照のみ）", () => {
    const steps = [step("1m", "first"), step("first*2", "second"), step("second*3", "third")];
    const chips = getStepFieldSuggestions([], [], steps, 1);
    expect(chips).toEqual(["first"]);
  });

  it("resultSymbolが無い手順は notebookStepSymbol の s(index+1) にフォールバックする", () => {
    const steps = [step("1m"), step("s1*2")];
    const chips = getStepFieldSuggestions([], [], steps, 1);
    expect(chips).toEqual(["s1"]);
  });

  it("式が空の手順（未入力）は参照できないので候補から外す", () => {
    const steps = [step(""), step("s1*2")];
    const chips = getStepFieldSuggestions([], [], steps, 1);
    expect(chips).toEqual([]);
  });

  it("全てのローカル定数が対象になる（手順は定義順制約が無いため後ろの定数も含む）", () => {
    const locals = [localConstant("a", "1m"), localConstant("b", "2m")];
    const chips = getStepFieldSuggestions(locals, [], [step("a*b")], 0);
    expect(chips).toEqual(["a", "b"]);
  });
});

describe("結合文字列（name=expression）のキャレット→expression範囲への変換", () => {
  it("名前が無いとき（unnamed）は結合文字列そのものがexpressionなので、そのままのオフセット", () => {
    expect(mapCombinedSelectionToExpressionRange("", "5m+3m", 2, 2)).toEqual({ start: 2, end: 2 });
  });

  it("名前ありのとき、'name='の長さ分だけ差し引く", () => {
    // "v=5m+3m" で combined 中の位置4（"v=5m|+3m"）はexpression中の位置2（"5m|+3m"）
    expect(mapCombinedSelectionToExpressionRange("v", "5m+3m", 4, 4)).toEqual({ start: 2, end: 2 });
  });

  it("選択範囲（レンジ選択）もそれぞれ変換する", () => {
    expect(mapCombinedSelectionToExpressionRange("v0", "5m+3m", 3, 5)).toEqual({ start: 0, end: 2 });
  });

  it("キャレットが名前部分（'='より前）にあるときはexpressionの先頭（0）へ丸める", () => {
    expect(mapCombinedSelectionToExpressionRange("v0", "5m+3m", 1, 1)).toEqual({ start: 0, end: 0 });
  });

  it("末尾より後ろの値は結合文字列の末尾（=expression末尾）へ丸める", () => {
    expect(mapCombinedSelectionToExpressionRange("v", "5m", 999, 999)).toEqual({ start: 2, end: 2 });
  });
});

describe("記号の挿入（insertConstantSymbol）", () => {
  it("末尾追加ではなく、キャレット位置に挿入する（末尾に付けるのが不満の原因だったため）", () => {
    // "v=5m+3m" のキャレットが "5m|+3m" の位置（combined index 4）にあるときに mₒ を挟む
    const result = insertConstantSymbol("v", "5m+3m", 4, 4, "mₒ");
    expect(result.expression).toBe("5mmₒ+3m");
  });

  it("選択範囲があれば置き換える", () => {
    // "v0=5m+3m" の "5m" 部分（combined index 3..5）を選択して mₒ を挿入
    const result = insertConstantSymbol("v0", "5m+3m", 3, 5, "mₒ");
    expect(result.expression).toBe("mₒ+3m");
  });

  it("挿入後のキャレットは挿入した記号の直後（続けて入力できる位置）を指す", () => {
    const result = insertConstantSymbol("v", "5m+3m", 4, 4, "mₒ");
    // "v=" (2文字) + "5m" (2文字) + "mₒ" (2文字) = 6
    expect(result.combinedCaret).toBe(6);
    expect(`v=${result.expression}`.slice(0, result.combinedCaret).endsWith("mₒ")).toBe(true);
  });

  it("名前が無い（unnamed）フィールドでもキャレット位置に正しく挿入する", () => {
    const result = insertConstantSymbol("", "5m+3m", 2, 2, "nₜ");
    expect(result.expression).toBe("5mnₜ+3m");
    expect(result.combinedCaret).toBe(4);
  });

  it("空の式へ挿入すると記号だけになり、キャレットはその直後", () => {
    const result = insertConstantSymbol("v", "", 2, 2, "nₜ");
    expect(result.expression).toBe("nₜ");
    expect(result.combinedCaret).toBe(4);
  });
});
