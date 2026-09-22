import { memo, useMemo, useState, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type CalculatorLayout, scaleFontSizes } from "@/lib/calculator-layout";
import { ALPHABET_ROWS, EXPRESSION_CELLS, EXPRESSION_KEY_COLUMNS, FUNCTION_KEY_COLUMNS, KEY_CELL_PADDING, MATH_CONSTANT_KEYS, OPERATOR_KEYS, POWER_KEYS, PREFIX_KEYS, SHIFT_KEY, SYMBOL_KEY_COLUMNS, type ExpressionKey, type KeyboardTool } from "@/lib/expression-keyboard";
import { FORMULA_CHARACTER_GROUPS, type FormulaCharacterGroupId } from "@/lib/formula-characters";
import { MATH_FUNCTION_KEYS } from "@/lib/math-functions";
import { type AppLanguage } from "@/lib/i18n";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });


// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_COPY = {
  caretLeft: "Move cursor left", caretRight: "Move cursor right", keyboardKey: "System keyboard",
  deleteKey: "Delete", clearAllKey: "Clear all", submitKey: "Equals", doneKey: "Done",
  toolConstants: "Constants", toolPowers: "Powers and exponents", toolFunctions: "Math functions", toolSymbols: "Subscripts and Greek letters", toolAlphabet: "Letters", toolUnits: "Units",
  unitsShort: "Unit", constantsShort: "Const", shift: "Shift",
  subscriptDigits: "Subscript digits", subscriptLetters: "Subscript letters", greekLower: "Greek (lowercase)", greekUpper: "Greek (uppercase)",
  editConstants: "Edit constants", editConstantsDone: "Done editing constants", newConstant: "New constant",
} as const;
const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = {
  en: EN_COPY,
  ja: {
    caretLeft: "カーソルを左へ", caretRight: "カーソルを右へ", keyboardKey: "端末のキーボード",
    deleteKey: "一文字削除", clearAllKey: "全消去", submitKey: "計算", doneKey: "確定",
    toolConstants: "定数", toolPowers: "べき乗・指数", toolFunctions: "数学関数", toolSymbols: "下付き文字・ギリシャ文字", toolAlphabet: "英字", toolUnits: "単位",
    unitsShort: "単位", constantsShort: "定数", shift: "大文字",
    subscriptDigits: "下付き数字", subscriptLetters: "下付き文字", greekLower: "ギリシャ文字（小文字）", greekUpper: "ギリシャ文字（大文字）",
    editConstants: "定数を編集", editConstantsDone: "定数の編集を終える", newConstant: "新しい定数",
  },
  es: {
    caretLeft: "Mover el cursor a la izquierda", caretRight: "Mover el cursor a la derecha", keyboardKey: "Teclado del sistema",
    deleteKey: "Eliminar", clearAllKey: "Borrar todo", submitKey: "Calcular", doneKey: "Listo",
    toolConstants: "Constantes", toolPowers: "Potencias y exponentes", toolFunctions: "Funciones matemáticas", toolSymbols: "Subíndices y letras griegas", toolAlphabet: "Letras", toolUnits: "Unidades",
    unitsShort: "Unid.", constantsShort: "Const.", shift: "Mayúsculas",
    subscriptDigits: "Dígitos en subíndice", subscriptLetters: "Letras en subíndice", greekLower: "Griego (minúsculas)", greekUpper: "Griego (mayúsculas)",
    editConstants: "Editar constantes", editConstantsDone: "Terminar de editar", newConstant: "Nueva constante",
  },
  "pt-BR": {
    caretLeft: "Mover o cursor para a esquerda", caretRight: "Mover o cursor para a direita", keyboardKey: "Teclado do sistema",
    deleteKey: "Excluir", clearAllKey: "Limpar tudo", submitKey: "Calcular", doneKey: "Concluído",
    toolConstants: "Constantes", toolPowers: "Potências e expoentes", toolFunctions: "Funções matemáticas", toolSymbols: "Subscritos e letras gregas", toolAlphabet: "Letras", toolUnits: "Unidades",
    unitsShort: "Unid.", constantsShort: "Const.", shift: "Maiúsculas",
    subscriptDigits: "Dígitos subscritos", subscriptLetters: "Letras subscritas", greekLower: "Grego (minúsculas)", greekUpper: "Grego (maiúsculas)",
    editConstants: "Editar constantes", editConstantsDone: "Concluir a edição", newConstant: "Nova constante",
  },
  de: {
    caretLeft: "Cursor nach links", caretRight: "Cursor nach rechts", keyboardKey: "Systemtastatur",
    deleteKey: "Rücktaste", clearAllKey: "Alles löschen", submitKey: "Berechnen", doneKey: "Fertig",
    toolConstants: "Konstanten", toolPowers: "Potenzen und Exponenten", toolFunctions: "Mathematische Funktionen", toolSymbols: "Tiefgestellte Zeichen und griechische Buchstaben", toolAlphabet: "Buchstaben", toolUnits: "Einheiten",
    unitsShort: "Einh.", constantsShort: "Konst.", shift: "Großschreibung",
    subscriptDigits: "Tiefgestellte Ziffern", subscriptLetters: "Tiefgestellte Buchstaben", greekLower: "Griechisch (klein)", greekUpper: "Griechisch (groß)",
    editConstants: "Konstanten bearbeiten", editConstantsDone: "Bearbeiten beenden", newConstant: "Neue Konstante",
  },
  fr: {
    caretLeft: "Déplacer le curseur vers la gauche", caretRight: "Déplacer le curseur vers la droite", keyboardKey: "Clavier du système",
    deleteKey: "Supprimer", clearAllKey: "Tout effacer", submitKey: "Calculer", doneKey: "Terminé",
    toolConstants: "Constantes", toolPowers: "Puissances et exposants", toolFunctions: "Fonctions mathématiques", toolSymbols: "Indices et lettres grecques", toolAlphabet: "Lettres", toolUnits: "Unités",
    unitsShort: "Unité", constantsShort: "Const.", shift: "Majuscules",
    subscriptDigits: "Chiffres en indice", subscriptLetters: "Lettres en indice", greekLower: "Grec (minuscules)", greekUpper: "Grec (majuscules)",
    editConstants: "Modifier les constantes", editConstantsDone: "Terminer la modification", newConstant: "Nouvelle constante",
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
  /**
   * 「定数」パネルに π・e の後ろへ並べる名前。電卓は保存済みの定数と直近の計算結果（a1…）、
   * ノートはその手順から参照できる記号。**渡さなければ数学定数だけ**が出る。
   */
  constants?: readonly { symbol: string; hint?: string }[];
  /**
   * 「定数」パネルから定数そのものを編集できるようにする（電卓タブだけ）。渡さなければ従来どおり
   * 押すと名前が挿入されるだけ。**この部品は memo してあるので、呼び出し側で useMemo すること**
   * （毎レンダー新しいオブジェクトを渡すとキーパッドのメモ化が丸ごと効かなくなる）。
   *
   * 【なぜここに置くか】定数を足す・直す口がライブラリタブの中にしか無く、「電卓で使うものなのに
   * どこで編集するのか分からない」と報告された。定数の名前が並んでいるまさにこの場所が、直したいと
   * 思う場所でもある。**常時ボタンを出さず編集モードのトグルにする**のは、普段の用途は挿入で、
   * チップ1つ1つに鉛筆を添えると名前が読めなくなるため。
   */
  constantActions?: {
    isEditing: boolean;
    onToggleEditing: () => void;
    onEdit: (symbol: string) => void;
    onCreate: () => void;
  };
  /** キーパッド本体の直上に挟む行（16進入力の A〜F など）。 */
  aboveKeypad?: ReactNode;
  isOsKeyboardActive?: boolean;
  onToggleOsKeyboard?: () => void;
  style?: StyleProp<ViewStyle>;
};

const TOOLS: readonly { id: KeyboardTool; label: string }[] = [
  { id: "constants", label: "" },
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
 *
 * 【なぜツール行がパネルの「下」にあるか】上に置くと、開いたパネルの高さ（`xⁿ` は1行・`f(x)` と
 * `ABC` は3行・`αβ` はタブ＋3行）ぶんツール行そのものが上下に動き、**次に押したいツールのキーが
 * 押すたびに逃げる**（実機で指摘された）。キーパッドは画面の下端に固定なので、ツール行をその直上に
 * 置けば位置が変わらない。動くのはパネルの上端＝`middle`（結果カード）の高さだけで、そこは元々
 * 伸縮する場所。**この順序を入れ替えないこと。**
 */
export const ExpressionKeyboard = memo(function ExpressionKeyboard({
  language, layout, tool, onToolChange, onKey, onInsert, onPrefix, activePrefix = null, onMoveCaret, caretAtStart = false, caretAtEnd = false,
  isKeyDisabled, panelsDisabled = false, unitPanel, constants, constantActions, aboveKeypad, isOsKeyboardActive = false, onToggleOsKeyboard, style,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors, layout), [colors, layout]);
  const copy = COPY[language];
  const [symbolGroupId, setSymbolGroupId] = useState<FormulaCharacterGroupId>(FORMULA_CHARACTER_GROUPS[0].id);
  // 英字パネルの ⇧。**1文字ぶんではなく固定のトグル**——`MPa`・`kWh`・`GPa` のように大文字が
  // 続く単位記号が多く、1文字ごとに戻ると押し直しになる（実機で指摘された）。
  const [shift, setShift] = useState(false);

  const toolLabel = (id: KeyboardTool) =>
    id === "powers" ? copy.toolPowers : id === "constants" ? copy.toolConstants : id === "functions" ? copy.toolFunctions : id === "symbols" ? copy.toolSymbols : id === "alphabet" ? copy.toolAlphabet : copy.toolUnits;
  const symbolGroupLabel = (id: FormulaCharacterGroupId) =>
    id === "subscriptDigits" ? copy.subscriptDigits : id === "subscriptLetters" ? copy.subscriptLetters : id === "greekLower" ? copy.greekLower : copy.greekUpper;

  // 低い端末（`panelsScrollHorizontally`）ではパネルを折り返さず1行の横スクロールにする。
  // 3〜4行ぶんの縦は結果カードを押し潰すので、端に隠れたキーはスクロールで出す方を採る。
  const scrollPanels = layout.panelsScrollHorizontally;
  // **コンポーネントではなく描画関数にすること。** コンポーネントとして書くとレンダーのたびに
  // 新しい型になり、親が再レンダーするたびに React がパネルをアンマウントして作り直す。
  // 低い端末の横スクロールのパネルでは、1文字打つたびにスクロール位置が先頭へ戻る
  // （この部品は memo してあるが、親は毎レンダー新しい unitPanel を渡すので打鍵ごとに
  // 再レンダーされる）。CodeRabbitが#72で検出。
  const panelRows = (children: ReactNode) =>
    scrollPanels ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.panelScrollRow} style={styles.panelScroll}>
        {children}
      </ScrollView>
    ) : (
      <View style={styles.panelGrid}>{children}</View>
    );

  const renderPanel = () => {
    if (!tool || panelsDisabled) return null;
    if (tool === "powers") {
      return panelRows(POWER_KEYS.map((key) => (
        <View key={key.label} style={scrollPanels ? styles.scrollCell : styles.functionCell}>
          <Pressable accessibilityLabel={key.insert} hitSlop={KEY_CELL_PADDING} onPress={() => onInsert(key.insert)} style={({ pressed }) => [styles.panelGridKey, pressed && styles.pressed]}>
            <Text numberOfLines={1} style={styles.functionKeyText}>{key.label}</Text>
          </Pressable>
        </View>
      )));
    }
    if (tool === "constants") {
      // 数学定数（π・e）と、画面が渡す「今その式で使える名前」（電卓は保存済みの定数、ノートは
      // その手順から参照できるローカル定数と先行手順の記号）を1つのグリッドに並べる。
      // **中身は画面側が決める**——電卓とノートで「使える名前」が違うため。
      //
      // **π・e は編集モードでも従来どおり挿入する。** 保存された定数ではないので直しようが無く、
      // 押しても何も起きないキーを作らないため。
      const editing = Boolean(constantActions?.isEditing);
      const entries = [
        ...MATH_CONSTANT_KEYS.map((symbol) => ({ symbol, hint: undefined as string | undefined, editable: false })),
        ...(constants ?? []).map((entry) => ({ ...entry, editable: true })),
      ];
      const cells = entries.map((entry) => {
        const isEditTarget = editing && entry.editable;
        return (
          <View key={entry.symbol} style={scrollPanels ? styles.scrollCell : styles.functionCell}>
            <Pressable
              accessibilityLabel={isEditTarget ? `${copy.editConstants}: ${entry.symbol}` : entry.hint ? `${entry.symbol} ${entry.hint}` : entry.symbol}
              hitSlop={KEY_CELL_PADDING}
              onPress={() => (isEditTarget ? constantActions?.onEdit(entry.symbol) : onInsert(entry.symbol))}
              style={({ pressed }) => [styles.panelGridKey, isEditTarget && styles.panelGridKeyEditing, pressed && styles.pressed]}
            >
              <Text numberOfLines={1} style={styles.functionKeyText}>{entry.symbol}</Text>
              {entry.hint ? <Text numberOfLines={1} style={styles.panelKeyHint}>{entry.hint}</Text> : null}
            </Pressable>
          </View>
        );
      });
      if (constantActions) {
        // 編集モード中だけ「＋ 新しい定数」を出す。普段は挿入のためのパネルなので、定数が
        // 増えるほど末尾の＋が名前の列から遠ざかって邪魔になる。
        if (editing) {
          cells.push(
            <View key="__new__" style={scrollPanels ? styles.scrollCell : styles.functionCell}>
              <Pressable accessibilityLabel={copy.newConstant} hitSlop={KEY_CELL_PADDING} onPress={constantActions.onCreate} style={({ pressed }) => [styles.panelGridKey, styles.panelGridKeyEditing, pressed && styles.pressed]}>
                <Text numberOfLines={1} style={styles.functionKeyText}>＋</Text>
              </Pressable>
            </View>,
          );
        }
        cells.push(
          <View key="__edit__" style={scrollPanels ? styles.scrollCell : styles.functionCell}>
            <Pressable
              accessibilityLabel={editing ? copy.editConstantsDone : copy.editConstants}
              accessibilityState={{ selected: editing }}
              hitSlop={KEY_CELL_PADDING}
              onPress={constantActions.onToggleEditing}
              style={({ pressed }) => [styles.panelGridKey, editing && styles.panelGridKeyActive, pressed && styles.pressed]}
            >
              <IconSymbol name="pencil" size={16} color={editing ? colors.onPrimary : colors.primary} />
            </Pressable>
          </View>,
        );
      }
      if (!cells.length) return null;
      return panelRows(cells);
    }
    if (tool === "functions") {
      return panelRows(MATH_FUNCTION_KEYS.map((item) => (
        <View key={item} style={scrollPanels ? styles.scrollCell : styles.functionCell}>
          <Pressable accessibilityLabel={item} hitSlop={KEY_CELL_PADDING} onPress={() => onInsert(item)} style={({ pressed }) => [styles.panelGridKey, pressed && styles.pressed]}>
            <Text numberOfLines={1} style={styles.functionKeyText}>{item}</Text>
          </Pressable>
        </View>
      )));
    }
    if (tool === "symbols") {
      const group = FORMULA_CHARACTER_GROUPS.find((entry) => entry.id === symbolGroupId) ?? FORMULA_CHARACTER_GROUPS[0];
      return (
        <View>
          {panelRows(group.chars.map((char) => (
            <View key={char} style={scrollPanels ? styles.scrollCell : styles.symbolCell}>
              <Pressable accessibilityLabel={char} hitSlop={KEY_CELL_PADDING} onPress={() => onInsert(char)} style={({ pressed }) => [styles.panelGridKey, pressed && styles.pressed]}>
                <Text style={styles.panelKeyText}>{char}</Text>
              </Pressable>
            </View>
          )))}
          {/* **タブは文字のグリッドより下、ツール行のすぐ上に置く。** グループごとに行数が違う
              （下付き数字10個＝1行・ギリシャ小文字24個＝3行）ので、タブを上に置くと切り替えるたびに
              タブ自身が上下して次に押したいタブが逃げる。下に置けば固定の高さを持たせなくても動かず、
              行数の少ないグループでは余った縦を `middle`（結果カード）に返せる。
              ラベルは訳語ではなく中身の記号（`αβ`・`ΔΦ`）。訳した名前は4つ並べると行に収まらず、
              横スクロールにすると端のタブが隠れて何があるか分からない。名前は accessibilityLabel に残す。 */}
          <View style={styles.groupTabs}>
            {FORMULA_CHARACTER_GROUPS.map((entry) => (
              <Pressable accessibilityLabel={symbolGroupLabel(entry.id)} accessibilityState={{ selected: entry.id === symbolGroupId }} hitSlop={2} key={entry.id} onPress={() => setSymbolGroupId(entry.id)} style={({ pressed }) => [styles.groupTab, entry.id === symbolGroupId && styles.groupTabActive, pressed && styles.pressed]}>
                <Text numberOfLines={1} style={[styles.groupTabText, entry.id === symbolGroupId && styles.groupTabTextActive]}>{entry.tabLabel}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }
    if (tool === "alphabet") {
      if (scrollPanels) {
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.panelScrollRow} style={styles.panelScroll}>
            {ALPHABET_ROWS.flat().map((key) => {
              if (key === SHIFT_KEY) {
                return (
                  <View key={key} style={styles.scrollCell}>
                    <Pressable accessibilityLabel={copy.shift} accessibilityState={{ selected: shift }} hitSlop={KEY_CELL_PADDING} onPress={() => setShift((current) => !current)} style={({ pressed }) => [styles.panelGridKey, shift && styles.panelKeyActive, pressed && styles.pressed]}>
                      <Text style={[styles.panelKeyText, shift && styles.panelKeyTextActive]}>{SHIFT_KEY}</Text>
                    </Pressable>
                  </View>
                );
              }
              const label = shift && /^[a-z]$/.test(key) ? key.toUpperCase() : key;
              return (
                <View key={key} style={styles.scrollCell}>
                  <Pressable accessibilityLabel={label} hitSlop={KEY_CELL_PADDING} onPress={() => onInsert(label)} style={({ pressed }) => [styles.panelGridKey, pressed && styles.pressed]}>
                    <Text style={styles.panelKeyText}>{label}</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        );
      }
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
                const label = shift && /^[a-z]$/.test(key) ? key.toUpperCase() : key;
                return (
                  <Pressable accessibilityLabel={label} hitSlop={2} key={key} onPress={() => onInsert(label)} style={({ pressed }) => [styles.panelKey, pressed && styles.pressed]}>
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
      {renderPanel()}
      {/* ツール行はパネルの入口だけに絞る。キャレット移動（`◀ ▶`）はキーパッド本体へ移した——
          用途が違う（パネルを開かず式を直接動かす）うえ、ここに置くと枠を2つ食って
          1キーが窄くなる。 */}
      <View style={styles.toolRow}>
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
              <Text numberOfLines={1} style={[styles.toolKeyText, active && styles.toolKeyTextActive]}>{entry.id === "units" ? copy.unitsShort : entry.id === "constants" ? copy.constantsShort : entry.label}</Text>
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
      {aboveKeypad}
      <KeypadGrid caretAtEnd={caretAtEnd} caretAtStart={caretAtStart} colors={colors} copy={copy} isKeyDisabled={isKeyDisabled} onKey={onKey} onMoveCaret={onMoveCaret} styles={styles} />
    </View>
  );
});

type KeypadGridProps = {
  caretAtEnd: boolean;
  caretAtStart: boolean;
  colors: ThemeColorPalette;
  copy: Record<keyof typeof EN_COPY, string>;
  isKeyDisabled?: (key: string) => boolean;
  onKey: (key: string) => void;
  onMoveCaret: (delta: 1 | -1) => void;
  styles: ReturnType<typeof createStyles>;
};

/**
 * キーパッド本体。式を1文字打つたびに親が再レンダーされても、ここは props（進数モードの判定関数と
 * 固定参照のハンドラ）が変わらない限り作り直さない（電卓の実機で1打鍵あたり100ms超の主因だった）。
 */
const KeypadGrid = memo(function KeypadGrid({ caretAtEnd, caretAtStart, colors, copy, isKeyDisabled, onKey, onMoveCaret, styles }: KeypadGridProps) {
  const renderKey = (entry: ExpressionKey, half: boolean) => {
    const text = entry.insert ?? entry.label;
    const isOperator = OPERATOR_KEYS.has(entry.label);
    // キャレット移動は式を動かすだけなので、桁しか受け付けない進数入力モードでも使える。
    // 端に着いているときだけ押せなくする。
    const isCaret = entry.action !== undefined;
    const disabled = isCaret ? (entry.action === "caretLeft" ? caretAtStart : caretAtEnd) : (isKeyDisabled?.(text) ?? false);
    const label =
      entry.label === "⌫" ? copy.deleteKey
      : entry.label === "AC" ? copy.clearAllKey
      : entry.action === "caretLeft" ? copy.caretLeft
      : entry.action === "caretRight" ? copy.caretRight
      : entry.label;
    return (
      <Pressable
        accessibilityLabel={label}
        disabled={disabled}
        hitSlop={KEY_CELL_PADDING}
        key={entry.label}
        onPress={() => (entry.action ? onMoveCaret(entry.action === "caretLeft" ? -1 : 1) : onKey(text))}
        style={({ pressed }) => [styles.key, half && styles.keyHalf, isOperator && styles.keyOperator, isCaret && styles.keyCaret, disabled && styles.keyDisabled, pressed && styles.keyPressed]}
      >
        {entry.label === "⌫" ? (
          <IconSymbol name="delete.left" size={20} color={colors.muted} />
        ) : entry.action ? (
          <IconSymbol name={entry.action === "caretLeft" ? "chevron.left" : "chevron.right"} size={18} color={colors.muted} />
        ) : (
          <Text numberOfLines={1} style={[styles.keyText, isOperator && styles.keyTextAccent]}>{entry.label}</Text>
        )}
      </Pressable>
    );
  };
  return (
    <View style={styles.keypad}>
      {EXPRESSION_CELLS.map((cell, index) => (
        <View key={index} style={styles.keyCell}>
          {"split" in cell ? (
            // 括弧だけは1セルを半分ずつ分け合う（`(` と `)` は必ず対で打つので隣り合っていた方が早い）。
            <View style={styles.keySplit}>{cell.split.map((entry) => renderKey(entry, true))}</View>
          ) : (
            renderKey(cell.key, false)
          )}
        </View>
      ))}
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
  // 折り返すグリッド。セルが幅を持ち、キーはその中いっぱいに広がる（キーパッド本体と同じ組み方）。
  // 余った枠は空けたままにするので、最終行のキーだけ広くなることがない。
  panelGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: layout.keyRowGap - 2 - KEY_CELL_PADDING, marginHorizontal: -KEY_CELL_PADDING },
  functionCell: { padding: KEY_CELL_PADDING, width: `${100 / FUNCTION_KEY_COLUMNS}%` },
  // 低い端末で1行に畳むときのセル。幅は内容なりで、最低限タップできる大きさを保つ。
  panelScroll: { flexGrow: 0, flexShrink: 0, marginBottom: layout.keyRowGap - 2 - KEY_CELL_PADDING, marginHorizontal: -KEY_CELL_PADDING },
  panelScrollRow: { alignItems: "center" },
  scrollCell: { padding: KEY_CELL_PADDING },
  symbolCell: { padding: KEY_CELL_PADDING, width: `${100 / SYMBOL_KEY_COLUMNS}%` },
  panelGridKey: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, justifyContent: "center", minHeight: layout.keyRowMinHeight, minWidth: layout.keyRowMinHeight, paddingHorizontal: 8 },
  // 「定数」パネルの編集モード。押すと**式に入らず編集シートが開く**ので、見た目でそれと分かる
  // 必要がある（同じ形のチップのまま挙動だけ変えると、入れたつもりでシートが出る）。枠を強調する
  // だけに留めるのは、名前そのものは読めたままにしたいため。
  panelGridKeyEditing: { backgroundColor: colors.surface, borderColor: colors.primary, borderStyle: "dashed" },
  // 編集モードのトグル自体（鉛筆）が点いている状態。
  panelGridKeyActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  // 関数は `atan2(` の6文字が入る必要があるので、記号より1段小さい字で組む。
  functionKeyText: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  panelKeyHint: { color: colors.muted, fontSize: 9, marginTop: 1 },
  groupTabs: { flexDirection: "row", gap: layout.keyRowGap, marginBottom: layout.keyRowGap - 2 },
  groupTab: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 8, flex: 1, justifyContent: "center", minHeight: layout.keyRowMinHeight, minWidth: 0 },
  groupTabActive: { backgroundColor: colors.primaryFill },
  groupTabText: { color: colors.foreground, fontFamily: mono, fontSize: 15, fontWeight: "800" },
  groupTabTextActive: { color: colors.onPrimary },
  unitPanel: {},
  keypad: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -KEY_CELL_PADDING },
  keyCell: { padding: KEY_CELL_PADDING, width: `${100 / EXPRESSION_KEY_COLUMNS}%` },
  key: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, height: layout.keyHeight, justifyContent: "center" },
  keyOperator: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder },
  // **キャレット移動は加減乗除と用途が違う**（式に文字を足さず、入れる場所を動かすだけ）ので、
  // 演算子の青とは別のグレー系にする。`⌫` と同じ「編集する側のキー」に見えるのが狙い。
  keyCaret: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
  // 括弧の2つ割り。セルの中で横に並べ、隙間だけ空ける。
  keySplit: { flexDirection: "row", gap: 2 },
  keyHalf: { flex: 1 },
  keyText: { color: colors.foreground, fontFamily: mono, fontSize: 18, fontWeight: "600" },
  // `×10ⁿ` のようにラベルが長いキーだけ字を落とす（6列では18pxだと収まらない）。
  keyTextSmall: { fontSize: 13, fontWeight: "800" },
  keyTextAccent: { color: colors.primary },
  keyPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  keyDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.72 },
}, layout.fontFactor));
