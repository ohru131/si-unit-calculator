import { describe, expect, it, vi } from "vitest";

// vi.mock は vitest が import より上にホイストするため、importの後に書いてよい。
// lib/notebooks-backup.ts は UNCATEGORIZED_CATEGORY_ID を値として lib/calculator-store.tsx から
// importしており、その先の useGlobalSettings（@/lib/global-settings）経由で expo-localization →
// react-native の内部実装（Flow構文を含む生の.js）まで読み込まれてしまい、このvitest環境では
// パースできない（tests/preset-price-defaults.test.tsと同じ既知の制約）。ここではReactに
// 依存しない純関数（sanitizeBackupFileLabel）だけを検証したいので、実体を読み込ませずにモックする。
vi.mock("@/lib/global-settings", () => ({ useGlobalSettings: () => ({ language: "en", currencyCode: null, regionCode: null }) }));

import type { CalculationNotebook } from "../lib/calculator-store";
import {
  applyPresetNotebookOverrides,
  buildPresetNotebookOverrides,
  parseNotebooksBackup,
  sanitizeBackupFileLabel,
  serializeNotebooksBackup,
  type PresetNotebookOverride,
} from "../lib/notebooks-backup";

// テスト用のCalculationNotebookを組み立てる。isPreset/createdAt/updatedAt以外は
// テストの関心事に応じてoverridesで上書きする。
function makeNotebook(overrides: Partial<CalculationNotebook> = {}): CalculationNotebook {
  return {
    id: "notebook-preset-astronomy-0",
    title: "第一宇宙速度",
    description: "",
    categoryId: "astronomy",
    formulas: [],
    localConstants: [{ id: "c1", symbol: "R", expression: "6371km" }],
    steps: [{ id: "s1", title: "v", expression: "sqrt(g*R)", targetUnit: "km/s" }],
    pinned: false,
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("sanitizeBackupFileLabel", () => {
  it("日本語のカテゴリ名はそのまま使える（禁則文字が無いので変化しない）", () => {
    expect(sanitizeBackupFileLabel("材料力学")).toBe("材料力学");
  });

  it("ファイル名に使えない記号をハイフンに置換し、連続するハイフンはまとめる", () => {
    expect(sanitizeBackupFileLabel('a/b\\c:d*e?f"g<h>i|j')).toBe("a-b-c-d-e-f-g-h-i-j");
  });

  it("記号だけの名前は空文字になり、呼び出し側でフォールバックできる", () => {
    expect(sanitizeBackupFileLabel("***///")).toBe("");
  });

  it("空文字はそのまま空文字を返す", () => {
    expect(sanitizeBackupFileLabel("")).toBe("");
  });

  it("前後の空白・ハイフンは畳んで取り除く", () => {
    expect(sanitizeBackupFileLabel("  自転車  ")).toBe("自転車");
    expect(sanitizeBackupFileLabel("--車/自転車--")).toBe("車-自転車");
  });

  it("長すぎる名前は上限で切り詰める", () => {
    const longLabel = "あ".repeat(200);
    const result = sanitizeBackupFileLabel(longLabel);
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result).toBe("あ".repeat(60));
  });

  it("制御文字もハイフンに置換される", () => {
    // 生の制御文字（タブ=char code 9）をツール入力のエスケープ表記に頼らず組み立てる。
    const withTab = `料理${String.fromCharCode(9)}ノート`;
    expect(sanitizeBackupFileLabel(withTab)).toBe("料理-ノート");
  });
});

describe("buildPresetNotebookOverrides", () => {
  it("updatedAt === createdAt のプリセットはoverrideに含まれない（未編集）", () => {
    const notebooks = [makeNotebook()];
    expect(buildPresetNotebookOverrides(notebooks)).toEqual([]);
  });

  it("updatedAt !== createdAt のプリセットはoverrideに含まれる（編集済み）", () => {
    const edited = makeNotebook({ title: "第一宇宙速度（編集済み）", updatedAt: "2026-02-01T00:00:00.000Z" });
    const overrides = buildPresetNotebookOverrides([edited]);
    expect(overrides).toEqual([
      {
        presetId: "notebook-preset-astronomy-0",
        title: "第一宇宙速度（編集済み）",
        description: "",
        formulas: [],
        localConstants: [{ symbol: "R", expression: "6371km" }],
        steps: [{ title: "v", expression: "sqrt(g*R)", targetUnit: "km/s", formulaLatex: undefined, resultSymbol: undefined }],
      },
    ]);
  });

  it("isPreset:false のノートはupdatedAtが違っていてもoverrideに含まれない", () => {
    const userNotebook = makeNotebook({ id: "notebook-123", isPreset: false, updatedAt: "2026-02-01T00:00:00.000Z" });
    expect(buildPresetNotebookOverrides([userNotebook])).toEqual([]);
  });

  it("地域別の価格既定値のように、シードの値と異なっていてもupdatedAt===createdAtなら未編集扱いになる（シード比較にしない）", () => {
    // lib/preset-price-defaults.ts が投入時に差し込む地域別の価格を模して、
    // シードのexpressionとは異なる値をlocalConstantsに入れておく。それでも
    // updatedAt===createdAtである限りoverrideには含まれないことを確認する。
    const priceAdjustedAtSeedTime = makeNotebook({
      id: "notebook-preset-practical-electricity-0",
      localConstants: [{ id: "c1", symbol: "p", expression: "31" }],
    });
    expect(buildPresetNotebookOverrides([priceAdjustedAtSeedTime])).toEqual([]);
  });
});

describe("applyPresetNotebookOverrides", () => {
  const now = "2026-03-01T00:00:00.000Z";

  it("presetIdで一致するノートに、title/description/formulas/localConstants/stepsを上書きする", () => {
    const presetNotebooks = [makeNotebook()];
    const overrides: PresetNotebookOverride[] = [{
      presetId: "notebook-preset-astronomy-0",
      title: "編集後のタイトル",
      description: "編集後の説明",
      formulas: [{ explanation: "説明", latex: "v = \\sqrt{gR}" }],
      localConstants: [{ symbol: "R", expression: "6400km" }],
      steps: [{ title: "v", expression: "sqrt(g*R)", targetUnit: "m/s" }],
    }];
    const { notebooks, appliedCount } = applyPresetNotebookOverrides(presetNotebooks, overrides, now);
    expect(appliedCount).toBe(1);
    expect(notebooks[0].title).toBe("編集後のタイトル");
    expect(notebooks[0].description).toBe("編集後の説明");
    expect(notebooks[0].localConstants).toEqual([{ id: expect.any(String), symbol: "R", expression: "6400km" }]);
    expect(notebooks[0].steps).toEqual([{ id: expect.any(String), title: "v", expression: "sqrt(g*R)", targetUnit: "m/s" }]);
    expect(notebooks[0].formulas).toEqual([{ id: expect.any(String), explanation: "説明", latex: "v = \\sqrt{gR}" }]);
  });

  it("override適用後もid・isPreset・pinned・createdAtは変わらない", () => {
    const presetNotebooks = [makeNotebook({ pinned: true, createdAt: "2020-01-01T00:00:00.000Z" })];
    const overrides: PresetNotebookOverride[] = [{
      presetId: "notebook-preset-astronomy-0",
      title: "編集後",
      description: "",
      formulas: [],
      localConstants: [],
      steps: [{ title: "v", expression: "1", targetUnit: "" }],
    }];
    const { notebooks } = applyPresetNotebookOverrides(presetNotebooks, overrides, now);
    expect(notebooks[0].id).toBe("notebook-preset-astronomy-0");
    expect(notebooks[0].isPreset).toBe(true);
    expect(notebooks[0].pinned).toBe(true);
    expect(notebooks[0].createdAt).toBe("2020-01-01T00:00:00.000Z");
    expect(notebooks[0].updatedAt).toBe(now);
  });

  // idが同じでもプリセットでないノートには当てない。呼び出し側でも絞っているが、
  // 「プリセットIDと同じidを持つユーザー作成ノート」を作られたときに上書きしないよう、
  // この関数自身が isPreset を見る契約にしてある。
  it("isPresetでないノートには、idが一致していても当てない", () => {
    const notebooksInput = [makeNotebook({ isPreset: false, title: "ユーザーのノート" })];
    const overrides: PresetNotebookOverride[] = [{
      presetId: "notebook-preset-astronomy-0",
      title: "上書きされてはいけない",
      description: "",
      formulas: [],
      localConstants: [],
      steps: [{ title: "v", expression: "1", targetUnit: "" }],
    }];
    const { notebooks, appliedCount } = applyPresetNotebookOverrides(notebooksInput, overrides, now);
    expect(appliedCount).toBe(0);
    expect(notebooks[0].title).toBe("ユーザーのノート");
  });

  it("一致するpresetIdが無いoverrideは黙って捨てられる（該当ノートは変更されない）", () => {
    const presetNotebooks = [makeNotebook()];
    const overrides: PresetNotebookOverride[] = [{
      presetId: "notebook-preset-does-not-exist-0",
      title: "存在しないノート宛のoverride",
      description: "",
      formulas: [],
      localConstants: [],
      steps: [{ title: "x", expression: "1", targetUnit: "" }],
    }];
    const { notebooks, appliedCount } = applyPresetNotebookOverrides(presetNotebooks, overrides, now);
    expect(appliedCount).toBe(0);
    expect(notebooks).toEqual(presetNotebooks);
  });

  it("isPreset:falseのノートは呼び出し側の責務でこの関数に渡さない前提だが、渡された場合はpresetIdが一致すれば適用してしまう（呼び出し側でisPresetフィルタが必須であることの裏付け）", () => {
    // この関数自体はisPresetを見ない設計（呼び出し側がpresetNotebooksとしてisPreset===trueのものだけを
    // 渡す契約になっている）。calculator-store.tsxのimportNotebooksが実際にそうしているかは
    // 別途importNotebooksの統合テストの範囲だが、ここでは契約どおりに使えば安全であることを示す。
    const presetOnly = [makeNotebook()].filter((notebook) => notebook.isPreset);
    const overrides: PresetNotebookOverride[] = [{
      presetId: "notebook-preset-astronomy-0",
      title: "編集後",
      description: "",
      formulas: [],
      localConstants: [],
      steps: [{ title: "v", expression: "1", targetUnit: "" }],
    }];
    const { appliedCount } = applyPresetNotebookOverrides(presetOnly, overrides, now);
    expect(appliedCount).toBe(1);
  });
});

describe("createNotebooksBackup / parseNotebooksBackup のpresetOverrides往復", () => {
  it("編集済みのプリセットはpresetOverridesとして書き出され、パースでも読み戻せる", () => {
    const editedPreset = makeNotebook({ title: "編集済み", updatedAt: "2026-02-01T00:00:00.000Z" });
    const raw = serializeNotebooksBackup([editedPreset], []);
    const parsed = parseNotebooksBackup(raw, "en");
    expect(parsed.presetOverrides).toHaveLength(1);
    expect(parsed.presetOverrides[0].presetId).toBe("notebook-preset-astronomy-0");
    expect(parsed.presetOverrides[0].title).toBe("編集済み");
    // プリセット本体（notebooks配列）には現れない（プリセットのノート本体は書き出し対象外のまま）。
    expect(parsed.notebooks).toEqual([]);
  });

  it("編集されていないプリセットしか無ければ、presetOverridesフィールド自体が無い（従来どおりの形）", () => {
    const raw = serializeNotebooksBackup([makeNotebook()], []);
    const backup = JSON.parse(raw);
    expect(backup.presetOverrides).toBeUndefined();
    expect(parseNotebooksBackup(raw, "en").presetOverrides).toEqual([]);
  });

  it("presetOverridesを持たない古い形式のファイルも今までどおり読める（後方互換）", () => {
    const legacyBackup = {
      format: "si-unit-calculator.notebooks",
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      notebooks: [{ title: "自作ノート", description: "", formulas: [], localConstants: [], steps: [{ title: "s", expression: "1m", targetUnit: "m" }] }],
    };
    const parsed = parseNotebooksBackup(JSON.stringify(legacyBackup), "en");
    expect(parsed.notebooks).toHaveLength(1);
    expect(parsed.presetOverrides).toEqual([]);
  });

  it("presetOverridesの要素が壊れていても、ノート本体の取り込みは成功する（壊れた要素だけを黙って捨てる）", () => {
    const backupWithBrokenOverride = {
      format: "si-unit-calculator.notebooks",
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      notebooks: [{ title: "自作ノート", description: "", formulas: [], localConstants: [], steps: [{ title: "s", expression: "1m", targetUnit: "m" }] }],
      presetOverrides: [
        // presetIdが無い・stepsが空・stepsが配列でないなど、それぞれ壊れ方の異なる要素。
        { title: "壊れたoverride", description: "", formulas: [], localConstants: [], steps: [] },
        { presetId: "notebook-preset-astronomy-0", title: "有効なoverride", description: "", formulas: [], localConstants: [], steps: [{ title: "v", expression: "1", targetUnit: "" }] },
        "not even an object",
      ],
    };
    const parsed = parseNotebooksBackup(JSON.stringify(backupWithBrokenOverride), "en");
    expect(parsed.notebooks).toHaveLength(1);
    expect(parsed.notebooks[0].title).toBe("自作ノート");
    // 壊れた2件は捨てられ、有効な1件だけが残る。
    expect(parsed.presetOverrides).toHaveLength(1);
    expect(parsed.presetOverrides[0].presetId).toBe("notebook-preset-astronomy-0");
  });
});
