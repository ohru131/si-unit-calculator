import { describe, expect, it } from "vitest";

import { MATH_FUNCTION_KEYS } from "@/lib/math-functions";
import { backspaceInField, insertKeypadText, moveCaretInField } from "@/lib/notebook-keypad";
import { evaluateExpression } from "@/lib/units";

describe("MATH_FUNCTION_KEYS", () => {
  it("lists functions with their opening paren and the two constants", () => {
    const functions = MATH_FUNCTION_KEYS.filter((item) => item.endsWith("("));
    expect(functions).toContain("sqrt(");
    expect(functions).toContain("sin(");
    expect(MATH_FUNCTION_KEYS).toContain("π");
    expect(MATH_FUNCTION_KEYS).toContain("e");
    expect(MATH_FUNCTION_KEYS).not.toContain("^");
  });

  it("every entry evaluates in the unit engine once an argument is supplied", () => {
    for (const item of MATH_FUNCTION_KEYS) {
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

describe("moveCaretInField", () => {
  it("moves within the expression part and clamps at both ends", () => {
    expect(moveCaretInField("m", "5kg", 3, 3, 1)).toEqual({ start: 4, end: 4 });
    expect(moveCaretInField("m", "5kg", 5, 5, 1)).toEqual({ start: 5, end: 5 });
    expect(moveCaretInField("m", "5kg", 2, 2, -1)).toEqual({ start: 2, end: 2 });
  });

  it("collapses a selection toward the direction of movement", () => {
    expect(moveCaretInField("m", "5kg", 2, 4, -1)).toEqual({ start: 2, end: 2 });
    expect(moveCaretInField("m", "5kg", 2, 4, 1)).toEqual({ start: 5, end: 5 });
  });

  it("never enters the name part", () => {
    expect(moveCaretInField("mass", "5kg", 5, 5, -1)).toEqual({ start: 5, end: 5 });
  });
});
