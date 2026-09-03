import { describe, expect, it } from "vitest";

import { compatibleUnitOptions, compatibleUnitOptionsFromHints } from "../lib/unit-options";
import { evaluateExpression, parseConstantDefinition } from "../lib/units";

describe("compatibleUnitOptions", () => {
  it("次元に対応するグループがあれば、そのグループの単位（地域優先）を返す", () => {
    const quantity = evaluateExpression("70kg");
    const options = compatibleUnitOptions(quantity, "metric");
    expect(options.map((option) => option.symbol)).toEqual(expect.arrayContaining(["kg", "g", "mg"]));
  });

  it("電荷（クーロンの法則のq1, q2）は専用グループのSI接頭辞違いを返す", () => {
    // lib/notebook-formulas/source/physics.ts のクーロンの法則が実際に使っている式そのもの。
    const quantity = evaluateExpression("2e-6C");
    const options = compatibleUnitOptions(quantity, "metric", { expression: "2e-6C" });
    expect(options.map((option) => option.symbol)).toEqual(["C", "mC", "µC", "nC", "pC"]);
  });

  it("名前の付いたグループが無い合成次元（クーロンの法則のk＝N・m²/C²）でもフォールバックで0件にならない", () => {
    // lib/notebook-formulas/source/physics.ts のクーロンの法則の定数kと同じ式。
    const expression = "8.99e9N*m^2/C^2";
    const { quantity } = parseConstantDefinition(`k = ${expression}`);
    // このケース自体は、UNIT_GROUPSに対応するグループが無いことが前提（無くなったらこのテストの意味が薄れる）。
    const options = compatibleUnitOptions(quantity, "metric", { expression });
    // 式に含まれる登録済み単位（N）はその接頭辞違いまで、複合単位（演算子を含む区間）は接頭辞の
    // 付け替えができないため今の表記そのものを1件、それぞれ候補にする。
    // 同じ形の万有引力定数G（下のケース）と揃うことが正しい（以前は指数表記 8.99e9 の解析が
    // 崩れて N を拾えず、この式だけ候補が1件しか出ていなかった）。
    expect(options.map((option) => option.symbol)).toEqual(["N", "kN", "m^2/C^2"]);
  });

  it("式中の単位が力のグループに登録済みなら、その接頭辞違い(kNなど)まで候補に含める（万有引力定数G＝N・m²/kg²）", () => {
    // lib/notebook-formulas/source/practical.ts の万有引力定数Gと同じ式。
    const expression = "6.674e-11N*m^2/kg^2";
    const { quantity } = parseConstantDefinition(`G = ${expression}`);
    const options = compatibleUnitOptions(quantity, "metric", { expression });
    expect(options.map((option) => option.symbol)).toEqual(expect.arrayContaining(["N", "kN", "m^2/kg^2"]));
  });

  it("運動量（kg*m/s）のように次元に対応するグループが無い手順結果でも、表示単位からフォールバックできる", () => {
    // lib/notebook-formulas/source/physics.ts の「運動量」の手順のtargetUnitと同じ表記。
    const quantity = evaluateExpression("3kg*2m/s");
    const options = compatibleUnitOptions(quantity, "metric", { expression: "kg*m/s" });
    expect(options.length).toBeGreaterThan(0);
    expect(options.map((option) => option.symbol)).toEqual(expect.arrayContaining(["kg", "g"]));
  });

  it("quantityが未定義でも、expressionだけから候補を組み立てられる（値がまだ計算できない入力中の状態を想定）", () => {
    const options = compatibleUnitOptions(undefined, "metric", { expression: "kg/m^2" });
    expect(options).toEqual([{ symbol: "kg/m^2", label: "kg/m^2" }]);
  });

  it("quantityもexpressionも無ければ空配列を返す", () => {
    expect(compatibleUnitOptions(undefined, "metric")).toEqual([]);
  });

  it("解釈できない式が渡されてもエラーにならず、候補が拾えるものだけ拾う", () => {
    expect(() => compatibleUnitOptions(undefined, "metric", { expression: "!!!not a unit???" })).not.toThrow();
    expect(compatibleUnitOptions(undefined, "metric", { expression: "!!!not a unit???" })).toEqual([]);
  });

  it("limitで件数を絞れる（既定値14は既存のcompatibleUnitsForの.slice(0, 14)を踏襲）", () => {
    const quantity = evaluateExpression("1m");
    const options = compatibleUnitOptions(quantity, "metric", { limit: 2 });
    expect(options).toHaveLength(2);
  });

  it("次元に対応するグループがあるときは、たとえexpressionを渡してもフォールバックを使わない", () => {
    const quantity = evaluateExpression("1m");
    // expression側に単位が無い（フォールバックが空になる）ケースでも、主経路のグループ結果が優先される。
    const options = compatibleUnitOptions(quantity, "metric", { expression: "" });
    expect(options.map((option) => option.symbol)).toEqual(expect.arrayContaining(["m", "km", "cm", "mm"]));
  });
});

describe("compatibleUnitOptionsFromHints", () => {
  // 合成次元（名前の付いた単位グループが無い量）の候補は「実際に書かれている単位」から組み立てる
  // ため、手掛かりが1つだけだとそこに単位が無いときに0件になる。呼び出し側では候補0件＝単位レール
  // （SIへ戻すチップを含む）が丸ごと消えることを意味するので、手掛かりを順に試せる必要がある。
  const compositeQuantity = { value: 10, dimension: [2, 0, -3, 0, 0, 0, 0] } as never;

  it("識別子だけの式と未指定の表示単位で0件になっても、SI表記の手掛かりで候補が出る", () => {
    expect(compatibleUnitOptions(compositeQuantity, "metric", { expression: "v0*a" })).toEqual([]);
    expect(compatibleUnitOptionsFromHints(compositeQuantity, "metric", ["", "v0*a", "10 m²/s³"])).toEqual([
      { symbol: "m²/s³", label: "m²/s³" },
    ]);
  });

  it("先に候補が得られた手掛かりを採用し、後ろは見ない", () => {
    // 表示単位が決まっていればそれを優先する（後ろのSI表記に引きずられない）。
    expect(compatibleUnitOptionsFromHints(compositeQuantity, "metric", ["m²/s³", "v0*a", "10 m²/s³"])).toEqual([
      { symbol: "m²/s³", label: "m²/s³" },
    ]);
  });

  it("空・undefinedの手掛かりは読み飛ばす", () => {
    expect(compatibleUnitOptionsFromHints(compositeQuantity, "metric", [undefined, "", "   ", "10 m²/s³"])).toEqual([
      { symbol: "m²/s³", label: "m²/s³" },
    ]);
  });

  it("どの手掛かりでも見つからなければ空を返す", () => {
    expect(compatibleUnitOptionsFromHints(compositeQuantity, "metric", ["v0*a", "b*c"])).toEqual([]);
  });

  it("名前の付いた次元グループがある量では、手掛かりに関係なくグループの候補を返す", () => {
    const lengthQuantity = { value: 1, dimension: [1, 0, 0, 0, 0, 0, 0] } as never;
    const chips = compatibleUnitOptionsFromHints(lengthQuantity, "metric", ["", "v0*a"]);
    expect(chips.some((chip) => chip.symbol === "m")).toBe(true);
  });
});
