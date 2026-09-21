import { describe, expect, it } from "vitest";

import { evaluateExpression, formatNumberForLocale, formatQuantity, MAX_DISPLAY_DIGITS } from "@/lib/units";

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

  it("範囲外の値は丸めて 1〜10 に収める", () => {
    expect(formatNumberForLocale(1.23456789, "ja-JP", 0)).toBe("1");
    expect(formatNumberForLocale(1.23456789012, "ja-JP", 99)).toBe("1.23456789");
  });

  it("単位付きの結果にも効く（計算ノート・電卓が通る経路）", () => {
    const quantity = evaluateExpression("5PS", []);
    expect(formatQuantity(quantity, "kW", "ja-JP", 6)).toBe("3.67749 kW");
    expect(formatQuantity(quantity, "kW", "ja-JP")).toBe("3.67749375 kW");
  });
});
