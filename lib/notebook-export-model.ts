import { type CalculationNotebook, type CalculationNoteStep, type NotebookLocalConstant } from "@/lib/calculator-store";
import { type AppLanguage } from "@/lib/i18n";
import { evaluateNotebookSteps, formatNameValue, type NotebookStepResult, resolveNotebookLocalConstants } from "@/lib/notebook-engine";
import { notebookFormulaRows } from "@/lib/notebook-formula-rows";
import { stepDisplayTitle } from "@/lib/notebook-step-title";
import { compatibleUnitOptionsFromHints } from "@/lib/unit-options";
import { inferSignificantDigits, significantDigitsAfterConversion, toSignificantDecimal } from "@/lib/significant-figures";
import { convertQuantity, formatNumberForLocale, formatQuantity, type MeasuringStandard, type SavedConstant, type UnitSystem } from "@/lib/units";

export type NotebookExportFormulaRow = { explanation: string; latex: string };
export type NotebookExportConstant = { text: string };
export type NotebookExportStep = { title: string; expression: string; resultText: string; /** 有効数字で丸めたときの、丸める前の値。PDFでも小さく併記する。 */ rawResultText?: string; isError: boolean };
export type NotebookExportModel = {
  title: string;
  description: string;
  formulas: NotebookExportFormulaRow[];
  constants: NotebookExportConstant[];
  steps: NotebookExportStep[];
};

export type NotebookStepDisplay = {
  /** 主表示。有効数字で丸められるならその形（`≈ 2.6 mA`）、そうでなければ素の値。 */
  value?: string;
  /** 丸めたときだけ、丸める前の値（単位付き）。画面もPDFも小さく併記する。 */
  rawValue?: string;
  /** 丸めに使った桁数。丸めていなければ undefined。 */
  significantDigits?: number;
  error?: string;
  // 値が1つも無く、エラー文言だけを出す（components/notebooks/notebook-detail.tsxの
  // `displayError && !displayValue` と同じ判定）。
  isError: boolean;
};

/**
 * 手順1件の有効数字の桁数。**手順の式ではなくローカル定数まで辿って数える。**
 *
 * ノートの手順は `V*I*cos(φ)` のように識別子だけで書かれていてリテラルが1つも無く、
 * 式だけを見ても桁は一度も読めない。入力値はローカル定数（`V=100V`・`I=5A`）の方にあるので、
 * そこまで辿る（lib/significant-figures.ts の resolveIdentifier）。先行手順の記号も同じ経路で
 * その手順の式へ解決するので、何段重ねても元の入力値の桁に行き着く。
 *
 * **電卓では辿らない。** あちらの識別子は保存済みの定数と履歴参照で、保存された値の精度が
 * その式で意図した桁とは限らないため（lib/significant-figures.ts の注記）。
 */
export function notebookStepSignificantDigits(
  step: CalculationNoteStep,
  localConstants: readonly { symbol: string; expression: string }[],
  priorResults: readonly NotebookStepResult[],
): number | null {
  const sources = new Map<string, string>();
  localConstants.forEach((item) => {
    const symbol = item.symbol.trim();
    if (symbol) sources.set(symbol, item.expression);
  });
  priorResults.forEach((entry) => {
    if (entry.symbol) sources.set(entry.symbol, entry.step.expression);
  });
  return inferSignificantDigits(step.expression, { resolveIdentifier: (symbol) => sources.get(symbol) });
}

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
  /** notebookStepSignificantDigits の結果。渡さなければ従来どおり丸めない。 */
  significantDigits?: number | null,
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
  // 有効数字で丸めた形を主表示にする（ノートの既定。電卓はチップで選ぶ）。
  // **数値の部分だけを差し替える。** value は「数値 + 空白 + 単位ラベル」で、単位ラベルは
  // 上の見栄え差し替えを通っていることがある。文字列を分割し直すのではなく、同じ整形関数で
  // 作った数値の文字列を接頭辞として照合して置き換えれば、ラベルをそのまま保てる。
  const rounded = roundedValueFor(result, value, effectiveUnit, significantDigits, locale);
  if (rounded) return { value: rounded.value, rawValue: value, significantDigits: rounded.significantDigits, error, isError: false };
  return { value, error, isError: Boolean(error) && !value };
}

