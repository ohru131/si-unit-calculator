import { describe, expect, it, vi } from "vitest";

// vi.mock は vitest が import より上にホイストするため、importの後に書いてよい。
// lib/notebooks-backup.ts は UNCATEGORIZED_CATEGORY_ID を値として lib/calculator-store.tsx から
// importしており、その先の useGlobalSettings（@/lib/global-settings）経由で expo-localization →
// react-native の内部実装（Flow構文を含む生の.js）まで読み込まれてしまい、このvitest環境では
// パースできない（tests/preset-price-defaults.test.tsと同じ既知の制約）。ここではReactに
// 依存しない純関数（sanitizeBackupFileLabel）だけを検証したいので、実体を読み込ませずにモックする。
vi.mock("@/lib/global-settings", () => ({ useGlobalSettings: () => ({ language: "en", currencyCode: null, regionCode: null }) }));

import { sanitizeBackupFileLabel } from "../lib/notebooks-backup";

describe("sanitizeBackupFileLabel", () => {
  it("日本語のカテゴリ名はそのまま使える（禁則文字が無いので変化しない）", () => {
    expect(sanitizeBackupFileLabel("材料力学")).toBe("材料力学");
  });

  it("ファイル名に使えない記号をハイフンに置換し、連続するハイフンはまとめる", () => {
    expect(sanitizeBackupFileLabel('a/b\\c:d*e?f"g<h>i|j')).toBe("a-b-c-d-e-f-g-h-i-j");
  });

  it("記号だけの名前は空文字になり、呼び出し側でフォールバックできる", () => {
    expect(sanitizeBackupFileLabel("***///")).toBe("");
  });

  it("空文字はそのまま空文字を返す", () => {
    expect(sanitizeBackupFileLabel("")).toBe("");
  });

  it("前後の空白・ハイフンは畳んで取り除く", () => {
    expect(sanitizeBackupFileLabel("  自転車  ")).toBe("自転車");
    expect(sanitizeBackupFileLabel("--車/自転車--")).toBe("車-自転車");
  });

  it("長すぎる名前は上限で切り詰める", () => {
    const longLabel = "あ".repeat(200);
    const result = sanitizeBackupFileLabel(longLabel);
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result).toBe("あ".repeat(60));
  });

  it("制御文字もハイフンに置換される", () => {
    // 生の制御文字（タブ=char code 9）をツール入力のエスケープ表記に頼らず組み立てる。
    const withTab = `料理${String.fromCharCode(9)}ノート`;
    expect(sanitizeBackupFileLabel(withTab)).toBe("料理-ノート");
  });
});
