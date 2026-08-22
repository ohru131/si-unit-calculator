import { describe, expect, it } from "vitest";

import {
  convertQuantity,
  evaluateExpression,
  formatQuantity,
  getCompatibleUnitGroups,
  parseConstantDefinition,
  type UnitGroup,
} from "../lib/units";

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

  it("異なる次元の加算を拒否する", () => {
    expect(() => evaluateExpression("1m + 1s")).toThrow("同じ次元");
  });
});
