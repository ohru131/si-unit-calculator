import { afterEach, describe, expect, it } from "vitest";

import { parseCustomUnit } from "../lib/custom-units";
import { convertQuantity, evaluateExpression, formatQuantity, setCustomUnits, type Dimension, type SavedConstant } from "../lib/units";

const LENGTH_DIMENSION: Dimension = [1, 0, 0, 0, 0, 0, 0];
const ZERO_DIMENSION: Dimension = [0, 0, 0, 0, 0, 0, 0];

// setCustomUnits はモジュールレベルの可変状態なので、テスト間で漏れないよう毎回リセットする。
afterEach(() => {
  setCustomUnits([]);
});

describe("parseCustomUnit（倍率形式）", () => {
  it("shaku = 0.303m からscale/offset/次元を導出する", () => {
    const result = parseCustomUnit("shaku", "0.303m", { existingSymbols: [] });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.unit.scale).toBeCloseTo(0.303);
    expect(result.unit.offset).toBe(0);
    expect(result.unit.dimension).toEqual(LENGTH_DIMENSION);
    expect(result.unit.expression).toBe("0.303m");
  });

  it("既存の組み込み単位を組み合わせた定義式を評価できる（3ft）", () => {
    const result = parseCustomUnit("shakuFt", "3ft", { existingSymbols: [] });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    // 実際に評価して得た値（0.3048 * 3）で検証する。
    expect(result.unit.scale).toBeCloseTo(0.9144);
    expect(result.unit.offset).toBe(0);
    expect(result.unit.dimension).toEqual(LENGTH_DIMENSION);
  });
});

describe("parseCustomUnit（関数形式）", () => {
  it("華氏相当の単位を関数形式で定義できる", () => {
    const result = parseCustomUnit("degFx", "(x-32)*5/9*K + 273.15*K", { existingSymbols: [] });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    // 実際にevaluateExpressionを3点評価して得た値で検証する（scale ≈ 5/9, offset ≈ 255.372…）。
    expect(result.unit.scale).toBeCloseTo(5 / 9, 9);
    expect(result.unit.offset).toBeCloseTo(255.3722222222222, 9);
    expect(result.unit.dimension).toEqual([0, 0, 0, 0, 1, 0, 0]);
  });

  it("無次元の関数形式（2*x+5）からscale/offsetを導出する", () => {
    const result = parseCustomUnit("lin", "2*x+5", { existingSymbols: [] });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.unit.scale).toBeCloseTo(2);
    expect(result.unit.offset).toBeCloseTo(5);
    expect(result.unit.dimension).toEqual(ZERO_DIMENSION);
  });

  it("1.5kxやxyのような'xを含むだけ'の倍率形式の定義を関数形式と誤認しない", () => {
    // "1.5kx" は識別子の一部としての x であり、独立した変数 x ではない。
    // parseUnit で解釈できない記号なので unparsableDefinition になるはずで、
    // 誤って関数形式（3点評価）に倒れて別のエラーになっていないことを確認する。
    const result = parseCustomUnit("weird", "1.5kx", { existingSymbols: [] });
    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.code).toBe("unparsableDefinition");
  });

  it("非アフィンな定義（x*x*m）はnonAffineDefinitionになる", () => {
    const result = parseCustomUnit("quad", "x*x*m", { existingSymbols: [] });
    expect(result).toEqual({ status: "error", code: "nonAffineDefinition" });
  });

  it("ユーザーがxという名前の定数を保存していても、関数形式のxは変数として扱われる", () => {
    // 3点評価用のxは既存の定数のあとに積むので、同名の定数があっても変数側が勝つ。
    // ここが逆になると、xが定数値に固定されてf(0)=f(1)=f(2)となり、
    // scaleが0の単位（zeroScale）が黙って作られてしまう。
    const savedX: SavedConstant = { symbol: "x", expression: "7", quantity: { siValue: 7, dimension: ZERO_DIMENSION }, createdAt: "" };
    const result = parseCustomUnit("lin", "2*x+5", { existingSymbols: [], constants: [savedX] });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.unit.scale).toBeCloseTo(2);
    expect(result.unit.offset).toBeCloseTo(5);
  });
});

