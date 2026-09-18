/**
 * 1打鍵ごとに走る純関数のコストを実測する。
 *
 * 電卓は「= を押さなくても結果が出る」設計なので、**式が1文字変わるたびに解析・評価・診断・
 * 表示単位の決定・候補の組み立てが全部走る**。どれが重いのかを推測で決めないための物差し。
 *
 * 実行: pnpm bench:keystroke
 *
 * **node の数字であることに注意**。実機の Hermes はこれより数倍遅い（CLAUDE.md の
 * 履歴走査の実測と同じ前提）。比較に使うのは絶対値ではなく**段ごとの比率**。
 */
import { evaluateCalculatorInput, diagnoseCalculatorInput } from "@/lib/calculator-input";
import { buildCaretPreview } from "@/lib/expression-caret";
import { findExactValue } from "@/lib/exact-value";
import { resolveDisplayUnit } from "@/lib/display-unit";
import { inferSignificantDigits, toScientificNotation } from "@/lib/significant-figures";
import { buildUnitComparisonRows } from "@/lib/unit-comparison";
import { getPresetUnitExamples, resolveUnitContext, suggestCompanionUnits, unitExamplesFromHistory } from "@/lib/unit-context-suggestions";
import { analyzeExpression, getUnitInputHint } from "@/lib/unit-input";

const ITERATIONS = 200;

// 実機に近い状態: 履歴80件（HISTORY_UNIT_EXAMPLE_LIMIT と同じ）。
const HISTORY = Array.from({ length: 80 }, (_, index) => ({
  expression: index % 3 === 0 ? "12V / 4.7kΩ" : index % 3 === 1 ? "2kg * 9.8m/s^2" : "5cm + 1mm",
  targetUnit: index % 3 === 0 ? "mA" : index % 3 === 1 ? "N" : "cm",
}));

const time = (label: string, fn: () => unknown, iterations = ITERATIONS) => {
  fn(); // ウォームアップ（JITとモジュール内メモ化を先に済ませる）
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i += 1) fn();
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1e6 / iterations;
  return { label, ms };
};

function benchFor(expression: string, caret = expression.length) {
  const analysis = analyzeExpression(expression, []);
  const evaluation = evaluateCalculatorInput(expression, []);
  const quantity = evaluation.quantity ?? undefined;
  const display = resolveDisplayUnit({ quantity: quantity ?? null, requestedUnit: "", expressionUnits: [], system: "metric", isAdvancedMode: false });
  const numeric = quantity ? quantity.siValue : 0;
  const historyExamples = unitExamplesFromHistory(HISTORY);
  const context = resolveUnitContext({ analysis, caret });

  const rows = [
    time("analyzeExpression", () => analyzeExpression(expression, [])),
    time("evaluateCalculatorInput", () => evaluateCalculatorInput(expression, [])),
    time("diagnoseCalculatorInput", () => diagnoseCalculatorInput(expression, [])),
    time("buildCaretPreview", () => buildCaretPreview(analysis.segments, caret, caret)),
    time("resolveDisplayUnit", () => resolveDisplayUnit({ quantity: quantity ?? null, requestedUnit: "", expressionUnits: [], system: "metric", isAdvancedMode: false })),
    time("findExactValue", () => findExactValue(numeric)),
    time("inferSignificantDigits", () => inferSignificantDigits(expression)),
    time("toScientificNotation", () => toScientificNotation(numeric, { significantDigits: 3, locale: "ja-JP" })),
    time("buildUnitComparisonRows", () => buildUnitComparisonRows(quantity, { unitSystem: "metric", hints: ["", expression, display.unit], activeUnit: "", locale: "ja-JP" })),
    time("unitExamplesFromHistory(80件)", () => unitExamplesFromHistory(HISTORY)),
    time("suggestCompanionUnits", () =>
      context
        ? suggestCompanionUnits({
            leftGroupId: context.leftGroupId,
            recentExamples: historyExamples,
            corpusExamples: getPresetUnitExamples(),
            system: "metric",
            limit: 8,
          })
        : null),
    time("getUnitInputHint", () => getUnitInputHint(expression, { system: "metric", analysis, caret })),
  ];
  return rows;
}

const CASES: { label: string; expression: string }[] = [
  { label: "12V / 4.7kΩ（電気の定番）", expression: "12V / 4.7kΩ" },
  { label: "2kg * 9.8m/s^2（力）", expression: "2kg * 9.8m/s^2" },
  { label: "1/5（分数）", expression: "1/5" },
  { label: "1234567+2345678+3456789（長い式）", expression: "1234567+2345678+3456789" },
];

console.log(`1打鍵あたりのコスト（node・${ITERATIONS}回の平均。実機のHermesはこれより数倍遅い）\n`);
for (const testCase of CASES) {
  const rows = benchFor(testCase.expression);
  const total = rows.reduce((sum, row) => sum + row.ms, 0);
  console.log(`=== ${testCase.label} ===`);
  for (const row of [...rows].sort((a, b) => b.ms - a.ms)) {
    const share = ((row.ms / total) * 100).toFixed(0);
    const bar = "█".repeat(Math.max(0, Math.round(row.ms / total * 40)));
    console.log(`  ${row.label.padEnd(30)} ${row.ms.toFixed(3).padStart(8)} ms  ${share.padStart(3)}%  ${bar}`);
  }
  console.log(`  ${"合計".padEnd(30)} ${total.toFixed(3).padStart(8)} ms\n`);
}

// プリセットの例は module 変数にメモ化されるので、**最初の1回だけ**高い。
// その1回は「× か ÷ を初めて押した打鍵」に乗る。
console.log("=== getPresetUnitExamples の初回コスト（module変数にメモ化される前） ===");
console.log("  （このプロセスでは既にメモ化済みなので、別プロセスで測る必要がある）");
