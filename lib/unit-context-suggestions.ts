import { PRESET_NOTEBOOK_SEEDS } from "@/lib/notebook-formulas";
import { SAMPLE_CALCULATIONS } from "@/lib/sample-calculations";
import { analyzeExpression, relatedGroupRanks, type ExpressionAnalysis, type UnitFilter, type UnitSuggestion } from "@/lib/unit-input";
import { describeDimension, findRegisteredUnit, getGroupUnitsForSystem, parseUnit, UNIT_GROUPS, type UnitGroup, type UnitOption, type UnitSystem } from "@/lib/units";

/**
 * 1つの計算に一緒に出てきた単位の並び（登録済みの正式な記号・重複なし・出てきた順）。
 *
 * 「何と何が一緒に使われるか」だけを持つ最小の形にしてある。式そのものを持ち回ると、
 * 候補を出すたびに解析し直すことになり、かつ「履歴」「プリセット」「サンプル」で
 * 形の違うデータをそれぞれ別扱いする羽目になる。
 */
export type UnitExample = { symbols: string[] };

/** キャレットの直前の演算子と、その左側の項が持っていた単位。 */
export type UnitContext = {
  operator: "additive" | "multiplicative";
  leftSymbol: string;
  leftGroupId: string;
};

// キーパッドは × ÷ を入れるが、OSのキーボードからは * / も打てる（評価器の normalize() が
// どちらも受け付ける）ので両方を見る。− は U+2212（全角キーボード等から入ることがある）。
const ADDITIVE_OPERATORS = ["+", "-", "−"];
const MULTIPLICATIVE_OPERATORS = ["*", "/", "×", "÷", "·"];
// 左側の「項」の切れ目。これらを跨いだ先にある単位は、今書いている項の単位ではない
// （`1m+2×|` の m は `+` の向こう側なので、× の左側の次元は読めない＝候補を出さない）。
// `^` と `)` は跨いでよい——`(2m)^2×|` の左側は面積ではなく長さの累乗だが、どちらにせよ
// 「長さの分野の計算をしている」ことは読めるので手掛かりとして使う。
const OPERAND_BOUNDARY_OPERATORS = ["+", "-", "−", "(", ","];

/**
 * キャレットの直前にある演算子から、「今そこへ入れる単位」の手掛かりを読む。
 *
 * 走査の規則（テストで固定してある）:
 * 1. キャレットより手前で終わっている区間だけを見る。末尾の空白は読み飛ばす。
 * 2. 末尾が数値なら1つだけ跨ぐ（`1m+2|` は「その2に単位を付けようとしている」場面で、
 *    `1m+|` と同じ手掛かりが要る。requiredUnitGroupFromError が拾えるのは前者だけ）。
 * 3. そこにあるのが `+ -`（additive）か `* / × ÷ ·`（multiplicative）の演算子でなければ諦める。
 * 4. その演算子から手前へ歩いて**最初に見つかった単位**を左側の項の単位とする。ただし
 *    項の切れ目（`+ - ( ,`）に先に当たったら諦める。
 * 5. 合成単位（`kN*m`）のように登録済み単位として引けない記号も諦める（並べる候補が無い）。
 */
export function resolveUnitContext(options: { analysis: ExpressionAnalysis; caret: number }): UnitContext | null {
  const { analysis, caret } = options;
  const before = analysis.segments.filter((segment) => segment.end <= caret);
  let index = before.length - 1;
  while (index >= 0 && before[index].kind === "space") index -= 1;
  if (index >= 0 && before[index].kind === "number") {
    index -= 1;
    while (index >= 0 && before[index].kind === "space") index -= 1;
  }

  const operatorSegment = index >= 0 ? before[index] : undefined;
  if (!operatorSegment || operatorSegment.kind !== "operator") return null;
  const operator: UnitContext["operator"] | null = ADDITIVE_OPERATORS.includes(operatorSegment.text)
    ? "additive"
    : MULTIPLICATIVE_OPERATORS.includes(operatorSegment.text)
      ? "multiplicative"
      : null;
  if (!operator) return null;

  let cursor = index - 1;
  let leftUnit: (typeof before)[number] | undefined;
  while (cursor >= 0) {
    const segment = before[cursor];
    if (segment.kind === "unit") {
      leftUnit = segment;
      break;
    }
    if (segment.kind === "operator" && OPERAND_BOUNDARY_OPERATORS.includes(segment.text)) return null;
    cursor -= 1;
  }
  if (!leftUnit) return null;

  const symbol = leftUnit.canonical ?? leftUnit.text;
  const groupId = unitGroupIdForSymbol(symbol);
  if (!groupId) return null;
  return { operator, leftSymbol: findRegisteredUnit(symbol)?.unit.symbol ?? symbol.trim(), leftGroupId: groupId };
}

