/**
 * 1打鍵ごとに走る純関数のコストを実測する。
 *
 * 電卓は「= を押さなくても結果が出る」設計なので、**式が1文字変わるたびに解析・評価・診断・
 * 表示単位の決定・候補の組み立てが全部走る**。どれが重いのかを推測で決めないための物差し。
 *
 * 実行: pnpm bench:keystroke
 *
 * **実際の入力列（prefix）を1文字ずつ測ること。** 完成した式だけを繰り返し測ると実態とずれる。
 * 打っている途中のほとんどは `5cm +` のような未完成の式で、そこでは評価が例外を投げる。画面側は
 * `diagnoseCalculatorInput` でそれを診断へ変換し、**値が出たときだけ**表示単位・厳密値・科学表記・
 * 比較表といった結果依存の処理を走らせる。だから「常に走る段」と「値が出たときだけ走る段」を分けて
 * 数える（CodeRabbitが#71で指摘）。
 *
 * **node の数字であることに注意**。実機の Hermes はこれより数倍遅い（CLAUDE.md の
 * 履歴走査の実測と同じ前提）。比較に使うのは絶対値ではなく**段ごとの比率**。1呼び出しが
 * 0.001ms を切る段は計測自体のオーバーヘッド（hrtime で約0.0001ms）に埋もれる。
 */
import { diagnoseCalculatorInput } from "@/lib/calculator-input";
import { buildCaretPreview } from "@/lib/expression-caret";
import { findExactValue } from "@/lib/exact-value";
import { resolveDisplayUnit } from "@/lib/display-unit";
import { inferSignificantDigits, toScientificNotation } from "@/lib/significant-figures";
import { buildUnitComparisonRows } from "@/lib/unit-comparison";
import { getPresetUnitExamples, resolveUnitContext, suggestCompanionUnits, unitExamplesFromHistory } from "@/lib/unit-context-suggestions";
import { analyzeExpression, getUnitInputHint } from "@/lib/unit-input";

const REPEATS = 30;

// 実機に近い状態: 履歴80件（HISTORY_UNIT_EXAMPLE_LIMIT と同じ）。
const HISTORY = Array.from({ length: 80 }, (_, index) => ({
  expression: index % 3 === 0 ? "12V / 4.7kΩ" : index % 3 === 1 ? "2kg * 9.8m/s^2" : "5cm + 1mm",
  targetUnit: index % 3 === 0 ? "mA" : index % 3 === 1 ? "N" : "cm",
}));

type Totals = Map<string, number>;

const timed = <T,>(totals: Totals, label: string, fn: () => T): T => {
  const start = process.hrtime.bigint();
  const value = fn();
  totals.set(label, (totals.get(label) ?? 0) + Number(process.hrtime.bigint() - start) / 1e6);
  return value;
};

