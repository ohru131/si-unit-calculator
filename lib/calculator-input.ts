import {
  evaluateExpression,
  IDENTIFIER_BODY_CHAR_CLASS,
  IDENTIFIER_START_CHAR_CLASS,
  parseConstantDefinition,
  type Quantity,
  type SavedConstant,
} from "@/lib/units";

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
