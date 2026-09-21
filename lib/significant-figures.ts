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

/**
 * 識別子の解決結果。**`exact` は「この数は測定値ではない」という宣言**で、図面の呼び寸法・
 * 個数・規格で決まる値に付ける（lib/notebook-formulas/types.ts の `NotebookSeedConstant.exact`）。
 *
 * 付けると2つ効く: (1) 桁に数えない（`8mm` の板厚で結果が1桁に落ちない）、
 * (2) **その値だけで組まれた加減算は式を塞がない**（`60mm-20mm` は厳密に `40mm` なので
 * 精度を失っていない）。どちらも「測定していない数から精度の話は生まれない」という同じ理由。
 */
export type ResolvedIdentifier = {
  expression: string;
  exact?: boolean;
};

export type InferOptions = {
  /**
   * 識別子（定数名・先行手順の記号）を、その中身へ解決する。返した式の桁も数えに入れる。
   * 関数名（cos・sqrt…）や解決できない名前には undefined を返すこと。
   */
  resolveIdentifier?: (symbol: string) => ResolvedIdentifier | undefined;
  /** 循環参照よけ。再帰の途中で辿った名前は二度と解決しない。 */
  seen?: readonly string[];
};

/**
 * 走査の結果。**「桁が読めなかった」と「読む対象が無かった」を分ける**のが要点。
 *
 * どちらも公開APIでは null に潰れるが、途中では区別が要る: 厳密値だけで組まれた手順
 * （`A = πd²/4` の d が呼び寸法）は `digits: null, blocked: false` で、これを参照する
 * 後続手順は**自分の測定値の桁で丸め続けてよい**。ここを一緒くたに null で扱うと、
 * 厳密値だけの手順を1つ挟んだ瞬間に下流の丸めが全部止まる。
 */
type ScanResult = {
  /** 測定値から読めた最小の桁数。測定値が1つも無ければ null。 */
  digits: number | null;
  /** 桁を主張してはいけない式（測定値の加減算・オフセット単位）。 */
  blocked: boolean;
};

/**
 * 括弧の深さごとに「加減算が起きたか」「測定値が現れたか」を持つ。
 *
 * 加減算を**その場で即 null にせず**深さ単位で持ち越すのは、`F/((w-d)*t)` のような式で
 * 「`w-d` は厳密値どうしなので無害／`F` は測定値だが加減算には関わっていない」を区別するため。
 * 判定は括弧を閉じたときに行い、**その括弧の中に測定値が1つでもあれば塞ぐ**（保守側に倒す。
 * `(厳密+厳密)*測定` は通し、`厳密*(測定+測定)` は塞ぐ）。
 */
type AdditiveFrame = { hasAdditive: boolean; hasMeasured: boolean };

/**
 * その数値の直後が `× 10 ^` / `÷ 10 ^`（科学表記の倍率）か。空白は読み飛ばす——
 * `normalizeExpression` は空白を1つに詰めるだけで消さず、評価器も数値と演算子の間の空白を
 * 許すため（底の `10` を数えない判定と同じ事情。lib/significant-figures.ts の科学表記の項）。
 *
 * **割り算も見ること。** `/ 10^n` は `× 10^-n` と同じ十進のスケーリングなので、片方だけ
 * 仮数として扱うと `123 × 10^2` が3桁・`123 / 10^2` が桁なし（＝丸めない）と、
 * **同一の計算が書き方で食い違う**（底の `10` を掛け算・割り算のどちらでも数えない、という
 * #60 で決めた規則の裏返し。CodeRabbitが#75で検出）。
 */
function isScientificMantissa(source: string, from: number): boolean {
  let index = from;
  const skipSpaces = () => {
    while (source[index] === " ") index += 1;
  };
  skipSpaces();
  if (source[index] !== "*" && source[index] !== "/") return false;
  index += 1;
  skipSpaces();
  if (source.slice(index, index + 2) !== "10") return false;
  index += 2;
  skipSpaces();
  return source[index] === "^";
}

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
  const result = scanSignificantDigits(expression, options);
  return result.blocked ? null : result.digits;
}

