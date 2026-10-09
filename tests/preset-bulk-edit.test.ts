import { describe, expect, it, vi } from "vitest";

import { applyPresetSeedUpdates, buildPresetNotebooksFromSeeds, presetSeedTexts, type CalculationNotebook } from "../lib/calculator-store";
import { applyPresetNotebookOverrides, parseNotebooksBackup, serializeNotebooksBackup, type PresetNotebookOverride } from "../lib/notebooks-backup";
import { resolvePresetRegionalDefaults } from "../lib/preset-regional-defaults";

// calculator-store は global-settings 経由で React Native を芋づる式に読み込むので切る
// （tests/preset-regional-sync.test.ts と同じ形）。
vi.mock("@/lib/global-settings", () => ({ useGlobalSettings: () => ({ language: "en", currencyCode: null, regionCode: null }) }));

const NOW = "2026-01-01T00:00:00.000Z";
const LATER = "2026-03-01T00:00:00.000Z";
const CATEGORIES = ["electricity-basics", "eng-stress"];

function seeded(language: "ja" | "en"): CalculationNotebook[] {
  return buildPresetNotebooksFromSeeds(CATEGORIES, language, resolvePresetRegionalDefaults(null, "JP", "ja"), NOW);
}

/** Pro の一括編集の書き出し → JSON → 取り込み、の往復。 */
function exportAll(notebooks: CalculationNotebook[]): PresetNotebookOverride[] {
  const json = serializeNotebooksBackup(notebooks, [], [], NOW, { includeAllPresets: true });
  return parseNotebooksBackup(json, "ja").presetOverrides;
}

function regionalNotebook(notebooks: CalculationNotebook[]): CalculationNotebook {
  const found = notebooks.find((notebook) => notebook.localConstants.some((constant) => constant.regionalDefault));
  if (!found) throw new Error("地域既定値を持つプリセットが投入されていない");
  return found;
}

