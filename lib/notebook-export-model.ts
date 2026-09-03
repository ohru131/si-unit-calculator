import { type CalculationNotebook } from "@/lib/calculator-store";
import { type AppLanguage } from "@/lib/i18n";
import { evaluateNotebookSteps, formatNameValue, type NotebookStepResult, resolveNotebookLocalConstants } from "@/lib/notebook-engine";
import { notebookFormulaRows } from "@/lib/notebook-formula-rows";
import { stepDisplayTitle } from "@/lib/notebook-step-title";
import { compatibleUnitOptionsFromHints } from "@/lib/unit-options";
import { formatQuantity, type MeasuringStandard, type SavedConstant, type UnitSystem } from "@/lib/units";

export type NotebookExportFormulaRow = { explanation: string; latex: string };
export type NotebookExportConstant = { text: string };
export type NotebookExportStep = { title: string; expression: string; resultText: string; isError: boolean };
export type NotebookExportModel = {
  title: string;
  description: string;
  formulas: NotebookExportFormulaRow[];
  constants: NotebookExportConstant[];
  steps: NotebookExportStep[];
};

export type NotebookStepDisplay = {
  value?: string;
  error?: string;
  // 値が1つも無く、エラー文言だけを出す（components/notebooks/notebook-detail.tsxの
  // `displayError && !displayValue` と同じ判定）。
  isError: boolean;
};

// 手順1件ぶんの「画面に実際に表示される値・エラー文字列」を組み立てる。
// なぜ関数として切り出すか: components/notebooks/notebook-detail.tsx（画面）と
// lib/notebook-export-model.ts（PDFエクスポート）の両方がこの判断（表示単位の上書き・
// 次元が合わないときのSI表記へのフォールバック・単位ラベルの見栄え差し替え）を必要とする。
// 2箇所で別々に実装すると、CLAUDE.mdのunitSuffixEndで実際に踏んだ不具合
// （評価器と表示側の走査が食い違い、単位チップの差し替えが一部にしか効かなくなった）と
// 同じ構造でPDFと画面の表示がズレる。
export function resolveNotebookStepDisplay(
  result: NotebookStepResult,
  overrideUnit: string | undefined,
  unitSystem: UnitSystem,
  locale: string | undefined,
): NotebookStepDisplay {
  const effectiveUnit = overrideUnit ?? result.step.targetUnit.trim();
  // 単位ラベルの見栄え差し替えの手掛かりは「今表示に使っている単位 → 式 → 実際のSI表記」の順に
  // 試す（lib/unit-options.tsのcompatibleUnitOptionsFromHintsと同じ理由。式が識別子だけの
  // 参照ばかりで単位を含まないことが多いため、手掛かりを複数用意しないと候補が0件になる）。
  const compatibleUnits = compatibleUnitOptionsFromHints(result.quantity, unitSystem, [effectiveUnit, result.step.expression, result.siFallback]);
  let value = result.formatted;
  let error = result.error;
  if (result.quantity && overrideUnit !== undefined) {
    if (overrideUnit === "") {
      // 「SI標準に戻す」チップ。上書きが無かったことにするのではなく、明示的にSI表記へ戻す。
      value = result.siFallback;
      error = undefined;
    } else {
      try {
        value = formatQuantity(result.quantity, overrideUnit, locale);
        error = undefined;
      } catch (cause) {
        // 上書き先の単位がこの結果の次元に合わないときは、SI表記へフォールバックしつつ
        // 理由をエラー文言として残す（画面はこれを値の下に警告として出す）。
        value = result.siFallback;
        error = cause instanceof Error ? cause.message : error;
      }
    }
  }
  if (value && effectiveUnit) {
    const label = compatibleUnits.find((unitOption) => unitOption.symbol === effectiveUnit)?.label;
    if (label && label !== effectiveUnit && value.endsWith(effectiveUnit)) {
      value = `${value.slice(0, -effectiveUnit.length)}${label}`;
    }
  }
  return { value, error, isError: Boolean(error) && !value };
}

export type BuildNotebookExportModelOptions = {
  notebook: CalculationNotebook;
  globalConstants: SavedConstant[];
  // デフォルト値は付けない。渡し忘れた呼び出し元が黙って英語になると気付けないため
  // （CLAUDE.mdの方針。lib/notebook-engine.tsのエントリポイントと同じ扱い）。
  language: AppLanguage;
  locale?: string;
  unitSystem: UnitSystem;
  // measuringStandardはlib/units.tsのモジュール内状態（cup/tbsp/tsp等の換算値）を経由して
  // formatQuantityの結果に反映されるため、この関数自体は値を直接読まない。それでも呼び出し元に
  // 「この設定が変われば結果も変わりうる」ことを伝えるため、画面側（notebook-detail.tsxの
  // stepResultsのuseMemo依存配列）と同じくシグネチャに含めておく。
  measuringStandard: MeasuringStandard;
  // 手順ID→表示単位の上書き。画面が保持するunitOverridesとそのまま同じ形。
  unitOverrides: Record<string, string>;
};

// 計算ノート1件を、PDFエクスポート（lib/notebook-export-html.ts）が必要とする形へ組み立てる。
// 画面（notebook-detail.tsx）が使うのと同じ導出関数（evaluateNotebookSteps・
// resolveNotebookStepDisplay・notebookFormulaRows・stepDisplayTitle）を通すことで、
// PDFが画面と違う数値・単位表記を出してしまうことを防ぐ。
export function buildNotebookExportModel(options: BuildNotebookExportModelOptions): NotebookExportModel {
  const { notebook, globalConstants, language, locale, unitSystem, measuringStandard, unitOverrides } = options;
  void measuringStandard;

  const { resolved } = resolveNotebookLocalConstants(notebook.localConstants, globalConstants, language);
  const pool = [...globalConstants, ...resolved];
  const stepResults = evaluateNotebookSteps(notebook.steps, pool, language, [], locale);

  const steps: NotebookExportStep[] = stepResults.map((result) => {
    const display = resolveNotebookStepDisplay(result, unitOverrides[result.step.id], unitSystem, locale);
    return {
      title: stepDisplayTitle(result.step.title, result.step.expression),
      expression: formatNameValue(result.step.resultSymbol ?? "", result.step.expression),
      resultText: display.isError ? (display.error ?? "") : (display.value ?? ""),
      isError: display.isError,
    };
  });

  const constants: NotebookExportConstant[] = notebook.localConstants.map((item) => ({
    text: formatNameValue(item.symbol, item.expression),
  }));

  const formulas: NotebookExportFormulaRow[] = notebookFormulaRows(notebook.formulas, notebook.steps).map((row) => ({
    explanation: row.explanation,
    latex: row.latex,
  }));

  return {
    title: notebook.title,
    description: notebook.description,
    formulas,
    constants,
    steps,
  };
}
