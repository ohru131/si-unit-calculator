import { afterEach, describe, expect, it } from "vitest";

import { countCustomUnitConflicts, customUnitsAreEqual, isCustomUnit, isUsableCustomUnitSymbol, mergeCustomUnits, parseCustomUnit, parseCustomUnitsField, type CustomUnit } from "../lib/custom-units";
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

// CodeRabbitがPR #34で指摘した実バグの回帰テスト。
// x=0,1,2 の3点だけを見る2階差分の検査は、その3点を根に持つ高次式を素通しする。
// 標本点を増やしても「増やした点を根に持つ多項式」で同じ手口が成立するため、
// 値ではなく「xの現れ方」を構造的に検査する方針に変えた。その方針が効いていることを固定する。
describe("回帰テスト: 3点だけ一致する非アフィン式を弾く", () => {
  it("x*x*(x-1)*(x-2)*m+x*m は x=0,1,2 で 0m,1m,2m になるが登録できない", () => {
    // まず前提（この式が3点ではアフィンに見えること）を明示しておく。ここが崩れると
    // このテストは「たまたま通っている」状態になり、回帰テストの意味が無くなる。
    const sample = (n: number) =>
      evaluateExpression("x*x*(x-1)*(x-2)*m+x*m", [
        { symbol: "x", expression: String(n), quantity: { siValue: n, dimension: [0, 0, 0, 0, 0, 0, 0] }, createdAt: "" },
      ]).siValue;
    expect(sample(0)).toBeCloseTo(0);
    expect(sample(1)).toBeCloseTo(1);
    expect(sample(2)).toBeCloseTo(2);
    // 3点では一次関数と区別できないが、x=3 では 3 ではなく 21 になる。
    expect(sample(3)).toBeCloseTo(21);

    const result = parseCustomUnit("poly", "x*x*(x-1)*(x-2)*m+x*m", { existingSymbols: [] });
    expect(result).toEqual({ status: "error", code: "nonAffineDefinition" });
  });

  it("xが非線形に現れる他の書き方も弾く", () => {
    const rejected = ["x*x*m", "x^2*m", "sin(x)*m", "m/x", "1/(x)*m", "x²*m"];
    rejected.forEach((definition) => {
      const result = parseCustomUnit("zz", definition, { existingSymbols: [] });
      expect(result, definition).toEqual({ status: "error", code: "nonAffineDefinition" });
    });
  });

  it("1次の定義は引き続き登録できる（過剰に弾いていないことの確認）", () => {
    const accepted = ["(x-32)*5/9*K + 273.15*K", "2*x+5", "x*0.303*m", "x/2*m", " x * 3 * m"];
    accepted.forEach((definition) => {
      const result = parseCustomUnit("zz", definition, { existingSymbols: [] });
      expect(result.status, definition).toBe("ok");
    });
  });
});

describe("isUsableCustomUnitSymbol", () => {
  it("組み込みで解決できる記号・不正な記号を弾き、使える記号だけ通す", () => {
    // 復元時（lib/calculator-store.tsx）と登録時で同じ判定を使うための関数。
    expect(isUsableCustomUnitSymbol("m")).toBe(false);
    expect(isUsableCustomUnitSymbol("dm")).toBe(false);
    expect(isUsableCustomUnitSymbol("m2")).toBe(false);
    expect(isUsableCustomUnitSymbol("")).toBe(false);
    expect(isUsableCustomUnitSymbol("  ")).toBe(false);
    expect(isUsableCustomUnitSymbol("shaku")).toBe(true);
  });
});

