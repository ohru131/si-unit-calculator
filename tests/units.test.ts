import { describe, expect, it } from "vitest";

import {
  convertQuantity,
  evaluateExpression,
  formatNumberForLocale,
  formatQuantity,
  getCompatibleUnitGroups,
  getRegionalUnits,
  getUnitRegistration,
  parseConstantDefinition,
  searchUnitOptions,
  type UnitGroup,
  UNIT_GROUPS,
} from "../lib/units";
import { SAMPLE_CALCULATIONS } from "../lib/sample-calculations";
import { getUnitExplanation } from "../lib/unit-explanations";

describe("単位付き計算", () => {
  it("異なる長さの単位をSIへ換算して加算する", () => {
    const result = evaluateExpression("5cm + 1mm");
    expect(result.siValue).toBeCloseTo(0.051);
    expect(formatQuantity(result)).toBe("0.051 m");
    expect(formatQuantity(result, "cm")).toBe("5.1 cm");
  });

  it("乗算で次元を合成し、面積へ変換する", () => {
    const result = evaluateExpression("3cm × 20mm");
    expect(result.siValue).toBeCloseTo(0.0006);
    expect(formatQuantity(result)).toBe("0.0006 m²");
    expect(formatQuantity(result, "cm²")).toBe("6 cm²");
  });

  it("空白なしの単位付き乗算も正しく計算する", () => {
    const result = evaluateExpression("3cm×20mm");
    expect(formatQuantity(result, "cm²")).toBe("6 cm²");
  });

  it("定数を定義して式の中で参照する", () => {
    const width = parseConstantDefinition("W = 3cm");
    const height = parseConstantDefinition("H = 20mm", [
      { ...width, createdAt: "2026-01-01T00:00:00.000Z" },
    ]);
    const result = evaluateExpression("W × H", [
      { ...width, createdAt: "2026-01-01T00:00:00.000Z" },
      { ...height, createdAt: "2026-01-01T00:00:00.000Z" },
    ]);
    expect(formatQuantity(result, "cm²")).toBe("6 cm²");
  });

  it("無次元値を百分率とppmに変換する", () => {
    const result = evaluateExpression("0.125");
    expect(convertQuantity(result, "%").value).toBeCloseTo(12.5);
    expect(convertQuantity(result, "ppm").value).toBeCloseTo(125000);
  });

  it("複合単位を換算する", () => {
    const velocity = evaluateExpression("1m/s");
    expect(convertQuantity(velocity, "km/h").value).toBeCloseTo(3.6);
    const energy = evaluateExpression("1N × 1m");
    expect(formatQuantity(energy, "J")).toBe("1 J");
  });

  it("距離と秒・分・時から速度を計算し、速度と時間から距離を計算する", () => {
    const minuteVelocity = evaluateExpression("1km ÷ 1min");
    expect(convertQuantity(minuteVelocity, "m/min").value).toBeCloseTo(1000);
    expect(convertQuantity(minuteVelocity, "km/h").value).toBeCloseTo(60);

    const hourVelocity = evaluateExpression("12km ÷ 2h");
    expect(convertQuantity(hourVelocity, "km/h").value).toBeCloseTo(6);

    const distance = evaluateExpression("10m/s × 2min");
    expect(formatQuantity(distance, "km")).toBe("1.2 km");
  });

  it("加速度をSIへ正規化し、標準重力GとGal系で相互換算する", () => {
    expect(convertQuantity(evaluateExpression("1G"), "m/s²").value).toBeCloseTo(9.80665);
    expect(convertQuantity(evaluateExpression("1G"), "Gal").value).toBeCloseTo(980.665);
    expect(convertQuantity(evaluateExpression("1Gal"), "m/s²").value).toBeCloseTo(0.01);
    expect(convertQuantity(evaluateExpression("1000mGal"), "Gal").value).toBeCloseTo(1);
    expect(convertQuantity(evaluateExpression("1µGal"), "m/s²").value).toBeCloseTo(1e-8);
  });

  it("kineをSI速度へ正規化し、特殊単位の説明を取得する", () => {
    expect(convertQuantity(evaluateExpression("1kine"), "m/s").value).toBeCloseTo(0.01);
    expect(formatQuantity(evaluateExpression("100kine"), "km/h")).toBe("3.6 km/h");
    expect(getUnitExplanation("G")?.siConversion).toBe("1 G = 9.80665 m/s²");
    expect(getUnitExplanation("kine")?.name.ja).toBe("カイン");
    expect(getUnitExplanation("m")).toBeUndefined();
  });

  it("角度・三角関数・円周率を無次元結果として正しく計算する", () => {
    expect(convertQuantity(evaluateExpression("180deg"), "rad").value).toBeCloseTo(Math.PI);
    expect(evaluateExpression("sin(30deg)").siValue).toBeCloseTo(0.5);
    expect(evaluateExpression("cos(π)").siValue).toBeCloseTo(-1);
    expect(evaluateExpression("tan(pi / 4)").siValue).toBeCloseTo(1);
  });

  it("べき乗と平方根を次元整合性を保って計算する", () => {
    expect(evaluateExpression("2^3^2").siValue).toBe(512);
    expect(formatQuantity(evaluateExpression("(3m)^2"), "m²")).toBe("9 m²");
    expect(formatQuantity(evaluateExpression("sqrt(9m²)"), "m")).toBe("3 m");
    expect(evaluateExpression("sqrt(81)").siValue).toBe(9);
  });

  it("三角関数・べき乗・平方根の不正な次元と定義域を拒否する", () => {
    expect(() => evaluateExpression("sin(1m)")).toThrow("角度または無次元");
    expect(() => evaluateExpression("(2m)^0.5")).toThrow("整数のべき指数");
    expect(() => evaluateExpression("sqrt(2m)")).toThrow("指数が偶数");
    expect(() => evaluateExpression("sqrt(-1)")).toThrow("負の値");
  });

  it("逆三角関数・対数・atan2を計算し、角度へ変換する", () => {
    expect(convertQuantity(evaluateExpression("asin(0.5)"), "deg").value).toBeCloseTo(30);
    expect(convertQuantity(evaluateExpression("acos(0)"), "deg").value).toBeCloseTo(90);
    expect(convertQuantity(evaluateExpression("atan(1)"), "deg").value).toBeCloseTo(45);
    expect(convertQuantity(evaluateExpression("atan2(1m, 1m)"), "deg").value).toBeCloseTo(45);
    expect(evaluateExpression("ln(e)").siValue).toBeCloseTo(1);
    expect(evaluateExpression("log(1000)").siValue).toBeCloseTo(3);
    expect(evaluateExpression("log2(8)").siValue).toBeCloseTo(3);
  });

  it("逆三角関数・対数・atan2の不正な引数を拒否する", () => {
    expect(() => evaluateExpression("asin(2)")).toThrow("-1 から 1");
    expect(() => evaluateExpression("log(0)")).toThrow("0より大きい");
    expect(() => evaluateExpression("ln(1m)")).toThrow("角度または無次元");
    expect(() => evaluateExpression("atan2(1m, 1s)")).toThrow("同じ次元");
  });

  it("自作関数を引数付きで呼び出し、次元演算を再利用する", () => {
    const functions = [{ name: "circleArea", parameters: ["r"], expression: "pi × r^2" }];
    expect(convertQuantity(evaluateExpression("circleArea(3m)", [], functions), "m²").value).toBeCloseTo(9 * Math.PI);
  });

  it("自作関数の引数数と再帰呼び出しを拒否する", () => {
    expect(() => evaluateExpression("circleArea()", [], [{ name: "circleArea", parameters: ["r"], expression: "pi × r^2" }])).toThrow("1個の引数");
    expect(() => evaluateExpression("loop(1)", [], [{ name: "loop", parameters: ["x"], expression: "loop(x)" }])).toThrow("再帰的");
  });

  it("質量と標準重力の乗算から力を計算し、加速度候補を地域別に提示する", () => {
    expect(convertQuantity(evaluateExpression("2kg × 1G"), "N").value).toBeCloseTo(19.6133);
    const accelerationGroup = UNIT_GROUPS.find((group) => group.id === "acceleration");
    expect(accelerationGroup).toBeDefined();
    expect(getRegionalUnits(accelerationGroup!, "metric").map((unit) => unit.symbol)).toEqual(["m/s²", "Gal", "mGal", "G"]);
    expect(getRegionalUnits(accelerationGroup!, "us").map((unit) => unit.symbol)).toEqual(["ft/s²", "G", "m/s²", "Gal", "mGal"]);
  });

  it("結果と同じ次元の単位グループだけを返す", () => {
    const length = evaluateExpression("5cm");
    const symbols = getCompatibleUnitGroups(length.dimension).flatMap((group: UnitGroup) => group.units.map((unit) => unit.symbol));
    expect(symbols).toContain("cm");
    expect(symbols).toContain("km");
    expect(symbols).not.toContain("kg");

    const ratio = evaluateExpression("0.25");
    const ratioSymbols = getCompatibleUnitGroups(ratio.dimension).flatMap((group: UnitGroup) => group.units.map((unit) => unit.symbol));
    expect(ratioSymbols).toContain("%");
    expect(ratioSymbols).toContain("ppm");
    expect(ratioSymbols).not.toContain("cm");
  });

  it("すべてのサンプル式を計算し、指定単位で表示できる", () => {
    SAMPLE_CALCULATIONS.forEach((sample) => {
      const result = evaluateExpression(sample.expression);
      expect(() => formatQuantity(result, sample.targetUnit)).not.toThrow();
    });
  });

  it("華氏・摂氏・ケルビンを温度次元として相互変換する", () => {
    expect(formatQuantity(evaluateExpression("32°F"), "°C")).toBe("0 °C");
    expect(formatQuantity(evaluateExpression("0°C"), "K")).toBe("273.15 K");
  });

  it("米国慣用単位をSI経由で正しく換算する", () => {
    expect(formatQuantity(evaluateExpression("1ft"), "in")).toBe("12 in");
    expect(formatQuantity(evaluateExpression("1mi ÷ 1h"), "mph")).toBe("1 mph");
  });

  it("地域別プリセットでは慣用単位を優先表示する", () => {
    const lengthGroup = UNIT_GROUPS.find((group) => group.id === "length");
    expect(lengthGroup).toBeDefined();
    expect(getRegionalUnits(lengthGroup!, "us").map((unit) => unit.symbol)).toEqual(["in", "ft", "yd", "mi"]);
    expect(getRegionalUnits(lengthGroup!, "metric").map((unit) => unit.symbol)).toEqual(["m", "km", "cm", "mm"]);
  });

  it("ロケール指定時は利用者の小数点表記で結果を整形する", () => {
    expect(formatNumberForLocale(5.1, "en-US")).toBe("5.1");
    expect(formatNumberForLocale(5.1, "de-DE")).toBe("5,1");
  });

  it("単位検索は地域別プリセット内から記号とカテゴリで候補を返す", () => {
    expect(searchUnitOptions("psi", "us").map((result) => result.unit.symbol)).toEqual(["psi"]);
    expect(searchUnitOptions("pressure", "us").map((result) => result.unit.symbol)).toEqual(["psi", "atm"]);
    expect(searchUnitOptions("gal", "metric").map((result) => result.unit.symbol)).toEqual(["Gal", "mGal"]);
  });

  it("候補への登録済み・計算可能な候補外・未対応の単位を区別する", () => {
    expect(getUnitRegistration("cm").status).toBe("registered");
    expect(getUnitRegistration("g0").status).toBe("supported");
    expect(getUnitRegistration("madeUpUnit").status).toBe("unknown");
  });

  it("異なる次元の加算を拒否する", () => {
    expect(() => evaluateExpression("1m + 1s")).toThrow("同じ次元");
  });
});
