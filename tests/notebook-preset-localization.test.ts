import { describe, expect, it, vi } from "vitest";

import { CalculationNotebook, localizePresetNotebooks, presetConstantId, presetFormulaId, presetNotebookId, presetStepId } from "../lib/calculator-store";
import { localizedText } from "../lib/i18n";
import { PRESET_NOTEBOOK_SEEDS } from "../lib/notebook-formulas";

// vi.mock は vitest が import より上にホイストするため、importの後に書いてよい。
// lib/calculator-store.tsx は useGlobalSettings（@/lib/global-settings）をimportしており、
// その先で expo-localization → expo-modules-core → react-native の内部実装（Flowの
// `import typeof X from "..."` 構文を含む生の .js）まで芋づる式に読み込まれる。
// このリポジトリのvitest環境はそのFlow構文を解釈できずモジュールの読み込み自体に失敗するため
// （lib/calculator-store.tsxの内容とは無関係な、既存の環境側の制約）、ここではReactに一切
// 依存しない再解決ロジック（localizePresetNotebooks）だけをテストしたいという意図を明確にする形で
// @/lib/global-settings をモックし、実際には使わない（この純関数はReactフックを呼ばない）。
vi.mock("@/lib/global-settings", () => ({ useGlobalSettings: () => ({ language: "en" }) }));

// 実際のプリセット投入処理と同じID採番でノートを組み立てる。IDの文字列をここで組み立て直すと
// 本番の採番が変わってもテストだけ通り続けてしまうため、必ず calculator-store が公開している
// 採番関数（presetNotebookId など）を使う。
function buildSeededNotebook(categoryId: string, seedIndex: number, language: "en" | "ja"): CalculationNotebook {
  const seed = PRESET_NOTEBOOK_SEEDS[categoryId]?.[seedIndex];
  if (!seed) throw new Error(`seed not found: ${categoryId}[${seedIndex}]`);
  const now = "2026-01-01T00:00:00.000Z";
  return {
    id: presetNotebookId(categoryId, seedIndex),
    title: localizedText(seed.title, language),
    description: localizedText(seed.description, language),
    categoryId,
    formulas: (seed.formulas ?? []).map((formula, formulaIndex) => ({
      id: presetFormulaId(categoryId, seedIndex, formulaIndex),
      explanation: localizedText(formula.explanation, language),
      latex: formula.latex,
    })),
    localConstants: seed.localConstants.map((constant, constantIndex) => ({
      id: presetConstantId(categoryId, seedIndex, constantIndex),
      symbol: constant.symbol,
      expression: constant.expression,
    })),
    steps: seed.steps.map((step, stepIndex) => ({
      id: presetStepId(categoryId, seedIndex, stepIndex),
      title: localizedText(step.title, language),
      expression: step.expression,
      targetUnit: step.targetUnit,
      formulaLatex: step.formulaLatex,
      resultSymbol: step.resultSymbol,
    })),
    pinned: false,
    isPreset: true,
    createdAt: now,
    updatedAt: now,
  };
}

// categoryId自体に"-"を含む代表例として electricity-basics を使う。
// （素朴なid.split("-")でパースすると、この手のcategoryIdでseedIndexの逆引きが壊れる。）
const CATEGORY_ID = "electricity-basics";
const SEED_INDEX = PRESET_NOTEBOOK_SEEDS[CATEGORY_ID]?.findIndex((seed) => seed.title.ja === "抵抗の直列・並列合成") ?? -1;

