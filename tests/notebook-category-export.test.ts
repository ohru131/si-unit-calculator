import { describe, expect, it } from "vitest";

import { collectExportCategoryIds, countUserNotebooksInCategories } from "../lib/notebook-category-export";
import { PRESET_NOTEBOOK_CATEGORIES } from "../lib/notebook-formulas";

describe("collectExportCategoryIds", () => {
  it("子カテゴリを持つ親カテゴリは、自分自身＋配下の子カテゴリのIDを全部返す", () => {
    const ids = collectExportCategoryIds("high-school-physics", PRESET_NOTEBOOK_CATEGORIES);
    expect(ids).toContain("high-school-physics");
    expect(ids).toEqual(
      expect.arrayContaining(["physics-mechanics", "physics-thermal", "physics-waves", "physics-electricity", "physics-atomic"]),
    );
    // 「高校物理」の子カテゴリ数（親自身の1件＋子5件）と一致することを機械的に確認する。
    const expectedChildCount = PRESET_NOTEBOOK_CATEGORIES.filter((category) => category.parentId === "high-school-physics").length;
    expect(ids.length).toBe(1 + expectedChildCount);
  });

  it("「理科（小・中）」も同様に、親＋全サブカテゴリのIDを返す", () => {
    const ids = collectExportCategoryIds("science", PRESET_NOTEBOOK_CATEGORIES);
    const expectedChildIds = PRESET_NOTEBOOK_CATEGORIES.filter((category) => category.parentId === "science").map((category) => category.id);
    expect(expectedChildIds.length).toBeGreaterThan(0);
    expectedChildIds.forEach((childId) => expect(ids).toContain(childId));
    expect(ids).toContain("science");
    expect(ids.length).toBe(1 + expectedChildIds.length);
  });

  it("子カテゴリを持たない葉カテゴリ（プリセット）は自分自身のIDだけを返す", () => {
    expect(collectExportCategoryIds("astronomy", PRESET_NOTEBOOK_CATEGORIES)).toEqual(["astronomy"]);
    expect(collectExportCategoryIds("physics-mechanics", PRESET_NOTEBOOK_CATEGORIES)).toEqual(["physics-mechanics"]);
  });

  it("ユーザー作成カテゴリ・未分類のIDを渡しても、PRESET_NOTEBOOK_CATEGORIESには存在しないので自分自身のIDだけを返す", () => {
    expect(collectExportCategoryIds("user-category-123", PRESET_NOTEBOOK_CATEGORIES)).toEqual(["user-category-123"]);
    expect(collectExportCategoryIds("uncategorized", PRESET_NOTEBOOK_CATEGORIES)).toEqual(["uncategorized"]);
  });
});

describe("countUserNotebooksInCategories", () => {
  const notebooks = [
    { categoryId: "physics-mechanics", isPreset: true },
    { categoryId: "physics-mechanics", isPreset: false },
    { categoryId: "physics-thermal", isPreset: false },
    { categoryId: "astronomy", isPreset: false },
  ];

  it("対象カテゴリ範囲に含まれるユーザー作成ノート（!isPreset）だけを数える", () => {
    expect(countUserNotebooksInCategories(["physics-mechanics", "physics-thermal"], notebooks)).toBe(2);
  });

  it("プリセットノートは対象範囲に入っていても数えない", () => {
    expect(countUserNotebooksInCategories(["astronomy"], [{ categoryId: "astronomy", isPreset: true }])).toBe(0);
  });

  it("対象範囲外のカテゴリは数えない", () => {
    expect(countUserNotebooksInCategories(["cooking"], notebooks)).toBe(0);
  });

  it("ユーザー作成ノートが1件も無ければ0を返す（エクスポートボタンを出さない判定に使う）", () => {
    expect(countUserNotebooksInCategories(["physics-mechanics"], [{ categoryId: "physics-mechanics", isPreset: true }])).toBe(0);
  });
});
