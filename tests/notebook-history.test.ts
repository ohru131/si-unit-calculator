import { describe, expect, it } from "vitest";

import type { CalculationNotebook } from "../lib/calculator-store";
import { NOTEBOOK_HISTORY_LIMIT, NotebookHistoryEntry, pushNotebookHistoryEntry, removeNotebookHistoryEntry, resolveNotebookHistory } from "../lib/notebook-history";

// 型だけを使うので実際に calculator-store.tsx をロードしない（notebook-preset-localization.test.ts と
// 同じ理由: calculator-store.tsx は useGlobalSettings 経由で expo-localization まで芋づる式に
// importし、このvitest環境ではFlow構文の解釈に失敗して読み込み自体が落ちる）。

function makeEntry(overrides: Partial<NotebookHistoryEntry> = {}): NotebookHistoryEntry {
  return {
    id: overrides.id ?? `history-${Math.random()}`,
    notebookId: overrides.notebookId ?? "notebook-1",
    title: overrides.title ?? "ノートA",
    categoryId: overrides.categoryId ?? "uncategorized",
    openedAt: overrides.openedAt ?? "2026-01-01T00:00:00.000Z",
  };
}

function makeNotebook(overrides: Partial<CalculationNotebook> = {}): CalculationNotebook {
  return {
    id: overrides.id ?? "notebook-1",
    title: overrides.title ?? "ノートA",
    description: overrides.description ?? "",
    categoryId: overrides.categoryId ?? "uncategorized",
    formulas: overrides.formulas ?? [],
    localConstants: overrides.localConstants ?? [],
    steps: overrides.steps ?? [],
    pinned: overrides.pinned ?? false,
    isPreset: overrides.isPreset ?? false,
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-01-01T00:00:00.000Z",
  };
}

describe("pushNotebookHistoryEntry", () => {
  it("同じノートを2回開くとエントリが1つにまとまり、先頭に来る", () => {
    const first = makeEntry({ id: "h1", notebookId: "notebook-1", openedAt: "2026-01-01T00:00:00.000Z" });
    const other = makeEntry({ id: "h2", notebookId: "notebook-2", openedAt: "2026-01-02T00:00:00.000Z" });
    const reopened = makeEntry({ id: "h3", notebookId: "notebook-1", openedAt: "2026-01-03T00:00:00.000Z" });

    const afterFirst = pushNotebookHistoryEntry([], first);
    const afterOther = pushNotebookHistoryEntry(afterFirst, other);
    const afterReopen = pushNotebookHistoryEntry(afterOther, reopened);

    expect(afterReopen).toHaveLength(2);
    expect(afterReopen[0].id).toBe("h3");
    expect(afterReopen[0].notebookId).toBe("notebook-1");
    expect(afterReopen[1].id).toBe("h2");
  });

  it("上限を超えたら古いものから落ちる", () => {
    let history: NotebookHistoryEntry[] = [];
    // limit を小さくして境界を検証する。
    const limit = 3;
    for (let index = 0; index < 5; index += 1) {
      history = pushNotebookHistoryEntry(history, makeEntry({ id: `h${index}`, notebookId: `notebook-${index}` }), limit);
    }
    expect(history).toHaveLength(limit);
    // 直近に積んだ3件（h4, h3, h2）だけが残り、古いh0, h1は落ちている。
    expect(history.map((entry) => entry.id)).toEqual(["h4", "h3", "h2"]);
  });

  it("既定の上限はNOTEBOOK_HISTORY_LIMIT(50件)", () => {
    let history: NotebookHistoryEntry[] = [];
    for (let index = 0; index < NOTEBOOK_HISTORY_LIMIT + 10; index += 1) {
      history = pushNotebookHistoryEntry(history, makeEntry({ id: `h${index}`, notebookId: `notebook-${index}` }));
    }
    expect(history).toHaveLength(NOTEBOOK_HISTORY_LIMIT);
  });
});

