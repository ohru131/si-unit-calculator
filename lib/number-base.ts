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

// 符号・接頭辞・桁を分けて返す。画面が接頭辞だけ別の色で描くために使う。
export type BaseTextParts = { sign: string; prefix: string; digits: string };

/**
 * 数値を指定した基数の符号・接頭辞・桁に分解する。安全整数でなければnull。
 * - 16進は大文字（FF。ffにはしない）。
 * - 負数は符号＋絶対値の文字列にする（-255 → sign:"-", digits:"FF"）。2の補数は使わない。
 *   2の補数はビット幅（8/16/32/64bit等）を決めないと表現が定まらないが、
 *   このアプリにはビット幅という概念自体が無いため、常に成立する符号＋絶対値にしている。
 */
export function formatInBaseParts(value: number, base: NumberBase): BaseTextParts | null {
  if (!Number.isSafeInteger(value)) return null;
  const meta = BASE_META[base];
  const sign = value < 0 ? "-" : "";
  const digits = Math.abs(value).toString(base);
  return { sign, prefix: meta.prefix, digits: base === 16 ? digits.toUpperCase() : digits };
}

/** 数値を指定した基数の接頭辞付き文字列にする。組み立ては必ずformatInBasePartsに任せ、ここでは連結だけ行う。 */
export function formatInBase(value: number, base: NumberBase): string | null {
  const parts = formatInBaseParts(value, base);
  if (!parts) return null;
  return `${parts.sign}${parts.prefix}${parts.digits}`;
}

/** その基数で使える桁文字（大文字）。例: 16なら "0123456789ABCDEF"。 */
export function baseDigits(base: NumberBase): string {
  return "0123456789ABCDEF".slice(0, base);
}

// 入力欄に直接打たれた・貼り付けられた文字列を、その基数で使える桁だけに落とす。
// キーパッド側だけを無効化しても、TextInputへの直接入力や貼り付けは素通りしてしまい、
// 確定できない桁（sin( など）が混ざる。入力の経路が複数あるので、絞り込みはここに1つ置く。
//
// 先頭のマイナスだけは桁ではないが必ず残す。-255 から入った -FF を編集すると、符号が落ちて
// 値が黙って正に反転してしまうため（parseBaseInputが先頭の符号を受け付ける以上、
// 落としてよい文字ではない）。2文字目以降の符号は桁として不正なので従来どおり落とす。
// プラスは落としても値が変わらないので、符号として持ち回らない。
export function sanitizeBaseInput(text: string, base: NumberBase): string {
  const sign = text.startsWith("-") ? "-" : "";
  let result = "";
  for (const character of text) {
    if (isBaseDigitAllowed(character, base)) result += character.toUpperCase();
  }
  // 桁が1つも残らないなら符号だけを残さない（"-"だけが式に残ると読めない表示になる）。
  if (!result) return "";
  return sign + result;
}

/** 1文字がその基数の桁として使えるか（大文字小文字どちらも受け付ける）。 */
export function isBaseDigitAllowed(character: string, base: NumberBase): boolean {
  return baseDigits(base).includes(character.toUpperCase());
}

// 入力中の桁を、値を保ったまま別の基数の桁へ書き換える（16進のFFを2進にすると11111111）。
// 基数を切り替えるたびに入力を捨てると、打った値が黙って消えて使い物にならない。値さえ保てば
// 「新しい基数では使えない桁が残って確定も解除もできなくなる」問題も同時に消える。
// 接頭辞は表示側が別の色で描くので、ここでは付けない。
// 変換できない（空・不正な桁・安全整数の範囲外）ときはnullを返し、呼び出し側は入力をそのまま残す。
export function reinterpretBaseInput(text: string, from: NumberBase, to: NumberBase): string | null {
  const parsed = parseBaseInput(text, from);
  if (parsed.status !== "ok") return null;
  const parts = formatInBaseParts(parsed.value, to);
  if (!parts) return null;
  return `${parts.sign}${parts.digits}`;
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
