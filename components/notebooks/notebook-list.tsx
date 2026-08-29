import { useMemo } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type CalculationNotebook } from "@/lib/calculator-store";

type Props = {
  language: "en" | "ja";
  categoryLabel: string;
  notebooks: CalculationNotebook[];
  onBack: () => void;
  onOpen: (notebookId: string) => void;
  onDelete: (notebookId: string) => void;
};

export function NotebookList({ language, categoryLabel, notebooks, onBack, onOpen, onDelete }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const copy = language === "en" ? {
    empty: "No notebooks in this category yet", emptyHint: "Tap the + button to add one.",
    steps: (count: number) => `${count} step${count === 1 ? "" : "s"}`,
    delete: "Delete", deleteConfirm: "Delete this notebook?", cancel: "Cancel",
  } : {
    empty: "このカテゴリにはまだノートがありません", emptyHint: "右上の＋ボタンから追加できます。",
    steps: (count: number) => `${count}件の手順`,
    delete: "削除", deleteConfirm: "このノートを削除しますか？", cancel: "キャンセル",
  };

  const confirmDelete = (id: string) => {
    Alert.alert(copy.delete, copy.deleteConfirm, [
      { text: copy.cancel, style: "cancel" },
      { text: copy.delete, style: "destructive", onPress: () => onDelete(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
        <IconSymbol name="chevron.left" size={16} color={colors.primary} />
        <Text numberOfLines={1} style={styles.backLabel}>{categoryLabel}</Text>
      </Pressable>
      <FlatList
        data={notebooks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={notebooks.length ? styles.list : styles.emptyList}
        ListEmptyComponent={<View style={styles.emptyCard}><IconSymbol name="book.fill" size={28} color={colors.primary} /><Text style={styles.emptyTitle}>{copy.empty}</Text><Text style={styles.emptyText}>{copy.emptyHint}</Text></View>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable onPress={() => onOpen(item.id)} style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.description ? <Text numberOfLines={1} style={styles.cardDescription}>{item.description}</Text> : null}
              <Text style={styles.cardMeta}>{copy.steps(item.steps.length)}</Text>
            </Pressable>
            <Pressable accessibilityLabel={copy.delete} onPress={() => confirmDelete(item.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.iconPressed]}>
              <IconSymbol name="trash" size={19} color={colors.error} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  container: { flex: 1 },
  backRow: { alignItems: "center", flexDirection: "row", gap: 4, paddingBottom: 12 },
  backLabel: { color: colors.primary, flexShrink: 1, fontSize: 14, fontWeight: "800" },
  list: { gap: 10, paddingBottom: 30 },
  emptyList: { flexGrow: 1, justifyContent: "center", paddingBottom: 60 },
  emptyCard: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, paddingHorizontal: 28, paddingVertical: 30 },
  emptyTitle: { color: colors.foreground, fontSize: 16, fontWeight: "700", marginTop: 10 },
  emptyText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: "center" },
  card: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", minHeight: 76, paddingHorizontal: 13, paddingVertical: 12 },
  cardMain: { flex: 1, gap: 3 },
  cardTitle: { color: colors.foreground, fontSize: 15, fontWeight: "800" },
  cardDescription: { color: colors.muted, fontSize: 12 },
  cardMeta: { color: colors.placeholder, fontSize: 11, marginTop: 2 },
  deleteButton: { alignItems: "center", height: 38, justifyContent: "center", width: 38 },
  pressed: { opacity: 0.72 },
  iconPressed: { opacity: 0.55 },
});
