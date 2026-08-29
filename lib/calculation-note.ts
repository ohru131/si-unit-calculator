import type { CalculationNoteStep } from "@/lib/calculator-store";
import { evaluateExpression, type CustomFunctionDefinition, type Quantity, type SavedConstant } from "@/lib/units";

export type NoteStepResult = {
  step: CalculationNoteStep;
  symbol: string;
  quantity: Quantity | null;
  error: string | null;
};

export function noteStepSymbol(index: number): string {
  return `s${index + 1}`;
}

/**
 * s1・s2…への参照を、それより前の手順の式で再帰的に置き換え、他の画面でも
 * そのまま評価できる自己完結した式にする（前方参照は未解決のまま残し、評価時と同じエラーにする）。
 */
export function resolveNoteStepExpression(steps: CalculationNoteStep[], index: number): string {
  const expressionAt = (stepIndex: number): string => {
    const raw = steps[stepIndex]?.expression.trim() ?? "";
    return raw.replace(/\bs(\d+)\b/g, (match, numberText: string) => {
      const referencedIndex = Number(numberText) - 1;
      if (referencedIndex < 0 || referencedIndex >= stepIndex) return match;
      return `(${expressionAt(referencedIndex)})`;
    });
  };
  return expressionAt(index);
}

/** ノートの手順を順番に計算し、各手順の結果を s1, s2… として後続の手順から参照できるようにする。 */
export function evaluateNoteSteps(
  steps: CalculationNoteStep[],
  baseConstants: SavedConstant[] = [],
  customFunctions: CustomFunctionDefinition[] = [],
): NoteStepResult[] {
  const availableConstants = [...baseConstants];
  return steps.map((step, index) => {
    const symbol = noteStepSymbol(index);
    const expression = step.expression.trim();
    if (!expression) return { step, symbol, quantity: null, error: null };
    try {
      const quantity = evaluateExpression(expression, availableConstants, customFunctions);
      availableConstants.push({ symbol, expression, quantity, createdAt: "" });
      return { step, symbol, quantity, error: null };
    } catch (cause) {
      return { step, symbol, quantity: null, error: cause instanceof Error ? cause.message : "式を計算できませんでした。" };
    }
  });
}
