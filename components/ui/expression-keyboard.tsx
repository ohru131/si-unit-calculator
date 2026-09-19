import { memo, useMemo, useState, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { MathFunctionRail } from "@/components/ui/math-function-rail";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type CalculatorLayout, scaleFontSizes } from "@/lib/calculator-layout";
import { ALPHABET_ROWS, EXPRESSION_KEYS, EXPRESSION_KEY_COLUMNS, KEY_CELL_PADDING, OPERATOR_KEYS, POWER_KEYS, PREFIX_KEYS, SHIFT_KEY, type KeyboardTool } from "@/lib/expression-keyboard";
import { FORMULA_CHARACTER_GROUPS, type FormulaCharacterGroupId } from "@/lib/formula-characters";
import { type AppLanguage } from "@/lib/i18n";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_COPY = {
  caretLeft: "Move cursor left", caretRight: "Move cursor right", keyboardKey: "System keyboard",
  deleteKey: "Delete", clearAllKey: "Clear all", submitKey: "Equals", doneKey: "Done",
  toolPowers: "Powers and exponents", toolFunctions: "Math functions", toolSymbols: "Subscripts and Greek letters", toolAlphabet: "Letters", toolUnits: "Units",
  unitsShort: "Unit", shift: "Shift",
  subscriptDigits: "Subscript digits", subscriptLetters: "Subscript letters", greekLower: "Greek (lowercase)", greekUpper: "Greek (uppercase)",
} as const;
const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = {
  en: EN_COPY,
  ja: {
    caretLeft: "カーソルを左へ", caretRight: "カーソルを右へ", keyboardKey: "端末のキーボード",
    deleteKey: "一文字削除", clearAllKey: "全消去", submitKey: "計算", doneKey: "確定",
    toolPowers: "べき乗・指数", toolFunctions: "数学関数", toolSymbols: "下付き文字・ギリシャ文字", toolAlphabet: "英字", toolUnits: "単位",
    unitsShort: "単位", shift: "大文字",
    subscriptDigits: "下付き数字", subscriptLetters: "下付き文字", greekLower: "ギリシャ文字（小文字）", greekUpper: "ギリシャ文字（大文字）",
  },
  es: {
    caretLeft: "Mover el cursor a la izquierda", caretRight: "Mover el cursor a la derecha", keyboardKey: "Teclado del sistema",
    deleteKey: "Eliminar", clearAllKey: "Borrar todo", submitKey: "Calcular", doneKey: "Listo",
    toolPowers: "Potencias y exponentes", toolFunctions: "Funciones matemáticas", toolSymbols: "Subíndices y letras griegas", toolAlphabet: "Letras", toolUnits: "Unidades",
    unitsShort: "Unid.", shift: "Mayúsculas",
    subscriptDigits: "Dígitos en subíndice", subscriptLetters: "Letras en subíndice", greekLower: "Griego (minúsculas)", greekUpper: "Griego (mayúsculas)",
  },
  "pt-BR": {
    caretLeft: "Mover o cursor para a esquerda", caretRight: "Mover o cursor para a direita", keyboardKey: "Teclado do sistema",
    deleteKey: "Excluir", clearAllKey: "Limpar tudo", submitKey: "Calcular", doneKey: "Concluído",
    toolPowers: "Potências e expoentes", toolFunctions: "Funções matemáticas", toolSymbols: "Subscritos e letras gregas", toolAlphabet: "Letras", toolUnits: "Unidades",
    unitsShort: "Unid.", shift: "Maiúsculas",
    subscriptDigits: "Dígitos subscritos", subscriptLetters: "Letras subscritas", greekLower: "Grego (minúsculas)", greekUpper: "Grego (maiúsculas)",
  },
  de: {
    caretLeft: "Cursor nach links", caretRight: "Cursor nach rechts", keyboardKey: "Systemtastatur",
    deleteKey: "Rücktaste", clearAllKey: "Alles löschen", submitKey: "Berechnen", doneKey: "Fertig",
    toolPowers: "Potenzen und Exponenten", toolFunctions: "Mathematische Funktionen", toolSymbols: "Tiefgestellte Zeichen und griechische Buchstaben", toolAlphabet: "Buchstaben", toolUnits: "Einheiten",
    unitsShort: "Einh.", shift: "Großschreibung",
    subscriptDigits: "Tiefgestellte Ziffern", subscriptLetters: "Tiefgestellte Buchstaben", greekLower: "Griechisch (klein)", greekUpper: "Griechisch (groß)",
  },
  fr: {
    caretLeft: "Déplacer le curseur vers la gauche", caretRight: "Déplacer le curseur vers la droite", keyboardKey: "Clavier du système",
    deleteKey: "Supprimer", clearAllKey: "Tout effacer", submitKey: "Calculer", doneKey: "Terminé",
    toolPowers: "Puissances et exposants", toolFunctions: "Fonctions mathématiques", toolSymbols: "Indices et lettres grecques", toolAlphabet: "Lettres", toolUnits: "Unités",
    unitsShort: "Unité", shift: "Majuscules",
    subscriptDigits: "Chiffres en indice", subscriptLetters: "Lettres en indice", greekLower: "Grec (minuscules)", greekUpper: "Grec (majuscules)",
  },
};

