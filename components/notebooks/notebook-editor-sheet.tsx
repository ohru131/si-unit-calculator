import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NotebookKeypad } from "@/components/notebooks/notebook-keypad";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LatexView } from "@/components/ui/latex-view";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { useKeyboardHeight } from "@/hooks/use-keyboard-height";
import { useUnitRail } from "@/hooks/use-unit-rail";
import {
  type CalculationNotebook,
  type CalculationNoteStep,
  type NotebookCategory,
  type NotebookFormula,
  type NotebookLocalConstant,
  UNCATEGORIZED_CATEGORY_ID,
} from "@/lib/calculator-store";
import { resolveCalculatorLayout } from "@/lib/calculator-layout";
import { toHalfWidthAscii } from "@/lib/fullwidth-input";
import { localizedText, type AppLanguage } from "@/lib/i18n";
import { clampSelectionRange, getLocalConstantFieldSuggestions, getStepFieldSuggestions, mapCombinedSelectionToExpressionRange } from "@/lib/notebook-constant-suggestions";
import { formatNameValue, normalizeStepForSave, parseNameValue } from "@/lib/notebook-engine";
import { backspaceInCombinedField, insertInCombinedField, moveCaretInCombinedField } from "@/lib/notebook-keypad";
import { resolveSheetKeyboardLayout } from "@/lib/sheet-layout";
import { notebookFormulaRows } from "@/lib/notebook-formula-rows";
import { PRESET_NOTEBOOK_CATEGORIES } from "@/lib/notebook-formulas";
import { orderNotebookCategoriesForLanguage } from "@/lib/locale-relevance";
import { nextStepNamePatch } from "@/lib/notebook-step-title";
import { analyzeExpression, prefixEntryStillValid, replaceExpressionRange, resolvePrefixKeyPress, shouldResetPaletteForKey, type PrefixEntry } from "@/lib/unit-input";
import { unitErrorMessage } from "@/lib/unit-errors";
import { type SavedConstant, type UnitSystem } from "@/lib/units";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

let localConstantSeq = 0;
let stepSeq = 0;
let formulaSeq = 0;
const nextLocalConstantId = () => `local-${Date.now()}-${localConstantSeq++}`;
const nextStepId = () => `step-${Date.now()}-${stepSeq++}`;
const nextFormulaId = () => `formula-${Date.now()}-${formulaSeq++}`;

// 「保存」で呼び出し元(app/(tabs)/constants.tsx)へ渡す入力。calculator-store.tsxのupsertNotebookの
// 引数と同じ形にしておき、呼び出し側はそのままstoreへ渡すだけで済むようにする。
export type NotebookSaveInput = Omit<CalculationNotebook, "id" | "createdAt" | "updatedAt" | "pinned" | "isPreset"> & { id?: string };

// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
// close/save/saving/notebookNew/uncategorized/validation はapp/(tabs)/constants.tsxのCOPYにも
// 同名キーがある（グローバル定数の編集シートと共用する文言）。文言の持ち方の規約
// （lib/i18n.tsのUI文言はRecord化する方式）に沿って、この共有コンポーネントも自分専用のCOPYを持つ。
const EN_COPY = {
  close: "Close", save: "Save", saving: "Saving…", keypadDismiss: "Done",
  notebookNew: "New notebook", notebookEdit: "Edit notebook",
  notebookTitleLabel: "Title", notebookDescriptionLabel: "Description",
  notebookTitlePlaceholder: "Bending stress", notebookDescriptionPlaceholder: "Optional note",
  category: "Category", newCategory: "New category", categoryName: "Category name", uncategorized: "Uncategorized",
  localConstants: "Local constants (inputs)", localConstantsHint: "Enter as name=value, e.g. v0=5m/s. Later rows can reference earlier ones.",
  notMeasured: "Not measured", notMeasuredHint: "Mark drawing dimensions, counts and standard values as \"not measured\" so they are not counted as significant figures.",
  invalidConstantName: "Enter each constant as name=value (e.g. v0=5m/s).",
  invalidStepName: "Enter each step as name=expression (e.g. v=v0+a*t), or remove the \"=\" to leave it unnamed.",
  addLocalConstant: "Add constant", steps: "Steps (results)", stepsHint: "Enter as name=expression, e.g. v=v0+a*t. Can reference constants and earlier steps.", addStep: "Add step", stepTitlePlaceholder: "v=v0+a*t",
  outputUnitLabel: "Display unit (optional)", removeRow: "Remove",
  formulaLatexPlaceholder: "Display formula, optional LaTeX (e.g. v = v_0 + at)",
  formulasLabel: "Formula explanations", formulasHint: "The formulas shown at the top of the notebook. The explanation is optional — a formula on its own is fine. Add as many as you like.",
  addFormula: "Add formula", formulaExplanationPlaceholder: "Explanation (e.g. This gives the velocity)",
  resultTitleLabel: "Display title", resultTitlePlaceholder: "e.g. Velocity v",
  formulaLatexRequired: "Each formula explanation needs its own formula (LaTeX). Remove the explanation or add the formula, otherwise it will be discarded on save.",
  validation: "Please fill in the required fields.",
} as const;
const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = {
  en: EN_COPY,
  ja: {
    close: "閉じる", save: "保存", saving: "保存中…", keypadDismiss: "閉じる",
    notebookNew: "新しい計算ノート", notebookEdit: "計算ノートを編集",
    notebookTitleLabel: "タイトル", notebookDescriptionLabel: "説明",
    notebookTitlePlaceholder: "曲げ応力", notebookDescriptionPlaceholder: "任意のメモ",
    category: "カテゴリ", newCategory: "新しいカテゴリ", categoryName: "カテゴリ名", uncategorized: "未分類",
    localConstants: "ローカル定数（入力値）", localConstantsHint: "「名前＝値」の形で入力します。例：v0=5m/s。後の行で前の行を参照できます。",
    notMeasured: "測定値でない", notMeasuredHint: "図面の呼び寸法・個数・規格で決まる値に「測定値でない」を付けると、有効数字に数えません。",
    invalidConstantName: "定数は「名前＝値」の形式（例：v0=5m/s）で入力してください。",
    invalidStepName: "手順は「名前＝式」の形式（例：v=v0+a*t）で入力するか、「＝」を外して名前なしにしてください。",
    addLocalConstant: "定数を追加", steps: "手順（結果）", stepsHint: "「名前＝式」の形で入力します。例：v=v0+a*t。定数や前の手順を参照できます。", addStep: "手順を追加", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "表示単位（任意）", removeRow: "削除",
    formulaLatexPlaceholder: "表示用の数式（任意、LaTeX。例：v = v_0 + at）",
    formulasLabel: "数式の解説", formulasHint: "ノートの先頭に出す数式です。説明文は任意で、数式だけでも構いません。いくつでも追加できます。",
    addFormula: "数式を追加", formulaExplanationPlaceholder: "説明文（例：速度を求める式です）",
    resultTitleLabel: "表示タイトル", resultTitlePlaceholder: "例：速度 v",
    formulaLatexRequired: "数式の解説には数式（LaTeX）も入力してください。数式が不要なら説明文ごと削除してください（空のままだと保存時に消えます）。",
    validation: "必須項目を入力してください。",
  },
  es: {
    close: "Cerrar", save: "Guardar", saving: "Guardando…", keypadDismiss: "Listo",
    notebookNew: "Nuevo cuaderno", notebookEdit: "Editar cuaderno",
    notebookTitleLabel: "Título", notebookDescriptionLabel: "Descripción",
    notebookTitlePlaceholder: "Esfuerzo de flexión", notebookDescriptionPlaceholder: "Nota opcional",
    category: "Categoría", newCategory: "Nueva categoría", categoryName: "Nombre de la categoría", uncategorized: "Sin categoría",
    localConstants: "Constantes locales (entradas)", localConstantsHint: "Escribe cada una como nombre=valor, por ejemplo v0=5m/s. Las filas siguientes pueden usar las anteriores.",
    notMeasured: "No medido", notMeasuredHint: "Marca como «no medido» las cotas de plano, los recuentos y los valores normalizados para que no cuenten como cifras significativas.",
    invalidConstantName: "Escribe cada constante como nombre=valor (por ejemplo, v0=5m/s).",
    invalidStepName: "Escribe cada paso como nombre=expresión (por ejemplo, v=v0+a*t), o quita el \"=\" para dejarlo sin nombre.",
    addLocalConstant: "Añadir constante", steps: "Pasos (resultados)", stepsHint: "Escribe cada uno como nombre=expresión, por ejemplo v=v0+a*t. Puede usar constantes y pasos anteriores.", addStep: "Añadir paso", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "Unidad de visualización (opcional)", removeRow: "Quitar",
    formulaLatexPlaceholder: "Fórmula visible, LaTeX opcional (por ejemplo, v = v_0 + at)",
    formulasLabel: "Explicaciones de fórmulas", formulasHint: "Las fórmulas que se muestran al principio del cuaderno. La explicación es opcional: una fórmula sola también vale. Añade tantas como quieras.",
    addFormula: "Añadir fórmula", formulaExplanationPlaceholder: "Explicación (por ejemplo, esto calcula la velocidad)",
    resultTitleLabel: "Título mostrado", resultTitlePlaceholder: "p. ej., Velocidad v",
    formulaLatexRequired: "Cada explicación de fórmula necesita su propia fórmula (LaTeX). Elimina la explicación o añade la fórmula; de lo contrario se descartará al guardar.",
    validation: "Completa los campos obligatorios.",
  },
  "pt-BR": {
    close: "Fechar", save: "Salvar", saving: "Salvando…", keypadDismiss: "Concluído",
    notebookNew: "Novo caderno", notebookEdit: "Editar caderno",
    notebookTitleLabel: "Título", notebookDescriptionLabel: "Descrição",
    notebookTitlePlaceholder: "Tensão de flexão", notebookDescriptionPlaceholder: "Nota opcional",
    category: "Categoria", newCategory: "Nova categoria", categoryName: "Nome da categoria", uncategorized: "Sem categoria",
    localConstants: "Constantes locais (entradas)", localConstantsHint: "Digite cada uma como nome=valor, por exemplo v0=5m/s. As linhas seguintes podem usar as anteriores.",
    notMeasured: "Não medido", notMeasuredHint: "Marque cotas de desenho, contagens e valores normalizados como «não medido» para que não contem como algarismos significativos.",
    invalidConstantName: "Digite cada constante como nome=valor (por exemplo, v0=5m/s).",
    invalidStepName: "Digite cada etapa como nome=expressão (por exemplo, v=v0+a*t), ou remova o \"=\" para deixá-la sem nome.",
    addLocalConstant: "Adicionar constante", steps: "Etapas (resultados)", stepsHint: "Digite cada uma como nome=expressão, por exemplo v=v0+a*t. Pode referenciar constantes e etapas anteriores.", addStep: "Adicionar etapa", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "Unidade de exibição (opcional)", removeRow: "Remover",
    formulaLatexPlaceholder: "Fórmula exibida, LaTeX opcional (por exemplo, v = v_0 + at)",
    formulasLabel: "Explicações das fórmulas", formulasHint: "As fórmulas exibidas no início do caderno. A explicação é opcional — uma fórmula sozinha também serve. Adicione quantas quiser.",
    addFormula: "Adicionar fórmula", formulaExplanationPlaceholder: "Explicação (por exemplo, isso calcula a velocidade)",
    resultTitleLabel: "Título exibido", resultTitlePlaceholder: "ex.: Velocidade v",
    formulaLatexRequired: "Cada explicação de fórmula precisa de sua própria fórmula (LaTeX). Remova a explicação ou adicione a fórmula; caso contrário, ela será descartada ao salvar.",
    validation: "Preencha os campos obrigatórios.",
  },
  de: {
    close: "Schließen", save: "Speichern", saving: "Speichert…", keypadDismiss: "Fertig",
    notebookNew: "Neues Rechenheft", notebookEdit: "Rechenheft bearbeiten",
    notebookTitleLabel: "Titel", notebookDescriptionLabel: "Beschreibung",
    notebookTitlePlaceholder: "Biegespannung", notebookDescriptionPlaceholder: "Optionale Notiz",
    category: "Kategorie", newCategory: "Neue Kategorie", categoryName: "Kategoriename", uncategorized: "Ohne Kategorie",
    localConstants: "Lokale Konstanten (Eingaben)", localConstantsHint: "Gib jede als Name=Wert ein, zum Beispiel v0=5m/s. Spätere Zeilen können frühere referenzieren.",
    notMeasured: "Nicht gemessen", notMeasuredHint: "Markiere Zeichnungsmaße, Stückzahlen und Normwerte als „nicht gemessen“, damit sie nicht als signifikante Stellen zählen.",
    invalidConstantName: "Gib jede Konstante als Name=Wert ein (z. B. v0=5m/s).",
    invalidStepName: "Gib jeden Schritt als Name=Ausdruck ein (z. B. v=v0+a*t), oder entferne das \"=\", um ihn unbenannt zu lassen.",
    addLocalConstant: "Konstante hinzufügen", steps: "Schritte (Ergebnisse)", stepsHint: "Gib jeden als Name=Ausdruck ein, zum Beispiel v=v0+a*t. Kann Konstanten und frühere Schritte referenzieren.", addStep: "Schritt hinzufügen", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "Anzeigeeinheit (optional)", removeRow: "Entfernen",
    formulaLatexPlaceholder: "Anzeigeformel, optional LaTeX (z. B. v = v_0 + at)",
    formulasLabel: "Formelerklärungen", formulasHint: "Die Formeln, die oben im Rechenheft stehen. Die Erklärung ist optional — eine Formel allein genügt. Beliebig viele möglich.",
    addFormula: "Formel hinzufügen", formulaExplanationPlaceholder: "Erklärung (z. B. Damit wird die Geschwindigkeit berechnet)",
    resultTitleLabel: "Anzeigetitel", resultTitlePlaceholder: "z. B. Geschwindigkeit v",
    formulaLatexRequired: "Jede Formelerklärung braucht eine eigene Formel (LaTeX). Entferne die Erklärung oder ergänze die Formel, sonst wird sie beim Speichern verworfen.",
    validation: "Bitte fülle die Pflichtfelder aus.",
  },
  fr: {
    close: "Fermer", save: "Enregistrer", saving: "Enregistrement…", keypadDismiss: "Terminé",
    notebookNew: "Nouveau carnet", notebookEdit: "Modifier le carnet",
    notebookTitleLabel: "Titre", notebookDescriptionLabel: "Description",
    notebookTitlePlaceholder: "Contrainte de flexion", notebookDescriptionPlaceholder: "Note facultative",
    category: "Catégorie", newCategory: "Nouvelle catégorie", categoryName: "Nom de la catégorie", uncategorized: "Sans catégorie",
    localConstants: "Constantes locales (entrées)", localConstantsHint: "Saisissez chacune sous la forme nom=valeur, par exemple v0=5m/s. Les lignes suivantes peuvent référencer les précédentes.",
    notMeasured: "Non mesuré", notMeasuredHint: "Marquez les cotes de plan, les effectifs et les valeurs normalisées comme « non mesurés » afin qu'ils ne comptent pas comme chiffres significatifs.",
    invalidConstantName: "Saisissez chaque constante sous la forme nom=valeur (par exemple v0=5m/s).",
    invalidStepName: "Saisissez chaque étape sous la forme nom=expression (par exemple v=v0+a*t), ou retirez le \"=\" pour la laisser sans nom.",
    addLocalConstant: "Ajouter une constante", steps: "Étapes (résultats)", stepsHint: "Saisissez chacune sous la forme nom=expression, par exemple v=v0+a*t. Peut référencer des constantes et des étapes précédentes.", addStep: "Ajouter une étape", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "Unité d'affichage (facultatif)", removeRow: "Retirer",
    formulaLatexPlaceholder: "Formule affichée, LaTeX facultatif (par exemple v = v_0 + at)",
    formulasLabel: "Explications des formules", formulasHint: "Les formules affichées en haut du carnet. L'explication est facultative : une formule seule suffit. Ajoutez-en autant que vous voulez.",
    addFormula: "Ajouter une formule", formulaExplanationPlaceholder: "Explication (par exemple, ceci calcule la vitesse)",
    resultTitleLabel: "Titre affiché", resultTitlePlaceholder: "p. ex. Vitesse v",
    formulaLatexRequired: "Chaque explication de formule a besoin de sa propre formule (LaTeX). Supprimez l'explication ou ajoutez la formule, sinon elle sera perdue à l'enregistrement.",
    validation: "Veuillez remplir les champs obligatoires.",
  },
};

