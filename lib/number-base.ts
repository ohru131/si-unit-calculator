import { type Quantity } from "@/lib/units";

export type NumberBase = 2 | 8 | 10 | 16;

// 表示順。DECを先頭にする。
export const NUMBER_BASES: NumberBase[] = [10, 2, 8, 16];

// ラベルと接頭辞。単位記号と同じ扱いで、言語ごとに訳さない
// （docs/i18n-glossary.md の「単位記号は翻訳しない」に準じる。DEC/BIN/OCT/HEXは国際的に通じる略記）。
export const BASE_META: Record<NumberBase, { label: string; prefix: string }> = {
  10: { label: "DEC", prefix: "" },
  2: { label: "BIN", prefix: "0b" },
  8: { label: "OCT", prefix: "0o" },
  16: { label: "HEX", prefix: "0x" },
};

export type BaseRow = { base: NumberBase; label: string; text: string; isActive: boolean };

export type BaseParseErrorCode = "empty" | "invalidDigits" | "outOfRange";
export type BaseParseResult = { status: "ok"; value: number } | { status: "error"; code: BaseParseErrorCode };

// 基数で桁として使える文字の集合。matchAllや後読みを使わず、testだけで判定できる形にしてある
// （Hermesでの実機起動落ちを避けるための既存の方針。lib/custom-units.tsの同趣旨コメントを参照）。
const DIGIT_PATTERN: Record<NumberBase, RegExp> = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^[0-9]+$/,
  16: /^[0-9A-Fa-f]+$/,
};

/**
 * 基数変換の対象にできるかどうか。
 * - quantityがundefined（結果が無い）なら対象外。
 * - 単位が付いている量は対象外にする。基数は数値の「表記」であって量そのものではないので、
 *   「2進数の5kg」のような単位付きの基数表示は意味を持たない。
 * - 安全整数（Number.isSafeInteger）でない値も対象外にする。2^53を超えるとNumberが整数を
 *   正確に保持できなくなり、基数変換した結果が実際の値とズレてしまうため。
 */
export function canRepresentInBase(quantity: Quantity | undefined): boolean {
  if (!quantity) return false;
  const isDimensionless = quantity.dimension.every((exponent) => exponent === 0);
  return isDimensionless && Number.isSafeInteger(quantity.siValue);
}

/**
 * 数値を指定した基数の接頭辞付き文字列にする。安全整数でなければnull。
 * - 16進は大文字（0xFF。0xffにはしない）。
 * - 負数は符号＋絶対値の文字列にする（-255 → "-0xFF"）。2の補数は使わない。
 *   2の補数はビット幅（8/16/32/64bit等）を決めないと表現が定まらないが、
 *   このアプリにはビット幅という概念自体が無いため、常に成立する符号＋絶対値にしている。
 */
export function formatInBase(value: number, base: NumberBase): string | null {
  if (!Number.isSafeInteger(value)) return null;
  const meta = BASE_META[base];
  const sign = value < 0 ? "-" : "";
  const digits = Math.abs(value).toString(base);
  const text = base === 16 ? digits.toUpperCase() : digits;
  return `${sign}${meta.prefix}${text}`;
}

/** 現在の結果を、表示順（NUMBER_BASES）の各基数で1行ずつ並べる。対象外なら空配列。 */
export function buildBaseRows(quantity: Quantity | undefined, activeBase: NumberBase): BaseRow[] {
  if (!canRepresentInBase(quantity)) return [];
  // canRepresentInBaseがtrueを返した時点でquantityは存在し、siValueは安全整数なので、
  // formatInBaseがnullを返すことは無い（呼び出し不変条件）。
  const siValue = (quantity as Quantity).siValue;
  return NUMBER_BASES.map((base) => ({
    base,
    label: BASE_META[base].label,
    text: formatInBase(siValue, base) ?? "",
    isActive: base === activeBase,
  }));
}

/**
 * 入力文字列を指定した基数の数値としてパースする。例外は投げない。
 * parseInt自体は例えば parseInt("12G", 16) を18として返し、"G"以降を黙って打ち切ってしまうため、
 * parseIntに渡す前に必ず正規表現で桁を検証する（検証を省くと誤った値になる回帰バグの原因）。
 */
export function parseBaseInput(text: string, base: NumberBase): BaseParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { status: "error", code: "empty" };

  // 符号（+/-）を先に取り除く。+は明示的に許容してよい（数字の前置符号として自然なため）。
  let isNegative = false;
  let rest = trimmed;
  if (rest.startsWith("-")) {
    isNegative = true;
    rest = rest.slice(1);
  } else if (rest.startsWith("+")) {
    rest = rest.slice(1);
  }

  // 接頭辞はその基数専用のものだけを剥がす。base 10 では接頭辞を受け付けない
  // （"0xFF" を10進として渡された場合は、"x"が10進の桁として不正なのでinvalidDigitsになる）。
  const prefix = BASE_META[base].prefix;
  if (prefix && rest.toLowerCase().startsWith(prefix.toLowerCase())) {
    rest = rest.slice(prefix.length);
  }

  if (!rest || !DIGIT_PATTERN[base].test(rest)) {
    return { status: "error", code: "invalidDigits" };
  }

  const parsed = parseInt(rest, base);
  const value = isNegative ? -parsed : parsed;
  if (!Number.isSafeInteger(value)) return { status: "error", code: "outOfRange" };

  return { status: "ok", value };
}
