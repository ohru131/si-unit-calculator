import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AppLanguage, isAppLanguage, LANGUAGE_META, resolveDeviceLanguage } from "@/lib/i18n";
import { MeasuringStandard, setMeasuringStandard as applyMeasuringStandard, UnitSystem } from "@/lib/units";

// AppLanguage の唯一の定義は lib/i18n.ts。既存のimport元（他ファイルが
// "@/lib/global-settings" から AppLanguage をimportしている）を壊さないよう、ここではre-exportする。
export type { AppLanguage };

type GlobalSettings = {
  language: AppLanguage;
  locale: string;
  /**
   * 端末の通貨コード（例 "JPY"）。取得できないときは null。
   * 金額の既定値は言語ではなく地域で決まる（ドイツ語話者がスイスにいればCHF）ため、
   * language ではなくこちらを使う。
   */
  currencyCode: string | null;
  /**
   * 端末の地域コード（例 "JP"）。取得できないときは null。
   * Webでは currencyCode が常に null で返る（expo-localizationのweb実装の制約）ので、
   * 金額の既定値を地域で決めるにはこちらが必要になる。
   */
  regionCode: string | null;
  unitSystem: UnitSystem;
  measuringStandard: MeasuringStandard;
  isReady: boolean;
  hasSeenOnboarding: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setUnitSystem: (system: UnitSystem) => Promise<void>;
  setMeasuringStandard: (standard: MeasuringStandard) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  t: (key: TranslationKey) => string;
  unitGroupLabel: (groupId: string) => string;
};

type TranslationKey = keyof typeof EN_COPY;

const LANGUAGE_KEY = "si-unit-calculator.language.v1";
const UNIT_SYSTEM_KEY = "si-unit-calculator.unit-system.v1";
const ONBOARDING_SEEN_KEY = "si-unit-calculator.onboarding-seen.v1";
const MEASURING_STANDARD_KEY = "si-unit-calculator.measuring-standard.v1";

// 英語のキー集合を正にして、他の言語は同じキーが全部揃っていないと型エラーにする。
// COPY 全体を satisfies Record<AppLanguage, Record<string, string>> とするとキー漏れをその場で検出できず、
// t() の定義行で「どの言語の何のキーが足りないのか分からないエラー」になってしまう。
const EN_COPY = {
  calculator: "Unit Calculator",
  calculatorSubtitle: "Calculate in SI. Display in compatible units.",
  // タブラベル。「計算ノート」だとタブ幅に収まらないため、components/notebooks/notebook-history-sheet.tsx の
  // notebooksButton（ノート履歴シートの呼び出しボタン）と同じ短い語に揃える。
  notebook: "Notebooks",
  constants: "Library",
  pro: "Pro",
  examples: "Start with examples",
  examplesHint: "Choose an example to load the expression, display unit, and result.",
  expression: "Expression",
  expressionHint: "Supports ×, ÷, parentheses, constants, and advanced math",
  result: "Result",
  displayUnit: "Display unit",
  compatibleOnly: "Only units with the same dimension are shown.",
  enterUnit: "Enter a unit",
  enterUnitHint: "Choose a category, then tap a unit to add it to the expression.",
  settings: "Preferences",
  settingsSubtitle: "Language, regional units, and accessible display choices.",
  language: "App language",
  units: "Preferred unit system",
  systemMetric: "Metric",
  systemUS: "US customary",
  systemUK: "Imperial / UK",
  systemHint: "Your preference prioritizes familiar units without changing SI calculation accuracy.",
  theme: "Appearance",
  themeSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  themeHint: "Choose Light or Dark to override your device setting, or follow System.",
  adsTitle: "Ads",
  adsHint: "The free version shows a small banner ad. Upgrade to Pro, or enter a code, to remove it.",
  adsFreeActive: "Ads are hidden.",
  adsUpgrade: "See Pro plans",
  adsRedeemPlaceholder: "Enter a code",
  adsRedeemButton: "Apply",
  accessibility: "Accessible by design",
  accessibilityHint: "VoiceOver and TalkBack labels describe controls; text follows your device size settings.",
  region: "Region",
  saved: "Saved",
  measuringStandard: "Cup & spoon standard",
  measuringStandardHint: "Sets the actual size used for cup, tbsp, and tsp everywhere in the app.",
  standardUS: "US customary (cup ≈ 236.6 mL)",
  standardJIS: "Japanese JIS (cup = 200 mL)",
  customUnits: "Custom units",
  customUnitsHint: "Define your own unit as a multiple (0.303m) or as a formula in x ((x-32)*5/9*K + 273.15*K). Symbols already used by built-in units are not accepted.",
  customUnitSymbolPlaceholder: "Symbol",
  customUnitDefinitionPlaceholder: "Definition",
  customUnitAdd: "Add",
  customUnitDelete: "Delete",
  customUnitEmpty: "No custom units yet.",
  customUnitSaveFailed: "Could not save the custom unit on this device.",
  resetPresetsTitle: "Reset preset notebooks",
  resetPresetsHint: "Restore all built-in notebooks to their original values, discarding any edits you made to them. Notebooks you created yourself are not affected.",
  resetPresetsButton: "Reset presets",
  resetPresetsConfirmMessage: "This restores all built-in (preset) notebooks to their original defaults, discarding any edits you made to them. Notebooks you created yourself are kept and are not affected. This cannot be undone.",
  resetPresetsDone: "Preset notebooks have been reset.",
  cancel: "Cancel",
  // バックアップ／復元カード（app/(tabs)/constants.tsxから移設）。端末全体が対象で稀にしか使わない
  // 破壊的操作なので、プリセットのリセットと同じくこの設定画面に集約する。
  backupNotebooksTitle: "Notebooks",
  backupNotebooksExportAll: "Export all",
  backupNotebooksMerge: "Merge and replace matches",
  backupNotebooksReplace: "Replace all notebooks",
  backupNotebooksExportDone: "Notebooks backup exported.",
  backupNotebooksImportDone: "{count} notebooks imported.",
  backupNotebooksReplaceConfirm: "Replace all your notebooks with the ones in this file? Preset notebooks are kept. This cannot be undone.",
  backupPresetOverrideTitle: "Preset notebook edits",
  backupPresetOverrideWarning: "This backup includes edits to {count} preset notebooks. Importing will overwrite what's currently on this device.",
  backupImportContinue: "Import",
  backupPresetOverridesApplied: "{count} preset notebook edits applied.",
  // 自作単位（customUnits）の警告・通知。計算ノート・グローバル定数どちらのバックアップにも
  // customUnitsが含まれうるので、上のbackupPresetOverride系と同じ文面をどちらの取り込みからも
  // 共有で使う（訳語はdocs/i18n-glossary.mdのcustomUnitsキーに揃える）。
  backupCustomUnitOverrideTitle: "Custom unit edits",
  backupCustomUnitOverrideWarning: "This backup includes {count} custom units that differ from what's on this device. Importing will overwrite them.",
  backupCustomUnitsImported: "{count} custom units imported.",
  backupConstantsTitle: "Global constants",
  backupConstantsExport: "Export",
  backupConstantsMerge: "Merge and replace matches",
  backupConstantsReplace: "Replace all constants",
  backupConstantsClearAll: "Clear all",
  backupConstantsRestore: "Restore",
  backupConstantsExportDone: "Constants backup exported.",
  backupConstantsImportDone: "{count} constants imported.",
  backupConstantsClearConfirm: "Clear all saved constants? You can restore the latest cleared set.",
  backupConstantsCleared: "Constants cleared. You can restore them from this device.",
  backupConstantsRestored: "Cleared constants restored.",
  backupConstantsReplaceConfirm: "Replace all saved constants with the ones in this file? This cannot be undone.",
  backupGenericError: "Something went wrong. Please try again.",
} as const;

