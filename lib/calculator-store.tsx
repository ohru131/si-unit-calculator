import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { ImportedConstant } from "@/lib/constants-backup";
import { useGlobalSettings } from "@/lib/global-settings";
import { PRESET_NOTEBOOK_CATEGORIES, PRESET_NOTEBOOK_SEEDS } from "@/lib/notebook-formulas";
import { parseConstantDefinition, Quantity, SavedConstant } from "@/lib/units";

const CONSTANTS_STORAGE_KEY = "si-unit-calculator.constants.v1";
const HISTORY_STORAGE_KEY = "si-unit-calculator.history.v1";
const FAVORITE_UNITS_STORAGE_KEY = "si-unit-calculator.favorite-units.v1";
const NOTES_STORAGE_KEY = "si-unit-calculator.notes.v1";
const CLEARED_CONSTANTS_STORAGE_KEY = "si-unit-calculator.cleared-constants.v1";
const NOTEBOOKS_STORAGE_KEY = "si-unit-calculator.notebooks.v1";
const NOTEBOOK_CATEGORIES_STORAGE_KEY = "si-unit-calculator.notebook-categories.v1";
const NOTEBOOKS_MIGRATED_STORAGE_KEY = "si-unit-calculator.notebooks-migrated.v1";
const NOTEBOOKS_SEEDED_PRESETS_STORAGE_KEY = "si-unit-calculator.notebooks-seeded-presets.v1";

export const UNCATEGORIZED_CATEGORY_ID = "uncategorized";

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
  symbol: string;
  expression: string;
  /** 定数一覧での表示用記号。数式の変数と揃えるためのUnicode下付き文字など。省略時はsymbolをそのまま表示する。 */
  displaySymbol?: string;
};

export type CalculationNotebook = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
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

type CalculatorStore = {
  constants: SavedConstant[];
  history: SavedCalculation[];
  favoriteUnits: string[];
  notebooks: CalculationNotebook[];
  notebookCategories: NotebookCategory[];
  hasRestorableConstants: boolean;
  isLoading: boolean;
  upsertConstant: (symbol: string, expression: string) => Promise<SavedConstant>;
  removeConstant: (symbol: string) => Promise<void>;
  importConstants: (entries: ImportedConstant[], mode: "merge" | "replace") => Promise<number>;
  clearConstants: () => Promise<void>;
  restoreClearedConstants: () => Promise<boolean>;
  addHistoryEntry: (entry: SavedCalculation) => Promise<void>;
  clearHistory: () => Promise<void>;
  toggleFavoriteUnit: (unit: string) => Promise<void>;
  upsertNotebook: (input: Omit<CalculationNotebook, "id" | "createdAt" | "updatedAt" | "pinned" | "isPreset"> & { id?: string }) => Promise<CalculationNotebook>;
  removeNotebook: (id: string) => Promise<void>;
  toggleNotebookPinned: (id: string) => Promise<void>;
  upsertNotebookCategory: (input: { id?: string; name: string }) => Promise<NotebookCategory>;
  removeNotebookCategory: (id: string) => Promise<void>;
};

const CalculatorContext = createContext<CalculatorStore | null>(null);

