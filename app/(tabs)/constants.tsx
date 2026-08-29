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
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type ImportedConstant } from "@/lib/constants-backup";
import { exportConstantsBackup, pickConstantsBackup } from "@/lib/constants-backup-file";
import {
  type CalculationNotebook,
  type CalculationNoteStep,
  type NotebookLocalConstant,
  UNCATEGORIZED_CATEGORY_ID,
  useCalculatorStore,
} from "@/lib/calculator-store";
import { useGlobalSettings } from "@/lib/global-settings";
import { PRESET_NOTEBOOK_CATEGORIES } from "@/lib/notebook-formulas";
import { formatQuantity, SavedConstant } from "@/lib/units";

type TopSection = "notebooks" | "constants";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

let localConstantSeq = 0;
let stepSeq = 0;
const nextLocalConstantId = () => `local-${Date.now()}-${localConstantSeq++}`;
const nextStepId = () => `step-${Date.now()}-${stepSeq++}`;

export default function ConstantsScreen() {
  const router = useRouter();
  const { notebookExpression, notebookUnit, openNotebookId } = useLocalSearchParams<{ notebookExpression?: string | string[]; notebookUnit?: string | string[]; openNotebookId?: string | string[] }>();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { language, locale, unitSystem } = useGlobalSettings();
  const {
    constants,
    clearConstants,
    hasRestorableConstants,
    importConstants,
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
  const [notebookLocalConstants, setNotebookLocalConstants] = useState<NotebookLocalConstant[]>([]);
  const [notebookSteps, setNotebookSteps] = useState<CalculationNoteStep[]>([]);
  const [notebookError, setNotebookError] = useState("");
  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const copy = language === "en" ? {
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
    localConstants: "Local constants (inputs)", localConstantsHint: "e.g. W, H, span. Later rows can reference earlier ones.",
    addLocalConstant: "Add constant", steps: "Steps", addStep: "Add step", stepTitlePlaceholder: "Step name",
    outputUnitLabel: "Display unit (optional)", removeRow: "Remove",
  } : {
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
    localConstants: "ローカル定数（入力値）", localConstantsHint: "例：W, H, スパン。後の行で前の行を参照できます。",
    addLocalConstant: "定数を追加", steps: "手順（結果）", addStep: "手順を追加", stepTitlePlaceholder: "手順の名前",
    outputUnitLabel: "表示単位（任意）", removeRow: "削除",
  };

  const sectionItems: Array<{ id: TopSection; label: string }> = [
    { id: "notebooks", label: copy.notebooksTab },
    { id: "constants", label: copy.constantsTab },
  ];

  const categoryOptions = useMemo(() => [
    ...PRESET_NOTEBOOK_CATEGORIES.map((category) => ({ id: category.id, label: language === "en" ? category.labelEn : category.label })),
    ...notebookCategories.map((category) => ({ id: category.id, label: category.name })),
    { id: UNCATEGORIZED_CATEGORY_ID, label: copy.uncategorized },
  ], [copy.uncategorized, language, notebookCategories]);

  const categoryLabel = (categoryId: string) => categoryOptions.find((item) => item.id === categoryId)?.label ?? copy.uncategorized;

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
      setConstantError(cause instanceof Error ? cause.message : copy.validation);
    } finally { setIsSaving(false); }
  };

  const handleExportConstants = async () => {
    try {
      await exportConstantsBackup(constants);
      setBackupNotice(copy.exportDone);
    } catch (cause) {
      setBackupNotice(cause instanceof Error ? cause.message : copy.validation);
    }
  };

  const handleImportConstants = async (mode: "merge" | "replace") => {
    try {
      const entries = await pickConstantsBackup();
      if (!entries) return;
      if (mode === "replace") { setPendingReplaceImport(entries); return; }
      const count = await importConstants(entries, "merge");
      setBackupNotice(copy.importDone.replace("{count}", String(count)));
    } catch (cause) {
      setBackupNotice(cause instanceof Error ? cause.message : copy.validation);
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
      setBackupNotice(cause instanceof Error ? cause.message : copy.validation);
    }
  };

  const handleClearConstants = async () => {
    try {
      await clearConstants();
      setBackupNotice(copy.cleared);
    } catch (cause) {
      setBackupNotice(cause instanceof Error ? cause.message : copy.validation);
    }
  };

  const handleRestoreConstants = async () => {
    try {
      if (await restoreClearedConstants()) setBackupNotice(copy.restored);
    } catch (cause) {
      setBackupNotice(cause instanceof Error ? cause.message : copy.validation);
    }
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
    setSelectedCategoryId(notebook.categoryId);
    setSelectedNotebookId(notebook.id);
    // パラメータを消費済みにしておく。消さないままだと、一度戻ってから同じ
    // ピン留めチップをもう一度押しても（値が変わらない）再度開けなくなる。
    router.setParams({ openNotebookId: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNotebookId, notebooks]);

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
          unitSystem={unitSystem}
          notebook={selectedNotebook}
          globalConstants={constants}
          onBack={() => setSelectedNotebookId(null)}
          onEdit={() => openEditNotebook(selectedNotebook)}
          onTogglePinned={() => void toggleNotebookPinned(selectedNotebook.id)}
          onSaveValues={(nextLocalConstants) => { void upsertNotebook({ id: selectedNotebook.id, title: selectedNotebook.title, description: selectedNotebook.description, categoryId: selectedNotebook.categoryId, localConstants: nextLocalConstants, steps: selectedNotebook.steps }); }}
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
        onSelectCategory={setSelectedCategoryId}
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
        <Pressable key={item.id} onPress={() => { setTopSection(item.id); setSelectedCategoryId(null); setSelectedNotebookId(null); }} style={({ pressed }) => [styles.sectionChip, topSection === item.id && styles.sectionChipActive, pressed && styles.buttonPressed]}>
          <Text style={[styles.sectionChipText, topSection === item.id && styles.sectionChipTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
    {topSection === "constants" ? <View style={styles.backupCard}><Text style={styles.backupTitle}>{copy.backup}</Text><View style={styles.backupActions}><Pressable onPress={() => void handleExportConstants()} style={({ pressed }) => [styles.backupButton, pressed && styles.buttonPressed]}><Text style={styles.backupButtonText}>{copy.export}</Text></Pressable><Pressable onPress={() => void handleImportConstants("merge")} style={({ pressed }) => [styles.backupButton, pressed && styles.buttonPressed]}><Text style={styles.backupButtonText}>{copy.merge}</Text></Pressable><Pressable onPress={() => void handleImportConstants("replace")} style={({ pressed }) => [styles.backupButton, pressed && styles.buttonPressed]}><Text style={styles.backupButtonText}>{copy.replace}</Text></Pressable><Pressable onPress={() => setPendingClearConstants(true)} style={({ pressed }) => [styles.clearButton, pressed && styles.buttonPressed]}><Text style={styles.clearButtonText}>{copy.clearAll}</Text></Pressable>{hasRestorableConstants ? <Pressable onPress={() => void handleRestoreConstants()} style={({ pressed }) => [styles.restoreButton, pressed && styles.buttonPressed]}><Text style={styles.restoreButtonText}>{copy.restore}</Text></Pressable> : null}</View>{backupNotice ? <Text style={styles.backupNotice}>{backupNotice}</Text> : null}</View> : null}

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
  inlineCategoryRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  inlineCategoryInput: { flex: 1, minHeight: 44 },
  inlineCategoryButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 10, justifyContent: "center", paddingHorizontal: 16 },
  inlineCategoryButtonText: { color: colors.onPrimary, fontSize: 13, fontWeight: "800" },
  localConstantSymbolInput: { color: colors.primary, flex: 1, fontFamily: mono, fontSize: 14, fontWeight: "800", minHeight: 30 },
  stepCard: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 13, borderWidth: 1, marginTop: 8, padding: 11 }, stepHeader: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" }, removeStepText: { color: colors.error, fontSize: 12, fontWeight: "700" }, stepInput: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, color: colors.foreground, fontFamily: mono, fontSize: 14, minHeight: 38, paddingHorizontal: 0 }, addStepButton: { alignItems: "center", borderColor: colors.primaryBorder, borderRadius: 11, borderStyle: "dashed", borderWidth: 1, marginTop: 10, paddingVertical: 11 }, addStepText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
});
