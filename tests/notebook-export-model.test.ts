import { describe, expect, it } from "vitest";

import { type CalculationNotebook, type CalculationNoteStep, type NotebookLocalConstant } from "../lib/calculator-store";
import { localizedText } from "../lib/i18n";
import { evaluateNotebookSteps } from "../lib/notebook-engine";
import { PRESET_NOTEBOOK_SEEDS } from "../lib/notebook-formulas";
import { buildNotebookExportModel, resolveNotebookStepDisplay, notebookWithDraftValues } from "../lib/notebook-export-model";

const NOW = "2026-01-01T00:00:00.000Z";

// PRESET_NOTEBOOK_SEEDSはシード（LocalizedText等）のままなので、buildNotebookExportModelが
// 受け取るCalculationNotebookの形に組み立て直す。calculator-storeのbuildPresetNotebooksFromSeeds
// と同じ変換だが、そちらはAsyncStorage/Reactを芋づる式にimportしてこの純関数テストが読み込めなく
// なるため、ここでは必要な変換だけを再現する（本番の採番規則との一致は問わない）。
function notebookFromSeed(categoryId: string, seedIndex: number, language: "en" | "ja"): CalculationNotebook {
  const seed = PRESET_NOTEBOOK_SEEDS[categoryId][seedIndex];
  const localConstants: NotebookLocalConstant[] = seed.localConstants.map((constant, index) => ({
    id: `${categoryId}-${seedIndex}-c${index}`,
    symbol: constant.symbol,
    expression: constant.expression,
  }));
  const steps: CalculationNoteStep[] = seed.steps.map((step, index) => ({
    id: `${categoryId}-${seedIndex}-s${index}`,
    title: localizedText(step.title, language),
    expression: step.expression,
    targetUnit: step.targetUnit,
    formulaLatex: step.formulaLatex,
    resultSymbol: step.resultSymbol,
  }));
  return {
    id: `${categoryId}-${seedIndex}`,
    title: localizedText(seed.title, language),
    description: localizedText(seed.description, language),
    categoryId,
    formulas: (seed.formulas ?? []).map((formula, index) => ({
      id: `${categoryId}-${seedIndex}-f${index}`,
      explanation: localizedText(formula.explanation, language),
      latex: formula.latex,
    })),
    localConstants,
    steps,
    pinned: false,
    isPreset: true,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function notebook(overrides: Partial<CalculationNotebook>): CalculationNotebook {
  return {
    id: "n1",
    title: "テスト",
    description: "",
    categoryId: "custom",
    formulas: [],
    localConstants: [],
    steps: [],
    pinned: false,
    isPreset: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("buildNotebookExportModel", () => {
  it("実際のプリセット（formulasを持つ）から、数式・定数・結果記号の等式形の手順を組み立てる", () => {
    // science-motion[0]は formulas（解説＋数式のペア）とローカル定数、resultSymbol「v」付きの
    // 手順を実際に持つプリセット。導出結果を実データで検証する。
    const model = buildNotebookExportModel({
      notebook: notebookFromSeed("science-motion", 0, "en"),
      globalConstants: [],
      language: "en",
      locale: undefined,
      unitSystem: "metric",
      measuringStandard: "jis",
      unitOverrides: {},
    });

    expect(model.formulas).toEqual([
      { explanation: "Speed equals distance divided by time.", latex: "v = \\dfrac{d}{t}" },
      { explanation: "Distance equals speed multiplied by time.", latex: "d = vt" },
      { explanation: "Time equals distance divided by speed.", latex: "t = \\dfrac{d}{v}" },
    ]);
    expect(model.constants).toEqual([{ text: "d=140km" }, { text: "t=2h" }, { text: "t₂=3h" }, { text: "d₃=245km" }]);
    // resultSymbol「v」が付いた手順は「v=d/t」という等式の形でexpressionに出る
    // （結果欄を「d/t」ではなく「v = d/t」と等式で読めるようにする、というCLAUDE.mdの設計どおり）。
    expect(model.steps[0]).toEqual({ title: "Speed v", expression: "v=d/t", resultText: "70 km/h", isError: false });
    // 後続の手順は s1 ではなく v を参照する（resultSymbolを補うときに参照側も書き換える不変条件）。
    expect(model.steps[1]).toEqual({
      title: "Distance covered in time t₂",
      expression: "d₂=v*t₂",
      resultText: "210 km",
      isError: false,
    });
  });

  it("formulasを持たないプリセットは、手順のformulaLatexをnotebookFormulaRowsで拾う", () => {
    // science-motion[1]（平均の速さ）はformulasを持たず、各手順のformulaLatexだけで数式を表示する
    // 現実のプリセット（112件中108件がこの形）。notebook-formula-rows.tsの既存フォールバックを
    // 再実装せず、そのまま通していることを確認する。
    const model = buildNotebookExportModel({
      notebook: notebookFromSeed("science-motion", 1, "ja"),
      globalConstants: [],
      language: "ja",
      locale: undefined,
      unitSystem: "metric",
      measuringStandard: "jis",
      unitOverrides: {},
    });

    expect(model.formulas).toEqual([
      { explanation: "", latex: "d = d_1 + d_2" },
      { explanation: "", latex: "t = t_1 + t_2" },
      { explanation: "", latex: "\\bar{v} = \\dfrac{d}{t}" },
    ]);
  });

  it("表示単位の上書きが結果の次元に合うときは、その単位で表示する", () => {
    const step: CalculationNoteStep = { id: "s1", title: "", expression: "5m", targetUnit: "m" };
    const model = buildNotebookExportModel({
      notebook: notebook({ steps: [step] }),
      globalConstants: [],
      language: "en",
      locale: undefined,
      unitSystem: "metric",
      unitOverrides: { s1: "cm" },
      measuringStandard: "jis",
    });
    expect(model.steps[0]).toEqual({ title: "5m", expression: "5m", resultText: "500 cm", isError: false });
  });

  it("表示単位の上書きが結果の次元に合わないときは、画面と同じくSI表記へフォールバックする（値は残り、isErrorはfalseのまま）", () => {
    const step: CalculationNoteStep = { id: "s1", title: "", expression: "5m", targetUnit: "cm" };
    const withoutOverride = buildNotebookExportModel({
      notebook: notebook({ steps: [step] }),
      globalConstants: [],
      language: "en",
      locale: undefined,
      unitSystem: "metric",
      unitOverrides: {},
      measuringStandard: "jis",
    });
    expect(withoutOverride.steps[0].resultText).toBe("500 cm");

    // "kg"は長さの次元に合わないので変換に失敗し、SI基本単位（m）での表記へ落ちる。
    // 値そのものは出せている（isError: falseのまま）ことが、画面側の
    // 「displayError && !displayValue のときだけ完全なエラー扱いにする」という判定と一致する。
    const withInvalidOverride = buildNotebookExportModel({
      notebook: notebook({ steps: [step] }),
      globalConstants: [],
      language: "en",
      locale: undefined,
      unitSystem: "metric",
      unitOverrides: { s1: "kg" },
      measuringStandard: "jis",
    });
    expect(withInvalidOverride.steps[0].resultText).toBe("5 m");
    expect(withInvalidOverride.steps[0].isError).toBe(false);
  });

  it("手順の計算に失敗すると、その言語のエラーメッセージがresultTextに入りisErrorがtrueになる", () => {
    const step: CalculationNoteStep = { id: "s1", title: "", expression: "5m+3kg", targetUnit: "" };
    const en = buildNotebookExportModel({
      notebook: notebook({ steps: [step] }),
      globalConstants: [],
      language: "en",
      locale: undefined,
      unitSystem: "metric",
      unitOverrides: {},
      measuringStandard: "jis",
    });
    const ja = buildNotebookExportModel({
      notebook: notebook({ steps: [step] }),
      globalConstants: [],
      language: "ja",
      locale: undefined,
      unitSystem: "metric",
      unitOverrides: {},
      measuringStandard: "jis",
    });
    expect(en.steps[0]).toEqual({ title: "5m+3kg", expression: "5m+3kg", resultText: "Only values with the same dimension can be added or subtracted.", isError: true });
    expect(ja.steps[0]).toEqual({ title: "5m+3kg", expression: "5m+3kg", resultText: "加算・減算できるのは同じ次元の値だけです。", isError: true });
  });

  it("ローカル定数は name=expression の1行としてconstantsに出る", () => {
    const localConstants: NotebookLocalConstant[] = [
      { id: "c1", symbol: "v0", expression: "5m/s" },
      { id: "c2", symbol: "a", expression: "2m/s^2" },
    ];
    const model = buildNotebookExportModel({
      notebook: notebook({ localConstants, steps: [{ id: "s1", title: "", expression: "v0+a", targetUnit: "" }] }),
      globalConstants: [],
      language: "en",
      locale: undefined,
      unitSystem: "metric",
      unitOverrides: {},
      measuringStandard: "jis",
    });
    expect(model.constants).toEqual([{ text: "v0=5m/s" }, { text: "a=2m/s^2" }]);
  });

  it("タイトル・説明文はノートのものをそのまま出す", () => {
    const model = buildNotebookExportModel({
      notebook: notebook({ title: "自由落下", description: "重力加速度で落下する物体", steps: [{ id: "s1", title: "", expression: "9.8m/s^2*2s", targetUnit: "" }] }),
      globalConstants: [],
      language: "ja",
      locale: undefined,
      unitSystem: "metric",
      unitOverrides: {},
      measuringStandard: "jis",
    });
    expect(model.title).toBe("自由落下");
    expect(model.description).toBe("重力加速度で落下する物体");
  });
});

describe("resolveNotebookStepDisplay", () => {
  // notebook-detail.tsx（画面）とbuildNotebookExportModel（PDFエクスポート）の両方が通す
  // 共有関数そのものを、evaluateNotebookStepsの結果を直接渡して検証する。
  it("SIへ戻すチップ（override===\"\"）はSI基本単位での表記に戻す", () => {
    const results = evaluateNotebookSteps([{ id: "s1", title: "", expression: "5m", targetUnit: "cm" }], [], "en", [], undefined);
    const display = resolveNotebookStepDisplay(results[0], "", "metric", undefined);
    expect(display).toEqual({ value: "5 m", error: undefined, isError: false });
  });
});

describe("notebookWithDraftValues", () => {
  // 画面は編集途中の値から結果を導出して表示しているので、保存前に共有したときに
  // 保存済みの値でPDFを出すと数値が食い違う（このモジュールを作った目的そのものが崩れる）。
  it("編集途中の定数・手順で差し替え、それがエクスポート結果に反映される", () => {
    const saved = notebook({
      localConstants: [{ id: "c1", symbol: "d", expression: "100m" }],
      steps: [{ id: "s1", title: "", expression: "d", targetUnit: "" }],
    });
    const draft = notebookWithDraftValues(
      saved,
      [{ id: "c1", symbol: "d", expression: "250m" }],
      [{ id: "s1", title: "", expression: "d", targetUnit: "" }],
    );

    const options = { globalConstants: [], language: "en" as const, unitSystem: "metric" as const, measuringStandard: "jis" as const, unitOverrides: {} };
    const savedModel = buildNotebookExportModel({ notebook: saved, ...options });
    const draftModel = buildNotebookExportModel({ notebook: draft, ...options });

    expect(savedModel.steps[0].resultText).toContain("100");
    expect(draftModel.steps[0].resultText).toContain("250");
    expect(draftModel.constants[0].text).toBe("d=250m");
  });

  // 空行を間引くと後続の s1・s2… の参照先がずれて別の数値になるため、配列は素通しにする。
  it("空行を間引かず、渡された配列をそのまま使う", () => {
    const draft = notebookWithDraftValues(
      notebook({}),
      [{ id: "c1", symbol: "", expression: "" }],
      [{ id: "s1", title: "", expression: "", targetUnit: "" }],
    );
    expect(draft.localConstants).toHaveLength(1);
    expect(draft.steps).toHaveLength(1);
  });

  it("差し替え以外のフィールドは保存済みのノートのものを保つ", () => {
    const saved = notebook({ id: "keep", title: "残る名前", description: "残る説明", isPreset: true });
    const draft = notebookWithDraftValues(saved, [], []);
    expect(draft.id).toBe("keep");
    expect(draft.title).toBe("残る名前");
    expect(draft.description).toBe("残る説明");
    expect(draft.isPreset).toBe(true);
  });
});
