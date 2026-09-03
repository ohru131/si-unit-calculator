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
      resolveStartupExpression({ currentExpression: "", initialExpression: "", hasUserInteracted: false, latestHistoryEntry: HISTORY_ENTRY }),
    ).toEqual(HISTORY_ENTRY);
  });

  it("履歴が無ければ何も返さない（プレースホルダのまま）", () => {
    expect(
      resolveStartupExpression({ currentExpression: "", initialExpression: "", hasUserInteracted: false, latestHistoryEntry: undefined }),
    ).toBeNull();
  });

  it("履歴の読み込みを待つ間にユーザーが入力し始めていたら、割り込んで上書きしない", () => {
    // マウント時点の初期値("")から変わっている＝ユーザーが既に何か打った（or 他の復元が先に起きた）
    expect(
      resolveStartupExpression({ currentExpression: "12kg", initialExpression: "", hasUserInteracted: false, latestHistoryEntry: HISTORY_ENTRY }),
    ).toBeNull();
  });

  // 「currentExpressionとinitialExpressionの比較」を外して常に履歴を返すバグを混入させると、
  // 上のテストが検出できることを確認するための回帰用ケース。型チェック・他の既存テストが全部
  // 通っていても、この一致判定を落とすと「ユーザーの入力が消える」壊れ方をする。
  it("初期値と食い違っている場合はundefinedの履歴でもnullのまま（比較を飛ばして履歴優先にしていないことの確認）", () => {
    expect(
      resolveStartupExpression({ currentExpression: "12kg", initialExpression: "", hasUserInteracted: false, latestHistoryEntry: undefined }),
    ).toBeNull();
  });
});

describe("読み込み中にユーザーが操作していたら復元しない", () => {
  const entry = { expression: "5cm + 1mm", targetUnit: "cm", quantity: { value: 0.051, dimension: [1, 0, 0, 0, 0, 0, 0] } as never };

  // CodeRabbitが指摘した実際のバグ。式の中身だけを見る判定だと、全消し(AC)を押した／打ってから
  // 消した／表示単位だけ変えた、のいずれも「式は初期値のまま」なので「まだ何もしていない」と
  // 誤判定し、ユーザーが自分で消したはずの画面に履歴が復活してしまう。画面側はこれらの操作すべてで
  // hasUserInteracted を立てる（pressKey・式欄のonChangeText・applyTargetUnit・restoreHistory・applySample）。
  it("操作済みなら、式が初期値と同じままでも復元しない", () => {
    expect(
      resolveStartupExpression({ currentExpression: "", initialExpression: "", hasUserInteracted: true, latestHistoryEntry: entry }),
    ).toBeNull();
  });

  it("何も操作していなければ復元する", () => {
    expect(
      resolveStartupExpression({ currentExpression: "", initialExpression: "", hasUserInteracted: false, latestHistoryEntry: entry }),
    ).toEqual(entry);
  });

  // 操作の記録を立て忘れた経路（新しい導線を足したときなど）でも、式が変わっていれば保険で復元しない。
  it("操作の記録が無くても、式が初期値と違えば復元しない", () => {
    expect(
      resolveStartupExpression({ currentExpression: "3m", initialExpression: "", hasUserInteracted: false, latestHistoryEntry: entry }),
    ).toBeNull();
  });
});
