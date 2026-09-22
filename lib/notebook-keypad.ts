import { insertConstantSymbol, mapCombinedSelectionToExpressionRange, type ConstantInsertionResult } from "@/lib/notebook-constant-suggestions";
import { replaceExpressionRange } from "@/lib/unit-input";

/**
 * 計算ノート詳細（値の編集）のキーパッドが行う文字列操作。キーの並び自体は電卓と共用の
 * lib/expression-keyboard.ts（EXPRESSION_KEYS）にあり、ここには持たない。
 *
 * 【なぜノートにもキーパッドを持つか】ノートの値欄は TextInput そのもので、入力手段が OS の
 * キーボードしか無かった。数値・演算子は画面のキーで、単位と定数記号はチップで打てるようにしておけば、
 * OS のキーボードが出るかどうかに依らず値を編集でき、電卓と同じ操作感になる。
 */

/**
 * キーの文字を、結合文字列（name=expression）内のキャレット位置へ挿し込む。
 * 定数チップの挿入（insertConstantSymbol）と同じ規則なので、キャレットが名前側にあっても
 * 式の先頭へ丸められ、名前が壊れることは無い。
 */
export function insertKeypadText(name: string, expression: string, selectionStart: number, selectionEnd: number, text: string): ConstantInsertionResult {
  return insertConstantSymbol(name, expression, selectionStart, selectionEnd, text);
}

/**
 * ⌫。範囲選択があればその範囲を、無ければキャレット直前の1文字を式から消す。
 * 消せる場所が無い（式の先頭にキャレットがあり選択も無い）ときは `null` を返し、呼び出し側は何もしない。
 * 名前（`m=` の部分）はキーパッドからは消せない——名前は英字なので OS のキーボードで打つ側の
 * 領分で、ここから消せると `=` まで消えて行の形式が壊れる。
 */
export function backspaceInField(name: string, expression: string, selectionStart: number, selectionEnd: number): ConstantInsertionResult | null {
  const prefixLength = name ? name.length + 1 : 0;
  const { start, end } = mapCombinedSelectionToExpressionRange(name, expression, selectionStart, selectionEnd);
  const deleteStart = start === end ? start - 1 : start;
  if (deleteStart < 0) return null;
  const nextExpression = replaceExpressionRange(expression, deleteStart, end, "");
  return { expression: nextExpression, combinedCaret: prefixLength + deleteStart };
}

/**
 * `<` `>`。結合文字列（name=expression）内のキャレットを1つ動かす。名前側（`m=` の中）へは入らない
 * ——名前はキーパッドの編集対象ではないので、式の先頭と末尾の間だけを動く。
 */
export function moveCaretInField(name: string, expression: string, selectionStart: number, selectionEnd: number, delta: 1 | -1): { start: number; end: number } {
  const prefixLength = name ? name.length + 1 : 0;
  const total = prefixLength + expression.length;
  const anchor = delta < 0 ? Math.min(selectionStart, selectionEnd) : Math.max(selectionStart, selectionEnd);
  // **範囲選択があるときは端へ畳むだけ。** どのテキスト欄でも矢印キーは「選択を解除して
  // その端へ」であって、さらに1文字進むものではない。delta を足すと `2..4` で `>` を押した
  // ときに 5 まで飛び、選択していた文字の外へ出る（CodeRabbitが#72で検出）。
  const target = selectionStart === selectionEnd ? anchor + delta : anchor;
  const next = Math.max(prefixLength, Math.min(total, target));
  return { start: next, end: next };
}

/** 結合文字列（name=expression）を1本のテキストとして編集した結果。 */
export type CombinedFieldEdit = { text: string; caret: number };

// 範囲選択は Android だと右から左へ引いたときに `start > end` のまま届くので、必ず昇順へ直してから使う。
function normalizedRange(length: number, selectionStart: number, selectionEnd: number): { start: number; end: number } {
  const clamp = (value: number) => Math.min(Math.max(Number.isFinite(value) ? value : length, 0), length);
  const a = clamp(selectionStart);
  const b = clamp(selectionEnd);
  return { start: Math.min(a, b), end: Math.max(a, b) };
}

/**
 * 「名前＝式」を**丸ごと1本のテキストとして**編集するための挿入。
 *
 * 【なぜ式へ丸めないか】計算ノートの**編集シート**（components/notebooks/notebook-editor-sheet.tsx）は
 * 名前そのものを作る画面で、`σ_y`・`mₒ` のようなギリシャ文字・下付き文字は端末のキーボードでは
 * 打てない。式側へ丸める `insertKeypadText`（詳細画面用）をここでも使うと、**名前に記号を入れる
 * 手段がアプリから消える**。詳細画面は既存の名前の「値」だけを編集する画面なので、あちらは
 * 逆に名前を守る必要がある——同じ欄でも役割が違うので、関数を分けてある。
 */
export function insertInCombinedField(combined: string, selectionStart: number, selectionEnd: number, text: string): CombinedFieldEdit {
  const { start, end } = normalizedRange(combined.length, selectionStart, selectionEnd);
  return { text: `${combined.slice(0, start)}${text}${combined.slice(end)}`, caret: start + text.length };
}

/**
 * ⌫。範囲選択があればその範囲を、無ければキャレット直前の1文字を消す。消せる場所が無ければ `null`。
 * 上と同じ理由で名前側も消せる（`=` も1文字として消える＝名前なしの式に戻る。端末のキーボードで
 * 消したときと同じ結果で、保存時の検証も同じ経路に乗る）。
 */
export function backspaceInCombinedField(combined: string, selectionStart: number, selectionEnd: number): CombinedFieldEdit | null {
  const { start, end } = normalizedRange(combined.length, selectionStart, selectionEnd);
  const deleteStart = start === end ? start - 1 : start;
  if (deleteStart < 0) return null;
  return { text: `${combined.slice(0, deleteStart)}${combined.slice(end)}`, caret: deleteStart };
}

/**
 * `◀` `▶`。結合文字列の中でキャレットを1つ動かす。**範囲選択があるときは端へ畳むだけ**
 * （どのテキスト欄でも矢印キーは「選択を解除してその端へ」であって、さらに1文字進むものではない）。
 */
export function moveCaretInCombinedField(combined: string, selectionStart: number, selectionEnd: number, delta: 1 | -1): { start: number; end: number } {
  const { start, end } = normalizedRange(combined.length, selectionStart, selectionEnd);
  const anchor = delta < 0 ? start : end;
  const target = start === end ? anchor + delta : anchor;
  const next = Math.max(0, Math.min(combined.length, target));
  return { start: next, end: next };
}
