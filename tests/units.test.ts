import { describe, expect, it } from "vitest";

import {
  convertQuantity,
  evaluateExpression,
  formatNumberForLocale,
  formatQuantity,
  getCompatibleUnitGroups,
  getRegionalUnits,
  parseConstantDefinition,
  searchUnitOptions,
  type UnitGroup,
  UNIT_GROUPS,
} from "../lib/units";
import { SAMPLE_CALCULATIONS } from "../lib/sample-calculations";

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
  });

  it("異なる次元の加算を拒否する", () => {
    expect(() => evaluateExpression("1m + 1s")).toThrow("同じ次元");
  });
});
