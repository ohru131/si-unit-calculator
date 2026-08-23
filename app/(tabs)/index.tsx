import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { isSampleCategoryVisible, isUnitGroupVisible, isUnitVisible, visibleUnits } from "@/lib/advanced-display";
import { useCalculatorStore } from "@/lib/calculator-store";
import { exportCalculationHistory } from "@/lib/calculation-export";
import { useGlobalSettings } from "@/lib/global-settings";
import { historyToAutoConstants } from "@/lib/history-auto-constants";
import { getCalculatorQuickShortcut } from "@/lib/quick-shortcuts";
import { usePro } from "@/lib/revenuecat-provider";
import { getUnitExplanation } from "@/lib/unit-explanations";
import UnitCalculatorWidget from "@/widgets/UnitCalculatorWidget";
import { SAMPLE_CALCULATIONS, SAMPLE_CATEGORIES, type SampleCalculation } from "@/lib/sample-calculations";
import {
  analyzeExpression,
  getUnitInputHint,
  getUnitSuggestions,
  replaceExpressionRange,
  type ExpressionSegment,
  type UnitInputHint,
  type UnitSuggestion,
} from "@/lib/unit-input";
import { evaluateExpression, formatQuantity, getCompatibleUnitGroups, getGroupUnitsForSystem, getRegionalUnits, getUnitRegistration, parseConstantDefinition, Quantity, UNIT_GROUPS, type UnitGroup, type UnitOption } from "@/lib/units";

