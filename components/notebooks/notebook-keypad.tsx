import { memo, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { ExpressionKeyboard } from "@/components/ui/expression-keyboard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UnitRail } from "@/components/ui/unit-rail";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type UnitRailState } from "@/hooks/use-unit-rail";
import { type CalculatorLayout } from "@/lib/calculator-layout";
import { type KeyboardTool } from "@/lib/expression-keyboard";
import { type AppLanguage } from "@/lib/i18n";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

// Web ではキー（Pressable）が mousedown でフォーカスを奪い、編集中の欄が blur してキャレットが消える
// （`◀ ▶` を押しても内部の位置は動くのに画面では何も見えず、「効かない」と報告された）。
// mousedown の既定動作を止めるとフォーカスは欄に残り、クリック（onPress）はそのまま届く。
// RN の ViewProps に onMouseDown は無いが、react-native-web の View は mouseProps として DOM へ渡す。
const keepFieldFocusProps = Platform.OS === "web"
  ? ({ onMouseDown: (event: { preventDefault: () => void }) => event.preventDefault() } as object)
  : {};

type Props = {
  language: AppLanguage;
  layout: CalculatorLayout;
  /** 今どの欄を編集しているかを上段に出す（キーパッドは画面の下端に固定され、欄と離れるため）。 */
  fieldLabel: string;
  /** OS のキーボードをこの欄に出している最中か。true の間はキーの並びを畳み、上段と単位レールだけ残す。 */
  isOsKeyboardActive: boolean;
  labels: { dismiss: string };
  /** 編集中の欄で参照できる定数・先行手順の記号。「定数」パネルに π・e の後ろへ並ぶ。 */
  symbols: readonly string[];
  /** 電卓と共用の単位パレットの状態（hooks/use-unit-rail.ts）。 */
  unitRail: UnitRailState;
  onKey: (key: string) => void;
  onInsert: (text: string) => void;
  onPrefix: (prefix: string) => void;
  onApplyUnit: (symbol: string) => void;
  onMoveCaret: (delta: 1 | -1) => void;
  onToggleOsKeyboard: () => void;
  onDismiss: () => void;
};

/**
 * 計算ノート詳細の値欄に付くキーパッド。中身は電卓と同じ ExpressionKeyboard と UnitRail で、
 * ここが足すのは上段（編集中の欄名・閉じる）だけ。
 *
 * 【なぜ単位レールをキーパッドの中に出すか】以前は各欄の直下に「定数」レールと単位チップ列を
 * 出していたが、欄ごとに2行ずつ場所を取るうえ、数字はキーパッド・記号と単位は欄の下、と親指が
 * 上下していた。電卓の「単位レールはキーパッド直上」と同じ考えで、編集中の欄のぶんだけをここに出す。
 * OS のキーボードを出している間も残す（単位はキーボードでは打ちにくいものだから）。
 *
 * **記号（定数・先行手順）は単位レールに混ぜない。** 以前は同じ行に記号チップと単位チップを
 * 仕切り付きで並べていたが、「単位を選ぶ行に関係のない定数が出てくる」と報告された。記号は
 * ツール行の「定数」パネルに名前だけで並ぶので、そちらへ一本化してある。
 */
export const NotebookKeypad = memo(function NotebookKeypad({ language, layout, fieldLabel, isOsKeyboardActive, labels, symbols, unitRail, onKey, onInsert, onPrefix, onApplyUnit, onMoveCaret, onToggleOsKeyboard, onDismiss }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tool, setTool] = useState<KeyboardTool | null>("units");
  const keyboardConstants = useMemo(() => symbols.map((symbol) => ({ symbol })), [symbols]);

  const rail = <UnitRail language={language} onApply={onApplyUnit} state={unitRail} />;

  return (
    <View style={styles.root} {...keepFieldFocusProps}>
      <View style={styles.topBar}>
        <Text numberOfLines={1} style={styles.fieldLabel}>{fieldLabel}</Text>
        <Pressable accessibilityLabel={labels.dismiss} accessibilityRole="button" hitSlop={4} onPress={onDismiss} style={({ pressed }) => [styles.topBarButton, pressed && styles.pressed]}>
          <IconSymbol name="chevron.down" size={18} color={colors.primary} />
        </Pressable>
      </View>
      {isOsKeyboardActive ? (
        // OS のキーボードを出している間はキーの並びを畳む（キーボードの直上にキーまで積むと本文が
        // ほとんど残らない）。単位レールだけはキーボードの直上に残す。
        rail
      ) : (
        <ExpressionKeyboard
          language={language}
          layout={layout}
          tool={tool}
          onToolChange={setTool}
          onKey={onKey}
          onInsert={onInsert}
          onPrefix={onPrefix}
          activePrefix={unitRail.activePrefix}
          onMoveCaret={onMoveCaret}
          unitPanel={rail}
          // 「定数」パネルに、この手順から参照できる記号（ローカル定数と先行手順の結果）を出す。
          constants={keyboardConstants}
          isOsKeyboardActive={isOsKeyboardActive}
          // Web の TextInput は showSoftInputOnFocus を持たず、フォーカスさえあれば物理キーボードで打てる。
          onToggleOsKeyboard={Platform.OS === "web" ? undefined : onToggleOsKeyboard}
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
  pressed: { opacity: 0.72 },
});
