import { describe, expect, it } from "vitest";

import { PRESET_NOTEBOOK_SEEDS } from "../lib/notebook-formulas";
import { evaluateNotebookSteps, resolveNotebookLocalConstants } from "../lib/notebook-engine";
import type { NotebookSeedConstant } from "../lib/notebook-formulas/types";
import { PRESET_PRICE_PROFILES, type PresetRegionalDefaults, resolvePresetRegionalDefaults } from "../lib/preset-regional-defaults";

// lib/calculator-store.tsx の presetConstantExpression と同じ差し替え（あちらは React Native ごと
// 読み込まれるのでテストから import しない。tests/preset-regional-defaults.test.ts はモックで回避している）。
function presetConstantExpression(constant: NotebookSeedConstant, defaults: PresetRegionalDefaults): string {
  return constant.regionalDefault ? defaults[constant.regionalDefault] : constant.expression;
}

// お金の計算は単位が付かないので、次元の検査では式の誤りを拾えない（`r/12` を `r*12` と書いても
// エラーにならず値だけが外れる）。広く知られた答えと突き合わせて、式そのものを固定する。

function evaluateSeed(categoryId: string, titleEn: string, currency: string) {
  const seed = PRESET_NOTEBOOK_SEEDS[categoryId].find((candidate) => candidate.title.en === titleEn);
  if (!seed) throw new Error(`seed not found: ${titleEn}`);
  const defaults = resolvePresetRegionalDefaults(currency, null, "en");
  const constants = seed.localConstants.map((constant, index) => ({ id: `c${index}`, symbol: constant.symbol, expression: presetConstantExpression(constant, defaults) }));
  const { resolved, errors } = resolveNotebookLocalConstants(constants, [], "en");
  expect(errors).toEqual({});
  const steps = seed.steps.map((step, index) => ({ id: `s${index}`, title: step.title.en, expression: step.expression, targetUnit: step.targetUnit, resultSymbol: step.resultSymbol }));
  const results = evaluateNotebookSteps(steps, resolved, "en");
  return (title: string) => {
    const result = results.find((candidate) => candidate.step.title === title);
    if (!result?.quantity) throw new Error(`step failed: ${title} ${result?.error ?? ""}`);
    return result.quantity.siValue;
  };
}

describe("資産運用・不動産のプリセット", () => {
  it("元利均等の月々の返済額が一般的な計算と一致する（36万ドル・年6.5%・30年 → 2275.44）", () => {
    const value = evaluateSeed("real-estate", "Mortgage payment (fixed monthly payment)", "USD");
    expect(value("Loan amount")).toBeCloseTo(360000, 6);
    expect(value("Monthly payment")).toBeCloseTo(2275.44, 2);
    expect(value("Total interest")).toBeCloseTo(value("Monthly payment") * 360 - 360000, 6);
  });

  it("元金均等の利息の総額は元利均等より少ない", () => {
    const level = evaluateSeed("real-estate", "Mortgage payment (fixed monthly payment)", "JPY");
    const equal = evaluateSeed("real-estate", "Mortgage with equal principal repayments", "JPY");
    expect(equal("Total interest")).toBeLessThan(level("Total interest"));
    expect(equal("First payment")).toBeGreaterThan(level("Monthly payment"));
  });

  it("残高は満期で0になる（k=n のとき）", () => {
    const seed = PRESET_NOTEBOOK_SEEDS["real-estate"].find((candidate) => candidate.title.en.startsWith("Remaining mortgage balance"))!;
    const defaults = resolvePresetRegionalDefaults("EUR", null, "en");
    const constants = seed.localConstants.map((constant, index) => ({
      id: `c${index}`,
      symbol: constant.symbol,
      expression: constant.symbol === "k" ? "30" : presetConstantExpression(constant, defaults),
    }));
    const { resolved } = resolveNotebookLocalConstants(constants, [], "en");
    const steps = seed.steps.map((step, index) => ({ id: `s${index}`, title: step.title.en, expression: step.expression, targetUnit: step.targetUnit, resultSymbol: step.resultSymbol }));
    const balance = evaluateNotebookSteps(steps, resolved, "en").find((result) => result.step.resultSymbol === "B_k");
    expect(Math.abs(balance?.quantity?.siValue ?? Number.NaN)).toBeLessThan(1e-6);
  });

  it("積立の将来価値は年金終価の公式どおり（月500・年5%・20年 → 約205,517）", () => {
    const value = evaluateSeed("investing", "Monthly investing plan (future value of regular contributions)", "USD");
    expect(value("Final value")).toBeCloseTo(205516.83, 1);
    expect(value("Total paid in")).toBe(120000);
  });

  it("取り崩しは T 年で使い切る率なら、ちょうど T 年もつ", () => {
    const value = evaluateSeed("investing", "Retirement drawdown (how long savings last)", "USD");
    expect(value("Years the savings last")).toBeCloseTo(30.99891276 * 365.25 * 86400, -2);
    expect(value("Withdrawal rate that lasts T years")).toBeCloseTo(0.0510192593, 9);
  });

  it("物件価格と家賃は同じ物件の組になっている（表面利回りが2〜7%に収まる）", () => {
    for (const [currency, profile] of Object.entries(PRESET_PRICE_PROFILES)) {
      const grossYield = (12 * profile.monthlyRent) / profile.propertyPrice;
      expect(grossYield, currency).toBeGreaterThan(0.02);
      expect(grossYield, currency).toBeLessThan(0.07);
    }
  });
});
