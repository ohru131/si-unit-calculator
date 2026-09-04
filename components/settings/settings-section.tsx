import { ComponentProps, ReactNode, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";

type IconName = ComponentProps<typeof IconSymbol>["name"];

/**
 * 設定画面の折りたたみカード（めったに使わない・破壊的な項目用）。
 *
 * components/ui/collapsible.tsx は使わない。Expoテンプレート由来でNativeWindの
 * bg-backgroundクラスに依存しており、直前のPR #35でscreen-container.tsxから
 * 同じ理由（ネイティブのダークモード切替に追従しないことがある）で取り除いたばかりの
 * 問題を再び持ち込むことになるため。既存の設定画面と同じ StyleSheet + useColors(colors)
 * パターンで組む。
 *
 * 閉じている間もアイコンとタイトルは見えるようにし（何のカードか分かる）、初期状態は
 * 閉じておく（毎日は触らない項目なので開いたままにしない）。
 */
export function SettingsSection({ title, icon, children }: { title: string; icon: IconName; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
        onPress={() => setExpanded((prev) => !prev)}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <View style={styles.headerLeft}>
          <IconSymbol name={icon} size={20} color={colors.primary} />
          <Text style={styles.label}>{title}</Text>
        </View>
        <IconSymbol name={expanded ? "chevron.up" : "chevron.right"} size={18} color={colors.muted} />
      </Pressable>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 16 },
  headerLeft: { alignItems: "center", flexDirection: "row", gap: 10 },
  label: { color: colors.foreground, fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.72 },
  content: { borderColor: colors.border, borderTopWidth: 1, gap: 14, paddingBottom: 16, paddingHorizontal: 16, paddingTop: 14 },
});
