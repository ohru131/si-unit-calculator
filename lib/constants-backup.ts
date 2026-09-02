import { type AppLanguage } from "@/lib/i18n";
import type { SavedConstant } from "@/lib/units";

// このモジュールは入り口（parseConstantsBackup）が1個だけの浅いモジュールなので、
// lib/units.tsのようにエラーコード化して表示側で翻訳する方式ではなく、
// 呼び出し元から言語を直接受け取ってこの場でメッセージを組み立てる。
const EN_BACKUP_MESSAGES = {
  unreadable: "Could not read the constants backup. Check that it is valid JSON.",
  invalidFormat: "The constants backup format is invalid.",
  unsupportedFile: "This file is not a supported constants backup.",
  invalidConstants: "The backup contains invalid constants.",
  duplicateSymbols: "The backup contains duplicate constant symbols.",
};
const BACKUP_MESSAGES: Record<AppLanguage, typeof EN_BACKUP_MESSAGES> = {
  en: EN_BACKUP_MESSAGES,
  ja: {
    unreadable: "定数バックアップを読み取れません。JSON形式を確認してください。",
    invalidFormat: "定数バックアップの形式が正しくありません。",
    unsupportedFile: "このファイルは対応している定数バックアップではありません。",
    invalidConstants: "バックアップに無効な定数が含まれています。",
    duplicateSymbols: "バックアップ内で定数記号が重複しています。",
  },
};

export const CONSTANTS_BACKUP_FORMAT = "si-unit-calculator.constants";
export const CONSTANTS_BACKUP_VERSION = 1;

export type ImportedConstant = Pick<SavedConstant, "symbol" | "expression" | "createdAt">;

export type ConstantsBackup = {
  format: typeof CONSTANTS_BACKUP_FORMAT;
  version: typeof CONSTANTS_BACKUP_VERSION;
  exportedAt: string;
  constants: ImportedConstant[];
};

function isImportedConstant(value: unknown): value is ImportedConstant {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ImportedConstant>;
  return typeof candidate.symbol === "string" && /^[A-Za-z_][A-Za-z0-9_]*$/.test(candidate.symbol) && !/^a[1-9]\d*$/i.test(candidate.symbol) && typeof candidate.expression === "string" && candidate.expression.trim().length > 0 && typeof candidate.createdAt === "string";
}

export function createConstantsBackup(constants: SavedConstant[], exportedAt = new Date().toISOString()): ConstantsBackup {
  return {
    format: CONSTANTS_BACKUP_FORMAT,
    version: CONSTANTS_BACKUP_VERSION,
    exportedAt,
    constants: constants.map(({ symbol, expression, createdAt }) => ({ symbol, expression, createdAt })),
  };
}

export function serializeConstantsBackup(constants: SavedConstant[], exportedAt?: string) {
  return JSON.stringify(createConstantsBackup(constants, exportedAt), null, 2);
}

export function parseConstantsBackup(raw: string, language: AppLanguage): ImportedConstant[] {
  const messages = BACKUP_MESSAGES[language];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(messages.unreadable);
  }
  if (!parsed || typeof parsed !== "object") throw new Error(messages.invalidFormat);
  const backup = parsed as Partial<ConstantsBackup>;
  if (backup.format !== CONSTANTS_BACKUP_FORMAT || backup.version !== CONSTANTS_BACKUP_VERSION || !Array.isArray(backup.constants)) {
    throw new Error(messages.unsupportedFile);
  }
  if (!backup.constants.every(isImportedConstant)) throw new Error(messages.invalidConstants);
  const symbols = backup.constants.map((item) => item.symbol);
  if (new Set(symbols).size !== symbols.length) throw new Error(messages.duplicateSymbols);
  return backup.constants;
}
