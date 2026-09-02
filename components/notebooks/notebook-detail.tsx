import { useEffect, useMemo, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { LatexView } from "@/components/ui/latex-view";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type CalculationNotebook, type CalculationNoteStep, type NotebookLocalConstant } from "@/lib/calculator-store";
import { type AppLanguage } from "@/lib/i18n";
import { getLocalConstantFieldSuggestions, getStepFieldSuggestions, insertConstantSymbol, mapCombinedSelectionToExpressionRange } from "@/lib/notebook-constant-suggestions";
import { evaluateNotebookSteps, formatNameValue, parseNameValue, resolveNotebookLocalConstants, trimResultSymbol } from "@/lib/notebook-engine";
import { getUnitInsertionRange, replaceExpressionRange } from "@/lib/unit-input";
import { formatQuantity, getCompatibleUnitGroups, getGroupUnitsForSystem, type MeasuringStandard, type Quantity, type SavedConstant, type UnitSystem } from "@/lib/units";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_COPY = {
  edit: "Edit", save: "Save values", copy: "Copy", copied: "Copied",
  formulas: "Formula", inputs: "Inputs", results: "Results", noInputs: "This notebook has no local constants.", noSteps: "This notebook has no steps yet.",
  si: "SI base", finalResult: "Final result", referenceHint: "Use {symbol} in a later step.",
  pin: "Pin to calculator", unpin: "Unpin from calculator",
  invalidConstantName: "Enter each constant as name=value (e.g. v0=5m/s).",
  invalidStepName: "Enter each step as name=expression (e.g. v=v0+a*t), or remove the \"=\" to leave it unnamed.",
  saveFailed: "Could not save. Please try again.",
  noStepsError: "This notebook needs at least one step.",
  constantsRailLabel: "Constants",
  insertConstant: "Insert",
} as const;
const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = {
  en: EN_COPY,
  ja: {
    edit: "編集", save: "値を保存", copy: "コピー", copied: "コピーしました",
    formulas: "数式", inputs: "定数（入力値）", results: "結果", noInputs: "このノートにはローカル定数がありません。", noSteps: "このノートにはまだ手順がありません。",
    si: "SI標準", finalResult: "最終結果", referenceHint: "後の手順で {symbol} として使えます。",
    pin: "電卓画面にピン留め", unpin: "ピン留めを解除",
    invalidConstantName: "定数は「名前＝値」の形式（例：v0=5m/s）で入力してください。",
    invalidStepName: "手順は「名前＝式」の形式（例：v=v0+a*t）で入力するか、「＝」を外して名前なしにしてください。",
    saveFailed: "保存できませんでした。もう一度お試しください。",
    noStepsError: "手順が最低1つ必要です。",
    constantsRailLabel: "定数",
    insertConstant: "挿入",
  },
};

type Props = {
  language: AppLanguage;
  locale?: string;
  unitSystem: UnitSystem;
  measuringStandard: MeasuringStandard;
  notebook: CalculationNotebook;
  categoryLabel: string;
  globalConstants: SavedConstant[];
  onBack: () => void;
  onEdit: () => void;
  onTogglePinned: () => void;
  onSaveValues: (localConstants: NotebookLocalConstant[], steps: CalculationNoteStep[]) => Promise<void>;
};

