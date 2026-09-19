import { memo, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ExpressionKeyboard } from "@/components/ui/expression-keyboard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type CalculatorLayout } from "@/lib/calculator-layout";
import { type KeyboardTool } from "@/lib/expression-keyboard";
import { type AppLanguage } from "@/lib/i18n";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

type Props = {
  language: AppLanguage;
  layout: CalculatorLayout;
  /** 今どの欄を編集しているかを上段に出す（キーパッドは画面の下端に固定され、欄と離れるため）。 */
  fieldLabel: string;
  /** OS のキーボードをこの欄に出している最中か。true の間はキーの並びを畳み、上段と記号・単位の列だけ残す。 */
  isOsKeyboardActive: boolean;
  labels: { dismiss: string; insertSymbol: string; insertUnit: string };
  /** 編集中の欄で参照できる定数・先行手順の記号。空なら記号の列は出ない。 */
  symbols: readonly string[];
  /** 編集中の欄の値に合う単位（SI接頭辞違いなど）。空なら単位の列は出ない。 */
  units: readonly { symbol: string; label: string }[];
  onKey: (key: string) => void;
  onInsert: (text: string) => void;
  onInsertSymbol: (symbol: string) => void;
  onInsertUnit: (symbol: string) => void;
  onMoveCaret: (delta: 1 | -1) => void;
  onToggleOsKeyboard: () => void;
  onDismiss: () => void;
};

/**
 * 計算ノート詳細の値欄に付くキーパッド。中身は電卓と同じ ExpressionKeyboard で、ここでは
 * 上段（編集中の欄名・閉じる）と、単位パネルに出す記号・単位チップの列だけを足す。
 *
 * 【なぜ記号と単位をキーパッドに出すか】以前は各欄の直下に「定数」レールと単位チップ列を出していたが、
 * 欄ごとに2行ずつ場所を取るうえ、数字はキーパッド・記号と単位は欄の下、と親指が上下していた。電卓の
 * 「単位レールはキーパッド直上」と同じ考えで、編集中の欄のぶんだけをここに1行で出す。
 * OS のキーボードを出している間も残す（記号と単位はキーボードでは打ちにくいものだから）。
 */
export const NotebookKeypad = memo(function NotebookKeypad({ language, layout, fieldLabel, isOsKeyboardActive, labels, symbols, units, onKey, onInsert, onInsertSymbol, onInsertUnit, onMoveCaret, onToggleOsKeyboard, onDismiss }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tool, setTool] = useState<KeyboardTool | null>("units");

  const chipRail = symbols.length || units.length ? (
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
  ) : null;

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text numberOfLines={1} style={styles.fieldLabel}>{fieldLabel}</Text>
        <Pressable accessibilityLabel={labels.dismiss} accessibilityRole="button" hitSlop={4} onPress={onDismiss} style={({ pressed }) => [styles.topBarButton, pressed && styles.pressed]}>
          <IconSymbol name="chevron.down" size={18} color={colors.primary} />
        </Pressable>
      </View>
      {isOsKeyboardActive ? (
        // OS のキーボードを出している間はキーの並びを畳む（キーボードの直上にキーまで積むと本文が
        // ほとんど残らない）。記号・単位の列だけはキーボードの直上に残す。
        chipRail
      ) : (
        <ExpressionKeyboard
          language={language}
          layout={layout}
          tool={tool}
          onToolChange={setTool}
          onKey={onKey}
          onInsert={onInsert}
          onPrefix={onInsert}
          onMoveCaret={onMoveCaret}
          unitPanel={chipRail}
          isOsKeyboardActive={isOsKeyboardActive}
          // Web の TextInput は showSoftInputOnFocus を持たず、フォーカスさえあれば物理キーボードで打てる。
          onToggleOsKeyboard={Platform.OS === "web" ? undefined : onToggleOsKeyboard}
          submitAsDone
        />
      )}
    </View>
  );
});

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  root: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 4, paddingTop: 4 },
  topBar: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between", minHeight: 30, marginBottom: 2 },
  fieldLabel: { color: colors.muted, flexShrink: 1, fontFamily: mono, fontSize: 12, fontWeight: "700" },
  topBarButton: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 8, height: 28, justifyContent: "center", width: 44, borderWidth: 1 },
  chipRailWrap: { marginBottom: 4 },
  chipRail: { alignItems: "center", gap: 6 },
  symbolChip: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  symbolChipText: { color: colors.primaryStrong, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  chipDivider: { backgroundColor: colors.border, height: 18, width: 1 },
  unitChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  unitChipText: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});
