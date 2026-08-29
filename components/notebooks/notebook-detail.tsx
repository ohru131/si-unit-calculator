import { useEffect, useMemo, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type CalculationNotebook, type NotebookLocalConstant, type SavedCustomFunction } from "@/lib/calculator-store";
import { evaluateNotebookSteps, resolveNotebookLocalConstants } from "@/lib/notebook-engine";
import { type SavedConstant } from "@/lib/units";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

type Props = {
  language: "en" | "ja";
  locale?: string;
  notebook: CalculationNotebook;
  globalConstants: SavedConstant[];
  customFunctions: SavedCustomFunction[];
  onBack: () => void;
  onEdit: () => void;
  onSaveValues: (localConstants: NotebookLocalConstant[]) => void;
};

export function NotebookDetail({ language, locale, notebook, globalConstants, customFunctions, onBack, onEdit, onSaveValues }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [editableConstants, setEditableConstants] = useState<NotebookLocalConstant[]>(() => notebook.localConstants.map((item) => ({ ...item })));

  // notebook.localConstants は編集シートで構成が変わることがあるため、
  // このコンポーネントが再マウントされずに新しいノートを受け取っても追従させる。
  useEffect(() => {
    setEditableConstants(notebook.localConstants.map((item) => ({ ...item })));
  }, [notebook.localConstants]);

  const copy = language === "en" ? {
    edit: "Edit", save: "Save values", copy: "Copy", copied: "Copied",
    inputs: "Inputs", results: "Results", noInputs: "This notebook has no local constants.", noSteps: "This notebook has no steps yet.",
    si: "SI base",
  } : {
    edit: "編集", save: "値を保存", copy: "コピー", copied: "コピーしました",
    inputs: "定数（入力値）", results: "結果", noInputs: "このノートにはローカル定数がありません。", noSteps: "このノートにはまだ手順がありません。",
    si: "SI標準",
  };

  const isDirty = useMemo(
    () => editableConstants.some((item, index) => item.expression !== notebook.localConstants[index]?.expression),
    [editableConstants, notebook.localConstants],
  );

  const { resolved, errors } = useMemo(() => resolveNotebookLocalConstants(editableConstants, globalConstants), [editableConstants, globalConstants]);
  const pool = useMemo(() => [...globalConstants, ...resolved], [globalConstants, resolved]);
  const stepResults = useMemo(() => evaluateNotebookSteps(notebook.steps, pool, customFunctions, locale), [customFunctions, locale, notebook.steps, pool]);

  const updateValue = (id: string, expression: string) => {
    setEditableConstants((current) => current.map((item) => (item.id === id ? { ...item, expression } : item)));
  };

  const copyResult = async (title: string, formatted: string) => {
    await Clipboard.setStringAsync(`${title} = ${formatted}`);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <Pressable onPress={onBack} style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
        <IconSymbol name="chevron.left" size={16} color={colors.primary} />
        <Text style={styles.backLabel}>{language === "en" ? "Back" : "戻る"}</Text>
      </Pressable>

      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.title}>{notebook.title}</Text>
          {notebook.description ? <Text style={styles.description}>{notebook.description}</Text> : null}
        </View>
        <Pressable accessibilityLabel={copy.edit} onPress={onEdit} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
          <IconSymbol name="pencil" size={17} color={colors.primary} />
        </Pressable>
      </View>

      {isDirty ? (
        <Pressable onPress={() => onSaveValues(editableConstants)} style={({ pressed }) => [styles.saveBar, pressed && styles.pressed]}>
          <Text style={styles.saveBarText}>{copy.save}</Text>
        </Pressable>
      ) : null}

      <Text style={styles.sectionLabel}>{copy.inputs}</Text>
      {notebook.localConstants.length ? (
        <View style={styles.inputCard}>
          {editableConstants.map((item) => (
            <View key={item.id} style={styles.inputRow}>
              <Text style={styles.inputSymbol}>{item.symbol}</Text>
              <TextInput
                value={item.expression}
                onChangeText={(text) => updateValue(item.id, text)}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.inputField, errors[item.id] && styles.inputFieldError]}
              />
              {errors[item.id] ? <Text numberOfLines={1} style={styles.inputError}>{errors[item.id]}</Text> : null}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyHint}>{copy.noInputs}</Text>
      )}

      <Text style={styles.sectionLabel}>{copy.results}</Text>
      {stepResults.length ? (
        <View style={styles.resultsList}>
          {stepResults.map((result) => (
            <View key={result.step.id} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>{result.step.title}</Text>
                {result.formatted ? (
                  <Pressable accessibilityLabel={copy.copy} onPress={() => void copyResult(result.step.title, result.formatted!)} style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}>
                    <IconSymbol name="doc.on.doc" size={14} color={colors.primary} />
                  </Pressable>
                ) : null}
              </View>
              {result.error && !result.formatted ? (
                <Text style={styles.resultError}>{result.error}</Text>
              ) : (
                <>
                  <Text numberOfLines={2} adjustsFontSizeToFit style={styles.resultValue}>{result.formatted}</Text>
                  {result.error ? <Text style={styles.resultWarning}>{result.error}</Text> : null}
                </>
              )}
              <Text numberOfLines={1} style={styles.resultExpression}>{result.step.expression}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyHint}>{copy.noSteps}</Text>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  container: { gap: 12, paddingBottom: 40 },
  backRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  backLabel: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  headerMain: { flex: 1, paddingRight: 10 },
  title: { color: colors.foreground, fontSize: 21, fontWeight: "800" },
  description: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  editButton: { alignItems: "center", backgroundColor: colors.primarySurface, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  saveBar: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 12, paddingVertical: 12 },
  saveBarText: { color: colors.onPrimary, fontSize: 14, fontWeight: "800" },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  emptyHint: { color: colors.muted, fontSize: 13 },
  inputCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 10, padding: 13 },
  inputRow: { gap: 4 },
  inputSymbol: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  inputField: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 10, borderWidth: 1, color: colors.foreground, fontFamily: mono, fontSize: 15, minHeight: 42, paddingHorizontal: 12 },
  inputFieldError: { borderColor: colors.errorBorder },
  inputError: { color: colors.error, fontSize: 11, lineHeight: 15 },
  resultsList: { gap: 10 },
  resultCard: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 16, borderWidth: 1, padding: 13 },
  resultHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  resultTitle: { color: colors.foreground, fontSize: 13, fontWeight: "800" },
  copyButton: { alignItems: "center", height: 26, justifyContent: "center", width: 30 },
  resultValue: { color: colors.primaryStrong, fontFamily: mono, fontSize: 24, fontWeight: "700", marginTop: 4 },
  resultExpression: { color: colors.muted, fontFamily: mono, fontSize: 11, marginTop: 6 },
  resultError: { color: colors.error, fontSize: 12, lineHeight: 17, marginTop: 4 },
  resultWarning: { color: colors.warning, fontSize: 11, lineHeight: 15, marginTop: 4 },
  pressed: { opacity: 0.72 },
});
