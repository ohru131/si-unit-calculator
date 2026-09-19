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
  const next = Math.max(prefixLength, Math.min(total, anchor + delta));
  return { start: next, end: next };
}
