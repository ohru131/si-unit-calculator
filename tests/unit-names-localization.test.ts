import { describe, expect, it } from "vitest";

import { APP_LANGUAGES } from "../lib/i18n";
import { SPECIAL_UNIT_EXPLANATIONS } from "../lib/unit-explanations";
import { UNIT_GROUPS } from "../lib/units";

// UNIT_GROUPS は BASE_UNIT_GROUPS の各単位に UNIT_META（aliases・name）をマージしたものなので、
// ここを全件走査すれば UNIT_META の name フィールドを漏れなく検証できる（UNIT_META自体は非export）。
const allUnitOptions = UNIT_GROUPS.flatMap((group) => group.units.map((unitOption) => ({ group, unitOption })));

describe("単位名・単位解説の多言語対応が全言語分そろっているか", () => {
  it("UNIT_META（UNIT_GROUPSの各単位）の name が APP_LANGUAGES の全言語分そろっている", () => {
    const missing: string[] = [];
    for (const { group, unitOption } of allUnitOptions) {
      for (const language of APP_LANGUAGES) {
        const value = unitOption.name?.[language];
        if (!value || value.trim() === "") {
          missing.push(`${group.id}/${unitOption.symbol}: ${language}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("UNIT_GROUPSに未翻訳の単位が新規追加されたら検知できる（少なくとも1件は全言語そろっているはず）", () => {
    // 単なる空配列チェックだけだと「そもそも走査対象が0件」でも通ってしまうため、
    // 実際に単位が走査できていることも合わせて確認する。
    expect(allUnitOptions.length).toBeGreaterThan(0);
  });

  it("lib/unit-explanations.ts の全エントリで name/summary/usage が APP_LANGUAGES の全言語分そろっている", () => {
    const missing: string[] = [];
    for (const [symbol, explanation] of Object.entries(SPECIAL_UNIT_EXPLANATIONS)) {
      for (const field of ["name", "summary", "usage"] as const) {
        for (const language of APP_LANGUAGES) {
          const value = explanation[field][language];
          if (!value || value.trim() === "") {
            missing.push(`${symbol}.${field}: ${language}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("SPECIAL_UNIT_EXPLANATIONSに未翻訳のエントリが新規追加されたら検知できる（少なくとも1件は走査できているはず）", () => {
    expect(Object.keys(SPECIAL_UNIT_EXPLANATIONS).length).toBeGreaterThan(0);
  });
});
