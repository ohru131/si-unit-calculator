import { type CalculationNotebook } from "@/lib/calculator-store";
import { type PresetNotebookCategory } from "@/lib/notebook-formulas";

/**
 * カテゴリカード1枚が表す範囲（＝そのカテゴリ自身＋配下の子カテゴリ）のIDをまとめて返す。
 * 「高校物理」のような親カテゴリのカードは、件数表示（count）が子カテゴリの合計になっている
 * （notebook-category-grid.tsxのchildIdsByParent/countFor参照）。エクスポートの対象範囲も
 * カード1枚が表す範囲と一致させないと「カードに出ている件数」と「書き出されたファイルの中身」が
 * 食い違ってしまうため、子を持たないカテゴリ（葉カテゴリ・ユーザー作成カテゴリ・未分類）は
 * 自分自身のIDだけ、子を持つ親カテゴリは自分自身＋子カテゴリ全部のIDを返す。
 */
export function collectExportCategoryIds(categoryId: string, categories: PresetNotebookCategory[]): string[] {
  const childIds = categories.filter((category) => category.parentId === categoryId).map((category) => category.id);
  return [categoryId, ...childIds];
}

/**
 * 指定したカテゴリID群に属する「ユーザー作成ノート」（!isPreset）の件数を数える。
 * プリセットのノート本体は再インストールで復元できてバックアップの必要が無いうえ、
 * 取り込み側（importNotebooks）が必ずisPreset:falseで作りプリセットと突き合わせないため
 * 書き出すとプリセットと重複してしまう。したがってエクスポートボタンの表示可否は
 * 「このカテゴリ範囲にユーザー作成ノートが1件以上あるか」で判定する。
 */
export function countUserNotebooksInCategories(categoryIds: string[], notebooks: Pick<CalculationNotebook, "categoryId" | "isPreset">[]): number {
  return notebooks.filter((notebook) => !notebook.isPreset && categoryIds.includes(notebook.categoryId)).length;
}
