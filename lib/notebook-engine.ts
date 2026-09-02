import { type CalculationNoteStep, type NotebookLocalConstant } from "@/lib/calculator-store";
import { type AppLanguage } from "@/lib/i18n";
import { unitErrorMessage } from "@/lib/unit-errors";
import {
  type CustomFunctionDefinition,
  evaluateExpression,
  formatQuantity,
  IDENTIFIER_BODY_CHAR_CLASS,
  IDENTIFIER_START_CHAR_CLASS,
  parseConstantDefinition,
  type Quantity,
  type SavedConstant,
} from "@/lib/units";

export type ResolvedNotebookConstants = {
  resolved: SavedConstant[];
  errors: Record<string, string>;
};

// lib/units.ts の識別子文字集合と揃える（下付き文字・ギリシャ文字を名前に使えるようにするため）。
const NAME_VALUE_PATTERN = new RegExp(`^\\s*([${IDENTIFIER_START_CHAR_CLASS}][${IDENTIFIER_BODY_CHAR_CLASS}]*)\\s*=\\s*(.*)$`, "s");

// このモジュールはlib/units.tsと違い入り口（resolveNotebookLocalConstants・evaluateNotebookSteps）が
// 2個だけの浅いモジュールなので、units.tsのようにエラーコード化して表示側で翻訳する方式ではなく、
// 呼び出し元から言語を直接受け取ってこの場でメッセージを組み立てる（呼び出し元の洗い出しがコンパイル時に済む）。
// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_ENGINE_MESSAGES = {
  constantCalculationFailed: "Could not calculate this constant.",
  emptyExpression: "Enter an expression.",
  targetUnitFallback: (targetUnit: string) => `Could not convert to "${targetUnit}" — showing the SI base value instead.`,
  expressionCalculationFailed: "Could not calculate this expression.",
};
const ENGINE_MESSAGES: Record<AppLanguage, typeof EN_ENGINE_MESSAGES> = {
  en: EN_ENGINE_MESSAGES,
  ja: {
    constantCalculationFailed: "この定数を計算できませんでした。",
    emptyExpression: "式が未入力です。",
    targetUnitFallback: (targetUnit: string) => `「${targetUnit}」には変換できないため、SI標準で表示しました。`,
    expressionCalculationFailed: "この式を計算できませんでした。",
  },
  es: {
    constantCalculationFailed: "No se pudo calcular esta constante.",
    emptyExpression: "Introduce una expresión.",
    targetUnitFallback: (targetUnit: string) => `No se pudo convertir a "${targetUnit}"; se muestra el valor base del SI en su lugar.`,
    expressionCalculationFailed: "No se pudo calcular esta expresión.",
  },
  "pt-BR": {
    constantCalculationFailed: "Não foi possível calcular esta constante.",
    emptyExpression: "Informe uma expressão.",
    targetUnitFallback: (targetUnit: string) => `Não foi possível converter para "${targetUnit}"; exibindo o valor em unidades SI base.`,
    expressionCalculationFailed: "Não foi possível calcular esta expressão.",
  },
  de: {
    constantCalculationFailed: "Diese Konstante konnte nicht berechnet werden.",
    emptyExpression: "Gib einen Ausdruck ein.",
    targetUnitFallback: (targetUnit: string) => `Umrechnung in „${targetUnit}“ nicht möglich – stattdessen wird der SI-Basiswert angezeigt.`,
    expressionCalculationFailed: "Dieser Ausdruck konnte nicht berechnet werden.",
  },
  fr: {
    constantCalculationFailed: "Impossible de calculer cette constante.",
    emptyExpression: "Saisissez une expression.",
    targetUnitFallback: (targetUnit: string) => `Conversion vers « ${targetUnit} » impossible ; la valeur en unités SI de base est affichée à la place.`,
    expressionCalculationFailed: "Impossible de calculer cette expression.",
  },
};

// parseConstantDefinition/evaluateExpressionが投げるUnitErrorはError.messageが常に英語で
// 組み立てられる設計（lib/unit-errors.ts）のため、cause.messageをそのまま使うと日本語UIでも
// 英語エラーが漏れる。unitErrorMessageで現在の言語に翻訳し、UnitError以外はcause.messageへ
// フォールバックする（他の呼び出し元と同じ扱い方に揃える）。
function describeCause(cause: unknown, language: AppLanguage, fallback: string): string {
  if (!(cause instanceof Error)) return fallback;
  return unitErrorMessage(cause, language) ?? cause.message;
}

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
  language: AppLanguage,
): ResolvedNotebookConstants {
  const messages = ENGINE_MESSAGES[language];
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
      errors[local.id] = describeCause(cause, language, messages.constantCalculationFailed);
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
  language: AppLanguage,
  customFunctions: CustomFunctionDefinition[] = [],
  locale?: string,
): NotebookStepResult[] {
  const messages = ENGINE_MESSAGES[language];
  const availableConstants = [...pool];
  return steps.map((step, index) => {
    const symbol = trimResultSymbol(step) || notebookStepSymbol(index);
    const expression = step.expression.trim();
    if (!expression) return { step, symbol, error: messages.emptyExpression };
    try {
      const quantity = evaluateExpression(expression, availableConstants, customFunctions);
      availableConstants.push({ symbol, expression, quantity, createdAt: "" });
      const siFallback = formatQuantity(quantity, undefined, locale);
      const targetUnit = step.targetUnit.trim();
      if (!targetUnit) return { step, symbol, quantity, formatted: siFallback, siFallback };
      try {
        return { step, symbol, quantity, formatted: formatQuantity(quantity, targetUnit, locale), siFallback };
      } catch {
        return { step, symbol, quantity, formatted: siFallback, siFallback, error: messages.targetUnitFallback(targetUnit) };
      }
    } catch (cause) {
      return { step, symbol, error: describeCause(cause, language, messages.expressionCalculationFailed) };
    }
  });
}
