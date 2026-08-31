import { useEffect, useMemo, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { LatexView } from "@/components/ui/latex-view";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type CalculationNotebook, type NotebookLocalConstant } from "@/lib/calculator-store";
import { evaluateNotebookSteps, resolveNotebookLocalConstants } from "@/lib/notebook-engine";
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
  onSaveValues: (localConstants: NotebookLocalConstant[]) => void;
};

export function NotebookDetail({ language, locale, unitSystem, measuringStandard, notebook, globalConstants, onBack, onEdit, onTogglePinned, onSaveValues }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [editableConstants, setEditableConstants] = useState<NotebookLocalConstant[]>(() => notebook.localConstants.map((item) => ({ ...item })));
  const [unitOverrides, setUnitOverrides] = useState<Record<string, string>>({});

  // notebook.localConstants は編集シートで構成が変わることがあるため、
  // このコンポーネントが再マウントされずに新しいノートを受け取っても追従させる。
  useEffect(() => {
    setEditableConstants(notebook.localConstants.map((item) => ({ ...item })));
  }, [notebook.localConstants]);

  // 別のノートを開いたときは、前のノートで選んだ表示単位を引き継がない。
  useEffect(() => {
    setUnitOverrides({});
  }, [notebook.id]);

  const copy = language === "en" ? {
    edit: "Edit", save: "Save values", copy: "Copy", copied: "Copied",
    formulas: "Formula", inputs: "Inputs", results: "Results", noInputs: "This notebook has no local constants.", noSteps: "This notebook has no steps yet.",
    si: "SI base", finalResult: "Final result", referenceHint: "Use {symbol} in a later step.",
    pin: "Pin to calculator", unpin: "Unpin from calculator",
  } : {
    edit: "編集", save: "値を保存", copy: "コピー", copied: "コピーしました",
    formulas: "数式", inputs: "定数（入力値）", results: "結果", noInputs: "このノートにはローカル定数がありません。", noSteps: "このノートにはまだ手順がありません。",
    si: "SI標準", finalResult: "最終結果", referenceHint: "後の手順で {symbol} として使えます。",
    pin: "電卓画面にピン留め", unpin: "ピン留めを解除",
  };

  const isDirty = useMemo(
    () => editableConstants.some((item) => item.expression !== notebook.localConstants.find((saved) => saved.id === item.id)?.expression),
    [editableConstants, notebook.localConstants],
  );

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
    return evaluateNotebookSteps(notebook.steps, pool, [], locale);
  }, [locale, notebook.steps, pool, measuringStandard]);

  const updateValue = (id: string, expression: string) => {
    setEditableConstants((current) => current.map((item) => (item.id === id ? { ...item, expression } : item)));
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
        <Pressable onPress={() => onSaveValues(editableConstants)} style={({ pressed }) => [styles.saveBar, pressed && styles.pressed]}>
          <Text style={styles.saveBarText}>{copy.save}</Text>
        </Pressable>
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
                <Text style={styles.inputSymbol}>{item.displaySymbol ?? item.symbol}</Text>
                <TextInput
                  value={item.expression}
                  onChangeText={(text) => updateValue(item.id, text)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.inputField, errors[item.id] && styles.inputFieldError]}
                />
                {inputUnits.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitRail}>
                    {inputUnits.map((unitOption) => (
                      <Pressable
                        key={unitOption.symbol}
                        onPress={() => updateValue(item.id, insertUnitAtEnd(item.expression, unitOption.symbol, constantIdentifiers))}
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
                    <Text style={styles.resultSymbol}>{result.symbol}</Text>
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
                {!result.step.formulaLatex ? <Text numberOfLines={1} style={styles.resultExpression}>{result.step.expression}</Text> : null}
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
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  emptyHint: { color: colors.muted, fontSize: 13 },
  formulaCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 10, padding: 13 },
  formulaRow: { alignItems: "flex-start" },
  inputCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 10, padding: 13 },
  inputRow: { gap: 4 },
  inputSymbol: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
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
  resultSymbol: { backgroundColor: colors.surfaceSecondary, alignSelf: "flex-start", borderRadius: 6, color: colors.primary, fontFamily: mono, fontSize: 10, fontWeight: "800", marginTop: 4, paddingHorizontal: 6, paddingVertical: 1 },
  copyButton: { alignItems: "center", height: 26, justifyContent: "center", width: 30 },
  resultValue: { color: colors.primaryStrong, fontFamily: mono, fontSize: 24, fontWeight: "700", marginTop: 4 },
  resultExpression: { color: colors.muted, fontFamily: mono, fontSize: 11, marginTop: 6 },
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