type Props = {
  language: AppLanguage;
  /** キーの高さ・行間・文字の拡大率。電卓は画面の高さと文字サイズ設定から段階を選ぶ（lib/calculator-layout）。 */
  layout: CalculatorLayout;
  /** 開いているパネル。null は畳んだ状態。親が持つ（未対応単位のタップで「単位」へ切り替える等、外から動かす場面があるため）。 */
  tool: KeyboardTool | null;
  onToolChange: (tool: KeyboardTool | null) => void;
  /** キーパッド本体の20キー（数字・演算子・括弧・⌫・AC・=）。 */
  onKey: (key: string) => void;
  /** パネルのチップ（べき乗・関数・記号・英字）。接頭語の意味を持たない素の挿入。 */
  onInsert: (text: string) => void;
  /** 接頭語キー。電卓ではトグル（同じキーで取り消し）なので素の挿入と分けてある。 */
  onPrefix: (prefix: string) => void;
  activePrefix?: string | null;
  onMoveCaret: (delta: 1 | -1) => void;
  caretAtStart?: boolean;
  caretAtEnd?: boolean;
  /** 進数入力モードなど、そのキーが今は使えないとき true。 */
  isKeyDisabled?: (key: string) => boolean;
  /** パネル（べき乗・関数・記号・英字・接頭語）を丸ごと使えなくする（進数入力モード中）。 */
  panelsDisabled?: boolean;
  /** 「単位」パネルの接頭語行の下に出す中身（電卓は単位レール、ノートは記号・単位チップ）。 */
  unitPanel?: ReactNode;
  /** キーパッド本体の直上に挟む行（16進入力の A〜F など）。 */
  aboveKeypad?: ReactNode;
  isOsKeyboardActive?: boolean;
  onToggleOsKeyboard?: () => void;
  /** `=` の代わりに確定（✓）を出す（ノートの値欄には「計算」が無い）。 */
  submitAsDone?: boolean;
  style?: StyleProp<ViewStyle>;
};

const TOOLS: readonly { id: KeyboardTool; label: string }[] = [
  { id: "powers", label: "xⁿ" },
  { id: "functions", label: "f(x)" },
  { id: "symbols", label: "αβ" },
  { id: "alphabet", label: "ABC" },
  { id: "units", label: "" },
];

/**
 * 電卓と計算ノートが共用する式キーボード。上から ツール行 → 選んだツールのパネル → 5×4のキーパッド。
 *
 * 【なぜ1つにしたか】電卓は編集キー行・接頭語行・単位レール・キーパッドを別々に積み、ノートは別配置の
 * キーパッドを持っていて「画面ごとにキー配置が違う」と指摘された。並びをここに閉じれば、片方に足した
 * 入力手段（関数・記号・英字）が必ずもう片方でも使える。
 *
 * 【ツール行の考え方】常に見えるのはキャレット移動と各パネルの入口だけ。べき乗・関数・記号・英字・
 * 単位は**どれか1つのパネルだけ**を開く（縦に積むと画面の低い端末でキーパッドがタブバーに潜る）。
 * 同じツールをもう一度押すと畳む。既定は「単位」（この電卓の主用途）。
 */
