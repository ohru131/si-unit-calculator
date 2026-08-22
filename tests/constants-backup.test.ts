import { describe, expect, it } from "vitest";

import { parseConstantsBackup, serializeConstantsBackup } from "../lib/constants-backup";

describe("定数バックアップ", () => {
  it("定数の式と作成日時だけを持つ移植可能なJSONを作成し、読み戻す", () => {
    const json = serializeConstantsBackup([{ symbol: "W", expression: "3cm", createdAt: "2026-08-22T00:00:00.000Z", quantity: { siValue: 0.03, dimension: [1, 0, 0, 0, 0, 0, 0] } }], "2026-08-22T01:00:00.000Z");
    expect(parseConstantsBackup(json)).toEqual([{ symbol: "W", expression: "3cm", createdAt: "2026-08-22T00:00:00.000Z" }]);
  });

  it("不正な形式と重複した定数記号を拒否する", () => {
    expect(() => parseConstantsBackup("not json")).toThrow("JSON形式");
    expect(() => parseConstantsBackup(JSON.stringify({ format: "si-unit-calculator.constants", version: 1, constants: [{ symbol: "W", expression: "3cm", createdAt: "now" }, { symbol: "W", expression: "4cm", createdAt: "now" }] }))).toThrow("重複");
    expect(() => parseConstantsBackup(JSON.stringify({ format: "si-unit-calculator.constants", version: 1, constants: [{ symbol: "a1", expression: "3cm", createdAt: "now" }] }))).toThrow("無効");
  });
});
