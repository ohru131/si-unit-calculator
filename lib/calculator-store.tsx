import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { parseConstantDefinition, SavedConstant } from "@/lib/units";

const STORAGE_KEY = "si-unit-calculator.constants.v1";

type CalculatorStore = {
  constants: SavedConstant[];
  isLoading: boolean;
  upsertConstant: (symbol: string, expression: string) => Promise<SavedConstant>;
  removeConstant: (symbol: string) => Promise<void>;
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

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [constants, setConstants] = useState<SavedConstant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const persist = useCallback(async (next: SavedConstant[]) => {
    setConstants(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setConstants(parsed.filter(isSavedConstant));
      })
      .catch(() => {
        if (active) setConstants([]);
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
      await persist([...others, nextItem].sort((left, right) => left.symbol.localeCompare(right.symbol)));
      return nextItem;
    },
    [constants, persist],
  );

  const removeConstant = useCallback(
    async (symbol: string) => {
      await persist(constants.filter((item) => item.symbol !== symbol));
    },
    [constants, persist],
  );

  const value = useMemo(
    () => ({ constants, isLoading, upsertConstant, removeConstant }),
    [constants, isLoading, upsertConstant, removeConstant],
  );

  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export function useCalculatorStore() {
  const value = useContext(CalculatorContext);
  if (!value) throw new Error("CalculatorProvider の内部で使用してください。");
  return value;
}

