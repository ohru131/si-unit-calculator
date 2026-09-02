import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { UNCATEGORIZED_CATEGORY_ID, type CalculationNotebook, type NotebookCategory } from "@/lib/calculator-store";
import { localizedText, type AppLanguage } from "@/lib/i18n";
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
};

// notebookCountが関数値（複数形の出し分け）を持つため、値はstringに揃えられない。
// キーの集合と各値のシグネチャを揃えるためtypeof EN_COPYで言語ごとの形を要求する。
const EN_COPY = {
  newCategory: "New category", categoryName: "Category name", save: "Save", cancel: "Cancel",
  uncategorized: "Uncategorized", preset: "Built-in", rename: "Rename", delete: "Delete",
  deleteConfirm: "Delete this category? Its notebooks move to Uncategorized.",
  notebookCount: (count: number) => `${count} notebook${count === 1 ? "" : "s"}`,
};
const COPY: Record<AppLanguage, typeof EN_COPY> = {
  en: EN_COPY,
  ja: {
    newCategory: "新しいカテゴリ", categoryName: "カテゴリ名", save: "保存", cancel: "キャンセル",
    uncategorized: "未分類", preset: "プリセット", rename: "改名", delete: "削除",
    deleteConfirm: "このカテゴリを削除しますか？中のノートは未分類へ移動します。",
    notebookCount: (count: number) => `${count}件のノート`,
  },
  es: {
    newCategory: "Nueva categoría", categoryName: "Nombre de la categoría", save: "Guardar", cancel: "Cancelar",
    uncategorized: "Sin categoría", preset: "Integrado", rename: "Renombrar", delete: "Eliminar",
    deleteConfirm: "¿Eliminar esta categoría? Sus cuadernos pasarán a Sin categoría.",
    notebookCount: (count: number) => `${count} cuaderno${count === 1 ? "" : "s"}`,
  },
  "pt-BR": {
    newCategory: "Nova categoria", categoryName: "Nome da categoria", save: "Salvar", cancel: "Cancelar",
    uncategorized: "Sem categoria", preset: "Integrado", rename: "Renomear", delete: "Excluir",
    deleteConfirm: "Excluir esta categoria? Os cadernos dela vão para Sem categoria.",
    notebookCount: (count: number) => `${count} caderno${count === 1 ? "" : "s"}`,
  },
  de: {
    newCategory: "Neue Kategorie", categoryName: "Kategoriename", save: "Speichern", cancel: "Abbrechen",
    uncategorized: "Ohne Kategorie", preset: "Integriert", rename: "Umbenennen", delete: "Löschen",
    deleteConfirm: "Diese Kategorie löschen? Deine Rechenhefte werden zu Ohne Kategorie verschoben.",
    notebookCount: (count: number) => `${count} ${count === 1 ? "Rechenheft" : "Rechenhefte"}`,
  },
  fr: {
    newCategory: "Nouvelle catégorie", categoryName: "Nom de la catégorie", save: "Enregistrer", cancel: "Annuler",
    uncategorized: "Sans catégorie", preset: "Intégré", rename: "Renommer", delete: "Supprimer",
    deleteConfirm: "Supprimer cette catégorie ? Ses carnets seront déplacés vers Sans catégorie.",
    notebookCount: (count: number) => `${count} carnet${count === 1 ? "" : "s"}`,
  },
};

export function NotebookCategoryGrid({ language, notebooks, notebookCategories, parentCategoryId, onSelectCategory, onSelectParentCategory, onBack, onCreateCategory, onRenameCategory, onDeleteCategory }: Props) {
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
    if (parentCategoryId) {
      const childIds = childIdsByParent.get(parentCategoryId) ?? [];
      return PRESET_NOTEBOOK_CATEGORIES.filter((category) => childIds.includes(category.id)).map((category) => ({
        id: category.id, label: localizedText(category.label, language), count: countFor(category.id), isPreset: true, hasChildren: false,
      }));
    }
    const presetRows = PRESET_NOTEBOOK_CATEGORIES.filter((category) => !category.parentId).map((category) => {
      const childIds = childIdsByParent.get(category.id) ?? [];
      const count = childIds.length ? childIds.reduce((sum, childId) => sum + countFor(childId), 0) : countFor(category.id);
      return { id: category.id, label: localizedText(category.label, language), count, isPreset: true, hasChildren: childIds.length > 0 };
    });
    const userRows = notebookCategories.map((category) => ({ id: category.id, label: category.name, count: countFor(category.id), isPreset: false, hasChildren: false }));
    const uncategorizedCount = countFor(UNCATEGORIZED_CATEGORY_ID);
    const tail = uncategorizedCount > 0 || (!presetRows.length && !userRows.length) ? [{ id: UNCATEGORIZED_CATEGORY_ID, label: copy.uncategorized, count: uncategorizedCount, isPreset: true, hasChildren: false }] : [];
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
                <Text numberOfLines={1} style={styles.cardLabel}>{row.label}</Text>
                <Text style={styles.cardCount}>{copy.notebookCount(row.count)}</Text>
              </Pressable>
              {!row.isPreset ? (
                <View style={styles.cardActions}>
                  <Pressable accessibilityLabel={copy.rename} onPress={() => openRename(row.id, row.label)} style={({ pressed }) => [styles.cardActionButton, pressed && styles.pressed]}>
                    <IconSymbol name="pencil" size={14} color={colors.muted} />
                  </Pressable>
                  <Pressable accessibilityLabel={copy.delete} onPress={() => setPendingDeleteId(row.id)} style={({ pressed }) => [styles.cardActionButton, pressed && styles.pressed]}>
                    <IconSymbol name="trash" size={14} color={colors.error} />
                  </Pressable>
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
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, minWidth: "47%", overflow: "hidden" },
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
