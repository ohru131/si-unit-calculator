import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { parseConstantDefinition, Quantity, SavedConstant } from "@/lib/units";

const CONSTANTS_STORAGE_KEY = "si-unit-calculator.constants.v1";
const HISTORY_STORAGE_KEY = "si-unit-calculator.history.v1";

export type SavedCalculation = {
  id: string;
  expression: string;
  resultText: string;
  quantity: Quantity;
  targetUnit: string;
  createdAt: string;
};

type CalculatorStore = {
  constants: SavedConstant[];
  history: SavedCalculation[];
  isLoading: boolean;
  upsertConstant: (symbol: string, expression: string) => Promise<SavedConstant>;
  removeConstant: (symbol: string) => Promise<void>;
  addHistoryEntry: (entry: SavedCalculation) => Promise<void>;
  clearHistory: () => Promise<void>;
};

const CalculatorContext = createContext<CalculatorStore | null>(null);

function isSavedConstant(value: unknown): value is SavedConstant {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedConstant>;
  return (
    typeof candidate.symbol === "string" &&
    typeof candidate.expression === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.quantity?.siValue === "number" &&
    Array.isArray(candidate.quantity.dimension) &&
    candidate.quantity.dimension.length === 7
  );
}

function isSavedCalculation(value: unknown): value is SavedCalculation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedCalculation>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.expression === "string" &&
    typeof candidate.resultText === "string" &&
    typeof candidate.targetUnit === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.quantity?.siValue === "number" &&
    Array.isArray(candidate.quantity.dimension) &&
    candidate.quantity.dimension.length === 7
  );
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
  const [isLoading, setIsLoading] = useState(true);

  const persistConstants = useCallback(async (next: SavedConstant[]) => {
    setConstants(next);
    await AsyncStorage.setItem(CONSTANTS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const persistHistory = useCallback(async (next: SavedCalculation[]) => {
    setHistory(next);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem(CONSTANTS_STORAGE_KEY), AsyncStorage.getItem(HISTORY_STORAGE_KEY)])
      .then(([constantsRaw, historyRaw]) => {
        if (!active) return;
        setConstants(parseStoredArray(constantsRaw).filter(isSavedConstant));
        setHistory(parseStoredArray(historyRaw).filter(isSavedCalculation));
      })
      .catch(() => {
        if (!active) return;
        setConstants([]);
        setHistory([]);
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
      const nextItem: SavedConstant = {
        ...parsed,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      await persistConstants([...others, nextItem].sort((left, right) => left.symbol.localeCompare(right.symbol)));
      return nextItem;
    },
    [constants, persistConstants],
  );

  const removeConstant = useCallback(
    async (symbol: string) => {
      await persistConstants(constants.filter((item) => item.symbol !== symbol));
    },
    [constants, persistConstants],
  );

  const addHistoryEntry = useCallback(
    async (entry: SavedCalculation) => {
      const next = [entry, ...history.filter((item) => item.expression !== entry.expression)].slice(0, 20);
      await persistHistory(next);
    },
    [history, persistHistory],
  );

  const clearHistory = useCallback(async () => {
    await persistHistory([]);
  }, [persistHistory]);

  const value = useMemo(
    () => ({ constants, history, isLoading, upsertConstant, removeConstant, addHistoryEntry, clearHistory }),
    [constants, history, isLoading, upsertConstant, removeConstant, addHistoryEntry, clearHistory],
  );

  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export function useCalculatorStore() {
  const value = useContext(CalculatorContext);
  if (!value) throw new Error("CalculatorProvider の内部で使用してください。");
  return value;
}

