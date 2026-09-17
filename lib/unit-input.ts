import {
  findRegisteredUnit,
  NUMBER_TOKEN_PATTERN,
  getCompatibleUnitGroups,
  getGroupUnitsForSystem,
  getRegionalUnits,
  IDENTIFIER_BODY_CHAR_CLASS,
  IDENTIFIER_START_CHAR_CLASS,
  isUnitStart,
  parseUnit,
  UNIT_GROUPS,
  unitSuffixEnd,
  unitSearchText,
  type UnitGroup,
  type UnitOption,
  type UnitSystem,
} from "@/lib/units";
import { UnitError } from "@/lib/unit-errors";
// 選択範囲の正規化は入力欄の描画と同じ規則を使う（Androidは後ろから前へのドラッグで start > end
// のまま届くため）。expression-caret.ts がこのファイルを参照しているのは型だけなので、実行時の
// 循環にはならない。
import { normalizeSelection } from "@/lib/expression-caret";

/** 式の中の役割ごとに色分け・タップ操作を割り当てるための区分。 */
export type ExpressionSegmentKind = "number" | "unit" | "unknown-unit" | "identifier" | "unknown-identifier" | "operator" | "space";

export type ExpressionSegment = {
  text: string;
  kind: ExpressionSegmentKind;
  start: number;
  end: number;
  /** 別表記で書かれた単位の正式な記号。 */
  canonical?: string;
};

export type ExpressionAnalysis = {
  segments: ExpressionSegment[];
  /** 解釈できなかった単位・記号。修正候補の提示に使う。 */
  unresolved: ExpressionSegment[];
};

export type UnitSuggestion = {
  group: UnitGroup;
  unit: UnitOption;
  /** 一致した別表記。「hour → h」のような案内に使う。 */
  matchedAlias?: string;
};

export type UnitFilter = (group: UnitGroup, unitOption: UnitOption) => boolean;

export type UnitSuggestionOptions = {
  system: UnitSystem;
  limit?: number;
  includeUnit?: UnitFilter;
};

/**
 * 入力補助バーの役割。
 * fix は解釈できない単位の修正、complete は書きかけの単位の確定、
 * attach は数値へ単位を付ける操作、replace は末尾の単位を別の単位へ差し替える操作、
 * insert は任意位置への挿入を表す。
 */
export type UnitInputHintKind = "fix" | "complete" | "attach" | "replace" | "insert";

/** 接頭語キーで入れた1文字の居場所。「まだ単位を選んでいる途中」という意図は式の見た目からは
 * 復元できないので、画面側が状態として持ち、この記録が今も式と合っているかを毎回検証する。 */
export type PrefixEntry = {
  start: number;
  end: number;
  prefix: string;
};

export type UnitInputHint = {
  kind: UnitInputHintKind;
  /** 置き換え対象の文字列。挿入のみの場合は空。 */
  fragment: string;
  start: number;
  end: number;
  candidates: UnitSuggestion[];
};

const BUILT_IN_IDENTIFIERS = ["sin", "cos", "tan", "asin", "acos", "atan", "atan2", "sqrt", "ln", "log", "log2", "pi", "π", "e"];

// lib/units.ts の識別子文字集合（下付き文字・ギリシャ文字）と揃える。ここでは単位専用の記号
// （Ω・µ・μ・%・°）も同じ語の切り出しに使うため、識別子クラスへ追加で含めている。
const WORD_START_PATTERN = new RegExp(`[Ωµμ%°${IDENTIFIER_START_CHAR_CLASS}]`);
const WORD_BODY_PATTERN = new RegExp(`[Ωµμ%°⁰¹²³⁴⁵⁶⁷⁸⁹⁻^${IDENTIFIER_BODY_CHAR_CLASS}]`);
const NUMBER_START_PATTERN = /[0-9.]/;
// 複合単位の区切りとして扱う記号。評価器の normalize() が * と / へ書き換えるものと同じ集合。
const UNIT_SEPARATOR_PATTERN = /[*/×·÷]/;
const DEFINITION_PATTERN = new RegExp(`^\\s*([${IDENTIFIER_START_CHAR_CLASS}][${IDENTIFIER_BODY_CHAR_CLASS}]*)\\s*=`);

const DEFAULT_UNITS: Record<UnitSystem, string[]> = {
  metric: ["mm", "cm", "m", "km", "g", "kg", "s", "min", "h", "°C", "L", "m²"],
  us: ["in", "ft", "yd", "mi", "oz", "lb", "s", "min", "h", "°F", "gal", "ft²"],
  uk: ["mm", "m", "km", "mi", "g", "kg", "s", "min", "h", "°C", "L", "m²"],
};

// 評価器は数値と単位の間の空白を読み飛ばす（"3 m/s^2" も単位付きの数量）ので、
// 直前が空白区間のときは1つ手前まで遡って数値かどうかを見る。
function followsNumberAt(segments: ExpressionSegment[]) {
  const previousIndex = segments[segments.length - 1]?.kind === "space" ? segments.length - 2 : segments.length - 1;
  return segments[previousIndex]?.kind === "number";
}

function isUnitText(text: string) {
  try {
    parseUnit(text);
    return true;
  } catch {
    return false;
  }
}

function editDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left.length || !right.length) return Math.max(left.length, right.length);
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      const substitution = previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1);
      current[column] = Math.min(current[column - 1] + 1, previous[column] + 1, substitution);
    }
    previous = current;
  }
  return previous[right.length];
}

