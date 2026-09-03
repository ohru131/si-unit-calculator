import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { NotebookDetail } from "@/components/notebooks/notebook-detail";
import { NotebookEditorSheet, type NotebookSaveInput } from "@/components/notebooks/notebook-editor-sheet";
import { NotebookHistorySheet } from "@/components/notebooks/notebook-history-sheet";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type CalculationNotebook, useCalculatorStore } from "@/lib/calculator-store";
import { useGlobalSettings } from "@/lib/global-settings";
import { type AppLanguage } from "@/lib/i18n";
import { exportNotebookAsPdf } from "@/lib/notebook-export";
import { notebookWithDraftValues } from "@/lib/notebook-export-model";
import { resolveActiveNotebook, resolveNotebookHistory } from "@/lib/notebook-history";
import { usePro } from "@/lib/revenuecat-provider";

// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_COPY = {
  emptyTitle: "No notebook yet",
  emptyHint: "Choose one from the library to see it here.",
  browseLibrary: "Browse the library",
  notebookExported: "Notebook exported",
  notebookExportFailed: "Could not export the notebook. Please try again.",
};
const COPY: Record<AppLanguage, typeof EN_COPY> = {
  en: EN_COPY,
  ja: {
    emptyTitle: "ノートがまだありません",
    emptyHint: "ライブラリからノートを選ぶと、ここに表示されます。",
    browseLibrary: "ライブラリを開く",
    notebookExported: "ノートをエクスポートしました",
    notebookExportFailed: "ノートをエクスポートできませんでした。もう一度お試しください。",
  },
  es: {
    emptyTitle: "Aún no hay ningún cuaderno",
    emptyHint: "Elige uno en la biblioteca para verlo aquí.",
    browseLibrary: "Abrir la biblioteca",
    notebookExported: "Cuaderno exportado",
    notebookExportFailed: "No se pudo exportar el cuaderno. Inténtalo de nuevo.",
  },
  "pt-BR": {
    emptyTitle: "Ainda não há nenhum caderno",
    emptyHint: "Escolha um na biblioteca para vê-lo aqui.",
    browseLibrary: "Abrir a biblioteca",
    notebookExported: "Caderno exportado",
    notebookExportFailed: "Não foi possível exportar o caderno. Tente novamente.",
  },
  de: {
    emptyTitle: "Noch kein Rechenheft ausgewählt",
    emptyHint: "Wähle eines in der Bibliothek aus, um es hier zu sehen.",
    browseLibrary: "Bibliothek öffnen",
    notebookExported: "Rechenheft exportiert",
    notebookExportFailed: "Das Rechenheft konnte nicht exportiert werden. Bitte versuche es erneut.",
  },
  fr: {
    emptyTitle: "Aucun carnet pour le moment",
    emptyHint: "Choisissez-en un dans la bibliothèque pour le voir ici.",
    browseLibrary: "Ouvrir la bibliothèque",
    notebookExported: "Carnet exporté",
    notebookExportFailed: "Impossible d'exporter le carnet. Veuillez réessayer.",
  },
};

