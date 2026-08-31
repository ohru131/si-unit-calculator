import { describe, expect, it } from "vitest";

import { evaluateNotebookSteps, resolveNotebookLocalConstants } from "../lib/notebook-engine";
import { PRESET_NOTEBOOK_CATEGORIES, PRESET_NOTEBOOK_SEEDS } from "../lib/notebook-formulas";

describe("プリセット計算ノートの全ステップがエラーなく計算できる", () => {
  for (const category of PRESET_NOTEBOOK_CATEGORIES) {
    const seeds = PRESET_NOTEBOOK_SEEDS[category.id];
    if (!seeds) continue;
    for (const seed of seeds) {
      it(`${category.label} / ${seed.title}`, () => {
        const localConstants = seed.localConstants.map((constant, index) => ({
          id: `test-${index}`,
          symbol: constant.symbol,
          expression: constant.expression,
        }));
        const { resolved, errors } = resolveNotebookLocalConstants(localConstants, []);
        expect(errors).toEqual({});

        const steps = seed.steps.map((step, index) => ({
          id: `test-step-${index}`,
          title: step.title,
          expression: step.expression,
          targetUnit: step.targetUnit,
          formulaLatex: step.formulaLatex,
        }));
        const results = evaluateNotebookSteps(steps, resolved);
        for (const result of results) {
          expect(result.error, `${seed.title} > ${result.step.title}: ${result.error}`).toBeUndefined();
          expect(result.formatted).toBeTruthy();
        }
      });
    }
  }
});

describe("代表的なプリセットノートの数値が物理的に妥当な値になる", () => {
  function computeLast(categoryId: string, seedTitle: string) {
    const seed = PRESET_NOTEBOOK_SEEDS[categoryId]?.find((candidate) => candidate.title === seedTitle);
    if (!seed) throw new Error(`seed not found: ${categoryId} / ${seedTitle}`);
    const localConstants = seed.localConstants.map((constant, index) => ({ id: `c${index}`, symbol: constant.symbol, expression: constant.expression }));
    const { resolved, errors } = resolveNotebookLocalConstants(localConstants, []);
    expect(errors).toEqual({});
    const steps = seed.steps.map((step, index) => ({ id: `s${index}`, title: step.title, expression: step.expression, targetUnit: step.targetUnit, formulaLatex: step.formulaLatex }));
    const results = evaluateNotebookSteps(steps, resolved);
    return results[results.length - 1];
  }

  it("第一宇宙速度は約7.9km/sになる", () => {
    const result = computeLast("astronomy", "第一宇宙速度");
    expect(result.quantity!.siValue / 1000).toBeCloseTo(7.9, 1);
  });

  it("第二宇宙速度は約11.2km/sになる", () => {
    const result = computeLast("astronomy", "第二宇宙速度（脱出速度）");
    expect(result.quantity!.siValue / 1000).toBeCloseTo(11.2, 1);
  });

  it("ケプラーの第三法則から求めた地球の公転周期は約1年になる", () => {
    const result = computeLast("astronomy", "ケプラーの第三法則（地球の公転周期）");
    expect(result.quantity!.siValue / 31557600).toBeCloseTo(1, 1);
  });

  it("消費カロリー（METs法）は正しくkcalの次元になる", () => {
    const result = computeLast("fitness", "消費カロリー（METs法）");
    // 8 METs * 65kg * 0.5h * 1.05kcal/kg/h = 273 kcal
    expect(result.quantity!.siValue / 4184).toBeCloseTo(273, 0);
  });

  it("並列抵抗の合成が正しく計算できる", () => {
    const result = computeLast("electricity-basics", "抵抗の直列・並列合成");
    // 100Ω と 200Ω の並列は約66.7Ω
    expect(result.quantity!.siValue).toBeCloseTo(66.67, 1);
  });

  it("標準状態の気体のモル体積は約22.4Lになる", () => {
    const result = computeLast("chemistry", "気体の状態方程式（標準状態のモル体積）");
    expect(result.quantity!.siValue * 1000).toBeCloseTo(22.4, 1);
  });

  it("電気代の計算は通貨の次元を持たない数値になる", () => {
    const result = computeLast("electricity-basics", "消費電力量と電気代");
    // 1200W * 3h = 3.6kWh, 単価31円/kWhなら約111.6円
    expect(result.quantity!.siValue).toBeCloseTo(111.6, 1);
  });
});
