import { type AppLanguage } from "@/lib/i18n";
import { type CustomUnitErrorCode } from "@/lib/custom-units";

// lib/global-settings.tsxのCOPYと同じ「英語のキー集合が正」パターン。CustomUnitErrorCodeが
// 増えたときに、翻訳漏れがどの言語ブロックか型エラーで分かるようにするため
// Record<AppLanguage, Record<CustomUnitErrorCode, string>> にしている（as constは付けない）。
const MESSAGES: Record<AppLanguage, Record<CustomUnitErrorCode, string>> = {
  en: {
    emptySymbol: "Enter a symbol.",
    invalidSymbol: "Use letters only — no digits or spaces.",
    symbolTaken: "That symbol is already used by a built-in or custom unit.",
    emptyDefinition: "Enter a definition.",
    unparsableDefinition: "This definition could not be calculated.",
    nonAffineDefinition: "The definition must be linear in x (for example 2*x+5).",
    zeroScale: "The definition must not be zero.",
  },
  ja: {
    emptySymbol: "記号を入力してください。",
    invalidSymbol: "記号は英字のみで入力してください（数字・空白は使えません）。",
    symbolTaken: "その記号は既存の単位、または登録済みの自作単位で使われています。",
    emptyDefinition: "定義を入力してください。",
    unparsableDefinition: "この定義を計算できませんでした。",
    nonAffineDefinition: "定義は x の1次式にしてください（例: 2*x+5）。",
    zeroScale: "定義が0になっています。0以外の値にしてください。",
  },
  es: {
    emptySymbol: "Escribe un símbolo.",
    invalidSymbol: "Usa solo letras: sin dígitos ni espacios.",
    symbolTaken: "Ese símbolo ya lo usa una unidad integrada o personalizada.",
    emptyDefinition: "Escribe una definición.",
    unparsableDefinition: "No se pudo calcular esta definición.",
    nonAffineDefinition: "La definición debe ser lineal en x (por ejemplo, 2*x+5).",
    zeroScale: "La definición no puede ser cero.",
  },
  "pt-BR": {
    emptySymbol: "Digite um símbolo.",
    invalidSymbol: "Use apenas letras — sem dígitos nem espaços.",
    symbolTaken: "Esse símbolo já é usado por uma unidade integrada ou personalizada.",
    emptyDefinition: "Digite uma definição.",
    unparsableDefinition: "Não foi possível calcular esta definição.",
    nonAffineDefinition: "A definição precisa ser linear em x (por exemplo, 2*x+5).",
    zeroScale: "A definição não pode ser zero.",
  },
  de: {
    emptySymbol: "Gib ein Symbol ein.",
    invalidSymbol: "Verwende nur Buchstaben – keine Ziffern oder Leerzeichen.",
    symbolTaken: "Dieses Symbol wird bereits von einer integrierten oder eigenen Einheit verwendet.",
    emptyDefinition: "Gib eine Definition ein.",
    unparsableDefinition: "Diese Definition konnte nicht berechnet werden.",
    nonAffineDefinition: "Die Definition muss linear in x sein (zum Beispiel 2*x+5).",
    zeroScale: "Die Definition darf nicht null sein.",
  },
  fr: {
    emptySymbol: "Saisissez un symbole.",
    invalidSymbol: "Utilisez uniquement des lettres : ni chiffres ni espaces.",
    symbolTaken: "Ce symbole est déjà utilisé par une unité intégrée ou personnalisée.",
    emptyDefinition: "Saisissez une définition.",
    unparsableDefinition: "Impossible de calculer cette définition.",
    nonAffineDefinition: "La définition doit être linéaire en x (par exemple 2*x+5).",
    zeroScale: "La définition ne peut pas être nulle.",
  },
};

export function customUnitErrorMessage(code: CustomUnitErrorCode, language: AppLanguage): string {
  return MESSAGES[language][code];
}
