import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { NotebookCategoryGrid } from "@/components/notebooks/notebook-category-grid";
import { NotebookDetail } from "@/components/notebooks/notebook-detail";
import { NotebookList } from "@/components/notebooks/notebook-list";
import { ScreenContainer } from "@/components/screen-container";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LatexView } from "@/components/ui/latex-view";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type ImportedConstant } from "@/lib/constants-backup";
import { exportConstantsBackup, pickConstantsBackup } from "@/lib/constants-backup-file";
import {
  type CalculationNotebook,
  type CalculationNoteStep,
  type NotebookFormula,
  type NotebookLocalConstant,
  UNCATEGORIZED_CATEGORY_ID,
  useCalculatorStore,
} from "@/lib/calculator-store";
import { FORMULA_CHARACTER_GROUPS } from "@/lib/formula-characters";
import { useGlobalSettings } from "@/lib/global-settings";
import { localizedText, type AppLanguage } from "@/lib/i18n";
import { formatNameValue, normalizeStepForSave, parseNameValue } from "@/lib/notebook-engine";
import { clampSelectionRange, getLocalConstantFieldSuggestions, getStepFieldSuggestions, insertConstantSymbol } from "@/lib/notebook-constant-suggestions";
import { PRESET_NOTEBOOK_CATEGORIES } from "@/lib/notebook-formulas";
import { nextStepNamePatch } from "@/lib/notebook-step-title";
import { type ImportedNotebook } from "@/lib/notebooks-backup";
import { exportNotebooksBackup, pickNotebooksBackup } from "@/lib/notebooks-backup-file";
import { unitErrorMessage } from "@/lib/unit-errors";
import { formatQuantity, SavedConstant } from "@/lib/units";

type TopSection = "notebooks" | "constants";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

let localConstantSeq = 0;
let stepSeq = 0;
let formulaSeq = 0;
const nextLocalConstantId = () => `local-${Date.now()}-${localConstantSeq++}`;
const nextStepId = () => `step-${Date.now()}-${stepSeq++}`;
const nextFormulaId = () => `formula-${Date.now()}-${formulaSeq++}`;

// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_COPY = {
  title: "Library", subtitle: "Save reusable calculation notebooks and global constants on this device.",
  notebooksTab: "Notebooks", constantsTab: "Global constants",
  add: "Add", close: "Close", save: "Save", saving: "Saving…", delete: "Delete", cancel: "Cancel",
  constantEmpty: "No constants yet", constantEmptyHint: "Store a reusable value such as W = 3cm.",
  titleLabel: "Name", descriptionLabel: "Description", expressionLabel: "Expression", symbolLabel: "Symbol",
  constantEditor: "Constant",
  deleteConfirm: "Delete this item? This cannot be undone.", validation: "Please fill in the required fields.",
  backup: "Backup", export: "Export", clearAll: "Clear all", restore: "Restore",
  exportDone: "Constants backup exported.",
  merge: "Merge and replace matches", replace: "Replace all constants", importDone: "{count} constants imported.",
  clearConfirm: "Clear all saved constants? You can restore the latest cleared set.",
  cleared: "Constants cleared. You can restore them from this device.", restored: "Cleared constants restored.",
  replaceImportConfirm: "Replace all saved constants with the ones in this file? This cannot be undone.",
  notebookNew: "New notebook", notebookEdit: "Edit notebook", notebookTitleLabel: "Title", notebookDescriptionLabel: "Description",
  category: "Category", newCategory: "New category", categoryName: "Category name", uncategorized: "Uncategorized",
  localConstants: "Local constants (inputs)", localConstantsHint: "Enter as name=value, e.g. v0=5m/s. Later rows can reference earlier ones.",
  invalidConstantName: "Enter each constant as name=value (e.g. v0=5m/s).",
  invalidStepName: "Enter each step as name=expression (e.g. v=v0+a*t), or remove the \"=\" to leave it unnamed.",
  addLocalConstant: "Add constant", steps: "Steps (results)", stepsHint: "Enter as name=expression, e.g. v=v0+a*t. Can reference constants and earlier steps.", addStep: "Add step", stepTitlePlaceholder: "v=v0+a*t",
  outputUnitLabel: "Display unit (optional)", removeRow: "Remove",
  formulaLatexPlaceholder: "Display formula, optional LaTeX (e.g. v = v_0 + at)",
  formulasLabel: "Formula explanations", formulasHint: "Optional. Add an explanation with its formula right below it; add as many pairs as you like.",
  addFormula: "Add formula", formulaExplanationPlaceholder: "Explanation (e.g. This gives the velocity)",
  notebookBackup: "Backup", notebookExport: "Export", notebookImportDone: "{count} notebooks imported.",
  notebookExportDone: "Notebooks backup exported.", notebookReplaceImportConfirm: "Replace all your notebooks with the ones in this file? Preset notebooks are kept. This cannot be undone.",
  notebookMerge: "Merge and replace matches", notebookReplace: "Replace all notebooks",
  notebookTitlePlaceholder: "Bending stress", notebookDescriptionPlaceholder: "Optional note",
  insert: "Insert", formulaCharactersLabel: "Symbols", definedVariablesLabel: "Defined variables",
  symbolGroupSubscriptDigits: "Subscript digits", symbolGroupSubscriptLetters: "Subscript letters", symbolGroupGreekLower: "Greek (lowercase)", symbolGroupGreekUpper: "Greek (uppercase)",
  resultTitleLabel: "Display title", resultTitlePlaceholder: "e.g. Velocity v",
} as const;
const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = {
  en: EN_COPY,
  ja: {
    title: "ライブラリ", subtitle: "よく使う計算ノート・グローバル定数を、この端末に保存して再利用できます。",
    notebooksTab: "計算ノート", constantsTab: "グローバル定数",
    add: "追加", close: "閉じる", save: "保存", saving: "保存中…", delete: "削除", cancel: "キャンセル",
    constantEmpty: "定数はまだありません", constantEmptyHint: "例：W = 3cm のように、よく使う値を保存できます。",
    titleLabel: "名前", descriptionLabel: "説明", expressionLabel: "式", symbolLabel: "記号",
    constantEditor: "定数",
    deleteConfirm: "この項目を削除しますか？元に戻せません。", validation: "必須項目を入力してください。",
    backup: "バックアップ", export: "書き出す", clearAll: "すべて消去", restore: "復活",
    exportDone: "定数バックアップを書き出しました。",
    merge: "追加・同名は置換", replace: "すべての定数を置換", importDone: "{count}件の定数を読み込みました。",
    clearConfirm: "保存済みの定数をすべて消去しますか？直前に消去した一覧は復活できます。",
    cleared: "定数を消去しました。この端末上で復活できます。", restored: "消去した定数を復活しました。",
    replaceImportConfirm: "保存済みの定数をすべて、このファイルの内容へ置き換えますか？元に戻せません。",
    notebookNew: "新しい計算ノート", notebookEdit: "計算ノートを編集", notebookTitleLabel: "タイトル", notebookDescriptionLabel: "説明",
    category: "カテゴリ", newCategory: "新しいカテゴリ", categoryName: "カテゴリ名", uncategorized: "未分類",
    localConstants: "ローカル定数（入力値）", localConstantsHint: "「名前＝値」の形で入力します。例：v0=5m/s。後の行で前の行を参照できます。",
    invalidConstantName: "定数は「名前＝値」の形式（例：v0=5m/s）で入力してください。",
    invalidStepName: "手順は「名前＝式」の形式（例：v=v0+a*t）で入力するか、「＝」を外して名前なしにしてください。",
    addLocalConstant: "定数を追加", steps: "手順（結果）", stepsHint: "「名前＝式」の形で入力します。例：v=v0+a*t。定数や前の手順を参照できます。", addStep: "手順を追加", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "表示単位（任意）", removeRow: "削除",
    formulaLatexPlaceholder: "表示用の数式（任意、LaTeX。例：v = v_0 + at）",
    formulasLabel: "数式の解説", formulasHint: "任意。説明文とその数式をペアで並べられます。説明文のすぐ下に数式を置き、ペアはいくつでも追加できます。",
    addFormula: "数式を追加", formulaExplanationPlaceholder: "説明文（例：速度を求める式です）",
    notebookBackup: "バックアップ", notebookExport: "書き出す", notebookImportDone: "{count}件の計算ノートを読み込みました。",
    notebookExportDone: "計算ノートのバックアップを書き出しました。", notebookReplaceImportConfirm: "自分の計算ノートをすべて、このファイルの内容へ置き換えますか？プリセットは残ります。元に戻せません。",
    notebookMerge: "追加・同名は置換", notebookReplace: "すべての計算ノートを置換",
    notebookTitlePlaceholder: "曲げ応力", notebookDescriptionPlaceholder: "任意のメモ",
    insert: "挿入", formulaCharactersLabel: "特殊記号", definedVariablesLabel: "定義済みの変数",
    symbolGroupSubscriptDigits: "下付き数字", symbolGroupSubscriptLetters: "下付き文字", symbolGroupGreekLower: "ギリシャ文字（小文字）", symbolGroupGreekUpper: "ギリシャ文字（大文字）",
    resultTitleLabel: "表示タイトル", resultTitlePlaceholder: "例：速度 v",
  },
  es: {
    title: "Biblioteca", subtitle: "Guarda cuadernos de cálculo reutilizables y constantes globales en este dispositivo.",
    notebooksTab: "Cuadernos", constantsTab: "Constantes globales",
    add: "Añadir", close: "Cerrar", save: "Guardar", saving: "Guardando…", delete: "Eliminar", cancel: "Cancelar",
    constantEmpty: "Aún no hay constantes", constantEmptyHint: "Guarda un valor reutilizable, por ejemplo W = 3cm.",
    titleLabel: "Nombre", descriptionLabel: "Descripción", expressionLabel: "Expresión", symbolLabel: "Símbolo",
    constantEditor: "Constante",
    deleteConfirm: "¿Eliminar este elemento? Esta acción no se puede deshacer.", validation: "Completa los campos obligatorios.",
    backup: "Copia de seguridad", export: "Exportar", clearAll: "Borrar todo", restore: "Restaurar",
    exportDone: "Se exportó la copia de seguridad de las constantes.",
    merge: "Combinar y reemplazar coincidencias", replace: "Reemplazar todas las constantes", importDone: "Se importaron {count} constantes.",
    clearConfirm: "¿Borrar todas las constantes guardadas? Podrás restaurar el último conjunto borrado.",
    cleared: "Constantes borradas. Puedes restaurarlas desde este dispositivo.", restored: "Se restauraron las constantes borradas.",
    replaceImportConfirm: "¿Reemplazar todas las constantes guardadas por las de este archivo? Esta acción no se puede deshacer.",
    notebookNew: "Nuevo cuaderno", notebookEdit: "Editar cuaderno", notebookTitleLabel: "Título", notebookDescriptionLabel: "Descripción",
    category: "Categoría", newCategory: "Nueva categoría", categoryName: "Nombre de la categoría", uncategorized: "Sin categoría",
    localConstants: "Constantes locales (entradas)", localConstantsHint: "Escribe cada una como nombre=valor, por ejemplo v0=5m/s. Las filas siguientes pueden usar las anteriores.",
    invalidConstantName: "Escribe cada constante como nombre=valor (por ejemplo, v0=5m/s).",
    invalidStepName: "Escribe cada paso como nombre=expresión (por ejemplo, v=v0+a*t), o quita el \"=\" para dejarlo sin nombre.",
    addLocalConstant: "Añadir constante", steps: "Pasos (resultados)", stepsHint: "Escribe cada uno como nombre=expresión, por ejemplo v=v0+a*t. Puede usar constantes y pasos anteriores.", addStep: "Añadir paso", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "Unidad de visualización (opcional)", removeRow: "Quitar",
    formulaLatexPlaceholder: "Fórmula visible, LaTeX opcional (por ejemplo, v = v_0 + at)",
    formulasLabel: "Explicaciones de fórmulas", formulasHint: "Opcional. Añade una explicación con su fórmula justo debajo; puedes añadir tantos pares como quieras.",
    addFormula: "Añadir fórmula", formulaExplanationPlaceholder: "Explicación (por ejemplo, esto calcula la velocidad)",
    notebookBackup: "Copia de seguridad", notebookExport: "Exportar", notebookImportDone: "Se importaron {count} cuadernos.",
    notebookExportDone: "Se exportó la copia de seguridad de los cuadernos.", notebookReplaceImportConfirm: "¿Reemplazar todos tus cuadernos por los de este archivo? Los cuadernos preestablecidos se conservan. Esta acción no se puede deshacer.",
    notebookMerge: "Combinar y reemplazar coincidencias", notebookReplace: "Reemplazar todos los cuadernos",
    notebookTitlePlaceholder: "Esfuerzo de flexión", notebookDescriptionPlaceholder: "Nota opcional",
    insert: "Insertar", formulaCharactersLabel: "Símbolos", definedVariablesLabel: "Variables definidas",
    symbolGroupSubscriptDigits: "Dígitos en subíndice", symbolGroupSubscriptLetters: "Letras en subíndice", symbolGroupGreekLower: "Griego (minúsculas)", symbolGroupGreekUpper: "Griego (mayúsculas)",
    resultTitleLabel: "Título mostrado", resultTitlePlaceholder: "p. ej., Velocidad v",
  },
  "pt-BR": {
    title: "Biblioteca", subtitle: "Salve cadernos de cálculo reutilizáveis e constantes globais neste dispositivo.",
    notebooksTab: "Cadernos", constantsTab: "Constantes globais",
    add: "Adicionar", close: "Fechar", save: "Salvar", saving: "Salvando…", delete: "Excluir", cancel: "Cancelar",
    constantEmpty: "Ainda não há constantes", constantEmptyHint: "Salve um valor reutilizável, por exemplo W = 3cm.",
    titleLabel: "Nome", descriptionLabel: "Descrição", expressionLabel: "Expressão", symbolLabel: "Símbolo",
    constantEditor: "Constante",
    deleteConfirm: "Excluir este item? Isso não pode ser desfeito.", validation: "Preencha os campos obrigatórios.",
    backup: "Backup", export: "Exportar", clearAll: "Limpar tudo", restore: "Restaurar",
    exportDone: "Backup das constantes exportado.",
    merge: "Mesclar e substituir coincidências", replace: "Substituir todas as constantes", importDone: "{count} constantes importadas.",
    clearConfirm: "Limpar todas as constantes salvas? Você pode restaurar o último conjunto limpo.",
    cleared: "Constantes limpas. Você pode restaurá-las neste dispositivo.", restored: "Constantes limpas restauradas.",
    replaceImportConfirm: "Substituir todas as constantes salvas pelas deste arquivo? Isso não pode ser desfeito.",
    notebookNew: "Novo caderno", notebookEdit: "Editar caderno", notebookTitleLabel: "Título", notebookDescriptionLabel: "Descrição",
    category: "Categoria", newCategory: "Nova categoria", categoryName: "Nome da categoria", uncategorized: "Sem categoria",
    localConstants: "Constantes locais (entradas)", localConstantsHint: "Digite cada uma como nome=valor, por exemplo v0=5m/s. As linhas seguintes podem usar as anteriores.",
    invalidConstantName: "Digite cada constante como nome=valor (por exemplo, v0=5m/s).",
    invalidStepName: "Digite cada etapa como nome=expressão (por exemplo, v=v0+a*t), ou remova o \"=\" para deixá-la sem nome.",
    addLocalConstant: "Adicionar constante", steps: "Etapas (resultados)", stepsHint: "Digite cada uma como nome=expressão, por exemplo v=v0+a*t. Pode referenciar constantes e etapas anteriores.", addStep: "Adicionar etapa", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "Unidade de exibição (opcional)", removeRow: "Remover",
    formulaLatexPlaceholder: "Fórmula exibida, LaTeX opcional (por exemplo, v = v_0 + at)",
    formulasLabel: "Explicações das fórmulas", formulasHint: "Opcional. Adicione uma explicação com sua fórmula logo abaixo; adicione quantos pares quiser.",
    addFormula: "Adicionar fórmula", formulaExplanationPlaceholder: "Explicação (por exemplo, isso calcula a velocidade)",
    notebookBackup: "Backup", notebookExport: "Exportar", notebookImportDone: "{count} cadernos importados.",
    notebookExportDone: "Backup dos cadernos exportado.", notebookReplaceImportConfirm: "Substituir todos os seus cadernos pelos deste arquivo? Os cadernos predefinidos são mantidos. Isso não pode ser desfeito.",
    notebookMerge: "Mesclar e substituir coincidências", notebookReplace: "Substituir todos os cadernos",
    notebookTitlePlaceholder: "Tensão de flexão", notebookDescriptionPlaceholder: "Nota opcional",
    insert: "Inserir", formulaCharactersLabel: "Símbolos", definedVariablesLabel: "Variáveis definidas",
    symbolGroupSubscriptDigits: "Dígitos subscritos", symbolGroupSubscriptLetters: "Letras subscritas", symbolGroupGreekLower: "Grego (minúsculas)", symbolGroupGreekUpper: "Grego (maiúsculas)",
    resultTitleLabel: "Título exibido", resultTitlePlaceholder: "ex.: Velocidade v",
  },
  de: {
    title: "Bibliothek", subtitle: "Speichere wiederverwendbare Rechenhefte und globale Konstanten auf diesem Gerät.",
    notebooksTab: "Rechenhefte", constantsTab: "Globale Konstanten",
    add: "Hinzufügen", close: "Schließen", save: "Speichern", saving: "Speichert…", delete: "Löschen", cancel: "Abbrechen",
    constantEmpty: "Noch keine Konstanten", constantEmptyHint: "Speichere einen wiederverwendbaren Wert, zum Beispiel W = 3cm.",
    titleLabel: "Name", descriptionLabel: "Beschreibung", expressionLabel: "Ausdruck", symbolLabel: "Symbol",
    constantEditor: "Konstante",
    deleteConfirm: "Diesen Eintrag löschen? Das kann nicht rückgängig gemacht werden.", validation: "Bitte fülle die Pflichtfelder aus.",
    backup: "Sicherung", export: "Exportieren", clearAll: "Alle löschen", restore: "Wiederherstellen",
    exportDone: "Sicherung der Konstanten exportiert.",
    merge: "Zusammenführen, Übereinstimmungen ersetzen", replace: "Alle Konstanten ersetzen", importDone: "{count} Konstanten importiert.",
    clearConfirm: "Alle gespeicherten Konstanten löschen? Der zuletzt gelöschte Satz kann wiederhergestellt werden.",
    cleared: "Konstanten gelöscht. Du kannst sie auf diesem Gerät wiederherstellen.", restored: "Gelöschte Konstanten wiederhergestellt.",
    replaceImportConfirm: "Alle gespeicherten Konstanten durch die aus dieser Datei ersetzen? Das kann nicht rückgängig gemacht werden.",
    notebookNew: "Neues Rechenheft", notebookEdit: "Rechenheft bearbeiten", notebookTitleLabel: "Titel", notebookDescriptionLabel: "Beschreibung",
    category: "Kategorie", newCategory: "Neue Kategorie", categoryName: "Kategoriename", uncategorized: "Ohne Kategorie",
    localConstants: "Lokale Konstanten (Eingaben)", localConstantsHint: "Gib jede als Name=Wert ein, zum Beispiel v0=5m/s. Spätere Zeilen können frühere referenzieren.",
    invalidConstantName: "Gib jede Konstante als Name=Wert ein (z. B. v0=5m/s).",
    invalidStepName: "Gib jeden Schritt als Name=Ausdruck ein (z. B. v=v0+a*t), oder entferne das \"=\", um ihn unbenannt zu lassen.",
    addLocalConstant: "Konstante hinzufügen", steps: "Schritte (Ergebnisse)", stepsHint: "Gib jeden als Name=Ausdruck ein, zum Beispiel v=v0+a*t. Kann Konstanten und frühere Schritte referenzieren.", addStep: "Schritt hinzufügen", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "Anzeigeeinheit (optional)", removeRow: "Entfernen",
    formulaLatexPlaceholder: "Anzeigeformel, optional LaTeX (z. B. v = v_0 + at)",
    formulasLabel: "Formelerklärungen", formulasHint: "Optional. Füge eine Erklärung mit ihrer Formel direkt darunter hinzu; beliebig viele Paare möglich.",
    addFormula: "Formel hinzufügen", formulaExplanationPlaceholder: "Erklärung (z. B. Damit wird die Geschwindigkeit berechnet)",
    notebookBackup: "Sicherung", notebookExport: "Exportieren", notebookImportDone: "{count} Rechenhefte importiert.",
    notebookExportDone: "Sicherung der Rechenhefte exportiert.", notebookReplaceImportConfirm: "Alle deine Rechenhefte durch die aus dieser Datei ersetzen? Vordefinierte Rechenhefte bleiben erhalten. Das kann nicht rückgängig gemacht werden.",
    notebookMerge: "Zusammenführen, Übereinstimmungen ersetzen", notebookReplace: "Alle Rechenhefte ersetzen",
    notebookTitlePlaceholder: "Biegespannung", notebookDescriptionPlaceholder: "Optionale Notiz",
    insert: "Einfügen", formulaCharactersLabel: "Symbole", definedVariablesLabel: "Definierte Variablen",
    symbolGroupSubscriptDigits: "Tiefgestellte Ziffern", symbolGroupSubscriptLetters: "Tiefgestellte Buchstaben", symbolGroupGreekLower: "Griechisch (klein)", symbolGroupGreekUpper: "Griechisch (groß)",
    resultTitleLabel: "Anzeigetitel", resultTitlePlaceholder: "z. B. Geschwindigkeit v",
  },
  fr: {
    title: "Bibliothèque", subtitle: "Enregistrez des carnets de calcul réutilisables et des constantes globales sur cet appareil.",
    notebooksTab: "Carnets", constantsTab: "Constantes globales",
    add: "Ajouter", close: "Fermer", save: "Enregistrer", saving: "Enregistrement…", delete: "Supprimer", cancel: "Annuler",
    constantEmpty: "Aucune constante pour le moment", constantEmptyHint: "Enregistrez une valeur réutilisable, par exemple W = 3cm.",
    titleLabel: "Nom", descriptionLabel: "Description", expressionLabel: "Expression", symbolLabel: "Symbole",
    constantEditor: "Constante",
    deleteConfirm: "Supprimer cet élément ? Cette action est irréversible.", validation: "Veuillez remplir les champs obligatoires.",
    backup: "Sauvegarde", export: "Exporter", clearAll: "Tout effacer", restore: "Restaurer",
    exportDone: "Sauvegarde des constantes exportée.",
    merge: "Fusionner et remplacer les correspondances", replace: "Remplacer toutes les constantes", importDone: "{count} constantes importées.",
    clearConfirm: "Effacer toutes les constantes enregistrées ? Vous pourrez restaurer le dernier ensemble effacé.",
    cleared: "Constantes effacées. Vous pouvez les restaurer depuis cet appareil.", restored: "Constantes effacées restaurées.",
    replaceImportConfirm: "Remplacer toutes les constantes enregistrées par celles de ce fichier ? Cette action est irréversible.",
    notebookNew: "Nouveau carnet", notebookEdit: "Modifier le carnet", notebookTitleLabel: "Titre", notebookDescriptionLabel: "Description",
    category: "Catégorie", newCategory: "Nouvelle catégorie", categoryName: "Nom de la catégorie", uncategorized: "Sans catégorie",
    localConstants: "Constantes locales (entrées)", localConstantsHint: "Saisissez chacune sous la forme nom=valeur, par exemple v0=5m/s. Les lignes suivantes peuvent référencer les précédentes.",
    invalidConstantName: "Saisissez chaque constante sous la forme nom=valeur (par exemple v0=5m/s).",
    invalidStepName: "Saisissez chaque étape sous la forme nom=expression (par exemple v=v0+a*t), ou retirez le \"=\" pour la laisser sans nom.",
    addLocalConstant: "Ajouter une constante", steps: "Étapes (résultats)", stepsHint: "Saisissez chacune sous la forme nom=expression, par exemple v=v0+a*t. Peut référencer des constantes et des étapes précédentes.", addStep: "Ajouter une étape", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "Unité d'affichage (facultatif)", removeRow: "Retirer",
    formulaLatexPlaceholder: "Formule affichée, LaTeX facultatif (par exemple v = v_0 + at)",
    formulasLabel: "Explications des formules", formulasHint: "Facultatif. Ajoutez une explication avec sa formule juste en dessous ; ajoutez autant de paires que vous voulez.",
    addFormula: "Ajouter une formule", formulaExplanationPlaceholder: "Explication (par exemple, ceci calcule la vitesse)",
    notebookBackup: "Sauvegarde", notebookExport: "Exporter", notebookImportDone: "{count} carnets importés.",
    notebookExportDone: "Sauvegarde des carnets exportée.", notebookReplaceImportConfirm: "Remplacer tous vos carnets par ceux de ce fichier ? Les carnets prédéfinis sont conservés. Cette action est irréversible.",
    notebookMerge: "Fusionner et remplacer les correspondances", notebookReplace: "Remplacer tous les carnets",
    notebookTitlePlaceholder: "Contrainte de flexion", notebookDescriptionPlaceholder: "Note facultative",
    insert: "Insérer", formulaCharactersLabel: "Symboles", definedVariablesLabel: "Variables définies",
    symbolGroupSubscriptDigits: "Chiffres en indice", symbolGroupSubscriptLetters: "Lettres en indice", symbolGroupGreekLower: "Grec (minuscules)", symbolGroupGreekUpper: "Grec (majuscules)",
    resultTitleLabel: "Titre affiché", resultTitlePlaceholder: "p. ex. Vitesse v",
  },
};

