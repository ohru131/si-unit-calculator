import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { LatexView } from "@/components/ui/latex-view";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import {
  type CalculationNotebook,
  type CalculationNoteStep,
  type NotebookCategory,
  type NotebookFormula,
  type NotebookLocalConstant,
  UNCATEGORIZED_CATEGORY_ID,
} from "@/lib/calculator-store";
import { FORMULA_CHARACTER_GROUPS } from "@/lib/formula-characters";
import { localizedText, type AppLanguage } from "@/lib/i18n";
import { clampSelectionRange, getLocalConstantFieldSuggestions, getStepFieldSuggestions, insertConstantSymbol, mapCombinedSelectionToExpressionRange } from "@/lib/notebook-constant-suggestions";
import { evaluateNotebookSteps, formatNameValue, normalizeStepForSave, parseNameValue, resolveNotebookLocalConstants } from "@/lib/notebook-engine";
import { notebookFormulaRows } from "@/lib/notebook-formula-rows";
import { PRESET_NOTEBOOK_CATEGORIES } from "@/lib/notebook-formulas";
import { nextStepNamePatch } from "@/lib/notebook-step-title";
import { getUnitInsertionRange, replaceExpressionRange } from "@/lib/unit-input";
import { unitErrorMessage } from "@/lib/unit-errors";
import { compatibleUnitOptions } from "@/lib/unit-options";
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
  close: "Close", save: "Save", saving: "Saving…",
  notebookNew: "New notebook", notebookEdit: "Edit notebook",
  notebookTitleLabel: "Title", notebookDescriptionLabel: "Description",
  notebookTitlePlaceholder: "Bending stress", notebookDescriptionPlaceholder: "Optional note",
  category: "Category", newCategory: "New category", categoryName: "Category name", uncategorized: "Uncategorized",
  localConstants: "Local constants (inputs)", localConstantsHint: "Enter as name=value, e.g. v0=5m/s. Later rows can reference earlier ones.",
  invalidConstantName: "Enter each constant as name=value (e.g. v0=5m/s).",
  invalidStepName: "Enter each step as name=expression (e.g. v=v0+a*t), or remove the \"=\" to leave it unnamed.",
  addLocalConstant: "Add constant", steps: "Steps (results)", stepsHint: "Enter as name=expression, e.g. v=v0+a*t. Can reference constants and earlier steps.", addStep: "Add step", stepTitlePlaceholder: "v=v0+a*t",
  outputUnitLabel: "Display unit (optional)", removeRow: "Remove",
  formulaLatexPlaceholder: "Display formula, optional LaTeX (e.g. v = v_0 + at)",
  formulasLabel: "Formula explanations", formulasHint: "The formulas shown at the top of the notebook. The explanation is optional — a formula on its own is fine. Add as many as you like.",
  addFormula: "Add formula", formulaExplanationPlaceholder: "Explanation (e.g. This gives the velocity)",
  insert: "Insert", formulaCharactersLabel: "Symbols", definedVariablesLabel: "Defined variables", unitsLabel: "Units",
  symbolGroupSubscriptDigits: "Subscript digits", symbolGroupSubscriptLetters: "Subscript letters", symbolGroupGreekLower: "Greek (lowercase)", symbolGroupGreekUpper: "Greek (uppercase)",
  resultTitleLabel: "Display title", resultTitlePlaceholder: "e.g. Velocity v",
  formulaLatexRequired: "Each formula explanation needs its own formula (LaTeX). Remove the explanation or add the formula, otherwise it will be discarded on save.",
  validation: "Please fill in the required fields.",
} as const;
const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = {
  en: EN_COPY,
  ja: {
    close: "閉じる", save: "保存", saving: "保存中…",
    notebookNew: "新しい計算ノート", notebookEdit: "計算ノートを編集",
    notebookTitleLabel: "タイトル", notebookDescriptionLabel: "説明",
    notebookTitlePlaceholder: "曲げ応力", notebookDescriptionPlaceholder: "任意のメモ",
    category: "カテゴリ", newCategory: "新しいカテゴリ", categoryName: "カテゴリ名", uncategorized: "未分類",
    localConstants: "ローカル定数（入力値）", localConstantsHint: "「名前＝値」の形で入力します。例：v0=5m/s。後の行で前の行を参照できます。",
    invalidConstantName: "定数は「名前＝値」の形式（例：v0=5m/s）で入力してください。",
    invalidStepName: "手順は「名前＝式」の形式（例：v=v0+a*t）で入力するか、「＝」を外して名前なしにしてください。",
    addLocalConstant: "定数を追加", steps: "手順（結果）", stepsHint: "「名前＝式」の形で入力します。例：v=v0+a*t。定数や前の手順を参照できます。", addStep: "手順を追加", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "表示単位（任意）", removeRow: "削除",
    formulaLatexPlaceholder: "表示用の数式（任意、LaTeX。例：v = v_0 + at）",
    formulasLabel: "数式の解説", formulasHint: "ノートの先頭に出す数式です。説明文は任意で、数式だけでも構いません。いくつでも追加できます。",
    addFormula: "数式を追加", formulaExplanationPlaceholder: "説明文（例：速度を求める式です）",
    insert: "挿入", formulaCharactersLabel: "特殊記号", definedVariablesLabel: "定義済みの変数", unitsLabel: "単位",
    symbolGroupSubscriptDigits: "下付き数字", symbolGroupSubscriptLetters: "下付き文字", symbolGroupGreekLower: "ギリシャ文字（小文字）", symbolGroupGreekUpper: "ギリシャ文字（大文字）",
    resultTitleLabel: "表示タイトル", resultTitlePlaceholder: "例：速度 v",
    formulaLatexRequired: "数式の解説には数式（LaTeX）も入力してください。数式が不要なら説明文ごと削除してください（空のままだと保存時に消えます）。",
    validation: "必須項目を入力してください。",
  },
  es: {
    close: "Cerrar", save: "Guardar", saving: "Guardando…",
    notebookNew: "Nuevo cuaderno", notebookEdit: "Editar cuaderno",
    notebookTitleLabel: "Título", notebookDescriptionLabel: "Descripción",
    notebookTitlePlaceholder: "Esfuerzo de flexión", notebookDescriptionPlaceholder: "Nota opcional",
    category: "Categoría", newCategory: "Nueva categoría", categoryName: "Nombre de la categoría", uncategorized: "Sin categoría",
    localConstants: "Constantes locales (entradas)", localConstantsHint: "Escribe cada una como nombre=valor, por ejemplo v0=5m/s. Las filas siguientes pueden usar las anteriores.",
    invalidConstantName: "Escribe cada constante como nombre=valor (por ejemplo, v0=5m/s).",
    invalidStepName: "Escribe cada paso como nombre=expresión (por ejemplo, v=v0+a*t), o quita el \"=\" para dejarlo sin nombre.",
    addLocalConstant: "Añadir constante", steps: "Pasos (resultados)", stepsHint: "Escribe cada uno como nombre=expresión, por ejemplo v=v0+a*t. Puede usar constantes y pasos anteriores.", addStep: "Añadir paso", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "Unidad de visualización (opcional)", removeRow: "Quitar",
    formulaLatexPlaceholder: "Fórmula visible, LaTeX opcional (por ejemplo, v = v_0 + at)",
    formulasLabel: "Explicaciones de fórmulas", formulasHint: "Las fórmulas que se muestran al principio del cuaderno. La explicación es opcional: una fórmula sola también vale. Añade tantas como quieras.",
    addFormula: "Añadir fórmula", formulaExplanationPlaceholder: "Explicación (por ejemplo, esto calcula la velocidad)",
    insert: "Insertar", formulaCharactersLabel: "Símbolos", definedVariablesLabel: "Variables definidas", unitsLabel: "Unidades",
    symbolGroupSubscriptDigits: "Dígitos en subíndice", symbolGroupSubscriptLetters: "Letras en subíndice", symbolGroupGreekLower: "Griego (minúsculas)", symbolGroupGreekUpper: "Griego (mayúsculas)",
    resultTitleLabel: "Título mostrado", resultTitlePlaceholder: "p. ej., Velocidad v",
    formulaLatexRequired: "Cada explicación de fórmula necesita su propia fórmula (LaTeX). Elimina la explicación o añade la fórmula; de lo contrario se descartará al guardar.",
    validation: "Completa los campos obligatorios.",
  },
  "pt-BR": {
    close: "Fechar", save: "Salvar", saving: "Salvando…",
    notebookNew: "Novo caderno", notebookEdit: "Editar caderno",
    notebookTitleLabel: "Título", notebookDescriptionLabel: "Descrição",
    notebookTitlePlaceholder: "Tensão de flexão", notebookDescriptionPlaceholder: "Nota opcional",
    category: "Categoria", newCategory: "Nova categoria", categoryName: "Nome da categoria", uncategorized: "Sem categoria",
    localConstants: "Constantes locais (entradas)", localConstantsHint: "Digite cada uma como nome=valor, por exemplo v0=5m/s. As linhas seguintes podem usar as anteriores.",
    invalidConstantName: "Digite cada constante como nome=valor (por exemplo, v0=5m/s).",
    invalidStepName: "Digite cada etapa como nome=expressão (por exemplo, v=v0+a*t), ou remova o \"=\" para deixá-la sem nome.",
    addLocalConstant: "Adicionar constante", steps: "Etapas (resultados)", stepsHint: "Digite cada uma como nome=expressão, por exemplo v=v0+a*t. Pode referenciar constantes e etapas anteriores.", addStep: "Adicionar etapa", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "Unidade de exibição (opcional)", removeRow: "Remover",
    formulaLatexPlaceholder: "Fórmula exibida, LaTeX opcional (por exemplo, v = v_0 + at)",
    formulasLabel: "Explicações das fórmulas", formulasHint: "As fórmulas exibidas no início do caderno. A explicação é opcional — uma fórmula sozinha também serve. Adicione quantas quiser.",
    addFormula: "Adicionar fórmula", formulaExplanationPlaceholder: "Explicação (por exemplo, isso calcula a velocidade)",
    insert: "Inserir", formulaCharactersLabel: "Símbolos", definedVariablesLabel: "Variáveis definidas", unitsLabel: "Unidades",
    symbolGroupSubscriptDigits: "Dígitos subscritos", symbolGroupSubscriptLetters: "Letras subscritas", symbolGroupGreekLower: "Grego (minúsculas)", symbolGroupGreekUpper: "Grego (maiúsculas)",
    resultTitleLabel: "Título exibido", resultTitlePlaceholder: "ex.: Velocidade v",
    formulaLatexRequired: "Cada explicação de fórmula precisa de sua própria fórmula (LaTeX). Remova a explicação ou adicione a fórmula; caso contrário, ela será descartada ao salvar.",
    validation: "Preencha os campos obrigatórios.",
  },
  de: {
    close: "Schließen", save: "Speichern", saving: "Speichert…",
    notebookNew: "Neues Rechenheft", notebookEdit: "Rechenheft bearbeiten",
    notebookTitleLabel: "Titel", notebookDescriptionLabel: "Beschreibung",
    notebookTitlePlaceholder: "Biegespannung", notebookDescriptionPlaceholder: "Optionale Notiz",
    category: "Kategorie", newCategory: "Neue Kategorie", categoryName: "Kategoriename", uncategorized: "Ohne Kategorie",
    localConstants: "Lokale Konstanten (Eingaben)", localConstantsHint: "Gib jede als Name=Wert ein, zum Beispiel v0=5m/s. Spätere Zeilen können frühere referenzieren.",
    invalidConstantName: "Gib jede Konstante als Name=Wert ein (z. B. v0=5m/s).",
    invalidStepName: "Gib jeden Schritt als Name=Ausdruck ein (z. B. v=v0+a*t), oder entferne das \"=\", um ihn unbenannt zu lassen.",
    addLocalConstant: "Konstante hinzufügen", steps: "Schritte (Ergebnisse)", stepsHint: "Gib jeden als Name=Ausdruck ein, zum Beispiel v=v0+a*t. Kann Konstanten und frühere Schritte referenzieren.", addStep: "Schritt hinzufügen", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "Anzeigeeinheit (optional)", removeRow: "Entfernen",
    formulaLatexPlaceholder: "Anzeigeformel, optional LaTeX (z. B. v = v_0 + at)",
    formulasLabel: "Formelerklärungen", formulasHint: "Die Formeln, die oben im Rechenheft stehen. Die Erklärung ist optional — eine Formel allein genügt. Beliebig viele möglich.",
    addFormula: "Formel hinzufügen", formulaExplanationPlaceholder: "Erklärung (z. B. Damit wird die Geschwindigkeit berechnet)",
    insert: "Einfügen", formulaCharactersLabel: "Symbole", definedVariablesLabel: "Definierte Variablen", unitsLabel: "Einheiten",
    symbolGroupSubscriptDigits: "Tiefgestellte Ziffern", symbolGroupSubscriptLetters: "Tiefgestellte Buchstaben", symbolGroupGreekLower: "Griechisch (klein)", symbolGroupGreekUpper: "Griechisch (groß)",
    resultTitleLabel: "Anzeigetitel", resultTitlePlaceholder: "z. B. Geschwindigkeit v",
    formulaLatexRequired: "Jede Formelerklärung braucht eine eigene Formel (LaTeX). Entferne die Erklärung oder ergänze die Formel, sonst wird sie beim Speichern verworfen.",
    validation: "Bitte fülle die Pflichtfelder aus.",
  },
  fr: {
    close: "Fermer", save: "Enregistrer", saving: "Enregistrement…",
    notebookNew: "Nouveau carnet", notebookEdit: "Modifier le carnet",
    notebookTitleLabel: "Titre", notebookDescriptionLabel: "Description",
    notebookTitlePlaceholder: "Contrainte de flexion", notebookDescriptionPlaceholder: "Note facultative",
    category: "Catégorie", newCategory: "Nouvelle catégorie", categoryName: "Nom de la catégorie", uncategorized: "Sans catégorie",
    localConstants: "Constantes locales (entrées)", localConstantsHint: "Saisissez chacune sous la forme nom=valeur, par exemple v0=5m/s. Les lignes suivantes peuvent référencer les précédentes.",
    invalidConstantName: "Saisissez chaque constante sous la forme nom=valeur (par exemple v0=5m/s).",
    invalidStepName: "Saisissez chaque étape sous la forme nom=expression (par exemple v=v0+a*t), ou retirez le \"=\" pour la laisser sans nom.",
    addLocalConstant: "Ajouter une constante", steps: "Étapes (résultats)", stepsHint: "Saisissez chacune sous la forme nom=expression, par exemple v=v0+a*t. Peut référencer des constantes et des étapes précédentes.", addStep: "Ajouter une étape", stepTitlePlaceholder: "v=v0+a*t",
    outputUnitLabel: "Unité d'affichage (facultatif)", removeRow: "Retirer",
    formulaLatexPlaceholder: "Formule affichée, LaTeX facultatif (par exemple v = v_0 + at)",
    formulasLabel: "Explications des formules", formulasHint: "Les formules affichées en haut du carnet. L'explication est facultative : une formule seule suffit. Ajoutez-en autant que vous voulez.",
    addFormula: "Ajouter une formule", formulaExplanationPlaceholder: "Explication (par exemple, ceci calcule la vitesse)",
    insert: "Insérer", formulaCharactersLabel: "Symboles", definedVariablesLabel: "Variables définies", unitsLabel: "Unités",
    symbolGroupSubscriptDigits: "Chiffres en indice", symbolGroupSubscriptLetters: "Lettres en indice", symbolGroupGreekLower: "Grec (minuscules)", symbolGroupGreekUpper: "Grec (majuscules)",
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
  // mₒ・nₜ のようなUnicode下付き文字・ギリシャ文字は端末キーボードで直接入力できないため、
  // 「名前＝式」欄の直下に「タップで挿入」ボタンの列を出す。フィールドごとに一意なキー
  // （`local:${id}` / `step:${id}`）で、どのフィールドのレールを表示中かを管理する
  // （components/notebooks/notebook-detail.tsx と同じパターン）。
  // 【なぜフォーカスと連動させないか】以前は「フォーカス中のフィールド」に厳密に連動させ、onBlurで
  // 150ms後に消していた。しかしグループタブ（下の記号グループ切替）や単位・変数チップはどれも
  // TextInputの外にあるPressableなので、それを押した瞬間にonBlurが先に発火してレールごと消え、
  // 目的のボタンを押せなくなってしまう（実際に踏んだ不具合）。そこで「最後にフォーカスしたフィールド」の
  // レールを、別のフィールドにフォーカスが移るかモーダルを閉じるまで表示し続ける方式に変える。
  // TextInputのonBlurではもう何もしない（scheduleRailBlurは廃止）。
  const [activeRailKey, setActiveRailKey] = useState<string | null>(null);
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
  // フォーカス中フィールドで今どの文字グループ（下付き数字／下付き英字／ギリシャ小文字／ギリシャ大文字）を
  // 表示しているか。全グループを縦に並べるとモーダルが伸びすぎるため、タブで1グループだけを横スクロール表示する。
  const [activeCharacterGroupId, setActiveCharacterGroupId] = useState(FORMULA_CHARACTER_GROUPS[0].id);
  // 変数・単位レールは同じ2行構成（タブ＋チップ）を共有し、タブで「定義済みの変数」⇔「単位」を切り替える。
  // レールを3本（記号・変数・単位）縦に並べるとモーダルが伸びすぎるため、変数と単位を別々の行にせず
  // 記号レールと同じタブ切替パターンに揃えることで、単位チップを追加してもレールの縦幅を増やさない。
  const [activeAuxRailTab, setActiveAuxRailTab] = useState<"variables" | "units">("variables");
  // カテゴリピッカーの第2段（サブカテゴリ行）を、どの大分類について開いているか。閉じているときはnull。
  // 理科・高校物理のサブカテゴリが選ばれているなら、ピッカーの第2段を最初から開いておく
  // （自分の選択を見るための再ナビゲーションを不要にするため）。
  const [categoryPickerExpandedParentId, setCategoryPickerExpandedParentId] = useState<string | null>(
    () => PRESET_NOTEBOOK_CATEGORIES.find((category) => category.id === (notebook?.categoryId ?? initialCategoryId))?.parentId ?? null,
  );
  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // 親カテゴリID→子カテゴリ一覧。編集シートのカテゴリピッカーを2段（大分類→サブカテゴリ）にするための対応表。
  const childCategoriesByParentId = useMemo(() => {
    const map = new Map<string, { id: string; label: string }[]>();
    PRESET_NOTEBOOK_CATEGORIES.forEach((category) => {
      if (!category.parentId) return;
      const label = localizedText(category.label, language);
      map.set(category.parentId, [...(map.get(category.parentId) ?? []), { id: category.id, label }]);
    });
    return map;
  }, [language]);

  // ピッカーの第1段（最上位）。プリセットの大分類・葉カテゴリ、ユーザー作成カテゴリ、未分類の順に並べる。
  const topLevelCategoryOptions = useMemo(() => [
    ...PRESET_NOTEBOOK_CATEGORIES.filter((category) => !category.parentId).map((category) => ({ id: category.id, label: localizedText(category.label, language), hasChildren: childCategoriesByParentId.has(category.id) })),
    ...notebookCategories.map((category) => ({ id: category.id, label: category.name, hasChildren: false })),
    { id: UNCATEGORIZED_CATEGORY_ID, label: copy.uncategorized, hasChildren: false },
  ], [childCategoriesByParentId, copy.uncategorized, language, notebookCategories]);

  const categoryParentId = (categoryId: string) => PRESET_NOTEBOOK_CATEGORIES.find((category) => category.id === categoryId)?.parentId ?? null;

  // 編集画面の単位チップ用。まだ保存前で値が確定していないローカル定数も、ここで先行評価しておく
  // （detail画面のresolveNotebookLocalConstantsと同じ使い方）。1行の失敗（式が未入力・不正）は
  // 他の行の評価やUIを止めない。
  const { resolved: notebookResolvedConstants } = useMemo(
    () => resolveNotebookLocalConstants(notebookLocalConstants, globalConstants, language),
    [notebookLocalConstants, globalConstants, language],
  );
  const notebookResolvedBySymbol = useMemo(() => new Map(notebookResolvedConstants.map((item) => [item.symbol, item])), [notebookResolvedConstants]);
  const notebookConstantPool = useMemo(() => [...globalConstants, ...notebookResolvedConstants], [globalConstants, notebookResolvedConstants]);
  // 手順欄の単位チップ用に、現在の入力内容で手順を先行評価しておく（保存前のプレビューと同じ考え方）。
  const notebookStepResults = useMemo(() => evaluateNotebookSteps(notebookSteps, notebookConstantPool, language), [notebookSteps, notebookConstantPool, language]);
  // ローカル定数の式が他の定数記号を参照しているとき、その記号が単位記号と同じ綴りでも単位挿入で
  // 誤って上書きしないよう、既知の識別子として明示的に渡す（notebook-detail.tsxのconstantIdentifiersと同じ考え方）。
  const notebookConstantIdentifiers = useMemo(
    () => [...globalConstants.map((item) => item.symbol), ...notebookLocalConstants.map((item) => item.symbol.trim()).filter(Boolean)],
    [globalConstants, notebookLocalConstants],
  );

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
    // 新規作成のユーザーカテゴリは常に最上位の葉カテゴリなので、開いていたサブカテゴリ行は閉じる。
    setCategoryPickerExpandedParentId(null);
    setShowNewCategoryField(false);
    setNewCategoryName("");
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
  };

  // ギリシャ文字・下付き文字のボタン。既存の定義済み変数を挿すgetLocalConstantFieldSuggestions等とは違い、
  // これから作る新しい変数名を入力するためのもの。「名前＝式」の結合文字列に対してキャレット位置へ
  // そのまま文字を差し込み、結果をparseNameValueで割って書き戻す（名前部分にも式部分にも挿し込めるようにするため、
  // 挿入先をexpression側に限定するinsertConstantSymbolは使わない）。
  const insertCharacterIntoField = (key: string, combinedText: string, char: string, apply: (name: string, value: string) => void) => {
    const selection = clampedSelection(key, combinedText.length);
    const nextText = `${combinedText.slice(0, selection.start)}${char}${combinedText.slice(selection.end)}`;
    const { name, value } = parseNameValue(nextText);
    apply(name, value);
    const caret = selection.start + char.length;
    const caretSelection = { start: caret, end: caret };
    setFieldSelections((current) => ({ ...current, [key]: caretSelection }));
    setForcedSelection({ key, selection: caretSelection });
  };

  // 既に定義済みの変数（ローカル定数・グローバル定数・先行する手順の結果記号）を式へ挿入するボタン。
  // insertConstantSymbolはexpression側にだけ挿し込む（「名前＝式」の名前部分にキャレットがあっても
  // expressionの先頭へ丸める）ので、名前を誤って書き換えることはない。
  const insertVariableIntoField = (key: string, name: string, expression: string, symbol: string, applyExpression: (next: string) => void) => {
    const selection = clampedSelection(key, combinedCaretEnd(name, expression));
    const { expression: nextExpression, combinedCaret } = insertConstantSymbol(name, expression, selection.start, selection.end, symbol);
    applyExpression(nextExpression);
    const caretSelection = { start: combinedCaret, end: combinedCaret };
    setFieldSelections((current) => ({ ...current, [key]: caretSelection }));
    setForcedSelection({ key, selection: caretSelection });
  };

  /**
   * 単位チップの挿入。定数・変数チップ（insertVariableIntoField）と違い、単位はキャレット上に
   * 既存の単位があればそれを差し替え、数値の直後ならそこへ単位付けする（末尾決め打ちにすると、
   * 式の途中にカーソルを置いても最後の単位が書き換わってしまうため）。詳細画面
   * （components/notebooks/notebook-detail.tsx）のinsertUnitIntoFieldと同じロジックを、
   * こちらの「名前＝式」結合フィールド向けに揃えたもの。
   */
  const insertUnitIntoField = (key: string, name: string, expression: string, symbol: string, identifiers: string[], applyExpression: (next: string) => void) => {
    const selection = clampedSelection(key, combinedCaretEnd(name, expression));
    const selected = mapCombinedSelectionToExpressionRange(name, expression, selection.start, selection.end);
    const range = selected.start === selected.end ? getUnitInsertionRange(expression, selected.start, identifiers) : selected;
    applyExpression(replaceExpressionRange(expression, range.start, range.end, symbol));
    const combinedCaret = (name ? name.length + 1 : 0) + range.start + symbol.length;
    const caretSelection = { start: combinedCaret, end: combinedCaret };
    setFieldSelections((current) => ({ ...current, [key]: caretSelection }));
    setForcedSelection({ key, selection: caretSelection });
  };

  const symbolGroupLabel = (id: (typeof FORMULA_CHARACTER_GROUPS)[number]["id"]) => {
    if (id === "subscriptDigits") return copy.symbolGroupSubscriptDigits;
    if (id === "subscriptLetters") return copy.symbolGroupSubscriptLetters;
    if (id === "greekLower") return copy.symbolGroupGreekLower;
    return copy.symbolGroupGreekUpper;
  };

  // フォーカス中フィールドの直下に出す、ギリシャ文字・下付き文字のボタン列。
  // 全グループを縦に並べるとモーダルが伸びすぎるため、タブ（横スクロール）でグループを切り替え、
  // 選んだグループの文字だけを横スクロールの1行で出す（縦方向は常に2行分だけで収まる）。
  const renderCharacterRail = (key: string, onInsert: (char: string) => void) => {
    if (activeRailKey !== key) return null;
    const activeGroup = FORMULA_CHARACTER_GROUPS.find((group) => group.id === activeCharacterGroupId) ?? FORMULA_CHARACTER_GROUPS[0];
    return (
      <View>
        <Text style={styles.railLabel}>{copy.formulaCharactersLabel}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.railGroupTabs}>
          {FORMULA_CHARACTER_GROUPS.map((group) => (
            <Pressable key={group.id} onPress={() => setActiveCharacterGroupId(group.id)} style={({ pressed }) => [styles.railGroupTab, activeCharacterGroupId === group.id && styles.railGroupTabActive, pressed && styles.buttonPressed]}>
              <Text style={[styles.railGroupTabText, activeCharacterGroupId === group.id && styles.railGroupTabTextActive]}>{symbolGroupLabel(group.id)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.unitRail}>
          {activeGroup.chars.map((char) => (
            <Pressable key={char} accessibilityLabel={`${copy.insert} ${char}`} onPress={() => onInsert(char)} style={({ pressed }) => [styles.unitChip, pressed && styles.buttonPressed]}>
              <Text style={styles.unitChipText}>{char}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  // アクティブフィールドの直下に出す、「定義済みの変数」と「単位」のボタン列。
  // どちらも候補が無ければ何も出さない。両方に候補があるときだけ記号レールと同じ
  // タブ切替（横スクロール1行）を足し、片方しか無いときはタブを省いてラベルだけにする
  // （レールを縦に3本並べるとモーダルが伸びすぎるため、変数と単位を別の行にせず、
  // 記号レールと同じ「タブ＋チップの2行」構成を共有してレール1本分の高さに収める）。
  const renderAuxRail = (key: string, symbols: string[], unitOptions: { symbol: string; label: string }[], onInsertVariable: (symbol: string) => void, onInsertUnit: (symbol: string) => void) => {
    if (activeRailKey !== key) return null;
    const hasVariables = symbols.length > 0;
    const hasUnits = unitOptions.length > 0;
    if (!hasVariables && !hasUnits) return null;
    const showTabs = hasVariables && hasUnits;
    const activeTab = showTabs ? activeAuxRailTab : (hasVariables ? "variables" : "units");
    const items = activeTab === "variables"
      ? symbols.map((symbol) => ({ chipKey: symbol, label: symbol, onPress: () => onInsertVariable(symbol) }))
      : unitOptions.map((unitOption) => ({ chipKey: unitOption.symbol, label: unitOption.label, onPress: () => onInsertUnit(unitOption.symbol) }));
    return (
      <View>
        {showTabs ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.railGroupTabs}>
            <Pressable onPress={() => setActiveAuxRailTab("variables")} style={({ pressed }) => [styles.railGroupTab, activeTab === "variables" && styles.railGroupTabActive, pressed && styles.buttonPressed]}>
              <Text style={[styles.railGroupTabText, activeTab === "variables" && styles.railGroupTabTextActive]}>{copy.definedVariablesLabel}</Text>
            </Pressable>
            <Pressable onPress={() => setActiveAuxRailTab("units")} style={({ pressed }) => [styles.railGroupTab, activeTab === "units" && styles.railGroupTabActive, pressed && styles.buttonPressed]}>
              <Text style={[styles.railGroupTabText, activeTab === "units" && styles.railGroupTabTextActive]}>{copy.unitsLabel}</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <Text style={styles.railLabel}>{hasVariables ? copy.definedVariablesLabel : copy.unitsLabel}</Text>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.unitRail}>
          {items.map((item) => (
            <Pressable key={item.chipKey} accessibilityLabel={`${copy.insert} ${item.label}`} onPress={item.onPress} style={({ pressed }) => [styles.unitChip, pressed && styles.buttonPressed]}>
              <Text style={styles.unitChipText}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={closeNotebookEditor}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
        <View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>{editingNotebookId ? copy.notebookEdit : copy.notebookNew}</Text></View><Pressable accessibilityLabel={copy.close} onPress={closeNotebookEditor} style={({ pressed }) => [styles.closeButton, pressed && styles.iconPressed]}><IconSymbol name="xmark" size={21} color={colors.muted} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>{copy.notebookTitleLabel}</Text>
            <TextInput value={notebookTitle} onChangeText={setNotebookTitle} placeholder={copy.notebookTitlePlaceholder} placeholderTextColor={colors.placeholder} style={styles.input} />
            <Text style={styles.fieldLabel}>{copy.notebookDescriptionLabel}</Text>
            <TextInput value={notebookDescription} onChangeText={setNotebookDescription} placeholder={copy.notebookDescriptionPlaceholder} placeholderTextColor={colors.placeholder} style={styles.input} />

            <Text style={styles.fieldLabel}>{copy.category}</Text>
            <View style={styles.categoryPicker}>
              {topLevelCategoryOptions.map((option) => {
                // 大分類チップは「選択中」または「選択中カテゴリの親」のとき強調表示する（子を開いていなくても今どこにいるか分かるように）。
                const isActive = notebookCategoryId === option.id || (option.hasChildren && categoryParentId(notebookCategoryId) === option.id);
                // サブカテゴリ行は最上位チップ全部の下に出るため、どの大分類を開いているのかを
                // チップ側でも示す（未選択のまま開いただけの状態を「選択中」と区別する）。
                const isExpanded = categoryPickerExpandedParentId === option.id && !isActive;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      if (option.hasChildren) {
                        // 大分類はグループ化のためだけの存在でノート自体の所属先にはできない。タップではサブカテゴリ行を開閉するだけにする。
                        setCategoryPickerExpandedParentId((current) => (current === option.id ? null : option.id));
                        return;
                      }
                      setNotebookCategoryId(option.id);
                      setCategoryPickerExpandedParentId(null);
                    }}
                    style={({ pressed }) => [styles.sectionChip, isExpanded && styles.sectionChipExpanded, isActive && styles.sectionChipActive, pressed && styles.buttonPressed]}
                  >
                    <Text style={[styles.sectionChipText, isExpanded && styles.sectionChipExpandedText, isActive && styles.sectionChipTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
              <Pressable onPress={() => setShowNewCategoryField((current) => !current)} style={({ pressed }) => [styles.sectionChip, pressed && styles.buttonPressed]}>
                <Text style={styles.sectionChipText}>＋ {copy.newCategory}</Text>
              </Pressable>
            </View>
            {categoryPickerExpandedParentId ? (
              <View style={styles.categoryPickerChild}>
                {(childCategoriesByParentId.get(categoryPickerExpandedParentId) ?? []).map((option) => (
                  <Pressable key={option.id} onPress={() => setNotebookCategoryId(option.id)} style={({ pressed }) => [styles.sectionChip, notebookCategoryId === option.id && styles.sectionChipActive, pressed && styles.buttonPressed]}>
                    <Text style={[styles.sectionChipText, notebookCategoryId === option.id && styles.sectionChipTextActive]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {showNewCategoryField ? (
              <View style={styles.inlineCategoryRow}>
                <TextInput value={newCategoryName} onChangeText={setNewCategoryName} placeholder={copy.categoryName} placeholderTextColor={colors.placeholder} style={[styles.input, styles.inlineCategoryInput]} onSubmitEditing={() => void createCategoryInline()} returnKeyType="done" />
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
                  placeholder={copy.formulaLatexPlaceholder}
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.stepInput}
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
            {notebookLocalConstants.map((item, constantIndex) => {
              const railKey = localConstantFieldKey(item.id);
              const isRailForced = forcedSelection?.key === railKey;
              return (
                <View key={item.id} style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <TextInput
                      value={formatNameValue(item.symbol, item.expression)}
                      onChangeText={(text) => {
                        const { name, value } = parseNameValue(text);
                        updateLocalConstant(item.id, { symbol: name, expression: value });
                        setForcedSelection((current) => (current?.key === railKey ? null : current));
                      }}
                      onFocus={() => setActiveRailKey(railKey)}
                      onSelectionChange={(event) => handleRailSelectionChange(railKey, event.nativeEvent.selection)}
                      selection={isRailForced ? forcedSelection.selection : undefined}
                      placeholder="v0=5m/s"
                      placeholderTextColor={colors.placeholder}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.stepInput}
                    />
                    <Pressable onPress={() => setNotebookLocalConstants((current) => current.filter((entry) => entry.id !== item.id))}><Text style={styles.removeStepText}>{copy.removeRow}</Text></Pressable>
                  </View>
                  {renderCharacterRail(railKey, (char) =>
                    insertCharacterIntoField(railKey, formatNameValue(item.symbol, item.expression), char, (name, value) => updateLocalConstant(item.id, { symbol: name, expression: value })),
                  )}
                  {renderAuxRail(
                    railKey,
                    getLocalConstantFieldSuggestions(notebookLocalConstants, globalConstants, constantIndex),
                    // クーロンの法則のkのように、次元に対応するグループが無い定数でも自分の式（例:"8.99e9N*m^2/C^2"）から
                    // 単位候補を組み立てられるよう、quantityが未評価でもexpressionを手掛かりに渡す。
                    compatibleUnitOptions(notebookResolvedBySymbol.get(item.symbol.trim())?.quantity, unitSystem, { expression: item.expression }),
                    (symbol) => insertVariableIntoField(railKey, item.symbol, item.expression, symbol, (nextExpression) => updateLocalConstant(item.id, { expression: nextExpression })),
                    (symbol) => insertUnitIntoField(railKey, item.symbol, item.expression, symbol, notebookConstantIdentifiers, (nextExpression) => updateLocalConstant(item.id, { expression: nextExpression })),
                  )}
                </View>
              );
            })}
            <Pressable onPress={() => setNotebookLocalConstants((current) => [...current, { id: nextLocalConstantId(), symbol: "", expression: "" }])} style={({ pressed }) => [styles.addStepButton, pressed && styles.buttonPressed]}><Text style={styles.addStepText}>＋ {copy.addLocalConstant}</Text></Pressable>

            <Text style={styles.fieldLabel}>{copy.steps}</Text>
            <Text style={styles.hintText}>{copy.stepsHint}</Text>
            {notebookSteps.map((step, stepIndex) => {
              const railKey = stepFieldKey(step.id);
              // この手順の式で参照できる識別子（ローカル定数・グローバル定数・先行手順の結果記号）。
              // 変数チップの候補と、単位挿入で保護すべき識別子は同じ集合なので1回だけ求めて共有する。
              const stepFieldIdentifiers = getStepFieldSuggestions(notebookLocalConstants, globalConstants, notebookSteps, stepIndex);
              const isRailForced = forcedSelection?.key === railKey;
              return (
              <View key={step.id} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <TextInput
                    value={formatNameValue(step.resultSymbol ?? "", step.expression)}
                    onChangeText={(text) => {
                      const { name, value } = parseNameValue(text);
                      applyStepNameValue(step, name, value);
                      setForcedSelection((current) => (current?.key === railKey ? null : current));
                    }}
                    onFocus={() => setActiveRailKey(railKey)}
                    onSelectionChange={(event) => handleRailSelectionChange(railKey, event.nativeEvent.selection)}
                    selection={isRailForced ? forcedSelection.selection : undefined}
                    placeholder={copy.stepTitlePlaceholder}
                    placeholderTextColor={colors.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.stepInput}
                  />
                  <Pressable onPress={() => setNotebookSteps((current) => current.filter((entry) => entry.id !== step.id))}><Text style={styles.removeStepText}>{copy.removeRow}</Text></Pressable>
                </View>
                {renderCharacterRail(railKey, (char) =>
                  insertCharacterIntoField(railKey, formatNameValue(step.resultSymbol ?? "", step.expression), char, (name, value) => applyStepNameValue(step, name, value)),
                )}
                {renderAuxRail(
                  railKey,
                  stepFieldIdentifiers,
                  // 手順は表示単位(targetUnit)が決まっていればそれを、無ければ式自体を手掛かりにする
                  // （notebook-detail.tsxの結果チップと同じ考え方。運動量など次元に対応するグループが
                  // 無い量でも、表示単位から接頭辞違いの候補を出せる）。
                  compatibleUnitOptions(notebookStepResults[stepIndex]?.quantity, unitSystem, { expression: step.targetUnit.trim() || step.expression }),
                  (symbol) => insertVariableIntoField(railKey, step.resultSymbol ?? "", step.expression, symbol, (nextExpression) => updateStep(step.id, { expression: nextExpression })),
                  // 単位挿入で潰してはいけない識別子には、定数だけでなく**先行する手順の結果記号**も含める。
                  // 手順に m のような単位と同じ綴りの名前を付けていると、それを参照している式で
                  // 単位チップを押したときに変数参照の方が単位として書き換えられてしまうため。
                  // チップに出す候補（stepFieldIdentifiers）がちょうどその式で使える識別子の集合なので、同じものを渡す。
                  (symbol) => insertUnitIntoField(railKey, step.resultSymbol ?? "", step.expression, symbol, stepFieldIdentifiers, (nextExpression) => updateStep(step.id, { expression: nextExpression })),
                )}
                <Text style={styles.fieldSubLabel}>{copy.resultTitleLabel}</Text>
                <TextInput value={step.title} onChangeText={(text) => updateStep(step.id, { title: text })} placeholder={copy.resultTitlePlaceholder} placeholderTextColor={colors.placeholder} style={styles.stepInput} />
                <TextInput value={step.targetUnit} onChangeText={(text) => updateStep(step.id, { targetUnit: text })} placeholder={copy.outputUnitLabel} placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.stepInput} />
              </View>
              );
            })}
            <Pressable onPress={() => setNotebookSteps((current) => [...current, { id: nextStepId(), title: "", expression: "", targetUnit: "" }])} style={({ pressed }) => [styles.addStepButton, pressed && styles.buttonPressed]}><Text style={styles.addStepText}>＋ {copy.addStep}</Text></Pressable>

            {notebookError ? <Text style={styles.error}>{notebookError}</Text> : null}
            <Pressable disabled={isSaving} onPress={() => void saveNotebook()} style={({ pressed }) => [styles.saveButton, (pressed || isSaving) && styles.buttonPressed]}><Text style={styles.saveText}>{isSaving ? copy.saving : copy.save}</Text></Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] }, iconPressed: { opacity: 0.55 },
  modalBackdrop: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" }, sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: "92%", paddingBottom: 36, paddingHorizontal: 22, paddingTop: 10 }, sheetHandle: { alignSelf: "center", backgroundColor: colors.border, borderRadius: 3, height: 5, width: 42 }, sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", paddingBottom: 16, paddingTop: 17 }, sheetTitle: { color: colors.foreground, fontSize: 21, fontWeight: "700" }, closeButton: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  fieldLabel: { color: colors.foreground, fontSize: 13, fontWeight: "700", marginBottom: 7, marginTop: 12 }, hintText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 8, marginTop: -4 }, input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.foreground, fontFamily: mono, fontSize: 16, minHeight: 48, paddingHorizontal: 14 }, error: { color: colors.error, fontSize: 13, lineHeight: 19, marginTop: 11 }, saveButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 13, marginTop: 22, minHeight: 52, justifyContent: "center" }, saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
  sectionChip: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8 }, sectionChipActive: { backgroundColor: colors.primaryFill }, sectionChipText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, sectionChipTextActive: { color: colors.onPrimary },
  categoryPicker: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  sectionChipExpanded: { backgroundColor: colors.primarySurface },
  sectionChipExpandedText: { color: colors.primary },
  // サブカテゴリ行。少し右にインデントし、上に余白を足して親カテゴリの下位であることを視覚的に示す。
  categoryPickerChild: { borderLeftColor: colors.border, borderLeftWidth: 2, flexDirection: "row", flexWrap: "wrap", gap: 7, marginLeft: 6, marginTop: 8, paddingLeft: 8 },
  inlineCategoryRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  inlineCategoryInput: { flex: 1, minHeight: 44 },
  inlineCategoryButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 10, justifyContent: "center", paddingHorizontal: 16 },
  inlineCategoryButtonText: { color: colors.onPrimary, fontSize: 13, fontWeight: "800" },
  stepCard: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 13, borderWidth: 1, marginTop: 8, padding: 11 }, stepHeader: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" }, removeStepText: { color: colors.error, fontSize: 12, fontWeight: "700" }, stepInput: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, color: colors.foreground, fontFamily: mono, fontSize: 14, minHeight: 38, paddingHorizontal: 0 }, addStepButton: { alignItems: "center", borderColor: colors.primaryBorder, borderRadius: 11, borderStyle: "dashed", borderWidth: 1, marginTop: 10, paddingVertical: 11 }, addStepText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  latexPreview: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 10, borderWidth: 1, marginTop: 8, padding: 10 },
  formulaExplanationInput: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, color: colors.foreground, flex: 1, fontSize: 14, lineHeight: 19, minHeight: 38, paddingHorizontal: 0, paddingVertical: 6, textAlignVertical: "top" },
  fieldSubLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 9 },
  // 記号ボタン列（ギリシャ文字・下付き文字・定義済み変数）。横スクロール1行に収め、モーダルが縦に伸びすぎないようにする。
  railLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.3, marginTop: 8, textTransform: "uppercase" },
  railGroupTabs: { gap: 6, paddingTop: 6 },
  railGroupTab: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  railGroupTabActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  railGroupTabText: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  railGroupTabTextActive: { color: colors.onPrimary },
  unitRail: { gap: 6, paddingTop: 6 },
  unitChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  unitChipText: { color: colors.primary, fontFamily: mono, fontSize: 12, fontWeight: "800" },
});
