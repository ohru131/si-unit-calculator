// 計算エンジン(lib/units.ts)はReactのコンテキストを持たないため、throwする時点では
// 現在のUI言語を知り得ない。そこでエラーは「種類を表すコード」+「埋め込みパラメータ」だけを持たせ、
// 表示側（UIコンポーネント）が現在の言語でメッセージを解決する構造にする。
import { type AppLanguage, type LocalizedText, resolveDeviceLanguage } from "./i18n";

export type UnitErrorCode =
  | "unsupportedUnit"
  | "unparsableUnitFormat"
  | "temperatureUnitStandalone"
  | "nonFiniteNumber"
  | "dimensionMismatchAddSubtract"
  | "divideByZero"
  | "exponentMustBeDimensionless"
  | "exponentMustBeFinite"
  | "negativeBaseRequiresIntegerExponent"
  | "unitValueRequiresIntegerExponent"
  | "negativeSquareRoot"
  | "squareRootRequiresEvenDimension"
  | "functionArgMustBeDimensionless"
  | "functionArgOutOfRange"
  | "functionArgMustBePositive"
  | "unsupportedFunction"
  | "unparsableCharacter"
  | "emptyExpression"
  | "unexpectedEndOfExpression"
  | "recursiveCustomFunction"
  | "customFunctionMissingClosingParen"
  | "customFunctionArgumentCountMismatch"
  | "atan2MissingOpenParen"
  | "atan2MissingComma"
  | "atan2MissingClosingParen"
  | "atan2DimensionMismatch"
  | "functionMissingOpenParen"
  | "functionMissingClosingParen"
  | "unknownIdentifier"
  | "missingClosingParen"
  | "invalidExpressionSyntax"
  | "invalidConstantDefinitionFormat"
  | "incompatibleTargetUnit";

export type UnitErrorParams = Record<string, string | number>;

export class UnitError extends Error {
  readonly code: UnitErrorCode;
  readonly params: UnitErrorParams;

  constructor(code: UnitErrorCode, params: UnitErrorParams = {}) {
    // Error.message は英語で組み立てる。UnitErrorをunitErrorMessage()で翻訳せず
    // cause.messageをそのまま表示している呼び出し箇所が残っていても、日本語ではなく
    // 英語が出るようにするため（英語UIのユーザーに日本語が出る事故を防ぐ）。
    super(UNIT_ERROR_MESSAGES.en[code](params));
    this.name = "UnitError";
    this.code = code;
    this.params = params;
  }
}

type UnitErrorMessageCatalog = Record<UnitErrorCode, (params: UnitErrorParams) => string>;

