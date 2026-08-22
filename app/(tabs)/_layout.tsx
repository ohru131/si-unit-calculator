import * as QuickActions from "expo-quick-actions";
import { type RouterAction, useQuickActionRouting } from "expo-quick-actions/router";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useGlobalSettings } from "@/lib/global-settings";

export default function TabLayout() {
  const colors = useColors();
  const { language, t } = useGlobalSettings();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  useQuickActionRouting();

  useEffect(() => {
    if (Platform.OS === "web") return;
    const actions: RouterAction[] = language === "en" ? [
      { id: "speed", title: "Speed calculator", subtitle: "Distance ÷ time", icon: "time", params: { href: "/?quick=speed" } },
      { id: "pressure", title: "Pressure calculator", subtitle: "Force ÷ area", icon: "symbol:gauge.with.dots.needle.67percent", params: { href: "/?quick=pressure" } },
      { id: "samples", title: "Try examples", subtitle: "Start from a formula", icon: "bookmark", params: { href: "/?quick=samples" } },
      { id: "search", title: "Search units", subtitle: "Find units quickly", icon: "search", params: { href: "/?quick=search" } },
    ] : [
      { id: "speed", title: "速度を計算", subtitle: "距離 ÷ 時間", icon: "time", params: { href: "/?quick=speed" } },
      { id: "pressure", title: "圧力を計算", subtitle: "力 ÷ 面積", icon: "symbol:gauge.with.dots.needle.67percent", params: { href: "/?quick=pressure" } },
      { id: "samples", title: "サンプルを試す", subtitle: "代表式から開始", icon: "bookmark", params: { href: "/?quick=samples" } },
      { id: "search", title: "単位を検索", subtitle: "単位を素早く探す", icon: "search", params: { href: "/?quick=search" } },
    ];
    void QuickActions.isSupported().then((supported) => {
      if (supported) return QuickActions.setItems(actions);
    });
  }, [language]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
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
