import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { SavedCalculation } from "@/lib/calculator-store";
import { historyToCsv } from "@/lib/history-csv";
import { type AppLanguage } from "@/lib/i18n";

// このモジュールは入り口（exportCalculationHistory）が1個だけの浅いモジュールなので、
// lib/units.tsのようにエラーコード化して表示側で翻訳する方式ではなく、
// 呼び出し元から言語を直接受け取ってこの場でメッセージを組み立てる。
const EN_EXPORT_MESSAGES = {
  sharingUnavailable: "Sharing is not available on this device.",
  dialogTitle: "Share calculation history as CSV",
};
const EXPORT_MESSAGES: Record<AppLanguage, typeof EN_EXPORT_MESSAGES> = {
  en: EN_EXPORT_MESSAGES,
  ja: {
    sharingUnavailable: "この端末では共有機能を利用できません。",
    dialogTitle: "計算履歴をCSVで共有",
  },
};

export async function exportCalculationHistory(entries: SavedCalculation[], language: AppLanguage) {
  const csv = historyToCsv(entries);
  if (Platform.OS === "web") {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "si-unit-calculator-history.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  const fileUri = `${FileSystem.cacheDirectory}si-unit-calculator-history.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error(EXPORT_MESSAGES[language].sharingUnavailable);
  await Sharing.shareAsync(fileUri, { dialogTitle: EXPORT_MESSAGES[language].dialogTitle, mimeType: "text/csv" });
}

