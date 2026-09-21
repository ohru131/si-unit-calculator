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

  it("どのカテゴリにも2件以上のサンプルがある", () => {
    // 1件しか無いタブは「タップして1件だけ出る」ので、タブを分けた意味が無い
    // （旧 `ratio`＝割合が実際にそうなっていて、2026-09-21 に basic へ畳んだ）。
    for (const category of SAMPLE_CATEGORIES) {
      expect(SAMPLE_CALCULATIONS.filter((sample) => sample.category === category.id).length, category.id).toBeGreaterThanOrEqual(2);
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

  it("電気系（電験・電工・Ausbildung）のサンプルが期待の値になる", () => {
    // 掲載文とフィーチャーグラフィックに書いた値の裏取り。ここが動くと掲載文が嘘になる。
    expect(value("230V ÷ 10kΩ", "mA")).toBeCloseTo(23);
    expect(value("0.47MΩ × 20µA", "V")).toBeCloseTo(9.4);
    expect(value("750mV ÷ 150Ω", "mA")).toBeCloseTo(5);
    expect(value("5.5kW ÷ (sqrt(3) × 200V × 0.85)", "A")).toBeCloseTo(18.679, 2);
    expect(value("750W × 40min", "Wh")).toBeCloseTo(500);
    expect(value("0.0172Ω*mm²/m × 30m ÷ 2mm²", "Ω")).toBeCloseTo(0.258);
    expect(value("1 ÷ (2*pi × 50Hz × 100µF)", "Ω")).toBeCloseTo(31.831, 2);
    // 短い説明に載せた 1kΩ × 1mA ⇒ 1V。
    expect(value("1kΩ × 1mA", "V")).toBeCloseTo(1);
  });

  it("電流の2乗は括弧が必須（20A² は 20平方アンペアで別物）", () => {
    // エラーにならず桁だけ外れるので、型でもエンジンでも拾えない。サンプルの式が
    // (20A)^2 のまま保たれていることをここで固定する。
    expect(value("(20A)^2 × 0.258Ω", "W")).toBeCloseTo(103.2);
    expect(value("20A² × 0.258Ω", "W")).toBeCloseTo(5.16);
  });

  it("実験レポートの換算（密度・濃度・絶対温度）が正しい", () => {
    // g/cm³ → kg/m³ は1000倍。100倍と取り違えるのが定番の誤り。
    expect(value("1.2g/cm³", "kg/m³")).toBeCloseTo(1200);
    // mL を L に直し忘れると1000倍ずれる（仏語圏の教材が名指しする躓き）。
    expect(value("0.5mol ÷ 250mL", "mol/L")).toBeCloseTo(2);
    expect(value("25°C", "K")).toBeCloseTo(298.15);
    // 同じ単位どうしを割ると無次元の比になり、% でそのまま読める（質量パーセント濃度・相対誤差）。
    expect(value("15g ÷ 300g", "%")).toBeCloseTo(5);
    expect(value("(25.2mL - 25.0mL) ÷ 25.0mL", "%")).toBeCloseTo(0.8);
    // 気体定数の J/mol/K が mol・K・Pa を打ち消して体積が残る。ここが崩れると次元エラーになる。
    expect(value("8.314J/mol/K × 2mol × 300K ÷ 100kPa", "L")).toBeCloseTo(49.884, 2);
  });

  it("エネルギーの非SI単位（kcal・PS）が正しい", () => {
    // 1 kcal = 4184 J（熱化学カロリー）。4186 や 4200 と取り違えても桁は合うので目視では気付けない。
    expect(value("500kcal", "kJ")).toBeCloseTo(2092);
    // メートル馬力 735.49875 W。英馬力 hp（745.7 W）と1.4%違う。
    expect(value("1PS", "kW")).toBeCloseTo(0.7355, 4);
  });
});
