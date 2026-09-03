import {
  findRegisteredUnit,
  NUMBER_TOKEN_PATTERN,
  getCompatibleUnitGroups,
  getGroupUnitsForSystem,
  getRegionalUnits,
  IDENTIFIER_BODY_CHAR_CLASS,
  IDENTIFIER_START_CHAR_CLASS,
  parseUnit,
  UNIT_GROUPS,
  unitSuffixEnd,
  unitSearchText,
  type UnitGroup,
  type UnitOption,
  type UnitSystem,
} from "@/lib/units";

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

export type UnitInputHint = {
  kind: UnitInputHintKind;
  /** 置き換え対象の文字列。挿入のみの場合は空。 */
  fragment: string;
  start: number;
  end: number;
  candidates: UnitSuggestion[];
};

const BUILT_IN_IDENTIFIERS = ["sin", "cos", "tan", "asin", "acos", "atan", "atan2", "sqrt", "ln", "log", "log2", "pi", "e"];

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
      if (followsNumberAt(segments)) {
        index = unitSuffixEnd(input, start);
        const text = input.slice(start, index);
        const registered = findRegisteredUnit(text);
        const computable = isUnitText(text);
        segments.push({ text, kind: computable ? "unit" : "unknown-unit", start, end: index, canonical: registered?.unit.symbol ?? (computable ? text : undefined) });
        continue;
      }

      index += 1;
      while (index < input.length && WORD_BODY_PATTERN.test(input[index])) index += 1;
      const word = input.slice(start, index);
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
  const normalized = query.trim().toLowerCase();
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
      // 地域の優先単位を同スコア内で先に見せる。
      const positioned = score * 10 + (prioritized.includes(unitOption) ? 0 : 1);
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
  const { system, recentUnits = [], limit = 8, includeUnit } = options;
  let dimension;
  try {
    dimension = parseUnit(unitText).dimension;
  } catch {
    return [];
  }
  const groups = getCompatibleUnitGroups(dimension);
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
 * 今の式・キャレット位置に合わせた入力補助を決める。
 * 1. キャレット上（直後含む）に解釈できない単位があれば修正・補完、
 * 2. キャレット上の区間が単位なら（同じ次元の候補で）差し替え、
 * 3. キャレット上の区間が数値ならその直後へ単位付け、4. それ以外は挿入候補、の順に案内する。
 * caret を省略した場合は式の末尾（＝これまでの挙動）として扱う。
 */
export function getUnitInputHint(
  expression: string,
  options: { system: UnitSystem; recentUnits?: string[]; identifiers?: string[]; includeUnit?: UnitFilter; limit?: number; analysis?: ExpressionAnalysis; caret?: number },
): UnitInputHint {
  const { system, recentUnits = [], identifiers = [], includeUnit, limit = 8 } = options;
  const analysis = options.analysis ?? analyzeExpression(expression, identifiers);
  const caret = options.caret ?? expression.length;
  const insertHint = (start: number, kind: UnitInputHintKind): UnitInputHint => ({
    kind,
    fragment: "",
    start,
    end: start,
    candidates: getCommonUnitSuggestions(system, recentUnits, { limit, includeUnit }),
  });

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
