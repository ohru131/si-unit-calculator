/**
 * 計算結果を「a × 10ⁿ」の科学表記で出し、入力式から読み取った有効数字で丸めるための純関数。
 *
 * 電卓の計算そのものは常に倍精度小数で行い、ここでは**表示のときだけ**桁を落とす
 * （lib/exact-value.ts の分数・π表示と同じ立ち位置）。値に不確かさを持たせる方向へは進めない。
 * 単位計算エンジン（lib/units.ts）は7次元ベクトルと数値の組で換算・べき乗・三角関数まで
 * 全部組み立てられていて、そこへ「有効桁を持った量」を混ぜると全面書き直しになるため。
 */

import { IDENTIFIER_PATTERN, NUMBER_TOKEN_PATTERN, formatNumberForLocale, isUnitStart, normalizeExpression, parseUnit, unitSuffixEnd } from "@/lib/units";

export type ScientificNotation = {
  /** ロケール整形済みの仮数（絶対値が1以上10未満）。有効数字ぶんの末尾の0を保つ。 */
  mantissa: string;
  exponent: number;
  /**
   * 画面にそのまま出すUnicode表記（`9×10⁻¹`）。
   *
   * **KaTeXでは描かない。** 以前は LaTeX を渡していたが、結果カードの小数表示は等幅700の
   * ネイティブTextなので、チップを押した瞬間に字体と大きさが変わって見えた（利用者からの指摘）。
   * 上付き数字はUnicodeにあり、10のべきの表示に必要なのはそれだけなので、ここはUnicodeで足りる。
   * 分数・根号（lib/exact-value.ts）は文字の並びで表せないので従来どおりKaTeXのまま。
   */
  text: string;
  /** 丸めに使った桁数。式から読み取れなかったときは null（＝丸めていない）。 */
  significantDigits: number | null;
  /** 丸めで表示が変わったときだけ、丸める前の値（ロケール整形済み）。変わらなければ null。 */
  roundedFrom: string | null;
};

export type SignificantDecimal = {
  /**
   * 有効数字で丸めた**小数**（`0.90`）。10のべきに直さないので、小数表示から切り替えても
   * 桁の位置がそのまま読める。**末尾の0は落とさない**——`0.90` の 0 は「2桁である」という
   * 情報そのもので、`formatNumberForLocale` の maximumSignificantDigits では表現できない。
   * 丸めで値が変わったときだけ先頭に `≈ ` が付く。
   */
  text: string;
  significantDigits: number;
  /** 丸める前の値（ロケール整形済み）。丸めても値が変わらなければ null。 */
  roundedFrom: string | null;
};

// 仮数に出す桁数の上限。丸めない場合の桁数を formatNumberForLocale の
// maximumSignificantDigits と揃えておく（小数表示と科学表記で桁数が違うと、
// 同じ値なのに切り替えるたびに末尾が増減して見える）。
const MAX_MANTISSA_DIGITS = 10;

/**
 * 丸めに使う最小の桁数。**有効1桁では丸めない。**
 *
 * 規則としては `t=2h` も「有効1桁の測定値」だが、実際には数える量・設定値としての 2 がほとんどで、
 * そこまで丸めると理科の速さのノートが `210 km → 200 km`・`3.5 h → 4 h` になる（プリセット365手順の
 * うち196手順がこの1桁だった）。**厳密さより自然に読めることを優先する**という判断で、
 * 式の文字面から「その 2 が数えた数か測った値か」は区別できない以上、外れたときの痛みが小さい側に倒す。
 *
 * 判定をここ（表示側）に置くのは、`inferSignificantDigits` は「式から読める桁数」をそのまま返す
 * 関数のままにしておきたいのと、**丸めの入口を2つとも塞げば呼び出し側が忘れようがない**ため。
 */
const MIN_ROUNDING_DIGITS = 2;

/** 表示で実際に使う桁数。丸めない場合は null（＝そのままの値を出す）。 */
function roundingDigits(requested: number | null | undefined): number | null {
  if (requested === null || requested === undefined) return null;
  const digits = Math.round(requested);
  if (digits < MIN_ROUNDING_DIGITS) return null;
  return Math.min(digits, MAX_MANTISSA_DIGITS);
}

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

