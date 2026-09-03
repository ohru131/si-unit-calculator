import { useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { UNCATEGORIZED_CATEGORY_ID, type CalculationNotebook, type NotebookCategory } from "@/lib/calculator-store";
import { localizedText, LANGUAGE_META, type AppLanguage } from "@/lib/i18n";
import { PRESET_NOTEBOOK_CATEGORIES } from "@/lib/notebook-formulas";
import type { ResolvedNotebookHistoryEntry } from "@/lib/notebook-history";

type Props = {
  visible: boolean;
  language: AppLanguage;
  entries: ResolvedNotebookHistoryEntry[];
  /** ピン留めされたノート一覧。最近使ったノートと並べて、ノートタブのノート切替シートに出す。 */
  pinnedNotebooks: CalculationNotebook[];
  /** 現存するユーザー作成カテゴリ名の解決に使う。プリセットカテゴリはPRESET_NOTEBOOK_CATEGORIESから
   * 直接引けるが、ユーザー作成分はこのpropが無いと名前を出せない（storeを直接読まない設計のため）。 */
  notebookCategories: NotebookCategory[];
  onSelect: (notebookId: string) => void;
  /** 1件だけ履歴から消す。全消去だと消したい1件のために他まで巻き添えになるため別に用意する。 */
  onRemove: (entryId: string) => void;
  onClear: () => void;
  onClose: () => void;
};

// キーの集合は英語が正。他言語でキーが欠けるとその言語ブロックで型エラーになり、翻訳漏れのチェックリストになる。
const EN_COPY = {
  title: "Notebooks",
  hint: "Your pinned notebooks and recently used ones. Tap one to open it.",
  pinnedSectionTitle: "Pinned",
  recentSectionTitle: "Recently used",
  clear: "Clear",
  close: "Close",
  empty: "No notebooks used yet.",
  emptyHint: "A notebook shows up here once you change a value, switch a unit, or copy a result in it.",
  remove: "Remove from history",
  deleted: "Deleted",
  uncategorized: "Uncategorized",
};
const COPY: Record<AppLanguage, typeof EN_COPY> = {
  en: EN_COPY,
  ja: {
    title: "ノート",
    hint: "ピン留めしたノートと、最近使ったノートです。タップすると開けます。",
    pinnedSectionTitle: "ピン留め",
    recentSectionTitle: "最近使ったノート",
    clear: "消去",
    close: "閉じる",
    empty: "まだ使ったノートがありません。",
    emptyHint: "ノートの中で値を変える・単位を切り替える・結果をコピーすると、ここに残ります。",
    remove: "履歴から削除",
    deleted: "削除済み",
    uncategorized: "未分類",
  },
  es: {
    title: "Cuadernos",
    hint: "Tus cuadernos fijados y los usados recientemente. Toca uno para abrirlo.",
    pinnedSectionTitle: "Fijados",
    recentSectionTitle: "Usados recientemente",
    clear: "Borrar",
    close: "Cerrar",
    empty: "Aún no has usado ningún cuaderno.",
    emptyHint: "Un cuaderno aparece aquí cuando cambias un valor, cambias una unidad o copias un resultado en él.",
    remove: "Quitar del historial",
    deleted: "Eliminado",
    uncategorized: "Sin categoría",
  },
  "pt-BR": {
    title: "Cadernos",
    hint: "Seus cadernos fixados e os usados recentemente. Toque em um para abri-lo.",
    pinnedSectionTitle: "Fixados",
    recentSectionTitle: "Usados recentemente",
    clear: "Limpar",
    close: "Fechar",
    empty: "Você ainda não usou nenhum caderno.",
    emptyHint: "Um caderno aparece aqui quando você altera um valor, troca uma unidade ou copia um resultado nele.",
    remove: "Remover do histórico",
    deleted: "Excluído",
    uncategorized: "Sem categoria",
  },
  de: {
    title: "Rechenhefte",
    hint: "Deine angehefteten und zuletzt verwendeten Rechenhefte. Tippe eines an, um es zu öffnen.",
    pinnedSectionTitle: "Angeheftet",
    recentSectionTitle: "Zuletzt verwendet",
    clear: "Löschen",
    close: "Schließen",
    empty: "Du hast noch kein Rechenheft verwendet.",
    emptyHint: "Ein Rechenheft erscheint hier, sobald du darin einen Wert änderst, eine Einheit wechselst oder ein Ergebnis kopierst.",
    remove: "Aus dem Verlauf entfernen",
    deleted: "Gelöscht",
    uncategorized: "Ohne Kategorie",
  },
  fr: {
    title: "Carnets",
    hint: "Vos carnets épinglés et récemment utilisés. Appuyez sur l'un d'eux pour l'ouvrir.",
    pinnedSectionTitle: "Épinglés",
    recentSectionTitle: "Récemment utilisés",
    clear: "Effacer",
    close: "Fermer",
    empty: "Aucun carnet utilisé pour le moment.",
    emptyHint: "Un carnet apparaît ici dès que vous y modifiez une valeur, changez d'unité ou copiez un résultat.",
    remove: "Retirer de l'historique",
    deleted: "Supprimé",
    uncategorized: "Sans catégorie",
  },
};

function categoryLabel(categoryId: string, notebookCategories: NotebookCategory[], language: AppLanguage, copy: typeof EN_COPY): string {
  if (categoryId === UNCATEGORIZED_CATEGORY_ID) return copy.uncategorized;
  const presetCategory = PRESET_NOTEBOOK_CATEGORIES.find((category) => category.id === categoryId);
  if (presetCategory) return localizedText(presetCategory.label, language);
  const userCategory = notebookCategories.find((category) => category.id === categoryId);
  return userCategory?.name ?? copy.uncategorized;
}

export function NotebookHistorySheet({ visible, language, entries, pinnedNotebooks, notebookCategories, onSelect, onRemove, onClear, onClose }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = COPY[language];

  // 日時は端末ロケールではなく、アプリ内で選んだ言語のロケール（LANGUAGE_META）に揃える。
  // formatQuantityなどlib/units.ts側の既存コードもlocaleを個別に受け取る作りなのでそれに倣う。
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(LANGUAGE_META[language].locale, { dateStyle: "medium", timeStyle: "short" }), [language]);

  const hasPinned = pinnedNotebooks.length > 0;
  const hasHistory = entries.length > 0;

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

          {hasPinned || hasHistory ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {hasPinned ? (
                <View>
                  <Text style={[styles.sectionLabel, styles.sectionLabelSpacing]}>{copy.pinnedSectionTitle}</Text>
                  {pinnedNotebooks.map((notebook) => (
                    // ピン留めの解除はここでは行わない（既存のノート詳細画面の導線に一本化するため）。
                    // そのため削除ボタンは付けず、行全体がタップで開くだけのシンプルな構成にする。
                    <Pressable
                      accessibilityLabel={notebook.title}
                      key={notebook.id}
                      onPress={() => onSelect(notebook.id)}
                      style={({ pressed }) => [styles.historyRow, styles.pinnedRowSpacing, pressed && styles.cardPressed]}
                    >
                      <View style={styles.historyRowMain}>
                        <IconSymbol name="pin.fill" size={13} color={colors.primary} />
                        <View style={styles.historyRowTexts}>
                          <Text numberOfLines={1} style={styles.historyTitle}>{notebook.title}</Text>
                          <Text numberOfLines={1} style={styles.historyCategory}>{categoryLabel(notebook.categoryId, notebookCategories, language, copy)}</Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {hasHistory ? (
                <View>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>{copy.recentSectionTitle}</Text>
                    <Pressable onPress={onClear} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
                      <Text style={styles.clearButtonText}>{copy.clear}</Text>
                    </Pressable>
                  </View>
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
                    // 削除ボタンは行の外側に置く。行そのものをPressableにしているため、
                    // 中に入れ子にすると「開く」と「消す」のどちらが反応したのか分かりにくくなる。
                    const remove = (
                      <Pressable accessibilityLabel={`${copy.remove}: ${title}`} onPress={() => onRemove(entry.id)} hitSlop={8} style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
                        <IconSymbol name="xmark" size={12} color={colors.muted} />
                      </Pressable>
                    );
                    return (
                      <View key={entry.id} style={styles.historyRowWrap}>
                        {isAvailable ? (
                          <Pressable accessibilityLabel={title} onPress={() => onSelect(entry.notebookId)} style={({ pressed }) => [styles.historyRow, styles.historyRowGrow, pressed && styles.cardPressed]}>
                            {row}
                          </Pressable>
                        ) : (
                          <View style={[styles.historyRow, styles.historyRowGrow, styles.historyRowDisabled]}>
                            {row}
                          </View>
                        )}
                        {remove}
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </ScrollView>
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
  clearButton: { padding: 4 },
  clearButtonText: { color: colors.error, fontSize: 11, fontWeight: "700" },
  scrollContent: { gap: 18, paddingBottom: 18, paddingTop: 10 },
  // 見出しの下余白は見出し自身ではなく行側に持たせる。見出しに marginBottom を付けたまま
  // 「消去」ボタンと同じ行（alignItems:center）に入れると、その余白ぶん見出しだけが上へずれる。
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  sectionLabelSpacing: { marginBottom: 8 },
  sectionHeaderRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  pinnedRowSpacing: { marginBottom: 6 },
  historyRowWrap: { alignItems: "center", flexDirection: "row", gap: 6, marginBottom: 6 },
  historyRow: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  historyRowGrow: { flex: 1 },
  removeButton: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 14, height: 28, justifyContent: "center", width: 28 },
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