/**
 * 式を「数値」「単位」「定数」「演算子」に切り分ける。
 * 数値のすぐ後ろに続く語は単位として、それ以外の語は定数・関数を優先して判定する。
 */
export function analyzeExpression(input: string, identifiers: string[] = []): ExpressionAnalysis {
  const definitionMatch = input.match(DEFINITION_PATTERN);
  const knownIdentifiers = new Set([...identifiers, ...BUILT_IN_IDENTIFIERS, ...(definitionMatch ? [definitionMatch[1]] : [])]);
  const segments: ExpressionSegment[] = [];
  let index = 0;

  while (index < input.length) {
    const character = input[index];
    const start = index;

    if (/\s/.test(character)) {
      while (index < input.length && /\s/.test(input[index])) index += 1;
      segments.push({ text: input.slice(start, index), kind: "space", start, end: index });
      continue;
    }

    if (NUMBER_START_PATTERN.test(character)) {
      // 数値の切り出しは評価器と同じ規則（lib/units.ts の NUMBER_TOKEN_PATTERN）を使う。ここで独自に
      // 「[0-9.]の並び」を数値としていたため、2e-6C の指数部が e / - / 6 に割れて "e" が「使えない単位」
      // として赤く表示され、8.99e9N では e9N ごと不明な単位になっていた（エンジンは正しく計算できて
      // いるのに解析側だけが誤判定する食い違い）。規則を2箇所に持つとまたずれるので共有する。
      const numberMatch = input.slice(index).match(NUMBER_TOKEN_PATTERN);
      if (numberMatch) {
        index += numberMatch[0].length;
        segments.push({ text: numberMatch[0], kind: "number", start, end: index });
        continue;
      }
      // 単独の "." のように数値として成立しない断片。無限ループを避けるため1文字だけ進めて演算子扱いにする。
      index += 1;
      segments.push({ text: input.slice(start, index), kind: "operator", start, end: index });
      continue;
    }

    if (WORD_START_PATTERN.test(character)) {
      // 数値の直後（間の空白は無視）は、評価器が識別子より先に単位サフィックスとして貪欲に
      // 読む区間なので、こちらも同じ規則で丸ごと1区間にする。ここで識別子集合を先に見て語を
      // 切っていたため、定数 m を持つノートの "3m/s^2" が m（識別子）・/・s^2 に割れ、
      // 単位チップの差し替え範囲が s^2 だけになって "3m/G" ができてしまっていた。
      // followsNumberAt に加えてisUnitStartも見るのは、評価器（lib/units.ts）が
      // 数値直後を単位サフィックスとして貪欲に読むのはisUnitStartを満たす文字（英字・Ω・µ・μ・%・°）
      // のときだけだから。ここを揃えないと、πのように識別子文字クラスには入るが単位の先頭には
      // ならない文字（例: "2π"）まで単位サフィックスとして読もうとして、空文字の区間ができてしまう。
      if (followsNumberAt(segments) && isUnitStart(character)) {
        index = unitSuffixEnd(input, start);
        const text = input.slice(start, index);
        const registered = findRegisteredUnit(text);
        const computable = isUnitText(text);
        segments.push({ text, kind: computable ? "unit" : "unknown-unit", start, end: index, canonical: registered?.unit.symbol ?? (computable ? text : undefined) });
        continue;
      }

      index += 1;
      while (index < input.length && WORD_BODY_PATTERN.test(input[index])) index += 1;
      let word = input.slice(start, index);
      // "πrad"のように円周率記号πへ単位が直接続くと、識別子文字クラスの都合でπと単位が1語として
      // 貪欲にマッチしてしまう（詳細はlib/units.tsのtokenize()内の同趣旨コメントを参照）。
      // πは単体で使われるのがほとんどなので、πだけを切り出して残りは次の区間として扱う。
      // ただし"πrad"という名前の保存定数・自作関数が既にある場合は、それを優先して分割しない
      // （knownIdentifiersに完全一致する語をπ+残りへ勝手に割ると、保存値ではなくπ×radとして
      // 誤って解決されてしまう）。
      if (character === "π" && word.length > 1 && !knownIdentifiers.has(word)) {
        index = start + 1;
        word = "π";
      }
      // 「m/s」「N·m」のように、区切り記号を含む単位のまとまりも一区間として扱う。
      // 区切りの綴りは評価器の normalize() が受け付けるもの（* / × · ÷）に揃える。
      // 区切りの先が既知の識別子（定数名・手順の結果記号）のときは、単位側へ巻き込まない。
      if (!knownIdentifiers.has(word)) {
        while (UNIT_SEPARATOR_PATTERN.test(input[index] ?? "")) {
          let lookahead = index + 1;
          while (lookahead < input.length && WORD_BODY_PATTERN.test(input[lookahead])) lookahead += 1;
          if (lookahead === index + 1) break;
          if (knownIdentifiers.has(input.slice(index + 1, lookahead))) break;
          if (!isUnitText(input.slice(start, lookahead))) break;
          index = lookahead;
        }
      }
      const text = input.slice(start, index);
      const registered = findRegisteredUnit(text);

      // 計算できる表記だけを単位として扱い、「kmh」のような別表記は正式な記号への修正候補付きで示す。
      const computable = isUnitText(text);
      const canonical = registered?.unit.symbol ?? (computable ? text : undefined);

      if (knownIdentifiers.has(text)) segments.push({ text, kind: "identifier", start, end: index });
      else if (computable) segments.push({ text, kind: "unit", start, end: index, canonical });
      else segments.push({ text, kind: registered ? "unknown-unit" : "unknown-identifier", start, end: index, canonical });
      continue;
    }

    index += 1;
    segments.push({ text: character, kind: "operator", start, end: index });
  }

  return { segments, unresolved: segments.filter((segment) => segment.kind === "unknown-unit" || segment.kind === "unknown-identifier") };
}

