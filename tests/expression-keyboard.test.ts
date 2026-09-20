import { describe, expect, it } from "vitest";

import { ALPHABET_ROWS, EXPRESSION_CELLS, EXPRESSION_KEY_COLUMNS, MATH_CONSTANT_KEYS, POWER_KEYS, PREFIX_KEYS, SHIFT_KEY, type ExpressionKey } from "@/lib/expression-keyboard";
import { evaluateExpression } from "@/lib/units";

const keysOf = (cell: (typeof EXPRESSION_CELLS)[number]): ExpressionKey[] => ("split" in cell ? [...cell.split] : [cell.key]);
const allKeys = EXPRESSION_CELLS.flatMap(keysOf);
const labels = allKeys.map((key) => key.label);

describe("EXPRESSION_CELLS", () => {
  it("is a full 5-column grid with the calculator layout", () => {
    expect(EXPRESSION_CELLS.length % EXPRESSION_KEY_COLUMNS).toBe(0);
    expect(EXPRESSION_KEY_COLUMNS).toBe(5);
    expect(EXPRESSION_CELLS.slice(0, 5).flatMap(keysOf).map((key) => key.label)).toEqual(["7", "8", "9", "⌫", "AC"]);
    expect(EXPRESSION_CELLS.slice(15).flatMap(keysOf).map((key) => key.label)).toEqual(["0", ".", "(", ")", "-", "+"]);
  });

  it("keeps the four operators together as a 2×2 block", () => {
    // `+` だけが離れて演算子の塊が割れると押しにくい（利用者から指摘された）。
    // 3段目と4段目の右2列＝ ÷ × / − + が隣り合っていること。
    const row3 = EXPRESSION_CELLS.slice(10, 15).flatMap(keysOf).map((key) => key.label);
    const row4 = EXPRESSION_CELLS.slice(15).flatMap(keysOf).map((key) => key.label);
    expect(row3.slice(-2)).toEqual(["÷", "×"]);
    expect(row4.slice(-2)).toEqual(["-", "+"]);
  });

  it("has no equals key（逐次計算なので入力欄の `=` だけで足りる）", () => {
    expect(labels).not.toContain("=");
  });

  it("moves the caret from the keypad instead of the tool row", () => {
    const carets = allKeys.filter((key) => key.action);
    expect(carets.map((key) => key.action)).toEqual(["caretLeft", "caretRight"]);
    for (const key of carets) expect(key.insert).toBeUndefined();
  });

  it("puts the two brackets in one shared cell", () => {
    const split = EXPRESSION_CELLS.filter((cell) => "split" in cell);
    expect(split).toHaveLength(1);
    expect(keysOf(split[0]).map((key) => key.label)).toEqual(["(", ")"]);
  });
});

describe("POWER_KEYS", () => {
  it("inserts text the engine evaluates", () => {
    // `^`・`×10ⁿ` はキーパッド本体ではなくこのパネル側（本体へ入れると演算子の 2×2 が割れる）。
    // `!`（階乗）も**英字パネルではなくここ**——押した時点で値が変わる「計算するキー」なので、
    // 打った文字がそのまま残る英字に混ぜると何が起きるか分からない。
    expect(POWER_KEYS.map((key) => key.insert)).toEqual(["²", "³", "^", "×10^", "!"]);
    expect(evaluateExpression("3²").siValue).toBe(9);
    expect(evaluateExpression("2³").siValue).toBe(8);
    expect(evaluateExpression("2^4").siValue).toBe(16);
    expect(evaluateExpression("3×10^2").siValue).toBe(300);
    expect(evaluateExpression("5!").siValue).toBe(120);
  });
});

describe("ALPHABET_ROWS", () => {
  it("keeps `=` for constant definitions but not the factorial key", () => {
    const keys = ALPHABET_ROWS.flat();
    // `W = 3cm` の `=` はキーパッド本体にも他のパネルにも無いので、ここが唯一の入口。
    expect(keys).toContain("=");
    expect(keys).not.toContain("!");
  });
});

describe("MATH_CONSTANT_KEYS", () => {
  it("are values the engine reads as constants", () => {
    expect(MATH_CONSTANT_KEYS).toEqual(["π", "e"]);
    expect(evaluateExpression("π").siValue).toBeCloseTo(Math.PI, 10);
    expect(evaluateExpression("e").siValue).toBeCloseTo(Math.E, 10);
  });
});

describe("ALPHABET_ROWS", () => {
  it("covers every lowercase ASCII letter exactly once plus shift and underscore", () => {
    const keys = ALPHABET_ROWS.flat();
    const letters = keys.filter((key) => /^[a-z]$/.test(key));
    expect(new Set(letters).size).toBe(26);
    expect(keys).toContain(SHIFT_KEY);
    expect(keys).toContain("_");
  });
});

describe("PREFIX_KEYS", () => {
  it("are SI prefixes the engine resolves in front of a unit", () => {
    for (const prefix of PREFIX_KEYS) expect(() => evaluateExpression(`1${prefix}m`)).not.toThrow();
  });
});