// 独自レビューで見つけた不具合の回帰テスト（PR #34、CodeRabbitのレート制限中に実施）。
describe("回帰テスト: 単位側の指数を含む1次式を弾かない", () => {
  it("x*9.8m/s^2 のように単位に指数がある定義でも登録できる", () => {
    // 定義式全体に "^" があるかで弾くと、m/s^2・kg/m^3・m² のようなごく普通の単位を
    // 使った1次式まで「xの1次式にしてください」と拒否してしまう（実際に拒否していた）。
    // 単位サフィックス中の "^" は演算子ですらないので、x に掛かる累乗だけを見る必要がある。
    const accepted = ["x*9.8m/s^2", "x*1000kg/m^3", "x*2m²", "x*5N*m"];
    accepted.forEach((definition) => {
      const result = parseCustomUnit("zz", definition, { existingSymbols: [] });
      expect(result.status, definition).toBe("ok");
    });
  });

  it("x 自身が累乗されている場合は引き続き弾く", () => {
    const rejected = ["x^2*m", "2^x*m", "(2*x+1)^2*m", "x²*m", "(x)^2*m"];
    rejected.forEach((definition) => {
      const result = parseCustomUnit("zz", definition, { existingSymbols: [] });
      expect(result, definition).toEqual({ status: "error", code: "nonAffineDefinition" });
    });
  });

  it("x*9.8m/s^2 の scale が実際に正しい", () => {
    const result = parseCustomUnit("gee", "x*9.8m/s^2", { existingSymbols: [] });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.unit.scale).toBeCloseTo(9.8);
    expect(result.unit.offset).toBe(0);
    expect(result.unit.dimension).toEqual([1, 0, -2, 0, 0, 0, 0]);
  });
});

describe("回帰テスト: 評価器の予約識別子を記号にできない", () => {
  it("e / pi / sin などは symbolTaken になる", () => {
    // 記号 e を許すと、2e（単位として4m）と 2*e（自然対数の底で5.4366）が
    // どちらもエラーにならないまま別の値になる。
    ["e", "pi", "sin", "cos", "log", "sqrt"].forEach((symbol) => {
      const result = parseCustomUnit(symbol, "2m", { existingSymbols: [] });
      expect(result, symbol).toEqual({ status: "error", code: "symbolTaken" });
    });
    expect(isUsableCustomUnitSymbol("e")).toBe(false);
    // atan2 は数字を含むので、予約語の判定に到達する前に記号の形式で弾かれる。
    expect(parseCustomUnit("atan2", "2m", { existingSymbols: [] })).toEqual({ status: "error", code: "invalidSymbol" });
  });
});

describe("回帰テスト: オフセット付き自作単位は単独でしか使えない", () => {
  it("裸の識別子として使うとoffsetを黙って落とさずエラーになる", () => {
    // 華氏相当の自作単位。"32fah" は273.15Kだが、"2*fah" は識別子経路を通り、
    // 以前はoffsetが落ちて1.111Kという誤った値を返していた。
    setCustomUnits([{ symbol: "fah", scale: 5 / 9, offset: 255.3722222222222, dimension: [0, 0, 0, 0, 1, 0, 0] }]);
    expect(evaluateExpression("32fah").siValue).toBeCloseTo(273.15);
    expect(() => evaluateExpression("2*fah")).toThrow();
    setCustomUnits([]);
  });

  it("オフセットの無い自作単位は従来どおり裸の識別子でも使える", () => {
    setCustomUnits([{ symbol: "shaku", scale: 0.303, dimension: [1, 0, 0, 0, 0, 0, 0] }]);
    expect(evaluateExpression("2*shaku").siValue).toBeCloseTo(0.606);
    setCustomUnits([]);
  });
});

describe("isCustomUnit（保存データ・バックアップの復元検証）", () => {
  const VALID: CustomUnit = { symbol: "shaku", expression: "0.303m", scale: 0.303, offset: 0, dimension: [1, 0, 0, 0, 0, 0, 0] };

  it("有効な自作単位を受け入れる", () => {
    expect(isCustomUnit(VALID)).toBe(true);
  });

  it("記号に数字を含む要素は拒否する（parseUnitが二度と引けなくなるため）", () => {
    expect(isCustomUnit({ ...VALID, symbol: "s3" })).toBe(false);
  });

  it("組み込み単位と衝突する記号は拒否する（幽霊単位になるため）", () => {
    expect(isCustomUnit({ ...VALID, symbol: "m" })).toBe(false);
  });

  it("scaleが0の要素は拒否する（convertQuantityがInfinityになるため）", () => {
    expect(isCustomUnit({ ...VALID, scale: 0 })).toBe(false);
  });

  it("dimensionが7要素でない要素は拒否する", () => {
    expect(isCustomUnit({ ...VALID, dimension: [1, 0, 0, 0, 0, 0] })).toBe(false);
  });
});

