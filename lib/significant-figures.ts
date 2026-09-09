/**
 * 計算結果を「a × 10ⁿ」の科学表記で出し、入力式から読み取った有効数字で丸めるための純関数。
 *
 * 電卓の計算そのものは常に倍精度小数で行い、ここでは**表示のときだけ**桁を落とす
 * （lib/exact-value.ts の分数・π表示と同じ立ち位置）。値に不確かさを持たせる方向へは進めない。
 * 単位計算エンジン（lib/units.ts）は7次元ベクトルと数値の組で換算・べき乗・三角関数まで
 * 全部組み立てられていて、そこへ「有効桁を持った量」を混ぜると全面書き直しになるため。
 */

import { NUMBER_TOKEN_PATTERN, formatNumberForLocale, isUnitStart, normalizeExpression, unitSuffixEnd } from "@/lib/units";

export type ScientificNotation = {
  /** ロケール整形済みの仮数（絶対値が1以上10未満）。有効数字ぶんの末尾の0を保つ。 */
  mantissa: string;
  exponent: number;
  /** KaTeXへ渡すLaTeX。 */
  latex: string;
  /** LaTeXを描けない場所（コピー・読み上げ・テスト）用のUnicode表記。 */
  text: string;
  /** 丸めに使った桁数。式から読み取れなかったときは null（＝丸めていない）。 */
  significantDigits: number | null;
  /** 丸めで表示が変わったときだけ、丸める前の値（ロケール整形済み）。変わらなければ null。 */
  roundedFrom: string | null;
};

// 仮数に出す桁数の上限。丸めない場合の桁数を formatNumberForLocale の
// maximumSignificantDigits と揃えておく（小数表示と科学表記で桁数が違うと、
// 同じ値なのに切り替えるたびに末尾が増減して見える）。
const MAX_MANTISSA_DIGITS = 10;

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};

const toSuperscript = (value: number) =>
  [...String(value)].map((character) => SUPERSCRIPT_DIGITS[character] ?? character).join("");

/**
 * 数値リテラル1つの有効数字。先頭の0は桁に数えず、末尾の0は数える。
 *
 * **整数の末尾の0は本来あいまい**（`230` は2桁とも3桁とも読める）だが、ここでは数える。
 * 厳密な教科書のルール（小数点が無ければ末尾の0は有効でない）を当てると `230V / 10kΩ` が
 * 1桁になり、この電卓でいちばん多い入力が軒並み1桁に落ちて使い物にならない。
 * 意図して1桁にしたいときは `2e2` のように書けば区別できる。
 */
export function significantDigitsOfLiteral(literal: string): number | null {
  // 指数部（1.72e-8 の e-8）は表記であって桁ではないので、仮数だけを見る。
  const mantissa = literal.split(/[eE]/)[0] ?? "";
  const digits = mantissa.replace(".", "").replace(/^0+/, "");
  // 0・0.000 は有効数字を持たない。桁数の下限として数えると全体が0桁になってしまう。
  return digits.length ? digits.length : null;
}

type ScanToken = { kind: "value" | "operator" | "open"; value?: string };

/** 直前に確定したトークンが `^` か（＝これから読む数値が指数の位置にあるか）。 */
function isExponentPosition(tokens: readonly ScanToken[]): boolean {
  let index = tokens.length - 1;
  while (index >= 0) {
    const token = tokens[index];
    if (token.kind !== "operator") return false;
    // 単項の符号は読み飛ばす（10^-8 は `^` `-` `8` の並びになる）。
    if (token.value === "+" || token.value === "-") {
      index -= 1;
      continue;
    }
    return token.value === "^";
  }
  return false;
}

/**
 * 入力式から、結果を丸めるべき有効数字の桁数を読む。読めなければ null（丸めない）。
 *
 * 掛け算・割り算の規則（**リテラルの最小桁数**）を当てる。この電卓の主な用途である電気・
 * 機械の計算はほぼ乗除で組まれているため。**足し算・引き算が混ざる式では null を返す。**
 * 加減算の桁数は「有効数字の最小」ではなく「小数点以下の位の最小」で決まり、しかも
 * `5cm + 1mm` のように項ごとに単位が違うと**リテラルの文字面からは位が読めない**
 * （5cm は 0.01m 刻み・1mm は 0.001m 刻み）。読めない精度を主張するより丸めない方が正直。
 *
 * 数えないもの:
 * - 指数の位置にある数値（`(6371km)^2` の 2）。表記であって測定値ではない。
 * - 科学表記の底の `10`（`3×10^8` の 10）。同じ理由。
 */
