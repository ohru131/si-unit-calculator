import { compatibleUnitOptionsFromHints } from "@/lib/unit-options";
import { convertQuantity, formatNumberForLocale, type Quantity, type UnitSystem } from "@/lib/units";

export type UnitComparisonRow = {
  // 変換先の単位記号。表示単位の切り替え（applyTargetUnit）にそのまま渡せる表記。
  symbol: string;
  // 表に出す見栄え用のラベル。
  label: string;
  // ロケール整形済みの数値のみ。単位はlabel側に出すので含めない。
  value: string;
  // いま結果表示に使っている単位の行。
  isActive: boolean;
};

export type UnitComparisonOptions = {
  unitSystem: UnitSystem;
  // 「表示単位 → 式 → 実際に表示しているSI表記」の順に試す手掛かり。compatibleUnitOptionsFromHints にそのまま渡す。
  hints: (string | undefined)[];
  activeUnit?: string;
  locale?: string;
  limit?: number;
};

// 電卓の単位チップ列（app/(tabs)/index.tsxのconversionUnits）が.slice(0, 10)しているのに合わせる。
// この表は「チップ列を縦に開いたもの」として読ませたいので、件数の基準も揃えておく。
const DEFAULT_COMPARISON_LIMIT = 10;

export function buildUnitComparisonRows(quantity: Quantity | undefined, options: UnitComparisonOptions): UnitComparisonRow[] {
  if (!quantity) return [];

  const limit = options.limit ?? DEFAULT_COMPARISON_LIMIT;
  const activeUnit = options.activeUnit?.trim() || undefined;
  const candidates = compatibleUnitOptionsFromHints(quantity, options.unitSystem, options.hints, { limit });

  const rows: UnitComparisonRow[] = [];
  const seen = new Set<string>();
  const push = (symbol: string, label: string) => {
    if (seen.has(symbol)) return;
    try {
      const converted = convertQuantity(quantity, symbol, options.locale);
      seen.add(symbol);
      rows.push({ symbol, label, value: formatNumberForLocale(converted.value, options.locale), isActive: symbol === activeUnit });
    } catch {
      // compatibleUnitOptions のフォールバック経路は式中の表記をそのまま候補にするため、
      // 次元が合わない・解釈できない表記が混ざりうる。そのような候補は行に出さない。
    }
  };

  // activeUnit はユーザーが「その他」の単位ピッカーから選んだ、グループ一覧に載らない単位でも
  // 表に出したいので、候補一覧に無ければ先頭に1行だけ足す。label は記号そのものを使う
  // （候補側のような見栄え用ラベルの持ち合わせが無いため）。
  if (activeUnit && !candidates.some((candidate) => candidate.symbol === activeUnit)) {
    push(activeUnit, activeUnit);
  }
  candidates.forEach((candidate) => push(candidate.symbol, candidate.label));

  // activeUnit の追加分でlimitを超えた場合は、末尾（候補一覧の中で優先順位が低いもの）を
  // 落として帳尻を合わせる。先頭のactiveUnit行はユーザーが明示的に選んだ単位なので必ず残す。
  return rows.slice(0, limit);
}
