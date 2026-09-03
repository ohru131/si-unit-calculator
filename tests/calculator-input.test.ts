import { describe, expect, it } from "vitest";

import { evaluateCalculatorInput, previewCalculatorInput } from "@/lib/calculator-input";
import { formatQuantity, type SavedConstant } from "@/lib/units";

const constants: SavedConstant[] = [{ symbol: "W", expression: "3cm", quantity: { siValue: 0.03, dimension: [1, 0, 0, 0, 0, 0, 0] } }];

describe("evaluateCalculatorInput", () => {
  it("ふつうの式は定義なしで評価する", () => {
    const { quantity, definition } = evaluateCalculatorInput("5cm + 1mm", []);
    expect(definition).toBeNull();
    expect(formatQuantity(quantity, "cm", "en")).toBe("5.1 cm");
  });

  // 定数定義は「右辺の値を返すが保存はしない」。保存は = を押したときだけの副作用として
  // 呼び出し側が行うので、リアルタイム表示から呼んでも定数表を汚さない。
  it("定数定義は右辺の値と定義を返す", () => {
    const { quantity, definition } = evaluateCalculatorInput("W = 3cm", []);
    expect(definition).toEqual({ symbol: "W", expression: "3cm" });
    expect(formatQuantity(quantity, "cm", "en")).toBe("3 cm");
  });

  // 定数名はASCII限定ではない（mₒ や α でも定義できる）。ここをエンジンと別の正規表現に
  // していたために、Unicodeの記号で定義できない不具合が過去にあった。
  it("Unicodeの記号でも定数定義として扱う", () => {
    expect(evaluateCalculatorInput("mₒ = 200g", []).definition).toEqual({ symbol: "mₒ", expression: "200g" });
    expect(evaluateCalculatorInput("α = 2", []).definition).toEqual({ symbol: "α", expression: "2" });
  });

  it("既存の定数を参照できる", () => {
    expect(formatQuantity(evaluateCalculatorInput("W * 2", constants).quantity, "cm", "en")).toBe("6 cm");
  });

  it("評価できない入力は例外を投げる", () => {
    expect(() => evaluateCalculatorInput("5cm +", [])).toThrow();
  });
});

describe("previewCalculatorInput", () => {
  it("計算できる入力はその値を返す", () => {
    expect(formatQuantity(previewCalculatorInput("2m*3", [])!, "m", "en")).toBe("6 m");
  });

  // 打っている途中の式でエラーを出さないための入り口。null を返すだけで例外にしない。
  it("入力途中・空欄では null を返す", () => {
    expect(previewCalculatorInput("", [])).toBeNull();
    expect(previewCalculatorInput("   ", [])).toBeNull();
    expect(previewCalculatorInput("5cm +", [])).toBeNull();
    expect(previewCalculatorInput("5cm + 1kg", [])).toBeNull();
  });

  it("定数定義も = を押す前に値を出せる", () => {
    expect(formatQuantity(previewCalculatorInput("W = 3cm", [])!, "cm", "en")).toBe("3 cm");
  });
});
