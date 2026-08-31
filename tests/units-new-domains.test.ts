import { describe, expect, it } from "vitest";

import { evaluateExpression, formatQuantity } from "../lib/units";

describe("新しい分野向けに追加した単位", () => {
  it("カロリー・キロカロリーはジュールへ正しく換算される", () => {
    expect(evaluateExpression("1cal").siValue).toBeCloseTo(4.184);
    expect(evaluateExpression("1kcal").siValue).toBeCloseTo(4184);
    expect(formatQuantity(evaluateExpression("4184J"), "kcal")).toBe("1 kcal");
  });

  it("心拍数・回転数は周波数（Hz）として扱える", () => {
    expect(evaluateExpression("60bpm").siValue).toBeCloseTo(1);
    expect(evaluateExpression("3000rpm").siValue).toBeCloseTo(50);
  });

  it("計量カップ・大さじ・小さじは体積として扱え、mLへ換算できる", () => {
    expect(formatQuantity(evaluateExpression("1cup"), "mL")).toBe("236.5882365 mL");
    expect(formatQuantity(evaluateExpression("3tsp"), "tbsp")).toBe("1 tbsp");
  });

  it("天文単位・光年・年は太陽系や恒星間の距離・時間で使える", () => {
    expect(evaluateExpression("1au").siValue).toBeCloseTo(1.495978707e11);
    expect(evaluateExpression("1ly").siValue).toBeCloseTo(9.4607304725808e15);
    expect(formatQuantity(evaluateExpression("1yr"), "d")).toBe("365.25 d");
  });

  it("物質量（mol）は化学の量的関係の計算に使える", () => {
    expect(evaluateExpression("2mol").siValue).toBeCloseTo(2);
    expect(evaluateExpression("500mmol").siValue).toBeCloseTo(0.5);
  });
});
