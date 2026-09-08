import { describe, expect, it } from "vitest";

import { preferredPrefixedUnit, resolveDisplayUnit } from "@/lib/display-unit";
import { evaluateExpression, formatQuantity } from "@/lib/units";

const resolve = (expression: string, requestedUnit = "", expressionUnits: string[] = []) => {
  const quantity = evaluateExpression(expression, []);
  const resolution = resolveDisplayUnit({ quantity, requestedUnit, expressionUnits, system: "metric", isAdvancedMode: false });
  return { ...resolution, text: formatQuantity(quantity, resolution.unit || undefined) };
};

describe("resolveDisplayUnit", () => {
  it("式の中で最初に使った同じ次元の単位で表示する（5cm + 1mm → 5.1 cm）", () => {
    expect(resolve("5cm + 1mm", "", ["cm", "mm"])).toMatchObject({ unit: "cm", source: "expression", text: "5.1 cm" });
  });

  it("明示的に選んだ単位が結果と同じ次元なら最優先で使う", () => {
    expect(resolve("5cm + 1mm", "mm", ["cm", "mm"])).toMatchObject({ unit: "mm", source: "requested", text: "51 mm" });
  });

  it("明示的に選んだ単位の次元が合わなくなったら、エラーにせず自動に戻す", () => {
    // 長さの計算で cm を選んだあと 255 や 1/3 を打った場面。以前は「cmへ変換できません」が出ていた。
    expect(resolve("255", "cm")).toMatchObject({ unit: "", source: "si", text: "255" });
    expect(resolve("100N / 0.01m²", "cm", ["N", "m²"])).toMatchObject({ unit: "kPa", source: "prefix", text: "10 kPa" });
  });

  it("式に同じ次元の単位が無ければ、1〜1000に収まるSI接頭語の単位に寄せる（12V/4.7kΩ → 2.55 mA）", () => {
    const { unit, source, text } = resolve("12V / 4.7kΩ", "", ["V", "kΩ"]);
    expect({ unit, source }).toEqual({ unit: "mA", source: "prefix" });
    expect(text.startsWith("2.55")).toBe(true);
    expect(text.endsWith(" mA")).toBe(true);
  });

  it("SI基本単位で1〜1000に収まる値は接頭語を付けず、名前付きの導出単位（N・s）で出す", () => {
    // 以前は力の結果が `19.6 m·kg/s²` と基本単位の積で出ていた。
    expect(resolve("2kg × 9.8m/s²", "", ["kg", "m/s²"])).toMatchObject({ unit: "N", source: "prefix", text: "19.6 N" });
    expect(resolve("1km / 5m/s", "", ["km", "m/s"])).toMatchObject({ unit: "s", source: "prefix", text: "200 s" });
  });

  it("接頭語の候補は倍率が10のべき乗の単位だけで、in・ft・km/h・°C は自動では選ばない", () => {
    // 面積 0.0006 m²: cm²（6）が選ばれ、in²（0.93）や ft² は候補にならない。
    expect(resolve("3cm × 20mm", "", ["cm", "mm"])).toMatchObject({ unit: "cm²", source: "prefix", text: "6 cm²" });
    // 温度 0.5 K は 1 未満だが、°C はオフセット付きなので選ばず SI のまま。
    expect(resolve("0.5K", "", ["K"]).unit).toBe("K");
  });

  it("無次元の結果は常に裸の数値（% や rad を勝手に付けない）", () => {
    expect(resolve("1/3")).toMatchObject({ unit: "", source: "si" });
    expect(resolve("0.125", "", [])).toMatchObject({ unit: "", source: "si" });
    // 明示的に % を選んでいるときはもちろん尊重する。
    expect(resolve("0.125", "%")).toMatchObject({ unit: "%", source: "requested", text: "12.5 %" });
  });

  it("式中の単位の並び順を尊重する（最初に使った単位が勝つ）", () => {
    expect(resolve("1mm + 5cm", "", ["mm", "cm"])).toMatchObject({ unit: "mm", text: "51 mm" });
  });
});

describe("preferredPrefixedUnit", () => {
  it("1000以上の値は大きい接頭語へ、1未満の値は小さい接頭語へ寄せる", () => {
    expect(preferredPrefixedUnit(evaluateExpression("250N × 4m", []), "metric", false)).toBe("kJ");
    expect(preferredPrefixedUnit(evaluateExpression("0.00255A", []), "metric", false)).toBe("mA");
    expect(preferredPrefixedUnit(evaluateExpression("0.5kg", []), "metric", false)).toBe("g");
  });

  it("収まる接頭語が無いときは倍率1の単位へ戻し、名前付きの単位が無い合成次元は null", () => {
    // 電流のグループは A / mA / µA しか無いので、10万アンペアは kA が無く A のまま。
    expect(preferredPrefixedUnit(evaluateExpression("100000A", []), "metric", false)).toBe("A");
    // 0 は接頭語を選べないので倍率1の単位（0 N）。
    expect(preferredPrefixedUnit(evaluateExpression("0N", []), "metric", false)).toBe("N");
    // N·m²/C² のような合成次元にはグループが無い。
    expect(preferredPrefixedUnit(evaluateExpression("8.99e9N*m^2/C^2", []), "metric", false)).toBeNull();
  });
});

describe("倍率1の単位を持たないグループは自動選択に使わない", () => {
  it("逆面積の結果を燃費（km/L）として表示しない", () => {
    // 燃費グループ（km/L は倍率1e6）を足した時点で、逆面積の結果が軒並み燃費として
    // 表示されていた（`1/(1mm²)` が「1 km/L」）。km/L はSI単位を接頭語で読み替えたものではなく
    // 別の計量習慣の単位なので、SIの値を勝手にその名前で呼んではいけない（独立レビューで検出）。
    for (const expression of ["1/(1mm^2)", "1e7/1m^2", "1/(1cm^2)"]) {
      const quantity = evaluateExpression(expression);
      const resolved = resolveDisplayUnit({ quantity, requestedUnit: "", expressionUnits: [], system: "metric", isAdvancedMode: false });
      expect(resolved, expression).toEqual({ unit: "", source: "si" });
    }
  });

  it("燃費の単位はユーザーが明示的に選んだときだけ使われる", () => {
    const quantity = evaluateExpression("15km/(1L)");
    expect(resolveDisplayUnit({ quantity, requestedUnit: "km/L", expressionUnits: [], system: "metric", isAdvancedMode: false }))
      .toEqual({ unit: "km/L", source: "requested" });
  });

  it("倍率1の単位を持つグループは従来どおり自動で選ばれる", () => {
    // 力（N は倍率1）と電流（A・mA）は影響を受けない、という回帰の確認。
    expect(resolveDisplayUnit({ quantity: evaluateExpression("2kg*9.8m/s^2"), requestedUnit: "", expressionUnits: [], system: "metric", isAdvancedMode: false }).unit).toBe("N");
    expect(resolveDisplayUnit({ quantity: evaluateExpression("12V/4.7kOhm"), requestedUnit: "", expressionUnits: [], system: "metric", isAdvancedMode: false }).unit).toBe("mA");
  });
});
