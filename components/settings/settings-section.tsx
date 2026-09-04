import { ComponentProps, ReactNode, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";

type IconName = ComponentProps<typeof IconSymbol>["name"];

/**
 * 設定画面の折りたたみカード（全項目共通）。
 *
 * components/ui/collapsible.tsx は使わない。Expoテンプレート由来でNativeWindの
 * bg-backgroundクラスに依存しており、直前のPR #35でscreen-container.tsxから
 * 同じ理由（ネイティブのダークモード切替に追従しないことがある）で取り除いたばかりの
 * 問題を再び持ち込むことになるため。既存の設定画面と同じ StyleSheet + useColors(colors)
 * パターンで組む。
 *
 * 閉じている間もアイコンとタイトルは見えるようにし（何のカードか分かる）、初期状態は
 * 閉じておく（毎日は触らない項目なので開いたままにしない）。
 *
 * `value` はiOS設定アプリの「ラベル … 現在値 ›」の形を再現するためのprop。閉じた行だけで
 * 「今何が選ばれているか」が分かるようにする（開かないと分からないと折りたたみで情報が
 * 減ってしまうため）。狭い端末幅では長いラベルを2行に折り返し、
 * value側をflexShrinkで縮めて1行に収める（開閉矢印はどの行でも必ず見えるようにする）。
 */
export function SettingsSection({ title, icon, value, children }: { title: string; icon: IconName; value?: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const accessibilityLabel = value ? `${title}, ${value}` : title;
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={accessibilityLabel}
        onPress={() => setExpanded((prev) => !prev)}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <View style={styles.headerLeft}>
          <IconSymbol name={icon} size={20} color={colors.primary} />
          <Text numberOfLines={2} style={styles.label}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          {value ? <Text numberOfLines={1} style={styles.value}>{value}</Text> : null}
          <IconSymbol name={expanded ? "chevron.up" : "chevron.right"} size={18} color={colors.muted} />
        </View>
      </Pressable>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 16 },
  // ラベル側に残り幅を与え、長いタイトルは2行に折り返させる。独語の
  // "Vordefinierte Rechenhefte zurücksetzen" や日本語の「プリセットの計算ノートを初期状態に
  // 戻す」は狭い端末幅に1行で収まらず、ラベル側を縮めない指定にすると開閉矢印が画面外へ
  // 押し出されてしまう（矢印はどの行でも必ず見えている必要がある）。値と矢印の側は縮めず、
  // 値だけをnumberOfLines={1}で省略する（RNでTextを縮めて省略記号を出すには
  // flexShrink:1とminWidth:0の両方が必要）。
  headerLeft: { alignItems: "center", flex: 1, flexDirection: "row", gap: 10, minWidth: 0 },
  label: { color: colors.foreground, flexShrink: 1, fontSize: 15, fontWeight: "800", minWidth: 0 },
  headerRight: { alignItems: "center", flexDirection: "row", flexShrink: 0, gap: 8, justifyContent: "flex-end", maxWidth: "45%" },
  value: { color: colors.muted, flexShrink: 1, fontSize: 14, minWidth: 0, textAlign: "right" },
  pressed: { opacity: 0.72 },
  content: { borderColor: colors.border, borderTopWidth: 1, gap: 14, paddingBottom: 16, paddingHorizontal: 16, paddingTop: 14 },
});
