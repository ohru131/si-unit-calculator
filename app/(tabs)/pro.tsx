import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { useCalculatorStore } from "@/lib/calculator-store";
import { useGlobalSettings } from "@/lib/global-settings";
import { type AppLanguage } from "@/lib/i18n";
import { usePro } from "@/lib/revenuecat-provider";
import { UNIT_GROUPS } from "@/lib/units";

// featuresが[title, detail]の配列を持つため、値はstringに揃えられない。
// キーの集合と各値のシグネチャを揃えるためtypeof EN_COPYで言語ごとの形を要求する。
// featuresから「無制限の履歴」を外したのは、履歴の表示制限自体を撤廃して無料でも全件見えるように
// したから（app/(tabs)/index.tsx の visibleHistory）。全員が使えるものをProの特典として並べると
// 誇大表示になるので、履歴に関する行を書き戻さないこと。
const EN_COPY = {
  heroEyebrowActive: "PRO ACTIVE", heroEyebrowUpgrade: "UNIT CALCULATOR PRO",
  heroTitleActive: "You're on Pro", heroTitleUpgrade: "Calculate with more freedom.",
  heroTextActive: "All Pro features are enabled.", heroTextUpgrade: "One purchase unlocks everything below — yours forever, no subscription.",
  features: [
    ["Ad-free", "Hide the banner ads shown in the free version"],
    ["CSV export", "Export your calculation history as CSV for sharing or record-keeping"],
    ["My unit sets", "Save your frequently used units for faster input"],
    ["Notebook sharing", "Share a calculation notebook as a formatted document you can print or save as PDF"],
  ],
  actionTitle: "Upgrade to Pro", actionText: "Buy once and Pro unlocks permanently on this store account — no recurring charge. If you reinstall the app or switch devices, restore it below.",
  // priceLabelがまだ取得できていない間はbuyWithPriceを使えないので、価格なしの文言をunlockProとして別に持つ。
  buyWithPrice: (price: string) => `Unlock for ${price}`, unlockPro: "Unlock Pro",
  oneTimeNote: "One-time purchase — no recurring charge.", restorePurchase: "Restore purchase", restoreHint: "Reinstalled the app or switched devices? Restore your purchase here.",
  previewNote: "This is a web preview. Actual purchases are available in the iOS/Android store release.",
  activeTitle: "Pro features are available", activeText: "Enjoy an ad-free experience, with CSV export and your saved unit sets available from the calculator tab.",
  unitsTitle: "My unit sets", unitsText: "Units you select here appear in the unit input on the calculator tab.",
};
const COPY: Record<AppLanguage, typeof EN_COPY> = {
  en: EN_COPY,
  ja: {
    heroEyebrowActive: "PRO 利用中", heroEyebrowUpgrade: "単位付き電卓 PRO",
    heroTitleActive: "Proをご利用中です", heroTitleUpgrade: "計算を、もっと自在に。",
    heroTextActive: "Pro機能がすべて有効です。", heroTextUpgrade: "一度の購入で、下記すべてがずっと使えます。月額課金なし。",
    features: [
      ["広告非表示", "フリー版に表示されるバナー広告を非表示に"],
      ["CSVエクスポート", "計算履歴を共有・記録用のCSVとして出力"],
      ["マイ単位セット", "よく使う単位を保存し、入力を素早く"],
      ["計算ノートの書き出し", "計算ノートを整形された文書として共有し、印刷やPDF保存ができます"],
    ],
    actionTitle: "Proにアップグレード", actionText: "一度購入すると、このストアアカウントでProが永続的に使えるようになります（月額課金なし）。機種変更・再インストール後は下記から復元できます。",
    buyWithPrice: (price: string) => `${price} で買い切り購入`, unlockPro: "Proを購入",
    oneTimeNote: "買い切り・月額課金はありません。", restorePurchase: "購入を復元", restoreHint: "機種変更や再インストール後はこちらから復元できます。",
    previewNote: "現在はWebプレビューです。実購入はiOS／Androidのストア版でご利用いただけます。",
    activeTitle: "Pro機能を利用できます", activeText: "広告なしで、計算タブからCSVエクスポートと保存済みのマイ単位を利用できます。",
    unitsTitle: "マイ単位セット", unitsText: "よく使う単位を選択すると、計算タブの単位入力に表示されます。",
  },
  es: {
    heroEyebrowActive: "PRO ACTIVO", heroEyebrowUpgrade: "CALCULADORA DE UNIDADES PRO",
    heroTitleActive: "Tienes Pro", heroTitleUpgrade: "Calcula con más libertad.",
    heroTextActive: "Todas las funciones Pro están activadas.", heroTextUpgrade: "Una sola compra desbloquea todo esto, para siempre. Sin suscripción.",
    features: [
      ["Sin anuncios", "Oculta los anuncios en banner de la versión gratuita"],
      ["Exportación CSV", "Exporta tu historial de cálculos como CSV para compartir o archivar"],
      ["Mis conjuntos de unidades", "Guarda las unidades que usas con frecuencia para escribir más rápido"],
      ["Compartir cuadernos", "Comparte un cuaderno de cálculo como documento con formato para imprimir o guardar en PDF"],
    ],
    actionTitle: "Actualizar a Pro", actionText: "Compra una vez y Pro se desbloquea de forma permanente en esta cuenta de la tienda, sin cargos recurrentes. Si reinstalas la app o cambias de dispositivo, restáurala más abajo.",
    buyWithPrice: (price: string) => `Desbloquear por ${price}`, unlockPro: "Desbloquear Pro",
    oneTimeNote: "Compra única, sin cargos recurrentes.", restorePurchase: "Restaurar compra", restoreHint: "¿Reinstalaste la app o cambiaste de dispositivo? Restaura tu compra aquí.",
    previewNote: "Esto es una vista previa web. Las compras reales están disponibles en la versión de la tienda de iOS/Android.",
    activeTitle: "Las funciones Pro están disponibles", activeText: "Disfruta de una experiencia sin anuncios, con exportación CSV y tus conjuntos de unidades guardados disponibles desde la pestaña de la calculadora.",
    unitsTitle: "Mis conjuntos de unidades", unitsText: "Las unidades que selecciones aquí aparecerán en la entrada de unidades de la pestaña de la calculadora.",
  },
  "pt-BR": {
    heroEyebrowActive: "PRO ATIVO", heroEyebrowUpgrade: "CALCULADORA DE UNIDADES PRO",
    heroTitleActive: "Você tem o Pro", heroTitleUpgrade: "Calcule com mais liberdade.",
    heroTextActive: "Todos os recursos Pro estão ativados.", heroTextUpgrade: "Uma única compra desbloqueia tudo abaixo, para sempre. Sem assinatura.",
    features: [
      ["Sem anúncios", "Oculta os anúncios em banner exibidos na versão gratuita"],
      ["Exportação CSV", "Exporte seu histórico de cálculos como CSV para compartilhar ou arquivar"],
      ["Meus conjuntos de unidades", "Salve as unidades que você usa com frequência para digitar mais rápido"],
      ["Compartilhamento de cadernos", "Compartilhe um caderno de cálculo como documento formatado para imprimir ou salvar em PDF"],
    ],
    actionTitle: "Fazer upgrade para Pro", actionText: "Compre uma vez e o Pro é desbloqueado permanentemente nesta conta da loja, sem cobrança recorrente. Se reinstalar o app ou trocar de aparelho, restaure abaixo.",
    buyWithPrice: (price: string) => `Desbloquear por ${price}`, unlockPro: "Desbloquear o Pro",
    oneTimeNote: "Compra única, sem cobrança recorrente.", restorePurchase: "Restaurar compra", restoreHint: "Reinstalou o app ou trocou de aparelho? Restaure sua compra aqui.",
    previewNote: "Esta é uma prévia web. As compras reais estão disponíveis na versão da loja iOS/Android.",
    activeTitle: "Os recursos Pro estão disponíveis", activeText: "Aproveite uma experiência sem anúncios, com exportação CSV e seus conjuntos de unidades salvos disponíveis na aba da calculadora.",
    unitsTitle: "Meus conjuntos de unidades", unitsText: "As unidades selecionadas aqui aparecem na entrada de unidades da aba da calculadora.",
  },
  de: {
    heroEyebrowActive: "PRO AKTIV", heroEyebrowUpgrade: "EINHEITENRECHNER PRO",
    heroTitleActive: "Du hast Pro", heroTitleUpgrade: "Rechne mit mehr Freiheit.",
    heroTextActive: "Alle Pro-Funktionen sind aktiviert.", heroTextUpgrade: "Ein einziger Kauf schaltet alles hier unten frei — für immer, ohne Abo.",
    features: [
      ["Werbefrei", "Blendet die Banner-Werbung der kostenlosen Version aus"],
      ["CSV-Export", "Exportiert den Berechnungsverlauf als CSV zum Teilen oder Archivieren"],
      ["Meine Einheitensets", "Speichert häufig genutzte Einheiten für schnellere Eingabe"],
      ["Rechenhefte teilen", "Teile ein Rechenheft als formatiertes Dokument zum Drucken oder Speichern als PDF"],
    ],
    actionTitle: "Auf Pro upgraden", actionText: "Einmal kaufen, und Pro ist dauerhaft für dieses Store-Konto freigeschaltet — keine wiederkehrenden Kosten. Wenn du die App neu installierst oder das Gerät wechselst, kannst du weiter unten wiederherstellen.",
    buyWithPrice: (price: string) => `Für ${price} freischalten`, unlockPro: "Pro freischalten",
    oneTimeNote: "Einmalkauf — keine wiederkehrenden Kosten.", restorePurchase: "Kauf wiederherstellen", restoreHint: "App neu installiert oder Gerät gewechselt? Hier kannst du deinen Kauf wiederherstellen.",
    previewNote: "Dies ist eine Web-Vorschau. Echte Käufe sind in der iOS/Android-Store-Version verfügbar.",
    activeTitle: "Pro-Funktionen sind verfügbar", activeText: "Genieße eine werbefreie Nutzung mit CSV-Export und deinen gespeicherten Einheitensets im Rechner-Tab.",
    unitsTitle: "Meine Einheitensets", unitsText: "Hier ausgewählte Einheiten erscheinen bei der Einheiteneingabe im Rechner-Tab.",
  },
  fr: {
    heroEyebrowActive: "PRO ACTIF", heroEyebrowUpgrade: "CALCULATRICE D'UNITÉS PRO",
    heroTitleActive: "Vous avez Pro", heroTitleUpgrade: "Calculez avec plus de liberté.",
    heroTextActive: "Toutes les fonctionnalités Pro sont activées.", heroTextUpgrade: "Un seul achat débloque tout ci-dessous, pour toujours. Sans abonnement.",
    features: [
      ["Sans publicité", "Masque les bannières publicitaires affichées dans la version gratuite"],
      ["Export CSV", "Exporte l'historique des calculs en CSV pour le partager ou l'archiver"],
      ["Mes ensembles d'unités", "Enregistre les unités fréquemment utilisées pour une saisie plus rapide"],
      ["Partage des carnets", "Partagez un carnet de calcul sous forme de document mis en forme, à imprimer ou enregistrer en PDF"],
    ],
    actionTitle: "Passer à Pro", actionText: "Achetez une fois et Pro est débloqué de façon permanente sur ce compte de la boutique, sans frais récurrents. Si vous réinstallez l'application ou changez d'appareil, restaurez-le ci-dessous.",
    buyWithPrice: (price: string) => `Débloquer pour ${price}`, unlockPro: "Débloquer Pro",
    oneTimeNote: "Achat unique, sans frais récurrents.", restorePurchase: "Restaurer l'achat", restoreHint: "Application réinstallée ou nouvel appareil ? Restaurez votre achat ici.",
    previewNote: "Ceci est un aperçu web. Les achats réels sont disponibles dans la version du store iOS/Android.",
    activeTitle: "Les fonctionnalités Pro sont disponibles", activeText: "Profitez d'une expérience sans publicité, avec l'export CSV et vos ensembles d'unités enregistrés depuis l'onglet calculatrice.",
    unitsTitle: "Mes ensembles d'unités", unitsText: "Les unités sélectionnées ici apparaissent dans la saisie d'unités de l'onglet calculatrice.",
  },
};

