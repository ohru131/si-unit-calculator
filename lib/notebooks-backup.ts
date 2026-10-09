import { UNCATEGORIZED_CATEGORY_ID, type CalculationNotebook, type NotebookCategory, type NotebookLocalConstant } from "@/lib/calculator-store";
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
export type ImportedNotebookConstant = {
  symbol: string;
  expression: string;
  /**
   * 「測定値でない」の印は、**利用者が自分で決めたときだけ**持ち運ぶ（`exactEdited` 付き）。
   * シードが付けた印は復元後に `applyPresetExactConstants` が貼り直すので書き出す必要がなく、
   * 書き出すとシードを直したときに古いファイルが古い印を持ち込む。トグルを触っていない人の
   * ファイルは1バイトも変わらない（`presetOverrides`・`customUnits` を空なら省くのと同じ方針）。
   * `version` は 1 のまま据え置く——古いアプリはこの2フィールドを無視するだけで読める。
   */
  exact?: boolean;
  exactEdited?: boolean;
};

// 上のとおり、所有権の印が付いている定数だけ書き出す。
function exportedExactFields(constant: NotebookLocalConstant): Pick<ImportedNotebookConstant, "exact" | "exactEdited"> {
  return constant.exactEdited ? { exact: constant.exact === true, exactEdited: true } : {};
}

/**
 * 取り込み側。**`exactEdited` と `exact` が揃っていなければ所有権として認めない。**
 * 手で編集したファイルに `exactEdited` だけが書かれていると、`exact: false` として引き継いだ
 * うえに `applyPresetExactConstants` が「利用者が決めた欄」として貼り直しを飛ばすので、
 * **シードが図面の寸法と言っている定数が黙って測定値になる**（CodeRabbitが#77で検出）。
 * 揃っていない場合は印ごと無視して、シードからの貼り直しに任せる。
 *
 * **検証（`isImportedNotebookConstant`）を厳しくする方向では直さない**——あちらでfalseを返すと
 * `backup.notebooks.every(isImportedNotebook)` が落ちて**ファイル全体が読めなくなる**（壊れた
 * 要素でファイルごと無効にしないのがこのモジュールの既定。`isPresetNotebookOverride` の
 * コメントと同じ方針）。
 *
 * 書き出し側と対になるので、**この判定を呼び出し側で作り直さないこと**（取り込みの経路は
 * プリセットへの上書き適用とユーザーノートの取り込みの2つある）。
 */
export function importedExactFields(constant: ImportedNotebookConstant): Pick<NotebookLocalConstant, "exact" | "exactEdited"> {
  return constant.exactEdited === true && typeof constant.exact === "boolean"
    ? { exact: constant.exact, exactEdited: true }
    : {};
}
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
  /** 端末をまたいで同一の決定的なID（notebook-preset-<categoryId>::<seedId>）。 */
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
  return typeof candidate.symbol === "string" && typeof candidate.expression === "string"
    && (candidate.exact === undefined || typeof candidate.exact === "boolean")
    && (candidate.exactEdited === undefined || typeof candidate.exactEdited === "boolean");
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
 * シード比較にすると、地域別の価格既定値（lib/preset-regional-defaults.ts）が投入時に差し込まれる
 * プリセット（電気代・走行コストなど）を、編集していないのに編集扱いしてしまう。
 */
export function buildPresetNotebookOverrides(notebooks: CalculationNotebook[], options: NotebooksBackupOptions = {}): PresetNotebookOverride[] {
  return notebooks
    // 一括編集用の書き出し（Pro）は、編集していないプリセットも全件出す。書き戻しは差分マージなので、
    // 触らなかった行は取り込んでも何も変わらない（applyPresetNotebookOverrides）。
    .filter((notebook) => notebook.isPreset && (options.includeAllPresets || notebook.updatedAt !== notebook.createdAt))
    .map((notebook) => ({
      presetId: notebook.id,
      title: notebook.title,
      description: notebook.description,
      formulas: notebook.formulas.map(({ explanation, latex }) => ({ explanation, latex })),
      localConstants: notebook.localConstants.map((constant) => ({ symbol: constant.symbol, expression: constant.expression, ...exportedExactFields(constant) })),
      steps: notebook.steps.map(({ title, expression, targetUnit, formulaLatex, resultSymbol }) => ({ title, expression, targetUnit, formulaLatex, resultSymbol })),
    }));
}

/**
 * そのプリセットのシードが持つ文言（全言語ぶんのタイトル・説明文・手順名・数式の説明）。
 * 取り込んだ文言がこの中にあれば「書き出したときの言語のシードの文言のまま」＝利用者は編集していない、
 * と判断して書き換えない。書き換えると、言語を切り替えたときの再解決（localizePresetNotebooks）が
 * それを利用者の編集と読んで、**そのノートの文言が書き出した言語のまま固まる**。
 * calculator-store.tsx（RNを読み込む）に置いたシードの引き当てを使うので、呼び出し側から渡す。
 */
