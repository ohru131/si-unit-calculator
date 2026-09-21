import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { ImportedConstant } from "@/lib/constants-backup";
import { mergeCustomUnits, parseCustomUnitsField, type CustomUnit } from "@/lib/custom-units";
import { useGlobalSettings } from "@/lib/global-settings";
import { APP_LANGUAGES, AppLanguage, isAppLanguage, localizedText, LocalizedText } from "@/lib/i18n";
import { PRESET_NOTEBOOK_CATEGORIES, PRESET_NOTEBOOK_SEEDS, PRESET_NOTEBOOK_SEEDS_AS_SEEDED, seedSlug } from "@/lib/notebook-formulas";
import { presetResultSymbolPatch } from "@/lib/notebook-result-symbols";
import type { NotebookSeedConstant } from "@/lib/notebook-formulas/types";
import { pushNotebookHistoryEntry, removeNotebookHistoryEntry, type NotebookHistoryEntry } from "@/lib/notebook-history";
import { isPresetRegionalDefaultKind, PresetRegionalDefaults, type PresetRegionalDefaultKind, resolvePresetRegionalDefaults } from "@/lib/preset-regional-defaults";
import { presetRegionalDefaultPatch, releaseEditedRegionalDefaults } from "@/lib/preset-regional-sync";
import { applyPresetNotebookOverrides, importedExactFields, type ImportedNotebook, type PresetNotebookOverride } from "@/lib/notebooks-backup";
import { IDENTIFIER_PATTERN, isResolvableUnitSymbol, isUnitStart, NUMBER_TOKEN_PATTERN, parseConstantDefinition, Quantity, SavedConstant, setCustomUnits as setCustomUnitsRegistry, unitSuffixEnd, type CustomUnitRegistration } from "@/lib/units";

const CONSTANTS_STORAGE_KEY = "si-unit-calculator.constants.v1";
const HISTORY_STORAGE_KEY = "si-unit-calculator.history.v1";
const FAVORITE_UNITS_STORAGE_KEY = "si-unit-calculator.favorite-units.v1";
const CUSTOM_UNITS_STORAGE_KEY = "si-unit-calculator.custom-units.v1";
const NOTES_STORAGE_KEY = "si-unit-calculator.notes.v1";
const CLEARED_CONSTANTS_STORAGE_KEY = "si-unit-calculator.cleared-constants.v1";
const NOTEBOOKS_STORAGE_KEY = "si-unit-calculator.notebooks.v1";
const NOTEBOOK_CATEGORIES_STORAGE_KEY = "si-unit-calculator.notebook-categories.v1";
const NOTEBOOKS_MIGRATED_STORAGE_KEY = "si-unit-calculator.notebooks-migrated.v1";
const NOTEBOOKS_SEEDED_PRESETS_STORAGE_KEY = "si-unit-calculator.notebooks-seeded-presets.v1";
// HISTORY_STORAGE_KEY（計算履歴）とは別物。ノートの使用履歴専用のキー。
const NOTEBOOK_HISTORY_STORAGE_KEY = "si-unit-calculator.notebook-history.v1";
// 「ノート」タブに表示中の1件。タブを切り替えても・アプリを再起動しても同じノートが
// 出続けることが価値の中心なので、明示的に永続化する（画面側の実装はこのストアの外）。
const ACTIVE_NOTEBOOK_STORAGE_KEY = "si-unit-calculator.active-notebook.v1";
// プリセットの表示文言を最後に解決した言語。resolveLocalizedField の「未編集判定」を
// 対応言語全部との比較ではなく、この言語のシード文言とだけの比較に絞るために使う
// （詳しくは resolveLocalizedField のコメントを参照）。
const PRESETS_LANGUAGE_STORAGE_KEY = "si-unit-calculator.presets-language.v1";
// 「地域別既定値の目印を旧データへ付け直す移行が済んだか」のフラグ。**1回きりであることを
// フラグで保証しないと、利用者が編集して目印を外した定数を「旧データ」と誤認して付け直し、
// 次の起動で編集内容を上書きしてしまう**（CodeRabbitが#54で検出）。
// 「一部の定数に目印が無い」状態は正常でもあり得る（シードで regionalDefault を付けていない
// 定数、および利用者が編集した定数）ので、データの形からは旧か新かを判定できない。
const REGIONAL_DEFAULTS_STAMPED_STORAGE_KEY = "si-unit-calculator.regional-defaults-stamped.v1";

export const UNCATEGORIZED_CATEGORY_ID = "uncategorized";

// このファイルはコンポーネント（CalculatorProvider）で、既にuseGlobalSettings()経由でlanguageを
// 取得できるため、lib/notebook-engine.tsのような「引数でlanguageを受け取る」方式ではなく、
// 既存のUI文言と同じRecord<AppLanguage, T>のCOPYパターンをそのまま使う。
// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_STORE_MESSAGES = {
  reservedAutoConstantSymbol: "a1, a2, and so on are reserved for automatic history constants.",
  unitSymbolConstant: (symbol: string) => `"${symbol}" is already a unit symbol. Pick a different name, such as ${symbol}1.`,
  constantsImportFailed: (symbols: string) => `Could not load constants: ${symbols}. Check what they reference and their expressions.`,
  categoryNameRequired: "Enter a category name.",
};
const STORE_MESSAGES: Record<AppLanguage, typeof EN_STORE_MESSAGES> = {
  en: EN_STORE_MESSAGES,
  ja: {
    reservedAutoConstantSymbol: "a1、a2…は計算履歴の自動定数として予約されています。",
    unitSymbolConstant: (symbol: string) => `「${symbol}」は単位の記号です。${symbol}1 のように別の名前にしてください。`,
    constantsImportFailed: (symbols: string) => `定数を読み込めませんでした：${symbols}。参照先と式を確認してください。`,
    categoryNameRequired: "カテゴリ名を入力してください。",
  },
  es: {
    reservedAutoConstantSymbol: "a1, a2, etc. están reservados para las constantes automáticas del historial.",
    unitSymbolConstant: (symbol: string) => `«${symbol}» ya es un símbolo de unidad. Elige otro nombre, por ejemplo ${symbol}1.`,
    constantsImportFailed: (symbols: string) => `No se pudieron cargar estas constantes: ${symbols}. Revisa a qué hacen referencia y sus expresiones.`,
    categoryNameRequired: "Introduce un nombre de categoría.",
  },
  "pt-BR": {
    reservedAutoConstantSymbol: "a1, a2 etc. são reservados para as constantes automáticas do histórico.",
    unitSymbolConstant: (symbol: string) => `"${symbol}" já é um símbolo de unidade. Escolha outro nome, por exemplo ${symbol}1.`,
    constantsImportFailed: (symbols: string) => `Não foi possível carregar estas constantes: ${symbols}. Verifique a que elas se referem e suas expressões.`,
    categoryNameRequired: "Informe um nome de categoria.",
  },
  de: {
    reservedAutoConstantSymbol: "a1, a2 usw. sind für die automatischen Verlaufskonstanten reserviert.",
    unitSymbolConstant: (symbol: string) => `„${symbol}“ ist bereits ein Einheitenzeichen. Wähle einen anderen Namen, zum Beispiel ${symbol}1.`,
    constantsImportFailed: (symbols: string) => `Diese Konstanten konnten nicht geladen werden: ${symbols}. Prüfe, worauf sie sich beziehen, und ihre Ausdrücke.`,
    categoryNameRequired: "Gib einen Kategorienamen ein.",
  },
  fr: {
    reservedAutoConstantSymbol: "a1, a2, etc. sont réservés aux constantes automatiques de l'historique.",
    unitSymbolConstant: (symbol: string) => `« ${symbol} » est déjà un symbole d’unité. Choisissez un autre nom, par exemple ${symbol}1.`,
    constantsImportFailed: (symbols: string) => `Impossible de charger ces constantes : ${symbols}. Vérifiez leurs références et leurs expressions.`,
    categoryNameRequired: "Saisissez un nom de catégorie.",
  },
};

export type SavedCalculation = {
  id: string;
  expression: string;
  resultText: string;
  quantity: Quantity;
  targetUnit: string;
  createdAt: string;
};

export type CalculationNoteStep = {
  id: string;
  title: string;
  expression: string;
  targetUnit: string;
  /** プリセットの手順にだけ付く、見やすい表示用のLaTeX数式（手入力のノートでは未設定）。 */
  formulaLatex?: string;
  /** 「v = v0 + a*t」のように名前付きで手順を定義したときの結果の変数名。後続の手順から
   * この名前で参照できる（省略時は notebookStepSymbol の s1, s2… にフォールバックする）。 */
  resultSymbol?: string;
  /** 投入時にアプリが入れた式・表示単位（`NotebookLocalConstant.seededExpression` と同じ役割）。 */
  seededExpression?: string;
  seededTargetUnit?: string;
};

/** 旧・計算ノート（フラット一覧）の形。読み込み時、notebooks への一度きりの移行にのみ使う。 */
type LegacyCalculationNote = {
  id: string;
  title: string;
  description: string;
  steps: CalculationNoteStep[];
  createdAt: string;
  updatedAt: string;
};

/** ノート専用のローカル定数。定義順に解決され、後の行は前の行を参照できる（lib/notebook-engine.ts）。 */
export type NotebookLocalConstant = {
  id: string;
  /** 数式の変数と同じ記号にする（下付き文字・ギリシャ文字も識別子として使えるため、表示用の別名は不要）。 */
  symbol: string;
  expression: string;
  /**
   * **この式がまだ「アプリが入れた地域別の既定値」であることの目印。**
   * 付いている間は端末の地域に追従して差し替わり、利用者が値を書き換えた時点で外れて
   * 以後アプリは触らない（所有権の記録）。詳しくは lib/preset-regional-sync.ts。
   */
  regionalDefault?: PresetRegionalDefaultKind;
  /**
   * **この数は測定値ではない**（有効数字に数えない）。図面の呼び寸法・個数・規格で決まる値。
   * シードの `NotebookSeedConstant.exact` をそのまま写したもので、`regionalDefault` と違い
   * **所有権の記録ではない**——利用者が値を書き換えても外れない。「この欄は図面の寸法である」
   * というノートの構造の話であって、いま入っている値が誰のものかとは別だから。
   * 読み込みのたびにシードから貼り直す（lib/calculator-store.tsx の applyPresetExactConstants）。
   */
  exact?: boolean;
  /**
   * **上の `exact` を利用者が自分で決めたことの記録**（こちらは所有権の記録）。
   * 付いている定数は `applyPresetExactConstants` の貼り直しから除外するので、プリセットでも
   * 利用者の判断が残る。**印そのものを所有権にしなかった理由**は、`exact` が無い状態には
   * 「シードが付けていない」と「利用者が外した」の2つの意味があり、値の形からは区別できない
   * ため（`regionalDefault` の付け直しを1回きりに縛らなければならなかったのと同じ穴）。
   * 別のフィールドで「利用者が触った」を明示すれば、貼り直しは毎回走ったままでよい。
   */
  exactEdited?: boolean;
  /**
   * **投入時にアプリが入れた式そのもの。** 保存されている `expression` がこれと一致していれば
   * 「まだアプリの値」＝シードを直したときに差し替えてよい。違っていれば利用者が編集した値なので
   * 触らない（`applyPresetSeedUpdates`）。
   *
   * **所有権を別フィールドで持つ理由**は `regionalDefault` と同じ。保存値と**現在の**シードを
   * 比べる方式では「利用者が編集した」と「シードが変わった」を区別できない——どちらも
   * 「保存値 ≠ 現在のシード」になる。投入した時点の値を残せば、その2つが分かれる。
   *
   * **無い定数は編集済みとして扱う**（この仕組みを入れる前に投入された端末のデータ）。
   * そちらを未編集と見なすと、過去の編集を黙って上書きしてしまう。
   */
  seededExpression?: string;
};

/** 「説明文＋数式」のペア。計算手順（steps）とは独立に、複数個並べて解説できる。 */
export type NotebookFormula = {
  id: string;
  explanation: string;
  latex: string;
};

export type CalculationNotebook = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  /** 解説＋数式のペア一覧。手順（steps）ごとのformulaLatexとは別に、ノート冒頭でまとめて解説するときに使う。 */
  formulas: NotebookFormula[];
  localConstants: NotebookLocalConstant[];
  steps: CalculationNoteStep[];
  pinned: boolean;
  /** プリセット（組み込み）のノートは削除できない。 */
  isPreset: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotebookCategory = {
  id: string;
  name: string;
  createdAt: string;
};

