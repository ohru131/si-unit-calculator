import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExpressionKeyboard } from "@/components/ui/expression-keyboard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UnitRail } from "@/components/ui/unit-rail";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { useKeyboardHeight } from "@/hooks/use-keyboard-height";
import { useUnitRail } from "@/hooks/use-unit-rail";
import { resolveCalculatorLayout } from "@/lib/calculator-layout";
import { evaluateConstantDraft } from "@/lib/constant-editor";
import { type KeyboardTool } from "@/lib/expression-keyboard";
import { type AppLanguage } from "@/lib/i18n";
import { backspaceInField, insertKeypadText, moveCaretInField } from "@/lib/notebook-keypad";
import { resolveSheetKeyboardLayout } from "@/lib/sheet-layout";
import { unitErrorMessage } from "@/lib/unit-errors";
import { analyzeExpression, prefixEntryStillValid, replaceExpressionRange, resolvePrefixKeyPress, shouldResetPaletteForKey, type PrefixEntry } from "@/lib/unit-input";
import { formatQuantity, type SavedConstant, type UnitSystem } from "@/lib/units";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_COPY = {
  title: "Constant", titleNew: "New constant",
  symbolLabel: "Name", expressionLabel: "Value", preview: "Value",
  symbolPlaceholder: "R", expressionPlaceholder: "4.7kΩ",
  invalidSymbol: "Start the name with a letter, then letters or digits (for example R1).",
  save: "Save", saving: "Saving…", close: "Close", delete: "Delete", cancel: "Cancel", keyboard: "ABC keyboard",
  deleteConfirm: "Delete this constant? Expressions that use it will stop working.",
} as const;
const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = {
  en: EN_COPY,
  ja: {
    title: "定数", titleNew: "新しい定数",
    symbolLabel: "名前", expressionLabel: "値", preview: "値",
    symbolPlaceholder: "R", expressionPlaceholder: "4.7kΩ",
    invalidSymbol: "名前は英字で始め、以降は英数字にしてください（例：R1）。",
    save: "保存", saving: "保存中…", close: "閉じる", delete: "削除", cancel: "キャンセル", keyboard: "文字キーボード",
    deleteConfirm: "この定数を削除しますか？これを使っている式は計算できなくなります。",
  },
  es: {
    title: "Constante", titleNew: "Nueva constante",
    symbolLabel: "Nombre", expressionLabel: "Valor", preview: "Valor",
    symbolPlaceholder: "R", expressionPlaceholder: "4.7kΩ",
    invalidSymbol: "El nombre debe empezar por una letra y seguir con letras o cifras (por ejemplo R1).",
    save: "Guardar", saving: "Guardando…", close: "Cerrar", delete: "Eliminar", cancel: "Cancelar", keyboard: "Teclado de letras",
    deleteConfirm: "¿Eliminar esta constante? Las expresiones que la usan dejarán de funcionar.",
  },
  "pt-BR": {
    title: "Constante", titleNew: "Nova constante",
    symbolLabel: "Nome", expressionLabel: "Valor", preview: "Valor",
    symbolPlaceholder: "R", expressionPlaceholder: "4.7kΩ",
    invalidSymbol: "O nome deve começar com uma letra e seguir com letras ou algarismos (por exemplo R1).",
    save: "Salvar", saving: "Salvando…", close: "Fechar", delete: "Excluir", cancel: "Cancelar", keyboard: "Teclado de letras",
    deleteConfirm: "Excluir esta constante? As expressões que a usam deixarão de funcionar.",
  },
  de: {
    title: "Konstante", titleNew: "Neue Konstante",
    symbolLabel: "Name", expressionLabel: "Wert", preview: "Wert",
    symbolPlaceholder: "R", expressionPlaceholder: "4.7kΩ",
    invalidSymbol: "Der Name beginnt mit einem Buchstaben, danach Buchstaben oder Ziffern (zum Beispiel R1).",
    save: "Speichern", saving: "Speichert…", close: "Schließen", delete: "Löschen", cancel: "Abbrechen", keyboard: "Buchstabentastatur",
    deleteConfirm: "Diese Konstante löschen? Ausdrücke, die sie verwenden, funktionieren dann nicht mehr.",
  },
  fr: {
    title: "Constante", titleNew: "Nouvelle constante",
    symbolLabel: "Nom", expressionLabel: "Valeur", preview: "Valeur",
    symbolPlaceholder: "R", expressionPlaceholder: "4.7kΩ",
    invalidSymbol: "Le nom commence par une lettre, puis des lettres ou des chiffres (par exemple R1).",
    save: "Enregistrer", saving: "Enregistrement…", close: "Fermer", delete: "Supprimer", cancel: "Annuler", keyboard: "Clavier de lettres",
    deleteConfirm: "Supprimer cette constante ? Les expressions qui l’utilisent ne fonctionneront plus.",
  },
};

