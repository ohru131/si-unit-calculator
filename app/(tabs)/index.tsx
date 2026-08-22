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
import { evaluateExpression, formatDimension, formatQuantity, parseConstantDefinition, Quantity } from "@/lib/units";

type HistoryEntry = { expression: string; result: string };

const KEYS = ["(", ")", "÷", "⌫", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", ".", "0", " ", "="];

export default function CalculatorScreen() {
  const { constants, upsertConstant } = useCalculatorStore();
  const [expression, setExpression] = useState("5cm + 1mm");
  const [targetUnit, setTargetUnit] = useState("cm");
  const [result, setResult] = useState<Quantity | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const display = useMemo(() => {
    if (!result) return null;
    try {
      return { value: formatQuantity(result, targetUnit), si: formatQuantity(result), dimension: formatDimension(result.dimension), error: "" };
    } catch (cause) {
      return { value: "—", si: formatQuantity(result), dimension: formatDimension(result.dimension), error: cause instanceof Error ? cause.message : "変換できません。" };
    }
  }, [result, targetUnit]);

  const calculate = async () => {
    const input = expression.trim();
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
      const output = targetUnit.trim() ? formatQuantity(quantity, targetUnit) : formatQuantity(quantity);
      setHistory((previous) => [{ expression: input, result: output }, ...previous.filter((item) => item.expression !== input)].slice(0, 5));
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
            placeholder="例：cm、m/s、%、ppm"
            placeholderTextColor="#91A0AD"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.unitInput}
          />
          <View style={styles.chips}>
            {["m", "cm", "mm", "m²", "cm²", "%", "ppm"].map((unit) => (
              <Pressable key={unit} onPress={() => applyTargetUnit(unit)} style={({ pressed }) => [styles.chip, targetUnit === unit && styles.chipActive, pressed && styles.pressed]}>
                <Text style={[styles.chipText, targetUnit === unit && styles.chipTextActive]}>{unit}</Text>
              </Pressable>
            ))}
          </View>
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
            <Text style={styles.historyTitle}>このセッションの履歴</Text>
            {history.map((entry) => (
              <Pressable key={`${entry.expression}-${entry.result}`} onPress={() => setExpression(entry.expression)} style={({ pressed }) => [styles.historyRow, pressed && styles.cardPressed]}>
                <Text numberOfLines={1} style={styles.historyExpression}>{entry.expression}</Text>
                <Text numberOfLines={1} style={styles.historyResult}>{entry.result}</Text>
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
            <Text style={styles.helpText}>• 0.125 → 表示単位を % または ppm に変更</Text>
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 },
  chip: { backgroundColor: "#F2F5F7", borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6 },
  chipActive: { backgroundColor: "#146C94" },
  chipText: { color: "#52606D", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#FFFFFF" },
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
  historyTitle: { color: "#637381", fontSize: 12, fontWeight: "700", marginBottom: 7 },
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
