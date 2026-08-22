export type QuickShortcutId = "speed" | "pressure" | "samples" | "search";

export type CalculatorQuickShortcut = {
  expression?: string;
  targetUnit?: string;
  sampleCategory?: "basic";
  focusSearch?: boolean;
};

export function getCalculatorQuickShortcut(action: string | undefined): CalculatorQuickShortcut | null {
  if (action === "speed") return { expression: "1km ÷ 1min", targetUnit: "km/h" };
  if (action === "pressure") return { expression: "100N ÷ 0.01m²", targetUnit: "kPa" };
  if (action === "samples") return { sampleCategory: "basic" };
  if (action === "search") return { focusSearch: true };
  return null;
}
