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
  es: {
    unreadable: "No se pudo leer la copia de seguridad de los cuadernos. Comprueba que sea un JSON válido.",
    invalidFormat: "El formato de la copia de seguridad de los cuadernos no es válido.",
    unsupportedFile: "Este archivo no es una copia de seguridad de cuadernos admitida.",
    unsupportedVersion: (version: string) => `Esta versión de copia de seguridad (${version}) no es compatible.`,
    invalidNotebooks: "La copia de seguridad contiene cuadernos no válidos.",
  },
  "pt-BR": {
    unreadable: "Não foi possível ler o backup dos cadernos de cálculo. Verifique se é um JSON válido.",
    invalidFormat: "O formato do backup dos cadernos de cálculo é inválido.",
    unsupportedFile: "Este arquivo não é um backup de cadernos de cálculo compatível.",
    unsupportedVersion: (version: string) => `Esta versão do backup (${version}) não é compatível.`,
    invalidNotebooks: "O backup contém cadernos de cálculo inválidos.",
  },
  de: {
    unreadable: "Das Rechenheft-Backup konnte nicht gelesen werden. Prüfe, ob es sich um gültiges JSON handelt.",
    invalidFormat: "Das Format des Rechenheft-Backups ist ungültig.",
    unsupportedFile: "Diese Datei ist kein unterstütztes Rechenheft-Backup.",
    unsupportedVersion: (version: string) => `Diese Backup-Version (${version}) wird nicht unterstützt.`,
    invalidNotebooks: "Das Backup enthält ungültige Rechenhefte.",
  },
  fr: {
    unreadable: "Impossible de lire la sauvegarde des carnets de calcul. Vérifiez qu'il s'agit d'un JSON valide.",
    invalidFormat: "Le format de la sauvegarde des carnets de calcul n'est pas valide.",
    unsupportedFile: "Ce fichier n'est pas une sauvegarde de carnets de calcul prise en charge.",
    unsupportedVersion: (version: string) => `Cette version de sauvegarde (${version}) n'est pas prise en charge.`,
    invalidNotebooks: "La sauvegarde contient des carnets de calcul non valides.",
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

// Windows/macOS双方でファイル名に使えない文字（制御文字含む）。カテゴリ単位のエクスポートは
// ユーザーが自由に付けたカテゴリ名をそのままファイル名に混ぜるため、ここで必ず無害化する。
const FORBIDDEN_FILE_LABEL_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g;
// ファイルシステム・共有シート側の長さ制限に余裕を持たせるための上限（拡張子・接頭辞は含まない）。
const MAX_BACKUP_FILE_LABEL_LENGTH = 60;

/**
 * カテゴリ名などユーザー由来の文字列を、バックアップファイル名の一部として安全に使える形に整形する。
 * 禁則文字はハイフンに置換し、連続したハイフン・前後の空白やハイフンを畳んでから長さを制限する。
 * 全体が禁則文字や記号だけだった場合は空文字を返すので、呼び出し側はそれをラベル無し扱い
 * （既存の既定ファイル名へのフォールバック）の合図として使える。
 */
export function sanitizeBackupFileLabel(label: string): string {
  const withoutForbiddenChars = label.replace(FORBIDDEN_FILE_LABEL_CHARS, "-");
  const collapsed = withoutForbiddenChars.replace(/-+/g, "-").replace(/^[\s-]+|[\s-]+$/g, "");
  return collapsed.slice(0, MAX_BACKUP_FILE_LABEL_LENGTH).replace(/^[\s-]+|[\s-]+$/g, "");
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
