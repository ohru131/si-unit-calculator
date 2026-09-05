/**
 * プリセット計算ノートの下書きを、アプリ本体と同じノートエンジンで実際に計算して検証する開発用スクリプト。
 *
 * 使い方: npx tsx scripts/check-notebook-seed.ts <シード配列をexportするTSファイル> [export名]
 *
 * tests/notebook-formulas.test.ts は「カテゴリに組み込み済み」のシードしか見ないので、
 * 執筆中の下書きを組み込む前に単体で試せる入口として置いている（式の打ち間違い・次元不整合は
 * 目視では絶対に見つからない）。
 */
import path from "node:path";

import { localizedText } from "../lib/i18n";
import { evaluateNotebookSteps, resolveNotebookLocalConstants } from "../lib/notebook-engine";
import { withDerivedResultSymbols } from "../lib/notebook-result-symbols";
import type { NotebookSeed } from "../lib/notebook-formulas/types";

async function main() {
  const [file, exportName] = process.argv.slice(2);
  if (!file) throw new Error("usage: npx tsx scripts/check-notebook-seed.ts <file> [exportName]");
  const module = (await import(path.resolve(file))) as Record<string, unknown>;
  const entries = exportName
    ? [[exportName, module[exportName]] as const]
    : Object.entries(module).filter(([, value]) => Array.isArray(value));

  let failures = 0;
  for (const [name, value] of entries) {
    if (!Array.isArray(value)) throw new Error(`export ${name} is not an array`);
    console.log(`\n=== ${name} (${value.length} notebooks) ===`);
    for (const rawSeed of value as NotebookSeed[]) {
      // アプリ本体は結果記号を導出してから表示するので、検証も同じものを通す。
      const seed = withDerivedResultSymbols(rawSeed);
      const title = localizedText(seed.title, "ja");
      const constants = seed.localConstants.map((constant, index) => ({ id: `c${index}`, symbol: constant.symbol, expression: constant.expression }));
      const { resolved, errors } = resolveNotebookLocalConstants(constants, [], "ja");
      const constantErrors = Object.entries(errors);
      if (constantErrors.length) {
        failures += 1;
        console.log(`✗ ${title}: 定数 ${constantErrors.map(([id, message]) => `${id}=${message}`).join(", ")}`);
        continue;
      }
      const steps = seed.steps.map((step, index) => ({
        id: `s${index}`,
        title: localizedText(step.title, "ja"),
        expression: step.expression,
        targetUnit: step.targetUnit,
        formulaLatex: step.formulaLatex,
        resultSymbol: step.resultSymbol,
      }));
      const results = evaluateNotebookSteps(steps, resolved, "ja");
      const failed = results.filter((result) => result.error);
      if (failed.length) {
        failures += 1;
        console.log(`✗ ${title}`);
        for (const result of failed) console.log(`    ${result.step.title}: ${result.error}`);
        continue;
      }
      console.log(`✓ ${title}`);
      for (const result of results) console.log(`    ${result.step.resultSymbol ?? ""} ${result.step.expression} = ${result.formatted}`);
    }
  }
  if (failures) {
    console.log(`\n${failures} notebook(s) failed`);
    process.exitCode = 1;
  }
}

void main();
