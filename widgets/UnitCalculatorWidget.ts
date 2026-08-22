/**
 * expo-widgets is iOS native only. Metro resolves UnitCalculatorWidget.ios.tsx
 * on iOS; this platform-neutral fallback keeps web and Android bundles free of
 * the native widget view manager while preserving the calculator call site.
 */
export type UnitCalculatorWidgetProps = {
  expression: string;
  result: string;
  siResult: string;
  locale: "en" | "ja";
};

const UnitCalculatorWidget = {
  updateSnapshot: (_props: UnitCalculatorWidgetProps) => {
    // Native home-screen widgets are unavailable outside iOS builds.
  },
};

export default UnitCalculatorWidget;
