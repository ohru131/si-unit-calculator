import { useCallback, useMemo, useState } from "react";

import { isUnitGroupVisible, isUnitVisible } from "@/lib/advanced-display";
import { getPresetUnitExamples, resolveUnitContext, suggestCompanionUnits, type UnitExample } from "@/lib/unit-context-suggestions";
import {
  getPaletteUnitSuggestions,
  getPrefixedUnitSuggestions,
  getUnitInputHint,
  getUnitSuggestions,
  resolveActivePrefix,
  resolvePaletteTarget,
  resolvePrefixCompletionRange,
  type ExpressionAnalysis,
  type PrefixEntry,
  type UnitFilter,
  type UnitInputHint,
  type UnitInputHintKind,
  type UnitSuggestion,
} from "@/lib/unit-input";
import { UNIT_GROUPS, type UnitGroup, type UnitSystem } from "@/lib/units";

/** レールに並べる文脈依存の候補の上限。カテゴリを選んだときは絞らない（下の candidates の注記）。 */
export const UNIT_RAIL_LIMIT = 8;

export type UnitRailOptions = {
  /** 今編集している式。ノートは「編集中の欄の式」（名前 `m=` の部分は含めない）。 */
  expression: string;
  selection: { start: number; end: number };
  /** 式の中で定数として解決される名前。単位として解釈させないために解析へ渡す。 */
  identifiers: readonly string[];
  /** `analyzeExpression(expression, identifiers)` の結果。**呼び出し側が持っているものを渡す**
   * （電卓は入力欄の色分けのために毎打鍵これを作っているので、ここで作り直すと二重になる）。 */
  analysis: ExpressionAnalysis;
  unitSystem: UnitSystem;
  recentUnits?: readonly string[];
  /** 未対応単位をタップして「ここを直す」と指定した範囲（電卓のみ）。 */
  fixSelection?: { start: number; end: number; text: string } | null;
  /** 接頭語キーで入れた1文字の記録。渡さなければ接頭語の補完は働かない。 */
  prefixEntry?: PrefixEntry | null;
  /** 評価エラーから読めた「この位置に必要な次元」（requiredUnitGroupFromError）。 */
  requiredGroup?: string;
  /** 掛け算・割り算の相手を推測するための実例。電卓は計算履歴を渡す（プリセットより優先される）。 */
  recentExamples?: readonly UnitExample[];
  /** 進数入力中など、レールそのものを止めたいとき false。 */
  enabled?: boolean;
  isAdvancedMode?: boolean;
};

export type UnitRailState = {
  /** 接頭語キーで入れた1文字が「まだ単位を選んでいる途中」か。キーの点灯にも使う。 */
  activePrefix: string | null;
  hint: UnitInputHint;
  /** チップを押したときに書き換える範囲と、その操作の種類（ラベルもこれを見る）。 */
  target: { kind: UnitInputHintKind; start: number; end: number };
  /** カテゴリ行に並べる単位グループ。 */
  groups: readonly UnitGroup[];
  /** 選択中のカテゴリ。undefined なら文脈依存の「候補」。 */
  group: UnitGroup | undefined;
  candidates: UnitSuggestion[];
  scrollKey: string;
  isExpanded: boolean;
  setExpanded: (value: boolean) => void;
  selectGroup: (groupId: string | null) => void;
  reset: () => void;
  includeUnit: UnitFilter;
};

/**
 * 電卓と計算ノートが共用する単位パレットの状態。**UIは components/ui/unit-rail.tsx、
 * 判断はすべて lib/unit-input.ts の純関数**で、このフックはその2つを繋ぐだけに留める。
 *
 * 【なぜフックに切り出したか】以前は同じ役割のものが2つあり、電卓はカテゴリ行＋文脈依存の候補＋
 * 接頭語の補完を持つのに、計算ノートは `compatibleUnitOptions` の平らな一覧しか出せなかった
 * （「ノートではいろんな単位が選べない」と報告された）。片方だけに入る改良を無くすため、
 * 候補の出し方・置き換える範囲の決め方をここ1箇所に集める。
 *
 * 呼び出し側が渡すのは「式・キャレット・定数名」だけで、履歴や未対応単位のタップのように
 * 電卓にしか無いものは任意。渡さなければその分の絞り込みが効かないだけで、並びは壊れない。
 */
