import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { CalculatorBannerAd } from "@/components/ads/calculator-banner-ad";
import { ScreenContainer } from "@/components/screen-container";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LatexView } from "@/components/ui/latex-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { isSampleCategoryVisible, isUnitGroupVisible, isUnitVisible, visibleUnits } from "@/lib/advanced-display";
import { buildCaretPreview } from "@/lib/expression-caret";
import { findExactValue, isTerminatingDecimalFraction } from "@/lib/exact-value";
import { inferSignificantDigits, significantDigitsAfterConversion, toScientificNotation } from "@/lib/significant-figures";
import { useCalculatorStore } from "@/lib/calculator-store";
import { diagnoseCalculatorInput, evaluateCalculatorInput, isDiagnosableInputError } from "@/lib/calculator-input";
import { resolveDisplayUnit } from "@/lib/display-unit";
import { resolveStartupExpression } from "@/lib/calculator-startup-expression";
import { exportCalculationHistory } from "@/lib/calculation-export";
import { useGlobalSettings } from "@/lib/global-settings";
import { historyToAutoConstants } from "@/lib/history-auto-constants";
import { localizedText, type AppLanguage } from "@/lib/i18n";
import { BASE_META, canRepresentInBase, canSwitchBaseInput, formatInBaseParts, isBaseDigitAllowed, NUMBER_BASES, parseBaseInput, reinterpretBaseInput, sanitizeBaseInput, type NumberBase } from "@/lib/number-base";
import { getCalculatorQuickShortcut } from "@/lib/quick-shortcuts";
import { usePro } from "@/lib/revenuecat-provider";
import { buildUnitComparisonRows } from "@/lib/unit-comparison";
import { UnitError, unitErrorMessage } from "@/lib/unit-errors";
import { getUnitExplanation } from "@/lib/unit-explanations";
import UnitCalculatorWidget from "@/widgets/UnitCalculatorWidget";
import { SAMPLE_CALCULATIONS, SAMPLE_CATEGORIES, type SampleCalculation } from "@/lib/sample-calculations";
import { orderSampleCategoriesForLanguage, orderSamplesForLanguage } from "@/lib/locale-relevance";
import {
  analyzeExpression,
  getPrefixedUnitSuggestions,
  getUnitInputHint,
  requiredUnitGroupFromError,
  getUnitInsertionRange,
  getUnitSuggestions,
  replaceExpressionRange,
  type ExpressionSegment,
  type UnitInputHint,
  type UnitSuggestion,
} from "@/lib/unit-input";
import { convertQuantity, formatDimension, formatNumberForLocale, formatQuantity, getCompatibleUnitGroups, getGroupUnitsForSystem, getRegionalUnits, getUnitRegistration, isDimensionless, UNIT_GROUPS, type UnitGroup, type UnitOption } from "@/lib/units";

// 「全消し」の要望に対応するため、従来は空セルのプレースホルダだった最下段（"0"と"="の間）に
// ⌫（一文字削除）を動かし、空いた最上段の右端（従来⌫があった場所）にACを置く。
// AC（全消去・元に戻せない）は"="からできるだけ離し、逆に押し間違えても被害が小さい⌫の方を
// "="の隣に残すことで、誤爆したときの実害を最小にする配置にしている。
// 一般的な電卓（iOS・Android）と関数電卓（Casio fx 系）に共通する並びに揃えてある。
// 5列4段。**キーの数は20のまま変わらず、段が1つ減るので縦が42pxぶん縮む**（キーパッド直上に
// 足した編集キー・接頭語の2行と釣り合う）。
//
//   7 8 9 ⌫ AC     ⌫ と AC は隣同士で右上（以前は AC が右上・⌫ が下段の数字の並びに混在）
//   4 5 6 ÷ ×      演算子は数字の右に2×2のひとかたまり。**列で見ると ÷ × − + の順**で、
//   1 2 3 − +      これは iOS の演算子列を縦に読んだ順と同じ（以前は ÷ だけ別の列にあった）
//   0 . ( ) =      0 は 1 の真下、= は右下（どちらもどの電卓でも同じ位置）
//
// カーソルキー（`<` `>`）はキーパッドに入れず編集キーの行に置いたまま。関数電卓でも
// カーソルは数字キーの外の別クラスタなので、ここへ入れて5段に戻す方が不自然になる。
const KEYS = [
  "7", "8", "9", "⌫", "AC",
  "4", "5", "6", "÷", "×",
  "1", "2", "3", "-", "+",
  "0", ".", "(", ")", "=",
];
const ADVANCED_KEYS = ["sin(", "cos(", "tan(", "asin(", "acos(", "atan(", "atan2(", "ln(", "log(", "log2(", "sqrt(", "^", "π", "e"];
// 結果の見せ方。小数を先頭にする（分数・π や科学表記で出せる値の方が少ないため、既定は常に小数）。
// exact・scientific は出せるときだけチップを並べる（押しても何も変わらないボタンを作らない）。
const VALUE_FORMS = ["decimal", "exact", "scientific"] as const;
type ValueForm = (typeof VALUE_FORMS)[number];
// 科学表記のチップは記号そのものを出す（10ⁿ は言語に依らず読める表記で、独語の
// "Wissenschaftlich" のような長い語だとチップ列が1行に収まらない）。読み上げ用のラベルだけ
// copy.scientificForm を使う。**キーパッド上の編集キー（×10ⁿ）と同じ字面にしないこと**——
// あちらは式に `×10^` を挿入するキーで、こちらは表示の読み替えなので、同じ見た目だと
// 「押すと式が変わるのか表示が変わるのか」が区別できない（進数チップと入力バーを
// 分けたときと同じ失敗）。
const SCIENTIFIC_FORM_LABEL = "10ⁿ";
// 表示単位の初期値・AC後の値。空文字は「表示単位を指定しない＝SI標準で出す」という意味。
// 以前は "cm" を入れていたが、これだと 3 のような無次元の値を打った瞬間に「cm へ変換できません」
// という的外れなエラーが出るうえ、進数チップの表示条件（表示単位が空）も満たせず、
// 単位の付かない数値に対する機能が丸ごと到達不能になっていた。長さの単位が要るときは
// 結果カードの単位チップから1タップで選べるので、初期状態では何も指定しない。
const DEFAULT_TARGET_UNIT = "";
// 16進の入力モード専用。キーパッド本体の配置は変えず、直上に小さな別の行として出す。
const HEX_LETTER_KEYS = ["A", "B", "C", "D", "E", "F"];

// 空状態の結果カードに置く「まず1つ試す」式。サンプルシート（SAMPLE_CALCULATIONS）の縮約版ではなく、
// このアプリの3つの売り（オームの法則で電圧が求まる・答えが読みやすい接頭語で返る・速さ×時間が距離になる）を
// 1タップずつで見せるための固定3件。表示単位は指定せず、表示単位の自動選択（lib/display-unit.ts）に
// 任せる（1 V / 2.55 mA / 90 km になることが、そのまま自動選択のデモになる）。
const QUICK_START: { id: "ohms_law" | "current" | "distance"; expression: string }[] = [
  { id: "ohms_law", expression: "1kΩ × 1mA" },
  { id: "current", expression: "12V / 4.7kΩ" },
  { id: "distance", expression: "60km/h × 90min" },
];
// 進数入力モード中に押せてはいけないキー（演算子・小数点・括弧）。16進の桁のまま演算に入ると
// 評価器が解釈できないため、まず = で10進へ確定させてから通常の式に組み込む運用にする。
const BASE_INPUT_DISABLED_KEYS = ["(", ")", "÷", "×", "-", "+", "."];
// キーパッドだけで式を組み立てられるようにするための編集キー（キャレット移動と、べき乗まわり）。
// 入力欄をタップするとOSのキーボードが上がってキーパッドがほぼ隠れてしまうので、
// 入力欄を触らずに済む範囲を広げる。^ は数学シートにしか無く、しかも上級モード限定だった。
// 上付きの ² ³ は normalize が ^2 / ^3 へ書き換えるので ^ を打つのと同じ結果になる
// （lib/units.ts。単位に付けば m² のように単位の指数としても解決する）。
// ×10ⁿ は押すと ×10^ が入る。科学表記は単位を続けて書けるので括弧は要らない（3×10^8m/s）。
// ラベルは電卓の慣例に揃える（x² / x³ / xʸ）。上付き数字だけを置くと字面が小さすぎて
// 何のキーか分からず、「^」単体も打つ記号としては読めても「べき乗」には見えない。
// SI接頭語のキー。単位の英字はキーパッドに無く、レールに出る候補（kΩ・mA…）で足りない組み合わせ
// （MΩ・nF・GPa など）はOSのキーボードを出さないと打てなかった。押すと接頭語1文字が入り、
// **その直後にレールがその接頭語で始まる単位を候補に出す**（lib/unit-input.ts の綴り一致優先）。
// マイクロはマイクロ記号 µ(U+00B5)。ギリシャ小文字の μ(U+03BC) は定数名用で別コードポイント。
// 範囲はピコ〜ギガに絞る（この電卓が扱う電気・機械の量はこの間に収まる）。
const PREFIX_KEYS = ["p", "n", "µ", "m", "c", "k", "M", "G"] as const;
const isPrefixKey = (key: string) => (PREFIX_KEYS as readonly string[]).includes(key);

/**
 * 結果の値をKaTeXで描くときの共通ラッパ。
 *
 * KaTeXの既定の字体は Computer Modern（明朝＝セリフ体）なので、`小数` から `厳密値`・`10ⁿ` へ
 * 切り替えると同じ数値なのに数字の字体だけが変わって見えていた。`\mathsf` を掛けると数字は
 * KaTeX_SansSerif（ゴシック体）で組まれ、アプリの他の表示と字面が揃う。
 *
 * 記号は `\mathsf` の対象外で、KaTeXが数式用の字体を保つ（π は mathnormal のまま、√・×・≈ も
 * 変わらない）。**これは都合が良い**: 字体を変えるのは数字だけで、記号の字幅は元のままなので
 * 分数の横棒・根号の伸縮といったKaTeXの寸法計算が崩れない。CSSで `.katex` のフォントを
 * 上書きする方法にしないのはこのため（あちらは全グリフの字幅が変わって組みが崩れる）。
 *
 * `\displaystyle` は `\mathsf` の外側に置く。付けないと分数が本文サイズで小さく組まれ、
 * 隣の小数表示より明らかに小さく見える。
 */
const resultLatex = (latex: string) => `\\displaystyle \\mathsf{${latex}}`;

/**
 * プレビュー行に描くキャレット（カーソル）。
 *
 * 入力欄の TextInput はフォーカスが当たっていない間キャレットを描かないが、この電卓は
 * 「入力欄を触らずキーパッドで式を組み立てる」設計（入力欄をタップするとOSのキーボードが
 * 上がってキーパッドがほぼ隠れる）なので、`< >` を押しても位置がどこにも出ていなかった。
 *
 * 点滅させるのは、静止した縦棒だと式の一部（`|` のような記号）と見分けられないため。
 * 点滅は reanimated の共有値だけで回し、setState を使わない（1秒ごとに再レンダーが走ると
 * 入力のたびに式の解析までやり直すことになる）。
 */
function PreviewCaret({ colors }: { colors: ThemeColorPalette }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    // 消えている時間を短くして「文字の隙間」に見えないようにする。
    opacity.value = withRepeat(withSequence(withTiming(0.15, { duration: 480 }), withTiming(1, { duration: 480 })), -1, false);
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      // 幅を持つ要素なので、キャレットの手前と後ろの文字が離れて見えないよう左右のマージンは負にしない。
      // 等幅フォントの字送りより細くしてあるため、文字の並びは崩れない。
      style={[{ backgroundColor: colors.primary, borderRadius: 1, height: 17, width: 2 }, animatedStyle]}
    />
  );
}

const EDIT_KEYS: readonly { label: string; insert: string }[] = [
  { label: "x²", insert: "²" },
  { label: "x³", insert: "³" },
  { label: "xʸ", insert: "^" },
  { label: "×10ⁿ", insert: "×10^" },
];
const RAIL_LIMIT = 8;
const RECENT_UNIT_LIMIT = 8;

// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
// 引数を取るメッセージ（unresolvedUnit系・unitDoesNotFit等）が混ざるため、EN_COPYのas constは外し、
// COPYの型はRecord<AppLanguage, typeof EN_COPY>で両言語の値の形（string/関数）を揃える。
const EN_COPY = {
  definitionHint: "Define a constant: W = 3cm", calculate: "=", siBase: "SI base", emptyResult: "Enter an expression to see the result. Tap = to save it to your history.", pickUnit: "Choose a registered unit", speedTitle: "Distance, time & speed", speedFormula: "Speed = distance ÷ time     Distance = speed × time", findSpeed: "Find speed", findDistance: "Find distance", findTime: "Find time", savedHistory: "Saved calculations", historyHint: "Latest answers are available as a1, a2, and so on.", clear: "Clear", helpTitle: "Examples", helpDone: "Done", unitSearch: "Search units, names, or categories", copied: "Calculation copied", copy: "Copy", unitDetails: "Unit details", siConversion: "SI conversion", commonUse: "Common use", close: "Close", advancedMath: "Advanced math", advancedMathHint: "Angles use rad, deg, or °. Includes inverse trig, logs, and atan2(y, x).", saveTemplate: "Save", samples: "Examples", math: "Math", outputUnit: "Display unit", insertUnit: "Insert unit", registered: "Registered", supported: "Supported, not listed", unknown: "Not a usable unit", unknownHint: "Check the symbol or pick a candidate below.", history: "History", use: "Use", noUnit: "SI base", compatible: "Fits this result", allCandidates: "Closest candidates", hintFix: "Fix", hintComplete: "Finish", hintAttach: "Add unit", hintReplace: "Replace unit", hintInsert: "Insert", more: "More", showAs: "Show as", fixTap: "Tap the red unit to fix it.", noCandidates: "No candidate found. Check the symbol.", aliasNote: "same as", noSearchResults: "No unit matches this search.", noSearchResultsHint: "Try a different symbol, name, or category.", noHistory: "No saved calculations yet.", noHistoryHint: "Every result you calculate is saved here automatically.", browseUnits: "Browse categories",
  cannotConvertUnit: "Could not convert to this unit.",
  unresolvedUnitSuggestion: (text: string, canonical: string) => `“${text}” is not a usable unit. Did you mean ${canonical}?`,
  unresolvedUnitUnknown: (text: string) => `“${text}” is not a registered or supported unit.`,
  enterExpression: "Enter an expression.",
  unitDoesNotFit: (unit: string) => `“${unit}” does not fit — showing the SI base value.`,
  speedExampleReady: "Speed example ready: distance ÷ time.",
  pressureExampleReady: "Pressure example ready: force ÷ area.",
  chooseSampleToStart: "Choose a sample calculation to begin.",
  savedItemLoaded: "Saved item loaded. Tap = to run it.",
  couldNotCopyCalculation: "Could not copy this calculation.",
  expressionPlaceholder: "Example: 1kΩ × 1mA",
  deleteKey: "Delete", caretLeft: "Move cursor left", caretRight: "Move cursor right",
  clearAllKey: "Clear all",
  skip: "Skip",
  getStarted: "Get started",
  next: "Next",
  constantSaved: (symbol: string) => `Saved constant ${symbol}.`,
  historySaveFailed: "Calculated, but could not save the history entry on this device.",
  expressionCalculationFailed: "Could not calculate this expression.",
  historyRestored: "Restored the saved calculation.",
  historyExported: "Exported the calculation history as CSV.",
  csvExportFailed: "Could not export the CSV file.",
  compareUnits: "Compare units",
  compareUnitsHint: "Tap a row to show the result in that unit.",
  baseInput: "Base input",
  decimalForm: "Decimal", exactForm: "Exact", scientificForm: "Scientific notation",
  significantDigits: (count: number) => `${count} s.f.`,
  sampleConfirmTitle: "Load an example?",
  sampleConfirmMessage: "The expression you have typed will be replaced.",
  sampleConfirmButton: "Load",
  incompleteHint: "Keep typing — the result appears as soon as the expression is complete.",
  quickStartTitle: "Try one",
  quickStartOhmsLaw: "Ohm's law — the answer comes back in V",
  quickStartCurrent: "Ohm's law — the answer comes back in mA",
  quickStartDistance: "Speed × time, shown in km",
};
const COPY: Record<AppLanguage, typeof EN_COPY> = {
  en: EN_COPY,
  ja: {
    definitionHint: "定数定義：W = 3cm", calculate: "=", siBase: "SI標準", emptyResult: "式を入力すると結果が出ます。「=」を押すと履歴に保存されます。", pickUnit: "登録済み単位から選択", speedTitle: "距離・時間・速度", speedFormula: "速度 ＝ 距離 ÷ 時間　　距離 ＝ 速度 × 時間", findSpeed: "速度を求める", findDistance: "距離を求める", findTime: "時間を求める", savedHistory: "保存済みの計算履歴", historyHint: "最新の結果は a1、a2… として次の式で使えます。", clear: "消去", helpTitle: "入力例", helpDone: "閉じる", unitSearch: "単位・読み・カテゴリを検索", copied: "計算結果をコピーしました", copy: "コピー", unitDetails: "単位の説明", siConversion: "SI換算", commonUse: "主な利用分野", close: "閉じる", advancedMath: "上級の数学機能", advancedMathHint: "角度は rad・deg・° で入力します。逆三角・対数・atan2(y, x)にも対応します。", saveTemplate: "保存", samples: "サンプル", math: "数学", outputUnit: "表示単位", insertUnit: "単位を挿入", registered: "登録済み", supported: "計算対応（候補外）", unknown: "使えない単位", unknownHint: "記号を確認するか、下の候補から選んでください。", history: "履歴", use: "使う", noUnit: "SI標準", compatible: "この結果に合う単位", allCandidates: "近い候補", hintFix: "要修正", hintComplete: "確定", hintAttach: "単位付け", hintReplace: "単位を置換", hintInsert: "単位挿入", more: "他", showAs: "表示単位", fixTap: "赤い単位をタップすると修正できます。", noCandidates: "候補が見つかりません。記号を確認してください。", aliasNote: "＝", noSearchResults: "一致する単位が見つかりません。", noSearchResultsHint: "別の記号・名前・カテゴリでも試してください。", noHistory: "保存された計算はまだありません。", noHistoryHint: "計算するたびに自動で保存されます。", browseUnits: "カテゴリで探す",
    cannotConvertUnit: "この単位へは変換できません。",
    unresolvedUnitSuggestion: (text: string, canonical: string) => `「${text}」は使えません。${canonical} に修正できます。`,
    unresolvedUnitUnknown: (text: string) => `「${text}」は未登録・未対応の単位です。`,
    enterExpression: "式を入力してください。",
    unitDoesNotFit: (unit: string) => `「${unit}」は合わないため、SI標準で表示しました。`,
    speedExampleReady: "速度の例を準備しました：距離 ÷ 時間",
    pressureExampleReady: "圧力の例を準備しました：力 ÷ 面積",
    chooseSampleToStart: "サンプル計算式を選んで試せます。",
    savedItemLoaded: "保存した項目を読み込みました。「=」を押して実行できます。",
    couldNotCopyCalculation: "計算結果をコピーできませんでした。",
    expressionPlaceholder: "例：1kΩ × 1mA",
    deleteKey: "一文字削除", caretLeft: "カーソルを左へ", caretRight: "カーソルを右へ",
    clearAllKey: "全消去",
    skip: "スキップ",
    getStarted: "はじめる",
    next: "次へ",
    constantSaved: (symbol: string) => `定数 ${symbol} を保存しました。`,
    historySaveFailed: "計算しましたが、履歴を端末内へ保存できませんでした。",
    expressionCalculationFailed: "式を計算できませんでした。",
    historyRestored: "保存済みの計算結果を復元しました。",
    historyExported: "計算履歴をCSVとして出力しました。",
    csvExportFailed: "CSVを出力できませんでした。",
    compareUnits: "単位を比較",
    compareUnitsHint: "行をタップするとその単位で表示します。",
    baseInput: "進数入力",
    decimalForm: "小数", exactForm: "分数・π", scientificForm: "科学表記",
    significantDigits: (count: number) => `有効${count}桁`,
    sampleConfirmTitle: "サンプルを読み込みますか？",
    sampleConfirmMessage: "入力中の式は置き換えられます。",
    sampleConfirmButton: "読み込む",
    incompleteHint: "続けて入力すると、式が完成した時点で結果が出ます。",
    quickStartTitle: "試してみる",
    quickStartOhmsLaw: "オームの法則 — 答えは 1 V で返る",
    quickStartCurrent: "オームの法則 — 答えは mA で返る",
    quickStartDistance: "速さ × 時間を km で表示",
  },
  es: {
    definitionHint: "Definir una constante: W = 3cm", calculate: "=", siBase: "Base SI", emptyResult: "Escribe una expresión para ver el resultado. Toca = para guardarlo en el historial.", pickUnit: "Elige una unidad registrada", speedTitle: "Distancia, tiempo y velocidad", speedFormula: "Velocidad = distancia ÷ tiempo     Distancia = velocidad × tiempo", findSpeed: "Calcular velocidad", findDistance: "Calcular distancia", findTime: "Calcular tiempo", savedHistory: "Cálculos guardados", historyHint: "Los últimos resultados están disponibles como a1, a2, etc.", clear: "Borrar", helpTitle: "Ejemplos", helpDone: "Listo", unitSearch: "Buscar unidades, nombres o categorías", copied: "Cálculo copiado", copy: "Copiar", unitDetails: "Detalles de la unidad", siConversion: "Conversión SI", commonUse: "Uso común", close: "Cerrar", advancedMath: "Matemáticas avanzadas", advancedMathHint: "Los ángulos usan rad, deg o °. Incluye trigonometría inversa, logaritmos y atan2(y, x).", saveTemplate: "Guardar", samples: "Ejemplos", math: "Mat.", outputUnit: "Unidad mostrada", insertUnit: "Insertar unidad", registered: "Registrada", supported: "Compatible, sin listar", unknown: "Unidad no válida", unknownHint: "Revisa el símbolo o elige un candidato abajo.", history: "Historial", use: "Usar", noUnit: "Base SI", compatible: "Compatible con este resultado", allCandidates: "Candidatos más cercanos", hintFix: "Corregir", hintComplete: "Completar", hintAttach: "Añadir", hintReplace: "Sustituir", hintInsert: "Insertar", more: "Más", showAs: "Mostrar como", fixTap: "Toca la unidad en rojo para corregirla.", noCandidates: "No se encontró ningún candidato. Revisa el símbolo.", aliasNote: "igual a", noSearchResults: "Ninguna unidad coincide con esta búsqueda.", noSearchResultsHint: "Prueba otro símbolo, nombre o categoría.", noHistory: "Aún no hay cálculos guardados.", noHistoryHint: "Cada resultado que calculas se guarda aquí automáticamente.", browseUnits: "Explorar categorías",
    cannotConvertUnit: "No se pudo convertir a esta unidad.",
    unresolvedUnitSuggestion: (text: string, canonical: string) => `“${text}” no es una unidad válida. ¿Quisiste decir ${canonical}?`,
    unresolvedUnitUnknown: (text: string) => `“${text}” no es una unidad registrada ni compatible.`,
    enterExpression: "Escribe una expresión.",
    unitDoesNotFit: (unit: string) => `“${unit}” no es compatible; se muestra el valor en base SI.`,
    speedExampleReady: "Ejemplo de velocidad listo: distancia ÷ tiempo.",
    pressureExampleReady: "Ejemplo de presión listo: fuerza ÷ área.",
    chooseSampleToStart: "Elige un cálculo de ejemplo para empezar.",
    savedItemLoaded: "Elemento guardado cargado. Toca = para ejecutarlo.",
    couldNotCopyCalculation: "No se pudo copiar este cálculo.",
    expressionPlaceholder: "Ejemplo: 1kΩ × 1mA",
    deleteKey: "Eliminar", caretLeft: "Mover el cursor a la izquierda", caretRight: "Mover el cursor a la derecha",
    clearAllKey: "Borrar todo",
    skip: "Omitir",
    getStarted: "Comenzar",
    next: "Siguiente",
    constantSaved: (symbol: string) => `Constante ${symbol} guardada.`,
    historySaveFailed: "Se calculó, pero no se pudo guardar el historial en este dispositivo.",
    expressionCalculationFailed: "No se pudo calcular esta expresión.",
    historyRestored: "Se restauró el cálculo guardado.",
    historyExported: "Historial de cálculos exportado como CSV.",
    csvExportFailed: "No se pudo exportar el archivo CSV.",
    compareUnits: "Comparar unidades",
    compareUnitsHint: "Toca una fila para mostrar el resultado en esa unidad.",
    baseInput: "Introducir en otra base",
    decimalForm: "Decimal", exactForm: "Exacto", scientificForm: "Notación científica",
    significantDigits: (count: number) => `${count} c.s.`,
    sampleConfirmTitle: "¿Cargar un ejemplo?",
    sampleConfirmMessage: "Se reemplazará la expresión que has escrito.",
    sampleConfirmButton: "Cargar",
    incompleteHint: "Sigue escribiendo: el resultado aparece en cuanto la expresión esté completa.",
    quickStartTitle: "Prueba uno",
    quickStartOhmsLaw: "Ley de Ohm: la respuesta sale en V",
    quickStartCurrent: "Ley de Ohm: la respuesta sale en mA",
    quickStartDistance: "Velocidad × tiempo, mostrado en km",
  },
  "pt-BR": {
    definitionHint: "Definir uma constante: W = 3cm", calculate: "=", siBase: "Base SI", emptyResult: "Digite uma expressão para ver o resultado. Toque em = para salvá-lo no histórico.", pickUnit: "Escolha uma unidade registrada", speedTitle: "Distância, tempo e velocidade", speedFormula: "Velocidade = distância ÷ tempo     Distância = velocidade × tempo", findSpeed: "Calcular velocidade", findDistance: "Calcular distância", findTime: "Calcular tempo", savedHistory: "Cálculos salvos", historyHint: "Os últimos resultados ficam disponíveis como a1, a2 etc.", clear: "Limpar", helpTitle: "Exemplos", helpDone: "Concluído", unitSearch: "Buscar unidades, nomes ou categorias", copied: "Cálculo copiado", copy: "Copiar", unitDetails: "Detalhes da unidade", siConversion: "Conversão SI", commonUse: "Uso comum", close: "Fechar", advancedMath: "Matemática avançada", advancedMathHint: "Os ângulos usam rad, deg ou °. Inclui trigonometria inversa, logaritmos e atan2(y, x).", saveTemplate: "Salvar", samples: "Exemplos", math: "Mat.", outputUnit: "Unidade de exibição", insertUnit: "Inserir unidade", registered: "Registrada", supported: "Compatível, não listada", unknown: "Unidade inválida", unknownHint: "Verifique o símbolo ou escolha um candidato abaixo.", history: "Histórico", use: "Usar", noUnit: "Base SI", compatible: "Compatível com este resultado", allCandidates: "Candidatos mais próximos", hintFix: "Corrigir", hintComplete: "Concluir", hintAttach: "Adicionar", hintReplace: "Substituir", hintInsert: "Inserir", more: "Mais", showAs: "Exibir como", fixTap: "Toque na unidade em vermelho para corrigi-la.", noCandidates: "Nenhum candidato encontrado. Verifique o símbolo.", aliasNote: "igual a", noSearchResults: "Nenhuma unidade corresponde a esta busca.", noSearchResultsHint: "Tente outro símbolo, nome ou categoria.", noHistory: "Ainda não há cálculos salvos.", noHistoryHint: "Cada resultado calculado é salvo aqui automaticamente.", browseUnits: "Explorar categorias",
    cannotConvertUnit: "Não foi possível converter para esta unidade.",
    unresolvedUnitSuggestion: (text: string, canonical: string) => `“${text}” não é uma unidade válida. Você quis dizer ${canonical}?`,
    unresolvedUnitUnknown: (text: string) => `“${text}” não é uma unidade registrada nem compatível.`,
    enterExpression: "Digite uma expressão.",
    unitDoesNotFit: (unit: string) => `“${unit}” não é compatível — exibindo o valor em base SI.`,
    speedExampleReady: "Exemplo de velocidade pronto: distância ÷ tempo.",
    pressureExampleReady: "Exemplo de pressão pronto: força ÷ área.",
    chooseSampleToStart: "Escolha um cálculo de exemplo para começar.",
    savedItemLoaded: "Item salvo carregado. Toque em = para executá-lo.",
    couldNotCopyCalculation: "Não foi possível copiar este cálculo.",
    expressionPlaceholder: "Exemplo: 1kΩ × 1mA",
    deleteKey: "Excluir", caretLeft: "Mover o cursor para a esquerda", caretRight: "Mover o cursor para a direita",
    clearAllKey: "Limpar tudo",
    skip: "Pular",
    getStarted: "Começar",
    next: "Próximo",
    constantSaved: (symbol: string) => `Constante ${symbol} salva.`,
    historySaveFailed: "Calculado, mas não foi possível salvar o item no histórico deste dispositivo.",
    expressionCalculationFailed: "Não foi possível calcular esta expressão.",
    historyRestored: "O cálculo salvo foi restaurado.",
    historyExported: "O histórico de cálculos foi exportado como CSV.",
    csvExportFailed: "Não foi possível exportar o arquivo CSV.",
    compareUnits: "Comparar unidades",
    compareUnitsHint: "Toque em uma linha para exibir o resultado nessa unidade.",
    baseInput: "Inserir em outra base",
    decimalForm: "Decimal", exactForm: "Exato", scientificForm: "Notação científica",
    significantDigits: (count: number) => `${count} a.s.`,
    sampleConfirmTitle: "Carregar um exemplo?",
    sampleConfirmMessage: "A expressão que você digitou será substituída.",
    sampleConfirmButton: "Carregar",
    incompleteHint: "Continue digitando: o resultado aparece assim que a expressão estiver completa.",
    quickStartTitle: "Experimente",
    quickStartOhmsLaw: "Lei de Ohm: a resposta sai em V",
    quickStartCurrent: "Lei de Ohm: a resposta sai em mA",
    quickStartDistance: "Velocidade × tempo, exibido em km",
  },
  de: {
    definitionHint: "Konstante definieren: W = 3cm", calculate: "=", siBase: "SI-Basis", emptyResult: "Gib einen Ausdruck ein, um das Ergebnis zu sehen. Tippe auf =, um es im Verlauf zu speichern.", pickUnit: "Registrierte Einheit wählen", speedTitle: "Strecke, Zeit & Geschwindigkeit", speedFormula: "Geschwindigkeit = Strecke ÷ Zeit     Strecke = Geschwindigkeit × Zeit", findSpeed: "Geschwindigkeit berechnen", findDistance: "Strecke berechnen", findTime: "Zeit berechnen", savedHistory: "Gespeicherte Berechnungen", historyHint: "Die letzten Ergebnisse stehen als a1, a2 usw. zur Verfügung.", clear: "Löschen", helpTitle: "Beispiele", helpDone: "Fertig", unitSearch: "Einheiten, Namen oder Kategorien suchen", copied: "Berechnung kopiert", copy: "Kopieren", unitDetails: "Details zur Einheit", siConversion: "SI-Umrechnung", commonUse: "Typische Verwendung", close: "Schließen", advancedMath: "Erweiterte Mathematik", advancedMathHint: "Winkel in rad, deg oder °. Enthält inverse Trigonometrie, Logarithmen und atan2(y, x).", saveTemplate: "Speichern", samples: "Beispiele", math: "Math.", outputUnit: "Anzeigeeinheit", insertUnit: "Einheit einfügen", registered: "Registriert", supported: "Unterstützt, nicht gelistet", unknown: "Keine gültige Einheit", unknownHint: "Prüfe das Symbol oder wähle unten einen Vorschlag.", history: "Verlauf", use: "Verwenden", noUnit: "SI-Basis", compatible: "Passt zu diesem Ergebnis", allCandidates: "Nächste Vorschläge", hintFix: "Beheben", hintComplete: "Fertig", hintAttach: "Anfügen", hintReplace: "Ersetzen", hintInsert: "Einfügen", more: "Mehr", showAs: "Anzeigen als", fixTap: "Tippe auf die rote Einheit, um sie zu korrigieren.", noCandidates: "Kein Vorschlag gefunden. Prüfe das Symbol.", aliasNote: "entspricht", noSearchResults: "Keine Einheit passt zu dieser Suche.", noSearchResultsHint: "Versuche ein anderes Symbol, einen anderen Namen oder eine andere Kategorie.", noHistory: "Noch keine gespeicherten Berechnungen.", noHistoryHint: "Jedes berechnete Ergebnis wird hier automatisch gespeichert.", browseUnits: "Kategorien durchsuchen",
    cannotConvertUnit: "Umrechnung in diese Einheit nicht möglich.",
    unresolvedUnitSuggestion: (text: string, canonical: string) => `„${text}“ ist keine gültige Einheit. Meintest du ${canonical}?`,
    unresolvedUnitUnknown: (text: string) => `„${text}“ ist keine registrierte oder unterstützte Einheit.`,
    enterExpression: "Gib einen Ausdruck ein.",
    unitDoesNotFit: (unit: string) => `„${unit}“ passt nicht – es wird der SI-Basiswert angezeigt.`,
    speedExampleReady: "Geschwindigkeitsbeispiel bereit: Strecke ÷ Zeit.",
    pressureExampleReady: "Druckbeispiel bereit: Kraft ÷ Fläche.",
    chooseSampleToStart: "Wähle eine Beispielberechnung, um zu starten.",
    savedItemLoaded: "Gespeicherter Eintrag geladen. Tippe auf =, um ihn auszuführen.",
    couldNotCopyCalculation: "Diese Berechnung konnte nicht kopiert werden.",
    expressionPlaceholder: "Beispiel: 1kΩ × 1mA",
    deleteKey: "Rücktaste", caretLeft: "Cursor nach links", caretRight: "Cursor nach rechts",
    clearAllKey: "Alles löschen",
    skip: "Überspringen",
    getStarted: "Loslegen",
    next: "Weiter",
    constantSaved: (symbol: string) => `Konstante ${symbol} gespeichert.`,
    historySaveFailed: "Berechnet, aber der Verlaufseintrag konnte auf diesem Gerät nicht gespeichert werden.",
    expressionCalculationFailed: "Dieser Ausdruck konnte nicht berechnet werden.",
    historyRestored: "Die gespeicherte Berechnung wurde wiederhergestellt.",
    historyExported: "Der Berechnungsverlauf wurde als CSV exportiert.",
    csvExportFailed: "Die CSV-Datei konnte nicht exportiert werden.",
    compareUnits: "Einheiten vergleichen",
    compareUnitsHint: "Tippe auf eine Zeile, um das Ergebnis in dieser Einheit anzuzeigen.",
    baseInput: "Eingabe im Zahlensystem",
    decimalForm: "Dezimal", exactForm: "Exakt", scientificForm: "Wissenschaftliche Notation",
    significantDigits: (count: number) => `${count} gelt. Ziffern`,
    sampleConfirmTitle: "Beispiel laden?",
    sampleConfirmMessage: "Der eingegebene Ausdruck wird ersetzt.",
    sampleConfirmButton: "Laden",
    incompleteHint: "Tippe weiter – das Ergebnis erscheint, sobald der Ausdruck vollständig ist.",
    quickStartTitle: "Probier eins",
    quickStartOhmsLaw: "Ohmsches Gesetz – die Antwort kommt in V",
    quickStartCurrent: "Ohmsches Gesetz – die Antwort kommt in mA",
    quickStartDistance: "Geschwindigkeit × Zeit, angezeigt in km",
  },
  fr: {
    definitionHint: "Définir une constante : W = 3cm", calculate: "=", siBase: "Base SI", emptyResult: "Saisissez une expression pour voir le résultat. Appuyez sur = pour l'enregistrer dans l'historique.", pickUnit: "Choisir une unité enregistrée", speedTitle: "Distance, temps et vitesse", speedFormula: "Vitesse = distance ÷ temps     Distance = vitesse × temps", findSpeed: "Calculer la vitesse", findDistance: "Calculer la distance", findTime: "Calculer le temps", savedHistory: "Calculs enregistrés", historyHint: "Les derniers résultats sont disponibles sous la forme a1, a2, etc.", clear: "Effacer", helpTitle: "Exemples", helpDone: "Terminé", unitSearch: "Rechercher des unités, des noms ou des catégories", copied: "Calcul copié", copy: "Copier", unitDetails: "Détails de l'unité", siConversion: "Conversion SI", commonUse: "Usage courant", close: "Fermer", advancedMath: "Mathématiques avancées", advancedMathHint: "Les angles utilisent rad, deg ou °. Comprend la trigonométrie inverse, les logarithmes et atan2(y, x).", saveTemplate: "Enregistrer", samples: "Exemples", math: "Maths", outputUnit: "Unité affichée", insertUnit: "Insérer une unité", registered: "Enregistrée", supported: "Prise en charge, non listée", unknown: "Unité non valide", unknownHint: "Vérifiez le symbole ou choisissez un candidat ci-dessous.", history: "Historique", use: "Utiliser", noUnit: "Base SI", compatible: "Compatible avec ce résultat", allCandidates: "Candidats les plus proches", hintFix: "Corriger", hintComplete: "Terminer", hintAttach: "Ajouter", hintReplace: "Remplacer", hintInsert: "Insérer", more: "Plus", showAs: "Afficher en", fixTap: "Touchez l'unité en rouge pour la corriger.", noCandidates: "Aucun candidat trouvé. Vérifiez le symbole.", aliasNote: "identique à", noSearchResults: "Aucune unité ne correspond à cette recherche.", noSearchResultsHint: "Essayez un autre symbole, nom ou catégorie.", noHistory: "Aucun calcul enregistré pour le moment.", noHistoryHint: "Chaque résultat calculé est enregistré ici automatiquement.", browseUnits: "Parcourir les catégories",
    cannotConvertUnit: "Impossible de convertir vers cette unité.",
    unresolvedUnitSuggestion: (text: string, canonical: string) => `« ${text} » n'est pas une unité valide. Vouliez-vous dire ${canonical} ?`,
    unresolvedUnitUnknown: (text: string) => `« ${text} » n'est pas une unité enregistrée ou prise en charge.`,
    enterExpression: "Saisissez une expression.",
    unitDoesNotFit: (unit: string) => `« ${unit} » ne convient pas : affichage de la valeur en base SI.`,
    speedExampleReady: "Exemple de vitesse prêt : distance ÷ temps.",
    pressureExampleReady: "Exemple de pression prêt : force ÷ surface.",
    chooseSampleToStart: "Choisissez un calcul d'exemple pour commencer.",
    savedItemLoaded: "Élément enregistré chargé. Appuyez sur = pour l'exécuter.",
    couldNotCopyCalculation: "Impossible de copier ce calcul.",
    expressionPlaceholder: "Exemple : 1kΩ × 1mA",
    deleteKey: "Supprimer", caretLeft: "Déplacer le curseur vers la gauche", caretRight: "Déplacer le curseur vers la droite",
    clearAllKey: "Tout effacer",
    skip: "Passer",
    getStarted: "Commencer",
    next: "Suivant",
    constantSaved: (symbol: string) => `Constante ${symbol} enregistrée.`,
    historySaveFailed: "Calcul effectué, mais l'entrée n'a pas pu être enregistrée dans l'historique sur cet appareil.",
    expressionCalculationFailed: "Impossible de calculer cette expression.",
    historyRestored: "Le calcul enregistré a été restauré.",
    historyExported: "L'historique des calculs a été exporté au format CSV.",
    csvExportFailed: "Impossible d'exporter le fichier CSV.",
    compareUnits: "Comparer les unités",
    compareUnitsHint: "Touchez une ligne pour afficher le résultat dans cette unité.",
    baseInput: "Saisie dans une base",
    decimalForm: "Décimal", exactForm: "Exact", scientificForm: "Notation scientifique",
    significantDigits: (count: number) => `${count} c.s.`,
    sampleConfirmTitle: "Charger un exemple ?",
    sampleConfirmMessage: "L'expression que vous avez saisie sera remplacée.",
    sampleConfirmButton: "Charger",
    incompleteHint: "Continuez à saisir : le résultat apparaît dès que l'expression est complète.",
    quickStartTitle: "Essayez",
    quickStartOhmsLaw: "Loi d'Ohm : la réponse s'affiche en V",
    quickStartCurrent: "Loi d'Ohm : la réponse s'affiche en mA",
    quickStartDistance: "Vitesse × temps, affiché en km",
  },
};