export function inferSignificantDigits(expression: string): number | null {
  const source = normalizeExpression(expression);
  const tokens: ScanToken[] = [];
  let minimum: number | null = null;
  let index = 0;

  while (index < source.length) {
    const character = source[index];
    if (character === " ") {
      index += 1;
      continue;
    }

    const numberMatch = NUMBER_TOKEN_PATTERN.exec(source.slice(index));
    if (numberMatch) {
      const literal = numberMatch[0];
      let next = index + literal.length;
      // 数値直後の単位サフィックスは丸ごと読み飛ばす。中の指数（m^2 の 2）を桁として
      // 数えないため。走査規則は unitSuffixEnd に任せる（評価器と同じものを使う）。
      if (isUnitStart(source[next])) next = unitSuffixEnd(source, next);
      const isScientificBase = literal === "10" && source[next] === "^";
      if (!isExponentPosition(tokens) && !isScientificBase) {
        const digits = significantDigitsOfLiteral(literal);
        if (digits !== null) minimum = minimum === null ? digits : Math.min(minimum, digits);
      }
      tokens.push({ kind: "value" });
      index = next;
      continue;
    }

    if (character === "+" || character === "-") {
      // 直前が値なら二項の加減算。桁の決まり方が乗除と違うので、この式では丸めない。
      if (tokens[tokens.length - 1]?.kind === "value") return null;
      tokens.push({ kind: "operator", value: character });
      index += 1;
      continue;
    }

    if (character === "*" || character === "/" || character === "^") {
      tokens.push({ kind: "operator", value: character });
      index += 1;
      continue;
    }

    if (character === "(") {
      tokens.push({ kind: "open" });
      index += 1;
      continue;
    }

    if (character === ")") {
      tokens.push({ kind: "value" });
      index += 1;
      continue;
    }

    // 識別子（定数名・関数名・裸の単位）。値として扱えば加減算の判定に足りる。
    // 定数の値そのものの桁数は数えない（保存された値の精度は利用者が意図した桁とは限らない）。
    tokens.push({ kind: "value" });
    index += 1;
  }

  return minimum;
}

/**
 * 値を「a × 10ⁿ」の形に組み立てる。significantDigits を渡すとその桁数で丸め、
 * 丸めで表示が変わったときは roundedFrom に丸める前の値を入れる（画面に小さく併記して、
 * 丸めたことが分かるようにするため）。0・非有限値は null（`0 × 10⁰` は読む意味がない）。
 */
export function toScientificNotation(
  value: number,
  options: { significantDigits?: number | null; locale?: string } = {},
): ScientificNotation | null {
  if (!Number.isFinite(value) || value === 0) return null;
  const requested = options.significantDigits ?? null;
  const digits = requested === null ? null : Math.min(Math.max(Math.round(requested), 1), MAX_MANTISSA_DIGITS);
  const exponential = digits === null ? trimmed(value) : value.toExponential(digits - 1);
  const parsed = /^(-?)(\d(?:\.\d+)?)e([+-]\d+)$/.exec(exponential);
  if (!parsed) return null;
  const [, sign, rawMantissa, rawExponent] = parsed;
  const exponent = Number(rawExponent);
  const separator = decimalSeparator(options.locale);
  const mantissa = `${sign}${separator === "." ? rawMantissa : rawMantissa.replace(".", separator)}`;
  // 併記する「丸める前の値」は小数モードに出るものと同じ整形を通す（別の整形にすると、
  // 切り替えたときに末尾の桁が食い違って「どちらが本当の値か」が分からなくなる）。
  // 丸めたかどうかは「丸めた値が元の値と一致するか」で見る。桁数を指定していても
  // 2.5 を2桁で出すような場合は何も失われていないので、併記も ≈ も出さない。
  const roundedFrom = digits !== null && Number(exponential) !== value ? formatNumberForLocale(value, options.locale) : null;
  const approximate = roundedFrom !== null;
  // LaTeXの数式モードでは `,` の後に空白が入る（1,5 が「1, 5」に見える）ので、
  // 小数点がカンマのロケールでは括弧で括って通常の文字として組ませる。
  const latexMantissa = separator === "." ? mantissa : mantissa.replace(separator, `{${separator}}`);
  return {
    mantissa,
    exponent,
    latex: `${approximate ? "\\approx " : ""}${latexMantissa} \\times 10^{${exponent}}`,
    text: `${approximate ? "≈ " : ""}${mantissa} × 10${toSuperscript(exponent)}`,
    significantDigits: digits,
    roundedFrom,
  };
}

/** 桁数を指定しないときの仮数。倍精度の丸め誤差（2.5531914893617023）をそのまま出さない。 */
function trimmed(value: number): string {
  const exponential = value.toExponential(MAX_MANTISSA_DIGITS - 1);
  const parsed = /^(-?\d(?:\.\d+)?)e([+-]\d+)$/.exec(exponential);
  if (!parsed) return exponential;
  const mantissa = parsed[1].includes(".") ? parsed[1].replace(/0+$/, "").replace(/\.$/, "") : parsed[1];
  return `${mantissa}e${parsed[2]}`;
}

function decimalSeparator(locale?: string): string {
  if (!locale) return ".";
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(1.1);
    return parts.find((part) => part.type === "decimal")?.value ?? ".";
  } catch {
    return ".";
  }
}