export function NotebookDetail({ language, locale, unitSystem, measuringStandard, notebook, categoryLabel, globalConstants, onBack, onEdit, onTogglePinned, onSaveValues }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [editableConstants, setEditableConstants] = useState<NotebookLocalConstant[]>(() => notebook.localConstants.map((item) => ({ ...item })));
  const [editableSteps, setEditableSteps] = useState<CalculationNoteStep[]>(() => notebook.steps.map((item) => ({ ...item })));
  const [unitOverrides, setUnitOverrides] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // mₒ・nₜ のようなUnicode下付き文字は端末キーボードで直接入力できないため、フォーカス中の式
  // フィールドの直下に「タップで挿入」ボタンの列を出す。フィールドごとに一意なキー
  // （`constant:${id}` / `step:${id}`）で、どのフィールドで表示中かを管理する。
  const [focusedRailKey, setFocusedRailKey] = useState<string | null>(null);
  // 各フィールドの現在のキャレット/選択範囲（onSelectionChangeで更新）。ボタンをタップしたとき
  // 末尾ではなく、この位置に記号を挿し込むために使う。
  const [fieldSelections, setFieldSelections] = useState<Record<string, { start: number; end: number }>>({});
  // 記号を挿し込んだ直後だけ、TextInputのselection propでキャレットを挿入位置の直後へ強制する。
  // ユーザー自身の入力と衝突しないよう、反映されたら（onSelectionChange/onChangeTextで）すぐ手放す。
  const [forcedSelection, setForcedSelection] = useState<{ key: string; selection: { start: number; end: number } } | null>(null);

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

  const copy = COPY[language];

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
    // 保存中の連打で古いスナップショットが後勝ちしないよう、完了までは再入しない。
    if (isSaving) return;
    if (editableConstants.some((item) => !item.symbol.trim() && item.expression.trim())) { setSaveError(copy.invalidConstantName); return; }
    if (editableSteps.some((step) => !trimResultSymbol(step) && step.expression.includes("="))) { setSaveError(copy.invalidStepName); return; }
    // 空欄のまま残った行や前後の空白は、エディタ側のsaveNotebookと同じ基準で除いてから保存する。
    const normalizedConstants = editableConstants.filter((item) => item.symbol.trim() && item.expression.trim()).map((item) => ({ ...item, symbol: item.symbol.trim(), expression: item.expression.trim() }));
    const normalizedSteps = editableSteps.filter((step) => step.expression.trim()).map((step) => ({ ...step, expression: step.expression.trim(), targetUnit: step.targetUnit.trim(), resultSymbol: trimResultSymbol(step) || undefined }));
    if (!normalizedSteps.length) { setSaveError(copy.noStepsError); return; }
    setSaveError("");
    setIsSaving(true);
    try {
      await onSaveValues(normalizedConstants, normalizedSteps);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : copy.saveFailed);
    } finally {
      setIsSaving(false);
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

  const constantFieldKey = (id: string) => `constant:${id}`;
  const stepFieldKey = (id: string) => `step:${id}`;
  const combinedCaretEnd = (name: string, expression: string) => formatNameValue(name, expression).length;

  // 記号ボタンをタップしたときに実際にキャレット/選択範囲があった位置へ挿入する。
  // まだ一度もonSelectionChangeが来ていないフィールド（フォーカス直後など）は末尾へ挿す。
  const insertSymbolIntoField = (key: string, name: string, expression: string, symbol: string, applyExpression: (next: string) => void) => {
    const fallback = combinedCaretEnd(name, expression);
    const selection = fieldSelections[key] ?? { start: fallback, end: fallback };
    const { expression: nextExpression, combinedCaret } = insertConstantSymbol(name, expression, selection.start, selection.end, symbol);
    applyExpression(nextExpression);
    const caretSelection = { start: combinedCaret, end: combinedCaret };
    setFieldSelections((current) => ({ ...current, [key]: caretSelection }));
    setForcedSelection({ key, selection: caretSelection });
  };

  /**
   * 単位チップも定数チップと同じくキャレット基準で反映する。範囲選択があればそこを置き換え、
   * 無ければキャレット上の単位を差し替える（数値の直後なら単位付け）。末尾決め打ちにすると、
   * 式の途中にカーソルを置いても最後の単位が書き換わってしまう。
   */
  const insertUnitIntoField = (key: string, name: string, expression: string, symbol: string, applyExpression: (next: string) => void) => {
    const fallback = combinedCaretEnd(name, expression);
    const selection = fieldSelections[key] ?? { start: fallback, end: fallback };
    const selected = mapCombinedSelectionToExpressionRange(name, expression, selection.start, selection.end);
    const range = selected.start === selected.end ? getUnitInsertionRange(expression, selected.start, constantIdentifiers) : selected;
    applyExpression(replaceExpressionRange(expression, range.start, range.end, symbol));
    const combinedCaret = (name ? name.length + 1 : 0) + range.start + symbol.length;
    const caretSelection = { start: combinedCaret, end: combinedCaret };
    setFieldSelections((current) => ({ ...current, [key]: caretSelection }));
    setForcedSelection({ key, selection: caretSelection });
  };

  // onSelectionChangeが発火した時点で強制キャレットの役目は終わり。ユーザー自身の操作と
  // 衝突しないよう、対象キーが一致するときだけここで手放す。
  const handleSelectionChange = (key: string, selection: { start: number; end: number }) => {
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

  const renderConstantsRail = (key: string, symbols: string[], onInsert: (symbol: string) => void) => {
    if (focusedRailKey !== key || !symbols.length) return null;
    return (
      <View>
        <Text style={styles.constantsRailLabel}>{copy.constantsRailLabel}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.unitRail}>
          {symbols.map((symbol) => (
            <Pressable
              key={symbol}
              accessibilityLabel={`${copy.insertConstant} ${symbol}`}
              onPress={() => onInsert(symbol)}
              style={({ pressed }) => [styles.unitChip, pressed && styles.pressed]}
            >
              <Text style={styles.unitChipText}>{symbol}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  // 戻る先のカテゴリ名が空になることは基本無いが、propsの契約上は空文字も来うるため
  // 「戻る」ラベルへフォールバックする（呼び出し側のcategoryLabel()は常に非空を返す）。
  const backLabel = categoryLabel || (language === "en" ? "Back" : "戻る");

  return (
    <View style={styles.root}>
      <View style={styles.stickyHeader}>
        <View style={styles.stickyTopRow}>
          <Pressable onPress={onBack} style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
            <IconSymbol name="chevron.left" size={16} color={colors.primary} />
            <Text numberOfLines={1} style={styles.backLabel}>{backLabel}</Text>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable accessibilityLabel={notebook.pinned ? copy.unpin : copy.pin} onPress={onTogglePinned} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
              <IconSymbol name="pin.fill" size={16} color={notebook.pinned ? colors.primary : colors.muted} />
            </Pressable>
            <Pressable accessibilityLabel={copy.edit} onPress={onEdit} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
              <IconSymbol name="pencil" size={16} color={colors.primary} />
            </Pressable>
          </View>
        </View>
        <Text numberOfLines={1} style={styles.stickyTitle}>{notebook.title}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        {notebook.description ? <Text style={styles.description}>{notebook.description}</Text> : null}

        {notebook.formulas.length ? (
          <>
            <Text style={styles.sectionLabel}>{copy.formulas}</Text>
            <View style={styles.formulaCard}>
              {notebook.formulas.map((formula) => (
                <View key={formula.id} style={styles.formulaRow}>
                  {formula.explanation ? <Text style={styles.formulaExplanation}>{formula.explanation}</Text> : null}
                  <LatexView latex={formula.latex} color={colors.foreground} fontSize={15} displayMode={false} />
                </View>
              ))}
            </View>
          </>
        ) : notebook.steps.some((step) => step.formulaLatex) ? (
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
            {editableConstants.map((item, constantIndex) => {
              const inputUnits = compatibleUnitsFor(resolvedBySymbol.get(item.symbol.trim())?.quantity);
              const railKey = constantFieldKey(item.id);
              const isRailForced = forcedSelection?.key === railKey;
              return (
                <View key={item.id} style={styles.inputRow}>
                  <TextInput
                    value={formatNameValue(item.symbol, item.expression)}
                    onChangeText={(text) => {
                      const { name, value } = parseNameValue(text);
                      updateConstant(item.id, { symbol: name, expression: value });
                      setForcedSelection((current) => (current?.key === railKey ? null : current));
                    }}
                    onFocus={() => setFocusedRailKey(railKey)}
                    onBlur={() => scheduleRailBlur(railKey)}
                    onSelectionChange={(event) => handleSelectionChange(railKey, event.nativeEvent.selection)}
                    selection={isRailForced ? forcedSelection.selection : undefined}
                    editable={!isSaving}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.inputField, errors[item.id] && styles.inputFieldError]}
                  />
                  {renderConstantsRail(railKey, getLocalConstantFieldSuggestions(editableConstants, globalConstants, constantIndex), (symbol) =>
                    insertSymbolIntoField(railKey, item.symbol, item.expression, symbol, (nextExpression) => updateConstant(item.id, { expression: nextExpression })),
                  )}
                  {inputUnits.length ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitRail}>
                      {inputUnits.map((unitOption) => (
                        <Pressable
                          key={unitOption.symbol}
                          disabled={isSaving}
                          onPress={() => insertUnitIntoField(railKey, item.symbol, item.expression, unitOption.symbol, (nextExpression) => updateConstant(item.id, { expression: nextExpression }))}
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
              const stepRailKey = stepFieldKey(result.step.id);
              return (
                <View key={result.step.id} style={[styles.resultCard, isFinalStep && result.quantity ? styles.resultCardFinal : null]}>
                  <TextInput
                    value={formatNameValue(result.step.resultSymbol ?? "", result.step.expression)}
                    onChangeText={(text) => {
                      const { name, value } = parseNameValue(text);
                      // 名前が無いとき（＝を付けていない通常の式）はtitleへ触れない。既存の表示用タイトルを空欄で上書きしないため。
                      updateStepField(result.step.id, name ? { resultSymbol: name, title: name, expression: value } : { resultSymbol: undefined, expression: value });
                      setForcedSelection((current) => (current?.key === stepRailKey ? null : current));
                    }}
                    onFocus={() => setFocusedRailKey(stepRailKey)}
                    onBlur={() => scheduleRailBlur(stepRailKey)}
                    onSelectionChange={(event) => handleSelectionChange(stepRailKey, event.nativeEvent.selection)}
                    selection={forcedSelection?.key === stepRailKey ? forcedSelection.selection : undefined}
                    editable={!isSaving}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.resultExpressionInput}
                  />
                  {renderConstantsRail(stepRailKey, getStepFieldSuggestions(editableConstants, globalConstants, editableSteps, index), (symbol) =>
                    insertSymbolIntoField(stepRailKey, result.step.resultSymbol ?? "", result.step.expression, symbol, (nextExpression) =>
                      updateStepField(result.step.id, { expression: nextExpression }),
                    ),
                  )}
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
                  {!isFinalStep && result.quantity ? <Text style={styles.resultReferenceHint}>{copy.referenceHint.replace("{symbol}", result.symbol)}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyHint}>{copy.noSteps}</Text>
        )}
      </ScrollView>

      {isDirty ? (
        <View style={styles.saveFooter}>
          <Pressable disabled={isSaving} onPress={() => void handleSave()} style={({ pressed }) => [styles.saveBar, (pressed || isSaving) && styles.pressed]}>
            <Text style={styles.saveBarText}>{copy.save}</Text>
          </Pressable>
          {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  root: { flex: 1 },
  // 戻る・タイトル・ピン留め/編集ボタンは常に押せる位置に留めるため、スクロール外の固定行にする。
  // 端末幅が狭いと「戻る＋タイトル＋ボタン」を1行に詰めるとタイトルがほぼ読めなくなるため、
  // 上段（戻る・ピン留め/編集）と下段（ノート名）の2段に分けて、どちらも省略されないようにする。
  stickyHeader: { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, gap: 6, paddingBottom: 10, paddingTop: 4 },
  stickyTopRow: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  scroll: { flex: 1 },
  container: { gap: 12, paddingBottom: 40, paddingTop: 12 },
  backRow: { alignItems: "center", flexDirection: "row", flexShrink: 1, gap: 4 },
  backLabel: { color: colors.primary, flexShrink: 1, fontSize: 14, fontWeight: "800" },
  stickyTitle: { color: colors.foreground, fontSize: 16, fontWeight: "800" },
  description: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  headerActions: { flexDirection: "row", gap: 8 },
  headerButton: { alignItems: "center", backgroundColor: colors.primarySurface, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  // isDirty時のみ表示される固定フッター。スクロール本文の外に置くことで、
  // 下の方の値を編集してもボタンまでスクロールし直す必要がないようにする。
  saveFooter: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 14, paddingTop: 12 },
  saveBar: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 12, paddingVertical: 12 },
  saveBarText: { color: colors.onPrimary, fontSize: 14, fontWeight: "800" },
  saveErrorText: { color: colors.error, fontSize: 12, lineHeight: 17, marginTop: 4 },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  emptyHint: { color: colors.muted, fontSize: 13 },
  formulaCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 10, padding: 13 },
  formulaRow: { alignItems: "flex-start" },
  formulaExplanation: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: 4 },
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
  resultExpressionInput: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, color: colors.foreground, fontFamily: mono, fontSize: 12, marginBottom: 8, paddingVertical: 2 },
  resultError: { color: colors.error, fontSize: 12, lineHeight: 17, marginTop: 4 },
  resultWarning: { color: colors.warning, fontSize: 11, lineHeight: 15, marginTop: 4 },
  resultReferenceHint: { color: colors.muted, fontSize: 10, marginTop: 5 },
  constantsRailLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.3, marginTop: 6, textTransform: "uppercase" },
  unitRail: { gap: 6, paddingTop: 9 },
  unitChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  unitChipActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  unitChipText: { color: colors.primary, fontFamily: mono, fontSize: 11, fontWeight: "800" },
  unitChipTextActive: { color: colors.onPrimary },
  pressed: { opacity: 0.72 },
});
