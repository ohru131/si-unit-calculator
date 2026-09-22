import { describe, expect, it } from "vitest";

import { diagnoseCalculatorInput, evaluateCalculatorInput, isDiagnosableInputError, previewCalculatorInput } from "@/lib/calculator-input";
import { UnitError } from "@/lib/unit-errors";
import { formatQuantity, type SavedConstant } from "@/lib/units";

const constants: SavedConstant[] = [{ symbol: "W", expression: "3cm", quantity: { siValue: 0.03, dimension: [1, 0, 0, 0, 0, 0, 0] }, createdAt: new Date(0).toISOString() }];

describe("evaluateCalculatorInput", () => {
  it("ふつうの式は定義なしで評価する", () => {
    const { quantity, definition } = evaluateCalculatorInput("5cm + 1mm", []);
    expect(definition).toBeNull();
    expect(formatQuantity(quantity, "cm", "en")).toBe("5.1 cm");
  });

  // 定数定義は「右辺の値を返すが保存はしない」。保存は = を押したときだけの副作用として
  // 呼び出し側が行うので、リアルタイム表示から呼んでも定数表を汚さない。
  it("定数定義は右辺の値と定義を返す", () => {
    const { quantity, definition } = evaluateCalculatorInput("R = 4.7kΩ", []);
    expect(definition).toEqual({ symbol: "R", expression: "4.7kΩ" });
    expect(formatQuantity(quantity, "Ω", "en")).toBe("4700 Ω");
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
    expect(formatQuantity(previewCalculatorInput("R = 4.7kΩ", [])!, "Ω", "en")).toBe("4700 Ω");
  });
});

describe("グローバル定数の名前と単位記号の衝突", () => {
  // 識別子の解決は単位より先なので、`W = 3cm` を許すと裸の `W` は 3cm・数値の直後の `W`（`5W`）
  // はワットになり、**エラーにならないまま同じ文字が2つの意味を持つ**（実機で指摘された）。
  it("単位記号そのものは定数名にできない", () => {
    expect(() => evaluateCalculatorInput("W = 3cm", [])).toThrowError(UnitError);
    try {
      evaluateCalculatorInput("W = 3cm", []);
    } catch (cause) {
      expect((cause as UnitError).code).toBe("constantSymbolIsUnit");
      expect((cause as UnitError).params.symbol).toBe("W");
    }
  });

  it("接頭辞で分解できる記号も弾く（式では単位として読まれるため）", () => {
    expect(() => evaluateCalculatorInput("ms = 2", [])).toThrowError(UnitError);
    expect(() => evaluateCalculatorInput("km = 2", [])).toThrowError(UnitError);
  });

  it("単位として解決されない名前は従来どおり保存できる", () => {
    expect(evaluateCalculatorInput("R1 = 4.7kΩ", []).definition).toEqual({ symbol: "R1", expression: "4.7kΩ" });
    expect(evaluateCalculatorInput("width = 3cm", []).definition?.symbol).toBe("width");
    // 裸の接頭語（`a`・`c`・`M`）は単位記号ではないので通る。
    expect(evaluateCalculatorInput("a = 2m", []).definition?.symbol).toBe("a");
  });

  it("= を押す前のリアルタイム診断にも出る（= のときだけ出る検査にしない）", () => {
    const { error } = diagnoseCalculatorInput("W = 3cm", []);
    expect(error).toBeInstanceOf(UnitError);
    expect(isDiagnosableInputError(error as Error)).toBe(true);
  });
});
