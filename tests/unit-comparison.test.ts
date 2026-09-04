import { describe, expect, it } from "vitest";

import { buildUnitComparisonRows } from "../lib/unit-comparison";
import { evaluateExpression, parseConstantDefinition } from "../lib/units";

describe("buildUnitComparisonRows", () => {
  it("長さ（1mi）をmetricで比較すると、m/km/cm/mm等が地域優先順のまま並び、値も正しい（1mi = 1609.344m）", () => {
    const quantity = evaluateExpression("1mi");
    const rows = buildUnitComparisonRows(quantity, { unitSystem: "metric", hints: ["m", undefined, undefined] });
    expect(rows.map((row) => row.symbol)).toEqual(["m", "km", "cm", "mm", "µm", "in", "ft", "yd", "mi", "au"]);
    const meterRow = rows.find((row) => row.symbol === "m");
    expect(meterRow?.value).toBe("1609.344");
    const kmRow = rows.find((row) => row.symbol === "km");
    expect(kmRow?.value).toBe("1.609344");
  });

  it("activeUnitを渡すと、その行だけisActiveがtrueになる", () => {
    const quantity = evaluateExpression("1mi");
    const rows = buildUnitComparisonRows(quantity, { unitSystem: "metric", hints: ["m", undefined, undefined], activeUnit: "km" });
    expect(rows.find((row) => row.symbol === "km")?.isActive).toBe(true);
    expect(rows.filter((row) => row.isActive)).toHaveLength(1);
  });

  it("activeUnitが未指定なら、どの行もisActiveにならない", () => {
    const quantity = evaluateExpression("1mi");
    const rows = buildUnitComparisonRows(quantity, { unitSystem: "metric", hints: ["m", undefined, undefined] });
    expect(rows.every((row) => !row.isActive)).toBe(true);
  });

  it("候補一覧に無いactiveUnit（nm。既定limit=10だと長さグループ11件のうちlyが切られ、nmは元々グループにも入っていない）を渡すと先頭に足される", () => {
    const quantity = evaluateExpression("1mi");
    const rows = buildUnitComparisonRows(quantity, { unitSystem: "metric", hints: ["m", undefined, undefined], activeUnit: "nm" });
    expect(rows[0]).toEqual({ symbol: "nm", label: "nm", value: "1.609344e+12", isActive: true });
    // 先頭に1行足した分、既定limit(10)を超えないよう末尾の候補が押し出される。
    expect(rows).toHaveLength(10);
    expect(rows.map((row) => row.symbol)).toEqual(["nm", "m", "km", "cm", "mm", "µm", "in", "ft", "yd", "mi"]);
  });

  it("名前の付いたグループが無い合成次元（クーロンの法則の定数k＝N・m²/C²）でもフォールバック経路で行が出る", () => {
    // lib/notebook-formulas/source/physics.ts のクーロンの法則の定数kと同じ式。
    const expression = "8.99e9N*m^2/C^2";
    const { quantity } = parseConstantDefinition(`k = ${expression}`);
    const rows = buildUnitComparisonRows(quantity, { unitSystem: "metric", hints: [undefined, expression, undefined] });
    expect(rows).toEqual([{ symbol: "N*m^2/C^2", label: "N*m^2/C^2", value: "8.99e+9", isActive: false }]);
  });

  it("運動量（kg*m/s）のように次元に対応するグループが無い手順結果でも、表示単位からフォールバックできる", () => {
    // lib/notebook-formulas/source/physics.ts の「運動量」の手順のtargetUnitと同じ表記。
    const quantity = evaluateExpression("3kg*2m/s");
    const rows = buildUnitComparisonRows(quantity, { unitSystem: "metric", hints: [undefined, "kg*m/s", undefined] });
    expect(rows).toEqual([{ symbol: "kg*m/s", label: "kg*m/s", value: "6", isActive: false }]);
  });

  it("quantityがundefinedなら空配列を返す", () => {
    expect(buildUnitComparisonRows(undefined, { unitSystem: "metric", hints: ["m"] })).toEqual([]);
  });

  it("オフセットのある温度単位（°C/K/°F）も正しく変換される（0°C = 273.15K = 32°F）", () => {
    const quantity = evaluateExpression("0°C");
    const rows = buildUnitComparisonRows(quantity, { unitSystem: "metric", hints: ["°C", undefined, undefined] });
    expect(rows).toEqual([
      { symbol: "°C", label: "°C", value: "0", isActive: false },
      { symbol: "K", label: "K", value: "273.15", isActive: false },
      { symbol: "°F", label: "°F", value: "32", isActive: false },
    ]);
  });

  it("symbolの重複は除去され、先に出たものが残る", () => {
    const quantity = evaluateExpression("1mi");
    // activeUnitが候補一覧に既に含まれる場合、先頭に重複して足さない。
    const rows = buildUnitComparisonRows(quantity, { unitSystem: "metric", hints: ["m", undefined, undefined], activeUnit: "m" });
    expect(rows.filter((row) => row.symbol === "m")).toHaveLength(1);
    expect(rows[0].symbol).toBe("m");
    expect(rows[0].isActive).toBe(true);
  });

  it("変換に失敗するactiveUnit（単位として解釈できない表記）は先頭に足されない", () => {
    const quantity = evaluateExpression("1mi");
    const rows = buildUnitComparisonRows(quantity, { unitSystem: "metric", hints: ["m", undefined, undefined], activeUnit: "banana" });
    expect(rows.some((row) => row.symbol === "banana")).toBe(false);
    expect(rows.map((row) => row.symbol)).toEqual(["m", "km", "cm", "mm", "µm", "in", "ft", "yd", "mi", "au"]);
  });

  it("limitで件数を絞れる", () => {
    const quantity = evaluateExpression("1mi");
    const rows = buildUnitComparisonRows(quantity, { unitSystem: "metric", hints: ["m", undefined, undefined], limit: 3 });
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.symbol)).toEqual(["m", "km", "cm"]);
  });
});
