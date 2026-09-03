import { describe, expect, it } from "vitest";

import { PRESET_NOTEBOOK_SEEDS } from "@/lib/notebook-formulas";
import type { NotebookSeed } from "@/lib/notebook-formulas/types";
import { latexToIdentifier, presetResultSymbolPatch, withDerivedResultSymbols } from "@/lib/notebook-result-symbols";
import { IDENTIFIER_BODY_CHAR_CLASS, IDENTIFIER_START_CHAR_CLASS } from "@/lib/units";

const IDENTIFIER_ANCHORED = new RegExp(`^[${IDENTIFIER_START_CHAR_CLASS}][${IDENTIFIER_BODY_CHAR_CLASS}]*$`, "u");

describe("latexToIdentifier", () => {
  it("そのまま識別子になる記号", () => {
    expect(latexToIdentifier("F")).toBe("F");
    expect(latexToIdentifier(" BMI ")).toBe("BMI");
  });

  it("ギリシャ文字コマンドを実際の文字に直す", () => {
    expect(latexToIdentifier("\\rho")).toBe("ρ");
    expect(latexToIdentifier("\\omega")).toBe("ω");
    expect(latexToIdentifier("\\Delta L")).toBe("ΔL");
    // \varepsilon が \var + epsilon に割れないこと（長い名前から置換する必要がある）。
    expect(latexToIdentifier("\\varepsilon")).toBe("ε");
  });

  it("\\text{...} は中身をそのまま記号にする", () => {
    expect(latexToIdentifier("\\text{pace}")).toBe("pace");
  });

  it("下付き字形のある添字はUnicodeの下付き文字にする", () => {
    expect(latexToIdentifier("v_0")).toBe("v₀");
    expect(latexToIdentifier("F_{pull}")).toBe("Fₚᵤₗₗ");
    expect(latexToIdentifier("HR_{max}")).toBe("HRₘₐₓ");
  });

  // b・c・g や大文字にはUnicodeの下付き字形が無い。記号なしにするよりは数式に近いので
  // ASCIIのアンダースコアで綴る（"_" もエンジンが受け付ける識別子文字）。
  it("下付き字形の無い添字はアンダースコアで綴る", () => {
    expect(latexToIdentifier("F_b")).toBe("F_b");
    expect(latexToIdentifier("T_K")).toBe("T_K");
    expect(latexToIdentifier("m_{CuO}")).toBe("m_CuO");
    expect(latexToIdentifier("HR_{target}")).toBe("HR_target");
  });

  it("識別子にできない形はnull", () => {
    expect(latexToIdentifier("\\dfrac{1}{a} + \\dfrac{1}{b}")).toBeNull();
    expect(latexToIdentifier("f'")).toBeNull();
    expect(latexToIdentifier("1RM")).toBeNull();
    // ° は単位側の解釈を壊すため識別子から除外されている。
    expect(latexToIdentifier("T_{°C}")).toBeNull();
    // Ω（オーム）も単位専用。
    expect(latexToIdentifier("\\Omega")).toBeNull();
    expect(latexToIdentifier("")).toBeNull();
  });
});

function seed(overrides: Partial<NotebookSeed>): NotebookSeed {
  return {
    title: { en: "test" },
    description: { en: "test" },
    localConstants: overrides.localConstants ?? [],
    steps: overrides.steps ?? [],
    ...overrides,
  } as NotebookSeed;
}

describe("withDerivedResultSymbols", () => {
  it("数式の左辺から結果記号を補う", () => {
    const result = withDerivedResultSymbols(seed({
      localConstants: [{ symbol: "m", expression: "2kg" }, { symbol: "a", expression: "3m/s^2" }],
      steps: [{ title: { en: "Force" }, expression: "m*a", targetUnit: "N", formulaLatex: "F = ma" }],
    }));
    expect(result.steps[0].resultSymbol).toBe("F");
  });

  // resultSymbolを付けた手順は s1 で参照できなくなる。しかも s1 は未定義エラーにならず
  // 単位の s（1秒）として黙って解釈されるので、参照も同時に書き換えないと値が静かに壊れる。
  it("後続手順の s1 参照を新しい記号へ書き換える", () => {
    const result = withDerivedResultSymbols(seed({
      localConstants: [{ symbol: "F", expression: "10N" }, { symbol: "d", expression: "2m" }, { symbol: "t", expression: "4s" }],
      steps: [
        { title: { en: "Work" }, expression: "F*d", targetUnit: "J", formulaLatex: "W = Fd" },
        { title: { en: "Power" }, expression: "s1/t", targetUnit: "W", formulaLatex: "P = \\dfrac{W}{t}" },
      ],
    }));
    expect(result.steps[0].resultSymbol).toBe("W");
    expect(result.steps[1].expression).toBe("W/t");
    expect(result.steps[1].resultSymbol).toBe("P");
  });

  it("ローカル定数と同じ記号にはしない（シャドーイングで値が変わるため）", () => {
    const result = withDerivedResultSymbols(seed({
      localConstants: [{ symbol: "ε", expression: "0.001" }, { symbol: "E", expression: "205GPa" }, { symbol: "σ₀", expression: "100MPa" }],
      steps: [{ title: { en: "Strain" }, expression: "σ₀/E", targetUnit: "", formulaLatex: "\\varepsilon = \\dfrac{\\sigma_0}{E}" }],
    }));
    expect(result.steps[0].resultSymbol).toBeUndefined();
    expect(result.steps[0].expression).toBe("σ₀/E");
  });

  it("同じ記号の手順が2つあるとき、2つ目には付けない", () => {
    const result = withDerivedResultSymbols(seed({
      localConstants: [{ symbol: "a", expression: "18.0g/m³" }, { symbol: "b", expression: "23.1g/m³" }],
      steps: [
        { title: { en: "RH1" }, expression: "a/b", targetUnit: "%", formulaLatex: "RH = \\dfrac{a}{b}" },
        { title: { en: "RH2" }, expression: "b/a", targetUnit: "%", formulaLatex: "RH = \\dfrac{b}{a}" },
      ],
    }));
    expect(result.steps[0].resultSymbol).toBe("RH");
    expect(result.steps[1].resultSymbol).toBeUndefined();
  });

  it("明示のresultSymbolは尊重する", () => {
    const result = withDerivedResultSymbols(seed({
      steps: [{ title: { en: "x" }, expression: "1m", targetUnit: "m", resultSymbol: "given", formulaLatex: "F = ma" }],
    }));
    expect(result.steps[0].resultSymbol).toBe("given");
  });

  it("式の中の単位は書き換えない（renameは識別子トークンだけ）", () => {
    const result = withDerivedResultSymbols(seed({
      localConstants: [{ symbol: "v", expression: "10m/s" }],
      steps: [
        { title: { en: "d" }, expression: "v*3s", targetUnit: "m", formulaLatex: "d = vt" },
        { title: { en: "e" }, expression: "s1*2", targetUnit: "m", formulaLatex: "e = 2d" },
      ],
    }));
    expect(result.steps[0].expression).toBe("v*3s");
    expect(result.steps[1].expression).toBe("d*2");
  });
});