describe("parseCustomUnit（記号の検証）", () => {
  it("空の記号はemptySymbol", () => {
    const result = parseCustomUnit("   ", "0.303m", { existingSymbols: [] });
    expect(result).toEqual({ status: "error", code: "emptySymbol" });
  });

  it("数字を含む記号（m2）はinvalidSymbol", () => {
    const result = parseCustomUnit("m2", "0.303m", { existingSymbols: [] });
    expect(result).toEqual({ status: "error", code: "invalidSymbol" });
  });

  it("既存の組み込み単位と完全一致する記号（m）はsymbolTaken", () => {
    const result = parseCustomUnit("m", "0.303m", { existingSymbols: [] });
    expect(result).toEqual({ status: "error", code: "symbolTaken" });
  });

  it("SI接頭辞の分解で解決できる記号（dm）もsymbolTaken", () => {
    const result = parseCustomUnit("dm", "0.303m", { existingSymbols: [] });
    expect(result).toEqual({ status: "error", code: "symbolTaken" });
  });

  it("既に登録済みのユーザー定義単位と衝突する記号もsymbolTaken", () => {
    const result = parseCustomUnit("shaku", "0.303m", { existingSymbols: ["shaku"] });
    expect(result).toEqual({ status: "error", code: "symbolTaken" });
  });
});

describe("parseCustomUnit（定義式のエラー）", () => {
  it("空の定義式はemptyDefinition", () => {
    const result = parseCustomUnit("shaku", "   ", { existingSymbols: [] });
    expect(result).toEqual({ status: "error", code: "emptyDefinition" });
  });

  it("scaleが0になる定義（0m）はzeroScale", () => {
    const result = parseCustomUnit("zero", "0m", { existingSymbols: [] });
    expect(result).toEqual({ status: "error", code: "zeroScale" });
  });

  it("解釈できない定義（???）はunparsableDefinition", () => {
    const result = parseCustomUnit("bogus", "???", { existingSymbols: [] });
    expect(result).toEqual({ status: "error", code: "unparsableDefinition" });
  });
});

describe("統合テスト: 登録した自作単位が実際の計算経路で使える", () => {
  it("setCustomUnitsで登録した単位をevaluateExpression/convertQuantity/formatQuantityで使える", () => {
    const parsed = parseCustomUnit("shaku", "0.303m", { existingSymbols: [] });
    expect(parsed.status).toBe("ok");
    if (parsed.status !== "ok") return;

    setCustomUnits([{ symbol: parsed.unit.symbol, scale: parsed.unit.scale, offset: parsed.unit.offset, dimension: parsed.unit.dimension }]);

    const result = evaluateExpression("2shaku");
    expect(result.siValue).toBeCloseTo(0.606);

    // 自作単位へ変換し直せる（往復できる）ことを確認する。
    expect(convertQuantity(result, "shaku").value).toBeCloseTo(2);
    expect(formatQuantity(result, "shaku")).toBe("2 shaku");
  });

  it("offsetが0の自作単位は複合単位にも使える（shaku/s）", () => {
    const parsed = parseCustomUnit("shaku", "0.303m", { existingSymbols: [] });
    expect(parsed.status).toBe("ok");
    if (parsed.status !== "ok") return;

    setCustomUnits([{ symbol: parsed.unit.symbol, scale: parsed.unit.scale, offset: parsed.unit.offset, dimension: parsed.unit.dimension }]);

    const result = evaluateExpression("1shaku/s");
    expect(result.siValue).toBeCloseTo(0.303);
    expect(result.dimension).toEqual([1, 0, -1, 0, 0, 0, 0]);
  });

  it("offsetを持つ自作単位はparseUnitの既存ルールで単独使用のみに制限される", () => {
    // parseCustomUnitのバリデーションでは弾かれないoffset付きの単位を直接setCustomUnitsで
    // 登録し、既存の摂氏・華氏と同じ「単独でしか使えない」制約が効くことを確認する。
    setCustomUnits([{ symbol: "df", scale: 2, offset: 100, dimension: [0, 0, 0, 0, 1, 0, 0] }]);

    expect(evaluateExpression("3df").siValue).toBeCloseTo(106);
    expect(() => evaluateExpression("3df/s")).toThrow();
  });
});

describe("回帰テスト: 自作単位は既存の解決順を壊さない", () => {
  it("組み込みで解決できる記号（dm）を無理やり登録しても、組み込みの解決結果が優先される", () => {
    setCustomUnits([{ symbol: "dm", scale: 999, dimension: [1, 0, 0, 0, 0, 0, 0] }]);
    // dmは本来「デシメートル」= 0.1m。自作単位を登録しても組み込みの解決順
    // （完全一致 → SI接頭辞分解 → ユーザー定義）が保たれ、値が変わらないことを確認する。
    const result = evaluateExpression("1dm");
    expect(result.siValue).toBeCloseTo(0.1);
  });

  it("setCustomUnits([])で登録解除できる", () => {
    setCustomUnits([{ symbol: "shaku", scale: 0.303, dimension: [1, 0, 0, 0, 0, 0, 0] }]);
    expect(evaluateExpression("1shaku").siValue).toBeCloseTo(0.303);

    setCustomUnits([]);
    expect(() => evaluateExpression("1shaku")).toThrow();
  });
});