export function useUnitRail(options: UnitRailOptions): UnitRailState {
  const {
    analysis,
    enabled = true,
    expression,
    fixSelection = null,
    identifiers,
    isAdvancedMode = true,
    prefixEntry = null,
    recentExamples,
    recentUnits,
    requiredGroup,
    selection,
    unitSystem,
  } = options;

  // 選択中のカテゴリ。null は「文脈依存の候補」＝キャレット位置から推測した従来の並び。
  // **選んだカテゴリは単位を入れても解除しない**（同じカテゴリの単位を続けて入れるのが普通）。
  // 端末には保存しない（画面を開くたびに「候補」から始めてよい）。
  const [paletteGroupId, setPaletteGroupId] = useState<string | null>(null);
  // カテゴリの一覧を開いているか。**常時出しておかない**——一覧は単位を選ぶ一瞬しか触らないのに
  // 1行（約24px）を結果カードから奪い続ける。レール先頭のチップが今のカテゴリを示し、押すと開く。
  const [isExpanded, setExpanded] = useState(false);

  const includeUnit = useCallback<UnitFilter>(
    (group, unitOption) => isUnitGroupVisible(group, isAdvancedMode) && isUnitVisible(unitOption, isAdvancedMode),
    [isAdvancedMode],
  );
  const groups = useMemo(() => UNIT_GROUPS.filter((group) => isUnitGroupVisible(group, isAdvancedMode)), [isAdvancedMode]);

  const recentUnitList = useMemo(() => [...(recentUnits ?? [])], [recentUnits]);
  const expressionUnits = useMemo(
    () => analysis.segments.filter((segment) => segment.kind === "unit").map((segment) => segment.text),
    [analysis],
  );
  const caret = Math.min(selection.start, expression.length);

  // キャレット手前の演算子から「次に入れる単位」の手掛かりを読む。足し引きなら左と同じ次元、
  // 掛け算・割り算なら実例から一緒に使われる単位を引く（lib/unit-context-suggestions.ts）。
  const unitContext = useMemo(() => resolveUnitContext({ analysis, caret }), [analysis, caret]);
  const companionCandidates = useMemo(
    () => (unitContext?.operator === "multiplicative"
      ? suggestCompanionUnits({
        leftGroupId: unitContext.leftGroupId,
        recentExamples: recentExamples ? [...recentExamples] : [],
        corpusExamples: getPresetUnitExamples(),
        system: unitSystem,
        recentUnits: recentUnitList,
        limit: UNIT_RAIL_LIMIT,
        includeUnit,
      })
      : undefined),
    [includeUnit, recentExamples, recentUnitList, unitContext, unitSystem],
  );

  const activePrefix = useMemo(
    () => (enabled ? resolveActivePrefix(expression, selection, prefixEntry) : null),
    [enabled, expression, prefixEntry, selection],
  );

  const hint = useMemo<UnitInputHint>(() => {
    if (fixSelection) {
      return { kind: "fix", fragment: fixSelection.text, start: fixSelection.start, end: fixSelection.end, candidates: getUnitSuggestions(fixSelection.text, { system: unitSystem, limit: UNIT_RAIL_LIMIT, includeUnit }) };
    }
    // 接頭語キーを押した直後は、その1文字を単位として確定させずに「その接頭語で始まる単位」を出す。
    // 確定の範囲は直後に続く単位まで含める（`3|m` で k を押した `3km` に km を当てても `3kmm` に
    // ならない。詳細は resolvePrefixCompletionRange）。ラベル・target・挿入がすべてこの範囲を見る。
    if (prefixEntry && activePrefix) {
      const { start, end } = resolvePrefixCompletionRange(expression, prefixEntry);
      return {
        kind: "complete",
        fragment: expression.slice(start, end),
        start,
        end,
        // 候補は今の式の文脈へ寄せる（`12V / 4.7k` なら kΩ・kV を先に）。レールは8件しか
        // 並ばないので、km・kg が先に来ると目当ての単位が枠から落ちる。
        candidates: getPrefixedUnitSuggestions(prefixEntry.prefix, { system: unitSystem, limit: UNIT_RAIL_LIMIT, includeUnit, recentUnits: recentUnitList, contextUnits: expressionUnits }),
      };
    }
    // 足し引きの直後（`1m+`）は左側と同じ次元しか入らないので、エラーから読めた要求が無くても
    // 文脈から同じ答えを出せる（requiredUnitGroupFromError の上位互換）。
    const contextRequiredGroup = unitContext?.operator === "additive" ? unitContext.leftGroupId : undefined;
    return getUnitInputHint(expression, { system: unitSystem, recentUnits: recentUnitList, identifiers: [...identifiers], includeUnit, limit: UNIT_RAIL_LIMIT, analysis, caret, requiredGroup: requiredGroup ?? contextRequiredGroup, companionCandidates });
  }, [activePrefix, analysis, caret, companionCandidates, expression, expressionUnits, fixSelection, identifiers, includeUnit, prefixEntry, recentUnitList, requiredGroup, unitContext, unitSystem]);

  // 上級モードを切って選択中のカテゴリが一覧から消えると候補の並びに戻るので、**点灯・表示は
  // id ではなく解決後のグループを見る**（idだけ見ると実際の中身と食い違う）。
  const group = useMemo(
    () => (paletteGroupId ? groups.find((entry) => entry.id === paletteGroupId) : undefined),
    [groups, paletteGroupId],
  );

  // レールに並べる単位。カテゴリを選んでいるときはそのカテゴリの単位（接頭語を押していればその
  // 接頭語で始まるものだけ）、選んでいなければ hint の文脈依存の候補。**件数は絞らない**——
  // レールは横スクロールするので、カテゴリの単位を8件で打ち切ると「カテゴリを選んだのに目当ての
  // 単位が出てこない」ことになる。
  const candidates = useMemo(
    () => (group ? getPaletteUnitSuggestions(group, activePrefix ?? "", { system: unitSystem, includeUnit }) : hint.candidates),
    [activePrefix, group, hint.candidates, includeUnit, unitSystem],
  );

  // **並びが変わったらレールの横スクロールを先頭へ戻すための key。**
  // Androidの ScrollView は内容が縮んでも contentOffset をクランプしないので、候補の多い
  // カテゴリ（長さは11件）で右までスクロールしたあと候補の少ないカテゴリ（電圧は3件）へ
  // 切り替えると、範囲外に残ったオフセットのせいでレールが空に見え、指で戻せなくなる（実機で踏んだ）。
  const scrollKey = useMemo(() => candidates.map((suggestion) => suggestion.unit.symbol).join(","), [candidates]);

  // チップを押したときに書き換える範囲。カテゴリを選んでいる間は「式の中の最後の未解決の単位」
  // ではなくキャレット位置を優先する（詳細は resolvePaletteTarget）。
  const target = useMemo(
    () => resolvePaletteTarget({ hint, expression, caret, identifiers: [...identifiers], hasPaletteGroup: Boolean(group), analysis }),
    [analysis, caret, expression, group, hint, identifiers],
  );

  // 初期状態（文脈依存の「候補」＋一覧は閉じる）へ戻す。演算子キー・AC・=・式の丸ごと差し替えの
  // どれでも戻る先は同じなので、呼ぶ側が2つのstateを覚えずに済むよう1つにまとめてある
  // （片方だけ戻すと、開いたままの一覧が結果カードを覆い続ける）。
  const reset = useCallback(() => {
    setPaletteGroupId(null);
    setExpanded(false);
  }, []);
  // カテゴリを選んだ時点で一覧を閉じる——単位そのものは下のレールから選ぶので、開いたままに
  // しておく理由が無い。
  const selectGroup = useCallback((groupId: string | null) => {
    setPaletteGroupId(groupId);
    setExpanded(false);
  }, []);

  // 戻り値をメモ化して、レールの再描画を「本当に何かが変わったとき」だけにする
  // （UnitRail は memo なので、毎回新しいオブジェクトを返すとその memo が効かない）。
  return useMemo(
    () => ({ activePrefix, candidates, group, groups, hint, includeUnit, isExpanded, reset, scrollKey, selectGroup, setExpanded, target }),
    [activePrefix, candidates, group, groups, hint, includeUnit, isExpanded, reset, scrollKey, selectGroup, target],
  );
}
