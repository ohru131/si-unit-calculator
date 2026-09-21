import { memo, useMemo, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { type UnitRailState } from "@/hooks/use-unit-rail";
import { useGlobalSettings } from "@/lib/global-settings";
import { localizedText, type AppLanguage } from "@/lib/i18n";
import { type UnitSuggestion } from "@/lib/unit-input";

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_COPY = {
  paletteAuto: "Suggested", searchTitle: "Search a unit to insert", searchShort: "Search",
  noCandidates: "No candidate found. Check the symbol.",
  hintFix: "Fix", hintComplete: "Finish", hintAttach: "Add unit", hintReplace: "Replace unit", hintInsert: "Insert",
} as const;
const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = {
  en: EN_COPY,
  ja: {
    paletteAuto: "候補", searchTitle: "単位を検索して入力", searchShort: "検索",
    noCandidates: "候補が見つかりません。記号を確認してください。",
    hintFix: "要修正", hintComplete: "確定", hintAttach: "単位付け", hintReplace: "単位を置換", hintInsert: "単位挿入",
  },
  es: {
    paletteAuto: "Sugeridas", searchTitle: "Buscar una unidad para insertar", searchShort: "Buscar",
    noCandidates: "No se encontró ningún candidato. Revisa el símbolo.",
    hintFix: "Corregir", hintComplete: "Completar", hintAttach: "Añadir", hintReplace: "Sustituir", hintInsert: "Insertar",
  },
  "pt-BR": {
    paletteAuto: "Sugeridas", searchTitle: "Buscar uma unidade para inserir", searchShort: "Buscar",
    noCandidates: "Nenhum candidato encontrado. Verifique o símbolo.",
    hintFix: "Corrigir", hintComplete: "Concluir", hintAttach: "Adicionar", hintReplace: "Substituir", hintInsert: "Inserir",
  },
  de: {
    paletteAuto: "Vorschläge", searchTitle: "Einheit suchen und einfügen", searchShort: "Suchen",
    noCandidates: "Kein Vorschlag gefunden. Prüfe das Symbol.",
    hintFix: "Beheben", hintComplete: "Fertig", hintAttach: "Anfügen", hintReplace: "Ersetzen", hintInsert: "Einfügen",
  },
  fr: {
    paletteAuto: "Suggestions", searchTitle: "Rechercher une unité à insérer", searchShort: "Rechercher",
    noCandidates: "Aucun candidat trouvé. Vérifiez le symbole.",
    hintFix: "Corriger", hintComplete: "Terminer", hintAttach: "Ajouter", hintReplace: "Remplacer", hintInsert: "Insérer",
  },
};

type Props = {
  language: AppLanguage;
  /** useUnitRail() の戻り値をそのまま渡す。 */
  state: UnitRailState;
  /** チップを押したとき。書き換える範囲は state.target（呼び出し側はそれを見て式を差し替える）。 */
  onApply: (symbol: string) => void;
  /** 綴りで探す入口。渡さなければ検索チップを出さない（シートを持たない画面向け）。 */
  onOpenSearch?: () => void;
  /** レールの右端に置く追加のボタン（電卓の進数入力の入口）。 */
  trailing?: ReactNode;
  /** キーパッドの直上に置くときの下余白。 */
  bottomGap?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * 電卓と計算ノートが共用する単位パレット。上段がカテゴリ一覧（開いているときだけ）、下段が
 * 「今のカテゴリ＋押したときに起きること」の2段チップと、単位の候補レール。
 *
 * 【なぜこの形か】Androidでは式の入力欄をタップしてもOSのキーボードが上がらないことがあり、
 * 単位を「打って探す」経路が当てにできない。カテゴリ → 単位の2タップで必ず入れられるこの行に
 * 一本化してある。カテゴリ一覧を常時出さないのは、触るのは一瞬なのに1行（約24px）を結果カードや
 * ノート本文から奪い続けるため。
 *
 * 【共通化の理由】以前は計算ノート側が「この値に合う単位」の平らな一覧しか出せず、カテゴリも
 * 文脈依存の候補も接頭語の補完も無かった（「ノートではいろんな単位が選べない」と報告された）。
 * 候補の出し方は hooks/use-unit-rail.ts、判断は lib/unit-input.ts の純関数に寄せてあるので、
 * 片方の画面にだけ入る改良が生まれない。
 */
export const UnitRail = memo(function UnitRail({ bottomGap, language, onApply, onOpenSearch, state, style, trailing }: Props) {
  const colors = useColors();
  const { unitGroupLabel } = useGlobalSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = COPY[language];

  const suggestionLabel = (suggestion: UnitSuggestion) =>
    (suggestion.unit.name ? localizedText(suggestion.unit.name, language) : undefined) ?? unitGroupLabel(suggestion.group.id);

  const categoryLabel = state.group ? unitGroupLabel(state.group.id) : copy.paletteAuto;
  const hintLabel = state.target.kind === "fix" ? copy.hintFix
    : state.target.kind === "complete" ? copy.hintComplete
      : state.target.kind === "attach" ? copy.hintAttach
        : state.target.kind === "replace" ? copy.hintReplace
          : copy.hintInsert;

  return (
    <View style={[styles.root, bottomGap === undefined ? null : { marginBottom: bottomGap }, style]}>
      {state.isExpanded ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail} keyboardShouldPersistTaps="handled">
          {/* 綴りで探す入口。カテゴリを辿るより早いとき用で、選んだ単位はレールのチップと同じ
              経路でキャレット位置へ挿す。 */}
          {onOpenSearch ? (
            <Pressable
              accessibilityLabel={copy.searchTitle}
              onPress={() => { state.setExpanded(false); onOpenSearch(); }}
              style={({ pressed }) => [styles.categoryChip, styles.searchChip, pressed && styles.pressed]}
            >
              <IconSymbol name="magnifyingglass" size={12} color={colors.primary} />
              <Text style={[styles.categoryChipText, styles.searchChipText]}>{copy.searchShort}</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityState={{ selected: !state.group }}
            onPress={() => state.selectGroup(null)}
            style={({ pressed }) => [styles.categoryChip, !state.group && styles.categoryChipActive, pressed && styles.pressed]}
          >
            <Text style={[styles.categoryChipText, !state.group && styles.categoryChipTextActive]}>{copy.paletteAuto}</Text>
          </Pressable>
          {state.groups.map((group) => (
            <Pressable
              accessibilityState={{ selected: state.group?.id === group.id }}
              key={group.id}
              onPress={() => state.selectGroup(group.id)}
              style={({ pressed }) => [styles.categoryChip, state.group?.id === group.id && styles.categoryChipActive, pressed && styles.pressed]}
            >
              <Text style={[styles.categoryChipText, state.group?.id === group.id && styles.categoryChipTextActive]}>{unitGroupLabel(group.id)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.hintRow}>
        {/* レール先頭のカテゴリチップ。上段は今のカテゴリ、下段は押したときに起きること
            （修正・単位付け・差し替えの区別。カテゴリを選んでも変わらない）。2つを1枚にまとめたのは、
            レールの左に固定幅のラベルとカテゴリ行の両方を置くと候補を並べる幅が足りなくなるため。 */}
        <Pressable
          accessibilityLabel={`${categoryLabel}, ${hintLabel}`}
          accessibilityState={{ expanded: state.isExpanded }}
          onPress={() => state.setExpanded(!state.isExpanded)}
          style={({ pressed }) => [styles.paletteToggle, state.isExpanded && styles.paletteToggleActive, pressed && styles.pressed]}
        >
          <View style={styles.paletteToggleLabels}>
            <Text numberOfLines={1} style={styles.paletteToggleTitle}>{categoryLabel}</Text>
            <Text numberOfLines={1} style={[styles.paletteToggleHint, state.target.kind === "fix" && styles.paletteToggleHintAlert]}>{hintLabel}</Text>
          </View>
          <IconSymbol name={state.isExpanded ? "chevron.up" : "chevron.down"} size={12} color={colors.muted} />
        </Pressable>
        {state.candidates.length ? (
          // key は候補の記号列（use-unit-rail.ts の scrollKey の注記を参照）。候補が入れ替わった
          // ときだけ ScrollView を作り直して、範囲外に残った横スクロール位置を捨てる。
          <ScrollView
            contentContainerStyle={styles.hintRail}
            horizontal
            key={state.scrollKey}
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
          >
            {state.candidates.map((suggestion) => (
              <Pressable
                accessibilityLabel={`${suggestion.unit.symbol} ${suggestionLabel(suggestion)}`}
                key={`${suggestion.group.id}-${suggestion.unit.symbol}`}
                onPress={() => onApply(suggestion.unit.symbol)}
                style={({ pressed }) => [styles.unitChip, pressed && styles.pressed]}
              >
                <Text style={styles.unitChipSymbol}>{suggestion.unit.symbol}</Text>
                <Text numberOfLines={1} style={styles.unitChipName}>{suggestionLabel(suggestion)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.hintEmpty}>{copy.noCandidates}</Text>
        )}
        {trailing}
      </View>
    </View>
  );
});

// 単位チップの見た目は app/(tabs)/index.tsx の単位ピッカーのシート（renderUnitChip）と同じ値。
// あちらは点灯（表示単位）の状態を持つのでこの部品には寄せていない。片方だけ変えないこと。
const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  root: { gap: 4 },
  categoryRail: { alignItems: "center", gap: 6, paddingRight: 4 },
  categoryChip: { backgroundColor: colors.surfaceSecondary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  categoryChipActive: { backgroundColor: colors.primaryFill },
  categoryChipText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  categoryChipTextActive: { color: colors.onPrimary },
  searchChip: { alignItems: "center", backgroundColor: colors.primarySurface, flexDirection: "row", gap: 4 },
  searchChipText: { color: colors.primary },
  hintRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  hintRail: { alignItems: "center", gap: 6, paddingRight: 4 },
  hintEmpty: { color: colors.muted, flex: 1, fontSize: 11 },
  paletteToggle: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 12, flexDirection: "row", flexShrink: 0, gap: 2, maxWidth: 96, paddingHorizontal: 8, paddingVertical: 3 },
  paletteToggleActive: { backgroundColor: colors.primarySurface },
  paletteToggleLabels: { flexShrink: 1 },
  paletteToggleTitle: { color: colors.text, fontSize: 11, fontWeight: "800" },
  paletteToggleHint: { color: colors.muted, fontSize: 9, fontWeight: "700" },
  paletteToggleHintAlert: { color: colors.error },
  unitChip: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 10, borderWidth: 1, minWidth: 46, paddingHorizontal: 9, paddingVertical: 4 },
  unitChipSymbol: { color: colors.primary, fontFamily: mono, fontSize: 13, fontWeight: "800" },
  unitChipName: { color: colors.muted, fontSize: 9, maxWidth: 92 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
