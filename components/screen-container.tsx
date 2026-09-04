import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

export interface ScreenContainerProps extends ViewProps {
  /**
   * SafeArea edges to apply. Defaults to ["top", "left", "right"].
   * Bottom is typically handled by Tab Bar.
   */
  edges?: Edge[];
  /**
   * Tailwind className for the content area.
   */
  className?: string;
  /**
   * Additional className for the outer container (background layer).
   */
  containerClassName?: string;
  /**
   * Additional className for the SafeAreaView (content layer).
   */
  safeAreaClassName?: string;
  /**
   * Overrides the outer container's background color (defaults to the current theme's
   * background). Use this instead of a `bg-*` class in containerClassName: NativeWind's
   * CSS variables don't reliably update on native when the color scheme changes.
   */
  backgroundColor?: string;
}

/**
 * A container component that properly handles SafeArea and background colors.
 *
 * The outer View extends to full screen (including status bar area) with the background color,
 * while the inner SafeAreaView ensures content is within safe bounds.
 *
 * Usage:
 * ```tsx
 * <ScreenContainer className="p-4">
 *   <Text className="text-2xl font-bold text-foreground">
 *     Welcome
 *   </Text>
 * </ScreenContainer>
 * ```
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  backgroundColor,
  style,
  ...props
}: ScreenContainerProps) {
  const colors = useColors();
  return (
    <View
      className={cn(
        "flex-1",
        containerClassName
      )}
      // NativeWindのCSS変数(bg-background)はネイティブでダークモード切替時に反映されない
      // ことがあるため、確実に効くJSベースの色（useColors）を既定値にする。呼び出し元は
      // containerClassNameのbg-*ではなくbackgroundColorで上書きすること。
      style={{ backgroundColor: backgroundColor ?? colors.background }}
      {...props}
    >
      <SafeAreaView
        edges={edges}
        className={cn("flex-1", safeAreaClassName)}
        style={style}
      >
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