const COPY: Record<AppLanguage, Record<TranslationKey, string>> = {
  en: EN_COPY,
  ja: {
    calculator: "単位付き電卓",
    calculatorSubtitle: "SIで計算し、互換性のある単位で表示します。",
    notebook: "ノート",
    constants: "ライブラリ",
    pro: "Pro",
    examples: "サンプルから始める",
    examplesHint: "例を選ぶと、式・表示単位・結果をまとめて設定します。",
    expression: "式",
    expressionHint: "×・÷・括弧・定数・上級関数に対応",
    result: "結果",
    displayUnit: "表示単位",
    compatibleOnly: "計算結果と同じ次元の単位のみ表示します。",
    enterUnit: "単位を式に入力",
    enterUnitHint: "次元を選択してから、使いたい単位をタップします。",
    settings: "設定",
    settingsSubtitle: "言語、地域の単位系、見やすい表示を調整します。",
    language: "アプリの言語",
    units: "優先する単位系",
    systemMetric: "メートル法",
    systemUS: "米国慣用単位",
    systemUK: "英・帝国単位",
    systemHint: "SIによる正確な計算は維持したまま、慣用的な単位を先に表示します。",
    theme: "外観",
    themeSystem: "端末設定に従う",
    themeLight: "ライト",
    themeDark: "ダーク",
    themeHint: "ライト・ダークを選ぶと端末設定に関わらず固定できます。",
    adsTitle: "広告",
    adsHint: "フリー版には小さなバナー広告が表示されます。Proへのアップグレード、またはコードの入力で非表示にできます。",
    adsFreeActive: "広告は非表示になっています。",
    adsUpgrade: "Proプランを見る",
    adsRedeemPlaceholder: "コードを入力",
    adsRedeemButton: "適用",
    accessibility: "アクセシビリティ",
    accessibilityHint: "VoiceOver・TalkBack向けの説明を付け、端末の文字サイズ設定に対応します。",
    region: "地域",
    saved: "保存済み",
    measuringStandard: "カップ・大さじ・小さじの規格",
    measuringStandardHint: "アプリ内すべてのカップ・大さじ・小さじの実際の量をまとめて切り替えます。",
    standardUS: "米国基準（カップ ≈ 236.6mL）",
    standardJIS: "日本のJIS規格（カップ = 200mL）",
    customUnits: "自作の単位",
    customUnitsHint: "倍率（0.303m）か、x を使った式（(x-32)*5/9*K + 273.15*K）で自分の単位を定義できます。既存の単位と同じ記号は登録できません。",
    customUnitSymbolPlaceholder: "記号",
    customUnitDefinitionPlaceholder: "定義",
    customUnitAdd: "追加",
    customUnitDelete: "削除",
    customUnitEmpty: "まだ自作の単位はありません。",
    customUnitSaveFailed: "この端末に自作の単位を保存できませんでした。",
    resetPresetsTitle: "プリセットの計算ノートを初期状態に戻す",
    resetPresetsHint: "組み込みの計算ノートをすべて元の値に戻し、加えた編集を破棄します。自分で作成した計算ノートには影響しません。",
    resetPresetsButton: "プリセットをリセット",
    resetPresetsConfirmMessage: "組み込み（プリセット）の計算ノートをすべて元の初期値に戻し、加えた編集を破棄します。自分で作成した計算ノートは残り、影響を受けません。この操作は元に戻せません。",
    resetPresetsDone: "プリセットの計算ノートをリセットしました。",
    cancel: "キャンセル",
    backupNotebooksTitle: "計算ノート",
    backupNotebooksExportAll: "すべて書き出す",
    backupNotebooksMerge: "追加・同名は置換",
    backupNotebooksReplace: "すべての計算ノートを置換",
    backupNotebooksExportDone: "計算ノートのバックアップを書き出しました。",
    backupNotebooksImportDone: "{count}件の計算ノートを読み込みました。",
    backupNotebooksReplaceConfirm: "自分の計算ノートをすべて、このファイルの内容へ置き換えますか？プリセットは残ります。元に戻せません。",
    backupPresetOverrideTitle: "プリセットの計算ノートの編集",
    backupPresetOverrideWarning: "このバックアップにはプリセット計算ノート{count}件の編集が含まれます。取り込むと、いま端末にあるその内容が上書きされます。",
    backupImportContinue: "取り込む",
    backupPresetOverridesApplied: "プリセット計算ノートの編集を{count}件反映しました。",
    backupCustomUnitOverrideTitle: "自作の単位の編集",
    backupCustomUnitOverrideWarning: "このバックアップには、いま端末にあるものと定義が異なる自作の単位が{count}件含まれます。取り込むと上書きされます。",
    backupCustomUnitsImported: "自作の単位を{count}件読み込みました。",
    backupConstantsTitle: "グローバル定数",
    backupConstantsExport: "書き出す",
    backupConstantsMerge: "追加・同名は置換",
    backupConstantsReplace: "すべての定数を置換",
    backupConstantsClearAll: "すべて消去",
    backupConstantsRestore: "復活",
    backupConstantsExportDone: "定数バックアップを書き出しました。",
    backupConstantsImportDone: "{count}件の定数を読み込みました。",
    backupConstantsClearConfirm: "保存済みの定数をすべて消去しますか？直前に消去した一覧は復活できます。",
    backupConstantsCleared: "定数を消去しました。この端末上で復活できます。",
    backupConstantsRestored: "消去した定数を復活しました。",
    backupConstantsReplaceConfirm: "保存済みの定数をすべて、このファイルの内容へ置き換えますか？元に戻せません。",
    backupGenericError: "エラーが発生しました。もう一度お試しください。",
  },
  es: {
    calculator: "Calculadora de unidades",
    calculatorSubtitle: "Calcula en unidades del SI. Se muestra en unidades compatibles.",
    notebook: "Cuadernos",
    constants: "Biblioteca",
    pro: "Pro",
    examples: "Empezar con ejemplos",
    examplesHint: "Elige un ejemplo para cargar la expresión, la unidad de visualización y el resultado.",
    expression: "Expresión",
    expressionHint: "Admite ×, ÷, paréntesis, constantes y funciones matemáticas avanzadas",
    result: "Resultado",
    displayUnit: "Unidad de visualización",
    compatibleOnly: "Solo se muestran unidades con la misma dimensión.",
    enterUnit: "Introducir una unidad",
    enterUnitHint: "Elige una categoría y luego toca una unidad para añadirla a la expresión.",
    settings: "Preferencias",
    settingsSubtitle: "Idioma, unidades regionales y opciones de visualización accesibles.",
    language: "Idioma de la app",
    units: "Sistema de unidades preferido",
    systemMetric: "Métrico",
    systemUS: "Habitual de EE. UU.",
    systemUK: "Imperial / Reino Unido",
    systemHint: "Tu preferencia prioriza unidades familiares sin afectar la precisión de los cálculos en el SI.",
    theme: "Apariencia",
    themeSystem: "Sistema",
    themeLight: "Claro",
    themeDark: "Oscuro",
    themeHint: "Elige Claro u Oscuro para anular el ajuste de tu dispositivo, o sigue el del sistema.",
    adsTitle: "Anuncios",
    adsHint: "La versión gratuita muestra un pequeño anuncio en banner. Actualiza a Pro, o introduce un código, para quitarlo.",
    adsFreeActive: "Los anuncios están ocultos.",
    adsUpgrade: "Ver planes Pro",
    adsRedeemPlaceholder: "Introduce un código",
    adsRedeemButton: "Aplicar",
    accessibility: "Accesibilidad integrada",
    accessibilityHint: "Las etiquetas de VoiceOver y TalkBack describen los controles; el texto sigue el tamaño configurado en tu dispositivo.",
    region: "Región",
    saved: "Guardado",
    measuringStandard: "Estándar de taza y cuchara",
    measuringStandardHint: "Define el tamaño real que se usa para taza, cucharada y cucharadita en toda la app.",
    standardUS: "Habitual de EE. UU. (taza ≈ 236,6 mL)",
    standardJIS: "Norma JIS de Japón (taza = 200 mL)",
    customUnits: "Unidades personalizadas",
    customUnitsHint: "Define tu propia unidad como múltiplo (0.303m) o como fórmula en x ((x-32)*5/9*K + 273.15*K). No se aceptan símbolos que ya usen las unidades integradas.",
    customUnitSymbolPlaceholder: "Símbolo",
    customUnitDefinitionPlaceholder: "Definición",
    customUnitAdd: "Añadir",
    customUnitDelete: "Eliminar",
    customUnitEmpty: "Aún no hay unidades personalizadas.",
    customUnitSaveFailed: "No se pudo guardar la unidad personalizada en este dispositivo.",
    resetPresetsTitle: "Restablecer cuadernos preestablecidos",
    resetPresetsHint: "Restaura todos los cuadernos integrados a sus valores originales, descartando cualquier edición que hayas hecho en ellos. No afecta a los cuadernos que creaste tú mismo.",
    resetPresetsButton: "Restablecer preestablecidos",
    resetPresetsConfirmMessage: "Esto restaura todos los cuadernos integrados (preestablecidos) a sus valores originales, descartando cualquier edición que hayas hecho en ellos. Los cuadernos que creaste tú mismo se conservan y no se ven afectados. Esta acción no se puede deshacer.",
    resetPresetsDone: "Se restablecieron los cuadernos preestablecidos.",
    cancel: "Cancelar",
    backupNotebooksTitle: "Cuadernos",
    backupNotebooksExportAll: "Exportar todo",
    backupNotebooksMerge: "Combinar y reemplazar coincidencias",
    backupNotebooksReplace: "Reemplazar todos los cuadernos",
    backupNotebooksExportDone: "Se exportó la copia de seguridad de los cuadernos.",
    backupNotebooksImportDone: "Se importaron {count} cuadernos.",
    backupNotebooksReplaceConfirm: "¿Reemplazar todos tus cuadernos por los de este archivo? Los cuadernos preestablecidos se conservan. Esta acción no se puede deshacer.",
    backupPresetOverrideTitle: "Ediciones de cuadernos preestablecidos",
    backupPresetOverrideWarning: "Esta copia de seguridad incluye ediciones de {count} cuadernos preestablecidos. Al importar, se sobrescribirá el contenido que hay ahora en este dispositivo.",
    backupImportContinue: "Importar",
    backupPresetOverridesApplied: "Se aplicaron {count} ediciones de cuadernos preestablecidos.",
    backupCustomUnitOverrideTitle: "Ediciones de unidades personalizadas",
    backupCustomUnitOverrideWarning: "Esta copia de seguridad incluye {count} unidades personalizadas que difieren de las que hay en este dispositivo. Al importar, se sobrescribirán.",
    backupCustomUnitsImported: "Se importaron {count} unidades personalizadas.",
    backupConstantsTitle: "Constantes globales",
    backupConstantsExport: "Exportar",
    backupConstantsMerge: "Combinar y reemplazar coincidencias",
    backupConstantsReplace: "Reemplazar todas las constantes",
    backupConstantsClearAll: "Borrar todo",
    backupConstantsRestore: "Restaurar",
    backupConstantsExportDone: "Se exportó la copia de seguridad de las constantes.",
    backupConstantsImportDone: "Se importaron {count} constantes.",
    backupConstantsClearConfirm: "¿Borrar todas las constantes guardadas? Podrás restaurar el último conjunto borrado.",
    backupConstantsCleared: "Constantes borradas. Puedes restaurarlas desde este dispositivo.",
    backupConstantsRestored: "Se restauraron las constantes borradas.",
    backupConstantsReplaceConfirm: "¿Reemplazar todas las constantes guardadas por las de este archivo? Esta acción no se puede deshacer.",
    backupGenericError: "Ocurrió un error. Inténtalo de nuevo.",
  },
  "pt-BR": {
    calculator: "Calculadora de unidades",
    calculatorSubtitle: "Calcula no SI. Exibe em unidades compatíveis.",
    notebook: "Cadernos",
    constants: "Biblioteca",
    pro: "Pro",
    examples: "Comece com exemplos",
    examplesHint: "Escolha um exemplo para carregar a expressão, a unidade de exibição e o resultado.",
    expression: "Expressão",
    expressionHint: "Compatível com ×, ÷, parênteses, constantes e funções matemáticas avançadas",
    result: "Resultado",
    displayUnit: "Unidade de exibição",
    compatibleOnly: "Somente unidades com a mesma dimensão são exibidas.",
    enterUnit: "Inserir uma unidade",
    enterUnitHint: "Escolha uma categoria e depois toque em uma unidade para adicioná-la à expressão.",
    settings: "Preferências",
    settingsSubtitle: "Idioma, unidades regionais e opções de exibição acessíveis.",
    language: "Idioma do app",
    units: "Sistema de unidades preferido",
    systemMetric: "Métrico",
    systemUS: "Costumeiro dos EUA",
    systemUK: "Imperial / Reino Unido",
    systemHint: "Sua preferência prioriza unidades familiares sem alterar a precisão dos cálculos no SI.",
    theme: "Aparência",
    themeSystem: "Sistema",
    themeLight: "Claro",
    themeDark: "Escuro",
    themeHint: "Escolha Claro ou Escuro para substituir a configuração do dispositivo, ou siga o Sistema.",
    adsTitle: "Anúncios",
    adsHint: "A versão gratuita exibe um pequeno banner de anúncio. Faça upgrade para o Pro, ou insira um código, para removê-lo.",
    adsFreeActive: "Os anúncios estão ocultos.",
    adsUpgrade: "Ver planos Pro",
    adsRedeemPlaceholder: "Digite um código",
    adsRedeemButton: "Aplicar",
    accessibility: "Acessibilidade nativa",
    accessibilityHint: "Os rótulos do VoiceOver e do TalkBack descrevem os controles; o texto acompanha o tamanho definido no seu dispositivo.",
    region: "Região",
    saved: "Salvo",
    measuringStandard: "Padrão de xícara e colher",
    measuringStandardHint: "Define o tamanho real usado para xícara, colher de sopa e colher de chá em todo o app.",
    standardUS: "Padrão dos EUA (xícara ≈ 236,6 mL)",
    standardJIS: "Norma JIS do Japão (xícara = 200 mL)",
    customUnits: "Unidades personalizadas",
    customUnitsHint: "Defina sua própria unidade como múltiplo (0.303m) ou como fórmula em x ((x-32)*5/9*K + 273.15*K). Símbolos já usados por unidades integradas não são aceitos.",
    customUnitSymbolPlaceholder: "Símbolo",
    customUnitDefinitionPlaceholder: "Definição",
    customUnitAdd: "Adicionar",
    customUnitDelete: "Excluir",
    customUnitEmpty: "Ainda não há unidades personalizadas.",
    customUnitSaveFailed: "Não foi possível salvar a unidade personalizada neste dispositivo.",
    resetPresetsTitle: "Redefinir cadernos predefinidos",
    resetPresetsHint: "Restaura todos os cadernos embutidos aos valores originais, descartando qualquer edição feita neles. Os cadernos que você mesmo criou não são afetados.",
    resetPresetsButton: "Redefinir predefinidos",
    resetPresetsConfirmMessage: "Isso restaura todos os cadernos embutidos (predefinidos) aos valores originais, descartando qualquer edição feita neles. Os cadernos que você mesmo criou são mantidos e não são afetados. Isso não pode ser desfeito.",
    resetPresetsDone: "Os cadernos predefinidos foram redefinidos.",
    cancel: "Cancelar",
    backupNotebooksTitle: "Cadernos",
    backupNotebooksExportAll: "Exportar tudo",
    backupNotebooksMerge: "Mesclar e substituir coincidências",
    backupNotebooksReplace: "Substituir todos os cadernos",
    backupNotebooksExportDone: "Backup dos cadernos exportado.",
    backupNotebooksImportDone: "{count} cadernos importados.",
    backupNotebooksReplaceConfirm: "Substituir todos os seus cadernos pelos deste arquivo? Os cadernos predefinidos são mantidos. Isso não pode ser desfeito.",
    backupPresetOverrideTitle: "Edições de cadernos predefinidos",
    backupPresetOverrideWarning: "Este backup inclui edições em {count} cadernos predefinidos. A importação substituirá o conteúdo atual deste aparelho.",
    backupImportContinue: "Importar",
    backupPresetOverridesApplied: "{count} edições de cadernos predefinidos aplicadas.",
    backupCustomUnitOverrideTitle: "Edições de unidades personalizadas",
    backupCustomUnitOverrideWarning: "Este backup inclui {count} unidades personalizadas que diferem das existentes neste aparelho. A importação as substituirá.",
    backupCustomUnitsImported: "{count} unidades personalizadas importadas.",
    backupConstantsTitle: "Constantes globais",
    backupConstantsExport: "Exportar",
    backupConstantsMerge: "Mesclar e substituir coincidências",
    backupConstantsReplace: "Substituir todas as constantes",
    backupConstantsClearAll: "Limpar tudo",
    backupConstantsRestore: "Restaurar",
    backupConstantsExportDone: "Backup das constantes exportado.",
    backupConstantsImportDone: "{count} constantes importadas.",
    backupConstantsClearConfirm: "Limpar todas as constantes salvas? Você pode restaurar o último conjunto limpo.",
    backupConstantsCleared: "Constantes limpas. Você pode restaurá-las neste dispositivo.",
    backupConstantsRestored: "Constantes limpas restauradas.",
    backupConstantsReplaceConfirm: "Substituir todas as constantes salvas pelas deste arquivo? Isso não pode ser desfeito.",
    backupGenericError: "Ocorreu um erro. Tente novamente.",
  },
  de: {
    calculator: "Einheitenrechner",
    calculatorSubtitle: "Berechnung im SI-System. Anzeige in kompatiblen Einheiten.",
    notebook: "Rechenhefte",
    constants: "Bibliothek",
    pro: "Pro",
    examples: "Mit Beispielen starten",
    examplesHint: "Wähle ein Beispiel, um Ausdruck, Anzeigeeinheit und Ergebnis zu laden.",
    expression: "Ausdruck",
    expressionHint: "Unterstützt ×, ÷, Klammern, Konstanten und höhere Mathematik",
    result: "Ergebnis",
    displayUnit: "Anzeigeeinheit",
    compatibleOnly: "Es werden nur Einheiten mit derselben Dimension angezeigt.",
    enterUnit: "Einheit eingeben",
    enterUnitHint: "Wähle eine Kategorie und tippe dann auf eine Einheit, um sie dem Ausdruck hinzuzufügen.",
    settings: "Einstellungen",
    settingsSubtitle: "Sprache, regionale Einheiten und gut lesbare Anzeigeoptionen.",
    language: "App-Sprache",
    units: "Bevorzugtes Einheitensystem",
    systemMetric: "Metrisch",
    systemUS: "US-üblich",
    systemUK: "Imperial / UK",
    systemHint: "Deine Einstellung bevorzugt vertraute Einheiten, ohne die Genauigkeit der SI-Berechnung zu ändern.",
    theme: "Erscheinungsbild",
    themeSystem: "System",
    themeLight: "Hell",
    themeDark: "Dunkel",
    themeHint: "Wähle Hell oder Dunkel, um die Geräteeinstellung zu überschreiben, oder folge dem System.",
    adsTitle: "Werbung",
    adsHint: "Die kostenlose Version zeigt ein kleines Werbebanner. Upgrade auf Pro oder gib einen Code ein, um es zu entfernen.",
    adsFreeActive: "Werbung ist ausgeblendet.",
    adsUpgrade: "Pro-Pläne ansehen",
    adsRedeemPlaceholder: "Code eingeben",
    adsRedeemButton: "Anwenden",
    accessibility: "Barrierefreiheit von Grund auf",
    accessibilityHint: "VoiceOver- und TalkBack-Beschriftungen beschreiben die Bedienelemente; der Text folgt der Textgrößeneinstellung deines Geräts.",
    region: "Region",
    saved: "Gespeichert",
    measuringStandard: "Tassen- und Löffelstandard",
    measuringStandardHint: "Legt die tatsächliche Größe fest, die überall in der App für Tasse, Esslöffel und Teelöffel verwendet wird.",
    standardUS: "US-Standard (Tasse ≈ 236,6 mL)",
    standardJIS: "Japanischer JIS-Standard (Tasse = 200 mL)",
    customUnits: "Eigene Einheiten",
    customUnitsHint: "Definiere eine eigene Einheit als Vielfaches (0.303m) oder als Formel in x ((x-32)*5/9*K + 273.15*K). Symbole, die integrierte Einheiten bereits verwenden, sind nicht zulässig.",
    customUnitSymbolPlaceholder: "Symbol",
    customUnitDefinitionPlaceholder: "Definition",
    customUnitAdd: "Hinzufügen",
    customUnitDelete: "Löschen",
    customUnitEmpty: "Noch keine eigenen Einheiten.",
    customUnitSaveFailed: "Die eigene Einheit konnte auf diesem Gerät nicht gespeichert werden.",
    resetPresetsTitle: "Vordefinierte Rechenhefte zurücksetzen",
    resetPresetsHint: "Setzt alle integrierten Rechenhefte auf ihre ursprünglichen Werte zurück und verwirft alle Bearbeitungen, die du daran vorgenommen hast. Rechenhefte, die du selbst erstellt hast, sind davon nicht betroffen.",
    resetPresetsButton: "Vordefinierte zurücksetzen",
    resetPresetsConfirmMessage: "Dadurch werden alle integrierten (vordefinierten) Rechenhefte auf ihre ursprünglichen Standardwerte zurückgesetzt, wodurch alle Bearbeitungen, die du daran vorgenommen hast, verworfen werden. Rechenhefte, die du selbst erstellt hast, bleiben erhalten und sind davon nicht betroffen. Das kann nicht rückgängig gemacht werden.",
    resetPresetsDone: "Die vordefinierten Rechenhefte wurden zurückgesetzt.",
    cancel: "Abbrechen",
    backupNotebooksTitle: "Rechenhefte",
    backupNotebooksExportAll: "Alles exportieren",
    backupNotebooksMerge: "Zusammenführen, Übereinstimmungen ersetzen",
    backupNotebooksReplace: "Alle Rechenhefte ersetzen",
    backupNotebooksExportDone: "Sicherung der Rechenhefte exportiert.",
    backupNotebooksImportDone: "{count} Rechenhefte importiert.",
    backupNotebooksReplaceConfirm: "Alle deine Rechenhefte durch die aus dieser Datei ersetzen? Vordefinierte Rechenhefte bleiben erhalten. Das kann nicht rückgängig gemacht werden.",
    backupPresetOverrideTitle: "Bearbeitungen an vordefinierten Rechenheften",
    backupPresetOverrideWarning: "Dieses Backup enthält Bearbeitungen an {count} vordefinierten Rechenheften. Beim Importieren wird der aktuelle Inhalt auf diesem Gerät überschrieben.",
    backupImportContinue: "Importieren",
    backupPresetOverridesApplied: "{count} Bearbeitungen an vordefinierten Rechenheften übernommen.",
    backupCustomUnitOverrideTitle: "Bearbeitungen an eigenen Einheiten",
    backupCustomUnitOverrideWarning: "Dieses Backup enthält {count} eigene Einheiten, die sich von denen auf diesem Gerät unterscheiden. Beim Importieren werden sie überschrieben.",
    backupCustomUnitsImported: "{count} eigene Einheiten importiert.",
    backupConstantsTitle: "Globale Konstanten",
    backupConstantsExport: "Exportieren",
    backupConstantsMerge: "Zusammenführen, Übereinstimmungen ersetzen",
    backupConstantsReplace: "Alle Konstanten ersetzen",
    backupConstantsClearAll: "Alle löschen",
    backupConstantsRestore: "Wiederherstellen",
    backupConstantsExportDone: "Sicherung der Konstanten exportiert.",
    backupConstantsImportDone: "{count} Konstanten importiert.",
    backupConstantsClearConfirm: "Alle gespeicherten Konstanten löschen? Der zuletzt gelöschte Satz kann wiederhergestellt werden.",
    backupConstantsCleared: "Konstanten gelöscht. Du kannst sie auf diesem Gerät wiederherstellen.",
    backupConstantsRestored: "Gelöschte Konstanten wiederhergestellt.",
    backupConstantsReplaceConfirm: "Alle gespeicherten Konstanten durch die aus dieser Datei ersetzen? Das kann nicht rückgängig gemacht werden.",
    backupGenericError: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
  },
  fr: {
    calculator: "Calculatrice d'unités",
    calculatorSubtitle: "Calcule en unités SI. Affiche dans des unités compatibles.",
    notebook: "Carnets",
    constants: "Bibliothèque",
    pro: "Pro",
    examples: "Commencer avec des exemples",
    examplesHint: "Choisis un exemple pour charger l'expression, l'unité d'affichage et le résultat.",
    expression: "Expression",
    expressionHint: "Prend en charge ×, ÷, les parenthèses, les constantes et les fonctions mathématiques avancées",
    result: "Résultat",
    displayUnit: "Unité d'affichage",
    compatibleOnly: "Seules les unités de même dimension sont affichées.",
    enterUnit: "Saisir une unité",
    enterUnitHint: "Choisis une catégorie, puis touche une unité pour l'ajouter à l'expression.",
    settings: "Préférences",
    settingsSubtitle: "Langue, unités régionales et options d'affichage accessibles.",
    language: "Langue de l'app",
    units: "Système d'unités préféré",
    systemMetric: "Métrique",
    systemUS: "Coutumier américain",
    systemUK: "Impérial / Royaume-Uni",
    systemHint: "Ta préférence privilégie des unités familières sans changer la précision des calculs en SI.",
    theme: "Apparence",
    themeSystem: "Système",
    themeLight: "Clair",
    themeDark: "Sombre",
    themeHint: "Choisis Clair ou Sombre pour remplacer le réglage de ton appareil, ou suis le système.",
    adsTitle: "Publicités",
    adsHint: "La version gratuite affiche une petite bannière publicitaire. Passe à Pro, ou saisis un code, pour la retirer.",
    adsFreeActive: "Les publicités sont masquées.",
    adsUpgrade: "Voir les offres Pro",
    adsRedeemPlaceholder: "Saisir un code",
    adsRedeemButton: "Appliquer",
    accessibility: "Accessibilité intégrée",
    accessibilityHint: "Les libellés VoiceOver et TalkBack décrivent les commandes ; le texte suit les réglages de taille de ton appareil.",
    region: "Région",
    saved: "Enregistré",
    measuringStandard: "Norme de tasse et cuillère",
    measuringStandardHint: "Définit la contenance réelle utilisée pour tasse, cuillère à soupe et cuillère à café dans toute l'app.",
    standardUS: "Norme américaine (tasse ≈ 236,6 mL)",
    standardJIS: "Norme JIS japonaise (tasse = 200 mL)",
    customUnits: "Unités personnalisées",
    customUnitsHint: "Définissez votre propre unité comme multiple (0.303m) ou comme formule en x ((x-32)*5/9*K + 273.15*K). Les symboles déjà utilisés par les unités intégrées ne sont pas acceptés.",
    customUnitSymbolPlaceholder: "Symbole",
    customUnitDefinitionPlaceholder: "Définition",
    customUnitAdd: "Ajouter",
    customUnitDelete: "Supprimer",
    customUnitEmpty: "Aucune unité personnalisée pour l'instant.",
    customUnitSaveFailed: "Impossible d'enregistrer l'unité personnalisée sur cet appareil.",
    resetPresetsTitle: "Réinitialiser les carnets prédéfinis",
    resetPresetsHint: "Restaure tous les carnets intégrés à leurs valeurs d'origine, en annulant les modifications que tu y as apportées. Les carnets que tu as créés toi-même ne sont pas concernés.",
    resetPresetsButton: "Réinitialiser les prédéfinis",
    resetPresetsConfirmMessage: "Cela restaure tous les carnets intégrés (prédéfinis) à leurs valeurs d'origine, en annulant les modifications que tu y as apportées. Les carnets que tu as créés toi-même sont conservés et ne sont pas concernés. Cette action est irréversible.",
    resetPresetsDone: "Les carnets prédéfinis ont été réinitialisés.",
    cancel: "Annuler",
    backupNotebooksTitle: "Carnets",
    backupNotebooksExportAll: "Tout exporter",
    backupNotebooksMerge: "Fusionner et remplacer les correspondances",
    backupNotebooksReplace: "Remplacer tous les carnets",
    backupNotebooksExportDone: "Sauvegarde des carnets exportée.",
    backupNotebooksImportDone: "{count} carnets importés.",
    backupNotebooksReplaceConfirm: "Remplacer tous vos carnets par ceux de ce fichier ? Les carnets prédéfinis sont conservés. Cette action est irréversible.",
    backupPresetOverrideTitle: "Modifications de carnets prédéfinis",
    backupPresetOverrideWarning: "Cette sauvegarde contient des modifications de {count} carnets prédéfinis. L'importation écrasera leur contenu actuel sur cet appareil.",
    backupImportContinue: "Importer",
    backupPresetOverridesApplied: "{count} modifications de carnets prédéfinis appliquées.",
    backupCustomUnitOverrideTitle: "Modifications d'unités personnalisées",
    backupCustomUnitOverrideWarning: "Cette sauvegarde contient {count} unités personnalisées qui diffèrent de celles présentes sur cet appareil. L'importation les écrasera.",
    backupCustomUnitsImported: "{count} unités personnalisées importées.",
    backupConstantsTitle: "Constantes globales",
    backupConstantsExport: "Exporter",
    backupConstantsMerge: "Fusionner et remplacer les correspondances",
    backupConstantsReplace: "Remplacer toutes les constantes",
    backupConstantsClearAll: "Tout effacer",
    backupConstantsRestore: "Restaurer",
    backupConstantsExportDone: "Sauvegarde des constantes exportée.",
    backupConstantsImportDone: "{count} constantes importées.",
    backupConstantsClearConfirm: "Effacer toutes les constantes enregistrées ? Vous pourrez restaurer le dernier ensemble effacé.",
    backupConstantsCleared: "Constantes effacées. Vous pouvez les restaurer depuis cet appareil.",
    backupConstantsRestored: "Constantes effacées restaurées.",
    backupConstantsReplaceConfirm: "Remplacer toutes les constantes enregistrées par celles de ce fichier ? Cette action est irréversible.",
    backupGenericError: "Une erreur est survenue. Veuillez réessayer.",
  },
};

