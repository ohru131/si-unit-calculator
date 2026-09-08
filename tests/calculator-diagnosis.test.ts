import { describe, expect, it } from "vitest";

import { diagnoseCalculatorInput, isDiagnosableInputError } from "@/lib/calculator-input";
import { UnitError, unitErrorMessage } from "@/lib/unit-errors";
import { evaluateExpression } from "@/lib/units";

const diagnose = (input: string) => diagnoseCalculatorInput(input, []);

describe("diagnoseCalculatorInput", () => {
  it("計算できる式は量を返し、エラーは無い", () => {
    const { quantity, error } = diagnose("5cm + 1mm");
    expect(error).toBeNull();
    expect(quantity?.siValue).toBeCloseTo(0.051);
  });

  it("空の入力は量もエラーも無い（案内文を出す状態）", () => {
    expect(diagnose("   ")).toEqual({ quantity: null, error: null });
  });

  it("次元不一致は = を押す前でも診断として返る", () => {
    const { quantity, error } = diagnose("3m + 2kg");
    expect(quantity).toBeNull();
    expect(error).toBeInstanceOf(UnitError);
    expect(isDiagnosableInputError(error!)).toBe(true);
  });

  it("書きかけの式（末尾の演算子・閉じ括弧待ち）は診断として出さない", () => {
    for (const input of ["5cm +", "(5cm + 1mm", "sqrt(4m²", "3m ×"]) {
      const { error } = diagnose(input);
      expect(error, input).not.toBeNull();
      expect(isDiagnosableInputError(error!), input).toBe(false);
    }
  });

  it("使えない単位・ゼロ除算・引数の次元違いは診断として出す", () => {
    for (const input of ["5cm + 1mn", "10m / 0", "sin(3m)"]) {
      const { error } = diagnose(input);
      expect(error, input).not.toBeNull();
      expect(isDiagnosableInputError(error!), input).toBe(true);
    }
  });
});

describe("次元不一致のエラー文言", () => {
  const capture = (expression: string) => {
    try {
      evaluateExpression(expression, []);
    } catch (cause) {
      return cause as UnitError;
    }
    throw new Error("expected an error");
  };

  it("両辺の量の名前とSI表記を添える（長さ (m) と 質量 (kg)）", () => {
    const error = capture("3m + 2kg");
    expect(error.params).toMatchObject({ leftGroup: "length", leftDimension: "m", rightGroup: "mass", rightDimension: "kg" });
    expect(unitErrorMessage(error, "ja")).toBe("長さ (m) と 質量 (kg) は足し引きできません。加算・減算できるのは同じ次元の値だけです。");
    expect(unitErrorMessage(error, "en")).toBe("Cannot add or subtract Length (m) and Mass (kg). Only values with the same dimension can be combined.");
  });

  it("無次元の値との不一致は「無次元の値」と言う", () => {
    const error = capture("3m - 2");
    expect(error.params).toMatchObject({ rightGroup: "dimensionless" });
    expect(unitErrorMessage(error, "ja")).toContain("無次元の値");
    expect(unitErrorMessage(error, "en")).toContain("a dimensionless value");
  });

  it("グループ名が無い合成次元はSI表記だけで説明する", () => {
    const error = capture("3m*kg + 2s");
    expect(error.params).toMatchObject({ leftGroup: "", leftDimension: "m·kg" });
    expect(unitErrorMessage(error, "en")).toBe("Cannot add or subtract m·kg and Time (s). Only values with the same dimension can be combined.");
  });

  it("両辺の情報が無い旧形式のエラーは従来の一般文言に戻る", () => {
    const error = new UnitError("dimensionMismatchAddSubtract");
    expect(unitErrorMessage(error, "ja")).toBe("加算・減算できるのは同じ次元の値だけです。");
    for (const language of ["en", "es", "pt-BR", "de", "fr"] as const) {
      expect(unitErrorMessage(error, language)).not.toContain("${");
    }
  });

  it("6言語すべてで両辺の名前が埋まる", () => {
    const error = capture("3m + 2kg");
    for (const language of ["en", "ja", "es", "pt-BR", "de", "fr"] as const) {
      const message = unitErrorMessage(error, language)!;
      expect(message, language).toContain("(m)");
      expect(message, language).toContain("(kg)");
      expect(message, language).not.toContain("${");
    }
  });
});
