import { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
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
  labels: { osKeyboard: string; dismiss: string; backspace: string };
  onInsert: (text: string) => void;
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
export const NotebookKeypad = memo(function NotebookKeypad({ fieldLabel, isOsKeyboardActive, labels, onInsert, onBackspace, onToggleOsKeyboard, onDismiss }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text numberOfLines={1} style={styles.fieldLabel}>{fieldLabel}</Text>
        <View style={styles.topBarActions}>
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
  keypad: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -KEY_CELL_PADDING },
  keyCell: { padding: KEY_CELL_PADDING, width: `${100 / NOTEBOOK_KEYPAD_COLUMNS}%` },
  key: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, height: KEY_HEIGHT, justifyContent: "center" },
  keyText: { color: colors.foreground, fontFamily: mono, fontSize: 18, fontWeight: "600" },
  keyTextAccent: { color: colors.primary },
  pressed: { opacity: 0.72 },
});