export type InferOptions = {
  /**
   * 識別子（定数名・先行手順の記号）を、その中身の式へ解決する。返した式の桁も数えに入れる。
   * 関数名（cos・sqrt…）や解決できない名前には undefined を返すこと。
   */
  resolveIdentifier?: (symbol: string) => string | undefined;
  /** 循環参照よけ。再帰の途中で辿った名前は二度と解決しない。 */
  seen?: readonly string[];
};

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
 * `(` から対応する `)` を探し、その後ろ（空白は読み飛ばす）に `!` が続くか。
 *
 * **括弧で括った階乗の対象も測定値ではない。** 評価器は `(5)!` も `3*(4)!` も受けるのに、
 * 直後の1文字だけを見る判定では括弧の中の `5` が1桁として数えられ、厳密な 120 が
 * `≈ 1×10²` に丸まる（CodeRabbitが#72で検出）。中身の式まで見ずに、括弧の範囲を丸ごと
 * 除外する——`(2+3)!` のように中が式のこともあり、そこは「どの数字が測定値か」を
 * 読む話ではないため。
 */
function isFactorialParen(source: string, openIndex: number): boolean {
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index];
    if (character === "(") depth += 1;
    else if (character === ")") {
      depth -= 1;
      if (depth === 0) {
        let after = index + 1;
        while (source[after] === " ") after += 1;
        return source[after] === "!";
      }
    }
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
 * - 階乗の対象（`5!` の 5、`(5)!` や `3*(4)!` の括弧の中も同じ）。厳密な整数の指定で、結果も厳密。
 */
