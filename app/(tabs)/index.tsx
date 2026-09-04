import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { CalculatorBannerAd } from "@/components/ads/calculator-banner-ad";
import { ScreenContainer } from "@/components/screen-container";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { isSampleCategoryVisible, isUnitGroupVisible, isUnitVisible, visibleUnits } from "@/lib/advanced-display";
import { useCalculatorStore } from "@/lib/calculator-store";
import { evaluateCalculatorInput, previewCalculatorInput } from "@/lib/calculator-input";
import { resolveStartupExpression } from "@/lib/calculator-startup-expression";
import { exportCalculationHistory } from "@/lib/calculation-export";
import { useGlobalSettings } from "@/lib/global-settings";
import { historyToAutoConstants } from "@/lib/history-auto-constants";
import { localizedText, type AppLanguage } from "@/lib/i18n";
import { BASE_META, canRepresentInBase, formatInBaseParts, isBaseDigitAllowed, NUMBER_BASES, parseBaseInput, type NumberBase } from "@/lib/number-base";
import { getCalculatorQuickShortcut } from "@/lib/quick-shortcuts";
import { usePro } from "@/lib/revenuecat-provider";
import { buildUnitComparisonRows } from "@/lib/unit-comparison";
import { unitErrorMessage } from "@/lib/unit-errors";
import { getUnitExplanation } from "@/lib/unit-explanations";
import UnitCalculatorWidget from "@/widgets/UnitCalculatorWidget";
import { SAMPLE_CALCULATIONS, SAMPLE_CATEGORIES, type SampleCalculation } from "@/lib/sample-calculations";
import {
  analyzeExpression,
  getUnitInputHint,
  getUnitInsertionRange,
  getUnitSuggestions,
  replaceExpressionRange,
  type ExpressionSegment,
  type UnitInputHint,
  type UnitSuggestion,
} from "@/lib/unit-input";
import { formatQuantity, getCompatibleUnitGroups, getGroupUnitsForSystem, getRegionalUnits, getUnitRegistration, UNIT_GROUPS, type UnitGroup, type UnitOption } from "@/lib/units";

