import { useMemo, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LatexView } from "@/components/ui/latex-view";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type CalculationNotebook, type CalculationNoteStep, type NotebookLocalConstant } from "@/lib/calculator-store";
import { type AppLanguage } from "@/lib/i18n";
import { getLocalConstantFieldSuggestions, getStepFieldSuggestions, insertConstantSymbol, mapCombinedSelectionToExpressionRange } from "@/lib/notebook-constant-suggestions";
import { evaluateNotebookSteps, formatNameValue, normalizeStepForSave, parseNameValue, resolveNotebookLocalConstants, trimResultSymbol } from "@/lib/notebook-engine";
import { resolveNotebookStepDisplay } from "@/lib/notebook-export-model";
import { nextStepNamePatch, stepDisplayTitle } from "@/lib/notebook-step-title";
import { getUnitInsertionRange, replaceExpressionRange } from "@/lib/unit-input";
import { compatibleUnitOptions, compatibleUnitOptionsFromHints } from "@/lib/unit-options";
import { type MeasuringStandard, type SavedConstant, type UnitSystem } from "@/lib/units";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_COPY = {
  edit: "Edit", save: "Save values", copy: "Copy", copied: "Copied",
  formulas: "Formula", inputs: "Inputs", results: "Results", noInputs: "This notebook has no local constants.", noSteps: "This notebook has no steps yet.",
  si: "SI base", referenceHint: "Use {symbol} in a later step.",
  pin: "Pin to calculator", unpin: "Unpin from calculator",
  invalidConstantName: "Enter each constant as name=value (e.g. v0=5m/s).",
  invalidStepName: "Enter each step as name=expression (e.g. v=v0+a*t), or remove the \"=\" to leave it unnamed.",
  saveFailed: "Could not save. Please try again.",
  noStepsError: "This notebook needs at least one step.",
  constantsRailLabel: "Constants",
  insertConstant: "Insert",
  back: "Back",
  switchTitle: "Unsaved changes",
  switchMessage: "This notebook has values you haven't saved. Switching notebooks discards them.",
  switchDiscard: "Discard and switch",
  cancel: "Cancel",
} as const;
const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = {
  en: EN_COPY,
  ja: {
    edit: "編集", save: "値を保存", copy: "コピー", copied: "コピーしました",
    formulas: "数式", inputs: "定数（入力値）", results: "結果", noInputs: "このノートにはローカル定数がありません。", noSteps: "このノートにはまだ手順がありません。",
    si: "SI標準", referenceHint: "後の手順で {symbol} として使えます。",
    pin: "電卓画面にピン留め", unpin: "ピン留めを解除",
    invalidConstantName: "定数は「名前＝値」の形式（例：v0=5m/s）で入力してください。",
    invalidStepName: "手順は「名前＝式」の形式（例：v=v0+a*t）で入力するか、「＝」を外して名前なしにしてください。",
    saveFailed: "保存できませんでした。もう一度お試しください。",
    noStepsError: "手順が最低1つ必要です。",
    constantsRailLabel: "定数",
    insertConstant: "挿入",
    back: "戻る",
    switchTitle: "保存していない変更があります",
    switchMessage: "このノートには保存していない値があります。ノートを切り替えると破棄されます。",
    switchDiscard: "破棄して切り替え",
    cancel: "キャンセル",
  },
  es: {
    edit: "Editar", save: "Guardar valores", copy: "Copiar", copied: "Copiado",
    formulas: "Fórmula", inputs: "Entradas", results: "Resultados", noInputs: "Este cuaderno no tiene constantes locales.", noSteps: "Este cuaderno todavía no tiene pasos.",
    si: "SI base", referenceHint: "Usa {symbol} en un paso posterior.",
    pin: "Fijar en la calculadora", unpin: "Quitar de fijados",
    invalidConstantName: "Escribe cada constante como nombre=valor (por ejemplo, v0=5m/s).",
    invalidStepName: "Escribe cada paso como nombre=expresión (por ejemplo, v=v0+a*t), o quita el \"=\" para dejarlo sin nombre.",
    saveFailed: "No se pudo guardar. Inténtalo de nuevo.",
    noStepsError: "Este cuaderno necesita al menos un paso.",
    constantsRailLabel: "Constantes",
    insertConstant: "Insertar",
    back: "Atrás",
    switchTitle: "Cambios sin guardar",
    switchMessage: "Este cuaderno tiene valores que no has guardado. Al cambiar de cuaderno se descartan.",
    switchDiscard: "Descartar y cambiar",
    cancel: "Cancelar",
  },
  "pt-BR": {
    edit: "Editar", save: "Salvar valores", copy: "Copiar", copied: "Copiado",
    formulas: "Fórmula", inputs: "Entradas", results: "Resultados", noInputs: "Este caderno não tem constantes locais.", noSteps: "Este caderno ainda não tem etapas.",
    si: "SI base", referenceHint: "Use {symbol} em uma etapa posterior.",
    pin: "Fixar na calculadora", unpin: "Desafixar",
    invalidConstantName: "Digite cada constante como nome=valor (por exemplo, v0=5m/s).",
    invalidStepName: "Digite cada etapa como nome=expressão (por exemplo, v=v0+a*t), ou remova o \"=\" para deixar sem nome.",
    saveFailed: "Não foi possível salvar. Tente novamente.",
    noStepsError: "Este caderno precisa de pelo menos uma etapa.",
    constantsRailLabel: "Constantes",
    insertConstant: "Inserir",
    back: "Voltar",
    switchTitle: "Alterações não salvas",
    switchMessage: "Este caderno tem valores que você não salvou. Trocar de caderno descarta essas alterações.",
    switchDiscard: "Descartar e trocar",
    cancel: "Cancelar",
  },
  de: {
    edit: "Bearbeiten", save: "Werte speichern", copy: "Kopieren", copied: "Kopiert",
    formulas: "Formel", inputs: "Eingaben", results: "Ergebnisse", noInputs: "Dieses Rechenheft hat keine lokalen Konstanten.", noSteps: "Dieses Rechenheft hat noch keine Schritte.",
    si: "SI-Basis", referenceHint: "Verwende {symbol} in einem späteren Schritt.",
    pin: "Im Rechner anheften", unpin: "Anheften lösen",
    invalidConstantName: "Gib jede Konstante als Name=Wert ein (z. B. v0=5m/s).",
    invalidStepName: "Gib jeden Schritt als Name=Ausdruck ein (z. B. v=v0+a*t), oder entferne das \"=\", um ihn unbenannt zu lassen.",
    saveFailed: "Speichern fehlgeschlagen. Bitte erneut versuchen.",
    noStepsError: "Dieses Rechenheft braucht mindestens einen Schritt.",
    constantsRailLabel: "Konstanten",
    insertConstant: "Einfügen",
    back: "Zurück",
    switchTitle: "Nicht gespeicherte Änderungen",
    switchMessage: "Dieses Rechenheft hat Werte, die du nicht gespeichert hast. Beim Wechseln gehen sie verloren.",
    switchDiscard: "Verwerfen und wechseln",
    cancel: "Abbrechen",
  },
  fr: {
    edit: "Modifier", save: "Enregistrer les valeurs", copy: "Copier", copied: "Copié",
    formulas: "Formule", inputs: "Entrées", results: "Résultats", noInputs: "Ce carnet n'a pas de constante locale.", noSteps: "Ce carnet n'a pas encore d'étape.",
    si: "SI de base", referenceHint: "Utilisez {symbol} dans une étape suivante.",
    pin: "Épingler à la calculatrice", unpin: "Désépingler",
    invalidConstantName: "Saisissez chaque constante sous la forme nom=valeur (par exemple v0=5m/s).",
    invalidStepName: "Saisissez chaque étape sous la forme nom=expression (par exemple v=v0+a*t), ou retirez le \"=\" pour la laisser sans nom.",
    saveFailed: "Impossible d'enregistrer. Veuillez réessayer.",
    noStepsError: "Ce carnet nécessite au moins une étape.",
    constantsRailLabel: "Constantes",
    insertConstant: "Insérer",
    back: "Retour",
    switchTitle: "Modifications non enregistrées",
    switchMessage: "Ce carnet contient des valeurs non enregistrées. Changer de carnet les abandonne.",
    switchDiscard: "Abandonner et changer",
    cancel: "Annuler",
  },
};

