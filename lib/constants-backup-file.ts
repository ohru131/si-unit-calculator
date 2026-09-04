import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { parseConstantsBackup, serializeConstantsBackup, type ParsedConstantsBackup } from "@/lib/constants-backup";
import { type CustomUnit } from "@/lib/custom-units";
import { type AppLanguage } from "@/lib/i18n";
import type { SavedConstant } from "@/lib/units";

const FILE_NAME = "si-unit-calculator-constants.json";

// このモジュールは入り口（exportConstantsBackup・pickConstantsBackup）が2個だけの浅いモジュールなので、
// lib/units.tsのようにエラーコード化して表示側で翻訳する方式ではなく、
// 呼び出し元から言語を直接受け取ってこの場でメッセージを組み立てる。
const EN_FILE_MESSAGES = {
  sharingUnavailable: "Sharing is not available on this device.",
  dialogTitle: "Share constants backup",
};
const FILE_MESSAGES: Record<AppLanguage, typeof EN_FILE_MESSAGES> = {
  en: EN_FILE_MESSAGES,
  ja: {
    sharingUnavailable: "この端末では共有機能を利用できません。",
    dialogTitle: "定数バックアップを共有",
  },
  es: {
    sharingUnavailable: "La función de compartir no está disponible en este dispositivo.",
    dialogTitle: "Compartir copia de seguridad de constantes",
  },
  "pt-BR": {
    sharingUnavailable: "O compartilhamento não está disponível neste dispositivo.",
    dialogTitle: "Compartilhar backup de constantes",
  },
  de: {
    sharingUnavailable: "Teilen ist auf diesem Gerät nicht verfügbar.",
    dialogTitle: "Konstanten-Backup teilen",
  },
  fr: {
    sharingUnavailable: "Le partage n'est pas disponible sur cet appareil.",
    dialogTitle: "Partager la sauvegarde des constantes",
  },
};

export async function exportConstantsBackup(constants: SavedConstant[], customUnits: CustomUnit[], language: AppLanguage) {
  const content = serializeConstantsBackup(constants, customUnits);
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
  if (!(await Sharing.isAvailableAsync())) throw new Error(FILE_MESSAGES[language].sharingUnavailable);
  await Sharing.shareAsync(fileUri, { dialogTitle: FILE_MESSAGES[language].dialogTitle, mimeType: "application/json" });
}

async function readPickedAsset(asset: DocumentPicker.DocumentPickerAsset) {
  if (Platform.OS === "web") {
    if (asset.file) return asset.file.text();
    const response = await fetch(asset.uri);
    return response.text();
  }
  return FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
}

export async function pickConstantsBackup(language: AppLanguage): Promise<ParsedConstantsBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/json", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const content = await readPickedAsset(result.assets[0]);
  return parseConstantsBackup(content, language);
}
