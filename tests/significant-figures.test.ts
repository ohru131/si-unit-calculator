import { describe, expect, it } from "vitest";

import { inferSignificantDigits, significantDigitsAfterConversion, significantDigitsOfLiteral, toScientificNotation } from "../lib/significant-figures";
import { convertQuantity, evaluateExpression } from "../lib/units";

const digitsOf = (expression: string) => inferSignificantDigits(expression);

describe("数値リテラル1つの有効数字", () => {
  it("先頭の0は数えず、末尾の0は数える", () => {
    expect(significantDigitsOfLiteral("0.0510")).toBe(3);
    expect(significantDigitsOfLiteral("2.50")).toBe(3);
    expect(significantDigitsOfLiteral("4.7")).toBe(2);
  });

  // 整数の末尾の0は本来あいまいだが、有効として数える方に寄せている。厳密な教科書の
  // ルールを当てると 230V / 10kΩ が1桁になり、この電卓で最も多い入力が使い物にならない。
  it("整数の末尾の0も有効として数える", () => {
    expect(significantDigitsOfLiteral("230")).toBe(3);
    expect(significantDigitsOfLiteral("10")).toBe(2);
    expect(significantDigitsOfLiteral("100")).toBe(3);
  });

  it("指数部は桁に数えない", () => {
    expect(significantDigitsOfLiteral("1.72e-8")).toBe(3);
    expect(significantDigitsOfLiteral("2E2")).toBe(1);
  });

  it("0は有効数字を持たない", () => {
    expect(significantDigitsOfLiteral("0")).toBeNull();
    expect(significantDigitsOfLiteral("0.000")).toBeNull();
  });
});

describe("入力式から読む有効数字", () => {
  it("乗除はリテラルの最小桁数", () => {
    expect(digitsOf("12V / 4.7kΩ")).toBe(2);
    expect(digitsOf("230V / 10kΩ")).toBe(2);
    expect(digitsOf("2kg × 9.8m/s²")).toBe(1);
  });

  // 加減算の桁数は「有効数字の最小」ではなく「小数点以下の位の最小」で決まり、しかも
  // 5cm と 1mm のように項ごとに単位が違うとリテラルの文字面からは位が読めない。
  it("加減算が混ざる式では読み取らない", () => {
    expect(digitsOf("5cm + 1mm")).toBeNull();
    expect(digitsOf("2kg×0.25×9.8m/s² - 5N")).toBeNull();
  });

  it("単項の符号は加減算として扱わない", () => {
    expect(digitsOf("-4.7kΩ × 2mA")).toBe(1);
    expect(digitsOf("1.72e-8")).toBe(3);
  });

  // 指数の位置にある数値は測定値ではなく表記なので数えない。数えると (6371km)^2 が
  // 1桁に落ちる。科学表記の底の 10 も同じ理由で数えない。
  it("指数と科学表記の底は数えない", () => {
    expect(digitsOf("(6371km)^2 × 3.14")).toBe(3);
    expect(digitsOf("3×10^8 m/s")).toBe(1);
    expect(digitsOf("1.5×10⁸ m")).toBe(2);
  });

  it("単位サフィックスの中の指数は桁に数えない", () => {
    // m² の 2 を桁として数えていると 1 になる。
    expect(digitsOf("100N / 0.25m²")).toBe(2);
  });

  // 1文字ずつ進めると `atan2` の 2 が1桁のリテラルとして数えられ、有効数字が黙って
  // 1桁に落ちる（エラーにならないので気付けない）。履歴参照の `a1`・手順参照の `s1` も同じ。
  it("識別子の末尾の数字を桁として数えない", () => {
    expect(digitsOf("atan2(2.0, 3.00)")).toBe(2);
    expect(digitsOf("log2(8.00)")).toBe(3);
    expect(digitsOf("a1 × 4.7")).toBe(2);
  });

  // カンマを値として扱うと直後の符号が二項の引き算に見え、桁を読めなくなる。
  it("関数の引数の区切りを跨いだ符号は単項として扱う", () => {
    expect(digitsOf("atan2(2.0, -3.00)")).toBe(2);
  });

  it("リテラルが無い式ではnull", () => {
    expect(digitsOf("")).toBeNull();
    expect(digitsOf("pi × e")).toBeNull();
  });
});

