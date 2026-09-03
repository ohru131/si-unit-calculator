import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { CalculationNotebook, NotebookCategory } from "@/lib/calculator-store";
import { type AppLanguage } from "@/lib/i18n";
import { parseNotebooksBackup, sanitizeBackupFileLabel, serializeNotebooksBackup, type ParsedNotebooksBackup } from "@/lib/notebooks-backup";

const FILE_NAME_BASE = "si-unit-calculator-notebooks";
const FILE_NAME = `${FILE_NAME_BASE}.json`;

// カテゴリ単位のエクスポートは全部同じファイル名だと区別が付かないため、渡されたラベル
// （カテゴリ名）をファイル名へ差し込む。ラベル無し・整形の結果空になったとき（記号だけの
// 名前など）は、これまでどおりの全体バックアップと同じファイル名にフォールバックする。
function resolveNotebooksBackupFileName(fileLabel?: string): string {
  if (!fileLabel) return FILE_NAME;
  const sanitized = sanitizeBackupFileLabel(fileLabel);
  return sanitized ? `${FILE_NAME_BASE}-${sanitized}.json` : FILE_NAME;
}

// このモジュールは入り口（exportNotebooksBackup・pickNotebooksBackup）が2個だけの浅いモジュールなので、
// lib/units.tsのようにエラーコード化して表示側で翻訳する方式ではなく、
// 呼び出し元から言語を直接受け取ってこの場でメッセージを組み立てる。
const EN_FILE_MESSAGES = {
  sharingUnavailable: "Sharing is not available on this device.",
  dialogTitle: "Share notebooks backup",
};
const FILE_MESSAGES: Record<AppLanguage, typeof EN_FILE_MESSAGES> = {
  en: EN_FILE_MESSAGES,
  ja: {
    sharingUnavailable: "この端末では共有機能を利用できません。",
    dialogTitle: "計算ノートのバックアップを共有",
  },
  es: {
    sharingUnavailable: "La función de compartir no está disponible en este dispositivo.",
    dialogTitle: "Compartir copia de seguridad de los cuadernos",
  },
  "pt-BR": {
    sharingUnavailable: "O compartilhamento não está disponível neste dispositivo.",
    dialogTitle: "Compartilhar backup dos cadernos de cálculo",
  },
  de: {
    sharingUnavailable: "Teilen ist auf diesem Gerät nicht verfügbar.",
    dialogTitle: "Rechenheft-Backup teilen",
  },
  fr: {
    sharingUnavailable: "Le partage n'est pas disponible sur cet appareil.",
    dialogTitle: "Partager la sauvegarde des carnets de calcul",
  },
};

export async function exportNotebooksBackup(notebooks: CalculationNotebook[], categories: NotebookCategory[], language: AppLanguage, fileLabel?: string) {
  const content = serializeNotebooksBackup(notebooks, categories);
  const fileName = resolveNotebooksBackupFileName(fileLabel);
  if (Platform.OS === "web") {
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return;
  }
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
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

export async function pickNotebooksBackup(language: AppLanguage): Promise<ParsedNotebooksBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/json", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const content = await readPickedAsset(result.assets[0]);
  return parseNotebooksBackup(content, language);
}