/**
 * 同じ単位どうしの加減算を、あらかじめ1つの数値リテラルへ畳んでおくための下準備。
 *
 * **加減算の桁は「有効数字の最小」ではなく「小数点以下の位の最小」で決まる。** 項ごとに単位が
 * 違うと（`5cm + 1mm`）リテラルの文字面からは位が読めないので、このモジュールは従来
 * 加減算を含む式を丸ごと諦めていた（`blocked`）。**ただし項が全部同じ単位なら位は読める**——
 * `10kΩ + 4.7kΩ` は kΩ で数えて 10（1の位まで）と 4.7（0.1の位まで）なので、和は1の位までの
 * `15kΩ` ＝2桁。分圧回路の出力電圧が `3.836734694 V` と生値で出ていたのはこれが読めていな
 * かったためで、プリセット380手順のうち26手順が同じ形。
 *
 * **走査そのものには手を入れず、式の文字列を先に書き換える方式にしてある。** 走査側で項ごとの
 * 値を持ち回ると、フレームごとの最小桁数を組み替える必要が出て（加減算の項は自分の桁数を
 * 外へ寄与してはいけない——`20g + 180g` は min(2,3)=2桁ではなく `200g` の3桁）、この
 * ファイルで積み上げた判定の順序を丸ごと触ることになる。畳んでしまえば項は式から消えるので、
 * その組み替えが要らない。
 *
 * **畳むのは次の2つの形だけ。** どちらも `+`/`-` が式の一番外側にあると確定できるので、
 * 畳んでも演算の優先順位が変わらない:
 * - 式まるごとが `+`/`-` の並び（`R₁+R₂`）
 * - 括弧の中身まるごとが `+`/`-` の並び（`Vᵢₙ/(R₁+R₂)`）。括弧は残したまま中身を置き換える。
 *
 * `a*b + c` のように括弧が無いまま途中に出てくる加減算は畳まない（`+` が最も緩く結合するので
 * 部分だけ畳むと別の式になる）。従来どおり `blocked` になる。
 */
type AdditiveFoldTerm = { sign: 1 | -1; value: number; decimals: number; unit: string; exact: boolean };

/** その式が「1つの数値リテラル（＋単位サフィックス）」だけで書かれているなら、その中身を返す。 */
function soleLiteralOf(expression: string): { literal: string; value: number; decimals: number; unit: string } | null {
  const source = normalizeExpression(expression).trim();
  const match = NUMBER_TOKEN_PATTERN.exec(source);
  if (!match || match.index !== 0) return null;
  const literal = match[0];
  let end = literal.length;
  let unit = "";
  if (isUnitStart(source[end])) {
    const unitEnd = unitSuffixEnd(source, end);
    unit = source.slice(end, unitEnd);
    end = unitEnd;
  }
  if (end !== source.length) return null;
  const value = Number(literal);
  if (!Number.isFinite(value)) return null;
  // 位は仮数の小数部の桁数で数える。指数表記（1.5e3）は位が読めないので畳まない。
  if (/[eE]/.test(literal)) return null;
  const dot = literal.indexOf(".");
  return { literal, value, decimals: dot < 0 ? 0 : literal.length - dot - 1, unit };
}

/**
 * `1/R` の形の項を、逆数を取った1つのリテラルとして読む（合成抵抗の `1/R₁+1/R₂`、
 * レンズの式 `1/a+1/b` のような形のため）。
 *
 * **逆数は有効数字の桁数をそのまま保つ**（`100Ω` が3桁なら `0.0100 Ω⁻¹` も3桁）ので、
 * 桁数から位を組み立て直せる: 位 = 桁数 − 逆数の整数部の桁数。ここだけは「文字面から位を読む」
 * ではなく「桁数から位を導く」形になるが、逆数という演算が桁数を保つことは確かなので
 * 不確かさを持ち回る話には広がらない。
 *
 * 単位は `Ω^-1` の形にする（`parseUnit` が受ける。`1/Ω` は受けない）。**元の単位が複合
 * （`m/s` のように `/` や `^` を含む）なら諦める**——`m/s^-1` は別物になってしまう。
 */