/** 表記ゆれ・打ち間違いも拾って、登録済み単位の候補を近い順に返す。 */
export function getUnitSuggestions(query: string, options: UnitSuggestionOptions): UnitSuggestion[] {
  const { system, limit = 8, includeUnit } = options;
  const raw = query.trim();
  const normalized = raw.toLowerCase();
  if (!normalized) return [];

  const scored: { suggestion: UnitSuggestion; score: number; order: number }[] = [];
  let order = 0;

  UNIT_GROUPS.forEach((group) => {
    const prioritized = getRegionalUnits(group, system);
    group.units.forEach((unitOption) => {
      order += 1;
      if (includeUnit && !includeUnit(group, unitOption)) return;
      const symbol = unitOption.symbol.toLowerCase();
      const aliases = (unitOption.aliases ?? []).map((alias) => alias.toLowerCase());
      const tolerance = normalized.length <= 3 ? 1 : 2;

      let score = Number.POSITIVE_INFINITY;
      if (symbol === normalized) score = 0;
      else if (aliases.includes(normalized)) score = 1;
      else if (symbol.startsWith(normalized)) score = 2;
      else if (aliases.some((alias) => alias.startsWith(normalized))) score = 3;
      else if (unitSearchText(group, unitOption).includes(normalized)) score = 4;
      else if (editDistance(symbol, normalized) <= tolerance) score = 5;
      else if (aliases.some((alias) => editDistance(alias, normalized) <= tolerance)) score = 6;
      if (!Number.isFinite(score)) return;

      const matchedAlias = unitOption.aliases?.find((alias) => {
        const lowered = alias.toLowerCase();
        return lowered === normalized || lowered.startsWith(normalized) || editDistance(lowered, normalized) <= tolerance;
      });
      // **接頭語は大文字小文字で別物**（m=ミリ / M=メガ）なので、綴りがそのまま前方一致する
      // 候補を同スコア内で先に見せる。照合自体を大文字小文字を区別する形にはしない——
      // ここは打ち間違いも拾う場所で、"mpa" から MPa を出せなくなる。これが無いと
      // 接頭語キーで M を押した直後の候補が m・mm・mL・ms（＝ミリ側）で埋まる。
      // **綴り一致はスコアより強い。** そうしないと大文字小文字を無視した完全一致が勝ってしまい、
      // M を押した直後の1位が m（メートル）・k の1位が K（ケルビン）になる。逆に "mpa" のような
      // 綴りが崩れた入力では全候補が同じ扱いになるので、従来のスコア順がそのまま残る。
      const caseMismatch = unitOption.symbol.startsWith(raw) ? 0 : 1;
      // 地域の優先単位を同スコア内で先に見せる。
      const positioned = caseMismatch * 1000 + score * 100 + (prioritized.includes(unitOption) ? 0 : 1);
      scored.push({ suggestion: { group, unit: unitOption, matchedAlias }, score: positioned, order });
    });
  });

  return scored
    .sort((left, right) => left.score - right.score || left.order - right.order)
    .slice(0, limit)
    .map((entry) => entry.suggestion);
}

/** まだ入力が無いときに勧める、よく使う単位。直近に使った単位を優先する。 */
export function getCommonUnitSuggestions(system: UnitSystem, recentUnits: string[] = [], options: { limit?: number; includeUnit?: UnitFilter } = {}): UnitSuggestion[] {
  const { limit = 10, includeUnit } = options;
  const suggestions: UnitSuggestion[] = [];
  const seen = new Set<string>();

  const push = (symbol: string) => {
    if (seen.has(symbol)) return;
    const found = findRegisteredUnit(symbol);
    if (!found) return;
    if (includeUnit && !includeUnit(found.group, found.unit)) return;
    seen.add(symbol);
    suggestions.push({ group: found.group, unit: found.unit });
  };

  recentUnits.forEach(push);
  DEFAULT_UNITS[system].forEach(push);
  return suggestions.slice(0, limit);
}

/**
 * キャレットが指す「意味のある区間」を求める。
 * 式の末尾（末尾の空白も含む）にキャレットがあるときは、末尾の空白を無視して直前の
 * 意味のある区間を対象にする（末尾に空白を打っても差し替え対象がぶれないようにするため）。
 * それ以外は、区間の先頭より後ろ〜末尾までにキャレットがある区間（前の区間との境界は
 * 前側に属する）を対象にする。
 */
function segmentAtCaret(segments: ExpressionSegment[], caret: number): ExpressionSegment | undefined {
  const meaningful = segments.filter((segment) => segment.kind !== "space");
  if (!meaningful.length) return undefined;
  const wholeEnd = segments[segments.length - 1]?.end ?? 0;
  if (caret >= wholeEnd) return meaningful[meaningful.length - 1];
  return meaningful.find((segment) => segment.start < caret && caret <= segment.end);
}

/** 単位を挿入・差し替えする範囲を決める。単位の上なら丸ごと差し替え、数値の直後なら単位付けとして末尾へ、それ以外はキャレット位置へ挿入する。 */
function unitInsertionRange(target: ExpressionSegment | undefined, caret: number): { start: number; end: number } {
  if (target?.kind === "unit") return { start: target.start, end: target.end };
  if (target?.kind === "number") return { start: target.end, end: target.end };
  return { start: caret, end: caret };
}

