import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { type AppLanguage } from "@/lib/i18n";
import { KATEX_CSS, KATEX_JS } from "@/lib/katex-assets.generated";
import { buildNotebookExportHtml } from "@/lib/notebook-export-html";
import { buildNotebookExportModel, type BuildNotebookExportModelOptions } from "@/lib/notebook-export-model";
import { sanitizeBackupFileLabel } from "@/lib/notebooks-backup";

const FILE_NAME_BASE = "si-unit-calculator-notebook";

// ノート名から生成するファイル名は空になりうる（記号だけの名前など）ため、
// lib/notebooks-backup-file.tsのresolveNotebooksBackupFileNameと同じくフォールバックする。
function resolveNotebookExportFileName(title: string, extension: string): string {
  const sanitized = sanitizeBackupFileLabel(title);
  return `${sanitized ? `${FILE_NAME_BASE}-${sanitized}` : FILE_NAME_BASE}.${extension}`;
}

// このモジュールは入り口（exportNotebookAsPdf）が1個だけの浅いモジュールなので、
// lib/units.tsのようにエラーコード化して表示側で翻訳する方式ではなく、
// 呼び出し元から言語を直接受け取ってこの場でメッセージを組み立てる。
const EN_EXPORT_MESSAGES = {
  dialogTitle: "Share notebook as PDF",
  sharingUnavailable: "Sharing is not available on this device.",
  exportFailed: "Could not export the notebook. Please try again.",
  formulasHeading: "Formula",
  inputsHeading: "Inputs",
  stepsHeading: "Results",
  footer: "Created with Unit Calculator",
};
const EXPORT_MESSAGES: Record<AppLanguage, typeof EN_EXPORT_MESSAGES> = {
  en: EN_EXPORT_MESSAGES,
  ja: {
    dialogTitle: "計算ノートをPDFで共有",
    sharingUnavailable: "この端末では共有機能を利用できません。",
    exportFailed: "ノートをエクスポートできませんでした。もう一度お試しください。",
    formulasHeading: "数式",
    inputsHeading: "定数（入力値）",
    stepsHeading: "結果",
    footer: "単位付き電卓で作成",
  },
  es: {
    dialogTitle: "Compartir cuaderno como PDF",
    sharingUnavailable: "La función de compartir no está disponible en este dispositivo.",
    exportFailed: "No se pudo exportar el cuaderno. Inténtalo de nuevo.",
    formulasHeading: "Fórmula",
    inputsHeading: "Entradas",
    stepsHeading: "Resultados",
    footer: "Creado con Unit Calculator",
  },
  "pt-BR": {
    dialogTitle: "Compartilhar caderno como PDF",
    sharingUnavailable: "O compartilhamento não está disponível neste dispositivo.",
    exportFailed: "Não foi possível exportar o caderno. Tente novamente.",
    formulasHeading: "Fórmula",
    inputsHeading: "Entradas",
    stepsHeading: "Resultados",
    footer: "Criado com o Unit Calculator",
  },
  de: {
    dialogTitle: "Rechenheft als PDF teilen",
    sharingUnavailable: "Teilen ist auf diesem Gerät nicht verfügbar.",
    exportFailed: "Das Rechenheft konnte nicht exportiert werden. Bitte versuche es erneut.",
    formulasHeading: "Formel",
    inputsHeading: "Eingaben",
    stepsHeading: "Ergebnisse",
    footer: "Erstellt mit Unit Calculator",
  },
  fr: {
    dialogTitle: "Partager le carnet en PDF",
    sharingUnavailable: "Le partage n'est pas disponible sur cet appareil.",
    exportFailed: "Impossible d'exporter le carnet. Veuillez réessayer.",
    formulasHeading: "Formule",
    inputsHeading: "Entrées",
    stepsHeading: "Résultats",
    footer: "Créé avec Unit Calculator",
  },
};

export type ExportNotebookAsPdfOptions = BuildNotebookExportModelOptions;

// Web版の制約: expo-printのWeb実装（node_modules/expo-print/src/ExponentPrint.web.ts）は
// printAsync・printToFileAsyncのどちらもオプションを一切見ずwindow.print()を呼ぶだけで、
// 印刷対象は「今表示中のアプリ画面のDOM」になってしまう（buildNotebookExportHtmlで生成した
// ノート専用HTMLではない）。そのままでは意図と違う内容を黙って印刷するので、Web版では使わず、
// このリポジトリの既存パターン（lib/calculation-export.ts・lib/notebooks-backup-file.tsと同じ
// Blob + <a download>）でHTMLファイルとしてダウンロードさせる。ブラウザで開いたHTMLは
// 印刷メニューからPDF保存できるため、最終的にPDFを得る手段はネイティブ・Webのどちらにもある。
export async function exportNotebookAsPdf(options: ExportNotebookAsPdfOptions): Promise<void> {
  const { notebook, language } = options;
  const messages = EXPORT_MESSAGES[language];
  const model = buildNotebookExportModel(options);
  const html = buildNotebookExportHtml(model, {
    katexCss: KATEX_CSS,
    katexJs: KATEX_JS,
    headings: { formulas: messages.formulasHeading, inputs: messages.inputsHeading, steps: messages.stepsHeading },
    footer: messages.footer,
  });

  if (Platform.OS === "web") {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = resolveNotebookExportFileName(notebook.title, "html");
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return;
  }

  try {
    // Print.printToFileAsyncは自前でキャッシュ内に自動採番のファイル名を割り当てるため、
    // ノート名を反映したファイル名で共有できるよう、生成後にこちらの命名規則の場所へ移す。
    // 同じノートを2回続けて共有すると移動先に前回のファイルが残っているため、moveAsyncが
    // 「既に存在する」で失敗しないよう先に消しておく（idempotent: trueで未存在でもエラーにしない）。
    const { uri } = await Print.printToFileAsync({ html });
    const destinationUri = `${FileSystem.cacheDirectory}${resolveNotebookExportFileName(notebook.title, "pdf")}`;
    await FileSystem.deleteAsync(destinationUri, { idempotent: true });
    await FileSystem.moveAsync({ from: uri, to: destinationUri });
    if (!(await Sharing.isAvailableAsync())) throw new Error(messages.sharingUnavailable);
    await Sharing.shareAsync(destinationUri, { dialogTitle: messages.dialogTitle, mimeType: "application/pdf", UTI: "com.adobe.pdf" });
  } catch (cause) {
    // 共有不可の理由は上でそのまま投げているので、それ以外（PDF生成失敗等）だけ汎用文言に丸める。
    if (cause instanceof Error && cause.message === messages.sharingUnavailable) throw cause;
    throw new Error(messages.exportFailed);
  }
}
