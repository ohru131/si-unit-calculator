import type { SavedConstant } from "@/lib/units";

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

export function parseConstantsBackup(raw: string): ImportedConstant[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("定数バックアップを読み取れません。JSON形式を確認してください。");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("定数バックアップの形式が正しくありません。");
  const backup = parsed as Partial<ConstantsBackup>;
  if (backup.format !== CONSTANTS_BACKUP_FORMAT || backup.version !== CONSTANTS_BACKUP_VERSION || !Array.isArray(backup.constants)) {
    throw new Error("このファイルは対応している定数バックアップではありません。");
  }
  if (!backup.constants.every(isImportedConstant)) throw new Error("バックアップに無効な定数が含まれています。");
  const symbols = backup.constants.map((item) => item.symbol);
  if (new Set(symbols).size !== symbols.length) throw new Error("バックアップ内で定数記号が重複しています。");
  return backup.constants;
}
