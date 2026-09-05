import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { NotebookCategoryGrid } from "@/components/notebooks/notebook-category-grid";
import { NotebookEditorSheet } from "@/components/notebooks/notebook-editor-sheet";
import { NotebookList } from "@/components/notebooks/notebook-list";
import { ScreenContainer } from "@/components/screen-container";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import {
  type CalculationNotebook,
  UNCATEGORIZED_CATEGORY_ID,
  useCalculatorStore,
} from "@/lib/calculator-store";
import { useGlobalSettings } from "@/lib/global-settings";
import { localizedText, type AppLanguage } from "@/lib/i18n";
import { PRESET_NOTEBOOK_CATEGORIES } from "@/lib/notebook-formulas";
import { buildCategorySearchLabels, searchNotebooks } from "@/lib/notebook-search";
import { exportNotebooksBackup } from "@/lib/notebooks-backup-file";
import { unitErrorMessage } from "@/lib/unit-errors";
import { formatQuantity, SavedConstant } from "@/lib/units";

type TopSection = "notebooks" | "constants";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_COPY = {
  notebooksTab: "Notebooks", constantsTab: "Global constants",
  close: "Close", save: "Save", saving: "Saving…", delete: "Delete", cancel: "Cancel",
  constantEmpty: "No constants yet", constantEmptyHint: "Store a reusable value such as W = 3cm.",
  titleLabel: "Name", descriptionLabel: "Description", expressionLabel: "Expression", symbolLabel: "Symbol",
  constantEditor: "Constant", constantNew: "New constant",
  deleteConfirm: "Delete this item? This cannot be undone.", validation: "Please fill in the required fields.",
  notebookNew: "New notebook", uncategorized: "Uncategorized",
  notebookSearch: "Search all notebooks", searchClear: "Clear search",
  // カテゴリカードからの書き出し（handleExportCategoryNotebooks）専用の通知文。
  // 統合バックアップは設定画面（lib/global-settings.tsxのbackupNotebooksExportDone）へ移設した。
  categoryExportDone: "Notebooks backup exported.",
} as const;
const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = {
  en: EN_COPY,
  ja: {
      notebooksTab: "計算ノート", constantsTab: "グローバル定数",
    close: "閉じる", save: "保存", saving: "保存中…", delete: "削除", cancel: "キャンセル",
    constantEmpty: "定数はまだありません", constantEmptyHint: "例：W = 3cm のように、よく使う値を保存できます。",
    titleLabel: "名前", descriptionLabel: "説明", expressionLabel: "式", symbolLabel: "記号",
    constantEditor: "定数", constantNew: "新しい定数",
    deleteConfirm: "この項目を削除しますか？元に戻せません。", validation: "必須項目を入力してください。",
    notebookNew: "新しい計算ノート", uncategorized: "未分類",
    notebookSearch: "すべての計算ノートを検索", searchClear: "検索をクリア",
    categoryExportDone: "計算ノートのバックアップを書き出しました。",
  },
  es: {
      notebooksTab: "Cuadernos", constantsTab: "Constantes globales",
    close: "Cerrar", save: "Guardar", saving: "Guardando…", delete: "Eliminar", cancel: "Cancelar",
    constantEmpty: "Aún no hay constantes", constantEmptyHint: "Guarda un valor reutilizable, por ejemplo W = 3cm.",
    titleLabel: "Nombre", descriptionLabel: "Descripción", expressionLabel: "Expresión", symbolLabel: "Símbolo",
    constantEditor: "Constante", constantNew: "Nueva constante",
    deleteConfirm: "¿Eliminar este elemento? Esta acción no se puede deshacer.", validation: "Completa los campos obligatorios.",
    notebookNew: "Nuevo cuaderno", uncategorized: "Sin categoría",
    notebookSearch: "Buscar en todos los cuadernos", searchClear: "Borrar la búsqueda",
    categoryExportDone: "Se exportó la copia de seguridad de los cuadernos.",
  },
  "pt-BR": {
      notebooksTab: "Cadernos", constantsTab: "Constantes globais",
    close: "Fechar", save: "Salvar", saving: "Salvando…", delete: "Excluir", cancel: "Cancelar",
    constantEmpty: "Ainda não há constantes", constantEmptyHint: "Salve um valor reutilizável, por exemplo W = 3cm.",
    titleLabel: "Nome", descriptionLabel: "Descrição", expressionLabel: "Expressão", symbolLabel: "Símbolo",
    constantEditor: "Constante", constantNew: "Nova constante",
    deleteConfirm: "Excluir este item? Isso não pode ser desfeito.", validation: "Preencha os campos obrigatórios.",
    notebookNew: "Novo caderno", uncategorized: "Sem categoria",
    notebookSearch: "Buscar em todos os cadernos", searchClear: "Limpar a busca",
    categoryExportDone: "Backup dos cadernos exportado.",
  },
  de: {
      notebooksTab: "Rechenhefte", constantsTab: "Globale Konstanten",
    close: "Schließen", save: "Speichern", saving: "Speichert…", delete: "Löschen", cancel: "Abbrechen",
    constantEmpty: "Noch keine Konstanten", constantEmptyHint: "Speichere einen wiederverwendbaren Wert, zum Beispiel W = 3cm.",
    titleLabel: "Name", descriptionLabel: "Beschreibung", expressionLabel: "Ausdruck", symbolLabel: "Symbol",
    constantEditor: "Konstante", constantNew: "Neue Konstante",
    deleteConfirm: "Diesen Eintrag löschen? Das kann nicht rückgängig gemacht werden.", validation: "Bitte fülle die Pflichtfelder aus.",
    notebookNew: "Neues Rechenheft", uncategorized: "Ohne Kategorie",
    notebookSearch: "Alle Rechenhefte durchsuchen", searchClear: "Suche löschen",
    categoryExportDone: "Sicherung der Rechenhefte exportiert.",
  },
  fr: {
      notebooksTab: "Carnets", constantsTab: "Constantes globales",
    close: "Fermer", save: "Enregistrer", saving: "Enregistrement…", delete: "Supprimer", cancel: "Annuler",
    constantEmpty: "Aucune constante pour le moment", constantEmptyHint: "Enregistrez une valeur réutilisable, par exemple W = 3cm.",
    titleLabel: "Nom", descriptionLabel: "Description", expressionLabel: "Expression", symbolLabel: "Symbole",
    constantEditor: "Constante", constantNew: "Nouvelle constante",
    deleteConfirm: "Supprimer cet élément ? Cette action est irréversible.", validation: "Veuillez remplir les champs obligatoires.",
    notebookNew: "Nouveau carnet", uncategorized: "Sans catégorie",
    notebookSearch: "Rechercher dans tous les carnets", searchClear: "Effacer la recherche",
    categoryExportDone: "Sauvegarde des carnets exportée.",
  },
};

