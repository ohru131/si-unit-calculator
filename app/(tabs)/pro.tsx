import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { useCalculatorStore } from "@/lib/calculator-store";
import { usePro } from "@/lib/revenuecat-provider";
import { UNIT_GROUPS } from "@/lib/units";

export default function ProScreen() {
  const { favoriteUnits, toggleFavoriteUnit } = useCalculatorStore();
  const { isPro, isReady, isNativePurchaseAvailable, purchaseMessage, presentPaywall, restorePurchases } = usePro();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const allUnits = UNIT_GROUPS.flatMap((group) => group.units);

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><IconSymbol name="crown.fill" size={32} color={colors.onPrimary} /></View>
          <Text style={styles.heroEyebrow}>{isPro ? "PRO ACTIVE" : "UNIT CALCULATOR PRO"}</Text>
          <Text style={styles.heroTitle}>{isPro ? "Proをご利用中です" : "計算を、もっと自在に。"}</Text>
          <Text style={styles.heroText}>{isPro ? "Pro機能がすべて有効です。" : "専門作業に必要な履歴・単位セット・エクスポートをひとつに。"}</Text>
        </View>

        <View style={styles.featuresCard}>
          {[['広告非表示', 'フリー版に表示されるバナー広告を非表示に'], ['無制限の履歴', '過去の計算を最大500件まで端末に保存'], ['CSVエクスポート', '計算履歴を共有・記録用のCSVとして出力'], ['マイ単位セット', 'よく使う単位を保存し、入力を素早く']].map(([title, detail]) => (
            <View key={title} style={styles.featureRow}>
              <View style={styles.featureMark}><Text style={styles.featureMarkText}>✓</Text></View>
              <View style={styles.featureCopy}><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureDetail}>{detail}</Text></View>
            </View>
          ))}
        </View>

        {!isReady ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        {!isPro ? (
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Proにアップグレード</Text>
            <Text style={styles.actionText}>月額・年額プランは、公開ストア版で安全に購入・復元できます。</Text>
            <Pressable onPress={() => void presentPaywall()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>Proプランを見る</Text></Pressable>
            <Pressable onPress={() => void restorePurchases()} style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed]}><Text style={styles.restoreText}>購入を復元</Text></Pressable>
            {!isNativePurchaseAvailable ? <Text style={styles.previewNote}>現在はWebプレビューです。実購入はiOS／Androidのストア版でご利用いただけます。</Text> : null}
          </View>
        ) : (
          <View style={styles.activeCard}><Text style={styles.activeTitle}>Pro機能を利用できます</Text><Text style={styles.activeText}>広告なしで、計算タブからCSVエクスポートと保存済みのマイ単位を利用できます。</Text></View>
        )}
        {purchaseMessage ? <Text style={styles.message}>{purchaseMessage}</Text> : null}

        {isPro ? (
          <View style={styles.unitsCard}>
            <Text style={styles.unitsTitle}>マイ単位セット</Text>
            <Text style={styles.unitsText}>よく使う単位を選択すると、計算タブの単位入力に表示されます。</Text>
            <View style={styles.unitsWrap}>
              {allUnits.map((unit) => {
                const selected = favoriteUnits.includes(unit.symbol);
                return <Pressable key={unit.symbol} onPress={() => void toggleFavoriteUnit(unit.symbol)} style={({ pressed }) => [styles.unitChip, selected && styles.unitChipSelected, pressed && styles.pressed]}><Text style={[styles.unitChipText, selected && styles.unitChipTextSelected]}>{selected ? "★ " : "☆ "}{unit.label}</Text></Pressable>;
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  content: { gap: 14, paddingBottom: 30, paddingTop: 8 },
  hero: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 24, paddingHorizontal: 25, paddingVertical: 27 },
  heroIcon: { alignItems: "center", backgroundColor: colors.warning, borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  heroEyebrow: { color: colors.primaryStrong, fontSize: 11, fontWeight: "800", letterSpacing: 1.1, marginTop: 12 },
  heroTitle: { color: colors.onPrimary, fontSize: 25, fontWeight: "800", letterSpacing: -0.4, marginTop: 7 },
  heroText: { color: colors.onPrimary, fontSize: 13, lineHeight: 20, marginTop: 7, opacity: 0.88, textAlign: "center" },
  featuresCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: 14, padding: 16 },
  featureRow: { flexDirection: "row" },
  featureMark: { alignItems: "center", backgroundColor: colors.successSurface, borderRadius: 11, height: 22, justifyContent: "center", marginRight: 10, width: 22 },
  featureMarkText: { color: colors.success, fontSize: 13, fontWeight: "800" },
  featureCopy: { flex: 1 },
  featureTitle: { color: colors.foreground, fontSize: 14, fontWeight: "800" },
  featureDetail: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 2 },
  loader: { marginVertical: 5 },
  actionCard: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 18, borderWidth: 1, padding: 17 },
  actionTitle: { color: colors.foreground, fontSize: 18, fontWeight: "800" },
  actionText: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
  primaryButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 12, marginTop: 16, paddingVertical: 13 },
  primaryButtonText: { color: colors.onPrimary, fontSize: 15, fontWeight: "800" },
  restoreButton: { alignItems: "center", marginTop: 12, paddingVertical: 8 },
  restoreText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  previewNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 8, textAlign: "center" },
  activeCard: { backgroundColor: colors.successSurface, borderColor: colors.successBorder, borderRadius: 18, borderWidth: 1, padding: 17 },
  activeTitle: { color: colors.success, fontSize: 17, fontWeight: "800" },
  activeText: { color: colors.foreground, fontSize: 13, lineHeight: 20, marginTop: 5 },
  message: { color: colors.error, fontSize: 12, lineHeight: 18, textAlign: "center" },
  unitsCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: 16 },
  unitsTitle: { color: colors.foreground, fontSize: 17, fontWeight: "800" },
  unitsText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  unitsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 13 },
  unitChip: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  unitChipSelected: { backgroundColor: colors.primaryFill },
  unitChipText: { color: colors.muted, fontFamily: "monospace", fontSize: 12, fontWeight: "700" },
  unitChipTextSelected: { color: colors.onPrimary },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