type Props = {
  language: AppLanguage;
  locale?: string;
  unitSystem: UnitSystem;
  measuringStandard: MeasuringStandard;
  notebook: CalculationNotebook;
  /** 戻る行に出すカテゴリ名。onBackを渡さない（戻る導線が無い）画面では使われない。 */
  categoryLabel?: string;
  globalConstants: SavedConstant[];
  /** 「カテゴリに戻る」の戻る行を出すかどうか。ノートタブ（app/(tabs)/notebook.tsx）には
   * 戻り先が無いため渡さない。渡された場合だけ戻る行を描画する。 */
  onBack?: () => void;
  onEdit: () => void;
  /** ピン留めの切り替え。ノートタブではピン留めボタン自体を出さない
   * （ピン留めはライブラリのノート一覧の役割にする方針のため）。渡された場合だけボタンを描画する。 */
  onTogglePinned?: () => void;
  /** ノート名（stickyTitle）をボタンにしたいときのハンドラ。ノートタブではこれでノート切替シートを開く。
   * 渡さなければ従来どおりただのテキストとして表示する。 */
  onTitlePress?: () => void;
  /** このノートを「使った」ときに呼ぶ（値の編集・表示単位の切り替え・結果のコピー・保存）。
   * 開いただけでは呼ばない。カテゴリを辿る途中に覗いたノートまで最近使ったノートに並ぶと、
   * 「作業していたノートへ戻る」導線として役に立たなくなるため。
   * 連打・1文字ごとの入力でも呼ばれるので、間引きは受け手側（pushNotebookHistoryEntry）に任せる。 */
  onUse: () => void;
  onSaveValues: (localConstants: NotebookLocalConstant[], steps: CalculationNoteStep[]) => Promise<void>;
};

