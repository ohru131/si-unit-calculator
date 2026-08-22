import { describe, expect, it } from "vitest";

import { historyToCsv } from "../lib/history-csv";

describe("計算履歴のCSV出力", () => {
  it("列見出し、結果、引用符を含む式をCSVとして正しくエスケープする", () => {
    const csv = historyToCsv([
      {
        createdAt: "2026-08-22T00:00:00.000Z",
        expression: "W = 3cm, H = 20mm",
        resultText: "6 cm²",
        targetUnit: "cm²",
      },
    ]);
    expect(csv).toContain("calculated_at,expression,result,display_unit");
    expect(csv).toContain('"W = 3cm, H = 20mm"');
    expect(csv).toContain('"6 cm²"');
  });
});
