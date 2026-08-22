import { describe, expect, it } from "vitest";
import { getCalculatorQuickShortcut } from "../lib/quick-shortcuts";

describe("ホーム画面ショートカット", () => {
  it("速度と圧力のショートカットに正しい式と表示単位を設定する", () => {
    expect(getCalculatorQuickShortcut("speed")).toEqual({ expression: "1km ÷ 1min", targetUnit: "km/h" });
    expect(getCalculatorQuickShortcut("pressure")).toEqual({ expression: "100N ÷ 0.01m²", targetUnit: "kPa" });
  });

  it("サンプルと検索のショートカットを正しく識別する", () => {
    expect(getCalculatorQuickShortcut("samples")).toEqual({ sampleCategory: "basic" });
    expect(getCalculatorQuickShortcut("search")).toEqual({ focusSearch: true });
    expect(getCalculatorQuickShortcut("unknown")).toBeNull();
  });
});