type Props = {
  visible: boolean;
  language: AppLanguage;
  locale: string;
  unitSystem: UnitSystem;
  resultDigits: number;
  /** 編集対象。渡さなければ新規作成。 */
  constant?: SavedConstant;
  /** 保存済みの全定数。値の欄から参照できる名前（「定数」パネル）と、名前の重複判定に使う。 */
  constants: readonly SavedConstant[];
  onSave: (symbol: string, expression: string) => Promise<unknown>;
  /** 渡すと削除ボタンを出す（新規作成のときは呼び出し側が渡さない）。 */
  onDelete?: (symbol: string) => Promise<unknown> | void;
  onClose: () => void;
};

/**
 * グローバル定数の編集シート。**電卓タブとライブラリタブが同じものを使う。**
 *
 * 【なぜ共用にしたか】以前は定数を足す口がライブラリタブの中にしか無く、「電卓で使うものなのに
 * どこで編集するのか分からない」と報告された。電卓のキーボードの「定数」パネルからも開けるように
 * したが、2つの画面が別々のシートを持つと、片方にだけ入る改良（アプリ内キーパッド・キーボード避け）が
 * 必ず生まれる。フォームはここ1箇所に閉じる。
 *
 * 【入力手段】値の欄は**アプリ内キーパッド**（電卓と共用の ExpressionKeyboard ＋ UnitRail）で打つ。
 * 旧シートは OS のキーボードが唯一の入力手段で、単位記号（Ω・µ・²）を打てないうえ、**Modal は
 * Android の adjustResize の外に出るのでキーボードが入力欄に重なっていた**（実機で報告）。
 * 名前の欄だけは英字が主なので OS のキーボードに任せ、そのときはキーパッドを畳んでシートごと
 * キーボードの上へ逃がす（lib/sheet-layout.ts）。
 */
