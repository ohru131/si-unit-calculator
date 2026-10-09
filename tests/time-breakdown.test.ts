import { describe, expect, it } from "vitest";

import { formatTimeBreakdown } from "../lib/time-breakdown";

describe("時間の複合表記（併記用）", () => {
  it("表示されている桁より細かい単位まで分けない", () => {
    // 有効3桁の 27.8 h は 0.1 h = 6 min 単位の精度なので、秒までは出さない。
    expect(formatTimeBreakdown({ value: 27.7777778, unit: "h", significantDigits: 3 })).toBe("27 h 48 min");
    // 表示桁の上限（6桁）で 27.7778 h と出ているなら秒まで届く。
    expect(formatTimeBreakdown({ value: 27.7777778, unit: "h", significantDigits: 6 })).toBe("27 h 46 min 40 s");
    expect(formatTimeBreakdown({ value: 1.157407407, unit: "d", significantDigits: 3 })).toBe("1 d 3 h 50 min");
  });

  it("いちばん上の単位は表示単位のまま（日を年へ繰り上げない）", () => {
    expect(formatTimeBreakdown({ value: 400.75, unit: "d", significantDigits: 5 })).toBe("400 d 18 h");
    expect(formatTimeBreakdown({ value: 2.5, unit: "yr", significantDigits: 2 })).toBe("2 yr 183 d");
    // 年は 365.25 日なので、全体を日で丸めてから割ると 2.0 yr が「2 yr 1 d」になる（#91で検出）。
    expect(formatTimeBreakdown({ value: 2, unit: "yr", significantDigits: 2 })).toBeNull();
    expect(formatTimeBreakdown({ value: 3, unit: "yr", significantDigits: 4 })).toBeNull();
    // 端数の丸めで上の単位に届いたら繰り上げて1単位に収める。
    expect(formatTimeBreakdown({ value: 1.9999, unit: "h", significantDigits: 3 })).toBeNull();
    expect(formatTimeBreakdown({ value: 0.99999, unit: "yr", significantDigits: 6 })).toBe("365 d 5 h 54 min 44 s");
  });

  it("1つの単位に収まるときは出さない", () => {
    expect(formatTimeBreakdown({ value: 2, unit: "h", significantDigits: 6 })).toBeNull();
    expect(formatTimeBreakdown({ value: 0.75, unit: "h", significantDigits: 6 })).toBeNull();
    // 精度が表示単位そのもの（3桁の 123 h）なら分ける先が無い。
    expect(formatTimeBreakdown({ value: 123.4, unit: "h", significantDigits: 3 })).toBeNull();
  });

  it("0の欄は飛ばし、負の値は符号を付ける", () => {
    expect(formatTimeBreakdown({ value: 1.0013888889, unit: "d", significantDigits: 6 })).toBe("1 d 2 min");
    expect(formatTimeBreakdown({ value: -1.5, unit: "h", significantDigits: 2 })).toBe("−1 h 30 min");
  });

  it("時間以外の単位と秒では出さない", () => {
    expect(formatTimeBreakdown({ value: 27.8, unit: "s", significantDigits: 3 })).toBeNull();
    expect(formatTimeBreakdown({ value: 27.8, unit: "m", significantDigits: 3 })).toBeNull();
    expect(formatTimeBreakdown({ value: 27.8, unit: "", significantDigits: 3 })).toBeNull();
  });

  it("丸めなし（0）は15桁として扱う", () => {
    expect(formatTimeBreakdown({ value: 1.5, unit: "min", significantDigits: 0 })).toBe("1 min 30 s");
  });
});
