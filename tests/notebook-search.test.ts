import { describe, expect, it } from "vitest";

import { localizedText } from "../lib/i18n";
import { PRESET_NOTEBOOK_CATEGORIES, PRESET_NOTEBOOK_SEEDS } from "../lib/notebook-formulas";
import { buildCategorySearchLabels, searchNotebooks, tokenizeNotebookQuery } from "../lib/notebook-search";

const item = (title: string, description = "", categoryLabel = "") => ({ title, description, categoryLabel });

describe("tokenizeNotebookQuery", () => {
  it("全角スペースでも区切る", () => {
    // 日本語入力では全角スペースが混ざるのが普通で、区切れないと1件も当たらなくなる。
    expect(tokenizeNotebookQuery("オーム　法則")).toEqual(["オーム", "法則"]);
    expect(tokenizeNotebookQuery("  ohm   law ")).toEqual(["ohm", "law"]);
  });

  it("空白だけの検索語はトークンが無い", () => {
    expect(tokenizeNotebookQuery("   ")).toEqual([]);
    expect(tokenizeNotebookQuery("")).toEqual([]);
  });
});

describe("searchNotebooks", () => {
  it("検索語が空なら空配列を返す", () => {
    expect(searchNotebooks([item("Ohm's law")], "")).toEqual([]);
    expect(searchNotebooks([item("Ohm's law")], "  ")).toEqual([]);
  });

  it("大文字小文字を区別しない", () => {
    expect(searchNotebooks([item("Ohm's law")], "OHM")).toHaveLength(1);
    expect(searchNotebooks([item("ohm's law")], "Ohm")).toHaveLength(1);
  });

  it("ダイアクリティカルマークの有無を吸収する（どちら向きでも）", () => {
    // 「énergie」を素の英字キーボードで「energie」と打っても当たること。逆に、
    // アクセント付きで打ったときに素の綴りのノートが当たること。
    expect(searchNotebooks([item("Énergie cinétique")], "energie")).toHaveLength(1);
    expect(searchNotebooks([item("Energie")], "énergie")).toHaveLength(1);
    expect(searchNotebooks([item("Wärmemenge")], "warme")).toHaveLength(1);
    expect(searchNotebooks([item("Presión hidrostática")], "presion")).toHaveLength(1);
    // ドイツ語のßはssへ潰す（ss と打っても当たる）。
    expect(searchNotebooks([item("Straße")], "strasse")).toHaveLength(1);
  });

  it("直径記号のØをoとして扱う", () => {
    // 「Ø60×5 鋼管」のようにノートのタイトル・説明文に直径記号が出る。fold()は先に
    // 小文字化するので、置き換え表に小文字のøが無いとASCIIの o60 で引けない。
    expect(searchNotebooks([item("Euler buckling & slenderness (Ø60×5 steel tube)")], "o60")).toHaveLength(1);
    expect(searchNotebooks([item("A Ø20 mm bar")], "o20")).toHaveLength(1);
    // 記号のまま打っても当たること（元の綴りで探す人もいる）。
    expect(searchNotebooks([item("A Ø20 mm bar")], "Ø20")).toHaveLength(1);
  });

  it("プリセットの実データで直径記号のノートが引ける", () => {
    // 指摘の元になった実データ（engineering-stress / engineering-power / materials）に
    // 対して、ASCIIだけで打った検索語が当たることを確かめる。
    const items = Object.values(PRESET_NOTEBOOK_SEEDS).flat().map((seed) => ({
      title: localizedText(seed.title, "en"),
      description: localizedText(seed.description, "en"),
      categoryLabel: "",
    }));
    expect(searchNotebooks(items, "o60").length).toBeGreaterThan(0);
    expect(searchNotebooks(items, "o20").length).toBeGreaterThan(0);
  });

  it("日本語は部分一致で当たる（分かち書きが無いため）", () => {
    expect(searchNotebooks([item("オームの法則")], "法則")).toHaveLength(1);
    expect(searchNotebooks([item("オームの法則")], "オーム")).toHaveLength(1);
  });

  it("空白区切りの語はすべて当たる必要がある（AND）", () => {
    const items = [item("Ohm's law", "resistance"), item("Ohm's law for magnets", "magnet")];
    expect(searchNotebooks(items, "ohm magnet").map((entry) => entry.title)).toEqual(["Ohm's law for magnets"]);
    // どちらにも無い語を足せば0件になる。
    expect(searchNotebooks(items, "ohm zzz")).toEqual([]);
  });

  it("説明文・カテゴリ名でも当たる", () => {
    const items = [item("Bending stress", "beam under load", "Beams & columns")];
    expect(searchNotebooks(items, "beam")).toHaveLength(1);
    expect(searchNotebooks(items, "columns")).toHaveLength(1);
  });

  it("タイトルの先頭一致 → タイトル → 説明文 → カテゴリ名 の順に強い", () => {
    const items = [
      item("Cost of a category", "", "Power"),
      item("Something else", "power consumption", ""),
      item("Motor power", "", ""),
      item("Power factor", "", ""),
    ];
    expect(searchNotebooks(items, "power").map((entry) => entry.title)).toEqual([
      "Power factor", "Motor power", "Something else", "Cost of a category",
    ]);
  });

  it("同じ強さのものは渡された順のまま返す（検索のたびに並びが変わらない）", () => {
    const items = [item("Power A"), item("Power B"), item("Power C")];
    expect(searchNotebooks(items, "power").map((entry) => entry.title)).toEqual(["Power A", "Power B", "Power C"]);
  });

  it("プリセット全件に対して、代表的な検索語が当たる", () => {
    // ノートを探せることがこの機能の目的なので、実データで確かめる。
    const categoryLabelById = new Map(PRESET_NOTEBOOK_CATEGORIES.map((category) => [category.id, localizedText(category.label, "ja")]));
    const items = Object.entries(PRESET_NOTEBOOK_SEEDS).flatMap(([categoryId, seeds]) => seeds.map((seed) => ({
      title: localizedText(seed.title, "ja"),
      description: localizedText(seed.description, "ja"),
      categoryLabel: categoryLabelById.get(categoryId) ?? "",
    })));
    expect(items.length).toBeGreaterThan(150);
    expect(searchNotebooks(items, "オーム").length).toBeGreaterThan(0);
    expect(searchNotebooks(items, "電気代").length).toBeGreaterThan(0);
    expect(searchNotebooks(items, "ブレーカー").length).toBeGreaterThan(0);
    // 1件も当たらない語では0件（何でも当ててしまう実装になっていないこと）。
    expect(searchNotebooks(items, "zzzzz")).toEqual([]);
  });
});