// lib/units.ts の BASE_UNIT_GROUPS（18グループ）と1対1で揃える必要がある。
// キーが欠けると unitGroupLabel が生の group id をそのままUIに出してしまう
// （実際に amount が抜けていて "amount" という文字列が表示されるバグがあった）。
const GROUP_NAMES: Record<string, Record<AppLanguage, string>> = {
  length: { en: "Length", ja: "長さ", es: "Longitud", "pt-BR": "Comprimento", de: "Länge", fr: "Longueur" },
  area: { en: "Area", ja: "面積", es: "Área", "pt-BR": "Área", de: "Fläche", fr: "Superficie" },
  volume: { en: "Volume", ja: "体積", es: "Volumen", "pt-BR": "Volume", de: "Volumen", fr: "Volume" },
  time: { en: "Time", ja: "時間", es: "Tiempo", "pt-BR": "Tempo", de: "Zeit", fr: "Temps" },
  mass: { en: "Mass", ja: "質量", es: "Masa", "pt-BR": "Massa", de: "Masse", fr: "Masse" },
  temperature: { en: "Temperature", ja: "温度", es: "Temperatura", "pt-BR": "Temperatura", de: "Temperatur", fr: "Température" },
  velocity: { en: "Speed", ja: "速度", es: "Velocidad", "pt-BR": "Velocidade", de: "Geschwindigkeit", fr: "Vitesse" },
  acceleration: { en: "Acceleration", ja: "加速度", es: "Aceleración", "pt-BR": "Aceleração", de: "Beschleunigung", fr: "Accélération" },
  force: { en: "Force", ja: "力", es: "Fuerza", "pt-BR": "Força", de: "Kraft", fr: "Force" },
  pressure: { en: "Pressure", ja: "圧力", es: "Presión", "pt-BR": "Pressão", de: "Druck", fr: "Pression" },
  energy: { en: "Energy", ja: "エネルギー", es: "Energía", "pt-BR": "Energia", de: "Energie", fr: "Énergie" },
  power: { en: "Power", ja: "電力", es: "Potencia", "pt-BR": "Potência", de: "Leistung", fr: "Puissance" },
  current: { en: "Current", ja: "電流", es: "Corriente", "pt-BR": "Corrente", de: "Stromstärke", fr: "Courant" },
  voltage: { en: "Voltage", ja: "電圧", es: "Voltaje", "pt-BR": "Tensão", de: "Spannung", fr: "Tension" },
  frequency: { en: "Frequency", ja: "周波数", es: "Frecuencia", "pt-BR": "Frequência", de: "Frequenz", fr: "Fréquence" },
  angle: { en: "Angle", ja: "角度", es: "Ángulo", "pt-BR": "Ângulo", de: "Winkel", fr: "Angle" },
  ratio: { en: "Ratio", ja: "割合・無次元", es: "Proporción", "pt-BR": "Razão", de: "Verhältnis", fr: "Rapport" },
  amount: { en: "Amount of substance", ja: "物質量", es: "Cantidad de sustancia", "pt-BR": "Quantidade de matéria", de: "Stoffmenge", fr: "Quantité de matière" },
};

