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
import { useCalculatorStore } from "@/lib/calculator-store";
import { exportCalculationHistory } from "@/lib/calculation-export";
import { useGlobalSettings } from "@/lib/global-settings";
import { getCalculatorQuickShortcut } from "@/lib/quick-shortcuts";
import { usePro } from "@/lib/revenuecat-provider";
import { SAMPLE_CALCULATIONS, SAMPLE_CATEGORIES, type SampleCalculation } from "@/lib/sample-calculations";
import { evaluateExpression, formatDimension, formatQuantity, getCompatibleUnitGroups, getRegionalUnits, parseConstantDefinition, Quantity, searchUnitOptions, UNIT_GROUPS } from "@/lib/units";

const KEYS = ["(", ")", "÷", "⌫", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", ".", "0", " ", "="];

export default function CalculatorScreen() {
  const router = useRouter();
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
  const [unitSearch, setUnitSearch] = useState("");
  const unitSearchRef = useRef<TextInput>(null);

  const selectedInputGroup = UNIT_GROUPS.find((group) => group.id === inputGroupId) ?? UNIT_GROUPS[0];
  const selectedInputUnits = useMemo(() => getRegionalUnits(selectedInputGroup, unitSystem), [selectedInputGroup, unitSystem]);
  const searchedUnits = useMemo(() => searchUnitOptions(unitSearch, unitSystem), [unitSearch, unitSystem]);
  const compatibleUnitGroups = useMemo(() => (result ? getCompatibleUnitGroups(result.dimension) : []), [result]);
  const visibleSamples = useMemo(() => SAMPLE_CALCULATIONS.filter((sample) => sample.category === sampleCategory), [sampleCategory]);
  const visibleHistory = isPro ? history : history.slice(0, 5);

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
    definitionHint: "Define a constant: W = 3cm", calculate: "Calculate", siBase: "SI base unit", emptyResult: "Enter an expression, then tap Calculate.", unitPlaceholder: "Choose a compatible unit or enter one", selectAfter: "Compatible units appear here after calculation.", speedTitle: "Distance, time & speed", speedFormula: "Speed = distance ÷ time     Distance = speed × time", findSpeed: "Find speed", findDistance: "Find distance", findTime: "Find time", speedHint: "Mix s, min, h, m, km, and other compatible units freely.", savedHistory: "Saved calculations", clear: "Clear", helpTitle: "Examples", helpDone: "Done", unitSearch: "Search units or categories", copied: "Calculation copied", copy: "Copy",
  } : {
    definitionHint: "定数定義：W = 3cm", calculate: "計算", siBase: "SI標準単位", emptyResult: "式を入力して「計算」を押してください。", unitPlaceholder: "候補から選択、または入力", selectAfter: "計算後、次元に合う単位のみをここへ表示します。", speedTitle: "距離・時間・速度", speedFormula: "速度 ＝ 距離 ÷ 時間　　距離 ＝ 速度 × 時間", findSpeed: "速度を求める", findDistance: "距離を求める", findTime: "時間を求める", speedHint: "時間は s、min、h、距離は m、km などを自由に組み合わせられます。", savedHistory: "保存済みの計算履歴", clear: "消去", helpTitle: "入力例", helpDone: "閉じる", unitSearch: "単位・カテゴリを検索", copied: "計算結果をコピーしました", copy: "コピー",
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
            <IconSymbol name="questionmark.circle.fill" size={25} color="#146C94" />
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
            placeholderTextColor="#91A0AD"
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
          <View style={styles.resultHeader}><Text style={styles.cardLabel}>{t("result")}</Text>{display ? <Pressable accessibilityLabel={copy.copy} onPress={() => void copyCalculation()} style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}><IconSymbol name="doc.on.doc" size={16} color="#146C94" /><Text style={styles.copyButtonText}>{copy.copy}</Text></Pressable> : null}</View>
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
            placeholderTextColor="#91A0AD"
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
                    {getRegionalUnits(group, unitSystem).map((unit) => (
                      <Pressable key={unit.symbol} onPress={() => applyTargetUnit(unit.symbol)} style={({ pressed }) => [styles.chip, targetUnit === unit.symbol && styles.chipActive, pressed && styles.pressed]}>
                        <Text style={[styles.chipText, targetUnit === unit.symbol && styles.chipTextActive]}>{unit.label}</Text>
                      </Pressable>
                    ))}
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
            <IconSymbol name="magnifyingglass" size={18} color="#6D8795" />
            <TextInput ref={unitSearchRef} value={unitSearch} onChangeText={setUnitSearch} placeholder={copy.unitSearch} placeholderTextColor="#8A99A6" autoCapitalize="none" autoCorrect={false} style={styles.unitSearchInput} />
          </View>
          {searchedUnits.length ? <View style={styles.searchResults}>{searchedUnits.map(({ group, unit }) => <Pressable key={`${group.id}-${unit.symbol}`} onPress={() => { insertUnit(unit.symbol); setUnitSearch(""); }} style={({ pressed }) => [styles.searchResult, pressed && styles.pressed]}><Text style={styles.searchUnit}>{unit.symbol}</Text><Text style={styles.searchGroup}>{unitGroupLabel(group.id)}</Text></Pressable>)}</View> : null}
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
              {selectedInputUnits.map((unit) => (
                <Pressable key={unit.symbol} onPress={() => insertUnit(unit.symbol)} style={({ pressed }) => [styles.inputUnitChip, pressed && styles.pressed]}>
                  <Text style={styles.inputUnitText}>{unit.label}</Text>
                </Pressable>
              ))}
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
                {key === "⌫" ? <IconSymbol name="delete.left" size={22} color="#52606D" /> : <Text style={[styles.keyText, (isAction || isOperator) && styles.keyTextAccent]}>{key}</Text>}
              </Pressable>
            );
          })}
        </View>

        {history.length ? (
          <View style={styles.history}>
            <View style={styles.historyHeader}>
              <View><Text style={styles.historyTitle}>{copy.savedHistory}</Text>{!isPro && history.length > 5 ? <Text style={styles.historyLimit}>{language === "en" ? "Free shows the latest 5 entries" : "無料版では最新5件を表示"}</Text> : null}</View>
              <View style={styles.historyActions}>
                <Pressable onPress={() => void exportHistory()} style={({ pressed }) => [styles.exportHistoryButton, pressed && styles.pressed]}><IconSymbol name="square.and.arrow.up" size={15} color="#146C94" /><Text style={styles.exportHistoryText}>CSV</Text></Pressable>
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
                <IconSymbol name="xmark" size={20} color="#52606D" />
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 28, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  title: { color: "#17212B", fontSize: 29, fontWeight: "700", letterSpacing: -0.7 },
  subtitle: { color: "#637381", fontSize: 13, marginTop: 3 },
  helpButton: { alignItems: "center", backgroundColor: "#E5F4FB", borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  samplesCard: { backgroundColor: "#FFFFFF", borderColor: "#DCE5EA", borderRadius: 18, borderWidth: 1, padding: 15 },
  samplesHint: { color: "#637381", fontSize: 12, lineHeight: 18, marginTop: 7 },
  sampleCategoryRail: { gap: 7, paddingBottom: 2, paddingTop: 12 },
  sampleCategoryChip: { backgroundColor: "#F2F5F7", borderRadius: 15, paddingHorizontal: 12, paddingVertical: 7 },
  sampleCategoryChipActive: { backgroundColor: "#146C94" },
  sampleCategoryText: { color: "#52606D", fontSize: 12, fontWeight: "700" },
  sampleCategoryTextActive: { color: "#FFFFFF" },
  sampleList: { gap: 7, marginTop: 11 },
  sampleRow: { alignItems: "center", backgroundColor: "#F7FAFC", borderColor: "#E1EAF0", borderRadius: 11, borderWidth: 1, flexDirection: "row", paddingHorizontal: 11, paddingVertical: 10 },
  sampleCopy: { flex: 1, marginRight: 10 },
  sampleTitle: { color: "#173A4D", fontSize: 13, fontWeight: "800" },
  sampleDescription: { color: "#637381", fontSize: 11, lineHeight: 16, marginTop: 2 },
  sampleExpressionWrap: { alignItems: "flex-end", maxWidth: "48%" },
  sampleExpression: { color: "#146C94", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, fontWeight: "700" },
  sampleTarget: { color: "#637381", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 11, marginTop: 2 },
  inputCard: { backgroundColor: "#FFFFFF", borderColor: "#DCE5EA", borderRadius: 18, borderWidth: 1, padding: 15 },
  inputLabelRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { color: "#415160", fontSize: 12, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  syntaxHint: { color: "#8493A0", fontSize: 11 },
  expressionInput: { color: "#17212B", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 20, fontWeight: "600", minHeight: 57, paddingHorizontal: 0 },
  inputFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  definitionHint: { color: "#8493A0", fontSize: 11 },
  calculateButton: { backgroundColor: "#146C94", borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9 },
  calculateText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  resultCard: { backgroundColor: "#E5F4FB", borderColor: "#C9E7F4", borderRadius: 18, borderWidth: 1, padding: 16 },
  resultHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  copyButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 9, flexDirection: "row", gap: 5, minHeight: 32, paddingHorizontal: 9 },
  copyButtonText: { color: "#146C94", fontSize: 12, fontWeight: "800" },
  resultValue: { color: "#0E4964", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 30, fontWeight: "700", marginTop: 9, minHeight: 40 },
  emptyResult: { color: "#637381", fontSize: 14, lineHeight: 21, marginTop: 12 },
  divider: { backgroundColor: "#BBDDEB", height: StyleSheet.hairlineWidth, marginVertical: 13 },
  siRow: { flexDirection: "row", justifyContent: "space-between" },
  siLabel: { color: "#557384", fontSize: 12 },
  siValue: { color: "#173A4D", flexShrink: 1, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 13, fontWeight: "600", textAlign: "right" },
  dimensionBadge: { alignSelf: "flex-start", backgroundColor: "#FFFFFF", borderRadius: 8, flexDirection: "row", gap: 6, marginTop: 12, paddingHorizontal: 8, paddingVertical: 5 },
  dimensionLabel: { color: "#637381", fontSize: 11 },
  dimensionText: { color: "#173A4D", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 11, fontWeight: "700" },
  errorText: { color: "#A53B35", fontSize: 12, lineHeight: 18, marginTop: 11 },
  convertCard: { backgroundColor: "#FFFFFF", borderColor: "#DCE5EA", borderRadius: 18, borderWidth: 1, padding: 15 },
  unitInput: { borderBottomColor: "#D5E0E6", borderBottomWidth: 1, color: "#17212B", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 17, marginTop: 8, minHeight: 40, paddingHorizontal: 0 },
  unitGroupList: { gap: 11, marginTop: 12 },
  compatibleHint: { color: "#637381", fontSize: 11, lineHeight: 16, marginTop: 10 },
  compatibleGroup: { gap: 3 },
  unitGroupLabel: { color: "#637381", fontSize: 11, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 5 },
  chip: { backgroundColor: "#F2F5F7", borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6 },
  chipActive: { backgroundColor: "#146C94" },
  chipText: { color: "#52606D", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#FFFFFF" },
  unitPadCard: { backgroundColor: "#FFFFFF", borderColor: "#DCE5EA", borderRadius: 18, borderWidth: 1, padding: 15 },
  unitPadHint: { color: "#637381", fontSize: 12, lineHeight: 18, marginTop: 7 },
  unitSearchWrap: { alignItems: "center", backgroundColor: "#F5F8FA", borderColor: "#D5E2E9", borderRadius: 12, borderWidth: 1, flexDirection: "row", marginTop: 13, minHeight: 45, paddingHorizontal: 12 },
  unitSearchInput: { color: "#17212B", flex: 1, fontSize: 14, marginLeft: 8, paddingVertical: 9 },
  searchResults: { backgroundColor: "#F8FCFE", borderColor: "#D9EAF1", borderRadius: 12, borderWidth: 1, gap: 2, marginTop: 8, padding: 5 },
  searchResult: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 38, paddingHorizontal: 9 },
  searchUnit: { color: "#146C94", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 14, fontWeight: "800" },
  searchGroup: { color: "#637381", fontSize: 12 },
  categoryRail: { gap: 7, paddingBottom: 2, paddingTop: 12 },
  categoryChip: { backgroundColor: "#F2F5F7", borderRadius: 15, paddingHorizontal: 12, paddingVertical: 7 },
  categoryChipActive: { backgroundColor: "#0E4964" },
  categoryChipText: { color: "#52606D", fontSize: 12, fontWeight: "700" },
  categoryChipTextActive: { color: "#FFFFFF" },
  inputUnitRow: { borderTopColor: "#E4EAEE", borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 11 },
  selectedGroupLabel: { color: "#173A4D", fontSize: 13, fontWeight: "800" },
  inputUnitChip: { backgroundColor: "#E5F4FB", borderColor: "#C9E7F4", borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 7 },
  inputUnitText: { color: "#146C94", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 13, fontWeight: "800" },
  favoriteUnitsCard: { backgroundColor: "#FFF9E9", borderColor: "#F0DB9C", borderRadius: 18, borderWidth: 1, padding: 15 },
  favoriteHeader: { alignItems: "center", flexDirection: "row", gap: 7 },
  proTag: { backgroundColor: "#E0A12C", borderRadius: 7, color: "#FFFFFF", fontSize: 10, fontWeight: "800", overflow: "hidden", paddingHorizontal: 6, paddingVertical: 3 },
  motionCard: { backgroundColor: "#F3F8FB", borderColor: "#D1E7F1", borderRadius: 18, borderWidth: 1, padding: 15 },
  motionFormula: { color: "#173A4D", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, fontWeight: "700", lineHeight: 19, marginTop: 8 },
  motionExamples: { gap: 8, marginTop: 12 },
  motionButton: { backgroundColor: "#FFFFFF", borderColor: "#D5E7EF", borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  motionButtonTitle: { color: "#146C94", fontSize: 13, fontWeight: "800" },
  motionButtonExample: { color: "#52606D", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, marginTop: 3 },
  motionHint: { color: "#637381", fontSize: 11, lineHeight: 17, marginTop: 11 },
  messageError: { backgroundColor: "#FDECEB", borderColor: "#F5CBC7", borderRadius: 10, borderWidth: 1, padding: 11 },
  messageErrorText: { color: "#A53B35", fontSize: 13, lineHeight: 19 },
  messageSuccess: { backgroundColor: "#E8F6ED", borderColor: "#CBE9D6", borderRadius: 10, borderWidth: 1, padding: 11 },
  messageSuccessText: { color: "#1D7042", fontSize: 13, lineHeight: 19 },
  keypad: { gap: 8, flexDirection: "row", flexWrap: "wrap" },
  key: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#DCE5EA", borderRadius: 12, borderWidth: 1, height: 48, justifyContent: "center", width: "23.4%" },
  keyBlank: { backgroundColor: "transparent", borderWidth: 0 },
  keyOperator: { backgroundColor: "#EEF7FB", borderColor: "#C8E5F1" },
  keyAction: { backgroundColor: "#146C94", borderColor: "#146C94" },
  keyText: { color: "#334453", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 19, fontWeight: "600" },
  keyTextAccent: { color: "#146C94" },
  keyPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  cardPressed: { opacity: 0.7 },
  history: { marginTop: 6 },
  historyHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  historyTitle: { color: "#637381", fontSize: 12, fontWeight: "700" },
  historyLimit: { color: "#8A99A6", fontSize: 10, marginTop: 2 },
  historyActions: { alignItems: "center", flexDirection: "row", gap: 10 },
  exportHistoryButton: { alignItems: "center", flexDirection: "row", gap: 3, paddingHorizontal: 4, paddingVertical: 4 },
  exportHistoryText: { color: "#146C94", fontSize: 11, fontWeight: "700" },
  clearHistoryButton: { paddingHorizontal: 4, paddingVertical: 4 },
  clearHistoryText: { color: "#A53B35", fontSize: 11, fontWeight: "700" },
  historyRow: { backgroundColor: "#FFFFFF", borderColor: "#E0E6EB", borderRadius: 11, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginBottom: 6, paddingHorizontal: 12, paddingVertical: 10 },
  historyExpression: { color: "#415160", flex: 1, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, marginRight: 10 },
  historyResult: { color: "#146C94", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, fontWeight: "700", maxWidth: "45%" },
  helpBackdrop: { alignItems: "center", backgroundColor: "rgba(23, 33, 43, 0.32)", flex: 1, justifyContent: "center", padding: 24 },
  helpSheet: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, width: "100%" },
  helpTitleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  helpTitle: { color: "#17212B", fontSize: 20, fontWeight: "700" },
  closeHelp: { alignItems: "center", backgroundColor: "#E8EDF1", borderRadius: 16, height: 32, justifyContent: "center", width: 32 },
  helpText: { color: "#415160", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 13, lineHeight: 25 },
  helpDone: { alignItems: "center", backgroundColor: "#146C94", borderRadius: 11, marginTop: 18, paddingVertical: 12 },
  helpDoneText: { color: "#FFFFFF", fontWeight: "700" },
});