export function ConstantEditorSheet({ visible, language, locale, unitSystem, resultDigits, constant, constants, onSave, onDelete, onClose }: Props) {
  const colors = useColors();
  const { fontScale, height: windowHeight } = useWindowDimensions();
  const layout = useMemo(() => resolveCalculatorLayout({ fontScale, height: windowHeight }), [fontScale, windowHeight]);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = COPY[language];
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  // 初期値は**マウント時に1回だけ**。開き直したときに前の入力が残らないのは、呼び出し側が
  // 開くたびに `key` を変えてこの部品を作り直すから（NotebookEditorSheet と同じ形）。
  // effect で props を state へ写す形にすると `react-hooks/set-state-in-effect` に当たるうえ、
  // 「開いている最中に props が変わったら入力中の値が巻き戻る」という別の穴が開く。
  const [symbol, setSymbol] = useState(constant?.symbol ?? "");
  const [expression, setExpression] = useState(constant?.expression ?? "");
  const [selection, setSelection] = useState(() => ({ start: constant?.expression.length ?? 0, end: constant?.expression.length ?? 0 }));
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [tool, setTool] = useState<KeyboardTool | null>("units");
  const [prefixEntry, setPrefixEntry] = useState<PrefixEntry | null>(null);
  // OS のキーボードを出している欄。値の欄は既定では出さず（`showSoftInputOnFocus`）、
  // 名前の欄は英字なので従来どおり出す。
  const [osKeyboardField, setOsKeyboardField] = useState<"symbol" | "expression" | null>(null);
  // 削除の確認。**確認をシートの中に置くことで、どの画面から開いても同じ操作になる**
  // （以前はライブラリ画面だけが確認を出し、電卓から消すと一発で消えていた）。
  const [confirmDelete, setConfirmDelete] = useState(false);
  const expressionRef = useRef<TextInput | null>(null);

  // Android の戻るボタンでキーボードを閉じたとき、⌨ キーの点灯だけが残らないようにする。
  // 「キーボードが閉じた」は外部システムからの通知なので、**effect の中で直接 setState する**
  // のではなくリスナーのコールバックで受ける（電卓の keyboardDidHide と同じ形）。
  useEffect(() => {
    const hidden = Keyboard.addListener("keyboardDidHide", () => setOsKeyboardField(null));
    return () => hidden.remove();
  }, []);

  // 自分自身は参照できない（`R = R * 2` は解決できない）ので、編集中の記号は候補から外す。
  const otherConstants = useMemo(() => constants.filter((item) => item.symbol !== (constant?.symbol ?? symbol.trim())), [constant?.symbol, constants, symbol]);
  const draft = evaluateConstantDraft(symbol, expression, otherConstants);
  const draftMessage = draft.hasInvalidSymbol
    ? copy.invalidSymbol
    : draft.error
      ? unitErrorMessage(draft.error, language) ?? draft.error.message
      : "";
  // 保存に失敗したときのメッセージは下書きの診断より優先して出す（押した操作の結果だから）。
  const message = saveError || draftMessage;

  // ---- 単位パレット（電卓・計算ノートと共用） ----
  const railIdentifiers = otherConstants.map((item) => item.symbol);
  const railAnalysis = analyzeExpression(expression, railIdentifiers);
  const unitRail = useUnitRail({
    analysis: railAnalysis,
    expression,
    identifiers: railIdentifiers,
    prefixEntry,
    selection,
    unitSystem,
  });

  const applyExpression = (next: string, caret: number) => {
    setExpression(next);
    setSelection({ start: caret, end: caret });
    setSaveError("");
  };

  const insertText = (text: string, asPrefix = false) => {
    const { expression: next, combinedCaret } = insertKeypadText("", expression, selection.start, selection.end, text);
    applyExpression(next, combinedCaret);
    const start = combinedCaret - text.length;
    setPrefixEntry(asPrefix && start >= 0 ? { start, end: start + text.length, prefix: text } : null);
  };

  // 接頭語キーは電卓と同じトグル（同じキーで取り消し・別のキーで差し替え）。判断は純関数側。
  const handlePrefix = (prefix: string) => {
    const toggled = resolvePrefixKeyPress({ expression, selection, prefixEntry, key: prefix });
    if (!toggled) { insertText(prefix, true); return; }
    applyExpression(toggled.expression, toggled.caret);
    setPrefixEntry(toggled.prefixEntry);
  };

  // 単位チップ。書き換える範囲は、範囲選択があればそれを最優先し、無ければレールが案内している
  // 範囲（unitRail.target）をそのまま使う——画面に出ている案内と実際に書き換わる場所を必ず一致させる。
  const applyRailUnit = (unitSymbol: string) => {
    const range = selection.start === selection.end
      ? { start: Math.min(unitRail.target.start, expression.length), end: Math.min(unitRail.target.end, expression.length) }
      : { start: Math.min(selection.start, selection.end), end: Math.max(selection.start, selection.end) };
    applyExpression(replaceExpressionRange(expression, range.start, range.end, unitSymbol), range.start + unitSymbol.length);
    setPrefixEntry(null);
  };

  const handleKey = (key: string) => {
    if (key === "⌫") {
      const result = backspaceInField("", expression, selection.start, selection.end);
      if (!result) return;
      applyExpression(result.expression, result.combinedCaret);
      setPrefixEntry(null);
      return;
    }
    if (key === "AC") {
      applyExpression("", 0);
      setPrefixEntry(null);
      unitRail.reset();
      return;
    }
    // 演算子・括弧・関数のキーはカテゴリの選択を「候補」へ戻す（電卓と同じ。項が変われば
    // さっきまでのカテゴリは当てにならない）。
    if (shouldResetPaletteForKey(key)) unitRail.reset();
    insertText(key);
  };

  const handleMoveCaret = (delta: 1 | -1) => {
    setSelection(moveCaretInField("", expression, selection.start, selection.end, delta));
    setPrefixEntry(null);
  };

  /**
   * 値の欄で OS のキーボードを出す／閉じる。**出すときは一度 blur してから遅らせて focus する**
   * ——その欄は利用者が直前にタップしていて既にフォーカス中なので、そのまま focus() を呼んでも
   * RN は「既にフォーカス済み」と見て何もせず、showSoftInputOnFocus を true にしても表示要求が
   * 出ない（計算ノートの値欄で踏んだのと同じ）。
   */
  const toggleOsKeyboard = () => {
    if (osKeyboardField === "expression") {
      setOsKeyboardField(null);
      expressionRef.current?.blur();
      return;
    }
    setOsKeyboardField("expression");
    expressionRef.current?.blur();
    setTimeout(() => expressionRef.current?.focus(), 50);
  };

  const handleSave = async () => {
    if (!draft.canSave || isSaving) return;
    setIsSaving(true);
    setSaveError("");
    try {
      await onSave(draft.symbol, draft.expression);
      onClose();
    } catch (cause) {
      // エンジンのエラー（UnitError）は現在の言語で出す。ストアのエラー（a1 の予約・単位記号との
      // 衝突）は素の Error なので message をそのまま出す。
      setSaveError(cause instanceof Error ? (unitErrorMessage(cause, language) ?? cause.message) : copy.save);
    } finally {
      setIsSaving(false);
    }
  };

  const rail = <UnitRail language={language} onApply={applyRailUnit} state={unitRail} />;
  const keyboardConstants = useMemo(() => otherConstants.map((item) => ({ symbol: item.symbol, hint: item.expression })), [otherConstants]);
  const previewText = draft.quantity ? formatQuantity(draft.quantity, undefined, locale, resultDigits) : "";

  return (
    <>
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, resolveSheetKeyboardLayout(keyboardHeight, windowHeight, insets.bottom)]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{constant ? copy.title : copy.titleNew}</Text>
            <View style={styles.headerButtons}>
              {constant && onDelete ? (
                <Pressable accessibilityLabel={copy.delete} onPress={() => setConfirmDelete(true)} style={({ pressed }) => [styles.headerButton, pressed && styles.iconPressed]}>
                  <IconSymbol name="trash" size={19} color={colors.error} />
                </Pressable>
              ) : null}
              <Pressable accessibilityLabel={copy.close} onPress={onClose} style={({ pressed }) => [styles.headerButton, pressed && styles.iconPressed]}>
                <IconSymbol name="xmark" size={19} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.body}>
            <Text style={styles.fieldLabel}>{copy.symbolLabel}</Text>
            <TextInput
              value={symbol}
              onChangeText={(next) => { setSymbol(next); setSaveError(""); }}
              onFocus={() => setOsKeyboardField("symbol")}
              placeholder={copy.symbolPlaceholder}
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>{copy.expressionLabel}</Text>
            <TextInput
              ref={expressionRef}
              value={expression}
              onChangeText={(next) => { setExpression(next); setSaveError(""); setPrefixEntry(null); }}
              selection={selection}
              onSelectionChange={(event) => {
                const next = event.nativeEvent.selection;
                setSelection(next);
                setPrefixEntry((current) => (prefixEntryStillValid(current, expression, next) ? current : null));
              }}
              onFocus={() => setOsKeyboardField((current) => (current === "expression" ? current : null))}
              // **値の欄はタップしてもキーボードを出さない。** キャレットを置くだけにして、数字・
              // 演算子はアプリ内キーパッド、単位はレールで打つ。英字が要るときだけキーパッドの
              // ⌨ キーで呼び出す（Web は showSoftInputOnFocus を持たず、物理キーボードで打てる）。
              showSoftInputOnFocus={Platform.OS === "web" ? undefined : osKeyboardField === "expression"}
              placeholder={copy.expressionPlaceholder}
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            {previewText ? (
              <Text style={styles.preview}>= {previewText}</Text>
            ) : null}
            {message ? <Text style={styles.error}>{message}</Text> : null}
            <Pressable disabled={!draft.canSave || isSaving} onPress={() => void handleSave()} style={({ pressed }) => [styles.saveButton, (!draft.canSave || isSaving) && styles.saveButtonDisabled, pressed && styles.buttonPressed]}>
              <Text style={styles.saveText}>{isSaving ? copy.saving : copy.save}</Text>
            </Pressable>
          </ScrollView>

          {/* 名前の欄を編集している間はキーパッドを畳む（OS のキーボードの直上にキーまで積むと
              入力欄が残らない）。単位レールは値の欄専用なので一緒に畳む。 */}
          {osKeyboardField === "symbol" ? null : (
            <ExpressionKeyboard
              language={language}
              layout={layout}
              tool={tool}
              onToolChange={setTool}
              onKey={handleKey}
              onInsert={insertText}
              onPrefix={handlePrefix}
              activePrefix={unitRail.activePrefix}
              onMoveCaret={handleMoveCaret}
              unitPanel={rail}
              constants={keyboardConstants}
              isOsKeyboardActive={osKeyboardField === "expression"}
              onToggleOsKeyboard={Platform.OS === "web" ? undefined : toggleOsKeyboard}
            />
          )}
        </View>
      </View>
    </Modal>

    {/* 確認ダイアログはシートの Modal の**兄弟**として置く（入れ子にすると iOS で表示が不安定）。
        電卓画面が単位ピッカーの Modal と ConfirmDialog を並べているのと同じ形。 */}
    <ConfirmDialog
      visible={confirmDelete}
      title={copy.delete}
      message={copy.deleteConfirm}
      cancelLabel={copy.cancel}
      confirmLabel={copy.delete}
      destructive
      onCancel={() => setConfirmDelete(false)}
      onConfirm={() => {
        setConfirmDelete(false);
        if (constant && onDelete) void onDelete(constant.symbol);
      }}
    />
    </>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  backdrop: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" },
  // paddingBottom / maxHeight は resolveSheetKeyboardLayout が上書きする。
  // maxHeight の "86%" は SHEET_MAX_HEIGHT_RATIO と同じ値にすること。
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "86%", paddingHorizontal: 18, paddingTop: 10 },
  handle: { alignSelf: "center", backgroundColor: colors.border, borderRadius: 3, height: 5, width: 42 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingBottom: 8, paddingTop: 12 },
  headerButtons: { flexDirection: "row", gap: 8 },
  headerButton: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 17, height: 34, justifyContent: "center", width: 34 },
  title: { color: colors.foreground, fontSize: 19, fontWeight: "800" },
  // 値の欄・名前の欄とキーパッドの間で縦を取り合うので、中身だけをスクロールさせる。
  body: { flexShrink: 1 },
  fieldLabel: { color: colors.foreground, fontSize: 12, fontWeight: "700", marginBottom: 5, marginTop: 10 },
  // **枠と高さで「押せる場所」を見せること。** 下線だけの欄は入力欄に見えず、当たり判定も狭い
  // （計算ノートの手順の式欄で実際に「どこを押せばいいか分からない」と報告された）。
  input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.foreground, fontFamily: mono, fontSize: 16, minHeight: 46, paddingHorizontal: 13 },
  preview: { color: colors.primary, fontFamily: mono, fontSize: 14, fontWeight: "700", marginTop: 9 },
  error: { color: colors.error, fontSize: 12, lineHeight: 18, marginTop: 9 },
  saveButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 13, justifyContent: "center", marginBottom: 10, marginTop: 14, minHeight: 46 },
  saveButtonDisabled: { opacity: 0.45 },
  saveText: { color: colors.onPrimary, fontSize: 15, fontWeight: "700" },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  iconPressed: { opacity: 0.55 },
});