export function NotebookDetail({ language, locale, unitSystem, measuringStandard, notebook, categoryLabel, globalConstants, onBack, onEdit, onTogglePinned, onTitlePress, onUse, onSaveValues }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [editableConstants, setEditableConstants] = useState<NotebookLocalConstant[]>(() => notebook.localConstants.map((item) => ({ ...item })));
  const [editableSteps, setEditableSteps] = useState<CalculationNoteStep[]>(() => notebook.steps.map((item) => ({ ...item })));
  const [unitOverrides, setUnitOverrides] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // mₒ・nₜ のようなUnicode下付き文字は端末キーボードで直接入力できないため、式フィールドの
  // 直下に「タップで挿入」ボタンの列を出す。フィールドごとに一意なキー（`constant:${id}` /
  // `step:${id}`）で、どのフィールドのレールを表示中かを管理する。
  // 【なぜフォーカスと連動させないか】以前は「フォーカス中のフィールド」に厳密に連動させ、onBlurで
  // 150ms後に消していた。しかしチップ（単位・定数）はTextInputの外にあるPressableなので、それを
  // 押した瞬間にonBlurが先に発火してレールごと消え、目的のボタンを押せなくなってしまう
  // （app/(tabs)/constants.tsxの記号レールで実際に踏んだ不具合と同じ構造）。そこで「最後にフォーカス
  // したフィールド」のレールを、別のフィールドにフォーカスが移るまで表示し続ける方式に変える。
  // TextInputのonBlurではもう何もしない（scheduleRailBlurは廃止）。
  const [activeRailKey, setActiveRailKey] = useState<string | null>(null);
  // 各フィールドの現在のキャレット/選択範囲（onSelectionChangeで更新）。ボタンをタップしたとき
  // 末尾ではなく、この位置に記号を挿し込むために使う。
  const [fieldSelections, setFieldSelections] = useState<Record<string, { start: number; end: number }>>({});
  // 記号を挿し込んだ直後だけ、TextInputのselection propでキャレットを挿入位置の直後へ強制する。
  // ユーザー自身の入力と衝突しないよう、反映されたら（onSelectionChange/onChangeTextで）すぐ手放す。
  const [forcedSelection, setForcedSelection] = useState<{ key: string; selection: { start: number; end: number } } | null>(null);
  // ノート名からノートを切り替えようとしたとき、未保存の値があれば確認を挟む。
  // 切り替えでnotebook propが変わると下のレンダー中の同期がeditableConstants/editableStepsを
  // 作り直すので、確認なしだと編集途中の値が黙って消える（保存バーは出ているが、ノート名は
  // すぐ上にあるので取り違えやすい）。
  const [pendingTitlePress, setPendingTitlePress] = useState(false);

  // notebook.localConstants / notebook.steps は編集シートで構成が変わることがあるため、
  // このコンポーネントが再マウントされずに新しいノートを受け取っても追従させる。
  // useEffectではなく、レンダー中に前回値と比較して直接調整する
  // （https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes）。
  const [syncedConstants, setSyncedConstants] = useState(notebook.localConstants);
  const [syncedSteps, setSyncedSteps] = useState(notebook.steps);
  if (notebook.localConstants !== syncedConstants || notebook.steps !== syncedSteps) {
    setSyncedConstants(notebook.localConstants);
    setSyncedSteps(notebook.steps);
    setEditableConstants(notebook.localConstants.map((item) => ({ ...item })));
    setEditableSteps(notebook.steps.map((item) => ({ ...item })));
    setSaveError("");
  }

  // 別のノートを開いたときは、前のノートで選んだ表示単位・レール状態を引き継がない。
  // このコンポーネントはノートを切り替えても（例: 別のピン留めチップを続けて開く）unmountされずに
  // props（notebook）だけが変わることがあるため、activeRailKey等が前のノートのフィールドキー
  // （idベース）を指したまま残ると、新しいノートの同じ位置のフィールドに古いキャレット位置が
  // 誤って復元されてしまう。
  // 上のlocalConstants/stepsの同期と同じく、useEffectではなくレンダー中に前回値と比較して直接
  // 調整する（effectの中で同期的にsetStateすると余計な再レンダーが1往復増えるうえ、このファイルは
  // 既にこの方式で揃えてある）。
  const [syncedNotebookId, setSyncedNotebookId] = useState(notebook.id);
  if (notebook.id !== syncedNotebookId) {
    setSyncedNotebookId(notebook.id);
    setUnitOverrides({});
    setActiveRailKey(null);
    setFieldSelections({});
    setForcedSelection(null);
  }

  const copy = COPY[language];

  const isDirty = useMemo(() => {
    const constantsDirty = editableConstants.some((item) => {
      const saved = notebook.localConstants.find((entry) => entry.id === item.id);
      return !saved || item.expression !== saved.expression || item.symbol !== saved.symbol;
    });
    const stepsDirty = editableSteps.some((step) => {
      const saved = notebook.steps.find((entry) => entry.id === step.id);
      return !saved || step.expression !== saved.expression || step.resultSymbol !== saved.resultSymbol || step.title !== saved.title;
    });
    return constantsDirty || stepsDirty;
  }, [editableConstants, editableSteps, notebook.localConstants, notebook.steps]);

  const { resolved, errors } = useMemo(() => resolveNotebookLocalConstants(editableConstants, globalConstants, language), [editableConstants, globalConstants, language]);
  const resolvedBySymbol = useMemo(() => new Map(resolved.map((item) => [item.symbol, item])), [resolved]);
  const pool = useMemo(() => [...globalConstants, ...resolved], [globalConstants, resolved]);
  // ローカル定数の式が他の定数記号を参照しているとき、その記号が単位記号と同じ綴りでも
  // 単位挿入で誤って上書きしないよう、既知の識別子として明示的に渡す。
  const constantIdentifiers = useMemo(
    () => [...globalConstants.map((item) => item.symbol), ...editableConstants.map((item) => item.symbol.trim()).filter(Boolean)],
    [editableConstants, globalConstants],
  );
  // measuringStandardはlib/units.tsのモジュール内状態を経由してcup/tbsp/tspの値に反映されるため、
  // 依存配列に含めて設定変更時に再計算させる（値自体は参照するだけで使わない）。
  const stepResults = useMemo(() => {
    void measuringStandard;
    return evaluateNotebookSteps(editableSteps, pool, language, [], locale);
  }, [locale, editableSteps, pool, measuringStandard, language]);

  const updateConstant = (id: string, patch: Partial<NotebookLocalConstant>) => {
    onUse();
    setEditableConstants((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const updateStepField = (id: string, patch: Partial<CalculationNoteStep>) => {
    onUse();
    setEditableSteps((current) => current.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  };

  // 表示単位の切り替えも「使った」に数える（値を変えなくても、単位を変えて読むのは作業だから）。
  const applyUnitOverride = (stepId: string, unit: string) => {
    onUse();
    setUnitOverrides((current) => ({ ...current, [stepId]: unit }));
  };

  // 「名前＝式」の名前部分を解析できなかった行（例：数字始まりの名前）は、symbolやresultSymbolが
  // 空のまま生テキスト（"="を含む）が残る。無言で保存してしまわず、はっきり教えてから保存を止める。
  const handleSave = async () => {
    // 保存中の連打で古いスナップショットが後勝ちしないよう、完了までは再入しない。
    if (isSaving) return;
    if (editableConstants.some((item) => !item.symbol.trim() && item.expression.trim())) { setSaveError(copy.invalidConstantName); return; }
    if (editableSteps.some((step) => !trimResultSymbol(step) && step.expression.includes("="))) { setSaveError(copy.invalidStepName); return; }
    // 空欄のまま残った行や前後の空白は、エディタ側のsaveNotebookと同じ基準で除いてから保存する。
    const normalizedConstants = editableConstants.filter((item) => item.symbol.trim() && item.expression.trim()).map((item) => ({ ...item, symbol: item.symbol.trim(), expression: item.expression.trim() }));
    const normalizedSteps = editableSteps.filter((step) => step.expression.trim()).map(normalizeStepForSave);
    if (!normalizedSteps.length) { setSaveError(copy.noStepsError); return; }
    setSaveError("");
    setIsSaving(true);
    try {
      await onSaveValues(normalizedConstants, normalizedSteps);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const copyResult = async (title: string, formatted: string) => {
    onUse();
    await Clipboard.setStringAsync(`${title} = ${formatted}`);
  };

  const constantFieldKey = (id: string) => `constant:${id}`;
  const stepFieldKey = (id: string) => `step:${id}`;
  const combinedCaretEnd = (name: string, expression: string) => formatNameValue(name, expression).length;

  // 記号ボタンをタップしたときに実際にキャレット/選択範囲があった位置へ挿入する。
  // まだ一度もonSelectionChangeが来ていないフィールド（フォーカス直後など）は末尾へ挿す。
  const insertSymbolIntoField = (key: string, name: string, expression: string, symbol: string, applyExpression: (next: string) => void) => {
    const fallback = combinedCaretEnd(name, expression);
    const selection = fieldSelections[key] ?? { start: fallback, end: fallback };
    const { expression: nextExpression, combinedCaret } = insertConstantSymbol(name, expression, selection.start, selection.end, symbol);
    applyExpression(nextExpression);
    const caretSelection = { start: combinedCaret, end: combinedCaret };
    setFieldSelections((current) => ({ ...current, [key]: caretSelection }));
    setForcedSelection({ key, selection: caretSelection });
  };

  /**
   * 単位チップも定数チップと同じくキャレット基準で反映する。範囲選択があればそこを置き換え、
   * 無ければキャレット上の単位を差し替える（数値の直後なら単位付け）。末尾決め打ちにすると、
   * 式の途中にカーソルを置いても最後の単位が書き換わってしまう。
   */
  const insertUnitIntoField = (key: string, name: string, expression: string, symbol: string, applyExpression: (next: string) => void) => {
    const fallback = combinedCaretEnd(name, expression);
    const selection = fieldSelections[key] ?? { start: fallback, end: fallback };
    const selected = mapCombinedSelectionToExpressionRange(name, expression, selection.start, selection.end);
    const range = selected.start === selected.end ? getUnitInsertionRange(expression, selected.start, constantIdentifiers) : selected;
    applyExpression(replaceExpressionRange(expression, range.start, range.end, symbol));
    const combinedCaret = (name ? name.length + 1 : 0) + range.start + symbol.length;
    const caretSelection = { start: combinedCaret, end: combinedCaret };
    setFieldSelections((current) => ({ ...current, [key]: caretSelection }));
    setForcedSelection({ key, selection: caretSelection });
  };

  // onSelectionChangeが発火した時点で強制キャレットの役目は終わり。ユーザー自身の操作と
  // 衝突しないよう、対象キーが一致するときだけここで手放す。
  const handleSelectionChange = (key: string, selection: { start: number; end: number }) => {
    setFieldSelections((current) => ({ ...current, [key]: selection }));
    setForcedSelection((current) => (current?.key === key ? null : current));
  };

  const renderConstantsRail = (key: string, symbols: string[], onInsert: (symbol: string) => void) => {
    if (activeRailKey !== key || !symbols.length) return null;
    return (
      <View>
        <Text style={styles.constantsRailLabel}>{copy.constantsRailLabel}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.unitRail}>
          {symbols.map((symbol) => (
            <Pressable
              key={symbol}
              accessibilityLabel={`${copy.insertConstant} ${symbol}`}
              onPress={() => onInsert(symbol)}
              style={({ pressed }) => [styles.unitChip, pressed && styles.pressed]}
            >
              <Text style={styles.unitChipText}>{symbol}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  // 戻る先のカテゴリ名が空になることは基本無いが、propsの契約上は空文字も来うるため
  // 「戻る」ラベルへフォールバックする（呼び出し側のcategoryLabel()は常に非空を返す）。
  const backLabel = categoryLabel || copy.back;

  return (
    <View style={styles.root}>
      <View style={styles.stickyHeader}>
        <View style={[styles.stickyTopRow, !onBack && styles.stickyTopRowEnd]}>
          {onBack ? (
            <Pressable onPress={onBack} style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
              <IconSymbol name="chevron.left" size={16} color={colors.primary} />
              <Text numberOfLines={1} style={styles.backLabel}>{backLabel}</Text>
            </Pressable>
          ) : null}
          <View style={styles.headerActions}>
            {onTogglePinned ? (
              <Pressable accessibilityLabel={notebook.pinned ? copy.unpin : copy.pin} onPress={onTogglePinned} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
                <IconSymbol name="pin.fill" size={16} color={notebook.pinned ? colors.primary : colors.muted} />
              </Pressable>
            ) : null}
            <Pressable accessibilityLabel={copy.edit} onPress={onEdit} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
              <IconSymbol name="pencil" size={16} color={colors.primary} />
            </Pressable>
          </View>
        </View>
        {onTitlePress ? (
          <Pressable accessibilityLabel={notebook.title} onPress={() => (isDirty ? setPendingTitlePress(true) : onTitlePress())} style={({ pressed }) => [styles.stickyTitleButton, pressed && styles.pressed]}>
            <Text numberOfLines={1} style={styles.stickyTitle}>{notebook.title}</Text>
            <IconSymbol name="chevron.right" size={13} color={colors.muted} />
          </Pressable>
        ) : (
          <Text numberOfLines={1} style={styles.stickyTitle}>{notebook.title}</Text>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        {notebook.description ? <Text style={styles.description}>{notebook.description}</Text> : null}

        {notebook.formulas.length ? (
          <>
            <Text style={styles.sectionLabel}>{copy.formulas}</Text>
            <View style={styles.formulaCard}>
              {notebook.formulas.map((formula) => (
                <View key={formula.id} style={styles.formulaRow}>
                  {formula.explanation ? <Text style={styles.formulaExplanation}>{formula.explanation}</Text> : null}
                  <LatexView latex={formula.latex} color={colors.foreground} fontSize={15} displayMode={false} />
                </View>
              ))}
            </View>
          </>
        ) : notebook.steps.some((step) => step.formulaLatex) ? (
          <>
            <Text style={styles.sectionLabel}>{copy.formulas}</Text>
            <View style={styles.formulaCard}>
              {notebook.steps.map((step) =>
                step.formulaLatex ? (
                  <View key={step.id} style={styles.formulaRow}>
                    <LatexView latex={step.formulaLatex} color={colors.foreground} fontSize={15} displayMode={false} />
                  </View>
                ) : null,
              )}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>{copy.inputs}</Text>
        {notebook.localConstants.length ? (
          <View style={styles.inputCard}>
            {editableConstants.map((item, constantIndex) => {
              // フォールバックの手掛かりはこの定数自身の式（例: "8.99e9N*m^2/C^2"）を渡す。
              // クーロンの法則のkのように次元に対応するグループが無くても、式中の単位から
              // SI接頭辞違いの候補を組み立てられる。
              const inputUnits = compatibleUnitOptions(resolvedBySymbol.get(item.symbol.trim())?.quantity, unitSystem, { expression: item.expression });
              const railKey = constantFieldKey(item.id);
              const isRailForced = forcedSelection?.key === railKey;
              return (
                <View key={item.id} style={styles.inputRow}>
                  <TextInput
                    value={formatNameValue(item.symbol, item.expression)}
                    onChangeText={(text) => {
                      const { name, value } = parseNameValue(text);
                      updateConstant(item.id, { symbol: name, expression: value });
                      setForcedSelection((current) => (current?.key === railKey ? null : current));
                    }}
                    onFocus={() => setActiveRailKey(railKey)}
                    onSelectionChange={(event) => handleSelectionChange(railKey, event.nativeEvent.selection)}
                    selection={isRailForced ? forcedSelection.selection : undefined}
                    editable={!isSaving}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.inputField, errors[item.id] && styles.inputFieldError]}
                  />
                  {renderConstantsRail(railKey, getLocalConstantFieldSuggestions(editableConstants, globalConstants, constantIndex), (symbol) =>
                    insertSymbolIntoField(railKey, item.symbol, item.expression, symbol, (nextExpression) => updateConstant(item.id, { expression: nextExpression })),
                  )}
                  {inputUnits.length ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.unitRail}>
                      {inputUnits.map((unitOption) => (
                        <Pressable
                          key={unitOption.symbol}
                          disabled={isSaving}
                          onPress={() => insertUnitIntoField(railKey, item.symbol, item.expression, unitOption.symbol, (nextExpression) => updateConstant(item.id, { expression: nextExpression }))}
                          style={({ pressed }) => [styles.unitChip, pressed && styles.pressed]}
                        >
                          <Text style={styles.unitChipText}>{unitOption.label}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                  {errors[item.id] ? <Text numberOfLines={1} style={styles.inputError}>{errors[item.id]}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyHint}>{copy.noInputs}</Text>
        )}

        <Text style={styles.sectionLabel}>{copy.results}</Text>
        {stepResults.length ? (
          <View style={styles.resultsList}>
            {stepResults.map((result, index) => {
              const isFinalStep = index === stepResults.length - 1;
              const overrideUnit = unitOverrides[result.step.id];
              const effectiveUnit = overrideUnit ?? result.step.targetUnit.trim();
              // フォールバックの手掛かりは「今表示に使っている単位 → この手順の式 → 実際に表示している
              // SI表記」の順に試す。式は symbol 参照ばかりで単位を含まないことが多く（例: v0*a）、
              // 表示単位も未指定だと、結果は 10 m²/s³ と出せているのに候補が0件になってしまう。
              // 候補が0件だと下の単位レールが丸ごと消え、SIへ戻すチップまで押せなくなる。
              const compatibleUnits = compatibleUnitOptionsFromHints(result.quantity, unitSystem, [effectiveUnit, result.step.expression, result.siFallback]);
              // 表示単位の上書き・次元不一致時のSI表記へのフォールバック・単位ラベルの見栄え差し替えは
              // lib/notebook-export-model.ts の resolveNotebookStepDisplay に一本化してある
              // （PDFエクスポートと画面がこの判断を別々に実装すると表示がズレるため）。
              const { value: displayValue, error: displayError } = resolveNotebookStepDisplay(result, overrideUnit, unitSystem, locale);
              const stepRailKey = stepFieldKey(result.step.id);
              return (
                <View key={result.step.id} style={[styles.resultCard, isFinalStep && result.quantity ? styles.resultCardFinal : null]}>
                  <TextInput
                    value={formatNameValue(result.step.resultSymbol ?? "", result.step.expression)}
                    onChangeText={(text) => {
                      const { name, value } = parseNameValue(text);
                      // 以前は名前があると問答無用でtitleを記号名(name)に置き換えていたが、それだと
                      // プリセットの翻訳済み表示タイトル（例:「速さ v」）を名前欄に触れただけで記号名だけに
                      // 潰してしまっていた。titleが「以前この仕組みで記号から自動生成されたもの」
                      // （空、または直前のresultSymbolと同じ）のときだけ追従させ、人間が書いた/
                      // プリセットのタイトルはそのまま保つ。
                      // 名前を消したとき（name=""）も同じ判定で追従させて空に戻す。ここでtitleを触らずに
                      // 残すと、記号だけが消えて古い記号名のタイトルが残り、自動生成の目印
                      // （title===resultSymbol）が失われる。すると次に別の記号を入れてももう自動生成扱いに
                      // ならず、タイトルが古い記号のまま固定されてしまう。空に戻ったtitleは
                      // stepDisplayTitleが式で埋めるので、見出しが空欄になることはない。
                      updateStepField(result.step.id, nextStepNamePatch(result.step, name, value));
                      setForcedSelection((current) => (current?.key === stepRailKey ? null : current));
                    }}
                    onFocus={() => setActiveRailKey(stepRailKey)}
                    onSelectionChange={(event) => handleSelectionChange(stepRailKey, event.nativeEvent.selection)}
                    selection={forcedSelection?.key === stepRailKey ? forcedSelection.selection : undefined}
                    editable={!isSaving}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.resultExpressionInput}
                  />
                  {renderConstantsRail(stepRailKey, getStepFieldSuggestions(editableConstants, globalConstants, editableSteps, index), (symbol) =>
                    insertSymbolIntoField(stepRailKey, result.step.resultSymbol ?? "", result.step.expression, symbol, (nextExpression) =>
                      updateStepField(result.step.id, { expression: nextExpression }),
                    ),
                  )}
                  <View style={styles.resultHeader}>
                    <View style={styles.resultHeaderMain}>
                      <Text style={styles.resultTitle}>{stepDisplayTitle(result.step.title, result.step.expression)}</Text>
                    </View>
                    {displayValue ? (
                      <Pressable accessibilityLabel={copy.copy} onPress={() => void copyResult(stepDisplayTitle(result.step.title, result.step.expression), displayValue!)} style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}>
                        <IconSymbol name="doc.on.doc" size={14} color={colors.primary} />
                      </Pressable>
                    ) : null}
                  </View>
                  {displayError && !displayValue ? (
                    <Text style={styles.resultError}>{displayError}</Text>
                  ) : (
                    <>
                      <Text numberOfLines={2} adjustsFontSizeToFit style={styles.resultValue}>{displayValue}</Text>
                      {displayError ? <Text style={styles.resultWarning}>{displayError}</Text> : null}
                    </>
                  )}
                  {compatibleUnits.length ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.unitRail}>
                      <Pressable onPress={() => applyUnitOverride(result.step.id, "")} style={({ pressed }) => [styles.unitChip, !effectiveUnit && styles.unitChipActive, pressed && styles.pressed]}>
                        <Text style={[styles.unitChipText, !effectiveUnit && styles.unitChipTextActive]}>{copy.si}</Text>
                      </Pressable>
                      {compatibleUnits.map((unitOption) => (
                        <Pressable key={unitOption.symbol} onPress={() => applyUnitOverride(result.step.id, unitOption.symbol)} style={({ pressed }) => [styles.unitChip, effectiveUnit === unitOption.symbol && styles.unitChipActive, pressed && styles.pressed]}>
                          <Text style={[styles.unitChipText, effectiveUnit === unitOption.symbol && styles.unitChipTextActive]}>{unitOption.label}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                  {!isFinalStep && result.quantity ? <Text style={styles.resultReferenceHint}>{copy.referenceHint.replace("{symbol}", result.symbol)}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyHint}>{copy.noSteps}</Text>
        )}
      </ScrollView>

      {isDirty ? (
        <View style={styles.saveFooter}>
          <Pressable disabled={isSaving} onPress={() => void handleSave()} style={({ pressed }) => [styles.saveBar, (pressed || isSaving) && styles.pressed]}>
            <Text style={styles.saveBarText}>{copy.save}</Text>
          </Pressable>
          {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
        </View>
      ) : null}

      <ConfirmDialog
        visible={pendingTitlePress}
        title={copy.switchTitle}
        message={copy.switchMessage}
        cancelLabel={copy.cancel}
        confirmLabel={copy.switchDiscard}
        destructive
        onCancel={() => setPendingTitlePress(false)}
        onConfirm={() => {
          setPendingTitlePress(false);
          onTitlePress?.();
        }}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  root: { flex: 1 },
  // 戻る・タイトル・ピン留め/編集ボタンは常に押せる位置に留めるため、スクロール外の固定行にする。
  // 端末幅が狭いと「戻る＋タイトル＋ボタン」を1行に詰めるとタイトルがほぼ読めなくなるため、
  // 上段（戻る・ピン留め/編集）と下段（ノート名）の2段に分けて、どちらも省略されないようにする。
  stickyHeader: { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, gap: 6, paddingBottom: 10, paddingTop: 4 },
  stickyTopRow: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  // onBackが無い（戻る行を出さない）画面では左側の要素が無くなるため、ボタン列を右端に寄せる。
  stickyTopRowEnd: { justifyContent: "flex-end" },
  scroll: { flex: 1 },
  container: { gap: 12, paddingBottom: 40, paddingTop: 12 },
  backRow: { alignItems: "center", flexDirection: "row", flexShrink: 1, gap: 4 },
  backLabel: { color: colors.primary, flexShrink: 1, fontSize: 14, fontWeight: "800" },
  stickyTitle: { color: colors.foreground, flexShrink: 1, fontSize: 16, fontWeight: "800" },
  // onTitlePressがあるとき（ノート名をタップしてノート切替シートを開ける画面）だけ使う行。
  stickyTitleButton: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 4, maxWidth: "100%" },
  description: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  headerActions: { flexDirection: "row", gap: 8 },
  headerButton: { alignItems: "center", backgroundColor: colors.primarySurface, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  // isDirty時のみ表示される固定フッター。スクロール本文の外に置くことで、
  // 下の方の値を編集してもボタンまでスクロールし直す必要がないようにする。
  saveFooter: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 14, paddingTop: 12 },
  saveBar: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 12, paddingVertical: 12 },
  saveBarText: { color: colors.onPrimary, fontSize: 14, fontWeight: "800" },
  saveErrorText: { color: colors.error, fontSize: 12, lineHeight: 17, marginTop: 4 },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  emptyHint: { color: colors.muted, fontSize: 13 },
  formulaCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 10, padding: 13 },
  formulaRow: { alignItems: "flex-start" },
  formulaExplanation: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: 4 },
  inputCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 10, padding: 13 },
  inputRow: { gap: 4 },
  inputField: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 10, borderWidth: 1, color: colors.foreground, fontFamily: mono, fontSize: 15, minHeight: 42, paddingHorizontal: 12 },
  inputFieldError: { borderColor: colors.errorBorder },
  inputError: { color: colors.error, fontSize: 11, lineHeight: 15 },
  resultsList: { gap: 10 },
  resultCard: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 16, borderWidth: 1, padding: 13 },
  resultCardFinal: { borderColor: colors.primary, borderWidth: 2 },
  resultHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  resultHeaderMain: { flex: 1, paddingRight: 8 },
  resultTitle: { color: colors.foreground, fontSize: 13, fontWeight: "800" },
  copyButton: { alignItems: "center", height: 26, justifyContent: "center", width: 30 },
  resultValue: { color: colors.primaryStrong, fontFamily: mono, fontSize: 24, fontWeight: "700", marginTop: 4 },
  resultExpressionInput: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, color: colors.foreground, fontFamily: mono, fontSize: 12, marginBottom: 8, paddingVertical: 2 },
  resultError: { color: colors.error, fontSize: 12, lineHeight: 17, marginTop: 4 },
  resultWarning: { color: colors.warning, fontSize: 11, lineHeight: 15, marginTop: 4 },
  resultReferenceHint: { color: colors.muted, fontSize: 10, marginTop: 5 },
  constantsRailLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.3, marginTop: 6, textTransform: "uppercase" },
  unitRail: { gap: 6, paddingTop: 9 },
  unitChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  unitChipActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  unitChipText: { color: colors.primary, fontFamily: mono, fontSize: 11, fontWeight: "800" },
  unitChipTextActive: { color: colors.onPrimary },
  pressed: { opacity: 0.72 },
});
