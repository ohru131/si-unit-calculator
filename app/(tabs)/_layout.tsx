import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useGlobalSettings } from "@/lib/global-settings";

export default function TabLayout() {
  const colors = useColors();
  const { t } = useGlobalSettings();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

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