/** ある単位と同じ次元の単位だけを、地域優先・直近使用優先で並べる。次元が解決できなければ空を返す（呼び出し側でよく使う単位へフォールバックする）。 */
export function getSameDimensionUnitSuggestions(unitText: string, options: { system: UnitSystem; recentUnits?: string[]; limit?: number; includeUnit?: UnitFilter }): UnitSuggestion[] {
  let dimension;
  try {
    dimension = parseUnit(unitText).dimension;
  } catch {
    return [];
  }
  return suggestionsForGroups(getCompatibleUnitGroups(dimension), options);
}

/**
 * 単位グループのidから、そのグループの単位を地域優先・直近使用優先で並べる。
 * 「式がこの次元を要求している」と分かっているときに使う（requiredUnitGroupFromError）。
 * 未知のid・空文字は空を返すので、呼び出し側でよく使う単位へフォールバックできる。
 */
export function getUnitGroupSuggestions(groupId: string, options: { system: UnitSystem; recentUnits?: string[]; limit?: number; includeUnit?: UnitFilter }): UnitSuggestion[] {
  const group = groupId ? UNIT_GROUPS.find((candidate) => candidate.id === groupId) : undefined;
  return suggestionsForGroups(group ? [group] : [], options);
}

/**
 * 単位グループの「分野」。接頭語キーを押した直後の候補を、式に既に出ている単位の分野へ寄せる
 * ために使う。
 *
 * **グループが同じかどうかだけでは役に立たない。** `12V / 4.7k` で欲しいのは kΩ だが、抵抗は
 * 電圧とは別のグループなので、グループ一致だけ見ると何も引き上げられない。「同じ分野で一緒に
 * 出てくるもの」をここで束ねる。
 * 1つのグループが複数の分野に属してよい（`energy`・`power` は電気でも熱でも使う）。
 * idは lib/units.ts の UNIT_GROUPS に実在するものだけを書くこと（綴り間違いは黙って無視される）。
 *
 * **並び順にも意味がある。** 同じ分野の中では、この配列の順がそのまま候補の順になる
 * （`12V / 4.7k` で欲しいのは kΩ なので、抵抗は電力・エネルギーより前に置く）。
 * UNIT_GROUPS の定義順に任せると kJ・kW が kΩ より先に出る。
 */
const UNIT_GROUP_CLUSTERS: readonly (readonly string[])[] = [
  // 電気・電子
  ["voltage", "current", "resistance", "power", "energy", "capacitance", "charge", "magneticFlux", "frequency"],
  // 力学・寸法
  ["length", "area", "volume", "mass", "force", "pressure", "velocity", "acceleration", "density", "springConstant", "areaMomentOfInertia"],
  // 熱
  ["temperature", "energy", "power", "specificHeatCapacity"],
  // 化学
  ["amount", "molarMass", "molarEnergy", "molarConcentration", "mass", "volume"],
];

/** 渡したグループと同じ分野に属するグループidと、その分野の中での順位（小さいほど先）。 */
export function relatedGroupRanks(groupIds: ReadonlySet<string>): Map<string, number> {
  const ranks = new Map<string, number>();
  UNIT_GROUP_CLUSTERS.forEach((cluster) => {
    if (!cluster.some((id) => groupIds.has(id))) return;
    cluster.forEach((id, index) => {
      const current = ranks.get(id);
      if (current === undefined || index < current) ranks.set(id, index);
    });
  });
  return ranks;
}

/**
 * 接頭語キーを押した直後の候補。**その接頭語で始まる単位を、記号の短い順**に並べる。
 *
 * 短い順にするのは、接頭語＋1文字の基本単位（mA・mV・mF・mW・mΩ・ms・mg・mL）が
 * 実際に打ちたいものなのに、`getUnitSuggestions` の並び（スコア→グループの定義順）では
 * 電流のグループが後ろにあるため `mA` が12件目までに入らなかったから。長さの `m/s`・
 * 時間の `min`・燃費の `mpg` のように「接頭語ではない m 始まり」は3文字以上なので自然に後ろへ回る。
 *
 * 記号そのものが単位でもある接頭語（`m`＝メートル・`G`＝標準重力）は完全一致を先頭に置く。
 * 接頭語キーをメートルの近道として押す人もいるので、候補から外すと打ち直しになる。
 *
 * **そのうえで、今の式から読める文脈を上に持ち上げる。** レールに並ぶのは8件なので、
 * `12V / 4.7k` と打っている人に km・kg を先に見せると、目当ての kΩ が枠から落ちる。
 * 優先順は 完全一致 → 直近に使った単位（新しい順）→ 式に出ている単位と同じグループ →
 * 同じ分野（UNIT_GROUP_CLUSTERS）→ 従来の並び。各段の中では従来の並びを保つ。
 */
