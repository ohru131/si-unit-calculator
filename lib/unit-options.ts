import { analyzeExpression } from "@/lib/unit-input";
import { findRegisteredUnit, getCompatibleUnitGroups, getGroupUnitsForSystem, parseUnit, type Quantity, type UnitSystem } from "@/lib/units";

export type UnitChoice = { symbol: string; label: string };

// 既存のcompatibleUnitsFor（notebook-detail.tsx）が.slice(0, 14)していたのに合わせる。
const DEFAULT_LIMIT = 14;

/**
 * 入力欄の下に出す単位チップの候補。
 * quantity が undefined／次元に対応するグループが無い場合でも、expression に含まれる単位から
 * 候補を組み立てる（クーロンの法則の k のような合成次元でチップが0件になるのを防ぐ）。
 */
export function compatibleUnitOptions(quantity: Quantity | undefined, unitSystem: UnitSystem, options?: { expression?: string; limit?: number }): UnitChoice[] {
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const collected: UnitChoice[] = [];
  const seen = new Set<string>();
  const push = (symbol: string, label: string) => {
    if (seen.has(symbol)) return;
    seen.add(symbol);
    collected.push({ symbol, label });
  };

  if (quantity) {
    getCompatibleUnitGroups(quantity.dimension).forEach((group) => {
      getGroupUnitsForSystem(group, unitSystem).forEach((unitOption) => push(unitOption.symbol, unitOption.label));
    });
  }
  // 名前の付いた次元グループで候補が見つかったときはそれを優先し、フォールバックはしない。
  if (collected.length) return collected.slice(0, limit);

  // ここから先はフォールバック: 次元に対応するグループが無い合成次元（クーロンの法則のk＝N・m²/C²など）
  // のための処置。式の中に実際に書かれている単位を手掛かりに、SI接頭辞違いの候補を組み立てる。
  const expression = options?.expression;
  if (!expression) return collected;

  const unitSegments = analyzeExpression(expression).segments.filter((segment) => segment.kind === "unit");
  for (const segment of unitSegments) {
    // canonical は kind==="unit" の区間には必ず入る（別表記で登録済みならその正式記号、
    // 複合単位など未登録でも計算可能な表記ならその文字列そのもの）。
    const text = segment.canonical ?? segment.text;
    const registered = findRegisteredUnit(text);
    if (registered) {
      // 登録済みの単位（例: "N", "kg", "C"）なら、そのグループの単位一覧
      // （地域優先・接頭辞違いを含む）をまるごと候補にする。
      getGroupUnitsForSystem(registered.group, unitSystem).forEach((unitOption) => push(unitOption.symbol, unitOption.label));
      continue;
    }
    // 登録済みグループの無い複合単位（例: "N*m^2/C^2"、"kcal/kg/h"）は、接頭辞の付け替えに
    // 意味が無いため、今使われている表記そのものを1件だけ候補にする。
    try {
      parseUnit(text);
      push(text, text);
    } catch {
      // 単位として解釈できない区間（識別子・数値の断片など）は無視する。
    }
  }

  return collected.slice(0, limit);
}

/**
 * 手掛かりを優先順に試して、最初に候補が得られたものを採用する。
 *
 * なぜ必要か: 合成次元（名前の付いた単位グループが無い量）の候補は「式や表示単位に実際に書かれて
 * いる単位」から組み立てるが、手掛かりが1つだけだとそこに単位が書かれていないときに0件になる。
 * 例えば `v0*a`（識別子だけの式）で表示単位も未指定だと、結果は `10 m²/s³` と表示できているのに
 * 候補が0件になり、呼び出し側は単位レールごと（SIへ戻すチップも含めて）出せなくなる。
 * そこで「表示単位 → 式 → 実際に表示しているSI表記」の順に試せるようにする。
 *
 * 判定を呼び出し側の条件分岐で書くとテストが同じ手順を手で再現するだけになるため、ここに置く。
 */
export function compatibleUnitOptionsFromHints(
  quantity: Quantity | undefined,
  unitSystem: UnitSystem,
  hints: (string | undefined)[],
  options?: { limit?: number },
): UnitChoice[] {
  // 次元グループがあるときは手掛かりに関係なく同じ結果になるので、最初の1回で確定する。
  for (const hint of hints) {
    if (!hint?.trim()) continue;
    const found = compatibleUnitOptions(quantity, unitSystem, { expression: hint, limit: options?.limit });
    if (found.length) return found;
  }
  // どの手掛かりでも見つからなかったときは、グループだけで引ける分（通常は空）を返す。
  return compatibleUnitOptions(quantity, unitSystem, { limit: options?.limit });
}