describe("プリセットの一括編集（全件書き出し → 差分マージで書き戻し）", () => {
  it("全件書き出しは編集していないプリセットも含む（通常の書き出しは含まない）", () => {
    const notebooks = seeded("ja");
    expect(exportAll(notebooks)).toHaveLength(notebooks.length);
    expect(parseNotebooksBackup(serializeNotebooksBackup(notebooks, [], [], NOW), "ja").presetOverrides).toHaveLength(0);
  });

  it("何も編集せずに書き戻しても1件も変わらない（id・投入時の値・地域既定値の目印がそのまま残る）", () => {
    const notebooks = seeded("ja");
    const { notebooks: next, appliedCount } = applyPresetNotebookOverrides(notebooks, exportAll(notebooks), LATER, presetSeedTexts);
    expect(appliedCount).toBe(0);
    next.forEach((notebook, index) => expect(notebook).toBe(notebooks[index]));
  });

  it("別の言語で書き出したファイルを取り込んでも文言を書き換えない（言語切替で訳が変わらなくなるのを防ぐ）", () => {
    const { notebooks: next, appliedCount } = applyPresetNotebookOverrides(seeded("en"), exportAll(seeded("ja")), LATER, presetSeedTexts);
    expect(appliedCount).toBe(0);
    expect(next[0].title).toBe(seeded("en")[0].title);
  });

  it("変えた定数だけ書き換え、その定数からだけ地域既定値の目印を外す", () => {
    const notebooks = seeded("ja");
    const target = regionalNotebook(notebooks);
    const regional = target.localConstants.find((constant) => constant.regionalDefault)!;
    const overrides = exportAll(notebooks).map((override) => (override.presetId === target.id
      ? { ...override, localConstants: override.localConstants.map((constant) => (constant.symbol === regional.symbol ? { ...constant, expression: "999V" } : constant)) }
      : override));
    const { notebooks: next, appliedCount } = applyPresetNotebookOverrides(notebooks, overrides, LATER, presetSeedTexts);
    expect(appliedCount).toBe(1);
    const merged = next.find((notebook) => notebook.id === target.id)!;
    const changedConstant = merged.localConstants.find((constant) => constant.symbol === regional.symbol)!;
    expect(changedConstant.expression).toBe("999V");
    expect(changedConstant.regionalDefault).toBeUndefined();
    expect(changedConstant.id).toBe(regional.id);
    // 他の定数・手順は同じオブジェクトのまま（id・投入時の値ごと残る）。
    merged.localConstants.filter((constant) => constant.symbol !== regional.symbol).forEach((constant) => {
      expect(target.localConstants).toContain(constant);
    });
    merged.steps.forEach((step, index) => expect(step).toBe(target.steps[index]));
    expect(merged.updatedAt).toBe(LATER);
    // 他のノートは触らない。
    next.filter((notebook) => notebook.id !== target.id).forEach((notebook) => expect(notebook.updatedAt).toBe(NOW));
  });

  it("書き換えた定数は利用者の値として扱われ、シードの更新で上書きされない", () => {
    const notebooks = seeded("ja");
    const target = notebooks.find((notebook) => notebook.localConstants.some((constant) => constant.seededExpression && !constant.regionalDefault))!;
    const constant = target.localConstants.find((item) => item.seededExpression && !item.regionalDefault)!;
    const overrides = exportAll(notebooks).map((override) => (override.presetId === target.id
      ? { ...override, localConstants: override.localConstants.map((item) => (item.symbol === constant.symbol ? { ...item, expression: `${item.expression}*2` } : item)) }
      : override));
    const { notebooks: next } = applyPresetNotebookOverrides(notebooks, overrides, LATER, presetSeedTexts);
    const synced = applyPresetSeedUpdates(next).notebooks.find((notebook) => notebook.id === target.id)!;
    expect(synced.localConstants.find((item) => item.symbol === constant.symbol)?.expression).toBe(`${constant.expression}*2`);
  });

  it("シードに無い文言へ書き換えたタイトルは反映する", () => {
    const notebooks = seeded("ja");
    const overrides = exportAll(notebooks).map((override, index) => (index === 0 ? { ...override, title: "自分用のタイトル" } : override));
    const { notebooks: next, appliedCount } = applyPresetNotebookOverrides(notebooks, overrides, LATER, presetSeedTexts);
    expect(appliedCount).toBe(1);
    expect(next[0].title).toBe("自分用のタイトル");
  });

  it("手順の数を変えたら構造の編集として手順を作り直す", () => {
    const notebooks = seeded("ja");
    const target = notebooks.find((notebook) => notebook.steps.length >= 2)!;
    const overrides = exportAll(notebooks).map((override) => (override.presetId === target.id ? { ...override, steps: override.steps.slice(0, 1) } : override));
    const merged = applyPresetNotebookOverrides(notebooks, overrides, LATER, presetSeedTexts).notebooks.find((notebook) => notebook.id === target.id)!;
    expect(merged.steps).toHaveLength(1);
    expect(merged.steps[0].expression).toBe(target.steps[0].expression);
    expect(merged.steps[0].seededExpression).toBeUndefined();
  });

  it("ファイルから消した定数は消え、足した定数は新しいidで入る", () => {
    const notebooks = seeded("ja");
    const target = notebooks.find((notebook) => notebook.localConstants.length >= 2)!;
    const [first, ...rest] = target.localConstants;
    const overrides = exportAll(notebooks).map((override) => (override.presetId === target.id
      ? { ...override, localConstants: [...override.localConstants.slice(1), { symbol: "Zz", expression: "1" }] }
      : override));
    const merged = applyPresetNotebookOverrides(notebooks, overrides, LATER, presetSeedTexts).notebooks.find((notebook) => notebook.id === target.id)!;
    expect(merged.localConstants.some((constant) => constant.symbol === first.symbol)).toBe(false);
    rest.forEach((constant) => expect(merged.localConstants).toContain(constant));
    const added = merged.localConstants.find((constant) => constant.symbol === "Zz")!;
    expect(new Set(merged.localConstants.map((constant) => constant.id)).size).toBe(merged.localConstants.length);
    expect(added.id.startsWith(`${target.id}-override-constant-`)).toBe(true);
  });

  it("別の地域の端末で取り込んでも、ファイルで触っていない電圧・単価はその端末の地域のまま追従し続ける", () => {
    const japan = seeded("ja");
    const us = buildPresetNotebooksFromSeeds(CATEGORIES, "ja", resolvePresetRegionalDefaults("USD", "US", "en"), NOW);
    const { notebooks: next, appliedCount } = applyPresetNotebookOverrides(us, exportAll(japan), LATER, presetSeedTexts);
    expect(appliedCount).toBe(0);
    next.forEach((notebook, index) => expect(notebook).toBe(us[index]));
  });

  it("書き出した後にシードの修正が届いた端末へ古いファイルを戻しても、修正を巻き戻さない", () => {
    const notebooks = seeded("ja");
    const file = exportAll(notebooks);
    const target = notebooks.find((notebook) => notebook.localConstants.some((constant) => constant.seededExpression && !constant.regionalDefault))!;
    const symbol = target.localConstants.find((constant) => constant.seededExpression && !constant.regionalDefault)!.symbol;
    // シードの更新が届いた状態（保存値と投入時の値がそろって新しい値になる）。
    const updated = notebooks.map((notebook) => (notebook.id === target.id
      ? { ...notebook, localConstants: notebook.localConstants.map((constant) => (constant.symbol === symbol ? { ...constant, expression: "42", seededExpression: "42" } : constant)) }
      : notebook));
    const { notebooks: next, appliedCount } = applyPresetNotebookOverrides(updated, file, LATER, presetSeedTexts);
    expect(appliedCount).toBe(0);
    const merged = next.find((notebook) => notebook.id === target.id)!.localConstants.find((constant) => constant.symbol === symbol)!;
    expect(merged.expression).toBe("42");
  });

  it("手で編集したファイルに同じ記号が2つあっても id が重複しない", () => {
    const notebooks = seeded("ja");
    const target = notebooks.find((notebook) => notebook.localConstants.length > 0)!;
    const overrides = exportAll(notebooks).map((override) => (override.presetId === target.id
      ? { ...override, localConstants: [...override.localConstants, { symbol: override.localConstants[0].symbol, expression: "1" }] }
      : override));
    const merged = applyPresetNotebookOverrides(notebooks, overrides, LATER, presetSeedTexts).notebooks.find((notebook) => notebook.id === target.id)!;
    const ids = merged.localConstants.map((constant) => constant.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