export function getPrefixedUnitSuggestions(prefix: string, options: { system: UnitSystem; limit?: number; includeUnit?: UnitFilter; recentUnits?: string[]; contextUnits?: string[] }): UnitSuggestion[] {
  const { system, limit = 8, includeUnit, recentUnits = [], contextUnits = [] } = options;
  if (!prefix) return [];

  // 式に出ている単位のグループ。解決できない記号（定数名・書きかけの綴り）は黙って無視する。
  const contextGroupIds = new Set<string>();
  contextUnits.forEach((symbol) => {
    const found = findRegisteredUnit(symbol);
    if (found) contextGroupIds.add(found.group.id);
  });
  const clusterGroupRanks = relatedGroupRanks(contextGroupIds);

  const exact: UnitSuggestion[] = [];
  const prefixed: { suggestion: UnitSuggestion; tier: number; withinTier: number; decomposes: number; length: number; order: number }[] = [];
  let order = 0;

  UNIT_GROUPS.forEach((group) => {
    group.units.forEach((unitOption) => {
      order += 1;
      if (includeUnit && !includeUnit(group, unitOption)) return;
      if (!unitOption.symbol.startsWith(prefix)) return;
      if (unitOption.symbol === prefix) {
        exact.push({ group, unit: unitOption });
        return;
      }
      // **「その接頭語＋単位チップに出る単位」に分解できるものを先に出す。** 記号の長さだけで
      // 並べると、接頭語ではない同じ長さの記号（`mi`＝マイル・`m²`・`m³`）が mA・mV を押し出す。
      // 判定に `isBuiltInUnitSymbol` は使えない——あれは接頭辞分解も通すので `Gal` の残り `al` が
      // `a`(アト)+`l`(リットル) として真になり、ほぼ何でも「分解できる」ことになってしまう。
      const decomposes = findRegisteredUnit(unitOption.symbol.slice(prefix.length)) ? 0 : 1;
      // 直近に使った単位は「新しい順」がそのまま並び順になる（recentUnits の先頭が最新）。
      const recentRank = recentUnits.indexOf(unitOption.symbol);
      const clusterRank = clusterGroupRanks.get(group.id);
      const tier = recentRank >= 0 ? 0 : contextGroupIds.has(group.id) ? 1 : clusterRank !== undefined ? 2 : 3;
      // 直近に使った単位は新しい順、同じ分野の単位は分野の中の順位、それ以外は従来の並びに任せる。
      const withinTier = recentRank >= 0 ? recentRank : tier === 2 ? (clusterRank ?? 0) : 0;
      prefixed.push({ suggestion: { group, unit: unitOption }, tier, withinTier, decomposes, length: unitOption.symbol.length, order });
    });
  });

  void system;
  prefixed.sort((left, right) => left.tier - right.tier || left.withinTier - right.withinTier || left.decomposes - right.decomposes || left.length - right.length || left.order - right.order);
  return [...exact, ...prefixed.map((entry) => entry.suggestion)].slice(0, limit);
}

/**
 * 接頭語キーで入れた1文字が、今も「単位を選んでいる途中」として有効かを判定する。
 *
 * **式とキャレットが押した直後のままかを毎回確かめる**ので、あとから打ち換え・削除・全消しが
 * あっても勝手に復活しない（この検証があるので、状態を消す場所を各所に足す必要がない）。
 * 範囲選択中は無効にする——そのときのキーは「選択範囲の置き換え」であって接頭語の打ち直しでは
 * ないので、トグルとして扱うと選んだ範囲ではなく前に入れた1文字の方が消える。
 */
export function resolveActivePrefix(expression: string, selection: { start: number; end: number }, prefixEntry: PrefixEntry | null): string | null {
  if (!prefixEntry) return null;
  const { start, hasRange } = normalizeSelection(expression.length, selection.start, selection.end);
  if (hasRange) return null;
  if (start !== prefixEntry.end) return null;
  return expression.slice(prefixEntry.start, prefixEntry.end) === prefixEntry.prefix ? prefixEntry.prefix : null;
}

/**
 * 記録してある接頭語が、その式とキャレットのもとでまだ有効か。
 *
 * **無効になった瞬間に画面側が記録を捨てるための判定。** `resolveActivePrefix` は「今この瞬間に
 * 有効か」しか見ないので、記録を残したままにするとキャレットを離して戻すだけで復活してしまう
 * （`⌫` で式を編集したあとに戻ってきた場合は、利用者がもう接頭語を入れたつもりでいない位置の
 * 1文字をトグルが消す・差し替えることになる）。画面側は式・キャレットが変わるたびにこれで
 * 検査し、falseになったら `null` にする。**一度捨てたらキャレットが戻っても復活しない。**
 */
export function prefixEntryStillValid(prefixEntry: PrefixEntry | null, expression: string, selection: { start: number; end: number }): boolean {
  return prefixEntry !== null && resolveActivePrefix(expression, selection, prefixEntry) !== null;
}

/**
 * 接頭語キーをトグルとして押したときの結果。**同じキーなら取り消し（入れた1文字を消す）、
 * 別の接頭語キーならその場で差し替え**る。null は「トグルにならない＝通常の挿入として扱う」。
 *
 * そうしないと k を押し間違えた人が ⌫ を探すことになり、M へ変えたい人は kM というありえない
 * 綴りを作ってしまう（接頭語は単位の一部なので2つ並ぶことが無い）。
 * 渡す key は接頭語キー（PREFIX_KEYS）であることを呼び出し側が保証する。
 */
export function resolvePrefixKeyPress(options: { expression: string; selection: { start: number; end: number }; prefixEntry: PrefixEntry | null; key: string }): { expression: string; caret: number; prefixEntry: PrefixEntry | null } | null {
  const { expression, selection, prefixEntry, key } = options;
  if (!key) return null;
  const active = resolveActivePrefix(expression, selection, prefixEntry);
  if (!active || !prefixEntry) return null;
  const replacement = key === active ? "" : key;
  return {
    expression: replaceExpressionRange(expression, prefixEntry.start, prefixEntry.end, replacement),
    caret: prefixEntry.start + replacement.length,
    prefixEntry: replacement ? { start: prefixEntry.start, end: prefixEntry.start + replacement.length, prefix: replacement } : null,
  };
}