describe("buildCategorySearchLabels", () => {
  const categories = [
    { id: "science" },
    { id: "science-motion", parentId: "science" },
    { id: "cooking" },
  ];

  it("子カテゴリの検索用の名前に親カテゴリの名前を足す", () => {
    const labels = new Map([["science", "理科（小・中）"], ["science-motion", "速さ・運動"], ["cooking", "料理"]]);
    const result = buildCategorySearchLabels(labels, categories);
    expect(result.get("science-motion")).toBe("速さ・運動 / 理科（小・中）");
    // 親を持たないカテゴリはそのまま。
    expect(result.get("cooking")).toBe("料理");
  });

  it("大分類の名前でノートが引ける（葉の名前しか見ないと0件になる）", () => {
    // ノートは必ず葉カテゴリに属するので、ユーザーがカテゴリカードで覚えている
    // 「理科（小・中）」で検索しても当たらなくなる、という指摘への回帰テスト。
    const labels = new Map([["science", "理科（小・中）"], ["science-motion", "速さ・運動"]]);
    const searchLabels = buildCategorySearchLabels(labels, categories);
    const items = [item("速さの公式", "距離と時間から速さを求めます。", searchLabels.get("science-motion") ?? "")];
    expect(searchNotebooks(items, "理科")).toHaveLength(1);
    // 葉の名前でも当たり続けること。
    expect(searchNotebooks(items, "速さ")).toHaveLength(1);
  });

  it("つなぎ目をまたいだ偶然の一致を作らない", () => {
    const labels = new Map([["science", "理科"], ["science-motion", "運動"]]);
    const searchLabels = buildCategorySearchLabels(labels, categories);
    const items = [item("x", "", searchLabels.get("science-motion") ?? "")];
    expect(searchNotebooks(items, "運動")).toHaveLength(1);
    expect(searchNotebooks(items, "理科")).toHaveLength(1);
    expect(searchNotebooks(items, "動理")).toEqual([]);
  });

  it("プリセットの実データで、最上位カテゴリの名前から配下のノートが引ける", () => {
    const labelById = new Map(PRESET_NOTEBOOK_CATEGORIES.map((category) => [category.id, localizedText(category.label, "ja")]));
    const searchLabels = buildCategorySearchLabels(labelById, PRESET_NOTEBOOK_CATEGORIES);
    const items = Object.entries(PRESET_NOTEBOOK_SEEDS).flatMap(([categoryId, seeds]) => seeds.map((seed) => ({
      title: localizedText(seed.title, "ja"),
      description: localizedText(seed.description, "ja"),
      categoryLabel: searchLabels.get(categoryId) ?? "",
    })));
    // 「高校物理」「理科（小・中）」はどちらも親カテゴリで、ノートは配下のサブカテゴリにある。
    expect(searchNotebooks(items, "高校物理").length).toBeGreaterThan(0);
    expect(searchNotebooks(items, "理科").length).toBeGreaterThan(0);
  });
});