export function inferSignificantDigits(expression: string, options: InferOptions = {}): number | null {
  const { resolveIdentifier, seen = [] } = options;
  const source = normalizeExpression(expression);
  const tokens: ScanToken[] = [];
  // 開いている括弧が階乗の対象かどうか。`)` で pop するので入れ子でも対応が保てる。
  const parenIsFactorial: boolean[] = [];
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
      if (isUnitStart(source[next])) {
        const unitEnd = unitSuffixEnd(source, next);
        // **オフセットを持つ単位で書かれた値からは桁を持ち越せない**（°C・°F）。
        // `20°C` は 293.15K で、2桁のまま丸めると 290 K になるが、元の精度は1℃なので
        // 正しくは 293 K。換算先を見る significantDigitsAfterConversion と同じ理由だが、
        // あちらは**表示単位**しか見ないので、°C で入力して K で表示する経路は素通りしていた。
        if (hasOffsetUnit(source.slice(next, unitEnd))) return null;
        next = unitEnd;
      }
      // 科学表記の底の判定は**空白を読み飛ばしてから**行う。`normalizeExpression` は空白を
      // 1つに詰めるだけで消さず、評価器は数値と演算子の間の空白を許すので、`123 × 10 ^ 8` は
      // 評価器では `123 × 10^8` になる。読み飛ばさないとこの `10` を測定値として2桁と数え、
      // 本来3桁の結果が2桁に丸まる（CodeRabbitが#60で検出）。単位サフィックスの側は
      // 評価器も空白を跨がないので、そちらは詰めない。
      let beforeCaret = next;
      while (source[beforeCaret] === " ") beforeCaret += 1;
      const isScientificBase = literal === "10" && source[beforeCaret] === "^";
      // **階乗の対象は測定値ではない。** `5!` の 5 は「5の階乗」という厳密な指定で、120 という
      // 答えも厳密な整数。ここを1桁と数えると `5!` が `≈ 1×10²` に丸まり、正しい 120 を出せない。
      // 指数の位置と科学表記の底を数えないのと同じ理由。
      const isFactorialTarget = source[beforeCaret] === "!" || parenIsFactorial.some(Boolean);
      if (!isExponentPosition(tokens) && !isScientificBase && !isFactorialTarget) {
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

    if (character === "!") {
      // 後置の階乗。値の一部として読み飛ばす（直前の数値は上で既に「数えない」判定をしている）。
      tokens.push({ kind: "value" });
      index += 1;
      continue;
    }

    if (character === "*" || character === "/" || character === "^") {
      tokens.push({ kind: "operator", value: character });
      index += 1;
      continue;
    }

    // カンマは関数の引数の区切り。値として扱うと直後の符号が二項の引き算に見え、
    // atan2(2.0, -3.00) のような式で桁を読めなくなる（丸めが効かない）。
    if (character === "(" || character === ",") {
      if (character === "(") parenIsFactorial.push(isFactorialParen(source, index));
      tokens.push({ kind: "open" });
      index += 1;
      continue;
    }

    if (character === ")") {
      parenIsFactorial.pop();
      tokens.push({ kind: "value" });
      index += 1;
      continue;
    }

    // 識別子（定数名・関数名・裸の単位）は**丸ごと**読み飛ばす。1文字ずつ進めると
    // `atan2` の 2・履歴参照の `a1`・手順参照の `s1` の末尾の数字が数値リテラルとして
    // 数えられ、**有効数字が黙って1桁に落ちる**（エラーにならないので気付けない）。
    // 定数の値そのものの桁数は数えない（保存された値の精度は利用者が意図した桁とは限らない）。
    const identifierMatch = IDENTIFIER_PATTERN.exec(source.slice(index));
    if (identifierMatch) {
      const name = identifierMatch[0];
      // 計算ノートだけ、参照している定数・先行手順の式まで辿って桁を数える（resolveIdentifier）。
      // ノートの手順は `V*I*cos(φ)` のように識別子だけで書かれていてリテラルが1つも無く、
      // 辿らないと有効数字を一度も出せない。**電卓では渡さない**——あちらの識別子は保存済みの
      // 定数と履歴参照で、保存された値の精度は利用者がその式で意図した桁とは限らないため。
      const referenced = resolveIdentifier && !seen.includes(name) ? resolveIdentifier(name) : undefined;
      if (referenced !== undefined) {
        const digits = inferSignificantDigits(referenced, { resolveIdentifier, seen: [...seen, name] });
        // 参照先が読めない（加減算が混ざる・リテラルが無い）なら、この式でも桁を主張しない。
        if (digits === null) return null;
        minimum = minimum === null ? digits : Math.min(minimum, digits);
      }
      tokens.push({ kind: "value" });
      index += name.length;
      continue;
    }

    // 単位専用の記号（Ω・µ・°・%）など、識別子にも数値にもならない1文字。
    tokens.push({ kind: "value" });
    index += 1;
  }

  return minimum;
}

/**
 * 表示単位への換算を挟んだあとに、まだ有効数字を主張してよいかを判定する。
 *
 * **オフセットを持つ単位（°C・°F）への換算では桁は持ち越せない。** 換算が
 * `値*scale + offset` のアフィン変換になり、有効数字ではなく「小数点以下の位」で決まる量に
 * 変わるため。実際に `300K`（3桁）を°Cにすると 26.85 で、3桁のまま丸めると 26.9°C になるが、
 * 元の精度は1Kなので正しくは 27°C。位で追う話は加減算と同じ理由でこのモジュールの外なので、
 * ここでは丸めない（null）方を選ぶ。倍率だけの換算（cm・mA・kPa…）は桁を保つのでそのまま。
 */
/** その単位サフィックスがオフセット（摂氏・華氏の +273.15 のような）を持つか。 */
function hasOffsetUnit(symbol: string): boolean {
  const trimmed = symbol.trim();
  if (!trimmed) return false;
  try {
    return parseUnit(trimmed).offset !== undefined;
  } catch {
    return false;
  }
}

