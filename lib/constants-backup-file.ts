import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { parseConstantsBackup, serializeConstantsBackup, type ImportedConstant } from "@/lib/constants-backup";
import type { SavedConstant } from "@/lib/units";

const FILE_NAME = "si-unit-calculator-constants.json";

export async function exportConstantsBackup(constants: SavedConstant[]) {
  const content = serializeConstantsBackup(constants);
  if (Platform.OS === "web") {
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = FILE_NAME;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }
  const fileUri = `${FileSystem.cacheDirectory}${FILE_NAME}`;
  await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error("この端末では共有機能を利用できません。");
  await Sharing.shareAsync(fileUri, { dialogTitle: "定数バックアップを共有", mimeType: "application/json" });
}

async function readPickedAsset(asset: DocumentPicker.DocumentPickerAsset) {
  if (Platform.OS === "web") {
    if (asset.file) return asset.file.text();
    const response = await fetch(asset.uri);
    return response.text();
  }
  return FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
}

export async function pickConstantsBackup(): Promise<ImportedConstant[] | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/json", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const content = await readPickedAsset(result.assets[0]);
  return parseConstantsBackup(content);
}