// このストアの利用側（画面コンポーネント）が lib/notebook-history.ts を直接importしなくても
// 済むよう、型をそのままre-exportしておく（他のCalculationNotebook等と同じ場所から取れる）。
export type { NotebookHistoryEntry };

type CalculatorStore = {
  constants: SavedConstant[];
  history: SavedCalculation[];
  favoriteUnits: string[];
  customUnits: CustomUnit[];
  notebooks: CalculationNotebook[];
  notebookCategories: NotebookCategory[];
  notebookHistory: NotebookHistoryEntry[];
  /** 「ノート」タブに表示中のノートID。無い（null）ときは画面側が resolveActiveNotebook で
   * 履歴→ピン留めの順にフォールバックする（このストアは選択状態の保持だけを担当する）。 */
  activeNotebookId: string | null;
  hasRestorableConstants: boolean;
  isLoading: boolean;
  upsertConstant: (symbol: string, expression: string) => Promise<SavedConstant>;
  removeConstant: (symbol: string) => Promise<void>;
  importConstants: (entries: ImportedConstant[], mode: "merge" | "replace", customUnits: CustomUnit[]) => Promise<{ count: number; customUnitCount: number }>;
  clearConstants: () => Promise<void>;
  restoreClearedConstants: () => Promise<boolean>;
  addHistoryEntry: (entry: SavedCalculation) => Promise<void>;
  clearHistory: () => Promise<void>;
  toggleFavoriteUnit: (unit: string) => Promise<void>;
  saveCustomUnit: (unit: CustomUnit) => Promise<void>;
  deleteCustomUnit: (symbol: string) => Promise<void>;
  upsertNotebook: (input: Omit<CalculationNotebook, "id" | "createdAt" | "updatedAt" | "pinned" | "isPreset"> & { id?: string }) => Promise<CalculationNotebook>;
  importNotebooks: (entries: ImportedNotebook[], mode: "merge" | "replace", presetOverrides: PresetNotebookOverride[], customUnits: CustomUnit[]) => Promise<{ notebookCount: number; presetOverrideCount: number; customUnitCount: number }>;
  removeNotebook: (id: string) => Promise<void>;
  /** プリセットの計算ノートを現在のシードから作り直し、ユーザーの編集を破棄する。ユーザー作成ノート・
   * ユーザー作成カテゴリには一切触れない（詳しくは定義側のコメントを参照）。 */
  resetPresetNotebooks: () => Promise<void>;
  toggleNotebookPinned: (id: string) => Promise<void>;
  upsertNotebookCategory: (input: { id?: string; name: string }) => Promise<NotebookCategory>;
  removeNotebookCategory: (id: string) => Promise<void>;
  recordNotebookUse: (notebook: CalculationNotebook) => Promise<void>;
  removeNotebookHistoryEntry: (id: string) => Promise<void>;
  clearNotebookHistory: () => Promise<void>;
  setActiveNotebookId: (id: string | null) => Promise<void>;
};

const CalculatorContext = createContext<CalculatorStore | null>(null);

function isSavedConstant(value: unknown): value is SavedConstant {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedConstant>;
  return typeof candidate.symbol === "string" && typeof candidate.expression === "string" && typeof candidate.createdAt === "string" && typeof candidate.quantity?.siValue === "number" && Array.isArray(candidate.quantity.dimension) && candidate.quantity.dimension.length === 7;
}

// isCustomUnit（保存済みデータの検証）は lib/custom-units.ts に一本化してある。バックアップ
// 復元（notebooks-backup.ts / constants-backup.ts）と保存データ復元（このファイル）の両方が
// 同じ判定を通るようにするため（判定を2箇所に分けると、記号 "m" のような絶対に解決されない
// 「幽霊単位」がどちらか片方の復元経路だけで素通りしてしまう）。

// CustomUnit（保存形。再編集用にexpressionも持つ）→ CustomUnitRegistration（lib/units.tsの
// エンジンが要求する最小形）への変換。2箇所（初回ロード時とsave/delete後の再登録時）から
// 同じ変換を呼ぶので、ズレないよう1箇所にまとめる。
function toCustomUnitRegistration(unit: CustomUnit): CustomUnitRegistration {
  return { symbol: unit.symbol, scale: unit.scale, offset: unit.offset, dimension: unit.dimension };
}

function isSavedCalculation(value: unknown): value is SavedCalculation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedCalculation>;
  return typeof candidate.id === "string" && typeof candidate.expression === "string" && typeof candidate.resultText === "string" && typeof candidate.targetUnit === "string" && typeof candidate.createdAt === "string" && typeof candidate.quantity?.siValue === "number" && Array.isArray(candidate.quantity.dimension) && candidate.quantity.dimension.length === 7;
}

function isLegacyCalculationNote(value: unknown): value is LegacyCalculationNote {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LegacyCalculationNote>;
  return typeof candidate.id === "string" && typeof candidate.title === "string" && typeof candidate.description === "string" && Array.isArray(candidate.steps) && candidate.steps.every((step) => step && typeof step.id === "string" && typeof step.title === "string" && typeof step.expression === "string" && typeof step.targetUnit === "string") && typeof candidate.createdAt === "string" && typeof candidate.updatedAt === "string";
}

export function isCalculationNotebook(value: unknown): value is CalculationNotebook {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CalculationNotebook>;
  return typeof candidate.id === "string" && typeof candidate.title === "string" && typeof candidate.description === "string" && typeof candidate.categoryId === "string"
    && (candidate.formulas === undefined || (Array.isArray(candidate.formulas) && candidate.formulas.every((item) => item && typeof item.id === "string" && typeof item.explanation === "string" && typeof item.latex === "string")))
    // regionalDefault の中身はここで検証しない。**未知の種類を理由にfalseを返すと、この後の
    // filter でノートが丸ごと捨てられ、利用者の手順や編集ごと消える**（しかも投入済みカテゴリは
    // seededPresetIds に残るので二度と復活しない）。目印は sanitizeStoredLocalConstants で
    // 落とし、式と手順は残す。
    && Array.isArray(candidate.localConstants) && candidate.localConstants.every((item) => item && typeof item.id === "string" && typeof item.symbol === "string" && typeof item.expression === "string")
    && Array.isArray(candidate.steps) && candidate.steps.every((step) => step && typeof step.id === "string" && typeof step.title === "string" && typeof step.expression === "string" && typeof step.targetUnit === "string" && (step.resultSymbol === undefined || typeof step.resultSymbol === "string"))
    && typeof candidate.createdAt === "string" && typeof candidate.updatedAt === "string";
}

function isNotebookCategory(value: unknown): value is NotebookCategory {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<NotebookCategory>;
  return typeof candidate.id === "string" && typeof candidate.name === "string" && typeof candidate.createdAt === "string";
}

function isNotebookHistoryEntry(value: unknown): value is NotebookHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<NotebookHistoryEntry>;
  return typeof candidate.id === "string" && typeof candidate.notebookId === "string" && typeof candidate.title === "string" && typeof candidate.categoryId === "string" && typeof candidate.openedAt === "string";
}

/**
 * 保存済みのローカル定数から、**現在のアプリが解釈できない `regionalDefault` だけ**を落とす。
 * 種類を減らしたアプリで古いデータを開くと `regionalDefaults[kind]` が undefined になるため、
 * 目印としては認めない。ただし式はそのまま残す（利用者が入れた値として扱う）。
 * ノートごと捨てないのが要点。
 */
export function sanitizeStoredLocalConstants(localConstants: NotebookLocalConstant[]): NotebookLocalConstant[] {
  return localConstants.map((constant) => {
    let next = constant;
    // 投入時のスナップショットが文字列でない保存データ（手編集されたJSON・別バージョンの書式）を
    // ここで落とす。残すと起動時の綴り揃え（withFixedUnitSpellings）が .split で例外を投げ、
    // **読み込み全体の catch が空のデータで state を置き換える**＝ノートが全部消えたように見える。
    if (next.seededExpression !== undefined && typeof next.seededExpression !== "string") {
      const { seededExpression: _invalid, ...rest } = next;
      next = rest;
    }
    if (next.regionalDefault !== undefined && !isPresetRegionalDefaultKind(next.regionalDefault)) {
      const { regionalDefault: _unknown, ...rest } = next;
      next = rest;
    }
    return next;
  });
}

/** 手順側の投入時スナップショットも同じ理由で型を確認する（sanitizeStoredLocalConstants と対）。 */
export function sanitizeStoredSteps(steps: CalculationNoteStep[]): CalculationNoteStep[] {
  return steps.map((step) => {
    let next = step;
    if (next.seededExpression !== undefined && typeof next.seededExpression !== "string") {
      const { seededExpression: _invalid, ...rest } = next;
      next = rest;
    }
    if (next.seededTargetUnit !== undefined && typeof next.seededTargetUnit !== "string") {
      const { seededTargetUnit: _invalid, ...rest } = next;
      next = rest;
    }
    return next;
  });
}

