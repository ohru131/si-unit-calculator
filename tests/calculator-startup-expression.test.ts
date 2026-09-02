import { describe, expect, it } from "vitest";

import { resolveStartupExpression, type StartupHistoryEntry } from "../lib/calculator-startup-expression";

const HISTORY_ENTRY: StartupHistoryEntry = {
  expression: "5cm + 1mm",
  targetUnit: "cm",
  quantity: { siValue: 0.051, dimension: [1, 0, 0, 0, 0, 0, 0] },
};

describe("resolveStartupExpression", () => {
  it("ユーザーが何も入力していなければ、最新の履歴を復元する", () => {
    expect(
      resolveStartupExpression({ currentExpression: "", initialExpression: "", latestHistoryEntry: HISTORY_ENTRY }),
    ).toEqual(HISTORY_ENTRY);
  });

  it("履歴が無ければ何も返さない（プレースホルダのまま）", () => {
    expect(
      resolveStartupExpression({ currentExpression: "", initialExpression: "", latestHistoryEntry: undefined }),
    ).toBeNull();
  });

  it("履歴の読み込みを待つ間にユーザーが入力し始めていたら、割り込んで上書きしない", () => {
    // マウント時点の初期値("")から変わっている＝ユーザーが既に何か打った（or 他の復元が先に起きた）
    expect(
      resolveStartupExpression({ currentExpression: "12kg", initialExpression: "", latestHistoryEntry: HISTORY_ENTRY }),
    ).toBeNull();
  });

  // 「currentExpressionとinitialExpressionの比較」を外して常に履歴を返すバグを混入させると、
  // 上のテストが検出できることを確認するための回帰用ケース。型チェック・他の既存テストが全部
  // 通っていても、この一致判定を落とすと「ユーザーの入力が消える」壊れ方をする。
  it("初期値と食い違っている場合はundefinedの履歴でもnullのまま（比較を飛ばして履歴優先にしていないことの確認）", () => {
    expect(
      resolveStartupExpression({ currentExpression: "12kg", initialExpression: "", latestHistoryEntry: undefined }),
    ).toBeNull();
  });
});
