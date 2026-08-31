import { type CalculationNoteStep, type NotebookLocalConstant } from "@/lib/calculator-store";
import {
  type CustomFunctionDefinition,
  evaluateExpression,
  formatQuantity,
  parseConstantDefinition,
  type Quantity,
  type SavedConstant,
} from "@/lib/units";

export type ResolvedNotebookConstants = {
  resolved: SavedConstant[];
  errors: Record<string, string>;
};

/**
 * ノートのローカル定数を定義順に解決する。後の行は前の行を参照でき、
 * グローバル定数と同名でもローカル側が優先される（constantMap は後勝ちのため）。
 * 1行の失敗は他の行の計算を止めない。
 */
export function resolveNotebookLocalConstants(
  localConstants: NotebookLocalConstant[],
  globalConstants: SavedConstant[],
): ResolvedNotebookConstants {
  const resolved: SavedConstant[] = [];
  const errors: Record<string, string> = {};
  for (const local of localConstants) {
    const symbol = local.symbol.trim();
    const expression = local.expression.trim();
    if (!symbol || !expression) continue;
    try {
      const parsed = parseConstantDefinition(`${symbol} = ${expression}`, [...globalConstants, ...resolved]);
      resolved.push({ ...parsed, createdAt: "" });
    } catch (cause) {
      errors[local.id] = cause instanceof Error ? cause.message : "この定数を計算できませんでした。";
    }
  }
  return { resolved, errors };
}

export type NotebookStepResult = {
  step: CalculationNoteStep;
  symbol: string;
  quantity?: Quantity;
  formatted?: string;
  siFallback?: string;
  error?: string;
};

export function notebookStepSymbol(index: number): string {
  return `s${index + 1}`;
}

/**
 * ノートの手順を上から順に計算する。各手順の結果は s1、s2… として後続の手順から参照できる
 * （ローカル定数・グローバル定数に加えて利用可能）。「v = v0 + a*t」のように resultSymbol が
 * 設定されていれば、s1 の代わりにその名前で参照できる。
 */
export function evaluateNotebookSteps(
  steps: CalculationNoteStep[],
  pool: SavedConstant[],
  customFunctions: CustomFunctionDefinition[] = [],
  locale?: string,
): NotebookStepResult[] {
  const availableConstants = [...pool];
  return steps.map((step, index) => {
    // 端末に保存された旧データや手編集されたJSONではresultSymbolが文字列でない場合もあるため、
    // 型を確認してから使う（.trimでの実行時エラーを避ける）。
    const symbol = (typeof step.resultSymbol === "string" ? step.resultSymbol.trim() : "") || notebookStepSymbol(index);
    const expression = step.expression.trim();
    if (!expression) return { step, symbol, error: "式が未入力です。" };
    try {
      const quantity = evaluateExpression(expression, availableConstants, customFunctions);
      availableConstants.push({ symbol, expression, quantity, createdAt: "" });
      const siFallback = formatQuantity(quantity, undefined, locale);
      const targetUnit = step.targetUnit.trim();
      if (!targetUnit) return { step, symbol, quantity, formatted: siFallback, siFallback };
      try {
        return { step, symbol, quantity, formatted: formatQuantity(quantity, targetUnit, locale), siFallback };
      } catch {
        return { step, symbol, quantity, formatted: siFallback, siFallback, error: `「${targetUnit}」には変換できないため、SI標準で表示しました。` };
      }
    } catch (cause) {
      return { step, symbol, error: cause instanceof Error ? cause.message : "この式を計算できませんでした。" };
    }
  });
}
