import { describe, expect, it } from "vitest";

import { sanitizeCssFontFamily, sanitizeCssFontWeight } from "@/lib/latex-mathsf-font";

describe("sanitizeCssFontFamily", () => {
  it("アプリが渡す等幅フォント名をそのまま通す", () => {
    expect(sanitizeCssFontFamily("Menlo")).toBe("Menlo");
    expect(sanitizeCssFontFamily("monospace")).toBe("monospace");
    expect(sanitizeCssFontFamily('"Courier New", monospace')).toBe('"Courier New", monospace');
  });

  it("CSSの宣言やセレクタを閉じられる字面は弾く", () => {
    // 値はCSSの宣言へ埋め込むので、"}" や ";" を通すと別の指定を注入できてしまう。
    expect(sanitizeCssFontFamily("Menlo;color:red")).toBeNull();
    expect(sanitizeCssFontFamily("Menlo}body{display:none")).toBeNull();
    expect(sanitizeCssFontFamily("url(x)")).toBeNull();
  });

  it("空・未指定はnull（KaTeX既定のまま）", () => {
    expect(sanitizeCssFontFamily("")).toBeNull();
    expect(sanitizeCssFontFamily("   ")).toBeNull();
    expect(sanitizeCssFontFamily(undefined)).toBeNull();
  });
});

describe("sanitizeCssFontWeight", () => {
  it("100刻みの数値とキーワードを通す", () => {
    expect(sanitizeCssFontWeight(700)).toBe("700");
    expect(sanitizeCssFontWeight("400")).toBe("400");
    expect(sanitizeCssFontWeight("bold")).toBe("bold");
  });

  it("それ以外は弾く", () => {
    expect(sanitizeCssFontWeight(750)).toBeNull();
    expect(sanitizeCssFontWeight("700;color:red")).toBeNull();
    expect(sanitizeCssFontWeight(undefined)).toBeNull();
  });
});