/** 式を1文字ずつ伸ばしながら、画面と同じ順序・同じ条件で各段を測る。 */
function walk(expression: string, historyExamples: ReturnType<typeof unitExamplesFromHistory>) {
  const totals: Totals = new Map();
  let keystrokes = 0;
  let withResult = 0;

  for (let repeat = 0; repeat < REPEATS; repeat += 1) {
    for (let length = 1; length <= expression.length; length += 1) {
      const prefix = expression.slice(0, length);
      const caret = prefix.length;
      keystrokes += 1;

      // ここから下は打鍵のたびに必ず走る段。
      const analysis = timed(totals, "analyzeExpression", () => analyzeExpression(prefix, []));
      const diagnosis = timed(totals, "diagnoseCalculatorInput", () => diagnoseCalculatorInput(prefix, []));
      timed(totals, "buildCaretPreview", () => buildCaretPreview(analysis.segments, caret, caret));
      timed(totals, "inferSignificantDigits", () => inferSignificantDigits(prefix));
      const context = timed(totals, "resolveUnitContext", () => resolveUnitContext({ analysis, caret }));
      timed(totals, "suggestCompanionUnits", () =>
        context
          ? suggestCompanionUnits({
              leftGroupId: context.leftGroupId,
              recentExamples: historyExamples,
              corpusExamples: getPresetUnitExamples(),
              system: "metric",
              limit: 8,
            })
          : null);
      timed(totals, "getUnitInputHint", () => getUnitInputHint(prefix, { system: "metric", analysis, caret }));

      // **結果が出たときだけ走る段。** 打っている途中の多くはここへ来ない。
      const quantity = diagnosis.quantity;
      if (!quantity) continue;
      withResult += 1;
      const display = timed(totals, "resolveDisplayUnit（値があるときだけ）", () =>
        resolveDisplayUnit({ quantity, requestedUnit: "", expressionUnits: [], system: "metric", isAdvancedMode: false }));
      timed(totals, "findExactValue（値があるときだけ）", () => findExactValue(quantity.siValue));
      timed(totals, "toScientificNotation（値があるときだけ）", () =>
        toScientificNotation(quantity.siValue, { significantDigits: 3, locale: "ja-JP" }));
      timed(totals, "buildUnitComparisonRows（値があるときだけ）", () =>
        buildUnitComparisonRows(quantity, { unitSystem: "metric", hints: ["", prefix, display.unit], activeUnit: "", locale: "ja-JP" }));
    }
  }

  return { totals, keystrokes, withResult };
}

const CASES: { label: string; expression: string }[] = [
  { label: "12V / 4.7kΩ（電気の定番）", expression: "12V / 4.7kΩ" },
  { label: "2kg * 9.8m/s^2（力）", expression: "2kg * 9.8m/s^2" },
  { label: "1/5（分数）", expression: "1/5" },
  { label: "1234567+2345678+3456789（長い式）", expression: "1234567+2345678+3456789" },
];

const historyExamples = unitExamplesFromHistory(HISTORY);
// 1度きりのメモ化コストを測定に混ぜないよう、先に温めておく。
getPresetUnitExamples();

console.log(`1打鍵あたりのコスト（node・式を1文字ずつ伸ばして${REPEATS}周の平均。実機のHermesはこれより数倍遅い）\n`);

for (const testCase of CASES) {
  const { totals, keystrokes, withResult } = walk(testCase.expression, historyExamples);
  const rows = [...totals.entries()].map(([label, ms]) => ({ label, perKeystroke: ms / keystrokes }));
  const total = rows.reduce((sum, row) => sum + row.perKeystroke, 0);
  console.log(`=== ${testCase.label} ===`);
  console.log(`  打鍵 ${keystrokes / REPEATS} 回のうち ${withResult / REPEATS} 回で結果が出る（残りは未完成の式で診断だけ）`);
  for (const row of [...rows].sort((a, b) => b.perKeystroke - a.perKeystroke)) {
    const share = ((row.perKeystroke / total) * 100).toFixed(0);
    const bar = "█".repeat(Math.max(0, Math.round((row.perKeystroke / total) * 40)));
    console.log(`  ${row.label.padEnd(38)} ${row.perKeystroke.toFixed(4).padStart(9)} ms  ${share.padStart(3)}%  ${bar}`);
  }
  console.log(`  ${"合計".padEnd(38)} ${total.toFixed(4).padStart(9)} ms\n`);
}

// **履歴の走査は打鍵では走らない。** 依存配列が [history] なので、= を押して履歴が増えたときだけ。
const start = process.hrtime.bigint();
for (let i = 0; i < REPEATS; i += 1) unitExamplesFromHistory(HISTORY);
console.log(`参考: unitExamplesFromHistory（履歴80件）= ${(Number(process.hrtime.bigint() - start) / 1e6 / REPEATS).toFixed(4)} ms`);
console.log("  打鍵ごとには走らない（依存配列が [history] なので = を押したときだけ）。");