export default function ConstantsScreen() {
  const router = useRouter();
  const { notebookExpression, notebookUnit, openNotebookId } = useLocalSearchParams<{ notebookExpression?: string | string[]; notebookUnit?: string | string[]; openNotebookId?: string | string[] }>();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { language, locale, measuringStandard, unitSystem } = useGlobalSettings();
  const {
    constants,
    clearConstants,
    hasRestorableConstants,
    importConstants,
    importNotebooks,
    isLoading,
    notebooks,
    notebookCategories,
    removeConstant,
    removeNotebook,
    removeNotebookCategory,
    restoreClearedConstants,
    toggleNotebookPinned,
    upsertConstant,
    upsertNotebook,
    upsertNotebookCategory,
  } = useCalculatorStore();

  const [topSection, setTopSection] = useState<TopSection>("notebooks");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [browsingParentCategoryId, setBrowsingParentCategoryId] = useState<string | null>(null);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);

  // グローバル定数の編集シート。
  const [constantEditorVisible, setConstantEditorVisible] = useState(false);
  const [editingConstantSymbol, setEditingConstantSymbol] = useState<string | undefined>();
  const [constantSymbolInput, setConstantSymbolInput] = useState("");
  const [constantExpressionInput, setConstantExpressionInput] = useState("");
  const [constantError, setConstantError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [backupNotice, setBackupNotice] = useState("");
  const [pendingDeleteConstant, setPendingDeleteConstant] = useState<string | null>(null);
  const [pendingClearConstants, setPendingClearConstants] = useState(false);
  const [pendingReplaceImport, setPendingReplaceImport] = useState<ImportedConstant[] | null>(null);

  // 計算ノートの編集シート。
  const [notebookEditorVisible, setNotebookEditorVisible] = useState(false);
  const [editingNotebookId, setEditingNotebookId] = useState<string | undefined>();
  const [notebookTitle, setNotebookTitle] = useState("");
  const [notebookDescription, setNotebookDescription] = useState("");
  const [notebookCategoryId, setNotebookCategoryId] = useState<string>(UNCATEGORIZED_CATEGORY_ID);
  const [notebookFormulas, setNotebookFormulas] = useState<NotebookFormula[]>([]);
  const [notebookLocalConstants, setNotebookLocalConstants] = useState<NotebookLocalConstant[]>([]);
  const [notebookSteps, setNotebookSteps] = useState<CalculationNoteStep[]>([]);
  const [notebookError, setNotebookError] = useState("");
  // mₒ・nₜ のようなUnicode下付き文字・ギリシャ文字は端末キーボードで直接入力できないため、フォーカス中の
  // 「名前＝式」欄の直下に「タップで挿入」ボタンの列を出す。フィールドごとに一意なキー
  // （`local:${id}` / `step:${id}`）で、どのフィールドで表示中かを管理する（components/notebooks/notebook-detail.tsx と同じパターン）。
  const [focusedRailKey, setFocusedRailKey] = useState<string | null>(null);
  // 各フィールドの現在のキャレット/選択範囲（onSelectionChangeで更新）。ボタンをタップしたとき
  // 末尾ではなく、この位置に文字を挿し込むために使う。
  const [fieldSelections, setFieldSelections] = useState<Record<string, { start: number; end: number }>>({});
  // 記号を挿し込んだ直後だけ、TextInputのselection propでキャレットを挿入位置の直後へ強制する。
  // ユーザー自身の入力と衝突しないよう、反映されたら（onSelectionChange/onChangeTextで）すぐ手放す。
  const [forcedSelection, setForcedSelection] = useState<{ key: string; selection: { start: number; end: number } } | null>(null);
  // フォーカス中フィールドで今どの文字グループ（下付き数字／下付き英字／ギリシャ小文字／ギリシャ大文字）を
  // 表示しているか。全グループを縦に並べるとモーダルが伸びすぎるため、タブで1グループだけを横スクロール表示する。
  const [activeCharacterGroupId, setActiveCharacterGroupId] = useState(FORMULA_CHARACTER_GROUPS[0].id);
  // カテゴリピッカーの第2段（サブカテゴリ行）を、どの大分類について開いているか。閉じているときはnull。
  const [categoryPickerExpandedParentId, setCategoryPickerExpandedParentId] = useState<string | null>(null);
  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [notebookBackupNotice, setNotebookBackupNotice] = useState("");
  const [pendingReplaceNotebookImport, setPendingReplaceNotebookImport] = useState<ImportedNotebook[] | null>(null);

  const copy = COPY[language];

  // エンジンのエラー(UnitError)は現在の言語で表示する。UnitError以外は従来どおり
  // Error.message をそのまま出す（バックアップ処理など別系統のエラーもここを通るため）。
  // このファイルのcatch節はどれもフォールバックがcopy.validationで共通なので、まとめて1箇所にする。
  const engineErrorMessage = (cause: unknown) => (cause instanceof Error ? (unitErrorMessage(cause, language) ?? cause.message) : copy.validation);

  const sectionItems: { id: TopSection; label: string }[] = [
    { id: "notebooks", label: copy.notebooksTab },
    { id: "constants", label: copy.constantsTab },
  ];

  // 「高校物理」のような大分類（サブカテゴリを束ねるだけの親）は、ノート自体の所属先には選べないようにする。
  const parentCategoryIds = useMemo(() => new Set(PRESET_NOTEBOOK_CATEGORIES.map((category) => category.parentId).filter((id): id is string => Boolean(id))), []);

  const categoryOptions = useMemo(() => [
    ...PRESET_NOTEBOOK_CATEGORIES.filter((category) => !parentCategoryIds.has(category.id)).map((category) => ({ id: category.id, label: localizedText(category.label, language) })),
    ...notebookCategories.map((category) => ({ id: category.id, label: category.name })),
    { id: UNCATEGORIZED_CATEGORY_ID, label: copy.uncategorized },
  ], [copy.uncategorized, language, notebookCategories, parentCategoryIds]);

  const categoryLabel = (categoryId: string) => categoryOptions.find((item) => item.id === categoryId)?.label ?? copy.uncategorized;

  // 親カテゴリID→子カテゴリ一覧。編集シートのカテゴリピッカーを2段（大分類→サブカテゴリ）にするための対応表。
  const childCategoriesByParentId = useMemo(() => {
    const map = new Map<string, { id: string; label: string }[]>();
    PRESET_NOTEBOOK_CATEGORIES.forEach((category) => {
      if (!category.parentId) return;
      const label = localizedText(category.label, language);
      map.set(category.parentId, [...(map.get(category.parentId) ?? []), { id: category.id, label }]);
    });
    return map;
  }, [language]);

  // ピッカーの第1段（最上位）。プリセットの大分類・葉カテゴリ、ユーザー作成カテゴリ、未分類の順に並べる。
  const topLevelCategoryOptions = useMemo(() => [
    ...PRESET_NOTEBOOK_CATEGORIES.filter((category) => !category.parentId).map((category) => ({ id: category.id, label: localizedText(category.label, language), hasChildren: childCategoriesByParentId.has(category.id) })),
    ...notebookCategories.map((category) => ({ id: category.id, label: category.name, hasChildren: false })),
    { id: UNCATEGORIZED_CATEGORY_ID, label: copy.uncategorized, hasChildren: false },
  ], [childCategoriesByParentId, copy.uncategorized, language, notebookCategories]);

  const categoryParentId = (categoryId: string) => PRESET_NOTEBOOK_CATEGORIES.find((category) => category.id === categoryId)?.parentId ?? null;

  const resetConstantEditor = () => {
    setEditingConstantSymbol(undefined); setConstantSymbolInput(""); setConstantExpressionInput(""); setConstantError("");
  };

  const openConstantEditor = (item?: SavedConstant) => {
    resetConstantEditor();
    setConstantEditorVisible(true);
    if (!item) return;
    setEditingConstantSymbol(item.symbol); setConstantSymbolInput(item.symbol); setConstantExpressionInput(item.expression);
  };

  const closeConstantEditor = () => { if (!isSaving) setConstantEditorVisible(false); };

  const saveConstant = async () => {
    setConstantError(""); setIsSaving(true);
    try {
      const symbol = constantSymbolInput.trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(symbol) || !constantExpressionInput.trim()) throw new Error(copy.validation);
      if (editingConstantSymbol && editingConstantSymbol !== symbol) await removeConstant(editingConstantSymbol);
      await upsertConstant(symbol, constantExpressionInput.trim());
      setConstantEditorVisible(false);
    } catch (cause) {
      setConstantError(engineErrorMessage(cause));
    } finally { setIsSaving(false); }
  };

  const handleExportConstants = async () => {
    try {
      await exportConstantsBackup(constants, language);
      setBackupNotice(copy.exportDone);
    } catch (cause) {
      setBackupNotice(engineErrorMessage(cause));
    }
  };

  const handleImportConstants = async (mode: "merge" | "replace") => {
    try {
      const entries = await pickConstantsBackup(language);
      if (!entries) return;
      if (mode === "replace") { setPendingReplaceImport(entries); return; }
      const count = await importConstants(entries, "merge");
      setBackupNotice(copy.importDone.replace("{count}", String(count)));
    } catch (cause) {
      setBackupNotice(engineErrorMessage(cause));
    }
  };

  const confirmReplaceImport = async () => {
    const entries = pendingReplaceImport;
    setPendingReplaceImport(null);
    if (!entries) return;
    try {
      const count = await importConstants(entries, "replace");
      setBackupNotice(copy.importDone.replace("{count}", String(count)));
    } catch (cause) {
      setBackupNotice(engineErrorMessage(cause));
    }
  };

  const handleClearConstants = async () => {
    try {
      await clearConstants();
      setBackupNotice(copy.cleared);
    } catch (cause) {
      setBackupNotice(engineErrorMessage(cause));
    }
  };

  const handleRestoreConstants = async () => {
    try {
      if (await restoreClearedConstants()) setBackupNotice(copy.restored);
    } catch (cause) {
      setBackupNotice(engineErrorMessage(cause));
    }
  };

  // 計算ノート全体のバックアップ（プリセットは対象外で、ユーザー作成分だけを書き出し・取り込む）。
  const handleExportNotebooks = async () => {
    try {
      await exportNotebooksBackup(notebooks, notebookCategories, language);
      setNotebookBackupNotice(copy.notebookExportDone);
    } catch (cause) {
      setNotebookBackupNotice(engineErrorMessage(cause));
    }
  };

  const handleImportNotebooks = async (mode: "merge" | "replace") => {
    try {
      const entries = await pickNotebooksBackup(language);
      if (!entries) return;
      if (mode === "replace") { setPendingReplaceNotebookImport(entries); return; }
      const count = await importNotebooks(entries, "merge");
      setNotebookBackupNotice(copy.notebookImportDone.replace("{count}", String(count)));
    } catch (cause) {
      setNotebookBackupNotice(engineErrorMessage(cause));
    }
  };

  const confirmReplaceNotebookImport = async () => {
    const entries = pendingReplaceNotebookImport;
    setPendingReplaceNotebookImport(null);
    if (!entries) return;
    try {
      const count = await importNotebooks(entries, "replace");
      setNotebookBackupNotice(copy.notebookImportDone.replace("{count}", String(count)));
    } catch (cause) {
      setNotebookBackupNotice(engineErrorMessage(cause));
    }
  };

  // 計算ノート：編集シートの開閉。
  // 編集モーダルは閉じてもこの画面コンポーネント自体は生きているため、レールの状態
  // （フォーカス中のフィールド・各フィールドのキャレット位置・強制キャレット）が次に開いたときまで
  // 残る。既存ノートの手順や定数は保存済みのidをそのまま持つのでキーも一致してしまい、再度開いた
  // 直後に前回のキャレット位置が復元されて、記号ボタンが意図しない位置に挿し込まれる
  // （forcedSelectionはTextInputのselection propに直接効くので、開いた瞬間にカーソルが飛ぶ）。
  // 閉じるときだけでなく**開くときにも**捨てる: 保存して閉じる経路（saveNotebook）は
  // closeNotebookEditorを通らずモーダルを閉じるため、閉じる側だけでは漏れる。
  const resetNotebookFieldInteraction = () => {
    setFocusedRailKey(null);
    setFieldSelections({});
    setForcedSelection(null);
    setActiveCharacterGroupId(FORMULA_CHARACTER_GROUPS[0].id);
  };

  const resetNotebookEditor = () => {
    setEditingNotebookId(undefined); setNotebookTitle(""); setNotebookDescription("");
    const initialCategoryId = selectedCategoryId ?? UNCATEGORIZED_CATEGORY_ID;
    setNotebookCategoryId(initialCategoryId);
    // selectedCategoryIdが理科・高校物理のサブカテゴリなら、ピッカーの第2段を最初から開いておく（自分の選択を見るための再ナビゲーションを不要にする）。
    setCategoryPickerExpandedParentId(categoryParentId(initialCategoryId));
    setNotebookFormulas([]); setNotebookLocalConstants([]); setNotebookSteps([]); setNotebookError("");
    setShowNewCategoryField(false); setNewCategoryName("");
    resetNotebookFieldInteraction();
  };

  const openNewNotebook = (presetExpression?: string, presetTargetUnit?: string) => {
    resetNotebookEditor();
    if (presetExpression) setNotebookSteps([{ id: nextStepId(), title: "", expression: presetExpression, targetUnit: presetTargetUnit ?? "" }]);
    setNotebookEditorVisible(true);
  };

  const openEditNotebook = (notebook: CalculationNotebook) => {
    setEditingNotebookId(notebook.id);
    setNotebookTitle(notebook.title);
    setNotebookDescription(notebook.description);
    setNotebookCategoryId(notebook.categoryId);
    setCategoryPickerExpandedParentId(categoryParentId(notebook.categoryId));
    setNotebookFormulas(notebook.formulas.map((item) => ({ ...item })));
    setNotebookLocalConstants(notebook.localConstants.map((item) => ({ ...item })));
    setNotebookSteps(notebook.steps.map((item) => ({ ...item })));
    setNotebookError("");
    setShowNewCategoryField(false); setNewCategoryName("");
    resetNotebookFieldInteraction();
    setNotebookEditorVisible(true);
  };

  // ルートパラメータ（電卓画面の「保存」ボタン）は常に新規ノートを開く契約。
  // 同じ値を持つパラメータで再実行されないよう、処理済みの値をrefで覚えておく。
  const handledNotebookParamRef = useRef<string | null>(null);
  useEffect(() => {
    const nextExpression = Array.isArray(notebookExpression) ? notebookExpression[0] : notebookExpression;
    const nextUnit = Array.isArray(notebookUnit) ? notebookUnit[0] : notebookUnit;
    if (!nextExpression) return;
    const token = `${nextExpression}|${nextUnit ?? ""}`;
    if (handledNotebookParamRef.current === token) return;
    handledNotebookParamRef.current = token;
    setTopSection("notebooks");
    openNewNotebook(nextExpression, nextUnit);
    // パラメータを消費済みにしておく。消さないままだと、同じ式をもう一度
    // 保存しようとしたとき（値が変わらない）に何も起きなくなる。
    router.setParams({ notebookExpression: undefined, notebookUnit: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notebookExpression, notebookUnit]);

  // ルートパラメータ（電卓画面のピン留めチップ）でノート詳細を直接開く。
  // notebooksの読み込み完了前は見つからないため、読み込み完了後の再実行で開けるようにする。
  const handledOpenNotebookIdRef = useRef<string | null>(null);
  useEffect(() => {
    const id = Array.isArray(openNotebookId) ? openNotebookId[0] : openNotebookId;
    if (!id || handledOpenNotebookIdRef.current === id) return;
    const notebook = notebooks.find((item) => item.id === id);
    if (!notebook) return;
    handledOpenNotebookIdRef.current = id;
    setTopSection("notebooks");
    setBrowsingParentCategoryId(PRESET_NOTEBOOK_CATEGORIES.find((category) => category.id === notebook.categoryId)?.parentId ?? null);
    setSelectedCategoryId(notebook.categoryId);
    setSelectedNotebookId(notebook.id);
    // パラメータを消費済みにしておく。消さないままだと、一度戻ってから同じ
    // ピン留めチップをもう一度押しても（値が変わらない）再度開けなくなる。
    router.setParams({ openNotebookId: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNotebookId, notebooks]);

  const closeNotebookEditor = () => {
    setNotebookEditorVisible(false);
    resetNotebookFieldInteraction();
  };

  const saveNotebook = async () => {
    setNotebookError("");
    const title = notebookTitle.trim();
    // 「名前＝値」の名前部分を解析できなかった行（例：数字始まりの名前）は、symbolやresultSymbolが
    // 空のまま生テキスト（"="を含む）がexpressionに残る。名前なしの通常の式と区別して、はっきり教える。
    if (notebookLocalConstants.some((item) => !item.symbol.trim() && item.expression.trim())) { setNotebookError(copy.invalidConstantName); return; }
    if (notebookSteps.some((step) => !step.resultSymbol?.trim() && step.expression.includes("="))) { setNotebookError(copy.invalidStepName); return; }
    const normalizedSteps = notebookSteps.filter((step) => step.expression.trim()).map(normalizeStepForSave);
    const normalizedConstants = notebookLocalConstants.filter((item) => item.symbol.trim() && item.expression.trim()).map((item) => ({ ...item, symbol: item.symbol.trim(), expression: item.expression.trim() }));
    const normalizedFormulas = notebookFormulas.filter((item) => item.latex.trim()).map((item) => ({ ...item, explanation: item.explanation.trim(), latex: item.latex.trim() }));
    if (!title || !normalizedSteps.length) { setNotebookError(copy.validation); return; }
    setIsSaving(true);
    try {
      await upsertNotebook({ id: editingNotebookId, title, description: notebookDescription.trim(), categoryId: notebookCategoryId, formulas: normalizedFormulas, localConstants: normalizedConstants, steps: normalizedSteps });
      setNotebookEditorVisible(false);
    } catch (cause) {
      setNotebookError(engineErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  };

  const createCategoryInline = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const created = await upsertNotebookCategory({ name });
    setNotebookCategoryId(created.id);
    // 新規作成のユーザーカテゴリは常に最上位の葉カテゴリなので、開いていたサブカテゴリ行は閉じる。
    setCategoryPickerExpandedParentId(null);
    setShowNewCategoryField(false);
    setNewCategoryName("");
  };

  const updateLocalConstant = (id: string, patch: Partial<NotebookLocalConstant>) =>
    setNotebookLocalConstants((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const updateStep = (id: string, patch: Partial<CalculationNoteStep>) =>
    setNotebookSteps((current) => current.map((step) => (step.id === id ? { ...step, ...patch } : step)));

  // 「名前＝式」欄の名前部分を書き換えたとき、表示タイトル(title)を追従させてよいかどうかの判定込みで
  // 手順を更新する。名前が無いとき（＝を付けていない通常の式）はtitleへ触れない。名前があるときも、
  // タイトルが「未設定」または「直前のresultSymbolと一致（＝以前この仕組みで自動生成されたもの）」の
  // ときだけ追従させる。人間が入力したタイトルやプリセットの翻訳済みタイトルを、名前欄に触れただけで
  // 潰さないようにするため（このタイトル入力欄自体のonChangeTextでは、この関数は経由せず直接上書きする）。
  // タイピングでも記号ボタンでの挿入でも同じ判定になるよう、両方の入口からこの関数を呼ぶ。
  const applyStepNameValue = (step: CalculationNoteStep, name: string, value: string) => {
    // 判定は詳細画面（components/notebooks/notebook-detail.tsx）と同じ関数を使う。両画面で式を
    // 別々に持つと、片方だけ直したときに挙動が分岐して気付けない。名前を消したとき（name=""）も
    // 同じ判定で追従させて空に戻す（記号だけ消してタイトルを残すと自動生成の目印が失われ、
    // 次に別の記号を入れてもタイトルが古い記号のまま固定されてしまう）。
    updateStep(step.id, nextStepNamePatch(step, name, value));
  };
  const updateFormula = (id: string, patch: Partial<NotebookFormula>) =>
    setNotebookFormulas((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const localConstantFieldKey = (id: string) => `local:${id}`;
  const stepFieldKey = (id: string) => `step:${id}`;
  const combinedCaretEnd = (name: string, expression: string) => formatNameValue(name, expression).length;

  // 丸めの規則は lib/notebook-constant-suggestions.ts の純関数に持たせてテストしている。
  const clampedSelection = (key: string, length: number) => clampSelectionRange(fieldSelections[key], length);

  // onSelectionChangeが発火した時点で強制キャレットの役目は終わり。ユーザー自身の操作と
  // 衝突しないよう、対象キーが一致するときだけここで手放す（notebook-detail.tsxと同じパターン）。
  const handleRailSelectionChange = (key: string, selection: { start: number; end: number }) => {
    setFieldSelections((current) => ({ ...current, [key]: selection }));
    setForcedSelection((current) => (current?.key === key ? null : current));
  };

  // Pressableのタップより先にonBlurでレール表示を消してしまうと押下が成立しないことがあるため、
  // 少し遅らせてから消す（同じフィールドにまだフォーカスが戻っていなければ消す）。
  const scheduleRailBlur = (key: string) => {
    setTimeout(() => {
      setFocusedRailKey((current) => (current === key ? null : current));
    }, 150);
  };

  // ギリシャ文字・下付き文字のボタン。既存の定義済み変数を挿すgetLocalConstantFieldSuggestions等とは違い、
  // これから作る新しい変数名を入力するためのもの。「名前＝式」の結合文字列に対してキャレット位置へ
  // そのまま文字を差し込み、結果をparseNameValueで割って書き戻す（名前部分にも式部分にも挿し込めるようにするため、
  // 挿入先をexpression側に限定するinsertConstantSymbolは使わない）。
  const insertCharacterIntoField = (key: string, combinedText: string, char: string, apply: (name: string, value: string) => void) => {
    const selection = clampedSelection(key, combinedText.length);
    const nextText = `${combinedText.slice(0, selection.start)}${char}${combinedText.slice(selection.end)}`;
    const { name, value } = parseNameValue(nextText);
    apply(name, value);
    const caret = selection.start + char.length;
    const caretSelection = { start: caret, end: caret };
    setFieldSelections((current) => ({ ...current, [key]: caretSelection }));
    setForcedSelection({ key, selection: caretSelection });
  };

  // 既に定義済みの変数（ローカル定数・グローバル定数・先行する手順の結果記号）を式へ挿入するボタン。
  // insertConstantSymbolはexpression側にだけ挿し込む（「名前＝式」の名前部分にキャレットがあっても
  // expressionの先頭へ丸める）ので、名前を誤って書き換えることはない。
  const insertVariableIntoField = (key: string, name: string, expression: string, symbol: string, applyExpression: (next: string) => void) => {
    const selection = clampedSelection(key, combinedCaretEnd(name, expression));
    const { expression: nextExpression, combinedCaret } = insertConstantSymbol(name, expression, selection.start, selection.end, symbol);
    applyExpression(nextExpression);
    const caretSelection = { start: combinedCaret, end: combinedCaret };
    setFieldSelections((current) => ({ ...current, [key]: caretSelection }));
    setForcedSelection({ key, selection: caretSelection });
  };

  const symbolGroupLabel = (id: (typeof FORMULA_CHARACTER_GROUPS)[number]["id"]) => {
    if (id === "subscriptDigits") return copy.symbolGroupSubscriptDigits;
    if (id === "subscriptLetters") return copy.symbolGroupSubscriptLetters;
    if (id === "greekLower") return copy.symbolGroupGreekLower;
    return copy.symbolGroupGreekUpper;
  };

  // フォーカス中フィールドの直下に出す、ギリシャ文字・下付き文字のボタン列。
  // 全グループを縦に並べるとモーダルが伸びすぎるため、タブ（横スクロール）でグループを切り替え、
  // 選んだグループの文字だけを横スクロールの1行で出す（縦方向は常に2行分だけで収まる）。
  const renderCharacterRail = (key: string, onInsert: (char: string) => void) => {
    if (focusedRailKey !== key) return null;
    const activeGroup = FORMULA_CHARACTER_GROUPS.find((group) => group.id === activeCharacterGroupId) ?? FORMULA_CHARACTER_GROUPS[0];
    return (
      <View>
        <Text style={styles.railLabel}>{copy.formulaCharactersLabel}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.railGroupTabs}>
          {FORMULA_CHARACTER_GROUPS.map((group) => (
            <Pressable key={group.id} onPress={() => setActiveCharacterGroupId(group.id)} style={({ pressed }) => [styles.railGroupTab, activeCharacterGroupId === group.id && styles.railGroupTabActive, pressed && styles.buttonPressed]}>
              <Text style={[styles.railGroupTabText, activeCharacterGroupId === group.id && styles.railGroupTabTextActive]}>{symbolGroupLabel(group.id)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.unitRail}>
          {activeGroup.chars.map((char) => (
            <Pressable key={char} accessibilityLabel={`${copy.insert} ${char}`} onPress={() => onInsert(char)} style={({ pressed }) => [styles.unitChip, pressed && styles.buttonPressed]}>
              <Text style={styles.unitChipText}>{char}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  // フォーカス中フィールドの直下に出す、既に定義済みの変数（記号）のボタン列。候補が無ければ何も出さない。
  const renderVariablesRail = (key: string, symbols: string[], onInsert: (symbol: string) => void) => {
    if (focusedRailKey !== key || !symbols.length) return null;
    return (
      <View>
        <Text style={styles.railLabel}>{copy.definedVariablesLabel}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.unitRail}>
          {symbols.map((symbol) => (
            <Pressable key={symbol} accessibilityLabel={`${copy.insert} ${symbol}`} onPress={() => onInsert(symbol)} style={({ pressed }) => [styles.unitChip, pressed && styles.buttonPressed]}>
              <Text style={styles.unitChipText}>{symbol}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  const selectedNotebook = selectedNotebookId ? notebooks.find((item) => item.id === selectedNotebookId) : undefined;
  const notebooksInCategory = selectedCategoryId ? notebooks.filter((item) => item.categoryId === selectedCategoryId) : [];

  const renderNotebooksSection = () => {
    if (selectedNotebook) {
      return (
        <NotebookDetail
          language={language}
          locale={locale}
          unitSystem={unitSystem}
          measuringStandard={measuringStandard}
          notebook={selectedNotebook}
          categoryLabel={categoryLabel(selectedNotebook.categoryId)}
          globalConstants={constants}
          onBack={() => setSelectedNotebookId(null)}
          onEdit={() => openEditNotebook(selectedNotebook)}
          onTogglePinned={() => void toggleNotebookPinned(selectedNotebook.id)}
          onSaveValues={async (nextLocalConstants, nextSteps) => { await upsertNotebook({ id: selectedNotebook.id, title: selectedNotebook.title, description: selectedNotebook.description, categoryId: selectedNotebook.categoryId, formulas: selectedNotebook.formulas, localConstants: nextLocalConstants, steps: nextSteps }); }}
        />
      );
    }
    if (selectedCategoryId) {
      return (
        <NotebookList
          language={language}
          locale={locale}
          categoryLabel={categoryLabel(selectedCategoryId)}
          notebooks={notebooksInCategory}
          globalConstants={constants}
          onBack={() => setSelectedCategoryId(null)}
          onOpen={setSelectedNotebookId}
          onDelete={(id) => void removeNotebook(id)}
          onTogglePinned={(id) => void toggleNotebookPinned(id)}
        />
      );
    }
    return (
      <NotebookCategoryGrid
        language={language}
        notebooks={notebooks}
        notebookCategories={notebookCategories}
        parentCategoryId={browsingParentCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onSelectParentCategory={setBrowsingParentCategoryId}
        onBack={() => setBrowsingParentCategoryId(null)}
        onCreateCategory={(name) => void upsertNotebookCategory({ name })}
        onRenameCategory={(id, name) => void upsertNotebookCategory({ id, name })}
        onDeleteCategory={(id) => void removeNotebookCategory(id)}
      />
    );
  };

  const renderEmpty = (titleText: string, hint: string) => <View style={styles.emptyCard}><IconSymbol name="bookmark.fill" size={30} color={colors.primary} /><Text style={styles.emptyTitle}>{titleText}</Text><Text style={styles.emptyText}>{hint}</Text></View>;

  const renderConstantsSection = () => (
    <>
      {constants.length ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {constants.map((item) => (
            <View key={item.symbol} style={styles.libraryCard}>
              <Pressable onPress={() => openConstantEditor(item)} style={({ pressed }) => [styles.libraryMain, pressed && styles.cardPressed]}>
                <Text style={styles.libraryTitle}>{item.symbol} = {item.expression}</Text>
                <Text style={styles.libraryExpression}>{formatQuantity(item.quantity)}</Text>
              </Pressable>
              <Pressable accessibilityLabel={copy.delete} onPress={() => setPendingDeleteConstant(item.symbol)} style={({ pressed }) => [styles.deleteButton, pressed && styles.iconPressed]}>
                <IconSymbol name="trash" size={20} color={colors.error} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyList}>{renderEmpty(copy.constantEmpty, copy.constantEmptyHint)}</View>
      )}
    </>
  );

  const renderContent = () => (topSection === "notebooks" ? renderNotebooksSection() : renderConstantsSection());

  const handleAddPress = () => {
    if (topSection === "constants") openConstantEditor();
    else openNewNotebook();
  };

  const showAddButton = topSection !== "notebooks" || !selectedNotebook;

  return <ScreenContainer className="px-5" containerClassName="bg-background">
    <View style={styles.header}>
      <View><Text style={styles.title}>{copy.title}</Text><Text style={styles.subtitle}>{copy.subtitle}</Text></View>
      {showAddButton ? <Pressable accessibilityLabel={copy.add} onPress={handleAddPress} style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}><IconSymbol name="plus.circle.fill" size={28} color={colors.primary} /></Pressable> : null}
    </View>
    <View style={styles.sectionRail}>
      {sectionItems.map((item) => (
        <Pressable key={item.id} onPress={() => { setTopSection(item.id); setSelectedCategoryId(null); setBrowsingParentCategoryId(null); setSelectedNotebookId(null); }} style={({ pressed }) => [styles.sectionChip, topSection === item.id && styles.sectionChipActive, pressed && styles.buttonPressed]}>
          <Text style={[styles.sectionChipText, topSection === item.id && styles.sectionChipTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
    {topSection === "constants" ? <View style={styles.backupCard}><Text style={styles.backupTitle}>{copy.backup}</Text><View style={styles.backupActions}><Pressable onPress={() => void handleExportConstants()} style={({ pressed }) => [styles.backupButton, pressed && styles.buttonPressed]}><Text style={styles.backupButtonText}>{copy.export}</Text></Pressable><Pressable onPress={() => void handleImportConstants("merge")} style={({ pressed }) => [styles.backupButton, pressed && styles.buttonPressed]}><Text style={styles.backupButtonText}>{copy.merge}</Text></Pressable><Pressable onPress={() => void handleImportConstants("replace")} style={({ pressed }) => [styles.backupButton, pressed && styles.buttonPressed]}><Text style={styles.backupButtonText}>{copy.replace}</Text></Pressable><Pressable onPress={() => setPendingClearConstants(true)} style={({ pressed }) => [styles.clearButton, pressed && styles.buttonPressed]}><Text style={styles.clearButtonText}>{copy.clearAll}</Text></Pressable>{hasRestorableConstants ? <Pressable onPress={() => void handleRestoreConstants()} style={({ pressed }) => [styles.restoreButton, pressed && styles.buttonPressed]}><Text style={styles.restoreButtonText}>{copy.restore}</Text></Pressable> : null}</View>{backupNotice ? <Text style={styles.backupNotice}>{backupNotice}</Text> : null}</View> : null}
    {topSection === "notebooks" && !selectedNotebook ? <View style={styles.backupCard}><Text style={styles.backupTitle}>{copy.notebookBackup}</Text><View style={styles.backupActions}><Pressable onPress={() => void handleExportNotebooks()} style={({ pressed }) => [styles.backupButton, pressed && styles.buttonPressed]}><Text style={styles.backupButtonText}>{copy.notebookExport}</Text></Pressable><Pressable onPress={() => void handleImportNotebooks("merge")} style={({ pressed }) => [styles.backupButton, pressed && styles.buttonPressed]}><Text style={styles.backupButtonText}>{copy.notebookMerge}</Text></Pressable><Pressable onPress={() => void handleImportNotebooks("replace")} style={({ pressed }) => [styles.backupButton, pressed && styles.buttonPressed]}><Text style={styles.backupButtonText}>{copy.notebookReplace}</Text></Pressable></View>{notebookBackupNotice ? <Text style={styles.backupNotice}>{notebookBackupNotice}</Text> : null}</View> : null}

    {isLoading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : renderContent()}

    <Modal visible={constantEditorVisible} transparent animationType="slide" onRequestClose={closeConstantEditor}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
        <View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>{copy.constantEditor}</Text></View><Pressable accessibilityLabel={copy.close} onPress={closeConstantEditor} style={({ pressed }) => [styles.closeButton, pressed && styles.iconPressed]}><IconSymbol name="xmark" size={21} color={colors.muted} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>{copy.symbolLabel}</Text>
            <TextInput value={constantSymbolInput} onChangeText={setConstantSymbolInput} placeholder="W" placeholderTextColor={colors.placeholder} autoCapitalize="characters" autoCorrect={false} style={styles.input} />
            <Text style={styles.fieldLabel}>{copy.expressionLabel}</Text>
            <TextInput value={constantExpressionInput} onChangeText={setConstantExpressionInput} placeholder="3cm" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} />
            {constantError ? <Text style={styles.error}>{constantError}</Text> : null}
            <Pressable disabled={isSaving} onPress={() => void saveConstant()} style={({ pressed }) => [styles.saveButton, (pressed || isSaving) && styles.buttonPressed]}><Text style={styles.saveText}>{isSaving ? copy.saving : copy.save}</Text></Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    <Modal visible={notebookEditorVisible} transparent animationType="slide" onRequestClose={closeNotebookEditor}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
        <View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>{editingNotebookId ? copy.notebookEdit : copy.notebookNew}</Text></View><Pressable accessibilityLabel={copy.close} onPress={closeNotebookEditor} style={({ pressed }) => [styles.closeButton, pressed && styles.iconPressed]}><IconSymbol name="xmark" size={21} color={colors.muted} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>{copy.notebookTitleLabel}</Text>
            <TextInput value={notebookTitle} onChangeText={setNotebookTitle} placeholder={copy.notebookTitlePlaceholder} placeholderTextColor={colors.placeholder} style={styles.input} />
            <Text style={styles.fieldLabel}>{copy.notebookDescriptionLabel}</Text>
            <TextInput value={notebookDescription} onChangeText={setNotebookDescription} placeholder={copy.notebookDescriptionPlaceholder} placeholderTextColor={colors.placeholder} style={styles.input} />

            <Text style={styles.fieldLabel}>{copy.category}</Text>
            <View style={styles.categoryPicker}>
              {topLevelCategoryOptions.map((option) => {
                // 大分類チップは「選択中」または「選択中カテゴリの親」のとき強調表示する（子を開いていなくても今どこにいるか分かるように）。
                const isActive = notebookCategoryId === option.id || (option.hasChildren && categoryParentId(notebookCategoryId) === option.id);
                // サブカテゴリ行は最上位チップ全部の下に出るため、どの大分類を開いているのかを
                // チップ側でも示す（未選択のまま開いただけの状態を「選択中」と区別する）。
                const isExpanded = categoryPickerExpandedParentId === option.id && !isActive;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      if (option.hasChildren) {
                        // 大分類はグループ化のためだけの存在でノート自体の所属先にはできない。タップではサブカテゴリ行を開閉するだけにする。
                        setCategoryPickerExpandedParentId((current) => (current === option.id ? null : option.id));
                        return;
                      }
                      setNotebookCategoryId(option.id);
                      setCategoryPickerExpandedParentId(null);
                    }}
                    style={({ pressed }) => [styles.sectionChip, isExpanded && styles.sectionChipExpanded, isActive && styles.sectionChipActive, pressed && styles.buttonPressed]}
                  >
                    <Text style={[styles.sectionChipText, isExpanded && styles.sectionChipExpandedText, isActive && styles.sectionChipTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
              <Pressable onPress={() => setShowNewCategoryField((current) => !current)} style={({ pressed }) => [styles.sectionChip, pressed && styles.buttonPressed]}>
                <Text style={styles.sectionChipText}>＋ {copy.newCategory}</Text>
              </Pressable>
            </View>
            {categoryPickerExpandedParentId ? (
              <View style={styles.categoryPickerChild}>
                {(childCategoriesByParentId.get(categoryPickerExpandedParentId) ?? []).map((option) => (
                  <Pressable key={option.id} onPress={() => setNotebookCategoryId(option.id)} style={({ pressed }) => [styles.sectionChip, notebookCategoryId === option.id && styles.sectionChipActive, pressed && styles.buttonPressed]}>
                    <Text style={[styles.sectionChipText, notebookCategoryId === option.id && styles.sectionChipTextActive]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {showNewCategoryField ? (
              <View style={styles.inlineCategoryRow}>
                <TextInput value={newCategoryName} onChangeText={setNewCategoryName} placeholder={copy.categoryName} placeholderTextColor={colors.placeholder} style={[styles.input, styles.inlineCategoryInput]} onSubmitEditing={() => void createCategoryInline()} returnKeyType="done" />
                <Pressable onPress={() => void createCategoryInline()} style={({ pressed }) => [styles.inlineCategoryButton, pressed && styles.buttonPressed]}><Text style={styles.inlineCategoryButtonText}>{copy.save}</Text></Pressable>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>{copy.formulasLabel}</Text>
            <Text style={styles.hintText}>{copy.formulasHint}</Text>
            {notebookFormulas.map((formula) => (
              <View key={formula.id} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <TextInput
                    value={formula.explanation}
                    onChangeText={(text) => updateFormula(formula.id, { explanation: text })}
                    placeholder={copy.formulaExplanationPlaceholder}
                    placeholderTextColor={colors.placeholder}
                    multiline
                    style={styles.formulaExplanationInput}
                  />
                  <Pressable onPress={() => setNotebookFormulas((current) => current.filter((entry) => entry.id !== formula.id))}><Text style={styles.removeStepText}>{copy.removeRow}</Text></Pressable>
                </View>
                <TextInput
                  value={formula.latex}
                  onChangeText={(text) => updateFormula(formula.id, { latex: text })}
                  placeholder={copy.formulaLatexPlaceholder}
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.stepInput}
                />
                {formula.latex ? (
                  <View style={styles.latexPreview}>
                    <LatexView latex={formula.latex} color={colors.foreground} fontSize={15} displayMode={false} />
                  </View>
                ) : null}
              </View>
            ))}
            <Pressable onPress={() => setNotebookFormulas((current) => [...current, { id: nextFormulaId(), explanation: "", latex: "" }])} style={({ pressed }) => [styles.addStepButton, pressed && styles.buttonPressed]}><Text style={styles.addStepText}>＋ {copy.addFormula}</Text></Pressable>

            <Text style={styles.fieldLabel}>{copy.localConstants}</Text>
            <Text style={styles.hintText}>{copy.localConstantsHint}</Text>
            {notebookLocalConstants.map((item, constantIndex) => {
              const railKey = localConstantFieldKey(item.id);
              const isRailForced = forcedSelection?.key === railKey;
              return (
                <View key={item.id} style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <TextInput
                      value={formatNameValue(item.symbol, item.expression)}
                      onChangeText={(text) => {
                        const { name, value } = parseNameValue(text);
                        updateLocalConstant(item.id, { symbol: name, expression: value });
                        setForcedSelection((current) => (current?.key === railKey ? null : current));
                      }}
                      onFocus={() => setFocusedRailKey(railKey)}
                      onBlur={() => scheduleRailBlur(railKey)}
                      onSelectionChange={(event) => handleRailSelectionChange(railKey, event.nativeEvent.selection)}
                      selection={isRailForced ? forcedSelection.selection : undefined}
                      placeholder="v0=5m/s"
                      placeholderTextColor={colors.placeholder}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.stepInput}
                    />
                    <Pressable onPress={() => setNotebookLocalConstants((current) => current.filter((entry) => entry.id !== item.id))}><Text style={styles.removeStepText}>{copy.removeRow}</Text></Pressable>
                  </View>
                  {renderCharacterRail(railKey, (char) =>
                    insertCharacterIntoField(railKey, formatNameValue(item.symbol, item.expression), char, (name, value) => updateLocalConstant(item.id, { symbol: name, expression: value })),
                  )}
                  {renderVariablesRail(railKey, getLocalConstantFieldSuggestions(notebookLocalConstants, constants, constantIndex), (symbol) =>
                    insertVariableIntoField(railKey, item.symbol, item.expression, symbol, (nextExpression) => updateLocalConstant(item.id, { expression: nextExpression })),
                  )}
                </View>
              );
            })}
            <Pressable onPress={() => setNotebookLocalConstants((current) => [...current, { id: nextLocalConstantId(), symbol: "", expression: "" }])} style={({ pressed }) => [styles.addStepButton, pressed && styles.buttonPressed]}><Text style={styles.addStepText}>＋ {copy.addLocalConstant}</Text></Pressable>

            <Text style={styles.fieldLabel}>{copy.steps}</Text>
            <Text style={styles.hintText}>{copy.stepsHint}</Text>
            {notebookSteps.map((step, stepIndex) => {
              const railKey = stepFieldKey(step.id);
              const isRailForced = forcedSelection?.key === railKey;
              return (
              <View key={step.id} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <TextInput
                    value={formatNameValue(step.resultSymbol ?? "", step.expression)}
                    onChangeText={(text) => {
                      const { name, value } = parseNameValue(text);
                      applyStepNameValue(step, name, value);
                      setForcedSelection((current) => (current?.key === railKey ? null : current));
                    }}
                    onFocus={() => setFocusedRailKey(railKey)}
                    onBlur={() => scheduleRailBlur(railKey)}
                    onSelectionChange={(event) => handleRailSelectionChange(railKey, event.nativeEvent.selection)}
                    selection={isRailForced ? forcedSelection.selection : undefined}
                    placeholder={copy.stepTitlePlaceholder}
                    placeholderTextColor={colors.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.stepInput}
                  />
                  <Pressable onPress={() => setNotebookSteps((current) => current.filter((entry) => entry.id !== step.id))}><Text style={styles.removeStepText}>{copy.removeRow}</Text></Pressable>
                </View>
                {renderCharacterRail(railKey, (char) =>
                  insertCharacterIntoField(railKey, formatNameValue(step.resultSymbol ?? "", step.expression), char, (name, value) => applyStepNameValue(step, name, value)),
                )}
                {renderVariablesRail(railKey, getStepFieldSuggestions(notebookLocalConstants, constants, notebookSteps, stepIndex), (symbol) =>
                  insertVariableIntoField(railKey, step.resultSymbol ?? "", step.expression, symbol, (nextExpression) => updateStep(step.id, { expression: nextExpression })),
                )}
                <Text style={styles.fieldSubLabel}>{copy.resultTitleLabel}</Text>
                <TextInput value={step.title} onChangeText={(text) => updateStep(step.id, { title: text })} placeholder={copy.resultTitlePlaceholder} placeholderTextColor={colors.placeholder} style={styles.stepInput} />
                <TextInput value={step.targetUnit} onChangeText={(text) => updateStep(step.id, { targetUnit: text })} placeholder={copy.outputUnitLabel} placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.stepInput} />
              </View>
              );
            })}
            <Pressable onPress={() => setNotebookSteps((current) => [...current, { id: nextStepId(), title: "", expression: "", targetUnit: "" }])} style={({ pressed }) => [styles.addStepButton, pressed && styles.buttonPressed]}><Text style={styles.addStepText}>＋ {copy.addStep}</Text></Pressable>

            {notebookError ? <Text style={styles.error}>{notebookError}</Text> : null}
            <Pressable disabled={isSaving} onPress={() => void saveNotebook()} style={({ pressed }) => [styles.saveButton, (pressed || isSaving) && styles.buttonPressed]}><Text style={styles.saveText}>{isSaving ? copy.saving : copy.save}</Text></Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    <ConfirmDialog
      visible={Boolean(pendingDeleteConstant)}
      title={copy.delete}
      message={copy.deleteConfirm}
      cancelLabel={copy.cancel}
      confirmLabel={copy.delete}
      destructive
      onCancel={() => setPendingDeleteConstant(null)}
      onConfirm={() => {
        if (pendingDeleteConstant) void removeConstant(pendingDeleteConstant);
        setPendingDeleteConstant(null);
      }}
    />

    <ConfirmDialog
      visible={pendingClearConstants}
      title={copy.clearAll}
      message={copy.clearConfirm}
      cancelLabel={copy.cancel}
      confirmLabel={copy.clearAll}
      destructive
      onCancel={() => setPendingClearConstants(false)}
      onConfirm={() => {
        setPendingClearConstants(false);
        void handleClearConstants();
      }}
    />

    <ConfirmDialog
      visible={Boolean(pendingReplaceImport)}
      title={copy.replace}
      message={copy.replaceImportConfirm}
      cancelLabel={copy.cancel}
      confirmLabel={copy.replace}
      destructive
      onCancel={() => setPendingReplaceImport(null)}
      onConfirm={() => void confirmReplaceImport()}
    />

    <ConfirmDialog
      visible={Boolean(pendingReplaceNotebookImport)}
      title={copy.notebookReplace}
      message={copy.notebookReplaceImportConfirm}
      cancelLabel={copy.cancel}
      confirmLabel={copy.notebookReplace}
      destructive
      onCancel={() => setPendingReplaceNotebookImport(null)}
      onConfirm={() => void confirmReplaceNotebookImport()}
    />
  </ScreenContainer>;
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", paddingBottom: 14, paddingTop: 8 },
  title: { color: colors.foreground, fontSize: 30, fontWeight: "700", letterSpacing: -0.6 }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4, maxWidth: "88%" },
  addButton: { alignItems: "center", backgroundColor: colors.primarySurface, borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  sectionRail: { flexDirection: "row", flexWrap: "wrap", gap: 7, paddingBottom: 14 }, sectionChip: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8 }, sectionChipActive: { backgroundColor: colors.primaryFill }, sectionChipText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, sectionChipTextActive: { color: colors.onPrimary },
  backupCard: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 14, borderWidth: 1, marginBottom: 12, padding: 12 }, backupTitle: { color: colors.foreground, fontSize: 13, fontWeight: "800" }, backupActions: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 9 }, backupButton: { backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 }, backupButtonText: { color: colors.primary, fontSize: 12, fontWeight: "800" }, clearButton: { backgroundColor: colors.errorSurface, borderColor: colors.errorBorder, borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 }, clearButtonText: { color: colors.error, fontSize: 12, fontWeight: "800" }, restoreButton: { backgroundColor: colors.successSurface, borderColor: colors.successBorder, borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 }, restoreButtonText: { color: colors.success, fontSize: 12, fontWeight: "800" }, backupNotice: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 8 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" }, list: { gap: 10, paddingBottom: 30 }, emptyList: { flexGrow: 1, justifyContent: "center", paddingBottom: 96 }, emptyCard: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, paddingHorizontal: 30, paddingVertical: 32 }, emptyTitle: { color: colors.foreground, fontSize: 17, fontWeight: "700", marginTop: 12 }, emptyText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: "center" },
  libraryCard: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", minHeight: 82, paddingHorizontal: 13, paddingVertical: 12 }, libraryMain: { flex: 1 }, libraryTitle: { color: colors.foreground, fontSize: 15, fontWeight: "800" }, libraryExpression: { color: colors.primary, fontFamily: mono, fontSize: 12, fontWeight: "700", marginTop: 5 }, deleteButton: { alignItems: "center", height: 38, justifyContent: "center", width: 38 },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] }, cardPressed: { opacity: 0.74 }, iconPressed: { opacity: 0.55 },
  modalBackdrop: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" }, sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: "92%", paddingBottom: 36, paddingHorizontal: 22, paddingTop: 10 }, sheetHandle: { alignSelf: "center", backgroundColor: colors.border, borderRadius: 3, height: 5, width: 42 }, sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", paddingBottom: 16, paddingTop: 17 }, sheetTitle: { color: colors.foreground, fontSize: 21, fontWeight: "700" }, closeButton: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  fieldLabel: { color: colors.foreground, fontSize: 13, fontWeight: "700", marginBottom: 7, marginTop: 12 }, hintText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 8, marginTop: -4 }, input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.foreground, fontFamily: mono, fontSize: 16, minHeight: 48, paddingHorizontal: 14 }, error: { color: colors.error, fontSize: 13, lineHeight: 19, marginTop: 11 }, saveButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 13, marginTop: 22, minHeight: 52, justifyContent: "center" }, saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
  categoryPicker: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  sectionChipExpanded: { backgroundColor: colors.primarySurface },
  sectionChipExpandedText: { color: colors.primary },
  // サブカテゴリ行。少し右にインデントし、上に余白を足して親カテゴリの下位であることを視覚的に示す。
  categoryPickerChild: { borderLeftColor: colors.border, borderLeftWidth: 2, flexDirection: "row", flexWrap: "wrap", gap: 7, marginLeft: 6, marginTop: 8, paddingLeft: 8 },
  inlineCategoryRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  inlineCategoryInput: { flex: 1, minHeight: 44 },
  inlineCategoryButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 10, justifyContent: "center", paddingHorizontal: 16 },
  inlineCategoryButtonText: { color: colors.onPrimary, fontSize: 13, fontWeight: "800" },
  stepCard: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 13, borderWidth: 1, marginTop: 8, padding: 11 }, stepHeader: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" }, removeStepText: { color: colors.error, fontSize: 12, fontWeight: "700" }, stepInput: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, color: colors.foreground, fontFamily: mono, fontSize: 14, minHeight: 38, paddingHorizontal: 0 }, addStepButton: { alignItems: "center", borderColor: colors.primaryBorder, borderRadius: 11, borderStyle: "dashed", borderWidth: 1, marginTop: 10, paddingVertical: 11 }, addStepText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  latexPreview: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 10, borderWidth: 1, marginTop: 8, padding: 10 },
  formulaExplanationInput: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, color: colors.foreground, flex: 1, fontSize: 14, lineHeight: 19, minHeight: 38, paddingHorizontal: 0, paddingVertical: 6, textAlignVertical: "top" },
  fieldSubLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 9 },
  // 記号ボタン列（ギリシャ文字・下付き文字・定義済み変数）。横スクロール1行に収め、モーダルが縦に伸びすぎないようにする。
  railLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.3, marginTop: 8, textTransform: "uppercase" },
  railGroupTabs: { gap: 6, paddingTop: 6 },
  railGroupTab: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  railGroupTabActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  railGroupTabText: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  railGroupTabTextActive: { color: colors.onPrimary },
  unitRail: { gap: 6, paddingTop: 6 },
  unitChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  unitChipText: { color: colors.primary, fontFamily: mono, fontSize: 12, fontWeight: "800" },
});
