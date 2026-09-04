import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { BackupCard } from "@/components/settings/backup-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { useAds } from "@/lib/ads-provider";
import { useCalculatorStore } from "@/lib/calculator-store";
import { customUnitErrorMessage } from "@/lib/custom-unit-messages";
import { parseCustomUnit } from "@/lib/custom-units";
import { useGlobalSettings } from "@/lib/global-settings";
import { APP_LANGUAGES, LANGUAGE_META } from "@/lib/i18n";
import { type ThemePreference, useThemeContext } from "@/lib/theme-provider";
import { MeasuringStandard, UnitSystem } from "@/lib/units";

export default function SettingsScreen() {
  const { language, locale, measuringStandard, setLanguage, setMeasuringStandard, t, unitSystem, setUnitSystem } = useGlobalSettings();
  const { themePreference, setThemePreference } = useThemeContext();
  const { adFree, isAdsPlatformAvailable, redeemMessage, redeemCode } = useAds();
  const { resetPresetNotebooks, customUnits, saveCustomUnit, deleteCustomUnit, constants } = useCalculatorStore();
  const [redeemInput, setRedeemInput] = useState("");
  const [customUnitSymbol, setCustomUnitSymbol] = useState("");
  const [customUnitDefinition, setCustomUnitDefinition] = useState("");
  const [customUnitError, setCustomUnitError] = useState("");
  // プリセットの計算ノートを初期状態に戻す操作は破壊的（ユーザーの編集を破棄する）ため、
  // 既存のバックアップ画面（app/(tabs)/constants.tsx）の置き換えインポートと同じく
  // ConfirmDialogで確認を挟む。
  const [pendingResetPresets, setPendingResetPresets] = useState(false);
  const [resetPresetsNotice, setResetPresetsNotice] = useState("");
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // 言語名はその言語自身の表記(endonym)で出す。翻訳キーを言語数の2乗で増やさずに済むし、
  // 「英語UIしか読めない状態でも自分の言語を見つけられる」ため。
  const languages = APP_LANGUAGES.map((id) => ({ id, label: LANGUAGE_META[id].endonym }));
  const systems: { id: UnitSystem; label: string }[] = [{ id: "metric", label: t("systemMetric") }, { id: "us", label: t("systemUS") }, { id: "uk", label: t("systemUK") }];
  const themeOptions: { id: ThemePreference; label: string }[] = [{ id: "system", label: t("themeSystem") }, { id: "light", label: t("themeLight") }, { id: "dark", label: t("themeDark") }];
  const measuringStandards: { id: MeasuringStandard; label: string }[] = [{ id: "us", label: t("standardUS") }, { id: "jis", label: t("standardJIS") }];

  const confirmResetPresets = async () => {
    setPendingResetPresets(false);
    // AsyncStorageへの書き込みは失敗しうる。catchしないと未処理のPromise拒否になるうえ、
    // 完了メッセージも出ないまま「押したのに何も起きない」状態になってしまう。
    try {
      await resetPresetNotebooks();
      setResetPresetsNotice(t("resetPresetsDone"));
    } catch {
      setResetPresetsNotice(t("backupGenericError"));
    }
  };

  // エラー時は入力を消さない: ユーザーが定義式を打ち間違えた場合に、直しやすいよう
  // 入力内容をそのまま残す（symbolTaken等では記号だけ直せばよい）。保存自体
  // （AsyncStorageへの書き込み）が失敗したときも同じ方針で、入力を消さずにエラーを出す。
  const handleAddCustomUnit = async () => {
    const result = parseCustomUnit(customUnitSymbol, customUnitDefinition, {
      existingSymbols: customUnits.map((unit) => unit.symbol),
      constants,
    });
    if (result.status === "error") {
      setCustomUnitError(customUnitErrorMessage(result.code, language));
      return;
    }
    try {
      await saveCustomUnit(result.unit);
    } catch {
      setCustomUnitError(t("customUnitSaveFailed"));
      return;
    }
    setCustomUnitError("");
    setCustomUnitSymbol("");
    setCustomUnitDefinition("");
  };

  // 削除も保存と同じくAsyncStorageへの書き込みを伴うため、失敗しうる。握りつぶすと
  // 一覧からは消えて見えるのに次回起動で復活する、という食い違いになるのでエラーを出す。
  const handleDeleteCustomUnit = async (symbol: string) => {
    try {
      await deleteCustomUnit(symbol);
      setCustomUnitError("");
    } catch {
      setCustomUnitError(t("customUnitSaveFailed"));
    }
  };

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
        <View style={styles.systemList}>{measuringStandards.map((option) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: measuringStandard === option.id }} accessibilityLabel={`${t("measuringStandard")}: ${option.label}`} key={option.id} onPress={() => void setMeasuringStandard(option.id)} style={({ pressed }) => [styles.systemRow, measuringStandard === option.id && styles.systemRowActive, pressed && styles.pressed]}><View style={[styles.radio, measuringStandard === option.id && styles.radioActive]}>{measuringStandard === option.id ? <View style={styles.radioInner} /> : null}</View><Text style={styles.systemText}>{option.label}</Text></Pressable>)}</View>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>{t("customUnits")}</Text>
        <Text style={styles.description}>{t("customUnitsHint")}</Text>
        <View style={styles.customUnitInputRow}>
          <TextInput
            value={customUnitSymbol}
            onChangeText={setCustomUnitSymbol}
            placeholder={t("customUnitSymbolPlaceholder")}
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={t("customUnitSymbolPlaceholder")}
            style={styles.customUnitSymbolInput}
          />
          <TextInput
            value={customUnitDefinition}
            onChangeText={setCustomUnitDefinition}
            placeholder={t("customUnitDefinitionPlaceholder")}
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={t("customUnitDefinitionPlaceholder")}
            style={styles.customUnitDefinitionInput}
          />
        </View>
        <Pressable
          disabled={!customUnitSymbol.trim() || !customUnitDefinition.trim()}
          onPress={() => void handleAddCustomUnit()}
          style={({ pressed }) => [styles.resetButton, styles.customUnitAddButton, (!customUnitSymbol.trim() || !customUnitDefinition.trim()) && styles.redeemButtonDisabled, pressed && styles.pressed]}
        >
          <Text style={styles.customUnitAddButtonText}>{t("customUnitAdd")}</Text>
        </Pressable>
        {customUnitError ? <Text style={styles.customUnitErrorText}>{customUnitError}</Text> : null}
        {customUnits.length ? (
          <View style={styles.customUnitList}>
            {customUnits.map((unit) => (
              <View key={unit.symbol} style={styles.customUnitRow}>
                <Text style={styles.customUnitRowText}>{unit.symbol} = {unit.expression}</Text>
                <Pressable
                  accessibilityLabel={`${t("customUnitDelete")}: ${unit.symbol}`}
                  onPress={() => void handleDeleteCustomUnit(unit.symbol)}
                  style={({ pressed }) => [styles.customUnitDeleteButton, pressed && styles.pressed]}
                >
                  <Text style={styles.customUnitDeleteButtonText}>{t("customUnitDelete")}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.description}>{t("customUnitEmpty")}</Text>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>{t("theme")}</Text>
        <Text style={styles.description}>{t("themeHint")}</Text>
        <View style={styles.options}>{themeOptions.map((option) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: themePreference === option.id }} accessibilityLabel={`${t("theme")}: ${option.label}`} key={option.id} onPress={() => setThemePreference(option.id)} style={({ pressed }) => [styles.option, themePreference === option.id && styles.optionActive, pressed && styles.pressed]}><Text style={[styles.optionText, themePreference === option.id && styles.optionTextActive]}>{option.label}</Text></Pressable>)}</View>
      </View>
      {isAdsPlatformAvailable ? (
        <View style={styles.card}>
          <Text style={styles.label}>{t("adsTitle")}</Text>
          <Text style={styles.description}>{adFree ? t("adsFreeActive") : t("adsHint")}</Text>
          {!adFree ? (
            <>
              <Pressable onPress={() => router.push("/pro")} style={({ pressed }) => [styles.upgradeButton, pressed && styles.pressed]}>
                <Text style={styles.upgradeButtonText}>{t("adsUpgrade")}</Text>
              </Pressable>
              <View style={styles.redeemRow}>
                <TextInput
                  value={redeemInput}
                  onChangeText={setRedeemInput}
                  placeholder={t("adsRedeemPlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.redeemInput}
                />
                <Pressable
                  disabled={!redeemInput.trim()}
                  onPress={() => { void redeemCode(redeemInput); setRedeemInput(""); }}
                  style={({ pressed }) => [styles.redeemButton, !redeemInput.trim() && styles.redeemButtonDisabled, pressed && styles.pressed]}
                >
                  <Text style={styles.redeemButtonText}>{t("adsRedeemButton")}</Text>
                </Pressable>
              </View>
              {redeemMessage ? <Text style={styles.redeemMessage}>{redeemMessage}</Text> : null}
            </>
          ) : null}
        </View>
      ) : null}
      <View style={styles.card}>
        <View style={styles.a11yTitle}><IconSymbol name="accessibility" size={22} color={colors.primary} /><Text style={styles.label}>{t("accessibility")}</Text></View>
        <Text style={styles.description}>{t("accessibilityHint")}</Text>
      </View>
      <BackupCard />
      <View style={styles.card}>
        <Text style={styles.label}>{t("resetPresetsTitle")}</Text>
        <Text style={styles.description}>{t("resetPresetsHint")}</Text>
        <Pressable onPress={() => setPendingResetPresets(true)} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
          <Text style={styles.resetButtonText}>{t("resetPresetsButton")}</Text>
        </Pressable>
        {resetPresetsNotice ? <Text style={styles.description}>{resetPresetsNotice}</Text> : null}
      </View>
      <View style={styles.regionCard}><Text style={styles.regionLabel}>{t("region")}</Text><Text selectable style={styles.regionValue}>{locale}</Text></View>
    </ScrollView>
    <ConfirmDialog
      visible={pendingResetPresets}
      title={t("resetPresetsTitle")}
      message={t("resetPresetsConfirmMessage")}
      cancelLabel={t("cancel")}
      confirmLabel={t("resetPresetsButton")}
      destructive
      onCancel={() => setPendingResetPresets(false)}
      onConfirm={() => void confirmResetPresets()}
    />
  </ScreenContainer>;
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  content: { gap: 14, paddingBottom: 30, paddingTop: 8 },
  header: { paddingBottom: 6 }, title: { color: colors.foreground, fontSize: 22, fontWeight: "700", letterSpacing: -0.5 }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: 16 }, label: { color: colors.foreground, fontSize: 15, fontWeight: "800" }, description: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7 },
  // 言語が増えるとチップが横に溢れるため折り返す（6言語だと確実に溢れる）。
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }, option: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 12, flex: 1, paddingVertical: 11 }, optionActive: { backgroundColor: colors.primaryFill }, optionText: { color: colors.muted, fontSize: 14, fontWeight: "700" }, optionTextActive: { color: colors.onPrimary },
  systemList: { gap: 8, marginTop: 15 }, systemRow: { alignItems: "center", borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", minHeight: 50, paddingHorizontal: 12 }, systemRowActive: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder }, systemText: { color: colors.foreground, fontSize: 14, fontWeight: "700", marginLeft: 10 },
  radio: { alignItems: "center", borderColor: colors.placeholder, borderRadius: 10, borderWidth: 1.5, height: 20, justifyContent: "center", width: 20 }, radioActive: { borderColor: colors.primary }, radioInner: { backgroundColor: colors.primary, borderRadius: 5, height: 10, width: 10 }, a11yTitle: { alignItems: "center", flexDirection: "row", gap: 8 },
  regionCard: { alignItems: "center", backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, borderRadius: 14, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 15, paddingVertical: 13 }, regionLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" }, regionValue: { color: colors.primary, fontFamily: "monospace", fontSize: 13, fontWeight: "800" }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  upgradeButton: { alignItems: "center", backgroundColor: colors.primaryFill, borderRadius: 12, marginTop: 14, paddingVertical: 11 }, upgradeButtonText: { color: colors.onPrimary, fontSize: 14, fontWeight: "800" },
  redeemRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  redeemInput: { borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.foreground, flex: 1, fontSize: 14, paddingHorizontal: 12, paddingVertical: 10 },
  redeemButton: { alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 12, justifyContent: "center", paddingHorizontal: 14 }, redeemButtonDisabled: { opacity: 0.5 }, redeemButtonText: { color: colors.foreground, fontSize: 13, fontWeight: "700" },
  redeemMessage: { color: colors.muted, fontSize: 12, marginTop: 8 },
  resetButton: { alignItems: "center", backgroundColor: colors.errorSurface, borderColor: colors.errorBorder, borderRadius: 12, borderWidth: 1, marginTop: 14, paddingVertical: 11 }, resetButtonText: { color: colors.error, fontSize: 14, fontWeight: "800" },
  customUnitInputRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  customUnitSymbolInput: { borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.foreground, flex: 1, fontSize: 14, paddingHorizontal: 12, paddingVertical: 10 },
  customUnitDefinitionInput: { borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.foreground, flex: 2, fontSize: 14, paddingHorizontal: 12, paddingVertical: 10 },
  customUnitAddButton: { backgroundColor: colors.primaryFill, borderWidth: 0 }, customUnitAddButtonText: { color: colors.onPrimary, fontSize: 14, fontWeight: "800" },
  customUnitErrorText: { color: colors.error, fontSize: 12, marginTop: 8 },
  customUnitList: { gap: 8, marginTop: 14 },
  customUnitRow: { alignItems: "center", borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10 },
  customUnitRowText: { color: colors.foreground, flex: 1, fontFamily: "monospace", fontSize: 13, fontWeight: "700", marginRight: 8 },
  customUnitDeleteButton: { backgroundColor: colors.surfaceSecondary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }, customUnitDeleteButtonText: { color: colors.error, fontSize: 12, fontWeight: "700" },
});
