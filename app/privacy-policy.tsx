import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";

// このポリシーは意図的に英語のみ（app/(tabs)/settings.tsx の "privacyPolicy" ラベルだけが
// アプリの言語に従い、本文はどの言語設定でも常に英語で出す）。法的文書を6言語に翻訳すると
// 誤訳のリスクと維持コストが見合わないため、Google Play/Appleの審査要件を満たす最小限の
// 単一言語版にした。内容は実際にコードへ組み込まれている挙動のみを記載しており、
// 未使用のまま残っているスキャフォールド（マイク権限・通知権限・OAuthログイン等）には
// 触れない（実際に発生しないデータ収集を書くとかえって不正確になるため）。
const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Overview",
    body: [
      "UnitCalc (\"the app\") is a unit-aware calculator. This policy explains what data the app handles and why.",
      "The app does not require you to create an account, and it never asks for your name, email address, or phone number. Everything you enter into the app stays on your device.",
      "The app does not operate its own server or user database. The only data that leaves your device is what the purchase and advertising providers described below need — device-generated and advertising identifiers, never your name or email address. See \"Purchases\" and \"Advertising\" for what each provider receives.",
    ],
  },
  {
    title: "Data stored on your device",
    body: [
      "Your calculation history, calculation notebooks, custom units, and preferences (language, unit system, theme, etc.) are stored only on your device, using local storage provided by the operating system.",
      "This data is never transmitted to us. You can remove it at any time by clearing the app's storage or uninstalling the app.",
      "If you use the optional backup/export feature, the resulting file is created and shared only through the share options you choose (for example, saving it or sending it yourself) — the app does not upload it anywhere on its own.",
    ],
  },
  {
    title: "Purchases",
    body: [
      "UnitCalc offers a one-time, non-subscription purchase (\"Pro\") that removes ads and unlocks additional features. Purchases are processed by Apple App Store or Google Play, and purchase status is managed through RevenueCat, our subscription/purchase infrastructure provider.",
      "RevenueCat receives a device-generated anonymous identifier and purchase/receipt data needed to verify your purchase. It does not receive your name or email address from this app.",
      "See RevenueCat's privacy policy at https://www.revenuecat.com/privacy for details on how it processes this data.",
    ],
  },
  {
    title: "Advertising",
    body: [
      "The free version of the app shows banner ads served by Google AdMob. If you purchase Pro (or redeem a code that removes ads), no ad SDK is initialized and no ads are shown.",
      "AdMob may use device and advertising identifiers to serve and measure ads. Where required (for example, in the EEA, UK, and Switzerland), the app shows a consent form (Google's User Messaging Platform) before requesting ads, and ads are only requested according to the choice you make there.",
      "You can review or reset your ad personalization choices in your device's settings (e.g. Settings > Privacy > Ads on Android/iOS). See Google's policies at https://policies.google.com/privacy and https://support.google.com/admob/answer/6128543 for details.",
      "Aggregate ad performance data (such as ad loads, impressions, and revenue) is also shared with RevenueCat to combine it with purchase reporting in a single dashboard. This data does not identify you personally.",
    ],
  },
  {
    title: "Analytics and crash reporting",
    body: [
      "The app does not include any analytics or crash-reporting SDK. We do not track your usage of the app or receive crash reports.",
    ],
  },
  {
    title: "Children's privacy",
    body: [
      "The app is not directed at children under 13, and we do not knowingly collect personal information from children.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "We may update this policy as the app changes. The \"Last updated\" date below reflects the most recent revision. Continued use of the app after a change constitutes acceptance of the updated policy.",
    ],
  },
  {
    title: "Contact",
    body: [
      "If you have questions about this policy, contact support@katahimo.com.",
    ],
  },
];

const LAST_UPDATED = "2026-09-09";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/settings"))}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <IconSymbol name="chevron.left" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: {LAST_UPDATED}</Text>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.body.map((paragraph, index) => (
              <Text key={index} style={styles.paragraph}>{paragraph}</Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", gap: 10, paddingBottom: 12, paddingTop: 8 },
  backButton: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 999, height: 36, justifyContent: "center", width: 36 },
  pressed: { opacity: 0.72 },
  headerTitle: { color: colors.foreground, fontSize: 18, fontWeight: "800" },
  content: { gap: 20, paddingBottom: 40 },
  lastUpdated: { color: colors.muted, fontSize: 12 },
  section: { gap: 8 },
  sectionTitle: { color: colors.foreground, fontSize: 15, fontWeight: "800" },
  paragraph: { color: colors.muted, fontSize: 13, lineHeight: 20 },
});