function reciprocalLiteralOf(term: string, resolve: (symbol: string) => { expression: string; exact?: boolean } | undefined, seen: readonly string[]) {
  const match = /^1\s*\/\s*\(?\s*([^()]+?)\s*\)?$/.exec(term.trim());
  if (!match) return null;
  const inner = match[1].trim();
  const direct = soleLiteralOf(inner);
  let base = direct;
  let exact = false;
  if (!base) {
    const identifier = IDENTIFIER_PATTERN.exec(inner);
    if (!identifier || identifier.index !== 0 || identifier[0].length !== inner.length) return null;
    if (seen.includes(inner)) return null;
    const referenced = resolve(inner);
    if (!referenced) return null;
    base = soleLiteralOf(referenced.expression);
    exact = referenced.exact === true;
  }
  if (!base || base.value === 0) return null;
  if (base.unit.includes("/") || base.unit.includes("^")) return null;
  const digits = significantDigitsOfLiteral(base.literal);
  if (digits === null) return null;
  const value = 1 / base.value;
  // 整数部の桁数（0.01 なら -1、15 なら 2）。位はこれを桁数から引いたもの。
  const integerDigits = Math.floor(Math.log10(Math.abs(value))) + 1;
  const decimals = digits - integerDigits;
  if (!Number.isFinite(decimals) || decimals < 0) return null;
  return { value, decimals, unit: base.unit ? `${base.unit}^-1` : "", exact };
}

/** `+`/`-` で区切った項を、それぞれ「同じ単位の単一リテラル」として読めるなら返す。 */
function additiveFoldTerms(group: string, options: InferOptions): AdditiveFoldTerm[] | null {
  const { resolveIdentifier, seen = [] } = options;
  const terms: AdditiveFoldTerm[] = [];
  let sign: 1 | -1 = 1;
  let start = 0;
  let depth = 0;
  const pushTerm = (text: string, termSign: 1 | -1) => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    const direct = soleLiteralOf(trimmed);
    if (direct) {
      terms.push({ sign: termSign, ...direct, exact: false });
      return true;
    }
    // 識別子1つだけの項は、その定数の式が単一リテラルなら畳める（`R₁` → `10kΩ`）。
    const identifier = IDENTIFIER_PATTERN.exec(trimmed);
    if (identifier && identifier.index === 0 && identifier[0].length === trimmed.length) {
      if (seen.includes(trimmed)) return false;
      const referenced = resolveIdentifier?.(trimmed);
      if (!referenced) return false;
      const literal = soleLiteralOf(referenced.expression);
      if (!literal) return false;
      terms.push({ sign: termSign, ...literal, exact: referenced.exact === true });
      return true;
    }
    // `1/R` の形（合成抵抗・レンズの式）。逆数は桁数を保つので位を組み立て直せる。
    const reciprocal = resolveIdentifier ? reciprocalLiteralOf(trimmed, resolveIdentifier, seen) : null;
    if (!reciprocal) return false;
    terms.push({ sign: termSign, ...reciprocal });
    return true;
  };
  for (let index = 0; index < group.length; index += 1) {
    const character = group[index];
    if (character === "(") depth += 1;
    else if (character === ")") depth -= 1;
    else if (depth === 0 && (character === "+" || character === "-")) {
      // 先頭の符号（`-5m+3m` の `-`）と指数の符号（このモジュールは畳まないが念のため）は区切りにしない。
      const previous = group.slice(0, index).trim();
      if (!previous) continue;
      if (!pushTerm(group.slice(start, index), sign)) return null;
      sign = character === "+" ? 1 : -1;
      start = index + 1;
    }
  }
  if (!pushTerm(group.slice(start), sign)) return null;
  if (terms.length < 2) return null;
  if (terms.some((term) => term.unit !== terms[0].unit)) return null;
  // **全部が厳密値なら畳まない。** 従来から塞がない扱い（`60mm-20mm` は厳密に `40mm`）なので、
  // 畳んで測定値のリテラルに変えると、そこから桁が生まれて結果の丸めが変わってしまう。
  if (terms.every((term) => term.exact)) return null;
  return terms;
}

/**
 * 畳んだ結果のリテラル。位の規則で丸めた表記をそのまま返すので、**桁数は文字列から読める**
 * （`significantDigitsOfLiteral` がこのあと数える）。
 *
 * **単位は付けない。** 付けると `Ω^-1` のような逆数の単位を `unitSuffixEnd` が読み戻せず
 * （単位サフィックスの本体パターンにASCIIの `-` が無い）、`-` が引き算と解釈されて
 * かえって塞がる。桁を数えるのに単位は要らないので落とす。**ただし2つ手当てが必要**:
 * - オフセットを持つ単位（°C・°F）の加減算は畳まない。単位を落とすと、換算で位が変わる
 *   ことを見ている既存の判定をすり抜けてしまう（`20°C` を K で出す経路と同じ穴）。
 * - 位が0でも小数点を残す（`300` ではなく `300.`）。単位の付かない整数は「数式の係数」として
 *   数えない規則があるので、そのままでは畳んだ桁が消える。
 */
