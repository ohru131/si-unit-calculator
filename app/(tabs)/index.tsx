import { useMemo, useState } from "react";
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
import { SAMPLE_CALCULATIONS, SAMPLE_CATEGORIES, type SampleCalculation } from "@/lib/sample-calculations";
import { evaluateExpression, formatDimension, formatQuantity, getCompatibleUnitGroups, parseConstantDefinition, Quantity, UNIT_GROUPS } from "@/lib/units";

const KEYS = ["(", ")", "÷", "⌫", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", ".", "0", " ", "="];

export default function CalculatorScreen() {
  const { constants, history, upsertConstant, addHistoryEntry, clearHistory } = useCalculatorStore();
  const [expression, setExpression] = useState("5cm + 1mm");
  const [targetUnit, setTargetUnit] = useState("cm");
  const [result, setResult] = useState<Quantity | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inputGroupId, setInputGroupId] = useState("length");
  const [sampleCategory, setSampleCategory] = useState("basic");
  const [showHelp, setShowHelp] = useState(false);

  const selectedInputGroup = UNIT_GROUPS.find((group) => group.id === inputGroupId) ?? UNIT_GROUPS[0];
  const compatibleUnitGroups = useMemo(() => (result ? getCompatibleUnitGroups(result.dimension) : []), [result]);
  const visibleSamples = useMemo(() => SAMPLE_CALCULATIONS.filter((sample) => sample.category === sampleCategory), [sampleCategory]);

  const display = useMemo(() => {
    if (!result) return null;
    try {
      return { value: formatQuantity(result, targetUnit), si: formatQuantity(result), dimension: formatDimension(result.dimension), error: "" };
    } catch (cause) {
      return { value: "—", si: formatQuantity(result), dimension: formatDimension(result.dimension), error: cause instanceof Error ? cause.message : "変換できません。" };
    }
  }, [result, targetUnit]);

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
        output = selectedTargetUnit.trim() ? formatQuantity(quantity, selectedTargetUnit) : output;
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

  const applySample = (sample: SampleCalculation) => {
    setExpression(sample.expression);
    setTargetUnit(sample.targetUnit);
    setResult(null);
    setError("");
    setNotice("");
    void calculate(sample.expression, sample.targetUnit);
  };

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>単位付き電卓</Text>
            <Text style={styles.subtitle}>すべてSI標準単位で正しく計算</Text>
          </View>
          <Pressable accessibilityLabel="入力例を表示" onPress={() => setShowHelp(true)} style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}>
            <IconSymbol name="questionmark.circle.fill" size={25} color="#146C94" />
          </Pressable>
        </View>

        <View style={styles.samplesCard}>
          <Text style={styles.cardLabel}>サンプルから始める</Text>
          <Text style={styles.samplesHint}>気になる例を選ぶと、式・表示単位・計算結果をまとめて設定します。</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleCategoryRail}>
            {SAMPLE_CATEGORIES.map((category) => (
              <Pressable key={category.id} onPress={() => setSampleCategory(category.id)} style={({ pressed }) => [styles.sampleCategoryChip, sampleCategory === category.id && styles.sampleCategoryChipActive, pressed && styles.pressed]}>
                <Text style={[styles.sampleCategoryText, sampleCategory === category.id && styles.sampleCategoryTextActive]}>{category.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.sampleList}>
            {visibleSamples.map((sample) => (
              <Pressable key={sample.id} onPress={() => applySample(sample)} style={({ pressed }) => [styles.sampleRow, pressed && styles.cardPressed]}>
                <View style={styles.sampleCopy}>
                  <Text style={styles.sampleTitle}>{sample.title}</Text>
                  <Text style={styles.sampleDescription}>{sample.description}</Text>
                </View>
                <View style={styles.sampleExpressionWrap}>
                  <Text numberOfLines={1} style={styles.sampleExpression}>{sample.expression}</Text>
                  <Text style={styles.sampleTarget}>→ {sample.targetUnit}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.cardLabel}>式</Text>
            <Text style={styles.syntaxHint}>×・÷・括弧・定数に対応</Text>
          </View>
          <TextInput
            value={expression}
            onChangeText={(text) => {
              setExpression(text);
              setError("");
              setNotice("");
            }}
            onSubmitEditing={() => void calculate()}
            placeholder="例：5cm + 1mm"
            placeholderTextColor="#91A0AD"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            style={styles.expressionInput}
          />
          <View style={styles.inputFooter}>
            <Text style={styles.definitionHint}>定数定義：W = 3cm</Text>
            <Pressable onPress={() => void calculate()} style={({ pressed }) => [styles.calculateButton, pressed && styles.pressed]}>
              <Text style={styles.calculateText}>計算</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.cardLabel}>結果</Text>
          {display ? (
            <>
              <Text numberOfLines={2} adjustsFontSizeToFit style={styles.resultValue}>{display.value}</Text>
              <View style={styles.divider} />
              <View style={styles.siRow}>
                <Text style={styles.siLabel}>SI標準単位</Text>
                <Text selectable style={styles.siValue}>{display.si}</Text>
              </View>
              <View style={styles.dimensionBadge}>
                <Text style={styles.dimensionLabel}>次元</Text>
                <Text style={styles.dimensionText}>{display.dimension}</Text>
              </View>
              {display.error ? <Text style={styles.errorText}>{display.error}</Text> : null}
            </>
          ) : (
            <Text style={styles.emptyResult}>式を入力して「計算」を押してください。</Text>
          )}
        </View>

        <View style={styles.convertCard}>
          <Text style={styles.cardLabel}>表示単位</Text>
          <TextInput
            value={targetUnit}
            onChangeText={applyTargetUnit}
            placeholder="候補から選択、または入力"
            placeholderTextColor="#91A0AD"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.unitInput}
          />
          {compatibleUnitGroups.length ? (
            <View style={styles.unitGroupList}>
              <Text style={styles.compatibleHint}>計算結果と同じ次元の単位のみ</Text>
              {compatibleUnitGroups.map((group) => (
                <View key={group.id} style={styles.compatibleGroup}>
                  <Text style={styles.unitGroupLabel}>{group.label}</Text>
                  <View style={styles.chips}>
                    {group.units.map((unit) => (
                      <Pressable key={unit.symbol} onPress={() => applyTargetUnit(unit.symbol)} style={({ pressed }) => [styles.chip, targetUnit === unit.symbol && styles.chipActive, pressed && styles.pressed]}>
                        <Text style={[styles.chipText, targetUnit === unit.symbol && styles.chipTextActive]}>{unit.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.compatibleHint}>計算後、次元に合う単位のみをここへ表示します。</Text>
          )}
        </View>

        <View style={styles.unitPadCard}>
          <Text style={styles.cardLabel}>単位を式に入力</Text>
          <Text style={styles.unitPadHint}>次元を選択してから、使いたい単位をタップします。</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
            {UNIT_GROUPS.map((group) => (
              <Pressable key={group.id} onPress={() => setInputGroupId(group.id)} style={({ pressed }) => [styles.categoryChip, inputGroupId === group.id && styles.categoryChipActive, pressed && styles.pressed]}>
                <Text style={[styles.categoryChipText, inputGroupId === group.id && styles.categoryChipTextActive]}>{group.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.inputUnitRow}>
            <Text style={styles.selectedGroupLabel}>{selectedInputGroup.label}</Text>
            <View style={styles.chips}>
              {selectedInputGroup.units.map((unit) => (
                <Pressable key={unit.symbol} onPress={() => insertUnit(unit.symbol)} style={({ pressed }) => [styles.inputUnitChip, pressed && styles.pressed]}>
                  <Text style={styles.inputUnitText}>{unit.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.motionCard}>
          <Text style={styles.cardLabel}>距離・時間・速度</Text>
          <Text style={styles.motionFormula}>速度 ＝ 距離 ÷ 時間　　距離 ＝ 速度 × 時間</Text>
          <View style={styles.motionExamples}>
            <Pressable onPress={() => applyMotionExample("1km ÷ 1min", "km/h", "距離と時間から速度を計算する例を入力しました。")} style={({ pressed }) => [styles.motionButton, pressed && styles.pressed]}>
              <Text style={styles.motionButtonTitle}>速度を求める</Text>
              <Text style={styles.motionButtonExample}>1km ÷ 1min</Text>
            </Pressable>
            <Pressable onPress={() => applyMotionExample("10m/s × 2min", "km", "速度と時間から距離を計算する例を入力しました。")} style={({ pressed }) => [styles.motionButton, pressed && styles.pressed]}>
              <Text style={styles.motionButtonTitle}>距離を求める</Text>
              <Text style={styles.motionButtonExample}>10m/s × 2min</Text>
            </Pressable>
            <Pressable onPress={() => applyMotionExample("1km ÷ 5m/s", "min", "距離と速度から時間を計算する例を入力しました。")} style={({ pressed }) => [styles.motionButton, pressed && styles.pressed]}>
              <Text style={styles.motionButtonTitle}>時間を求める</Text>
              <Text style={styles.motionButtonExample}>1km ÷ 5m/s</Text>
            </Pressable>
          </View>
          <Text style={styles.motionHint}>時間は s、min、h、距離は m、km などを自由に組み合わせられます。</Text>
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
              <Text style={styles.historyTitle}>保存済みの計算履歴</Text>
              <Pressable onPress={() => void clearHistory()} style={({ pressed }) => [styles.clearHistoryButton, pressed && styles.pressed]}>
                <Text style={styles.clearHistoryText}>すべて消去</Text>
              </Pressable>
            </View>
            {history.map((entry) => (
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
              <Text style={styles.helpTitle}>入力例</Text>
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
              <Text style={styles.helpDoneText}>閉じる</Text>
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
  categoryRail: { gap: 7, paddingBottom: 2, paddingTop: 12 },
  categoryChip: { backgroundColor: "#F2F5F7", borderRadius: 15, paddingHorizontal: 12, paddingVertical: 7 },
  categoryChipActive: { backgroundColor: "#0E4964" },
  categoryChipText: { color: "#52606D", fontSize: 12, fontWeight: "700" },
  categoryChipTextActive: { color: "#FFFFFF" },
  inputUnitRow: { borderTopColor: "#E4EAEE", borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 11 },
  selectedGroupLabel: { color: "#173A4D", fontSize: 13, fontWeight: "800" },
  inputUnitChip: { backgroundColor: "#E5F4FB", borderColor: "#C9E7F4", borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 7 },
  inputUnitText: { color: "#146C94", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 13, fontWeight: "800" },
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