// オンボーディングの3スライド。EN_COPYと同様に英語を正としたRecordで持ち、言語追加時のキー漏れを型エラーで検出する。
type OnboardingSlide = { title: string; body: string; example: string };
const ONBOARDING_SLIDES: Record<AppLanguage, OnboardingSlide[]> = {
  en: [
    { title: "Calculate with units, directly", body: "Type an expression with units, such as 1kΩ × 1mA. The app normalizes it to SI before calculating.", example: "1kΩ × 1mA" },
    { title: "Mistakes are caught, not calculated", body: "3m + 2kg is refused with the reason: length and mass cannot be added. Mistyped units turn red — tap one to fix it.", example: "3m + 2kg" },
    { title: "Answers in the unit you mean", body: "1kΩ × 1mA comes back as 1 V, and 12V / 4.7kΩ as 2.55 mA. Tap a chip under the result to switch units. Step-by-step formulas live in the Library tab.", example: "12V / 4.7kΩ" },
  ],
  ja: [
    { title: "単位のまま計算できます", body: "1kΩ × 1mA のように単位を含む式を入力するだけです。計算前にSI標準へ正規化されます。", example: "1kΩ × 1mA" },
    { title: "間違いは計算せず、理由を教えます", body: "3m + 2kg は「長さと質量は足し引きできません」と止まります。入力ミスの単位は赤くなり、タップで直せます。", example: "3m + 2kg" },
    { title: "答えは読みたい単位で", body: "1kΩ × 1mA は 1 V、12V / 4.7kΩ は 2.55 mA で返ります。結果の下のチップで単位を切り替えられます。手順のある公式は「ライブラリ」タブにあります。", example: "12V / 4.7kΩ" },
  ],
  es: [
    { title: "Calcula directamente con unidades", body: "Escribe una expresión con unidades, como 1kΩ × 1mA. La app la normaliza a SI antes de calcular.", example: "1kΩ × 1mA" },
    { title: "Los errores se detectan, no se calculan", body: "3m + 2kg se rechaza con el motivo: longitud y masa no se pueden sumar. Las unidades mal escritas aparecen en rojo; tócalas para corregirlas.", example: "3m + 2kg" },
    { title: "Respuestas en la unidad que quieres", body: "1kΩ × 1mA devuelve 1 V, y 12V / 4.7kΩ devuelve 2.55 mA. Toca un chip bajo el resultado para cambiar de unidad. Las fórmulas paso a paso están en la pestaña Biblioteca.", example: "12V / 4.7kΩ" },
  ],
  "pt-BR": [
    { title: "Calcule diretamente com unidades", body: "Digite uma expressão com unidades, como 1kΩ × 1mA. O app a normaliza para SI antes de calcular.", example: "1kΩ × 1mA" },
    { title: "Erros são detectados, não calculados", body: "3m + 2kg é recusado com o motivo: comprimento e massa não podem ser somados. Unidades digitadas errado ficam vermelhas; toque para corrigir.", example: "3m + 2kg" },
    { title: "Respostas na unidade que você quer", body: "1kΩ × 1mA retorna 1 V, e 12V / 4.7kΩ retorna 2.55 mA. Toque em um chip abaixo do resultado para trocar a unidade. As fórmulas passo a passo ficam na aba Biblioteca.", example: "12V / 4.7kΩ" },
  ],
  de: [
    { title: "Direkt mit Einheiten rechnen", body: "Gib einen Ausdruck mit Einheiten ein, zum Beispiel 1kΩ × 1mA. Die App normalisiert ihn vor der Berechnung auf SI.", example: "1kΩ × 1mA" },
    { title: "Fehler werden erkannt, nicht gerechnet", body: "3m + 2kg wird mit Begründung abgelehnt: Länge und Masse lassen sich nicht addieren. Falsch geschriebene Einheiten werden rot – tippe darauf, um sie zu korrigieren.", example: "3m + 2kg" },
    { title: "Antworten in der Einheit, die du meinst", body: "1kΩ × 1mA ergibt 1 V, 12V / 4.7kΩ ergibt 2.55 mA. Tippe auf einen Chip unter dem Ergebnis, um die Einheit zu wechseln. Schrittweise Formeln findest du im Tab Bibliothek.", example: "12V / 4.7kΩ" },
  ],
  fr: [
    { title: "Calculez directement avec des unités", body: "Saisissez une expression avec des unités, comme 1kΩ × 1mA. L'application la normalise en SI avant de calculer.", example: "1kΩ × 1mA" },
    { title: "Les erreurs sont détectées, pas calculées", body: "3m + 2kg est refusé avec la raison : une longueur et une masse ne s'additionnent pas. Les unités mal saisies passent en rouge ; touchez-les pour les corriger.", example: "3m + 2kg" },
    { title: "Des réponses dans l'unité voulue", body: "1kΩ × 1mA donne 1 V et 12V / 4.7kΩ donne 2.55 mA. Touchez une puce sous le résultat pour changer d'unité. Les formules pas à pas sont dans l'onglet Bibliothèque.", example: "12V / 4.7kΩ" },
  ],
};

