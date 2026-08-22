import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { CustomFunctionDefinition, parseConstantDefinition, Quantity, SavedConstant } from "@/lib/units";

const CONSTANTS_STORAGE_KEY = "si-unit-calculator.constants.v1";
const HISTORY_STORAGE_KEY = "si-unit-calculator.history.v1";
const FAVORITE_UNITS_STORAGE_KEY = "si-unit-calculator.favorite-units.v1";
const CUSTOM_FUNCTIONS_STORAGE_KEY = "si-unit-calculator.custom-functions.v1";
const TEMPLATES_STORAGE_KEY = "si-unit-calculator.templates.v1";
const NOTES_STORAGE_KEY = "si-unit-calculator.notes.v1";

export type SavedCalculation = {
  id: string;
  expression: string;
  resultText: string;
  quantity: Quantity;
  targetUnit: string;
  createdAt: string;
};

export type SavedCustomFunction = CustomFunctionDefinition & {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type CalculationTemplate = {
  id: string;
  title: string;
  description: string;
  expression: string;
  targetUnit: string;
  createdAt: string;
  updatedAt: string;
};

export type CalculationNoteStep = {
  id: string;
  title: string;
  expression: string;
  targetUnit: string;
};

export type CalculationNote = {
  id: string;
  title: string;
  description: string;
  steps: CalculationNoteStep[];
  createdAt: string;
  updatedAt: string;
};

type CalculatorStore = {
  constants: SavedConstant[];
  history: SavedCalculation[];
  favoriteUnits: string[];
  customFunctions: SavedCustomFunction[];
  templates: CalculationTemplate[];
  notes: CalculationNote[];
  isLoading: boolean;
  upsertConstant: (symbol: string, expression: string) => Promise<SavedConstant>;
  removeConstant: (symbol: string) => Promise<void>;
  addHistoryEntry: (entry: SavedCalculation) => Promise<void>;
  clearHistory: () => Promise<void>;
  toggleFavoriteUnit: (unit: string) => Promise<void>;
  upsertCustomFunction: (input: Omit<SavedCustomFunction, "id" | "createdAt" | "updatedAt"> & { id?: string }) => Promise<SavedCustomFunction>;
  removeCustomFunction: (id: string) => Promise<void>;
  upsertTemplate: (input: Omit<CalculationTemplate, "id" | "createdAt" | "updatedAt"> & { id?: string }) => Promise<CalculationTemplate>;
  removeTemplate: (id: string) => Promise<void>;
  upsertNote: (input: Omit<CalculationNote, "id" | "createdAt" | "updatedAt"> & { id?: string }) => Promise<CalculationNote>;
  removeNote: (id: string) => Promise<void>;
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

function isSavedCustomFunction(value: unknown): value is SavedCustomFunction {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedCustomFunction>;
  return typeof candidate.id === "string" && typeof candidate.name === "string" && Array.isArray(candidate.parameters) && candidate.parameters.every((parameter) => typeof parameter === "string") && typeof candidate.expression === "string" && typeof candidate.title === "string" && typeof candidate.description === "string" && typeof candidate.createdAt === "string" && typeof candidate.updatedAt === "string";
}

function isCalculationTemplate(value: unknown): value is CalculationTemplate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CalculationTemplate>;
  return typeof candidate.id === "string" && typeof candidate.title === "string" && typeof candidate.description === "string" && typeof candidate.expression === "string" && typeof candidate.targetUnit === "string" && typeof candidate.createdAt === "string" && typeof candidate.updatedAt === "string";
}

function isCalculationNote(value: unknown): value is CalculationNote {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CalculationNote>;
  return typeof candidate.id === "string" && typeof candidate.title === "string" && typeof candidate.description === "string" && Array.isArray(candidate.steps) && candidate.steps.every((step) => step && typeof step.id === "string" && typeof step.title === "string" && typeof step.expression === "string" && typeof step.targetUnit === "string") && typeof candidate.createdAt === "string" && typeof candidate.updatedAt === "string";
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
  const [constants, setConstants] = useState<SavedConstant[]>([]);
  const [history, setHistory] = useState<SavedCalculation[]>([]);
  const [favoriteUnits, setFavoriteUnits] = useState<string[]>([]);
  const [customFunctions, setCustomFunctions] = useState<SavedCustomFunction[]>([]);
  const [templates, setTemplates] = useState<CalculationTemplate[]>([]);
  const [notes, setNotes] = useState<CalculationNote[]>([]);
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

  const persistCustomFunctions = useCallback(async (next: SavedCustomFunction[]) => {
    setCustomFunctions(next);
    await AsyncStorage.setItem(CUSTOM_FUNCTIONS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const persistTemplates = useCallback(async (next: CalculationTemplate[]) => {
    setTemplates(next);
    await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const persistNotes = useCallback(async (next: CalculationNote[]) => {
    setNotes(next);
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(CONSTANTS_STORAGE_KEY),
      AsyncStorage.getItem(HISTORY_STORAGE_KEY),
      AsyncStorage.getItem(FAVORITE_UNITS_STORAGE_KEY),
      AsyncStorage.getItem(CUSTOM_FUNCTIONS_STORAGE_KEY),
      AsyncStorage.getItem(TEMPLATES_STORAGE_KEY),
      AsyncStorage.getItem(NOTES_STORAGE_KEY),
    ])
      .then(([constantsRaw, historyRaw, favoriteUnitsRaw, customFunctionsRaw, templatesRaw, notesRaw]) => {
        if (!active) return;
        setConstants(parseStoredArray(constantsRaw).filter(isSavedConstant));
        setHistory(parseStoredArray(historyRaw).filter(isSavedCalculation));
        setFavoriteUnits(parseStoredArray(favoriteUnitsRaw).filter((unit): unit is string => typeof unit === "string"));
        setCustomFunctions(parseStoredArray(customFunctionsRaw).filter(isSavedCustomFunction));
        setTemplates(parseStoredArray(templatesRaw).filter(isCalculationTemplate));
        setNotes(parseStoredArray(notesRaw).filter(isCalculationNote));
      })
      .catch(() => {
        if (!active) return;
        setConstants([]);
        setHistory([]);
        setFavoriteUnits([]);
        setCustomFunctions([]);
        setTemplates([]);
        setNotes([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const upsertConstant = useCallback(
    async (symbolInput: string, expressionInput: string) => {
      const symbol = symbolInput.trim();
      const expression = expressionInput.trim();
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

  const upsertCustomFunction = useCallback(async (input: Omit<SavedCustomFunction, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const now = new Date().toISOString();
    const existing = input.id ? customFunctions.find((item) => item.id === input.id) : undefined;
    const item: SavedCustomFunction = { ...input, id: existing?.id ?? `function-${Date.now()}`, createdAt: existing?.createdAt ?? now, updatedAt: now };
    const next = [...customFunctions.filter((entry) => entry.id !== item.id && entry.name !== item.name), item].sort((left, right) => left.title.localeCompare(right.title));
    await persistCustomFunctions(next);
    return item;
  }, [customFunctions, persistCustomFunctions]);

  const removeCustomFunction = useCallback(async (id: string) => {
    await persistCustomFunctions(customFunctions.filter((item) => item.id !== id));
  }, [customFunctions, persistCustomFunctions]);

  const upsertTemplate = useCallback(async (input: Omit<CalculationTemplate, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const now = new Date().toISOString();
    const existing = input.id ? templates.find((item) => item.id === input.id) : undefined;
    const item: CalculationTemplate = { ...input, id: existing?.id ?? `template-${Date.now()}`, createdAt: existing?.createdAt ?? now, updatedAt: now };
    const next = [...templates.filter((entry) => entry.id !== item.id), item].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    await persistTemplates(next);
    return item;
  }, [persistTemplates, templates]);

  const removeTemplate = useCallback(async (id: string) => {
    await persistTemplates(templates.filter((item) => item.id !== id));
  }, [persistTemplates, templates]);

  const upsertNote = useCallback(async (input: Omit<CalculationNote, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const now = new Date().toISOString();
    const existing = input.id ? notes.find((item) => item.id === input.id) : undefined;
    const item: CalculationNote = { ...input, id: existing?.id ?? `note-${Date.now()}`, createdAt: existing?.createdAt ?? now, updatedAt: now };
    const next = [...notes.filter((entry) => entry.id !== item.id), item].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    await persistNotes(next);
    return item;
  }, [notes, persistNotes]);

  const removeNote = useCallback(async (id: string) => {
    await persistNotes(notes.filter((item) => item.id !== id));
  }, [notes, persistNotes]);

  const value = useMemo(
    () => ({ constants, history, favoriteUnits, customFunctions, templates, notes, isLoading, upsertConstant, removeConstant, addHistoryEntry, clearHistory, toggleFavoriteUnit, upsertCustomFunction, removeCustomFunction, upsertTemplate, removeTemplate, upsertNote, removeNote }),
    [constants, history, favoriteUnits, customFunctions, templates, notes, isLoading, upsertConstant, removeConstant, addHistoryEntry, clearHistory, toggleFavoriteUnit, upsertCustomFunction, removeCustomFunction, upsertTemplate, removeTemplate, upsertNote, removeNote],
  );

  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export function useCalculatorStore() {
  const value = useContext(CalculatorContext);
  if (!value) throw new Error("CalculatorProvider の内部で使用してください。");
  return value;
}
