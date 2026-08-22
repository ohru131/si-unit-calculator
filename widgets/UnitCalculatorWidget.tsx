import { Text, VStack } from "@expo/ui/swift-ui";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

export type UnitCalculatorWidgetProps = {
  expression: string;
  result: string;
  siResult: string;
  locale: "en" | "ja";
};

function UnitCalculatorWidget(
  props: UnitCalculatorWidgetProps,
  environment: WidgetEnvironment,
) {
  "widget";

  const compact = environment.widgetFamily === "systemSmall";
  const title = props.locale === "ja" ? "単位付き電卓" : "Unit Calculator";
  const siLabel = props.locale === "ja" ? "SI標準" : "SI base";

  return (
    <VStack spacing={compact ? 4 : 8}>
      <Text>{title}</Text>
      <Text>{props.expression || (props.locale === "ja" ? "式を入力" : "Enter an expression")}</Text>
      <Text>{props.result || "—"}</Text>
      {!compact && <Text>{siLabel}: {props.siResult || "—"}</Text>}
    </VStack>
  );
}

export default createWidget("UnitCalculatorWidget", UnitCalculatorWidget);