/**
 * 「数値 + 単位」の表示文字列のうち、**数値の部分だけ**を有効数字で丸めた形に差し替える。
 *
 * 文字列を空白で割るのではなく、同じ整形関数（formatNumberForLocale）で作った数値を接頭辞として
 * 照合する。単位ラベルは見栄えの差し替え（`Ohm` → `Ω` 等）を通っていることがあり、割って
 * 組み直すとその差し替えが失われるため。
 */
export function roundedValueFor(
  result: NotebookStepResult,
  value: string | undefined,
  effectiveUnit: string,
  significantDigits: number | null | undefined,
  locale: string | undefined,
): { value: string; significantDigits: number } | null {
  if (!value || !result.quantity || significantDigits === undefined || significantDigits === null) return null;
  // どの数値が画面に出ているかを value と同じ経路で求める。換算に失敗していればSI値。
  let numeric = result.quantity.siValue;
  let convertedUnit = "";
  if (effectiveUnit) {
    try {
      const converted = convertQuantity(result.quantity, effectiveUnit, locale);
      numeric = converted.value;
      convertedUnit = effectiveUnit;
    } catch {
      numeric = result.quantity.siValue;
    }
  }
  // オフセットを持つ単位（°C・°F）への換算を挟むと桁では追えなくなる（電卓と同じ判定）。
  const digits = significantDigitsAfterConversion(significantDigits, convertedUnit);
  const decimal = toSignificantDecimal(numeric, { significantDigits: digits, locale });
  if (!decimal) return null;
  const plain = formatNumberForLocale(numeric, locale);
  if (!value.startsWith(plain)) return null;
  return { value: `${decimal.text}${value.slice(plain.length)}`, significantDigits: decimal.significantDigits };
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

// 画面（components/notebooks/notebook-detail.tsx）は編集途中の値
// （editableConstants / editableSteps）から結果を導出して表示している。保存前に共有すると
// 保存済みのnotebookを渡してしまい、PDFと画面で数値が食い違う（このモジュールを作った目的
// そのものが崩れる）。そこで共有時は画面が持っている編集中の値でノートを差し替える。
//
// 空行を除外したり正規化したりはしない。定数・手順は resolveNotebookLocalConstants と
// evaluateNotebookSteps にそのまま渡され、手順を1つ間引くと後続の s1・s2… の参照先が
// ずれて別の数値になるため、画面と完全に同じ配列を渡すことが正しさの条件になる。
export function notebookWithDraftValues(
  notebook: CalculationNotebook,
  draftLocalConstants: NotebookLocalConstant[],
  draftSteps: CalculationNoteStep[],
): CalculationNotebook {
  return { ...notebook, localConstants: draftLocalConstants, steps: draftSteps };
}

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

  const steps: NotebookExportStep[] = stepResults.map((result, index) => {
    // 桁は手順の式ではなくローカル定数まで辿って数える（notebookStepSignificantDigits）。
    // 画面と同じ判断を通すこと——PDFだけ丸めない／丸めすぎると、同じノートで数字が食い違う。
    const digits = notebookStepSignificantDigits(result.step, notebook.localConstants, stepResults.slice(0, index));
    const display = resolveNotebookStepDisplay(result, unitOverrides[result.step.id], unitSystem, locale, digits);
    return {
      title: stepDisplayTitle(result.step.title, result.step.expression),
      expression: formatNameValue(result.step.resultSymbol ?? "", result.step.expression),
      resultText: display.isError ? (display.error ?? "") : (display.value ?? ""),
      rawResultText: display.rawValue,
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
