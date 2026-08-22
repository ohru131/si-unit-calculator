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

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { exportConstantsBackup, pickConstantsBackup } from "@/lib/constants-backup-file";
import {
  CalculationNote,
  CalculationNoteStep,
  CalculationTemplate,
  SavedCustomFunction,
  useCalculatorStore,
} from "@/lib/calculator-store";
import { useGlobalSettings } from "@/lib/global-settings";
import { formatQuantity, SavedConstant } from "@/lib/units";

type LibrarySection = "templates" | "notes" | "functions" | "constants";
type EditorKind = LibrarySection | null;

const FUNCTION_NAMES = new Set(["sin", "cos", "tan", "asin", "acos", "atan", "atan2", "sqrt", "ln", "log", "log2", "pi", "e"]);

export default function ConstantsScreen() {
  const router = useRouter();
  const { templateExpression, templateUnit } = useLocalSearchParams<{ templateExpression?: string | string[]; templateUnit?: string | string[] }>();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { language } = useGlobalSettings();
  const {
    constants,
    clearConstants,
    customFunctions,
    hasRestorableConstants,
    importConstants,
    isLoading,
    notes,
    removeConstant,
    removeCustomFunction,
    removeNote,
    removeTemplate,
    restoreClearedConstants,
    templates,
    upsertConstant,
    upsertCustomFunction,
    upsertNote,
    upsertTemplate,
  } = useCalculatorStore();
  const [section, setSection] = useState<LibrarySection>("templates");
  const [editorKind, setEditorKind] = useState<EditorKind>(null);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [symbol, setSymbol] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [parameters, setParameters] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expression, setExpression] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [steps, setSteps] = useState<CalculationNoteStep[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [backupNotice, setBackupNotice] = useState("");

  const copy = language === "en" ? {
    title: "Library", subtitle: "Save reusable templates, functions, and calculation notes on this device.",
    templates: "Templates", notes: "Notes", functions: "Functions", constants: "Constants", add: "Add", close: "Close", save: "Save", saving: "Saving…", delete: "Delete", cancel: "Cancel",
    templateEmpty: "No templates yet", templateEmptyHint: "Save a familiar calculation so you can start with it next time.",
    noteEmpty: "No calculation notes yet", noteEmptyHint: "Use notes to keep the steps of a repeatable calculation together.",
    functionEmpty: "No custom functions yet", functionEmptyHint: "Define a reusable formula such as circleArea(r) = pi × r^2.",
    constantEmpty: "No constants yet", constantEmptyHint: "Store a reusable value such as W = 3cm.",
    titleLabel: "Name", descriptionLabel: "Description", expressionLabel: "Expression", outputUnitLabel: "Display unit (optional)", symbolLabel: "Symbol", functionNameLabel: "Function name", parametersLabel: "Parameters, comma-separated", stepsLabel: "Calculation steps", stepName: "Step", addStep: "Add step", runStep: "Use this step", deleteStep: "Remove", useTemplate: "Use template",
    templateEditor: "Save template", noteEditor: "Calculation note", functionEditor: "Custom function", constantEditor: "Constant", signature: "Signature", deleteConfirm: "Delete this item?", validation: "Please fill in the required fields.", backup: "Backup", export: "Export", import: "Import", clearAll: "Clear all", restore: "Restore", exportDone: "Constants backup exported.", importMode: "How should imported constants be applied?", merge: "Merge and replace matches", replace: "Replace all constants", importDone: "{count} constants imported.", clearConfirm: "Clear all saved constants? You can restore the latest cleared set.", cleared: "Constants cleared. You can restore them from this device.", restored: "Cleared constants restored.",
  } : {
    title: "ライブラリ", subtitle: "よく使う式・関数・計算手順を、この端末に保存して再利用できます。",
    templates: "テンプレート", notes: "計算ノート", functions: "自作関数", constants: "定数", add: "追加", close: "閉じる", save: "保存", saving: "保存中…", delete: "削除", cancel: "キャンセル",
    templateEmpty: "テンプレートはまだありません", templateEmptyHint: "よく使う計算を保存すると、次回すぐに呼び出せます。",
    noteEmpty: "計算ノートはまだありません", noteEmptyHint: "繰り返す計算の手順を、まとめて残せます。",
    functionEmpty: "自作関数はまだありません", functionEmptyHint: "例：circleArea(r) = pi × r^2 のように式を再利用できます。",
    constantEmpty: "定数はまだありません", constantEmptyHint: "例：W = 3cm のように、よく使う値を保存できます。",
    titleLabel: "名前", descriptionLabel: "説明", expressionLabel: "式", outputUnitLabel: "表示単位（任意）", symbolLabel: "記号", functionNameLabel: "関数名", parametersLabel: "引数（カンマ区切り）", stepsLabel: "計算手順", stepName: "手順", addStep: "手順を追加", runStep: "この手順を使う", deleteStep: "削除", useTemplate: "この式を使う",
    templateEditor: "テンプレートを保存", noteEditor: "工程計算ノート", functionEditor: "自作関数", constantEditor: "定数", signature: "呼び出し方", deleteConfirm: "この項目を削除しますか？", validation: "必須項目を入力してください。", backup: "バックアップ", export: "書き出す", import: "読み込む", clearAll: "すべて消去", restore: "復活", exportDone: "定数バックアップを書き出しました。", importMode: "読み込む定数をどのように反映しますか？", merge: "追加・同名は置換", replace: "すべての定数を置換", importDone: "{count}件の定数を読み込みました。", clearConfirm: "保存済みの定数をすべて消去しますか？直前に消去した一覧は復活できます。", cleared: "定数を消去しました。この端末上で復活できます。", restored: "消去した定数を復活しました。",
  };

  const sectionItems: Array<{ id: LibrarySection; label: string }> = [
    { id: "templates", label: copy.templates },
    { id: "notes", label: copy.notes },
    { id: "functions", label: copy.functions },
    { id: "constants", label: copy.constants },
  ];

  const resetEditor = () => {
    setEditingId(undefined); setSymbol(""); setFunctionName(""); setParameters(""); setTitle(""); setDescription(""); setExpression(""); setTargetUnit(""); setSteps([]); setError("");
  };

  const openEditor = (kind: LibrarySection, item?: SavedConstant | SavedCustomFunction | CalculationTemplate | CalculationNote) => {
    resetEditor();
    setEditorKind(kind);
    if (!item) return;
    if (kind === "constants") {
      const constant = item as SavedConstant;
      setEditingId(constant.symbol); setSymbol(constant.symbol); setExpression(constant.expression);
    }
    if (kind === "functions") {
      const fn = item as SavedCustomFunction;
      setEditingId(fn.id); setFunctionName(fn.name); setParameters(fn.parameters.join(", ")); setTitle(fn.title); setDescription(fn.description); setExpression(fn.expression);
    }
    if (kind === "templates") {
      const template = item as CalculationTemplate;
      setEditingId(template.id); setTitle(template.title); setDescription(template.description); setExpression(template.expression); setTargetUnit(template.targetUnit);
    }
    if (kind === "notes") {
      const note = item as CalculationNote;
      setEditingId(note.id); setTitle(note.title); setDescription(note.description); setSteps(note.steps);
    }
  };

  useEffect(() => {
    const nextExpression = Array.isArray(templateExpression) ? templateExpression[0] : templateExpression;
    const nextUnit = Array.isArray(templateUnit) ? templateUnit[0] : templateUnit;
    if (!nextExpression) return;
    openEditor("templates");
    setExpression(nextExpression);
    setTargetUnit(nextUnit ?? "");
  // This route parameter is intentionally handled once per navigation event.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateExpression, templateUnit]);

  const closeEditor = () => { if (!isSaving) setEditorKind(null); };
  const loadExpression = (nextExpression: string, nextTargetUnit: string) => {
    setEditorKind(null);
    router.push({ pathname: "/", params: { presetExpression: nextExpression, presetUnit: nextTargetUnit } });
  };

  const save = async () => {
    if (!editorKind) return;
    setError(""); setIsSaving(true);
    try {
      if (editorKind === "constants") {
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(symbol.trim()) || !expression.trim()) throw new Error(copy.validation);
        if (editingId && editingId !== symbol.trim()) await removeConstant(editingId);
        await upsertConstant(symbol.trim(), expression.trim());
      }
      if (editorKind === "functions") {
        const name = functionName.trim();
        const normalizedParameters = parameters.split(",").map((item) => item.trim()).filter(Boolean);
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || FUNCTION_NAMES.has(name) || !title.trim() || !expression.trim() || normalizedParameters.some((parameter) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(parameter)) || new Set(normalizedParameters).size !== normalizedParameters.length) throw new Error(copy.validation);
        await upsertCustomFunction({ id: editingId, name, parameters: normalizedParameters, title: title.trim(), description: description.trim(), expression: expression.trim() });
      }
      if (editorKind === "templates") {
        if (!title.trim() || !expression.trim()) throw new Error(copy.validation);
        await upsertTemplate({ id: editingId, title: title.trim(), description: description.trim(), expression: expression.trim(), targetUnit: targetUnit.trim() });
      }
      if (editorKind === "notes") {
        const normalizedSteps = steps.filter((step) => step.expression.trim()).map((step) => ({ ...step, title: step.title.trim() || `${copy.stepName} ${steps.indexOf(step) + 1}`, expression: step.expression.trim(), targetUnit: step.targetUnit.trim() }));
        if (!title.trim() || !normalizedSteps.length) throw new Error(copy.validation);
        await upsertNote({ id: editingId, title: title.trim(), description: description.trim(), steps: normalizedSteps });
      }
      setEditorKind(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.validation);
    } finally { setIsSaving(false); }
  };

  const confirmDelete = (kind: LibrarySection, id: string) => {
    Alert.alert(copy.delete, copy.deleteConfirm, [
      { text: copy.cancel, style: "cancel" },
      { text: copy.delete, style: "destructive", onPress: () => {
        const action = kind === "constants" ? removeConstant(id) : kind === "functions" ? removeCustomFunction(id) : kind === "templates" ? removeTemplate(id) : removeNote(id);
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

  const renderEmpty = (titleText: string, hint: string) => <View style={styles.emptyCard}><IconSymbol name="bookmark.fill" size={30} color={colors.primary} /><Text style={styles.emptyTitle}>{titleText}</Text><Text style={styles.emptyText}>{hint}</Text></View>;

  const renderContent = () => {
    if (section === "templates") return <FlatList data={templates} keyExtractor={(item) => item.id} contentContainerStyle={templates.length ? styles.list : styles.emptyList} ListEmptyComponent={renderEmpty(copy.templateEmpty, copy.templateEmptyHint)} renderItem={({ item }) => <View style={styles.libraryCard}><Pressable onPress={() => loadExpression(item.expression, item.targetUnit)} style={({ pressed }) => [styles.libraryMain, pressed && styles.cardPressed]}><Text style={styles.libraryTitle}>{item.title}</Text>{item.description ? <Text numberOfLines={1} style={styles.libraryDescription}>{item.description}</Text> : null}<Text numberOfLines={1} style={styles.libraryExpression}>{item.expression}{item.targetUnit ? ` → ${item.targetUnit}` : ""}</Text></Pressable><Pressable accessibilityLabel={copy.delete} onPress={() => confirmDelete("templates", item.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.iconPressed]}><IconSymbol name="trash" size={20} color={colors.error} /></Pressable></View>} />;
    if (section === "functions") return <FlatList data={customFunctions} keyExtractor={(item) => item.id} contentContainerStyle={customFunctions.length ? styles.list : styles.emptyList} ListEmptyComponent={renderEmpty(copy.functionEmpty, copy.functionEmptyHint)} renderItem={({ item }) => <View style={styles.libraryCard}><Pressable onPress={() => openEditor("functions", item)} style={({ pressed }) => [styles.libraryMain, pressed && styles.cardPressed]}><Text style={styles.libraryTitle}>{item.title}</Text><Text style={styles.libraryExpression}>{item.name}({item.parameters.join(", ")}) = {item.expression}</Text>{item.description ? <Text numberOfLines={1} style={styles.libraryDescription}>{item.description}</Text> : null}</Pressable><Pressable accessibilityLabel={copy.delete} onPress={() => confirmDelete("functions", item.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.iconPressed]}><IconSymbol name="trash" size={20} color={colors.error} /></Pressable></View>} />;
    if (section === "notes") return <FlatList data={notes} keyExtractor={(item) => item.id} contentContainerStyle={notes.length ? styles.list : styles.emptyList} ListEmptyComponent={renderEmpty(copy.noteEmpty, copy.noteEmptyHint)} renderItem={({ item }) => <View style={styles.libraryCard}><Pressable onPress={() => openEditor("notes", item)} style={({ pressed }) => [styles.libraryMain, pressed && styles.cardPressed]}><Text style={styles.libraryTitle}>{item.title}</Text>{item.description ? <Text numberOfLines={1} style={styles.libraryDescription}>{item.description}</Text> : null}<Text style={styles.libraryMeta}>{item.steps.length} {language === "en" ? "steps" : "手順"}</Text></Pressable><Pressable accessibilityLabel={copy.delete} onPress={() => confirmDelete("notes", item.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.iconPressed]}><IconSymbol name="trash" size={20} color={colors.error} /></Pressable></View>} />;
    return <FlatList data={constants} keyExtractor={(item) => item.symbol} contentContainerStyle={constants.length ? styles.list : styles.emptyList} ListEmptyComponent={renderEmpty(copy.constantEmpty, copy.constantEmptyHint)} renderItem={({ item }) => <View style={styles.libraryCard}><Pressable onPress={() => openEditor("constants", item)} style={({ pressed }) => [styles.libraryMain, pressed && styles.cardPressed]}><Text style={styles.libraryTitle}>{item.symbol} = {item.expression}</Text><Text style={styles.libraryExpression}>{formatQuantity(item.quantity)}</Text></Pressable><Pressable accessibilityLabel={copy.delete} onPress={() => confirmDelete("constants", item.symbol)} style={({ pressed }) => [styles.deleteButton, pressed && styles.iconPressed]}><IconSymbol name="trash" size={20} color={colors.error} /></Pressable></View>} />;
  };

  const updateStep = (id: string, patch: Partial<CalculationNoteStep>) => setSteps((current) => current.map((step) => step.id === id ? { ...step, ...patch } : step));

  return <ScreenContainer className="px-5" containerClassName="bg-background">
    <View style={styles.header}><View><Text style={styles.title}>{copy.title}</Text><Text style={styles.subtitle}>{copy.subtitle}</Text></View><Pressable accessibilityLabel={copy.add} onPress={() => openEditor(section)} style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}><IconSymbol name="plus.circle.fill" size={28} color={colors.primary} /></Pressable></View>
    <View style={styles.sectionRail}>{sectionItems.map((item) => <Pressable key={item.id} onPress={() => setSection(item.id)} style={({ pressed }) => [styles.sectionChip, section === item.id && styles.sectionChipActive, pressed && styles.buttonPressed]}><Text style={[styles.sectionChipText, section === item.id && styles.sectionChipTextActive]}>{item.label}</Text></Pressable>)}</View>
    {section === "constants" ? <View style={styles.backupCard}><Text style={styles.backupTitle}>{copy.backup}</Text><View style={styles.backupActions}><Pressable onPress={() => void handleExportConstants()} style={({ pressed }) => [styles.backupButton, pressed && styles.buttonPressed]}><Text style={styles.backupButtonText}>{copy.export}</Text></Pressable><Pressable onPress={() => void handleImportConstants()} style={({ pressed }) => [styles.backupButton, pressed && styles.buttonPressed]}><Text style={styles.backupButtonText}>{copy.import}</Text></Pressable><Pressable onPress={handleClearConstants} style={({ pressed }) => [styles.clearButton, pressed && styles.buttonPressed]}><Text style={styles.clearButtonText}>{copy.clearAll}</Text></Pressable>{hasRestorableConstants ? <Pressable onPress={() => void handleRestoreConstants()} style={({ pressed }) => [styles.restoreButton, pressed && styles.buttonPressed]}><Text style={styles.restoreButtonText}>{copy.restore}</Text></Pressable> : null}</View>{backupNotice ? <Text style={styles.backupNotice}>{backupNotice}</Text> : null}</View> : null}
    {isLoading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : renderContent()}

    <Modal visible={Boolean(editorKind)} transparent animationType="slide" onRequestClose={closeEditor}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
        <View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>{editorKind === "templates" ? copy.templateEditor : editorKind === "notes" ? copy.noteEditor : editorKind === "functions" ? copy.functionEditor : copy.constantEditor}</Text><Text style={styles.sheetDescription}>{editorKind === "notes" ? copy.noteEmptyHint : copy.subtitle}</Text></View><Pressable accessibilityLabel={copy.close} onPress={closeEditor} style={({ pressed }) => [styles.closeButton, pressed && styles.iconPressed]}><IconSymbol name="xmark" size={21} color={colors.muted} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {editorKind === "constants" ? <><Text style={styles.fieldLabel}>{copy.symbolLabel}</Text><TextInput value={symbol} onChangeText={setSymbol} placeholder="W" placeholderTextColor={colors.placeholder} autoCapitalize="characters" autoCorrect={false} style={styles.input} /><Text style={styles.fieldLabel}>{copy.expressionLabel}</Text><TextInput value={expression} onChangeText={setExpression} placeholder="3cm" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} /></> : null}
            {editorKind === "functions" ? <><Text style={styles.fieldLabel}>{copy.titleLabel}</Text><TextInput value={title} onChangeText={setTitle} placeholder={language === "en" ? "Circle area" : "円の面積"} placeholderTextColor={colors.placeholder} style={styles.input} /><Text style={styles.fieldLabel}>{copy.functionNameLabel}</Text><TextInput value={functionName} onChangeText={setFunctionName} placeholder="circleArea" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} /><Text style={styles.fieldLabel}>{copy.parametersLabel}</Text><TextInput value={parameters} onChangeText={setParameters} placeholder="r" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} /><Text style={styles.fieldLabel}>{copy.expressionLabel}</Text><TextInput value={expression} onChangeText={setExpression} placeholder="pi × r^2" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} /><Text style={styles.fieldLabel}>{copy.descriptionLabel}</Text><TextInput value={description} onChangeText={setDescription} placeholder={language === "en" ? "Reusable geometry formula" : "繰り返し使う幾何の式"} placeholderTextColor={colors.placeholder} style={styles.input} /></> : null}
            {editorKind === "templates" ? <><Text style={styles.fieldLabel}>{copy.titleLabel}</Text><TextInput value={title} onChangeText={setTitle} placeholder={language === "en" ? "Walking speed" : "歩行速度"} placeholderTextColor={colors.placeholder} style={styles.input} /><Text style={styles.fieldLabel}>{copy.expressionLabel}</Text><TextInput value={expression} onChangeText={setExpression} placeholder="1km ÷ 12min" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} /><Text style={styles.fieldLabel}>{copy.outputUnitLabel}</Text><TextInput value={targetUnit} onChangeText={setTargetUnit} placeholder="km/h" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} /><Text style={styles.fieldLabel}>{copy.descriptionLabel}</Text><TextInput value={description} onChangeText={setDescription} placeholder={language === "en" ? "Optional note" : "任意のメモ"} placeholderTextColor={colors.placeholder} style={styles.input} /></> : null}
            {editorKind === "notes" ? <><Text style={styles.fieldLabel}>{copy.titleLabel}</Text><TextInput value={title} onChangeText={setTitle} placeholder={language === "en" ? "Room pressure check" : "室内圧力の確認"} placeholderTextColor={colors.placeholder} style={styles.input} /><Text style={styles.fieldLabel}>{copy.descriptionLabel}</Text><TextInput value={description} onChangeText={setDescription} placeholder={language === "en" ? "What this sequence is for" : "この手順の目的"} placeholderTextColor={colors.placeholder} style={styles.input} /><Text style={styles.fieldLabel}>{copy.stepsLabel}</Text>{steps.map((step, index) => <View key={step.id} style={styles.stepCard}><View style={styles.stepHeader}><Text style={styles.stepTitle}>{copy.stepName} {index + 1}</Text><Pressable onPress={() => setSteps((current) => current.filter((item) => item.id !== step.id))}><Text style={styles.removeStepText}>{copy.deleteStep}</Text></Pressable></View><TextInput value={step.title} onChangeText={(text) => updateStep(step.id, { title: text })} placeholder={copy.stepName} placeholderTextColor={colors.placeholder} style={styles.stepInput} /><TextInput value={step.expression} onChangeText={(text) => updateStep(step.id, { expression: text })} placeholder="100N ÷ 0.01m²" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.stepInput} /><TextInput value={step.targetUnit} onChangeText={(text) => updateStep(step.id, { targetUnit: text })} placeholder="kPa" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.stepInput} /><Pressable onPress={() => loadExpression(step.expression, step.targetUnit)} style={({ pressed }) => [styles.runStepButton, pressed && styles.buttonPressed]}><Text style={styles.runStepText}>{copy.runStep}</Text></Pressable></View>)}<Pressable onPress={() => setSteps((current) => [...current, { id: `step-${Date.now()}`, title: "", expression: "", targetUnit: "" }])} style={({ pressed }) => [styles.addStepButton, pressed && styles.buttonPressed]}><Text style={styles.addStepText}>＋ {copy.addStep}</Text></Pressable></> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable disabled={isSaving} onPress={() => void save()} style={({ pressed }) => [styles.saveButton, (pressed || isSaving) && styles.buttonPressed]}><Text style={styles.saveText}>{isSaving ? copy.saving : copy.save}</Text></Pressable>
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
  libraryCard: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", minHeight: 82, paddingHorizontal: 13, paddingVertical: 12 }, libraryMain: { flex: 1 }, libraryTitle: { color: colors.foreground, fontSize: 15, fontWeight: "800" }, libraryDescription: { color: colors.muted, fontSize: 12, marginTop: 3 }, libraryExpression: { color: colors.primary, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, fontWeight: "700", marginTop: 5 }, libraryMeta: { color: colors.placeholder, fontSize: 12, marginTop: 5 }, deleteButton: { alignItems: "center", height: 38, justifyContent: "center", width: 38 },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] }, cardPressed: { opacity: 0.74 }, iconPressed: { opacity: 0.55 },
  modalBackdrop: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" }, sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: "92%", paddingBottom: 36, paddingHorizontal: 22, paddingTop: 10 }, sheetHandle: { alignSelf: "center", backgroundColor: colors.border, borderRadius: 3, height: 5, width: 42 }, sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", paddingBottom: 16, paddingTop: 17 }, sheetTitle: { color: colors.foreground, fontSize: 21, fontWeight: "700" }, sheetDescription: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3, maxWidth: "88%" }, closeButton: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  fieldLabel: { color: colors.foreground, fontSize: 13, fontWeight: "700", marginBottom: 7, marginTop: 12 }, input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.foreground, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 16, minHeight: 48, paddingHorizontal: 14 }, error: { color: colors.error, fontSize: 13, lineHeight: 19, marginTop: 11 }, saveButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 13, marginTop: 22, minHeight: 52, justifyContent: "center" }, saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
  stepCard: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 13, borderWidth: 1, marginTop: 8, padding: 11 }, stepHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, stepTitle: { color: colors.foreground, fontSize: 13, fontWeight: "800" }, removeStepText: { color: colors.error, fontSize: 12, fontWeight: "700" }, stepInput: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, color: colors.foreground, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 14, minHeight: 38, paddingHorizontal: 0 }, runStepButton: { alignSelf: "flex-start", backgroundColor: colors.primarySurface, borderRadius: 8, marginTop: 10, paddingHorizontal: 10, paddingVertical: 7 }, runStepText: { color: colors.primary, fontSize: 12, fontWeight: "800" }, addStepButton: { alignItems: "center", borderColor: colors.primaryBorder, borderRadius: 11, borderStyle: "dashed", borderWidth: 1, marginTop: 10, paddingVertical: 11 }, addStepText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
});
