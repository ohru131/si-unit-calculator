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
    const { notebooks: result, changed } = localizePresetNotebooks([notebook], "en", "ja");
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
    const { notebooks: onceLocalized } = localizePresetNotebooks([notebook], "en", "ja");
    const { notebooks: twiceLocalized, changed } = localizePresetNotebooks(onceLocalized, "en", "en");
    expect(changed).toBe(false);
    expect(twiceLocalized[0]).toBe(onceLocalized[0]);
  });

  it("タイトルをユーザーが独自にリネームしたプリセットは、言語切替後もその名前が保持される", () => {
    const notebook: CalculationNotebook = { ...buildSeededNotebook(CATEGORY_ID, SEED_INDEX, "ja"), title: "自分用の合成抵抗メモ" };
    const { notebooks: result } = localizePresetNotebooks([notebook], "en", "ja");
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
    const { notebooks: result } = localizePresetNotebooks([notebook], "en", "ja");
    expect(result[0].localConstants).toEqual(notebook.localConstants);
  });

  it("isPreset:falseのユーザー作成ノートは言語切替で一切変化しない（参照も同一のまま）", () => {
    const notebook = userNotebook();
    const { notebooks: result, changed } = localizePresetNotebooks([notebook], "en", "ja");
    expect(changed).toBe(false);
    expect(result[0]).toBe(notebook);
  });

  it("ノートより下位（formulas/steps）だけをリネームしても、他のフィールドは影響を受けない", () => {
    const notebook = buildSeededNotebook(CATEGORY_ID, SEED_INDEX, "ja");
    const renamedStep: CalculationNotebook = {
      ...notebook,
      steps: notebook.steps.map((step, index) => (index === 0 ? { ...step, title: "自分用の手順名" } : step)),
    };
    const { notebooks: result } = localizePresetNotebooks([renamedStep], "en", "ja");
    const seed = PRESET_NOTEBOOK_SEEDS[CATEGORY_ID]![SEED_INDEX]!;
    expect(result[0].steps[0].title).toBe("自分用の手順名");
    if (result[0].steps.length > 1) {
      expect(result[0].steps[1].title).toBe(localizedText(seed.steps[1].title, "en"));
    }
    expect(result[0].title).toBe(localizedText(seed.title, "en"));
  });

  // CodeRabbitがPR #21で指摘したシナリオの再現。previousLanguageを対応言語全部との比較に
  // していた旧実装だと、ユーザーが「今のUI言語とは別の言語のシード文言」をそのまま入力した場合に
  // それを「未編集」と誤判定して上書きしてしまう。
  //
  // 注意: このアプリの対応言語はen/jaの2つしか無いため、素朴に「jaで投入→enに切替→
  // タイトルをseed.jaの文字列に書き換える→jaに切替」という手順だけでは実は再現できない
  // （switch先が偶然ユーザーの書き換え先と同じjaになるため、旧実装でも「(いったんseed.jaとして
  // 復元してから)targetのjaを当てはめる」結果、たまたま同じ文字列に落ち着いてしまう）。
  // 実際にバグを踏むのは「UI言語が変わらないまま再解決が走る」ケース（例: アプリの再起動、
  // 別の変更をきっかけにこのuseEffectが再実行される等）で、そのときにpreviousLanguageと
  // targetのlanguageが同じ"en"であるにも関わらず、旧実装は対応言語全部（en/ja）と比較してしまい
  // ユーザーが書き込んだseed.ja文字列がseed.jaと一致するというだけで「未編集」と誤判定する。
  it("ユーザーが意図的に別言語のシード文言に書き換えた場合、UI言語が変わらないまま再解決されてもその入力が保持される（全言語比較だと誤って上書きされるバグの再現）", () => {
    const seed = PRESET_NOTEBOOK_SEEDS[CATEGORY_ID]![SEED_INDEX]!;

    // ja で投入 → en に切替（追随する）。保存言語は "en" になる。
    const seededJa = buildSeededNotebook(CATEGORY_ID, SEED_INDEX, "ja");
    const { notebooks: afterSwitchToEn } = localizePresetNotebooks([seededJa], "en", "ja");
    expect(afterSwitchToEn[0].title).toBe(localizedText(seed.title, "en"));

    // ユーザーが en UI 上でタイトルを seed.ja の文字列に書き換える（言語切替は起きていない）。
    const editedByUser: CalculationNotebook = { ...afterSwitchToEn[0], title: localizedText(seed.title, "ja") };

    // UI言語は en のまま変わっていないので、直前に適用した言語も en。この状態で再解決が走っても
    // （previousLanguage="en", language="en"）、現在のタイトルはseed.enとは一致しないため
    // 「編集済み」と判定され、ユーザーの入力がそのまま保持されるべき。
    const { notebooks: afterReresolve, changed } = localizePresetNotebooks([editedByUser], "en", "en");
    expect(afterReresolve[0].title).toBe(localizedText(seed.title, "ja"));
    expect(changed).toBe(false);

    // その後 ja に切替えても、ユーザーの入力（結果的にseed.jaと同じ文字列）はそのまま維持される。
    const { notebooks: afterSwitchToJa } = localizePresetNotebooks(afterReresolve, "ja", "en");
    expect(afterSwitchToJa[0].title).toBe(localizedText(seed.title, "ja"));
  });

  // 移行フォールバック: 保存言語がまだ無い（previousLanguageがnull）端末では、対応言語全部との
  // 比較にフォールバックする。これにより、この仕組みを導入する前からプリセットを使っている
  // ユーザーでも、初回の言語切替は引き続き文言が追従する。
  it("previousLanguageがnull（保存言語が無い移行前の端末）のときは、従来どおり対応言語全部と比較して追従する", () => {
    const notebook = buildSeededNotebook(CATEGORY_ID, SEED_INDEX, "ja");
    const { notebooks: result, changed } = localizePresetNotebooks([notebook], "en", null);
    expect(changed).toBe(true);
    const seed = PRESET_NOTEBOOK_SEEDS[CATEGORY_ID]![SEED_INDEX]!;
    expect(result[0].title).toBe(localizedText(seed.title, "en"));
  });
});
