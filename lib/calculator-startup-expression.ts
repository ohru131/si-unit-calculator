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
 * 判定は2段構えにする。
 *
 * 1. hasUserInteracted: 呼び出し側が「ユーザーが電卓の状態を変える操作をしたか」を明示的に記録する。
 *    **式の中身だけを見る判定では足りない**。読み込み中に全消し(AC)を押した、あるいは何か打ってから
 *    消した場合、式は初期値と同じ空文字に戻るので「何も起きていない」と誤判定し、ユーザーが自分で
 *    消したはずの画面に履歴が復活してしまう。表示単位だけを変えた場合も式は変わらない。
 * 2. currentExpression と initialExpression の比較: 1のフラグを立て忘れた経路（新しい導線を足したとき
 *    など）でも、式が変わっていれば復元しないための保険。
 *
 * どちらか一方でも「もう触られている」と判断できれば復元しない。
 */
export function resolveStartupExpression(params: {
  currentExpression: string;
  initialExpression: string;
  hasUserInteracted: boolean;
  latestHistoryEntry: StartupHistoryEntry | undefined;
}): StartupHistoryEntry | null {
  if (params.hasUserInteracted) return null;
  if (params.currentExpression !== params.initialExpression) return null;
  return params.latestHistoryEntry ?? null;
}
