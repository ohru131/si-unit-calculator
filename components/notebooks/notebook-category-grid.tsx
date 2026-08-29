import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { UNCATEGORIZED_CATEGORY_ID, type CalculationNotebook, type NotebookCategory } from "@/lib/calculator-store";
import { PRESET_NOTEBOOK_CATEGORIES } from "@/lib/notebook-formulas";

type Props = {
  language: "en" | "ja";
  notebooks: CalculationNotebook[];
  notebookCategories: NotebookCategory[];
  onSelectCategory: (categoryId: string) => void;
  onCreateCategory: (name: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
};

export function NotebookCategoryGrid({ language, notebooks, notebookCategories, onSelectCategory, onCreateCategory, onRenameCategory, onDeleteCategory }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const copy = language === "en" ? {
    newCategory: "New category", categoryName: "Category name", save: "Save", cancel: "Cancel",
    uncategorized: "Uncategorized", preset: "Built-in", rename: "Rename", delete: "Delete",
    deleteConfirm: "Delete this category? Its notebooks move to Uncategorized.",
    notebookCount: (count: number) => `${count} notebook${count === 1 ? "" : "s"}`,
  } : {
    newCategory: "新しいカテゴリ", categoryName: "カテゴリ名", save: "保存", cancel: "キャンセル",
    uncategorized: "未分類", preset: "プリセット", rename: "改名", delete: "削除",
    deleteConfirm: "このカテゴリを削除しますか？中のノートは未分類へ移動します。",
    notebookCount: (count: number) => `${count}件のノート`,
  };

  const rows = useMemo(() => {
    const countFor = (categoryId: string) => notebooks.filter((item) => item.categoryId === categoryId).length;
    const presetRows = PRESET_NOTEBOOK_CATEGORIES.map((category) => ({ id: category.id, label: language === "en" ? category.labelEn : category.label, count: countFor(category.id), isPreset: true }));
    const userRows = notebookCategories.map((category) => ({ id: category.id, label: category.name, count: countFor(category.id), isPreset: false }));
    const uncategorizedCount = countFor(UNCATEGORIZED_CATEGORY_ID);
    const tail = uncategorizedCount > 0 || (!presetRows.length && !userRows.length) ? [{ id: UNCATEGORIZED_CATEGORY_ID, label: copy.uncategorized, count: uncategorizedCount, isPreset: true }] : [];
    return [...presetRows, ...userRows, ...tail];
  }, [copy.uncategorized, language, notebookCategories, notebooks]);

  const openCreate = () => { setEditingCategoryId(null); setPromptValue(""); setPromptVisible(true); };
  const openRename = (id: string, currentName: string) => { setEditingCategoryId(id); setPromptValue(currentName); setPromptVisible(true); };

  const submitPrompt = () => {
    const name = promptValue.trim();
    if (!name) return;
    if (editingCategoryId) onRenameCategory(editingCategoryId, name);
    else onCreateCategory(name);
    setPromptVisible(false);
  };

  const confirmDelete = (id: string) => {
    Alert.alert(copy.delete, copy.deleteConfirm, [
      { text: copy.cancel, style: "cancel" },
      { text: copy.delete, style: "destructive", onPress: () => onDeleteCategory(id) },
    ]);
  };

  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row.id} style={styles.card}>
          <Pressable onPress={() => onSelectCategory(row.id)} style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}>
            <IconSymbol name={row.isPreset ? "folder.fill" : "folder.fill"} size={22} color={colors.primary} />
            <Text numberOfLines={1} style={styles.cardLabel}>{row.label}</Text>
            <Text style={styles.cardCount}>{copy.notebookCount(row.count)}</Text>
          </Pressable>
          {!row.isPreset ? (
            <View style={styles.cardActions}>
              <Pressable accessibilityLabel={copy.rename} onPress={() => openRename(row.id, row.label)} style={({ pressed }) => [styles.cardActionButton, pressed && styles.pressed]}>
                <IconSymbol name="pencil" size={14} color={colors.muted} />
              </Pressable>
              <Pressable accessibilityLabel={copy.delete} onPress={() => confirmDelete(row.id)} style={({ pressed }) => [styles.cardActionButton, pressed && styles.pressed]}>
                <IconSymbol name="trash" size={14} color={colors.error} />
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
      <Pressable onPress={openCreate} style={({ pressed }) => [styles.card, styles.addCard, pressed && styles.pressed]}>
        <IconSymbol name="folder.badge.plus" size={22} color={colors.primary} />
        <Text style={styles.addCardLabel}>{copy.newCategory}</Text>
      </Pressable>

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
    </View>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
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
