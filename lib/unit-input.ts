import {
  findRegisteredUnit,
  getRegionalUnits,
  IDENTIFIER_BODY_CHAR_CLASS,
  IDENTIFIER_START_CHAR_CLASS,
  parseUnit,
  UNIT_GROUPS,
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
const NUMBER_PATTERN = /[0-9.]/;
const DEFINITION_PATTERN = new RegExp(`^\\s*([${IDENTIFIER_START_CHAR_CLASS}][${IDENTIFIER_BODY_CHAR_CLASS}]*)\\s*=`);

const DEFAULT_UNITS: Record<UnitSystem, string[]> = {
  metric: ["mm", "cm", "m", "km", "g", "kg", "s", "min", "h", "°C", "L", "m²"],
  us: ["in", "ft", "yd", "mi", "oz", "lb", "s", "min", "h", "°F", "gal", "ft²"],
  uk: ["mm", "m", "km", "mi", "g", "kg", "s", "min", "h", "°C", "L", "m²"],
};

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

    if (NUMBER_PATTERN.test(character)) {
      while (index < input.length && NUMBER_PATTERN.test(input[index])) index += 1;
      segments.push({ text: input.slice(start, index), kind: "number", start, end: index });
      continue;
    }

    if (WORD_START_PATTERN.test(character)) {
      index += 1;
      while (index < input.length && WORD_BODY_PATTERN.test(input[index])) index += 1;
      const word = input.slice(start, index);
      // 「m/s」「N·m」のように、区切り記号を含む単位のまとまりも一区間として扱う。
      if (!knownIdentifiers.has(word)) {
        while (input[index] === "/" || input[index] === "·") {
          let lookahead = index + 1;
          while (lookahead < input.length && WORD_BODY_PATTERN.test(input[lookahead])) lookahead += 1;
          if (lookahead === index + 1 || !isUnitText(input.slice(start, lookahead))) break;
          index = lookahead;
        }
      }
      const text = input.slice(start, index);
      const previous = segments[segments.length - 1];
      const followsNumber = previous?.kind === "number" && previous.end === start;
      const registered = findRegisteredUnit(text);

      // 計算できる表記だけを単位として扱い、「kmh」のような別表記は正式な記号への修正候補付きで示す。
      const computable = isUnitText(text);
      const canonical = registered?.unit.symbol ?? (computable ? text : undefined);

      if (followsNumber) {
        segments.push({ text, kind: computable ? "unit" : "unknown-unit", start, end: index, canonical });
        continue;
      }

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
 * 今の式に合わせた入力補助を決める。
 * 1. 解釈できない単位があれば修正、2. 書きかけの単位があれば補完、
 * 3. 数値で終わっていれば単位付け、4. それ以外は挿入候補、の順に案内する。
 */
export function getUnitInputHint(
  expression: string,
  options: { system: UnitSystem; recentUnits?: string[]; identifiers?: string[]; includeUnit?: UnitFilter; limit?: number; analysis?: ExpressionAnalysis },
): UnitInputHint {
  const { system, recentUnits = [], identifiers = [], includeUnit, limit = 8 } = options;
  const analysis = options.analysis ?? analyzeExpression(expression, identifiers);
  const caret = expression.length;
  const insertHint = (start: number, kind: UnitInputHintKind): UnitInputHint => ({
    kind,
    fragment: "",
    start,
    end: start,
    candidates: getCommonUnitSuggestions(system, recentUnits, { limit, includeUnit }),
  });

  // 未定義の定数・関数参照（例: 履歴がまだ無い状態の a1）は「間違った単位」ではないため、
  // 単位の修正候補には含めない。
  const unresolvedUnits = analysis.unresolved.filter((segment) => segment.kind === "unknown-unit");
  const unresolved = unresolvedUnits[unresolvedUnits.length - 1];
  if (unresolved) {
    const candidates = getUnitSuggestions(unresolved.text, { system, limit, includeUnit });
    // 末尾の書きかけは「間違い」ではなく補完として案内する。
    const kind: UnitInputHintKind = unresolved.end === caret && candidates.length ? "complete" : "fix";
    return { kind, fragment: unresolved.text, start: unresolved.start, end: unresolved.end, candidates };
  }

  const lastMeaningful = [...analysis.segments].reverse().find((segment) => segment.kind !== "space");
  if (lastMeaningful?.kind === "number") return insertHint(lastMeaningful.end, "attach");
  // 末尾が既に単位のときは後ろへ足すと無意味な複合単位になるため、その単位ごと差し替える
  // （末尾に空白があっても、直前の意味のある区間を対象にする）。
  if (lastMeaningful?.kind === "unit") {
    return {
      kind: "replace",
      fragment: lastMeaningful.text,
      start: lastMeaningful.start,
      end: lastMeaningful.end,
      candidates: getCommonUnitSuggestions(system, recentUnits, { limit, includeUnit }),
    };
  }
  return insertHint(caret, "insert");
}

/** 式の一部を別の文字列へ差し替える。修正候補や補完候補の確定に使う。 */
export function replaceExpressionRange(expression: string, start: number, end: number, replacement: string): string {
  return `${expression.slice(0, start)}${replacement}${expression.slice(end)}`;
}

/**
 * 単位ボタンから式の末尾へ単位を反映する。末尾が既に単位ならそれを差し替え、
 * 数値のみ・その他で終わっていればそのまま末尾へ挿入する。
 */
export function insertUnitAtEnd(expression: string, symbol: string, identifiers: string[] = []): string {
  const lastMeaningful = [...analyzeExpression(expression, identifiers).segments].reverse().find((segment) => segment.kind !== "space");
  if (lastMeaningful?.kind === "unit") {
    return replaceExpressionRange(expression, lastMeaningful.start, lastMeaningful.end, symbol);
  }
  return `${expression}${symbol}`;
}
