import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { useCalculatorStore } from "@/lib/calculator-store";
import { type ImportedConstant } from "@/lib/constants-backup";
import { exportConstantsBackup, pickConstantsBackup } from "@/lib/constants-backup-file";
import { countCustomUnitConflicts, type CustomUnit } from "@/lib/custom-units";
import { useGlobalSettings } from "@/lib/global-settings";
import { type ImportedNotebook, type PresetNotebookOverride } from "@/lib/notebooks-backup";
import { exportNotebooksBackup, pickNotebooksBackup } from "@/lib/notebooks-backup-file";
import { unitErrorMessage } from "@/lib/unit-errors";

/**
 * 設定画面のバックアップ・復元カード（app/(tabs)/constants.tsxから移設）。
 *
 * 【なぜ計算ノートとグローバル定数でカードを2枚に分けるか】
 * どちらも「端末全体が対象・稀にしか使わない・破壊的」という性質は同じだが、対象が異なる操作を
 * 1枚に詰め込むと押し間違えやすい。見出しで区切るだけでなくカード自体を分けて、
 * ボタン列を完全に独立させる。
 *
 * 【なぜ設定画面に集約するか】
 * カテゴリ別のエクスポート（NotebookCategoryGrid）は「今見ているカテゴリの文脈がある・無害」だが、
 * インポートは端末全体に影響する上に生涯に1〜2回しか使わない破壊的操作なので、
 * 一覧画面の中に置くと「今見ているカテゴリに取り込まれる」と誤解されやすい。
 * 同じ性質を持つ「プリセットの計算ノートを初期状態に戻す」が既に設定画面にあるため、その並びに置く。
 */