describe("プリセット全体の不変条件", () => {
  const allSeeds = Object.values(PRESET_NOTEBOOK_SEEDS).flat();

  it("導出された記号はすべてエンジンの識別子として成立する", () => {
    const symbols = allSeeds.flatMap((entry) => entry.steps.map((step) => step.resultSymbol).filter(Boolean));
    expect(symbols.length).toBeGreaterThan(100);
    symbols.forEach((symbol) => expect(IDENTIFIER_ANCHORED.test(symbol!)).toBe(true));
  });

  it("結果記号がローカル定数・他の手順とぶつかっていない", () => {
    allSeeds.forEach((entry) => {
      const seen = new Set(entry.localConstants.map((constant) => constant.symbol));
      entry.steps.forEach((step) => {
        if (!step.resultSymbol) return;
        expect(seen.has(step.resultSymbol), `${entry.title.en}: ${step.resultSymbol}`).toBe(false);
        seen.add(step.resultSymbol);
      });
    });
  });

  // resultSymbolを付けた手順は s1・s2… では参照できない。s1 は未定義エラーにならず単位の s
  // （1秒）として黙って解釈されるため、次元が通ってしまう式では気付かないまま間違った答えが出る。
  it("記号を持つ手順を s1・s2… で参照している式が残っていない", () => {
    const stale: string[] = [];
    allSeeds.forEach((entry) => {
      entry.steps.forEach((step, index) => {
        if (!step.resultSymbol) return;
        const reference = new RegExp(`(^|[^${IDENTIFIER_BODY_CHAR_CLASS}])s${index + 1}([^${IDENTIFIER_BODY_CHAR_CLASS}]|$)`, "u");
        entry.steps.slice(index + 1).forEach((later) => {
          if (reference.test(later.expression)) stale.push(`${entry.title.en}: s${index + 1} in "${later.expression}"`);
        });
      });
    });
    expect(stale).toEqual([]);
  });
});

describe("presetResultSymbolPatch", () => {
  const rawSeedSteps = [{ expression: "F*d" }, { expression: "s1/t" }];
  const derivedSeedSteps = [{ expression: "F*d", resultSymbol: "W" }, { expression: "W/t", resultSymbol: "P" }];

  it("投入時のままのノートには記号と書き換え後の式を当てる", () => {
    const patched = presetResultSymbolPatch([{ expression: "F*d" }, { expression: "s1/t" }], rawSeedSteps, derivedSeedSteps);
    expect(patched).toEqual([
      { expression: "F*d", resultSymbol: "W" },
      { expression: "W/t", resultSymbol: "P" },
    ]);
  });

  // 式を1つでも編集していれば、s1 参照の書き換えが噛み合う保証が無い。s1 は未定義エラーに
  // ならず単位の s（1秒）として黙って解釈されるので、中途半端に当てる方が危険。
  it("式が1つでも編集されていればノートごと見送る", () => {
    expect(presetResultSymbolPatch([{ expression: "F*d*2" }, { expression: "s1/t" }], rawSeedSteps, derivedSeedSteps)).toBeNull();
    expect(presetResultSymbolPatch([{ expression: "F*d" }, { expression: "s1/t/2" }], rawSeedSteps, derivedSeedSteps)).toBeNull();
  });

  it("手順を足したり消したりしていれば見送る", () => {
    expect(presetResultSymbolPatch([{ expression: "F*d" }], rawSeedSteps, derivedSeedSteps)).toBeNull();
  });

  it("既に記号を持つ手順の記号は上書きしない", () => {
    const patched = presetResultSymbolPatch([{ expression: "F*d", resultSymbol: "mine" }, { expression: "s1/t" }], rawSeedSteps, derivedSeedSteps);
    expect(patched?.[0].resultSymbol).toBe("mine");
  });

  it("当てるものが無ければnull（毎回の起動で書き込みが走らないように）", () => {
    const already = [{ expression: "F*d", resultSymbol: "W" }, { expression: "W/t", resultSymbol: "P" }];
    expect(presetResultSymbolPatch(already, rawSeedSteps, derivedSeedSteps)).toBeNull();
  });
});
