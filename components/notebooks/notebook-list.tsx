import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type CalculationNotebook } from "@/lib/calculator-store";
import { type AppLanguage } from "@/lib/i18n";
import { evaluateNotebookSteps, resolveNotebookLocalConstants } from "@/lib/notebook-engine";
import { formatQuantity, type SavedConstant } from "@/lib/units";

type Props = {
  language: AppLanguage;
  locale?: string;
  categoryLabel: string;
  notebooks: CalculationNotebook[];
  globalConstants: SavedConstant[];
  onBack: () => void;
  onOpen: (notebookId: string) => void;
  onDelete: (notebookId: string) => void;
  onTogglePinned: (notebookId: string) => void;
};

// stepsが関数値（複数形の出し分け）を持つため、値はstringに揃えられない。
// キーの集合と各値のシグネチャを揃えるためtypeof EN_COPYで言語ごとの形を要求する。
const EN_COPY = {
  empty: "No notebooks in this category yet", emptyHint: "Tap the + button to add one.",
  steps: (count: number) => `${count} step${count === 1 ? "" : "s"}`,
  delete: "Delete", deleteConfirm: "Delete this notebook? This cannot be undone.", cancel: "Cancel",
  pin: "Pin to calculator", unpin: "Unpin from calculator", builtIn: "Built-in",
};
const COPY: Record<AppLanguage, typeof EN_COPY> = {
  en: EN_COPY,
  ja: {
    empty: "このカテゴリにはまだノートがありません", emptyHint: "右上の＋ボタンから追加できます。",
    steps: (count: number) => `${count}件の手順`,
    delete: "削除", deleteConfirm: "このノートを削除しますか？元に戻せません。", cancel: "キャンセル",
    pin: "電卓画面にピン留め", unpin: "ピン留めを解除", builtIn: "プリセット",
  },
  es: {
    empty: "Todavía no hay cuadernos en esta categoría", emptyHint: "Toca el botón + para añadir uno.",
    steps: (count: number) => `${count} paso${count === 1 ? "" : "s"}`,
    delete: "Eliminar", deleteConfirm: "¿Eliminar este cuaderno? Esta acción no se puede deshacer.", cancel: "Cancelar",
    pin: "Fijar en la calculadora", unpin: "Quitar de fijados", builtIn: "Integrado",
  },
  "pt-BR": {
    empty: "Ainda não há cadernos nesta categoria", emptyHint: "Toque no botão + para adicionar um.",
    steps: (count: number) => `${count} etapa${count === 1 ? "" : "s"}`,
    delete: "Excluir", deleteConfirm: "Excluir este caderno? Isso não pode ser desfeito.", cancel: "Cancelar",
    pin: "Fixar na calculadora", unpin: "Desafixar", builtIn: "Integrado",
  },
  de: {
    empty: "Noch keine Rechenhefte in dieser Kategorie", emptyHint: "Tippe auf das +, um eines hinzuzufügen.",
    steps: (count: number) => (count === 1 ? "1 Schritt" : `${count} Schritte`),
    delete: "Löschen", deleteConfirm: "Dieses Rechenheft löschen? Das kann nicht rückgängig gemacht werden.", cancel: "Abbrechen",
    pin: "Im Rechner anheften", unpin: "Anheften lösen", builtIn: "Integriert",
  },
  fr: {
    empty: "Pas encore de carnet dans cette catégorie", emptyHint: "Touchez le bouton + pour en ajouter un.",
    steps: (count: number) => `${count} étape${count === 1 ? "" : "s"}`,
    delete: "Supprimer", deleteConfirm: "Supprimer ce carnet ? Cette action est irréversible.", cancel: "Annuler",
    pin: "Épingler à la calculatrice", unpin: "Désépingler", builtIn: "Intégré",
  },
};

