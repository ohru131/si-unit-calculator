import { useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { UNCATEGORIZED_CATEGORY_ID, type NotebookCategory } from "@/lib/calculator-store";
import { localizedText, LANGUAGE_META, type AppLanguage } from "@/lib/i18n";
import { PRESET_NOTEBOOK_CATEGORIES } from "@/lib/notebook-formulas";
import type { ResolvedNotebookHistoryEntry } from "@/lib/notebook-history";

type Props = {
  visible: boolean;
  language: AppLanguage;
  entries: ResolvedNotebookHistoryEntry[];
  /** 現存するユーザー作成カテゴリ名の解決に使う。プリセットカテゴリはPRESET_NOTEBOOK_CATEGORIESから
   * 直接引けるが、ユーザー作成分はこのpropが無いと名前を出せない（storeを直接読まない設計のため）。 */
  notebookCategories: NotebookCategory[];
  onSelect: (notebookId: string) => void;
  onClear: () => void;
  onClose: () => void;
};

// キーの集合は英語が正。他言語でキーが欠けるとその言語ブロックで型エラーになり、翻訳漏れのチェックリストになる。
// notebooksButtonは呼び出し側（電卓画面）が新設する「ノート」ボタンのラベルとして使う想定
// （このコンポーネント自体はボタンを描画しない。画面への組み込みは別担当のため、ラベルの翻訳だけここに用意する）。
const EN_COPY = {
  notebooksButton: "Notebooks",
  title: "Recent notebooks",
  hint: "Notebooks you've opened recently. Tap one to reopen it.",
  clear: "Clear",
  close: "Close",
  empty: "No notebooks opened yet.",
  emptyHint: "Notebooks you open will show up here so you can find them again.",
  deleted: "Deleted",
  uncategorized: "Uncategorized",
};
const COPY: Record<AppLanguage, typeof EN_COPY> = {
  en: EN_COPY,
  ja: {
    notebooksButton: "ノート",
    title: "最近使ったノート",
    hint: "最近開いた計算ノートです。タップすると開き直せます。",
    clear: "消去",
    close: "閉じる",
    empty: "まだ開いたノートがありません。",
    emptyHint: "ノートを開くとここに表示され、後から辿れるようになります。",
    deleted: "削除済み",
    uncategorized: "未分類",
  },
  es: {
    notebooksButton: "Cuadernos",
    title: "Cuadernos recientes",
    hint: "Cuadernos que abriste recientemente. Toca uno para volver a abrirlo.",
    clear: "Borrar",
    close: "Cerrar",
    empty: "Aún no has abierto ningún cuaderno.",
    emptyHint: "Los cuadernos que abras aparecerán aquí para que puedas encontrarlos de nuevo.",
    deleted: "Eliminado",
    uncategorized: "Sin categoría",
  },
  "pt-BR": {
    notebooksButton: "Cadernos",
    title: "Cadernos recentes",
    hint: "Cadernos que você abriu recentemente. Toque em um para abri-lo novamente.",
    clear: "Limpar",
    close: "Fechar",
    empty: "Você ainda não abriu nenhum caderno.",
    emptyHint: "Os cadernos que você abrir aparecerão aqui para você encontrá-los de novo.",
    deleted: "Excluído",
    uncategorized: "Sem categoria",
  },
  de: {
    notebooksButton: "Rechenhefte",
    title: "Zuletzt verwendete Rechenhefte",
    hint: "Rechenhefte, die du zuletzt geöffnet hast. Tippe eines an, um es erneut zu öffnen.",
    clear: "Löschen",
    close: "Schließen",
    empty: "Du hast noch kein Rechenheft geöffnet.",
    emptyHint: "Geöffnete Rechenhefte erscheinen hier, damit du sie wiederfindest.",
    deleted: "Gelöscht",
    uncategorized: "Ohne Kategorie",
  },
  fr: {
    notebooksButton: "Carnets",
    title: "Carnets récents",
    hint: "Carnets que vous avez ouverts récemment. Appuyez sur l'un d'eux pour le rouvrir.",
    clear: "Effacer",
    close: "Fermer",
    empty: "Aucun carnet ouvert pour le moment.",
    emptyHint: "Les carnets que vous ouvrez apparaîtront ici pour que vous puissiez les retrouver.",
    deleted: "Supprimé",
    uncategorized: "Sans catégorie",
  },
};

/** 呼び出し側（電卓画面）が「ノート」ボタンのラベルなど、このシート以外の場所で使う文言。 */
export const NOTEBOOK_HISTORY_SHEET_COPY = COPY;

function categoryLabel(categoryId: string, notebookCategories: NotebookCategory[], language: AppLanguage, copy: typeof EN_COPY): string {
  if (categoryId === UNCATEGORIZED_CATEGORY_ID) return copy.uncategorized;
  const presetCategory = PRESET_NOTEBOOK_CATEGORIES.find((category) => category.id === categoryId);
  if (presetCategory) return localizedText(presetCategory.label, language);
  const userCategory = notebookCategories.find((category) => category.id === categoryId);
  return userCategory?.name ?? copy.uncategorized;
}

export function NotebookHistorySheet({ visible, language, entries, notebookCategories, onSelect, onClear, onClose }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = COPY[language];

  // 日時は端末ロケールではなく、アプリ内で選んだ言語のロケール（LANGUAGE_META）に揃える。
  // formatQuantityなどlib/units.ts側の既存コードもlocaleを個別に受け取る作りなのでそれに倣う。
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(LANGUAGE_META[language].locale, { dateStyle: "medium", timeStyle: "short" }), [language]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.compactSheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderMain}>
              <Text style={styles.sheetTitle}>{copy.title}</Text>
              <Text style={styles.sheetSubtitle}>{copy.hint}</Text>
            </View>
            <Pressable accessibilityLabel={copy.close} onPress={onClose} style={styles.closeHelp}>
              <IconSymbol name="xmark" size={20} color={colors.muted} />
            </Pressable>
          </View>

          {entries.length ? (
            <>
              <View style={styles.historyActions}>
                <Pressable onPress={onClear} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
                  <Text style={styles.clearButtonText}>{copy.clear}</Text>
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
                {entries.map((entry) => {
                  // 削除済みノートは開けないため、行自体は残しつつ(「何を開いたか」の記録として有用)、
                  // タップ不能な見た目にする。一覧から丸ごと消すと「なぜ件数が減ったか」が
                  // 分からなくなるため、あえて残す判断にした。
                  const isAvailable = Boolean(entry.notebook);
                  // 改名はnotebook側（現存ノート）の最新タイトルを優先し、削除済みならスナップショットにフォールバックする。
                  const title = entry.notebook?.title ?? entry.title;
                  const categoryId = entry.notebook?.categoryId ?? entry.categoryId;
                  const row = (
                    <View style={styles.historyRowInner}>
                      <View style={styles.historyRowMain}>
                        <IconSymbol name="book.fill" size={14} color={isAvailable ? colors.primary : colors.muted} />
                        <View style={styles.historyRowTexts}>
                          <Text numberOfLines={1} style={[styles.historyTitle, !isAvailable && styles.historyTitleDisabled]}>{title}</Text>
                          <Text numberOfLines={1} style={styles.historyCategory}>
                            {categoryLabel(categoryId, notebookCategories, language, copy)}
                            {isAvailable ? "" : ` · ${copy.deleted}`}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.historyDate}>{dateFormatter.format(new Date(entry.openedAt))}</Text>
                    </View>
                  );
                  return isAvailable ? (
                    <Pressable accessibilityLabel={title} key={entry.id} onPress={() => onSelect(entry.notebookId)} style={({ pressed }) => [styles.historyRow, pressed && styles.cardPressed]}>
                      {row}
                    </Pressable>
                  ) : (
                    <View key={entry.id} style={[styles.historyRow, styles.historyRowDisabled]}>
                      {row}
                    </View>
                  );
                })}
              </ScrollView>
            </>
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol name="clock.arrow.circlepath" size={22} color={colors.muted} />
              <Text style={styles.emptyStateTitle}>{copy.empty}</Text>
              <Text style={styles.emptyStateText}>{copy.emptyHint}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  modalBackdrop: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" },
  compactSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "86%", paddingBottom: 28, paddingHorizontal: 18, paddingTop: 12 },
  sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  sheetHeaderMain: { flex: 1, paddingRight: 10 },
  sheetTitle: { color: colors.foreground, fontSize: 20, fontWeight: "800" },
  sheetSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  closeHelp: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 16, height: 32, justifyContent: "center", width: 32 },
  historyActions: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 4 },
  clearButton: { padding: 4 },
  clearButtonText: { color: colors.error, fontSize: 11, fontWeight: "700" },
  modalList: { gap: 8, paddingBottom: 18, paddingTop: 10 },
  historyRow: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 11, borderWidth: 1, marginBottom: 6, paddingHorizontal: 12, paddingVertical: 10 },
  historyRowDisabled: { opacity: 0.55 },
  historyRowInner: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  historyRowMain: { alignItems: "center", flex: 1, flexDirection: "row", gap: 8, marginRight: 10 },
  historyRowTexts: { flex: 1 },
  historyTitle: { color: colors.foreground, fontSize: 13, fontWeight: "700" },
  historyTitleDisabled: { color: colors.muted },
  historyCategory: { color: colors.muted, fontSize: 11, marginTop: 2 },
  historyDate: { color: colors.muted, fontSize: 11 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  cardPressed: { opacity: 0.7 },
  emptyState: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 14, gap: 4, marginTop: 6, paddingHorizontal: 20, paddingVertical: 26 },
  emptyStateTitle: { color: colors.foreground, fontSize: 13, fontWeight: "800", marginTop: 6, textAlign: "center" },
  emptyStateText: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
});
