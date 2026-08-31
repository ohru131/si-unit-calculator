import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { AppLanguage, CalculatorMode, useGlobalSettings } from "@/lib/global-settings";
import { MeasuringStandard, UnitSystem } from "@/lib/units";

export default function SettingsScreen() {
  const { calculatorMode, language, locale, measuringStandard, setCalculatorMode, setLanguage, setMeasuringStandard, t, unitSystem, setUnitSystem } = useGlobalSettings();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const languages: Array<{ id: AppLanguage; label: string }> = [{ id: "en", label: t("english") }, { id: "ja", label: t("japanese") }];
  const systems: Array<{ id: UnitSystem; label: string }> = [{ id: "metric", label: t("systemMetric") }, { id: "us", label: t("systemUS") }, { id: "uk", label: t("systemUK") }];
  const calculatorModes: Array<{ id: CalculatorMode; label: string }> = [{ id: "simple", label: t("simpleMode") }, { id: "advanced", label: t("advancedMode") }];
  const measuringStandards: Array<{ id: MeasuringStandard; label: string }> = [{ id: "us", label: t("standardUS") }, { id: "jis", label: t("standardJIS") }];

  return <ScreenContainer className="px-5" containerClassName="bg-background">
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Text style={styles.title}>{t("settings")}</Text><Text style={styles.subtitle}>{t("settingsSubtitle")}</Text></View>
      <View style={styles.card}>
        <Text style={styles.label}>{t("language")}</Text>
        <View style={styles.options}>{languages.map((option) => <Pressable accessibilityLabel={`${t("language")}: ${option.label}`} key={option.id} onPress={() => void setLanguage(option.id)} style={({ pressed }) => [styles.option, language === option.id && styles.optionActive, pressed && styles.pressed]}><Text style={[styles.optionText, language === option.id && styles.optionTextActive]}>{option.label}</Text></Pressable>)}</View>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>{t("units")}</Text>
        <Text style={styles.description}>{t("systemHint")}</Text>
        <View style={styles.systemList}>{systems.map((option) => <Pressable accessibilityLabel={`${t("units")}: ${option.label}`} key={option.id} onPress={() => void setUnitSystem(option.id)} style={({ pressed }) => [styles.systemRow, unitSystem === option.id && styles.systemRowActive, pressed && styles.pressed]}><View style={[styles.radio, unitSystem === option.id && styles.radioActive]}>{unitSystem === option.id ? <View style={styles.radioInner} /> : null}</View><Text style={styles.systemText}>{option.label}</Text></Pressable>)}</View>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>{t("measuringStandard")}</Text>
        <Text style={styles.description}>{t("measuringStandardHint")}</Text>
        <View style={styles.systemList}>{measuringStandards.map((option) => <Pressable accessibilityLabel={`${t("measuringStandard")}: ${option.label}`} key={option.id} onPress={() => void setMeasuringStandard(option.id)} style={({ pressed }) => [styles.systemRow, measuringStandard === option.id && styles.systemRowActive, pressed && styles.pressed]}><View style={[styles.radio, measuringStandard === option.id && styles.radioActive]}>{measuringStandard === option.id ? <View style={styles.radioInner} /> : null}</View><Text style={styles.systemText}>{option.label}</Text></Pressable>)}</View>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>{t("displayMode")}</Text>
        <Text style={styles.description}>{t("displayModeHint")}</Text>
        <View style={styles.options}>{calculatorModes.map((option) => <Pressable accessibilityLabel={`${t("displayMode")}: ${option.label}`} key={option.id} onPress={() => void setCalculatorMode(option.id)} style={({ pressed }) => [styles.option, calculatorMode === option.id && styles.optionActive, pressed && styles.pressed]}><Text style={[styles.optionText, calculatorMode === option.id && styles.optionTextActive]}>{option.label}</Text></Pressable>)}</View>
      </View>
      <View style={styles.card}>
        <View style={styles.a11yTitle}><IconSymbol name="accessibility" size={22} color={colors.primary} /><Text style={styles.label}>{t("accessibility")}</Text></View>
        <Text style={styles.description}>{t("accessibilityHint")}</Text>
      </View>
      <View style={styles.regionCard}><Text style={styles.regionLabel}>{t("region")}</Text><Text selectable style={styles.regionValue}>{locale}</Text></View>
    </ScrollView>
  </ScreenContainer>;
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  content: { gap: 14, paddingBottom: 30, paddingTop: 8 },
  header: { paddingBottom: 6 }, title: { color: colors.foreground, fontSize: 30, fontWeight: "700", letterSpacing: -0.6 }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: 16 }, label: { color: colors.foreground, fontSize: 15, fontWeight: "800" }, description: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7 },
  options: { flexDirection: "row", gap: 8, marginTop: 14 }, option: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 12, flex: 1, paddingVertical: 11 }, optionActive: { backgroundColor: colors.primaryFill }, optionText: { color: colors.muted, fontSize: 14, fontWeight: "700" }, optionTextActive: { color: colors.onPrimary },
  systemList: { gap: 8, marginTop: 15 }, systemRow: { alignItems: "center", borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", minHeight: 50, paddingHorizontal: 12 }, systemRowActive: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder }, systemText: { color: colors.foreground, fontSize: 14, fontWeight: "700", marginLeft: 10 },
  radio: { alignItems: "center", borderColor: colors.placeholder, borderRadius: 10, borderWidth: 1.5, height: 20, justifyContent: "center", width: 20 }, radioActive: { borderColor: colors.primary }, radioInner: { backgroundColor: colors.primary, borderRadius: 5, height: 10, width: 10 }, a11yTitle: { alignItems: "center", flexDirection: "row", gap: 8 },
  regionCard: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 14, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 15, paddingVertical: 13 }, regionLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" }, regionValue: { color: colors.primary, fontFamily: "monospace", fontSize: 13, fontWeight: "800" }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