type Props = {
  visible: boolean;
  language: AppLanguage;
  unitSystem: UnitSystem;
  /** 編集対象。新規作成なら undefined。 */
  notebook?: CalculationNotebook;
  /** 電卓画面の「保存」から飛んできたときの初期手順（新規作成のときだけ使う）。 */
  presetExpression?: string;
  presetTargetUnit?: string;
  /** 一覧のどのカテゴリから開いたか（新規作成のときの初期選択カテゴリ）。 */
  initialCategoryId?: string;
  globalConstants: SavedConstant[];
  notebookCategories: NotebookCategory[];
  onCreateCategory: (name: string) => Promise<NotebookCategory>;
  /** 保存されたノートを返す。呼び出し側はここでstoreへ書き込み、recordNotebookUseなどを行う。 */
  onSave: (input: NotebookSaveInput) => Promise<CalculationNotebook>;
  onClose: () => void;
};

export function NotebookEditorSheet({
  visible, language, unitSystem, notebook, presetExpression, presetTargetUnit, initialCategoryId,
  globalConstants, notebookCategories, onCreateCategory, onSave, onClose,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = COPY[language];
  // シートは OS のキーボードから自分で逃げる（判断は lib/sheet-layout.ts。理由はそちらのコメント）。
  const { fontScale, height: windowHeight } = useWindowDimensions();
  // キーパッドの段階（キーの高さ・文字の拡大率）は電卓と同じ物差しで決める。
  const keyboardLayout = useMemo(() => resolveCalculatorLayout({ fontScale, height: windowHeight }), [fontScale, windowHeight]);
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  // エンジンのエラー(UnitError)は現在の言語で表示する。UnitError以外は従来どおりError.messageを出す
  // （app/(tabs)/constants.tsxのengineErrorMessageと同じ考え方。バリデーション以外の想定外エラーの
  // フォールバックはcopy.validation）。
  const engineErrorMessage = (cause: unknown) => (cause instanceof Error ? (unitErrorMessage(cause, language) ?? cause.message) : copy.validation);

  // 開くたびに呼び出し側が key を変えてこのコンポーネントを作り直すので、フォームの初期値は
  // useState の初期化子で props から決めればよい（開閉に合わせて state を作り直す useEffect は不要）。
  // この作りにしておくと、前回開いたときのレールの状態・キャレット位置が次に開いたときへ残る不具合
  // （PR #25 で2度踏んだ）が構造的に起きえない。閉じるときのリセット漏れを覚えておく必要がなくなる。
  // 開いている間 notebook prop は変わらない（開くたびにkeyで作り直す作りなので）ため、stateにせず素直に導出する。
  const editingNotebookId = notebook?.id;
  const [notebookTitle, setNotebookTitle] = useState(notebook?.title ?? "");
  const [notebookDescription, setNotebookDescription] = useState(notebook?.description ?? "");
  const [notebookCategoryId, setNotebookCategoryId] = useState<string>(notebook?.categoryId ?? initialCategoryId ?? UNCATEGORIZED_CATEGORY_ID);
  const [notebookFormulas, setNotebookFormulas] = useState<NotebookFormula[]>(() => (notebook ? notebookFormulaRows(notebook.formulas, notebook.steps) : []));
  const [notebookLocalConstants, setNotebookLocalConstants] = useState<NotebookLocalConstant[]>(() => notebook?.localConstants.map((item) => ({ ...item })) ?? []);
  // 電卓の「保存」から飛んできたときは、その式を最初の手順として入れておく（新規作成のときだけ）。
  const [notebookSteps, setNotebookSteps] = useState<CalculationNoteStep[]>(() => {
    if (notebook) return notebook.steps.map((item) => ({ ...item }));
    return presetExpression ? [{ id: nextStepId(), title: "", expression: presetExpression, targetUnit: presetTargetUnit ?? "" }] : [];
  });
  const [notebookError, setNotebookError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  // 「名前＝式」欄（ローカル定数・手順）を編集している間、シートの下端に**電卓と共用のキーパッド**
  // （components/notebooks/notebook-keypad.tsx）を出す。フィールドごとに一意なキー
  // （`local:${id}` / `step:${id}`）で、どのフィールドを編集中かを管理する（詳細画面と同じパターン）。
  // 【なぜ欄の直下のボタン列をやめたか】以前は欄ごとに記号レール（ギリシャ文字・下付き）と
  // 「定義済みの変数／単位」のチップ列を直下に出していた。数字と演算子は端末のキーボード、記号と
  // 単位は欄の下、という分かれ方で、電卓・ノート詳細とキーの位置も中身も違っていた（単位はカテゴリも
  // 文脈依存の候補も接頭語の補完も無い平らな一覧だった）。入力手段を1箇所に寄せれば、片方にだけ入る
  // 改良が生まれない（利用者からの指示「テキストボックスの下のボタンではなく共通のアプリキーパッドを」）。
  // 【なぜフォーカスと連動させないか】以前は「フォーカス中のフィールド」に厳密に連動させ、onBlurで
  // 150ms後に消していた。しかしキーパッドのキーもチップもTextInputの外にあるPressableなので、それを
  // 押した瞬間にonBlurが先に発火してキーパッドごと消え、目的のボタンを押せなくなってしまう
  // （実際に踏んだ不具合）。そこで「最後にフォーカスした欄」を、別の欄にフォーカスが移るか
  // 上段の「閉じる」を押すまで保持する方式にしてある。TextInputのonBlurでは何もしない。
  const [activeRailKey, setActiveRailKey] = useState<string | null>(null);
  // 接頭語キーで入れた1文字を「まだ単位を選んでいる途中」として覚える（電卓・ノート詳細と同じ）。
  // これが無いと `m` が単体のメートルとして解決され、レールの候補が長さの単位だけになる。
  const [prefixEntry, setPrefixEntry] = useState<PrefixEntry | null>(null);
  // OS のキーボードを出している欄。「名前＝式」欄は既定では出さず（showSoftInputOnFocus）、
  // タイトル・説明文などの英字が主の欄は従来どおり出す（そのときはキーパッドを畳む）。
  const [osKeyboardKey, setOsKeyboardKey] = useState<string | null>(null);
  // キーボードキーで focus() を呼ぶ相手と、キーパッドの下に隠れた欄を見える位置へ寄せるための参照。
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollOffsetRef = useRef(0);
  const scrollViewportHeightRef = useRef(0);
  // 各フィールドの現在のキャレット/選択範囲（onSelectionChangeで更新）。ボタンをタップしたとき
  // 末尾ではなく、この位置に文字を挿し込むために使う。レールがフォーカスと連動しなくなった分、
  // フォーカスが外れた状態でボタンを押しても直前のキャレット位置へ正しく挿入できる必要がある
  // （このstateはフォーカスの有無に関係なく常に最新の位置を保持している）。
  const [fieldSelections, setFieldSelections] = useState<Record<string, { start: number; end: number }>>({});
  // 記号を挿し込んだ直後だけ、TextInputのselection propでキャレットを挿入位置の直後へ強制する。
  // ユーザー自身の入力と衝突しないよう、反映されたら（onSelectionChange/onChangeTextで）すぐ手放す。
  // フィールドがフォーカスされていない間はselection propを設定してもカーソルは目に見えないが、
  // fieldSelectionsには反映済みなので、次に続けてボタンを押したときの挿入位置は正しく積み上がる
  // （再びこのフィールドをタップしてフォーカスが戻ったときにキャレットが正しい位置に来る）。
  const [forcedSelection, setForcedSelection] = useState<{ key: string; selection: { start: number; end: number } } | null>(null);

  // Android の戻るボタンで OS のキーボードを閉じると onBlur が来ないことがあり、⌨ キーが点いたまま
  // 残る（電卓・ノート詳細と同じ対処）。OS が隠した時点でこちらの記録も消す。
  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", () => setOsKeyboardKey(null));
    return () => subscription.remove();
  }, []);

  /**
   * 編集中の欄がキーパッドの下に隠れていれば、見える位置までスクロールする。OS のキーボードなら
   * Android が自動で寄せてくれるが、自前のキーパッドにはその仕組みが無い。測定は ScrollView の枠に
   * 対する相対座標なので、現在のスクロール量を足して絶対位置にする（ノート詳細と同じ）。
   */
  const ensureActiveFieldVisible = (key: string | null) => {
    if (!key) return;
    const input = inputRefs.current[key];
    const scrollView = scrollRef.current;
    const scrollNode = scrollView?.getNativeScrollRef();
    if (!input || !scrollView || !scrollNode) return;
    input.measureLayout(
      scrollNode,
      (_x, y, _width, height) => {
        const viewport = scrollViewportHeightRef.current;
        if (!viewport) return;
        const margin = 12;
        if (y + height + margin > viewport) {
          scrollView.scrollTo({ y: scrollOffsetRef.current + y + height + margin - viewport, animated: true });
        } else if (y < 0) {
          scrollView.scrollTo({ y: scrollOffsetRef.current + y - margin, animated: true });
        }
      },
      () => undefined,
    );
  };
  // ScrollView が縮み終わってから測る必要があるので1フレーム待つ。
  useEffect(() => {
    if (!activeRailKey) return;
    const timer = setTimeout(() => ensureActiveFieldVisible(activeRailKey), 50);
    return () => clearTimeout(timer);
  }, [activeRailKey]);

  // **キーボードキーで出すときは一度 blur してから遅らせて focus する。** その欄は利用者が直前に
  // タップしていて既にフォーカス中なので、そのまま focus() を呼んでも RN は「既にフォーカス済み」と
  // 見て何もせず、showSoftInputOnFocus を true にしても表示要求が出ない（ノート詳細で踏んだのと同じ）。
  useEffect(() => {
    if (!osKeyboardKey) return;
    inputRefs.current[osKeyboardKey]?.blur();
    const timer = setTimeout(() => inputRefs.current[osKeyboardKey]?.focus(), 50);
    return () => clearTimeout(timer);
  }, [osKeyboardKey]);
  // カテゴリピッカーの第2段（サブカテゴリ行）を、どの大分類について開いているか。閉じているときはnull。
  // 理科・高校物理のサブカテゴリが選ばれているなら、ピッカーの第2段を最初から開いておく
  // （自分の選択を見るための再ナビゲーションを不要にするため）。
  const [categoryPickerExpandedParentId, setCategoryPickerExpandedParentId] = useState<string | null>(
    () => PRESET_NOTEBOOK_CATEGORIES.find((category) => category.id === (notebook?.categoryId ?? initialCategoryId))?.parentId ?? null,
  );
  // カテゴリピッカーを開いているか。既定は閉じ（1行）。カテゴリが38件まで増えてチップを
  // 全部並べると縦に10行近く占め、タイトル・数式・手順の入力欄が画面外へ押し出されていた。
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // 親カテゴリID→子カテゴリ一覧。編集シートのカテゴリピッカーを2段（大分類→サブカテゴリ）にするための対応表。
  // 並びはカテゴリグリッド（notebook-category-grid.tsx）と同じ関連度順にする。ノートを「見るとき」と
  // 「割り当てるとき」で並びが違うと、グリッドで覚えた位置がピッカーで通用しない。
  const childCategoriesByParentId = useMemo(() => {
    const map = new Map<string, { id: string; label: string }[]>();
    orderNotebookCategoriesForLanguage(PRESET_NOTEBOOK_CATEGORIES.filter((category) => category.parentId), language).forEach((category) => {
      if (!category.parentId) return;
      const label = localizedText(category.label, language);
      map.set(category.parentId, [...(map.get(category.parentId) ?? []), { id: category.id, label }]);
    });
    return map;
  }, [language]);

  // ピッカーの第1段（最上位）。プリセットの大分類・葉カテゴリ、ユーザー作成カテゴリ、未分類の順に並べる。
  // プリセットの部分だけカテゴリグリッドと同じ関連度順にする（ユーザー作成カテゴリと未分類の位置は変えない）。
  const topLevelCategoryOptions = useMemo(() => [
    ...orderNotebookCategoriesForLanguage(PRESET_NOTEBOOK_CATEGORIES.filter((category) => !category.parentId), language).map((category) => ({ id: category.id, label: localizedText(category.label, language), hasChildren: childCategoriesByParentId.has(category.id) })),
    ...notebookCategories.map((category) => ({ id: category.id, label: category.name, hasChildren: false })),
    { id: UNCATEGORIZED_CATEGORY_ID, label: copy.uncategorized, hasChildren: false },
  ], [childCategoriesByParentId, copy.uncategorized, language, notebookCategories]);

  const categoryParentId = (categoryId: string) => PRESET_NOTEBOOK_CATEGORIES.find((category) => category.id === categoryId)?.parentId ?? null;

  // 折りたたんだときに出す表示。サブカテゴリのときは大分類も添える
  // （「電気」「化学変化」のようなサブカテゴリ名だけでは、どの大分類の下のものか分からない）。
  // 大分類とサブカテゴリを1行に繋げると、独語の「Elektrizität & Energie › Praktische Elektrote…」の
  // ように**肝心のサブカテゴリ側が省略される**ので、大分類は上に小さく重ねて2段で出す。
  const selectedCategory = useMemo(() => {
    const preset = PRESET_NOTEBOOK_CATEGORIES.find((category) => category.id === notebookCategoryId);
    if (preset) {
      const parent = preset.parentId ? PRESET_NOTEBOOK_CATEGORIES.find((category) => category.id === preset.parentId) : undefined;
      return { label: localizedText(preset.label, language), parentLabel: parent ? localizedText(parent.label, language) : null };
    }
    const userCategory = notebookCategories.find((category) => category.id === notebookCategoryId);
    return { label: userCategory ? userCategory.name : copy.uncategorized, parentLabel: null };
  }, [copy.uncategorized, language, notebookCategories, notebookCategoryId]);

  const toggleCategoryPicker = () => {
    setShowNewCategoryField(false);
    if (isCategoryPickerOpen) {
      setIsCategoryPickerOpen(false);
      return;
    }
    // 開いたときは今の選択がある階層をそのまま出す（サブカテゴリを選んでいるなら、その大分類の中）。
    // 毎回最上位から出すと、自分が今どこを選んでいるのかを見るためだけに1タップ払うことになる。
    setCategoryPickerExpandedParentId(categoryParentId(notebookCategoryId));
    setIsCategoryPickerOpen(true);
  };

  // 葉カテゴリを選んだら閉じる。開いた階層（categoryPickerExpandedParentId）は残すので、
  // 選び直したくなったときは同じ場所が開く。
  const selectCategory = (categoryId: string) => {
    setNotebookCategoryId(categoryId);
    setShowNewCategoryField(false);
    setIsCategoryPickerOpen(false);
  };

  const closeNotebookEditor = () => {
    onClose();
  };

  const saveNotebook = async () => {
    setNotebookError("");
    const title = notebookTitle.trim();
    // 「名前＝値」の名前部分を解析できなかった行（例：数字始まりの名前）は、symbolやresultSymbolが
    // 空のまま生テキスト（"="を含む）がexpressionに残る。名前なしの通常の式と区別して、はっきり教える。
    if (notebookLocalConstants.some((item) => !item.symbol.trim() && item.expression.trim())) { setNotebookError(copy.invalidConstantName); return; }
    if (notebookSteps.some((step) => !step.resultSymbol?.trim() && step.expression.includes("="))) { setNotebookError(copy.invalidStepName); return; }
    // 説明文だけ書いてLaTeXを空にした行は、下のfilterで黙って消える。無言で捨てず、
    // 保存前にはっきり教える（削除するか数式を足すかをユーザーに選んでもらう）。
    if (notebookFormulas.some((item) => item.explanation.trim() && !item.latex.trim())) { setNotebookError(copy.formulaLatexRequired); return; }
    // 数式は「数式の解説」（formulas）に一本化する。編集画面はもう手順ごとのformulaLatexを
    // 編集しないので、残すと画面から触れない古い値が残り続ける（表示側はformulasを優先するため
    // 見えもしない）。formulasが空の場合は上のnotebookFormulaRowsで手順から拾い上げてある。
    const normalizedSteps = notebookSteps.filter((step) => step.expression.trim()).map((step) => ({ ...normalizeStepForSave(step), formulaLatex: undefined }));
    const normalizedConstants = notebookLocalConstants.filter((item) => item.symbol.trim() && item.expression.trim()).map((item) => ({ ...item, symbol: item.symbol.trim(), expression: item.expression.trim() }));
    const normalizedFormulas = notebookFormulas.filter((item) => item.latex.trim()).map((item) => ({ ...item, explanation: item.explanation.trim(), latex: item.latex.trim() }));
    if (!title || !normalizedSteps.length) { setNotebookError(copy.validation); return; }
    setIsSaving(true);
    try {
      await onSave({ id: editingNotebookId, title, description: notebookDescription.trim(), categoryId: notebookCategoryId, formulas: normalizedFormulas, localConstants: normalizedConstants, steps: normalizedSteps });
      onClose();
    } catch (cause) {
      setNotebookError(engineErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  };

  const createCategoryInline = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const created = await onCreateCategory(name);
    setNotebookCategoryId(created.id);
    // 新規作成のユーザーカテゴリは常に最上位の葉カテゴリなので、開いていたサブカテゴリの階層は閉じる。
    setCategoryPickerExpandedParentId(null);
    setShowNewCategoryField(false);
    setNewCategoryName("");
    // 作ったカテゴリがそのまま選択されるので、リストは他の選択と同じように畳む。
    setIsCategoryPickerOpen(false);
  };

  const updateLocalConstant = (id: string, patch: Partial<NotebookLocalConstant>) =>
    setNotebookLocalConstants((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const updateStep = (id: string, patch: Partial<CalculationNoteStep>) =>
    setNotebookSteps((current) => current.map((step) => (step.id === id ? { ...step, ...patch } : step)));

  // 「名前＝式」欄の名前部分を書き換えたとき、表示タイトル(title)を追従させてよいかどうかの判定込みで
  // 手順を更新する。名前が無いとき（＝を付けていない通常の式）はtitleへ触れない。名前があるときも、
  // タイトルが「未設定」または「直前のresultSymbolと一致（＝以前この仕組みで自動生成されたもの）」の
  // ときだけ追従させる。人間が入力したタイトルやプリセットの翻訳済みタイトルを、名前欄に触れただけで
  // 潰さないようにするため（このタイトル入力欄自体のonChangeTextでは、この関数は経由せず直接上書きする）。
  // タイピングでも記号ボタンでの挿入でも同じ判定になるよう、両方の入口からこの関数を呼ぶ。
  const applyStepNameValue = (step: CalculationNoteStep, name: string, value: string) => {
    // 判定は詳細画面（components/notebooks/notebook-detail.tsx）と同じ関数を使う。両画面で式を
    // 別々に持つと、片方だけ直したときに挙動が分岐して気付けない。名前を消したとき（name=""）も
    // 同じ判定で追従させて空に戻す（記号だけ消してタイトルを残すと自動生成の目印が失われ、
    // 次に別の記号を入れてもタイトルが古い記号のまま固定されてしまう）。
    updateStep(step.id, nextStepNamePatch(step, name, value));
  };
  const updateFormula = (id: string, patch: Partial<NotebookFormula>) =>
    setNotebookFormulas((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const localConstantFieldKey = (id: string) => `local:${id}`;
  const stepFieldKey = (id: string) => `step:${id}`;
  const combinedCaretEnd = (name: string, expression: string) => formatNameValue(name, expression).length;

  // 丸めの規則は lib/notebook-constant-suggestions.ts の純関数に持たせてテストしている。
  const clampedSelection = (key: string, length: number) => clampSelectionRange(fieldSelections[key], length);

  // onSelectionChangeが発火した時点で強制キャレットの役目は終わり。ユーザー自身の操作と
  // 衝突しないよう、対象キーが一致するときだけここで手放す（notebook-detail.tsxと同じパターン）。
  const handleRailSelectionChange = (key: string, selection: { start: number; end: number }) => {
    setFieldSelections((current) => ({ ...current, [key]: selection }));
    setForcedSelection((current) => (current?.key === key ? null : current));
    // 接頭語キーの記録（レールが mA・mV を出し続けるための目印）は、キャレットが押した直後の位置から
    // 動いた時点で捨てる。**判定だけに任せないこと**——離れてから同じ位置へ戻すと古い記録が復活し、
    // 次の接頭語キーが無関係な1文字を消す（電卓で踏んだのと同じ）。
    if (!activeField || key !== activeField.key) { setPrefixEntry(null); return; }
    const mapped = mapCombinedSelectionToExpressionRange(activeField.name, activeField.expression, selection.start, selection.end);
    setPrefixEntry((current) => (prefixEntryStillValid(current, activeField.expression, mapped) ? current : null));
  };
  // ---- アプリ内キーパッド（電卓・ノート詳細と共用） ----

  /**
   * キーパッドが今操作している欄。「最後にフォーカスした欄」（activeRailKey）を id から引き直す。
   * 行を削除して id が消えていれば null になり、キーパッドも出ない。
   *
   * **名前も式も同じ1本のテキストとして扱う**（`apply` が結合文字列を受ける）。この画面は名前
   * そのものを作る場所で、`σ_y`・`mₒ` は端末のキーボードでは打てないため、キーパッドの記号パネルから
   * 名前側へも入れられる必要がある（詳細画面は既存の名前の「値」だけを編集するので逆に名前を守る）。
   */
  const activeField = (() => {
    if (!activeRailKey) return null;
    if (activeRailKey.startsWith("local:")) {
      const index = notebookLocalConstants.findIndex((entry) => localConstantFieldKey(entry.id) === activeRailKey);
      const item = notebookLocalConstants[index];
      if (!item) return null;
      return {
        key: activeRailKey,
        name: item.symbol,
        expression: item.expression,
        label: item.symbol.trim() || copy.localConstants,
        symbols: getLocalConstantFieldSuggestions(notebookLocalConstants, globalConstants, index),
        apply: (name: string, value: string) => updateLocalConstant(item.id, { symbol: name, expression: value }),
        applyExpression: (next: string) => updateLocalConstant(item.id, { expression: next }),
      };
    }
    const index = notebookSteps.findIndex((entry) => stepFieldKey(entry.id) === activeRailKey);
    const step = notebookSteps[index];
    if (!step) return null;
    return {
      key: activeRailKey,
      name: step.resultSymbol ?? "",
      expression: step.expression,
      label: step.title.trim() || step.resultSymbol?.trim() || copy.steps,
      symbols: getStepFieldSuggestions(notebookLocalConstants, globalConstants, notebookSteps, index),
      apply: (name: string, value: string) => applyStepNameValue(step, name, value),
      applyExpression: (next: string) => applyStepNameValue(step, step.resultSymbol ?? "", next),
    };
  })();

  // 単位レールの手掛かり。式の座標で渡す必要があるので、欄の結合座標から毎回直す。
  // **useMemo で包まないこと**——activeField は毎レンダー作り直される派生値なので、包んでも依存が
  // 毎回変わって得が無く、react-hooks/preserve-manual-memoization の警告だけ増える。
  const railExpression = activeField?.expression ?? "";
  const railIdentifiers = activeField?.symbols ?? [];
  const railAnalysis = analyzeExpression(railExpression, railIdentifiers);
  const railCombinedSelection = activeField ? clampedSelection(activeField.key, combinedCaretEnd(activeField.name, activeField.expression)) : null;
  const railRange = activeField && railCombinedSelection
    ? mapCombinedSelectionToExpressionRange(activeField.name, activeField.expression, railCombinedSelection.start, railCombinedSelection.end)
    : { start: 0, end: 0 };
  const unitRail = useUnitRail({
    analysis: railAnalysis,
    expression: railExpression,
    identifiers: railIdentifiers,
    prefixEntry,
    selection: { start: railRange.start, end: railRange.end },
    unitSystem,
  });

  // 欄の値を書き換えたあと、キャレットを挿入位置の直後へ置き直す（挿入を続けて積み上げられるように）。
  const applyCombined = (key: string, text: string, caret: number, apply: (name: string, value: string) => void) => {
    const { name, value } = parseNameValue(text);
    apply(name, value);
    const caretSelection = { start: caret, end: caret };
    setFieldSelections((current) => ({ ...current, [key]: caretSelection }));
    setForcedSelection({ key, selection: caretSelection });
  };

  // 式だけを書き換える経路（接頭語キー・単位チップ）。キャレットは結合座標へ戻して置く。
  const applyExpressionOnly = (next: string, expressionCaret: number) => {
    if (!activeField) return;
    activeField.applyExpression(next);
    const caret = (activeField.name ? activeField.name.length + 1 : 0) + expressionCaret;
    const caretSelection = { start: caret, end: caret };
    setFieldSelections((current) => ({ ...current, [activeField.key]: caretSelection }));
    setForcedSelection({ key: activeField.key, selection: caretSelection });
  };

  const insertIntoActiveField = (text: string, asPrefix = false) => {
    if (!activeField) return;
    const combined = formatNameValue(activeField.name, activeField.expression);
    const selection = clampedSelection(activeField.key, combined.length);
    const edit = insertInCombinedField(combined, selection.start, selection.end, text);
    applyCombined(activeField.key, edit.text, edit.caret, activeField.apply);
    // 接頭語キーで入れた1文字だけは「まだ単位を選んでいる途中」として覚える（レールが mA・mV・ms を
    // 出せるようにするため）。記録は式の座標で持つので、名前側の長さを引いてから作る。
    const prefixLength = activeField.name ? activeField.name.length + 1 : 0;
    const start = edit.caret - prefixLength - text.length;
    setPrefixEntry(asPrefix && start >= 0 ? { start, end: start + text.length, prefix: text } : null);
  };

  /** 接頭語キー。電卓と同じトグル（同じキーで取り消し・別のキーで差し替え）で、判断は純関数側。 */
  const handleKeypadPrefix = (prefix: string) => {
    if (!activeField) return;
    const toggled = resolvePrefixKeyPress({ expression: activeField.expression, selection: { start: railRange.start, end: railRange.end }, prefixEntry, key: prefix });
    if (!toggled) { insertIntoActiveField(prefix, true); return; }
    applyExpressionOnly(toggled.expression, toggled.caret);
    setPrefixEntry(toggled.prefixEntry);
  };

  /**
   * レールの単位チップ。書き換える範囲は、範囲選択があればそれを最優先し（選択を無視すると `5cm` の
   * cm を選んで km を押したときに `5kmcm` になる）、無ければレールが案内している範囲をそのまま使う
   * ——画面に出ている案内と実際に書き換わる場所を必ず一致させるため。
   */
  const applyRailUnit = (symbol: string) => {
    if (!activeField) return;
    const { expression } = activeField;
    const range = railRange.start === railRange.end
      ? { start: Math.min(unitRail.target.start, expression.length), end: Math.min(unitRail.target.end, expression.length) }
      : railRange;
    applyExpressionOnly(replaceExpressionRange(expression, range.start, range.end, symbol), range.start + symbol.length);
    setPrefixEntry(null);
  };

  const handleKeypadKey = (key: string) => {
    if (!activeField) return;
    const combined = formatNameValue(activeField.name, activeField.expression);
    const selection = clampedSelection(activeField.key, combined.length);
    if (key === "⌫") {
      const edit = backspaceInCombinedField(combined, selection.start, selection.end);
      if (!edit) return;
      applyCombined(activeField.key, edit.text, edit.caret, activeField.apply);
      setPrefixEntry(null);
      return;
    }
    if (key === "=") { dismissKeypad(); return; }
    // 演算子・括弧・関数のキーはカテゴリの選択を「候補」へ戻す（電卓と同じ。項が変われば
    // さっきまでのカテゴリは当てにならない）。
    if (shouldResetPaletteForKey(key)) unitRail.reset();
    if (key === "AC") {
      // 名前は残し、式だけ空にする（AC は電卓の「式を消す」キーで、欄の名前まで消すものではない）。
      applyExpressionOnly("", 0);
      setPrefixEntry(null);
      unitRail.reset();
      return;
    }
    insertIntoActiveField(key);
  };

  const handleKeypadMoveCaret = (delta: 1 | -1) => {
    if (!activeField) return;
    const combined = formatNameValue(activeField.name, activeField.expression);
    const selection = clampedSelection(activeField.key, combined.length);
    const next = moveCaretInCombinedField(combined, selection.start, selection.end, delta);
    setFieldSelections((current) => ({ ...current, [activeField.key]: next }));
    setForcedSelection({ key: activeField.key, selection: next });
    setPrefixEntry(null);
  };

  /** キーボードキー。出している欄でもう一度押せば閉じる（出す側の focus() は下の effect が行う）。 */
  const toggleOsKeyboard = () => {
    if (!activeField) return;
    if (osKeyboardKey === activeField.key) {
      setOsKeyboardKey(null);
      Keyboard.dismiss();
      return;
    }
    setOsKeyboardKey(activeField.key);
  };

  /** 上段の「閉じる」。キーパッドと OS のキーボードをまとめて畳む。 */
  const dismissKeypad = () => {
    setActiveRailKey(null);
    setOsKeyboardKey(null);
    Keyboard.dismiss();
  };

  /**
   * 「名前＝式」以外の欄（タイトル・説明文・数式・表示タイトル・表示単位）へフォーカスが移ったら
   * キーパッドを畳む。**これが無いと OS のキーボードとキーパッドが同時に積まれて入力欄が残らない。**
   */
  const focusPlainField = () => {
    setActiveRailKey(null);
    setPrefixEntry(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={closeNotebookEditor}>
      {/* **Modal は Android の adjustResize が効くウィンドウの外に出る**ので、キーボードが
          上がってもシートは下端に貼り付いたままで、下の方の入力欄（手順の式など）がキーボードの
          裏に入る。`KeyboardAvoidingView` の behavior="padding" も iOS でしか効かない。
          実測した高さぶん持ち上げ、上限の高さも同時に縮める（判断は lib/sheet-layout.ts）。
          比と下余白は styles.sheet と同じ値を渡すこと。 */}
      <View style={styles.modalBackdrop}>
        <View style={[styles.sheet, resolveSheetKeyboardLayout(keyboardHeight, windowHeight, insets.bottom, { maxHeightRatio: 0.92, paddingBottom: 36 })]}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>{editingNotebookId ? copy.notebookEdit : copy.notebookNew}</Text></View><Pressable accessibilityLabel={copy.close} onPress={closeNotebookEditor} style={({ pressed }) => [styles.closeButton, pressed && styles.iconPressed]}><IconSymbol name="xmark" size={21} color={colors.muted} /></Pressable></View>
          <ScrollView
            ref={scrollRef}
            // **`flexShrink: 1` を明示すること。** RN の既定は 0 なので、書かないと下端のキーパッドが
            // シートの外へ押し出されて画面に出ない（単位レールの startRailWrap と同じ事象）。
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(event) => { scrollOffsetRef.current = event.nativeEvent.contentOffset.y; }}
            onLayout={(event) => {
              const next = event.nativeEvent.layout.height;
              const changed = next !== scrollViewportHeightRef.current;
              scrollViewportHeightRef.current = next;
              // キーパッドが開いてスクロール域が縮んだ直後は、編集中の欄がその下に隠れている。
              if (changed) ensureActiveFieldVisible(activeRailKey);
            }}
          >
            <Text style={styles.fieldLabel}>{copy.notebookTitleLabel}</Text>
            <TextInput value={notebookTitle} onChangeText={setNotebookTitle} onFocus={focusPlainField} placeholder={copy.notebookTitlePlaceholder} placeholderTextColor={colors.placeholder} style={styles.input} />
            <Text style={styles.fieldLabel}>{copy.notebookDescriptionLabel}</Text>
            <TextInput value={notebookDescription} onChangeText={setNotebookDescription} onFocus={focusPlainField} placeholder={copy.notebookDescriptionPlaceholder} placeholderTextColor={colors.placeholder} style={styles.input} />

            <Text style={styles.fieldLabel}>{copy.category}</Text>
            {/* カテゴリはチップを全部並べる形をやめ、折りたたんだ1行＋リストにした。
                最上位9枚＋サブカテゴリまで増えた時点でチップが縦に10行近く占め、
                この下にある数式・定数・手順の入力欄が画面外へ押し出されていた。
                階層のたどり方（大分類→サブカテゴリ→戻る）はライブラリのカテゴリグリッドと
                同じにして、同じカテゴリを2通りの操作で覚えずに済むようにしている。 */}
            <Pressable
              accessibilityLabel={copy.category}
              onPress={toggleCategoryPicker}
              style={({ pressed }) => [styles.categoryValueRow, isCategoryPickerOpen && styles.categoryValueRowOpen, pressed && styles.buttonPressed]}
            >
              <IconSymbol name="folder.fill" size={16} color={colors.primary} />
              <View style={styles.categoryValueCopy}>
                {selectedCategory.parentLabel ? <Text numberOfLines={1} style={styles.categoryValueParent}>{selectedCategory.parentLabel}</Text> : null}
                <Text numberOfLines={1} style={styles.categoryValueText}>{selectedCategory.label}</Text>
              </View>
              <IconSymbol name={isCategoryPickerOpen ? "chevron.up" : "chevron.down"} size={16} color={colors.muted} />
            </Pressable>
            {isCategoryPickerOpen ? (
              <View style={styles.categoryList}>
                {categoryPickerExpandedParentId ? (
                  <>
                    <Pressable onPress={() => setCategoryPickerExpandedParentId(null)} style={({ pressed }) => [styles.categoryListRow, pressed && styles.categoryListRowPressed]}>
                      <IconSymbol name="chevron.left" size={15} color={colors.primary} />
                      <Text numberOfLines={1} style={styles.categoryListBackLabel}>{topLevelCategoryOptions.find((option) => option.id === categoryPickerExpandedParentId)?.label ?? ""}</Text>
                    </Pressable>
                    {(childCategoriesByParentId.get(categoryPickerExpandedParentId) ?? []).map((option) => {
                      const isActive = notebookCategoryId === option.id;
                      return (
                        <Pressable key={option.id} onPress={() => selectCategory(option.id)} style={({ pressed }) => [styles.categoryListRow, styles.categoryListChildRow, pressed && styles.categoryListRowPressed]}>
                          <Text numberOfLines={1} style={[styles.categoryListLabel, isActive && styles.categoryListLabelActive]}>{option.label}</Text>
                          {isActive ? <IconSymbol name="checkmark" size={15} color={colors.primary} /> : null}
                        </Pressable>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {topLevelCategoryOptions.map((option) => {
                      const isActive = notebookCategoryId === option.id;
                      // 大分類はグループ化のためだけの存在でノート自体の所属先にはできない。行をタップしても
                      // 選択にはならずサブカテゴリの階層へ入るだけなので、チェックではなく
                      // 「選択中のカテゴリを含む」ことだけを色で示す（チェックを付けると選べる行に見える）。
                      const containsSelection = option.hasChildren && categoryParentId(notebookCategoryId) === option.id;
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => (option.hasChildren ? setCategoryPickerExpandedParentId(option.id) : selectCategory(option.id))}
                          style={({ pressed }) => [styles.categoryListRow, pressed && styles.categoryListRowPressed]}
                        >
                          <Text numberOfLines={1} style={[styles.categoryListLabel, (isActive || containsSelection) && styles.categoryListLabelActive]}>{option.label}</Text>
                          {option.hasChildren ? <IconSymbol name="chevron.right" size={15} color={colors.muted} /> : null}
                          {isActive ? <IconSymbol name="checkmark" size={15} color={colors.primary} /> : null}
                        </Pressable>
                      );
                    })}
                    <Pressable onPress={() => setShowNewCategoryField((current) => !current)} style={({ pressed }) => [styles.categoryListRow, pressed && styles.categoryListRowPressed]}>
                      <IconSymbol name="folder.badge.plus" size={15} color={colors.primary} />
                      <Text numberOfLines={1} style={styles.categoryListAddLabel}>{copy.newCategory}</Text>
                    </Pressable>
                  </>
                )}
              </View>
            ) : null}
            {showNewCategoryField ? (
              <View style={styles.inlineCategoryRow}>
                <TextInput value={newCategoryName} onChangeText={setNewCategoryName} onFocus={focusPlainField} placeholder={copy.categoryName} placeholderTextColor={colors.placeholder} style={[styles.input, styles.inlineCategoryInput]} onSubmitEditing={() => void createCategoryInline()} returnKeyType="done" />
                <Pressable onPress={() => void createCategoryInline()} style={({ pressed }) => [styles.inlineCategoryButton, pressed && styles.buttonPressed]}><Text style={styles.inlineCategoryButtonText}>{copy.save}</Text></Pressable>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>{copy.formulasLabel}</Text>
            <Text style={styles.hintText}>{copy.formulasHint}</Text>
            {notebookFormulas.map((formula) => (
              <View key={formula.id} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <TextInput
                    value={formula.explanation}
                    onChangeText={(text) => updateFormula(formula.id, { explanation: text })}
                    onFocus={focusPlainField}
                    placeholder={copy.formulaExplanationPlaceholder}
                    placeholderTextColor={colors.placeholder}
                    multiline
                    style={styles.formulaExplanationInput}
                  />
                  <Pressable onPress={() => setNotebookFormulas((current) => current.filter((entry) => entry.id !== formula.id))}><Text style={styles.removeStepText}>{copy.removeRow}</Text></Pressable>
                </View>
                <TextInput
                  value={formula.latex}
                  onChangeText={(text) => updateFormula(formula.id, { latex: text })}
                  onFocus={focusPlainField}
                  placeholder={copy.formulaLatexPlaceholder}
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.stepInput, styles.stepFieldBelow]}
                />
                {formula.latex ? (
                  <View style={styles.latexPreview}>
                    <LatexView latex={formula.latex} color={colors.foreground} fontSize={15} displayMode={false} />
                  </View>
                ) : null}
              </View>
            ))}
            <Pressable onPress={() => setNotebookFormulas((current) => [...current, { id: nextFormulaId(), explanation: "", latex: "" }])} style={({ pressed }) => [styles.addStepButton, pressed && styles.buttonPressed]}><Text style={styles.addStepText}>＋ {copy.addFormula}</Text></Pressable>

            <Text style={styles.fieldLabel}>{copy.localConstants}</Text>
            <Text style={styles.hintText}>{copy.localConstantsHint}</Text>
            <Text style={styles.hintText}>{copy.notMeasuredHint}</Text>
            {notebookLocalConstants.map((item) => {
              const railKey = localConstantFieldKey(item.id);
              const isRailForced = forcedSelection?.key === railKey;
              return (
                <View key={item.id} style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <TextInput
                      ref={(node) => { inputRefs.current[railKey] = node; }}
                      value={formatNameValue(item.symbol, item.expression)}
                      onChangeText={(text) => {
                        const { name, value } = parseNameValue(toHalfWidthAscii(text));
                        updateLocalConstant(item.id, { symbol: name, expression: value });
                        setForcedSelection((current) => (current?.key === railKey ? null : current));
                        setPrefixEntry(null);
                      }}
                      onFocus={() => setActiveRailKey(railKey)}
                      onSelectionChange={(event) => handleRailSelectionChange(railKey, event.nativeEvent.selection)}
                      selection={isRailForced ? forcedSelection.selection : undefined}
                      // **タップしても OS のキーボードは出さない。** キャレットを置くだけにして、数字・
                      // 演算子はアプリ内キーパッド、単位はレールで打つ。英字が要るときだけキーパッドの
                      // ⌨ キーで呼び出す（Web は showSoftInputOnFocus を持たず、物理キーボードで打てる）。
                      showSoftInputOnFocus={Platform.OS === "web" ? undefined : osKeyboardKey === railKey}
                      placeholder="v0=5m/s"
                      placeholderTextColor={colors.placeholder}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[styles.stepInput, styles.stepHeaderInput]}
                    />
                    <Pressable onPress={() => setNotebookLocalConstants((current) => current.filter((entry) => entry.id !== item.id))}><Text style={styles.removeStepText}>{copy.removeRow}</Text></Pressable>
                  </View>
                  {/* 有効数字に数えるかの切り替え。**`exactEdited` を必ず一緒に立てる**——これが
                      無いと applyPresetExactConstants が次の読み込みでシードの印を貼り直し、
                      プリセットで消した印が復活する（lib/calculator-store.tsx の該当コメント）。 */}
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityState={{ checked: item.exact === true }}
                    // チップは高さ24dpで、単位チップ等の既存の見た目に合わせてある。
                    // 当たり判定だけ広げてMaterialの最小に近づける（レイアウトは変えない）。
                    hitSlop={8}
                    onPress={() => updateLocalConstant(item.id, { exact: !item.exact, exactEdited: true })}
                    style={({ pressed }) => [styles.exactToggle, item.exact && styles.exactToggleActive, pressed && styles.buttonPressed]}
                  >
                    <Text style={[styles.exactToggleText, item.exact && styles.exactToggleTextActive]}>{item.exact ? "✓ " : ""}{copy.notMeasured}</Text>
                  </Pressable>
                </View>
              );
            })}
            <Pressable onPress={() => setNotebookLocalConstants((current) => [...current, { id: nextLocalConstantId(), symbol: "", expression: "" }])} style={({ pressed }) => [styles.addStepButton, pressed && styles.buttonPressed]}><Text style={styles.addStepText}>＋ {copy.addLocalConstant}</Text></Pressable>

            <Text style={styles.fieldLabel}>{copy.steps}</Text>
            <Text style={styles.hintText}>{copy.stepsHint}</Text>
            {notebookSteps.map((step) => {
              const railKey = stepFieldKey(step.id);
              const isRailForced = forcedSelection?.key === railKey;
              return (
              <View key={step.id} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <TextInput
                    ref={(node) => { inputRefs.current[railKey] = node; }}
                    value={formatNameValue(step.resultSymbol ?? "", step.expression)}
                    onChangeText={(text) => {
                      const { name, value } = parseNameValue(toHalfWidthAscii(text));
                      applyStepNameValue(step, name, value);
                      setForcedSelection((current) => (current?.key === railKey ? null : current));
                      setPrefixEntry(null);
                    }}
                    onFocus={() => setActiveRailKey(railKey)}
                    onSelectionChange={(event) => handleRailSelectionChange(railKey, event.nativeEvent.selection)}
                    selection={isRailForced ? forcedSelection.selection : undefined}
                    // 定数の欄と同じ（タップではキーボードを出さず、キャレットだけ置く）。
                    showSoftInputOnFocus={Platform.OS === "web" ? undefined : osKeyboardKey === railKey}
                    placeholder={copy.stepTitlePlaceholder}
                    placeholderTextColor={colors.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.stepInput, styles.stepHeaderInput]}
                  />
                  <Pressable onPress={() => setNotebookSteps((current) => current.filter((entry) => entry.id !== step.id))}><Text style={styles.removeStepText}>{copy.removeRow}</Text></Pressable>
                </View>
                <Text style={styles.fieldSubLabel}>{copy.resultTitleLabel}</Text>
                <TextInput value={step.title} onChangeText={(text) => updateStep(step.id, { title: text })} onFocus={focusPlainField} placeholder={copy.resultTitlePlaceholder} placeholderTextColor={colors.placeholder} style={[styles.stepInput, styles.stepFieldBelow]} />
                <TextInput value={step.targetUnit} onChangeText={(text) => updateStep(step.id, { targetUnit: text })} onFocus={focusPlainField} placeholder={copy.outputUnitLabel} placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={[styles.stepInput, styles.stepFieldBelow]} />
              </View>
              );
            })}
            <Pressable onPress={() => setNotebookSteps((current) => [...current, { id: nextStepId(), title: "", expression: "", targetUnit: "" }])} style={({ pressed }) => [styles.addStepButton, pressed && styles.buttonPressed]}><Text style={styles.addStepText}>＋ {copy.addStep}</Text></Pressable>

            {notebookError ? <Text style={styles.error}>{notebookError}</Text> : null}
            <Pressable disabled={isSaving} onPress={() => void saveNotebook()} style={({ pressed }) => [styles.saveButton, (pressed || isSaving) && styles.buttonPressed]}><Text style={styles.saveText}>{isSaving ? copy.saving : copy.save}</Text></Pressable>
          </ScrollView>

          {/* 「名前＝式」欄を編集している間だけ、シートの下端にキーパッドを出す。中身は電卓と同じ
              ExpressionKeyboard ＋ UnitRail で、上段に編集中の欄名と「閉じる」が付く。 */}
          {activeField ? (
            <NotebookKeypad
              language={language}
              layout={keyboardLayout}
              fieldLabel={activeField.label}
              isOsKeyboardActive={osKeyboardKey === activeField.key}
              labels={{ dismiss: copy.keypadDismiss }}
              symbols={activeField.symbols}
              unitRail={unitRail}
              onKey={handleKeypadKey}
              onInsert={insertIntoActiveField}
              onPrefix={handleKeypadPrefix}
              onApplyUnit={applyRailUnit}
              onMoveCaret={handleKeypadMoveCaret}
              onToggleOsKeyboard={toggleOsKeyboard}
              onDismiss={dismissKeypad}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] }, iconPressed: { opacity: 0.55 },
  modalBackdrop: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" }, sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: "92%", paddingBottom: 36, paddingHorizontal: 22, paddingTop: 10 }, sheetHandle: { alignSelf: "center", backgroundColor: colors.border, borderRadius: 3, height: 5, width: 42 }, sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", paddingBottom: 16, paddingTop: 17 }, sheetTitle: { color: colors.foreground, fontSize: 21, fontWeight: "700" }, closeButton: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  fieldLabel: { color: colors.foreground, fontSize: 13, fontWeight: "700", marginBottom: 7, marginTop: 12 }, hintText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 8, marginTop: -4 }, input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.foreground, fontFamily: mono, fontSize: 16, minHeight: 48, paddingHorizontal: 14 }, error: { color: colors.error, fontSize: 13, lineHeight: 19, marginTop: 11 }, saveButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 13, marginTop: 22, minHeight: 52, justifyContent: "center" }, saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
  // カテゴリの選択行（折りたたみ時）。入力欄（input）と同じ枠・同じ高さにして、
  // 「タイトル」「説明」と並んだときに1つのフォーム項目として読めるようにする。
  categoryValueRow: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 9, minHeight: 48, paddingHorizontal: 14 },
  categoryValueRowOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderColor: colors.primaryBorder },
  categoryValueCopy: { flex: 1, gap: 1, paddingVertical: 6 },
  categoryValueParent: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  categoryValueText: { color: colors.foreground, fontSize: 14, fontWeight: "600" },
  // 展開したリスト。選択行と地続きに見えるよう上の角だけ落とし、枠線を1本に見せる。
  categoryList: { backgroundColor: colors.surface, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderColor: colors.primaryBorder, borderTopWidth: 0, borderWidth: 1, overflow: "hidden" },
  categoryListRow: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 9, minHeight: 44, paddingHorizontal: 14 },
  categoryListRowPressed: { backgroundColor: colors.surfaceSecondary },
  // サブカテゴリの行は少し右へ寄せ、親の下位であることを示す。
  categoryListChildRow: { paddingLeft: 26 },
  categoryListLabel: { color: colors.foreground, flex: 1, fontSize: 14 },
  categoryListLabelActive: { color: colors.primary, fontWeight: "700" },
  categoryListBackLabel: { color: colors.primary, flex: 1, fontSize: 13, fontWeight: "700" },
  categoryListAddLabel: { color: colors.primary, flex: 1, fontSize: 14, fontWeight: "700" },
  inlineCategoryRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  inlineCategoryInput: { flex: 1, minHeight: 44 },
  inlineCategoryButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 10, justifyContent: "center", paddingHorizontal: 16 },
  inlineCategoryButtonText: { color: colors.onPrimary, fontSize: 13, fontWeight: "800" },
  stepCard: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 13, borderWidth: 1, marginTop: 8, padding: 11 }, stepHeader: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" }, removeStepText: { color: colors.error, fontSize: 12, fontWeight: "700" }, stepInput: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 10, borderWidth: 1, color: colors.foreground, fontFamily: mono, fontSize: 14, minHeight: 42, paddingHorizontal: 12 },
  // 見出し行（削除ボタンと同じ行）に置く欄。**`flex: 1` が無いと TextInput の幅がプレースホルダの
  // 文字幅で止まり、行の余白をタップしても何も起きない**（実機で「左の薄い文字を押すとやっと
  // キーボードが出た」と報告された）。欄そのものも下線だけでは入力欄と分からないので枠付きの箱にする。
  stepHeaderInput: { flex: 1 },
  stepFieldBelow: { marginTop: 6 }, addStepButton: { alignItems: "center", borderColor: colors.primaryBorder, borderRadius: 11, borderStyle: "dashed", borderWidth: 1, marginTop: 10, paddingVertical: 11 }, addStepText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  latexPreview: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 10, borderWidth: 1, marginTop: 8, padding: 10 },
  formulaExplanationInput: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 10, borderWidth: 1, color: colors.foreground, flex: 1, fontSize: 14, lineHeight: 19, minHeight: 42, paddingHorizontal: 12, paddingVertical: 6, textAlignVertical: "top" },
  fieldSubLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 9 },
  // 入力欄とキーパッドで縦を取り合うので、中身だけをスクロールさせる。
  body: { flexShrink: 1 },
  // 「測定値でない」のトグル。定数1つに1つ付くので、単位チップより控えめな大きさにして
  // 行が定数の式より目立たないようにする（既定はオフで、触る頻度が低い設定）。
  exactToggle: { alignSelf: "flex-start", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, marginTop: 8, paddingHorizontal: 9, paddingVertical: 5 },
  exactToggleActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  exactToggleText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  exactToggleTextActive: { color: colors.onPrimary },
});
