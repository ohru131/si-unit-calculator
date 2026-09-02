import type { Quantity } from "@/lib/units";

/** 起動時の初期式復元に使う、履歴1件分の最小限の情報（SavedCalculationの部分集合）。 */
export type StartupHistoryEntry = {
  expression: string;
  targetUnit: string;
  quantity: Quantity;
};

/**
 * 起動時、電卓画面に何を初期表示すべきかを決める純関数。
 *
 * WHY: 「固定のサンプル式」ではなく「最後に計算した式」を初期表示してほしいという要望に対応する。
 * ただし履歴はAsyncStorageから非同期に読み込まれるため、画面マウント直後は必ずhistoryが空配列で、
 * 読み込み完了を待ってから改めて反映する必要がある。その待っている間にユーザーが自分で式を
 * 入力し始めていたら、非同期の復元が割り込んでその入力を消してしまってはいけない
 * （実際にこの種の「テストは通るが挙動が壊れる」バグをこのプロジェクトで繰り返し踏んでいるため、
 * 判定ロジックだけをここに切り出してユニットテストできるようにしてある）。
 *
 * 呼び出し側は、マウント時点のexpressionの値をinitialExpressionとして固定で覚えておき、
 * ストアの読み込みが完了した瞬間のcurrentExpressionと比較する。両者が一致していれば
 * 「その間に何も変わっていない＝ユーザーはまだ何も打っていない」とみなして履歴を反映してよい。
 * 一致していなければ（ユーザー入力・クイックアクション・プリセット復元など何かが先に起きていた
 * ということなので）何も返さない。
 */
export function resolveStartupExpression(params: {
  currentExpression: string;
  initialExpression: string;
  latestHistoryEntry: StartupHistoryEntry | undefined;
}): StartupHistoryEntry | null {
  if (params.currentExpression !== params.initialExpression) return null;
  return params.latestHistoryEntry ?? null;
}
