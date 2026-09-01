import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { CalculationNotebook, NotebookCategory } from "@/lib/calculator-store";
import { parseNotebooksBackup, serializeNotebooksBackup, type ImportedNotebook } from "@/lib/notebooks-backup";

const FILE_NAME = "si-unit-calculator-notebooks.json";

export async function exportNotebooksBackup(notebooks: CalculationNotebook[], categories: NotebookCategory[]) {
  const content = serializeNotebooksBackup(notebooks, categories);
  if (Platform.OS === "web") {
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = FILE_NAME;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return;
  }
  const fileUri = `${FileSystem.cacheDirectory}${FILE_NAME}`;
  await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error("この端末では共有機能を利用できません。");
  await Sharing.shareAsync(fileUri, { dialogTitle: "計算ノートのバックアップを共有", mimeType: "application/json" });
}

async function readPickedAsset(asset: DocumentPicker.DocumentPickerAsset) {
  if (Platform.OS === "web") {
    if (asset.file) return asset.file.text();
    const response = await fetch(asset.uri);
    return response.text();
  }
  return FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
}

export async function pickNotebooksBackup(): Promise<ImportedNotebook[] | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/json", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const content = await readPickedAsset(result.assets[0]);
  return parseNotebooksBackup(content);
}
