import { describe, expect, it } from "vitest";

import { isSampleCategoryVisible, isUnitGroupVisible, visibleUnits } from "../lib/advanced-display";

describe("シンプルモードの上級機能表示", () => {
  it("角度・加速度・周波数カテゴリは上級モードでのみ表示する", () => {
    expect(isUnitGroupVisible({ id: "angle", label: "角度", dimension: [0, 0, 0, 0, 0, 0, 0], units: [] }, false)).toBe(false);
    expect(isUnitGroupVisible({ id: "length", label: "長さ", dimension: [1, 0, 0, 0, 0, 0, 0], units: [] }, false)).toBe(true);
    expect(isSampleCategoryVisible("math", false)).toBe(false);
    expect(isSampleCategoryVisible("motion", false)).toBe(true);
  });

  it("シンプルモードではkine・Gal・Gなどを隠し、上級モードでは表示する", () => {
    const units = [{ symbol: "m/s", label: "m/s" }, { symbol: "kine", label: "kine" }, { symbol: "G", label: "G" }, { symbol: "mph", label: "mph" }];
    expect(visibleUnits(units, false).map((unit) => unit.symbol)).toEqual(["m/s", "mph"]);
    expect(visibleUnits(units, true).map((unit) => unit.symbol)).toEqual(["m/s", "kine", "G", "mph"]);
  });
});