/**
 * 記号が属する単位グループのid。**単位チップに出る単位（`UnitOption`）でなくても引ける**のが
 * `findRegisteredUnit` との違い。
 *
 * `kWh` は `BASE_UNITS` に完全一致のキーが無く SI接頭語の分解でだけ解決する（＝`UnitOption` が
 * 無い）ので、登録済み単位としては引けないのにエンジンでは普通に計算できる。登録の有無だけで
 * 判断すると `1kWh÷` が「左側の次元が読めない」扱いになり、いちばん助けが要る場面
 * （電気料金・消費電力量の計算）で候補が出ない。次元まで落として同じ次元のグループを探す。
 *
 * 合成次元（`N·m²/C²` のように該当グループが無い）と無次元は、並べる単位の一覧が無いので
 * 未解決として扱う（`describeDimension` はそれぞれ `""` と `"dimensionless"` を返す）。
 */
export function unitGroupIdForSymbol(symbol: string): string | undefined {
  const source = symbol.trim();
  if (!source) return undefined;
  const found = findRegisteredUnit(source);
  if (found) return found.group.id;
  try {
    const group = describeDimension(parseUnit(source).dimension).group;
    return group && group !== "dimensionless" ? group : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 記号を正式な記号へ寄せて重複なく足す。引けない記号（定数名・合成単位）は黙って捨てる。
 *
 * **次元でしか引けない記号（`kWh`）は綴りのまま残す。** 候補のチップとしては出せない
 * （対応する `UnitOption` が無い）が、「電力量と一緒に何が使われるか」という**グループの
 * 数え上げには効く**ので、ここで捨てると `1kWh÷` の候補が実例から引けなくなる。
 */
function pushSymbol(symbols: string[], raw: string | undefined) {
  if (!raw || !raw.trim()) return;
  const found = findRegisteredUnit(raw);
  const symbol = found ? found.unit.symbol : unitGroupIdForSymbol(raw) ? raw.trim() : undefined;
  if (!symbol) return;
  if (!symbols.includes(symbol)) symbols.push(symbol);
}

function pushExpressionUnits(symbols: string[], expression: string) {
  analyzeExpression(expression).segments.forEach((segment) => {
    if (segment.kind === "unit") pushSymbol(symbols, segment.canonical ?? segment.text);
  });
}

/**
 * 計算履歴を「一緒に使われた単位」の例に変える。**新しい順のまま**返す（履歴の並びがそのまま
 * 候補の優先順になる＝直前に自分がやった計算と同じ組み合わせが先頭に出る）。
 */
export function unitExamplesFromHistory(history: ReadonlyArray<{ expression: string; targetUnit: string }>): UnitExample[] {
  const examples: UnitExample[] = [];
  history.forEach((entry) => {
    const symbols: string[] = [];
    pushExpressionUnits(symbols, entry.expression);
    // 表示単位は「その計算の答えの単位」なので、式の単位と同じ1つの例に含める
    // （`12V / 4.7kΩ` を mA で見た履歴から、電圧の隣に電流を出せるようになる）。
    pushSymbol(symbols, entry.targetUnit);
    if (symbols.length) examples.push({ symbols });
  });
  return examples;
}

// プリセットは起動中に変わらないので、最初に候補を出すときに1度だけ組み立てて使い回す。
// **import時に組み立てないこと**——194件のノートを解析するので、この機能を一度も使わない
// 起動（ノート画面だけを見るなど）にまで初期化の時間を払わせることになる。
let presetUnitExamples: UnitExample[] | null = null;

/**
 * プリセット計算ノートとサンプルから作る「単位の組み合わせ」の例。**計算履歴が無いときの
 * 代わり**として使う（初めて使う人にも `12V ÷ ` で Ω・A が出る）。
 *
 * **1つの次元しか出てこない例は捨てる**（`5cm + 1mm` は「長さと何が組むか」を何も語らない）。
 */
export function getPresetUnitExamples(): UnitExample[] {
  if (presetUnitExamples) return presetUnitExamples;
  const examples: UnitExample[] = [];
  const add = (symbols: string[]) => {
    const groupIds = new Set<string>();
    symbols.forEach((symbol) => {
      const groupId = unitGroupIdForSymbol(symbol);
      if (groupId) groupIds.add(groupId);
    });
    if (groupIds.size < 2) return;
    examples.push({ symbols });
  };

  Object.values(PRESET_NOTEBOOK_SEEDS).forEach((seeds) => {
    seeds.forEach((seed) => {
      const symbols: string[] = [];
      // 手順の式は識別子（定数名）だけで組まれているので、単位が書かれているのは
      // ローカル定数の式と手順の表示単位の2箇所だけ。
      seed.localConstants.forEach((constant) => pushExpressionUnits(symbols, constant.expression));
      seed.steps.forEach((step) => pushSymbol(symbols, step.targetUnit));
      add(symbols);
    });
  });

  SAMPLE_CALCULATIONS.forEach((sample) => {
    const symbols: string[] = [];
    pushExpressionUnits(symbols, sample.expression);
    pushSymbol(symbols, sample.targetUnit);
    add(symbols);
  });

  presetUnitExamples = examples;
  return examples;
}

/** 例の中の記号を「グループid付き」に開く。次元でしか引けない記号（kWh）は単位を持たない。 */
function resolveExampleSymbols(example: UnitExample) {
  return example.symbols
    .map((symbol) => ({ symbol, groupId: unitGroupIdForSymbol(symbol), registered: findRegisteredUnit(symbol) }))
    .filter((entry): entry is { symbol: string; groupId: string; registered: ReturnType<typeof findRegisteredUnit> } => Boolean(entry.groupId));
}

/**
 * 実例から「左側の単位と一緒に使われる単位・グループ」を順位づけする。
 *
 * **2つの並べ方を使い分ける。**
 * - `recency`（計算履歴）: 出てきた順＝新しい順。直前に自分がやった計算がそのまま先頭に来る。
 * - `frequency`（プリセット・サンプル）: **何件の例に出てくるか**の多い順（同数なら先に出てきた順）。
 *   こちらは「たまたま最初に当たった1件」に引きずられてはいけない——プリセットを先頭から
 *   出てきた順で拾うと `12V ÷ ` の候補が A・s・kJ・Ω になり、1件の例にしか出てこない秒・
 *   キロジュールが、16件に出てくるアンペアのすぐ隣に並んでしまう。
 *
 * 次元でしか引けない記号（`kWh`）は**グループの数え上げにだけ効かせる**（チップとして出せる
 * `UnitOption` が無いため）。そのグループが上位に来れば、下のグループ埋めが Wh・J・kWh のような
 * 同じグループの単位を並べてくれる。
 */
function rankExamples(examples: readonly UnitExample[], leftGroupId: string, order: "recency" | "frequency") {
  const units: { group: UnitGroup; unit: UnitOption; count: number; order: number }[] = [];
  const groups: { id: string; count: number; order: number }[] = [];

  examples.forEach((example) => {
    const resolved = resolveExampleSymbols(example);
    if (!resolved.some((entry) => entry.groupId === leftGroupId)) return;
    // 1つの例の中で同じ記号・同じグループを二重に数えない（「何件の例に出てくるか」を数えるため）。
    const countedSymbols = new Set<string>();
    const countedGroups = new Set<string>();
    resolved.forEach((entry) => {
      if (entry.groupId === leftGroupId) return;
      if (!countedGroups.has(entry.groupId)) {
        countedGroups.add(entry.groupId);
        const existing = groups.find((group) => group.id === entry.groupId);
        if (existing) existing.count += 1;
        else groups.push({ id: entry.groupId, count: 1, order: groups.length });
      }
      if (!entry.registered || countedSymbols.has(entry.symbol)) return;
      countedSymbols.add(entry.symbol);
      const existing = units.find((unit) => unit.unit.symbol === entry.registered!.unit.symbol);
      if (existing) existing.count += 1;
      else units.push({ group: entry.registered.group, unit: entry.registered.unit, count: 1, order: units.length });
    });
  });

  if (order === "frequency") {
    units.sort((left, right) => right.count - left.count || left.order - right.order);
    groups.sort((left, right) => right.count - left.count || left.order - right.order);
  }
  return { units, groupIds: groups.map((group) => group.id) };
}

/**
 * 掛け算・割り算の直後に出す候補。**「この単位と一緒に使われるのは何か」を実例から引く。**
 *
 * `12V ÷ ` で欲しいのは kΩ や mA だが、これらは電圧とは別のグループなので「同じ次元」でも
 * 「同じグループ」でも引けない。分野（UNIT_GROUP_CLUSTERS）まで広げると今度は電気の単位が
 * 順不同で並ぶ。**実際に一緒に計算されている組み合わせ**を見るのがいちばん外さない。
 *
 * 実例は2段構え。`recentExamples`（計算履歴・新しい順）は**その人が実際にやった計算**なので
 * 順番ごと信用し、`corpusExamples`（プリセット計算ノートとサンプル）は**件数の多い組み合わせ**
 * を信用する（履歴がまだ無い人への代わり。詳細は rankExamples）。
 *
 * 並べる順:
 * 1. 直近に使った単位のうち、実例が引き上げたグループに属するもの
 * 2. 履歴の例に出てきた単位（新しい順）
 * 3. プリセット・サンプルの例に出てきた単位（件数の多い順）
 * 4. 上で引き上げたグループ（履歴 → プリセットの順、重複は除く）から1巡3件ずつ
 *    （2番目のグループが8枠に入る前に1番目のグループで埋め尽くされないようにするため）
 * 5. それでも足りなければ同じ分野のグループ（relatedGroupRanks）から同じ規則で
 *
 * 左側と同じグループの単位は出さない（`12V ÷ ` で V・mV を並べても打ちたいものではない）。
 */
export function suggestCompanionUnits(options: {
  leftGroupId: string;
  recentExamples: readonly UnitExample[];
  corpusExamples: readonly UnitExample[];
  system: UnitSystem;
  recentUnits?: string[];
  limit: number;
  includeUnit?: UnitFilter;
}): UnitSuggestion[] {
  const { leftGroupId, recentExamples, corpusExamples, system, recentUnits = [], limit, includeUnit } = options;
  if (!leftGroupId || limit <= 0) return [];

  const suggestions: UnitSuggestion[] = [];
  const seen = new Set<string>();
  const push = (group: UnitGroup, unitOption: UnitOption) => {
    if (suggestions.length >= limit) return false;
    if (group.id === leftGroupId) return false;
    if (seen.has(unitOption.symbol)) return false;
    if (includeUnit && !includeUnit(group, unitOption)) return false;
    seen.add(unitOption.symbol);
    suggestions.push({ group, unit: unitOption });
    return true;
  };

  const recent = rankExamples(recentExamples, leftGroupId, "recency");
  const corpus = rankExamples(corpusExamples, leftGroupId, "frequency");
  const rankedGroupIds = [...recent.groupIds, ...corpus.groupIds.filter((id) => !recent.groupIds.includes(id))];

  // 直近に使った単位は、例が引き上げたグループの中にあるものだけ先頭へ寄せる。分野の外の単位まで
  // 引き上げると、`12V ÷ ` の1件目が直前に打った km になって文脈の手掛かりが消える。
  recentUnits.forEach((symbol) => {
    const found = findRegisteredUnit(symbol);
    if (found && rankedGroupIds.includes(found.group.id)) push(found.group, found.unit);
  });
  recent.units.forEach((entry) => push(entry.group, entry.unit));
  corpus.units.forEach((entry) => push(entry.group, entry.unit));

  const fillFromGroups = (groupIds: readonly string[]) => {
    const pools = groupIds
      .map((id) => UNIT_GROUPS.find((group) => group.id === id))
      .filter((group): group is UnitGroup => Boolean(group))
      .map((group) => ({ group, units: getGroupUnitsForSystem(group, system), index: 0 }));
    let consumed = true;
    while (suggestions.length < limit && consumed) {
      consumed = false;
      for (const pool of pools) {
        let added = 0;
        while (added < 3 && pool.index < pool.units.length && suggestions.length < limit) {
          const unitOption = pool.units[pool.index];
          pool.index += 1;
          consumed = true;
          if (push(pool.group, unitOption)) added += 1;
        }
        if (suggestions.length >= limit) break;
      }
    }
  };

  fillFromGroups(rankedGroupIds);
  if (suggestions.length < limit) {
    const ranks = relatedGroupRanks(new Set([leftGroupId]));
    const clusterGroupIds = Array.from(ranks.entries())
      .filter(([id]) => id !== leftGroupId && !rankedGroupIds.includes(id))
      .sort((left, right) => left[1] - right[1])
      .map(([id]) => id);
    fillFromGroups(clusterGroupIds);
  }
  return suggestions;
}
