/**
 * 下から出るシート（Modal）が OS のキーボードを自分で避けるための寸法。
 *
 * 【なぜ自前で避けるか】Modal は Android の `adjustResize` が効くウィンドウの外に出るので、
 * キーボードが上がってもシートは画面の下端に貼り付いたままで、中の入力欄がキーボードの裏に入る
 * （単位ピッカーの検索欄・定数の編集シートの両方で実機から報告された）。`KeyboardAvoidingView`
 * の `behavior="padding"` も iOS でしか効かず、Android では何もしないのと同じ。
 *
 * 判断をここに純関数として置くのは、電卓・ライブラリ・計算ノートのそれぞれが同じ規則で避けるため
 * （画面ごとに書くと必ずどこかが旧いままになる）。
 */

/** シートの下端の余白。ナビゲーションバー（safe area の下端）はキーボードが無いときだけ加算する。 */
export const SHEET_PADDING_BOTTOM = 28;
/**
 * シートの高さの上限（画面に対する比）。**スタイル側の `maxHeight: "86%"` と必ず同じ値にすること**
 * ——キーボードが出ている間だけ、この比から実際のキーボードの高さを引いた数値で上書きする。
 */
export const SHEET_MAX_HEIGHT_RATIO = 0.86;
/**
 * キーボードを避けたあとに残す最低限の高さ。これを割るくらい狭い端末では、見出しと入力欄だけでも
 * 出したうえで中身をスクロールさせる（何も見えないより良い）。
 */
export const SHEET_MIN_HEIGHT_WITH_KEYBOARD = 220;

export type SheetKeyboardLayout = {
  marginBottom?: number;
  maxHeight?: number;
  paddingBottom: number;
};

/**
 * キーボードの高さから、シートに重ねるスタイルを決める。
 *
 * **`marginBottom` だけ足さないこと。** 86% のままのシートがそのぶん上へはみ出し、見出しと
 * 入力欄が画面の外に出る（隠れる先がキーボードから画面の上端に変わるだけ）。上限の高さも同時に縮める。
 *
 * **下限（SHEET_MIN_HEIGHT_WITH_KEYBOARD）は残りの画面高で頭打ちにすること。** 無条件に当てると
 * `marginBottom + maxHeight` が画面の高さを超え、やはり上へはみ出す（画面高600・キーボード400なら
 * 400+220=620）。CodeRabbitが#72で検出した穴。
 *
 * キーボードが出ている間は `insetBottom` を足さない（`endCoordinates.height` にナビゲーションバーの
 * ぶんが既に入っている）。
 */
export function resolveSheetKeyboardLayout(
  keyboardHeight: number,
  windowHeight: number,
  insetBottom: number,
  // シートごとに見た目の寸法が違う（計算ノートの編集シートは 92% / 下余白36）。**比と余白は
  // スタイル側の値をそのまま渡すこと**——ここに書かれた既定値とスタイルが食い違うと、キーボードが
  // 出た瞬間だけシートの高さが飛ぶ。
  options: { maxHeightRatio?: number; paddingBottom?: number } = {},
): SheetKeyboardLayout {
  const maxHeightRatio = options.maxHeightRatio ?? SHEET_MAX_HEIGHT_RATIO;
  const paddingBottom = options.paddingBottom ?? SHEET_PADDING_BOTTOM;
  if (keyboardHeight <= 0) return { paddingBottom: paddingBottom + insetBottom };
  return {
    marginBottom: keyboardHeight,
    maxHeight: Math.min(
      Math.max(0, windowHeight - keyboardHeight),
      Math.max(SHEET_MIN_HEIGHT_WITH_KEYBOARD, windowHeight * maxHeightRatio - keyboardHeight),
    ),
    paddingBottom,
  };
}
