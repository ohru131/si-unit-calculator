import { describe, expect, it } from "vitest";

import { bestRational, findExactValue } from "@/lib/exact-value";

describe("findExactValue", () => {
  it("割り算の結果を約分した分数で返す", () => {
    expect(findExactValue(10 / 4)).toMatchObject({ kind: "rational", text: "5/2", latex: "\\frac{5}{2}" });
    expect(findExactValue(1 / 3)).toMatchObject({ kind: "rational", text: "1/3" });
    expect(findExactValue(6 / 8)).toMatchObject({ kind: "rational", text: "3/4" });
  });

  it("負の値は符号を分数の外に出す", () => {
    expect(findExactValue(-1 / 3)).toMatchObject({ kind: "rational", text: "-1/3", latex: "-\\frac{1}{3}" });
  });

  it("整数は分数化しない（小数表示のままで過不足がないため）", () => {
    expect(findExactValue(4)).toBeNull();
    expect(findExactValue(-7)).toBeNull();
    expect(findExactValue(0)).toBeNull();
  });

  it("πの有理数倍を認識する", () => {
    expect(findExactValue(Math.PI)).toMatchObject({ kind: "pi", text: "π", latex: "\\pi" });
    expect(findExactValue(Math.PI / 2)).toMatchObject({ kind: "pi", text: "π/2", latex: "\\frac{\\pi}{2}" });
    expect(findExactValue((2 * Math.PI) / 3)).toMatchObject({ kind: "pi", text: "2π/3", latex: "\\frac{2\\pi}{3}" });
    expect(findExactValue(-Math.PI / 4)).toMatchObject({ kind: "pi", text: "-π/4", latex: "-\\frac{\\pi}{4}" });
    expect(findExactValue(2 * Math.PI)).toMatchObject({ kind: "pi", text: "2π", latex: "2\\pi" });
  });

  it("逆三角関数の結果がπの分数になる", () => {
    expect(findExactValue(Math.asin(1))).toMatchObject({ text: "π/2" });
    expect(findExactValue(Math.atan(1))).toMatchObject({ text: "π/4" });
    expect(findExactValue(Math.acos(-1))).toMatchObject({ text: "π" });
  });

  it("三角関数の結果を平方根の形で返す", () => {
    expect(findExactValue(Math.sin(Math.PI / 3))).toMatchObject({ kind: "sqrt", text: "√3/2", latex: "\\frac{\\sqrt{3}}{2}" });
    expect(findExactValue(Math.cos(Math.PI / 4))).toMatchObject({ kind: "sqrt", text: "√2/2" });
    expect(findExactValue(Math.tan(Math.PI / 3))).toMatchObject({ kind: "sqrt", text: "√3" });
    expect(findExactValue(Math.tan(Math.PI / 6))).toMatchObject({ kind: "sqrt", text: "√3/3" });
  });

  it("sin(π/6)のように有理数になる三角関数は平方根ではなく分数で返す", () => {
    expect(findExactValue(Math.sin(Math.PI / 6))).toMatchObject({ kind: "rational", text: "1/2" });
  });

  it("平方因子を持つ根号は係数へ出す（√8ではなく2√2）", () => {
    expect(findExactValue(Math.sqrt(8))).toMatchObject({ kind: "sqrt", text: "2√2", latex: "2\\sqrt{2}" });
    expect(findExactValue(Math.sqrt(18) / 2)).toMatchObject({ kind: "sqrt", text: "3√2/2" });
  });

  it("きれいな形に当てはまらない値はnullを返す", () => {
    expect(findExactValue(1234.5678)).toBeNull();
    expect(findExactValue(0.123456789)).toBeNull();
    expect(findExactValue(Math.E)).toBeNull();
    expect(findExactValue(Math.log(7))).toBeNull();
  });

  it("表示に向かない大きさの値は対象外にする", () => {
    expect(findExactValue(Number.NaN)).toBeNull();
    expect(findExactValue(Number.POSITIVE_INFINITY)).toBeNull();
    expect(findExactValue(1e-7 / 3)).toBeNull();
    expect(findExactValue(1e7 / 3)).toBeNull();
  });

  it("打ち込んだ小数もそのまま分数として読める", () => {
    expect(findExactValue(0.25)).toMatchObject({ text: "1/4" });
    expect(findExactValue(1.5)).toMatchObject({ text: "3/2" });
    expect(findExactValue(0.1)).toMatchObject({ text: "1/10" });
  });
});

describe("bestRational", () => {
  it("分母の上限を超える近似は返さない", () => {
    expect(bestRational(1 / 3, 2)).toBeNull();
    expect(bestRational(1 / 3, 3)).toEqual({ numerator: 1, denominator: 3 });
  });

  it("常に既約分数を返す", () => {
    expect(bestRational(0.5, 1000)).toEqual({ numerator: 1, denominator: 2 });
    expect(bestRational(0.75, 1000)).toEqual({ numerator: 3, denominator: 4 });
    expect(bestRational(-0.75, 1000)).toEqual({ numerator: -3, denominator: 4 });
  });

  it("πのように有理数でない値は上限内では一致しない", () => {
    expect(bestRational(Math.PI, 1000)).toBeNull();
  });
});
