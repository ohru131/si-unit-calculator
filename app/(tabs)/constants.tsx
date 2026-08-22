import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCalculatorStore } from "@/lib/calculator-store";
import { formatQuantity, SavedConstant } from "@/lib/units";

type EditorState = { symbol: string; expression: string; originalSymbol?: string } | null;

export default function ConstantsScreen() {
  const { constants, isLoading, upsertConstant, removeConstant } = useCalculatorStore();
  const [editor, setEditor] = useState<EditorState>(null);
  const [symbol, setSymbol] = useState("");
  const [expression, setExpression] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const openEditor = (item?: SavedConstant) => {
    setEditor(item ? { symbol: item.symbol, expression: item.expression, originalSymbol: item.symbol } : { symbol: "", expression: "" });
    setSymbol(item?.symbol ?? "");
    setExpression(item?.expression ?? "");
    setError("");
  };

  const closeEditor = () => {
    if (!isSaving) setEditor(null);
  };

  const save = async () => {
    const normalizedSymbol = symbol.trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(normalizedSymbol)) {
      setError("記号は英字または _ で始め、英数字と _ のみを使えます。");
      return;
    }
    if (!expression.trim()) {
      setError("定義する式を入力してください。");
      return;
    }
    setIsSaving(true);
    try {
      if (editor?.originalSymbol && editor.originalSymbol !== normalizedSymbol) {
        await removeConstant(editor.originalSymbol);
      }
      await upsertConstant(normalizedSymbol, expression);
      setEditor(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "定数を保存できませんでした。");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (item: SavedConstant) => {
    Alert.alert("定数を削除", `${item.symbol} = ${item.expression} を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => {
          removeConstant(item.symbol).catch(() => Alert.alert("エラー", "定数を削除できませんでした。"));
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>定数</Text>
          <Text style={styles.subtitle}>式で使う記号を端末内に保存します</Text>
        </View>
        <Pressable accessibilityLabel="定数を追加" onPress={() => openEditor()} style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}>
          <IconSymbol name="plus.circle.fill" size={28} color="#146C94" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#146C94" />
        </View>
      ) : (
        <FlatList
          data={constants}
          keyExtractor={(item) => item.symbol}
          contentContainerStyle={constants.length ? styles.list : styles.emptyList}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <IconSymbol name="bookmark.fill" size={30} color="#75A9C3" />
              <Text style={styles.emptyTitle}>定数はまだありません</Text>
              <Text style={styles.emptyText}>「＋」から W = 3cm のように定義できます。</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => openEditor(item)} style={({ pressed }) => [styles.constantCard, pressed && styles.cardPressed]}>
              <View style={styles.symbolBubble}>
                <Text style={styles.symbol}>{item.symbol}</Text>
              </View>
              <View style={styles.constantDetails}>
                <Text style={styles.expression}>{item.expression}</Text>
                <Text style={styles.siValue}>{formatQuantity(item.quantity)}</Text>
              </View>
              <Pressable accessibilityLabel={`${item.symbol}を削除`} hitSlop={10} onPress={() => confirmDelete(item)} style={({ pressed }) => [styles.deleteButton, pressed && styles.iconPressed]}>
                <IconSymbol name="trash" size={20} color="#A53B35" />
              </Pressable>
            </Pressable>
          )}
        />
      )}

      <Modal visible={Boolean(editor)} transparent animationType="slide" onRequestClose={closeEditor}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>{editor?.originalSymbol ? "定数を編集" : "定数を追加"}</Text>
                <Text style={styles.sheetDescription}>例：W = 3cm、H = 20mm</Text>
              </View>
              <Pressable accessibilityLabel="閉じる" onPress={closeEditor} style={({ pressed }) => [styles.closeButton, pressed && styles.iconPressed]}>
                <IconSymbol name="xmark" size={21} color="#52606D" />
              </Pressable>
            </View>
            <Text style={styles.fieldLabel}>記号</Text>
            <TextInput
              value={symbol}
              onChangeText={setSymbol}
              placeholder="W"
              placeholderTextColor="#8A99A6"
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>定義式</Text>
            <TextInput
              value={expression}
              onChangeText={setExpression}
              placeholder="3cm"
              placeholderTextColor="#8A99A6"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable disabled={isSaving} onPress={save} style={({ pressed }) => [styles.saveButton, (pressed || isSaving) && styles.buttonPressed]}>
              <Text style={styles.saveText}>{isSaving ? "保存中…" : "保存"}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingBottom: 18, paddingTop: 8 },
  title: { color: "#17212B", fontSize: 30, fontWeight: "700", letterSpacing: -0.6 },
  subtitle: { color: "#637381", fontSize: 13, marginTop: 3 },
  addButton: { alignItems: "center", backgroundColor: "#E5F4FB", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  list: { gap: 10, paddingBottom: 30 },
  emptyList: { flexGrow: 1, justifyContent: "center", paddingBottom: 96 },
  emptyCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E0E6EB", borderRadius: 20, borderWidth: 1, paddingHorizontal: 30, paddingVertical: 32 },
  emptyTitle: { color: "#17212B", fontSize: 17, fontWeight: "700", marginTop: 12 },
  emptyText: { color: "#637381", fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: "center" },
  constantCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E0E6EB", borderRadius: 16, borderWidth: 1, flexDirection: "row", minHeight: 76, paddingHorizontal: 13, paddingVertical: 12 },
  symbolBubble: { alignItems: "center", backgroundColor: "#E5F4FB", borderRadius: 10, height: 42, justifyContent: "center", width: 42 },
  symbol: { color: "#146C94", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 19, fontWeight: "700" },
  constantDetails: { flex: 1, marginLeft: 12 },
  expression: { color: "#17212B", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 16, fontWeight: "600" },
  siValue: { color: "#637381", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, marginTop: 4 },
  deleteButton: { alignItems: "center", height: 38, justifyContent: "center", width: 38 },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  cardPressed: { opacity: 0.74 },
  iconPressed: { opacity: 0.55 },
  modalBackdrop: { backgroundColor: "rgba(23, 33, 43, 0.28)", flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: "#F7F8FA", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: 36, paddingHorizontal: 22, paddingTop: 10 },
  sheetHandle: { alignSelf: "center", backgroundColor: "#C5CDD4", borderRadius: 3, height: 5, width: 42 },
  sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", paddingBottom: 20, paddingTop: 17 },
  sheetTitle: { color: "#17212B", fontSize: 21, fontWeight: "700" },
  sheetDescription: { color: "#637381", fontSize: 13, marginTop: 3 },
  closeButton: { alignItems: "center", backgroundColor: "#E8EDF1", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  fieldLabel: { color: "#415160", fontSize: 13, fontWeight: "700", marginBottom: 7, marginTop: 12 },
  input: { backgroundColor: "#FFFFFF", borderColor: "#D6DEE5", borderRadius: 12, borderWidth: 1, color: "#17212B", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 18, minHeight: 50, paddingHorizontal: 14 },
  error: { color: "#C53A31", fontSize: 13, lineHeight: 19, marginTop: 11 },
  saveButton: { alignItems: "center", backgroundColor: "#146C94", borderRadius: 13, marginTop: 22, minHeight: 52, justifyContent: "center" },
  saveText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});

