import { IDENTIFIER_BODY_CHAR_CLASS, IDENTIFIER_START_CHAR_CLASS } from "@/lib/units";

import type { NotebookSeed } from "@/lib/notebook-formulas/types";

const IDENTIFIER_ANCHORED_PATTERN = new RegExp(`^[${IDENTIFIER_START_CHAR_CLASS}][${IDENTIFIER_BODY_CHAR_CLASS}]*$`, "u");
const IDENTIFIER_TOKEN_PATTERN = new RegExp(`[${IDENTIFIER_START_CHAR_CLASS}][${IDENTIFIER_BODY_CHAR_CLASS}]*`, "gu");

// LaTeXのコマンド名 → 対応するUnicode文字。lib/units.ts が識別子として受け付ける文字だけを載せる。
// Ω（U+03A9 オーム）は単位専用として識別子から除外されているので \Omega は変換対象にしない
// （変換しなければ下の識別子チェックで弾かれ、その手順は記号なしのまま残る）。
const GREEK_COMMANDS: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", zeta: "ζ", eta: "η",
  theta: "θ", vartheta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π",
  rho: "ρ", sigma: "σ", tau: "τ", upsilon: "υ", phi: "φ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π", Sigma: "Σ", Upsilon: "Υ", Phi: "Φ", Psi: "Ψ",
};

// 下付き文字にできる文字だけの表。ここに無い文字（b・c・d・大文字など）を含む添字は変換できないので、
// その手順は記号なしのまま残す（無理に別表記へ寄せると、数式の記号と定数名が食い違ってしまう）。
const SUBSCRIPTS: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ", l: "ₗ", m: "ₘ", n: "ₙ", o: "ₒ", p: "ₚ",
  r: "ᵣ", s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ",
  β: "ᵦ", γ: "ᵧ", ρ: "ᵨ", φ: "ᵩ", χ: "ᵪ",
};

function toSubscript(text: string): string | null {
  let out = "";
  for (const character of text) {
    const mapped = SUBSCRIPTS[character];
    if (!mapped) return null;
    out += mapped;
  }
  return out;
}

/**
 * LaTeX の左辺（例: "F"、"v_0"、"\rho"、"F_{pull}"、"\text{pace}"）を、計算エンジンがそのまま
 * 識別子として受け付ける記号（"F"、"v₀"、"ρ"、"Fₚᵤₗₗ"、"pace"）へ変換する。
 * 変換できない形（分数・プライム記号・数字始まり・下付きにできない文字を含む添字など）は null。
 *
 * プリセットの定数名を数式の記号そのものに揃えてある（PR #18）のと同じ方針を、手順の結果記号にも
 * 広げるためのもの。表示用の別名を持たせるのではなく、実際にエンジンが解決する名前をそろえる。
 */
export function latexToIdentifier(latex: string): string | null {
  let text = latex.trim();
  if (!text) return null;

  // \text{...} / \mathrm{...} は中身がそのまま記号名（例: \text{pace} → pace）。
  text = text.replace(/\\(?:text|mathrm|mathit)\{([^{}]*)\}/g, "$1");
  // ギリシャ文字コマンドを実際の文字へ。長い名前から順に置換しないと \varepsilon が \var+epsilon に割れる。
  for (const name of Object.keys(GREEK_COMMANDS).sort((left, right) => right.length - left.length)) {
    text = text.split(`\\${name}`).join(GREEK_COMMANDS[name]);
  }
  // 下付き文字にできる添字は下付きで（数式の見た目に近い mₛₒₗ）、できないもの（大文字・b・c・g など
  // Unicodeに下付き字形が無い文字を含む m_{CuO} や HR_{target}）は ASCII のアンダースコアで綴る
  // （"_" もエンジンが受け付ける識別子文字なので、記号なしにするより数式に近い）。
  return convertSubscripts(text, true) ?? convertSubscripts(text, false);
}

function convertSubscripts(text: string, unicode: boolean): string | null {
  let converted = "";
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== "_") {
      converted += text[index];
      continue;
    }
    let body: string;
    if (text[index + 1] === "{") {
      const close = text.indexOf("}", index + 2);
      if (close < 0) return null;
      body = text.slice(index + 2, close);
      index = close;
    } else {
      body = text[index + 1] ?? "";
      index += 1;
    }
    if (!body) return null;
    if (unicode) {
      const subscript = toSubscript(body);
      if (subscript === null) return null;
      converted += subscript;
    } else {
      converted += `_${body}`;
    }
  }

  const symbol = converted.replace(/[\s~]/g, "");
  return IDENTIFIER_ANCHORED_PATTERN.test(symbol) ? symbol : null;
}