const UNIT_ERROR_MESSAGES: Record<AppLanguage, UnitErrorMessageCatalog> = {
  en: {
    unsupportedUnit: ({ symbol }) => `Unsupported unit "${symbol}".`,
    unparsableUnitFormat: ({ input }) => `Could not parse the format of unit "${input}".`,
    temperatureUnitStandalone: () => "Enter Celsius or Fahrenheit as a standalone temperature value.",
    nonFiniteNumber: () => "Enter a finite number.",
    dimensionMismatchAddSubtract: () => "Only values with the same dimension can be added or subtracted.",
    divideByZero: () => "Cannot divide by zero.",
    exponentMustBeDimensionless: () => "The exponent must be a dimensionless value.",
    exponentMustBeFinite: () => "The exponent must be a finite number.",
    negativeBaseRequiresIntegerExponent: () => "Only integer exponents can be used with negative values.",
    unitValueRequiresIntegerExponent: () => "Only integer exponents can be used with values that have units.",
    negativeSquareRoot: () => "Cannot take the square root of a negative value.",
    squareRootRequiresEvenDimension: () => "For a square root with units, every dimension exponent must be even.",
    functionArgMustBeDimensionless: ({ name }) => `The argument of ${name}() must be an angle or a dimensionless value.`,
    functionArgOutOfRange: ({ name }) => `The argument of ${name}() must be between -1 and 1.`,
    functionArgMustBePositive: ({ name }) => `The argument of ${name}() must be greater than 0.`,
    unsupportedFunction: ({ name }) => `Unsupported function "${name}".`,
    unparsableCharacter: ({ character }) => `Could not interpret "${character}".`,
    emptyExpression: () => "Enter an expression.",
    unexpectedEndOfExpression: () => "The expression ends unexpectedly.",
    recursiveCustomFunction: ({ name }) => `Custom function "${name}" is called recursively.`,
    customFunctionMissingClosingParen: ({ name }) => `Custom function "${name}" is missing a closing parenthesis.`,
    customFunctionArgumentCountMismatch: ({ name, count }) => `Custom function "${name}" requires ${count} argument(s).`,
    atan2MissingOpenParen: () => "Add parentheses after atan2().",
    atan2MissingComma: () => "Enter atan2() in the form atan2(y, x).",
    atan2MissingClosingParen: () => "atan2() is missing a closing parenthesis.",
    atan2DimensionMismatch: () => "The two arguments of atan2() must have the same dimension.",
    functionMissingOpenParen: ({ name }) => `Add parentheses after ${name}().`,
    functionMissingClosingParen: ({ name }) => `${name}() is missing a closing parenthesis.`,
    unknownIdentifier: ({ name }) => `Could not find a constant or unit named "${name}".`,
    missingClosingParen: () => "Missing a closing parenthesis.",
    invalidExpressionSyntax: () => "The expression syntax is invalid.",
    invalidConstantDefinitionFormat: () => `Define a constant in the form "W = 3cm".`,
    incompatibleTargetUnit: ({ targetUnit }) => `Cannot convert the result to "${targetUnit}". The dimensions do not match.`,
  },
  ja: {
    unsupportedUnit: ({ symbol }) => `未対応の単位「${symbol}」です。`,
    unparsableUnitFormat: ({ input }) => `単位「${input}」の書式を解釈できません。`,
    temperatureUnitStandalone: () => "摂氏・華氏は単独の温度値として入力してください。",
    nonFiniteNumber: () => "有限の数値を入力してください。",
    dimensionMismatchAddSubtract: () => "加算・減算できるのは同じ次元の値だけです。",
    divideByZero: () => "0では割れません。",
    exponentMustBeDimensionless: () => "べき指数は無次元の値にしてください。",
    exponentMustBeFinite: () => "べき指数は有限の数値にしてください。",
    negativeBaseRequiresIntegerExponent: () => "負の値には整数のべき指数だけを使用できます。",
    unitValueRequiresIntegerExponent: () => "単位付きの値には整数のべき指数だけを使用できます。",
    negativeSquareRoot: () => "負の値の平方根は計算できません。",
    squareRootRequiresEvenDimension: () => "単位付きの平方根では、各次元の指数が偶数である必要があります。",
    functionArgMustBeDimensionless: ({ name }) => `${name}() の引数は角度または無次元の値にしてください。`,
    functionArgOutOfRange: ({ name }) => `${name}() の引数は -1 から 1 の範囲にしてください。`,
    functionArgMustBePositive: ({ name }) => `${name}() の引数は0より大きい値にしてください。`,
    unsupportedFunction: ({ name }) => `未対応の関数「${name}」です。`,
    unparsableCharacter: ({ character }) => `「${character}」を解釈できません。`,
    emptyExpression: () => "式を入力してください。",
    unexpectedEndOfExpression: () => "式が途中で終わっています。",
    recursiveCustomFunction: ({ name }) => `自作関数「${name}」が再帰的に呼び出されています。`,
    customFunctionMissingClosingParen: ({ name }) => `自作関数「${name}」の閉じ括弧が不足しています。`,
    customFunctionArgumentCountMismatch: ({ name, count }) => `自作関数「${name}」は${count}個の引数を必要とします。`,
    atan2MissingOpenParen: () => "atan2() の後に括弧を付けてください。",
    atan2MissingComma: () => "atan2() は atan2(y, x) の形式で入力してください。",
    atan2MissingClosingParen: () => "atan2() の閉じ括弧が不足しています。",
    atan2DimensionMismatch: () => "atan2() の2つの引数は同じ次元にしてください。",
    functionMissingOpenParen: ({ name }) => `${name}() の後に括弧を付けてください。`,
    functionMissingClosingParen: ({ name }) => `${name}() の閉じ括弧が不足しています。`,
    unknownIdentifier: ({ name }) => `定数または単位「${name}」が見つかりません。`,
    missingClosingParen: () => "閉じ括弧が不足しています。",
    invalidExpressionSyntax: () => "式の構文が正しくありません。",
    invalidConstantDefinitionFormat: () => "定数は「W = 3cm」の形式で定義してください。",
    incompatibleTargetUnit: ({ targetUnit }) => `結果を「${targetUnit}」へ変換できません。次元が一致していません。`,
  },
};

/**
 * UnitErrorなら現在の言語のメッセージを返す。UnitError以外（一般のError等）はundefinedを返し、
 * 呼び出し側が既存のフォールバック（cause.messageなど）を使い続けられるようにする。
 */
export function unitErrorMessage(error: unknown, language: AppLanguage): string | undefined {
  if (!(error instanceof UnitError)) return undefined;
  return UNIT_ERROR_MESSAGES[language][error.code](error.params);
}

// formatDimension/convertQuantityの「無次元」表示など、エラーではないが言語対応が要る
// 短い表示文言はこちらにまとめる。UI側から明示的にlanguageを渡せない箇所（lib/units.tsの
// formatQuantity等はlocale文字列しか受け取らない）では resolveDeviceLanguage で近似する。
export const DIMENSIONLESS_LABEL: LocalizedText = { en: "dimensionless", ja: "無次元" };

/** "ja-JP"のようなIntlロケール文字列からアプリ言語を推定する（未指定・不明ならデフォルト言語）。 */
export function languageFromLocale(locale?: string): AppLanguage {
  return resolveDeviceLanguage(locale);
}

export function dimensionlessLabel(language: AppLanguage): string {
  return DIMENSIONLESS_LABEL[language] ?? DIMENSIONLESS_LABEL.en;
}

// 言語追加チェックリスト用: UNIT_ERROR_MESSAGESの全言語がUnitErrorCodeの全コードを
// 網羅していることをテスト側（tests/unit-errors.test.ts）でも確認する。
export const UNIT_ERROR_CODES = Object.keys(UNIT_ERROR_MESSAGES.en) as UnitErrorCode[];
