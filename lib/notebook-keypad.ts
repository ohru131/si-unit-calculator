import { insertConstantSymbol, mapCombinedSelectionToExpressionRange, type ConstantInsertionResult } from "@/lib/notebook-constant-suggestions";
import { replaceExpressionRange } from "@/lib/unit-input";

/**
 * 計算ノート詳細（値の編集）で使うアプリ内キーパッドの定義と、キーを押したときの文字列操作。
 *
 * 【なぜノートにもキーパッドを持つか】ノートの値欄は TextInput そのもので、入力手段が OS の
 * キーボードしか無かった。Android 実機で OS のキーボードが上がらない報告があり（電卓の隠し
 * TextInput でも同じ現象。原因は未特定）、そうなるとノートは**一切入力できない**。数値・演算子は
 * 画面のキーで、単位と定数記号は既存のチップで打てるようにしておけば、OS のキーボードが出るか
 * どうかに依らず値を編集できる。電卓と同じ「OS のキーボードは要求したときだけ」の設計に揃える。
 *
 * 並びは電卓の `KEYS`（5列4段）と同じ配置にし、電卓で覚えた指の位置がそのまま使えるようにする。
 * 右上だけ違う: 電卓の `AC`・右下の `=` はノートでは要らないので、代わりに科学表記の `×10ⁿ` と
 * べき乗の `^` を置く（既定値に 8.99×10^9 や 9.8m/s^2 のような値が多いため）。
 */
export type NotebookKeypadKey = { label: string; insert: string } | { label: string; action: "backspace" };

export const NOTEBOOK_KEYPAD_COLUMNS = 5;

export const NOTEBOOK_KEYPAD_KEYS: readonly NotebookKeypadKey[] = [
  { label: "7", insert: "7" }, { label: "8", insert: "8" }, { label: "9", insert: "9" }, { label: "⌫", action: "backspace" }, { label: "×10ⁿ", insert: "×10^" },
  { label: "4", insert: "4" }, { label: "5", insert: "5" }, { label: "6", insert: "6" }, { label: "÷", insert: "÷" }, { label: "×", insert: "×" },
  { label: "1", insert: "1" }, { label: "2", insert: "2" }, { label: "3", insert: "3" }, { label: "-", insert: "-" }, { label: "+", insert: "+" },
  { label: "0", insert: "0" }, { label: ".", insert: "." }, { label: "(", insert: "(" }, { label: ")", insert: ")" }, { label: "^", insert: "^" },
];

/**
 * `f(x)` キーで開く関数チップ。電卓の数学シート（`ADVANCED_KEYS`）と同じ並びで、`^` だけは
 * キーパッド本体に既にあるので除く。関数は開き括弧まで入れ、キャレットをその直後に置く
 * （引数を続けて打てる）。`π`・`e` は評価器がそのまま定数として読む。
 */
export const NOTEBOOK_KEYPAD_FUNCTIONS: readonly string[] = ["sqrt(", "sin(", "cos(", "tan(", "asin(", "acos(", "atan(", "atan2(", "ln(", "log(", "log2(", "π", "e"];

/** 見た目を数字と分けるキー（演算子・括弧・べき乗）。電卓の `isOperator` と同じ区別。 */
export const NOTEBOOK_KEYPAD_ACCENT_LABELS: ReadonlySet<string> = new Set(["×10ⁿ", "÷", "×", "-", "+", "(", ")", "^"]);

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