export default function CalculatorScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { quick, presetExpression, presetUnit } = useLocalSearchParams<{ quick?: string | string[]; presetExpression?: string | string[]; presetUnit?: string | string[] }>();
  const { constants, history, favoriteUnits, upsertConstant, addHistoryEntry, clearHistory, isLoading: isHistoryLoading } = useCalculatorStore();
  const { isPro } = usePro();
  const { completeOnboarding, hasSeenOnboarding, isReady, language, locale, measuringStandard, t, unitGroupLabel, unitSystem } = useGlobalSettings();
  const [onboardingStep, setOnboardingStep] = useState(0);
  // 起動時の初期式は「固定のサンプル」ではなく「最後に計算した式」にしてほしいという要望に対応する
  // ため、ここでは空欄で始め、履歴の読み込みが終わった時点で下のuseEffectがhistory[0]を反映する
  // （履歴が無ければ空欄のまま。入力例はexpressionPlaceholderで見せているので初見でも迷わない）。
  const [expression, setExpression] = useState("");
  // キャレット（テキスト選択範囲）を追跡し、単位チップ・キーパッドの入力先を「末尾」ではなく
  // 「今カーソルがある位置」にするために使う。pendingSelection はプログラムから挿入した直後だけ
  // TextInput の selection props を強制するための一時的な値で、適用後すぐ null に戻して
  // ユーザー自身のカーソル操作と競合しないようにする。
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: expression.length, end: expression.length });
  const [pendingSelection, setPendingSelection] = useState<{ start: number; end: number } | null>(null);
  const [targetUnit, setTargetUnit] = useState(DEFAULT_TARGET_UNIT);
  // 計算結果は式から導出する（= を押さなくてもリアルタイムに出す）。stateで持つと、
  // 式を書き換えたのに前の結果が残る／= を押すまで何も出ない、という2つの状態を抱えることになる。
  // = は「履歴に残す・定数を保存する・エラーを出す」確定操作の方に専念させる。
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inputGroupId, setInputGroupId] = useState("length");
  // null は「まだ自分で選んでいない」。既定のタブは言語ごとの関連度順（lib/locale-relevance.ts）の
  // 先頭にするので、"basic" のような固定値を初期値に持たせない。
  const [sampleCategory, setSampleCategory] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  // サンプルは式を丸ごと置き換える破壊的な操作なので、入力中の式があるときだけ確認する。
  // シートを閉じてから出すことで、ConfirmDialogがモーダルの中に重ならないようにする。
  const [pendingSample, setPendingSample] = useState<SampleCalculation | null>(null);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvancedKeys, setShowAdvancedKeys] = useState(false);
  // 単位比較表はデフォルト折りたたみ。永続化はしない（開閉状態は画面を開くたびリセットしてよい）。
  const [showComparison, setShowComparison] = useState(false);
  // 結果カードの大きい数値をどの基数で描くか（表示モード）。showComparisonと同様、永続化しない。
  const [activeBase, setActiveBase] = useState<NumberBase>(10);
  // 小数 ⇔ 厳密値（分数・π・√）の切り替え。厳密な形を出せない値のときは exactValue が null に
  // なり、この state に関係なく小数を出す。state 自体は残しておく（同じ種類の計算を続けるとき、
  // 途中で値が整数になっただけで設定が戻ってしまうのを避けるため。activeBase と同じ扱い）。
  const [valueForm, setValueForm] = useState<ValueForm>("decimal");
  // 式が空のときだけ有効になる、進数の桁を直接打ち込むモード。nullなら通常の電卓。
  // showComparisonと同様、永続化しない（画面を開くたびリセットしてよい）。
  const [baseInputMode, setBaseInputMode] = useState<NumberBase | null>(null);
  const [unitPickerMode, setUnitPickerMode] = useState<"insert" | "target">("insert");
  const [unitInfoSymbol, setUnitInfoSymbol] = useState<string | null>(null);
  const [unitSearch, setUnitSearch] = useState("");
  const [recentUnits, setRecentUnits] = useState<string[]>([]);
  const [fixSelection, setFixSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  // 接頭語キーで入れた1文字を「まだ単位を選んでいる途中」として覚えておく。**この意図は式の
  // 見た目からは復元できない**: `m` は単体でメートルとして解決できるので、状態を持たないと
  // 単位の差し替え（`5m` → cm・km…）の経路に入り、mA・mV・ms が候補から消える
  // （CodeRabbitが#59で🟡として検出。`G` も標準重力として解決するので同じ穴だった）。
  const [prefixEntry, setPrefixEntry] = useState<{ start: number; end: number; prefix: string } | null>(null);
  const [showInlineUnitSearch, setShowInlineUnitSearch] = useState(false);
  const [inlineUnitQuery, setInlineUnitQuery] = useState("");
  const unitSearchRef = useRef<TextInput>(null);
  const inlineUnitSearchRef = useRef<TextInput>(null);
  // quick / presetExpression / presetUnit はルートパラメータなので画面に残り続ける。
  // これらを見ているエフェクトは language も参照しているため、言語を切り替えると再実行され、
  // 入力途中の式・表示単位をもう一度上書きして結果まで消してしまう。適用済みの値を覚えて
  // おき、同じ値には一度だけ反応するようにする。
  // 使い終わったパラメータを router.setParams で消す手もあるが、初回レンダーでこのエフェクトが
  // 走る時点ではルートのナビゲータがまだマウントされておらず、
  // "Attempted to navigate before mounting the Root Layout component" で画面が真っ白になる
  // （クイックアクションから起動する経路そのものが壊れる）。実際にブラウザで再現して確認済み。
  const appliedQuickRef = useRef<string | null>(null);
  const appliedPresetRef = useRef<string | null>(null);
  // 起動時の履歴復元用。initialExpressionRef はマウント時の expression の値（常に""）を
  // 一度だけ捕まえておく（useRefの初期値は最初のレンダーでしか使われないため、以後 expression が
  // 変わっても書き換わらない）。履歴の読み込み完了後、このrefの値と現在の expression を比較して
  // 「その間に何も変わっていない＝ユーザーはまだ何も打っていない」ときだけ履歴を反映する
  // （判定ロジック自体は resolveStartupExpression に切り出し、tests/ でユニットテスト済み）。
  const initialExpressionRef = useRef(expression);
  const appliedStartupHistoryRef = useRef(false);

  // 結果が更新された瞬間・単位を切り替えた瞬間に軽く跳ねさせ、次元不整合時は横に揺らして知らせる。
  const resultOpacity = useSharedValue(1);
  const resultScale = useSharedValue(1);
  const errorShake = useSharedValue(0);
  const resultAnimatedStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [{ scale: resultScale.value }],
  }));
  const errorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: errorShake.value }],
  }));
  // Reanimatedのshared valueはレンダー外での代入が正規の使い方だが、
  // React Compilerのeslintルールは通常のstateと区別できず誤検知するため個別に無効化する。
  const playResultReveal = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    resultOpacity.value = 0;
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    resultScale.value = 0.94;
    resultOpacity.value = withTiming(1, { duration: 220 });
    resultScale.value = withSpring(1, { damping: 14, mass: 0.6, stiffness: 180 });
  }, [resultOpacity, resultScale]);
  const playResultPulse = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    resultScale.value = withSequence(withTiming(1.04, { duration: 90 }), withSpring(1, { damping: 12, mass: 0.6, stiffness: 200 }));
  }, [resultScale]);
  const playErrorShake = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    errorShake.value = withSequence(
      withTiming(-6, { duration: 45 }),
      withTiming(6, { duration: 45 }),
      withTiming(-4, { duration: 45 }),
      withTiming(4, { duration: 45 }),
      withTiming(0, { duration: 45 }),
    );
  }, [errorShake]);

  // シンプル/上級の表示モード設定は廃止し、常に上級モード相当（角度・科学単位・数学関数を表示）で動作する。
  const isAdvancedMode = true;
  const includeUnit = useCallback(
    (group: UnitGroup, unitOption: UnitOption) => isUnitGroupVisible(group, isAdvancedMode) && isUnitVisible(unitOption, isAdvancedMode),
    [isAdvancedMode],
  );
  /** そのカテゴリの単位を、地域優先順のうえで現在の表示モードに合わせて絞り込む。 */
  const visibleGroupUnits = useCallback(
    (group: UnitGroup) => getGroupUnitsForSystem(group, unitSystem).filter((unitOption) => includeUnit(group, unitOption)),
    [includeUnit, unitSystem],
  );
  const visibleInputGroups = useMemo(() => UNIT_GROUPS.filter((group) => isUnitGroupVisible(group, isAdvancedMode)), [isAdvancedMode]);
  const selectedInputGroup = visibleInputGroups.find((group) => group.id === inputGroupId) ?? visibleInputGroups[0] ?? UNIT_GROUPS[0];
  const selectedInputUnits = useMemo(() => visibleGroupUnits(selectedInputGroup), [selectedInputGroup, visibleGroupUnits]);
  const searchSuggestions = useMemo(() => getUnitSuggestions(unitSearch, { system: unitSystem, limit: 24, includeUnit }), [includeUnit, unitSearch, unitSystem]);
  const inlineUnitSuggestions = useMemo(
    () => (inlineUnitQuery.trim()
      ? getUnitSuggestions(inlineUnitQuery, { system: unitSystem, limit: 30, includeUnit })
      : selectedInputUnits.map((unitOption) => ({ group: selectedInputGroup, unit: unitOption }))),
    [includeUnit, inlineUnitQuery, selectedInputGroup, selectedInputUnits, unitSystem],
  );
  const inlineUnitRegistration = useMemo(() => getUnitRegistration(inlineUnitQuery), [inlineUnitQuery]);
  // サンプルの並びは言語ごとのターゲット層に合わせて関連度順にする
  // （docs/target-users-by-locale-2026-09.md 第1節。判断は lib/locale-relevance.ts の純関数側）。
  // 元の SAMPLE_CATEGORIES / SAMPLE_CALCULATIONS の配列順は言語に依らない正順のまま保つ。
  const visibleSampleCategories = useMemo(
    () => orderSampleCategoriesForLanguage(SAMPLE_CATEGORIES.filter((category) => isSampleCategoryVisible(category.id, isAdvancedMode)), language),
    [isAdvancedMode, language],
  );
  const activeSampleCategory = sampleCategory ?? visibleSampleCategories[0]?.id ?? "basic";
  const visibleSamples = useMemo(
    () => orderSamplesForLanguage(SAMPLE_CALCULATIONS.filter((sample) => sample.category === activeSampleCategory && isSampleCategoryVisible(sample.category, isAdvancedMode)), language),
    [activeSampleCategory, isAdvancedMode, language],
  );
  // 履歴の表示件数はProでも無料でも同じにしている（以前は無料5件で打ち切っていた）。
  // 打ち切りは a1・a2… の自動定数と食い違うのが致命的で、autoConstantsは常に全履歴から作るため、
  // 無料ユーザーは見えない a12 を式から参照できてしまっていた。加えて「計算のたびに履歴が消える」は
  // 電卓アプリの低評価の定番パターン（docs/market-research-2026-09.md 第4節）で、
  // 無料の価値を削ってProを売る設計はこのジャンルで最も反発が強い。
  const visibleHistory = history;
  const autoConstants = useMemo(() => historyToAutoConstants(history), [history]);
  const availableConstants = useMemo(() => [...constants, ...autoConstants], [autoConstants, constants]);
  // = を押す前でも計算できる入力ならその場で結果を出す。計算できない入力は「なぜ計算できないか」
  // （UnitError）も一緒に受け取り、次元不一致・使えない単位のような意味の誤りは結果カードの中で
  // リアルタイムに説明する（liveDiagnosis）。書きかけの式（"5cm +"・閉じ括弧待ち）で出る構文系の
  // エラーは isDiagnosableInputError が弾くので、打っている最中に赤くはならない。
  // 以前はエラーを全部握りつぶして「式を入力すると結果が出ます」を出していたため、このアプリの
  // 中核である次元チェックが = を押した人にしか見えなかった（2026-09のUX監査で判明）。
  const diagnosis = useMemo(() => diagnoseCalculatorInput(expression, availableConstants), [availableConstants, expression]);
  const result = diagnosis.quantity;
  const liveDiagnosis = useMemo(
    () => (diagnosis.error && isDiagnosableInputError(diagnosis.error) ? unitErrorMessage(diagnosis.error, language) ?? diagnosis.error.message : ""),
    [diagnosis, language],
  );
  const compatibleUnitGroups = useMemo(() => (result ? getCompatibleUnitGroups(result.dimension).filter((group) => isUnitGroupVisible(group, isAdvancedMode) && visibleUnits(getRegionalUnits(group, unitSystem), isAdvancedMode).length > 0) : []), [isAdvancedMode, result, unitSystem]);
  const unitInfo = useMemo(() => getUnitExplanation(unitInfoSymbol ?? ""), [unitInfoSymbol]);
  const searchedUnitRegistration = useMemo(() => getUnitRegistration(unitSearch), [unitSearch]);

  const identifiers = useMemo(
    () => [...constants.map((item) => item.symbol), ...autoConstants.map((item) => item.symbol)],
    [autoConstants, constants],
  );
  const analysis = useMemo(() => analyzeExpression(expression, identifiers), [expression, identifiers]);
  // プレビュー行をキャレットの位置で切り分けたもの。selection をそのまま渡すことで、単位チップの
  // 挿入位置（selection.start を見る）と画面に出るキャレットが必ず同じ場所になる。
  const caretPreview = useMemo(
    () => buildCaretPreview(analysis.segments, selection.start, selection.end),
    [analysis.segments, selection.end, selection.start],
  );
  // `< >` を端で無効にして、キャレットが先頭・末尾に着いていることを押す前に分かるようにする
  // （押しても何も起きないボタンにしない）。
  const caretAtStart = Math.min(selection.start, selection.end) <= 0;
  const caretAtEnd = Math.max(selection.start, selection.end) >= expression.length;
  // 進数入力中のプレビューは桁を解析しないので、位置だけを式の長さに丸めて使う。両端を持つのは、
  // 進数モードでも pressKey が選択範囲をまとめて置換・削除するため（baseInputMode は「どのキーを
  // 受け付けるか」だけを絞っていて、範囲の置換はそのまま通る）。キャレット1本だけを描くと、
  // 実際には複数桁が消えるのに1文字ぶんの挿入に見えてしまう。
  const baseSelection = useMemo(() => {
    const clamp = (value: number) => Math.max(0, Math.min(expression.length, value));
    const start = clamp(Math.min(selection.start, selection.end));
    const end = clamp(Math.max(selection.start, selection.end));
    return { start, end, hasRange: start !== end };
  }, [expression.length, selection.end, selection.start]);

  // 実際に表示へ使う単位。targetUnit（ユーザーが明示的に選んだ単位）はそのまま状態として持ち続け、
  // 結果の次元に合うときだけ使う。合わないとき・未選択のときは式中の単位→読みやすい接頭語→SI の順で
  // 自動的に決める（lib/display-unit.ts）。targetUnit を直接 convertQuantity に渡していた頃は、
  // 長さの計算で cm を選んだあと 255 や 1/3 を打つと「cmへ変換できません」の赤字が出て、
  // 進数チップまで消えていた。以降の表示・チップの点灯・比較表・履歴の保存はすべてこの値を見る。
  const expressionUnits = useMemo(() => analysis.segments.filter((segment) => segment.kind === "unit").map((segment) => segment.text), [analysis]);
  const displayUnit = useMemo(
    () => (result ? resolveDisplayUnit({ quantity: result, requestedUnit: targetUnit, expressionUnits, system: unitSystem, isAdvancedMode }).unit : targetUnit.trim()),
    [expressionUnits, isAdvancedMode, result, targetUnit, unitSystem],
  );
  const targetUnitRegistration = useMemo(() => getUnitRegistration(displayUnit), [displayUnit]);
  // 「この数値には何の単位を付けるべきか」が式から分かる場合の手掛かり。裸の数値を足し引きして
  // 次元不一致になっている式では、反対側の次元がそのまま答えになる（lib/unit-input.ts）。
  const requiredUnitGroup = useMemo(() => requiredUnitGroupFromError(diagnosis.error), [diagnosis.error]);
  // 単位を打っている途中（レールが「確定」の候補を出している最中）は赤い診断を出さない。
  // 接頭語キーを押すと必ず一度は「未対応の単位「M」です」を通るので、そのままだと
  // 押すたびに赤くなる。補完候補はレールに並んでいて、当たっている綴りも入力欄の下の
  // プレビューで赤く示されるので、結果カードで重ねて言う必要が無い。
  // **`=` の赤帯の重複判定も同じ値を見ること**（liveDiagnosis のままにすると、カードには
  // 出ていないのに「既に出ている」と判断されてエラーがどこにも出なくなる）。
  const hint = useMemo<UnitInputHint>(() => {
    if (fixSelection) {
      return { kind: "fix", fragment: fixSelection.text, start: fixSelection.start, end: fixSelection.end, candidates: getUnitSuggestions(fixSelection.text, { system: unitSystem, limit: RAIL_LIMIT, includeUnit }) };
    }
    // 直前に計算済みの analysis を渡して、同じ式をもう一度解析しないようにする。
    // キャレット位置（selection.start）を渡すことで、末尾ではなく今カーソルがある単位・数値を対象にする。
    const caret = Math.min(selection.start, expression.length);
    // 接頭語キーを押した直後は、その1文字を単位として確定させずに「その接頭語で始まる単位」を出す。
    // **式とキャレットが押した直後のままかを毎回確かめる**ので、あとから打ち換え・削除・全消しが
    // あっても勝手に復活しない（この検証があるので、状態を消す場所を各所に足す必要がない）。
    if (prefixEntry && caret === prefixEntry.end && expression.slice(prefixEntry.start, prefixEntry.end) === prefixEntry.prefix) {
      return {
        kind: "complete",
        fragment: prefixEntry.prefix,
        start: prefixEntry.start,
        end: prefixEntry.end,
        candidates: getPrefixedUnitSuggestions(prefixEntry.prefix, { system: unitSystem, limit: RAIL_LIMIT, includeUnit }),
      };
    }
    return getUnitInputHint(expression, { system: unitSystem, recentUnits, identifiers, includeUnit, limit: RAIL_LIMIT, analysis, caret, requiredGroup: requiredUnitGroup });
  }, [analysis, expression, fixSelection, identifiers, includeUnit, prefixEntry, recentUnits, requiredUnitGroup, selection, unitSystem]);

  const visibleDiagnosis = hint.kind === "complete" ? "" : liveDiagnosis;

  /** 結果のすぐ横で切り替えられる、同じ次元の単位。 */
  const conversionUnits = useMemo(() => {
    const symbols: string[] = [];
    const current = displayUnit;
    if (current) symbols.push(current);
    compatibleUnitGroups.forEach((group) => {
      visibleGroupUnits(group).forEach((unitOption) => {
        if (!symbols.includes(unitOption.symbol)) symbols.push(unitOption.symbol);
      });
    });
    return symbols.slice(0, 10);
  }, [compatibleUnitGroups, displayUnit, visibleGroupUnits]);

  const targetUnitForSample = (sample: SampleCalculation) => {
    if (unitSystem === "us") {
      if (sample.id === "length-add") return "in";
      if (sample.id === "speed") return "mph";
      if (sample.id === "distance") return "mi";
      if (sample.id === "pressure") return "psi";
      if (sample.id === "work") return "BTU";
      if (sample.id === "power") return "hp";
    }
    if (unitSystem === "uk") {
      if (sample.id === "speed") return "mph";
      if (sample.id === "distance") return "mi";
      if (sample.id === "pressure") return "psi";
    }
    return sample.targetUnit;
  };

  const copy = COPY[language];

  const hintLabel = hint.kind === "fix" ? copy.hintFix : hint.kind === "complete" ? copy.hintComplete : hint.kind === "attach" ? copy.hintAttach : hint.kind === "replace" ? copy.hintReplace : copy.hintInsert;

  const onboardingSlides = ONBOARDING_SLIDES[language];
  const isLastOnboardingSlide = onboardingStep === onboardingSlides.length - 1;

  const display = useMemo(() => {
    void measuringStandard;
    if (!result) return null;
    // SI表記は成功・失敗どちらの経路でも使うので先に組み立てておく。
    // numeric/unitLabel は「いま画面に出している値」を数値と単位に分けたもの。分数・π表示
    // （lib/exact-value.ts）はこの数値の方だけを言い換えるので、valueの文字列から数値を
    // 切り出し直すことはしない（ロケールの桁区切り・指数表記を再パースする羽目になるため）。
    const si = formatQuantity(result, undefined, locale);
    const siUnitLabel = isDimensionless(result.dimension) ? "" : formatDimension(result.dimension, locale);
    try {
      if (!displayUnit) {
        return { value: si, numeric: result.siValue, unitLabel: siUnitLabel, si, error: "", isFallback: false };
      }
      const converted = convertQuantity(result, displayUnit, locale);
      return {
        value: `${formatNumberForLocale(converted.value, locale)} ${converted.unit}`,
        numeric: converted.value,
        unitLabel: converted.unit,
        si,
        error: "",
        isFallback: false,
      };
    } catch (cause) {
      // 次元不一致だけでなく、不正な単位文字列（例: プリセットの presetUnit パラメータ）など
      // 実際の失敗理由をそのまま見せる。決め打ちの「次元が違う」で握りつぶさない。
      // エンジンのエラー(UnitError)は現在の言語で表示する。UnitError以外は従来どおり
      // Error.message をそのまま出す（バックアップ処理など別系統のエラーもここを通るため）。
      const fallback = copy.cannotConvertUnit;
      // 値そのものは出せているのに表示単位だけが合わないケース（例: cmを選んだまま
      // 100km/2h のような速さの式に変えた）で「—」を出すと、比較表には各単位の値が
      // 並んでいるのに肝心の結果だけ消えるという分かりにくい画面になる。値はSI表記へ
      // フォールバックし、理由は警告として値の下に残す。計算ノート側
      // （lib/notebook-export-model.ts の resolveNotebookStepDisplay）が既に同じ扱いなので、
      // 画面ごとに挙動が違わないよう揃える。
      return {
        value: si,
        numeric: result.siValue,
        unitLabel: siUnitLabel,
        si,
        error: cause instanceof Error ? (unitErrorMessage(cause, language) ?? cause.message) : fallback,
        isFallback: true,
      };
    }
    // measuringStandardが変わるとcup/tbsp/tspの換算値が変わるため、依存配列に含めて表示単位を再計算させる（値自体は使わない）。
  }, [copy, displayUnit, language, locale, measuringStandard, result]);

  // SIチップの点灯条件。表示単位が未指定のときに加えて、次元が合わずSI表記へフォールバック
  // しているときも点灯させる（そのとき実際に表示している値はSI表記そのものなので）。
  const siChipActive = !displayUnit || Boolean(display?.isFallback);

  const comparisonRows = useMemo(() => {
    // measuringStandardが変わるとcup/tbsp/tspの換算値が変わるため、依存配列に含めて表を再計算させる（値自体は使わない）。
    void measuringStandard;
    return buildUnitComparisonRows(result ?? undefined, {
      unitSystem,
      hints: [displayUnit, expression, display?.si],
      activeUnit: displayUnit,
      locale,
    });
  }, [display, displayUnit, expression, locale, measuringStandard, result, unitSystem]);

  // 進数入力モード中の変換結果。expressionには接頭辞を含まない生の桁だけが入っている
  // （接頭辞は表示のときだけ足す）ので、パースにも接頭辞なしの生の桁をそのまま渡す。
  const baseInputParse = useMemo(
    () => (baseInputMode !== null ? parseBaseInput(expression, baseInputMode) : null),
    [baseInputMode, expression],
  );
  // 結果カードの基数チップは「出た答えをどの基数で読むか」だけを切り替える表示専用の列。
  // 以前はここが入力モードの開始も兼ねていたが、同じ見た目で意味が2通りになり、
  // 「押すと入力欄が変わる」のか「表示が変わるだけ」なのか区別できなかった。入力側の基数切り替えは
  // 入力欄の直下の別バーに分けてある。
  // 表示単位が付いていると画面の数値とsiValueが食い違う（例: 200%は画面表示が200・siValueは2）ので、
  // 表示単位が空のときだけ出す。
  const showBaseChips = canRepresentInBase(result ?? undefined) && !displayUnit;
  // 大きい数値の基数表示も上と同じ条件（無次元の安全整数・表示単位が空）でだけ行う。この条件を
  // 外すと、進数表示に切り替えた後に単位付きの式へ書き換えたときactiveBaseが10のまま残らず、
  // 単位付きの値を誤って基数表記してしまう。
  const resultBaseParts = useMemo(
    () => (result && activeBase !== 10 && canRepresentInBase(result) && !displayUnit ? formatInBaseParts(result.siValue, activeBase) : null),
    [activeBase, displayUnit, result],
  );

  // 小数で出た結果を分数・πの倍数・√の倍数として言い当てられるか（lib/exact-value.ts）。
  // 進数表示（resultBaseParts）とは排他になる。厳密な形が出るのは整数でない値だけで、進数表示は
  // 安全整数のときだけ出すため、両方が同時に有効になることはない。
  // 有限小数（0.051 → 51/1000）は言い換えになっていないので、チップごと出さない。
  const exactValue = useMemo(() => {
    if (!display || baseInputMode !== null) return null;
    const found = findExactValue(display.numeric);
    return found && !isTerminatingDecimalFraction(found) ? found : null;
  }, [baseInputMode, display]);

  // 分数（\frac）は縦に2段積むので、小数と同じ文字サイズで組むと高さが倍以上になり、
  // 小数から切り替えた瞬間に結果カードだけ別物のように見える。段数に応じて文字サイズを
  // 落とし、ブロック全体の高さが小数1行（resultValueの28px）に近くなるよう揃える。
  // 分数を含まない形（√3・2π など）は1段なので小数と同じ大きさのままでよい。
  const isStackedExactValue = Boolean(exactValue?.latex.includes("\\frac"));
  const exactFontSize = isStackedExactValue ? 26 : 36;

  // 入力式から読める有効数字の桁数（lib/significant-figures.ts）。加減算が混ざる式や
  // リテラルが無い式ではnullになり、そのときは丸めずに科学表記だけを出す。
  const inferredSignificantDigits = useMemo(() => inferSignificantDigits(expression), [expression]);

  // 結果を「a × 10ⁿ」で読む表示モード。**役に立つときだけチップを出す**ため、ここでnullを
  // 返した場合はチップも並べない。役に立つのは (1) 有効数字で丸めて桁が落ちたとき、
  // (2) 桁が大きい・小さいとき（10³以上か10⁻³未満）。5.1 のような値に「5.1 × 10⁰」の
  // 選択肢を並べても読み替えになっていない。
  const scientificValue = useMemo(() => {
    if (!display || baseInputMode !== null) return null;
    // display.numeric は表示単位へ換算済みの値。オフセットを持つ単位（°C・°F）への換算を
    // 挟んだ場合は有効数字を持ち越せないので桁数を落とす（significantDigitsAfterConversion）。
    // SI表記へフォールバックしているときは換算が挟まらないので空文字を渡す。
    const significantDigits = significantDigitsAfterConversion(inferredSignificantDigits, display.isFallback ? "" : displayUnit);
    const notation = toScientificNotation(display.numeric, { significantDigits, locale });
    if (!notation) return null;
    const worthShowing = notation.roundedFrom !== null || notation.exponent >= 3 || notation.exponent <= -3;
    return worthShowing ? notation : null;
  }, [baseInputMode, display, displayUnit, inferredSignificantDigits, locale]);

  // 並べるチップ。小数は常に、それ以外はその形で出せるときだけ。stateが出せない形を
  // 指していても表示側で小数へ戻る（exactValueと同じ扱い）ので、stateは消しに行かない。
  const availableValueForms = useMemo(
    () => VALUE_FORMS.filter((form) => form === "decimal" || (form === "exact" ? Boolean(exactValue) : Boolean(scientificValue))),
    [exactValue, scientificValue],
  );

  // コピーには画面に出ているものと同じ表記を渡す。厳密値に切り替えているのに小数がコピーされると、
  // 画面と手元のメモが食い違う。
  const shownValueText = !display
    ? ""
    : valueForm === "exact" && exactValue
      ? `${exactValue.text}${display.unitLabel ? ` ${display.unitLabel}` : ""}`
      : valueForm === "scientific" && scientificValue
        ? `${scientificValue.text}${display.unitLabel ? ` ${display.unitLabel}` : ""}`
        : display.value;

  const rememberUnit = (symbol: string) => {
    const trimmed = symbol.trim();
    if (!trimmed) return;
    setRecentUnits((current) => [trimmed, ...current.filter((unitSymbol) => unitSymbol !== trimmed)].slice(0, RECENT_UNIT_LIMIT));
  };

  const describeUnresolved = (segment: ExpressionSegment) => {
    const suggestion = getUnitSuggestions(segment.text, { system: unitSystem, limit: 1, includeUnit })[0];
    const canonical = segment.canonical ?? suggestion?.unit.symbol;
    return canonical ? copy.unresolvedUnitSuggestion(segment.text, canonical) : copy.unresolvedUnitUnknown(segment.text);
  };

  const calculate = async (expressionOverride?: string, targetUnitOverride?: string) => {
    const input = (expressionOverride ?? expression).trim();
    // 履歴に残す表示単位は、画面に実際に出ている単位（自動選択を含む）。
    const selectedTargetUnit = targetUnitOverride ?? displayUnit;
    if (!input) {
      setError(copy.enterExpression);
      return;
    }
    // 使えない単位だけを修正候補へ誘導する（未定義の定数・関数参照はここでは扱わず、下の計算エラーに任せる）。
    // 既に計算済みの analysis（生の expression 基準）を使い、トリム済み文字列を再解析して
    // インデックスがずれる（例: 先頭に空白がある式）ことを避ける。
    const unresolvedUnits = expressionOverride ? [] : analysis.unresolved.filter((segment) => segment.kind === "unknown-unit");
    const unresolvedUnit = unresolvedUnits[unresolvedUnits.length - 1];
    if (unresolvedUnit) {
      setError(describeUnresolved(unresolvedUnit));
      setFixSelection({ start: unresolvedUnit.start, end: unresolvedUnit.end, text: unresolvedUnit.text });
      playErrorShake();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError("");
    setNotice("");
    try {
      // リアルタイム表示と同じ評価関数を使う（定数定義の扱いが2箇所でずれないようにするため）。
      // 保存は副作用なので、確定操作であるここだけで行う。
      const { quantity, definition } = evaluateCalculatorInput(input, availableConstants);
      if (definition) {
        await upsertConstant(definition.symbol, definition.expression);
        setNotice(copy.constantSaved(definition.symbol));
      }
      playResultReveal();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // 表示単位が結果に合わないときは、行き止まりにせずSI標準へ戻す。
      let usedTargetUnit = selectedTargetUnit.trim();
      let output = formatQuantity(quantity, undefined, locale);
      if (usedTargetUnit) {
        try {
          output = formatQuantity(quantity, usedTargetUnit, locale);
        } catch {
          usedTargetUnit = "";
          setTargetUnit("");
          setNotice(copy.unitDoesNotFit(selectedTargetUnit.trim()));
        }
      }
      if (Platform.OS === "ios") {
        try {
          UnitCalculatorWidget.updateSnapshot({
            expression: input,
            result: output,
            siResult: formatQuantity(quantity, undefined, locale),
            // ネイティブのホーム画面ウィジェットはen/jaの文言しか持っていない（i18n.tsのAppLanguage拡張とは別スコープ）ため、
            // 新しく追加した言語はウィジェット側の既定言語（英語）にフォールバックする。
            locale: language,
          });
        } catch {
          // Widgets require a newly generated iOS development or production build.
        }
      }
      try {
        await addHistoryEntry({
          id: `${Date.now()}-${input}`,
          expression: input,
          resultText: output,
          quantity,
          targetUnit: usedTargetUnit,
          createdAt: new Date().toISOString(),
        });
      } catch {
        setNotice(copy.historySaveFailed);
      }
    } catch (cause) {
      // エンジンのエラー(UnitError)は現在の言語で表示する。UnitError以外は従来どおり
      // Error.message をそのまま出す（バックアップ処理など別系統のエラーもここを通るため）。
      // 結果カードに同じ診断（liveDiagnosis）が既に出ているときは赤帯を重ねない。同じ文言が
      // 2箇所に出るうえ、帯の挿入で結果カード以下が100px近く押し下げられるため。
      const alreadyDiagnosed = !expressionOverride && cause instanceof UnitError && Boolean(visibleDiagnosis);
      if (!alreadyDiagnosed) setError(cause instanceof Error ? (unitErrorMessage(cause, language) ?? cause.message) : copy.expressionCalculationFailed);
      playErrorShake();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  /** プログラムから式を書き換えた直後にキャレットを挿入位置の直後へ移すための共通処理。
   * pendingSelection は次のレンダー後に自動で解除され、以降はユーザー自身のカーソル操作を邪魔しない。 */
  const placeCaret = (position: number) => {
    const next = { start: position, end: position };
    setSelection(next);
    setPendingSelection(next);
  };

  // 履歴の非同期復元が、ユーザー自身の操作を後から上書きしないようにするための記録。
  // 式の中身の比較だけでは、全消し(AC)や「打ってから消した」で式が初期値（空）に戻ったときに
  // 「まだ何もしていない」と誤判定してしまうため、操作そのものをここで覚えておく。
  const hasUserInteractedRef = useRef(false);
  // 注意: この関数を applyTargetUnit / chooseUnit のような「render中に呼ばれる関数（renderUnitChip）から
  // 辿れる」関数の中に置くと、react-hooks/refs が「render中のref参照」として誤検知する
  // （実際にはonPressの中でしか実行されないが、ルールは遅延コールバックと区別できない）。
  // そのため表示単位の変更は、関数の中ではなくJSXのonPressハンドラ側で記録している。
  const markUserInteraction = () => {
    hasUserInteractedRef.current = true;
  };

  // 確定は = キーだけでなく、入力欄の右の結果ボタンとキーボードの改行（onSubmitEditing）からも
  // 起きる。経路ごとに書くと必ずどれかが漏れる（実際に = キー以外は進数の生の桁をそのまま
  // 通常の式として評価しようとしていた）ので、確定は必ずこの1関数を通す。
  const submitCalculation = () => {
    if (baseInputMode !== null) {
      // 進数入力モードでは確定は「計算」ではなく「その基数の生の桁を10進の数値へ変換する」操作。
      // 変換できないとき（空・不正な桁）は何もしない。=を押すまでエラーを出さない通常の
      // 電卓の方針に合わせ、ここでもエラー表示はしない。
      const parsed = parseBaseInput(expression, baseInputMode);
      if (parsed.status === "ok") {
        const decimalText = String(parsed.value);
        setExpression(decimalText);
        placeCaret(decimalText.length);
        setBaseInputMode(null);
      }
      return;
    }
    void calculate();
  };

  /** 編集キーでキャレットを1文字ずつ動かす。選択範囲があるときは、その端へ寄せるだけにする。 */
  const moveCaret = (delta: -1 | 1) => {
    markUserInteraction();
    const start = Math.min(selection.start, expression.length);
    const end = Math.min(selection.end, expression.length);
    if (start !== end) {
      placeCaret(delta < 0 ? start : end);
      return;
    }
    placeCaret(Math.max(0, Math.min(expression.length, start + delta)));
  };

  const pressKey = (key: string) => {
    markUserInteraction();
    if (key === "=") {
      submitCalculation();
      return;
    }
    // 進数入力モード中は、その基数の桁とAC・⌫以外を一切受け付けない。キーパッド側の disabled
    // だけでは数学シート（ADVANCED_KEYS）が pressKey("sin(") を直接呼べてしまい、確定できない
    // 桁が混ざる。入力の経路が複数あるので、ここでも弾く。
    if (baseInputMode !== null && key !== "AC" && key !== "⌫" && !isBaseDigitAllowed(key, baseInputMode)) return;
    // 式が変わればリアルタイムの結果も変わるので、= を押して出したエラーは持ち越さない
    // （そのままだと、新しい結果が出ているのに古い赤いメッセージが上に残る）。
    setError("");
    setNotice("");
    if (key === "AC") {
      // 全消し：式・キャレット位置・表示単位の指定・計算結果・エラー表示・案内文・進数入力モードを
      // まとめて初期状態に戻す。式に紐づかない履歴（history）はここでは消さない（履歴シート側に
      // 別の「消去」ボタンがある）。
      setExpression("");
      placeCaret(0);
      setTargetUnit(DEFAULT_TARGET_UNIT);
      setFixSelection(null);
      setBaseInputMode(null);
      void Haptics.selectionAsync();
      return;
    }
    const start = Math.min(selection.start, expression.length);
    const end = Math.min(selection.end, expression.length);
    if (key === "⌫") {
      // 選択範囲があればまとめて削除し、無ければキャレットの直前の1文字だけを消す
      // （末尾を問わず、常にキャレット基準で削除する）。
      if (start !== end) {
        setExpression(replaceExpressionRange(expression, start, end, ""));
        placeCaret(start);
      } else if (start > 0) {
        setExpression(replaceExpressionRange(expression, start - 1, start, ""));
        placeCaret(start - 1);
      }
      setFixSelection(null);
      return;
    }
    const inserted = key === "×" ? "×" : key === "÷" ? "÷" : key;
    // 選択範囲があれば置き換え、無ければキャレット位置へそのまま挿入する（末尾への追記ではない）。
    setExpression(replaceExpressionRange(expression, start, end, inserted));
    placeCaret(start + inserted.length);
    setFixSelection(null);
    setPrefixEntry(isPrefixKey(key) ? { start, end: start + inserted.length, prefix: inserted } : null);
  };

  // 進数入力を始められるのは、式が空か、そのまま別の基数へ読み替えられる10進の整数のときだけ。
  // 途中式（3+4 など）や単位付きの式から始めても読み替えようがないため、入口自体を無効にする。
  const canStartBaseInput = !expression.trim() || parseBaseInput(expression, 10).status === "ok";

  // 入力欄の下のバーで基数を押したときの効果。打ち込み済みの値は捨てず、表記だけを新しい基数へ
  // 書き換える（16進のFFで BIN を押すと 11111111、DEC を押すと 255）。以前は無条件にクリアして
  // いたため、DECを押しただけで打った値が消えていた。
  const pressBaseInputChip = (base: NumberBase) => {
    if (baseInputMode === null || base === baseInputMode) return;
    // 安全整数を超える桁が入っているときは基数を変えない。変換できないのに基数だけ変えると、
    // 同じ桁の並びが新しい基数では妥当な別の値として通ってしまう（canSwitchBaseInputの説明を参照）。
    if (!canSwitchBaseInput(expression, baseInputMode)) return;
    setBaseInputMode(base);
    const converted = reinterpretBaseInput(expression, baseInputMode, base);
    // 空・不正な桁で変換できないときは、書き換えようが無いので入力をそのまま残す。
    if (converted === null) return;
    setExpression(converted);
    placeCaret(converted.length);
  };

  // 進数入力モードの入口（「単位付け」レールの 0x ボタン）。モード中に押すと確定を兼ねる
  // ＝ = キーと同じく10進の数値へ直してから通常入力に戻るので、押した値が消えない。
  const toggleBaseInput = () => {
    markUserInteraction();
    if (baseInputMode !== null) {
      // 確定できる桁が入っていれば = と同じく10進の数値へ直して戻る。
      if (parseBaseInput(expression, baseInputMode).status === "ok") {
        submitCalculation();
        return;
      }
      // 空のまま・確定できない桁（安全整数を超える長さ等）のときも必ず抜けられるようにする。
      // submitCalculationは確定できないと何もせず戻るので、これが無いと入口を押し直しても
      // モードから出られず、ACしか逃げ道が無くなる。式として評価できない桁は残さず消す。
      setExpression("");
      placeCaret(0);
      setBaseInputMode(null);
      return;
    }
    if (!canStartBaseInput) return;
    setError("");
    setNotice("");
    // ボタンの表記どおり16進で始める。10進の整数が入っていればその場でFFのような16進表記になり、
    // 「10進→16進」もこのボタン1つで済む（戻したいときはバーのDECを押せばよい）。
    setBaseInputMode(16);
    const converted = reinterpretBaseInput(expression, 10, 16);
    if (converted === null) return;
    setExpression(converted);
    placeCaret(converted.length);
  };

  const applyTargetUnit = (unit: string) => {
    setTargetUnit(unit);
    rememberUnit(unit);
    setError("");
    if (result) {
      playResultPulse();
      void Haptics.selectionAsync();
    }
  };

  /**
   * 単位を反映する範囲を決める。ユーザーが範囲選択しているなら、その選択こそが「ここを置き換えたい」
   * という明確な指示なので最優先する（選択を無視してキャレット基準で判定すると、例えば「5cm」の
   * "cm" を選んで km を押したときに "5kmcm" になってしまう）。選択が無いときだけ fallback を使う。
   */
  const unitTargetRange = (fallback: { start: number; end: number }) => {
    if (selection.start === selection.end) {
      return { start: Math.min(fallback.start, expression.length), end: Math.min(fallback.end, expression.length) };
    }
    const start = Math.min(Math.min(selection.start, selection.end), expression.length);
    const end = Math.min(Math.max(selection.start, selection.end), expression.length);
    return { start, end };
  };

  /** 入力補助バーの候補をタップしたとき、案内した範囲（修正・補完・単位付けの対象）をそのまま置き換える。 */
  const applyUnitCandidate = (symbol: string) => {
    const wasFixingError = hint.kind === "fix";
    const { start, end } = unitTargetRange({ start: hint.start, end: hint.end });
    setExpression(replaceExpressionRange(expression, start, end, symbol));
    placeCaret(start + symbol.length);
    setFixSelection(null);
    setPrefixEntry(null);
    rememberUnit(symbol);
    setError("");
    setNotice("");
    if (wasFixingError) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else void Haptics.selectionAsync();
  };

  /** 単位シート（検索・カテゴリ一覧）やインライン検索から選んだときも、キャレット位置に反映する
   * （単位の上なら差し替え、数値の直後なら単位付け、それ以外はそのままキャレットへ挿入する）。 */
  const appendUnit = (symbol: string) => {
    const caret = Math.min(selection.start, expression.length);
    const { start, end } = unitTargetRange(getUnitInsertionRange(expression, caret, identifiers));
    setExpression(replaceExpressionRange(expression, start, end, symbol));
    placeCaret(start + symbol.length);
    setFixSelection(null);
    setPrefixEntry(null);
    rememberUnit(symbol);
    setError("");
    setNotice("");
  };

  const openUnitPicker = (mode: "insert" | "target") => {
    setUnitPickerMode(mode);
    setUnitSearch(mode === "target" ? targetUnit : "");
    setShowUnitPicker(true);
  };

  const chooseUnit = (unit: string) => {
    if (unitPickerMode === "target") applyTargetUnit(unit);
    else appendUnit(unit);
    setUnitSearch("");
    setShowUnitPicker(false);
  };

  const pickInlineUnit = (unit: string) => {
    appendUnit(unit);
    setInlineUnitQuery("");
  };

  const restoreHistory = (entry: (typeof history)[number]) => {
    markUserInteraction();
    // 進数入力モードのまま通常の式を読み込むと、桁の制限が効いたまま計算もできない
    // 宙ぶらりんの状態になる。式を丸ごと差し替える経路では必ずモードを解除する。
    setBaseInputMode(null);
    setExpression(entry.expression);
    placeCaret(entry.expression.length);
    setTargetUnit(entry.targetUnit);
    setFixSelection(null);
    setError("");
    setNotice(copy.historyRestored);
  };

  const toggleInlineUnitSearch = () => {
    setShowInlineUnitSearch((current) => {
      const next = !current;
      if (next) setTimeout(() => inlineUnitSearchRef.current?.focus(), 50);
      else setInlineUnitQuery("");
      return next;
    });
  };

  // pendingSelection は挿入直後の1回だけ TextInput のカーソル位置を強制するためのもの。
  // 反映済みの次のレンダーで解除し、以降はユーザー自身の操作でカーソルを自由に動かせるようにする。
  useEffect(() => {
    if (!pendingSelection) return;
    const timer = setTimeout(() => setPendingSelection(null), 0);
    return () => clearTimeout(timer);
  }, [pendingSelection]);

  // 履歴はAsyncStorageから非同期に読み込まれるため、マウント直後は必ず空配列。isHistoryLoading
  // が false になった最初のタイミングで一度だけ、最後に計算した式(history[0])を反映する。
  // その間にユーザーが何か入力していたら（クイックアクション・プリセット復元含む）、
  // expression が initialExpressionRef.current（マウント時の""）から変わっているはずなので
  // resolveStartupExpression が null を返し、割り込んで上書きすることはない。
  useEffect(() => {
    if (isHistoryLoading) return;
    if (appliedStartupHistoryRef.current) return;
    appliedStartupHistoryRef.current = true;
    const restored = resolveStartupExpression({
      currentExpression: expression,
      initialExpression: initialExpressionRef.current,
      hasUserInteracted: hasUserInteractedRef.current,
      latestHistoryEntry: history[0],
    });
    if (!restored) return;
    setBaseInputMode(null);
    setExpression(restored.expression);
    placeCaret(restored.expression.length);
    setTargetUnit(restored.targetUnit);
    setFixSelection(null);
    setError("");
  }, [isHistoryLoading, history, expression]);

  useEffect(() => {
    const action = Array.isArray(quick) ? quick[0] : quick;
    const shortcut = getCalculatorQuickShortcut(action);
    if (!shortcut) return;
    if (appliedQuickRef.current === action) return;
    appliedQuickRef.current = action ?? null;
    if (shortcut.expression && shortcut.targetUnit) {
      setBaseInputMode(null);
      setExpression(shortcut.expression);
      placeCaret(shortcut.expression.length);
      setTargetUnit(shortcut.targetUnit);
      setFixSelection(null);
      setError("");
      setNotice(action === "speed" ? copy.speedExampleReady : copy.pressureExampleReady);
    }
    if (shortcut.sampleCategory) {
      setSampleCategory(shortcut.sampleCategory);
      setNotice(copy.chooseSampleToStart);
    }
    if (shortcut.focusSearch) {
      setShowInlineUnitSearch(true);
      setTimeout(() => inlineUnitSearchRef.current?.focus(), 250);
    }
  }, [copy, language, quick]);

  useEffect(() => {
    const nextExpression = Array.isArray(presetExpression) ? presetExpression[0] : presetExpression;
    const nextUnit = Array.isArray(presetUnit) ? presetUnit[0] : presetUnit;
    if (!nextExpression) return;
    // 式と表示単位をまとめて1つのトークンにして比較する（式が同じで単位だけ違う遷移も拾う）。
    const presetToken = `${nextExpression}\u0000${nextUnit ?? ""}`;
    if (appliedPresetRef.current === presetToken) return;
    appliedPresetRef.current = presetToken;
    setBaseInputMode(null);
    setExpression(nextExpression);
    placeCaret(nextExpression.length);
    setTargetUnit(nextUnit ?? "");
    setFixSelection(null);
    setError("");
    setNotice(copy.savedItemLoaded);
  }, [copy, language, presetExpression, presetUnit]);

  const applySample = (sample: SampleCalculation) => {
    markUserInteraction();
    // restoreHistoryと同じ理由で、通常の式を読み込む前に進数入力モードを解除する。
    setBaseInputMode(null);
    const sampleTargetUnit = targetUnitForSample(sample);
    setExpression(sample.expression);
    placeCaret(sample.expression.length);
    setTargetUnit(sampleTargetUnit);
    setFixSelection(null);
    setError("");
    setNotice("");
    void calculate(sample.expression, sampleTargetUnit);
  };

  // 空状態のクイックスタート。サンプル（applySample）と違って表示単位を決めず、= も押さない。
  // リアルタイム計算がそのまま結果を出し、表示単位の自動選択が 5.1 cm / 2.55 mA / 90 km を選ぶ。
  const applyQuickStart = (nextExpression: string) => {
    markUserInteraction();
    setBaseInputMode(null);
    setExpression(nextExpression);
    placeCaret(nextExpression.length);
    setFixSelection(null);
    setError("");
    setNotice("");
  };

  // サンプルを「選んだ」瞬間に確認する。閲覧（シートを開いて眺める）は自由にできるべきなので、
  // 確認するのはタップされた時点だけにする。入力が空なら壊すものが無いので即適用でよい。
  const selectSample = (sample: SampleCalculation) => {
    if (!expression.trim()) {
      applySample(sample);
      setShowSamples(false);
      return;
    }
    // モーダルの中にConfirmDialogを重ねず、シートを閉じてから確認ダイアログを出す。
    setShowSamples(false);
    setPendingSample(sample);
  };

  const exportHistory = async () => {
    if (!isPro) {
      router.push("/pro");
      return;
    }
    try {
      await exportCalculationHistory(history, language);
      setNotice(copy.historyExported);
    } catch (cause) {
      // エンジンのエラー(UnitError)は現在の言語で表示する。UnitError以外は従来どおり
      // Error.message をそのまま出す（バックアップ処理など別系統のエラーもここを通るため）。
      setError(cause instanceof Error ? (unitErrorMessage(cause, language) ?? cause.message) : copy.csvExportFailed);
    }
  };

  const copyCalculation = async () => {
    if (!display) return;
    try {
      await Clipboard.setStringAsync(`${expression} = ${shownValueText}\n${copy.siBase}: ${display.si}`);
      setNotice(copy.copied);
    } catch {
      setError(copy.couldNotCopyCalculation);
    }
  };

  const suggestionLabel = (suggestion: UnitSuggestion) => (suggestion.unit.name ? localizedText(suggestion.unit.name, language) : undefined) ?? unitGroupLabel(suggestion.group.id);

  const renderUnitChip = (suggestion: UnitSuggestion, onPress: () => void, active = false) => (
    <Pressable
      accessibilityLabel={`${suggestion.unit.symbol} ${suggestionLabel(suggestion)}`}
      key={`${suggestion.group.id}-${suggestion.unit.symbol}`}
      onPress={onPress}
      style={({ pressed }) => [styles.unitChip, active && styles.unitChipActive, pressed && styles.pressed]}
    >
      <Text style={[styles.unitChipSymbol, active && styles.unitChipSymbolActive]}>{suggestion.unit.symbol}</Text>
      <Text numberOfLines={1} style={[styles.unitChipName, active && styles.unitChipNameActive]}>{suggestionLabel(suggestion)}</Text>
    </Pressable>
  );

  // 結果カードの基数チップ列（表示専用）。押しても入力欄は変わらず、大きい数値の読み方だけが変わる。
  // ハイライトは常に「いま表示している基数」を指す。入力中の基数は別のバーが持つので、
  // ここに baseInputMode を混ぜないこと（10進の値を出しながらHEXが光る、という食い違いになる）。
  const baseChipsRow = showBaseChips ? (
    <View style={styles.baseChipRow}>
      {NUMBER_BASES.map((base) => (
        <Pressable
          accessibilityLabel={BASE_META[base].label}
          key={base}
          onPress={() => { markUserInteraction(); setValueForm("decimal"); setActiveBase(base); }}
          style={({ pressed }) => [styles.baseChip, activeBase === base && styles.baseChipActive, pressed && styles.pressed]}
        >
          <Text style={[styles.baseChipText, activeBase === base && styles.baseChipTextActive]}>{BASE_META[base].label}</Text>
        </Pressable>
      ))}
    </View>
  ) : null;

  // **表示モードと基数は排他。** 無次元の安全整数で桁が大きい値（例 `2000*3`）は
  // 基数チップと科学表記チップの両方が出るので、片方を選んだらもう片方を既定へ戻す。
  // 戻さないと、HEXを選んだあと科学表記に切り替えたときに**HEXが光ったまま科学表記の値が出て**、
  // その状態で別の基数を押しても画面が変わらない（進数チップと入力バーを分けたときと同じ食い違い）。
  // 小数 ⇔ 厳密値 ⇔ 科学表記の切り替え列。出せる形が2つ以上あるときだけ出す（常に出すと、
  // 押しても何も変わらないボタンが並ぶことになる）。進数チップと同じ位置に置くが、色は
  // 単位まわりと同じprimary系にして「値そのものの読み替え」と「桁の読み替え」を見分けられる
  // ようにしている。
  const valueFormLabel = (form: ValueForm) => (form === "decimal" ? copy.decimalForm : form === "exact" ? copy.exactForm : copy.scientificForm);
  const valueFormRow = availableValueForms.length > 1 ? (
    <View style={styles.baseChipRow}>
      {availableValueForms.map((form) => (
        <Pressable
          accessibilityLabel={valueFormLabel(form)}
          key={form}
          onPress={() => { markUserInteraction(); setActiveBase(10); setValueForm(form); }}
          style={({ pressed }) => [styles.valueFormChip, valueForm === form && styles.valueFormChipActive, pressed && styles.pressed]}
        >
          <Text style={[styles.valueFormChipText, valueForm === form && styles.valueFormChipTextActive]}>
            {form === "scientific" ? SCIENTIFIC_FORM_LABEL : valueFormLabel(form)}
          </Text>
        </Pressable>
      ))}
    </View>
  ) : null;

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <View style={styles.screen}>
        {/* 画面名の見出し(h1)はタブバー(app/(tabs)/_layout.tsx)のラベルと重複するため出さない。
            タイトルが無くなった分、ヘルプボタンは右寄せのまま浮かせる。 */}
        <View style={styles.header}>
          <View style={styles.headerActions}>
            <Pressable accessibilityLabel={copy.helpTitle} onPress={() => setShowHelp(true)} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
              <IconSymbol name="questionmark.circle.fill" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <TextInput
              value={expression}
              onChangeText={(text) => {
                markUserInteraction();
                // 進数入力モード中は入力欄への直接入力・貼り付けも桁だけに絞る。キーパッドと
                // 数学シートを塞いでも、ここが素通りだと確定できない桁が混ざる。
                setExpression(baseInputMode === null ? text : sanitizeBaseInput(text, baseInputMode));
                setFixSelection(null);
                setError("");
                setNotice("");
              }}
              onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
              // 挿入直後だけキャレットを強制する。それ以外は selection を渡さず、
              // ユーザー自身のカーソル操作（タップ・ドラッグ選択）と競合しないようにする。
              selection={pendingSelection ?? undefined}
              onSubmitEditing={() => submitCalculation()}
              placeholder={copy.expressionPlaceholder}
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              accessibilityLabel={t("expression")}
              style={styles.expressionInput}
            />
            <Pressable accessibilityLabel={t("result")} onPress={() => submitCalculation()} style={({ pressed }) => [styles.calculateButton, pressed && styles.pressed]}>
              <Text style={styles.calculateText}>{copy.calculate}</Text>
            </Pressable>
          </View>

          {baseInputMode !== null ? (
            // 進数入力モード中は、16進の桁が単位・識別子として解析されて赤くなってしまうため、
            // 既存のanalyzeExpressionによるハイライトは使わず「接頭辞＋生の桁」を単純に描く。
            <View style={styles.previewRow}>
              <Text style={styles.previewIdentifier}>{BASE_META[baseInputMode].prefix}</Text>
              {/* 進数入力中もキャレット移動は使えるので、ここでもカーソル位置を示す。
                  桁は解析せず単純な文字列なので、セグメントを切らずに前後で分けるだけでよい。
                  範囲選択中は通常のプレビューと同じく帯で示す（何が置き換わるかが要点）。 */}
              <Text style={styles.previewNumber}>{expression.slice(0, baseSelection.start)}</Text>
              {baseSelection.hasRange ? (
                <Text style={[styles.previewNumber, styles.previewSelected]}>
                  {expression.slice(baseSelection.start, baseSelection.end)}
                </Text>
              ) : (
                <PreviewCaret colors={colors} />
              )}
              <Text style={styles.previewNumber}>{expression.slice(baseSelection.end)}</Text>
            </View>
          ) : expression.trim() ? (
            <View style={styles.previewRow}>
              {caretPreview.pieces.map((piece, index) => {
                const { segment } = piece;
                const isUnresolved = segment.kind === "unknown-unit" || segment.kind === "unknown-identifier";
                const style = segment.kind === "unit" ? styles.previewUnit
                  : isUnresolved ? styles.previewUnknown
                  : segment.kind === "identifier" ? styles.previewIdentifier
                  : segment.kind === "number" ? styles.previewNumber
                  : styles.previewOperator;
                // キャレットは「その一片の手前」に入る。文字の間に挟み込む形にすることで、
                // 等幅フォントの文字幅を自前で計算しなくても位置が必ず合う。
                const caret = caretPreview.caretIndex === index ? <PreviewCaret key="caret" colors={colors} /> : null;
                const selectedStyle = piece.selected ? styles.previewSelected : null;
                if (!isUnresolved) {
                  return (
                    <Fragment key={`${piece.start}-${index}`}>
                      {caret}
                      <Text style={[style, selectedStyle]}>{piece.text}</Text>
                    </Fragment>
                  );
                }
                // 単位の書き間違いだけをタップで修正できるようにする。定数・関数の未定義参照は
                // 単位の候補を出しても意味がないため、見た目だけ知らせてタップ操作は付けない。
                // 警告アイコンは分割後の最後の一片だけに出す（キャレットが単位の途中に来たときに
                // アイコンが2つ並ばないようにする）。
                const icon = piece.isSegmentEnd
                  ? <IconSymbol name="exclamationmark.triangle.fill" size={11} color={colors.error} />
                  : null;
                if (segment.kind !== "unknown-unit") {
                  return (
                    <Fragment key={`${piece.start}-${index}`}>
                      {caret}
                      <View style={styles.previewUnknownWrap}>
                        <Text style={[style, selectedStyle]}>{piece.text}</Text>
                        {icon}
                      </View>
                    </Fragment>
                  );
                }
                return (
                  <Fragment key={`${piece.start}-${index}`}>
                    {caret}
                    <Pressable
                      accessibilityLabel={`${segment.text} ${copy.unknown}`}
                      // タップで開く修正範囲は分割前のセグメント全体。一片の範囲にすると
                      // 単位の半分だけを差し替えることになる。
                      onPress={() => setFixSelection({ start: segment.start, end: segment.end, text: segment.text })}
                      style={({ pressed }) => [styles.previewUnknownWrap, pressed && styles.pressed]}
                    >
                      <Text style={[style, selectedStyle]}>{piece.text}</Text>
                      {icon}
                    </Pressable>
                  </Fragment>
                );
              })}
              {/* 末尾（どの一片も始まらない位置）のキャレット。 */}
              {caretPreview.caretIndex === caretPreview.pieces.length ? <PreviewCaret colors={colors} /> : null}
            </View>
          ) : null}

          {baseInputMode !== null ? (
            // 入力中の基数を切り替えるバー。入力欄の真下に置き、結果カードの表示用チップとは
            // 役割ごと分けている（同じ見た目で「入力が変わる」「表示が変わる」の2通りの意味を
            // 持たせていたのが混乱の原因だった）。押しても値は消えず表記だけ変わる。
            <View style={styles.baseInputBar}>
              {NUMBER_BASES.map((base) => (
                <Pressable
                  accessibilityLabel={BASE_META[base].label}
                  key={base}
                  onPress={() => { markUserInteraction(); pressBaseInputChip(base); }}
                  style={({ pressed }) => [styles.baseChip, baseInputMode === base && styles.baseChipActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.baseChipText, baseInputMode === base && styles.baseChipTextActive]}>{BASE_META[base].label}</Text>
                </Pressable>
              ))}
              <View style={styles.hintSpacer} />
              {/* 進数入力を抜ける唯一の明示的な出口。= キーと同じく10進の数値へ直してから戻る。 */}
              <Pressable accessibilityLabel={copy.hintComplete} onPress={toggleBaseInput} style={({ pressed }) => [styles.baseDoneButton, pressed && styles.pressed]}>
                <Text style={styles.baseDoneText}>{copy.hintComplete}</Text>
              </Pressable>
            </View>
          ) : null}

          {/* 進数入力中は単位の候補レールごと出さない。FFのような生の桁を式として解析するので、
              「使えない単位」の赤い警告や見当違いの単位候補が並んでしまうため。 */}
          {baseInputMode === null ? (
          <View style={styles.hintRow}>
            <Text numberOfLines={1} style={[styles.hintLabel, hint.kind === "fix" && styles.hintLabelAlert]}>{hintLabel}</Text>
            {hint.candidates.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hintRail} keyboardShouldPersistTaps="handled">
                {hint.candidates.map((suggestion) => renderUnitChip(suggestion, () => applyUnitCandidate(suggestion.unit.symbol)))}
              </ScrollView>
            ) : (
              <Text style={styles.hintEmpty}>{copy.noCandidates}</Text>
            )}
            <Pressable accessibilityLabel={copy.insertUnit} onPress={toggleInlineUnitSearch} style={({ pressed }) => [styles.hintSearchButton, showInlineUnitSearch && styles.hintSearchButtonActive, pressed && styles.pressed]}>
              <IconSymbol name={showInlineUnitSearch ? "chevron.up" : "magnifyingglass"} size={16} color={showInlineUnitSearch ? colors.onPrimary : colors.primary} />
            </Pressable>
            {/* 進数入力の入口。横スクロールするレールの隣に置くので、使わない人には縦幅を増やさない。
                式が空か10進の整数のときだけ押せる（途中式からは基数を読み替えようが無いため）。
                単位まわりのボタン（primary色の角丸四角）と同じ見た目にすると「単位検索の仲間」に
                見えてしまうため、進数チップ（DEC/BIN/OCT/HEX）と同じwarning系の丸ピルにして、
                レールの一番右＝単位の導線の外側に置いている。 */}
            <Pressable
              accessibilityLabel={copy.baseInput}
              disabled={!canStartBaseInput}
              onPress={toggleBaseInput}
              style={({ pressed }) => [styles.baseEntryButton, !canStartBaseInput && styles.keyDisabled, pressed && styles.pressed]}
            >
              <Text style={styles.baseEntryText}>0x</Text>
            </Pressable>
          </View>
          ) : null}

          {showInlineUnitSearch && baseInputMode === null ? (
            <View style={styles.inlineUnitPanel}>
              <View style={styles.unitSearchWrap}>
                <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
                <TextInput
                  ref={inlineUnitSearchRef}
                  value={inlineUnitQuery}
                  onChangeText={setInlineUnitQuery}
                  placeholder={copy.unitSearch}
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.unitSearchInput}
                />
                {inlineUnitQuery.trim() ? (
                  <Pressable accessibilityLabel={copy.clear} onPress={() => setInlineUnitQuery("")} style={({ pressed }) => [styles.inlinePanelClear, pressed && styles.pressed]}>
                    <IconSymbol name="xmark.circle.fill" size={15} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>

              {inlineUnitQuery.trim() ? (
                <View style={styles.inlinePanelStatusRow}>
                  <Text style={styles.inlinePanelStatus}>
                    {inlineUnitRegistration.status === "registered"
                      ? `${copy.registered}${inlineUnitRegistration.matchedAlias ? ` · ${copy.aliasNote} ${inlineUnitRegistration.canonical}` : ""}`
                      : inlineUnitRegistration.status === "supported" ? copy.supported : copy.unknownHint}
                  </Text>
                  {inlineUnitRegistration.status === "supported" ? (
                    <Pressable onPress={() => pickInlineUnit(inlineUnitQuery.trim())} style={({ pressed }) => [styles.inlinePanelUseButton, pressed && styles.pressed]}>
                      <Text style={styles.inlinePanelUseButtonText}>{copy.use} “{inlineUnitQuery.trim()}”</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRailCompact} keyboardShouldPersistTaps="handled">
                  {visibleInputGroups.map((group) => (
                    <Pressable key={group.id} onPress={() => setInputGroupId(group.id)} style={({ pressed }) => [styles.categoryChipSmall, inputGroupId === group.id && styles.categoryChipActive, pressed && styles.pressed]}>
                      <Text style={[styles.categoryChipText, inputGroupId === group.id && styles.categoryChipTextActive]}>{unitGroupLabel(group.id)}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <ScrollView showsVerticalScrollIndicator={false} style={styles.inlineUnitResults} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
                {inlineUnitSuggestions.map((suggestion) => renderUnitChip(suggestion, () => pickInlineUnit(suggestion.unit.symbol)))}
              </ScrollView>

              <Pressable onPress={() => { openUnitPicker("insert"); setShowInlineUnitSearch(false); setInlineUnitQuery(""); }} style={({ pressed }) => [styles.inlinePanelMore, pressed && styles.pressed]}>
                <Text style={styles.inlinePanelMoreText}>{copy.browseUnits}</Text>
                <IconSymbol name="chevron.right" size={11} color={colors.primary} />
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.middle}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.middleContent} keyboardShouldPersistTaps="handled">
            {error ? (
              <Animated.View style={[styles.messageError, errorAnimatedStyle]}>
                <Text style={styles.messageErrorText}>{error}</Text>
                {analysis.unresolved.length ? <Text style={styles.messageHint}>{copy.fixTap}</Text> : null}
              </Animated.View>
            ) : null}

            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.cardLabel}>{t("result")}</Text>
                {baseInputMode === null && display ? (
                  <View style={styles.resultActions}>
                    <Pressable accessibilityLabel={copy.saveTemplate} onPress={() => router.push({ pathname: "/constants", params: { notebookExpression: expression, notebookUnit: targetUnit } })} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                      <IconSymbol name="bookmark.fill" size={14} color={colors.primary} />
                    </Pressable>
                    <Pressable accessibilityLabel={copy.copy} onPress={() => void copyCalculation()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                      <IconSymbol name="doc.on.doc" size={14} color={colors.primary} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
              {baseInputParse && baseInputParse.status === "ok" ? (
                // 進数入力モード中は通常の量（display）を経由しない。生の桁が偶然そのまま10進数として
                // 解釈できてしまうケース（例: 2進の"1010"は10進としても妥当）があり、そちらを見せると
                // 「今どの基数を打っているか」と画面表示が食い違うため、常にparseBaseInputの結果だけを見せる。
                <>
                  {/* 出すのは常に10進へ直した値。入力中の基数は入力欄の下のバーが示すので、
                      ここに基数チップは出さない（10進の値を出しながらHEXが光る食い違いを避ける）。 */}
                  <Animated.Text numberOfLines={2} adjustsFontSizeToFit style={[styles.resultValue, resultAnimatedStyle]}>
                    {baseInputParse.value}
                  </Animated.Text>
                </>
              ) : baseInputMode === null && display ? (
                <>
                  {valueForm === "exact" && exactValue ? (
                    // 厳密な形はKaTeXで描く。分数の横棒と根号は文字の並びでは表現できず、
                    // 「√3/2」のような一列表記だと √(3/2) と読み違えられるため。
                    // 単位は数式の外にTextで並べる（単位記号には ² や ° が混ざり、LaTeXの
                    // text命令に入れると環境によって描けない文字が出るため）。
                    <View style={styles.exactValueRow}>
                      {/* \displaystyle を付けないと分数が本文サイズ（text style）で小さく組まれ、
                          隣の小数表示より明らかに小さく見える。displayMode自体は中央寄せ・上下の
                          余白が付いて結果カードの詰まった配置に合わないので false のままにする。 */}
                      <LatexView latex={resultLatex(exactValue.latex)} color={colors.primaryStrong} fontSize={exactFontSize} displayMode={false} fitContent />
                      {display.unitLabel ? <Text style={[styles.exactValueUnit, { fontSize: isStackedExactValue ? 26 : 32 }]}>{display.unitLabel}</Text> : null}
                    </View>
                  ) : valueForm === "scientific" && scientificValue ? (
                    // 科学表記も厳密値と同じくKaTeXで描く（10ⁿ の指数を上付きで組み、丸めた
                    // ときは先頭に ≈ が付く。どちらも文字の並びでは表現しきれない）。
                    <>
                      <View style={styles.exactValueRow}>
                        <LatexView latex={resultLatex(scientificValue.latex)} color={colors.primaryStrong} fontSize={32} displayMode={false} fitContent />
                        {display.unitLabel ? <Text style={styles.exactValueUnit}>{display.unitLabel}</Text> : null}
                      </View>
                      {scientificValue.roundedFrom ? (
                        // 丸めたことが分かるように、丸める前の値を小さく併記する。桁数も添えて
                        // 「なぜその桁で丸まったか」（式の中でいちばん桁の少ないリテラル）まで読めるようにする。
                        <Text style={styles.roundedFromText}>
                          {scientificValue.roundedFrom}
                          {display.unitLabel ? ` ${display.unitLabel}` : ""}
                          {scientificValue.significantDigits !== null ? ` · ${copy.significantDigits(scientificValue.significantDigits)}` : ""}
                        </Text>
                      ) : null}
                    </>
                  ) : (
                    <Animated.Text numberOfLines={2} adjustsFontSizeToFit style={[styles.resultValue, resultAnimatedStyle]}>
                      {activeBase !== 10 && resultBaseParts ? (
                        <>
                          {resultBaseParts.sign}
                          <Text style={{ color: colors.warning }}>{resultBaseParts.prefix}</Text>
                          {resultBaseParts.digits}
                        </>
                      ) : (
                        display.value
                      )}
                    </Animated.Text>
                  )}
                  {/* 表示単位の次元が合わずSI表記へフォールバックしているときは、選択中の単位チップ
                      （例 cm）を光らせたままにすると、値がm/sなのにcmが選ばれているように見えて
                      食い違う。フォールバック中はSIチップの方を点灯させる。 */}
                  <View style={styles.conversionRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.conversionRail} keyboardShouldPersistTaps="handled">
                      <Pressable accessibilityLabel={copy.noUnit} onPress={() => { markUserInteraction(); applyTargetUnit(""); }} style={({ pressed }) => [styles.convertChip, siChipActive && styles.convertChipActive, pressed && styles.pressed]}>
                        <Text style={[styles.convertChipText, siChipActive && styles.convertChipTextActive]}>SI</Text>
                      </Pressable>
                      {conversionUnits.map((symbol) => (
                        <Pressable accessibilityLabel={symbol} key={symbol} onPress={() => { markUserInteraction(); applyTargetUnit(symbol); }} style={({ pressed }) => [styles.convertChip, displayUnit === symbol && !display.isFallback && styles.convertChipActive, pressed && styles.pressed]}>
                          <Text style={[styles.convertChipText, displayUnit === symbol && !display.isFallback && styles.convertChipTextActive]}>{symbol}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    <Pressable accessibilityLabel={copy.outputUnit} onPress={() => openUnitPicker("target")} style={({ pressed }) => [styles.convertMore, pressed && styles.pressed]}>
                      <Text style={styles.convertMoreText}>{copy.more}</Text>
                      <IconSymbol name="chevron.right" size={11} color={colors.primary} />
                    </Pressable>
                  </View>
                  {baseChipsRow}
                  {valueFormRow}
                  {comparisonRows.length > 1 ? (
                    <View style={styles.comparisonSection}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={copy.compareUnits}
                        accessibilityState={{ expanded: showComparison }}
                        onPress={() => setShowComparison((prev) => !prev)}
                        style={({ pressed }) => [styles.comparisonToggle, pressed && styles.pressed]}
                      >
                        <Text style={styles.comparisonToggleText}>{copy.compareUnits}</Text>
                        <IconSymbol name={showComparison ? "chevron.up" : "chevron.right"} size={11} color={colors.primary} />
                      </Pressable>
                      {showComparison ? (
                        <>
                          <Text style={styles.comparisonHint}>{copy.compareUnitsHint}</Text>
                          <View style={styles.comparisonTable}>
                            {comparisonRows.map((row) => (
                              <Pressable
                                key={row.symbol}
                                accessibilityLabel={`${row.label} ${row.value}`}
                                onPress={() => { markUserInteraction(); applyTargetUnit(row.symbol); }}
                                style={({ pressed }) => [styles.comparisonRow, row.isActive && styles.comparisonRowActive, pressed && styles.pressed]}
                              >
                                <Text style={[styles.comparisonRowLabel, row.isActive && styles.comparisonRowLabelActive]}>{row.label}</Text>
                                <Text numberOfLines={1} style={[styles.comparisonRowValue, row.isActive && styles.comparisonRowValueActive]}>{row.value}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </>
                      ) : null}
                    </View>
                  ) : null}
                  <View style={styles.siRow}>
                    <Text style={styles.siLabel}>{copy.siBase}</Text>
                    <Text numberOfLines={1} selectable style={styles.siValue}>{display.si}</Text>
                  </View>
                  {displayUnit && targetUnitRegistration.status !== "registered" ? (
                    <Text style={styles.registrationNote}>{targetUnitRegistration.status === "supported" ? `${displayUnit} · ${copy.supported}` : `${displayUnit} · ${copy.unknown}`}</Text>
                  ) : null}
                  {display.error ? <Text style={styles.errorText}>{display.error}</Text> : null}
                </>
              ) : baseInputMode === null && visibleDiagnosis ? (
                // 式の意味の誤り（次元不一致・使えない単位・ゼロ除算…）はここでリアルタイムに説明する。
                // 結果カードの中に出すので、= を押したときのエラー帯のようにレイアウトが跳ねない。
                <View style={styles.diagnosisWrap}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={15} color={colors.error} />
                  <View style={styles.diagnosisBody}>
                    <Text style={styles.diagnosisText}>{visibleDiagnosis}</Text>
                    {analysis.unresolved.some((segment) => segment.kind === "unknown-unit") ? <Text style={styles.diagnosisHint}>{copy.fixTap}</Text> : null}
                  </View>
                </View>
              ) : baseInputMode === null && expression.trim() ? (
                // 書きかけ（末尾が演算子・閉じ括弧待ち）。間違いではないので案内だけ出す。
                <Text style={styles.emptyResult}>{copy.incompleteHint}</Text>
              ) : (
                // 通常の空状態と「進数入力モードだが変換できる桁がまだ無い（空・不正な桁）」の
                // どちらもここに来る。入力モード中はエラーを出さない方針なので文言は変えない。
                <>
                  <Text style={styles.emptyResult}>{copy.emptyResult}</Text>
                  {baseInputMode === null && !expression.trim() ? (
                    // 空状態の「まず1つ試す」。式が空なので確認ダイアログ無しで即適用する。
                    <View style={styles.quickStartList}>
                      <Text style={styles.quickStartLabel}>{copy.quickStartTitle}</Text>
                      {QUICK_START.map((item) => (
                        <Pressable
                          accessibilityLabel={item.expression}
                          key={item.id}
                          onPress={() => applyQuickStart(item.expression)}
                          style={({ pressed }) => [styles.quickStartRow, pressed && styles.cardPressed]}
                        >
                          <Text style={styles.quickStartExpression}>{item.expression}</Text>
                          <Text numberOfLines={2} style={styles.quickStartHint}>
                            {item.id === "ohms_law" ? copy.quickStartOhmsLaw : item.id === "current" ? copy.quickStartCurrent : copy.quickStartDistance}
                          </Text>
                          <IconSymbol name="chevron.right" size={11} color={colors.primary} />
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                  <Pressable accessibilityLabel={copy.outputUnit} onPress={() => openUnitPicker("target")} style={({ pressed }) => [styles.presetOutputUnit, pressed && styles.pressed]}>
                    <Text style={styles.presetOutputUnitLabel}>{copy.outputUnit}</Text>
                    <View style={styles.presetOutputUnitValueWrap}>
                      <Text style={styles.presetOutputUnitValue}>{targetUnit.trim() || "SI"}</Text>
                      <IconSymbol name="chevron.right" size={11} color={colors.primary} />
                    </View>
                  </Pressable>
                </>
              )}
            </View>

            {notice ? <View style={styles.messageSuccess}><Text style={styles.messageSuccessText}>{notice}</Text></View> : null}

            {history.length ? (
              // 一覧を埋め込むと件数分スクロール量が増え、結果カードが画面外へ押し出されるため、
              // ここでは常に1行の入口だけを置き、閲覧・復元はダイアログ（showHistory）に任せる。
              <Pressable accessibilityLabel={copy.savedHistory} onPress={() => setShowHistory(true)} style={({ pressed }) => [styles.historyBar, pressed && styles.cardPressed]}>
                <View style={styles.historyBarLabel}>
                  <IconSymbol name="clock.arrow.circlepath" size={13} color={colors.muted} />
                  <Text style={styles.cardLabel}>{copy.history}</Text>
                </View>
                <Text numberOfLines={1} style={styles.historyBarLatest}>
                  {history[0].expression} = {history[0].resultText}
                </Text>
                <Text style={styles.historyBarCount}>{history.length} ›</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>

        {/* サンプルは式を丸ごと置き換える破壊的な操作なので、キーパッドの延長ではなく
            「ここから始める」導線として控えめに独立させる（数学とはデザインを分ける）。 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.startRail} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => setShowSamples(true)} style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}>
            <IconSymbol name="book.fill" size={13} color={colors.primary} />
            <Text style={styles.toolButtonText}>{copy.samples}</Text>
          </Pressable>
        </ScrollView>

        <CalculatorBannerAd />

        {/* 入力欄をタップせずに式を組み立てられるようにする行。キャレット移動は進数入力モード中も
            使えるが、べき乗まわりは桁以外を受け付けないモードなので無効にする（pressKey 側でも弾く）。
            数学ボタンもこの行に入れてある（単独の行にすると 360×640 の端末でキーパッド下段の
            「. 0 ⌫ =」が画面外へ押し出される。行を増やせるのは1行ぶんだけ）。 */}
        <View style={styles.editKeyRow}>
          <Pressable accessibilityLabel={copy.caretLeft} disabled={caretAtStart} onPress={() => moveCaret(-1)} style={({ pressed }) => [styles.editKey, caretAtStart && styles.keyDisabled, pressed && styles.pressed]}>
            <IconSymbol name="chevron.left" size={16} color={colors.primary} />
          </Pressable>
          <Pressable accessibilityLabel={copy.caretRight} disabled={caretAtEnd} onPress={() => moveCaret(1)} style={({ pressed }) => [styles.editKey, caretAtEnd && styles.keyDisabled, pressed && styles.pressed]}>
            <IconSymbol name="chevron.right" size={16} color={colors.primary} />
          </Pressable>
          {EDIT_KEYS.map((editKey) => (
            <Pressable
              accessibilityLabel={editKey.insert}
              disabled={baseInputMode !== null}
              key={editKey.label}
              onPress={() => pressKey(editKey.insert)}
              style={({ pressed }) => [styles.editKey, baseInputMode !== null && styles.keyDisabled, pressed && styles.pressed]}
            >
              <Text style={styles.editKeyText}>{editKey.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* 接頭語は単位の一部なので、演算子まわりの編集キーとは行を分ける（同じ行に混ぜると
            どれが式の記号でどれが単位の文字か見分けられない）。 */}
        <View style={styles.editKeyRow}>
          {PREFIX_KEYS.map((prefix) => (
            <Pressable
              accessibilityLabel={prefix}
              disabled={baseInputMode !== null}
              key={prefix}
              onPress={() => pressKey(prefix)}
              style={({ pressed }) => [styles.prefixKey, baseInputMode !== null && styles.keyDisabled, pressed && styles.pressed]}
            >
              <Text style={styles.prefixKeyText}>{prefix}</Text>
            </Pressable>
          ))}
          {/* 数学はキャレット位置への挿入だけで書きかけの式を壊さないので、編集キーと同じ行に置く。 */}
          {isAdvancedMode ? (
            <Pressable
              disabled={baseInputMode !== null}
              onPress={() => setShowAdvancedKeys(true)}
              style={({ pressed }) => [styles.editKey, styles.mathKey, baseInputMode !== null && styles.keyDisabled, pressed && styles.pressed]}
            >
              {/* 訳語が長い言語（独 Mathematik・西 Matemáticas・葡 Matemática）ではキーの
                  内容幅が flex の割り当てを超え、接頭語の G キーに重なって画面外へはみ出す。
                  1行に固定して縮める（flexは幅の上限を決めるだけで、Textの内容幅は縮まない）。 */}
              <Text numberOfLines={1} style={styles.editKeyText}>{copy.math}</Text>
            </Pressable>
          ) : null}
        </View>

        {baseInputMode === 16 ? (
          // 16進の入力モード中だけ、キーパッド本体の配置は変えずに直上へA〜Fの行を足す。
          <View style={styles.hexKeyRow}>
            {HEX_LETTER_KEYS.map((letter) => (
              <Pressable accessibilityLabel={letter} key={letter} onPress={() => pressKey(letter)} style={({ pressed }) => [styles.hexKey, pressed && styles.pressed]}>
                <Text style={styles.hexKeyText}>{letter}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.keypad}>
          {KEYS.map((key, index) => {
            const isAction = key === "=";
            const isOperator = ["×", "÷", "+", "-"].includes(key);
            const isDigit = /^[0-9]$/.test(key);
            // 進数入力モード中は、演算子・小数点・括弧を全面的に無効化し（16進の桁のまま演算に
            // 入ると評価器が解釈できないため。まず=で10進へ確定させる）、数字キーはその基数で
            // 使えない桁だけを無効化する（例: 2進なら2〜9が押せない）。
            const isDisabledForBaseInput = baseInputMode !== null
              && (BASE_INPUT_DISABLED_KEYS.includes(key) || (isDigit && !isBaseDigitAllowed(key, baseInputMode)));
            return (
              <View key={`${key}-${index}`} style={styles.keyCell}>
                <Pressable
                  accessibilityLabel={key === "⌫" ? copy.deleteKey : key === "AC" ? copy.clearAllKey : key}
                  disabled={isDisabledForBaseInput}
                  onPress={() => pressKey(key)}
                  style={({ pressed }) => [styles.key, isAction && styles.keyAction, isOperator && styles.keyOperator, isDisabledForBaseInput && styles.keyDisabled, pressed && styles.keyPressed]}
                >
                  {key === "⌫" ? <IconSymbol name="delete.left" size={20} color={colors.muted} /> : <Text style={[styles.keyText, (isAction || isOperator) && styles.keyTextAccent, isAction && { color: colors.onPrimary }]}>{key}</Text>}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      <Modal visible={showSamples} transparent animationType="slide" onRequestClose={() => setShowSamples(false)}>
        <View style={styles.modalBackdrop}><View style={styles.compactSheet}><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{copy.samples}</Text><Pressable accessibilityLabel={copy.close} onPress={() => setShowSamples(false)} style={styles.closeHelp}><IconSymbol name="xmark" size={20} color={colors.muted} /></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>{visibleSampleCategories.map((category) => <Pressable key={category.id} onPress={() => setSampleCategory(category.id)} style={({ pressed }) => [styles.categoryChip, activeSampleCategory === category.id && styles.categoryChipActive, pressed && styles.pressed]}><Text style={[styles.categoryChipText, activeSampleCategory === category.id && styles.categoryChipTextActive]}>{localizedText(category.label, language)}</Text></Pressable>)}</ScrollView><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>{visibleSamples.map((sample) => <Pressable key={sample.id} onPress={() => selectSample(sample)} style={({ pressed }) => [styles.sampleRow, pressed && styles.cardPressed]}><View style={styles.sampleCopy}><Text style={styles.sampleTitle}>{localizedText(sample.title, language)}</Text><Text style={styles.sampleDescription}>{localizedText(sample.description, language)}</Text></View><View style={styles.sampleExpressionWrap}><Text numberOfLines={1} style={styles.sampleExpression}>{sample.expression}</Text><Text style={styles.sampleTarget}>→ {targetUnitForSample(sample)}</Text></View></Pressable>)}</ScrollView></View></View>
      </Modal>

      <Modal visible={showUnitPicker} transparent animationType="slide" onRequestClose={() => setShowUnitPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.compactSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderMain}>
                <Text style={styles.sheetTitle}>{unitPickerMode === "target" ? copy.outputUnit : copy.insertUnit}</Text>
                <Text style={styles.sheetSubtitle}>{copy.pickUnit}</Text>
              </View>
              <Pressable accessibilityLabel={copy.close} onPress={() => setShowUnitPicker(false)} style={styles.closeHelp}><IconSymbol name="xmark" size={20} color={colors.muted} /></Pressable>
            </View>
            <View style={styles.unitSearchWrap}>
              <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
              <TextInput ref={unitSearchRef} value={unitSearch} onChangeText={setUnitSearch} placeholder={copy.unitSearch} placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.unitSearchInput} />
            </View>
            {unitSearch.trim() ? (
              <View style={[styles.registrationCard, searchedUnitRegistration.status === "unknown" && styles.registrationCardUnknown, searchedUnitRegistration.status === "supported" && styles.registrationCardSupported]}>
                <Text style={styles.registrationCardTitle}>{searchedUnitRegistration.status === "registered" ? copy.registered : searchedUnitRegistration.status === "supported" ? copy.supported : copy.unknown}</Text>
                <Text style={styles.registrationCardHint}>
                  {searchedUnitRegistration.status === "registered"
                    ? `${unitSearch.trim()}${searchedUnitRegistration.matchedAlias ? ` ${copy.aliasNote} ${searchedUnitRegistration.canonical}` : ""} · ${unitGroupLabel(searchedUnitRegistration.group?.id ?? "")}`
                    : searchedUnitRegistration.status === "supported" ? unitSearch.trim() : copy.unknownHint}
                </Text>
                {searchedUnitRegistration.status !== "unknown" ? (
                  <Pressable onPress={() => chooseUnit(searchedUnitRegistration.canonical ?? unitSearch.trim())} style={({ pressed }) => [styles.useTypedUnitButton, pressed && styles.pressed]}>
                    <Text style={styles.useTypedUnitText}>{copy.use} “{searchedUnitRegistration.canonical ?? unitSearch.trim()}”</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {unitSearch.trim() ? null : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
                {visibleInputGroups.map((group) => (
                  <Pressable key={group.id} onPress={() => setInputGroupId(group.id)} style={({ pressed }) => [styles.categoryChip, inputGroupId === group.id && styles.categoryChipActive, pressed && styles.pressed]}>
                    <Text style={[styles.categoryChipText, inputGroupId === group.id && styles.categoryChipTextActive]}>{unitGroupLabel(group.id)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList} keyboardShouldPersistTaps="handled">
              {unitSearch.trim() ? (
                <>
                  <Text style={styles.pickerSectionLabel}>{copy.allCandidates}</Text>
                  {searchSuggestions.length ? (
                    <View style={styles.chips}>{searchSuggestions.map((suggestion) => renderUnitChip(suggestion, () => chooseUnit(suggestion.unit.symbol), displayUnit === suggestion.unit.symbol && unitPickerMode === "target"))}</View>
                  ) : (
                    <View style={styles.emptyState}>
                      <IconSymbol name="magnifyingglass" size={22} color={colors.muted} />
                      <Text style={styles.emptyStateTitle}>{copy.noSearchResults}</Text>
                      <Text style={styles.emptyStateText}>{copy.noSearchResultsHint}</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  {unitPickerMode === "target" && compatibleUnitGroups.length ? (
                    <>
                      <Text style={styles.pickerSectionLabel}>{copy.compatible}</Text>
                      {compatibleUnitGroups.map((group) => (
                        <View key={group.id} style={styles.pickerGroup}>
                          <Text style={styles.unitGroupLabel}>{unitGroupLabel(group.id)}</Text>
                          <View style={styles.chips}>{visibleGroupUnits(group).map((unitOption) => renderUnitChip({ group, unit: unitOption }, () => chooseUnit(unitOption.symbol), displayUnit === unitOption.symbol))}</View>
                        </View>
                      ))}
                    </>
                  ) : null}
                  <Text style={styles.pickerSectionLabel}>{unitGroupLabel(selectedInputGroup.id)}</Text>
                  <View style={styles.chips}>{selectedInputUnits.map((unitOption) => renderUnitChip({ group: selectedInputGroup, unit: unitOption }, () => chooseUnit(unitOption.symbol), unitPickerMode === "target" && displayUnit === unitOption.symbol))}</View>
                </>
              )}
              {/* 検索中でも、Pro のお気に入り単位は隠さず常に選べるようにする。 */}
              {isPro && favoriteUnits.length ? (
                <View style={styles.favoritePicker}>
                  <Text style={styles.pickerSectionLabel}>PRO</Text>
                  <View style={styles.chips}>{favoriteUnits.map((unit) => <Pressable key={unit} onPress={() => chooseUnit(unit)} style={({ pressed }) => [styles.unitChip, pressed && styles.pressed]}><Text style={styles.unitChipSymbol}>{unit}</Text></Pressable>)}</View>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAdvancedKeys} transparent animationType="fade" onRequestClose={() => setShowAdvancedKeys(false)}>
        <View style={styles.modalBackdrop}><View style={styles.compactSheet}><View style={styles.sheetHeader}><View style={styles.sheetHeaderMain}><Text style={styles.sheetTitle}>{copy.advancedMath}</Text><Text style={styles.sheetSubtitle}>{copy.advancedMathHint}</Text></View><Pressable accessibilityLabel={copy.close} onPress={() => setShowAdvancedKeys(false)} style={styles.closeHelp}><IconSymbol name="xmark" size={20} color={colors.muted} /></Pressable></View><View style={styles.advancedKeyRow}>{ADVANCED_KEYS.map((key) => <Pressable accessibilityLabel={key} key={key} onPress={() => { pressKey(key); setShowAdvancedKeys(false); }} style={({ pressed }) => [styles.advancedKey, pressed && styles.pressed]}><Text style={styles.advancedKeyText}>{key}</Text></Pressable>)}</View></View></View>
      </Modal>

      <Modal visible={showHistory} transparent animationType="slide" onRequestClose={() => setShowHistory(false)}>
        <View style={styles.modalBackdrop}><View style={styles.compactSheet}><View style={styles.sheetHeader}><View style={styles.sheetHeaderMain}><Text style={styles.sheetTitle}>{copy.savedHistory}</Text><Text style={styles.sheetSubtitle}>{copy.historyHint}</Text></View><Pressable accessibilityLabel={copy.close} onPress={() => setShowHistory(false)} style={styles.closeHelp}><IconSymbol name="xmark" size={20} color={colors.muted} /></Pressable></View><View style={styles.historyActions}><Pressable onPress={() => void exportHistory()} style={({ pressed }) => [styles.exportHistoryButton, pressed && styles.pressed]}><IconSymbol name="square.and.arrow.up" size={15} color={colors.primary} /><Text style={styles.exportHistoryText}>CSV</Text></Pressable><Pressable onPress={() => void clearHistory()} style={({ pressed }) => [styles.clearHistoryButton, pressed && styles.pressed]}><Text style={styles.clearHistoryText}>{copy.clear}</Text></Pressable></View>{visibleHistory.length ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>{visibleHistory.map((entry, index) => <Pressable key={entry.id} onPress={() => { restoreHistory(entry); setShowHistory(false); }} style={({ pressed }) => [styles.historyRow, pressed && styles.cardPressed]}><View style={styles.historyExpressionWrap}><Text style={styles.historyAutoSymbol}>a{index + 1}</Text><Text numberOfLines={1} style={styles.historyExpression}>{entry.expression}</Text></View><Text numberOfLines={1} style={styles.historyResult}>{entry.resultText}</Text></Pressable>)}</ScrollView> : <View style={styles.emptyState}><IconSymbol name="clock" size={22} color={colors.muted} /><Text style={styles.emptyStateTitle}>{copy.noHistory}</Text><Text style={styles.emptyStateText}>{copy.noHistoryHint}</Text></View>}</View></View>
      </Modal>

      <Modal visible={showHelp} transparent animationType="fade" onRequestClose={() => setShowHelp(false)}>
        <View style={styles.helpBackdrop}>
          <View style={styles.helpSheet}>
            <View style={styles.helpTitleRow}>
              <Text style={styles.helpTitle}>{copy.helpTitle}</Text>
              <Pressable accessibilityLabel={copy.close} onPress={() => setShowHelp(false)} style={({ pressed }) => [styles.closeHelp, pressed && styles.pressed]}>
                <IconSymbol name="xmark" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={styles.helpText}>• 5cm + 1mm</Text>
            <Text style={styles.helpText}>• 3cm × 20mm</Text>
            <Text style={styles.helpText}>• 90sec / 1hour / 2days</Text>
            <Text style={styles.helpText}>• {copy.definitionHint}</Text>
            <Text style={styles.helpText}>• W × H</Text>
            <Text style={styles.helpText}>• 0.125 → % / ppm</Text>
            <Text style={styles.helpHint}>{copy.fixTap}</Text>
            <Pressable onPress={() => setShowHelp(false)} style={({ pressed }) => [styles.helpDone, pressed && styles.pressed]}>
              <Text style={styles.helpDoneText}>{copy.helpDone}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(unitInfo)} transparent animationType="fade" onRequestClose={() => setUnitInfoSymbol(null)}>
        <View style={styles.unitInfoBackdrop}>
          {unitInfo ? <View style={styles.unitInfoSheet}>
            <View style={styles.unitInfoHeader}>
              <View>
                <Text style={styles.cardLabel}>{copy.unitDetails}</Text>
                <Text style={styles.unitInfoSymbol}>{unitInfo.symbol}</Text>
                <Text style={styles.unitInfoTitle}>{unitInfo.name[language]}</Text>
              </View>
              <Pressable accessibilityLabel={copy.close} onPress={() => setUnitInfoSymbol(null)} style={({ pressed }) => [styles.closeHelp, pressed && styles.iconPressed]}>
                <IconSymbol name="xmark" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={styles.unitInfoSummary}>{unitInfo.summary[language]}</Text>
            <View style={styles.unitInfoFact}>
              <Text style={styles.unitInfoFactLabel}>{copy.siConversion}</Text>
              <Text selectable style={styles.unitInfoFactValue}>{unitInfo.siConversion}</Text>
            </View>
            <View style={styles.unitInfoFact}>
              <Text style={styles.unitInfoFactLabel}>{copy.commonUse}</Text>
              <Text style={styles.unitInfoUsage}>{unitInfo.usage[language]}</Text>
            </View>
            <Pressable onPress={() => setUnitInfoSymbol(null)} style={({ pressed }) => [styles.unitInfoDone, pressed && styles.pressed]}>
              <Text style={styles.unitInfoDoneText}>{copy.close}</Text>
            </Pressable>
          </View> : null}
        </View>
      </Modal>

      <Modal visible={isReady && !hasSeenOnboarding} transparent animationType="fade" onRequestClose={() => void completeOnboarding()}>
        <View style={styles.helpBackdrop}>
          <View style={styles.onboardingSheet}>
            <Text style={styles.onboardingExample}>{onboardingSlides[onboardingStep].example}</Text>
            <Text style={styles.onboardingTitle}>{onboardingSlides[onboardingStep].title}</Text>
            <Text style={styles.onboardingBody}>{onboardingSlides[onboardingStep].body}</Text>
            <View style={styles.onboardingDots}>
              {onboardingSlides.map((slide, index) => (
                <View key={slide.title} style={[styles.onboardingDot, index === onboardingStep && styles.onboardingDotActive]} />
              ))}
            </View>
            <View style={styles.onboardingActions}>
              <Pressable onPress={() => void completeOnboarding()} style={({ pressed }) => [styles.onboardingSkip, pressed && styles.pressed]}>
                <Text style={styles.onboardingSkipText}>{copy.skip}</Text>
              </Pressable>
              <Pressable
                onPress={() => (isLastOnboardingSlide ? void completeOnboarding() : setOnboardingStep((step) => step + 1))}
                style={({ pressed }) => [styles.onboardingNext, pressed && styles.pressed]}
              >
                <Text style={styles.onboardingNextText}>{isLastOnboardingSlide ? copy.getStarted : copy.next}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={pendingSample !== null}
        title={copy.sampleConfirmTitle}
        message={copy.sampleConfirmMessage}
        cancelLabel={t("cancel")}
        confirmLabel={copy.sampleConfirmButton}
        destructive
        onCancel={() => setPendingSample(null)}
        onConfirm={() => {
          if (pendingSample) applySample(pendingSample);
          setPendingSample(null);
        }}
      />
    </ScreenContainer>
  );
}

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  // 画面全体を一枚に収め、縦スクロールを起こさない構成にする。
  screen: { flex: 1, gap: 6, paddingBottom: 4, paddingTop: 2 },
  // h1(title)を削除したので、右端のヘルプボタンだけが浮くようにflex-endへ変更
  // （space-betweenのままだと子要素が1つだけになり左端に寄ってしまう）。
  header: { alignItems: "center", flexDirection: "row", justifyContent: "flex-end" },
  headerActions: { alignItems: "center", flexDirection: "row", gap: 6 },
  headerButton: { alignItems: "center", backgroundColor: colors.primarySurface, borderRadius: 16, height: 32, justifyContent: "center", width: 32 },

  inputCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 5, paddingHorizontal: 12, paddingVertical: 8 },
  inputRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  expressionInput: { color: colors.foreground, flex: 1, fontFamily: mono, fontSize: 19, fontWeight: "600", minHeight: 44, paddingHorizontal: 0 },
  calculateButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 11, height: 44, justifyContent: "center", width: 52 },
  calculateText: { color: colors.onPrimary, fontFamily: mono, fontSize: 20, fontWeight: "800" },

  // 式のどこが数値・単位・未登録なのかを一目で見分けられるようにする。
  previewRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", rowGap: 2 },
  previewNumber: { color: colors.foreground, fontFamily: mono, fontSize: 13 },
  previewUnit: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  previewIdentifier: { color: colors.warning, fontFamily: mono, fontSize: 13, fontWeight: "700" },
  previewOperator: { color: colors.muted, fontFamily: mono, fontSize: 13 },
  // 範囲選択はキャレットではなく帯で示す（選択中はどこに挿入されるかではなく「何が置き換わるか」が要点）。
  previewSelected: { backgroundColor: colors.primarySurface },
  previewUnknownWrap: { alignItems: "center", backgroundColor: colors.errorSurface, borderColor: colors.errorBorder, borderRadius: 6, borderWidth: 1, flexDirection: "row", gap: 3, paddingHorizontal: 4 },
  previewUnknown: { color: colors.error, fontFamily: mono, fontSize: 13, fontWeight: "800", textDecorationLine: "underline" },

  hintRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  hintLabel: { color: colors.muted, flexShrink: 0, fontSize: 10, fontWeight: "800", width: 58 },
  hintLabelAlert: { color: colors.error },
  hintRail: { alignItems: "center", gap: 6, paddingRight: 4 },
  hintEmpty: { color: colors.muted, flex: 1, fontSize: 11 },
  hintSearchButton: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 9, borderWidth: 1, height: 32, justifyContent: "center", width: 34 },
  hintSearchButtonActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },

  // 単位挿入をモーダルなしその場で完結させる、入力欄直下のインクリメンタルサーチ。
  inlineUnitPanel: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, gap: 6, marginTop: 2, paddingTop: 7 },
  inlinePanelClear: { padding: 2 },
  inlinePanelStatusRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" },
  inlinePanelStatus: { color: colors.muted, fontSize: 11, paddingTop: 2 },
  inlinePanelUseButton: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  inlinePanelUseButtonText: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  categoryRailCompact: { gap: 6, paddingVertical: 2 },
  categoryChipSmall: { backgroundColor: colors.surfaceSecondary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  inlineUnitResults: { maxHeight: 118 },
  inlinePanelMore: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 2, paddingVertical: 4 },
  inlinePanelMoreText: { color: colors.primary, fontSize: 11, fontWeight: "800" },

  unitChip: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 10, borderWidth: 1, minWidth: 46, paddingHorizontal: 9, paddingVertical: 4 },
  unitChipActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  unitChipSymbol: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  unitChipSymbolActive: { color: colors.onPrimary },
  unitChipName: { color: colors.muted, fontSize: 9, maxWidth: 92 },
  unitChipNameActive: { color: colors.onPrimary },

  middle: { flexGrow: 1, flexShrink: 1, minHeight: 84 },
  middleContent: { gap: 7 },
  resultCard: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 16, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 },
  resultHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  resultActions: { alignItems: "center", flexDirection: "row", gap: 6 },
  iconButton: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 8, height: 28, justifyContent: "center", width: 32 },
  // 結果は画面で最も大きい文字にする（式19px・キー18pxに対して28pxでは、下に並ぶチップに埋没していた）。
  resultValue: { color: colors.primaryStrong, fontFamily: mono, fontSize: 36, fontWeight: "700", marginTop: 2, minHeight: 44 },
  emptyResult: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
  presetOutputUnit: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  presetOutputUnitLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  presetOutputUnitValueWrap: { alignItems: "center", flexDirection: "row", gap: 2 },
  presetOutputUnitValue: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  quickStartList: { gap: 6, marginTop: 10 },
  quickStartLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  quickStartRow: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 44, paddingHorizontal: 12, paddingVertical: 8 },
  quickStartExpression: { color: colors.primaryStrong, fontFamily: mono, fontSize: 15, fontWeight: "700" },
  quickStartHint: { color: colors.muted, flex: 1, fontSize: 11, lineHeight: 15 },
  diagnosisWrap: { alignItems: "flex-start", flexDirection: "row", gap: 8, marginTop: 6, minHeight: 44 },
  diagnosisBody: { flex: 1 },
  diagnosisText: { color: colors.error, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  diagnosisHint: { color: colors.muted, fontSize: 11, marginTop: 3 },

  // 結果のすぐ下で単位を切り替えられるようにする。
  conversionRow: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 4 },
  conversionRail: { alignItems: "center", gap: 6, paddingRight: 4 },
  convertChip: { backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 9, borderWidth: 1, minHeight: 30, justifyContent: "center", paddingHorizontal: 10 },
  convertChipActive: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  convertChipText: { color: colors.primary, fontFamily: mono, fontSize: 12, fontWeight: "800" },
  convertChipTextActive: { color: colors.onPrimary },
  convertMore: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 9, borderWidth: 1, flexDirection: "row", gap: 2, minHeight: 30, paddingHorizontal: 8 },
  convertMoreText: { color: colors.primary, fontSize: 11, fontWeight: "800" },

  // 単位比較表（チップ列を縦に開いたもの）。デフォルト折りたたみのトグルと、開いたときの行一覧。
  comparisonSection: { marginTop: 7 },
  comparisonToggle: { alignItems: "center", flexDirection: "row", gap: 6, justifyContent: "space-between", paddingVertical: 2 },
  comparisonToggleText: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  comparisonHint: { color: colors.muted, fontSize: 10, marginTop: 2 },
  comparisonTable: { gap: 1, marginTop: 4 },
  comparisonRow: { alignItems: "center", borderRadius: 8, flexDirection: "row", gap: 8, justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 6 },
  comparisonRowActive: { backgroundColor: colors.primaryFill },
  comparisonRowLabel: { color: colors.foreground, fontSize: 12, fontWeight: "600" },
  comparisonRowLabelActive: { color: colors.onPrimary },
  comparisonRowValue: { color: colors.foreground, flexShrink: 1, fontFamily: mono, fontSize: 12, fontWeight: "600", textAlign: "right" },
  comparisonRowValueActive: { color: colors.onPrimary },

  // 基数チップは単位チップ（convertChip、primary系）とは別の色にして、単位換算ではなく
  // 「表記の分類」であることを読ませる（previewIdentifierと同じくwarning系を分類の色として使う）。
  baseChipRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  // 入力欄の直下に出す基数バー。チップ自体は結果カードと同じ見た目を使い、置き場所で役割を分ける。
  baseInputBar: { flexDirection: "row", gap: 6, marginTop: 6 },
  // 上下のpaddingは飾りではない。KaTeXのインライン描画は行ボックスより上下にはみ出すことがあり
  // （分数の分子・根号の上線）、RNのViewは既定でoverflow:hiddenなので余白が無いと上が欠ける。
  exactValueRow: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 2, minHeight: 44, paddingVertical: 4 },
  exactValueUnit: { color: colors.primaryStrong, fontFamily: mono, fontSize: 32, fontWeight: "700" },
  // 丸める前の値の併記。結果の値より明らかに小さく・淡くして、主役が丸めた値であることを保つ。
  roundedFromText: { color: colors.muted, fontFamily: mono, fontSize: 12, fontWeight: "600", marginTop: -2 },
  valueFormChip: { backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 9, borderWidth: 1, justifyContent: "center", minHeight: 30, paddingHorizontal: 10 },
  valueFormChipActive: { backgroundColor: colors.primarySurface, borderColor: colors.primary },
  valueFormChipText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  valueFormChipTextActive: { color: colors.primary },
  baseEntryButton: { alignItems: "center", backgroundColor: colors.warningSurface, borderColor: colors.warningBorder, borderRadius: 16, borderWidth: 1, height: 32, justifyContent: "center", paddingHorizontal: 11 },
  baseEntryText: { color: colors.warning, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  baseDoneButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 9, height: 30, justifyContent: "center", paddingHorizontal: 12 },
  baseDoneText: { color: colors.onPrimary, fontSize: 11, fontWeight: "800" },
  hintSpacer: { flex: 1 },
  baseChip: { backgroundColor: colors.surface, borderColor: colors.warningBorder, borderRadius: 9, borderWidth: 1, justifyContent: "center", minHeight: 30, paddingHorizontal: 10 },
  baseChipActive: { backgroundColor: colors.warningSurface, borderColor: colors.warning },
  baseChipText: { color: colors.muted, fontFamily: mono, fontSize: 12, fontWeight: "800" },
  baseChipTextActive: { color: colors.warning, fontWeight: "800" },

  siRow: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between", marginTop: 7 },
  siLabel: { color: colors.muted, fontSize: 11 },
  siValue: { color: colors.foreground, flexShrink: 1, fontFamily: mono, fontSize: 12, fontWeight: "600", textAlign: "right" },
  registrationNote: { color: colors.warning, fontSize: 10, marginTop: 4 },
  errorText: { color: colors.error, fontSize: 11, lineHeight: 16, marginTop: 6 },

  messageError: { backgroundColor: colors.errorSurface, borderColor: colors.errorBorder, borderRadius: 10, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  messageErrorText: { color: colors.error, fontSize: 12, lineHeight: 17 },
  messageHint: { color: colors.muted, fontSize: 10, marginTop: 3 },
  messageSuccess: { backgroundColor: colors.successSurface, borderColor: colors.successBorder, borderRadius: 10, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  messageSuccessText: { color: colors.success, fontSize: 12, lineHeight: 17 },

  startRail: { alignItems: "center", gap: 6, paddingRight: 4 },
  // サンプルは二次的な導線として控えめに（surfaceSecondary系のまま、アイコンを添えるためrowにする）。
  toolButton: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderRadius: 9, borderWidth: 1, flexDirection: "row", gap: 5, justifyContent: "center", minHeight: 32, paddingHorizontal: 11 },
  toolButtonText: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  // 常に1行だけの高さで、ダイアログ（showHistory）を開く入口として機能させる。
  historyBar: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 8, minHeight: 40, paddingHorizontal: 11 },
  historyBarLabel: { alignItems: "center", flexDirection: "row", flexShrink: 0, gap: 4 },
  historyBarLatest: { color: colors.foreground, flex: 1, fontFamily: mono, fontSize: 11 },
  historyBarCount: { color: colors.primary, fontSize: 11, fontWeight: "800" },

  // 数学・進数はキーパッドの一部に見せたいので、advancedKeyと同じprimarySurface系の色使いにする。

  // 画面幅に関係なく必ず4列で並ぶよう、25%幅のセルに収める。
  keypad: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 },
  // 5列（KEYS のコメント参照）。4列に戻すなら KEYS の並びも組み直すこと。
  keyCell: { padding: 3, width: "20%" },
  key: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, height: 42, justifyContent: "center" },
  keyOperator: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder },
  keyAction: { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill },
  keyText: { color: colors.foreground, fontFamily: mono, fontSize: 18, fontWeight: "600" },
  keyTextAccent: { color: colors.primary },
  keyPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  // 進数入力モードでその基数の桁として使えないキー・演算子キーを薄く見せる（押せないことを示す）。
  keyDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  iconPressed: { opacity: 0.55 },
  cardPressed: { opacity: 0.7 },

  sampleRow: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderRadius: 11, borderWidth: 1, flexDirection: "row", paddingHorizontal: 11, paddingVertical: 10 },
  sampleCopy: { flex: 1, marginRight: 10 },
  sampleTitle: { color: colors.foreground, fontSize: 13, fontWeight: "800" },
  sampleDescription: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  sampleExpressionWrap: { alignItems: "flex-end", maxWidth: "48%" },
  sampleExpression: { color: colors.primary, fontFamily: mono, fontSize: 12, fontWeight: "700" },
  sampleTarget: { color: colors.muted, fontFamily: mono, fontSize: 11, marginTop: 2 },

  unitSearchWrap: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", marginTop: 4, minHeight: 45, paddingHorizontal: 12 },
  unitSearchInput: { color: colors.foreground, flex: 1, fontSize: 14, marginLeft: 8, paddingVertical: 9 },
  categoryRail: { gap: 7, paddingBottom: 2, paddingTop: 10 },
  categoryChip: { backgroundColor: colors.surfaceSecondary, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 7 },
  categoryChipActive: { backgroundColor: colors.primaryFill },
  categoryChipText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  categoryChipTextActive: { color: colors.onPrimary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 5 },
  unitGroupLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  favoritePicker: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder, borderRadius: 12, borderWidth: 1, marginTop: 6, padding: 10 },

  advancedKeyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  advancedKey: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 10, borderWidth: 1, justifyContent: "center", minHeight: 38, minWidth: 54, paddingHorizontal: 10 },
  advancedKeyText: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },

  // advancedKeyの色使いを踏襲した、16進入力モード専用の小さめのA〜F行。キーパッド本体
  // （styles.keypad/key）はここでは一切変えない。
  // 編集キーは hexKeyRow と同じ「等幅で横に並べる」形。数と演算子のキーパッドとは役割が違うので
  // 面ではなく枠だけの見た目にして、キーパッド本体（styles.key）と見分けが付くようにする。
  // 高さと余白は詰めてある。2行足すと 360×640 の端末でキーパッド下段がタブバーに潜るため
  // （変更前も下段は既に際どく、行を足すぶんはここで取り戻している）。
  editKeyRow: { flexDirection: "row", gap: 6, marginBottom: 6 },
  editKey: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 32 },
  editKeyText: { color: colors.primary, fontFamily: mono, fontSize: 15, fontWeight: "800" },
  // 接頭語は「単位の文字」なので、単位チップと同じ面の色にして編集キー（枠だけ）と区別する。
  prefixKey: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 32 },
  prefixKeyText: { color: colors.primary, fontFamily: mono, fontSize: 15, fontWeight: "800" },
  // 数学は文字数が多いので、他の編集キーより少し広く取る（アイコンは外した。1行に収めるため）。
  // minWidth: 0 が無いと、内容幅が flex の割り当てより大きい言語で行からはみ出す。
  mathKey: { backgroundColor: colors.primarySurface, flex: 1.6, minWidth: 0, paddingHorizontal: 2 },
  hexKeyRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  hexKey: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 32 },
  hexKeyText: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },

  historyActions: { alignItems: "center", flexDirection: "row", gap: 10 },
  exportHistoryButton: { alignItems: "center", flexDirection: "row", gap: 3, padding: 4 },
  exportHistoryText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  clearHistoryButton: { padding: 4 },
  clearHistoryText: { color: colors.error, fontSize: 11, fontWeight: "700" },
  historyRow: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 11, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginBottom: 6, paddingHorizontal: 12, paddingVertical: 10 },
  historyExpressionWrap: { alignItems: "center", flex: 1, flexDirection: "row", marginRight: 10 },
  historyAutoSymbol: { color: colors.primary, fontFamily: mono, fontSize: 11, fontWeight: "800", marginRight: 7 },
  historyExpression: { color: colors.foreground, flex: 1, fontFamily: mono, fontSize: 12 },
  historyResult: { color: colors.primary, fontFamily: mono, fontSize: 12, fontWeight: "700", maxWidth: "45%" },

  modalBackdrop: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" },
  compactSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "86%", paddingBottom: 28, paddingHorizontal: 18, paddingTop: 12 },
  sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  sheetTitle: { color: colors.foreground, fontSize: 20, fontWeight: "800" },
  sheetHeaderMain: { flex: 1, paddingRight: 10 },
  sheetSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  modalList: { gap: 8, paddingBottom: 18, paddingTop: 10 },
  registrationCard: { backgroundColor: colors.successSurface, borderColor: colors.successBorder, borderRadius: 12, borderWidth: 1, marginTop: 9, padding: 10 },
  registrationCardSupported: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder },
  registrationCardUnknown: { backgroundColor: colors.errorSurface, borderColor: colors.errorBorder },
  registrationCardTitle: { color: colors.foreground, fontSize: 12, fontWeight: "800" },
  registrationCardHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  useTypedUnitButton: { alignSelf: "flex-start", backgroundColor: colors.surface, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, marginTop: 8, paddingHorizontal: 9, paddingVertical: 6 },
  useTypedUnitText: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  pickerSectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  emptyState: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 14, gap: 4, marginTop: 6, paddingHorizontal: 20, paddingVertical: 26 },
  emptyStateTitle: { color: colors.foreground, fontSize: 13, fontWeight: "800", marginTop: 6, textAlign: "center" },
  emptyStateText: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
  pickerGroup: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 9 },

  helpBackdrop: { alignItems: "center", backgroundColor: colors.overlay, flex: 1, justifyContent: "center", padding: 24 },
  helpSheet: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, width: "100%" },
  helpTitleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  helpTitle: { color: colors.foreground, fontSize: 20, fontWeight: "700" },
  closeHelp: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 16, height: 32, justifyContent: "center", width: 32 },
  helpText: { color: colors.foreground, fontSize: 13, lineHeight: 21 },
  helpHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  helpDone: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 11, marginTop: 10, paddingVertical: 12 },
  helpDoneText: { color: colors.onPrimary, fontWeight: "700" },

  onboardingSheet: { backgroundColor: colors.surface, borderRadius: 22, padding: 22, width: "100%" },
  onboardingExample: { alignSelf: "flex-start", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 10, borderWidth: 1, color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800", paddingHorizontal: 10, paddingVertical: 5 },
  onboardingTitle: { color: colors.foreground, fontSize: 21, fontWeight: "800", marginTop: 16 },
  onboardingBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  onboardingDots: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 22 },
  onboardingDot: { backgroundColor: colors.border, borderRadius: 3, height: 6, width: 6 },
  onboardingDotActive: { backgroundColor: colors.primary, width: 18 },
  onboardingActions: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  onboardingSkip: { paddingVertical: 10 },
  onboardingSkipText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  onboardingNext: { backgroundColor: colors.primaryFill, borderRadius: 11, paddingHorizontal: 22, paddingVertical: 12 },
  onboardingNextText: { color: colors.onPrimary, fontSize: 14, fontWeight: "800" },

  unitInfoBackdrop: { alignItems: "center", backgroundColor: colors.overlay, flex: 1, justifyContent: "center", padding: 24 },
  unitInfoSheet: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, maxWidth: 520, padding: 20, width: "100%" },
  unitInfoHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  unitInfoSymbol: { color: colors.primary, fontFamily: mono, fontSize: 26, fontWeight: "800" },
  unitInfoTitle: { color: colors.foreground, fontSize: 18, fontWeight: "800", marginTop: 2 },
  unitInfoSummary: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 13 },
  unitInfoFact: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 11, borderWidth: 1, marginTop: 14, padding: 12 },
  unitInfoFactLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  unitInfoFactValue: { color: colors.foreground, fontFamily: mono, fontSize: 14, fontWeight: "700", marginTop: 4 },
  unitInfoUsage: { color: colors.foreground, fontSize: 13, lineHeight: 19, marginTop: 4 },
  unitInfoDone: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 11, marginTop: 18, paddingVertical: 12 },
  unitInfoDoneText: { color: colors.onPrimary, fontWeight: "700" },
});