// 単位1因子ぶんの記号に使える文字。英字と単位専用の記号は評価器と同じ判定（`isUnitStart`）を
// 借り、そこに上付き数字（`m²`・`cm³`）だけを足す。**区切り（`*` `/`）・`^`・ASCIIの数字は
// 入れない**——それらは「次の因子」や指数であって、記号の一部ではない。
const UNIT_FACTOR_SUPERSCRIPT_PATTERN = /[⁰¹²³⁴⁵⁶⁷⁸⁹]/;
const isUnitFactorChar = (character: string | undefined) => Boolean(character) && (isUnitStart(character) || UNIT_FACTOR_SUPERSCRIPT_PATTERN.test(character as string));

/**
 * 接頭語キーで入れた1文字を、チップで確定するときに置き換える範囲。
 * **直後に単位が続いているなら、その単位まで含めて1つの範囲にする。**
 *
 * `3|m` のようにキャレットを単位の手前に置いて `k` を押すと式は `3km` になり、記録している
 * 範囲は `k` の1文字だけ。そのまま `km` チップを当てると `3kmm` になる（利用者から見れば
 * 「km を選んだのに m が余る」）。押した接頭語は**その直後の単位に掛けるつもり**で入れたもの
 * なので、確定の範囲も同じまとまりにする。
 *
 * 伸ばすのは**1因子ぶんだけ**。`3k|m/s` で `/s` まで飲み込むと、km/h を選んだ瞬間に分母が
 * 消えて意味が変わる（単位サフィックスは `*` `/` を跨いで貪欲に読むが、それは「評価器が
 * どこまでを1つの単位として読むか」の話で、差し替えたい範囲とは別）。
 *
 * **その一続きが登録済みの単位のときだけ伸ばす**（`findRegisteredUnit`。`isBuiltInUnitSymbol`
 * は接頭辞分解も通してしまうので使えない）。`3k|x` の `x` がローカル定数なら、伸ばすと
 * チップ1つで利用者の定数まで消える。
 *
 * **前方向へは決して伸ばさない。** 手前は接頭語より前に確定している式で、接頭語を選び直した
 * だけの操作が既に打った数値・単位を巻き込む理由が無い。
 */
export function resolvePrefixCompletionRange(expression: string, prefixEntry: PrefixEntry): { start: number; end: number } {
  const base = { start: prefixEntry.start, end: prefixEntry.end };
  let index = prefixEntry.end;
  while (isUnitFactorChar(expression[index])) index += 1;
  if (index === prefixEntry.end) return base;
  return findRegisteredUnit(expression.slice(prefixEntry.end, index)) ? { start: base.start, end: index } : base;
}

/**
 * パレットのチップをタップしたときに、式のどこを書き換えるかを決める。
 *
 * **`getUnitInputHint` の `fix` は、キャレットがどこにあっても式の中の最後の未解決の単位を指す**
 * （計算できない状態を隠さないため。キャレットの近くに無くても案内する）。文脈依存の候補を
 * 出しているうちはそれで良い——並んでいるのはその綴りの修正候補なので、押せば必ずそこを直す。
 * ところがパレットでカテゴリを選ぶと、レールに並ぶのは修正候補ではなく**そのカテゴリの単位**に
 * 変わるので、同じ範囲へ当てると `3 + 5mpa` のキャレットが `3` の直後にあるときに kPa を押しただけで
 * 離れた `5mpa` が `5kPa` に書き換わる（利用者は「今いる場所へ入る」と思って押している）。
 * そこでカテゴリ選択中だけは、キャレットが指摘の範囲の外にあるなら普通の挿入位置へ戻す。
 *
 * 明示的に赤い単位をタップした場合（fixSelection）はキャレットがその単位の上にあるので、
 * 従来どおり丸ごと差し替えになる。complete・replace・attach・insert も従来どおり。
 */
export function resolvePaletteTarget(options: { hint: UnitInputHint; expression: string; caret: number; identifiers?: string[]; hasPaletteGroup: boolean; analysis?: ExpressionAnalysis }): { kind: UnitInputHintKind; start: number; end: number } {
  const { hint, expression, caret, identifiers = [], hasPaletteGroup } = options;
  const fromHint = { kind: hint.kind, start: hint.start, end: hint.end };
  if (!hasPaletteGroup || hint.kind !== "fix") return fromHint;
  if (caret >= hint.start && caret <= hint.end) return fromHint;

  const analysis = options.analysis ?? analyzeExpression(expression, identifiers);
  const target = segmentAtCaret(analysis.segments, caret);
  const { start, end } = unitInsertionRange(target, caret);
  // ラベルは getUnitInputHint がこのキャレット位置に付けるものと同じにする
  // （単位の上なら差し替え・数値の直後なら単位付け・それ以外は挿入）。
  const kind: UnitInputHintKind = target?.kind === "unit" ? "replace" : target?.kind === "number" ? "attach" : "insert";
  return { kind, start, end };
}

// 押すと「次の項」へ移るキー。演算子・括弧・べき乗と、数学シートの関数（`sin(` のように
// `(` で終わる）が該当する。キーは1文字とは限らない（`×10^`・`atan2(`）ので末尾の1文字で見る。
const PALETTE_RESET_CHARACTERS = ["+", "-", "−", "*", "/", "×", "÷", "·", "(", ")", "^"];

