import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { UNCATEGORIZED_CATEGORY_ID, type CalculationNotebook, type NotebookCategory } from "@/lib/calculator-store";
import { localizedText, type AppLanguage } from "@/lib/i18n";
import { categoryExportHasContent, collectExportCategoryIds } from "@/lib/notebook-category-export";
import { PRESET_NOTEBOOK_CATEGORIES } from "@/lib/notebook-formulas";

type Props = {
  language: AppLanguage;
  notebooks: CalculationNotebook[];
  notebookCategories: NotebookCategory[];
  /** 表示中の親カテゴリID。未指定なら最上位（大分類）のグリッドを表示する。 */
  parentCategoryId?: string | null;
  onSelectCategory: (categoryId: string) => void;
  /** サブカテゴリを持つ大分類がタップされたときに呼ばれる。 */
  onSelectParentCategory: (categoryId: string) => void;
  onBack?: () => void;
  onCreateCategory: (name: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  /** カード単位でユーザー作成ノートを書き出す。親カテゴリのカードは配下の子カテゴリ分も含めたID配列を渡す。 */
  onExportCategory: (categoryIds: string[]) => void;
};

// notebookCountが関数値（複数形の出し分け）を持つため、値はstringに揃えられない。
// キーの集合と各値のシグネチャを揃えるためtypeof EN_COPYで言語ごとの形を要求する。
const EN_COPY = {
  newCategory: "New category", categoryName: "Category name", save: "Save", cancel: "Cancel",
  uncategorized: "Uncategorized", preset: "Built-in", rename: "Rename", delete: "Delete",
  deleteConfirm: "Delete this category? Its notebooks move to Uncategorized.",
  notebookCount: (count: number) => `${count} notebook${count === 1 ? "" : "s"}`,
  // 書き出す対象は「このカテゴリのユーザー作成ノート」だけ（プリセット本体は対象外）なので、
  // 既存の「エクスポート／書き出す」の訳語（app/(tabs)/constants.tsxのexportキー）に揃える。
  exportCategory: "Export",
};
const COPY: Record<AppLanguage, typeof EN_COPY> = {
  en: EN_COPY,
  ja: {
    newCategory: "新しいカテゴリ", categoryName: "カテゴリ名", save: "保存", cancel: "キャンセル",
    uncategorized: "未分類", preset: "プリセット", rename: "改名", delete: "削除",
    deleteConfirm: "このカテゴリを削除しますか？中のノートは未分類へ移動します。",
    notebookCount: (count: number) => `${count}件のノート`,
    exportCategory: "書き出す",
  },
  es: {
    newCategory: "Nueva categoría", categoryName: "Nombre de la categoría", save: "Guardar", cancel: "Cancelar",
    uncategorized: "Sin categoría", preset: "Integrado", rename: "Renombrar", delete: "Eliminar",
    deleteConfirm: "¿Eliminar esta categoría? Sus cuadernos pasarán a Sin categoría.",
    notebookCount: (count: number) => `${count} cuaderno${count === 1 ? "" : "s"}`,
    exportCategory: "Exportar",
  },
  "pt-BR": {
    newCategory: "Nova categoria", categoryName: "Nome da categoria", save: "Salvar", cancel: "Cancelar",
    uncategorized: "Sem categoria", preset: "Integrado", rename: "Renomear", delete: "Excluir",
    deleteConfirm: "Excluir esta categoria? Os cadernos dela vão para Sem categoria.",
    notebookCount: (count: number) => `${count} caderno${count === 1 ? "" : "s"}`,
    exportCategory: "Exportar",
  },
  de: {
    newCategory: "Neue Kategorie", categoryName: "Kategoriename", save: "Speichern", cancel: "Abbrechen",
    uncategorized: "Ohne Kategorie", preset: "Integriert", rename: "Umbenennen", delete: "Löschen",
    deleteConfirm: "Diese Kategorie löschen? Deine Rechenhefte werden zu Ohne Kategorie verschoben.",
    notebookCount: (count: number) => `${count} ${count === 1 ? "Rechenheft" : "Rechenhefte"}`,
    exportCategory: "Exportieren",
  },
  fr: {
    newCategory: "Nouvelle catégorie", categoryName: "Nom de la catégorie", save: "Enregistrer", cancel: "Annuler",
    uncategorized: "Sans catégorie", preset: "Intégré", rename: "Renommer", delete: "Supprimer",
    deleteConfirm: "Supprimer cette catégorie ? Ses carnets seront déplacés vers Sans catégorie.",
    notebookCount: (count: number) => `${count} carnet${count === 1 ? "" : "s"}`,
    exportCategory: "Exporter",
  },
};

export function NotebookCategoryGrid({ language, notebooks, notebookCategories, parentCategoryId, onSelectCategory, onSelectParentCategory, onBack, onCreateCategory, onRenameCategory, onDeleteCategory, onExportCategory }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const copy = COPY[language];

  const childIdsByParent = useMemo(() => {
    const map = new Map<string, string[]>();
    PRESET_NOTEBOOK_CATEGORIES.forEach((category) => {
      if (!category.parentId) return;
      map.set(category.parentId, [...(map.get(category.parentId) ?? []), category.id]);
    });
    return map;
  }, []);

  const parentCategory = parentCategoryId ? PRESET_NOTEBOOK_CATEGORIES.find((category) => category.id === parentCategoryId) : undefined;
  const parentLabel = parentCategory ? localizedText(parentCategory.label, language) : "";

  const rows = useMemo(() => {
    const countFor = (categoryId: string) => notebooks.filter((item) => item.categoryId === categoryId).length;
    // カード1枚が表す範囲（親カテゴリなら子カテゴリぶんも含む）でエクスポートの対象を決める。
    // カードの件数表示（count、上のcountFor）と対象範囲がずれると「カードに出ている件数」と
    // 「実際に書き出されるノートの数」が食い違ってしまうため、同じ考え方（親なら子を合算）で
    // 対象カテゴリIDの集合を組み立てる（collectExportCategoryIdsはPRESET_NOTEBOOK_CATEGORIESの
    // parentId関係だけを見るので、ユーザー作成カテゴリ・未分類のIDを渡しても安全に[自分自身]を返す）。
    const exportInfoFor = (categoryId: string) => {
      const categoryIds = collectExportCategoryIds(categoryId, PRESET_NOTEBOOK_CATEGORIES);
      return { categoryIds, canExport: categoryExportHasContent(categoryIds, notebooks) };
    };
    if (parentCategoryId) {
      const childIds = childIdsByParent.get(parentCategoryId) ?? [];
      return PRESET_NOTEBOOK_CATEGORIES.filter((category) => childIds.includes(category.id)).map((category) => ({
        id: category.id, label: localizedText(category.label, language), count: countFor(category.id), isPreset: true, hasChildren: false, ...exportInfoFor(category.id),
      }));
    }
    const presetRows = PRESET_NOTEBOOK_CATEGORIES.filter((category) => !category.parentId).map((category) => {
      const childIds = childIdsByParent.get(category.id) ?? [];
      const count = childIds.length ? childIds.reduce((sum, childId) => sum + countFor(childId), 0) : countFor(category.id);
      return { id: category.id, label: localizedText(category.label, language), count, isPreset: true, hasChildren: childIds.length > 0, ...exportInfoFor(category.id) };
    });
    const userRows = notebookCategories.map((category) => ({ id: category.id, label: category.name, count: countFor(category.id), isPreset: false, hasChildren: false, ...exportInfoFor(category.id) }));
    const uncategorizedCount = countFor(UNCATEGORIZED_CATEGORY_ID);
    const tail = uncategorizedCount > 0 || (!presetRows.length && !userRows.length) ? [{ id: UNCATEGORIZED_CATEGORY_ID, label: copy.uncategorized, count: uncategorizedCount, isPreset: true, hasChildren: false, ...exportInfoFor(UNCATEGORIZED_CATEGORY_ID) }] : [];
    return [...presetRows, ...userRows, ...tail];
  }, [childIdsByParent, copy.uncategorized, language, notebookCategories, notebooks, parentCategoryId]);

  const openCreate = () => { setEditingCategoryId(null); setPromptValue(""); setPromptVisible(true); };
  const openRename = (id: string, currentName: string) => { setEditingCategoryId(id); setPromptValue(currentName); setPromptVisible(true); };

  const submitPrompt = () => {
    const name = promptValue.trim();
    if (!name) return;
    if (editingCategoryId) onRenameCategory(editingCategoryId, name);
    else onCreateCategory(name);
    setPromptVisible(false);
  };

  return (
    <View style={styles.root}>
      {parentCategoryId ? (
        <Pressable onPress={onBack} style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
          <IconSymbol name="chevron.left" size={16} color={colors.primary} />
          <Text numberOfLines={1} style={styles.backLabel}>{parentLabel}</Text>
        </Pressable>
      ) : null}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {rows.map((row) => (
            <View key={row.id} style={styles.card}>
              <Pressable onPress={() => (row.hasChildren ? onSelectParentCategory(row.id) : onSelectCategory(row.id))} style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}>
                <IconSymbol name="folder.fill" size={22} color={colors.primary} />
                {/* カード幅を47%に固定しているので、長いカテゴリ名は省略ではなく折り返して見せる。 */}
                <Text numberOfLines={2} style={styles.cardLabel}>{row.label}</Text>
                <Text style={styles.cardCount}>{copy.notebookCount(row.count)}</Text>
              </Pressable>
              {/* リネーム・削除はユーザー作成カテゴリだけ（プリセット・未分類は改名／削除できないため）。
                  エクスポートはプリセットカテゴリ・未分類のカードにも、その範囲にユーザー作成ノートが
                  1件以上あるか、プリセットへの編集（override）が1件以上あれば出す（プリセットの
                  葉カテゴリや未分類にもユーザーがノートを置けるし、プリセットの値だけを書き換えて
                  ノートを作らないユーザーもいるため）。
                  どちらか一方だけのときも見た目を揃えるため、同じcardActionsの行にまとめる。 */}
              {!row.isPreset || row.canExport ? (
                <View style={styles.cardActions}>
                  {!row.isPreset ? (
                    <>
                      <Pressable accessibilityLabel={copy.rename} onPress={() => openRename(row.id, row.label)} style={({ pressed }) => [styles.cardActionButton, pressed && styles.pressed]}>
                        <IconSymbol name="pencil" size={14} color={colors.muted} />
                      </Pressable>
                      <Pressable accessibilityLabel={copy.delete} onPress={() => setPendingDeleteId(row.id)} style={({ pressed }) => [styles.cardActionButton, pressed && styles.pressed]}>
                        <IconSymbol name="trash" size={14} color={colors.error} />
                      </Pressable>
                    </>
                  ) : null}
                  {row.canExport ? (
                    <Pressable accessibilityLabel={copy.exportCategory} onPress={() => onExportCategory(row.categoryIds)} style={({ pressed }) => [styles.cardActionButton, pressed && styles.pressed]}>
                      <IconSymbol name="square.and.arrow.up" size={14} color={colors.muted} />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))}
          {!parentCategoryId ? (
            <Pressable onPress={openCreate} style={({ pressed }) => [styles.card, styles.addCard, pressed && styles.pressed]}>
              <IconSymbol name="folder.badge.plus" size={22} color={colors.primary} />
              <Text style={styles.addCardLabel}>{copy.newCategory}</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={promptVisible} transparent animationType="fade" onRequestClose={() => setPromptVisible(false)}>
        <View style={styles.promptBackdrop}>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>{editingCategoryId ? copy.rename : copy.newCategory}</Text>
            <TextInput autoFocus value={promptValue} onChangeText={setPromptValue} placeholder={copy.categoryName} placeholderTextColor={colors.placeholder} style={styles.promptInput} onSubmitEditing={submitPrompt} returnKeyType="done" />
            <View style={styles.promptActions}>
              <Pressable onPress={() => setPromptVisible(false)} style={({ pressed }) => [styles.promptCancel, pressed && styles.pressed]}>
                <Text style={styles.promptCancelText}>{copy.cancel}</Text>
              </Pressable>
              <Pressable onPress={submitPrompt} style={({ pressed }) => [styles.promptSave, pressed && styles.pressed]}>
                <Text style={styles.promptSaveText}>{copy.save}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={Boolean(pendingDeleteId)}
        title={copy.delete}
        message={copy.deleteConfirm}
        cancelLabel={copy.cancel}
        confirmLabel={copy.delete}
        destructive
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) onDeleteCategory(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  root: { flex: 1 },
  backRow: { alignItems: "center", flexDirection: "row", gap: 4, paddingBottom: 12 },
  backLabel: { color: colors.primary, flexShrink: 1, fontSize: 14, fontWeight: "800" },
  scrollContent: { paddingBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  // minWidth だけだとカードが中身の幅まで伸びるので、ラベルが長いカテゴリ（「Mechanical &
  // structural design」など）が1枚で1行を占め、その行の右半分が空いてしまう。
  // 幅を47%に固定して、長いラベルは幅を広げるかわりに折り返させる。
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexBasis: "47%", maxWidth: "47%", overflow: "hidden" },
  cardMain: { gap: 6, padding: 14 },
  cardLabel: { color: colors.foreground, fontSize: 14, fontWeight: "800" },
  cardCount: { color: colors.muted, fontSize: 12 },
  cardActions: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row" },
  cardActionButton: { alignItems: "center", flex: 1, height: 34, justifyContent: "center" },
  addCard: { alignItems: "center", borderStyle: "dashed", gap: 6, justifyContent: "center", padding: 14 },
  addCardLabel: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.7 },
  promptBackdrop: { alignItems: "center", backgroundColor: colors.overlay, flex: 1, justifyContent: "center", padding: 24 },
  promptCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, width: "100%" },
  promptTitle: { color: colors.foreground, fontSize: 16, fontWeight: "800", marginBottom: 12 },
  promptInput: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 11, borderWidth: 1, color: colors.foreground, fontSize: 15, minHeight: 46, paddingHorizontal: 12 },
  promptActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 14 },
  promptCancel: { paddingHorizontal: 12, paddingVertical: 10 },
  promptCancelText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  promptSave: { backgroundColor: colors.primaryFill, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  promptSaveText: { color: colors.onPrimary, fontSize: 13, fontWeight: "800" },
});
