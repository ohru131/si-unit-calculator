import {
  evaluateExpression,
  IDENTIFIER_BODY_CHAR_CLASS,
  IDENTIFIER_START_CHAR_CLASS,
  parseConstantDefinition,
  type Quantity,
  type SavedConstant,
} from "@/lib/units";
import { UnitError, type UnitErrorCode } from "@/lib/unit-errors";

// 定数名の判定はエンジン側（parseConstantDefinition）と同じ文字集合を使う。ここだけASCII限定に
// していると、mₒ や α のようなUnicodeの記号で定義しようとしても代入と見なされず保存できない。
const CONSTANT_ASSIGNMENT_PATTERN = new RegExp(`^([${IDENTIFIER_START_CHAR_CLASS}][${IDENTIFIER_BODY_CHAR_CLASS}]*)\\s*=`);

export type CalculatorEvaluation = {
  quantity: Quantity;
  /** 「W = 3cm」のような定数定義のとき、保存すべき定義。ただの式なら null。 */
  definition: { symbol: string; expression: string } | null;
};

/**
 * 電卓の入力を評価する。定数定義（W = 3cm）なら右辺の値を返すが、**保存はしない**。
 * 副作用が無いので、= を押す前のリアルタイム表示と = を押したときの確定計算の両方から
 * 同じ関数を呼べる（2箇所に評価規則を持つと、リアルタイム表示だけ定数定義を計算できない
 * といった食い違いが出る）。評価できない入力は例外を投げる。
 */
export function evaluateCalculatorInput(input: string, constants: SavedConstant[]): CalculatorEvaluation {
  const trimmed = input.trim();
  if (!CONSTANT_ASSIGNMENT_PATTERN.test(trimmed)) {
    return { quantity: evaluateExpression(trimmed, constants), definition: null };
  }
  const { symbol, expression, quantity } = parseConstantDefinition(trimmed, constants);
  return { quantity, definition: { symbol, expression } };
}

/** = を押す前のリアルタイム表示用。計算できない途中の入力は例外にせず null を返す。 */
export function previewCalculatorInput(input: string, constants: SavedConstant[]): Quantity | null {
  if (!input.trim()) return null;
  try {
    return evaluateCalculatorInput(input, constants).quantity;
  } catch {
    return null;
  }
}

/**
 * = を押す前の入力を「診断」する。previewCalculatorInput と違い、計算できなかった理由
 * （UnitError）も返すので、結果カードの中で「長さと質量は足し引きできません」のような
 * 説明をリアルタイムに出せる。評価規則は evaluateCalculatorInput と同じ関数を通す。
 */
export function diagnoseCalculatorInput(input: string, constants: SavedConstant[]): { quantity: Quantity | null; error: Error | null } {
  if (!input.trim()) return { quantity: null, error: null };
  try {
    return { quantity: evaluateCalculatorInput(input, constants).quantity, error: null };
  } catch (cause) {
    return { quantity: null, error: cause instanceof Error ? cause : new Error(String(cause)) };
  }
}

// 「まだ書きかけ」のときに出るエラー。閉じ括弧を待っている・末尾が演算子で終わっている等は
// 入力の途中経過であって間違いではないので、リアルタイムの診断としては見せない
// （一文字打つごとに「式の末尾が不完全です」と赤く出ると、打っている最中ずっと怒られる）。
// 一方、次元不一致・使えない単位・ゼロ除算のような「その式の意味」の誤りは、完成前でも
// もう分かっているので即座に見せる価値がある。
const INCOMPLETE_INPUT_ERROR_CODES: ReadonlySet<UnitErrorCode> = new Set<UnitErrorCode>([
  "emptyExpression",
  "unexpectedEndOfExpression",
  "missingClosingParen",
  "functionMissingOpenParen",
  "functionMissingClosingParen",
  "atan2MissingOpenParen",
  "atan2MissingComma",
  "atan2MissingClosingParen",
  "customFunctionMissingClosingParen",
  "invalidExpressionSyntax",
  "invalidConstantDefinitionFormat",
  "unparsableCharacter",
]);

/** リアルタイム診断として表示すべきエラーか（書きかけの式で出る構文系のエラーは除く）。 */
export function isDiagnosableInputError(error: Error): error is UnitError {
  return error instanceof UnitError && !INCOMPLETE_INPUT_ERROR_CODES.has(error.code);
}