function foldAdditiveGroup(group: string, options: InferOptions): string | null {
  const terms = additiveFoldTerms(group, options);
  if (!terms) return null;
  if (hasOffsetUnit(terms[0].unit)) return null;
  // **位は測定値の項だけで決める。** 厳密値は精度の上限を作らない（`8mm`(厳密) + `1.25mm` は
  // 0.01の位まで読める）。全部厳密なケースは上で弾いてあるので、ここは必ず1件以上ある。
  const decimals = Math.min(...terms.filter((term) => !term.exact).map((term) => term.decimals));
  const sum = terms.reduce((total, term) => total + term.sign * term.value, 0);
  const rounded = Number(sum.toFixed(decimals));
  // 打ち消し合って0になる場合は畳まない（0に有効数字は無く、桁を主張できない）。
  if (rounded === 0) return null;
  const text = rounded.toFixed(decimals);
  return decimals > 0 ? text : `${text}.`;
}

/** 上の2つの形（式まるごと・括弧の中身まるごと）を、畳めるところまで畳んだ式を返す。 */
function foldSameUnitAdditions(source: string, options: InferOptions): string {
  // 式まるごとが加減算の並びなら、それを畳んだ1つのリテラルで置き換える。
  const whole = foldAdditiveGroup(source, options);
  if (whole !== null) return whole;
  // 括弧の中身は内側から畳む。畳むと外側が畳めるようになる場合があるので、変化が無くなるまで回す
  // （入れ子の深さぶんで必ず止まるが、万一のために上限を置く）。
  let folded = source;
  for (let round = 0; round < 8; round += 1) {
    let changed = false;
    // 内側の括弧（中に括弧を含まないもの）だけを見る。
    const pattern = /\(([^()]*)\)/g;
    let next = "";
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(folded)) !== null) {
      const replacement = foldAdditiveGroup(match[1], options);
      if (replacement === null) continue;
      next += folded.slice(lastIndex, match.index) + `(${replacement})`;
      lastIndex = match.index + match[0].length;
      changed = true;
    }
    if (!changed) break;
    folded = next + folded.slice(lastIndex);
  }
  return folded;
}