function userNotebook(): CalculationNotebook {
  return {
    id: "notebook-user-1",
    title: "自作ノート",
    description: "自作の説明",
    categoryId: "uncategorized",
    formulas: [{ id: "user-formula-1", explanation: "自作の解説", latex: "x=1" }],
    localConstants: [{ id: "user-constant-1", symbol: "k", expression: "2" }],
    steps: [{ id: "user-step-1", title: "自作の手順", expression: "1m", targetUnit: "m" }],
    pinned: false,
    isPreset: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("localizePresetNotebooks", () => {
  it("categoryIdにハイフンを含む実在のシード（electricity-basics）を正しく引き当てられる", () => {
    expect(SEED_INDEX).toBeGreaterThanOrEqual(0);
  });

  it("未編集のプリセットは言語切替で文言が新しい言語に差し替わる", () => {
    const notebook = buildSeededNotebook(CATEGORY_ID, SEED_INDEX, "ja");
    const { notebooks: result, changed } = localizePresetNotebooks([notebook], "en");
    expect(changed).toBe(true);
    const seed = PRESET_NOTEBOOK_SEEDS[CATEGORY_ID]![SEED_INDEX]!;
    expect(result[0].title).toBe(localizedText(seed.title, "en"));
    expect(result[0].description).toBe(localizedText(seed.description, "en"));
    result[0].steps.forEach((step, index) => {
      expect(step.title).toBe(localizedText(seed.steps[index].title, "en"));
    });
  });

  it("再度同じ言語で解決してもchangedがfalseになる（無駄な書き込みをしない）", () => {
    const notebook = buildSeededNotebook(CATEGORY_ID, SEED_INDEX, "ja");
    const { notebooks: onceLocalized } = localizePresetNotebooks([notebook], "en");
    const { notebooks: twiceLocalized, changed } = localizePresetNotebooks(onceLocalized, "en");
    expect(changed).toBe(false);
    expect(twiceLocalized[0]).toBe(onceLocalized[0]);
  });

  it("タイトルをユーザーが独自にリネームしたプリセットは、言語切替後もその名前が保持される", () => {
    const notebook: CalculationNotebook = { ...buildSeededNotebook(CATEGORY_ID, SEED_INDEX, "ja"), title: "自分用の合成抵抗メモ" };
    const { notebooks: result } = localizePresetNotebooks([notebook], "en");
    expect(result[0].title).toBe("自分用の合成抵抗メモ");
    // タイトルだけリネームした場合でも、未編集の説明文は言語切替に追従してよい。
    const seed = PRESET_NOTEBOOK_SEEDS[CATEGORY_ID]![SEED_INDEX]!;
    expect(result[0].description).toBe(localizedText(seed.description, "en"));
  });

  it("localConstantsの値（ユーザーが編集しうるフィールド）は言語切替で一切書き換わらない", () => {
    const notebook: CalculationNotebook = {
      ...buildSeededNotebook(CATEGORY_ID, SEED_INDEX, "ja"),
      localConstants: [{ id: "preset-electricity-basics-0-constant-0", symbol: "R₁", expression: "999Ohm" }],
    };
    const { notebooks: result } = localizePresetNotebooks([notebook], "en");
    expect(result[0].localConstants).toEqual(notebook.localConstants);
  });

  it("isPreset:falseのユーザー作成ノートは言語切替で一切変化しない（参照も同一のまま）", () => {
    const notebook = userNotebook();
    const { notebooks: result, changed } = localizePresetNotebooks([notebook], "en");
    expect(changed).toBe(false);
    expect(result[0]).toBe(notebook);
  });

  it("ノートより下位（formulas/steps）だけをリネームしても、他のフィールドは影響を受けない", () => {
    const notebook = buildSeededNotebook(CATEGORY_ID, SEED_INDEX, "ja");
    const renamedStep: CalculationNotebook = {
      ...notebook,
      steps: notebook.steps.map((step, index) => (index === 0 ? { ...step, title: "自分用の手順名" } : step)),
    };
    const { notebooks: result } = localizePresetNotebooks([renamedStep], "en");
    const seed = PRESET_NOTEBOOK_SEEDS[CATEGORY_ID]![SEED_INDEX]!;
    expect(result[0].steps[0].title).toBe("自分用の手順名");
    if (result[0].steps.length > 1) {
      expect(result[0].steps[1].title).toBe(localizedText(seed.steps[1].title, "en"));
    }
    expect(result[0].title).toBe(localizedText(seed.title, "en"));
  });
});
