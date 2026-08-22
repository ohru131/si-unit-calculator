import { useEffect, useMemo, useRef, useState } from "react";
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
import { useCalculatorStore } from "@/lib/calculator-store";
import { exportCalculationHistory } from "@/lib/calculation-export";
import { useGlobalSettings } from "@/lib/global-settings";
import { getCalculatorQuickShortcut } from "@/lib/quick-shortcuts";
import { usePro } from "@/lib/revenuecat-provider";
import { getUnitExplanation } from "@/lib/unit-explanations";
import UnitCalculatorWidget from "@/widgets/UnitCalculatorWidget";
import { SAMPLE_CALCULATIONS, SAMPLE_CATEGORIES, type SampleCalculation } from "@/lib/sample-calculations";
import { evaluateExpression, formatDimension, formatQuantity, getCompatibleUnitGroups, getRegionalUnits, parseConstantDefinition, Quantity, searchUnitOptions, UNIT_GROUPS } from "@/lib/units";

const KEYS = ["(", ")", "÷", "⌫", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", ".", "0", " ", "="];

export default function CalculatorScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { quick } = useLocalSearchParams<{ quick?: string | string[] }>();
  const { constants, history, favoriteUnits, upsertConstant, addHistoryEntry, clearHistory } = useCalculatorStore();
  const { isPro } = usePro();
  const { language, locale, t, unitGroupLabel, unitSystem } = useGlobalSettings();
  const [expression, setExpression] = useState("5cm + 1mm");
  const [targetUnit, setTargetUnit] = useState("cm");
  const [result, setResult] = useState<Quantity | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inputGroupId, setInputGroupId] = useState("length");
  const [sampleCategory, setSampleCategory] = useState("basic");
  const [showHelp, setShowHelp] = useState(false);
  const [unitInfoSymbol, setUnitInfoSymbol] = useState<string | null>(null);
  const [unitSearch, setUnitSearch] = useState("");
  const unitSearchRef = useRef<TextInput>(null);

  const selectedInputGroup = UNIT_GROUPS.find((group) => group.id === inputGroupId) ?? UNIT_GROUPS[0];
  const selectedInputUnits = useMemo(() => getRegionalUnits(selectedInputGroup, unitSystem), [selectedInputGroup, unitSystem]);
  const searchedUnits = useMemo(() => searchUnitOptions(unitSearch, unitSystem), [unitSearch, unitSystem]);
  const compatibleUnitGroups = useMemo(() => (result ? getCompatibleUnitGroups(result.dimension) : []), [result]);
  const visibleSamples = useMemo(() => SAMPLE_CALCULATIONS.filter((sample) => sample.category === sampleCategory), [sampleCategory]);
  const visibleHistory = isPro ? history : history.slice(0, 5);
  const unitInfo = useMemo(() => getUnitExplanation(unitInfoSymbol ?? ""), [unitInfoSymbol]);

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
    definitionHint: "Define a constant: W = 3cm", calculate: "Calculate", siBase: "SI base unit", emptyResult: "Enter an expression, then tap Calculate.", unitPlaceholder: "Choose a compatible unit or enter one", selectAfter: "Compatible units appear here after calculation.", speedTitle: "Distance, time & speed", speedFormula: "Speed = distance ÷ time     Distance = speed × time", findSpeed: "Find speed", findDistance: "Find distance", findTime: "Find time", speedHint: "Mix s, min, h, m, km, and other compatible units freely.", savedHistory: "Saved calculations", clear: "Clear", helpTitle: "Examples", helpDone: "Done", unitSearch: "Search units or categories", copied: "Calculation copied", copy: "Copy", unitDetails: "Unit details", siConversion: "SI conversion", commonUse: "Common use", close: "Close",
  } : {
    definitionHint: "定数定義：W = 3cm", calculate: "計算", siBase: "SI標準単位", emptyResult: "式を入力して「計算」を押してください。", unitPlaceholder: "候補から選択、または入力", selectAfter: "計算後、次元に合う単位のみをここへ表示します。", speedTitle: "距離・時間・速度", speedFormula: "速度 ＝ 距離 ÷ 時間　　距離 ＝ 速度 × 時間", findSpeed: "速度を求める", findDistance: "距離を求める", findTime: "時間を求める", speedHint: "時間は s、min、h、距離は m、km などを自由に組み合わせられます。", savedHistory: "保存済みの計算履歴", clear: "消去", helpTitle: "入力例", helpDone: "閉じる", unitSearch: "単位・カテゴリを検索", copied: "計算結果をコピーしました", copy: "コピー", unitDetails: "単位の説明", siConversion: "SI換算", commonUse: "主な利用分野", close: "閉じる",
  };

  const display = useMemo(() => {
    if (!result) return null;
    try {
      return { value: formatQuantity(result, targetUnit, locale), si: formatQuantity(result, undefined, locale), dimension: formatDimension(result.dimension), error: "" };
    } catch (cause) {
      return { value: "—", si: formatQuantity(result, undefined, locale), dimension: formatDimension(result.dimension), error: cause instanceof Error ? cause.message : "変換できません。" };
    }
  }, [locale, result, targetUnit]);

  const calculate = async (expressionOverride?: string, targetUnitOverride?: string) => {
    const input = (expressionOverride ?? expression).trim();
    const selectedTargetUnit = targetUnitOverride ?? targetUnit;
    if (!input) {
      setError("式を入力してください。");
      return;
    }
    setError("");
    setNotice("");
    try {
      const assignment = input.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      const next = assignment ? parseConstantDefinition(input, constants) : null;
      const quantity = next?.quantity ?? evaluateExpression(input, constants);
      if (next) {
        await upsertConstant(next.symbol, next.expression);
        setNotice(`定数 ${next.symbol} を保存しました。`);
      }
      setResult(quantity);
      let output = formatQuantity(quantity);
      try {
        output = selectedTargetUnit.trim() ? formatQuantity(quantity, selectedTargetUnit, locale) : output;
      } catch {
        setNotice("計算しました。表示単位を候補から選ぶと変換できます。");
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
          targetUnit: selectedTargetUnit.trim(),
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
      return;
    }
    if (key === " ") return;
    const inserted = key === "×" ? "×" : key === "÷" ? "÷" : key;
    setExpression((current) => `${current}${inserted}`);
  };

  const applyTargetUnit = (unit: string) => {
    setTargetUnit(unit);
    setError("");
  };

  const insertUnit = (unit: string) => {
    setExpression((current) => `${current}${unit}`);
    setError("");
    setNotice("");
  };

  const restoreHistory = (entry: (typeof history)[number]) => {
    setExpression(entry.expression);
    setTargetUnit(entry.targetUnit);
    setResult(entry.quantity);
    setError("");
    setNotice("保存済みの計算結果を復元しました。");
  };

  const applyMotionExample = (nextExpression: string, nextTargetUnit: string, message: string) => {
    setExpression(nextExpression);
    setTargetUnit(nextTargetUnit);
    setResult(null);
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
      setError("");
      setNotice(action === "speed" ? (language === "en" ? "Speed example ready: distance ÷ time." : "速度の例を準備しました：距離 ÷ 時間") : (language === "en" ? "Pressure example ready: force ÷ area." : "圧力の例を準備しました：力 ÷ 面積"));
    }
    if (shortcut.sampleCategory) {
      setSampleCategory(shortcut.sampleCategory);
      setNotice(language === "en" ? "Choose a sample calculation to begin." : "サンプル計算式を選んで試せます。");
    }
    if (shortcut.focusSearch) {
      setTimeout(() => unitSearchRef.current?.focus(), 250);
    }
  }, [language, quick]);

  const applySample = (sample: SampleCalculation) => {
    const sampleTargetUnit = targetUnitForSample(sample);
    setExpression(sample.expression);
    setTargetUnit(sampleTargetUnit);
    setResult(null);
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

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t("calculator")}</Text>
            <Text style={styles.subtitle}>{t("calculatorSubtitle")}</Text>
          </View>
          <Pressable accessibilityLabel="入力例を表示" onPress={() => setShowHelp(true)} style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}>
            <IconSymbol name="questionmark.circle.fill" size={25} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.samplesCard}>
          <Text style={styles.cardLabel}>{t("examples")}</Text>
          <Text style={styles.samplesHint}>{t("examplesHint")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleCategoryRail}>
            {SAMPLE_CATEGORIES.map((category) => (
              <Pressable key={category.id} onPress={() => setSampleCategory(category.id)} style={({ pressed }) => [styles.sampleCategoryChip, sampleCategory === category.id && styles.sampleCategoryChipActive, pressed && styles.pressed]}>
                <Text style={[styles.sampleCategoryText, sampleCategory === category.id && styles.sampleCategoryTextActive]}>{language === "en" ? category.labelEn : category.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.sampleList}>
            {visibleSamples.map((sample) => (
              <Pressable key={sample.id} onPress={() => applySample(sample)} style={({ pressed }) => [styles.sampleRow, pressed && styles.cardPressed]}>
                <View style={styles.sampleCopy}>
                  <Text style={styles.sampleTitle}>{language === "en" ? sample.titleEn : sample.title}</Text>
                  <Text style={styles.sampleDescription}>{language === "en" ? sample.descriptionEn : sample.description}</Text>
                </View>
                <View style={styles.sampleExpressionWrap}>
                  <Text numberOfLines={1} style={styles.sampleExpression}>{sample.expression}</Text>
                  <Text style={styles.sampleTarget}>→ {targetUnitForSample(sample)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.cardLabel}>{t("expression")}</Text>
            <Text style={styles.syntaxHint}>{t("expressionHint")}</Text>
          </View>
          <TextInput
            value={expression}
            onChangeText={(text) => {
              setExpression(text);
              setError("");
              setNotice("");
            }}
            onSubmitEditing={() => void calculate()}
            placeholder={language === "en" ? "Example: 5cm + 1mm" : "例：5cm + 1mm"}
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            style={styles.expressionInput}
          />
          <View style={styles.inputFooter}>
            <Text style={styles.definitionHint}>{copy.definitionHint}</Text>
            <Pressable onPress={() => void calculate()} style={({ pressed }) => [styles.calculateButton, pressed && styles.pressed]}>
              <Text style={styles.calculateText}>{copy.calculate}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.resultCard}>
          <View style={styles.resultHeader}><Text style={styles.cardLabel}>{t("result")}</Text>{display ? <Pressable accessibilityLabel={copy.copy} onPress={() => void copyCalculation()} style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}><IconSymbol name="doc.on.doc" size={16} color={colors.primary} /><Text style={styles.copyButtonText}>{copy.copy}</Text></Pressable> : null}</View>
          {display ? (
            <>
              <Text numberOfLines={2} adjustsFontSizeToFit style={styles.resultValue}>{display.value}</Text>
              <View style={styles.divider} />
              <View style={styles.siRow}>
                <Text style={styles.siLabel}>{copy.siBase}</Text>
                <Text selectable style={styles.siValue}>{display.si}</Text>
              </View>
              <View style={styles.dimensionBadge}>
                <Text style={styles.dimensionLabel}>次元</Text>
                <Text style={styles.dimensionText}>{display.dimension}</Text>
              </View>
              {display.error ? <Text style={styles.errorText}>{display.error}</Text> : null}
            </>
          ) : (
            <Text style={styles.emptyResult}>{copy.emptyResult}</Text>
          )}
        </View>

        <View style={styles.convertCard}>
          <Text style={styles.cardLabel}>{t("displayUnit")}</Text>
          <TextInput
            value={targetUnit}
            onChangeText={applyTargetUnit}
            placeholder={copy.unitPlaceholder}
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.unitInput}
          />
          {compatibleUnitGroups.length ? (
            <View style={styles.unitGroupList}>
              <Text style={styles.compatibleHint}>{t("compatibleOnly")}</Text>
              {compatibleUnitGroups.map((group) => (
                <View key={group.id} style={styles.compatibleGroup}>
                  <Text style={styles.unitGroupLabel}>{unitGroupLabel(group.id)}</Text>
                  <View style={styles.chips}>
                    {getRegionalUnits(group, unitSystem).map((unit) => {
                      const explanation = getUnitExplanation(unit.symbol);
                      return (
                        <View key={unit.symbol} style={styles.unitChoice}>
                          <Pressable onPress={() => applyTargetUnit(unit.symbol)} style={({ pressed }) => [styles.chip, targetUnit === unit.symbol && styles.chipActive, pressed && styles.pressed]}>
                            <Text style={[styles.chipText, targetUnit === unit.symbol && styles.chipTextActive]}>{unit.label}</Text>
                          </Pressable>
                          {explanation ? <Pressable accessibilityLabel={`${unit.label} ${copy.unitDetails}`} onPress={() => setUnitInfoSymbol(unit.symbol)} style={({ pressed }) => [styles.unitInfoButton, pressed && styles.iconPressed]}><IconSymbol name="info.circle" size={15} color={colors.primary} /></Pressable> : null}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.compatibleHint}>{copy.selectAfter}</Text>
          )}
        </View>

        <View style={styles.unitPadCard}>
          <Text style={styles.cardLabel}>{t("enterUnit")}</Text>
          <Text style={styles.unitPadHint}>{t("enterUnitHint")}</Text>
          <View style={styles.unitSearchWrap}>
            <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
            <TextInput ref={unitSearchRef} value={unitSearch} onChangeText={setUnitSearch} placeholder={copy.unitSearch} placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.unitSearchInput} />
          </View>
          {searchedUnits.length ? <View style={styles.searchResults}>{searchedUnits.map(({ group, unit }) => {
            const explanation = getUnitExplanation(unit.symbol);
            return <View key={`${group.id}-${unit.symbol}`} style={styles.searchResult}><Pressable onPress={() => { insertUnit(unit.symbol); setUnitSearch(""); }} style={({ pressed }) => [styles.searchResultButton, pressed && styles.pressed]}><Text style={styles.searchUnit}>{unit.symbol}</Text><Text style={styles.searchGroup}>{unitGroupLabel(group.id)}</Text></Pressable>{explanation ? <Pressable accessibilityLabel={`${unit.symbol} ${copy.unitDetails}`} onPress={() => setUnitInfoSymbol(unit.symbol)} style={({ pressed }) => [styles.unitInfoButton, pressed && styles.iconPressed]}><IconSymbol name="info.circle" size={16} color={colors.primary} /></Pressable> : null}</View>;
          })}</View> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
            {UNIT_GROUPS.map((group) => (
              <Pressable key={group.id} onPress={() => setInputGroupId(group.id)} style={({ pressed }) => [styles.categoryChip, inputGroupId === group.id && styles.categoryChipActive, pressed && styles.pressed]}>
                <Text style={[styles.categoryChipText, inputGroupId === group.id && styles.categoryChipTextActive]}>{unitGroupLabel(group.id)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.inputUnitRow}>
            <Text style={styles.selectedGroupLabel}>{unitGroupLabel(selectedInputGroup.id)}</Text>
            <View style={styles.chips}>
              {selectedInputUnits.map((unit) => {
                const explanation = getUnitExplanation(unit.symbol);
                return <View key={unit.symbol} style={styles.unitChoice}><Pressable onPress={() => insertUnit(unit.symbol)} style={({ pressed }) => [styles.inputUnitChip, pressed && styles.pressed]}><Text style={styles.inputUnitText}>{unit.label}</Text></Pressable>{explanation ? <Pressable accessibilityLabel={`${unit.label} ${copy.unitDetails}`} onPress={() => setUnitInfoSymbol(unit.symbol)} style={({ pressed }) => [styles.unitInfoButton, pressed && styles.iconPressed]}><IconSymbol name="info.circle" size={15} color={colors.primary} /></Pressable> : null}</View>;
              })}
            </View>
          </View>
        </View>

        {isPro && favoriteUnits.length ? (
          <View style={styles.favoriteUnitsCard}>
            <View style={styles.favoriteHeader}><Text style={styles.cardLabel}>マイ単位セット</Text><Text style={styles.proTag}>PRO</Text></View>
            <View style={styles.chips}>{favoriteUnits.map((unit) => <Pressable key={unit} onPress={() => insertUnit(unit)} style={({ pressed }) => [styles.inputUnitChip, pressed && styles.pressed]}><Text style={styles.inputUnitText}>{unit}</Text></Pressable>)}</View>
          </View>
        ) : null}

        <View style={styles.motionCard}>
          <Text style={styles.cardLabel}>{copy.speedTitle}</Text>
          <Text style={styles.motionFormula}>{copy.speedFormula}</Text>
          <View style={styles.motionExamples}>
            <Pressable onPress={() => applyMotionExample("1km ÷ 1min", "km/h", "距離と時間から速度を計算する例を入力しました。")} style={({ pressed }) => [styles.motionButton, pressed && styles.pressed]}>
              <Text style={styles.motionButtonTitle}>{copy.findSpeed}</Text>
              <Text style={styles.motionButtonExample}>1km ÷ 1min</Text>
            </Pressable>
            <Pressable onPress={() => applyMotionExample("10m/s × 2min", "km", "速度と時間から距離を計算する例を入力しました。")} style={({ pressed }) => [styles.motionButton, pressed && styles.pressed]}>
              <Text style={styles.motionButtonTitle}>{copy.findDistance}</Text>
              <Text style={styles.motionButtonExample}>10m/s × 2min</Text>
            </Pressable>
            <Pressable onPress={() => applyMotionExample("1km ÷ 5m/s", "min", "距離と速度から時間を計算する例を入力しました。")} style={({ pressed }) => [styles.motionButton, pressed && styles.pressed]}>
              <Text style={styles.motionButtonTitle}>{copy.findTime}</Text>
              <Text style={styles.motionButtonExample}>1km ÷ 5m/s</Text>
            </Pressable>
          </View>
          <Text style={styles.motionHint}>{copy.speedHint}</Text>
        </View>

        {error ? <View style={styles.messageError}><Text style={styles.messageErrorText}>{error}</Text></View> : null}
        {notice ? <View style={styles.messageSuccess}><Text style={styles.messageSuccessText}>{notice}</Text></View> : null}

        <View style={styles.keypad}>
          {KEYS.map((key, index) => {
            const isAction = key === "=";
            const isOperator = ["×", "÷", "+", "-"].includes(key);
            const isBlank = key === " ";
            return (
              <Pressable
                key={`${key}-${index}`}
                disabled={isBlank}
                onPress={() => pressKey(key)}
                style={({ pressed }) => [styles.key, isAction && styles.keyAction, isOperator && styles.keyOperator, isBlank && styles.keyBlank, pressed && !isBlank && styles.keyPressed]}
              >
                {key === "⌫" ? <IconSymbol name="delete.left" size={22} color={colors.muted} /> : <Text style={[styles.keyText, (isAction || isOperator) && styles.keyTextAccent, isAction && { color: colors.onPrimary }]}>{key}</Text>}
              </Pressable>
            );
          })}
        </View>

        {history.length ? (
          <View style={styles.history}>
            <View style={styles.historyHeader}>
              <View><Text style={styles.historyTitle}>{copy.savedHistory}</Text>{!isPro && history.length > 5 ? <Text style={styles.historyLimit}>{language === "en" ? "Free shows the latest 5 entries" : "無料版では最新5件を表示"}</Text> : null}</View>
              <View style={styles.historyActions}>
                <Pressable onPress={() => void exportHistory()} style={({ pressed }) => [styles.exportHistoryButton, pressed && styles.pressed]}><IconSymbol name="square.and.arrow.up" size={15} color={colors.primary} /><Text style={styles.exportHistoryText}>CSV</Text></Pressable>
                <Pressable onPress={() => void clearHistory()} style={({ pressed }) => [styles.clearHistoryButton, pressed && styles.pressed]}><Text style={styles.clearHistoryText}>{copy.clear}</Text></Pressable>
              </View>
            </View>
            {visibleHistory.map((entry) => (
              <Pressable key={entry.id} onPress={() => restoreHistory(entry)} style={({ pressed }) => [styles.historyRow, pressed && styles.cardPressed]}>
                <Text numberOfLines={1} style={styles.historyExpression}>{entry.expression}</Text>
                <Text numberOfLines={1} style={styles.historyResult}>{entry.resultText}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={showHelp} transparent animationType="fade" onRequestClose={() => setShowHelp(false)}>
        <View style={styles.helpBackdrop}>
          <View style={styles.helpSheet}>
            <View style={styles.helpTitleRow}>
              <Text style={styles.helpTitle}>{copy.helpTitle}</Text>
              <Pressable accessibilityLabel="ヘルプを閉じる" onPress={() => setShowHelp(false)} style={({ pressed }) => [styles.closeHelp, pressed && styles.pressed]}>
                <IconSymbol name="xmark" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={styles.helpText}>• 5cm + 1mm</Text>
            <Text style={styles.helpText}>• 3cm × 20mm</Text>
            <Text style={styles.helpText}>• W = 3cm　（定数を保存）</Text>
            <Text style={styles.helpText}>• W × H　（保存した定数を使用）</Text>
            <Text style={styles.helpText}>• 0.125 → 表示単位で % または ppm を選択</Text>
            <Text style={styles.helpText}>• 単位入力では、次元を選択して候補を絞り込み</Text>
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

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  content: { gap: 14, paddingBottom: 28, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  title: { color: colors.foreground, fontSize: 29, fontWeight: "700", letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 3 },
  helpButton: { alignItems: "center", backgroundColor: colors.primarySurface, borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  samplesCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: 15 },
  samplesHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7 },
  sampleCategoryRail: { gap: 7, paddingBottom: 2, paddingTop: 12 },
  sampleCategoryChip: { backgroundColor: colors.surfaceSecondary, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 7 },
  sampleCategoryChipActive: { backgroundColor: colors.primaryFill },
  sampleCategoryText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  sampleCategoryTextActive: { color: colors.onPrimary },
  sampleList: { gap: 7, marginTop: 11 },
  sampleRow: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderRadius: 11, borderWidth: 1, flexDirection: "row", paddingHorizontal: 11, paddingVertical: 10 },
  sampleCopy: { flex: 1, marginRight: 10 },
  sampleTitle: { color: colors.foreground, fontSize: 13, fontWeight: "800" },
  sampleDescription: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  sampleExpressionWrap: { alignItems: "flex-end", maxWidth: "48%" },
  sampleExpression: { color: colors.primary, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, fontWeight: "700" },
  sampleTarget: { color: colors.muted, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 11, marginTop: 2 },
  inputCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: 15 },
  inputLabelRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  syntaxHint: { color: colors.placeholder, fontSize: 11 },
  expressionInput: { color: colors.foreground, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 20, fontWeight: "600", minHeight: 57, paddingHorizontal: 0 },
  inputFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  definitionHint: { color: colors.placeholder, fontSize: 11 },
  calculateButton: { backgroundColor: colors.primaryFill, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9 },
  calculateText: { color: colors.onPrimary, fontSize: 14, fontWeight: "700" },
  resultCard: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 18, borderWidth: 1, padding: 16 },
  resultHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  copyButton: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 9, flexDirection: "row", gap: 5, minHeight: 32, paddingHorizontal: 9 },
  copyButtonText: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  resultValue: { color: colors.primaryStrong, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 30, fontWeight: "700", marginTop: 9, minHeight: 40 },
  emptyResult: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 12 },
  divider: { backgroundColor: colors.primaryBorder, height: StyleSheet.hairlineWidth, marginVertical: 13 },
  siRow: { flexDirection: "row", justifyContent: "space-between" },
  siLabel: { color: colors.muted, fontSize: 12 },
  siValue: { color: colors.foreground, flexShrink: 1, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 13, fontWeight: "600", textAlign: "right" },
  dimensionBadge: { alignSelf: "flex-start", backgroundColor: colors.surface, borderRadius: 8, flexDirection: "row", gap: 6, marginTop: 12, paddingHorizontal: 8, paddingVertical: 5 },
  dimensionLabel: { color: colors.muted, fontSize: 11 },
  dimensionText: { color: colors.foreground, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 11, fontWeight: "700" },
  errorText: { color: colors.error, fontSize: 12, lineHeight: 18, marginTop: 11 },
  convertCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: 15 },
  unitInput: { borderBottomColor: colors.border, borderBottomWidth: 1, color: colors.foreground, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 17, marginTop: 8, minHeight: 40, paddingHorizontal: 0 },
  unitGroupList: { gap: 11, marginTop: 12 },
  compatibleHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 10 },
  compatibleGroup: { gap: 3 },
  unitGroupLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 5 },
  unitChoice: { alignItems: "center", flexDirection: "row", gap: 3 },
  unitInfoButton: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 13, borderWidth: 1, height: 26, justifyContent: "center", width: 26 },
  chip: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.primaryFill },
  chipText: { color: colors.muted, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: colors.onPrimary },
  unitPadCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: 15 },
  unitPadHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7 },
  unitSearchWrap: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", marginTop: 13, minHeight: 45, paddingHorizontal: 12 },
  unitSearchInput: { color: colors.foreground, flex: 1, fontSize: 14, marginLeft: 8, paddingVertical: 9 },
  searchResults: { backgroundColor: colors.background, borderColor: colors.primaryBorder, borderRadius: 12, borderWidth: 1, gap: 2, marginTop: 8, padding: 5 },
  searchResult: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 38, paddingHorizontal: 9 },
  searchResultButton: { alignItems: "center", flex: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 38 },
  searchUnit: { color: colors.primary, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 14, fontWeight: "800" },
  searchGroup: { color: colors.muted, fontSize: 12 },
  categoryRail: { gap: 7, paddingBottom: 2, paddingTop: 12 },
  categoryChip: { backgroundColor: colors.surfaceSecondary, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 7 },
  categoryChipActive: { backgroundColor: colors.primaryFill },
  categoryChipText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  categoryChipTextActive: { color: colors.onPrimary },
  inputUnitRow: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 11 },
  selectedGroupLabel: { color: colors.foreground, fontSize: 13, fontWeight: "800" },
  inputUnitChip: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 7 },
  inputUnitText: { color: colors.primary, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 13, fontWeight: "800" },
  favoriteUnitsCard: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder, borderRadius: 18, borderWidth: 1, padding: 15 },
  favoriteHeader: { alignItems: "center", flexDirection: "row", gap: 7 },
  proTag: { backgroundColor: colors.warning, borderRadius: 7, color: colors.onPrimary, fontSize: 10, fontWeight: "800", overflow: "hidden", paddingHorizontal: 6, paddingVertical: 3 },
  motionCard: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 18, borderWidth: 1, padding: 15 },
  motionFormula: { color: colors.foreground, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, fontWeight: "700", lineHeight: 19, marginTop: 8 },
  motionExamples: { gap: 8, marginTop: 12 },
  motionButton: { backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  motionButtonTitle: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  motionButtonExample: { color: colors.muted, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, marginTop: 3 },
  motionHint: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 11 },
  messageError: { backgroundColor: colors.errorSurface, borderColor: colors.errorBorder, borderRadius: 10, borderWidth: 1, padding: 11 },
  messageErrorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  messageSuccess: { backgroundColor: colors.successSurface, borderColor: colors.successBorder, borderRadius: 10, borderWidth: 1, padding: 11 },
  messageSuccessText: { color: colors.success, fontSize: 13, lineHeight: 19 },
  keypad: { gap: 8, flexDirection: "row", flexWrap: "wrap" },
  key: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, height: 48, justifyContent: "center", width: "23.4%" },
  keyBlank: { backgroundColor: "transparent", borderWidth: 0 },
  keyOperator: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder },
  keyAction: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  keyText: { color: colors.foreground, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 19, fontWeight: "600" },
  keyTextAccent: { color: colors.primary },
  keyPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  iconPressed: { opacity: 0.55 },
  cardPressed: { opacity: 0.7 },
  history: { marginTop: 6 },
  historyHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  historyTitle: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  historyLimit: { color: colors.placeholder, fontSize: 10, marginTop: 2 },
  historyActions: { alignItems: "center", flexDirection: "row", gap: 10 },
  exportHistoryButton: { alignItems: "center", flexDirection: "row", gap: 3, paddingHorizontal: 4, paddingVertical: 4 },
  exportHistoryText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  clearHistoryButton: { paddingHorizontal: 4, paddingVertical: 4 },
  clearHistoryText: { color: colors.error, fontSize: 11, fontWeight: "700" },
  historyRow: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 11, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginBottom: 6, paddingHorizontal: 12, paddingVertical: 10 },
  historyExpression: { color: colors.foreground, flex: 1, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, marginRight: 10 },
  historyResult: { color: colors.primary, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, fontWeight: "700", maxWidth: "45%" },
  helpBackdrop: { alignItems: "center", backgroundColor: colors.overlay, flex: 1, justifyContent: "center", padding: 24 },
  helpSheet: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, width: "100%" },
  helpTitleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  helpTitle: { color: colors.foreground, fontSize: 20, fontWeight: "700" },
  closeHelp: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 16, height: 32, justifyContent: "center", width: 32 },
  helpText: { color: colors.foreground, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 13, lineHeight: 25 },
  helpDone: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 11, marginTop: 18, paddingVertical: 12 },
  helpDoneText: { color: colors.onPrimary, fontWeight: "700" },
  unitInfoBackdrop: { alignItems: "center", backgroundColor: colors.overlay, flex: 1, justifyContent: "center", padding: 24 },
  unitInfoSheet: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, maxWidth: 520, padding: 20, width: "100%" },
  unitInfoHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  unitInfoSymbol: { color: colors.primary, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 26, fontWeight: "800" },
  unitInfoTitle: { color: colors.foreground, fontSize: 18, fontWeight: "800", marginTop: 2 },
  unitInfoSummary: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 13 },
  unitInfoFact: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 11, borderWidth: 1, marginTop: 14, padding: 12 },
  unitInfoFactLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  unitInfoFactValue: { color: colors.foreground, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 14, fontWeight: "700", marginTop: 4 },
  unitInfoUsage: { color: colors.foreground, fontSize: 13, lineHeight: 19, marginTop: 4 },
  unitInfoDone: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 11, marginTop: 18, paddingVertical: 12 },
  unitInfoDoneText: { color: colors.onPrimary, fontWeight: "700" },
});