function scanSignificantDigits(expression: string, options: InferOptions): ScanResult {
  const { resolveIdentifier, seen = [] } = options;
  // 同じ単位どうしの加減算は、走査に入る前に1つのリテラルへ畳んでおく（foldSameUnitAdditions の項）。
  const source = foldSameUnitAdditions(normalizeExpression(expression), options);
  // **式の中に現れる単位なしの整数は、数式の係数として扱う**（測定値に数えない）。
  // `I = bh³/12` の 12・`J = πd⁴/32` の 32・`100*d/D` の 100 は書き方であって測った数ではない。
  // ここを測定値として数えると、図面の呼び寸法だけで決まる断面二次モーメントが
  // `341333.3333 mm⁴ → 340000 mm⁴` と、実在する桁を落とす方向に丸まる。
  //
  // **式まるごとが裸の整数のとき（`N = 200`・`T = 25`）だけは値として扱う。** そちらは
  // 定数の中身＝利用者が編集する数で、測定値でありうる（巻数のように厳密なものは
  // シード側で `exact` を付ける）。「係数か値か」を式の形だけで見分けられるのはこの一点。
  const isBareIntegerExpression = /^[-+]?\d+$/.test(source.trim());
  const tokens: ScanToken[] = [];
  // 開いている括弧が階乗の対象かどうか。`)` で pop するので入れ子でも対応が保てる。
  const parenIsFactorial: boolean[] = [];
  // 先頭は括弧の外（深さ0）ぶんの枠。`(` で push・`)` で pop するので parenIsFactorial と同じ動き。
  const frames: AdditiveFrame[] = [{ hasAdditive: false, hasMeasured: false }];
  const markMeasured = () => {
    frames[frames.length - 1].hasMeasured = true;
  };
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
        if (hasOffsetUnit(source.slice(next, unitEnd))) return { digits: null, blocked: true };
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
      // 単位の付かない整数が式の一部として現れたら数式の係数（上の isBareIntegerExpression の項）。
      // **ただし科学表記の仮数は測定値。** `123 × 10^8` の 123 は 1.23e10 を3桁で書いたもので、
      // 係数として読み飛ばすと入力した精度がそのまま消える（底の 10 を数えないのと対になる判定）。
      const isFormulaCoefficient =
        !isBareIntegerExpression && next === index + literal.length && /^\d+$/.test(literal) && !isScientificMantissa(source, next);
      if (!isExponentPosition(tokens) && !isScientificBase && !isFactorialTarget && !isFormulaCoefficient) {
        const digits = significantDigitsOfLiteral(literal);
        if (digits !== null) {
          minimum = minimum === null ? digits : Math.min(minimum, digits);
          // 桁を数えたリテラル＝測定値。加減算に巻き込まれていたら括弧を閉じるときに塞ぐ。
          // 数えなかったもの（指数の位置・科学表記の底・階乗の対象）は測定値ではないので印を付けない。
          markMeasured();
        }
      }
      tokens.push({ kind: "value" });
      index = next;
      continue;
    }

    if (character === "+" || character === "-") {
      // 直前が値なら二項の加減算。桁の決まり方が乗除と違うので、**測定値が絡んでいれば**丸めない。
      // ここで即 null にせず枠へ記録するのは、`F/((w-d)*t)` の `w-d` のように
      // 厳密値どうしの引き算（＝精度を失わない）を通すため。判定は `)` と走査の最後で行う。
      if (tokens[tokens.length - 1]?.kind === "value") frames[frames.length - 1].hasAdditive = true;
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
      if (character === "(") {
        parenIsFactorial.push(isFactorialParen(source, index));
        frames.push({ hasAdditive: false, hasMeasured: false });
      }
      tokens.push({ kind: "open" });
      index += 1;
      continue;
    }

    if (character === ")") {
      parenIsFactorial.pop();
      // 括弧を閉じた時点でその中の加減算の可否が確定する。測定値が混じっていたら塞ぐ。
      // hasAdditive は持ち上げない（中で決着が付いているので外側の判定には関わらない）が、
      // hasMeasured は持ち上げる（`(1.5m+2m)*3` の外側の加減算からは中身も測定値に見える）。
      const closed = frames.length > 1 ? frames.pop() : undefined;
      if (closed) {
        if (closed.hasAdditive && closed.hasMeasured) return { digits: null, blocked: true };
        if (closed.hasMeasured) markMeasured();
      }
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
      // **厳密値（図面の呼び寸法・個数）は辿らない。** 桁にも数えず測定値の印も付けないので、
      // `t=8mm` が結果を1桁に落とすことも、`w-d` が式を塞ぐこともなくなる。
      if (referenced !== undefined && !referenced.exact) {
        const sub = scanSignificantDigits(referenced.expression, { resolveIdentifier, seen: [...seen, name] });
        // 参照先が「読めない」なら、この式でも桁を主張しない（測定値の加減算が混ざっている）。
        if (sub.blocked) return { digits: null, blocked: true };
        // 参照先に測定値が1つも無い（＝厳密値だけで組まれた手順）ときは何も足さない。
        // ここを null で塞ぐと、厳密値だけの手順を1つ挟むだけで下流の丸めが止まる。
        if (sub.digits !== null) {
          minimum = minimum === null ? sub.digits : Math.min(minimum, sub.digits);
          markMeasured();
        }
      }
      tokens.push({ kind: "value" });
      index += name.length;
      continue;
    }

    // 単位専用の記号（Ω・µ・°・%）など、識別子にも数値にもならない1文字。
    tokens.push({ kind: "value" });
    index += 1;
  }

  // 閉じ括弧が足りない式（書きかけ）でも取りこぼさないよう、残った枠を全部見る。
  if (frames.some((frame) => frame.hasAdditive && frame.hasMeasured)) return { digits: null, blocked: true };
  return { digits: minimum, blocked: false };
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
  // 丸めたかどうかは**表示される値どうし**で見る（`toSignificantDecimal` と同じ理由）。
  // ここを素の `value` と比べると倍精度の誤差だけで真になり、`0.8000000000000002` を
  // 2桁で出したときに「元の値 0.8」という何も失われていない併記が付く。2.5 を2桁で
  // 出すような「そもそも桁が落ちない」場合に出さないのは従来どおり。
  const roundedFrom =
    digits !== null && Number(value.toPrecision(MAX_MANTISSA_DIGITS)) !== Number(exponential)
      ? formatNumberForLocale(value, options.locale)
      : null;
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
