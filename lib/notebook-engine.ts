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

const NAME_VALUE_PATTERN = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/s;

/**
 * 「v0=5m/s」のようなローカル定数・手順の1行入力を名前と式に分割する。
 * parseConstantDefinition（lib/units.ts）と同じ命名規則。名前部分を解析できなければ
 * name は空文字になり、value には入力全体（"="を含む）がそのまま残る。
 */
export function parseNameValue(text: string): { name: string; value: string } {
  const match = text.match(NAME_VALUE_PATTERN);
  return match ? { name: match[1], value: match[2] } : { name: "", value: text };
}

/** parseNameValue の逆変換。表示用の1行テキストを組み立てる。名前が空なら式だけを返す。 */
export function formatNameValue(name: string, value: string): string {
  return name ? `${name}=${value}` : value;
}

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
 * 端末に保存された旧データや手編集されたJSONではresultSymbolが文字列でない場合もあるため、
 * 型を確認してからtrimする（.trimでの実行時エラーを避ける）。未設定・非文字列なら空文字を返す。
 */
export function trimResultSymbol(step: Pick<CalculationNoteStep, "resultSymbol">): string {
  return typeof step.resultSymbol === "string" ? step.resultSymbol.trim() : "";
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
    const symbol = trimResultSymbol(step) || notebookStepSymbol(index);
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
