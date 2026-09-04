import { UNCATEGORIZED_CATEGORY_ID, type CalculationNotebook, type NotebookCategory } from "@/lib/calculator-store";
import { parseCustomUnitsField, type CustomUnit } from "@/lib/custom-units";
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

/**
 * プリセットの計算ノートへの「編集の差分」。プリセット本体（ノートの新規作成・削除）は
 * バックアップの対象外のまま（取り込み側が必ずisPreset:falseで作りプリセットと突き合わせないため、
 * 書き出すとプリセットと重複してしまう）だが、既存のプリセットに対する上書きだけは別枠で
 * 持ち運べるようにする。categoryId・pinnedを持たないのは、適用時に既存ノートのそれらを
 * 変更しない（内容だけを差し替える）ため。
 */
export type PresetNotebookOverride = {
  /** 端末をまたいで同一の決定的なID（notebook-preset-<categoryId>-<seedIndex>）。 */
  presetId: string;
  title: string;
  description: string;
  formulas: ImportedNotebookFormula[];
  localConstants: ImportedNotebookConstant[];
  steps: ImportedNotebookStep[];
};

export type NotebooksBackup = {
  format: typeof NOTEBOOKS_BACKUP_FORMAT;
  version: typeof NOTEBOOKS_BACKUP_VERSION;
  exportedAt: string;
  notebooks: ImportedNotebook[];
  /**
   * 任意フィールド。version は 1 のまま据え置いているので、これが無い古いバックアップファイルも
   * 引き続き読める（version を上げると古いアプリがファイルごと弾いてしまうため、既存の
   * バージョニングは変えない方針）。
   */
  presetOverrides?: PresetNotebookOverride[];
  /**
   * 任意フィールド。上のpresetOverridesと同じ理由でversionは上げない。取り込むノートが
   * 自作単位（例: "2shaku"）を参照している場合、この情報が無いと別端末でノートの計算が壊れる
   * （記号が未定義になるため）。空配列のときはフィールド自体を出さない（自作単位を
   * 使っていないユーザーのバックアップが今までと1バイトも変わらないようにするため）。
   */
  customUnits?: CustomUnit[];
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

// 壊れたpresetOverridesの要素は、その要素だけを黙って捨てる（ファイル全体は無効にしない）。
// ノート本体（notebooks）さえ読めれば取り込めるべきで、override側の壊れ方でそれを道連れに
// したくないため、isImportedNotebookとは別に緩めの単体バリデータとして持つ。
function isPresetNotebookOverride(value: unknown): value is PresetNotebookOverride {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PresetNotebookOverride>;
  return typeof candidate.presetId === "string" && candidate.presetId.trim().length > 0
    && typeof candidate.title === "string" && typeof candidate.description === "string"
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

/**
 * プリセットのノートのうち「ユーザーが一度でも保存した」ものだけをoverrideとして書き出す。
 * 判定は updatedAt !== createdAt で行う（シードの値と比較する方式にはしない）。投入時
 * （calculator-store.tsxのシード処理）は createdAt と updatedAt に同じ now を入れており、
 * upsertNotebook を通ると updatedAt だけが新しくなるので、これが「編集済み」の正確な目印になる。
 * シード比較にすると、地域別の価格既定値（lib/preset-price-defaults.ts）が投入時に差し込まれる
 * プリセット（電気代・走行コストなど）を、編集していないのに編集扱いしてしまう。
 */
export function buildPresetNotebookOverrides(notebooks: CalculationNotebook[]): PresetNotebookOverride[] {
  return notebooks
    .filter((notebook) => notebook.isPreset && notebook.updatedAt !== notebook.createdAt)
    .map((notebook) => ({
      presetId: notebook.id,
      title: notebook.title,
      description: notebook.description,
      formulas: notebook.formulas.map(({ explanation, latex }) => ({ explanation, latex })),
      localConstants: notebook.localConstants.map(({ symbol, expression }) => ({ symbol, expression })),
      steps: notebook.steps.map(({ title, expression, targetUnit, formulaLatex, resultSymbol }) => ({ title, expression, targetUnit, formulaLatex, resultSymbol })),
    }));
}

/**
 * 取り込んだpresetOverridesを、現存するプリセットのノート配列へ適用する。
 * presetIdで現存のノートを引き、一致するものにだけ title/description/formulas/localConstants/steps を
 * 上書きする。id・isPreset・pinned・createdAtは呼び出し側が渡した現在のノートのものをそのまま保つ
 * （このスプレッド順で自然にそうなる）。一致するpresetIdが無いoverrideは黙って捨てる
 * （アプリのバージョン差でプリセットが増減している場合や、別アプリのファイルを読ませた場合に
 * 落ちないようにするため）。
 *
 * 適用先は isPreset のノートに限る。呼び出し側でも絞っているが、ここでも見ておかないと
 * 「プリセットIDと同じidを持つユーザー作成ノート」を作られたときにそれを上書きしてしまう。
 * 契約をコメントだけで守らせるより、この関数自身が守るほうが安全。
 */
export function applyPresetNotebookOverrides(
  presetNotebooks: CalculationNotebook[],
  overrides: PresetNotebookOverride[],
  now: string,
): { notebooks: CalculationNotebook[]; appliedCount: number } {
  const overrideByPresetId = new Map(overrides.map((override) => [override.presetId, override]));
  let appliedCount = 0;
  const nextNotebooks = presetNotebooks.map((notebook) => {
    const override = notebook.isPreset ? overrideByPresetId.get(notebook.id) : undefined;
    if (!override) return notebook;
    appliedCount += 1;
    return {
      ...notebook,
      title: override.title,
      description: override.description,
      // 取り込んだ要素をスプレッドで展開すると、ファイル側に id が入っていたとき（手で編集した
      // JSONなど。検証関数は既知のフィールドの型しか見ないので余分なキーは素通りする）に
      // 生成した決定的なidを上書きしてしまう。id同士が衝突すると、編集画面が別の行を書き換える。
      // 検証済みの既知フィールドだけを取り出して組み直す。
      formulas: override.formulas.map(({ explanation, latex }, index) => ({ id: `${notebook.id}-override-formula-${index}`, explanation, latex })),
      localConstants: override.localConstants.map(({ symbol, expression }, index) => ({ id: `${notebook.id}-override-constant-${index}`, symbol, expression })),
      steps: override.steps.map(({ title, expression, targetUnit, formulaLatex, resultSymbol }, index) => ({ id: `${notebook.id}-override-step-${index}`, title, expression, targetUnit, formulaLatex, resultSymbol })),
      updatedAt: now,
    };
  });
  return { notebooks: nextNotebooks, appliedCount };
}

export function createNotebooksBackup(notebooks: CalculationNotebook[], categories: NotebookCategory[], customUnits: CustomUnit[] = [], exportedAt = new Date().toISOString()): NotebooksBackup {
  const presetOverrides = buildPresetNotebookOverrides(notebooks);
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
    // 空配列をわざわざ書き出さない（従来どおりプリセット編集・自作単位が無いバックアップは
    // 今までと同じ形にする）。
    ...(presetOverrides.length > 0 ? { presetOverrides } : {}),
    ...(customUnits.length > 0 ? { customUnits: customUnits.map(({ symbol, expression, scale, offset, dimension }) => ({ symbol, expression, scale, offset, dimension })) } : {}),
  };
}

export function serializeNotebooksBackup(notebooks: CalculationNotebook[], categories: NotebookCategory[], customUnits: CustomUnit[] = [], exportedAt?: string) {
  return JSON.stringify(createNotebooksBackup(notebooks, categories, customUnits, exportedAt), null, 2);
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

export type ParsedNotebooksBackup = {
  notebooks: ImportedNotebook[];
  /** presetOverridesが無い（バージョン導入前の）古いファイルでは常に空配列になる。 */
  presetOverrides: PresetNotebookOverride[];
  /** customUnitsが無い（この機能の導入前の）古いファイルでは常に空配列になる。 */
  customUnits: CustomUnit[];
};

export function parseNotebooksBackup(raw: string, language: AppLanguage): ParsedNotebooksBackup {
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
  // presetOverrides・customUnitsはどちらも任意フィールドなので無くても既存どおり読める。壊れた要素は
  // ファイル全体を無効にせず、その要素だけを黙って捨てる（ノート本体は取り込めるべきなので）。
  const presetOverrides = Array.isArray(backup.presetOverrides) ? backup.presetOverrides.filter(isPresetNotebookOverride) : [];
  const customUnits = parseCustomUnitsField(backup.customUnits);
  return { notebooks: backup.notebooks, presetOverrides, customUnits };
}
