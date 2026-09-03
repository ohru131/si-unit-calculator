import * as QuickActions from "expo-quick-actions";
import { type RouterAction, useQuickActionRouting } from "expo-quick-actions/router";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useGlobalSettings } from "@/lib/global-settings";
import { type AppLanguage } from "@/lib/i18n";

// クイックアクションのtitle/subtitleは言語ごとに丸ごと複製する（英語を正としたRecordにして
// 言語追加時のキー漏れ・要素数のずれを型エラーで検出できるようにする）。
const QUICK_ACTIONS: Record<AppLanguage, RouterAction[]> = {
  en: [
    { id: "speed", title: "Speed calculator", subtitle: "Distance ÷ time", icon: "time", params: { href: "/?quick=speed" } },
    { id: "pressure", title: "Pressure calculator", subtitle: "Force ÷ area", icon: "symbol:gauge.with.dots.needle.67percent", params: { href: "/?quick=pressure" } },
    { id: "samples", title: "Try examples", subtitle: "Start from a formula", icon: "bookmark", params: { href: "/?quick=samples" } },
    { id: "search", title: "Search units", subtitle: "Find units quickly", icon: "search", params: { href: "/?quick=search" } },
  ],
  ja: [
    { id: "speed", title: "速度を計算", subtitle: "距離 ÷ 時間", icon: "time", params: { href: "/?quick=speed" } },
    { id: "pressure", title: "圧力を計算", subtitle: "力 ÷ 面積", icon: "symbol:gauge.with.dots.needle.67percent", params: { href: "/?quick=pressure" } },
    { id: "samples", title: "サンプルを試す", subtitle: "代表式から開始", icon: "bookmark", params: { href: "/?quick=samples" } },
    { id: "search", title: "単位を検索", subtitle: "単位を素早く探す", icon: "search", params: { href: "/?quick=search" } },
  ],
  es: [
    { id: "speed", title: "Calcular velocidad", subtitle: "Distancia ÷ tiempo", icon: "time", params: { href: "/?quick=speed" } },
    { id: "pressure", title: "Calcular presión", subtitle: "Fuerza ÷ área", icon: "symbol:gauge.with.dots.needle.67percent", params: { href: "/?quick=pressure" } },
    { id: "samples", title: "Ver ejemplos", subtitle: "Partir de una fórmula", icon: "bookmark", params: { href: "/?quick=samples" } },
    { id: "search", title: "Buscar unidades", subtitle: "Encuentra unidades rápido", icon: "search", params: { href: "/?quick=search" } },
  ],
  "pt-BR": [
    { id: "speed", title: "Calcular velocidade", subtitle: "Distância ÷ tempo", icon: "time", params: { href: "/?quick=speed" } },
    { id: "pressure", title: "Calcular pressão", subtitle: "Força ÷ área", icon: "symbol:gauge.with.dots.needle.67percent", params: { href: "/?quick=pressure" } },
    { id: "samples", title: "Ver exemplos", subtitle: "Partir de uma fórmula", icon: "bookmark", params: { href: "/?quick=samples" } },
    { id: "search", title: "Buscar unidades", subtitle: "Encontre unidades rápido", icon: "search", params: { href: "/?quick=search" } },
  ],
  de: [
    { id: "speed", title: "Geschwindigkeit", subtitle: "Strecke ÷ Zeit", icon: "time", params: { href: "/?quick=speed" } },
    { id: "pressure", title: "Druck berechnen", subtitle: "Kraft ÷ Fläche", icon: "symbol:gauge.with.dots.needle.67percent", params: { href: "/?quick=pressure" } },
    { id: "samples", title: "Beispiele testen", subtitle: "Mit Formel starten", icon: "bookmark", params: { href: "/?quick=samples" } },
    { id: "search", title: "Einheiten suchen", subtitle: "Einheiten schnell finden", icon: "search", params: { href: "/?quick=search" } },
  ],
  fr: [
    { id: "speed", title: "Calculer la vitesse", subtitle: "Distance ÷ temps", icon: "time", params: { href: "/?quick=speed" } },
    { id: "pressure", title: "Calculer la pression", subtitle: "Force ÷ surface", icon: "symbol:gauge.with.dots.needle.67percent", params: { href: "/?quick=pressure" } },
    { id: "samples", title: "Voir des exemples", subtitle: "Partir d'une formule", icon: "bookmark", params: { href: "/?quick=samples" } },
    { id: "search", title: "Rechercher des unités", subtitle: "Trouver une unité vite", icon: "search", params: { href: "/?quick=search" } },
  ],
};

export default function TabLayout() {
  const colors = useColors();
  const { language, t } = useGlobalSettings();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 64 + bottomPadding;

  useQuickActionRouting();

  useEffect(() => {
    if (Platform.OS === "web") return;
    const actions = QUICK_ACTIONS[language];
    void QuickActions.isSupported().then((supported) => {
      if (supported) return QuickActions.setItems(actions);
    });
  }, [language]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        // 既定値だとCJKフォントの字形高がラベル行の高さに収まらず上下が欠けるため、
        // 行高を明示的に確保する。
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 16,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("calculator"),
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="function" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notebook"
        options={{
          title: t("notebook"),
          // ライブラリ（constants）は"bookmark.fill"を使っているので、開いた本を模した
          // "book.fill"にして見分けやすくする（両方ともMaterialIconsマッピング済み: bookmark/auto-stories）。
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="constants"
        options={{
          title: t("constants"),
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="bookmark.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="pro"
        options={{
          title: t("pro"),
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="crown.fill" color={color} />,
          // タブバーからは消すが、設定画面などからのリンク先ルートとしては残す。
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("settings"),
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
