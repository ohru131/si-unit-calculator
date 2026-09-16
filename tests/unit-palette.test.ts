import { describe, expect, it } from "vitest";

import { getPaletteUnitSuggestions } from "../lib/unit-input";
import { UNIT_GROUPS, type UnitGroup } from "../lib/units";

const group = (id: string): UnitGroup => {
  const found = UNIT_GROUPS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`unknown group: ${id}`);
  return found;
};

const symbols = (suggestions: { unit: { symbol: string } }[]) => suggestions.map((suggestion) => suggestion.unit.symbol);

describe("単位パレットの候補", () => {
  it("接頭語が無ければ、そのカテゴリの単位を単位ピッカーと同じ並びで全部返す", () => {
    const result = getPaletteUnitSuggestions(group("length"), "", { system: "metric" });
    expect(symbols(result)).toEqual(["m", "km", "cm", "mm", "µm", "in", "ft", "yd", "mi", "au", "ly"]);
    expect(result.every((suggestion) => suggestion.group.id === "length")).toBe(true);
  });

  it("カテゴリが選ばれていなければ空を返す（呼び出し側が文脈依存の候補へ落とす）", () => {
    expect(getPaletteUnitSuggestions(undefined, "", { system: "metric" })).toEqual([]);
  });

  it("接頭語があれば、そのカテゴリの中で綴りが前方一致する単位だけに絞る", () => {
    expect(symbols(getPaletteUnitSuggestions(group("length"), "k", { system: "metric" }))).toEqual(["km"]);
  });

  it("記号そのものが単位でもある接頭語は、完全一致を先頭に置く", () => {
    // m（メートル）を先に出すのは、接頭語キーをメートルの近道として押す人が打ち直さずに済むようにするため。
    expect(symbols(getPaletteUnitSuggestions(group("length"), "m", { system: "metric" }))).toEqual(["m", "mm", "mi"]);
  });

  it("大文字小文字は別物として扱う（M＝メガ / m＝ミリ）", () => {
    expect(symbols(getPaletteUnitSuggestions(group("power"), "M", { system: "metric" }))).toEqual(["MW"]);
  });

  it("そのカテゴリに一致が無ければ、カテゴリを跨いだ接頭語候補へ落とす（パレットを空にしない）", () => {
    const result = getPaletteUnitSuggestions(group("temperature"), "k", { system: "metric" });
    expect(result.length).toBeGreaterThan(0);
    expect(symbols(result)).toContain("km");
    // フォールバックなので、選んでいたカテゴリ以外のグループが混ざる。
    expect(result.some((suggestion) => suggestion.group.id !== "temperature")).toBe(true);
  });

  it("includeUnit で隠された単位はパレットにも出さない", () => {
    const result = getPaletteUnitSuggestions(group("length"), "", { system: "metric", includeUnit: (_, unitOption) => unitOption.symbol !== "ly" });
    expect(symbols(result)).not.toContain("ly");
  });

  it("limit を渡したときだけ件数を絞る", () => {
    expect(symbols(getPaletteUnitSuggestions(group("length"), "", { system: "metric", limit: 3 }))).toEqual(["m", "km", "cm"]);
  });
});