export function significantDigitsAfterConversion(digits: number | null, displayUnitSymbol: string): number | null {
  if (digits === null) return null;
  const symbol = displayUnitSymbol.trim();
  // 表示単位なし＝SI標準そのままなので換算は挟まらない。
  if (!symbol) return digits;
  try {
    return parseUnit(symbol).offset === undefined ? digits : null;
  } catch {
    // 解決できない記号のときは表示側がSI表記へフォールバックしている（＝換算は挟まらない）。
    return digits;
  }
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
  const digits = roundingDigits(options.significantDigits);
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
  // **指数が0のときは `×10⁰` を書かない。** 表記として誰も書かない形なうえ、表示単位の
  // 自動選択が値を1〜1000に収めるので単位付きの結果では指数0が最も多い。
  // mantissa / exponent のフィールドはそのまま残す（表示以外の判断がこちらを見るため）。
  // **`×` の前後に空白を入れない。** 結果カードの数値は36pxの等幅なので、`2.5 × 10³` だと
  // 360dpの端末で単位まで入らなくなる。
  const textFactor = exponent === 0 ? "" : `×10${toSuperscript(exponent)}`;
  return {
    mantissa,
    exponent,
    text: `${approximate ? "≈ " : ""}${mantissa}${textFactor}`,
    significantDigits: digits,
    roundedFrom,
  };
}

/**
 * 有効数字で丸めた**小数**（`0.9` → 2桁なら `0.90`）。10のべきへは直さない。
 *
 * 科学表記（toScientificNotation）と分ける理由: 指数が0以外の値（0.9 は 9×10⁻¹）でも、
 * 実際に読みたいのは「小数点の位置はそのままで、桁だけ有効数字に揃えた形」であることが多い。
 * 逆に指数が0のときは科学表記が倍率の因子を書かないので、両者が一字一句同じものになる
 * （呼び出し側はそのとき科学表記のチップを出さない）。
 *
 * **何も得られないときは null を返す**——丸めても値が変わらず、末尾の0も増えないなら、
 * 小数表示と同じ文字列にしかならない（押しても何も変わらないチップを作らない）。
 */
export function toSignificantDecimal(
  value: number,
  options: { significantDigits?: number | null; locale?: string } = {},
): SignificantDecimal | null {
  const digits = roundingDigits(options.significantDigits);
  if (digits === null || !Number.isFinite(value) || value === 0) return null;
  // 丸めたあとの指数で小数点以下の桁数を決める（999.9 を1桁で丸めると 1000 で指数が繰り上がる。
  // Math.log10 を先に取ると、その繰り上がりを取りこぼして桁数が1つずれる）。
  const exponential = value.toExponential(digits - 1);
  const parsed = /^-?\d(?:\.\d+)?e([+-]\d+)$/.exec(exponential);
  if (!parsed) return null;
  const decimals = Math.max(0, digits - 1 - Number(parsed[1]));
  if (decimals > 100) return null;
  const rounded = Number(exponential);
  const fixed = rounded.toFixed(decimals);
  // 桁が大きすぎると toFixed が指数表記を返す（1e21 → "1e+21"）。そこは科学表記の担当。
  if (/e/i.test(fixed)) return null;
  const separator = decimalSeparator(options.locale);
  const localized = separator === "." ? fixed : fixed.replace(".", separator);
  const plain = formatNumberForLocale(value, options.locale);
  // **「得るものがあるか」は数値ではなく文字列で判断する。** 倍精度の丸め誤差
  // （69.99999999999999）は小数表示でも既に `70` と出ているので、桁を落としても画面は
  // 1文字も変わらない。数値だけを比べると「≈ 70（元の値 70）」という無意味な併記になる
  // （プリセットの「速さ v」で実際に出た）。
  if (localized === plain) return null;
  // **「桁が落ちたか」も表示される値どうしで比べる。** ここを `rounded !== value` にすると、
  // 倍精度の誤差だけで真になる（`40g ÷ 50cm³` は 0.8000000000000002 に落ちるので、2桁の
  // `0.80` に対して「元の値 0.8」という**何も失われていない併記**が出ていた）。小数表示は
  // 有効10桁で頭打ちなので、その桁まで丸めた値と突き合わせれば「画面で読める範囲で変わったか」
  // が分かる。上の localized === plain は文字列が1文字も変わらない場合、こちらは
  // 末尾に0が増えただけの場合を弾く。
  const changed = Number(value.toPrecision(MAX_MANTISSA_DIGITS)) !== rounded;
  return { text: `${changed ? "≈ " : ""}${localized}`, significantDigits: digits, roundedFrom: changed ? plain : null };
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
