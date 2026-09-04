import { describe, expect, it } from "vitest";

import { parseConstantsBackup, serializeConstantsBackup } from "../lib/constants-backup";
import type { CustomUnit } from "../lib/custom-units";

const SHAKU: CustomUnit = { symbol: "shaku", expression: "0.303m", scale: 0.303, offset: 0, dimension: [1, 0, 0, 0, 0, 0, 0] };

describe("定数バックアップ", () => {
  it("定数の式と作成日時だけを持つ移植可能なJSONを作成し、読み戻す", () => {
    const json = serializeConstantsBackup([{ symbol: "W", expression: "3cm", createdAt: "2026-08-22T00:00:00.000Z", quantity: { siValue: 0.03, dimension: [1, 0, 0, 0, 0, 0, 0] } }], [], "2026-08-22T01:00:00.000Z");
    expect(parseConstantsBackup(json, "ja")).toEqual({ constants: [{ symbol: "W", expression: "3cm", createdAt: "2026-08-22T00:00:00.000Z" }], customUnits: [] });
  });

  it("不正な形式と重複した定数記号を拒否する", () => {
    expect(() => parseConstantsBackup("not json", "ja")).toThrow("JSON形式");
    expect(() => parseConstantsBackup(JSON.stringify({ format: "si-unit-calculator.constants", version: 1, constants: [{ symbol: "W", expression: "3cm", createdAt: "now" }, { symbol: "W", expression: "4cm", createdAt: "now" }] }), "ja")).toThrow("重複");
    expect(() => parseConstantsBackup(JSON.stringify({ format: "si-unit-calculator.constants", version: 1, constants: [{ symbol: "a1", expression: "3cm", createdAt: "now" }] }), "ja")).toThrow("無効");
  });
});

describe("定数バックアップの自作単位（customUnits）", () => {
  it("自作単位ありで書き出す→読み込むと往復する", () => {
    const json = serializeConstantsBackup([], [SHAKU], "2026-09-04T00:00:00.000Z");
    const parsed = parseConstantsBackup(json, "en");
    expect(parsed.customUnits).toEqual([SHAKU]);
  });

  it("自作単位が無いときはcustomUnitsフィールド自体が出ない（従来どおりの形）", () => {
    const json = serializeConstantsBackup([], [], "2026-09-04T00:00:00.000Z");
    const backup = JSON.parse(json);
    expect(backup.customUnits).toBeUndefined();
    expect(parseConstantsBackup(json, "en").customUnits).toEqual([]);
  });

  it("customUnitsを持たない古い形式のファイルも今までどおり読める（後方互換）", () => {
    const legacyBackup = {
      format: "si-unit-calculator.constants",
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      constants: [{ symbol: "W", expression: "3cm", createdAt: "2026-01-01T00:00:00.000Z" }],
    };
    const parsed = parseConstantsBackup(JSON.stringify(legacyBackup), "en");
    expect(parsed.constants).toHaveLength(1);
    expect(parsed.customUnits).toEqual([]);
  });

  it("壊れた自作単位はその要素だけ黙って捨てる", () => {
    const backupWithBrokenUnits = {
      format: "si-unit-calculator.constants",
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      constants: [],
      customUnits: [
        SHAKU,
        { symbol: "s3", expression: "1m", scale: 1, offset: 0, dimension: [1, 0, 0, 0, 0, 0, 0] }, // 記号に数字を含む
        { symbol: "zero", expression: "0m", scale: 0, offset: 0, dimension: [1, 0, 0, 0, 0, 0, 0] }, // scaleが0
        { symbol: "bad", expression: "1m", scale: 1, offset: 0, dimension: [1, 0, 0, 0, 0, 0] }, // dimensionが6要素
        { symbol: "m", expression: "1m", scale: 1, offset: 0, dimension: [1, 0, 0, 0, 0, 0, 0] }, // 組み込み単位と衝突
      ],
    };
    const parsed = parseConstantsBackup(JSON.stringify(backupWithBrokenUnits), "en");
    expect(parsed.customUnits).toEqual([SHAKU]);
  });

  it("同じ記号が複数含まれていたら先勝ちで1つに絞る", () => {
    const differentShaku: CustomUnit = { ...SHAKU, expression: "0.3m", scale: 0.3 };
    const backupWithDuplicateSymbol = {
      format: "si-unit-calculator.constants",
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      constants: [],
      customUnits: [SHAKU, differentShaku],
    };
    const parsed = parseConstantsBackup(JSON.stringify(backupWithDuplicateSymbol), "en");
    expect(parsed.customUnits).toEqual([SHAKU]);
  });
});
