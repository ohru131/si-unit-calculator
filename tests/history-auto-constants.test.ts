import { describe, expect, it } from "vitest";

import { historyToAutoConstants } from "../lib/history-auto-constants";
import { evaluateExpression } from "../lib/units";

describe("履歴の自動定数", () => {
  it("最新の履歴からa1、a2の順に自動定数を作り、後続の式で再利用する", () => {
    const autoConstants = historyToAutoConstants([
      { id: "new", expression: "5m", resultText: "5 m", quantity: { siValue: 5, dimension: [1, 0, 0, 0, 0, 0, 0] }, targetUnit: "m", createdAt: "2026-08-22T02:00:00.000Z" },
      { id: "old", expression: "30cm", resultText: "30 cm", quantity: { siValue: 0.3, dimension: [1, 0, 0, 0, 0, 0, 0] }, targetUnit: "cm", createdAt: "2026-08-22T01:00:00.000Z" },
    ]);
    expect(autoConstants.map((item) => item.symbol)).toEqual(["a1", "a2"]);
    expect(evaluateExpression("a1 + a2", autoConstants).siValue).toBeCloseTo(5.3);
  });
});
