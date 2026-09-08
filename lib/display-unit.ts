import { isUnitGroupVisible, isUnitVisible } from "@/lib/advanced-display";
import { getCompatibleUnitGroups, isDimensionless, parseUnit, type Dimension, type Quantity, type UnitSystem } from "@/lib/units";

export type DisplayUnitSource = "requested" | "expression" | "prefix" | "si";

export type DisplayUnitResolution = {
  /** 表示に使う単位記号。空文字はSI基本単位のまま表示する。 */
  unit: string;
  /** どの規則で決まったか（テストと、将来「自動で選ばれた」ことを画面に示すため）。 */
  source: DisplayUnitSource;
};

type ResolveDisplayUnitOptions = {
  quantity: Quantity;
  /** ユーザーが結果チップ等で明示的に選んだ表示単位。未選択なら空文字。 */
  requestedUnit: string;
  /** 式の中に現れた単位記号を出現順に並べたもの（lib/unit-input.ts の analyzeExpression の "unit" セグメント）。 */
  expressionUnits: string[];
  system: UnitSystem;
  isAdvancedMode: boolean;
};

function sameDimension(left: Dimension, right: Dimension): boolean {
  return left.every((value, index) => value === right[index]);
}

function unitMatchesDimension(symbol: string, dimension: Dimension): boolean {
  try {
    return sameDimension(parseUnit(symbol).dimension, dimension);
  } catch {
    return false;
  }
}

// 10のべき乗の倍率だけを「接頭語で読み替えた単位」とみなす。in や ft（0.3048）、km/h（1/3.6）、
// °C（オフセット付き）は同じ次元でも別の単位系なので、自動では選ばない。
function isPowerOfTenScale(scale: number): boolean {
  if (!(scale > 0)) return false;
  const exponent = Math.log10(scale);
  return Math.abs(exponent - Math.round(exponent)) < 1e-9;
}

/**
 * 結果の表示単位を決める。優先順は次のとおりで、上から順に最初に当たったものを使う。
 *
 * 1. ユーザーが明示的に選んだ単位（結果と同じ次元のときだけ）。次元が合わなくなったら
 *    エラーにせず黙って自動へ戻す。長さの計算の後に `255` や `1/3` を打ったときに
 *    「cmへ変換できません」と赤字が出て進数チップまで消えていたのは、この引き継ぎのせい。
 * 2. 式の中で最初に使った同じ次元の単位。`5cm + 1mm` は `5.1 cm` で読みたい
 *    （SIの `0.051 m` で出すと「電卓が勝手に単位を変えた」という第一印象になる）。
 * 3. 読みやすいSI接頭語。SI基本単位で 1〜1000 に収まらない値は、収まる接頭語付きの単位に
 *    寄せる（`12V / 4.7kΩ` は `0.00255 A` ではなく `2.55 mA`）。電験・電工の受験者が
 *    最も苦しんでいるのが k/m/μ の桁の読み替えなので、答えの側で先に接頭語を揃える。
 * 4. それ以外はSI基本単位のまま。
 *
 * 無次元の結果は常にSI（裸の数値）。`%` や `rad` を自動で付けると、比や角度でない
 * ただの数値（`255` や `1/3`）まで割合や角度として読まれてしまう。
 */
export function resolveDisplayUnit({ quantity, requestedUnit, expressionUnits, system, isAdvancedMode }: ResolveDisplayUnitOptions): DisplayUnitResolution {
  const requested = requestedUnit.trim();
  if (requested && unitMatchesDimension(requested, quantity.dimension)) return { unit: requested, source: "requested" };
  if (isDimensionless(quantity.dimension)) return { unit: "", source: "si" };

  const fromExpression = expressionUnits.find((symbol) => unitMatchesDimension(symbol, quantity.dimension));
  if (fromExpression) return { unit: fromExpression, source: "expression" };

  const prefixed = preferredPrefixedUnit(quantity, system, isAdvancedMode);
  if (prefixed) return { unit: prefixed, source: "prefix" };
  return { unit: "", source: "si" };
}

/**
 * 結果の次元に合う単位グループから「SIと整合する名前付きの単位」を選ぶ。
 *
 * - SI基本単位の値が 1〜1000 に収まるときは、倍率1・オフセット無しの単位（N・Pa・J・W・V・Ω…）。
 *   これが無いと力の結果が `19.6 m·kg/s²` と基本単位の積で出てしまう（Numbat が v1.23 で
 *   `J/s → W` の自動簡約を入れたのと同じ動機）。基本量（m・kg・s・A・K）は SI 表記と同じ文字列に
 *   なるだけなので害はない。
 * - 収まらないときは、1〜1000 に収まる接頭語付きの単位（`0.00255 A` → `mA`、`10000 Pa` → `kPa`）。
 *   候補は倍率が10のべき乗でオフセットを持たないものに限る（in・ft・km/h・°C は選ばない）。
 *   複数当たれば倍率が最も大きいもの（数字が最も小さくなるもの）。`0.051 m` なら `cm`（5.1）。
 * - 収まる接頭語が無ければ倍率1の単位へ戻す（`µA` で 2550000 と出すより `2.55 A` の方が読める）。
 *   それも無い合成次元は null（SI 表記のまま）。
 */
export function preferredPrefixedUnit(quantity: Quantity, system: UnitSystem, isAdvancedMode: boolean): string | null {
  void system;
  const magnitude = Math.abs(quantity.siValue);
  if (!Number.isFinite(magnitude)) return null;

  const candidates: { symbol: string; scale: number }[] = [];
  getCompatibleUnitGroups(quantity.dimension)
    .filter((group) => isUnitGroupVisible(group, isAdvancedMode))
    .forEach((group) => {
      const groupCandidates: { symbol: string; scale: number }[] = [];
      group.units.forEach((unitOption) => {
        if (!isUnitVisible(unitOption, isAdvancedMode)) return;
        let definition: ReturnType<typeof parseUnit>;
        try {
          definition = parseUnit(unitOption.symbol);
        } catch {
          return;
        }
        if (definition.offset || !isPowerOfTenScale(definition.scale)) return;
        groupCandidates.push({ symbol: unitOption.symbol, scale: definition.scale });
      });
      // **倍率1の単位を持たないグループは自動選択に使わない。** そのグループの単位は
      // 「SI単位を接頭語で読み替えたもの」ではなく別の計量習慣の単位なので、SIの値を
      // 勝手にその名前で呼ぶと誤解を招く。実際に燃費グループ（km/L は倍率1e6）を足した時点で、
      // 逆面積の結果が軒並み燃費として表示されていた（`1/(1mm²)` が「1 km/L」）。
      // 他のグループはすべてSI単位（N・Pa・m/s・kg/m³…）が倍率1で入っているので影響しない。
      if (!groupCandidates.some((candidate) => candidate.scale === 1)) return;
      groupCandidates.forEach((candidate) => {
        if (candidates.some((existing) => existing.scale === candidate.scale)) return;
        candidates.push(candidate);
      });
    });
  if (!candidates.length) return null;

  const coherent = candidates.find((candidate) => candidate.scale === 1) ?? null;
  if (magnitude === 0 || (magnitude >= 1 && magnitude < 1000)) return coherent?.symbol ?? null;

  let best: { symbol: string; scale: number } | null = null;
  candidates.forEach((candidate) => {
    const converted = magnitude / candidate.scale;
    if (converted < 1 || converted >= 1000) return;
    if (!best || candidate.scale > best.scale) best = candidate;
  });
  return best ? (best as { symbol: string }).symbol : coherent?.symbol ?? null;
}
