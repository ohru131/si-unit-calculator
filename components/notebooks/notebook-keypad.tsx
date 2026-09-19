import { memo, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { MathFunctionRail } from "@/components/ui/math-function-rail";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { NOTEBOOK_KEYPAD_ACCENT_LABELS, NOTEBOOK_KEYPAD_COLUMNS, NOTEBOOK_KEYPAD_KEYS } from "@/lib/notebook-keypad";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });
// 電卓の keyCell と同じ余白・同じ hitSlop。余白は外側の View に付くので、Pressable 自身の
// 矩形だけが当たり判定になり、隣のキーとの継ぎ目に指が落ちると何も起きない穴になる
// （電卓で実際に踏んだ。app/(tabs)/index.tsx の KEY_CELL_PADDING の説明を参照）。
const KEY_CELL_PADDING = 3;
const KEY_HEIGHT = 38;

type Props = {
  /** 今どの欄を編集しているかを上段に出す（キーパッドは画面の下端に固定され、欄と離れるため）。 */
  fieldLabel: string;
  /** OS のキーボードをこの欄に出している最中か。true の間はキーの並びを畳み、上段だけ残す
   * （OS のキーボードの直上にキーの並びまで積むと、本文の表示域がほとんど残らない）。 */
  isOsKeyboardActive: boolean;
  labels: { osKeyboard: string; dismiss: string; backspace: string; functions: string; insertSymbol: string; insertUnit: string };
  /** 編集中の欄で参照できる定数・先行手順の記号。空なら記号の列は出ない。 */
  symbols: readonly string[];
  /** 編集中の欄の値に合う単位（SI接頭辞違いなど）。空なら単位の列は出ない。 */
  units: readonly { symbol: string; label: string }[];
  onInsert: (text: string) => void;
  onInsertSymbol: (symbol: string) => void;
  onInsertUnit: (symbol: string) => void;
  onBackspace: () => void;
  onToggleOsKeyboard: () => void;
  onDismiss: () => void;
};

/**
 * 計算ノート詳細の値欄に付くアプリ内キーパッド。数字・演算子・括弧・べき乗・科学表記を打つ。
 * 単位と定数記号は欄の直下のチップ列が担当するので、ここには英字を置かない。
 * 英字（定数名・未登録の単位名）を打ちたいときだけ、上段のキーボードキーで OS のキーボードを出す。
 *
 * **Web ではキーボードキーを出さない。** Web の TextInput は `showSoftInputOnFocus` を持たず、
 * フォーカスさえあれば物理キーボードで従来どおり打てるので、押しても何も変わらないキーになる。
 */
