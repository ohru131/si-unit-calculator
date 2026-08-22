import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { SavedCalculation } from "@/lib/calculator-store";
import { historyToCsv } from "@/lib/history-csv";

export async function exportCalculationHistory(entries: SavedCalculation[]) {
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
  if (!(await Sharing.isAvailableAsync())) throw new Error("この端末では共有機能を利用できません。");
  await Sharing.shareAsync(fileUri, { dialogTitle: "計算履歴をCSVで共有", mimeType: "text/csv" });
}

