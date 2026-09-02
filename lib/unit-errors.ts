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
  es: {
    unsupportedUnit: ({ symbol }) => `Unidad no admitida: "${symbol}".`,
    unparsableUnitFormat: ({ input }) => `No se pudo interpretar el formato de la unidad "${input}".`,
    temperatureUnitStandalone: () => "Introduce los grados Celsius o Fahrenheit como un valor de temperatura independiente.",
    nonFiniteNumber: () => "Introduce un número finito.",
    dimensionMismatchAddSubtract: () => "Solo se pueden sumar o restar valores con la misma dimensión.",
    divideByZero: () => "No se puede dividir entre cero.",
    exponentMustBeDimensionless: () => "El exponente debe ser un valor adimensional.",
    exponentMustBeFinite: () => "El exponente debe ser un número finito.",
    negativeBaseRequiresIntegerExponent: () => "Con valores negativos solo se pueden usar exponentes enteros.",
    unitValueRequiresIntegerExponent: () => "Con valores que tienen unidades solo se pueden usar exponentes enteros.",
    negativeSquareRoot: () => "No se puede calcular la raíz cuadrada de un valor negativo.",
    squareRootRequiresEvenDimension: () => "Para una raíz cuadrada con unidades, el exponente de cada dimensión debe ser par.",
    functionArgMustBeDimensionless: ({ name }) => `El argumento de ${name}() debe ser un ángulo o un valor adimensional.`,
    functionArgOutOfRange: ({ name }) => `El argumento de ${name}() debe estar entre -1 y 1.`,
    functionArgMustBePositive: ({ name }) => `El argumento de ${name}() debe ser mayor que 0.`,
    unsupportedFunction: ({ name }) => `Función no admitida: "${name}".`,
    unparsableCharacter: ({ character }) => `No se pudo interpretar "${character}".`,
    emptyExpression: () => "Introduce una expresión.",
    unexpectedEndOfExpression: () => "La expresión termina de forma inesperada.",
    recursiveCustomFunction: ({ name }) => `La función personalizada "${name}" se está llamando de forma recursiva.`,
    customFunctionMissingClosingParen: ({ name }) => `A la función personalizada "${name}" le falta un paréntesis de cierre.`,
    customFunctionArgumentCountMismatch: ({ name, count }) => `La función personalizada "${name}" requiere ${count} argumento(s).`,
    atan2MissingOpenParen: () => "Agrega paréntesis después de atan2().",
    atan2MissingComma: () => "Introduce atan2() con el formato atan2(y, x).",
    atan2MissingClosingParen: () => "A atan2() le falta un paréntesis de cierre.",
    atan2DimensionMismatch: () => "Los dos argumentos de atan2() deben tener la misma dimensión.",
    functionMissingOpenParen: ({ name }) => `Agrega paréntesis después de ${name}().`,
    functionMissingClosingParen: ({ name }) => `A ${name}() le falta un paréntesis de cierre.`,
    unknownIdentifier: ({ name }) => `No se encontró ninguna constante ni unidad llamada "${name}".`,
    missingClosingParen: () => "Falta un paréntesis de cierre.",
    invalidExpressionSyntax: () => "La sintaxis de la expresión no es válida.",
    invalidConstantDefinitionFormat: () => `Define una constante con el formato "W = 3cm".`,
    incompatibleTargetUnit: ({ targetUnit }) => `No se puede convertir el resultado a "${targetUnit}". Las dimensiones no coinciden.`,
  },
  "pt-BR": {
    unsupportedUnit: ({ symbol }) => `Unidade não suportada: "${symbol}".`,
    unparsableUnitFormat: ({ input }) => `Não foi possível interpretar o formato da unidade "${input}".`,
    temperatureUnitStandalone: () => "Informe Celsius ou Fahrenheit como um valor de temperatura isolado.",
    nonFiniteNumber: () => "Informe um número finito.",
    dimensionMismatchAddSubtract: () => "Só é possível somar ou subtrair valores com a mesma dimensão.",
    divideByZero: () => "Não é possível dividir por zero.",
    exponentMustBeDimensionless: () => "O expoente deve ser um valor adimensional.",
    exponentMustBeFinite: () => "O expoente deve ser um número finito.",
    negativeBaseRequiresIntegerExponent: () => "Em valores negativos só é possível usar expoentes inteiros.",
    unitValueRequiresIntegerExponent: () => "Em valores com unidade só é possível usar expoentes inteiros.",
    negativeSquareRoot: () => "Não é possível calcular a raiz quadrada de um valor negativo.",
    squareRootRequiresEvenDimension: () => "Para uma raiz quadrada com unidades, o expoente de cada dimensão precisa ser par.",
    functionArgMustBeDimensionless: ({ name }) => `O argumento de ${name}() deve ser um ângulo ou um valor adimensional.`,
    functionArgOutOfRange: ({ name }) => `O argumento de ${name}() deve estar entre -1 e 1.`,
    functionArgMustBePositive: ({ name }) => `O argumento de ${name}() deve ser maior que 0.`,
    unsupportedFunction: ({ name }) => `Função não suportada: "${name}".`,
    unparsableCharacter: ({ character }) => `Não foi possível interpretar "${character}".`,
    emptyExpression: () => "Informe uma expressão.",
    unexpectedEndOfExpression: () => "A expressão termina de forma inesperada.",
    recursiveCustomFunction: ({ name }) => `A função personalizada "${name}" está sendo chamada de forma recursiva.`,
    customFunctionMissingClosingParen: ({ name }) => `Falta um parêntese de fechamento na função personalizada "${name}".`,
    customFunctionArgumentCountMismatch: ({ name, count }) => `A função personalizada "${name}" requer ${count} argumento(s).`,
    atan2MissingOpenParen: () => "Adicione parênteses após atan2().",
    atan2MissingComma: () => "Informe atan2() no formato atan2(y, x).",
    atan2MissingClosingParen: () => "Falta um parêntese de fechamento em atan2().",
    atan2DimensionMismatch: () => "Os dois argumentos de atan2() devem ter a mesma dimensão.",
    functionMissingOpenParen: ({ name }) => `Adicione parênteses após ${name}().`,
    functionMissingClosingParen: ({ name }) => `Falta um parêntese de fechamento em ${name}().`,
    unknownIdentifier: ({ name }) => `Nenhuma constante ou unidade chamada "${name}" foi encontrada.`,
    missingClosingParen: () => "Falta um parêntese de fechamento.",
    invalidExpressionSyntax: () => "A sintaxe da expressão não é válida.",
    invalidConstantDefinitionFormat: () => `Defina uma constante no formato "W = 3cm".`,
    incompatibleTargetUnit: ({ targetUnit }) => `Não é possível converter o resultado para "${targetUnit}". As dimensões não coincidem.`,
  },
  de: {
    unsupportedUnit: ({ symbol }) => `Nicht unterstützte Einheit „${symbol}“.`,
    unparsableUnitFormat: ({ input }) => `Das Format der Einheit „${input}“ konnte nicht erkannt werden.`,
    temperatureUnitStandalone: () => "Gib Celsius oder Fahrenheit als eigenständigen Temperaturwert ein.",
    nonFiniteNumber: () => "Gib eine endliche Zahl ein.",
    dimensionMismatchAddSubtract: () => "Addiert oder subtrahiert werden können nur Werte mit derselben Dimension.",
    divideByZero: () => "Division durch null ist nicht möglich.",
    exponentMustBeDimensionless: () => "Der Exponent muss ein dimensionsloser Wert sein.",
    exponentMustBeFinite: () => "Der Exponent muss eine endliche Zahl sein.",
    negativeBaseRequiresIntegerExponent: () => "Bei negativen Werten sind nur ganzzahlige Exponenten zulässig.",
    unitValueRequiresIntegerExponent: () => "Bei Werten mit Einheit sind nur ganzzahlige Exponenten zulässig.",
    negativeSquareRoot: () => "Die Quadratwurzel eines negativen Werts kann nicht berechnet werden.",
    squareRootRequiresEvenDimension: () => "Für eine Quadratwurzel mit Einheiten muss der Exponent jeder Dimension gerade sein.",
    functionArgMustBeDimensionless: ({ name }) => `Das Argument von ${name}() muss ein Winkel oder ein dimensionsloser Wert sein.`,
    functionArgOutOfRange: ({ name }) => `Das Argument von ${name}() muss zwischen -1 und 1 liegen.`,
    functionArgMustBePositive: ({ name }) => `Das Argument von ${name}() muss größer als 0 sein.`,
    unsupportedFunction: ({ name }) => `Nicht unterstützte Funktion „${name}“.`,
    unparsableCharacter: ({ character }) => `„${character}“ konnte nicht interpretiert werden.`,
    emptyExpression: () => "Gib einen Ausdruck ein.",
    unexpectedEndOfExpression: () => "Der Ausdruck endet unerwartet.",
    recursiveCustomFunction: ({ name }) => `Die benutzerdefinierte Funktion „${name}“ wird rekursiv aufgerufen.`,
    customFunctionMissingClosingParen: ({ name }) => `Bei der benutzerdefinierten Funktion „${name}“ fehlt eine schließende Klammer.`,
    customFunctionArgumentCountMismatch: ({ name, count }) => `Die benutzerdefinierte Funktion „${name}“ benötigt ${count} Argument(e).`,
    atan2MissingOpenParen: () => "Füge nach atan2() Klammern hinzu.",
    atan2MissingComma: () => "Gib atan2() im Format atan2(y, x) ein.",
    atan2MissingClosingParen: () => "Bei atan2() fehlt eine schließende Klammer.",
    atan2DimensionMismatch: () => "Die beiden Argumente von atan2() müssen dieselbe Dimension haben.",
    functionMissingOpenParen: ({ name }) => `Füge nach ${name}() Klammern hinzu.`,
    functionMissingClosingParen: ({ name }) => `Bei ${name}() fehlt eine schließende Klammer.`,
    unknownIdentifier: ({ name }) => `Es wurde keine Konstante oder Einheit mit dem Namen „${name}“ gefunden.`,
    missingClosingParen: () => "Es fehlt eine schließende Klammer.",
    invalidExpressionSyntax: () => "Die Syntax des Ausdrucks ist ungültig.",
    invalidConstantDefinitionFormat: () => `Definiere eine Konstante im Format „W = 3cm“.`,
    incompatibleTargetUnit: ({ targetUnit }) => `Das Ergebnis kann nicht in „${targetUnit}“ umgerechnet werden. Die Dimensionen stimmen nicht überein.`,
  },
  fr: {
    unsupportedUnit: ({ symbol }) => `Unité non prise en charge : « ${symbol} ».`,
    unparsableUnitFormat: ({ input }) => `Le format de l'unité « ${input} » n'a pas pu être interprété.`,
    temperatureUnitStandalone: () => "Saisissez les degrés Celsius ou Fahrenheit comme valeur de température isolée.",
    nonFiniteNumber: () => "Saisissez un nombre fini.",
    dimensionMismatchAddSubtract: () => "Seules des valeurs de même dimension peuvent être additionnées ou soustraites.",
    divideByZero: () => "Impossible de diviser par zéro.",
    exponentMustBeDimensionless: () => "L'exposant doit être une valeur sans dimension.",
    exponentMustBeFinite: () => "L'exposant doit être un nombre fini.",
    negativeBaseRequiresIntegerExponent: () => "Seuls des exposants entiers peuvent être utilisés avec des valeurs négatives.",
    unitValueRequiresIntegerExponent: () => "Seuls des exposants entiers peuvent être utilisés avec des valeurs ayant une unité.",
    negativeSquareRoot: () => "Impossible de calculer la racine carrée d'une valeur négative.",
    squareRootRequiresEvenDimension: () => "Pour une racine carrée avec unités, l'exposant de chaque dimension doit être pair.",
    functionArgMustBeDimensionless: ({ name }) => `L'argument de ${name}() doit être un angle ou une valeur sans dimension.`,
    functionArgOutOfRange: ({ name }) => `L'argument de ${name}() doit être compris entre -1 et 1.`,
    functionArgMustBePositive: ({ name }) => `L'argument de ${name}() doit être supérieur à 0.`,
    unsupportedFunction: ({ name }) => `Fonction non prise en charge : « ${name} ».`,
    unparsableCharacter: ({ character }) => `Impossible d'interpréter « ${character} ».`,
    emptyExpression: () => "Saisissez une expression.",
    unexpectedEndOfExpression: () => "L'expression se termine de manière inattendue.",
    recursiveCustomFunction: ({ name }) => `La fonction personnalisée « ${name} » est appelée de manière récursive.`,
    customFunctionMissingClosingParen: ({ name }) => `Il manque une parenthèse fermante à la fonction personnalisée « ${name} ».`,
    customFunctionArgumentCountMismatch: ({ name, count }) => `La fonction personnalisée « ${name} » nécessite ${count} argument(s).`,
    atan2MissingOpenParen: () => "Ajoutez des parenthèses après atan2().",
    atan2MissingComma: () => "Saisissez atan2() au format atan2(y, x).",
    atan2MissingClosingParen: () => "Il manque une parenthèse fermante à atan2().",
    atan2DimensionMismatch: () => "Les deux arguments de atan2() doivent avoir la même dimension.",
    functionMissingOpenParen: ({ name }) => `Ajoutez des parenthèses après ${name}().`,
    functionMissingClosingParen: ({ name }) => `Il manque une parenthèse fermante à ${name}().`,
    unknownIdentifier: ({ name }) => `Aucune constante ni unité nommée « ${name} » n'a été trouvée.`,
    missingClosingParen: () => "Il manque une parenthèse fermante.",
    invalidExpressionSyntax: () => "La syntaxe de l'expression n'est pas valide.",
    invalidConstantDefinitionFormat: () => `Définissez une constante au format « W = 3cm ».`,
    incompatibleTargetUnit: ({ targetUnit }) => `Impossible de convertir le résultat en « ${targetUnit} ». Les dimensions ne correspondent pas.`,
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
export const DIMENSIONLESS_LABEL: LocalizedText = { en: "dimensionless", ja: "無次元", es: "adimensional", "pt-BR": "adimensional", de: "dimensionslos", fr: "sans dimension" };

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
