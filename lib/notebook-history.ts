import type { CalculationNotebook } from "@/lib/calculator-store";

// CalculationNotebook型はランタイムの依存を持ち込みたくない（calculator-store.tsxは
// useGlobalSettings経由でexpo-localizationまで芋づる式にimportするため、この純関数モジュールが
// テストで単体ロードできなくなる）。型だけを使うので import type で読み込み、コンパイル時に消す。

/** 電卓画面の「ノート」履歴に積む1件。ノートを**実際に使った**ときに1件記録する
 * （開いて眺めただけのものは積まない。詳細は components/notebooks/notebook-detail.tsx の onUse）。 */
export type NotebookHistoryEntry = {
  id: string;
  notebookId: string;
  /** 使った時点のノート名のスナップショット。ノートが削除されても「何を使ったか」が残るようにする。
   * ただし現存するノートについては、表示側は resolveNotebookHistory が突き合わせた
   * notebook.title（＝現在のタイトル）を優先して使うこと（改名を追随させるため）。 */
  title: string;
  categoryId: string;
  openedAt: string;
};

/** 履歴エントリに、現存するノート本体を突き合わせた結果。ノートが削除されていれば notebook は undefined。 */
export type ResolvedNotebookHistoryEntry = NotebookHistoryEntry & { notebook?: CalculationNotebook };

// ノートは種類が有限（プリセット+ユーザー作成でせいぜい数百件程度）で、計算履歴(500件)ほど
// 大量に積み上がる性質のものではない。「最近使ったノート」を辿る用途では50件もあれば
// 十分に古いものまで遡れるので、500件は無意味に大きいと判断してこの値にした。
export const NOTEBOOK_HISTORY_LIMIT = 50;

/**
 * ノート使用履歴に新しいエントリを積み直す。addHistoryEntryがexpressionで重複除去しているのと
 * 同じ考え方で、こちらはnotebookIdで重複除去する（同じノートを何度使っても履歴上は1件にまとめ、
 * 最後に使った時刻の位置＝先頭へ積み直す）。上限を超えた古いエントリは末尾から落とす。
 *
 * 既に先頭にいるノートは積み直さず、履歴をそのまま返す。この関数は「値を編集した」「単位を
 * 切り替えた」といった操作のたびに呼ばれるので、ここで弾かないと1文字打つたびに
 * AsyncStorageへの書き込みが走る。既に先頭にいる以上、並び順も変わらない。
 */
export function pushNotebookHistoryEntry(history: NotebookHistoryEntry[], entry: NotebookHistoryEntry, limit: number = NOTEBOOK_HISTORY_LIMIT): NotebookHistoryEntry[] {
  if (history[0]?.notebookId === entry.notebookId) return history;
  return [entry, ...history.filter((item) => item.notebookId !== entry.notebookId)].slice(0, limit);
}

/**
 * 履歴エントリに現在のノートを突き合わせる。ノートが削除・改名されていても履歴が壊れないようにするため。
 *
 * 改名の扱い: 履歴のtitle（開いた時点のスナップショット）はそのまま残すが、現存するノートについては
 * 突き合わせた notebook.title が常に現在の（改名後の）タイトルになる。呼び出し側は表示時に
 * `entry.notebook?.title ?? entry.title` のように notebook 側を優先して使うことで、改名が
 * 履歴一覧にも追随する（削除済みでnotebookがundefinedのときだけスナップショットにフォールバックする）。
 */
export function resolveNotebookHistory(history: NotebookHistoryEntry[], notebooks: CalculationNotebook[]): ResolvedNotebookHistoryEntry[] {
  return history.map((entry) => ({ ...entry, notebook: notebooks.find((notebook) => notebook.id === entry.notebookId) }));
}

/** 履歴から1件だけ取り除く。「全消去」だけだと、消したいのは1件なのに他まで巻き添えになるため。 */
export function removeNotebookHistoryEntry(history: NotebookHistoryEntry[], id: string): NotebookHistoryEntry[] {
  return history.filter((entry) => entry.id !== id);
}

/** ノートタブに出すノートを決める。activeNotebookId が現存すればそれ、無ければ最近使ったもの、それも無ければピン留め、どれも無ければ null。 */
export function resolveActiveNotebook(
  activeNotebookId: string | null,
  history: NotebookHistoryEntry[],
  notebooks: CalculationNotebook[],
): CalculationNotebook | null {
  if (activeNotebookId !== null) {
    const active = notebooks.find((notebook) => notebook.id === activeNotebookId);
    if (active) return active;
  }

  // historyは新しい順（先頭が最新）に並んでいる前提（pushNotebookHistoryEntryの積み方）。
  // 削除済みノートを指すエントリが混ざっていてもスキップし、最初に現存するものを採用する。
  for (const entry of history) {
    const notebook = notebooks.find((item) => item.id === entry.notebookId);
    if (notebook) return notebook;
  }

  // 履歴が空（一度も使っていない）か全滅（全部削除済み）なら、ピン留めにフォールバックする。
  // 複数ピン留めがあるときの順序はnotebooksの並び順（upsertNotebook等でupdatedAt降順に
  // ソートされている）に従う。「どれが一番最近更新されたピン留めか」という基準は
  // 追加の判断基準を持ち込まずに済む自然な選び方なので、ここで独自の並び替えはしない。
  const pinned = notebooks.find((notebook) => notebook.pinned);
  return pinned ?? null;
}
