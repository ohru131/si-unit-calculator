import { memo, useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { MATH_FUNCTION_KEYS } from "@/lib/math-functions";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

type Props = {
  /** チップを押したときに式へ挿す文字（`sqrt(` など）。挿入位置の扱いは呼び出し側に任せる。 */
  onInsert: (text: string) => void;
  /** 進数入力モード中など、関数を受け付けられないときに押せなくする。 */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * 数学関数の横スクロールのチップ列。電卓の `f(x)` キーと計算ノートのキーパッドの `f(x)` の両方が
 * これを出す（見た目・並び・挿入の仕方を1箇所にそろえるため）。開閉の状態は持たない——
 * 出すかどうかは親が決める。
 */
export const MathFunctionRail = memo(function MathFunctionRail({ onInsert, disabled = false, style }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.rail} style={style}>
      {MATH_FUNCTION_KEYS.map((item) => (
        <Pressable
          accessibilityLabel={item}
          accessibilityRole="button"
          disabled={disabled}
          hitSlop={4}
          key={item}
          onPress={() => onInsert(item)}
          style={({ pressed }) => [styles.chip, disabled && styles.chipDisabled, pressed && styles.pressed]}
        >
          <Text style={styles.chipText}>{item}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
});

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  rail: { alignItems: "center", gap: 6 },
  chip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  chipDisabled: { opacity: 0.4 },
  chipText: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});
