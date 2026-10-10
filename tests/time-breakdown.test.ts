import { describe, expect, it } from "vitest";

import { formatTimeBreakdown } from "../lib/time-breakdown";

describe("時間の複合表記（併記用）", () => {
  it("丸める前の値を秒まで分ける（分は m）", () => {
    // 疲労試験の 10⁷回 ÷ 100Hz。主表示が有効3桁の 27.8 h でも、併記は丸める前の値の行を分ける。
    expect(formatTimeBreakdown({ value: 27.7777778, unit: "h" })).toBe("27 h 46 m 40 s");
    expect(formatTimeBreakdown({ value: 1.157407407, unit: "d" })).toBe("1 d 3 h 46 m 40 s");
    expect(formatTimeBreakdown({ value: 1.5, unit: "min" })).toBe("1 m 30 s");
  });

  it("秒は整数に丸める", () => {
    expect(formatTimeBreakdown({ value: 1.2345678, unit: "h" })).toBe("1 h 14 m 4 s");
  });

  it("いちばん上の単位は表示単位のまま（日を年へ繰り上げない）", () => {
    expect(formatTimeBreakdown({ value: 400.75, unit: "d" })).toBe("400 d 18 h");
    expect(formatTimeBreakdown({ value: 2.5, unit: "yr" })).toBe("2 yr 182 d 15 h");
    // 年は 365.25 日なので、全体を日で丸めてから割ると 2.0 yr が「2 yr 1 d」になる（#91で検出）。
    expect(formatTimeBreakdown({ value: 2, unit: "yr" })).toBeNull();
    // 端数の丸めで上の単位に届いたら繰り上げて1単位に収める。
    expect(formatTimeBreakdown({ value: 1.99999999, unit: "h" })).toBeNull();
  });

  it("1つの単位に収まるときは出さない", () => {
    expect(formatTimeBreakdown({ value: 2, unit: "h" })).toBeNull();
    expect(formatTimeBreakdown({ value: 0.75, unit: "h" })).toBeNull();
  });

  it("0の欄は飛ばし、負の値は符号を付ける", () => {
    expect(formatTimeBreakdown({ value: 1.0013888889, unit: "d" })).toBe("1 d 2 m");
    expect(formatTimeBreakdown({ value: 2 + 5 / 3600, unit: "h" })).toBe("2 h 5 s");
    expect(formatTimeBreakdown({ value: -1.5, unit: "h" })).toBe("−1 h 30 m");
  });

  it("時間以外の単位と秒では出さない", () => {
    expect(formatTimeBreakdown({ value: 27.8, unit: "s" })).toBeNull();
    expect(formatTimeBreakdown({ value: 27.8, unit: "m" })).toBeNull();
    expect(formatTimeBreakdown({ value: 27.8, unit: "" })).toBeNull();
  });
});