export default function ProScreen() {
  const { favoriteUnits, toggleFavoriteUnit } = useCalculatorStore();
  const { isPro, isReady, isNativePurchaseAvailable, purchaseMessage, priceLabel, isPurchasing, purchasePro, restorePurchases, isProPreviewEnabled } = usePro();
  const { language, t } = useGlobalSettings();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const allUnits = UNIT_GROUPS.flatMap((group) => group.units);
  const copy = COPY[language];

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><IconSymbol name="crown.fill" size={32} color={colors.onPrimary} /></View>
          <Text style={styles.heroEyebrow}>{isPro ? copy.heroEyebrowActive : copy.heroEyebrowUpgrade}</Text>
          <Text style={styles.heroTitle}>{isPro ? copy.heroTitleActive : copy.heroTitleUpgrade}</Text>
          <Text style={styles.heroText}>{isPro ? copy.heroTextActive : copy.heroTextUpgrade}</Text>
        </View>

        {/* Web限定の隠しスイッチ（?pro=preview）でPro表示を有効にしている間、実購入と誤認しない
            よう常時出す。isProがtrueだと下のactionCard（previewNoteを含む）は出ずactiveCardに
            切り替わるため、previewNoteとは別にここで独立して出す。 */}
        {isProPreviewEnabled ? (
          <View style={styles.previewBanner}><Text style={styles.previewBannerText}>{t("proPreviewActive")}</Text></View>
        ) : null}

        <View style={styles.featuresCard}>
          {copy.features.map(([title, detail]) => (
            <View key={title} style={styles.featureRow}>
              <View style={styles.featureMark}><Text style={styles.featureMarkText}>✓</Text></View>
              <View style={styles.featureCopy}><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureDetail}>{detail}</Text></View>
            </View>
          ))}
        </View>

        {!isReady ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        {!isPro ? (
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>{copy.actionTitle}</Text>
            <Text style={styles.actionText}>{copy.actionText}</Text>
            {/* isPurchasing中は二重タップで二重購入が走らないよう両ボタンを無効化する */}
            <Pressable onPress={() => void purchasePro()} disabled={isPurchasing} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, isPurchasing && styles.disabledButton]}>
              {isPurchasing ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryButtonText}>{priceLabel ? copy.buyWithPrice(priceLabel) : copy.unlockPro}</Text>}
            </Pressable>
            <Text style={styles.oneTimeNote}>{copy.oneTimeNote}</Text>
            <Pressable onPress={() => void restorePurchases()} disabled={isPurchasing} style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed]}><Text style={styles.restoreText}>{copy.restorePurchase}</Text></Pressable>
            <Text style={styles.restoreHint}>{copy.restoreHint}</Text>
            {!isNativePurchaseAvailable ? <Text style={styles.previewNote}>{copy.previewNote}</Text> : null}
          </View>
        ) : (
          <View style={styles.activeCard}><Text style={styles.activeTitle}>{copy.activeTitle}</Text><Text style={styles.activeText}>{copy.activeText}</Text></View>
        )}
        {purchaseMessage ? <Text style={styles.message}>{purchaseMessage}</Text> : null}

        {isPro ? (
          <View style={styles.unitsCard}>
            <Text style={styles.unitsTitle}>{copy.unitsTitle}</Text>
            <Text style={styles.unitsText}>{copy.unitsText}</Text>
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
  previewBanner: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  previewBannerText: { color: colors.warning, fontSize: 12, fontWeight: "800", textAlign: "center" },
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
  disabledButton: { opacity: 0.6 },
  oneTimeNote: { color: colors.success, fontSize: 12, fontWeight: "700", marginTop: 8, textAlign: "center" },
  restoreButton: { alignItems: "center", marginTop: 12, paddingVertical: 8 },
  restoreText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  restoreHint: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 4, textAlign: "center" },
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