function parseStoredArray(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// プリセットのローカル定数の式を決める。regionalDefault が付いている定数（電気代・燃料の単価、
// 商用電源の電圧・ブレーカーの定格電流）は妥当な値が地域によって全く違うので、端末の地域から
// 解決した式に差し替える。それ以外はシードの expression をそのまま使う。
// 投入時の初期値を決めるのがこの関数の役目。**投入後の追従は目印（regionalDefault）を
// 見る lib/preset-regional-sync.ts が担う**ので、ここは「最初の1回」だけを考えればよい。
// 言語切替時に localConstants を触らない決まりは従来どおり（文言の再解決とは無関係）。
export function presetConstantExpression(constant: NotebookSeedConstant, regionalDefaults: PresetRegionalDefaults): string {
  if (!constant.regionalDefault) return constant.expression;
  return regionalDefaults[constant.regionalDefault];
}

// プリセット投入時のIDの採番規則。投入する側・言語切替で逆引きする側・テストが
// それぞれ別々に文字列を組み立てていると、採番がズレたまま誰も気付かない状態になるため、
// この4つの関数だけを通す。
//
// seedId には配列の位置（index）ではなく、シードの英語タイトルから導く安定的な識別子
// （lib/notebook-formulas/types.ts の seedSlug）を渡す。配列位置で採番すると、新しいシードを
// 途中に挿入しただけで後続シードのIDがずれ、既存インストールの保存済みノートが別のシードの
// 内容に誤って結び付いてしまう（CodeRabbitが指摘した実際のバグ）。
export function presetNotebookId(categoryId: string, seedId: string): string {
  return `notebook-preset-${categoryId}::${seedId}`;
}

export function presetStepId(categoryId: string, seedId: string, stepIndex: number): string {
  return `preset-${categoryId}::${seedId}-step-${stepIndex}`;
}

export function presetFormulaId(categoryId: string, seedId: string, formulaIndex: number): string {
  return `preset-${categoryId}::${seedId}-formula-${formulaIndex}`;
}

export function presetConstantId(categoryId: string, seedId: string, constantIndex: number): string {
  return `preset-${categoryId}::${seedId}-constant-${constantIndex}`;
}

// プリセットの計算ノートをシードから組み立てる、唯一の場所。初回投入（読み込み時に未投入の
// カテゴリを穴埋めする処理）と「プリセットの計算ノートを初期状態に戻す」操作（resetPresetNotebooks）の
// 両方がこれを呼ぶ。2箇所に同じ組み立てロジックを書くと必ずズレるため、シード→
// CalculationNotebook[] への変換はここに1本化する。
export function buildPresetNotebooksFromSeeds(categoryIds: string[], language: AppLanguage, regionalDefaults: PresetRegionalDefaults, now: string): CalculationNotebook[] {
  const result: CalculationNotebook[] = [];
  categoryIds.forEach((categoryId) => {
    const seeds = PRESET_NOTEBOOK_SEEDS[categoryId] ?? [];
    seeds.forEach((seed) => {
      const seedId = seedSlug(seed);
      result.push({
        id: presetNotebookId(categoryId, seedId),
        title: localizedText(seed.title, language),
        description: localizedText(seed.description, language),
        categoryId,
        formulas: (seed.formulas ?? []).map((formula, formulaIndex) => ({
          id: presetFormulaId(categoryId, seedId, formulaIndex),
          explanation: localizedText(formula.explanation, language),
          latex: formula.latex,
        })),
        localConstants: seed.localConstants.map((constant, constantIndex) => ({
          id: presetConstantId(categoryId, seedId, constantIndex),
          symbol: constant.symbol,
          expression: presetConstantExpression(constant, regionalDefaults),
          // 解決した文字列だけでなく**種類も保存する**。これが無いと、あとから見て
          // 「アプリが入れた既定値」か「利用者が打った値」かが区別できない。
          ...(constant.regionalDefault ? { regionalDefault: constant.regionalDefault } : {}),
          // 有効数字に数えない印（図面の呼び寸法・個数）。表示のたびにシードを引かずに済むよう
          // 保存データへ写す。既存インストールへは applyPresetExactConstants が貼り直す。
          ...(constant.exact ? { exact: true } : {}),
          // 投入時の値を残す。シードを直したときに「まだアプリの値か」を判定するのに使う
          // （applyPresetSeedUpdates）。地域別の既定値は regionalDefault 側が持ち主なので、
          // そちらが付いている定数はこの仕組みの対象外にする。
          ...(constant.regionalDefault ? {} : { seededExpression: constant.expression }),
        })),
        steps: seed.steps.map((step, stepIndex) => ({
          id: presetStepId(categoryId, seedId, stepIndex),
          title: localizedText(step.title, language),
          expression: step.expression,
          targetUnit: step.targetUnit,
          formulaLatex: step.formulaLatex,
          resultSymbol: step.resultSymbol,
          seededExpression: step.expression,
          seededTargetUnit: step.targetUnit,
        })),
        pinned: false,
        isPreset: true,
        createdAt: now,
        updatedAt: now,
      });
    });
  });
  return result;
}

// 上のID生成関数に index 0 を渡した結果から末尾の "0" を落として、先頭一致用のプレフィックスを得る。
// プレフィックスを別途文字列で書くと採番規則が2箇所に分かれてしまうため、必ず生成関数から導出する。
function presetIdPrefix(idWithZeroIndex: string): string {
  return idWithZeroIndex.slice(0, -1);
}

// プリセット投入時に振ったIDから、そのノートの手順／数式がどのseedIndex（シード内の配列位置）に
// 対応するかを逆引きする。IDは `preset-${categoryId}::${seedId}-step-${stepIndex}` のように
// seedId をそのまま埋め込んでいるが、既に呼び出し側でnotebook.categoryIdとseedIdの両方が
// 確定しているため、その2つを丸ごとプレフィックスとして使い、残った末尾の数字だけを取り出せば
// seedId自体にハイフンが含まれていても曖昧さは生じない。
function extractTrailingIndex(id: string, prefix: string): number | undefined {
  if (!id.startsWith(prefix)) return undefined;
  const suffix = id.slice(prefix.length);
  if (!/^\d+$/.test(suffix)) return undefined;
  return Number(suffix);
}

// プリセット投入時に振ったノートIDから、そのノートがどのシードに対応するか（seedId）を逆引きする。
// categoryIdをそのまま埋め込んだプレフィックス（"notebook-preset-<categoryId>::"）を丸ごと使うので、
// categoryId・seedId のどちらにハイフンが含まれていても曖昧さは生じない
// （区切りに"::"を使うのは、categoryId・seedIdのどちらも"::"を含み得ないため）。
function seedIdFromNotebookId(id: string, categoryId: string): string | undefined {
  const prefix = presetNotebookId(categoryId, "");
  return id.startsWith(prefix) ? id.slice(prefix.length) : undefined;
}

// 現在保存されている文言が「最後にプリセットの文言を解決した言語（previousLanguage）」の
// シード文言と完全一致する場合に限って「ユーザーが未編集」とみなし、新しい言語の文言に差し替える。
// 対応言語すべてと比較すると、ユーザーが意図的に別言語のシード文言を入力した場合に
// それを未編集と誤判定して上書きしてしまう（例: en表示中にタイトルをseed.jaの文字列に
// 書き換えたのに、次にen言語のまま再解決されただけでseed.enに上書きされてしまう）。
// previousLanguageがnull（後述の移行フォールバック）のときだけ、従来どおり対応言語全部と比較する。
function resolveLocalizedField(current: string, seedText: LocalizedText, language: AppLanguage, previousLanguage: AppLanguage | null): string {
  const isUnedited = previousLanguage === null
    ? APP_LANGUAGES.some((candidateLanguage) => localizedText(seedText, candidateLanguage) === current)
    : localizedText(seedText, previousLanguage) === current;
  return isUnedited ? localizedText(seedText, language) : current;
}

// isPreset なノートの表示文言（title/description/steps[].title/formulas[].explanation）だけを、
// 対応するシードから指定言語で再解決する。expression・targetUnit・formulaLatex・resultSymbol・
// localConstants・pinned・id・createdAt など、文言以外のフィールドは一切変更しない
// （特に localConstants はユーザーが値を編集する前提のフィールドなので触ってはいけない）。
// 変更が1件も無ければ notebooks の参照をそのまま返す（呼び出し側で「差分なし」を安価に判定できる）。
//
// previousLanguage には「直前にプリセットの文言を解決した言語」を渡す。AsyncStorageへの読み書きは
// 呼び出し側（CalculatorProvider）の責務で、この関数自体は純関数のまま保つ（テストしやすさのため）。
// null は「まだ保存言語が無い（この仕組みを導入する前からのインストール）」ことを表す移行フォールバックで、
// そのときだけ従来どおり対応言語全部と比較する。一度でもこの関数を通せば、呼び出し側が解決後の言語を
// 保存言語として永続化するので、以降は厳密な（previousLanguageとだけ比較する）判定に切り替わる。
export function localizePresetNotebooks(notebooks: CalculationNotebook[], language: AppLanguage, previousLanguage: AppLanguage | null): { notebooks: CalculationNotebook[]; changed: boolean } {
  let changed = false;

  const nextNotebooks = notebooks.map((notebook) => {
    if (!notebook.isPreset) return notebook;

    const seeds = PRESET_NOTEBOOK_SEEDS[notebook.categoryId];
    if (!seeds) return notebook;

    const seedId = seedIdFromNotebookId(notebook.id, notebook.categoryId);
    const seed = seedId === undefined ? undefined : seeds.find((candidate) => seedSlug(candidate) === seedId);
    if (!seed || seedId === undefined) return notebook;

    let notebookChanged = false;

    const nextTitle = resolveLocalizedField(notebook.title, seed.title, language, previousLanguage);
    if (nextTitle !== notebook.title) notebookChanged = true;

    const nextDescription = resolveLocalizedField(notebook.description, seed.description, language, previousLanguage);
    if (nextDescription !== notebook.description) notebookChanged = true;

    const stepIdPrefix = presetIdPrefix(presetStepId(notebook.categoryId, seedId, 0));
    const nextSteps = notebook.steps.map((step) => {
      const stepIndex = extractTrailingIndex(step.id, stepIdPrefix);
      const seedStep = stepIndex === undefined ? undefined : seed.steps[stepIndex];
      if (!seedStep) return step;
      const nextStepTitle = resolveLocalizedField(step.title, seedStep.title, language, previousLanguage);
      if (nextStepTitle === step.title) return step;
      notebookChanged = true;
      return { ...step, title: nextStepTitle };
    });

    const formulaIdPrefix = presetIdPrefix(presetFormulaId(notebook.categoryId, seedId, 0));
    const nextFormulas = notebook.formulas.map((formula) => {
      const formulaIndex = extractTrailingIndex(formula.id, formulaIdPrefix);
      const seedFormula = formulaIndex === undefined ? undefined : seed.formulas?.[formulaIndex];
      if (!seedFormula) return formula;
      const nextExplanation = resolveLocalizedField(formula.explanation, seedFormula.explanation, language, previousLanguage);
      if (nextExplanation === formula.explanation) return formula;
      notebookChanged = true;
      return { ...formula, explanation: nextExplanation };
    });

    if (!notebookChanged) return notebook;
    changed = true;
    return { ...notebook, title: nextTitle, description: nextDescription, steps: nextSteps, formulas: nextFormulas };
  });

  return { notebooks: nextNotebooks, changed };
}

/**
 * 保存済みのプリセットノートへ、シード側で導出した結果記号（と、それに伴う s1・s2… 参照の
 * 書き換え）を後から反映する。プリセットの投入はカテゴリ単位で1回きりなので、これが無いと
 * 既にインストール済みの端末では結果欄が式だけの表示のまま変わらない。
 *
 * どのノートに当てるか・当てないかの判定は lib/notebook-result-symbols.ts の純関数に置いて
 * テストできるようにし、ここではノートとシードの突き合わせ（idからの添字の復元）だけを行う。
 */
export function applyPresetResultSymbols(notebooks: CalculationNotebook[]): { notebooks: CalculationNotebook[]; changed: boolean } {
  let changed = false;

  const nextNotebooks = notebooks.map((notebook) => {
    if (!notebook.isPreset) return notebook;
    const seeds = PRESET_NOTEBOOK_SEEDS[notebook.categoryId];
    const rawSeeds = PRESET_NOTEBOOK_SEEDS_AS_SEEDED[notebook.categoryId];
    if (!seeds || !rawSeeds) return notebook;

    const seedId = seedIdFromNotebookId(notebook.id, notebook.categoryId);
    const seed = seedId === undefined ? undefined : seeds.find((candidate) => seedSlug(candidate) === seedId);
    const rawSeed = seedId === undefined ? undefined : rawSeeds.find((candidate) => seedSlug(candidate) === seedId);
    if (!seed || !rawSeed) return notebook;

    const nextSteps = presetResultSymbolPatch(notebook.steps, rawSeed.steps, seed.steps);
    if (!nextSteps) return notebook;
    changed = true;
    return { ...notebook, steps: nextSteps };
  });

  return { notebooks: nextNotebooks, changed };
}

/**
 * 保存済みのプリセットノートのローカル定数へ、シード側の「厳密値」の印を貼り直す。
 *
 * **`regionalDefault` の付け直し（`stampLegacyPresetRegionalDefaults`）と違い、毎回呼んでよい。**
 * あちらは所有権の記録で、利用者が編集すると外れる＝「印が無い」状態に意味があるため1回きりに
 * 縛る必要があった。こちらは**シードが決める静的な属性**（この欄は図面の寸法かどうか）で、
 * 値を一切書き換えないので、毎回シードへ揃えるのが最も単純で自己修復もする。
 *
 * 投入はカテゴリ単位で1回きりなので、これが無いと既存インストールでは結果が
 * `46.875 MPa` のまま（板厚 `8mm` を1桁の測定値として数え続ける）。
 *
 * **例外は `exactEdited` が付いた定数だけ**（編集シートで利用者が印を切り替えたもの）。
 * そこはシードではなく利用者が決めた欄なので、毎回の貼り直しから除外する。
 */
export function applyPresetExactConstants(notebooks: CalculationNotebook[]): { notebooks: CalculationNotebook[]; changed: boolean } {
  let changed = false;

  const nextNotebooks = notebooks.map((notebook) => {
    if (!notebook.isPreset) return notebook;
    const seeds = PRESET_NOTEBOOK_SEEDS[notebook.categoryId];
    const seedId = seedIdFromNotebookId(notebook.id, notebook.categoryId);
    const seed = !seeds || seedId === undefined ? undefined : seeds.find((candidate) => seedSlug(candidate) === seedId);
    if (!seed || seedId === undefined) return notebook;

    // **突き合わせは定数のidではなく記号で行う。** `stampSeedRegionalDefaults` は所有権の印を
    // 付けるので「シード内で定数を並べ替えたときに別の定数へ印が移る」危険を避けるためidで
    // 引く必要があるが、こちらは値を一切書き換えない静的な属性なので、記号の方が安全に広く効く。
    // 決め手はバックアップからの復元で、`applyPresetNotebookOverrides` が定数のidを
    // `<ノートid>-override-constant-N` に組み直すため、**idで引くと復元したプリセットに
    // 印が二度と戻らない**（穴まわりの応力集中が `≈ 47 MPa` から `46.875 MPa` へ黙って戻る）。
    // 記号はノートの中で一意（重複すると定数がシャドーし合って成立しない）なので取り違えない。
    const exactSymbols = new Set<string>();
    seed.localConstants.forEach((constant) => {
      if (constant.exact) exactSymbols.add(constant.symbol);
    });

    let notebookChanged = false;
    const nextLocalConstants = notebook.localConstants.map((constant) => {
      // 利用者が自分で決めた印には触らない（シードの都合で上書きすると、編集シートで
      // 消したはずの印が次の起動で復活する）。
      if (constant.exactEdited) return constant;
      const shouldBeExact = exactSymbols.has(constant.symbol);
      if (shouldBeExact === (constant.exact === true)) return constant;
      notebookChanged = true;
      if (shouldBeExact) return { ...constant, exact: true };
      // シードから印が外れたら保存データからも外す（毎回揃えるので取り残しが出ない）。
      const { exact: _removed, ...rest } = constant;
      return rest;
    });
    if (!notebookChanged) return notebook;
    changed = true;
    return { ...notebook, localConstants: nextLocalConstants };
  });

  return { notebooks: nextNotebooks, changed };
}

/**
 * **シードの修正を、利用者の編集を残したまま既存インストールへ届ける。**
 *
 * プリセットの投入はカテゴリID単位で1回きり（`NOTEBOOKS_SEEDED_PRESETS_STORAGE_KEY`）なので、
 * シードの式・表示単位を直しても既存の端末には届かなかった。届く手段は「プリセットを初期状態に
 * 戻す」だけで、それは**利用者の編集を全部捨てる**操作だった（利用者からの要望はここ）。
 *
 * **判定は「保存値 == 投入時の値」**（`seededExpression` / `seededTargetUnit`）。
 * 現在のシードと比べる方式では「利用者が編集した」と「シードが変わった」がどちらも
 * 「保存値 ≠ シード」になって区別できない。投入時の値を残しておけばその2つが分かれる。
 *
 * - 保存値 == 投入時の値 → まだアプリの値 → **新しいシードへ差し替え、投入時の値も更新する**
 * - 保存値 != 投入時の値 → 利用者が編集した → 触らない
 * - 投入時の値が無い → **編集済みとして扱う**（この仕組みより前に投入された端末のデータ）。
 *   未編集と見なすと過去の編集を黙って上書きしてしまう。
 *
 * **地域依存の既定値（`regionalDefault` 付き）は対象外。** あちらは `applyPresetRegionalDefaults`
 * が持ち主で、端末の地域で値を決める。両方が同じ欄を書き換えると取り合いになる。
 *
 * タイトル・説明文・手順名は `localizePresetNotebooks` が言語切替のたびにシードから引き直すので
 * ここでは扱わない。手順そのものの増減も扱わない（idの対応が崩れるため。必要になったら別途）。
 */
// 手順の同一性の手掛かり。lib/notebook-engine.ts の trimResultSymbol と同じ扱い方だが、
// あちらはこのファイルを import する側なので（循環になる）ここで同じ規則を持つ。
function seedStepSymbol(step: { resultSymbol?: string }): string {
  return typeof step.resultSymbol === "string" ? step.resultSymbol.trim() : "";
}

/**
 * 手順の同一性の手掛かりとして使える記号（**空でない・その配列の中で一意**）を集める。
 *
 * **記号を持つことを当てにしてはいけない。** `withDerivedResultSymbols` は数式の左辺が
 * 既存の記号と衝突する手順に記号を補わないので、記号の無い手順が1つのノートに2つ以上
 * あり得る（実測: 376手順のうち44件が記号なし、**2件以上持つノートが8件**）。空文字どうしを
 * 一致と見なすと並べ替えをすり抜け、式と表示単位だけが別の手順へ書き込まれてタイトル・
 * 数式が前の手順のまま残る（CodeRabbitが#80で🟠として検出）。明示的な記号の重複も
 * 弾かれないので、同じ規則で一意性まで見る。
 */
function identifiableStepSymbols(steps: { resultSymbol?: string }[]): Set<string> {
  const counts = new Map<string, number>();
  steps.forEach((step) => {
    const symbol = seedStepSymbol(step);
    if (!symbol) return;
    counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
  });
  const identifiable = new Set<string>();
  counts.forEach((count, symbol) => {
    if (count === 1) identifiable.add(symbol);
  });
  return identifiable;
}

export function applyPresetSeedUpdates(notebooks: CalculationNotebook[]): { notebooks: CalculationNotebook[]; changed: boolean } {
  let changed = false;

  const nextNotebooks = notebooks.map((notebook) => {
    if (!notebook.isPreset) return notebook;
    const seeds = PRESET_NOTEBOOK_SEEDS[notebook.categoryId];
    const seedId = seedIdFromNotebookId(notebook.id, notebook.categoryId);
    const seed = !seeds || seedId === undefined ? undefined : seeds.find((candidate) => seedSlug(candidate) === seedId);
    if (!seed || seedId === undefined) return notebook;

    // 突き合わせは定数・手順のidで行う（`presetConstantId` / `presetStepId` はカテゴリIDと
     // スラグと添字から決まるので端末をまたいで安定している）。記号で引く `exact` と違い、
    // こちらは**式そのものを書き換える**ので、並べ替えで別の定数に当たると値が入れ替わる。
    const seedConstants = new Map(seed.localConstants.map((constant, index) => [presetConstantId(notebook.categoryId, seedId, index), constant]));
    // **手順のidは添字から決まる**（`presetStepId`）ので、シードに手順を1つ挿入・削除・並べ替え
    // しただけで、保存済みのidが**別の計算の手順**に当たる。そこへ式と表示単位だけを書き込むと、
    // 数式（`formulaLatex`）と結果記号は前の手順のまま残った混ざりものになる（実際に踏んだ穴：
    // 木造床根太に手順を1つ足したとき `sN` 参照がずれた件と同じ構造）。
    // 手順数が違えば同期そのものを見送り、同数でも**同一性の手掛かりになる結果記号**
    // （空でない・両側で一意）が一致する手順だけを対象にする（並べ替えは記号が食い違うので
    // 弾ける）。記号を持たない44手順は同期の対象外になるが、別の手順へ書き込むより安全。
    const stepCountMatches = notebook.steps.length === seed.steps.length;
    const seedSteps = new Map(stepCountMatches ? seed.steps.map((step, index) => [presetStepId(notebook.categoryId, seedId, index), step]) : []);
    const seedStepSymbols = identifiableStepSymbols(seed.steps);
    const storedStepSymbols = identifiableStepSymbols(notebook.steps);

    let notebookChanged = false;
    const nextLocalConstants = notebook.localConstants.map((constant) => {
      if (constant.regionalDefault) return constant;
      const seedConstant = seedConstants.get(constant.id);
      // 記号まで一致していなければ別の定数（シード内で並べ替えられた）とみなして触らない。
      if (!seedConstant || seedConstant.symbol !== constant.symbol) return constant;
      // **記録が無い旧データは、いまのシードと値が一致しているときだけ記録を付ける**（値は変えない）。
      // 一致している＝編集されていない（か、シードと同じ値に編集した）ので、以後の更新を届けて
      // よい。付けないと旧データには**永久にシードの修正が届かない**。一致していなければ編集済みか
      // 古いシードのままかが区別できないので、従来どおり触らない。
      if (constant.seededExpression === undefined) {
        if (constant.expression !== seedConstant.expression) return constant;
        notebookChanged = true;
        return { ...constant, seededExpression: seedConstant.expression };
      }
      if (constant.expression !== constant.seededExpression) return constant;
      if (seedConstant.expression === constant.expression) return constant;
      notebookChanged = true;
      return { ...constant, expression: seedConstant.expression, seededExpression: seedConstant.expression };
    });

    const nextSteps = notebook.steps.map((step) => {
      const seedStep = seedSteps.get(step.id);
      if (!seedStep) return step;
      const symbol = seedStepSymbol(step);
      if (!symbol || !storedStepSymbols.has(symbol) || !seedStepSymbols.has(symbol)) return step;
      if (seedStepSymbol(seedStep) !== symbol) return step;
      let nextStep = step;
      // 定数と同じ規則（上の注記）。記録が無い旧データはシードと一致しているときだけ記録を付ける。
      if (step.seededExpression === undefined) {
        if (step.expression === seedStep.expression) nextStep = { ...nextStep, seededExpression: seedStep.expression };
      } else if (step.expression === step.seededExpression && seedStep.expression !== step.expression) {
        nextStep = { ...nextStep, expression: seedStep.expression, seededExpression: seedStep.expression };
      }
      if (step.seededTargetUnit === undefined) {
        if (step.targetUnit === seedStep.targetUnit) nextStep = { ...nextStep, seededTargetUnit: seedStep.targetUnit };
      } else if (step.targetUnit === step.seededTargetUnit && seedStep.targetUnit !== step.targetUnit) {
        nextStep = { ...nextStep, targetUnit: seedStep.targetUnit, seededTargetUnit: seedStep.targetUnit };
      }
      if (nextStep !== step) notebookChanged = true;
      return nextStep;
    });

    if (!notebookChanged) return notebook;
    changed = true;
    return { ...notebook, localConstants: nextLocalConstants, steps: nextSteps };
  });

  return { notebooks: nextNotebooks, changed };
}

/**
 * プリセットノートの単位記号の綴りを、いまアプリが使っている綴りへ揃える（`Ohm` → `Ω`）。
 *
 * **値を一切変えない書き換え**なので、`applyPresetSeedUpdates` の所有権の判定を通さずに当てる。
 * 通してしまうと、この仕組みより前に投入された端末（＝まさに `10kOhm` が残っている端末）では
 * 投入時の値が記録されていないため永久に直らない。`Ohm` は `BASE_UNITS` の別綴りで `Ω` と
 * 完全に同じ単位なので、利用者が自分で打った値だとしても意味は変わらない。
 *
 * **プリセットのノートだけを対象にする。** 利用者が作ったノートの式を勝手に書き換えない。
 * **`ohm`（小文字）は対象外**——`BASE_UNITS` に無いので式として通らず、書き換える意味がない。
 */
const PRESET_UNIT_SPELLING_FIXES: readonly { from: string; to: string }[] = [{ from: "Ohm", to: "Ω" }];

function replaceUnitSpellings(unitText: string): string {
  return PRESET_UNIT_SPELLING_FIXES.reduce((current, fix) => current.split(fix.from).join(fix.to), unitText);
}

/**
 * 式の中の**単位サフィックスの範囲だけ**を書き換える。
 *
 * **素朴な `split("Ohm").join("Ω")` にしないこと。** `Ω` は識別子に使えない文字なので
 * （`UNICODE_IDENTIFIER_EXTRA_CHARS` が単位専用として除外している）、`OhmicLoss` のような
 * 定数名まで書き換えると `ΩicLoss` になって**二度と解決できない式**になる。しかもエラーは
 * 起動時ではなくそのノートを開いたときに出るので、原因が追いにくい。
 *
 * 範囲の決め方は評価器と同じ `unitSuffixEnd`（数値の直後から `*` `/` を跨いで貪欲に読む）。
 * 識別子トークンは丸ごと読み飛ばす——裸の `Ohm` は識別子として単位へフォールバックする経路で
 * 解決されていて（`2*Ohm`）、値も表示も `Ω` と変わらないため書き換える必要がない。
 */
function withFixedUnitSpellings(text: string): string {
  let result = "";
  let index = 0;
  while (index < text.length) {
    const rest = text.slice(index);
    const number = NUMBER_TOKEN_PATTERN.exec(rest);
    if (number) {
      let after = index + number[0].length;
      // 評価器は数値と単位の間の空白を許す（`10 kOhm`）。同じように跨ぐ。
      while (/\s/.test(text[after] ?? "")) after += 1;
      if (isUnitStart(text[after])) {
        const end = unitSuffixEnd(text, after);
        result += text.slice(index, after) + replaceUnitSpellings(text.slice(after, end));
        index = end;
        continue;
      }
      result += number[0];
      index += number[0].length;
      continue;
    }
    const identifier = IDENTIFIER_PATTERN.exec(rest);
    if (identifier) {
      result += identifier[0];
      index += identifier[0].length;
      continue;
    }
    result += text[index];
    index += 1;
  }
  return result;
}

export function normalizePresetUnitSpellings(notebooks: CalculationNotebook[]): { notebooks: CalculationNotebook[]; changed: boolean } {
  let changed = false;

  const nextNotebooks = notebooks.map((notebook) => {
    if (!notebook.isPreset) return notebook;
    let notebookChanged = false;
    // **投入時の値（`seededExpression` / `seededTargetUnit`）も、保存値が既に `Ω` でも直すこと。**
    // 保存値だけを見て早期returnすると、`expression: "10kΩ"` と `seededExpression: "10kOhm"` の
    // 食い違いが残り、`applyPresetSeedUpdates` がそれを利用者の編集と読んで**以後のシードの
    // 修正が永久に届かなくなる**（利用者が同じ値を `Ω` で打ち直しただけの端末がこの形になる。
    // CodeRabbitが#80で🟠として検出）。綴りを揃えるだけで値は変わらないので、揃えて構わない。
    const nextLocalConstants = notebook.localConstants.map((constant) => {
      const expression = withFixedUnitSpellings(constant.expression);
      const seededExpression = constant.seededExpression === undefined ? undefined : withFixedUnitSpellings(constant.seededExpression);
      if (expression === constant.expression && seededExpression === constant.seededExpression) return constant;
      notebookChanged = true;
      return { ...constant, expression, ...(seededExpression === undefined ? {} : { seededExpression }) };
    });
    const nextSteps = notebook.steps.map((step) => {
      const expression = withFixedUnitSpellings(step.expression);
      // 表示単位は式ではなく単位記号そのもの（`kOhm`）なので、走査せず丸ごと置き換える。
      const targetUnit = replaceUnitSpellings(step.targetUnit);
      const seededExpression = step.seededExpression === undefined ? undefined : withFixedUnitSpellings(step.seededExpression);
      const seededTargetUnit = step.seededTargetUnit === undefined ? undefined : replaceUnitSpellings(step.seededTargetUnit);
      if (expression === step.expression && targetUnit === step.targetUnit
        && seededExpression === step.seededExpression && seededTargetUnit === step.seededTargetUnit) return step;
      notebookChanged = true;
      return {
        ...step,
        expression,
        targetUnit,
        ...(seededExpression === undefined ? {} : { seededExpression }),
        ...(seededTargetUnit === undefined ? {} : { seededTargetUnit }),
      };
    });
    if (!notebookChanged) return notebook;
    changed = true;
    return { ...notebook, localConstants: nextLocalConstants, steps: nextSteps };
  });

  return { notebooks: nextNotebooks, changed };
}

/**
 * 保存済みのプリセットノートの「地域依存の既定値」を、現在の端末の地域へ揃える。
 * `applyPresetResultSymbols` と同じ形（`{ notebooks, changed }`）にして、読み込み時の
 * 書き込み判定をそのまま使えるようにしている。
 *
 * シードとの突き合わせが要らないのが以前との違い。**目印が保存データ側に付いている**ので、
 * 「投入時のシード値と一致するか」で編集の有無を推測する必要がない（単位ごと変わる燃費では
 * その推測が過去に入りえた全地域の値との比較になって現実的でなかった）。
 */
export function applyPresetRegionalDefaults(
  notebooks: CalculationNotebook[],
  regionalDefaults: PresetRegionalDefaults,
): { notebooks: CalculationNotebook[]; changed: boolean } {
  let changed = false;

  const nextNotebooks = notebooks.map((notebook) => {
    const nextLocalConstants = presetRegionalDefaultPatch(notebook.localConstants, regionalDefaults);
    if (!nextLocalConstants) return notebook;
    changed = true;
    return { ...notebook, localConstants: nextLocalConstants };
  });

  return { notebooks: nextNotebooks, changed };
}

/**
 * 目印を保存するようになる前に投入されたプリセットへ、シードから目印を付け直す。
 *
 * **値を一切比較せず、定数のid（`presetConstantId`）でシードと突き合わせる**のが要点。
 * 「投入時のシード値と一致するか」で編集の有無を推測する方式は、単位ごと変わる燃費
 * （`15km/L` / `35mpg` / `42mpgUK`）では過去に入りえた全地域の値と比べる必要が出て破綻する。
 * idで引けばその推測が要らない。
 *
 * **必ず1回きりで呼ぶこと**（`REGIONAL_DEFAULTS_STAMPED_STORAGE_KEY` で縛っている）。
 * データの形からは旧か新かを判定できない: 「一部の定数に目印が無い」状態は正常でもあり得る
 * （シードで `regionalDefault` を付けていない定数、そして**利用者が編集して目印が外れた定数**）。
 * 毎回呼ぶと後者を旧データと誤認して付け直し、次の起動で利用者の編集を上書きしてしまう
 * （CodeRabbitが#54で検出。実際に編集した `18km/L` が `35mpg` に戻る回帰テストで固定した）。
 *
 * 引き換えに、**リリース前の端末で定数を編集していた場合その値は1回だけ既定値へ戻る**
 * （旧データには編集の記録が無いので区別できない）。正式リリース前なので許容する。
 */
export function stampLegacyPresetRegionalDefaults(notebooks: CalculationNotebook[]): { notebooks: CalculationNotebook[]; changed: boolean } {
  let changed = false;

  const nextNotebooks = notebooks.map((notebook) => {
    const nextLocalConstants = stampSeedRegionalDefaults(notebook);
    if (nextLocalConstants === notebook.localConstants) return notebook;
    changed = true;
    return { ...notebook, localConstants: nextLocalConstants };
  });

  return { notebooks: nextNotebooks, changed };
}

function stampSeedRegionalDefaults(notebook: CalculationNotebook): NotebookLocalConstant[] {
  if (!notebook.isPreset) return notebook.localConstants;

  const seeds = PRESET_NOTEBOOK_SEEDS[notebook.categoryId];
  const seedId = seedIdFromNotebookId(notebook.id, notebook.categoryId);
  const seed = !seeds || seedId === undefined ? undefined : seeds.find((candidate) => seedSlug(candidate) === seedId);
  if (!seed || seedId === undefined) return notebook.localConstants;

  // idは「カテゴリID＋シードのスラグ＋添字」なので、シード内で定数を並べ替えると別の定数の
  // idと一致してしまう。**記号も一致させる**ことで、並べ替えたときに間違った定数へ目印を付けて
  // 直後の後追い反映が `distance` を `230V` で上書きする、という事故を防ぐ
  // （配列位置から採番して既存データが別シードに結び付いたPR #51と同じ種類の危険）。
  const seedByConstantId = new Map<string, { symbol: string; kind: PresetRegionalDefaultKind }>();
  seed.localConstants.forEach((constant, constantIndex) => {
    if (constant.regionalDefault) {
      seedByConstantId.set(presetConstantId(notebook.categoryId, seedId, constantIndex), { symbol: constant.symbol, kind: constant.regionalDefault });
    }
  });
  if (!seedByConstantId.size) return notebook.localConstants;

  let changed = false;
  const next = notebook.localConstants.map((constant) => {
    if (constant.regionalDefault) return constant;
    const seeded = seedByConstantId.get(constant.id);
    if (!seeded || seeded.symbol !== constant.symbol) return constant;
    changed = true;
    return { ...constant, regionalDefault: seeded.kind };
  });
  return changed ? next : notebook.localConstants;
}

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const { language, currencyCode, regionCode, isReady: isGlobalSettingsReady } = useGlobalSettings();
  const [constants, setConstants] = useState<SavedConstant[]>([]);
  const [history, setHistory] = useState<SavedCalculation[]>([]);
  const [favoriteUnits, setFavoriteUnits] = useState<string[]>([]);
  // setCustomUnitsという名前はlib/units.tsが公開する登録関数（エンジン側の名前）と衝突するため、
  // このProviderのReact stateセッターはsetCustomUnitsStateという別名にしておく。
  const [customUnits, setCustomUnitsState] = useState<CustomUnit[]>([]);
  const [notebooks, setNotebooks] = useState<CalculationNotebook[]>([]);
  const [notebookCategories, setNotebookCategories] = useState<NotebookCategory[]>([]);
  const [notebookHistory, setNotebookHistory] = useState<NotebookHistoryEntry[]>([]);
  const [activeNotebookId, setActiveNotebookIdState] = useState<string | null>(null);
  const [clearedConstants, setClearedConstants] = useState<SavedConstant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const persistConstants = useCallback(async (next: SavedConstant[]) => {
    setConstants(next);
    await AsyncStorage.setItem(CONSTANTS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const persistHistory = useCallback(async (next: SavedCalculation[]) => {
    setHistory(next);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const persistFavoriteUnits = useCallback(async (next: string[]) => {
    setFavoriteUnits(next);
    await AsyncStorage.setItem(FAVORITE_UNITS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  // 自作単位はここで保存すると同時に、lib/units.tsのエンジンへも再登録する。エンジンの
  // レジストリ（BASE_UNITSに足すのではなく別枠で持つ解決テーブル）はモジュール読み込み時に
  // 空で始まるだけのメモリ上の状態でAsyncStorageには一切触れないため、保存・削除のたびに
  // ここから明示的にsetCustomUnitsRegistryを呼ばないと、次に式を評価したときに反映されない。
  //
  // 他のpersistXxxとは逆に、ここだけAsyncStorage.setItemを先にawaitしてから
  // state・レジストリを更新する。自作単位は保存に失敗すると「エンジンは新しい単位を
  // 解決できるのに次回起動では消えている」という食い違いになり、しかもレジストリまで
  // 書き換わっているぶん他のpersistXxx（stateだけが食い違う）より影響が大きいため。
  //
  // notebooksRefと同じ理由でrefも持つ。saveCustomUnit/deleteCustomUnitは直前の一覧を基準に
  // 次の配列を組み立てるため、stateのクロージャだけを見ていると、保存中（awaitの間）に
  // 2回目の操作が走ったときに古い一覧を基準にしてしまう（自作単位を2つ続けて削除すると
  // 1つ目が復活する）。上のようにsetItemを先にawaitする分この窓が広いので、refは
  // awaitより前に同期更新し、保存に失敗したときだけ巻き戻す。
  const customUnitsRef = useRef<CustomUnit[]>(customUnits);
  const persistCustomUnits = useCallback(async (next: CustomUnit[]) => {
    const previous = customUnitsRef.current;
    customUnitsRef.current = next;
    try {
      await AsyncStorage.setItem(CUSTOM_UNITS_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      // 後続の操作が既に別の値を入れている場合は巻き戻さない（その値のほうが新しい）。
      if (customUnitsRef.current === next) customUnitsRef.current = previous;
      throw error;
    }
    setCustomUnitsState(next);
    setCustomUnitsRegistry(next.map(toCustomUnitRegistration));
  }, []);

  // toggleNotebookPinnedなど、直前の呼び出し結果を踏まえて計算する更新が連続で呼ばれても
  // 古いnotebooksを参照しないよう、refは代入の直前（awaitより前）に同期更新する。
  const notebooksRef = useRef<CalculationNotebook[]>(notebooks);
  const persistNotebooks = useCallback(async (next: CalculationNotebook[]) => {
    notebooksRef.current = next;
    setNotebooks(next);
    await AsyncStorage.setItem(NOTEBOOKS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  // recordNotebookUseが連続で呼ばれても（例: ピン留めノートを立て続けに開き直す）古い
  // notebookHistoryを参照しないよう、notebooksRefと同じ理由でrefを持つ。
  const notebookHistoryRef = useRef<NotebookHistoryEntry[]>(notebookHistory);
  const persistNotebookHistory = useCallback(async (next: NotebookHistoryEntry[]) => {
    notebookHistoryRef.current = next;
    setNotebookHistory(next);
    await AsyncStorage.setItem(NOTEBOOK_HISTORY_STORAGE_KEY, JSON.stringify(next));
  }, []);

  // removeNotebook・importNotebooksが「消えたノートを指していたらnullにする」判定をするときに
  // 直前の値を参照するため、他のrefと同じ理由でrefを持つ。値そのものはstring | nullなので
  // JSON化せずAsyncStorageへ直接文字列として出し入れする（nullは削除で表現する）。
  const activeNotebookIdRef = useRef<string | null>(activeNotebookId);
  const persistActiveNotebookId = useCallback(async (next: string | null) => {
    activeNotebookIdRef.current = next;
    setActiveNotebookIdState(next);
    if (next === null) await AsyncStorage.removeItem(ACTIVE_NOTEBOOK_STORAGE_KEY);
    else await AsyncStorage.setItem(ACTIVE_NOTEBOOK_STORAGE_KEY, next);
  }, []);

  const notebookCategoriesRef = useRef<NotebookCategory[]>(notebookCategories);
  const persistNotebookCategories = useCallback(async (next: NotebookCategory[]) => {
    notebookCategoriesRef.current = next;
    setNotebookCategories(next);
    await AsyncStorage.setItem(NOTEBOOK_CATEGORIES_STORAGE_KEY, JSON.stringify(next));
  }, []);

  // 「プリセットの文言を最後に解決した言語」。nullは「まだ保存言語が無い（移行フォールバック）」を表す。
  // resolveLocalizedFieldの比較対象として使うため、AsyncStorageへの読み書きは全てこのProviderの
  // 責務にする（localizePresetNotebooks自体は純関数のまま保つ）。
  const presetsLanguageRef = useRef<AppLanguage | null>(null);
  const persistPresetsLanguage = useCallback(async (next: AppLanguage) => {
    presetsLanguageRef.current = next;
    await AsyncStorage.setItem(PRESETS_LANGUAGE_STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    // GlobalSettingsProviderの永続化された言語設定を読み込み終えるまで待つ。ここで待たずに
    // 実行すると、端末言語とアプリ内で選んだ言語が異なる場合にプリセットの文言が誤った言語で
    // 一度きり焼き込まれ、seededPresetIdsの永続化により二度と直せなくなる。
    if (!isGlobalSettingsReady) return;
    let active = true;
    (async () => {
      try {
        const [
          constantsRaw,
          historyRaw,
          favoriteUnitsRaw,
          customUnitsRaw,
          notebooksRaw,
          notebookCategoriesRaw,
          notebookHistoryRaw,
          clearedConstantsRaw,
          migratedRaw,
          seededPresetsRaw,
          presetsLanguageRaw,
          // 並び順は下の getItem と1対1で対応させること（ずれると別のキーの値が入る）。
          regionalDefaultsStampedRaw,
          activeNotebookIdRaw,
        ] = await Promise.all([
          AsyncStorage.getItem(CONSTANTS_STORAGE_KEY),
          AsyncStorage.getItem(HISTORY_STORAGE_KEY),
          AsyncStorage.getItem(FAVORITE_UNITS_STORAGE_KEY),
          AsyncStorage.getItem(CUSTOM_UNITS_STORAGE_KEY),
          AsyncStorage.getItem(NOTEBOOKS_STORAGE_KEY),
          AsyncStorage.getItem(NOTEBOOK_CATEGORIES_STORAGE_KEY),
          AsyncStorage.getItem(NOTEBOOK_HISTORY_STORAGE_KEY),
          AsyncStorage.getItem(CLEARED_CONSTANTS_STORAGE_KEY),
          AsyncStorage.getItem(NOTEBOOKS_MIGRATED_STORAGE_KEY),
          AsyncStorage.getItem(NOTEBOOKS_SEEDED_PRESETS_STORAGE_KEY),
          AsyncStorage.getItem(PRESETS_LANGUAGE_STORAGE_KEY),
          AsyncStorage.getItem(REGIONAL_DEFAULTS_STAMPED_STORAGE_KEY),
          AsyncStorage.getItem(ACTIVE_NOTEBOOK_STORAGE_KEY),
        ]);

        let nextNotebooks = parseStoredArray(notebooksRaw).filter(isCalculationNotebook).map((item) => ({ ...item, formulas: item.formulas ?? [], pinned: item.pinned === true, isPreset: item.isPreset === true, localConstants: sanitizeStoredLocalConstants(item.localConstants), steps: sanitizeStoredSteps(item.steps) }));
        let seededPresetIds = parseStoredArray(seededPresetsRaw).filter((id): id is string => typeof id === "string");
        let notebooksDirty = false;
        let markMigrated = false;
        // 保存言語のキーがまだ無い端末（この仕組みを導入する前からのインストール）ではnullのまま
        // にする。localizePresetNotebooksはnullを「移行フォールバック」として扱い、その1回だけ
        // 従来どおり対応言語全部と比較する。
        let presetsLanguage: AppLanguage | null = isAppLanguage(presetsLanguageRaw) ? presetsLanguageRaw : null;
        let presetsLanguageDirty = false;

        // 旧・計算ノート（フラット一覧）を新しい notebooks へ一度だけ変換する。
        // 旧データ自体は端末に残したまま（ロールバック用）、変換済みフラグだけを立てる。
        // フラグは、変換結果の notebooks 本体を書き込んだ後にまとめて立てる
        // （途中で失敗した場合に「済」フラグだけ残って移行データを失わないようにするため）。
        if (migratedRaw !== "1") {
          const notesRaw = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
          const migratedFromNotes = parseStoredArray(notesRaw).filter(isLegacyCalculationNote).map((note): CalculationNotebook => ({
            id: `notebook-migrated-note-${note.id}`,
            title: note.title,
            description: note.description,
            categoryId: UNCATEGORIZED_CATEGORY_ID,
            formulas: [],
            localConstants: [],
            steps: note.steps,
            pinned: false,
            isPreset: false,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          }));
          nextNotebooks = [...nextNotebooks, ...migratedFromNotes];
          notebooksDirty = true;
          markMigrated = true;
        }

        // プリセット計算ノートは特別なデータではなく、ユーザーのノートと全く同じ形で複製されるだけ
        // （isPresetだけが立っており、削除できない点が異なる）。
        // カテゴリ単位・冪等に投入するため、後から新カテゴリを追加しても既存データを壊さない。
        // 投入にも後追い反映にも使うので、投入ブロックの外で1回だけ解決する。
        const regionalDefaults = resolvePresetRegionalDefaults(currencyCode, regionCode, language);
        const missingPresetCategories = PRESET_NOTEBOOK_CATEGORIES.filter((category) => !seededPresetIds.includes(category.id));
        if (missingPresetCategories.length) {
          const now = new Date().toISOString();
          nextNotebooks.push(...buildPresetNotebooksFromSeeds(missingPresetCategories.map((category) => category.id), language, regionalDefaults, now));
          seededPresetIds = [...seededPresetIds, ...missingPresetCategories.map((category) => category.id)];
          notebooksDirty = true;
          // 新しく投入したプリセットの文言はこの時点のlanguageで焼き込んだので、保存言語もそれに
          // 合わせておく。ここを更新し忘れると、投入直後の最初の言語切替でpreviousLanguageが
          // 古いまま（または移行フォールバックのnullのまま）になり、投入と再解決の言語が食い違う。
          presetsLanguage = language;
          presetsLanguageDirty = true;
        }

        // 投入済みのプリセットへ、シード側で導出した結果記号を後から反映する（結果欄を
        // 「m*a」ではなく「F = m*a」と読めるようにするため）。投入はカテゴリ単位で1回きりなので、
        // ここで当てないと既存インストールでは永遠に反映されない。
        {
          const withResultSymbols = applyPresetResultSymbols(nextNotebooks);
          if (withResultSymbols.changed) {
            nextNotebooks = withResultSymbols.notebooks;
            notebooksDirty = true;
          }
        }

        // 有効数字に数えない定数の印（図面の呼び寸法・個数）も同じ理由でここで貼り直す。
        // 値は一切変えないので、所有権の話（regionalDefault）と違って毎回当ててよい。
        {
          const withExactConstants = applyPresetExactConstants(nextNotebooks);
          if (withExactConstants.changed) {
            nextNotebooks = withExactConstants.notebooks;
            notebooksDirty = true;
          }
        }

        // 単位記号の綴り（`Ohm` → `Ω`）を今の綴りへ揃える。**値を変えない書き換え**なので
        // 所有権の判定を通さずに当てる（通すと、まさに `10kOhm` が残っている旧データでは
        // 投入時の値が記録されていないため永久に直らない）。
        {
          const withFixedSpellings = normalizePresetUnitSpellings(nextNotebooks);
          if (withFixedSpellings.changed) {
            nextNotebooks = withFixedSpellings.notebooks;
            notebooksDirty = true;
          }
        }

        // シードの式・表示単位の修正を、利用者の編集を残したまま届ける。判定は
        // 「保存値 == 投入時の値」（applyPresetSeedUpdates の注記）。**綴りの揃えより後に
        // 当てること**——先に当てると、綴りだけ違う旧データが「編集済み」に見えて弾かれる。
        {
          const withSeedUpdates = applyPresetSeedUpdates(nextNotebooks);
          if (withSeedUpdates.changed) {
            nextNotebooks = withSeedUpdates.notebooks;
            notebooksDirty = true;
          }
        }

        // 地域別の既定値（電気代・燃料単価・フィラメント単価・電圧・ブレーカー定格・燃費）を
        // 現在の端末の地域へ揃える。**目印が付いたままの定数だけ**が対象なので、利用者が
        // 書き換えた値は触らない（所有権の判定は lib/preset-regional-sync.ts）。
        // 投入はカテゴリ単位で1回きりなので、これが無いと既存インストールには永遠に届かず、
        // 引っ越しや端末のロケール変更にも追従しない。
        // 目印を保存するようになる前の保存データへ、シードから目印を付け直す。**1回きり。**
        // 毎回走らせると、利用者が編集して目印を外した定数を旧データと誤認して付け直し、
        // すぐ下の後追い反映が編集内容を上書きしてしまう（CodeRabbitが#54で検出）。
        let markRegionalDefaultsStamped = false;
        if (regionalDefaultsStampedRaw !== "1") {
          const stamped = stampLegacyPresetRegionalDefaults(nextNotebooks);
          if (stamped.changed) {
            nextNotebooks = stamped.notebooks;
            notebooksDirty = true;
          }
          // 付け直す対象が無かった場合もフラグは立てる（次回以降走らせない）。
          markRegionalDefaultsStamped = true;
        }

        {
          const withRegionalDefaults = applyPresetRegionalDefaults(nextNotebooks, regionalDefaults);
          if (withRegionalDefaults.changed) {
            nextNotebooks = withRegionalDefaults.notebooks;
            notebooksDirty = true;
          }
        }

        if (notebooksDirty) {
          await AsyncStorage.setItem(NOTEBOOKS_STORAGE_KEY, JSON.stringify(nextNotebooks));
          if (markMigrated) await AsyncStorage.setItem(NOTEBOOKS_MIGRATED_STORAGE_KEY, "1");
          if (missingPresetCategories.length) await AsyncStorage.setItem(NOTEBOOKS_SEEDED_PRESETS_STORAGE_KEY, JSON.stringify(seededPresetIds));
        }
        // ノート本体の書き込みが済んだ後に立てる（途中で失敗したときに「済」だけ残らないように、
        // 上の markMigrated と同じ順序にしてある）。
        if (markRegionalDefaultsStamped) await AsyncStorage.setItem(REGIONAL_DEFAULTS_STAMPED_STORAGE_KEY, "1");
        if (presetsLanguageDirty) await AsyncStorage.setItem(PRESETS_LANGUAGE_STORAGE_KEY, presetsLanguage as AppLanguage);

        // 保存されていたIDが指すノートがもう存在しない（削除された・別端末のバックアップを
        // 取り込んだ、など）なら null として扱う。resolveNotebookHistory と同じ「現存突き合わせ」の
        // 考え方。無効なIDのまま保持すると、画面側が毎回「存在しないノートを探して失敗する」
        // 処理を強いられるので、ここで一度きり正規化しておく。
        const loadedActiveNotebookId = typeof activeNotebookIdRaw === "string" && nextNotebooks.some((notebook) => notebook.id === activeNotebookIdRaw) ? activeNotebookIdRaw : null;

        if (!active) return;
        setConstants(parseStoredArray(constantsRaw).filter(isSavedConstant));
        setHistory(parseStoredArray(historyRaw).filter(isSavedCalculation));
        setFavoriteUnits(parseStoredArray(favoriteUnitsRaw).filter((unit): unit is string => typeof unit === "string"));
        {
          // エンジンのレジストリ（lib/units.tsのsetCustomUnits）はモジュール状態でAsyncStorageに
          // 永続化されないので、アプリ起動のたびにここで読み込んだ内容を必ず再登録し直す
          // （でないと再起動直後は自作単位が式の中で一切解決できない）。
          // 検証・重複排除（先勝ち）は parseCustomUnitsField（lib/custom-units.ts）に一本化してある。
          const loadedCustomUnits = parseCustomUnitsField(parseStoredArray(customUnitsRaw));
          customUnitsRef.current = loadedCustomUnits;
          setCustomUnitsState(loadedCustomUnits);
          setCustomUnitsRegistry(loadedCustomUnits.map(toCustomUnitRegistration));
        }
        notebooksRef.current = nextNotebooks;
        setNotebooks(nextNotebooks);
        {
          const loadedCategories = parseStoredArray(notebookCategoriesRaw).filter(isNotebookCategory);
          notebookCategoriesRef.current = loadedCategories;
          setNotebookCategories(loadedCategories);
        }
        {
          const loadedNotebookHistory = parseStoredArray(notebookHistoryRaw).filter(isNotebookHistoryEntry);
          notebookHistoryRef.current = loadedNotebookHistory;
          setNotebookHistory(loadedNotebookHistory);
        }
        setClearedConstants(parseStoredArray(clearedConstantsRaw).filter(isSavedConstant));
        presetsLanguageRef.current = presetsLanguage;
        activeNotebookIdRef.current = loadedActiveNotebookId;
        setActiveNotebookIdState(loadedActiveNotebookId);
      } catch {
        if (!active) return;
        setConstants([]);
        setHistory([]);
        setFavoriteUnits([]);
        customUnitsRef.current = [];
        setCustomUnitsState([]);
        setCustomUnitsRegistry([]);
        notebooksRef.current = [];
        setNotebooks([]);
        notebookCategoriesRef.current = [];
        setNotebookCategories([]);
        notebookHistoryRef.current = [];
        setNotebookHistory([]);
        setClearedConstants([]);
        presetsLanguageRef.current = null;
        activeNotebookIdRef.current = null;
        setActiveNotebookIdState(null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // 設定の読み込み完了後に一度だけ実行する（初回投入時の言語はこの時点のlanguageで焼き込む）。
    // 以降のlanguage変更への追従は、この初回ロードの完了後に走る下のuseEffect（localizePresetNotebooks）
    // が個別に担当する。ここで[language]を依存に加えて再実行すると、ロード処理そのものが
    // 言語切替のたびに丸ごと走ってしまい、上のnotebooksDirty判定や移行フラグの一度きり実行の
    // 前提が崩れるため、あえて分離している。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGlobalSettingsReady]);

  // 言語切替のたびに、isPresetなノートの表示文言（title/description/steps[].title/
  // formulas[].explanation）だけをシードから再解決する。上の初回ロードが完了する（notebooksが
  // 実データで埋まる）前にこれが走っても空配列に対する空振りで無害なので、isLoadingでの
  // ガードは必須ではないが、無駄な再解決を避けるために付けている。
  useEffect(() => {
    if (!isGlobalSettingsReady || isLoading) return;
    const previousLanguage = presetsLanguageRef.current;
    const { notebooks: nextNotebooks, changed } = localizePresetNotebooks(notebooksRef.current, language, previousLanguage);
    if (changed) void persistNotebooks(nextNotebooks);
    // この言語で解決（または「解決したが変更なし」を確認）し終えたので、次回の比較対象として
    // 保存言語を更新する。changedの有無に関わらず更新してよい理由: changed=falseは「既にこの
    // 言語の文言と一致していた」ことを意味するので、いずれにせよ保存言語は現在のlanguageで正しい。
    if (previousLanguage !== language) void persistPresetsLanguage(language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, isGlobalSettingsReady, isLoading]);

  // 端末の地域（currencyCode / regionCode）が変わったら、目印が残っているローカル定数を
  // 新しい地域の既定値へ揃える。上の初回ロードは [isGlobalSettingsReady] だけを依存にして
  // いるので、**アプリが起動したまま端末の地域設定が変わった場合はロード処理が再実行されず、
  // 追従できない**（`Localization.useLocales()` は再起動を待たずに更新される。CodeRabbitが
  // #54で検出）。言語の追従を上のuseEffectが個別に担当しているのと同じ形に揃えてある。
  //
  // **ここでは旧データへの目印の付け直し（stampLegacyPresetRegionalDefaults）を呼ばないこと。**
  // あれは移行フラグで1回きりに縛る必要があるもので、地域が変わるたびに走らせると
  // 利用者が編集して目印を外した定数を上書きしてしまう。
  useEffect(() => {
    if (!isGlobalSettingsReady || isLoading) return;
    const regionalDefaults = resolvePresetRegionalDefaults(currencyCode, regionCode, language);
    const { notebooks: nextNotebooks, changed } = applyPresetRegionalDefaults(notebooksRef.current, regionalDefaults);
    if (changed) void persistNotebooks(nextNotebooks);
    // language は「表に無い地域のときの最後の手掛かり」として resolvePresetRegionalDefaults が
    // 使うだけなので、言語切替でここが走っても地域が読めている端末では何も変わらない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyCode, regionCode, language, isGlobalSettingsReady, isLoading]);

  const upsertConstant = useCallback(
    async (symbolInput: string, expressionInput: string) => {
      const symbol = symbolInput.trim();
      const expression = expressionInput.trim();
      if (/^a[1-9]\d*$/i.test(symbol)) throw new Error(STORE_MESSAGES[language].reservedAutoConstantSymbol);
      // 単位記号をグローバル定数の名前にさせない。識別子の解決は単位より先なので、`W = 3cm` を
      // 許すと裸の `W` は 3cm・数値の直後の `W`（`5W`）はワットになり、**エラーにならないまま
      // 同じ文字が2つの意味を持つ**（実機で指摘された）。接頭辞で分解できる記号（`ms`・`km`）も
      // 式では単位として読まれるので同じ扱いにする。判定は評価器と同じ resolveUnitSymbol 系の
      // 関数（isResolvableUnitSymbol）に任せ、「登録できたのに解決されない／解決が入れ替わる」
      // 記号が生まれないようにする。
      //
      // **弾くのはグローバル定数だけ。** 計算ノートのローカル定数は1つのノートの中で閉じていて、
      // 数式の記号そのもの（キャパシタンスの `C`・巻数の `N`）を名前にできることが設計上の要点。
      // **取り込み（importConstants）も通さない**——復元は利用者が自分の値を明示的に写す操作で、
      // 別の端末で保存済みの名前を黙って落とす方が驚きが大きい。
      if (isResolvableUnitSymbol(symbol)) throw new Error(STORE_MESSAGES[language].unitSymbolConstant(symbol));
      const existing = constants.find((item) => item.symbol === symbol);
      const others = constants.filter((item) => item.symbol !== symbol);
      const parsed = parseConstantDefinition(`${symbol} = ${expression}`, others);
      const nextItem: SavedConstant = { ...parsed, createdAt: existing?.createdAt ?? new Date().toISOString() };
      await persistConstants([...others, nextItem].sort((left, right) => left.symbol.localeCompare(right.symbol)));
      return nextItem;
    },
    [constants, language, persistConstants],
  );

  const removeConstant = useCallback(async (symbol: string) => {
    await persistConstants(constants.filter((item) => item.symbol !== symbol));
  }, [constants, persistConstants]);

  // customUnitsは、定数の定義式（例: "2shaku"）がユーザー定義単位に依存している場合に必要。
  // 自作単位は「追加・同名記号の置換」だけを行い、既存の自作単位を削除しない（modeに関わらず
  // 常に同じ規則。詳しくは mergeCustomUnits のコメントを参照）。定数の解決より先に登録しないと、
  // parseConstantDefinition が自作単位の記号を解決できず取り込みが失敗する。
  const importConstants = useCallback(async (entries: ImportedConstant[], mode: "merge" | "replace", customUnits: CustomUnit[]) => {
    if (customUnits.length > 0) await persistCustomUnits(mergeCustomUnits(customUnitsRef.current, customUnits));
    const incomingSymbols = new Set(entries.map((item) => item.symbol));
    const next = mode === "replace" ? [] : constants.filter((item) => !incomingSymbols.has(item.symbol));
    let pending = [...entries];
    let stalled = false;
    while (pending.length && !stalled) {
      stalled = true;
      const remaining: ImportedConstant[] = [];
      for (const item of pending) {
        try {
          const parsed = parseConstantDefinition(`${item.symbol} = ${item.expression}`, next);
          next.push({ ...parsed, createdAt: item.createdAt || new Date().toISOString() });
          stalled = false;
        } catch {
          remaining.push(item);
        }
      }
      pending = remaining;
    }
    if (pending.length) throw new Error(STORE_MESSAGES[language].constantsImportFailed(pending.map((item) => item.symbol).join(", ")));
    await persistConstants(next.sort((left, right) => left.symbol.localeCompare(right.symbol)));
    return { count: entries.length, customUnitCount: customUnits.length };
  }, [constants, language, persistConstants, persistCustomUnits]);

  const clearConstants = useCallback(async () => {
    await AsyncStorage.setItem(CLEARED_CONSTANTS_STORAGE_KEY, JSON.stringify(constants));
    setClearedConstants(constants);
    await persistConstants([]);
  }, [constants, persistConstants]);

  const restoreClearedConstants = useCallback(async () => {
    if (!clearedConstants.length) return false;
    await persistConstants(clearedConstants);
    setClearedConstants([]);
    await AsyncStorage.removeItem(CLEARED_CONSTANTS_STORAGE_KEY);
    return true;
  }, [clearedConstants, persistConstants]);

  const addHistoryEntry = useCallback(async (entry: SavedCalculation) => {
    const next = [entry, ...history.filter((item) => item.expression !== entry.expression)].slice(0, 500);
    await persistHistory(next);
  }, [history, persistHistory]);

  const clearHistory = useCallback(async () => {
    await persistHistory([]);
  }, [persistHistory]);

  const toggleFavoriteUnit = useCallback(async (unit: string) => {
    const next = favoriteUnits.includes(unit) ? favoriteUnits.filter((item) => item !== unit) : [...favoriteUnits, unit];
    await persistFavoriteUnits(next);
  }, [favoriteUnits, persistFavoriteUnits]);

  // 同じ記号の自作単位が既にあれば置き換える（編集）。無ければ追加する。
  // 直前の一覧はstateではなくrefから読む（連続操作で古い配列を基準にしないため）。
  const saveCustomUnit = useCallback(async (unit: CustomUnit) => {
    const next = [...customUnitsRef.current.filter((item) => item.symbol !== unit.symbol), unit];
    await persistCustomUnits(next);
  }, [persistCustomUnits]);

  const deleteCustomUnit = useCallback(async (symbol: string) => {
    await persistCustomUnits(customUnitsRef.current.filter((item) => item.symbol !== symbol));
  }, [persistCustomUnits]);

  const upsertNotebook = useCallback(async (input: Omit<CalculationNotebook, "id" | "createdAt" | "updatedAt" | "pinned" | "isPreset"> & { id?: string }) => {
    const now = new Date().toISOString();
    const currentNotebooks = notebooksRef.current;
    const existing = input.id ? currentNotebooks.find((item) => item.id === input.id) : undefined;
    // 利用者が書き換えた定数から地域別既定値の目印を外す（以後アプリは触らない）。
    // 保存の入口はここだけなので、詳細画面・編集シート・バックアップ取り込みのどこから
    // 来ても同じ規則で所有権が移る。
    const localConstants = releaseEditedRegionalDefaults(input.localConstants, existing?.localConstants);
    const item: CalculationNotebook = { ...input, localConstants, id: existing?.id ?? `notebook-${Date.now()}`, pinned: existing?.pinned ?? false, isPreset: existing?.isPreset ?? false, createdAt: existing?.createdAt ?? now, updatedAt: now };
    const next = [...currentNotebooks.filter((entry) => entry.id !== item.id), item].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    await persistNotebooks(next);
    return item;
  }, [persistNotebooks]);

  // 計算ノートのバックアップ取り込み。プリセットのノート本体（isPreset）は対象外で、ユーザー作成分だけを
  // 入れ替える／追加する。ユーザー作成カテゴリはID自体が端末固有なので、名前で解決し、
  // 見つからなければ新規作成する（プリセットカテゴリIDやUNCATEGORIZED_CATEGORY_IDはそのまま使う）。
  // 一方、プリセットへの上書き（presetOverrides）はノート本体とは別枠で、modeに関わらず常に適用する。
  // replaceは「ユーザー作成ノートを入れ替える」操作であって、プリセットを「シードに戻す」操作ではない
  // （そのための操作は設定画面の「プリセットの計算ノートを初期状態に戻す」で別途提供している）ため、
  // ここでmodeによる分岐を入れない。
  // customUnitsは、取り込むノートが自作単位（例: "2shaku"）を参照している場合に必要。
  // 自作単位は「追加・同名記号の置換」だけを行い、既存の自作単位を削除しない（modeに関わらず
  // 常に同じ規則。詳しくは mergeCustomUnits のコメントを参照）。ノート本体より先に登録しないと、
  // 取り込み直後にノートを開いたときにまだ式の中で解決できない。
  const importNotebooks = useCallback(async (entries: ImportedNotebook[], mode: "merge" | "replace", presetOverrides: PresetNotebookOverride[], customUnits: CustomUnit[]) => {
    if (customUnits.length > 0) await persistCustomUnits(mergeCustomUnits(customUnitsRef.current, customUnits));
    const now = new Date().toISOString();
    const importedAt = Date.now();
    let categories = notebookCategoriesRef.current;
    const resolveCategoryId = (entry: ImportedNotebook) => {
      if (entry.categoryId && (entry.categoryId === UNCATEGORIZED_CATEGORY_ID || PRESET_NOTEBOOK_CATEGORIES.some((category) => category.id === entry.categoryId))) return entry.categoryId;
      const name = entry.categoryName?.trim();
      if (!name) return UNCATEGORIZED_CATEGORY_ID;
      const existing = categories.find((category) => category.name === name);
      if (existing) return existing.id;
      const created: NotebookCategory = { id: `category-imported-${importedAt}-${categories.length}`, name, createdAt: now };
      categories = [...categories, created];
      return created.id;
    };
    const importedNotebooks: CalculationNotebook[] = entries.map((entry, index) => ({
      id: `notebook-import-${importedAt}-${index}`,
      title: entry.title,
      description: entry.description,
      categoryId: resolveCategoryId(entry),
      // applyPresetNotebookOverridesと同じ理由で、取り込んだ要素をスプレッドせず既知の
      // フィールドだけを取り出して組み直す（ファイル側のidで生成idを上書きさせない）。
      formulas: entry.formulas.map(({ explanation, latex }, formulaIndex) => ({ id: `import-${importedAt}-${index}-formula-${formulaIndex}`, explanation, latex })),
      localConstants: entry.localConstants.map((constant, constantIndex) => ({ id: `import-${importedAt}-${index}-constant-${constantIndex}`, symbol: constant.symbol, expression: constant.expression, ...importedExactFields(constant) })),
      steps: entry.steps.map(({ title, expression, targetUnit, formulaLatex, resultSymbol }, stepIndex) => ({ id: `import-${importedAt}-${index}-step-${stepIndex}`, title, expression, targetUnit, formulaLatex, resultSymbol })),
      pinned: false,
      isPreset: false,
      createdAt: now,
      updatedAt: now,
    }));
    const presetNotebooks = notebooksRef.current.filter((item) => item.isPreset);
    const existingUserNotebooks = notebooksRef.current.filter((item) => !item.isPreset);
    let nextUserNotebooks: CalculationNotebook[];
    if (mode === "replace") {
      nextUserNotebooks = importedNotebooks;
    } else {
      nextUserNotebooks = [...existingUserNotebooks];
      for (const incoming of importedNotebooks) {
        const matchIndex = nextUserNotebooks.findIndex((item) => item.title === incoming.title && item.categoryId === incoming.categoryId);
        if (matchIndex >= 0) nextUserNotebooks[matchIndex] = { ...incoming, id: nextUserNotebooks[matchIndex].id, pinned: nextUserNotebooks[matchIndex].pinned, createdAt: nextUserNotebooks[matchIndex].createdAt };
        else nextUserNotebooks.push(incoming);
      }
    }
    const { notebooks: overriddenPresetNotebooks, appliedCount: presetOverrideCount } = applyPresetNotebookOverrides(presetNotebooks, presetOverrides, now);
    // **上書きを当てた直後にシードの印を貼り直す。** バックアップは利用者が決めた印しか
    // 持ち運ばないので、上書きを当てた時点でそれ以外の定数からは `exact` が落ちている。
    // 読み込み時のeffectに任せると、**取り込んだ直後だけ丸めが消えたノートを見せてしまう**
    // （穴まわりの応力集中が `≈ 47 MPa` ではなく `46.875 MPa` になり、次の起動で直る。
    // CodeRabbitが#77で🟠として検出）。`exactEdited` が付いた定数は除外されるので、
    // ここで貼り直しても利用者の判断は上書きしない。
    // 単位記号の綴りも取り込みの時点で揃える（値を変えない書き換え。読み込み時と同じ理由で、
    // ここで当てないと取り込んだ直後だけ `10kOhm` のノートを見せてしまう）。
    const { notebooks: spellingFixedPresets } = normalizePresetUnitSpellings(overriddenPresetNotebooks);
    const { notebooks: nextPresetNotebooks } = applyPresetExactConstants(spellingFixedPresets);
    const nextAllNotebooks = [...nextPresetNotebooks, ...nextUserNotebooks].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    // ノートより先にカテゴリを書き込む。逆にすると、カテゴリ書き込みが失敗した場合に
    // 存在しないcategoryIdを参照するノートが残ってしまい、カテゴリ一覧からも辿れなくなる。
    // 参照されない空カテゴリが残るだけの方が実害が小さい。
    await persistNotebookCategories(categories);
    await persistNotebooks(nextAllNotebooks);
    // replaceでユーザー作成ノートを丸ごと入れ替えた（IDも新規採番される）結果、「ノート」タブが
    // 表示中だったノートが消えていたらnullに戻す。mergeでも既存ノートをid維持で上書きするので
    // 消えることはないが、判定自体はどちらのmodeでも同じ「現存するか」で共通に扱える。
    if (activeNotebookIdRef.current !== null && !nextAllNotebooks.some((notebook) => notebook.id === activeNotebookIdRef.current)) await persistActiveNotebookId(null);
    return { notebookCount: importedNotebooks.length, presetOverrideCount, customUnitCount: customUnits.length };
  }, [persistActiveNotebookId, persistNotebookCategories, persistNotebooks, persistCustomUnits]);

  // プリセットの計算ノートを現在のシードから作り直し、ユーザーの編集（値の書き換え・
  // タイトル変更など）を破棄する。ユーザー作成ノート（!isPreset）・ユーザー作成カテゴリには
  // 一切触れない（破壊的な操作なので、呼び出し側でConfirmDialogによる確認を挟むこと）。
  // activeNotebookIdには触れない: プリセットのIDは presetNotebookId(categoryId, seedId) で
  // 決定的に採番され、このリセットでも同じ規則で作り直すのでIDは変わらない
  // （中身だけがシードへ戻る）。したがって「ノート」タブがプリセットを表示中でも、
  // このリセット後も同じノートを指し続けられ、nullに戻す必要はない。
  const resetPresetNotebooks = useCallback(async () => {
    const now = new Date().toISOString();
    const regionalDefaults = resolvePresetRegionalDefaults(currencyCode, regionCode, language);
    const freshPresets = buildPresetNotebooksFromSeeds(PRESET_NOTEBOOK_CATEGORIES.map((category) => category.id), language, regionalDefaults, now);
    // pinned（ピン留め）はノートの中身の編集ではなく、単なる整理のための状態なので、リセットは
    // 「中身をシードへ戻す」ことだけを目的とし、ピン留めの状態は引き継ぐ（せっかく整理した
    // 並びをリセットのたびに崩さないため）。
    const pinnedByPresetId = new Map(notebooksRef.current.filter((item) => item.isPreset).map((item) => [item.id, item.pinned]));
    const nextPresets = freshPresets.map((notebook) => ({ ...notebook, pinned: pinnedByPresetId.get(notebook.id) ?? false }));
    const userNotebooks = notebooksRef.current.filter((item) => !item.isPreset);
    await persistNotebooks([...nextPresets, ...userNotebooks].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));
  }, [currencyCode, language, persistNotebooks, regionCode]);

  const removeNotebook = useCallback(async (id: string) => {
    // プリセットのノートは端末から消えると復元できないため、削除操作を無視する。
    // UI側でも削除ボタンを出さないが、念のため保存処理でも二重に守る。
    const target = notebooksRef.current.find((item) => item.id === id);
    if (target?.isPreset) return;
    await persistNotebooks(notebooksRef.current.filter((item) => item.id !== id));
    // 「ノート」タブが表示中だったノートを削除したら、指す先を失うのでnullに戻す
    // （画面側はnullを見てresolveActiveNotebookで履歴・ピン留めに自動フォールバックする）。
    if (activeNotebookIdRef.current === id) await persistActiveNotebookId(null);
  }, [persistActiveNotebookId, persistNotebooks]);

  const toggleNotebookPinned = useCallback(async (id: string) => {
    await persistNotebooks(notebooksRef.current.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item)));
  }, [persistNotebooks]);

  const upsertNotebookCategory = useCallback(async (input: { id?: string; name: string }) => {
    const name = input.name.trim();
    if (!name) throw new Error(STORE_MESSAGES[language].categoryNameRequired);
    const now = new Date().toISOString();
    const currentCategories = notebookCategoriesRef.current;
    const existing = input.id ? currentCategories.find((item) => item.id === input.id) : undefined;
    const item: NotebookCategory = { id: existing?.id ?? `category-${Date.now()}`, name, createdAt: existing?.createdAt ?? now };
    const next = [...currentCategories.filter((entry) => entry.id !== item.id), item].sort((left, right) => left.name.localeCompare(right.name));
    await persistNotebookCategories(next);
    return item;
  }, [language, persistNotebookCategories]);

  const removeNotebookCategory = useCallback(async (id: string) => {
    // カテゴリを消してもノートは消さず、未分類へ付け替える。
    const nextCategories = notebookCategoriesRef.current.filter((item) => item.id !== id);
    const now = new Date().toISOString();
    const nextNotebooks = notebooksRef.current.map((item) => (item.categoryId === id ? { ...item, categoryId: UNCATEGORIZED_CATEGORY_ID, updatedAt: now } : item));
    await persistNotebookCategories(nextCategories);
    await persistNotebooks(nextNotebooks);
  }, [persistNotebookCategories, persistNotebooks]);

  // ノートを**実際に使った**とき（値を編集した・単位を切り替えた・結果をコピーした・保存した）に
  // 「最近使ったノート」履歴へ1件積む。開いて眺めただけで積むと、カテゴリを辿る途中に覗いた
  // ノートまで並んでしまい、目的の「使ったノートへ戻る」導線として役に立たなくなる。
  // titleはこの時点のスナップショットとして保存する（後でノートが改名・削除されても
  // 「何を使ったか」自体は残るようにするため）。
  // 積み直しロジック（同じノートの重複除去・先頭追加・上限）はlib/notebook-history.tsの
  // 純関数に切り出してあり、ここではその関数を呼ぶだけにする（テストで検証できるようにするため）。
  const recordNotebookUse = useCallback(async (notebook: CalculationNotebook) => {
    const entry: NotebookHistoryEntry = {
      id: `notebook-history-${Date.now()}-${notebook.id}`,
      notebookId: notebook.id,
      title: notebook.title,
      categoryId: notebook.categoryId,
      openedAt: new Date().toISOString(),
    };
    await persistNotebookHistory(pushNotebookHistoryEntry(notebookHistoryRef.current, entry));
  }, [persistNotebookHistory]);

  const removeNotebookHistoryEntryById = useCallback(async (id: string) => {
    await persistNotebookHistory(removeNotebookHistoryEntry(notebookHistoryRef.current, id));
  }, [persistNotebookHistory]);

  const clearNotebookHistory = useCallback(async () => {
    await persistNotebookHistory([]);
  }, [persistNotebookHistory]);

  // 「ノート」タブが表示するノートを明示的に切り替える／選択解除する（null）ときに画面側から呼ぶ。
  // 現存チェックはしない: 呼び出し側（画面）は今まさに表示しているノート、あるいは
  // resolveActiveNotebookが返したノートのidを渡すはずなので、ここで二重に検証する必要はない。
  const setActiveNotebookId = useCallback(async (id: string | null) => {
    await persistActiveNotebookId(id);
  }, [persistActiveNotebookId]);

  const value = useMemo(
    () => ({
      constants, history, favoriteUnits, customUnits, notebooks, notebookCategories, notebookHistory, activeNotebookId,
      hasRestorableConstants: clearedConstants.length > 0, isLoading,
      upsertConstant, removeConstant, importConstants, clearConstants, restoreClearedConstants,
      addHistoryEntry, clearHistory, toggleFavoriteUnit, saveCustomUnit, deleteCustomUnit,
      upsertNotebook, importNotebooks, removeNotebook, resetPresetNotebooks, toggleNotebookPinned, upsertNotebookCategory, removeNotebookCategory,
      recordNotebookUse, removeNotebookHistoryEntry: removeNotebookHistoryEntryById, clearNotebookHistory, setActiveNotebookId,
    }),
    [
      constants, history, favoriteUnits, customUnits, notebooks, notebookCategories, notebookHistory, activeNotebookId,
      clearedConstants.length, isLoading,
      upsertConstant, removeConstant, importConstants, clearConstants, restoreClearedConstants,
      addHistoryEntry, clearHistory, toggleFavoriteUnit, saveCustomUnit, deleteCustomUnit,
      upsertNotebook, importNotebooks, removeNotebook, resetPresetNotebooks, toggleNotebookPinned, upsertNotebookCategory, removeNotebookCategory,
      recordNotebookUse, removeNotebookHistoryEntryById, clearNotebookHistory, setActiveNotebookId,
    ],
  );

  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export function useCalculatorStore() {
  const value = useContext(CalculatorContext);
  if (!value) throw new Error("CalculatorProvider の内部で使用してください。");
  return value;
}
