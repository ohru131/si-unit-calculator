import * as FileSystem from "expo-file-system/legacy";
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

// このモジュールは入り口（exportNotebookDocument）が1個だけの浅いモジュールなので、
// lib/units.tsのようにエラーコード化して表示側で翻訳する方式ではなく、
// 呼び出し元から言語を直接受け取ってこの場でメッセージを組み立てる。
const EN_EXPORT_MESSAGES = {
  dialogTitle: "Share notebook (printable, save as PDF)",
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
    dialogTitle: "計算ノートを共有（印刷・PDF保存用）",
    sharingUnavailable: "この端末では共有機能を利用できません。",
    exportFailed: "ノートをエクスポートできませんでした。もう一度お試しください。",
    formulasHeading: "数式",
    inputsHeading: "定数（入力値）",
    stepsHeading: "結果",
    footer: "単位付き電卓で作成",
  },
  es: {
    dialogTitle: "Compartir cuaderno (imprimible, guardar como PDF)",
    sharingUnavailable: "La función de compartir no está disponible en este dispositivo.",
    exportFailed: "No se pudo exportar el cuaderno. Inténtalo de nuevo.",
    formulasHeading: "Fórmula",
    inputsHeading: "Entradas",
    stepsHeading: "Resultados",
    footer: "Creado con Unit Calculator",
  },
  "pt-BR": {
    dialogTitle: "Compartilhar caderno (imprimível, salvar como PDF)",
    sharingUnavailable: "O compartilhamento não está disponível neste dispositivo.",
    exportFailed: "Não foi possível exportar o caderno. Tente novamente.",
    formulasHeading: "Fórmula",
    inputsHeading: "Entradas",
    stepsHeading: "Resultados",
    footer: "Criado com o Unit Calculator",
  },
  de: {
    dialogTitle: "Rechenheft teilen (druckbar, als PDF speicherbar)",
    sharingUnavailable: "Teilen ist auf diesem Gerät nicht verfügbar.",
    exportFailed: "Das Rechenheft konnte nicht exportiert werden. Bitte versuche es erneut.",
    formulasHeading: "Formel",
    inputsHeading: "Eingaben",
    stepsHeading: "Ergebnisse",
    footer: "Erstellt mit Unit Calculator",
  },
  fr: {
    dialogTitle: "Partager le carnet (imprimable, à enregistrer en PDF)",
    sharingUnavailable: "Le partage n'est pas disponible sur cet appareil.",
    exportFailed: "Impossible d'exporter le carnet. Veuillez réessayer.",
    formulasHeading: "Formule",
    inputsHeading: "Entrées",
    stepsHeading: "Résultats",
    footer: "Créé avec Unit Calculator",
  },
};

export type ExportNotebookOptions = BuildNotebookExportModelOptions;

// ネイティブモジュールを新しく増やさない方針のため、PDF生成（expo-print）は使わず、
// 自己完結したHTMLを1ファイル書き出して共有する。KaTeXのフォントまでbase64で埋め込んで
// あるので、共有先でオフラインのまま画面と同じ数式が出る。受け取った側はブラウザや
// OSの印刷メニューからPDFとして保存できる。
//
// expo-printを使わない理由はもう1つあって、Web実装
// （node_modules/expo-print/src/ExponentPrint.web.ts）は printAsync・printToFileAsync の
// どちらもオプションを一切見ずwindow.print()を呼ぶだけで、生成したHTMLではなく
// 「今表示中のアプリ画面」を印刷してしまう。つまりWeb側は最初からこの方式が必要だった。
export async function exportNotebookDocument(options: ExportNotebookOptions): Promise<void> {
  const { notebook, language } = options;
  const messages = EXPORT_MESSAGES[language];
  const model = buildNotebookExportModel(options);
  const html = buildNotebookExportHtml(model, {
    katexCss: KATEX_CSS,
    katexJs: KATEX_JS,
    // AppLanguage（en/ja/es/pt-BR/de/fr）はそのままBCP 47として使える。
    lang: language,
    headings: { formulas: messages.formulasHeading, inputs: messages.inputsHeading, steps: messages.stepsHeading },
    footer: messages.footer,
  });
  const fileName = resolveNotebookExportFileName(notebook.title, "html");

  if (Platform.OS === "web") {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
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

  try {
    // 既存のCSVエクスポート・バックアップと同じ「キャッシュへ書いてから共有」の手順に揃える。
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, html, { encoding: "utf8" });
    if (!(await Sharing.isAvailableAsync())) throw new Error(messages.sharingUnavailable);
    await Sharing.shareAsync(fileUri, { dialogTitle: messages.dialogTitle, mimeType: "text/html", UTI: "public.html" });
  } catch (cause) {
    // 共有不可の理由は上でそのまま投げているので、それ以外（書き出し失敗等）だけ汎用文言に丸める。
    if (cause instanceof Error && cause.message === messages.sharingUnavailable) throw cause;
    throw new Error(messages.exportFailed);
  }
}
