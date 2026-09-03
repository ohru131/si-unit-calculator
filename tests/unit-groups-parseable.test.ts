import { describe, expect, it } from "vitest";

import { evaluateExpression, parseUnit, UNIT_GROUPS } from "../lib/units";

// UNIT_GROUPS の単位は、そのまま画面の「単位チップ」として出て式に挿し込まれる。
// つまり**一覧に載っているのに式では使えない単位があると、ユーザーが必ず踏む罠になる**。
// グループを追加したときにこれを機械的に検出するためのテスト。
describe("単位チップに出す全単位が実際に式で使える", () => {
  it("parseUnit が全単位記号を解釈できる", () => {
    const offenders: string[] = [];
    for (const group of UNIT_GROUPS) {
      for (const unitOption of group.units) {
        try {
          parseUnit(unitOption.symbol);
        } catch (cause) {
          offenders.push(`${group.id}: "${unitOption.symbol}" (${cause instanceof Error ? cause.message : String(cause)})`);
        }
      }
    }
    expect(offenders, `parseUnitで解釈できない単位: ${offenders.join(", ")}`).toEqual([]);
  });

  it("「1<単位>」を式として評価でき、グループが宣言した次元と一致する", () => {
    // 次元の宣言ミス（手で7次元ベクトルを書くので取り違えやすい）もここで検出する。
    const offenders: string[] = [];
    for (const group of UNIT_GROUPS) {
      for (const unitOption of group.units) {
        try {
          const quantity = evaluateExpression(`1${unitOption.symbol}`);
          if (JSON.stringify(quantity.dimension) !== JSON.stringify(group.dimension)) {
            offenders.push(`${group.id}: "${unitOption.symbol}" は ${JSON.stringify(quantity.dimension)} で、グループ宣言 ${JSON.stringify(group.dimension)} と一致しない`);
          }
        } catch (cause) {
          offenders.push(`${group.id}: "1${unitOption.symbol}" を評価できない (${cause instanceof Error ? cause.message : String(cause)})`);
        }
      }
    }
    expect(offenders, `評価できない／次元が食い違う単位: ${offenders.join(" | ")}`).toEqual([]);
  });
});