export type PresetSeedTextLookup = (notebook: CalculationNotebook) => ReadonlySet<string> | undefined;

function mergeText(current: string, incoming: string, seedTexts: ReadonlySet<string> | undefined): string {
  if (incoming === current) return current;
  if (seedTexts?.has(incoming)) return current;
  return incoming;
}

/**
 * 取り込んだpresetOverridesを、現存するプリセットのノート配列へ**差分として**当てる。
 *
 * **丸ごと差し替えないこと**（2026-10-09 に差分マージへ変えた。Pro の一括編集で全プリセットを書き出して
 * 書き戻せるようにしたため）。以前は定数・手順の配列を丸ごと作り直していて、id が
 * `…-override-constant-N` に振り直されるうえ、投入時の値（`seededExpression`）・地域既定値の目印
 * （`regionalDefault`）が全部消えていた。1件も触っていないノートまで「利用者の編集」扱いになり、
 * 以後シードの修正が届かず、電圧・単価も端末の地域に追従しなくなる。
 *
 * - **定数は記号で突き合わせる。** 式が同じなら現在の定数をそのまま残す（id・目印ごと）。変わって
 *   いれば式だけ書き換え、地域既定値の目印を外す（`releaseEditedRegionalDefaults` と同じ所有権の
 *   規則）。投入時の値（`seededExpression`）は残す——保存値と食い違うのでシードの更新は利用者の
 *   編集として避けて通る。ファイルに無い記号は消し、新しい記号は足す。並びはファイルの順。
 * - **手順は数と結果記号が同じなら位置で突き合わせる**（シード更新の同期と同じ条件）。式・表示単位・
 *   数式・手順名を差分で書き換え、id と投入時の値は残す。数や記号が変わっていれば構造の編集なので、
 *   ファイルの手順で作り直す（そのノートにはシードの修正が届かなくなるが、利用者の意図した編集）。
 * - **文言はシードのどの言語とも違うときだけ**書き換える（`PresetSeedTextLookup`）。
 * - 何も変わらなかったノートは updatedAt も触らない（書き出し側の「編集済み」の判定に使うため）。
 *
 * 適用先は isPreset のノートに限る（プリセットIDと同じidのユーザー作成ノートを上書きしないため）。
 * 一致するpresetIdが無いoverrideは黙って捨てる（アプリのバージョン差でプリセットが増減している場合）。
 */
export function applyPresetNotebookOverrides(
  presetNotebooks: CalculationNotebook[],
  overrides: PresetNotebookOverride[],
  now: string,
  seedTextsFor?: PresetSeedTextLookup,
): { notebooks: CalculationNotebook[]; appliedCount: number } {
  const overrideByPresetId = new Map(overrides.map((override) => [override.presetId, override]));
  let appliedCount = 0;
  const nextNotebooks = presetNotebooks.map((notebook) => {
    const override = notebook.isPreset ? overrideByPresetId.get(notebook.id) : undefined;
    if (!override) return notebook;
    const merged = mergePresetNotebookOverride(notebook, override, now, seedTextsFor?.(notebook));
    if (merged !== notebook) appliedCount += 1;
    return merged;
  });
  return { notebooks: nextNotebooks, appliedCount };
}

