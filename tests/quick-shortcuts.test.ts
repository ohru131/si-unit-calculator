import { describe, expect, it } from "vitest";
import { getCalculatorQuickShortcut } from "../lib/quick-shortcuts";

describe("ホーム画面ショートカット", () => {
  it("速度と圧力のショートカットに正しい式と表示単位を設定する", () => {
    expect(getCalculatorQuickShortcut("speed")).toEqual({ expression: "1km ÷ 1min", targetUnit: "km/h" });
    expect(getCalculatorQuickShortcut("pressure")).toEqual({ expression: "100N ÷ 0.01m²", targetUnit: "kPa" });
  });

  it("サンプルのショートカットを識別し、廃止した検索と未知の値はnullを返す", () => {
    expect(getCalculatorQuickShortcut("samples")).toEqual({ sampleCategory: "basic" });
    // 検索パネルごと廃止したので、古いショートカット（/?quick=search）は何も起こさない。
    expect(getCalculatorQuickShortcut("search")).toBeNull();
    expect(getCalculatorQuickShortcut("unknown")).toBeNull();
  });
});