/**
 * そのキーを押したら単位パレットのカテゴリ選択を解除する（＝文脈依存の「候補」へ戻す）か。
 *
 * **カテゴリは一度選ぶと解除する場所が無かった。** 長さを選んで cm を入れたあと `÷` を押しても
 * レールは長さの単位のままで、時間の単位を出すにはもう一度カテゴリを選び直すしか無い
 * （＝自動の絞り込みが二度と戻ってこない）。演算子を押した時点で書いているのは次の項なので、
 * そこで推測へ戻すと「必要なときだけ自分で選ぶ」形になる。
 *
 * **数字・小数点・`⌫`・キャレット移動・接頭語キーでは解除しない。** どれも同じ項を書いている
 * 途中の操作で、ここで解除すると選んだカテゴリが1文字打つたびに消える。
 */
export function shouldResetPaletteForKey(key: string): boolean {
  if (!key) return false;
  return PALETTE_RESET_CHARACTERS.includes(key[key.length - 1]);
}

/**
 * 単位パレット（カテゴリを選んで並べる行）の候補。**このグループの単位だけ**を、単位ピッカーと
 * 同じ並び（地域優先 → 表示モードの絞り込み）で返す。
 *
 * ボタンだけで単位を入れられるようにするための行なので、`getUnitInputHint` の文脈依存の候補とは
 * 役割が違う（あちらは「今のキャレット位置で何をしたいか」を推測する。こちらは利用者が明示的に
 * 選んだカテゴリを、推測を挟まずそのまま出す）。
 *
 * 接頭語キーを押した直後は、その接頭語で始まる単位だけに絞る（長さで `k` を押せば km）。
 * **絞った結果が空になったら、そのカテゴリの単位を丸ごと出す**（空のまま出すと、接頭語を押した
 * 瞬間にパレットが消えて押し直す以外に戻る道が無くなる）。ここでカテゴリを跨いだ接頭語候補へ
 * 落とすと、時間のチップを点けたまま kg・km・kPa が並ぶことになり、選んだカテゴリの表示と中身が
 * 食い違う。並んだ単位を押せば `complete` の範囲（＝入れた接頭語の1文字）ごと置き換わるので、
 * 接頭語を打ち直す手間も増えない。記号そのものが単位でもある接頭語（`m`＝メートル）は完全一致を
 * 先頭に置く（`getPrefixedUnitSuggestions` と同じ扱い。接頭語キーをメートルの近道に使う人が
 * 打ち直さずに済む）。
 */
export function getPaletteUnitSuggestions(
  group: UnitGroup | undefined,
  prefix: string,
  options: { system: UnitSystem; limit?: number; includeUnit?: UnitFilter },
): UnitSuggestion[] {
  const { system, limit, includeUnit } = options;
  if (!group) return [];

  const units = getGroupUnitsForSystem(group, system).filter((unitOption) => !includeUnit || includeUnit(group, unitOption));
  const withLimit = (list: UnitOption[]) => (limit === undefined ? list : list.slice(0, limit)).map((unit) => ({ group, unit }));
  if (!prefix) return withLimit(units);

  const matched = [
    ...units.filter((unitOption) => unitOption.symbol === prefix),
    ...units.filter((unitOption) => unitOption.symbol !== prefix && unitOption.symbol.startsWith(prefix)),
  ];
  if (!matched.length) return withLimit(units);
  return withLimit(matched);
}

function suggestionsForGroups(groups: readonly UnitGroup[], options: { system: UnitSystem; recentUnits?: string[]; limit?: number; includeUnit?: UnitFilter }): UnitSuggestion[] {
  const { system, recentUnits = [], limit = 8, includeUnit } = options;
  if (!groups.length) return [];

  const suggestions: UnitSuggestion[] = [];
  const seen = new Set<string>();
  const push = (group: UnitGroup, unitOption: UnitOption) => {
    if (seen.has(unitOption.symbol)) return;
    if (includeUnit && !includeUnit(group, unitOption)) return;
    seen.add(unitOption.symbol);
    suggestions.push({ group, unit: unitOption });
  };

  // 直近に使った同じ次元の単位を先に見せる。
  recentUnits.forEach((symbol) => {
    const found = findRegisteredUnit(symbol);
    if (found && groups.some((group) => group.id === found.group.id)) push(found.group, found.unit);
  });
  groups.forEach((group) => getGroupUnitsForSystem(group, system).forEach((unitOption) => push(group, unitOption)));
  return suggestions.slice(0, limit);
}

/**
 * 次元不一致のエラーから「式が要求している単位グループ」を1つ選ぶ。
 *
 * `2kg×9.8m/s²-5` のように裸の数値を足し引きしている式では、反対側の次元がそのまま
 * 「その数値に付けるべき単位」になる。エンジンは add/subtract で両辺のグループidを
 * エラーの params に載せているので（lib/units.ts の dimensionMismatchParams）、
 * 単位候補をそこから引ける。無次元でない側を選ぶのは、裸の数値の側が必ず無次元だから。
 *
 * 両辺とも次元を持つ式（`3m + 2kg`）では、どちらへ寄せたいのか決められないので何も返さない
 * （その場合キャレットは単位の上にあり、同じ次元での差し替え候補が出る経路になる）。
 * グループidが空の合成次元（`N·m²/C²`）も、並べられる単位の一覧が無いので返さない。
 */
export function requiredUnitGroupFromError(error: unknown): string | undefined {
  if (!(error instanceof UnitError) || error.code !== "dimensionMismatchAddSubtract") return undefined;
  const { leftGroup, rightGroup } = error.params;
  const sides = [leftGroup, rightGroup].filter((group): group is string => typeof group === "string");
  if (sides.length !== 2) return undefined;
  const dimensional = sides.filter((group) => group && group !== "dimensionless");
  return dimensional.length === 1 ? dimensional[0] : undefined;
}

