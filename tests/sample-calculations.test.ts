import { describe, expect, it } from "vitest";

import { APP_LANGUAGES } from "../lib/i18n";
import { SAMPLE_CALCULATIONS, SAMPLE_CATEGORIES } from "../lib/sample-calculations";
import { convertQuantity, evaluateExpression } from "../lib/units";

describe("サンプル計算式", () => {
  it("すべてのカテゴリに少なくとも1件のサンプルがある", () => {
    // 空のカテゴリはタップしても何も出ないので、カテゴリだけ足して中身を忘れると
    // 「押せるのに何も起きないチップ」になる。
    for (const category of SAMPLE_CATEGORIES) {
      expect(SAMPLE_CALCULATIONS.filter((sample) => sample.category === category.id), category.id).not.toHaveLength(0);
    }
  });

  it("すべてのサンプルのカテゴリはカテゴリ一覧に存在する", () => {
    const categoryIds = new Set(SAMPLE_CATEGORIES.map((category) => category.id));
    for (const sample of SAMPLE_CALCULATIONS) {
      expect(categoryIds.has(sample.category), sample.id).toBe(true);
    }
  });

  it("カテゴリ名・サンプルの文言が6言語そろっている", () => {
    // LocalizedText は en 以外が任意なので、抜けても型エラーにならない（英語へ静かに落ちる）。
    // ターゲット層向けの文言は「その言語で読めること」が価値なので、ここで機械的に検出する。
    for (const language of APP_LANGUAGES) {
      for (const category of SAMPLE_CATEGORIES) {
        expect(category.label[language], `${category.id}/${language}`).toBeTruthy();
      }
      for (const sample of SAMPLE_CALCULATIONS) {
        expect(sample.title[language], `${sample.id}/title/${language}`).toBeTruthy();
        expect(sample.description[language], `${sample.id}/description/${language}`).toBeTruthy();
      }
    }
  });

  it("IDが重複していない", () => {
    const ids = SAMPLE_CALCULATIONS.map((sample) => sample.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("ターゲット層向けサンプルの数値", () => {
  const value = (expression: string, targetUnit: string) => convertQuantity(evaluateExpression(expression), targetUnit).value;

  it("接頭語の打ち消し・µの桁飛びが期待どおりの桁に収まる", () => {
    // kΩ × mA → V（k と m が打ち消える）。独語圏の Zehnerpotenzen / 日本の電験で落とす桁。
    expect(value("4.7kΩ × 2mA", "V")).toBeCloseTo(9.4);
    // µF × V は6桁分ずれるので、答えは C ではなく mC の桁に来る。
    expect(value("470µF × 12V", "mC")).toBeCloseTo(5.64);
  });

  it("試験の定番換算（km/h → m/s、W×h → kWh、三相電力）が正しい", () => {
    expect(value("72km/h", "m/s")).toBeCloseTo(20);
    expect(value("100W × 3h", "kWh")).toBeCloseTo(0.3);
    expect(value("sqrt(3) × 200V × 10A × 0.8", "kW")).toBeCloseTo(2.7713, 3);
  });

  it("実験レポートの換算（密度・濃度・絶対温度）が正しい", () => {
    // g/cm³ → kg/m³ は1000倍。100倍と取り違えるのが定番の誤り。
    expect(value("1.2g/cm³", "kg/m³")).toBeCloseTo(1200);
    // mL を L に直し忘れると1000倍ずれる（仏語圏の教材が名指しする躓き）。
    expect(value("0.5mol ÷ 250mL", "mol/L")).toBeCloseTo(2);
    expect(value("25°C", "K")).toBeCloseTo(298.15);
  });
});