export default function ConstantsScreen() {
  const router = useRouter();
  const { notebookExpression, notebookUnit } = useLocalSearchParams<{ notebookExpression?: string | string[]; notebookUnit?: string | string[] }>();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { language, locale, unitSystem } = useGlobalSettings();
  const {
    constants,
    customUnits,
    isLoading,
    notebooks,
    notebookCategories,
    removeConstant,
    removeNotebook,
    removeNotebookCategory,
    recordNotebookUse,
    setActiveNotebookId,
    toggleNotebookPinned,
    upsertConstant,
    upsertNotebook,
    upsertNotebookCategory,
  } = useCalculatorStore();

  const [topSection, setTopSection] = useState<TopSection>("notebooks");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [browsingParentCategoryId, setBrowsingParentCategoryId] = useState<string | null>(null);
  // 計算ノートの検索語。**カテゴリ階層の状態（selectedCategoryId・browsingParentCategoryId）とは
  // 独立に持つ**。検索中はそれらを見ずに検索結果を出し、検索欄を空にすればさっきまで見ていた
  // 階層へそのまま戻る（検索のたびに階層を巻き戻すと、目当てが無かったときに辿り直しになる）。
  const [notebookSearchQuery, setNotebookSearchQuery] = useState("");

  // グローバル定数の編集シート。
  const [constantEditorVisible, setConstantEditorVisible] = useState(false);
  const [editingConstantSymbol, setEditingConstantSymbol] = useState<string | undefined>();
  const [constantSymbolInput, setConstantSymbolInput] = useState("");
  const [constantExpressionInput, setConstantExpressionInput] = useState("");
  const [constantError, setConstantError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteConstant, setPendingDeleteConstant] = useState<string | null>(null);

  // 計算ノートの編集シート（実体は components/notebooks/notebook-editor-sheet.tsx の
  // NotebookEditorSheet）。この画面はvisible・編集対象・プリセット初期値を渡すだけで、
  // フォームの中身（入力欄・レールの状態など）はコンポーネント側が保持する。
  const [notebookEditorVisible, setNotebookEditorVisible] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<CalculationNotebook | undefined>();
  // 開くたびに増やしてシートのkeyにする。keyが変わるとコンポーネントが作り直され、フォームの初期値が
  // propsから引き直される（＝開閉に合わせてstateを組み直すuseEffectが不要になる）。あわせて、前回
  // 開いたときのレールの状態・キャレット位置が次に開いたときへ残る不具合（PR #25で2度踏んだ）が
  // 構造的に起きえなくなる。閉じるときはkeyを変えないので、Modalのスライドアウトはそのまま出る。
  const [notebookEditorSession, setNotebookEditorSession] = useState(0);
  // 電卓画面の「保存」から飛んできたときの初期手順（新規作成のときだけ使う）。
  const [notebookPresetExpression, setNotebookPresetExpression] = useState<string | undefined>();
  const [notebookPresetTargetUnit, setNotebookPresetTargetUnit] = useState<string | undefined>();
  // カテゴリカードからの書き出し（handleExportCategoryNotebooks）専用の通知。統合バックアップの
  // インポート・エクスポートは設定画面（components/settings/backup-card.tsx）へ移設したので、
  // ここに残るのはカテゴリ単位のエクスポート結果だけになった。
  const [categoryExportNotice, setCategoryExportNotice] = useState("");

  const copy = COPY[language];

  // エンジンのエラー(UnitError)は現在の言語で表示する。UnitError以外は従来どおり
  // Error.message をそのまま出す（バックアップ処理など別系統のエラーもここを通るため）。
  // このファイルのcatch節はどれもフォールバックがcopy.validationで共通なので、まとめて1箇所にする。
  const engineErrorMessage = (cause: unknown) => (cause instanceof Error ? (unitErrorMessage(cause, language) ?? cause.message) : copy.validation);

  const sectionItems: { id: TopSection; label: string }[] = [
    { id: "notebooks", label: copy.notebooksTab },
    { id: "constants", label: copy.constantsTab },
  ];

  // 「高校物理」のような大分類（サブカテゴリを束ねるだけの親）は、ノート自体の所属先には選べないようにする。
  const parentCategoryIds = useMemo(() => new Set(PRESET_NOTEBOOK_CATEGORIES.map((category) => category.parentId).filter((id): id is string => Boolean(id))), []);

  const categoryOptions = useMemo(() => [
    ...PRESET_NOTEBOOK_CATEGORIES.filter((category) => !parentCategoryIds.has(category.id)).map((category) => ({ id: category.id, label: localizedText(category.label, language) })),
    ...notebookCategories.map((category) => ({ id: category.id, label: category.name })),
    { id: UNCATEGORIZED_CATEGORY_ID, label: copy.uncategorized },
  ], [copy.uncategorized, language, notebookCategories, parentCategoryIds]);

  const categoryLabel = (categoryId: string) => categoryOptions.find((item) => item.id === categoryId)?.label ?? copy.uncategorized;

  // 検索結果のカードに出すカテゴリ名。件数ぶんcategoryOptionsを線形探索しないよう
  // Mapにしておく（184件×カテゴリ38件の総当たりになる）。
  const categoryLabelById = useMemo(() => new Map(categoryOptions.map((item) => [item.id, item.label])), [categoryOptions]);

  // 検索で見るカテゴリ名。表示用（categoryLabelById）には大分類が入らない
  // （categoryOptionsが「ノートの所属先に選べるカテゴリ」＝葉だけに絞っているため）ので、
  // ここで親カテゴリのラベルを足してから buildCategorySearchLabels に渡す。
  // これが無いと、カテゴリカードで覚えている「理科（小・中）」「高校物理」で1件も当たらない。
  const categorySearchLabelById = useMemo(() => {
    const labelById = new Map(categoryLabelById);
    PRESET_NOTEBOOK_CATEGORIES.forEach((category) => {
      if (parentCategoryIds.has(category.id)) labelById.set(category.id, localizedText(category.label, language));
    });
    return buildCategorySearchLabels(labelById, PRESET_NOTEBOOK_CATEGORIES);
  }, [categoryLabelById, language, parentCategoryIds]);

  const isSearchingNotebooks = Boolean(notebookSearchQuery.trim());

  // 絞り込みの判断そのものは lib/notebook-search.ts の純関数に置いてある。ここは
  // 「ノート＋カテゴリ名」を渡して結果をノートへ戻すだけにして、この画面に検索の規則を持たせない。
  const notebookSearchResults = useMemo(() => {
    if (!isSearchingNotebooks) return [];
    const entries = notebooks.map((notebook) => ({
      notebook,
      title: notebook.title,
      description: notebook.description,
      categoryLabel: categorySearchLabelById.get(notebook.categoryId) ?? "",
    }));
    return searchNotebooks(entries, notebookSearchQuery).map((entry) => entry.notebook);
  }, [categorySearchLabelById, isSearchingNotebooks, notebookSearchQuery, notebooks]);

  const resetConstantEditor = () => {
    setEditingConstantSymbol(undefined); setConstantSymbolInput(""); setConstantExpressionInput(""); setConstantError("");
  };

  const openConstantEditor = (item?: SavedConstant) => {
    resetConstantEditor();
    setConstantEditorVisible(true);
    if (!item) return;
    setEditingConstantSymbol(item.symbol); setConstantSymbolInput(item.symbol); setConstantExpressionInput(item.expression);
  };

  const closeConstantEditor = () => { if (!isSaving) setConstantEditorVisible(false); };

  const saveConstant = async () => {
    setConstantError(""); setIsSaving(true);
    try {
      const symbol = constantSymbolInput.trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(symbol) || !constantExpressionInput.trim()) throw new Error(copy.validation);
      if (editingConstantSymbol && editingConstantSymbol !== symbol) await removeConstant(editingConstantSymbol);
      await upsertConstant(symbol, constantExpressionInput.trim());
      setConstantEditorVisible(false);
    } catch (cause) {
      setConstantError(engineErrorMessage(cause));
    } finally { setIsSaving(false); }
  };

  // カテゴリカードのエクスポートボタン用にカテゴリIDからラベルを引く。categoryLabel（上のcategoryOptions）は
  // 「高校物理」のような親カテゴリをノートの所属先として選べないため除外してあり、親カテゴリIDでは
  // 引けない。ファイル名に使うだけなのでプリセット（親も含む）・ユーザー作成・未分類の全部を見る。
  const exportCategoryFileLabel = (categoryId: string) => {
    const preset = PRESET_NOTEBOOK_CATEGORIES.find((category) => category.id === categoryId);
    if (preset) return localizedText(preset.label, language);
    const userCategory = notebookCategories.find((category) => category.id === categoryId);
    return userCategory ? userCategory.name : copy.uncategorized;
  };

  // カテゴリカードから「このカテゴリ（親なら配下の子カテゴリぶんも含む）」のユーザー作成ノートだけを書き出す。
  // 対象IDの集合はNotebookCategoryGrid側（lib/notebook-category-export.ts）で組み立て済みのものを受け取る。
  // 統合バックアップのエクスポート・インポート（プリセット編集を含む）は設定画面
  // （components/settings/backup-card.tsx）へ移設済みで、ここに残るのはこのカテゴリ単位の書き出しだけ。
  const handleExportCategoryNotebooks = async (categoryIds: string[]) => {
    try {
      const fileLabel = exportCategoryFileLabel(categoryIds[0]);
      // カテゴリ一覧もノートと同じ範囲へ絞って渡す。今の createNotebooksBackup は
      // 「そのノート自身のcategoryIdを引く表」としてしか使っていないので絞っても出力は変わらないが、
      // 呼び出し側で範囲を閉じておけば、将来この引数の使われ方が変わっても書き出す範囲が広がらない。
      await exportNotebooksBackup(
        notebooks.filter((notebook) => categoryIds.includes(notebook.categoryId)),
        notebookCategories.filter((category) => categoryIds.includes(category.id)),
        // 書き出すノートが自作単位（例: "2shaku"）を参照していると、取り込み側にその単位が
        // 無いとノートの計算が壊れる。どのノートがどの記号を使っているかを判定するには
        // 単位サフィックスの走査規則（unitSuffixEnd）を再実装することになり、評価器と
        // ズレる余地を作ってしまうので、ここは端末の自作単位を全部載せる。取り込み側は
        // 記号をキーに「追加・同名は置換」するだけで既存の自作単位を消さない（mergeCustomUnits）
        // ため、余分に含めても害が無い。
        customUnits,
        language,
        fileLabel,
      );
      setCategoryExportNotice(copy.categoryExportDone);
    } catch (cause) {
      setCategoryExportNotice(engineErrorMessage(cause));
    }
  };

  // 計算ノート：編集シートの開閉。フォームの中身（レールの状態・カテゴリピッカー・保存処理など）は
  // NotebookEditorSheetが自分で持つので、この画面側は「どのノートを、どんな初期値で開くか」を
  // 渡すだけでよい。
  const openNewNotebook = (presetExpression?: string, presetTargetUnit?: string) => {
    setEditingNotebook(undefined);
    setNotebookPresetExpression(presetExpression);
    setNotebookPresetTargetUnit(presetTargetUnit);
    setNotebookEditorSession((current) => current + 1);
    setNotebookEditorVisible(true);
  };

  // ルートパラメータ（電卓画面の「保存」ボタン）は常に新規ノートを開く契約。
  // 同じ値を持つパラメータで再実行されないよう、処理済みの値をrefで覚えておく。
  const handledNotebookParamRef = useRef<string | null>(null);
  useEffect(() => {
    const nextExpression = Array.isArray(notebookExpression) ? notebookExpression[0] : notebookExpression;
    const nextUnit = Array.isArray(notebookUnit) ? notebookUnit[0] : notebookUnit;
    if (!nextExpression) return;
    const token = `${nextExpression}|${nextUnit ?? ""}`;
    if (handledNotebookParamRef.current === token) return;
    handledNotebookParamRef.current = token;
    setTopSection("notebooks");
    openNewNotebook(nextExpression, nextUnit);
    // パラメータを消費済みにしておく。消さないままだと、同じ式をもう一度
    // 保存しようとしたとき（値が変わらない）に何も起きなくなる。
    router.setParams({ notebookExpression: undefined, notebookUnit: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notebookExpression, notebookUnit]);

  const closeNotebookEditor = () => setNotebookEditorVisible(false);

  // 保存はNotebookEditorSheetのonSaveプロップから呼ばれる。保存されたノートを受け取り、
  // 「使った」の中でも一番はっきりした操作として最近使ったノートへ積む（新規作成もここを通る）。
  // モーダルを閉じるのはこの関数の成功後にシート側が行う（closeNotebookEditor経由）。
  const saveNotebookToStore = async (input: Parameters<typeof upsertNotebook>[0]) => {
    const saved = await upsertNotebook(input);
    void recordNotebookUse(saved);
    // 新規作成（idが無い＝これから採番される）なら、そのままノートタブで開く。ノートを作る目的は
    // 使うことなので、作った直後にライブラリへ戻されると必ず手で開き直す操作が挟まる。
    // 既存ノートの編集では遷移しない（もう開いている画面から編集シートを出しているだけなので）。
    if (input.id === undefined) {
      void setActiveNotebookId(saved.id);
      router.push("/notebook");
    }
    return saved;
  };

  const notebooksInCategory = selectedCategoryId ? notebooks.filter((item) => item.categoryId === selectedCategoryId) : [];

  // ノートの中身を大きく表示する画面はノートタブ（app/(tabs)/notebook.tsx）に一本化した。
  // ここではタップされたノートをアクティブにしてからそちらへ遷移するだけにする
  // （「そのノートを開いた」という操作なので、ライブラリを辿る途中に覗いただけとは区別するため、
  // ノート詳細側のonUseとは別にここでrecordNotebookUseは呼ばない。実際に値を編集する・単位を
  // 切り替える等の「使った」操作はノートタブ側のNotebookDetailが検知する）。
  const openNotebookInNotebookTab = (id: string) => {
    void setActiveNotebookId(id);
    router.push("/notebook");
  };

  const renderNotebooksSection = () => {
    // 検索はカテゴリ階層を横断するので、いま何階層目を見ていても検索結果が最優先で出る。
    if (isSearchingNotebooks) {
      return (
        <NotebookList
          language={language}
          locale={locale}
          categoryLabel=""
          notebooks={notebookSearchResults}
          globalConstants={constants}
          searchResultCategoryLabels={categoryLabelById}
          onBack={() => setNotebookSearchQuery("")}
          onOpen={openNotebookInNotebookTab}
          onDelete={(id) => void removeNotebook(id)}
          onTogglePinned={(id) => void toggleNotebookPinned(id)}
        />
      );
    }
    if (selectedCategoryId) {
      return (
        <NotebookList
          language={language}
          locale={locale}
          categoryLabel={categoryLabel(selectedCategoryId)}
          notebooks={notebooksInCategory}
          globalConstants={constants}
          onBack={() => setSelectedCategoryId(null)}
          onOpen={openNotebookInNotebookTab}
          onDelete={(id) => void removeNotebook(id)}
          onTogglePinned={(id) => void toggleNotebookPinned(id)}
        />
      );
    }
    return (
      <>
        {/* カテゴリカードのエクスポート結果（handleExportCategoryNotebooks）の通知。
            以前はバックアップカード内に出していたが、そのカードを設定画面へ移設したため、
            通知の行き先としてグリッドの直前に1行だけ残す。 */}
        {categoryExportNotice ? <Text style={styles.categoryExportNotice}>{categoryExportNotice}</Text> : null}
        <NotebookCategoryGrid
          language={language}
          notebooks={notebooks}
          notebookCategories={notebookCategories}
          parentCategoryId={browsingParentCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onSelectParentCategory={setBrowsingParentCategoryId}
          onBack={() => setBrowsingParentCategoryId(null)}
          onCreateCategory={(name) => void upsertNotebookCategory({ name })}
          onRenameCategory={(id, name) => void upsertNotebookCategory({ id, name })}
          onDeleteCategory={(id) => void removeNotebookCategory(id)}
          onExportCategory={(categoryIds) => void handleExportCategoryNotebooks(categoryIds)}
        />
      </>
    );
  };

  const renderEmpty = (titleText: string, hint: string) => <View style={styles.emptyCard}><IconSymbol name="bookmark.fill" size={30} color={colors.primary} /><Text style={styles.emptyTitle}>{titleText}</Text><Text style={styles.emptyText}>{hint}</Text></View>;

  const renderConstantsSection = () => (
    <>
      {constants.length ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {constants.map((item) => (
            <View key={item.symbol} style={styles.libraryCard}>
              <Pressable onPress={() => openConstantEditor(item)} style={({ pressed }) => [styles.libraryMain, pressed && styles.cardPressed]}>
                <Text style={styles.libraryTitle}>{item.symbol} = {item.expression}</Text>
                <Text style={styles.libraryExpression}>{formatQuantity(item.quantity)}</Text>
              </Pressable>
              <Pressable accessibilityLabel={copy.delete} onPress={() => setPendingDeleteConstant(item.symbol)} style={({ pressed }) => [styles.deleteButton, pressed && styles.iconPressed]}>
                <IconSymbol name="trash" size={20} color={colors.error} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyList}>{renderEmpty(copy.constantEmpty, copy.constantEmptyHint)}</View>
      )}
    </>
  );

  const renderContent = () => (topSection === "notebooks" ? renderNotebooksSection() : renderConstantsSection());

  return <ScreenContainer className="px-5" containerClassName="bg-background">
    {/* 画面名の見出し(h1)はタブバー(app/(tabs)/_layout.tsx)のラベルと重複するため出さない。
        代わりにsectionRail自体に上余白を持たせ、画面最上部に詰まりすぎないようにする。 */}
    <View style={styles.sectionRail}>
      {sectionItems.map((item) => (
        <Pressable key={item.id} onPress={() => { setTopSection(item.id); setSelectedCategoryId(null); setBrowsingParentCategoryId(null); setNotebookSearchQuery(""); }} style={({ pressed }) => [styles.sectionChip, topSection === item.id && styles.sectionChipActive, pressed && styles.buttonPressed]}>
          <Text style={[styles.sectionChipText, topSection === item.id && styles.sectionChipTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
    {/* ノート詳細画面をこの画面から無くしたので、カテゴリグリッド・カテゴリ内ノート一覧のどちらの
        表示中でも常に追加できる。子コンポーネント（NotebookCategoryGrid/NotebookList）の中に
        置かず、一覧の直前（スクロール領域の外）にこのファイル側で1行だけ置く。
        「＋ 新しいカテゴリ」ボタンと同じstyles.sectionChipの見た目に揃える。 */}
    <Pressable
      onPress={() => (topSection === "constants" ? openConstantEditor() : openNewNotebook())}
      style={({ pressed }) => [styles.sectionChip, styles.addRow, pressed && styles.buttonPressed]}
    >
      <Text style={styles.sectionChipText}>＋ {topSection === "constants" ? copy.constantNew : copy.notebookNew}</Text>
    </Pressable>

    {/* 計算ノートの検索欄。プリセットが184件・カテゴリが2階層になり、どのカテゴリに入れたかを
        覚えていないと辿り着けなくなったため、階層を横断して探せるようにする。一覧の直前
        （スクロール領域の外）に置いて、下までスクロールしても検索し直せるようにする。
        グローバル定数タブでは出さない（数が少なく、1画面に収まるため）。 */}
    {topSection === "notebooks" ? (
      <View style={styles.searchRow}>
        <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
        <TextInput
          value={notebookSearchQuery}
          onChangeText={setNotebookSearchQuery}
          placeholder={copy.notebookSearch}
          placeholderTextColor={colors.placeholder}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never"
        />
        {/* クリアボタンはiOSのclearButtonModeに任せず自前で出す。Android・Webには
            clearButtonModeが無く、片方の環境だけ検索語を消せない状態になるため。 */}
        {notebookSearchQuery ? (
          <Pressable accessibilityLabel={copy.searchClear} onPress={() => setNotebookSearchQuery("")} style={({ pressed }) => [styles.searchClear, pressed && styles.iconPressed]}>
            <IconSymbol name="xmark.circle.fill" size={17} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    ) : null}

    {isLoading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : renderContent()}

    <Modal visible={constantEditorVisible} transparent animationType="slide" onRequestClose={closeConstantEditor}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
        <View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>{copy.constantEditor}</Text></View><Pressable accessibilityLabel={copy.close} onPress={closeConstantEditor} style={({ pressed }) => [styles.closeButton, pressed && styles.iconPressed]}><IconSymbol name="xmark" size={21} color={colors.muted} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>{copy.symbolLabel}</Text>
            <TextInput value={constantSymbolInput} onChangeText={setConstantSymbolInput} placeholder="W" placeholderTextColor={colors.placeholder} autoCapitalize="characters" autoCorrect={false} style={styles.input} />
            <Text style={styles.fieldLabel}>{copy.expressionLabel}</Text>
            <TextInput value={constantExpressionInput} onChangeText={setConstantExpressionInput} placeholder="3cm" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.input} />
            {constantError ? <Text style={styles.error}>{constantError}</Text> : null}
            <Pressable disabled={isSaving} onPress={() => void saveConstant()} style={({ pressed }) => [styles.saveButton, (pressed || isSaving) && styles.buttonPressed]}><Text style={styles.saveText}>{isSaving ? copy.saving : copy.save}</Text></Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    <NotebookEditorSheet
      key={notebookEditorSession}
      visible={notebookEditorVisible}
      language={language}
      unitSystem={unitSystem}
      notebook={editingNotebook}
      presetExpression={notebookPresetExpression}
      presetTargetUnit={notebookPresetTargetUnit}
      initialCategoryId={selectedCategoryId ?? undefined}
      globalConstants={constants}
      notebookCategories={notebookCategories}
      onCreateCategory={(name) => upsertNotebookCategory({ name })}
      onSave={saveNotebookToStore}
      onClose={closeNotebookEditor}
    />

    <ConfirmDialog
      visible={Boolean(pendingDeleteConstant)}
      title={copy.delete}
      message={copy.deleteConfirm}
      cancelLabel={copy.cancel}
      confirmLabel={copy.delete}
      destructive
      onCancel={() => setPendingDeleteConstant(null)}
      onConfirm={() => {
        if (pendingDeleteConstant) void removeConstant(pendingDeleteConstant);
        setPendingDeleteConstant(null);
      }}
    />
  </ScreenContainer>;
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  // h1見出しを削除したので、sectionRailが画面の一番上に来る。SafeAreaの直後に
  // チップが詰まりすぎないよう、旧headerが持っていたpaddingTopの一部をここに持たせる。
  searchRow: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 7, marginBottom: 12, paddingHorizontal: 11 },
  searchInput: { color: colors.foreground, flex: 1, fontSize: 14, minHeight: 40, paddingVertical: 0 },
  searchClear: { alignItems: "center", height: 34, justifyContent: "center", width: 26 },
  sectionRail: { flexDirection: "row", flexWrap: "wrap", gap: 7, paddingBottom: 14, paddingTop: 8 }, sectionChip: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8 }, sectionChipActive: { backgroundColor: colors.primaryFill }, sectionChipText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, sectionChipTextActive: { color: colors.onPrimary },
  // 一覧（カテゴリグリッド／カテゴリ内ノート一覧）の直前に置く追加ボタン。sectionChipの見た目を流用しつつ、
  // 縦積みのViewの中では既定でstretchして横幅いっぱいに広がってしまうため、自身の内容幅に収める。
  addRow: { alignSelf: "flex-start", marginBottom: 12 },
  // カテゴリカードからのエクスポート結果の通知（旧バックアップカードのbackupNoticeの後継。
  // カードごと設定画面へ移設したため、グリッドの直前に1行だけ出す軽量な見た目にした）。
  categoryExportNotice: { color: colors.muted, fontSize: 11, lineHeight: 17, marginBottom: 10 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" }, list: { gap: 10, paddingBottom: 30 }, emptyList: { flexGrow: 1, justifyContent: "center", paddingBottom: 96 }, emptyCard: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, paddingHorizontal: 30, paddingVertical: 32 }, emptyTitle: { color: colors.foreground, fontSize: 17, fontWeight: "700", marginTop: 12 }, emptyText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: "center" },
  libraryCard: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", minHeight: 82, paddingHorizontal: 13, paddingVertical: 12 }, libraryMain: { flex: 1 }, libraryTitle: { color: colors.foreground, fontSize: 15, fontWeight: "800" }, libraryExpression: { color: colors.primary, fontFamily: mono, fontSize: 12, fontWeight: "700", marginTop: 5 }, deleteButton: { alignItems: "center", height: 38, justifyContent: "center", width: 38 },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] }, cardPressed: { opacity: 0.74 }, iconPressed: { opacity: 0.55 },
  modalBackdrop: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" }, sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: "92%", paddingBottom: 36, paddingHorizontal: 22, paddingTop: 10 }, sheetHandle: { alignSelf: "center", backgroundColor: colors.border, borderRadius: 3, height: 5, width: 42 }, sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", paddingBottom: 16, paddingTop: 17 }, sheetTitle: { color: colors.foreground, fontSize: 21, fontWeight: "700" }, closeButton: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  fieldLabel: { color: colors.foreground, fontSize: 13, fontWeight: "700", marginBottom: 7, marginTop: 12 }, input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.foreground, fontFamily: mono, fontSize: 16, minHeight: 48, paddingHorizontal: 14 }, error: { color: colors.error, fontSize: 13, lineHeight: 19, marginTop: 11 }, saveButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 13, marginTop: 22, minHeight: 52, justifyContent: "center" }, saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
});