const KEYS = ["(", ")", "÷", "⌫", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", ".", "0", " ", "="];
const ADVANCED_KEYS = ["sin(", "cos(", "tan(", "asin(", "acos(", "atan(", "atan2(", "ln(", "log(", "log2(", "sqrt(", "^", "π", "e"];
const RAIL_LIMIT = 8;
const RECENT_UNIT_LIMIT = 8;

export default function CalculatorScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { quick, presetExpression, presetUnit } = useLocalSearchParams<{ quick?: string | string[]; presetExpression?: string | string[]; presetUnit?: string | string[] }>();
  const { constants, customFunctions, history, favoriteUnits, upsertConstant, addHistoryEntry, clearHistory } = useCalculatorStore();
  const { isPro } = usePro();
  const { calculatorMode, language, locale, t, unitGroupLabel, unitSystem } = useGlobalSettings();
  const [expression, setExpression] = useState("5cm + 1mm");
  const [targetUnit, setTargetUnit] = useState("cm");
  const [result, setResult] = useState<Quantity | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inputGroupId, setInputGroupId] = useState("length");
  const [sampleCategory, setSampleCategory] = useState("basic");
  const [showHelp, setShowHelp] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvancedKeys, setShowAdvancedKeys] = useState(false);
  const [unitPickerMode, setUnitPickerMode] = useState<"insert" | "target">("insert");
  const [unitInfoSymbol, setUnitInfoSymbol] = useState<string | null>(null);
  const [unitSearch, setUnitSearch] = useState("");
  const [recentUnits, setRecentUnits] = useState<string[]>([]);
  const [fixSelection, setFixSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const unitSearchRef = useRef<TextInput>(null);

  const isAdvancedMode = calculatorMode === "advanced";
  const includeUnit = useCallback(
    (group: UnitGroup, unitOption: UnitOption) => isUnitGroupVisible(group, isAdvancedMode) && isUnitVisible(unitOption, isAdvancedMode),
    [isAdvancedMode],
  );
  /** そのカテゴリの単位を、地域優先順のうえで現在の表示モードに合わせて絞り込む。 */
  const visibleGroupUnits = useCallback(
    (group: UnitGroup) => getGroupUnitsForSystem(group, unitSystem).filter((unitOption) => includeUnit(group, unitOption)),
    [includeUnit, unitSystem],
  );
  const visibleInputGroups = useMemo(() => UNIT_GROUPS.filter((group) => isUnitGroupVisible(group, isAdvancedMode)), [isAdvancedMode]);
  const selectedInputGroup = visibleInputGroups.find((group) => group.id === inputGroupId) ?? visibleInputGroups[0] ?? UNIT_GROUPS[0];
  const selectedInputUnits = useMemo(() => visibleGroupUnits(selectedInputGroup), [selectedInputGroup, visibleGroupUnits]);
  const searchSuggestions = useMemo(() => getUnitSuggestions(unitSearch, { system: unitSystem, limit: 24, includeUnit }), [includeUnit, unitSearch, unitSystem]);
  const compatibleUnitGroups = useMemo(() => (result ? getCompatibleUnitGroups(result.dimension).filter((group) => isUnitGroupVisible(group, isAdvancedMode) && visibleUnits(getRegionalUnits(group, unitSystem), isAdvancedMode).length > 0) : []), [isAdvancedMode, result, unitSystem]);
  const visibleSampleCategories = useMemo(() => SAMPLE_CATEGORIES.filter((category) => isSampleCategoryVisible(category.id, isAdvancedMode)), [isAdvancedMode]);
  const visibleSamples = useMemo(() => SAMPLE_CALCULATIONS.filter((sample) => sample.category === sampleCategory && isSampleCategoryVisible(sample.category, isAdvancedMode)), [isAdvancedMode, sampleCategory]);
  const visibleHistory = isPro ? history : history.slice(0, 5);
  const autoConstants = useMemo(() => historyToAutoConstants(history), [history]);
  const unitInfo = useMemo(() => getUnitExplanation(unitInfoSymbol ?? ""), [unitInfoSymbol]);
  const targetUnitRegistration = useMemo(() => getUnitRegistration(targetUnit), [targetUnit]);
  const searchedUnitRegistration = useMemo(() => getUnitRegistration(unitSearch), [unitSearch]);

  const identifiers = useMemo(
    () => [...constants.map((item) => item.symbol), ...autoConstants.map((item) => item.symbol), ...customFunctions.map((item) => item.name)],
    [autoConstants, constants, customFunctions],
  );
  const analysis = useMemo(() => analyzeExpression(expression, identifiers), [expression, identifiers]);
  const hint = useMemo<UnitInputHint>(() => {
    if (fixSelection) {
      return { kind: "fix", fragment: fixSelection.text, start: fixSelection.start, end: fixSelection.end, candidates: getUnitSuggestions(fixSelection.text, { system: unitSystem, limit: RAIL_LIMIT, includeUnit }) };
    }
    // 直前に計算済みの analysis を渡して、同じ式をもう一度解析しないようにする。
    return getUnitInputHint(expression, { system: unitSystem, recentUnits, identifiers, includeUnit, limit: RAIL_LIMIT, analysis });
  }, [analysis, expression, fixSelection, identifiers, includeUnit, recentUnits, unitSystem]);

  /** 結果のすぐ横で切り替えられる、同じ次元の単位。 */
  const conversionUnits = useMemo(() => {
    const symbols: string[] = [];
    const current = targetUnit.trim();
    if (current) symbols.push(current);
    compatibleUnitGroups.forEach((group) => {
      visibleGroupUnits(group).forEach((unitOption) => {
        if (!symbols.includes(unitOption.symbol)) symbols.push(unitOption.symbol);
      });
    });
    return symbols.slice(0, 10);
  }, [compatibleUnitGroups, targetUnit, visibleGroupUnits]);

  useEffect(() => {
    if (!isAdvancedMode && !isUnitGroupVisible(UNIT_GROUPS.find((group) => group.id === inputGroupId) ?? UNIT_GROUPS[0], false)) setInputGroupId("length");
    if (!isAdvancedMode && !isSampleCategoryVisible(sampleCategory as SampleCalculation["category"], false)) setSampleCategory("basic");
  }, [inputGroupId, isAdvancedMode, sampleCategory]);

  const targetUnitForSample = (sample: SampleCalculation) => {
    if (unitSystem === "us") {
      if (sample.id === "length-add") return "in";
      if (sample.id === "speed") return "mph";
      if (sample.id === "distance") return "mi";
      if (sample.id === "pressure") return "psi";
      if (sample.id === "work") return "BTU";
      if (sample.id === "power") return "hp";
    }
    if (unitSystem === "uk") {
      if (sample.id === "speed") return "mph";
      if (sample.id === "distance") return "mi";
      if (sample.id === "pressure") return "psi";
    }
    return sample.targetUnit;
  };

  const copy = language === "en" ? {
    definitionHint: "Define a constant: W = 3cm", calculate: "=", siBase: "SI base", emptyResult: "Enter an expression, then tap =.", pickUnit: "Choose a registered unit", speedTitle: "Distance, time & speed", speedFormula: "Speed = distance ÷ time     Distance = speed × time", findSpeed: "Find speed", findDistance: "Find distance", findTime: "Find time", savedHistory: "Saved calculations", historyHint: "Latest answers are available as a1, a2, and so on.", clear: "Clear", helpTitle: "Examples", helpDone: "Done", unitSearch: "Search units, names, or categories", copied: "Calculation copied", copy: "Copy", unitDetails: "Unit details", siConversion: "SI conversion", commonUse: "Common use", close: "Close", advancedMath: "Advanced math", advancedMathHint: "Angles use rad, deg, or °. Includes inverse trig, logs, and atan2(y, x).", saveTemplate: "Save", samples: "Examples", units: "Units", shortcuts: "Speed", math: "Math", outputUnit: "Display unit", insertUnit: "Insert unit", registered: "Registered", supported: "Supported, not listed", unknown: "Not a usable unit", unknownHint: "Check the symbol or pick a candidate below.", history: "History", use: "Use", noUnit: "SI base", compatible: "Fits this result", allCandidates: "Closest candidates", hintFix: "Fix", hintComplete: "Finish", hintAttach: "Add unit", hintInsert: "Insert", more: "More", showAs: "Show as", fixTap: "Tap the red unit to fix it.", noCandidates: "No candidate found. Check the symbol.", aliasNote: "same as",
  } : {
    definitionHint: "定数定義：W = 3cm", calculate: "=", siBase: "SI標準", emptyResult: "式を入力して「=」を押してください。", pickUnit: "登録済み単位から選択", speedTitle: "距離・時間・速度", speedFormula: "速度 ＝ 距離 ÷ 時間　　距離 ＝ 速度 × 時間", findSpeed: "速度を求める", findDistance: "距離を求める", findTime: "時間を求める", savedHistory: "保存済みの計算履歴", historyHint: "最新の結果は a1、a2… として次の式で使えます。", clear: "消去", helpTitle: "入力例", helpDone: "閉じる", unitSearch: "単位・読み・カテゴリを検索", copied: "計算結果をコピーしました", copy: "コピー", unitDetails: "単位の説明", siConversion: "SI換算", commonUse: "主な利用分野", close: "閉じる", advancedMath: "上級の数学機能", advancedMathHint: "角度は rad・deg・° で入力します。逆三角・対数・atan2(y, x)にも対応します。", saveTemplate: "保存", samples: "サンプル", units: "単位", shortcuts: "速度", math: "数学", outputUnit: "表示単位", insertUnit: "単位を挿入", registered: "登録済み", supported: "計算対応（候補外）", unknown: "使えない単位", unknownHint: "記号を確認するか、下の候補から選んでください。", history: "履歴", use: "使う", noUnit: "SI標準", compatible: "この結果に合う単位", allCandidates: "近い候補", hintFix: "要修正", hintComplete: "確定", hintAttach: "単位付け", hintInsert: "単位挿入", more: "他", showAs: "表示単位", fixTap: "赤い単位をタップすると修正できます。", noCandidates: "候補が見つかりません。記号を確認してください。", aliasNote: "＝",
  };

  const hintLabel = hint.kind === "fix" ? copy.hintFix : hint.kind === "complete" ? copy.hintComplete : hint.kind === "attach" ? copy.hintAttach : copy.hintInsert;

  const display = useMemo(() => {
    if (!result) return null;
    try {
      return { value: formatQuantity(result, targetUnit, locale), si: formatQuantity(result, undefined, locale), error: "" };
    } catch (cause) {
      // 次元不一致だけでなく、不正な単位文字列（例: プリセットの presetUnit パラメータ）など
      // 実際の失敗理由をそのまま見せる。決め打ちの「次元が違う」で握りつぶさない。
      const fallback = language === "en" ? "Could not convert to this unit." : "この単位へは変換できません。";
      return { value: "—", si: formatQuantity(result, undefined, locale), error: cause instanceof Error ? cause.message : fallback };
    }
  }, [language, locale, result, targetUnit]);

  const rememberUnit = (symbol: string) => {
    const trimmed = symbol.trim();
    if (!trimmed) return;
    setRecentUnits((current) => [trimmed, ...current.filter((unitSymbol) => unitSymbol !== trimmed)].slice(0, RECENT_UNIT_LIMIT));
  };

  const describeUnresolved = (segment: ExpressionSegment) => {
    const suggestion = getUnitSuggestions(segment.text, { system: unitSystem, limit: 1, includeUnit })[0];
    const canonical = segment.canonical ?? suggestion?.unit.symbol;
    if (language === "en") return canonical ? `“${segment.text}” is not a usable unit. Did you mean ${canonical}?` : `“${segment.text}” is not a registered or supported unit.`;
    return canonical ? `「${segment.text}」は使えません。${canonical} に修正できます。` : `「${segment.text}」は未登録・未対応の単位です。`;
  };

  const calculate = async (expressionOverride?: string, targetUnitOverride?: string) => {
    const input = (expressionOverride ?? expression).trim();
    const selectedTargetUnit = targetUnitOverride ?? targetUnit;
    if (!input) {
      setError(language === "en" ? "Enter an expression." : "式を入力してください。");
      return;
    }
    // 使えない単位だけを修正候補へ誘導する（未定義の定数・関数参照はここでは扱わず、下の計算エラーに任せる）。
    // 既に計算済みの analysis（生の expression 基準）を使い、トリム済み文字列を再解析して
    // インデックスがずれる（例: 先頭に空白がある式）ことを避ける。
    const unresolvedUnits = expressionOverride ? [] : analysis.unresolved.filter((segment) => segment.kind === "unknown-unit");
    const unresolvedUnit = unresolvedUnits[unresolvedUnits.length - 1];
    if (unresolvedUnit) {
      setResult(null);
      setError(describeUnresolved(unresolvedUnit));
      setFixSelection({ start: unresolvedUnit.start, end: unresolvedUnit.end, text: unresolvedUnit.text });
      return;
    }
    setError("");
    setNotice("");
    try {
      const assignment = input.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      const availableConstants = [...constants, ...autoConstants];
      const next = assignment ? parseConstantDefinition(input, availableConstants) : null;
      const quantity = next?.quantity ?? evaluateExpression(input, availableConstants, customFunctions);
      if (next) {
        await upsertConstant(next.symbol, next.expression);
        setNotice(`定数 ${next.symbol} を保存しました。`);
      }
      setResult(quantity);
      // 表示単位が結果に合わないときは、行き止まりにせずSI標準へ戻す。
      let usedTargetUnit = selectedTargetUnit.trim();
      let output = formatQuantity(quantity, undefined, locale);
      if (usedTargetUnit) {
        try {
          output = formatQuantity(quantity, usedTargetUnit, locale);
        } catch {
          usedTargetUnit = "";
          setTargetUnit("");
          setNotice(language === "en"
            ? `“${selectedTargetUnit.trim()}” does not fit — showing the SI base value.`
            : `「${selectedTargetUnit.trim()}」は合わないため、SI標準で表示しました。`);
        }
      }
      if (Platform.OS === "ios") {
        try {
          UnitCalculatorWidget.updateSnapshot({
            expression: input,
            result: output,
            siResult: formatQuantity(quantity, undefined, locale),
            locale: language,
          });
        } catch {
          // Widgets require a newly generated iOS development or production build.
        }
      }
      try {
        await addHistoryEntry({
          id: `${Date.now()}-${input}`,
          expression: input,
          resultText: output,
          quantity,
          targetUnit: usedTargetUnit,
          createdAt: new Date().toISOString(),
        });
      } catch {
        setNotice("計算しましたが、履歴を端末内へ保存できませんでした。");
      }
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : "式を計算できませんでした。");
    }
  };

  const pressKey = (key: string) => {
    if (key === "=") {
      void calculate();
      return;
    }
    if (key === "⌫") {
      setExpression((current) => current.slice(0, -1));
      setFixSelection(null);
      return;
    }
    if (key === " ") return;
    const inserted = key === "×" ? "×" : key === "÷" ? "÷" : key;
    setExpression((current) => `${current}${inserted}`);
    setFixSelection(null);
  };

  const applyTargetUnit = (unit: string) => {
    setTargetUnit(unit);
    rememberUnit(unit);
    setError("");
  };

  /** 入力補助バーの候補をタップしたとき、案内した範囲（修正・補完・単位付けの対象）をそのまま置き換える。 */
  const applyUnitCandidate = (symbol: string) => {
    setExpression((current) => replaceExpressionRange(current, Math.min(hint.start, current.length), Math.min(hint.end, current.length), symbol));
    setFixSelection(null);
    rememberUnit(symbol);
    setError("");
    setNotice("");
  };

  /** 単位シート（検索・カテゴリ一覧）から選んだときは、常に式の末尾へ追加する。
   * 入力補助バーの hint とは無関係な操作のため、hint の範囲を置き換えてはならない
   * （式のどこかに未解決の単位があると、無関係な箇所を上書きしてしまうため）。 */
  const appendUnit = (symbol: string) => {
    setExpression((current) => `${current}${symbol}`);
    setFixSelection(null);
    rememberUnit(symbol);
    setError("");
    setNotice("");
  };

  const openUnitPicker = (mode: "insert" | "target") => {
    setUnitPickerMode(mode);
    setUnitSearch(mode === "target" ? targetUnit : "");
    setShowUnitPicker(true);
  };

  const chooseUnit = (unit: string) => {
    if (unitPickerMode === "target") applyTargetUnit(unit);
    else appendUnit(unit);
    setUnitSearch("");
    setShowUnitPicker(false);
  };

  const restoreHistory = (entry: (typeof history)[number]) => {
    setExpression(entry.expression);
    setTargetUnit(entry.targetUnit);
    setResult(entry.quantity);
    setFixSelection(null);
    setError("");
    setNotice("保存済みの計算結果を復元しました。");
  };

  const applyMotionExample = (nextExpression: string, nextTargetUnit: string, message: string) => {
    setExpression(nextExpression);
    setTargetUnit(nextTargetUnit);
    setResult(null);
    setFixSelection(null);
    setError("");
    setNotice(message);
  };

  useEffect(() => {
    const action = Array.isArray(quick) ? quick[0] : quick;
    const shortcut = getCalculatorQuickShortcut(action);
    if (!shortcut) return;
    if (shortcut.expression && shortcut.targetUnit) {
      setExpression(shortcut.expression);
      setTargetUnit(shortcut.targetUnit);
      setResult(null);
      setFixSelection(null);
      setError("");
      setNotice(action === "speed" ? (language === "en" ? "Speed example ready: distance ÷ time." : "速度の例を準備しました：距離 ÷ 時間") : (language === "en" ? "Pressure example ready: force ÷ area." : "圧力の例を準備しました：力 ÷ 面積"));
    }
    if (shortcut.sampleCategory) {
      setSampleCategory(shortcut.sampleCategory);
      setNotice(language === "en" ? "Choose a sample calculation to begin." : "サンプル計算式を選んで試せます。");
    }
    if (shortcut.focusSearch) {
      openUnitPicker("insert");
      setTimeout(() => unitSearchRef.current?.focus(), 250);
    }
  }, [language, quick]);

  useEffect(() => {
    const nextExpression = Array.isArray(presetExpression) ? presetExpression[0] : presetExpression;
    const nextUnit = Array.isArray(presetUnit) ? presetUnit[0] : presetUnit;
    if (!nextExpression) return;
    setExpression(nextExpression);
    setTargetUnit(nextUnit ?? "");
    setResult(null);
    setFixSelection(null);
    setError("");
    setNotice(language === "en" ? "Saved item loaded. Tap = to run it." : "保存した項目を読み込みました。「=」を押して実行できます。");
  }, [language, presetExpression, presetUnit]);

  const applySample = (sample: SampleCalculation) => {
    const sampleTargetUnit = targetUnitForSample(sample);
    setExpression(sample.expression);
    setTargetUnit(sampleTargetUnit);
    setResult(null);
    setFixSelection(null);
    setError("");
    setNotice("");
    void calculate(sample.expression, sampleTargetUnit);
  };

  const exportHistory = async () => {
    if (!isPro) {
      router.push("/pro");
      return;
    }
    try {
      await exportCalculationHistory(history);
      setNotice("計算履歴をCSVとして出力しました。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "CSVを出力できませんでした。");
    }
  };

  const copyCalculation = async () => {
    if (!display) return;
    try {
      await Clipboard.setStringAsync(`${expression} = ${display.value}\n${copy.siBase}: ${display.si}`);
      setNotice(copy.copied);
    } catch {
      setError(language === "en" ? "Could not copy this calculation." : "計算結果をコピーできませんでした。");
    }
  };

  const suggestionLabel = (suggestion: UnitSuggestion) => (language === "en" ? suggestion.unit.name?.en : suggestion.unit.name?.ja) ?? unitGroupLabel(suggestion.group.id);

  const renderUnitChip = (suggestion: UnitSuggestion, onPress: () => void, active = false) => (
    <Pressable
      accessibilityLabel={`${suggestion.unit.symbol} ${suggestionLabel(suggestion)}`}
      key={`${suggestion.group.id}-${suggestion.unit.symbol}`}
      onPress={onPress}
      style={({ pressed }) => [styles.unitChip, active && styles.unitChipActive, pressed && styles.pressed]}
    >
      <Text style={[styles.unitChipSymbol, active && styles.unitChipSymbolActive]}>{suggestion.unit.symbol}</Text>
      <Text numberOfLines={1} style={[styles.unitChipName, active && styles.unitChipNameActive]}>{suggestionLabel(suggestion)}</Text>
    </Pressable>
  );

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("calculator")}</Text>
          <View style={styles.headerActions}>
            <Pressable accessibilityLabel={copy.samples} onPress={() => setShowSamples(true)} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
              <IconSymbol name="list.bullet" size={18} color={colors.primary} />
            </Pressable>
            <Pressable accessibilityLabel={copy.helpTitle} onPress={() => setShowHelp(true)} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
              <IconSymbol name="questionmark.circle.fill" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <TextInput
              value={expression}
              onChangeText={(text) => {
                setExpression(text);
                setFixSelection(null);
                setError("");
                setNotice("");
              }}
              onSubmitEditing={() => void calculate()}
              placeholder={language === "en" ? "Example: 5cm + 1mm" : "例：5cm + 1mm"}
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              accessibilityLabel={t("expression")}
              style={styles.expressionInput}
            />
            <Pressable accessibilityLabel={t("result")} onPress={() => void calculate()} style={({ pressed }) => [styles.calculateButton, pressed && styles.pressed]}>
              <Text style={styles.calculateText}>{copy.calculate}</Text>
            </Pressable>
          </View>

          {expression.trim() ? (
            <View style={styles.previewRow}>
              {analysis.segments.map((segment, index) => {
                const isUnresolved = segment.kind === "unknown-unit" || segment.kind === "unknown-identifier";
                const style = segment.kind === "unit" ? styles.previewUnit
                  : isUnresolved ? styles.previewUnknown
                  : segment.kind === "identifier" ? styles.previewIdentifier
                  : segment.kind === "number" ? styles.previewNumber
                  : styles.previewOperator;
                if (!isUnresolved) return <Text key={`${segment.start}-${index}`} style={style}>{segment.text}</Text>;
                // 単位の書き間違いだけをタップで修正できるようにする。定数・関数の未定義参照は
                // 単位の候補を出しても意味がないため、見た目だけ知らせてタップ操作は付けない。
                if (segment.kind !== "unknown-unit") {
                  return (
                    <View key={`${segment.start}-${index}`} style={styles.previewUnknownWrap}>
                      <Text style={style}>{segment.text}</Text>
                      <IconSymbol name="exclamationmark.triangle.fill" size={11} color={colors.error} />
                    </View>
                  );
                }
                return (
                  <Pressable
                    accessibilityLabel={`${segment.text} ${copy.unknown}`}
                    key={`${segment.start}-${index}`}
                    onPress={() => setFixSelection({ start: segment.start, end: segment.end, text: segment.text })}
                    style={({ pressed }) => [styles.previewUnknownWrap, pressed && styles.pressed]}
                  >
                    <Text style={style}>{segment.text}</Text>
                    <IconSymbol name="exclamationmark.triangle.fill" size={11} color={colors.error} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.hintRow}>
            <Text numberOfLines={1} style={[styles.hintLabel, hint.kind === "fix" && styles.hintLabelAlert]}>{hintLabel}</Text>
            {hint.candidates.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hintRail} keyboardShouldPersistTaps="handled">
                {hint.candidates.map((suggestion) => renderUnitChip(suggestion, () => applyUnitCandidate(suggestion.unit.symbol)))}
              </ScrollView>
            ) : (
              <Text style={styles.hintEmpty}>{copy.noCandidates}</Text>
            )}
            <Pressable accessibilityLabel={copy.insertUnit} onPress={() => openUnitPicker("insert")} style={({ pressed }) => [styles.hintSearchButton, pressed && styles.pressed]}>
              <IconSymbol name="magnifyingglass" size={16} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.middle}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.middleContent} keyboardShouldPersistTaps="handled">
            {error ? (
              <View style={styles.messageError}>
                <Text style={styles.messageErrorText}>{error}</Text>
                {analysis.unresolved.length ? <Text style={styles.messageHint}>{copy.fixTap}</Text> : null}
              </View>
            ) : null}

            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.cardLabel}>{t("result")}</Text>
                {display ? (
                  <View style={styles.resultActions}>
                    <Pressable accessibilityLabel={copy.saveTemplate} onPress={() => router.push({ pathname: "/constants", params: { templateExpression: expression, templateUnit: targetUnit } })} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                      <IconSymbol name="bookmark.fill" size={14} color={colors.primary} />
                    </Pressable>
                    <Pressable accessibilityLabel={copy.copy} onPress={() => void copyCalculation()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                      <IconSymbol name="doc.on.doc" size={14} color={colors.primary} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
              {display ? (
                <>
                  <Text numberOfLines={2} adjustsFontSizeToFit style={styles.resultValue}>{display.value}</Text>
                  <View style={styles.conversionRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.conversionRail} keyboardShouldPersistTaps="handled">
                      <Pressable accessibilityLabel={copy.noUnit} onPress={() => applyTargetUnit("")} style={({ pressed }) => [styles.convertChip, !targetUnit.trim() && styles.convertChipActive, pressed && styles.pressed]}>
                        <Text style={[styles.convertChipText, !targetUnit.trim() && styles.convertChipTextActive]}>SI</Text>
                      </Pressable>
                      {conversionUnits.map((symbol) => (
                        <Pressable accessibilityLabel={symbol} key={symbol} onPress={() => applyTargetUnit(symbol)} style={({ pressed }) => [styles.convertChip, targetUnit.trim() === symbol && styles.convertChipActive, pressed && styles.pressed]}>
                          <Text style={[styles.convertChipText, targetUnit.trim() === symbol && styles.convertChipTextActive]}>{symbol}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    <Pressable accessibilityLabel={copy.outputUnit} onPress={() => openUnitPicker("target")} style={({ pressed }) => [styles.convertMore, pressed && styles.pressed]}>
                      <Text style={styles.convertMoreText}>{copy.more}</Text>
                      <IconSymbol name="chevron.right" size={11} color={colors.primary} />
                    </Pressable>
                  </View>
                  <View style={styles.siRow}>
                    <Text style={styles.siLabel}>{copy.siBase}</Text>
                    <Text numberOfLines={1} selectable style={styles.siValue}>{display.si}</Text>
                  </View>
                  {targetUnit.trim() && targetUnitRegistration.status !== "registered" ? (
                    <Text style={styles.registrationNote}>{targetUnitRegistration.status === "supported" ? `${targetUnit} · ${copy.supported}` : `${targetUnit} · ${copy.unknown}`}</Text>
                  ) : null}
                  {display.error ? <Text style={styles.errorText}>{display.error}</Text> : null}
                </>
              ) : (
                <>
                  <Text style={styles.emptyResult}>{copy.emptyResult}</Text>
                  <Pressable accessibilityLabel={copy.outputUnit} onPress={() => openUnitPicker("target")} style={({ pressed }) => [styles.presetOutputUnit, pressed && styles.pressed]}>
                    <Text style={styles.presetOutputUnitLabel}>{copy.outputUnit}</Text>
                    <View style={styles.presetOutputUnitValueWrap}>
                      <Text style={styles.presetOutputUnitValue}>{targetUnit.trim() || "SI"}</Text>
                      <IconSymbol name="chevron.right" size={11} color={colors.primary} />
                    </View>
                  </Pressable>
                </>
              )}
            </View>

            {notice ? <View style={styles.messageSuccess}><Text style={styles.messageSuccessText}>{notice}</Text></View> : null}

            {history.length ? (
              <View style={styles.historyList}>
                <View style={styles.historyListHeader}>
                  <Text style={styles.cardLabel}>{copy.history}</Text>
                  <Pressable accessibilityLabel={copy.savedHistory} onPress={() => setShowHistory(true)} style={({ pressed }) => [styles.historyOpenAll, pressed && styles.pressed]}>
                    <Text style={styles.historyOpenAllText}>{history.length} ›</Text>
                  </Pressable>
                </View>
                {visibleHistory.slice(0, 4).map((entry, index) => (
                  <Pressable accessibilityLabel={`a${index + 1} ${entry.expression}`} key={entry.id} onPress={() => restoreHistory(entry)} style={({ pressed }) => [styles.historyRowCompact, pressed && styles.cardPressed]}>
                    <Text style={styles.historyAutoSymbol}>a{index + 1}</Text>
                    <Text numberOfLines={1} style={styles.historyExpression}>{entry.expression}</Text>
                    <Text numberOfLines={1} style={styles.historyResult}>{entry.resultText}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolRail} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => setShowSamples(true)} style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}><Text style={styles.toolButtonText}>{copy.samples}</Text></Pressable>
          <Pressable onPress={() => openUnitPicker("insert")} style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}><Text style={styles.toolButtonText}>{copy.units}</Text></Pressable>
          <Pressable onPress={() => setShowShortcuts(true)} style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}><Text style={styles.toolButtonText}>{copy.shortcuts}</Text></Pressable>
          {isAdvancedMode ? <Pressable onPress={() => setShowAdvancedKeys(true)} style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}><Text style={styles.toolButtonText}>{copy.math}</Text></Pressable> : null}
        </ScrollView>

        <View style={styles.keypad}>
          {KEYS.map((key, index) => {
            const isAction = key === "=";
            const isOperator = ["×", "÷", "+", "-"].includes(key);
            if (key === " ") return <View key={`blank-${index}`} style={styles.keyCell} />;
            return (
              <View key={`${key}-${index}`} style={styles.keyCell}>
                <Pressable
                  accessibilityLabel={key === "⌫" ? (language === "en" ? "Delete" : "一文字削除") : key}
                  onPress={() => pressKey(key)}
                  style={({ pressed }) => [styles.key, isAction && styles.keyAction, isOperator && styles.keyOperator, pressed && styles.keyPressed]}
                >
                  {key === "⌫" ? <IconSymbol name="delete.left" size={20} color={colors.muted} /> : <Text style={[styles.keyText, (isAction || isOperator) && styles.keyTextAccent, isAction && { color: colors.onPrimary }]}>{key}</Text>}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      <Modal visible={showSamples} transparent animationType="slide" onRequestClose={() => setShowSamples(false)}>
        <View style={styles.modalBackdrop}><View style={styles.compactSheet}><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{copy.samples}</Text><Pressable accessibilityLabel={copy.close} onPress={() => setShowSamples(false)} style={styles.closeHelp}><IconSymbol name="xmark" size={20} color={colors.muted} /></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>{visibleSampleCategories.map((category) => <Pressable key={category.id} onPress={() => setSampleCategory(category.id)} style={({ pressed }) => [styles.categoryChip, sampleCategory === category.id && styles.categoryChipActive, pressed && styles.pressed]}><Text style={[styles.categoryChipText, sampleCategory === category.id && styles.categoryChipTextActive]}>{language === "en" ? category.labelEn : category.label}</Text></Pressable>)}</ScrollView><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>{visibleSamples.map((sample) => <Pressable key={sample.id} onPress={() => { applySample(sample); setShowSamples(false); }} style={({ pressed }) => [styles.sampleRow, pressed && styles.cardPressed]}><View style={styles.sampleCopy}><Text style={styles.sampleTitle}>{language === "en" ? sample.titleEn : sample.title}</Text><Text style={styles.sampleDescription}>{language === "en" ? sample.descriptionEn : sample.description}</Text></View><View style={styles.sampleExpressionWrap}><Text numberOfLines={1} style={styles.sampleExpression}>{sample.expression}</Text><Text style={styles.sampleTarget}>→ {targetUnitForSample(sample)}</Text></View></Pressable>)}</ScrollView></View></View>
      </Modal>

      <Modal visible={showUnitPicker} transparent animationType="slide" onRequestClose={() => setShowUnitPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.compactSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderMain}>
                <Text style={styles.sheetTitle}>{unitPickerMode === "target" ? copy.outputUnit : copy.insertUnit}</Text>
                <Text style={styles.sheetSubtitle}>{copy.pickUnit}</Text>
              </View>
              <Pressable accessibilityLabel={copy.close} onPress={() => setShowUnitPicker(false)} style={styles.closeHelp}><IconSymbol name="xmark" size={20} color={colors.muted} /></Pressable>
            </View>
            <View style={styles.unitSearchWrap}>
              <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
              <TextInput ref={unitSearchRef} value={unitSearch} onChangeText={setUnitSearch} placeholder={copy.unitSearch} placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.unitSearchInput} />
            </View>
            {unitSearch.trim() ? (
              <View style={[styles.registrationCard, searchedUnitRegistration.status === "unknown" && styles.registrationCardUnknown, searchedUnitRegistration.status === "supported" && styles.registrationCardSupported]}>
                <Text style={styles.registrationCardTitle}>{searchedUnitRegistration.status === "registered" ? copy.registered : searchedUnitRegistration.status === "supported" ? copy.supported : copy.unknown}</Text>
                <Text style={styles.registrationCardHint}>
                  {searchedUnitRegistration.status === "registered"
                    ? `${unitSearch.trim()}${searchedUnitRegistration.matchedAlias ? ` ${copy.aliasNote} ${searchedUnitRegistration.canonical}` : ""} · ${unitGroupLabel(searchedUnitRegistration.group?.id ?? "")}`
                    : searchedUnitRegistration.status === "supported" ? unitSearch.trim() : copy.unknownHint}
                </Text>
                {searchedUnitRegistration.status !== "unknown" ? (
                  <Pressable onPress={() => chooseUnit(searchedUnitRegistration.canonical ?? unitSearch.trim())} style={({ pressed }) => [styles.useTypedUnitButton, pressed && styles.pressed]}>
                    <Text style={styles.useTypedUnitText}>{copy.use} “{searchedUnitRegistration.canonical ?? unitSearch.trim()}”</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {unitSearch.trim() ? null : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
                {visibleInputGroups.map((group) => (
                  <Pressable key={group.id} onPress={() => setInputGroupId(group.id)} style={({ pressed }) => [styles.categoryChip, inputGroupId === group.id && styles.categoryChipActive, pressed && styles.pressed]}>
                    <Text style={[styles.categoryChipText, inputGroupId === group.id && styles.categoryChipTextActive]}>{unitGroupLabel(group.id)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList} keyboardShouldPersistTaps="handled">
              {unitSearch.trim() ? (
                <>
                  <Text style={styles.pickerSectionLabel}>{copy.allCandidates}</Text>
                  <View style={styles.chips}>{searchSuggestions.map((suggestion) => renderUnitChip(suggestion, () => chooseUnit(suggestion.unit.symbol), targetUnit.trim() === suggestion.unit.symbol && unitPickerMode === "target"))}</View>
                </>
              ) : (
                <>
                  {unitPickerMode === "target" && compatibleUnitGroups.length ? (
                    <>
                      <Text style={styles.pickerSectionLabel}>{copy.compatible}</Text>
                      {compatibleUnitGroups.map((group) => (
                        <View key={group.id} style={styles.pickerGroup}>
                          <Text style={styles.unitGroupLabel}>{unitGroupLabel(group.id)}</Text>
                          <View style={styles.chips}>{visibleGroupUnits(group).map((unitOption) => renderUnitChip({ group, unit: unitOption }, () => chooseUnit(unitOption.symbol), targetUnit.trim() === unitOption.symbol))}</View>
                        </View>
                      ))}
                    </>
                  ) : null}
                  <Text style={styles.pickerSectionLabel}>{unitGroupLabel(selectedInputGroup.id)}</Text>
                  <View style={styles.chips}>{selectedInputUnits.map((unitOption) => renderUnitChip({ group: selectedInputGroup, unit: unitOption }, () => chooseUnit(unitOption.symbol), unitPickerMode === "target" && targetUnit.trim() === unitOption.symbol))}</View>
                </>
              )}
              {/* 検索中でも、Pro のお気に入り単位は隠さず常に選べるようにする。 */}
              {isPro && favoriteUnits.length ? (
                <View style={styles.favoritePicker}>
                  <Text style={styles.pickerSectionLabel}>PRO</Text>
                  <View style={styles.chips}>{favoriteUnits.map((unit) => <Pressable key={unit} onPress={() => chooseUnit(unit)} style={({ pressed }) => [styles.unitChip, pressed && styles.pressed]}><Text style={styles.unitChipSymbol}>{unit}</Text></Pressable>)}</View>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showShortcuts} transparent animationType="fade" onRequestClose={() => setShowShortcuts(false)}>
        <View style={styles.modalBackdrop}><View style={styles.compactSheet}><View style={styles.sheetHeader}><View style={styles.sheetHeaderMain}><Text style={styles.sheetTitle}>{copy.speedTitle}</Text><Text style={styles.sheetSubtitle}>{copy.speedFormula}</Text></View><Pressable accessibilityLabel={copy.close} onPress={() => setShowShortcuts(false)} style={styles.closeHelp}><IconSymbol name="xmark" size={20} color={colors.muted} /></Pressable></View><View style={styles.modalList}>{[[copy.findSpeed, "1km ÷ 1min", "km/h"], [copy.findDistance, "10m/s × 2min", "km"], [copy.findTime, "1km ÷ 5m/s", "min"]].map(([label, nextExpression, nextUnit]) => <Pressable key={String(label)} onPress={() => { applyMotionExample(String(nextExpression), String(nextUnit), language === "en" ? "Example loaded." : "計算例を入力しました。" ); setShowShortcuts(false); }} style={({ pressed }) => [styles.shortcutRow, pressed && styles.cardPressed]}><Text style={styles.shortcutTitle}>{label}</Text><Text style={styles.shortcutExpression}>{nextExpression} → {nextUnit}</Text></Pressable>)}</View></View></View>
      </Modal>

      <Modal visible={showAdvancedKeys} transparent animationType="fade" onRequestClose={() => setShowAdvancedKeys(false)}>
        <View style={styles.modalBackdrop}><View style={styles.compactSheet}><View style={styles.sheetHeader}><View style={styles.sheetHeaderMain}><Text style={styles.sheetTitle}>{copy.advancedMath}</Text><Text style={styles.sheetSubtitle}>{copy.advancedMathHint}</Text></View><Pressable accessibilityLabel={copy.close} onPress={() => setShowAdvancedKeys(false)} style={styles.closeHelp}><IconSymbol name="xmark" size={20} color={colors.muted} /></Pressable></View><View style={styles.advancedKeyRow}>{ADVANCED_KEYS.map((key) => <Pressable accessibilityLabel={key} key={key} onPress={() => { pressKey(key); setShowAdvancedKeys(false); }} style={({ pressed }) => [styles.advancedKey, pressed && styles.pressed]}><Text style={styles.advancedKeyText}>{key}</Text></Pressable>)}</View></View></View>
      </Modal>

      <Modal visible={showHistory} transparent animationType="slide" onRequestClose={() => setShowHistory(false)}>
        <View style={styles.modalBackdrop}><View style={styles.compactSheet}><View style={styles.sheetHeader}><View style={styles.sheetHeaderMain}><Text style={styles.sheetTitle}>{copy.savedHistory}</Text><Text style={styles.sheetSubtitle}>{copy.historyHint}</Text></View><Pressable accessibilityLabel={copy.close} onPress={() => setShowHistory(false)} style={styles.closeHelp}><IconSymbol name="xmark" size={20} color={colors.muted} /></Pressable></View><View style={styles.historyActions}><Pressable onPress={() => void exportHistory()} style={({ pressed }) => [styles.exportHistoryButton, pressed && styles.pressed]}><IconSymbol name="square.and.arrow.up" size={15} color={colors.primary} /><Text style={styles.exportHistoryText}>CSV</Text></Pressable><Pressable onPress={() => void clearHistory()} style={({ pressed }) => [styles.clearHistoryButton, pressed && styles.pressed]}><Text style={styles.clearHistoryText}>{copy.clear}</Text></Pressable></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>{visibleHistory.map((entry, index) => <Pressable key={entry.id} onPress={() => { restoreHistory(entry); setShowHistory(false); }} style={({ pressed }) => [styles.historyRow, pressed && styles.cardPressed]}><View style={styles.historyExpressionWrap}><Text style={styles.historyAutoSymbol}>a{index + 1}</Text><Text numberOfLines={1} style={styles.historyExpression}>{entry.expression}</Text></View><Text numberOfLines={1} style={styles.historyResult}>{entry.resultText}</Text></Pressable>)}</ScrollView></View></View>
      </Modal>

      <Modal visible={showHelp} transparent animationType="fade" onRequestClose={() => setShowHelp(false)}>
        <View style={styles.helpBackdrop}>
          <View style={styles.helpSheet}>
            <View style={styles.helpTitleRow}>
              <Text style={styles.helpTitle}>{copy.helpTitle}</Text>
              <Pressable accessibilityLabel={copy.close} onPress={() => setShowHelp(false)} style={({ pressed }) => [styles.closeHelp, pressed && styles.pressed]}>
                <IconSymbol name="xmark" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={styles.helpText}>• 5cm + 1mm</Text>
            <Text style={styles.helpText}>• 3cm × 20mm</Text>
            <Text style={styles.helpText}>• 90sec / 1hour / 2days</Text>
            <Text style={styles.helpText}>• {copy.definitionHint}</Text>
            <Text style={styles.helpText}>• W × H</Text>
            <Text style={styles.helpText}>• 0.125 → % / ppm</Text>
            <Text style={styles.helpHint}>{copy.fixTap}</Text>
            <Pressable onPress={() => setShowHelp(false)} style={({ pressed }) => [styles.helpDone, pressed && styles.pressed]}>
              <Text style={styles.helpDoneText}>{copy.helpDone}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(unitInfo)} transparent animationType="fade" onRequestClose={() => setUnitInfoSymbol(null)}>
        <View style={styles.unitInfoBackdrop}>
          {unitInfo ? <View style={styles.unitInfoSheet}>
            <View style={styles.unitInfoHeader}>
              <View>
                <Text style={styles.cardLabel}>{copy.unitDetails}</Text>
                <Text style={styles.unitInfoSymbol}>{unitInfo.symbol}</Text>
                <Text style={styles.unitInfoTitle}>{unitInfo.name[language]}</Text>
              </View>
              <Pressable accessibilityLabel={copy.close} onPress={() => setUnitInfoSymbol(null)} style={({ pressed }) => [styles.closeHelp, pressed && styles.iconPressed]}>
                <IconSymbol name="xmark" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={styles.unitInfoSummary}>{unitInfo.summary[language]}</Text>
            <View style={styles.unitInfoFact}>
              <Text style={styles.unitInfoFactLabel}>{copy.siConversion}</Text>
              <Text selectable style={styles.unitInfoFactValue}>{unitInfo.siConversion}</Text>
            </View>
            <View style={styles.unitInfoFact}>
              <Text style={styles.unitInfoFactLabel}>{copy.commonUse}</Text>
              <Text style={styles.unitInfoUsage}>{unitInfo.usage[language]}</Text>
            </View>
            <Pressable onPress={() => setUnitInfoSymbol(null)} style={({ pressed }) => [styles.unitInfoDone, pressed && styles.pressed]}>
              <Text style={styles.unitInfoDoneText}>{copy.close}</Text>
            </Pressable>
          </View> : null}
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  // 画面全体を一枚に収め、縦スクロールを起こさない構成にする。
  screen: { flex: 1, gap: 6, paddingBottom: 4, paddingTop: 2 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  title: { color: colors.foreground, fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
  headerActions: { alignItems: "center", flexDirection: "row", gap: 6 },
  headerButton: { alignItems: "center", backgroundColor: colors.primarySurface, borderRadius: 16, height: 32, justifyContent: "center", width: 32 },

  inputCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 5, paddingHorizontal: 12, paddingVertical: 8 },
  inputRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  expressionInput: { color: colors.foreground, flex: 1, fontFamily: mono, fontSize: 19, fontWeight: "600", minHeight: 44, paddingHorizontal: 0 },
  calculateButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 11, height: 44, justifyContent: "center", width: 52 },
  calculateText: { color: colors.onPrimary, fontFamily: mono, fontSize: 20, fontWeight: "800" },

  // 式のどこが数値・単位・未登録なのかを一目で見分けられるようにする。
  previewRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", rowGap: 2 },
  previewNumber: { color: colors.foreground, fontFamily: mono, fontSize: 13 },
  previewUnit: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  previewIdentifier: { color: colors.warning, fontFamily: mono, fontSize: 13, fontWeight: "700" },
  previewOperator: { color: colors.muted, fontFamily: mono, fontSize: 13 },
  previewUnknownWrap: { alignItems: "center", backgroundColor: colors.errorSurface, borderColor: colors.errorBorder, borderRadius: 6, borderWidth: 1, flexDirection: "row", gap: 3, paddingHorizontal: 4 },
  previewUnknown: { color: colors.error, fontFamily: mono, fontSize: 13, fontWeight: "800", textDecorationLine: "underline" },

  hintRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  hintLabel: { color: colors.muted, flexShrink: 0, fontSize: 10, fontWeight: "800", width: 58 },
  hintLabelAlert: { color: colors.error },
  hintRail: { alignItems: "center", gap: 6, paddingRight: 4 },
  hintEmpty: { color: colors.muted, flex: 1, fontSize: 11 },
  hintSearchButton: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 9, borderWidth: 1, height: 32, justifyContent: "center", width: 34 },

  unitChip: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 10, borderWidth: 1, minWidth: 46, paddingHorizontal: 9, paddingVertical: 4 },
  unitChipActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  unitChipSymbol: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  unitChipSymbolActive: { color: colors.onPrimary },
  unitChipName: { color: colors.muted, fontSize: 9, maxWidth: 92 },
  unitChipNameActive: { color: colors.onPrimary },

  middle: { flexGrow: 1, flexShrink: 1, minHeight: 84 },
  middleContent: { gap: 7 },
  resultCard: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 16, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 },
  resultHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  resultActions: { alignItems: "center", flexDirection: "row", gap: 6 },
  iconButton: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 8, height: 28, justifyContent: "center", width: 32 },
  resultValue: { color: colors.primaryStrong, fontFamily: mono, fontSize: 28, fontWeight: "700", marginTop: 2, minHeight: 34 },
  emptyResult: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
  presetOutputUnit: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  presetOutputUnitLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  presetOutputUnitValueWrap: { alignItems: "center", flexDirection: "row", gap: 2 },
  presetOutputUnitValue: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },

  // 結果のすぐ下で単位を切り替えられるようにする。
  conversionRow: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 4 },
  conversionRail: { alignItems: "center", gap: 6, paddingRight: 4 },
  convertChip: { backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 9, borderWidth: 1, minHeight: 30, justifyContent: "center", paddingHorizontal: 10 },
  convertChipActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  convertChipText: { color: colors.primary, fontFamily: mono, fontSize: 12, fontWeight: "800" },
  convertChipTextActive: { color: colors.onPrimary },
  convertMore: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 9, borderWidth: 1, flexDirection: "row", gap: 2, minHeight: 30, paddingHorizontal: 8 },
  convertMoreText: { color: colors.primary, fontSize: 11, fontWeight: "800" },

  siRow: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between", marginTop: 7 },
  siLabel: { color: colors.muted, fontSize: 11 },
  siValue: { color: colors.foreground, flexShrink: 1, fontFamily: mono, fontSize: 12, fontWeight: "600", textAlign: "right" },
  registrationNote: { color: colors.warning, fontSize: 10, marginTop: 4 },
  errorText: { color: colors.error, fontSize: 11, lineHeight: 16, marginTop: 6 },

  messageError: { backgroundColor: colors.errorSurface, borderColor: colors.errorBorder, borderRadius: 10, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  messageErrorText: { color: colors.error, fontSize: 12, lineHeight: 17 },
  messageHint: { color: colors.muted, fontSize: 10, marginTop: 3 },
  messageSuccess: { backgroundColor: colors.successSurface, borderColor: colors.successBorder, borderRadius: 10, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  messageSuccessText: { color: colors.success, fontSize: 12, lineHeight: 17 },

  toolRail: { alignItems: "center", gap: 6, paddingRight: 4 },
  toolButton: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderRadius: 9, borderWidth: 1, justifyContent: "center", minHeight: 32, paddingHorizontal: 11 },
  toolButtonText: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  historyList: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9 },
  historyListHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  historyOpenAll: { paddingHorizontal: 4, paddingVertical: 2 },
  historyOpenAllText: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  historyRowCompact: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 7, minHeight: 32, paddingTop: 4 },

  // 画面幅に関係なく必ず4列で並ぶよう、25%幅のセルに収める。
  keypad: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 },
  keyCell: { padding: 3, width: "25%" },
  key: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, height: 42, justifyContent: "center" },
  keyOperator: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder },
  keyAction: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  keyText: { color: colors.foreground, fontFamily: mono, fontSize: 18, fontWeight: "600" },
  keyTextAccent: { color: colors.primary },
  keyPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  iconPressed: { opacity: 0.55 },
  cardPressed: { opacity: 0.7 },

  sampleRow: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderRadius: 11, borderWidth: 1, flexDirection: "row", paddingHorizontal: 11, paddingVertical: 10 },
  sampleCopy: { flex: 1, marginRight: 10 },
  sampleTitle: { color: colors.foreground, fontSize: 13, fontWeight: "800" },
  sampleDescription: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  sampleExpressionWrap: { alignItems: "flex-end", maxWidth: "48%" },
  sampleExpression: { color: colors.primary, fontFamily: mono, fontSize: 12, fontWeight: "700" },
  sampleTarget: { color: colors.muted, fontFamily: mono, fontSize: 11, marginTop: 2 },

  unitSearchWrap: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", marginTop: 4, minHeight: 45, paddingHorizontal: 12 },
  unitSearchInput: { color: colors.foreground, flex: 1, fontSize: 14, marginLeft: 8, paddingVertical: 9 },
  categoryRail: { gap: 7, paddingBottom: 2, paddingTop: 10 },
  categoryChip: { backgroundColor: colors.surfaceSecondary, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 7 },
  categoryChipActive: { backgroundColor: colors.primaryFill },
  categoryChipText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  categoryChipTextActive: { color: colors.onPrimary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 5 },
  unitGroupLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  favoritePicker: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder, borderRadius: 12, borderWidth: 1, marginTop: 6, padding: 10 },

  advancedKeyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  advancedKey: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 10, borderWidth: 1, justifyContent: "center", minHeight: 38, minWidth: 54, paddingHorizontal: 10 },
  advancedKeyText: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },

  historyActions: { alignItems: "center", flexDirection: "row", gap: 10 },
  exportHistoryButton: { alignItems: "center", flexDirection: "row", gap: 3, padding: 4 },
  exportHistoryText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  clearHistoryButton: { padding: 4 },
  clearHistoryText: { color: colors.error, fontSize: 11, fontWeight: "700" },
  historyRow: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 11, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginBottom: 6, paddingHorizontal: 12, paddingVertical: 10 },
  historyExpressionWrap: { alignItems: "center", flex: 1, flexDirection: "row", marginRight: 10 },
  historyAutoSymbol: { color: colors.primary, fontFamily: mono, fontSize: 11, fontWeight: "800", marginRight: 7 },
  historyExpression: { color: colors.foreground, flex: 1, fontFamily: mono, fontSize: 12 },
  historyResult: { color: colors.primary, fontFamily: mono, fontSize: 12, fontWeight: "700", maxWidth: "45%" },

  modalBackdrop: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" },
  compactSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "86%", paddingBottom: 28, paddingHorizontal: 18, paddingTop: 12 },
  sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  sheetTitle: { color: colors.foreground, fontSize: 20, fontWeight: "800" },
  sheetHeaderMain: { flex: 1, paddingRight: 10 },
  sheetSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  modalList: { gap: 8, paddingBottom: 18, paddingTop: 10 },
  registrationCard: { backgroundColor: colors.successSurface, borderColor: colors.successBorder, borderRadius: 12, borderWidth: 1, marginTop: 9, padding: 10 },
  registrationCardSupported: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder },
  registrationCardUnknown: { backgroundColor: colors.errorSurface, borderColor: colors.errorBorder },
  registrationCardTitle: { color: colors.foreground, fontSize: 12, fontWeight: "800" },
  registrationCardHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  useTypedUnitButton: { alignSelf: "flex-start", backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, marginTop: 8, paddingHorizontal: 9, paddingVertical: 6 },
  useTypedUnitText: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  pickerSectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  pickerGroup: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 9 },
  shortcutRow: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 12, borderWidth: 1, padding: 12 },
  shortcutTitle: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  shortcutExpression: { color: colors.foreground, fontFamily: mono, fontSize: 12, marginTop: 4 },

  helpBackdrop: { alignItems: "center", backgroundColor: colors.overlay, flex: 1, justifyContent: "center", padding: 24 },
  helpSheet: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, width: "100%" },
  helpTitleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  helpTitle: { color: colors.foreground, fontSize: 20, fontWeight: "700" },
  closeHelp: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 16, height: 32, justifyContent: "center", width: 32 },
  helpText: { color: colors.foreground, fontFamily: mono, fontSize: 13, lineHeight: 24 },
  helpHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  helpDone: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 11, marginTop: 16, paddingVertical: 12 },
  helpDoneText: { color: colors.onPrimary, fontWeight: "700" },

  unitInfoBackdrop: { alignItems: "center", backgroundColor: colors.overlay, flex: 1, justifyContent: "center", padding: 24 },
  unitInfoSheet: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, maxWidth: 520, padding: 20, width: "100%" },
  unitInfoHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  unitInfoSymbol: { color: colors.primary, fontFamily: mono, fontSize: 26, fontWeight: "800" },
  unitInfoTitle: { color: colors.foreground, fontSize: 18, fontWeight: "800", marginTop: 2 },
  unitInfoSummary: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 13 },
  unitInfoFact: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 11, borderWidth: 1, marginTop: 14, padding: 12 },
  unitInfoFactLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  unitInfoFactValue: { color: colors.foreground, fontFamily: mono, fontSize: 14, fontWeight: "700", marginTop: 4 },
  unitInfoUsage: { color: colors.foreground, fontSize: 13, lineHeight: 19, marginTop: 4 },
  unitInfoDone: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 11, marginTop: 18, paddingVertical: 12 },
  unitInfoDoneText: { color: colors.onPrimary, fontWeight: "700" },
});
