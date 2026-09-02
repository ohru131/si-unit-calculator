import { describe, expect, it } from "vitest";

import { APP_LANGUAGES } from "../lib/i18n";
import { UNIT_ERROR_CODES, UnitError, unitErrorMessage, type UnitErrorCode } from "../lib/unit-errors";
import { evaluateExpression } from "../lib/units";

// UNIT_ERROR_MESSAGESそのものはunit-errors.ts内に閉じているので、直接importできない。
// ここでは「その言語カタログが全コードで実際にメッセージを返せるか」を通じて網羅性を確認する。
function messagesFor(language: (typeof APP_LANGUAGES)[number]): Record<UnitErrorCode, string> {
  const result = {} as Record<UnitErrorCode, string>;
  for (const code of UNIT_ERROR_CODES) {
    const error = new UnitError(code, { symbol: "x", input: "x", name: "x", character: "x", count: 1, targetUnit: "x" });
    result[code] = unitErrorMessage(error, language) ?? "";
  }
  return result;
}

describe("UnitErrorの言語対応", () => {
  it("未対応の単位を含む式を評価するとUnitErrorが投げられ、言語ごとに正しいメッセージへ翻訳される", () => {
    let caught: unknown;
    try {
      evaluateExpression("5xyz");
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(UnitError);
    const error = caught as UnitError;
    expect(error.code).toBe("unsupportedUnit");
    expect(unitErrorMessage(error, "ja")).toBe("未対応の単位「xyz」です。");
    expect(unitErrorMessage(error, "en")).toBe('Unsupported unit "xyz".');
  });

  it("パラメータが正しく埋め込まれる（自作関数の引数エラー）", () => {
    let caught: unknown;
    try {
      evaluateExpression("circleArea()", [], [{ name: "circleArea", parameters: ["r"], expression: "pi × r^2" }]);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(UnitError);
    const error = caught as UnitError;
    expect(error.code).toBe("customFunctionArgumentCountMismatch");
    expect(error.params).toEqual({ name: "circleArea", count: 1 });
    expect(unitErrorMessage(error, "ja")).toBe("自作関数「circleArea」は1個の引数を必要とします。");
    expect(unitErrorMessage(error, "en")).toBe('Custom function "circleArea" requires 1 argument(s).');
  });

  it("次元不一致のエラーでも記号がメッセージに埋め込まれる", () => {
    let caught: unknown;
    try {
      evaluateExpression("1m + 1s");
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(UnitError);
    const error = caught as UnitError;
    expect(error.code).toBe("dimensionMismatchAddSubtract");
    expect(unitErrorMessage(error, "ja")).toBe("加算・減算できるのは同じ次元の値だけです。");
    expect(unitErrorMessage(error, "en")).toBe("Only values with the same dimension can be added or subtracted.");
  });

  it("UnitError以外はunitErrorMessageがundefinedを返す（既存のcause.messageフォールバックを壊さない）", () => {
    expect(unitErrorMessage(new Error("x"), "en")).toBeUndefined();
    expect(unitErrorMessage(new Error("x"), "ja")).toBeUndefined();
    expect(unitErrorMessage("plain string", "en")).toBeUndefined();
    expect(unitErrorMessage(undefined, "en")).toBeUndefined();
  });

  it("UnitErrorはErrorのインスタンスなので既存の instanceof Error 判定を引き続き満たす", () => {
    const error = new UnitError("divideByZero");
    expect(error instanceof Error).toBe(true);
    // Error.message は常に英語（表示側が言語を解決できない場合のフォールバック用）
    expect(error.message).toBe("Cannot divide by zero.");
  });

  it("UNIT_ERROR_MESSAGESの全言語がUnitErrorCodeの全コードを網羅している", () => {
    for (const language of APP_LANGUAGES) {
      const messages = messagesFor(language);
      for (const code of UNIT_ERROR_CODES) {
        expect(typeof messages[code]).toBe("string");
        expect(messages[code].length).toBeGreaterThan(0);
      }
    }
  });
});