function isSavedConstant(value: unknown): value is SavedConstant {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedConstant>;
  return typeof candidate.symbol === "string" && typeof candidate.expression === "string" && typeof candidate.createdAt === "string" && typeof candidate.quantity?.siValue === "number" && Array.isArray(candidate.quantity.dimension) && candidate.quantity.dimension.length === 7;
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

function isCalculationNotebook(value: unknown): value is CalculationNotebook {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CalculationNotebook>;
  return typeof candidate.id === "string" && typeof candidate.title === "string" && typeof candidate.description === "string" && typeof candidate.categoryId === "string"
    && Array.isArray(candidate.localConstants) && candidate.localConstants.every((item) => item && typeof item.id === "string" && typeof item.symbol === "string" && typeof item.expression === "string")
    && Array.isArray(candidate.steps) && candidate.steps.every((step) => step && typeof step.id === "string" && typeof step.title === "string" && typeof step.expression === "string" && typeof step.targetUnit === "string")
    && typeof candidate.createdAt === "string" && typeof candidate.updatedAt === "string";
}

function isNotebookCategory(value: unknown): value is NotebookCategory {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<NotebookCategory>;
  return typeof candidate.id === "string" && typeof candidate.name === "string" && typeof candidate.createdAt === "string";
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

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const { language, isReady: isGlobalSettingsReady } = useGlobalSettings();
  const [constants, setConstants] = useState<SavedConstant[]>([]);
  const [history, setHistory] = useState<SavedCalculation[]>([]);
  const [favoriteUnits, setFavoriteUnits] = useState<string[]>([]);
  const [notebooks, setNotebooks] = useState<CalculationNotebook[]>([]);
  const [notebookCategories, setNotebookCategories] = useState<NotebookCategory[]>([]);
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

  // toggleNotebookPinnedなど、直前の呼び出し結果を踏まえて計算する更新が連続で呼ばれても
  // 古いnotebooksを参照しないよう、refは代入の直前（awaitより前）に同期更新する。
  const notebooksRef = useRef<CalculationNotebook[]>(notebooks);
  const persistNotebooks = useCallback(async (next: CalculationNotebook[]) => {
    notebooksRef.current = next;
    setNotebooks(next);
    await AsyncStorage.setItem(NOTEBOOKS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const notebookCategoriesRef = useRef<NotebookCategory[]>(notebookCategories);
  const persistNotebookCategories = useCallback(async (next: NotebookCategory[]) => {
    notebookCategoriesRef.current = next;
    setNotebookCategories(next);
    await AsyncStorage.setItem(NOTEBOOK_CATEGORIES_STORAGE_KEY, JSON.stringify(next));
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
          notebooksRaw,
          notebookCategoriesRaw,
          clearedConstantsRaw,
          migratedRaw,
          seededPresetsRaw,
        ] = await Promise.all([
          AsyncStorage.getItem(CONSTANTS_STORAGE_KEY),
          AsyncStorage.getItem(HISTORY_STORAGE_KEY),
          AsyncStorage.getItem(FAVORITE_UNITS_STORAGE_KEY),
          AsyncStorage.getItem(NOTEBOOKS_STORAGE_KEY),
          AsyncStorage.getItem(NOTEBOOK_CATEGORIES_STORAGE_KEY),
          AsyncStorage.getItem(CLEARED_CONSTANTS_STORAGE_KEY),
          AsyncStorage.getItem(NOTEBOOKS_MIGRATED_STORAGE_KEY),
          AsyncStorage.getItem(NOTEBOOKS_SEEDED_PRESETS_STORAGE_KEY),
        ]);

        let nextNotebooks = parseStoredArray(notebooksRaw).filter(isCalculationNotebook).map((item) => ({ ...item, pinned: item.pinned === true, isPreset: item.isPreset === true }));
        let seededPresetIds = parseStoredArray(seededPresetsRaw).filter((id): id is string => typeof id === "string");
        let notebooksDirty = false;
        let markMigrated = false;

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
        const missingPresetCategories = PRESET_NOTEBOOK_CATEGORIES.filter((category) => !seededPresetIds.includes(category.id));
        if (missingPresetCategories.length) {
          const now = new Date().toISOString();
          missingPresetCategories.forEach((category) => {
            const seeds = PRESET_NOTEBOOK_SEEDS[category.id] ?? [];
            seeds.forEach((seed, seedIndex) => {
              nextNotebooks.push({
                id: `notebook-preset-${category.id}-${seedIndex}`,
                title: language === "en" ? seed.titleEn : seed.title,
                description: language === "en" ? seed.descriptionEn : seed.description,
                categoryId: category.id,
                localConstants: seed.localConstants.map((constant, constantIndex) => ({
                  id: `preset-${category.id}-${seedIndex}-constant-${constantIndex}`,
                  symbol: constant.symbol,
                  expression: constant.expression,
                  displaySymbol: constant.displaySymbol,
                })),
                steps: seed.steps.map((step, stepIndex) => ({
                  id: `preset-${category.id}-${seedIndex}-step-${stepIndex}`,
                  title: language === "en" ? step.titleEn : step.title,
                  expression: step.expression,
                  targetUnit: step.targetUnit,
                  formulaLatex: step.formulaLatex,
                })),
                pinned: false,
                isPreset: true,
                createdAt: now,
                updatedAt: now,
              });
            });
          });
          seededPresetIds = [...seededPresetIds, ...missingPresetCategories.map((category) => category.id)];
          notebooksDirty = true;
        }

        if (notebooksDirty) {
          await AsyncStorage.setItem(NOTEBOOKS_STORAGE_KEY, JSON.stringify(nextNotebooks));
          if (markMigrated) await AsyncStorage.setItem(NOTEBOOKS_MIGRATED_STORAGE_KEY, "1");
          if (missingPresetCategories.length) await AsyncStorage.setItem(NOTEBOOKS_SEEDED_PRESETS_STORAGE_KEY, JSON.stringify(seededPresetIds));
        }

        if (!active) return;
        setConstants(parseStoredArray(constantsRaw).filter(isSavedConstant));
        setHistory(parseStoredArray(historyRaw).filter(isSavedCalculation));
        setFavoriteUnits(parseStoredArray(favoriteUnitsRaw).filter((unit): unit is string => typeof unit === "string"));
        notebooksRef.current = nextNotebooks;
        setNotebooks(nextNotebooks);
        {
          const loadedCategories = parseStoredArray(notebookCategoriesRaw).filter(isNotebookCategory);
          notebookCategoriesRef.current = loadedCategories;
          setNotebookCategories(loadedCategories);
        }
        setClearedConstants(parseStoredArray(clearedConstantsRaw).filter(isSavedConstant));
      } catch {
        if (!active) return;
        setConstants([]);
        setHistory([]);
        setFavoriteUnits([]);
        notebooksRef.current = [];
        setNotebooks([]);
        notebookCategoriesRef.current = [];
        setNotebookCategories([]);
        setClearedConstants([]);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // 設定の読み込み完了後に一度だけ実行する(以降のlanguage変更ではプリセットの文言を焼き直さない)。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGlobalSettingsReady]);

  const upsertConstant = useCallback(
    async (symbolInput: string, expressionInput: string) => {
      const symbol = symbolInput.trim();
      const expression = expressionInput.trim();
      if (/^a[1-9]\d*$/i.test(symbol)) throw new Error("a1、a2…は計算履歴の自動定数として予約されています。");
      const existing = constants.find((item) => item.symbol === symbol);
      const others = constants.filter((item) => item.symbol !== symbol);
      const parsed = parseConstantDefinition(`${symbol} = ${expression}`, others);
      const nextItem: SavedConstant = { ...parsed, createdAt: existing?.createdAt ?? new Date().toISOString() };
      await persistConstants([...others, nextItem].sort((left, right) => left.symbol.localeCompare(right.symbol)));
      return nextItem;
    },
    [constants, persistConstants],
  );

  const removeConstant = useCallback(async (symbol: string) => {
    await persistConstants(constants.filter((item) => item.symbol !== symbol));
  }, [constants, persistConstants]);

  const importConstants = useCallback(async (entries: ImportedConstant[], mode: "merge" | "replace") => {
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
    if (pending.length) throw new Error(`定数を読み込めませんでした：${pending.map((item) => item.symbol).join(", ")}。参照先と式を確認してください。`);
    await persistConstants(next.sort((left, right) => left.symbol.localeCompare(right.symbol)));
    return entries.length;
  }, [constants, persistConstants]);

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

  const upsertNotebook = useCallback(async (input: Omit<CalculationNotebook, "id" | "createdAt" | "updatedAt" | "pinned" | "isPreset"> & { id?: string }) => {
    const now = new Date().toISOString();
    const currentNotebooks = notebooksRef.current;
    const existing = input.id ? currentNotebooks.find((item) => item.id === input.id) : undefined;
    const item: CalculationNotebook = { ...input, id: existing?.id ?? `notebook-${Date.now()}`, pinned: existing?.pinned ?? false, isPreset: existing?.isPreset ?? false, createdAt: existing?.createdAt ?? now, updatedAt: now };
    const next = [...currentNotebooks.filter((entry) => entry.id !== item.id), item].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    await persistNotebooks(next);
    return item;
  }, [persistNotebooks]);

  const removeNotebook = useCallback(async (id: string) => {
    // プリセットのノートは端末から消えると復元できないため、削除操作を無視する。
    // UI側でも削除ボタンを出さないが、念のため保存処理でも二重に守る。
    const target = notebooksRef.current.find((item) => item.id === id);
    if (target?.isPreset) return;
    await persistNotebooks(notebooksRef.current.filter((item) => item.id !== id));
  }, [persistNotebooks]);

  const toggleNotebookPinned = useCallback(async (id: string) => {
    await persistNotebooks(notebooksRef.current.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item)));
  }, [persistNotebooks]);

  const upsertNotebookCategory = useCallback(async (input: { id?: string; name: string }) => {
    const name = input.name.trim();
    if (!name) throw new Error("カテゴリ名を入力してください。");
    const now = new Date().toISOString();
    const currentCategories = notebookCategoriesRef.current;
    const existing = input.id ? currentCategories.find((item) => item.id === input.id) : undefined;
    const item: NotebookCategory = { id: existing?.id ?? `category-${Date.now()}`, name, createdAt: existing?.createdAt ?? now };
    const next = [...currentCategories.filter((entry) => entry.id !== item.id), item].sort((left, right) => left.name.localeCompare(right.name));
    await persistNotebookCategories(next);
    return item;
  }, [persistNotebookCategories]);

  const removeNotebookCategory = useCallback(async (id: string) => {
    // カテゴリを消してもノートは消さず、未分類へ付け替える。
    const nextCategories = notebookCategoriesRef.current.filter((item) => item.id !== id);
    const now = new Date().toISOString();
    const nextNotebooks = notebooksRef.current.map((item) => (item.categoryId === id ? { ...item, categoryId: UNCATEGORIZED_CATEGORY_ID, updatedAt: now } : item));
    await persistNotebookCategories(nextCategories);
    await persistNotebooks(nextNotebooks);
  }, [persistNotebookCategories, persistNotebooks]);

  const value = useMemo(
    () => ({
      constants, history, favoriteUnits, notebooks, notebookCategories,
      hasRestorableConstants: clearedConstants.length > 0, isLoading,
      upsertConstant, removeConstant, importConstants, clearConstants, restoreClearedConstants,
      addHistoryEntry, clearHistory, toggleFavoriteUnit,
      upsertNotebook, removeNotebook, toggleNotebookPinned, upsertNotebookCategory, removeNotebookCategory,
    }),
    [
      constants, history, favoriteUnits, notebooks, notebookCategories,
      clearedConstants.length, isLoading,
      upsertConstant, removeConstant, importConstants, clearConstants, restoreClearedConstants,
      addHistoryEntry, clearHistory, toggleFavoriteUnit,
      upsertNotebook, removeNotebook, toggleNotebookPinned, upsertNotebookCategory, removeNotebookCategory,
    ],
  );

  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export function useCalculatorStore() {
  const value = useContext(CalculatorContext);
  if (!value) throw new Error("CalculatorProvider の内部で使用してください。");
  return value;
}