/** "F = ma" の左辺だけを取り出す。"=" が無ければ null（等式でない数式は記号を決められない）。 */
function equationLeftSide(latex: string): string | null {
  const index = latex.indexOf("=");
  return index < 0 ? null : latex.slice(0, index);
}

/** 式の中の識別子トークンだけを置き換える。単位や数値の一部（"3m/s" の m など）は対象にしない。 */
function renameIdentifiers(expression: string, renames: Map<string, string>): string {
  if (!renames.size) return expression;
  return expression.replace(IDENTIFIER_TOKEN_PATTERN, (token) => renames.get(token) ?? token);
}

/**
 * 手順に resultSymbol が無いプリセットへ、数式（formulaLatex）の左辺から導いた記号を補う。
 *
 * 補うと結果欄が「m*a」ではなく「F = m*a」という等式として読めるようになる。
 * ただし resultSymbol を付けた手順は s1・s2… では参照できなくなり、しかも s1 は未定義エラーに
 * ならず単位の s（1秒）として黙って解釈される（CLAUDE.md の落とし穴）ので、後続手順の
 * s1・s2… 参照も同時に新しい記号へ書き換える。
 *
 * 既にローカル定数や他の手順が使っている記号とぶつかる場合は、シャドーイングで値が変わるのを
 * 避けるため補わない（その手順は従来どおり式だけの表示になる）。
 */
export function withDerivedResultSymbols(seed: NotebookSeed): NotebookSeed {
  const taken = new Set<string>([
    ...seed.localConstants.map((constant) => constant.symbol),
    ...seed.steps.map((step) => step.resultSymbol).filter((symbol): symbol is string => Boolean(symbol)),
  ]);
  const renames = new Map<string, string>();
  let changed = false;

  const steps = seed.steps.map((step, index) => {
    // 先行手順の記号が変わっているかもしれないので、まず参照を更新する。
    const expression = renameIdentifiers(step.expression, renames);
    if (expression !== step.expression) changed = true;
    if (step.resultSymbol) return expression === step.expression ? step : { ...step, expression };

    const leftSide = step.formulaLatex ? equationLeftSide(step.formulaLatex) : null;
    const symbol = leftSide ? latexToIdentifier(leftSide) : null;
    if (!symbol || taken.has(symbol)) return expression === step.expression ? step : { ...step, expression };

    taken.add(symbol);
    renames.set(`s${index + 1}`, symbol);
    changed = true;
    return { ...step, expression, resultSymbol: symbol };
  });

  return changed ? { ...seed, steps } : seed;
}

type StoredStep = { expression: string; resultSymbol?: string };
type SeedStepShape = { expression: string; resultSymbol?: string };

/**
 * 既にプリセットを投入済みのインストールへ、後から導出した結果記号を反映するための差分。
 *
 * プリセットの投入はカテゴリ単位で1回きり（冪等）なので、withDerivedResultSymbols を入れただけでは
 * 新規インストールにしか効かない。かといって保存済みノートを無条件に上書きすると、ユーザーが
 * 手順の式を書き換えていた場合にそれを消してしまう。
 *
 * そこで「手順の数も式もすべて投入時のまま」＝一度も式を編集していないノートに限って反映する。
 * 手順が1つでも編集されていれば、s1 参照の書き換えが噛み合う保証が無いのでノートごと見送る
 * （s1 は未定義エラーにならず単位の s として黙って解釈されるため、中途半端に当てる方が危険）。
 * 変更が要らないときは null を返す。
 */
export function presetResultSymbolPatch<T extends StoredStep>(
  steps: T[],
  rawSeedSteps: SeedStepShape[],
  derivedSeedSteps: SeedStepShape[],
): T[] | null {
  if (steps.length !== rawSeedSteps.length || steps.length !== derivedSeedSteps.length) return null;
  if (steps.some((step, index) => step.expression !== rawSeedSteps[index].expression)) return null;

  let changed = false;
  const next = steps.map((step, index) => {
    const derived = derivedSeedSteps[index];
    const expression = derived.expression;
    const resultSymbol = step.resultSymbol ?? derived.resultSymbol;
    if (expression === step.expression && resultSymbol === step.resultSymbol) return step;
    changed = true;
    return { ...step, expression, resultSymbol };
  });
  return changed ? next : null;
}
