export type QuickShortcutId = "speed" | "pressure" | "samples";

export type CalculatorQuickShortcut = {
  expression?: string;
  targetUnit?: string;
  sampleCategory?: "basic";
};

// 「単位を検索」のショートカット（focusSearch）は廃止した。行き先だった入力欄直下の検索パネルを
// やめ、単位はカテゴリ行＋レール（常時表示の単位パレット）から入れる形に一本化したため、
// 開く先そのものが無くなっている。ショートカットだけ残すと押しても何も起きないメニューになる。
export function getCalculatorQuickShortcut(action: string | undefined): CalculatorQuickShortcut | null {
  if (action === "speed") return { expression: "1km ÷ 1min", targetUnit: "km/h" };
  if (action === "pressure") return { expression: "100N ÷ 0.01m²", targetUnit: "kPa" };
  if (action === "samples") return { sampleCategory: "basic" };
  return null;
}