export function BackupCard() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { language, t } = useGlobalSettings();
  const {
    constants,
    clearConstants,
    customUnits,
    hasRestorableConstants,
    importConstants,
    importNotebooks,
    notebooks,
    notebookCategories,
    restoreClearedConstants,
  } = useCalculatorStore();

  const [notebooksNotice, setNotebooksNotice] = useState("");
  const [constantsNotice, setConstantsNotice] = useState("");
  const [pendingClearConstants, setPendingClearConstants] = useState(false);
  // 「置き換えインポート」「プリセットへの編集(override)を含むインポート」「自作単位の上書きを
  // 含むインポート」は、どれも取り込み前に確認ダイアログを1回だけ出す必要がある（複数該当する
  // 場合でも2回続けて出さない）ため、pendingとして持つ情報を1つの状態にまとめる
  // （constants.tsxにあった元のロジックをそのまま移設し、自作単位の分を拡張した）。
  const [pendingNotebookImport, setPendingNotebookImport] = useState<{ mode: "merge" | "replace"; entries: ImportedNotebook[]; presetOverrides: PresetNotebookOverride[]; customUnits: CustomUnit[]; customUnitConflictCount: number } | null>(null);
  const [pendingConstantsImport, setPendingConstantsImport] = useState<{ mode: "merge" | "replace"; entries: ImportedConstant[]; customUnits: CustomUnit[]; customUnitConflictCount: number } | null>(null);

  // エンジンのエラー(UnitError)は現在の言語で表示する。UnitError以外は従来どおり
  // Error.message をそのまま出す（バックアップ処理など別系統のエラーもここを通るため）。
  const engineErrorMessage = (cause: unknown) => (cause instanceof Error ? (unitErrorMessage(cause, language) ?? cause.message) : t("backupGenericError"));

  const handleExportNotebooks = async () => {
    try {
      await exportNotebooksBackup(notebooks, notebookCategories, customUnits, language);
      setNotebooksNotice(t("backupNotebooksExportDone"));
    } catch (cause) {
      setNotebooksNotice(engineErrorMessage(cause));
    }
  };

  // 取り込み後の通知文を組み立てる。プリセットへの編集(override)・自作単位を1件以上反映した
  // 場合は、ノート件数の通知に続けて件数を追記する。
  const buildNotebookImportNotice = (result: { notebookCount: number; presetOverrideCount: number; customUnitCount: number }) => {
    let notice = t("backupNotebooksImportDone").replace("{count}", String(result.notebookCount));
    if (result.presetOverrideCount > 0) notice = `${notice} ${t("backupPresetOverridesApplied").replace("{count}", String(result.presetOverrideCount))}`;
    if (result.customUnitCount > 0) notice = `${notice} ${t("backupCustomUnitsImported").replace("{count}", String(result.customUnitCount))}`;
    return notice;
  };

  const handleImportNotebooks = async (mode: "merge" | "replace") => {
    try {
      const picked = await pickNotebooksBackup(language);
      if (!picked) return;
      const { notebooks: entries, presetOverrides, customUnits: incomingCustomUnits } = picked;
      // 同じ記号の自作単位が既にあり、かつ定義が違う件数。0件（記号が新規、または定義が
      // 完全に同じ）なら黙って取り込んでよい。
      const customUnitConflictCount = countCustomUnitConflicts(customUnits, incomingCustomUnits);
      // 置き換えは既存どおり必ず確認する。マージでも、プリセットへの編集または自作単位の
      // 上書きが含まれるなら「取り込むと上書きされる」ことを確認してもらう。
      if (mode === "replace" || presetOverrides.length > 0 || customUnitConflictCount > 0) {
        setPendingNotebookImport({ mode, entries, presetOverrides, customUnits: incomingCustomUnits, customUnitConflictCount });
        return;
      }
      const result = await importNotebooks(entries, "merge", presetOverrides, incomingCustomUnits);
      setNotebooksNotice(buildNotebookImportNotice(result));
    } catch (cause) {
      setNotebooksNotice(engineErrorMessage(cause));
    }
  };

  const confirmPendingNotebookImport = async () => {
    const pending = pendingNotebookImport;
    setPendingNotebookImport(null);
    if (!pending) return;
    try {
      const result = await importNotebooks(pending.entries, pending.mode, pending.presetOverrides, pending.customUnits);
      setNotebooksNotice(buildNotebookImportNotice(result));
    } catch (cause) {
      setNotebooksNotice(engineErrorMessage(cause));
    }
  };

  const handleExportConstants = async () => {
    try {
      await exportConstantsBackup(constants, customUnits, language);
      setConstantsNotice(t("backupConstantsExportDone"));
    } catch (cause) {
      setConstantsNotice(engineErrorMessage(cause));
    }
  };

  // 取り込み後の通知文を組み立てる。自作単位を1件以上反映した場合は、定数件数の通知に
  // 続けて件数を追記する（buildNotebookImportNoticeと同じ考え方）。
  const buildConstantsImportNotice = (result: { count: number; customUnitCount: number }) => {
    const base = t("backupConstantsImportDone").replace("{count}", String(result.count));
    if (result.customUnitCount <= 0) return base;
    return `${base} ${t("backupCustomUnitsImported").replace("{count}", String(result.customUnitCount))}`;
  };

  const handleImportConstants = async (mode: "merge" | "replace") => {
    try {
      const picked = await pickConstantsBackup(language);
      if (!picked) return;
      const { constants: entries, customUnits: incomingCustomUnits } = picked;
      const customUnitConflictCount = countCustomUnitConflicts(customUnits, incomingCustomUnits);
      // 置き換えは既存どおり必ず確認する。マージでも、自作単位の上書きが含まれるなら
      // 「取り込むと上書きされる」ことを確認してもらう。
      if (mode === "replace" || customUnitConflictCount > 0) {
        setPendingConstantsImport({ mode, entries, customUnits: incomingCustomUnits, customUnitConflictCount });
        return;
      }
      const result = await importConstants(entries, "merge", incomingCustomUnits);
      setConstantsNotice(buildConstantsImportNotice(result));
    } catch (cause) {
      setConstantsNotice(engineErrorMessage(cause));
    }
  };

  const confirmPendingConstantsImport = async () => {
    const pending = pendingConstantsImport;
    setPendingConstantsImport(null);
    if (!pending) return;
    try {
      const result = await importConstants(pending.entries, pending.mode, pending.customUnits);
      setConstantsNotice(buildConstantsImportNotice(result));
    } catch (cause) {
      setConstantsNotice(engineErrorMessage(cause));
    }
  };

  const handleClearConstants = async () => {
    try {
      await clearConstants();
      setConstantsNotice(t("backupConstantsCleared"));
    } catch (cause) {
      setConstantsNotice(engineErrorMessage(cause));
    }
  };

  const handleRestoreConstants = async () => {
    try {
      if (await restoreClearedConstants()) setConstantsNotice(t("backupConstantsRestored"));
    } catch (cause) {
      setConstantsNotice(engineErrorMessage(cause));
    }
  };

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.label}>{t("backupNotebooksTitle")}</Text>
        <View style={styles.actions}>
          <Pressable onPress={() => void handleExportNotebooks()} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>{t("backupNotebooksExportAll")}</Text></Pressable>
          <Pressable onPress={() => void handleImportNotebooks("merge")} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>{t("backupNotebooksMerge")}</Text></Pressable>
          <Pressable onPress={() => void handleImportNotebooks("replace")} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>{t("backupNotebooksReplace")}</Text></Pressable>
        </View>
        {notebooksNotice ? <Text style={styles.notice}>{notebooksNotice}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t("backupConstantsTitle")}</Text>
        <View style={styles.actions}>
          <Pressable onPress={() => void handleExportConstants()} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>{t("backupConstantsExport")}</Text></Pressable>
          <Pressable onPress={() => void handleImportConstants("merge")} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>{t("backupConstantsMerge")}</Text></Pressable>
          <Pressable onPress={() => void handleImportConstants("replace")} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>{t("backupConstantsReplace")}</Text></Pressable>
          <Pressable onPress={() => setPendingClearConstants(true)} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}><Text style={styles.clearButtonText}>{t("backupConstantsClearAll")}</Text></Pressable>
          {hasRestorableConstants ? <Pressable onPress={() => void handleRestoreConstants()} style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed]}><Text style={styles.restoreButtonText}>{t("backupConstantsRestore")}</Text></Pressable> : null}
        </View>
        {constantsNotice ? <Text style={styles.notice}>{constantsNotice}</Text> : null}
      </View>

      <ConfirmDialog
        visible={pendingClearConstants}
        title={t("backupConstantsClearAll")}
        message={t("backupConstantsClearConfirm")}
        cancelLabel={t("cancel")}
        confirmLabel={t("backupConstantsClearAll")}
        destructive
        onCancel={() => setPendingClearConstants(false)}
        onConfirm={() => {
          setPendingClearConstants(false);
          void handleClearConstants();
        }}
      />

      <ConfirmDialog
        visible={Boolean(pendingConstantsImport)}
        title={pendingConstantsImport?.mode === "replace" ? t("backupConstantsReplace") : t("backupCustomUnitOverrideTitle")}
        message={
          pendingConstantsImport
            ? [
                // 置き換えなら既存の確認文をそのまま使い、自作単位の上書き警告を後ろに続ける
                // （両方に該当する経路でダイアログを2回出さないよう、1つの文面にまとめる）。
                pendingConstantsImport.mode === "replace" ? t("backupConstantsReplaceConfirm") : null,
                pendingConstantsImport.customUnitConflictCount > 0
                  ? t("backupCustomUnitOverrideWarning").replace("{count}", String(pendingConstantsImport.customUnitConflictCount))
                  : null,
              ].filter(Boolean).join("\n\n")
            : ""
        }
        cancelLabel={t("cancel")}
        confirmLabel={pendingConstantsImport?.mode === "replace" ? t("backupConstantsReplace") : t("backupImportContinue")}
        destructive={pendingConstantsImport?.mode === "replace"}
        onCancel={() => setPendingConstantsImport(null)}
        onConfirm={() => void confirmPendingConstantsImport()}
      />

      <ConfirmDialog
        visible={Boolean(pendingNotebookImport)}
        title={
          pendingNotebookImport?.mode === "replace"
            ? t("backupNotebooksReplace")
            : (pendingNotebookImport?.presetOverrides.length ?? 0) > 0
              ? t("backupPresetOverrideTitle")
              : t("backupCustomUnitOverrideTitle")
        }
        message={
          pendingNotebookImport
            ? [
                // 置き換えなら既存の確認文をそのまま使い、プリセット編集・自作単位の上書き警告を
                // 後ろに続ける（複数該当する経路でダイアログを2回以上出さないよう、1つの文面にまとめる）。
                pendingNotebookImport.mode === "replace" ? t("backupNotebooksReplaceConfirm") : null,
                pendingNotebookImport.presetOverrides.length > 0
                  ? t("backupPresetOverrideWarning").replace("{count}", String(pendingNotebookImport.presetOverrides.length))
                  : null,
                pendingNotebookImport.customUnitConflictCount > 0
                  ? t("backupCustomUnitOverrideWarning").replace("{count}", String(pendingNotebookImport.customUnitConflictCount))
                  : null,
              ].filter(Boolean).join("\n\n")
            : ""
        }
        cancelLabel={t("cancel")}
        confirmLabel={pendingNotebookImport?.mode === "replace" ? t("backupNotebooksReplace") : t("backupImportContinue")}
        destructive={pendingNotebookImport?.mode === "replace"}
        onCancel={() => setPendingNotebookImport(null)}
        onConfirm={() => void confirmPendingNotebookImport()}
      />
    </>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  button: { backgroundColor: colors.surfaceSecondary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  buttonText: { color: colors.foreground, fontSize: 13, fontWeight: "700" },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: 16 },
  clearButton: { backgroundColor: colors.errorSurface, borderColor: colors.errorBorder, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  clearButtonText: { color: colors.error, fontSize: 13, fontWeight: "700" },
  label: { color: colors.foreground, fontSize: 15, fontWeight: "800" },
  notice: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  restoreButton: { backgroundColor: colors.successSurface, borderColor: colors.successBorder, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  restoreButtonText: { color: colors.success, fontSize: 13, fontWeight: "700" },
});
