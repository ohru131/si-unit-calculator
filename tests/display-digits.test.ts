import { describe, expect, it } from "vitest";

import { displayDigitsRoundedFrom, evaluateExpression, formatNumberForLocale, formatQuantity, MAX_DISPLAY_DIGITS, RESULT_DIGITS_UNLIMITED } from "@/lib/units";
import { DEFAULT_RESULT_DIGITS, parseStoredResultDigits } from "@/lib/result-digits";

// 表示桁数の上限は**有効数字の推定とは別物**。あちらは式から桁を読んで丸めるもので、
// こちらは「桁が読めなかったときでも画面に10桁並べない」ための表示上の切り詰め。
describe("表示する桁数の上限", () => {
  it("既定（渡さない）は従来どおり10桁", () => {
    expect(formatNumberForLocale(3.677493750123, "ja-JP")).toBe("3.67749375");
    expect(MAX_DISPLAY_DIGITS).toBe(10);
  });

  it("上限を渡すとその桁で止まる", () => {
    expect(formatNumberForLocale(3.677493750123, "ja-JP", 6)).toBe("3.67749");
    expect(formatNumberForLocale(3.677493750123, "ja-JP", 4)).toBe("3.677");
    // 桁が足りている値は変わらない（`≈` も付かない＝丸めたことにはしない）。
    expect(formatNumberForLocale(5.1, "ja-JP", 6)).toBe("5.1");
  });

  it("指数表記へ落ちる範囲でも上限が効く", () => {
    // |v| >= 1e7 は Intl を通さない経路なので、そちらにも掛ける必要がある。
    expect(formatNumberForLocale(27805780.123456, "ja-JP", 6)).toBe("2.78058e+7");
    // 既定（10桁）でも `formatNumber` 側が7桁に整形するので、ここは元から短い。
    expect(formatNumberForLocale(27805780.123456, "ja-JP")).toBe("2.780578e+7");
    expect(formatNumberForLocale(27805780.123456, "ja-JP", 4)).toBe("2.781e+7");
  });

  it("上限より大きい値は 10 桁に収める", () => {
    expect(formatNumberForLocale(1.23456789012, "ja-JP", 99)).toBe("1.23456789");
  });

  it("単位付きの結果にも効く（計算ノート・電卓が通る経路）", () => {
    const quantity = evaluateExpression("5PS", []);
    expect(formatQuantity(quantity, "kW", "ja-JP", 6)).toBe("3.67749 kW");
    expect(formatQuantity(quantity, "kW", "ja-JP")).toBe("3.67749375 kW");
  });
});

// 「丸めなし」（RESULT_DIGITS_UNLIMITED）は、10桁では表せない値を打った人のための逃げ道。
// 既定にはしない——上限を外すと倍精度の素の値がそのまま出る。
describe("丸めなし", () => {
  it("10桁を超える整数をそのまま出す", () => {
    expect(formatNumberForLocale(3333333333333, "ja-JP", RESULT_DIGITS_UNLIMITED)).toBe("3.333333333333e+12");
    // 既定（10桁）では桁が落ちる。
    expect(formatNumberForLocale(3333333333333, "ja-JP")).toBe("3.333333e+12");
  });

  it("Intl を通る範囲でも上限を掛けない", () => {
    expect(formatNumberForLocale(0.1 + 0.2, "ja-JP", RESULT_DIGITS_UNLIMITED)).toBe("0.30000000000000004");
    expect(formatNumberForLocale(0.1 + 0.2, "ja-JP")).toBe("0.3");
  });

  it("0 以下・非数はすべて上限なしに倒す（設定の読み込みが壊れても1桁にしない）", () => {
    expect(formatNumberForLocale(1.23456789012345, "ja-JP", -1)).toBe("1.23456789012345");
    expect(formatNumberForLocale(1.23456789012345, "ja-JP", Number.NaN)).toBe("1.23456789012345");
  });
});

// 4桁にしていると `2.553` がちょうどの値と見分けられない（利用者からの指摘）ので、
// 切り詰めたときは切り詰めていない値を画面に小さく併記する。
describe("displayDigitsRoundedFrom", () => {
  it("切り詰めたときだけ、上限を掛けない値（10桁）を返す", () => {
    expect(displayDigitsRoundedFrom(2.5531914893617023, "ja-JP", 4)).toBe("2.553191489");
    expect(displayDigitsRoundedFrom(3.677493750123, "ja-JP", 6)).toBe("3.67749375");
  });

  it("桁が足りている値には何も返さない（丸めていないのに丸めたように見せない）", () => {
    expect(displayDigitsRoundedFrom(5.1, "ja-JP", 4)).toBeNull();
    expect(displayDigitsRoundedFrom(0, "ja-JP", 4)).toBeNull();
  });

  it("上限が10桁以上・丸めなしのときは何も返さない", () => {
    expect(displayDigitsRoundedFrom(2.5531914893617023, "ja-JP", MAX_DISPLAY_DIGITS)).toBeNull();
    expect(displayDigitsRoundedFrom(2.5531914893617023, "ja-JP", RESULT_DIGITS_UNLIMITED)).toBeNull();
  });

  it("指数表記へ落ちる範囲でも効く", () => {
    expect(displayDigitsRoundedFrom(27805780.123456, "ja-JP", 4)).toBe("2.780578e+7");
  });
});

// 「丸めなし」＝0 を選択肢に足したことで、`Number(null)` が 0（＝妥当な設定値）になる経路が
// 生まれた。保存が無い端末が黙って丸めなしになる（実際に踏んだ）ので、保存の有無を先に分ける。
describe("parseStoredResultDigits", () => {
  it("保存が無いときは既定（6桁）", () => {
    expect(parseStoredResultDigits(null)).toBe(DEFAULT_RESULT_DIGITS);
    expect(parseStoredResultDigits(undefined)).toBe(DEFAULT_RESULT_DIGITS);
    expect(parseStoredResultDigits("")).toBe(DEFAULT_RESULT_DIGITS);
    expect(parseStoredResultDigits("   ")).toBe(DEFAULT_RESULT_DIGITS);
  });

  it("明示的に保存された「丸めなし」は読み戻す", () => {
    expect(parseStoredResultDigits("0")).toBe(RESULT_DIGITS_UNLIMITED);
  });

  it("選択肢に無い値は既定へ戻す", () => {
    expect(parseStoredResultDigits("7")).toBe(DEFAULT_RESULT_DIGITS);
    expect(parseStoredResultDigits("abc")).toBe(DEFAULT_RESULT_DIGITS);
  });

  it("選択肢の値はそのまま", () => {
    expect(parseStoredResultDigits("4")).toBe(4);
    expect(parseStoredResultDigits("10")).toBe(10);
  });
});