// 「全消し」の要望に対応するため、従来は空セルのプレースホルダだった最下段（"0"と"="の間）に
// ⌫（一文字削除）を動かし、空いた最上段の右端（従来⌫があった場所）にACを置く。
// AC（全消去・元に戻せない）は"="からできるだけ離し、逆に押し間違えても被害が小さい⌫の方を
// "="の隣に残すことで、誤爆したときの実害を最小にする配置にしている。
const KEYS = ["(", ")", "÷", "AC", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", ".", "0", "⌫", "="];
const ADVANCED_KEYS = ["sin(", "cos(", "tan(", "asin(", "acos(", "atan(", "atan2(", "ln(", "log(", "log2(", "sqrt(", "^", "π", "e"];
// 16進の入力モード専用。キーパッド本体の配置は変えず、直上に小さな別の行として出す。
const HEX_LETTER_KEYS = ["A", "B", "C", "D", "E", "F"];
// 進数入力モード中に押せてはいけないキー（演算子・小数点・括弧）。16進の桁のまま演算に入ると
// 評価器が解釈できないため、まず = で10進へ確定させてから通常の式に組み込む運用にする。
const BASE_INPUT_DISABLED_KEYS = ["(", ")", "÷", "×", "-", "+", "."];
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
  expressionPlaceholder: "Example: 5cm + 1mm",
  deleteKey: "Delete",
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
  sampleConfirmTitle: "Load an example?",
  sampleConfirmMessage: "The expression you have typed will be replaced.",
  sampleConfirmButton: "Load",
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
    expressionPlaceholder: "例：5cm + 1mm",
    deleteKey: "一文字削除",
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
    sampleConfirmTitle: "サンプルを読み込みますか？",
    sampleConfirmMessage: "入力中の式は置き換えられます。",
    sampleConfirmButton: "読み込む",
  },
  es: {
    definitionHint: "Definir una constante: W = 3cm", calculate: "=", siBase: "Base SI", emptyResult: "Escribe una expresión para ver el resultado. Toca = para guardarlo en el historial.", pickUnit: "Elige una unidad registrada", speedTitle: "Distancia, tiempo y velocidad", speedFormula: "Velocidad = distancia ÷ tiempo     Distancia = velocidad × tiempo", findSpeed: "Calcular velocidad", findDistance: "Calcular distancia", findTime: "Calcular tiempo", savedHistory: "Cálculos guardados", historyHint: "Los últimos resultados están disponibles como a1, a2, etc.", clear: "Borrar", helpTitle: "Ejemplos", helpDone: "Listo", unitSearch: "Buscar unidades, nombres o categorías", copied: "Cálculo copiado", copy: "Copiar", unitDetails: "Detalles de la unidad", siConversion: "Conversión SI", commonUse: "Uso común", close: "Cerrar", advancedMath: "Matemáticas avanzadas", advancedMathHint: "Los ángulos usan rad, deg o °. Incluye trigonometría inversa, logaritmos y atan2(y, x).", saveTemplate: "Guardar", samples: "Ejemplos", math: "Matemáticas", outputUnit: "Unidad mostrada", insertUnit: "Insertar unidad", registered: "Registrada", supported: "Compatible, sin listar", unknown: "Unidad no válida", unknownHint: "Revisa el símbolo o elige un candidato abajo.", history: "Historial", use: "Usar", noUnit: "Base SI", compatible: "Compatible con este resultado", allCandidates: "Candidatos más cercanos", hintFix: "Corregir", hintComplete: "Completar", hintAttach: "Añadir", hintReplace: "Sustituir", hintInsert: "Insertar", more: "Más", showAs: "Mostrar como", fixTap: "Toca la unidad en rojo para corregirla.", noCandidates: "No se encontró ningún candidato. Revisa el símbolo.", aliasNote: "igual a", noSearchResults: "Ninguna unidad coincide con esta búsqueda.", noSearchResultsHint: "Prueba otro símbolo, nombre o categoría.", noHistory: "Aún no hay cálculos guardados.", noHistoryHint: "Cada resultado que calculas se guarda aquí automáticamente.", browseUnits: "Explorar categorías",
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
    expressionPlaceholder: "Ejemplo: 5cm + 1mm",
    deleteKey: "Eliminar",
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
    sampleConfirmTitle: "¿Cargar un ejemplo?",
    sampleConfirmMessage: "Se reemplazará la expresión que has escrito.",
    sampleConfirmButton: "Cargar",
  },
  "pt-BR": {
    definitionHint: "Definir uma constante: W = 3cm", calculate: "=", siBase: "Base SI", emptyResult: "Digite uma expressão para ver o resultado. Toque em = para salvá-lo no histórico.", pickUnit: "Escolha uma unidade registrada", speedTitle: "Distância, tempo e velocidade", speedFormula: "Velocidade = distância ÷ tempo     Distância = velocidade × tempo", findSpeed: "Calcular velocidade", findDistance: "Calcular distância", findTime: "Calcular tempo", savedHistory: "Cálculos salvos", historyHint: "Os últimos resultados ficam disponíveis como a1, a2 etc.", clear: "Limpar", helpTitle: "Exemplos", helpDone: "Concluído", unitSearch: "Buscar unidades, nomes ou categorias", copied: "Cálculo copiado", copy: "Copiar", unitDetails: "Detalhes da unidade", siConversion: "Conversão SI", commonUse: "Uso comum", close: "Fechar", advancedMath: "Matemática avançada", advancedMathHint: "Os ângulos usam rad, deg ou °. Inclui trigonometria inversa, logaritmos e atan2(y, x).", saveTemplate: "Salvar", samples: "Exemplos", math: "Matemática", outputUnit: "Unidade de exibição", insertUnit: "Inserir unidade", registered: "Registrada", supported: "Compatível, não listada", unknown: "Unidade inválida", unknownHint: "Verifique o símbolo ou escolha um candidato abaixo.", history: "Histórico", use: "Usar", noUnit: "Base SI", compatible: "Compatível com este resultado", allCandidates: "Candidatos mais próximos", hintFix: "Corrigir", hintComplete: "Concluir", hintAttach: "Adicionar", hintReplace: "Substituir", hintInsert: "Inserir", more: "Mais", showAs: "Exibir como", fixTap: "Toque na unidade em vermelho para corrigi-la.", noCandidates: "Nenhum candidato encontrado. Verifique o símbolo.", aliasNote: "igual a", noSearchResults: "Nenhuma unidade corresponde a esta busca.", noSearchResultsHint: "Tente outro símbolo, nome ou categoria.", noHistory: "Ainda não há cálculos salvos.", noHistoryHint: "Cada resultado calculado é salvo aqui automaticamente.", browseUnits: "Explorar categorias",
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
    expressionPlaceholder: "Exemplo: 5cm + 1mm",
    deleteKey: "Excluir",
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
    sampleConfirmTitle: "Carregar um exemplo?",
    sampleConfirmMessage: "A expressão que você digitou será substituída.",
    sampleConfirmButton: "Carregar",
  },
  de: {
    definitionHint: "Konstante definieren: W = 3cm", calculate: "=", siBase: "SI-Basis", emptyResult: "Gib einen Ausdruck ein, um das Ergebnis zu sehen. Tippe auf =, um es im Verlauf zu speichern.", pickUnit: "Registrierte Einheit wählen", speedTitle: "Strecke, Zeit & Geschwindigkeit", speedFormula: "Geschwindigkeit = Strecke ÷ Zeit     Strecke = Geschwindigkeit × Zeit", findSpeed: "Geschwindigkeit berechnen", findDistance: "Strecke berechnen", findTime: "Zeit berechnen", savedHistory: "Gespeicherte Berechnungen", historyHint: "Die letzten Ergebnisse stehen als a1, a2 usw. zur Verfügung.", clear: "Löschen", helpTitle: "Beispiele", helpDone: "Fertig", unitSearch: "Einheiten, Namen oder Kategorien suchen", copied: "Berechnung kopiert", copy: "Kopieren", unitDetails: "Details zur Einheit", siConversion: "SI-Umrechnung", commonUse: "Typische Verwendung", close: "Schließen", advancedMath: "Erweiterte Mathematik", advancedMathHint: "Winkel in rad, deg oder °. Enthält inverse Trigonometrie, Logarithmen und atan2(y, x).", saveTemplate: "Speichern", samples: "Beispiele", math: "Mathematik", outputUnit: "Anzeigeeinheit", insertUnit: "Einheit einfügen", registered: "Registriert", supported: "Unterstützt, nicht gelistet", unknown: "Keine gültige Einheit", unknownHint: "Prüfe das Symbol oder wähle unten einen Vorschlag.", history: "Verlauf", use: "Verwenden", noUnit: "SI-Basis", compatible: "Passt zu diesem Ergebnis", allCandidates: "Nächste Vorschläge", hintFix: "Beheben", hintComplete: "Fertig", hintAttach: "Anfügen", hintReplace: "Ersetzen", hintInsert: "Einfügen", more: "Mehr", showAs: "Anzeigen als", fixTap: "Tippe auf die rote Einheit, um sie zu korrigieren.", noCandidates: "Kein Vorschlag gefunden. Prüfe das Symbol.", aliasNote: "entspricht", noSearchResults: "Keine Einheit passt zu dieser Suche.", noSearchResultsHint: "Versuche ein anderes Symbol, einen anderen Namen oder eine andere Kategorie.", noHistory: "Noch keine gespeicherten Berechnungen.", noHistoryHint: "Jedes berechnete Ergebnis wird hier automatisch gespeichert.", browseUnits: "Kategorien durchsuchen",
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
    expressionPlaceholder: "Beispiel: 5cm + 1mm",
    deleteKey: "Rücktaste",
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
    sampleConfirmTitle: "Beispiel laden?",
    sampleConfirmMessage: "Der eingegebene Ausdruck wird ersetzt.",
    sampleConfirmButton: "Laden",
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
    expressionPlaceholder: "Exemple : 5cm + 1mm",
    deleteKey: "Supprimer",
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
    sampleConfirmTitle: "Charger un exemple ?",
    sampleConfirmMessage: "L'expression que vous avez saisie sera remplacée.",
    sampleConfirmButton: "Charger",
  },
};

