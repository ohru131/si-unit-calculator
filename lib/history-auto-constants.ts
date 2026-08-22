import type { SavedCalculation } from "@/lib/calculator-store";
import type { SavedConstant } from "@/lib/units";

export function historyToAutoConstants(history: SavedCalculation[]): SavedConstant[] {
  return history.map((entry, index) => ({
    symbol: `a${index + 1}`,
    expression: entry.expression,
    quantity: entry.quantity,
    createdAt: entry.createdAt,
  }));
}
