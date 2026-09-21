/**
 * プリセット計算ノートの全手順について、画面に出る値を一覧する。
 *
 * 有効数字まわり（とくに `exact` の印）を触ると、**エラーにならないまま桁だけが変わる**。
 * 型でもテストでも拾えないので、変更の前後でこの出力を突き合わせて差分を目視する。
 *   pnpm notebook:rounding > before.txt   # 変更前（git stash した状態）
 *   pnpm notebook:rounding > after.txt
 *   diff before.txt after.txt
 */
import { PRESET_NOTEBOOK_SEEDS } from "../lib/notebook-formulas";
import { evaluateNotebookSteps, resolveNotebookLocalConstants } from "../lib/notebook-engine";
import { notebookStepSignificantDigits, resolveNotebookStepDisplay } from "../lib/notebook-export-model";
import { seedSlug } from "../lib/notebook-formulas/types";
import { localizedText } from "../lib/i18n";
import type { CalculationNoteStep, NotebookLocalConstant } from "../lib/calculator-store";

// id は lib/calculator-store.tsx が組み立てるが、あれを import すると React Native ごと
// 読み込まれて tsx が動かない。この出力では id の中身に意味が無いので、添字だけで作る。

const LANGUAGE = "ja" as const;

for (const [categoryId, seeds] of Object.entries(PRESET_NOTEBOOK_SEEDS)) {
  for (const seed of seeds) {
    const seedId = seedSlug(seed);
    const localConstants: NotebookLocalConstant[] = seed.localConstants.map((constant, index) => ({
      id: `c${index}`,
      symbol: constant.symbol,
      expression: constant.expression,
      ...(constant.exact ? { exact: true as const } : {}),
    }));
    const steps: CalculationNoteStep[] = seed.steps.map((step, index) => ({
      id: `s${index}`,
      title: localizedText(step.title, LANGUAGE),
      expression: step.expression,
      targetUnit: step.targetUnit,
      formulaLatex: step.formulaLatex,
      resultSymbol: step.resultSymbol,
    }));

    const { resolved } = resolveNotebookLocalConstants(localConstants, [], LANGUAGE);
    const results = evaluateNotebookSteps(steps, resolved, LANGUAGE);
    results.forEach((result, index) => {
      const digits = notebookStepSignificantDigits(result.step, localConstants, results.slice(0, index));
      const display = resolveNotebookStepDisplay(result, undefined, "metric", "ja-JP", digits);
      const title = localizedText(seed.title, LANGUAGE);
      const raw = display.rawValue ? ` (元 ${display.rawValue})` : "";
      console.log(`${categoryId}/${seedId} | ${title} | ${result.step.title} | ${display.value ?? display.error ?? ""}${raw} | 桁=${digits ?? "-"}`);
    });
  }
}