/**
 * 今の式・キャレット位置に合わせた入力補助を決める。
 * 1. キャレット上（直後含む）に解釈できない単位があれば修正・補完、
 * 2. キャレット上の区間が単位なら（同じ次元の候補で）差し替え、
 * 3. キャレット上の区間が数値ならその直後へ単位付け、4. それ以外は挿入候補、の順に案内する。
 * caret を省略した場合は式の末尾（＝これまでの挙動）として扱う。
 */
export function getUnitInputHint(
  expression: string,
  options: { system: UnitSystem; recentUnits?: string[]; identifiers?: string[]; includeUnit?: UnitFilter; limit?: number; analysis?: ExpressionAnalysis; caret?: number; requiredGroup?: string; companionCandidates?: UnitSuggestion[] },
): UnitInputHint {
  const { system, recentUnits = [], identifiers = [], includeUnit, limit = 8, requiredGroup, companionCandidates } = options;
  const analysis = options.analysis ?? analyzeExpression(expression, identifiers);
  const caret = options.caret ?? expression.length;
  // 式が特定の次元を要求しているなら、その次元の単位を出す（requiredUnitGroupFromError）。
  // よく使う単位の一覧（m・km・g・s…）は「何を付けたいか分からないとき」の並びなので、
  // 2kg×9.8m/s²-5 のように付けるべき単位が力だと分かっている場面では見当違いになる。
  // 要求が読めない・その次元の単位を並べられないときは、掛け算・割り算の相手として実例から
  // 引いた候補（companionCandidates。lib/unit-context-suggestions.ts）を使い、それも無ければ
  // 従来どおりよく使う単位へ落とす。**次元の要求の方が強い**——あちらは式が数学的に要求して
  // いる次元そのもので、実例からの推測より確かなため。
  const insertHint = (start: number, kind: UnitInputHintKind): UnitInputHint => {
    const required = requiredGroup ? getUnitGroupSuggestions(requiredGroup, { system, recentUnits, limit, includeUnit }) : [];
    const companions = companionCandidates?.length ? companionCandidates.slice(0, limit) : [];
    return {
      kind,
      fragment: "",
      start,
      end: start,
      candidates: required.length ? required : companions.length ? companions : getCommonUnitSuggestions(system, recentUnits, { limit, includeUnit }),
    };
  };

  const target = segmentAtCaret(analysis.segments, caret);

  // 未定義の定数・関数参照（例: 履歴がまだ無い状態の a1）は「間違った単位」ではないため、
  // 単位の修正候補には含めない。キャレットが解釈できない単位の上にあればそれを優先し、
  // なければ式全体で最後に見つかった間違いを案内する（計算がまだできない状態を隠さないため）。
  const unresolvedUnits = analysis.unresolved.filter((segment) => segment.kind === "unknown-unit");
  const unresolved = (target?.kind === "unknown-unit" ? target : undefined) ?? unresolvedUnits[unresolvedUnits.length - 1];
  if (unresolved) {
    const candidates = getUnitSuggestions(unresolved.text, { system, limit, includeUnit });
    // まさに入力中（キャレットがその区間の直後）は「間違い」ではなく補完として案内する。
    const kind: UnitInputHintKind = unresolved.end === caret && candidates.length ? "complete" : "fix";
    return { kind, fragment: unresolved.text, start: unresolved.start, end: unresolved.end, candidates };
  }

  if (target?.kind === "number") return insertHint(target.end, "attach");
  // キャレットが単位の上（直後含む）のときは後ろへ足すと無意味な複合単位になるため、その単位ごと差し替える。
  // 差し替え候補は同じ次元の単位に絞り、地域優先の単位系に沿わせる（解決できなければよく使う単位へフォールバック）。
  if (target?.kind === "unit") {
    const dimensionCandidates = getSameDimensionUnitSuggestions(target.canonical ?? target.text, { system, recentUnits, limit, includeUnit });
    return {
      kind: "replace",
      fragment: target.text,
      start: target.start,
      end: target.end,
      candidates: dimensionCandidates.length ? dimensionCandidates : getCommonUnitSuggestions(system, recentUnits, { limit, includeUnit }),
    };
  }
  return insertHint(caret, "insert");
}

/** 式の一部を別の文字列へ差し替える。修正候補や補完候補の確定に使う。 */
export function replaceExpressionRange(expression: string, start: number, end: number, replacement: string): string {
  return `${expression.slice(0, start)}${replacement}${expression.slice(end)}`;
}

/** 単位ボタンを反映する位置（差し替え・単位付け・そのまま挿入のいずれか）を、キャレット位置から求める。 */
export function getUnitInsertionRange(expression: string, caret: number, identifiers: string[] = []): { start: number; end: number } {
  const target = segmentAtCaret(analyzeExpression(expression, identifiers).segments, caret);
  return unitInsertionRange(target, caret);
}

/**
 * 単位ボタンから式へ単位を反映する。キャレットが単位の上ならそれを差し替え、数値の直後なら
 * そこへ単位付け、それ以外はキャレット位置へそのまま挿入する。caret を省略した場合は式の末尾
 * （＝これまでの挙動）として扱う。
 */
export function insertUnitAtEnd(expression: string, symbol: string, identifiers: string[] = [], caret: number = expression.length): string {
  const { start, end } = getUnitInsertionRange(expression, caret, identifiers);
  return replaceExpressionRange(expression, start, end, symbol);
}