export const ExpressionKeyboard = memo(function ExpressionKeyboard({
  language, layout, tool, onToolChange, onKey, onInsert, onPrefix, activePrefix = null, onMoveCaret, caretAtStart = false, caretAtEnd = false,
  isKeyDisabled, panelsDisabled = false, unitPanel, aboveKeypad, isOsKeyboardActive = false, onToggleOsKeyboard, submitAsDone = false, style,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors, layout), [colors, layout]);
  const copy = COPY[language];
  const [symbolGroupId, setSymbolGroupId] = useState<FormulaCharacterGroupId>(FORMULA_CHARACTER_GROUPS[0].id);
  // 英字パネルの ⇧。1文字打つと戻る（定数名の頭文字だけ大文字にする使い方が大半）。
  const [shift, setShift] = useState(false);

  const toolLabel = (id: KeyboardTool) =>
    id === "powers" ? copy.toolPowers : id === "functions" ? copy.toolFunctions : id === "symbols" ? copy.toolSymbols : id === "alphabet" ? copy.toolAlphabet : copy.toolUnits;
  const symbolGroupLabel = (id: FormulaCharacterGroupId) =>
    id === "subscriptDigits" ? copy.subscriptDigits : id === "subscriptLetters" ? copy.subscriptLetters : id === "greekLower" ? copy.greekLower : copy.greekUpper;

  const renderPanel = () => {
    if (!tool || panelsDisabled) return null;
    if (tool === "powers") {
      return (
        <View style={styles.chipRow}>
          {POWER_KEYS.map((key) => (
            <Pressable accessibilityLabel={key.insert} hitSlop={2} key={key.label} onPress={() => onInsert(key.insert)} style={({ pressed }) => [styles.panelKey, pressed && styles.pressed]}>
              <Text numberOfLines={1} style={styles.panelKeyText}>{key.label}</Text>
            </Pressable>
          ))}
        </View>
      );
    }
    if (tool === "functions") return <MathFunctionRail onInsert={onInsert} style={styles.panelRail} />;
    if (tool === "symbols") {
      const group = FORMULA_CHARACTER_GROUPS.find((entry) => entry.id === symbolGroupId) ?? FORMULA_CHARACTER_GROUPS[0];
      return (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.groupTabs}>
            {FORMULA_CHARACTER_GROUPS.map((entry) => (
              <Pressable accessibilityState={{ selected: entry.id === symbolGroupId }} key={entry.id} onPress={() => setSymbolGroupId(entry.id)} style={({ pressed }) => [styles.groupTab, entry.id === symbolGroupId && styles.groupTabActive, pressed && styles.pressed]}>
                <Text style={[styles.groupTabText, entry.id === symbolGroupId && styles.groupTabTextActive]}>{symbolGroupLabel(entry.id)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chipRail} style={styles.panelRail}>
            {group.chars.map((char) => (
              <Pressable accessibilityLabel={char} hitSlop={4} key={char} onPress={() => onInsert(char)} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                <Text style={styles.chipText}>{char}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      );
    }
    if (tool === "alphabet") {
      return (
        <View style={styles.alphabet}>
          {ALPHABET_ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.chipRow}>
              {row.map((key) => {
                if (key === SHIFT_KEY) {
                  return (
                    <Pressable accessibilityLabel={copy.shift} accessibilityState={{ selected: shift }} hitSlop={2} key={key} onPress={() => setShift((current) => !current)} style={({ pressed }) => [styles.panelKey, shift && styles.panelKeyActive, pressed && styles.pressed]}>
                      <Text style={[styles.panelKeyText, shift && styles.panelKeyTextActive]}>{SHIFT_KEY}</Text>
                    </Pressable>
                  );
                }
                const label = shift && key !== "_" ? key.toUpperCase() : key;
                return (
                  <Pressable accessibilityLabel={label} hitSlop={2} key={key} onPress={() => { onInsert(label); if (shift) setShift(false); }} style={({ pressed }) => [styles.panelKey, pressed && styles.pressed]}>
                    <Text style={styles.panelKeyText}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      );
    }
    return (
      <View>
        {/* 接頭語は単位の一部なので単位パネルの中に置く（演算子まわりのキーと同じ行に混ぜると、
            どれが式の記号でどれが単位の文字か見分けられない）。 */}
        <View style={styles.chipRow}>
          {PREFIX_KEYS.map((prefix) => (
            <Pressable
              accessibilityLabel={prefix}
              accessibilityState={{ selected: activePrefix === prefix }}
              hitSlop={2}
              key={prefix}
              onPress={() => onPrefix(prefix)}
              style={({ pressed }) => [styles.prefixKey, activePrefix === prefix && styles.panelKeyActive, pressed && styles.pressed]}
            >
              <Text style={[styles.panelKeyText, activePrefix === prefix && styles.panelKeyTextActive]}>{prefix}</Text>
            </Pressable>
          ))}
        </View>
        {unitPanel ? <View style={styles.unitPanel}>{unitPanel}</View> : null}
      </View>
    );
  };

  return (
    <View style={style}>
      <View style={styles.toolRow}>
        <Pressable accessibilityLabel={copy.caretLeft} disabled={caretAtStart} hitSlop={2} onPress={() => onMoveCaret(-1)} style={({ pressed }) => [styles.toolKey, styles.caretKey, caretAtStart && styles.keyDisabled, pressed && styles.pressed]}>
          <IconSymbol name="chevron.left" size={16} color={colors.primary} />
        </Pressable>
        <Pressable accessibilityLabel={copy.caretRight} disabled={caretAtEnd} hitSlop={2} onPress={() => onMoveCaret(1)} style={({ pressed }) => [styles.toolKey, styles.caretKey, caretAtEnd && styles.keyDisabled, pressed && styles.pressed]}>
          <IconSymbol name="chevron.right" size={16} color={colors.primary} />
        </Pressable>
        {TOOLS.map((entry) => {
          const active = tool === entry.id && !panelsDisabled;
          return (
            <Pressable
              accessibilityLabel={toolLabel(entry.id)}
              accessibilityState={{ selected: active }}
              disabled={panelsDisabled}
              hitSlop={2}
              key={entry.id}
              onPress={() => onToolChange(tool === entry.id ? null : entry.id)}
              style={({ pressed }) => [styles.toolKey, active && styles.toolKeyActive, panelsDisabled && styles.keyDisabled, pressed && styles.pressed]}
            >
              <Text numberOfLines={1} style={[styles.toolKeyText, active && styles.toolKeyTextActive]}>{entry.id === "units" ? copy.unitsShort : entry.label}</Text>
            </Pressable>
          );
        })}
        {onToggleOsKeyboard ? (
          <Pressable
            accessibilityLabel={copy.keyboardKey}
            accessibilityState={{ selected: isOsKeyboardActive }}
            hitSlop={2}
            onPress={onToggleOsKeyboard}
            style={({ pressed }) => [styles.toolKey, styles.caretKey, isOsKeyboardActive && styles.toolKeyActive, pressed && styles.pressed]}
          >
            <IconSymbol name="keyboard" size={16} color={isOsKeyboardActive ? colors.onPrimary : colors.primary} />
          </Pressable>
        ) : null}
      </View>
      {renderPanel()}
      {aboveKeypad}
      <KeypadGrid colors={colors} copy={copy} isKeyDisabled={isKeyDisabled} onKey={onKey} styles={styles} submitAsDone={submitAsDone} />
    </View>
  );
});

type KeypadGridProps = {
  colors: ThemeColorPalette;
  copy: Record<keyof typeof EN_COPY, string>;
  isKeyDisabled?: (key: string) => boolean;
  onKey: (key: string) => void;
  styles: ReturnType<typeof createStyles>;
  submitAsDone: boolean;
};

/**
 * キーパッド本体。式を1文字打つたびに親が再レンダーされても、ここは props（進数モードの判定関数と
 * 固定参照のハンドラ）が変わらない限り作り直さない（電卓の実機で1打鍵あたり100ms超の主因だった）。
 */
const KeypadGrid = memo(function KeypadGrid({ colors, copy, isKeyDisabled, onKey, styles, submitAsDone }: KeypadGridProps) {
  return (
    <View style={styles.keypad}>
      {EXPRESSION_KEYS.map((key, index) => {
        const isAction = key === "=";
        const isOperator = OPERATOR_KEYS.has(key);
        const disabled = isKeyDisabled?.(key) ?? false;
        const label = key === "⌫" ? copy.deleteKey : key === "AC" ? copy.clearAllKey : key === "=" ? (submitAsDone ? copy.doneKey : copy.submitKey) : key;
        return (
          <View key={`${key}-${index}`} style={styles.keyCell}>
            <Pressable
              accessibilityLabel={label}
              disabled={disabled}
              hitSlop={KEY_CELL_PADDING}
              onPress={() => onKey(key)}
              style={({ pressed }) => [styles.key, isAction && styles.keyAction, isOperator && styles.keyOperator, disabled && styles.keyDisabled, pressed && styles.keyPressed]}
            >
              {key === "⌫" ? (
                <IconSymbol name="delete.left" size={20} color={colors.muted} />
              ) : isAction && submitAsDone ? (
                <IconSymbol name="checkmark" size={22} color={colors.onPrimary} />
              ) : (
                <Text style={[styles.keyText, (isAction || isOperator) && styles.keyTextAccent, isAction && { color: colors.onPrimary }]}>{key}</Text>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
});

const createStyles = (colors: ThemeColorPalette, layout: CalculatorLayout) => StyleSheet.create(scaleFontSizes({
  toolRow: { flexDirection: "row", gap: layout.keyRowGap, marginBottom: layout.keyRowGap - 2 },
  toolKey: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: layout.keyRowMinHeight, minWidth: 0, paddingHorizontal: 2 },
  caretKey: { flex: 0.8 },
  toolKeyActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  toolKeyText: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  toolKeyTextActive: { color: colors.onPrimary },
  chipRow: { flexDirection: "row", gap: layout.keyRowGap, marginBottom: layout.keyRowGap - 2 },
  panelKey: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: layout.keyRowMinHeight, minWidth: 0 },
  prefixKey: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: layout.keyRowMinHeight },
  panelKeyActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  panelKeyText: { color: colors.primary, fontFamily: mono, fontSize: 15, fontWeight: "800" },
  panelKeyTextActive: { color: colors.onPrimary },
  alphabet: { gap: 0 },
  panelRail: { flexShrink: 0, marginBottom: layout.keyRowGap - 2 },
  groupTabs: { gap: 6, paddingBottom: 4 },
  groupTab: { backgroundColor: colors.surfaceSecondary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  groupTabActive: { backgroundColor: colors.primaryFill },
  groupTabText: { color: colors.foreground, fontSize: 12, fontWeight: "700" },
  groupTabTextActive: { color: colors.onPrimary },
  chipRail: { alignItems: "center", gap: 6 },
  chip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { color: colors.primary, fontFamily: mono, fontSize: 14, fontWeight: "800" },
  unitPanel: {},
  keypad: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -KEY_CELL_PADDING },
  keyCell: { padding: KEY_CELL_PADDING, width: `${100 / EXPRESSION_KEY_COLUMNS}%` },
  key: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, height: layout.keyHeight, justifyContent: "center" },
  keyOperator: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder },
  keyAction: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  keyText: { color: colors.foreground, fontFamily: mono, fontSize: 18, fontWeight: "600" },
  keyTextAccent: { color: colors.primary },
  keyPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  keyDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.72 },
}, layout.fontFactor));