const GlobalSettingsContext = createContext<GlobalSettings | null>(null);

function defaultMeasuringStandard(language: AppLanguage): MeasuringStandard {
  return language === "ja" ? "jis" : "us";
}

function defaultUnitSystem(locale: Localization.Locale | undefined): UnitSystem {
  if (locale?.measurementSystem === "us") return "us";
  if (locale?.measurementSystem === "uk") return "uk";
  if (locale?.regionCode === "US") return "us";
  if (locale?.regionCode === "GB") return "uk";
  return "metric";
}

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const deviceLocale = Localization.useLocales()[0];
  const defaultLanguage: AppLanguage = resolveDeviceLanguage(deviceLocale?.languageTag, deviceLocale?.languageCode);
  const [language, setLanguageState] = useState<AppLanguage>(defaultLanguage);
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => defaultUnitSystem(deviceLocale));
  const [measuringStandard, setMeasuringStandardState] = useState<MeasuringStandard>(() => defaultMeasuringStandard(defaultLanguage));
  const [isReady, setIsReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // lib/units.ts はモジュール内の可変状態でcup/tbsp/tspの値を持つため、Reactのstateより先に
    // （同じ関数の中で）反映させる。useEffectの依存配列経由で追従させると1回分遅れて反映される。
    applyMeasuringStandard(defaultMeasuringStandard(defaultLanguage));

    Promise.all([AsyncStorage.getItem(LANGUAGE_KEY), AsyncStorage.getItem(UNIT_SYSTEM_KEY), AsyncStorage.getItem(ONBOARDING_SEEN_KEY), AsyncStorage.getItem(MEASURING_STANDARD_KEY)])
      .then(([storedLanguage, storedUnitSystem, storedOnboardingSeen, storedMeasuringStandard]) => {
        const resolvedLanguage = isAppLanguage(storedLanguage) ? storedLanguage : defaultLanguage;
        if (isAppLanguage(storedLanguage)) setLanguageState(storedLanguage);
        if (storedUnitSystem === "metric" || storedUnitSystem === "us" || storedUnitSystem === "uk") setUnitSystemState(storedUnitSystem);
        if (storedOnboardingSeen === "true") setHasSeenOnboarding(true);
        const resolvedStandard = storedMeasuringStandard === "us" || storedMeasuringStandard === "jis" ? storedMeasuringStandard : defaultMeasuringStandard(resolvedLanguage);
        applyMeasuringStandard(resolvedStandard);
        setMeasuringStandardState(resolvedStandard);
      })
      .catch(() => undefined)
      .finally(() => setIsReady(true));
  }, [defaultLanguage]);

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage);
  }, []);

  const setUnitSystem = useCallback(async (nextSystem: UnitSystem) => {
    setUnitSystemState(nextSystem);
    await AsyncStorage.setItem(UNIT_SYSTEM_KEY, nextSystem);
  }, []);

  const setMeasuringStandard = useCallback(async (nextStandard: MeasuringStandard) => {
    applyMeasuringStandard(nextStandard);
    setMeasuringStandardState(nextStandard);
    await AsyncStorage.setItem(MEASURING_STANDARD_KEY, nextStandard);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
  }, []);

  // 端末のlanguageTagが選択中の言語と同じ言語コードなら、それをそのまま使う
  // （例: 選択言語が"en"で端末が"en-GB"/"en-AU"なら地域差のある実際のタグを尊重する）。
  // 一致しない場合はLANGUAGE_METAのデフォルトロケールにフォールバックする。
  // 比較は必ず「両側の言語コード部分」で行う。選択言語側にも pt-BR のように地域が付くことが
  // あるため、選択言語をそのまま比べると pt-BR を選んだ端末の pt-PT / pt-BR が一致せず、
  // 数値の地域差(小数点・桁区切り)が既定ロケールに落ちてしまう。
  const deviceLanguageTag = deviceLocale?.languageTag;
  const deviceLanguageCode = deviceLanguageTag?.split("-")[0]?.toLowerCase();
  const selectedLanguageCode = language.split("-")[0].toLowerCase();
  const locale = deviceLanguageTag && deviceLanguageCode === selectedLanguageCode ? deviceLanguageTag : LANGUAGE_META[language].locale;
  const currencyCode = deviceLocale?.currencyCode ?? null;
  const regionCode = deviceLocale?.regionCode ?? null;
  const value = useMemo<GlobalSettings>(() => ({
    language,
    locale,
    currencyCode,
    regionCode,
    unitSystem,
    measuringStandard,
    isReady,
    hasSeenOnboarding,
    setLanguage,
    setUnitSystem,
    setMeasuringStandard,
    completeOnboarding,
    t: (key) => COPY[language][key],
    unitGroupLabel: (groupId) => GROUP_NAMES[groupId]?.[language] ?? groupId,
  }), [completeOnboarding, currencyCode, hasSeenOnboarding, isReady, language, locale, measuringStandard, regionCode, setLanguage, setMeasuringStandard, setUnitSystem, unitSystem]);

  return <GlobalSettingsContext.Provider value={value}>{children}</GlobalSettingsContext.Provider>;
}

export function useGlobalSettings() {
  const value = useContext(GlobalSettingsContext);
  if (!value) throw new Error("GlobalSettingsProvider の内部で使用してください。");
  return value;
}