export default function NotebookScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { language, locale, measuringStandard, unitSystem } = useGlobalSettings();
  const { isPro } = usePro();
  const {
    constants,
    isLoading,
    notebooks,
    notebookCategories,
    notebookHistory,
    activeNotebookId,
    setActiveNotebookId,
    recordNotebookUse,
    removeNotebookHistoryEntry,
    clearNotebookHistory,
    upsertNotebook,
    upsertNotebookCategory,
  } = useCalculatorStore();

  const copy = COPY[language];

  // ピン留めしたノート・最近使ったノートは、ノート切替シート（NotebookHistorySheet）に渡す。
  // シート自体は電卓画面から移設したものをそのまま再利用する（ノート専用の新しいピッカーは作らない）。
  const pinnedNotebooks = useMemo(() => notebooks.filter((notebook) => notebook.pinned), [notebooks]);
  const resolvedNotebookHistory = useMemo(() => resolveNotebookHistory(notebookHistory, notebooks), [notebookHistory, notebooks]);
  // activeNotebookIdが未指定（一度も明示的に選んでいない）なら、最近使ったノート→ピン留めの順に
  // フォールバックする。この判定はlib/notebook-history.tsに切り出し済みで、ここでは呼ぶだけにする。
  const activeNotebook = useMemo(
    () => resolveActiveNotebook(activeNotebookId, notebookHistory, notebooks),
    [activeNotebookId, notebookHistory, notebooks],
  );

  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // 計算ノートの編集シート。開くたびにkeyを変えて作り直す契約（app/(tabs)/constants.tsxの
  // notebookEditorSessionと同じ理由）。このタブでは新規作成は行わない（新規作成はライブラリの
  // ＋ボタンから。ここは「今表示中のノートを編集する」導線だけを持つ）。
  const [notebookEditorVisible, setNotebookEditorVisible] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<CalculationNotebook | undefined>();
  const [notebookEditorSession, setNotebookEditorSession] = useState(0);

  const openEditNotebook = (notebook: CalculationNotebook) => {
    setEditingNotebook(notebook);
    setNotebookEditorSession((current) => current + 1);
    setNotebookEditorVisible(true);
  };
  const closeNotebookEditor = () => setNotebookEditorVisible(false);

  // 保存されたノートを「使った」の中でも一番はっきりした操作として最近使ったノートへ積む
  // （app/(tabs)/constants.tsxのsaveNotebookToStoreと同じ考え方）。
  const saveNotebookToStore = async (input: NotebookSaveInput) => {
    const saved = await upsertNotebook(input);
    void recordNotebookUse(saved);
    return saved;
  };

  // PDF共有。表示単位の上書き（unitOverrides）はNotebookDetailが保持しているため、
  // onShareの引数として受け取り、そのままlib/notebook-export.tsへ渡す（画面が改めて計算し直さない）。
  // Proゲートはapp/(tabs)/index.tsxのexportHistoryと同じく呼び出し側（この画面）で行い、
  // libの中には入れない。
  const shareNotebook = async (targetNotebook: CalculationNotebook, unitOverrides: Record<string, string>) => {
    setError("");
    setNotice("");
    try {
      await exportNotebookAsPdf({
        notebook: targetNotebook,
        globalConstants: constants,
        language,
        locale,
        unitSystem,
        measuringStandard,
        unitOverrides,
      });
      setNotice(copy.notebookExported);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.notebookExportFailed);
    }
  };

  // ノート切替シートで選んだノートをアクティブにする（このタブでactiveNotebookIdを書き込む
  // 2箇所のうちの1つ。もう1箇所はライブラリのNotebookList.onOpen）。
  const selectNotebookFromHistory = (notebookId: string) => {
    setShowHistorySheet(false);
    void setActiveNotebookId(notebookId);
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyCard}>
        <IconSymbol name="book.fill" size={30} color={colors.primary} />
        <Text style={styles.emptyTitle}>{copy.emptyTitle}</Text>
        <Text style={styles.emptyText}>{copy.emptyHint}</Text>
        <Pressable onPress={() => router.push("/constants")} style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
          <Text style={styles.emptyButtonText}>{copy.browseLibrary}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      {error ? <View style={styles.messageError}><Text style={styles.messageErrorText}>{error}</Text></View> : null}
      {notice ? <View style={styles.messageSuccess}><Text style={styles.messageSuccessText}>{notice}</Text></View> : null}
      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
      ) : activeNotebook ? (
        <NotebookDetail
          language={language}
          locale={locale}
          unitSystem={unitSystem}
          measuringStandard={measuringStandard}
          notebook={activeNotebook}
          globalConstants={constants}
          onEdit={() => openEditNotebook(activeNotebook)}
          onShare={(unitOverrides, draftLocalConstants, draftSteps) => {
            if (!isPro) {
              router.push("/pro");
              return;
            }
            // 保存前でも画面に出ている値でPDFを出す（保存済みのノートを渡すと数値が食い違う）。
            void shareNotebook(notebookWithDraftValues(activeNotebook, draftLocalConstants, draftSteps), unitOverrides);
          }}
          // ノート名自体をボタンにして、ノート切替シート（ピン留め・最近使ったノート）を開く。
          // これがこのタブでノートを切り替える唯一の入口になる。
          onTitlePress={() => setShowHistorySheet(true)}
          onUse={() => void recordNotebookUse(activeNotebook)}
          onSaveValues={async (nextLocalConstants, nextSteps) => {
            await upsertNotebook({
              id: activeNotebook.id,
              title: activeNotebook.title,
              description: activeNotebook.description,
              categoryId: activeNotebook.categoryId,
              formulas: activeNotebook.formulas,
              localConstants: nextLocalConstants,
              steps: nextSteps,
            });
          }}
        />
      ) : (
        renderEmpty()
      )}

      <NotebookEditorSheet
        key={notebookEditorSession}
        visible={notebookEditorVisible}
        language={language}
        unitSystem={unitSystem}
        notebook={editingNotebook}
        globalConstants={constants}
        notebookCategories={notebookCategories}
        onCreateCategory={(name) => upsertNotebookCategory({ name })}
        onSave={saveNotebookToStore}
        onClose={closeNotebookEditor}
      />

      <NotebookHistorySheet
        visible={showHistorySheet}
        language={language}
        entries={resolvedNotebookHistory}
        pinnedNotebooks={pinnedNotebooks}
        notebookCategories={notebookCategories}
        onSelect={selectNotebookFromHistory}
        onRemove={(entryId) => void removeNotebookHistoryEntry(entryId)}
        onClear={() => void clearNotebookHistory()}
        onClose={() => setShowHistorySheet(false)}
      />
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  emptyWrap: { alignItems: "center", flex: 1, justifyContent: "center" },
  emptyCard: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, paddingHorizontal: 30, paddingVertical: 32 },
  emptyTitle: { color: colors.foreground, fontSize: 17, fontWeight: "700", marginTop: 12 },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: "center" },
  emptyButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 13, justifyContent: "center", marginTop: 18, minHeight: 48, paddingHorizontal: 22 },
  emptyButtonText: { color: colors.onPrimary, fontSize: 14, fontWeight: "700" },
  messageError: { backgroundColor: colors.errorSurface, borderColor: colors.errorBorder, borderRadius: 10, borderWidth: 1, marginBottom: 10, marginTop: 8, paddingHorizontal: 11, paddingVertical: 8 },
  messageErrorText: { color: colors.error, fontSize: 12, lineHeight: 17 },
  messageSuccess: { backgroundColor: colors.successSurface, borderColor: colors.successBorder, borderRadius: 10, borderWidth: 1, marginBottom: 10, marginTop: 8, paddingHorizontal: 11, paddingVertical: 8 },
  messageSuccessText: { color: colors.success, fontSize: 12, lineHeight: 17 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
