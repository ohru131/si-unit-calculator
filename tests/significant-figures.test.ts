import { describe, expect, it } from "vitest";

import { inferSignificantDigits, significantDigitsAfterConversion, significantDigitsOfLiteral, toScientificNotation, toSignificantDecimal } from "../lib/significant-figures";
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

  // normalizeExpression は空白を1つに詰めるだけで消さず、評価器は数値と演算子の間の空白を
  // 許す（`123 × 10 ^ 8` は評価器では 1.23e10）。空白を読み飛ばさないとこの 10 を測定値として
  // 2桁と数え、本来3桁の結果が2桁に丸まる。
  it("空白が挟まっても科学表記の底として扱う", () => {
    expect(digitsOf("123 × 10 ^ 8")).toBe(3);
    expect(digitsOf("123 × 10 ^ -8")).toBe(3);
    expect(digitsOf("123×10^8")).toBe(3);
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
    expect(result?.text).toBe("≈ 2.6");
    expect(result?.roundedFrom).toBe("2.553191489");
  });

  it("丸めても値が変わらないときは近似記号も併記も出さない", () => {
    const result = toScientificNotation(2.5, { significantDigits: 2, locale: "en-US" });
    expect(result?.text).toBe("2.5");
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

  // `×10⁰` は表記として誰も書かない。表示単位の自動選択が値を1〜1000に収めるので
  // 単位付きの結果では指数0が最も多く、そのたびに付くと丸めた値を読む邪魔になる。
  it("指数が0のときは倍率の因子を書かない", () => {
    const result = toScientificNotation(2.5531914893617023, { significantDigits: 2, locale: "en-US" });
    expect(result?.exponent).toBe(0);
    expect(result?.text).toBe("≈ 2.6");
  });

  it("指数が0以外のときは従来どおり倍率を書く", () => {
    const result = toScientificNotation(2500, { significantDigits: 2, locale: "en-US" });
    expect(result?.exponent).toBe(3);
    expect(result?.text).toBe("2.5×10³");
  });

  it("負の指数と負の値", () => {
    expect(toScientificNotation(0.0023, { significantDigits: 2, locale: "en-US" })?.text).toBe("2.3×10⁻³");
    expect(toScientificNotation(-19.6, { significantDigits: 1, locale: "en-US" })?.mantissa).toBe("-2");
  });

  // 表示はKaTeXではなくUnicodeの上付き数字。小数表示と同じ Text で描くための形。
  it("小数点がカンマのロケールでもそのまま出す", () => {
    const result = toScientificNotation(2.6, { significantDigits: 2, locale: "de-DE" });
    expect(result?.mantissa).toBe("2,6");
    expect(result?.text).toBe("2,6");
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
    expect(result?.text).toBe("≈ 2.6×10⁻³");
    expect(result?.roundedFrom).toBe("0.002553191489");
  });

  it("重量は1桁に落ちる（掛け算の最小桁数がそのまま出る）", () => {
    const expression = "2kg × 9.8m/s²";
    const value = evaluateExpression(expression, []).siValue;
    const result = toScientificNotation(value, { significantDigits: inferSignificantDigits(expression), locale: "en-US" });
    expect(result?.text).toBe("≈ 2×10¹");
    expect(result?.roundedFrom).toBe("19.6");
  });

  it("科学表記で入れた式は桁が保たれる", () => {
    const expression = "3×10⁸ m/s × 2s";
    const value = evaluateExpression(expression, []).siValue;
    expect(value).toBe(6e8);
    const result = toScientificNotation(value, { significantDigits: inferSignificantDigits(expression), locale: "en-US" });
    expect(result?.text).toBe("6×10⁸");
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

describe("階乗の桁", () => {
  it("階乗の対象は測定値として数えない", () => {
    // `5!` の 5 は「5の階乗」という厳密な指定で、答えの 120 も厳密。ここを1桁と数えると
    // `≈ 1×10²` に丸まって正しい値を出せなくなる。
    expect(inferSignificantDigits("5!")).toBeNull();
    expect(inferSignificantDigits("10!")).toBeNull();
    // 同じ式に本物の測定値があれば、そちらの桁で決まる。
    expect(inferSignificantDigits("12.5*2!")).toBe(3);
    expect(inferSignificantDigits("10!*1.5")).toBe(2);
  });

  it("括弧で括った階乗の対象も数えない", () => {
    // 評価器は `(5)!` も `3*(4)!` も受ける。直後の1文字しか見ない判定だと括弧の中の
    // 数字が測定値として数えられ、厳密な 120 が `≈ 1×10²` に丸まる（CodeRabbitが#72で検出）。
    expect(inferSignificantDigits("(5)!")).toBeNull();
    expect(inferSignificantDigits("(5) !")).toBeNull();
    // 括弧の外の数値は従来どおり測定値。`1.75` の3桁で決まり、`4` には引きずられない。
    expect(inferSignificantDigits("1.75*(4)!")).toBe(3);
    expect(inferSignificantDigits("(2.5)!*1.75")).toBe(3);
    // 階乗ではない括弧の中は従来どおり数える。
    expect(inferSignificantDigits("(4.70)*1.2345")).toBe(3);
  });
});

describe("有効数字付きの小数", () => {
  it("末尾の0を保つ（0.9 を2桁で読むと 0.90）", () => {
    const result = toSignificantDecimal(0.9, { significantDigits: 2, locale: "en-US" });
    expect(result?.text).toBe("0.90");
    // 値そのものは変わっていないので近似記号も併記も出さない。
    expect(result?.roundedFrom).toBeNull();
  });

  it("桁が落ちるときは近似記号と丸める前の値を付ける", () => {
    const result = toSignificantDecimal(2.5531914893617023, { significantDigits: 2, locale: "en-US" });
    expect(result?.text).toBe("≈ 2.6");
    expect(result?.roundedFrom).toBe("2.553191489");
  });

  // 10のべきへは直さない（科学表記との違い）。0.0023 は 2.3×10⁻³ ではなく 0.0023 のまま。
  it("小数点の位置は動かさない", () => {
    expect(toSignificantDecimal(0.0023456, { significantDigits: 2, locale: "en-US" })?.text).toBe("≈ 0.0023");
    expect(toSignificantDecimal(19.6, { significantDigits: 1, locale: "en-US" })?.text).toBe("≈ 20");
  });

  it("丸めた結果が小数表示と同じ文字列なら出さない（押しても何も変わらないチップを作らない）", () => {
    expect(toSignificantDecimal(2.5, { significantDigits: 2, locale: "en-US" })).toBeNull();
  });

  it("桁数が読めないとき・0・非有限値は出さない", () => {
    expect(toSignificantDecimal(1.23, { locale: "en-US" })).toBeNull();
    expect(toSignificantDecimal(0, { significantDigits: 2, locale: "en-US" })).toBeNull();
    expect(toSignificantDecimal(Number.NaN, { significantDigits: 2, locale: "en-US" })).toBeNull();
  });

  it("丸めで桁が繰り上がっても小数点以下の桁数がずれない", () => {
    // 999.9 を3桁 → 1000。指数が2から3へ繰り上がるので、小数点以下は0桁になる。
    expect(toSignificantDecimal(999.9, { significantDigits: 3, locale: "en-US" })?.text).toBe("≈ 1000");
  });

  it("ロケールの小数点に従う", () => {
    expect(toSignificantDecimal(0.9, { significantDigits: 2, locale: "de-DE" })?.text).toBe("0,90");
  });
});

describe("参照している定数まで辿って桁を数える（計算ノート用）", () => {
  const sources: Record<string, string> = { V: "100V", I: "5A", "φ": "acos(0.8)", P: "V*I*cos(φ)" };
  const resolveIdentifier = (symbol: string) => sources[symbol];

  it("リテラルが1つも無い式でも、参照先の定数から桁が読める", () => {
    // 手順の式は識別子だけ。辿らなければ null にしかならない。
    expect(inferSignificantDigits("V*I*cos(φ)")).toBeNull();
    expect(inferSignificantDigits("V*I*cos(φ)", { resolveIdentifier })).toBe(1);
  });

  it("先行手順の記号を辿って元の入力値の桁に行き着く", () => {
    expect(inferSignificantDigits("P/2", { resolveIdentifier })).toBe(1);
  });

  it("関数名や解決できない名前は数えない", () => {
    expect(inferSignificantDigits("cos(0.80)", { resolveIdentifier })).toBe(2);
    expect(inferSignificantDigits("unknown*1.25", { resolveIdentifier })).toBe(3);
  });

  it("参照先が加減算の混ざる式なら、この式でも桁を主張しない", () => {
    const mixed = (symbol: string) => (symbol === "x" ? "1.5m + 20cm" : undefined);
    expect(inferSignificantDigits("x*2.5", { resolveIdentifier: mixed })).toBeNull();
  });

  it("循環参照でも止まる", () => {
    const loop = (symbol: string) => (symbol === "a" ? "b*1.25" : symbol === "b" ? "a*2.5" : undefined);
    expect(inferSignificantDigits("a", { resolveIdentifier: loop })).toBe(2);
  });
});