describe("resolveNotebookHistory", () => {
  it("削除されたノートのエントリはnotebookがundefinedになる", () => {
    const history = [makeEntry({ id: "h1", notebookId: "notebook-deleted", title: "消えたノート" })];
    const resolved = resolveNotebookHistory(history, []);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].notebook).toBeUndefined();
    // スナップショットのtitleは消えずに残る。
    expect(resolved[0].title).toBe("消えたノート");
  });

  it("改名されたノートは、履歴のスナップショットではなく現在のタイトルで解決される", () => {
    const history = [makeEntry({ id: "h1", notebookId: "notebook-1", title: "旧タイトル" })];
    const notebooks = [makeNotebook({ id: "notebook-1", title: "新タイトル" })];
    const resolved = resolveNotebookHistory(history, notebooks);
    expect(resolved).toHaveLength(1);
    // 履歴のスナップショット自体は変更しない。
    expect(resolved[0].title).toBe("旧タイトル");
    // 突き合わせたnotebook側は現在のタイトルを持つ。表示側はこちらを優先する決まり。
    expect(resolved[0].notebook?.title).toBe("新タイトル");
  });

  it("現存する複数のエントリをそれぞれ正しいノートに突き合わせる", () => {
    const history = [
      makeEntry({ id: "h1", notebookId: "notebook-1", title: "A" }),
      makeEntry({ id: "h2", notebookId: "notebook-2", title: "B" }),
    ];
    const notebooks = [makeNotebook({ id: "notebook-1", title: "A" }), makeNotebook({ id: "notebook-2", title: "B" })];
    const resolved = resolveNotebookHistory(history, notebooks);
    expect(resolved[0].notebook?.id).toBe("notebook-1");
    expect(resolved[1].notebook?.id).toBe("notebook-2");
  });
});

describe("pushNotebookHistoryEntry（先頭の据え置き）", () => {
  // この関数は「値を編集した」「単位を切り替えた」といった操作のたびに呼ばれるので、
  // 既に先頭にいるノートを積み直すと1文字打つたびに保存が走ってしまう。
  it("既に先頭にいるノートは積み直さず、同じ配列をそのまま返す", () => {
    const first = makeEntry({ id: "h1", notebookId: "notebook-1", openedAt: "2026-01-01T00:00:00.000Z" });
    const history = pushNotebookHistoryEntry([], first);
    const again = pushNotebookHistoryEntry(history, makeEntry({ id: "h2", notebookId: "notebook-1", openedAt: "2026-01-05T00:00:00.000Z" }));
    expect(again).toBe(history);
    expect(again.map((entry) => entry.id)).toEqual(["h1"]);
  });

  // 別のノートを挟めば、戻ってきたときにきちんと先頭へ積み直される。
  it("別のノートを挟んだあとなら先頭へ積み直す", () => {
    let history = pushNotebookHistoryEntry([], makeEntry({ id: "h1", notebookId: "notebook-1" }));
    history = pushNotebookHistoryEntry(history, makeEntry({ id: "h2", notebookId: "notebook-2" }));
    history = pushNotebookHistoryEntry(history, makeEntry({ id: "h3", notebookId: "notebook-1" }));
    expect(history.map((entry) => entry.id)).toEqual(["h3", "h2"]);
  });
});

describe("removeNotebookHistoryEntry", () => {
  it("指定した1件だけを取り除く", () => {
    const history = [makeEntry({ id: "h1", notebookId: "notebook-1" }), makeEntry({ id: "h2", notebookId: "notebook-2" }), makeEntry({ id: "h3", notebookId: "notebook-3" })];
    expect(removeNotebookHistoryEntry(history, "h2").map((entry) => entry.id)).toEqual(["h1", "h3"]);
  });

  it("存在しないidなら何も変わらない", () => {
    const history = [makeEntry({ id: "h1", notebookId: "notebook-1" })];
    expect(removeNotebookHistoryEntry(history, "missing").map((entry) => entry.id)).toEqual(["h1"]);
  });
});