export function NotebookList({ language, locale, categoryLabel, notebooks, globalConstants, onBack, onOpen, onDelete, onTogglePinned }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const copy = COPY[language];

  // ノートごとの最終結果プレビューは再計算のコストがあるため、notebooksや
  // globalConstantsが変わらない限り（無関係な再描画のたびには）作り直さない。
  const previews = useMemo(() => {
    const map = new Map<string, string>();
    notebooks.forEach((notebook) => {
      const { resolved } = resolveNotebookLocalConstants(notebook.localConstants, globalConstants, language);
      const pool = [...globalConstants, ...resolved];
      const results = evaluateNotebookSteps(notebook.steps, pool, language, [], locale);
      const finalResult = [...results].reverse().find((result) => result.quantity);
      map.set(notebook.id, finalResult?.quantity ? (finalResult.formatted ?? formatQuantity(finalResult.quantity, undefined, locale)) : "");
    });
    return map;
  }, [globalConstants, language, locale, notebooks]);

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
        <IconSymbol name="chevron.left" size={16} color={colors.primary} />
        <Text numberOfLines={1} style={styles.backLabel}>{categoryLabel}</Text>
      </Pressable>
      <FlatList
        style={styles.list}
        data={notebooks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={notebooks.length ? styles.listContent : styles.emptyList}
        ListEmptyComponent={<View style={styles.emptyCard}><IconSymbol name="book.fill" size={28} color={colors.primary} /><Text style={styles.emptyTitle}>{copy.empty}</Text><Text style={styles.emptyText}>{copy.emptyHint}</Text></View>}
        renderItem={({ item }) => {
          const preview = previews.get(item.id) ?? "";
          return (
            <View style={styles.card}>
              <Pressable onPress={() => onOpen(item.id)} style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}>
                <View style={styles.cardTitleRow}>
                  <Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text>
                  {item.isPreset ? <View style={styles.builtInBadge}><Text style={styles.builtInBadgeText}>{copy.builtIn}</Text></View> : null}
                </View>
                {item.description ? <Text numberOfLines={1} style={styles.cardDescription}>{item.description}</Text> : null}
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMeta}>{copy.steps(item.steps.length)}</Text>
                  {preview ? <Text numberOfLines={1} style={styles.cardPreview}>→ {preview}</Text> : null}
                </View>
              </Pressable>
              <Pressable accessibilityLabel={item.pinned ? copy.unpin : copy.pin} onPress={() => onTogglePinned(item.id)} style={({ pressed }) => [styles.actionButton, pressed && styles.iconPressed]}>
                <IconSymbol name="pin.fill" size={18} color={item.pinned ? colors.primary : colors.muted} />
              </Pressable>
              {!item.isPreset ? (
                <Pressable accessibilityLabel={copy.delete} onPress={() => setPendingDeleteId(item.id)} style={({ pressed }) => [styles.actionButton, pressed && styles.iconPressed]}>
                  <IconSymbol name="trash" size={19} color={colors.error} />
                </Pressable>
              ) : null}
            </View>
          );
        }}
      />
      <ConfirmDialog
        visible={Boolean(pendingDeleteId)}
        title={copy.delete}
        message={copy.deleteConfirm}
        cancelLabel={copy.cancel}
        confirmLabel={copy.delete}
        destructive
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) onDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  container: { flex: 1 },
  backRow: { alignItems: "center", flexDirection: "row", gap: 4, paddingBottom: 12 },
  backLabel: { color: colors.primary, flexShrink: 1, fontSize: 14, fontWeight: "800" },
  list: { flex: 1 },
  listContent: { gap: 10, paddingBottom: 30 },
  emptyList: { flexGrow: 1, justifyContent: "center", paddingBottom: 60 },
  emptyCard: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, paddingHorizontal: 28, paddingVertical: 30 },
  emptyTitle: { color: colors.foreground, fontSize: 16, fontWeight: "700", marginTop: 10 },
  emptyText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: "center" },
  card: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", minHeight: 76, paddingHorizontal: 13, paddingVertical: 12 },
  cardMain: { flex: 1, gap: 3 },
  cardTitleRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  cardTitle: { color: colors.foreground, flexShrink: 1, fontSize: 15, fontWeight: "800" },
  builtInBadge: { backgroundColor: colors.surfaceSecondary, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  builtInBadgeText: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.3, textTransform: "uppercase" },
  cardDescription: { color: colors.muted, fontSize: 12 },
  cardMetaRow: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 2 },
  cardMeta: { color: colors.placeholder, fontSize: 11 },
  cardPreview: { color: colors.primary, flexShrink: 1, fontSize: 11, fontWeight: "700" },
  actionButton: { alignItems: "center", height: 38, justifyContent: "center", width: 34 },
  pressed: { opacity: 0.72 },
  iconPressed: { opacity: 0.55 },
});
