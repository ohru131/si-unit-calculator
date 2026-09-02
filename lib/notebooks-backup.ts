import { UNCATEGORIZED_CATEGORY_ID, type CalculationNotebook, type NotebookCategory } from "@/lib/calculator-store";
import { type AppLanguage } from "@/lib/i18n";
import { PRESET_NOTEBOOK_CATEGORIES } from "@/lib/notebook-formulas";

// このモジュールは入り口（parseNotebooksBackup）が1個だけの浅いモジュールなので、
// lib/units.tsのようにエラーコード化して表示側で翻訳する方式ではなく、
// 呼び出し元から言語を直接受け取ってこの場でメッセージを組み立てる。
const EN_BACKUP_MESSAGES = {
  unreadable: "Could not read the notebooks backup. Check that it is valid JSON.",
  invalidFormat: "The notebooks backup format is invalid.",
  unsupportedFile: "This file is not a supported notebooks backup.",
  unsupportedVersion: (version: string) => `This backup version (${version}) is not supported.`,
  invalidNotebooks: "The backup contains invalid notebooks.",
};
const BACKUP_MESSAGES: Record<AppLanguage, typeof EN_BACKUP_MESSAGES> = {
  en: EN_BACKUP_MESSAGES,
  ja: {
    unreadable: "計算ノートのバックアップを読み取れません。JSON形式を確認してください。",
    invalidFormat: "計算ノートのバックアップの形式が正しくありません。",
    unsupportedFile: "このファイルは対応している計算ノートのバックアップではありません。",
    unsupportedVersion: (version: string) => `このバックアップのバージョン（${version}）には対応していません。`,
    invalidNotebooks: "バックアップに無効な計算ノートが含まれています。",
  },
};

export const NOTEBOOKS_BACKUP_FORMAT = "si-unit-calculator.notebooks";
export const NOTEBOOKS_BACKUP_VERSION = 1;

export type ImportedNotebookFormula = { explanation: string; latex: string };
export type ImportedNotebookConstant = { symbol: string; expression: string };
export type ImportedNotebookStep = { title: string; expression: string; targetUnit: string; formulaLatex?: string; resultSymbol?: string };

export type ImportedNotebook = {
  title: string;
  description: string;
  /** 既知のプリセットカテゴリID（またはUNCATEGORIZED_CATEGORY_ID）ならそのまま使う。端末をまたいでも安定しているため。 */
  categoryId?: string;
  /** ユーザー作成カテゴリはID自体が端末固有なので、名前で引き継いで取り込み時に解決する。 */
  categoryName?: string;
  formulas: ImportedNotebookFormula[];
  localConstants: ImportedNotebookConstant[];
  steps: ImportedNotebookStep[];
};

export type NotebooksBackup = {
  format: typeof NOTEBOOKS_BACKUP_FORMAT;
  version: typeof NOTEBOOKS_BACKUP_VERSION;
  exportedAt: string;
  notebooks: ImportedNotebook[];
};

function isImportedNotebookFormula(value: unknown): value is ImportedNotebookFormula {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ImportedNotebookFormula>;
  return typeof candidate.explanation === "string" && typeof candidate.latex === "string";
}

function isImportedNotebookConstant(value: unknown): value is ImportedNotebookConstant {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ImportedNotebookConstant>;
  return typeof candidate.symbol === "string" && typeof candidate.expression === "string";
}

function isImportedNotebookStep(value: unknown): value is ImportedNotebookStep {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ImportedNotebookStep>;
  return typeof candidate.title === "string" && typeof candidate.expression === "string" && typeof candidate.targetUnit === "string"
    && (candidate.formulaLatex === undefined || typeof candidate.formulaLatex === "string")
    && (candidate.resultSymbol === undefined || typeof candidate.resultSymbol === "string");
}

function isImportedNotebook(value: unknown): value is ImportedNotebook {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ImportedNotebook>;
  return typeof candidate.title === "string" && candidate.title.trim().length > 0 && typeof candidate.description === "string"
    && (candidate.categoryId === undefined || typeof candidate.categoryId === "string")
    && (candidate.categoryName === undefined || typeof candidate.categoryName === "string")
    && Array.isArray(candidate.formulas) && candidate.formulas.every(isImportedNotebookFormula)
    && Array.isArray(candidate.localConstants) && candidate.localConstants.every(isImportedNotebookConstant)
    && Array.isArray(candidate.steps) && candidate.steps.length > 0 && candidate.steps.every(isImportedNotebookStep);
}

function resolveExportedCategory(notebook: CalculationNotebook, categories: NotebookCategory[]): Pick<ImportedNotebook, "categoryId" | "categoryName"> {
  if (notebook.categoryId === UNCATEGORIZED_CATEGORY_ID || PRESET_NOTEBOOK_CATEGORIES.some((category) => category.id === notebook.categoryId)) {
    return { categoryId: notebook.categoryId };
  }
  const userCategory = categories.find((category) => category.id === notebook.categoryId);
  return userCategory ? { categoryName: userCategory.name } : { categoryId: UNCATEGORIZED_CATEGORY_ID };
}

export function createNotebooksBackup(notebooks: CalculationNotebook[], categories: NotebookCategory[], exportedAt = new Date().toISOString()): NotebooksBackup {
  return {
    format: NOTEBOOKS_BACKUP_FORMAT,
    version: NOTEBOOKS_BACKUP_VERSION,
    exportedAt,
    notebooks: notebooks.filter((notebook) => !notebook.isPreset).map((notebook) => ({
      title: notebook.title,
      description: notebook.description,
      ...resolveExportedCategory(notebook, categories),
      formulas: notebook.formulas.map(({ explanation, latex }) => ({ explanation, latex })),
      localConstants: notebook.localConstants.map(({ symbol, expression }) => ({ symbol, expression })),
      steps: notebook.steps.map(({ title, expression, targetUnit, formulaLatex, resultSymbol }) => ({ title, expression, targetUnit, formulaLatex, resultSymbol })),
    })),
  };
}

export function serializeNotebooksBackup(notebooks: CalculationNotebook[], categories: NotebookCategory[], exportedAt?: string) {
  return JSON.stringify(createNotebooksBackup(notebooks, categories, exportedAt), null, 2);
}

export function parseNotebooksBackup(raw: string, language: AppLanguage): ImportedNotebook[] {
  const messages = BACKUP_MESSAGES[language];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(messages.unreadable);
  }
  if (!parsed || typeof parsed !== "object") throw new Error(messages.invalidFormat);
  const backup = parsed as Partial<NotebooksBackup>;
  if (backup.format !== NOTEBOOKS_BACKUP_FORMAT || !Array.isArray(backup.notebooks)) {
    throw new Error(messages.unsupportedFile);
  }
  if (backup.version !== NOTEBOOKS_BACKUP_VERSION) {
    throw new Error(messages.unsupportedVersion(String(backup.version)));
  }
  if (!backup.notebooks.every(isImportedNotebook)) throw new Error(messages.invalidNotebooks);
  return backup.notebooks;
}
