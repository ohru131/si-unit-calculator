import { describe, expect, it } from "vitest";

import { evaluateCalculatorInput } from "@/lib/calculator-input";
import { resolveNotebookLocalConstants } from "@/lib/notebook-engine";
import { PRESET_NOTEBOOK_SEEDS } from "@/lib/notebook-formulas";
import { formatQuantity, isResolvableUnitSymbol } from "@/lib/units";

/**
 * 「単位記号と同じ名前」の扱いは、**ローカル定数とグローバル定数で意図的に逆**になっている。
 *
 * - **ローカル定数は単位記号をシャドーしてよい**（識別子の解決が単位より先）。プリセットは
 *   これに全面的に依存していて、194件中136件が該当する（ローカル定数207個・結果記号63個。
 *   綴りは `A C EV F G GN H J K L MF N S T V W d g h kcal l m percent s t years`）。体積 `V`・
 *   長さ `L`・直径 `d`・厚さ `t`・質量 `m`・トルク `T`・高さ `h`・重力 `g`・力 `F`・面積 `A` は
 *   どれも**量記号としてその綴りが正しい**もので、数式カードの記号と定数名を一致させることが
 *   このノートの設計そのもの。名前は1つのノートの中でしか効かないので、意味が割れる範囲も
 *   そのノートに閉じている。
 * - **グローバル定数は弾く**（`lib/calculator-input.ts`）。あちらは電卓で打つ全ての式に効くので、
 *   裸の `W` は定数・`5W` はワット、という割れ方が式の見た目から区別できない。
 *
 * この非対称は**片方を直すともう片方が壊れる**（ローカルにも同じ判定を広げるとプリセットの
 * 7割が名前を失う）ので、両方の向きをここで固定しておく。
 */
describe("単位記号と同じ名前の扱い", () => {
  it("プリセットのローカル定数は単位記号と同じ綴りを実際に使っている", () => {
    const collisions = Object.values(PRESET_NOTEBOOK_SEEDS)
      .flat()
      .flatMap((seed) => seed.localConstants.filter((constant) => isResolvableUnitSymbol(constant.symbol)));
    // 件数そのものは増減してよい（プリセットを足すたびに変わる）。0になったら、この非対称を
    // 保つ理由が無くなったか、うっかりローカル定数にも制限を広げたかのどちらか。
    expect(collisions.length).toBeGreaterThan(100);
  });

  it("シャドーは効く（単位ではなく定数の値が使われる）", () => {
    // `V` はボルト、`L` はリットル。ローカル定数として定義すれば、その式ではこちらが勝つ。
    const { resolved } = resolveNotebookLocalConstants(
      [
        { id: "c1", symbol: "V", expression: "3m^3" },
        { id: "c2", symbol: "L", expression: "2m" },
      ],
      [],
      "ja",
    );
    expect(formatQuantity(resolved[0].quantity, "m^3", "en")).toBe("3 m^3");
    expect(formatQuantity(resolved[1].quantity, "m", "en")).toBe("2 m");
  });

  it("グローバル定数は同じ綴りを弾く", () => {
    expect(() => evaluateCalculatorInput("V = 3m^3", [])).toThrowError();
    expect(() => evaluateCalculatorInput("L = 2m", [])).toThrowError();
  });
});
