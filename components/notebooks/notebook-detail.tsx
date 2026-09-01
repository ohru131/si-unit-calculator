import { useEffect, useMemo, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { LatexView } from "@/components/ui/latex-view";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type CalculationNotebook, type CalculationNoteStep, type NotebookLocalConstant } from "@/lib/calculator-store";
import { evaluateNotebookSteps, formatNameValue, parseNameValue, resolveNotebookLocalConstants } from "@/lib/notebook-engine";
import { insertUnitAtEnd } from "@/lib/unit-input";
import { formatQuantity, getCompatibleUnitGroups, getGroupUnitsForSystem, type MeasuringStandard, type Quantity, type SavedConstant, type UnitSystem } from "@/lib/units";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

type Props = {
  language: "en" | "ja";
  locale?: string;
  unitSystem: UnitSystem;
  measuringStandard: MeasuringStandard;
  notebook: CalculationNotebook;
  globalConstants: SavedConstant[];
  onBack: () => void;
  onEdit: () => void;
  onTogglePinned: () => void;
  onSaveValues: (localConstants: NotebookLocalConstant[], steps: CalculationNoteStep[]) => Promise<void>;
};

export function NotebookDetail({ language, locale, unitSystem, measuringStandard, notebook, globalConstants, onBack, onEdit, onTogglePinned, onSaveValues }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [editableConstants, setEditableConstants] = useState<NotebookLocalConstant[]>(() => notebook.localConstants.map((item) => ({ ...item })));
  const [editableSteps, setEditableSteps] = useState<CalculationNoteStep[]>(() => notebook.steps.map((item) => ({ ...item })));
  const [unitOverrides, setUnitOverrides] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");

  // notebook.localConstants / notebook.steps は編集シートで構成が変わることがあるため、
  // このコンポーネントが再マウントされずに新しいノートを受け取っても追従させる。
  // useEffectではなく、レンダー中に前回値と比較して直接調整する
  // （https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes）。
  const [syncedConstants, setSyncedConstants] = useState(notebook.localConstants);
  const [syncedSteps, setSyncedSteps] = useState(notebook.steps);
  if (notebook.localConstants !== syncedConstants || notebook.steps !== syncedSteps) {
    setSyncedConstants(notebook.localConstants);
    setSyncedSteps(notebook.steps);
    setEditableConstants(notebook.localConstants.map((item) => ({ ...item })));
    setEditableSteps(notebook.steps.map((item) => ({ ...item })));
    setSaveError("");
  }

  // 別のノートを開いたときは、前のノートで選んだ表示単位を引き継がない。
  useEffect(() => {
    setUnitOverrides({});
  }, [notebook.id]);

  const copy = language === "en" ? {
    edit: "Edit", save: "Save values", copy: "Copy", copied: "Copied",
    formulas: "Formula", inputs: "Inputs", results: "Results", noInputs: "This notebook has no local constants.", noSteps: "This notebook has no steps yet.",
    si: "SI base", finalResult: "Final result", referenceHint: "Use {symbol} in a later step.",
    pin: "Pin to calculator", unpin: "Unpin from calculator",
    invalidConstantName: "Enter each constant as name=value (e.g. v0=5m/s).",
    invalidStepName: "Enter each step as name=expression (e.g. v=v0+a*t), or remove the \"=\" to leave it unnamed.",
    saveFailed: "Could not save. Please try again.",
    noStepsError: "This notebook needs at least one step.",
  } : {
    edit: "編集", save: "値を保存", copy: "コピー", copied: "コピーしました",
    formulas: "数式", inputs: "定数（入力値）", results: "結果", noInputs: "このノートにはローカル定数がありません。", noSteps: "このノートにはまだ手順がありません。",
    si: "SI標準", finalResult: "最終結果", referenceHint: "後の手順で {symbol} として使えます。",
    pin: "電卓画面にピン留め", unpin: "ピン留めを解除",
    invalidConstantName: "定数は「名前＝値」の形式（例：v0=5m/s）で入力してください。",
    invalidStepName: "手順は「名前＝式」の形式（例：v=v0+a*t）で入力するか、「＝」を外して名前なしにしてください。",
    saveFailed: "保存できませんでした。もう一度お試しください。",
    noStepsError: "手順が最低1つ必要です。",
  };

  const isDirty = useMemo(() => {
    const constantsDirty = editableConstants.some((item) => {
      const saved = notebook.localConstants.find((entry) => entry.id === item.id);
      return !saved || item.expression !== saved.expression || item.symbol !== saved.symbol;
    });
    const stepsDirty = editableSteps.some((step) => {
      const saved = notebook.steps.find((entry) => entry.id === step.id);
      return !saved || step.expression !== saved.expression || step.resultSymbol !== saved.resultSymbol || step.title !== saved.title;
    });
    return constantsDirty || stepsDirty;
  }, [editableConstants, editableSteps, notebook.localConstants, notebook.steps]);

  const { resolved, errors } = useMemo(() => resolveNotebookLocalConstants(editableConstants, globalConstants), [editableConstants, globalConstants]);
  const resolvedBySymbol = useMemo(() => new Map(resolved.map((item) => [item.symbol, item])), [resolved]);
  const pool = useMemo(() => [...globalConstants, ...resolved], [globalConstants, resolved]);
  // ローカル定数の式が他の定数記号を参照しているとき、その記号が単位記号と同じ綴りでも
  // 単位挿入で誤って上書きしないよう、既知の識別子として明示的に渡す。
  const constantIdentifiers = useMemo(
    () => [...globalConstants.map((item) => item.symbol), ...editableConstants.map((item) => item.symbol.trim()).filter(Boolean)],
    [editableConstants, globalConstants],
  );
  // measuringStandardはlib/units.tsのモジュール内状態を経由してcup/tbsp/tspの値に反映されるため、
  // 依存配列に含めて設定変更時に再計算させる（値自体は参照するだけで使わない）。
  const stepResults = useMemo(() => {
    void measuringStandard;
    return evaluateNotebookSteps(editableSteps, pool, [], locale);
  }, [locale, editableSteps, pool, measuringStandard]);

  const updateConstant = (id: string, patch: Partial<NotebookLocalConstant>) => {
    setEditableConstants((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const updateStepField = (id: string, patch: Partial<CalculationNoteStep>) => {
    setEditableSteps((current) => current.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  };

  // 「名前＝式」の名前部分を解析できなかった行（例：数字始まりの名前）は、symbolやresultSymbolが
  // 空のまま生テキスト（"="を含む）が残る。無言で保存してしまわず、はっきり教えてから保存を止める。
  const handleSave = async () => {
    if (editableConstants.some((item) => !item.symbol.trim() && item.expression.trim())) { setSaveError(copy.invalidConstantName); return; }
    if (editableSteps.some((step) => !step.resultSymbol?.trim() && step.expression.includes("="))) { setSaveError(copy.invalidStepName); return; }
    // 空欄のまま残った行や前後の空白は、エディタ側のsaveNotebookと同じ基準で除いてから保存する。
    const normalizedConstants = editableConstants.filter((item) => item.symbol.trim() && item.expression.trim()).map((item) => ({ ...item, symbol: item.symbol.trim(), expression: item.expression.trim() }));
    const normalizedSteps = editableSteps.filter((step) => step.expression.trim()).map((step) => ({ ...step, expression: step.expression.trim(), targetUnit: step.targetUnit.trim() }));
    if (!normalizedSteps.length) { setSaveError(copy.noStepsError); return; }
    setSaveError("");
    try {
      await onSaveValues(normalizedConstants, normalizedSteps);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : copy.saveFailed);
    }
  };

  const copyResult = async (title: string, formatted: string) => {
    await Clipboard.setStringAsync(`${title} = ${formatted}`);
  };

  const compatibleUnitsFor = (quantity: Quantity | undefined) => {
    if (!quantity) return [] as { symbol: string; label: string }[];
    const options: { symbol: string; label: string }[] = [];
    getCompatibleUnitGroups(quantity.dimension).forEach((group) => {
      getGroupUnitsForSystem(group, unitSystem).forEach((unitOption) => {
        if (!options.some((option) => option.symbol === unitOption.symbol)) options.push({ symbol: unitOption.symbol, label: unitOption.label });
      });
    });
    return options.slice(0, 14);
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
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel={notebook.pinned ? copy.unpin : copy.pin} onPress={onTogglePinned} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <IconSymbol name="pin.fill" size={16} color={notebook.pinned ? colors.primary : colors.muted} />
          </Pressable>
          <Pressable accessibilityLabel={copy.edit} onPress={onEdit} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <IconSymbol name="pencil" size={16} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {isDirty ? (
        <>
          <Pressable onPress={() => void handleSave()} style={({ pressed }) => [styles.saveBar, pressed && styles.pressed]}>
            <Text style={styles.saveBarText}>{copy.save}</Text>
          </Pressable>
          {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
        </>
      ) : null}

      {notebook.steps.some((step) => step.formulaLatex) ? (
        <>
          <Text style={styles.sectionLabel}>{copy.formulas}</Text>
          <View style={styles.formulaCard}>
            {notebook.steps.map((step) =>
              step.formulaLatex ? (
                <View key={step.id} style={styles.formulaRow}>
                  <LatexView latex={step.formulaLatex} color={colors.foreground} fontSize={15} displayMode={false} />
                </View>
              ) : null,
            )}
          </View>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>{copy.inputs}</Text>
      {notebook.localConstants.length ? (
        <View style={styles.inputCard}>
          {editableConstants.map((item) => {
            const inputUnits = compatibleUnitsFor(resolvedBySymbol.get(item.symbol.trim())?.quantity);
            return (
              <View key={item.id} style={styles.inputRow}>
                <TextInput
                  value={formatNameValue(item.symbol, item.expression)}
                  onChangeText={(text) => {
                    const { name, value } = parseNameValue(text);
                    updateConstant(item.id, { symbol: name, expression: value });
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.inputField, errors[item.id] && styles.inputFieldError]}
                />
                {inputUnits.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitRail}>
                    {inputUnits.map((unitOption) => (
                      <Pressable
                        key={unitOption.symbol}
                        onPress={() => updateConstant(item.id, { expression: insertUnitAtEnd(item.expression, unitOption.symbol, constantIdentifiers) })}
                        style={({ pressed }) => [styles.unitChip, pressed && styles.pressed]}
                      >
                        <Text style={styles.unitChipText}>{unitOption.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}
                {errors[item.id] ? <Text numberOfLines={1} style={styles.inputError}>{errors[item.id]}</Text> : null}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyHint}>{copy.noInputs}</Text>
      )}

      <Text style={styles.sectionLabel}>{copy.results}</Text>
      {stepResults.length ? (
        <View style={styles.resultsList}>
          {stepResults.map((result, index) => {
            const isFinalStep = index === stepResults.length - 1;
            const overrideUnit = unitOverrides[result.step.id];
            const compatibleUnits = compatibleUnitsFor(result.quantity);
            let displayValue = result.formatted;
            let displayError = result.error;
            if (result.quantity && overrideUnit !== undefined) {
              if (overrideUnit === "") {
                displayValue = result.siFallback;
                displayError = undefined;
              } else {
                try {
                  displayValue = formatQuantity(result.quantity, overrideUnit, locale);
                  displayError = undefined;
                } catch (cause) {
                  displayValue = result.siFallback;
                  displayError = cause instanceof Error ? cause.message : displayError;
                }
              }
            }
            const effectiveUnit = overrideUnit ?? result.step.targetUnit.trim();
            if (displayValue && effectiveUnit) {
              const label = compatibleUnits.find((unitOption) => unitOption.symbol === effectiveUnit)?.label;
              if (label && label !== effectiveUnit && displayValue.endsWith(effectiveUnit)) {
                displayValue = `${displayValue.slice(0, -effectiveUnit.length)}${label}`;
              }
            }
            return (
              <View key={result.step.id} style={[styles.resultCard, isFinalStep && result.quantity ? styles.resultCardFinal : null]}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultHeaderMain}>
                    {isFinalStep && result.quantity ? <Text style={styles.finalBadge}>{copy.finalResult}</Text> : null}
                    <Text style={styles.resultTitle}>{result.step.title}</Text>
                  </View>
                  {displayValue ? (
                    <Pressable accessibilityLabel={copy.copy} onPress={() => void copyResult(result.step.title, displayValue!)} style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}>
                      <IconSymbol name="doc.on.doc" size={14} color={colors.primary} />
                    </Pressable>
                  ) : null}
                </View>
                {displayError && !displayValue ? (
                  <Text style={styles.resultError}>{displayError}</Text>
                ) : (
                  <>
                    <Text numberOfLines={2} adjustsFontSizeToFit style={styles.resultValue}>{displayValue}</Text>
                    {displayError ? <Text style={styles.resultWarning}>{displayError}</Text> : null}
                  </>
                )}
                {compatibleUnits.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitRail}>
                    <Pressable onPress={() => setUnitOverrides((current) => ({ ...current, [result.step.id]: "" }))} style={({ pressed }) => [styles.unitChip, !effectiveUnit && styles.unitChipActive, pressed && styles.pressed]}>
                      <Text style={[styles.unitChipText, !effectiveUnit && styles.unitChipTextActive]}>{copy.si}</Text>
                    </Pressable>
                    {compatibleUnits.map((unitOption) => (
                      <Pressable key={unitOption.symbol} onPress={() => setUnitOverrides((current) => ({ ...current, [result.step.id]: unitOption.symbol }))} style={({ pressed }) => [styles.unitChip, effectiveUnit === unitOption.symbol && styles.unitChipActive, pressed && styles.pressed]}>
                        <Text style={[styles.unitChipText, effectiveUnit === unitOption.symbol && styles.unitChipTextActive]}>{unitOption.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}
                {!result.step.formulaLatex ? (
                  <TextInput
                    value={formatNameValue(result.step.resultSymbol ?? "", result.step.expression)}
                    onChangeText={(text) => {
                      const { name, value } = parseNameValue(text);
                      // 名前が無いとき（＝を付けていない通常の式）はtitleへ触れない。既存の表示用タイトルを空欄で上書きしないため。
                      updateStepField(result.step.id, name ? { resultSymbol: name, title: name, expression: value } : { resultSymbol: undefined, expression: value });
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.resultExpressionInput}
                  />
                ) : null}
                {!isFinalStep && result.quantity ? <Text style={styles.resultReferenceHint}>{copy.referenceHint.replace("{symbol}", result.symbol)}</Text> : null}
              </View>
            );
          })}
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
  headerActions: { flexDirection: "row", gap: 8 },
  headerButton: { alignItems: "center", backgroundColor: colors.primarySurface, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  saveBar: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 12, paddingVertical: 12 },
  saveBarText: { color: colors.onPrimary, fontSize: 14, fontWeight: "800" },
  saveErrorText: { color: colors.error, fontSize: 12, lineHeight: 17, marginTop: 4 },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  emptyHint: { color: colors.muted, fontSize: 13 },
  formulaCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 10, padding: 13 },
  formulaRow: { alignItems: "flex-start" },
  inputCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 10, padding: 13 },
  inputRow: { gap: 4 },
  inputField: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 10, borderWidth: 1, color: colors.foreground, fontFamily: mono, fontSize: 15, minHeight: 42, paddingHorizontal: 12 },
  inputFieldError: { borderColor: colors.errorBorder },
  inputError: { color: colors.error, fontSize: 11, lineHeight: 15 },
  resultsList: { gap: 10 },
  resultCard: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 16, borderWidth: 1, padding: 13 },
  resultCardFinal: { borderColor: colors.primary, borderWidth: 2 },
  resultHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  resultHeaderMain: { flex: 1, paddingRight: 8 },
  finalBadge: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 0.5, marginBottom: 3, textTransform: "uppercase" },
  resultTitle: { color: colors.foreground, fontSize: 13, fontWeight: "800" },
  copyButton: { alignItems: "center", height: 26, justifyContent: "center", width: 30 },
  resultValue: { color: colors.primaryStrong, fontFamily: mono, fontSize: 24, fontWeight: "700", marginTop: 4 },
  resultExpressionInput: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, color: colors.foreground, fontFamily: mono, fontSize: 12, marginTop: 6, paddingVertical: 2 },
  resultError: { color: colors.error, fontSize: 12, lineHeight: 17, marginTop: 4 },
  resultWarning: { color: colors.warning, fontSize: 11, lineHeight: 15, marginTop: 4 },
  resultReferenceHint: { color: colors.muted, fontSize: 10, marginTop: 5 },
  unitRail: { gap: 6, paddingTop: 9 },
  unitChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  unitChipActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  unitChipText: { color: colors.primary, fontFamily: mono, fontSize: 11, fontWeight: "800" },
  unitChipTextActive: { color: colors.onPrimary },
  pressed: { opacity: 0.72 },
});
