import { describe, expect, it } from "vitest";

import { APP_LANGUAGES } from "../lib/i18n";
import {
  NOTEBOOK_CATEGORY_RELEVANCE,
  SAMPLE_CATEGORY_RELEVANCE,
  SAMPLE_RELEVANCE,
  orderByRelevance,
  orderNotebookCategoriesForLanguage,
  orderSampleCategoriesForLanguage,
  orderSamplesForLanguage,
} from "../lib/locale-relevance";
import { PRESET_NOTEBOOK_CATEGORIES } from "../lib/notebook-formulas";
import { SAMPLE_CALCULATIONS, SAMPLE_CATEGORIES } from "../lib/sample-calculations";

describe("関連度順の並べ替え", () => {
  it("優先IDを列の順で先頭へ出し、載っていないものは元の順のまま後ろへ続ける", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    expect(orderByRelevance(items, (item) => item.id, ["c", "a"]).map((item) => item.id)).toEqual(["c", "a", "b", "d"]);
  });

  it("優先IDに存在しないIDが混ざっていても無視するだけで、件数は変わらない", () => {
    // 項目を消したときにこの表を直し忘れても壊れないことの担保。
    const items = [{ id: "a" }, { id: "b" }];
    expect(orderByRelevance(items, (item) => item.id, ["zzz", "b"]).map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("どの言語でもサンプル・カテゴリを1件も落とさず、重複もさせない", () => {
    for (const language of APP_LANGUAGES) {
      const categories = orderSampleCategoriesForLanguage(SAMPLE_CATEGORIES, language);
      expect(categories.map((category) => category.id).sort()).toEqual(SAMPLE_CATEGORIES.map((category) => category.id).sort());

      const samples = orderSamplesForLanguage(SAMPLE_CALCULATIONS, language);
      expect(samples.map((sample) => sample.id).sort()).toEqual(SAMPLE_CALCULATIONS.map((sample) => sample.id).sort());

      const notebookCategories = orderNotebookCategoriesForLanguage(PRESET_NOTEBOOK_CATEGORIES, language);
      expect(notebookCategories.map((category) => category.id).sort()).toEqual(PRESET_NOTEBOOK_CATEGORIES.map((category) => category.id).sort());
    }
  });

  it("優先IDの列に書かれたIDが実在する", () => {
    // 列に無いIDは黙って無視される（＝並びが変わらない）だけでエラーにならないので、
    // 綴り間違いはこのテストでしか気付けない。
    const sampleCategoryIds = new Set<string>(SAMPLE_CATEGORIES.map((category) => category.id));
    const sampleIds = new Set(SAMPLE_CALCULATIONS.map((sample) => sample.id));
    const notebookCategoryIds = new Set(PRESET_NOTEBOOK_CATEGORIES.map((category) => category.id));

    for (const language of APP_LANGUAGES) {
      for (const id of SAMPLE_CATEGORY_RELEVANCE[language]) expect(sampleCategoryIds.has(id), `${language}/${id}`).toBe(true);
      for (const id of SAMPLE_RELEVANCE[language]) expect(sampleIds.has(id), `${language}/${id}`).toBe(true);
      for (const id of NOTEBOOK_CATEGORY_RELEVANCE[language]) expect(notebookCategoryIds.has(id), `${language}/${id}`).toBe(true);
    }
  });

  it("優先IDの列にIDの重複がない", () => {
    for (const language of APP_LANGUAGES) {
      for (const [name, ids] of [["sampleCategory", SAMPLE_CATEGORY_RELEVANCE[language]], ["sample", SAMPLE_RELEVANCE[language]], ["notebookCategory", NOTEBOOK_CATEGORY_RELEVANCE[language]]] as const) {
        expect(new Set(ids).size, `${language}/${name}`).toBe(ids.length);
      }
    }
  });

  it("言語ごとのターゲット層が先頭に来る", () => {
    // docs/target-users-by-locale-2026-09.md 第1節の主ターゲットが、実際に一覧の先頭に出ることを固定する。
    // 独=Ausbildung Elektroniker と Klausur、仏=lycée の physique-chimie（化学＝実験レポート）、
    // 日=電験・電工。ここが崩れると「並べ替えている意味」が無くなる。
    expect(orderSampleCategoriesForLanguage(SAMPLE_CATEGORIES, "de")[0].id).toBe("exam");
    expect(orderSampleCategoriesForLanguage(SAMPLE_CATEGORIES, "de")[1].id).toBe("electric");
    expect(orderSampleCategoriesForLanguage(SAMPLE_CATEGORIES, "fr")[0].id).toBe("lab");
    expect(orderSampleCategoriesForLanguage(SAMPLE_CATEGORIES, "ja")[1].id).toBe("electric");

    const topLevel = PRESET_NOTEBOOK_CATEGORIES.filter((category) => !category.parentId);
    expect(orderNotebookCategoriesForLanguage(topLevel, "ja")[0].id).toBe("electricity-energy");
    expect(orderNotebookCategoriesForLanguage(topLevel, "de")[0].id).toBe("electricity-energy");
    expect(orderNotebookCategoriesForLanguage(topLevel, "es")[0].id).toBe("high-school-physics");
    expect(orderNotebookCategoriesForLanguage(topLevel, "pt-BR")[0].id).toBe("high-school-physics");
    expect(orderNotebookCategoriesForLanguage(topLevel, "en")[1].id).toBe("engineering-design");
  });

  it("最上位カテゴリを並べ替えても、親カテゴリだけが最上位に残る", () => {
    // 並べ替えはカードを出す階層の中だけで行うので、子カテゴリが最上位へ紛れ込まないこと。
    const topLevelIds = new Set(PRESET_NOTEBOOK_CATEGORIES.filter((category) => !category.parentId).map((category) => category.id));
    for (const language of APP_LANGUAGES) {
      const ordered = orderNotebookCategoriesForLanguage(PRESET_NOTEBOOK_CATEGORIES.filter((category) => !category.parentId), language);
      expect(ordered.every((category) => topLevelIds.has(category.id))).toBe(true);
      expect(ordered).toHaveLength(topLevelIds.size);
    }
  });
});
