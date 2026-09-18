import { describe, expect, it } from "vitest";

import { NOTEBOOK_KEYPAD_COLUMNS, NOTEBOOK_KEYPAD_FUNCTIONS, NOTEBOOK_KEYPAD_KEYS, backspaceInField, insertKeypadText } from "@/lib/notebook-keypad";
import { evaluateExpression } from "@/lib/units";

describe("NOTEBOOK_KEYPAD_KEYS", () => {
  it("is a full 5-column grid with every digit, the decimal point and the four operators", () => {
    expect(NOTEBOOK_KEYPAD_KEYS.length % NOTEBOOK_KEYPAD_COLUMNS).toBe(0);
    const inserts = NOTEBOOK_KEYPAD_KEYS.flatMap((key) => ("insert" in key ? [key.insert] : []));
    for (const digit of "0123456789.") expect(inserts).toContain(digit);
    for (const operator of ["+", "-", "×", "÷", "(", ")", "^"]) expect(inserts).toContain(operator);
    expect(NOTEBOOK_KEYPAD_KEYS.filter((key) => "action" in key && key.action === "backspace")).toHaveLength(1);
  });

  it("keeps the same digit positions as the calculator keypad", () => {
    const labels = NOTEBOOK_KEYPAD_KEYS.map((key) => key.label);
    expect(labels.slice(0, 3)).toEqual(["7", "8", "9"]);
    expect(labels.slice(5, 8)).toEqual(["4", "5", "6"]);
    expect(labels.slice(10, 13)).toEqual(["1", "2", "3"]);
    expect(labels.slice(15, 17)).toEqual(["0", "."]);
  });
});

describe("NOTEBOOK_KEYPAD_FUNCTIONS", () => {
  it("lists functions with their opening paren and the two constants", () => {
    const functions = NOTEBOOK_KEYPAD_FUNCTIONS.filter((item) => item.endsWith("("));
    expect(functions).toContain("sqrt(");
    expect(functions).toContain("sin(");
    expect(NOTEBOOK_KEYPAD_FUNCTIONS).toContain("π");
    expect(NOTEBOOK_KEYPAD_FUNCTIONS).toContain("e");
    expect(NOTEBOOK_KEYPAD_FUNCTIONS).not.toContain("^");
  });

  it("every entry evaluates in the unit engine once an argument is supplied", () => {
    for (const item of NOTEBOOK_KEYPAD_FUNCTIONS) {
      const expression = item.endsWith("(") ? (item === "atan2(" ? "atan2(1, 2)" : `${item}0.5)`) : item;
      expect(() => evaluateExpression(expression), expression).not.toThrow();
    }
  });
});

describe("insertKeypadText", () => {
  it("inserts at the caret inside the expression part", () => {
    // "m=5kg" のキャレット 3（"5" の直後）に "." を入れる
    expect(insertKeypadText("m", "5kg", 3, 3, ".")).toEqual({ expression: "5.kg", combinedCaret: 4 });
  });

  it("replaces a selected range", () => {
    // "v=10m/s" の "10" を選択して "2" を入れる
    expect(insertKeypadText("v", "10m/s", 2, 4, "2")).toEqual({ expression: "2m/s", combinedCaret: 3 });
  });

  it("clamps a caret inside the name to the start of the expression", () => {
    expect(insertKeypadText("mass", "5kg", 1, 1, "2")).toEqual({ expression: "25kg", combinedCaret: 6 });
  });

  it("works for unnamed steps", () => {
    expect(insertKeypadText("", "a*b", 3, 3, "^")).toEqual({ expression: "a*b^", combinedCaret: 4 });
  });
});

describe("backspaceInField", () => {
  it("deletes the character before the caret", () => {
    expect(backspaceInField("m", "5kg", 3, 3)).toEqual({ expression: "kg", combinedCaret: 2 });
  });

  it("deletes the selected range", () => {
    expect(backspaceInField("v", "10m/s", 2, 4)).toEqual({ expression: "m/s", combinedCaret: 2 });
  });

  it("does nothing at the start of the expression", () => {
    expect(backspaceInField("m", "5kg", 2, 2)).toBeNull();
    expect(backspaceInField("", "5kg", 0, 0)).toBeNull();
  });

  it("never deletes into the name", () => {
    // キャレットが名前の中（"m" の直後）にあっても、式の先頭に丸められて何も消さない
    expect(backspaceInField("mass", "5kg", 2, 2)).toBeNull();
  });

  it("falls back to deleting the last character when no selection was recorded beyond the end", () => {
    expect(backspaceInField("m", "5kg", 99, 99)).toEqual({ expression: "5k", combinedCaret: 4 });
  });
});
