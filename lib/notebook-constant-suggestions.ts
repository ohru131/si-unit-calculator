import { type CalculationNoteStep, type NotebookLocalConstant } from "@/lib/calculator-store";
import { notebookStepSymbol, trimResultSymbol } from "@/lib/notebook-engine";
import { replaceExpressionRange } from "@/lib/unit-input";
import { type SavedConstant } from "@/lib/units";

// 定数の記号は数式（LaTeX）に合わせたUnicodeの記号そのものなので、表示と挿入で文字列を
// 分ける必要はなく、チップ1つ＝識別子1つ（そのまま式へ挿入される文字列）として扱う。

function dedupe(symbols: string[]): string[] {
  return [...new Set(symbols)];
}

function localConstantChips(localConstants: NotebookLocalConstant[]): string[] {
  return localConstants.filter((item) => item.symbol.trim() && item.expression.trim()).map((item) => item.symbol.trim());
}

function globalConstantChips(globalConstants: SavedConstant[]): string[] {
  return globalConstants.map((item) => item.symbol.trim()).filter(Boolean);
}

/**
 * ローカル定数の式フィールド用の挿入候補。resolveNotebookLocalConstantsと同じく定義順に前方参照
 * しか解決できないため、自分より前の定数とグローバル定数だけを返す（自分自身・後の定数は含めない）。
 */
export function getLocalConstantFieldSuggestions(
  localConstants: NotebookLocalConstant[],
  globalConstants: SavedConstant[],
  constantIndex: number,
): string[] {
  return dedupe([...localConstantChips(localConstants.slice(0, constantIndex)), ...globalConstantChips(globalConstants)]);
}

/**
 * 手順の式フィールド用の挿入候補。ローカル定数・グローバル定数に加えて、自分より前の手順の結果記号
 * （resultSymbol、無ければ notebookStepSymbol の s1, s2…）を返す。後の手順は前方参照になるため含めない。
 * 式が空の手順は evaluateNotebookSteps で後続に登録されない（＝参照しても解決できない）ため除く。
 */
export function getStepFieldSuggestions(
  localConstants: NotebookLocalConstant[],
  globalConstants: SavedConstant[],
  steps: CalculationNoteStep[],
  stepIndex: number,
): string[] {
  const priorStepChips = steps
    .map((step, index) => ({ step, index }))
    .filter(({ index }) => index < stepIndex)
    .filter(({ step }) => step.expression.trim())
    .map(({ step, index }) => trimResultSymbol(step) || notebookStepSymbol(index));
  return dedupe([...localConstantChips(localConstants), ...globalConstantChips(globalConstants), ...priorStepChips]);
}

/**
 * 「名前＝式」の1行テキスト（TextInputに表示している結合文字列）のキャレット/選択範囲を、
 * 内部で保持しているexpression単体の範囲へ変換する。名前部分（"name="の中）にキャレットが
 * あるときはexpressionの先頭（0）へ丸め、名前を誤って書き換えないようにする。
 */
export function mapCombinedSelectionToExpressionRange(
  name: string,
  expression: string,
  selectionStart: number,
  selectionEnd: number,
): { start: number; end: number } {
  const prefixLength = name ? name.length + 1 : 0;
  const clamp = (value: number) => Math.max(0, Math.min(value - prefixLength, expression.length));
  return { start: clamp(selectionStart), end: clamp(selectionEnd) };
}

export type ConstantInsertionResult = {
  /** 挿入後のexpression（symbol/expressionに分かれた内部stateへそのまま書き戻せる）。 */
  expression: string;
  /** 挿入後にキャレットを置くべき、結合文字列（name=expression）内でのオフセット。 */
  combinedCaret: number;
};

/**
 * 結合文字列（name=expression）内のキャレット位置・選択範囲を基準に、指定した記号をexpressionへ
 * 挿入する。選択範囲があればそれを置き換える。挿入位置は末尾追加ではなく、キャレットのある場所
 * （ユーザーが選んだ位置）にする。挿入後のキャレットは挿入した記号の直後（続けて入力できる位置）。
 */
export function insertConstantSymbol(
  name: string,
  expression: string,
  selectionStart: number,
  selectionEnd: number,
  symbol: string,
): ConstantInsertionResult {
  const prefixLength = name ? name.length + 1 : 0;
  const { start, end } = mapCombinedSelectionToExpressionRange(name, expression, selectionStart, selectionEnd);
  const nextExpression = replaceExpressionRange(expression, start, end, symbol);
  return { expression: nextExpression, combinedCaret: prefixLength + start + symbol.length };
}

/**
 * 記録しておいたキャレット/選択範囲を、今の文字列長に収まる範囲へ丸める。
 *
 * なぜ必要か: 記号ボタンは「最後にonSelectionChangeで記録した位置」へ挿し込むが、記録は
 * フィールドの文字列とは別に持っているため、文字列が短くなった直後などに実際の長さを超えて
 * いることがある。そのまま渡すと挿入位置が意図しない場所になる。まだ一度も記録が無い
 * （フォーカス直後などの）フィールドは末尾を指す。
 */
export function clampSelectionRange(recorded: { start: number; end: number } | undefined, length: number): { start: number; end: number } {
  if (!recorded) return { start: length, end: length };
  const start = Math.min(Math.max(recorded.start, 0), length);
  return { start, end: Math.min(Math.max(recorded.end, start), length) };
}
