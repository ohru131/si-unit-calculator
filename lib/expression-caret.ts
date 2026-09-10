import { type ExpressionSegment } from "@/lib/unit-input";

/** 入力欄の下のプレビュー行に、キャレット（カーソル）と選択範囲を描くための一片。
 * segment は分割前のセグメントをそのまま持つ。未対応単位のタップ範囲（修正候補を出す範囲）は
 * 分割後の一片ではなく元のセグメント全体でなければならないため。 */
export type CaretPreviewPiece = {
  segment: ExpressionSegment;
  text: string;
  start: number;
  end: number;
  /** 選択範囲の中にあるか（範囲選択が無いときは常にfalse）。 */
  selected: boolean;
  /** 同じセグメントを分割したときの最後の一片か。警告アイコンを1つだけ出すために使う。 */
  isSegmentEnd: boolean;
};

export type CaretPreview = {
  pieces: CaretPreviewPiece[];
  /** pieces のこのインデックスの手前にキャレットを描く。末尾のときは pieces.length。
   * 範囲選択中は選択の帯そのものが位置を示すので null（キャレットは描かない）。 */
  caretIndex: number | null;
};

/** 正規化した選択範囲。`hasRange` が false ならキャレット1本（`start` の位置）を描く。 */
export type NormalizedSelection = { start: number; end: number; hasRange: boolean };

/**
 * TextInput の selection を、式の長さに収まる「前→後ろ」の範囲に正規化する。
 *
 * 丸めが必要なのは、AC・履歴復元・プリセットの読み込みで式が短くなった直後に、前の式の
 * 位置のままの selection が残ることがあるため。逆順（後ろから前へドラッグ）も来る。
 *
 * 通常のプレビュー（`buildCaretPreview`）と進数入力のプレビューの両方がこれを通る。
 * **どちらか片方だけ独自に丸めると、同じ操作なのにモードによって表示位置が変わる。**
 */
export function normalizeSelection(length: number, selectionStart: number, selectionEnd: number): NormalizedSelection {
  const clamp = (value: number) => Math.max(0, Math.min(length, Number.isFinite(value) ? Math.trunc(value) : 0));
  const a = clamp(selectionStart);
  const b = clamp(selectionEnd);
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  return { start, end, hasRange: start !== end };
}

/**
 * プレビュー行のセグメント列を、キャレット位置（と選択範囲の両端）で切り分ける。
 *
 * 入力欄の TextInput はフォーカスが当たっていない間はキャレットを描かない。この電卓は
 * 「入力欄を触らずにキーパッドで式を組み立てる」設計（入力欄をタップするとOSのキーボードが
 * 上がってキーパッドがほぼ隠れる）なので、`< >` でカーソルを動かしても画面上のどこにも
 * 位置が出ていなかった。そこでプレビュー行を唯一のキャレット表示の場所にする。
 *
 * 位置は文字数（コードユニット）で、TextInput の selection とそのまま同じ数え方にする。
 * ここを独自に数え直すと、単位チップの挿入位置（selection.start を見る）と画面のキャレットが
 * ずれて、どちらが本当の挿入位置か分からなくなる。
 */
export function buildCaretPreview(
  segments: readonly ExpressionSegment[],
  selectionStart: number,
  selectionEnd: number,
): CaretPreview {
  // セグメント列は式全体を隙間なく覆うので、末尾の end が式の長さになる。
  const length = segments.length > 0 ? segments[segments.length - 1].end : 0;
  const { start: low, end: high, hasRange } = normalizeSelection(length, selectionStart, selectionEnd);

  // 切り口はキャレット位置（範囲選択なら両端）だけ。セグメントの内側に落ちるものだけが実際に切る。
  const cuts = hasRange ? [low, high] : [low];

  const pieces: CaretPreviewPiece[] = [];
  for (const segment of segments) {
    const inner = cuts
      .filter((cut) => cut > segment.start && cut < segment.end)
      .sort((x, y) => x - y);
    const bounds = [segment.start, ...inner, segment.end];
    for (let index = 0; index < bounds.length - 1; index += 1) {
      const start = bounds[index];
      const end = bounds[index + 1];
      pieces.push({
        segment,
        text: segment.text.slice(start - segment.start, end - segment.start),
        start,
        end,
        selected: hasRange && start >= low && end <= high,
        isSegmentEnd: end === segment.end,
      });
    }
  }

  if (hasRange) return { pieces, caretIndex: null };
  // キャレットは「その位置から始まる一片の手前」に入る。末尾（どの一片も始まらない）なら最後。
  const index = pieces.findIndex((piece) => piece.start === low);
  return { pieces, caretIndex: index === -1 ? pieces.length : index };
}
