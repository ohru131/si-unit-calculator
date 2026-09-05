/**
 * 小数で出た結果を、分数・πの倍数・平方根の倍数といった「きれいな形」へ言い当てるための純関数。
 *
 * 電卓の計算は常に倍精度小数で行い、ここでは**表示のときだけ**元の形を推定する。値そのものを
 * 有理数で持ち回る（記号計算にする）方向へは進めない。単位計算エンジン（lib/units.ts）は
 * 7次元ベクトルと数値の組で全て組み立てられていて、そこへ有理数型を混ぜると換算・単位の
 * べき乗・三角関数まで全部書き直しになるため。表示側の推定だけなら影響範囲がこのファイルに閉じる。
 */

export type ExactValueKind = "rational" | "pi" | "sqrt";

export type ExactValue = {
  kind: ExactValueKind;
  /** KaTeXへ渡すLaTeX。 */
  latex: string;
  /** LaTeXを描けない場所（コピー・読み上げ・テスト）用のUnicode表記。 */
  text: string;
};

type Rational = { numerator: number; denominator: number };

// 分母の上限。1000程度までなら「3/8」「7/125」のように読んで意味のある分数に収まる。
// これを上げるほど 1234.5678 のような打ち込んだだけの小数まで分数化してしまい、かえって読みにくい。
const MAX_DENOMINATOR = 1000;
// 平方根の係数は分母を小さく抑える。√3/2 や 2√2/3 のような三角関数由来の値が目当てで、
// 分母が大きい平方根倍（97√5/89 など）は当たっても意味が読み取れないため。
const SQRT_MAX_DENOMINATOR = 100;
const MAX_NUMERATOR = 1_000_000;

// 一致とみなす相対誤差。倍精度の丸め（相対1e-16程度）は確実に拾い、かつ「たまたま近い」だけの
// 値を拾わない幅。分母1000までの有理数がこの幅に偶然入る確率は1e-6程度で、実用上は無視できる。
const RELATIVE_TOLERANCE = 1e-12;

// 分数化を試みる範囲。下限より小さい値・上限より大きい値は formatNumber が指数表記へ切り替える
// 領域で、分数にしても桁が読めない。
const MIN_MAGNITUDE = 1e-6;
const MAX_MAGNITUDE = 1e6;

// √の中に入れる候補。平方因子を持つ数（√8 など）は候補にしない。約分すると 2√2 の形になり、
// 係数側（numerator）が吸収してくれるため。50までで sin/cos/tan と√の四則から出る値は網羅できる。
const SQRT_RADICANDS: number[] = (() => {
  const radicands: number[] = [];
  for (let candidate = 2; candidate <= 50; candidate += 1) {
    let squareFree = true;
    for (let divisor = 2; divisor * divisor <= candidate; divisor += 1) {
      if (candidate % (divisor * divisor) === 0) {
        squareFree = false;
        break;
      }
    }
    if (squareFree) radicands.push(candidate);
  }
  return radicands;
})();

function isCloseEnough(approximation: number, target: number): boolean {
  return Math.abs(approximation - target) <= RELATIVE_TOLERANCE * Math.abs(target);
}

/**
 * 連分数展開で、分母が maxDenominator 以下の最良近似を探す。
 * 総当たりではなく連分数を使うのは、「分母N以下で最も近い分数」がこの漸化式で必ず現れるため
 * （近似の質を落とさずに、探索を高々32回のループに抑えられる）。
 * 収束分数 h/k は必ず既約なので、呼び出し側で約分し直す必要はない。
 */
export function bestRational(value: number, maxDenominator: number): Rational | null {
  if (!Number.isFinite(value) || value === 0) return null;
  const sign = value < 0 ? -1 : 1;
  const target = Math.abs(value);
  let remainder = target;
  let previousNumerator = 0;
  let numerator = 1;
  let previousDenominator = 1;
  let denominator = 0;

  for (let step = 0; step < 32; step += 1) {
    const whole = Math.floor(remainder);
    const nextNumerator = whole * numerator + previousNumerator;
    const nextDenominator = whole * denominator + previousDenominator;
    if (!Number.isSafeInteger(nextNumerator) || !Number.isSafeInteger(nextDenominator)) break;
    if (nextDenominator > maxDenominator || nextNumerator > MAX_NUMERATOR) break;
    previousNumerator = numerator;
    numerator = nextNumerator;
    previousDenominator = denominator;
    denominator = nextDenominator;
    if (denominator > 0 && isCloseEnough(numerator / denominator, target)) {
      return { numerator: sign * numerator, denominator };
    }
    const fraction = remainder - whole;
    if (fraction === 0) break;
    remainder = 1 / fraction;
  }
  return null;
}

/** 「係数 × 記号 ÷ 分母」の形をLaTeXとUnicodeの両方に組み立てる。symbolが空なら素の分数。 */
function buildFraction(rational: Rational, symbol: { latex: string; text: string } | null): { latex: string; text: string } {
  const sign = rational.numerator < 0 ? "-" : "";
  const magnitude = Math.abs(rational.numerator);
  // 記号が付くときだけ係数1を省く（πを「1π」とは書かないため）。素の分数では 1/2 の 1 は必要。
  const showsCoefficient = !symbol || magnitude !== 1;
  const numeratorLatex = `${showsCoefficient ? magnitude : ""}${symbol?.latex ?? ""}`;
  const numeratorText = `${showsCoefficient ? magnitude : ""}${symbol?.text ?? ""}`;
  if (rational.denominator === 1) {
    return { latex: `${sign}${numeratorLatex}`, text: `${sign}${numeratorText}` };
  }
  return {
    latex: `${sign}\\frac{${numeratorLatex}}{${rational.denominator}}`,
    text: `${sign}${numeratorText}/${rational.denominator}`,
  };
}

/**
 * 小数を「分数」「πの有理数倍」「平方根の有理数倍」のいずれかとして言い当てる。当たらなければnull。
 * 判定は必ずこの順で行う。πや√の判定を先にすると、2.5 のような素直な分数まで
 * 「0.7957...π」のような読めない形に化けてしまう。
 */
export function findExactValue(value: number): ExactValue | null {
  if (!Number.isFinite(value)) return null;
  const magnitude = Math.abs(value);
  if (magnitude < MIN_MAGNITUDE || magnitude >= MAX_MAGNITUDE) return null;
  // 整数は小数表示のままで過不足がない。分数(5/1)にしても読みにくくなるだけなので出さない。
  if (Number.isInteger(value)) return null;

  const rational = bestRational(value, MAX_DENOMINATOR);
  if (rational && rational.denominator > 1) {
    return { kind: "rational", ...buildFraction(rational, null) };
  }

  const piMultiple = bestRational(value / Math.PI, MAX_DENOMINATOR);
  if (piMultiple) {
    return { kind: "pi", ...buildFraction(piMultiple, { latex: "\\pi", text: "π" }) };
  }

  for (const radicand of SQRT_RADICANDS) {
    const sqrtMultiple = bestRational(value / Math.sqrt(radicand), SQRT_MAX_DENOMINATOR);
    if (!sqrtMultiple) continue;
    return {
      kind: "sqrt",
      ...buildFraction(sqrtMultiple, { latex: `\\sqrt{${radicand}}`, text: `√${radicand}` }),
    };
  }

  return null;
}