function mergePresetNotebookOverride(
  notebook: CalculationNotebook,
  override: PresetNotebookOverride,
  now: string,
  seedTexts: ReadonlySet<string> | undefined,
): CalculationNotebook {
  let changed = false;
  // 新しく作る行のid。決定的な形（`<ノートid>-override-constant-N`）にしつつ、差分マージで残した
  // 既存の行（以前の取り込みで同じ形のidを持っていることがある）と重なったら番号をずらす。
  // idが重なると編集画面が別の行を書き換える。
  const usedIds = new Set([...notebook.formulas, ...notebook.localConstants, ...notebook.steps].map((item) => item.id));
  const freshId = (kind: string, index: number) => {
    let id = `${notebook.id}-override-${kind}-${index}`;
    for (let suffix = 1; usedIds.has(id); suffix += 1) id = `${notebook.id}-override-${kind}-${index}-${suffix}`;
    usedIds.add(id);
    return id;
  };
  const track = <T>(current: T, next: T): T => {
    if (next !== current) changed = true;
    return next;
  };
  // 取り込んだ要素をスプレッドで展開しないこと。ファイル側に id が入っていたとき（手で編集した
  // JSONなど。検証関数は既知のフィールドの型しか見ないので余分なキーは素通りする）に、
  // 決定的なidを上書きしてしまう。検証済みの既知フィールドだけを取り出して組み直す。
  const title = track(notebook.title, mergeText(notebook.title, override.title, seedTexts));
  const description = track(notebook.description, mergeText(notebook.description, override.description, seedTexts));

  const formulas = override.formulas.length === notebook.formulas.length
    ? notebook.formulas.map((formula, index) => {
        const incoming = override.formulas[index];
        const explanation = mergeText(formula.explanation, incoming.explanation, seedTexts);
        if (explanation === formula.explanation && incoming.latex === formula.latex) return formula;
        changed = true;
        return { ...formula, explanation, latex: incoming.latex };
      })
    : (changed = true, override.formulas.map(({ explanation, latex }, index) => ({ id: freshId("formula", index), explanation, latex })));

  const currentBySymbol = new Map(notebook.localConstants.map((constant) => [constant.symbol, constant]));
  const localConstants = override.localConstants.map((incoming, index) => {
    const current = currentBySymbol.get(incoming.symbol);
    const exactFields = importedExactFields(incoming);
    if (!current) {
      changed = true;
      return { id: freshId("constant", index), symbol: incoming.symbol, expression: incoming.expression, ...exactFields };
    }
    const expressionChanged = incoming.expression !== current.expression;
    const exactChanged = exactFields.exactEdited === true && (current.exactEdited !== true || current.exact !== exactFields.exact);
    if (!expressionChanged && !exactChanged) return current;
    changed = true;
    const next = { ...current, ...exactFields };
    if (expressionChanged) {
      next.expression = incoming.expression;
      // 地域既定値の目印は「まだアプリの値」の記録なので、値を書き換えた時点で外す。
      delete next.regionalDefault;
    }
    return next;
  });
  if (localConstants.length !== notebook.localConstants.length || localConstants.some((constant, index) => constant !== notebook.localConstants[index])) changed = true;

  const sameStepShape = override.steps.length === notebook.steps.length
    && override.steps.every((incoming, index) => (incoming.resultSymbol ?? "") === (notebook.steps[index].resultSymbol ?? ""));
  const steps = sameStepShape
    ? notebook.steps.map((step, index) => {
        const incoming = override.steps[index];
        const stepTitle = mergeText(step.title, incoming.title, seedTexts);
        if (stepTitle === step.title && incoming.expression === step.expression && incoming.targetUnit === step.targetUnit && incoming.formulaLatex === step.formulaLatex) return step;
        changed = true;
        return { ...step, title: stepTitle, expression: incoming.expression, targetUnit: incoming.targetUnit, formulaLatex: incoming.formulaLatex };
      })
    : (changed = true, override.steps.map(({ title: stepTitle, expression, targetUnit, formulaLatex, resultSymbol }, index) => ({ id: freshId("step", index), title: stepTitle, expression, targetUnit, formulaLatex, resultSymbol })));

  if (!changed) return notebook;
  return { ...notebook, title, description, formulas, localConstants, steps, updatedAt: now };
}

export type NotebooksBackupOptions = {
  /** 編集していないプリセットも書き出す（Pro の一括編集用）。 */
  includeAllPresets?: boolean;
};

export function createNotebooksBackup(notebooks: CalculationNotebook[], categories: NotebookCategory[], customUnits: CustomUnit[] = [], exportedAt = new Date().toISOString(), options: NotebooksBackupOptions = {}): NotebooksBackup {
  const presetOverrides = buildPresetNotebookOverrides(notebooks, options);
  return {
    format: NOTEBOOKS_BACKUP_FORMAT,
    version: NOTEBOOKS_BACKUP_VERSION,
    exportedAt,
    notebooks: notebooks.filter((notebook) => !notebook.isPreset).map((notebook) => ({
      title: notebook.title,
      description: notebook.description,
      ...resolveExportedCategory(notebook, categories),
      formulas: notebook.formulas.map(({ explanation, latex }) => ({ explanation, latex })),
      localConstants: notebook.localConstants.map((constant) => ({ symbol: constant.symbol, expression: constant.expression, ...exportedExactFields(constant) })),
      steps: notebook.steps.map(({ title, expression, targetUnit, formulaLatex, resultSymbol }) => ({ title, expression, targetUnit, formulaLatex, resultSymbol })),
    })),
    // 空配列をわざわざ書き出さない（従来どおりプリセット編集・自作単位が無いバックアップは
    // 今までと同じ形にする）。
    ...(presetOverrides.length > 0 ? { presetOverrides } : {}),
    ...(customUnits.length > 0 ? { customUnits: customUnits.map(({ symbol, expression, scale, offset, dimension }) => ({ symbol, expression, scale, offset, dimension })) } : {}),
  };
}

export function serializeNotebooksBackup(notebooks: CalculationNotebook[], categories: NotebookCategory[], customUnits: CustomUnit[] = [], exportedAt?: string, options: NotebooksBackupOptions = {}) {
  return JSON.stringify(createNotebooksBackup(notebooks, categories, customUnits, exportedAt, options), null, 2);
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