describe("parseCustomUnitsField", () => {
  const VALID: CustomUnit = { symbol: "shaku", expression: "0.303m", scale: 0.303, offset: 0, dimension: [1, 0, 0, 0, 0, 0, 0] };

  it("配列でない値は空配列を返す", () => {
    expect(parseCustomUnitsField(undefined)).toEqual([]);
    expect(parseCustomUnitsField(null)).toEqual([]);
    expect(parseCustomUnitsField("not an array")).toEqual([]);
  });

  it("壊れた要素だけを黙って捨てる", () => {
    expect(parseCustomUnitsField([VALID, { ...VALID, symbol: "m" }, "not even an object"])).toEqual([VALID]);
  });

  it("同じ記号が複数あれば先勝ちで1つに絞る", () => {
    const differentShaku = { ...VALID, expression: "0.3m", scale: 0.3 };
    expect(parseCustomUnitsField([VALID, differentShaku])).toEqual([VALID]);
  });
});

describe("customUnitsAreEqual / countCustomUnitConflicts", () => {
  const SHAKU: CustomUnit = { symbol: "shaku", expression: "0.303m", scale: 0.303, offset: 0, dimension: [1, 0, 0, 0, 0, 0, 0] };

  it("定義が完全に同じなら等しいと判定する", () => {
    expect(customUnitsAreEqual(SHAKU, { ...SHAKU })).toBe(true);
  });

  it("scale・offset・dimensionのいずれかが違えば等しくないと判定する", () => {
    expect(customUnitsAreEqual(SHAKU, { ...SHAKU, scale: 0.3 })).toBe(false);
    expect(customUnitsAreEqual(SHAKU, { ...SHAKU, offset: 1 })).toBe(false);
    expect(customUnitsAreEqual(SHAKU, { ...SHAKU, dimension: [0, 1, 0, 0, 0, 0, 0] })).toBe(false);
  });

  it("記号が新規なら衝突として数えない", () => {
    expect(countCustomUnitConflicts([], [SHAKU])).toBe(0);
  });

  it("同じ記号で定義も同じなら衝突として数えない", () => {
    expect(countCustomUnitConflicts([SHAKU], [{ ...SHAKU }])).toBe(0);
  });

  it("同じ記号で定義が違えば衝突として数える", () => {
    expect(countCustomUnitConflicts([SHAKU], [{ ...SHAKU, expression: "0.3m", scale: 0.3 }])).toBe(1);
  });
});

describe("mergeCustomUnits（取り込みの唯一のマージ規則: 追加・同名記号の置換のみ、削除しない）", () => {
  const SHAKU: CustomUnit = { symbol: "shaku", expression: "0.303m", scale: 0.303, offset: 0, dimension: [1, 0, 0, 0, 0, 0, 0] };
  const SUN: CustomUnit = { symbol: "sun", expression: "0.0303m", scale: 0.0303, offset: 0, dimension: [1, 0, 0, 0, 0, 0, 0] };

  it("既存に無い記号は追加される", () => {
    expect(mergeCustomUnits([SHAKU], [SUN])).toEqual([SHAKU, SUN]);
  });

  it("同じ記号は置換される（既存の並び順は保つ）", () => {
    const updatedShaku = { ...SHAKU, expression: "0.3m", scale: 0.3 };
    expect(mergeCustomUnits([SHAKU, SUN], [updatedShaku])).toEqual([updatedShaku, SUN]);
  });

  it("incomingに含まれない既存の自作単位は絶対に削除されない", () => {
    // 「すべての計算ノートを置換」であっても自作単位は消えない、という不変条件を直接検証する。
    expect(mergeCustomUnits([SHAKU, SUN], [])).toEqual([SHAKU, SUN]);
  });
});