export const NotebookKeypad = memo(function NotebookKeypad({ fieldLabel, isOsKeyboardActive, labels, symbols, units, onInsert, onInsertSymbol, onInsertUnit, onBackspace, onToggleOsKeyboard, onDismiss }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // 関数チップの列は要るときだけ開く（常設すると約40px分だけ本文の表示域が減る）。
  // 開閉はこのコンポーネントの中で閉じる——親は「何を挿すか」だけ知っていればよい。
  const [isFunctionRailOpen, setIsFunctionRailOpen] = useState(false);

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text numberOfLines={1} style={styles.fieldLabel}>{fieldLabel}</Text>
        <View style={styles.topBarActions}>
          <Pressable
            accessibilityLabel={labels.functions}
            accessibilityRole="button"
            accessibilityState={{ selected: isFunctionRailOpen }}
            hitSlop={4}
            onPress={() => setIsFunctionRailOpen((current) => !current)}
            style={({ pressed }) => [styles.topBarButton, isFunctionRailOpen && styles.topBarButtonActive, pressed && styles.pressed]}
          >
            <Text style={[styles.topBarButtonText, isFunctionRailOpen && styles.topBarButtonTextActive]}>f(x)</Text>
          </Pressable>
          {Platform.OS === "web" ? null : (
            <Pressable
              accessibilityLabel={labels.osKeyboard}
              accessibilityRole="button"
              accessibilityState={{ selected: isOsKeyboardActive }}
              hitSlop={4}
              onPress={onToggleOsKeyboard}
              style={({ pressed }) => [styles.topBarButton, isOsKeyboardActive && styles.topBarButtonActive, pressed && styles.pressed]}
            >
              <IconSymbol name="keyboard" size={16} color={isOsKeyboardActive ? colors.onPrimary : colors.primary} />
            </Pressable>
          )}
          <Pressable accessibilityLabel={labels.dismiss} accessibilityRole="button" hitSlop={4} onPress={onDismiss} style={({ pressed }) => [styles.topBarButton, pressed && styles.pressed]}>
            <IconSymbol name="chevron.down" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>
      {/* 記号と単位のチップ。以前は各欄の直下に「定数」レールと単位チップ列を出していたが、欄ごとに
          2行ずつ場所を取るうえ、数字はキーパッド・記号と単位は欄の下、と親指が上下していた。電卓の
          「単位レールはキーパッド直上」と同じ考えで、編集中の欄のぶんだけをここに1行で出す。
          記号（下地付き）と単位（枠付き）は見た目で区別し、間に仕切りを置く。OS のキーボードを出して
          いる間も残す（キーの並びは畳むが、記号と単位はキーボードでは打ちにくいものだから）。 */}
      {symbols.length || units.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chipRail} style={styles.chipRailWrap}>
          {symbols.map((symbol) => (
            <Pressable accessibilityLabel={`${labels.insertSymbol} ${symbol}`} accessibilityRole="button" hitSlop={4} key={`symbol:${symbol}`} onPress={() => onInsertSymbol(symbol)} style={({ pressed }) => [styles.symbolChip, pressed && styles.pressed]}>
              <Text style={styles.symbolChipText}>{symbol}</Text>
            </Pressable>
          ))}
          {symbols.length && units.length ? <View style={styles.chipDivider} /> : null}
          {units.map((unit) => (
            <Pressable accessibilityLabel={`${labels.insertUnit} ${unit.symbol}`} accessibilityRole="button" hitSlop={4} key={`unit:${unit.symbol}`} onPress={() => onInsertUnit(unit.symbol)} style={({ pressed }) => [styles.unitChip, pressed && styles.pressed]}>
              <Text style={styles.unitChipText}>{unit.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      {isOsKeyboardActive || !isFunctionRailOpen ? null : <MathFunctionRail onInsert={onInsert} style={styles.functionRail} />}
      {isOsKeyboardActive ? null : (
        <View style={styles.keypad}>
          {NOTEBOOK_KEYPAD_KEYS.map((key) => {
            const isBackspace = "action" in key;
            return (
              <View key={key.label} style={styles.keyCell}>
                <Pressable
                  accessibilityLabel={isBackspace ? labels.backspace : key.label}
                  accessibilityRole="button"
                  hitSlop={KEY_CELL_PADDING}
                  onPress={() => (isBackspace ? onBackspace() : onInsert(key.insert))}
                  style={({ pressed }) => [styles.key, pressed && styles.pressed]}
                >
                  {isBackspace ? (
                    <IconSymbol name="delete.left" size={20} color={colors.primary} />
                  ) : (
                    <Text style={[styles.keyText, NOTEBOOK_KEYPAD_ACCENT_LABELS.has(key.label) && styles.keyTextAccent]}>{key.label}</Text>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
});

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  root: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 4, paddingTop: 4 },
  topBar: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between", minHeight: 32 },
  fieldLabel: { color: colors.muted, flexShrink: 1, fontFamily: mono, fontSize: 12, fontWeight: "700" },
  topBarActions: { flexDirection: "row", gap: 6 },
  topBarButton: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, height: 30, justifyContent: "center", width: 44 },
  topBarButtonActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  topBarButtonText: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  topBarButtonTextActive: { color: colors.onPrimary },
  functionRail: { marginBottom: 6, marginTop: 2 },
  chipRailWrap: { marginBottom: 6, marginTop: 2 },
  chipRail: { alignItems: "center", gap: 6 },
  symbolChip: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  symbolChipText: { color: colors.primaryStrong, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  chipDivider: { backgroundColor: colors.border, height: 18, width: 1 },
  unitChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  unitChipText: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  keypad: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -KEY_CELL_PADDING },
  keyCell: { padding: KEY_CELL_PADDING, width: `${100 / NOTEBOOK_KEYPAD_COLUMNS}%` },
  key: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, height: KEY_HEIGHT, justifyContent: "center" },
  keyText: { color: colors.foreground, fontFamily: mono, fontSize: 18, fontWeight: "600" },
  keyTextAccent: { color: colors.primary },
  pressed: { opacity: 0.72 },
});
