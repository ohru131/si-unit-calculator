import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { exportConstantsBackup, pickConstantsBackup } from "@/lib/constants-backup-file";
import {
  type CalculationNotebook,
  type CalculationNoteStep,
  type NotebookLocalConstant,
  type SavedCustomFunction,
  UNCATEGORIZED_CATEGORY_ID,
  useCalculatorStore,
} from "@/lib/calculator-store";
import { useGlobalSettings } from "@/lib/global-settings";
import { PRESET_NOTEBOOK_CATEGORIES } from "@/lib/notebook-formulas";
import { formatQuantity, SavedConstant } from "@/lib/units";

type TopSection = "templates" | "notebooks" | "constants" | "functions";
type LegacyEditorKind = "constants" | "functions" | null;

const FUNCTION_NAMES = new Set(["sin", "cos", "tan", "asin", "acos", "atan", "atan2", "sqrt", "ln", "log", "log2", "pi", "e"]);
const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

let localConstantSeq = 0;
let stepSeq = 0;
const nextLocalConstantId = () => `local-${Date.now()}-${localConstantSeq++}`;
const nextStepId = () => `step-${Date.now()}-${stepSeq++}`;

export default function ConstantsScreen() {
  const router = useRouter();
  const { templateExpression, templateUnit } = useLocalSearchParams<{ templateExpression?: string | string[]; templateUnit?: string | string[] }>();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { language, locale } = useGlobalSettings();
  const {
    constants,
    clearConstants,
    customFunctions,
    hasRestorableConstants,
    importConstants,
    isLoading,
    notebooks,
    notebookCategories,
    removeConstant,
    removeCustomFunction,
    removeNotebook,
    removeNotebookCategory,
    removeTemplate,
    restoreClearedConstants,
    templates,
    toggleTemplatePinned,
    upsertConstant,
    upsertCustomFunction,
    upsertNotebook,
    upsertNotebookCategory,
    upsertTemplate,
  } = useCalculatorStore();

  const [topSection, setTopSection] = useState<TopSection>("templates");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);

  // 定数・自作関数（両方ともグローバル、ノートとは別枠）の従来通りの編集シート。
  const [legacyEditorKind, setLegacyEditorKind] = useState<LegacyEditorKind>(null);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [symbol, setSymbol] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [parameters, setParameters] = useState("");
  const [functionTitle, setFunctionTitle] = useState("");
  const [functionDescription, setFunctionDescription] = useState("");
  const [legacyExpression, setLegacyExpression] = useState("");
  const [legacyError, setLegacyError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [backupNotice, setBackupNotice] = useState("");

  // テンプレート（電卓画面にピン留めできる単一式）の編集シート。
  const [templateEditorVisible, setTemplateEditorVisible] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>();
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateExpressionInput, setTemplateExpressionInput] = useState("");
  const [templateTargetUnit, setTemplateTargetUnit] = useState("");
  const [templateError, setTemplateError] = useState("");

  // 計算ノートの編集シート。
  const [notebookEditorVisible, setNotebookEditorVisible] = useState(false);
  const [editingNotebookId, setEditingNotebookId] = useState<string | undefined>();
  const [notebookTitle, setNotebookTitle] = useState("");
  const [notebookDescription, setNotebookDescription] = useState("");
  const [notebookCategoryId, setNotebookCategoryId] = useState<string>(UNCATEGORIZED_CATEGORY_ID);
  const [notebookLocalConstants, setNotebookLocalConstants] = useState<NotebookLocalConstant[]>([]);
  const [notebookSteps, setNotebookSteps] = useState<CalculationNoteStep[]>([]);
  const [notebookError, setNotebookError] = useState("");
  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const copy = language === "en" ? {
    title: "Library", subtitle: "Save reusable templates, calculation notebooks, functions, and constants on this device.",
    templatesTab: "Templates", notebooksTab: "Notebooks", constantsTab: "Global constants", functionsTab: "Functions",
    add: "Add", close: "Close", save: "Save", saving: "Saving…", delete: "Delete", cancel: "Cancel",
    templateEmpty: "No templates yet", templateEmptyHint: "Save a familiar calculation so you can start with it next time.", pin: "Pin to calculator", unpin: "Unpin from calculator", templateEditor: "Save template",
    functionEmpty: "No custom functions yet", functionEmptyHint: "Define a reusable formula such as circleArea(r) = pi × r^2.",
    constantEmpty: "No constants yet", constantEmptyHint: "Store a reusable value such as W = 3cm.",
    titleLabel: "Name", descriptionLabel: "Description", expressionLabel: "Expression", symbolLabel: "Symbol",
    functionNameLabel: "Function name", parametersLabel: "Parameters, comma-separated",
    functionEditor: "Custom function", constantEditor: "Constant",
    deleteConfirm: "Delete this item?", validation: "Please fill in the required fields.",
    backup: "Backup", export: "Export", import: "Import", clearAll: "Clear all", restore: "Restore",
    exportDone: "Constants backup exported.", importMode: "How should imported constants be applied?",
    merge: "Merge and replace matches", replace: "Replace all constants", importDone: "{count} constants imported.",
    clearConfirm: "Clear all saved constants? You can restore the latest cleared set.",
    cleared: "Constants cleared. You can restore them from this device.", restored: "Cleared constants restored.",
    notebookNew: "New notebook", notebookEdit: "Edit notebook", notebookTitleLabel: "Title", notebookDescriptionLabel: "Description",
    category: "Category", newCategory: "New category", categoryName: "Category name", uncategorized: "Uncategorized",
    localConstants: "Local constants (inputs)", localConstantsHint: "e.g. W, H, span. Later rows can reference earlier ones.",
    addLocalConstant: "Add constant", steps: "Steps", addStep: "Add step", stepTitlePlaceholder: "Step name",
    outputUnitLabel: "Display unit (optional)", removeRow: "Remove",
  } : {
    title: "ライブラリ", subtitle: "よく使うテンプレート・計算ノート・自作関数・定数を、この端末に保存して再利用できます。",
    templatesTab: "テンプレート", notebooksTab: "計算ノート", constantsTab: "グローバル定数", functionsTab: "自作関数",
    add: "追加", close: "閉じる", save: "保存", saving: "保存中…", delete: "削除", cancel: "キャンセル",
    templateEmpty: "テンプレートはまだありません", templateEmptyHint: "よく使う計算を保存すると、次回すぐに呼び出せます。", pin: "電卓画面にピン留め", unpin: "ピン留めを解除", templateEditor: "テンプレートを保存",
    functionEmpty: "自作関数はまだありません", functionEmptyHint: "例：circleArea(r) = pi × r^2 のように式を再利用できます。",
    constantEmpty: "定数はまだありません", constantEmptyHint: "例：W = 3cm のように、よく使う値を保存できます。",
    titleLabel: "名前", descriptionLabel: "説明", expressionLabel: "式", symbolLabel: "記号",
    functionNameLabel: "関数名", parametersLabel: "引数（カンマ区切り）",
    functionEditor: "自作関数", constantEditor: "定数",
    deleteConfirm: "この項目を削除しますか？", validation: "必須項目を入力してください。",
    backup: "バックアップ", export: "書き出す", import: "読み込む", clearAll: "すべて消去", restore: "復活",
    exportDone: "定数バックアップを書き出しました。", importMode: "読み込む定数をどのように反映しますか？",
    merge: "追加・同名は置換", replace: "すべての定数を置換", importDone: "{count}件の定数を読み込みました。",
    clearConfirm: "保存済みの定数をすべて消去しますか？直前に消去した一覧は復活できます。",
    cleared: "定数を消去しました。この端末上で復活できます。", restored: "消去した定数を復活しました。",
    notebookNew: "新しい計算ノート", notebookEdit: "計算ノートを編集", notebookTitleLabel: "タイトル", notebookDescriptionLabel: "説明",
    category: "カテゴリ", newCategory: "新しいカテゴリ", categoryName: "カテゴリ名", uncategorized: "未分類",
    localConstants: "ローカル定数（入力値）", localConstantsHint: "例：W, H, スパン。後の行で前の行を参照できます。",
    addLocalConstant: "定数を追加", steps: "手順（結果）", addStep: "手順を追加", stepTitlePlaceholder: "手順の名前",
    outputUnitLabel: "表示単位（任意）", removeRow: "削除",
  };

  const sortedTemplates = useMemo(
    () => [...templates].sort((left, right) => Number(right.pinned) - Number(left.pinned) || right.updatedAt.localeCompare(left.updatedAt)),
    [templates],
  );

  const sectionItems: Array<{ id: TopSection; label: string }> = [
    { id: "templates", label: copy.templatesTab },
    { id: "notebooks", label: copy.notebooksTab },
    { id: "functions", label: copy.functionsTab },
    { id: "constants", label: copy.constantsTab },
  ];

  const categoryOptions = useMemo(() => [
    ...PRESET_NOTEBOOK_CATEGORIES.map((category) => ({ id: category.id, label: language === "en" ? category.labelEn : category.label })),
    ...notebookCategories.map((category) => ({ id: category.id, label: category.name })),
    { id: UNCATEGORIZED_CATEGORY_ID, label: copy.uncategorized },
  ], [copy.uncategorized, language, notebookCategories]);

  const categoryLabel = (categoryId: string) => categoryOptions.find((item) => item.id === categoryId)?.label ?? copy.uncategorized;

  const resetLegacyEditor = () => {
    setEditingId(undefined); setSymbol(""); setFunctionName(""); setParameters(""); setFunctionTitle(""); setFunctionDescription(""); setLegacyExpression(""); setLegacyError("");
  };

  const openLegacyEditor = (kind: "constants" | "functions", item?: SavedConstant | SavedCustomFunction) => {
    resetLegacyEditor();
    setLegacyEditorKind(kind);
    if (!item) return;
    if (kind === "constants") {
      const constant = item as SavedConstant;
      setEditingId(constant.symbol); setSymbol(constant.symbol); setLegacyExpression(constant.expression);
    }
    if (kind === "functions") {
      const fn = item as SavedCustomFunction;
      setEditingId(fn.id); setFunctionName(fn.name); setParameters(fn.parameters.join(", ")); setFunctionTitle(fn.title); setFunctionDescription(fn.description); setLegacyExpression(fn.expression);
    }
  };

  const closeLegacyEditor = () => { if (!isSaving) setLegacyEditorKind(null); };

  const saveLegacy = async () => {
    if (!legacyEditorKind) return;
    setLegacyError(""); setIsSaving(true);
    try {
      if (legacyEditorKind === "constants") {
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(symbol.trim()) || !legacyExpression.trim()) throw new Error(copy.validation);
        if (editingId && editingId !== symbol.trim()) await removeConstant(editingId);
        await upsertConstant(symbol.trim(), legacyExpression.trim());
      }
      if (legacyEditorKind === "functions") {
        const name = functionName.trim();
        const normalizedParameters = parameters.split(",").map((item) => item.trim()).filter(Boolean);
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || FUNCTION_NAMES.has(name) || !functionTitle.trim() || !legacyExpression.trim() || normalizedParameters.some((parameter) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(parameter)) || new Set(normalizedParameters).size !== normalizedParameters.length) throw new Error(copy.validation);
        await upsertCustomFunction({ id: editingId, name, parameters: normalizedParameters, title: functionTitle.trim(), description: functionDescription.trim(), expression: legacyExpression.trim() });
      }
      setLegacyEditorKind(null);
    } catch (cause) {
      setLegacyError(cause instanceof Error ? cause.message : copy.validation);
    } finally { setIsSaving(false); }
  };

  const confirmDeleteLegacy = (kind: "constants" | "functions", id: string) => {
    Alert.alert(copy.delete, copy.deleteConfirm, [
      { text: copy.cancel, style: "cancel" },
      { text: copy.delete, style: "destructive", onPress: () => {
        const action = kind === "constants" ? removeConstant(id) : removeCustomFunction(id);
        action.catch(() => Alert.alert("Error", "Could not delete this item."));
      } },
    ]);
  };

  const handleExportConstants = async () => {
    try {
      await exportConstantsBackup(constants);
      setBackupNotice(copy.exportDone);
    } catch (cause) {
      setBackupNotice(cause instanceof Error ? cause.message : copy.validation);
    }
  };

  const handleImportConstants = async () => {
    try {
      const entries = await pickConstantsBackup();
      if (!entries) return;
      Alert.alert(copy.import, copy.importMode, [
        { text: copy.cancel, style: "cancel" },
        { text: copy.merge, onPress: () => { void importConstants(entries, "merge").then((count) => setBackupNotice(copy.importDone.replace("{count}", String(count)))).catch((cause) => setBackupNotice(cause instanceof Error ? cause.message : copy.validation)); } },
        { text: copy.replace, style: "destructive", onPress: () => { void importConstants(entries, "replace").then((count) => setBackupNotice(copy.importDone.replace("{count}", String(count)))).catch((cause) => setBackupNotice(cause instanceof Error ? cause.message : copy.validation)); } },
      ]);
    } catch (cause) {
      setBackupNotice(cause instanceof Error ? cause.message : copy.validation);
    }
  };

  const handleClearConstants = () => {
    Alert.alert(copy.clearAll, copy.clearConfirm, [
      { text: copy.cancel, style: "cancel" },
      { text: copy.clearAll, style: "destructive", onPress: () => { void clearConstants().then(() => setBackupNotice(copy.cleared)).catch((cause) => setBackupNotice(cause instanceof Error ? cause.message : copy.validation)); } },
    ]);
  };

  const handleRestoreConstants = async () => {
    try {
      if (await restoreClearedConstants()) setBackupNotice(copy.restored);
    } catch (cause) {
      setBackupNotice(cause instanceof Error ? cause.message : copy.validation);
    }
  };

  // テンプレート：編集シートの開閉。タップした行はそのまま電卓へ読み込まれるため、
  // ここでは新規作成（電卓画面からのピン留め・ライブラリの＋ボタン）のみ扱う。
  const resetTemplateEditor = () => {
    setEditingTemplateId(undefined); setTemplateTitle(""); setTemplateDescription("");
    setTemplateExpressionInput(""); setTemplateTargetUnit(""); setTemplateError("");
  };

  const openNewTemplateEditor = (presetExpression?: string, presetTargetUnit?: string) => {
    resetTemplateEditor();
    if (presetExpression) setTemplateExpressionInput(presetExpression);
    if (presetTargetUnit) setTemplateTargetUnit(presetTargetUnit);
    setTemplateEditorVisible(true);
  };

  const closeTemplateEditor = () => { if (!isSaving) setTemplateEditorVisible(false); };

  const loadExpression = (nextExpression: string, nextTargetUnit: string) => {
    router.push({ pathname: "/", params: { presetExpression: nextExpression, presetUnit: nextTargetUnit } });
  };

  const saveTemplate = async () => {
    setTemplateError("");
    if (!templateTitle.trim() || !templateExpressionInput.trim()) { setTemplateError(copy.validation); return; }
    setIsSaving(true);
    try {
      await upsertTemplate({ id: editingTemplateId, title: templateTitle.trim(), description: templateDescription.trim(), expression: templateExpressionInput.trim(), targetUnit: templateTargetUnit.trim() });
      setTemplateEditorVisible(false);
    } catch (cause) {
      setTemplateError(cause instanceof Error ? cause.message : copy.validation);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteTemplate = (id: string) => {
    Alert.alert(copy.delete, copy.deleteConfirm, [
      { text: copy.cancel, style: "cancel" },
      { text: copy.delete, style: "destructive", onPress: () => {
        removeTemplate(id).catch(() => Alert.alert("Error", "Could not delete this item."));
      } },
    ]);
  };

  // 計算ノート：編集シートの開閉。
  const resetNotebookEditor = () => {
    setEditingNotebookId(undefined); setNotebookTitle(""); setNotebookDescription("");
    setNotebookCategoryId(selectedCategoryId ?? UNCATEGORIZED_CATEGORY_ID);
    setNotebookLocalConstants([]); setNotebookSteps([]); setNotebookError("");
    setShowNewCategoryField(false); setNewCategoryName("");
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
    setNotebookLocalConstants(notebook.localConstants.map((item) => ({ ...item })));
    setNotebookSteps(notebook.steps.map((item) => ({ ...item })));
    setNotebookError("");
    setShowNewCategoryField(false); setNewCategoryName("");
    setNotebookEditorVisible(true);
  };

  // ルートパラメータ（電卓画面のピン留めボタン）は常にテンプレートを開く契約。
  useEffect(() => {
    const nextExpression = Array.isArray(templateExpression) ? templateExpression[0] : templateExpression;
    const nextUnit = Array.isArray(templateUnit) ? templateUnit[0] : templateUnit;
    if (!nextExpression) return;
    setTopSection("templates");
    openNewTemplateEditor(nextExpression, nextUnit);
    // ルートパラメータはナビゲーションのたびに一度だけ処理する。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateExpression, templateUnit]);

  const closeNotebookEditor = () => setNotebookEditorVisible(false);

  const saveNotebook = async () => {
    setNotebookError("");
    const title = notebookTitle.trim();
    const normalizedSteps = notebookSteps.filter((step) => step.expression.trim()).map((step) => ({ ...step, title: step.title.trim() || step.expression.trim(), expression: step.expression.trim(), targetUnit: step.targetUnit.trim() }));
    const normalizedConstants = notebookLocalConstants.filter((item) => item.symbol.trim() && item.expression.trim()).map((item) => ({ ...item, symbol: item.symbol.trim(), expression: item.expression.trim() }));
    if (!title || !normalizedSteps.length) { setNotebookError(copy.validation); return; }
    setIsSaving(true);
    try {
      await upsertNotebook({ id: editingNotebookId, title, description: notebookDescription.trim(), categoryId: notebookCategoryId, localConstants: normalizedConstants, steps: normalizedSteps });
      setNotebookEditorVisible(false);
    } catch (cause) {
      setNotebookError(cause instanceof Error ? cause.message : copy.validation);
    } finally {
      setIsSaving(false);
    }
  };

  const createCategoryInline = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const created = await upsertNotebookCategory({ name });
    setNotebookCategoryId(created.id);
    setShowNewCategoryField(false);
    setNewCategoryName("");
  };

  const updateLocalConstant = (id: string, patch: Partial<NotebookLocalConstant>) =>
    setNotebookLocalConstants((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const updateStep = (id: string, patch: Partial<CalculationNoteStep>) =>
    setNotebookSteps((current) => current.map((step) => (step.id === id ? { ...step, ...patch } : step)));

  const selectedNotebook = selectedNotebookId ? notebooks.find((item) => item.id === selectedNotebookId) : undefined;
  const notebooksInCategory = selectedCategoryId ? notebooks.filter((item) => item.categoryId === selectedCategoryId) : [];

  const renderNotebooksSection = () => {
    if (selectedNotebook) {
      return (
        <NotebookDetail
          language={language}
          locale={locale}
          notebook={selectedNotebook}
          globalConstants={constants}
          customFunctions={customFunctions}
          onBack={() => setSelectedNotebookId(null)}
          onEdit={() => openEditNotebook(selectedNotebook)}
          onSaveValues={(nextLocalConstants) => { void upsertNotebook({ id: selectedNotebook.id, title: selectedNotebook.title, description: selectedNotebook.description, categoryId: selectedNotebook.categoryId, localConstants: nextLocalConstants, steps: selectedNotebook.steps }); }}
        />
      );
    }
    if (selectedCategoryId) {
      return (
        <NotebookList
          language={language}
          categoryLabel={categoryLabel(selectedCategoryId)}
          notebooks={notebooksInCategory}
          onBack={() => setSelectedCategoryId(null)}
          onOpen={setSelectedNotebookId}
          onDelete={(id) => void removeNotebook(id)}
        />
      );
    }
    return (
      <NotebookCategoryGrid
        language={language}
        notebooks={notebooks}
        notebookCategories={notebookCategories}
        onSelectCategory={setSelectedCategoryId}
        onCreateCategory={(name) => void upsertNotebookCategory({ name })}
        onRenameCategory={(id, name) => void upsertNotebookCategory({ id, name })}
        onDeleteCategory={(id) => void removeNotebookCategory(id)}
      />
    );
  };

  const renderEmpty = (titleText: string, hint: string) => <View style={styles.emptyCard}><IconSymbol name="bookmark.fill" size={30} color={colors.primary} /><Text style={styles.emptyTitle}>{titleText}</Text><Text style={styles.emptyText}>{hint}</Text></View>;

  const renderTemplatesSection = () => (
    <FlatList
      data={sortedTemplates}
      keyExtractor={(item) => item.id}
      contentContainerStyle={templates.length ? styles.list : styles.emptyList}
      ListEmptyComponent={renderEmpty(copy.templateEmpty, copy.templateEmptyHint)}
      renderItem={({ item }) => (
        <View style={styles.libraryCard}>
          <Pressable onPress={() => loadExpression(item.expression, item.targetUnit)} style={({ pressed }) => [styles.libraryMain, pressed && styles.cardPressed]}>
            <Text style={styles.libraryTitle}>{item.title}</Text>
            {item.description ? <Text numberOfLines={1} style={styles.libraryDescription}>{item.description}</Text> : null}
            <Text numberOfLines={1} style={styles.libraryExpression}>{item.expression}{item.targetUnit ? ` → ${item.targetUnit}` : ""}</Text>
          </Pressable>
          <Pressable accessibilityLabel={item.pinned ? copy.unpin : copy.pin} onPress={() => void toggleTemplatePinned(item.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.iconPressed]}>
            <IconSymbol name="pin.fill" size={20} color={item.pinned ? colors.primary : colors.muted} />
          </Pressable>
          <Pressable accessibilityLabel={copy.delete} onPress={() => confirmDeleteTemplate(item.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.iconPressed]}>
            <IconSymbol name="trash" size={20} color={colors.error} />
          </Pressable>
        </View>
      )}
    />
  );

  const renderLegacySection = () => {
    if (topSection === "functions") return <FlatList data={customFunctions} keyExtractor={(item) => item.id} contentContainerStyle={customFunctions.length ? styles.list : styles.emptyList} ListEmptyComponent={renderEmpty(copy.functionEmpty, copy.functionEmptyHint)} renderItem={({ item }) => <View style={styles.libraryCard}><Pressable onPress={() => openLegacyEditor("functions", item)} style={({ pressed }) => [styles.libraryMain, pressed && styles.cardPressed]}><Text style={styles.libraryTitle}>{item.title}</Text><Text style={styles.libraryExpression}>{item.name}({item.parameters.join(", ")}) = {item.expression}</Text>{item.description ? <Text numberOfLines={1} style={styles.libraryDescription}>{item.description}</Text> : null}</Pressable><Pressable accessibilityLabel={copy.delete} onPress={() => confirmDeleteLegacy("functions", item.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.iconPressed]}><IconSymbol name="trash" size={20} color={colors.error} /></Pressable></View>} />;
    return <FlatList data={constants} keyExtractor={(item) => item.symbol} contentContainerStyle={constants.length ? styles.list : styles.emptyList} ListEmptyComponent={renderEmpty(copy.constantEmpty, copy.constantEmptyHint)} renderItem={({ item }) => <View style={styles.libraryCard}><Pressable onPress={() => openLegacyEditor("constants", item)} style={({ pressed }) => [styles.libraryMain, pressed && styles.cardPressed]}><Text style={styles.libraryTitle}>{item.symbol} = {item.expression}</Text><Text style={styles.libraryExpression}>{formatQuantity(item.quantity)}</Text></Pressable><Pressable accessibilityLabel={copy.delete} onPress={() => confirmDeleteLegacy("constants", item.symbol)} style={({ pressed }) => [styles.deleteButton, pressed && styles.iconPressed]}><IconSymbol name="trash" size={20} color={colors.error} /></Pressable></View>} />;
  };

  const renderContent = () => {
    if (topSection === "templates") return renderTemplatesSection();
    if (topSection === "notebooks") return renderNotebooksSection();
    return renderLegacySection();
  };

  const handleAddPress = () => {
    if (topSection === "constants") openLegacyEditor("constants");
    else if (topSection === "functions") openLegacyEditor("functions");
    else if (topSection === "templates") openNewTemplateEditor();
    else if (selectedNotebook) openEditNotebook(selectedNotebook);
    else if (selectedCategoryId) openNewNotebook();
    // カテゴリ一覧を見ているときは、カード内の「＋新しいカテゴリ」から作成する。
  };

  const showAddButton = topSection !== "notebooks" || Boolean(selectedCategoryId) || Boolean(selectedNotebook);

  return <ScreenContainer className="px-5" containerClassName="bg-background">
    <View style={styles.header}>
      <View><Text style={styles.title}>{copy.title}</Text><Text style={styles.subtitle}>{copy.subtitle}</Text></View>
      {showAddButton ? <Pressable accessibilityLabel={copy.add} onPress={handleAddPress} style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}><IconSymbol name={selectedNotebook ? "pencil" : "plus.circle.fill"} size={selectedNotebook ? 20 : 28} color={colors.primary} /></Pressable> : null}
    </View>
    <View style={styles.sectionRail}>
      {sectionItems.map((item) => (
        <Pressable key={item.id} onPress={() => { setTopSection(item.id); setSelectedCategoryId(null); setSelectedNotebookId(null); }} style={({ pressed }) => [styles.sectionChip, topSection === item.id && styles.sectionChipActive, pressed && styles.buttonPressed]}>
          <Text style={[styles.sectionChipText, topSection === item.id && styles.sectionChipTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
    {topSection === "constants" ? <View style={styles.backupCard}><Text style={styles.backupTitle}>{copy.backup}</Text><View style={styles.backupActions}><Pressable onPress={() => void handleExportConstants()} style={({ pressed }) => [styles.backupButton, pressed && styles.buttonPressed]}><Text style={styles.backupButtonText}>{copy.export}</Text></Pressable><Pressable onPress={() => void handleImportConstants()} style={({ pressed }) => [styles.backupButton, pressed && styles.buttonPressed]}><Text style={styles.backupButtonText}>{copy.import}</Text></Pressable><Pressable onPress={handleClearConstants} style={({ pressed }) => [styles.clearButton, pressed && styles.buttonPressed]}><Text style={styles.clearButtonText}>{copy.clearAll}</Text></Pressable>{hasRestorableConstants ? <Pressable onPress={() => void handleRestoreConstants()} style={({ pressed }) => [styles.restoreButton, pressed && styles.buttonPressed]}><Text style={styles.restoreButtonText}>{copy.restore}</Text></Pressable> : null}</View>{backupNotice ? <Text style={styles.backupNotice}>{backupNotice}</Text> : null}</View> : null}

    {isLoading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : renderContent()}

    <Modal visible={Boolean(legacyEditorKind)} transparent animationType="slide" onRequestClose={closeLegacyEditor}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
        <View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>{legacyEditorKind === "functions" ? copy.functionEditor : copy.constantEditor}</Text><Text style={styles.sheetDescription}>{copy.subtitle}</Text></View><Pressable accessibilityLabel={copy.close} onPress={closeLegacyEditor} style={({ pressed }) => [styles.closeButton, pressed && styles.iconPressed]}><IconSymbol name="xmark" size={21} color={colors.muted} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {legacyEditorKind === "constants" ? <><Text style={styles.fieldLabel}>{copy.symbolLabel}</Text><TextInput value={symbol} onChangeText={setSymbol} placeholder="W" placeholderTextColor={colors.placeholder} autoCapitalize="characters" autoCorrect={false} style={styles.input} /><Text style={styles.fieldLabel}>{copy.expressionLabel}</Text><TextInput value={legacyExpression} onChangeText={setLegacyExpression} placeholder="3cm" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} /></> : null}
            {legacyEditorKind === "functions" ? <><Text style={styles.fieldLabel}>{copy.titleLabel}</Text><TextInput value={functionTitle} onChangeText={setFunctionTitle} placeholder={language === "en" ? "Circle area" : "円の面積"} placeholderTextColor={colors.placeholder} style={styles.input} /><Text style={styles.fieldLabel}>{copy.functionNameLabel}</Text><TextInput value={functionName} onChangeText={setFunctionName} placeholder="circleArea" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} /><Text style={styles.fieldLabel}>{copy.parametersLabel}</Text><TextInput value={parameters} onChangeText={setParameters} placeholder="r" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} /><Text style={styles.fieldLabel}>{copy.expressionLabel}</Text><TextInput value={legacyExpression} onChangeText={setLegacyExpression} placeholder="pi × r^2" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} /><Text style={styles.fieldLabel}>{copy.descriptionLabel}</Text><TextInput value={functionDescription} onChangeText={setFunctionDescription} placeholder={language === "en" ? "Reusable geometry formula" : "繰り返し使う幾何の式"} placeholderTextColor={colors.placeholder} style={styles.input} /></> : null}
            {legacyError ? <Text style={styles.error}>{legacyError}</Text> : null}
            <Pressable disabled={isSaving} onPress={() => void saveLegacy()} style={({ pressed }) => [styles.saveButton, (pressed || isSaving) && styles.buttonPressed]}><Text style={styles.saveText}>{isSaving ? copy.saving : copy.save}</Text></Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    <Modal visible={templateEditorVisible} transparent animationType="slide" onRequestClose={closeTemplateEditor}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
        <View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>{copy.templateEditor}</Text></View><Pressable accessibilityLabel={copy.close} onPress={closeTemplateEditor} style={({ pressed }) => [styles.closeButton, pressed && styles.iconPressed]}><IconSymbol name="xmark" size={21} color={colors.muted} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>{copy.titleLabel}</Text>
            <TextInput value={templateTitle} onChangeText={setTemplateTitle} placeholder={language === "en" ? "Walking speed" : "歩行速度"} placeholderTextColor={colors.placeholder} style={styles.input} />
            <Text style={styles.fieldLabel}>{copy.expressionLabel}</Text>
            <TextInput value={templateExpressionInput} onChangeText={setTemplateExpressionInput} placeholder="1km ÷ 12min" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} />
            <Text style={styles.fieldLabel}>{copy.outputUnitLabel}</Text>
            <TextInput value={templateTargetUnit} onChangeText={setTemplateTargetUnit} placeholder="km/h" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} />
            <Text style={styles.fieldLabel}>{copy.descriptionLabel}</Text>
            <TextInput value={templateDescription} onChangeText={setTemplateDescription} placeholder={language === "en" ? "Optional note" : "任意のメモ"} placeholderTextColor={colors.placeholder} style={styles.input} />
            {templateError ? <Text style={styles.error}>{templateError}</Text> : null}
            <Pressable disabled={isSaving} onPress={() => void saveTemplate()} style={({ pressed }) => [styles.saveButton, (pressed || isSaving) && styles.buttonPressed]}><Text style={styles.saveText}>{isSaving ? copy.saving : copy.save}</Text></Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    <Modal visible={notebookEditorVisible} transparent animationType="slide" onRequestClose={closeNotebookEditor}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
        <View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>{editingNotebookId ? copy.notebookEdit : copy.notebookNew}</Text></View><Pressable accessibilityLabel={copy.close} onPress={closeNotebookEditor} style={({ pressed }) => [styles.closeButton, pressed && styles.iconPressed]}><IconSymbol name="xmark" size={21} color={colors.muted} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>{copy.notebookTitleLabel}</Text>
            <TextInput value={notebookTitle} onChangeText={setNotebookTitle} placeholder={language === "en" ? "Bending stress" : "曲げ応力"} placeholderTextColor={colors.placeholder} style={styles.input} />
            <Text style={styles.fieldLabel}>{copy.notebookDescriptionLabel}</Text>
            <TextInput value={notebookDescription} onChangeText={setNotebookDescription} placeholder={language === "en" ? "Optional note" : "任意のメモ"} placeholderTextColor={colors.placeholder} style={styles.input} />

            <Text style={styles.fieldLabel}>{copy.category}</Text>
            <View style={styles.categoryPicker}>
              {categoryOptions.map((option) => (
                <Pressable key={option.id} onPress={() => setNotebookCategoryId(option.id)} style={({ pressed }) => [styles.sectionChip, notebookCategoryId === option.id && styles.sectionChipActive, pressed && styles.buttonPressed]}>
                  <Text style={[styles.sectionChipText, notebookCategoryId === option.id && styles.sectionChipTextActive]}>{option.label}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setShowNewCategoryField((current) => !current)} style={({ pressed }) => [styles.sectionChip, pressed && styles.buttonPressed]}>
                <Text style={styles.sectionChipText}>＋ {copy.newCategory}</Text>
              </Pressable>
            </View>
            {showNewCategoryField ? (
              <View style={styles.inlineCategoryRow}>
                <TextInput value={newCategoryName} onChangeText={setNewCategoryName} placeholder={copy.categoryName} placeholderTextColor={colors.placeholder} style={[styles.input, styles.inlineCategoryInput]} onSubmitEditing={() => void createCategoryInline()} returnKeyType="done" />
                <Pressable onPress={() => void createCategoryInline()} style={({ pressed }) => [styles.inlineCategoryButton, pressed && styles.buttonPressed]}><Text style={styles.inlineCategoryButtonText}>{copy.save}</Text></Pressable>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>{copy.localConstants}</Text>
            <Text style={styles.hintText}>{copy.localConstantsHint}</Text>
            {notebookLocalConstants.map((item) => (
              <View key={item.id} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <TextInput value={item.symbol} onChangeText={(text) => updateLocalConstant(item.id, { symbol: text })} placeholder={copy.symbolLabel} placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.localConstantSymbolInput} />
                  <Pressable onPress={() => setNotebookLocalConstants((current) => current.filter((entry) => entry.id !== item.id))}><Text style={styles.removeStepText}>{copy.removeRow}</Text></Pressable>
                </View>
                <TextInput value={item.expression} onChangeText={(text) => updateLocalConstant(item.id, { expression: text })} placeholder="3cm" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.stepInput} />
              </View>
            ))}
            <Pressable onPress={() => setNotebookLocalConstants((current) => [...current, { id: nextLocalConstantId(), symbol: "", expression: "" }])} style={({ pressed }) => [styles.addStepButton, pressed && styles.buttonPressed]}><Text style={styles.addStepText}>＋ {copy.addLocalConstant}</Text></Pressable>

            <Text style={styles.fieldLabel}>{copy.steps}</Text>
            {notebookSteps.map((step) => (
              <View key={step.id} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <TextInput value={step.title} onChangeText={(text) => updateStep(step.id, { title: text })} placeholder={copy.stepTitlePlaceholder} placeholderTextColor={colors.placeholder} style={styles.stepInput} />
                  <Pressable onPress={() => setNotebookSteps((current) => current.filter((entry) => entry.id !== step.id))}><Text style={styles.removeStepText}>{copy.removeRow}</Text></Pressable>
                </View>
                <TextInput value={step.expression} onChangeText={(text) => updateStep(step.id, { expression: text })} placeholder="M/Z" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.stepInput} />
                <TextInput value={step.targetUnit} onChangeText={(text) => updateStep(step.id, { targetUnit: text })} placeholder={copy.outputUnitLabel} placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.stepInput} />
              </View>
            ))}
            <Pressable onPress={() => setNotebookSteps((current) => [...current, { id: nextStepId(), title: "", expression: "", targetUnit: "" }])} style={({ pressed }) => [styles.addStepButton, pressed && styles.buttonPressed]}><Text style={styles.addStepText}>＋ {copy.addStep}</Text></Pressable>

            {notebookError ? <Text style={styles.error}>{notebookError}</Text> : null}
            <Pressable disabled={isSaving} onPress={() => void saveNotebook()} style={({ pressed }) => [styles.saveButton, (pressed || isSaving) && styles.buttonPressed]}><Text style={styles.saveText}>{isSaving ? copy.saving : copy.save}</Text></Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </ScreenContainer>;
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", paddingBottom: 14, paddingTop: 8 },
  title: { color: colors.foreground, fontSize: 30, fontWeight: "700", letterSpacing: -0.6 }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4, maxWidth: "88%" },
  addButton: { alignItems: "center", backgroundColor: colors.primarySurface, borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  sectionRail: { flexDirection: "row", flexWrap: "wrap", gap: 7, paddingBottom: 14 }, sectionChip: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8 }, sectionChipActive: { backgroundColor: colors.primaryFill }, sectionChipText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, sectionChipTextActive: { color: colors.onPrimary },
  backupCard: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 14, borderWidth: 1, marginBottom: 12, padding: 12 }, backupTitle: { color: colors.foreground, fontSize: 13, fontWeight: "800" }, backupActions: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 9 }, backupButton: { backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 }, backupButtonText: { color: colors.primary, fontSize: 12, fontWeight: "800" }, clearButton: { backgroundColor: colors.errorSurface, borderColor: colors.errorBorder, borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 }, clearButtonText: { color: colors.error, fontSize: 12, fontWeight: "800" }, restoreButton: { backgroundColor: colors.successSurface, borderColor: colors.successBorder, borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 }, restoreButtonText: { color: colors.success, fontSize: 12, fontWeight: "800" }, backupNotice: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 8 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" }, list: { gap: 10, paddingBottom: 30 }, emptyList: { flexGrow: 1, justifyContent: "center", paddingBottom: 96 }, emptyCard: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, paddingHorizontal: 30, paddingVertical: 32 }, emptyTitle: { color: colors.foreground, fontSize: 17, fontWeight: "700", marginTop: 12 }, emptyText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: "center" },
  libraryCard: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", minHeight: 82, paddingHorizontal: 13, paddingVertical: 12 }, libraryMain: { flex: 1 }, libraryTitle: { color: colors.foreground, fontSize: 15, fontWeight: "800" }, libraryDescription: { color: colors.muted, fontSize: 12, marginTop: 3 }, libraryExpression: { color: colors.primary, fontFamily: mono, fontSize: 12, fontWeight: "700", marginTop: 5 }, deleteButton: { alignItems: "center", height: 38, justifyContent: "center", width: 38 },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] }, cardPressed: { opacity: 0.74 }, iconPressed: { opacity: 0.55 },
  modalBackdrop: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" }, sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: "92%", paddingBottom: 36, paddingHorizontal: 22, paddingTop: 10 }, sheetHandle: { alignSelf: "center", backgroundColor: colors.border, borderRadius: 3, height: 5, width: 42 }, sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", paddingBottom: 16, paddingTop: 17 }, sheetTitle: { color: colors.foreground, fontSize: 21, fontWeight: "700" }, sheetDescription: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3, maxWidth: "88%" }, closeButton: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  fieldLabel: { color: colors.foreground, fontSize: 13, fontWeight: "700", marginBottom: 7, marginTop: 12 }, hintText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 8, marginTop: -4 }, input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.foreground, fontFamily: mono, fontSize: 16, minHeight: 48, paddingHorizontal: 14 }, error: { color: colors.error, fontSize: 13, lineHeight: 19, marginTop: 11 }, saveButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 13, marginTop: 22, minHeight: 52, justifyContent: "center" }, saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
  categoryPicker: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  inlineCategoryRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  inlineCategoryInput: { flex: 1, minHeight: 44 },
  inlineCategoryButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 10, justifyContent: "center", paddingHorizontal: 16 },
  inlineCategoryButtonText: { color: colors.onPrimary, fontSize: 13, fontWeight: "800" },
  localConstantSymbolInput: { color: colors.primary, flex: 1, fontFamily: mono, fontSize: 14, fontWeight: "800", minHeight: 30 },
  stepCard: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 13, borderWidth: 1, marginTop: 8, padding: 11 }, stepHeader: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" }, removeStepText: { color: colors.error, fontSize: 12, fontWeight: "700" }, stepInput: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, color: colors.foreground, fontFamily: mono, fontSize: 14, minHeight: 38, paddingHorizontal: 0 }, addStepButton: { alignItems: "center", borderColor: colors.primaryBorder, borderRadius: 11, borderStyle: "dashed", borderWidth: 1, marginTop: 10, paddingVertical: 11 }, addStepText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
});