// オンボーディングの3スライド。EN_COPYと同様に英語を正としたRecordで持ち、言語追加時のキー漏れを型エラーで検出する。
type OnboardingSlide = { title: string; body: string; example: string };
const ONBOARDING_SLIDES: Record<AppLanguage, OnboardingSlide[]> = {
  en: [
    { title: "Calculate with units, directly", body: "Type an expression with units, such as 5cm + 1mm. The app normalizes it to SI before calculating.", example: "5cm + 1mm" },
    { title: "Tap a red unit to fix it", body: "Unknown or mistyped units turn red in the preview. Tap one to pick the closest match.", example: "5cm + 1mn" },
    { title: "Switch units in one tap", body: "Choose any compatible display unit right under the result. Multi-step calculations live in the Notebooks tab.", example: "cm → m → ft" },
  ],
  ja: [
    { title: "単位のまま計算できます", body: "5cm + 1mm のように単位を含む式を入力するだけです。計算前にSI標準へ正規化されます。", example: "5cm + 1mm" },
    { title: "赤い単位はタップで修正", body: "未登録・入力ミスの単位はプレビューで赤く表示されます。タップすると近い候補を選べます。", example: "5cm + 1mn" },
    { title: "結果はワンタップで単位切替", body: "結果のすぐ下で表示単位を選べます。手順のある計算は「ノート」タブで使えます。", example: "cm → m → ft" },
  ],
  es: [
    { title: "Calcula directamente con unidades", body: "Escribe una expresión con unidades, como 5cm + 1mm. La app la normaliza a SI antes de calcular.", example: "5cm + 1mm" },
    { title: "Toca una unidad en rojo para corregirla", body: "Las unidades desconocidas o mal escritas aparecen en rojo en la vista previa. Tócala para elegir la coincidencia más cercana.", example: "5cm + 1mn" },
    { title: "Cambia de unidad con un toque", body: "Elige cualquier unidad compatible justo debajo del resultado. Los cálculos con varios pasos están en la pestaña Cuadernos.", example: "cm → m → ft" },
  ],
  "pt-BR": [
    { title: "Calcule diretamente com unidades", body: "Digite uma expressão com unidades, como 5cm + 1mm. O app a normaliza para SI antes de calcular.", example: "5cm + 1mm" },
    { title: "Toque em uma unidade em vermelho para corrigi-la", body: "Unidades desconhecidas ou digitadas incorretamente ficam vermelhas na pré-visualização. Toque em uma para escolher a correspondência mais próxima.", example: "5cm + 1mn" },
    { title: "Troque de unidade com um toque", body: "Escolha qualquer unidade de exibição compatível logo abaixo do resultado. Os cálculos com várias etapas ficam na aba Cadernos.", example: "cm → m → ft" },
  ],
  de: [
    { title: "Direkt mit Einheiten rechnen", body: "Gib einen Ausdruck mit Einheiten ein, zum Beispiel 5cm + 1mm. Die App normalisiert ihn vor der Berechnung auf SI.", example: "5cm + 1mm" },
    { title: "Tippe auf eine rote Einheit, um sie zu korrigieren", body: "Unbekannte oder falsch geschriebene Einheiten werden in der Vorschau rot angezeigt. Tippe darauf, um die beste Übereinstimmung zu wählen.", example: "5cm + 1mn" },
    { title: "Einheit mit einem Tipp wechseln", body: "Wähle direkt unter dem Ergebnis jede passende Anzeigeeinheit. Mehrschrittige Berechnungen findest du im Tab Rechenhefte.", example: "cm → m → ft" },
  ],
  fr: [
    { title: "Calculez directement avec des unités", body: "Saisissez une expression avec des unités, comme 5cm + 1mm. L'application la normalise en SI avant de calculer.", example: "5cm + 1mm" },
    { title: "Touchez une unité en rouge pour la corriger", body: "Les unités inconnues ou mal saisies s'affichent en rouge dans l'aperçu. Touchez-en une pour choisir la correspondance la plus proche.", example: "5cm + 1mn" },
    { title: "Changez d'unité en un seul geste", body: "Choisissez n'importe quelle unité d'affichage compatible juste sous le résultat. Les calculs à plusieurs étapes sont dans l'onglet Carnets.", example: "cm → m → ft" },
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
  const [targetUnit, setTargetUnit] = useState("cm");
  // 計算結果は式から導出する（= を押さなくてもリアルタイムに出す）。stateで持つと、
  // 式を書き換えたのに前の結果が残る／= を押すまで何も出ない、という2つの状態を抱えることになる。
  // = は「履歴に残す・定数を保存する・エラーを出す」確定操作の方に専念させる。
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inputGroupId, setInputGroupId] = useState("length");
  const [sampleCategory, setSampleCategory] = useState("basic");
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
  // 式が空のときだけ有効になる、進数の桁を直接打ち込むモード。nullなら通常の電卓。
  // showComparisonと同様、永続化しない（画面を開くたびリセットしてよい）。
  const [baseInputMode, setBaseInputMode] = useState<NumberBase | null>(null);
  const [unitPickerMode, setUnitPickerMode] = useState<"insert" | "target">("insert");
  const [unitInfoSymbol, setUnitInfoSymbol] = useState<string | null>(null);
  const [unitSearch, setUnitSearch] = useState("");
  const [recentUnits, setRecentUnits] = useState<string[]>([]);
  const [fixSelection, setFixSelection] = useState<{ start: number; end: number; text: string } | null>(null);
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
  const visibleSampleCategories = useMemo(() => SAMPLE_CATEGORIES.filter((category) => isSampleCategoryVisible(category.id, isAdvancedMode)), [isAdvancedMode]);
  const visibleSamples = useMemo(() => SAMPLE_CALCULATIONS.filter((sample) => sample.category === sampleCategory && isSampleCategoryVisible(sample.category, isAdvancedMode)), [isAdvancedMode, sampleCategory]);
  // 履歴の表示件数はProでも無料でも同じにしている（以前は無料5件で打ち切っていた）。
  // 打ち切りは a1・a2… の自動定数と食い違うのが致命的で、autoConstantsは常に全履歴から作るため、
  // 無料ユーザーは見えない a12 を式から参照できてしまっていた。加えて「計算のたびに履歴が消える」は
  // 電卓アプリの低評価の定番パターン（docs/market-research-2026-09.md 第4節）で、
  // 無料の価値を削ってProを売る設計はこのジャンルで最も反発が強い。
  const visibleHistory = history;
  const autoConstants = useMemo(() => historyToAutoConstants(history), [history]);
  const availableConstants = useMemo(() => [...constants, ...autoConstants], [autoConstants, constants]);
  // = を押す前でも計算できる入力ならその場で結果を出す。計算できない途中の入力（"5cm +" など）は
  // null になるだけで、エラー表示は = を押したときだけに留める（打っている最中に赤くしない）。
  const result = useMemo(() => previewCalculatorInput(expression, availableConstants), [availableConstants, expression]);
  const compatibleUnitGroups = useMemo(() => (result ? getCompatibleUnitGroups(result.dimension).filter((group) => isUnitGroupVisible(group, isAdvancedMode) && visibleUnits(getRegionalUnits(group, unitSystem), isAdvancedMode).length > 0) : []), [isAdvancedMode, result, unitSystem]);
  const unitInfo = useMemo(() => getUnitExplanation(unitInfoSymbol ?? ""), [unitInfoSymbol]);
  const targetUnitRegistration = useMemo(() => getUnitRegistration(targetUnit), [targetUnit]);
  const searchedUnitRegistration = useMemo(() => getUnitRegistration(unitSearch), [unitSearch]);

  const identifiers = useMemo(
    () => [...constants.map((item) => item.symbol), ...autoConstants.map((item) => item.symbol)],
    [autoConstants, constants],
  );
  const analysis = useMemo(() => analyzeExpression(expression, identifiers), [expression, identifiers]);
  const hint = useMemo<UnitInputHint>(() => {
    if (fixSelection) {
      return { kind: "fix", fragment: fixSelection.text, start: fixSelection.start, end: fixSelection.end, candidates: getUnitSuggestions(fixSelection.text, { system: unitSystem, limit: RAIL_LIMIT, includeUnit }) };
    }
    // 直前に計算済みの analysis を渡して、同じ式をもう一度解析しないようにする。
    // キャレット位置（selection.start）を渡すことで、末尾ではなく今カーソルがある単位・数値を対象にする。
    const caret = Math.min(selection.start, expression.length);
    return getUnitInputHint(expression, { system: unitSystem, recentUnits, identifiers, includeUnit, limit: RAIL_LIMIT, analysis, caret });
  }, [analysis, expression, fixSelection, identifiers, includeUnit, recentUnits, selection, unitSystem]);

  /** 結果のすぐ横で切り替えられる、同じ次元の単位。 */
  const conversionUnits = useMemo(() => {
    const symbols: string[] = [];
    const current = targetUnit.trim();
    if (current) symbols.push(current);
    compatibleUnitGroups.forEach((group) => {
      visibleGroupUnits(group).forEach((unitOption) => {
        if (!symbols.includes(unitOption.symbol)) symbols.push(unitOption.symbol);
      });
    });
    return symbols.slice(0, 10);
  }, [compatibleUnitGroups, targetUnit, visibleGroupUnits]);

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
    try {
      return { value: formatQuantity(result, targetUnit, locale), si: formatQuantity(result, undefined, locale), error: "" };
    } catch (cause) {
      // 次元不一致だけでなく、不正な単位文字列（例: プリセットの presetUnit パラメータ）など
      // 実際の失敗理由をそのまま見せる。決め打ちの「次元が違う」で握りつぶさない。
      // エンジンのエラー(UnitError)は現在の言語で表示する。UnitError以外は従来どおり
      // Error.message をそのまま出す（バックアップ処理など別系統のエラーもここを通るため）。
      const fallback = copy.cannotConvertUnit;
      return { value: "—", si: formatQuantity(result, undefined, locale), error: cause instanceof Error ? (unitErrorMessage(cause, language) ?? cause.message) : fallback };
    }
    // measuringStandardが変わるとcup/tbsp/tspの換算値が変わるため、依存配列に含めて表示単位を再計算させる（値自体は使わない）。
  }, [copy, language, locale, measuringStandard, result, targetUnit]);

  const comparisonRows = useMemo(() => {
    // measuringStandardが変わるとcup/tbsp/tspの換算値が変わるため、依存配列に含めて表を再計算させる（値自体は使わない）。
    void measuringStandard;
    return buildUnitComparisonRows(result ?? undefined, {
      unitSystem,
      hints: [targetUnit, expression, display?.si],
      activeUnit: targetUnit,
      locale,
    });
  }, [display, expression, locale, measuringStandard, result, targetUnit, unitSystem]);

  // 進数入力モード中の変換結果。expressionには接頭辞を含まない生の桁だけが入っている
  // （接頭辞は表示のときだけ足す）ので、パースにも接頭辞なしの生の桁をそのまま渡す。
  const baseInputParse = useMemo(
    () => (baseInputMode !== null ? parseBaseInput(expression, baseInputMode) : null),
    [baseInputMode, expression],
  );
  // 基数チップを出す条件は次の2つのどちらか（互いに排他なので衝突しない）:
  // ①式が空 → 入力モードを新しく始められる状態。②無次元の安全整数の結果があり、かつ表示単位が
  // 空 → 表示モードでその結果を別の基数で読み替えられる状態。表示単位が付いていると画面の数値と
  // siValueが食い違う（例: 200%は画面表示が200・siValueは2）ため、その場合はsiValueの基数表記を
  // 出さない（screen上の数値と矛盾する表記を避ける）。
  // 入力モード中は式が空でなくなる（FFなど）ため、モード中であることを条件に足さないと
  // 最初の1文字を打った瞬間にチップが消え、今どの基数で打っているのかも分からなくなる。
  const showBaseChips = baseInputMode !== null || !expression.trim() || (canRepresentInBase(result ?? undefined) && !targetUnit.trim());
  // 大きい数値の基数表示も上と同じ条件（無次元の安全整数・表示単位が空）でだけ行う。この条件を
  // 外すと、進数表示に切り替えた後に単位付きの式へ書き換えたときactiveBaseが10のまま残らず、
  // 単位付きの値を誤って基数表記してしまう。
  const resultBaseParts = useMemo(
    () => (result && activeBase !== 10 && canRepresentInBase(result) && !targetUnit.trim() ? formatInBaseParts(result.siValue, activeBase) : null),
    [activeBase, result, targetUnit],
  );

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
    const selectedTargetUnit = targetUnitOverride ?? targetUnit;
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
      setError(cause instanceof Error ? (unitErrorMessage(cause, language) ?? cause.message) : copy.expressionCalculationFailed);
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

  const pressKey = (key: string) => {
    markUserInteraction();
    if (key === "=") {
      if (baseInputMode !== null) {
        // 進数入力モードでは = は「計算の確定」ではなく「その基数の生の桁を10進の数値へ確定する」
        // 操作。変換できないとき（空・不正な桁）は何もしない。=を押すまでエラーを出さない
        // 通常の電卓の方針に合わせ、ここでもエラー表示はしない。
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
      return;
    }
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
      setTargetUnit("cm");
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
  };

  /**
   * 基数チップを押したときの効果。式が空なら「入力モードの切り替え」、そうでなければ
   * 「結果カードの大きい数値を描く基数（表示モード）の切り替え」になる（この2つは
   * 式が空かどうかで排他的に決まるので、同じチップ列を両方の用途に使い回せる）。
   */
  const pressBaseChip = (base: NumberBase) => {
    // 入力モード中に基数を切り替えると、打ち込み済みの桁が新しい基数では使えない文字を
    // 含みうる（FFのまま2進にするなど）。変換できない桁を残すと確定も解除もできない
    // 状態で固まるので、切り替えのタイミングで消す。
    if (baseInputMode !== null) {
      setExpression("");
      placeCaret(0);
      setBaseInputMode(base === 10 ? null : base);
      return;
    }
    if (!expression.trim()) {
      setBaseInputMode(base === 10 ? null : base);
      return;
    }
    setActiveBase(base);
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
    setExpression(nextExpression);
    placeCaret(nextExpression.length);
    setTargetUnit(nextUnit ?? "");
    setFixSelection(null);
    setError("");
    setNotice(copy.savedItemLoaded);
  }, [copy, language, presetExpression, presetUnit]);

  const applySample = (sample: SampleCalculation) => {
    markUserInteraction();
    const sampleTargetUnit = targetUnitForSample(sample);
    setExpression(sample.expression);
    placeCaret(sample.expression.length);
    setTargetUnit(sampleTargetUnit);
    setFixSelection(null);
    setError("");
    setNotice("");
    void calculate(sample.expression, sampleTargetUnit);
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
      await Clipboard.setStringAsync(`${expression} = ${display.value}\n${copy.siBase}: ${display.si}`);
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

  // 進数入力モード中は式が空のときだけ選択できる（DEC以外を押すとモード開始、DEC/ACで解除）。
  // それ以外（結果が無次元の安全整数かつ表示単位が空）は表示モードとして activeBase を切り替える。
  // どちらの状態も選択中の基数はこの1つの値で表せる（両立しないため）。
  const selectedBase = baseInputMode ?? activeBase;
  const baseChipsRow = showBaseChips ? (
    <View style={styles.baseChipRow}>
      {NUMBER_BASES.map((base) => (
        <Pressable
          accessibilityLabel={BASE_META[base].label}
          key={base}
          onPress={() => { markUserInteraction(); pressBaseChip(base); }}
          style={({ pressed }) => [styles.baseChip, selectedBase === base && styles.baseChipActive, pressed && styles.pressed]}
        >
          <Text style={[styles.baseChipText, selectedBase === base && styles.baseChipTextActive]}>{BASE_META[base].label}</Text>
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
                setExpression(text);
                setFixSelection(null);
                setError("");
                setNotice("");
              }}
              onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
              // 挿入直後だけキャレットを強制する。それ以外は selection を渡さず、
              // ユーザー自身のカーソル操作（タップ・ドラッグ選択）と競合しないようにする。
              selection={pendingSelection ?? undefined}
              onSubmitEditing={() => void calculate()}
              placeholder={copy.expressionPlaceholder}
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              accessibilityLabel={t("expression")}
              style={styles.expressionInput}
            />
            <Pressable accessibilityLabel={t("result")} onPress={() => void calculate()} style={({ pressed }) => [styles.calculateButton, pressed && styles.pressed]}>
              <Text style={styles.calculateText}>{copy.calculate}</Text>
            </Pressable>
          </View>

          {baseInputMode !== null ? (
            // 進数入力モード中は、16進の桁が単位・識別子として解析されて赤くなってしまうため、
            // 既存のanalyzeExpressionによるハイライトは使わず「接頭辞＋生の桁」を単純に描く。
            <View style={styles.previewRow}>
              <Text style={styles.previewIdentifier}>{BASE_META[baseInputMode].prefix}</Text>
              <Text style={styles.previewNumber}>{expression}</Text>
            </View>
          ) : expression.trim() ? (
            <View style={styles.previewRow}>
              {analysis.segments.map((segment, index) => {
                const isUnresolved = segment.kind === "unknown-unit" || segment.kind === "unknown-identifier";
                const style = segment.kind === "unit" ? styles.previewUnit
                  : isUnresolved ? styles.previewUnknown
                  : segment.kind === "identifier" ? styles.previewIdentifier
                  : segment.kind === "number" ? styles.previewNumber
                  : styles.previewOperator;
                if (!isUnresolved) return <Text key={`${segment.start}-${index}`} style={style}>{segment.text}</Text>;
                // 単位の書き間違いだけをタップで修正できるようにする。定数・関数の未定義参照は
                // 単位の候補を出しても意味がないため、見た目だけ知らせてタップ操作は付けない。
                if (segment.kind !== "unknown-unit") {
                  return (
                    <View key={`${segment.start}-${index}`} style={styles.previewUnknownWrap}>
                      <Text style={style}>{segment.text}</Text>
                      <IconSymbol name="exclamationmark.triangle.fill" size={11} color={colors.error} />
                    </View>
                  );
                }
                return (
                  <Pressable
                    accessibilityLabel={`${segment.text} ${copy.unknown}`}
                    key={`${segment.start}-${index}`}
                    onPress={() => setFixSelection({ start: segment.start, end: segment.end, text: segment.text })}
                    style={({ pressed }) => [styles.previewUnknownWrap, pressed && styles.pressed]}
                  >
                    <Text style={style}>{segment.text}</Text>
                    <IconSymbol name="exclamationmark.triangle.fill" size={11} color={colors.error} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}

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
          </View>

          {showInlineUnitSearch ? (
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
                  <Animated.Text numberOfLines={2} adjustsFontSizeToFit style={[styles.resultValue, resultAnimatedStyle]}>
                    {baseInputParse.value}
                  </Animated.Text>
                  {baseChipsRow}
                </>
              ) : baseInputMode === null && display ? (
                <>
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
                  <View style={styles.conversionRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.conversionRail} keyboardShouldPersistTaps="handled">
                      <Pressable accessibilityLabel={copy.noUnit} onPress={() => { markUserInteraction(); applyTargetUnit(""); }} style={({ pressed }) => [styles.convertChip, !targetUnit.trim() && styles.convertChipActive, pressed && styles.pressed]}>
                        <Text style={[styles.convertChipText, !targetUnit.trim() && styles.convertChipTextActive]}>SI</Text>
                      </Pressable>
                      {conversionUnits.map((symbol) => (
                        <Pressable accessibilityLabel={symbol} key={symbol} onPress={() => { markUserInteraction(); applyTargetUnit(symbol); }} style={({ pressed }) => [styles.convertChip, targetUnit.trim() === symbol && styles.convertChipActive, pressed && styles.pressed]}>
                          <Text style={[styles.convertChipText, targetUnit.trim() === symbol && styles.convertChipTextActive]}>{symbol}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    <Pressable accessibilityLabel={copy.outputUnit} onPress={() => openUnitPicker("target")} style={({ pressed }) => [styles.convertMore, pressed && styles.pressed]}>
                      <Text style={styles.convertMoreText}>{copy.more}</Text>
                      <IconSymbol name="chevron.right" size={11} color={colors.primary} />
                    </Pressable>
                  </View>
                  {baseChipsRow}
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
                  {targetUnit.trim() && targetUnitRegistration.status !== "registered" ? (
                    <Text style={styles.registrationNote}>{targetUnitRegistration.status === "supported" ? `${targetUnit} · ${copy.supported}` : `${targetUnit} · ${copy.unknown}`}</Text>
                  ) : null}
                  {display.error ? <Text style={styles.errorText}>{display.error}</Text> : null}
                </>
              ) : (
                // 通常の空状態と「進数入力モードだが変換できる桁がまだ無い（空・不正な桁）」の
                // どちらもここに来る。入力モード中はエラーを出さない方針なので文言は変えない。
                <>
                  <Text style={styles.emptyResult}>{copy.emptyResult}</Text>
                  {baseChipsRow}
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

        {/* 数学はキャレット位置への挿入だけで書きかけの式を壊さないので、キーパッドの一部に
            見えるデザインでキーパッド直上に置く（式を丸ごと置き換えるサンプルとは分ける）。 */}
        <View style={styles.keypadTools}>
          {isAdvancedMode ? (
            <Pressable onPress={() => setShowAdvancedKeys(true)} style={({ pressed }) => [styles.keypadToolButton, pressed && styles.pressed]}>
              <IconSymbol name="function" size={14} color={colors.primary} />
              <Text style={styles.keypadToolButtonText}>{copy.math}</Text>
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
        <View style={styles.modalBackdrop}><View style={styles.compactSheet}><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{copy.samples}</Text><Pressable accessibilityLabel={copy.close} onPress={() => setShowSamples(false)} style={styles.closeHelp}><IconSymbol name="xmark" size={20} color={colors.muted} /></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>{visibleSampleCategories.map((category) => <Pressable key={category.id} onPress={() => setSampleCategory(category.id)} style={({ pressed }) => [styles.categoryChip, sampleCategory === category.id && styles.categoryChipActive, pressed && styles.pressed]}><Text style={[styles.categoryChipText, sampleCategory === category.id && styles.categoryChipTextActive]}>{localizedText(category.label, language)}</Text></Pressable>)}</ScrollView><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>{visibleSamples.map((sample) => <Pressable key={sample.id} onPress={() => selectSample(sample)} style={({ pressed }) => [styles.sampleRow, pressed && styles.cardPressed]}><View style={styles.sampleCopy}><Text style={styles.sampleTitle}>{localizedText(sample.title, language)}</Text><Text style={styles.sampleDescription}>{localizedText(sample.description, language)}</Text></View><View style={styles.sampleExpressionWrap}><Text numberOfLines={1} style={styles.sampleExpression}>{sample.expression}</Text><Text style={styles.sampleTarget}>→ {targetUnitForSample(sample)}</Text></View></Pressable>)}</ScrollView></View></View>
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
                    <View style={styles.chips}>{searchSuggestions.map((suggestion) => renderUnitChip(suggestion, () => chooseUnit(suggestion.unit.symbol), targetUnit.trim() === suggestion.unit.symbol && unitPickerMode === "target"))}</View>
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
                          <View style={styles.chips}>{visibleGroupUnits(group).map((unitOption) => renderUnitChip({ group, unit: unitOption }, () => chooseUnit(unitOption.symbol), targetUnit.trim() === unitOption.symbol))}</View>
                        </View>
                      ))}
                    </>
                  ) : null}
                  <Text style={styles.pickerSectionLabel}>{unitGroupLabel(selectedInputGroup.id)}</Text>
                  <View style={styles.chips}>{selectedInputUnits.map((unitOption) => renderUnitChip({ group: selectedInputGroup, unit: unitOption }, () => chooseUnit(unitOption.symbol), unitPickerMode === "target" && targetUnit.trim() === unitOption.symbol))}</View>
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
  resultValue: { color: colors.primaryStrong, fontFamily: mono, fontSize: 28, fontWeight: "700", marginTop: 2, minHeight: 34 },
  emptyResult: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
  presetOutputUnit: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  presetOutputUnitLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  presetOutputUnitValueWrap: { alignItems: "center", flexDirection: "row", gap: 2 },
  presetOutputUnitValue: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },

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
  keypadTools: { flexDirection: "row", gap: 8 },
  keypadToolButton: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 5, justifyContent: "center", minHeight: 38, paddingHorizontal: 14 },
  keypadToolButtonText: { color: colors.primary, fontSize: 12, fontWeight: "800" },

  // 画面幅に関係なく必ず4列で並ぶよう、25%幅のセルに収める。
  keypad: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 },
  keyCell: { padding: 3, width: "25%" },
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
