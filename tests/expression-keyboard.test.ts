import { describe, expect, it } from "vitest";

import { ALPHABET_ROWS, EXPRESSION_KEYS, EXPRESSION_KEY_COLUMNS, POWER_KEYS, PREFIX_KEYS, SHIFT_KEY } from "@/lib/expression-keyboard";
import { evaluateExpression } from "@/lib/units";

describe("EXPRESSION_KEYS", () => {
  it("is a full 5-column grid with the calculator layout", () => {
    expect(EXPRESSION_KEYS.length % EXPRESSION_KEY_COLUMNS).toBe(0);
    expect(EXPRESSION_KEYS.slice(0, 5)).toEqual(["7", "8", "9", "⌫", "AC"]);
    expect(EXPRESSION_KEYS.slice(15)).toEqual(["0", ".", "(", ")", "="]);
    for (const key of ["+", "-", "×", "÷"]) expect(EXPRESSION_KEYS).toContain(key);
  });
});

describe("POWER_KEYS", () => {
  it("inserts text the engine evaluates", () => {
    expect(evaluateExpression("3²").siValue).toBe(9);
    expect(evaluateExpression("2³").siValue).toBe(8);
    expect(evaluateExpression("2^4").siValue).toBe(16);
    expect(evaluateExpression("3×10^2").siValue).toBe(300);
    expect(POWER_KEYS.map((key) => key.insert)).toEqual(["²", "³", "^", "×10^"]);
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