describe("科学表記の組み立て", () => {
  it("有効数字で丸め、丸める前の値を残す", () => {
    const result = toScientificNotation(2.5531914893617023, { significantDigits: 2, locale: "en-US" });
    expect(result?.mantissa).toBe("2.6");
    expect(result?.exponent).toBe(0);
    expect(result?.text).toBe("≈ 2.6 × 10⁰");
    expect(result?.roundedFrom).toBe("2.553191489");
  });

  it("丸めても値が変わらないときは近似記号も併記も出さない", () => {
    const result = toScientificNotation(2.5, { significantDigits: 2, locale: "en-US" });
    expect(result?.text).toBe("2.5 × 10⁰");
    expect(result?.roundedFrom).toBeNull();
  });

  // 末尾の0は有効数字の情報そのものなので落とさない（2.50×10³ は3桁を意味する）。
  it("有効数字ぶんの末尾の0を保つ", () => {
    expect(toScientificNotation(2500, { significantDigits: 3, locale: "en-US" })?.mantissa).toBe("2.50");
  });

  it("桁数を指定しないときは丸めない", () => {
    const result = toScientificNotation(2.5531914893617023, { locale: "en-US" });
    expect(result?.mantissa).toBe("2.553191489");
    expect(result?.roundedFrom).toBeNull();
    expect(result?.text.startsWith("≈")).toBe(false);
  });

  it("負の指数と負の値", () => {
    expect(toScientificNotation(0.0023, { significantDigits: 2, locale: "en-US" })?.text).toBe("2.3 × 10⁻³");
    expect(toScientificNotation(-19.6, { significantDigits: 1, locale: "en-US" })?.mantissa).toBe("-2");
  });

  // 小数点がカンマのロケールでは、LaTeXの数式モードで `,` の後に空白が入って
  // 「2, 6」に見えるため括弧で括る。
  it("小数点がカンマのロケールではLaTeX側で括る", () => {
    const result = toScientificNotation(2.6, { significantDigits: 2, locale: "de-DE" });
    expect(result?.mantissa).toBe("2,6");
    expect(result?.latex).toBe("2{,}6 \\times 10^{0}");
  });

  it("0と非有限値は表記しない", () => {
    expect(toScientificNotation(0, { locale: "en-US" })).toBeNull();
    expect(toScientificNotation(Number.NaN, { locale: "en-US" })).toBeNull();
    expect(toScientificNotation(Number.POSITIVE_INFINITY, { locale: "en-US" })).toBeNull();
  });
});

describe("実際の式を通した値（エンジン込み）", () => {
  it("オームの法則の電流を2桁で読む", () => {
    const expression = "12V / 4.7kΩ";
    const value = evaluateExpression(expression, []).siValue;
    const result = toScientificNotation(value, { significantDigits: inferSignificantDigits(expression), locale: "en-US" });
    expect(result?.text).toBe("≈ 2.6 × 10⁻³");
    expect(result?.roundedFrom).toBe("0.002553191489");
  });

  it("重量は1桁に落ちる（掛け算の最小桁数がそのまま出る）", () => {
    const expression = "2kg × 9.8m/s²";
    const value = evaluateExpression(expression, []).siValue;
    const result = toScientificNotation(value, { significantDigits: inferSignificantDigits(expression), locale: "en-US" });
    expect(result?.text).toBe("≈ 2 × 10¹");
    expect(result?.roundedFrom).toBe("19.6");
  });

  it("科学表記で入れた式は桁が保たれる", () => {
    const expression = "3×10⁸ m/s × 2s";
    const value = evaluateExpression(expression, []).siValue;
    expect(value).toBe(6e8);
    const result = toScientificNotation(value, { significantDigits: inferSignificantDigits(expression), locale: "en-US" });
    expect(result?.text).toBe("6 × 10⁸");
    expect(result?.roundedFrom).toBeNull();
  });
});

// オフセットを持つ単位への換算は `値*scale + offset` のアフィン変換なので、有効数字ではなく
// 「小数点以下の位」で決まる量に変わる。300K（3桁）→ 26.85°C を3桁で丸めると 26.9°C になるが、
// 元の精度は1Kなので正しくは 27°C。加減算と同じ理由で、ここでは丸めない方を選ぶ。
describe("表示単位への換算を挟んだあとの桁数", () => {
  it("オフセットを持つ単位では桁を持ち越さない", () => {
    expect(significantDigitsAfterConversion(3, "°C")).toBeNull();
    expect(significantDigitsAfterConversion(3, "°F")).toBeNull();
  });

  it("倍率だけの換算は桁を保つ", () => {
    expect(significantDigitsAfterConversion(3, "cm")).toBe(3);
    expect(significantDigitsAfterConversion(2, "mA")).toBe(2);
    expect(significantDigitsAfterConversion(3, "K")).toBe(3);
  });

  it("表示単位なし・解決できない記号ではそのまま（換算が挟まらない）", () => {
    expect(significantDigitsAfterConversion(3, "")).toBe(3);
    expect(significantDigitsAfterConversion(3, "  ")).toBe(3);
    expect(significantDigitsAfterConversion(3, "zzz")).toBe(3);
  });

  it("読み取れていない桁数はそのままnull", () => {
    expect(significantDigitsAfterConversion(null, "cm")).toBeNull();
  });

  it("300K を °C で見ると丸めずに出る", () => {
    const expression = "300K";
    const converted = convertQuantity(evaluateExpression(expression, []), "°C", "en-US");
    const digits = significantDigitsAfterConversion(inferSignificantDigits(expression), converted.unit);
    expect(digits).toBeNull();
    const result = toScientificNotation(converted.value, { significantDigits: digits, locale: "en-US" });
    expect(result?.roundedFrom).toBeNull();
    expect(result?.text.startsWith("≈")).toBe(false);
  });
});
