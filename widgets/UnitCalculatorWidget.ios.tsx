import { Text, VStack } from "@expo/ui/swift-ui";
import {
  background,
  containerBackground,
  cornerRadius,
  font,
  foregroundStyle,
  minimumScaleFactor,
  monospacedDigit,
  padding,
  truncationMode,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

import type { AppLanguage } from "@/lib/i18n";

export type UnitCalculatorWidgetProps = {
  expression: string;
  result: string;
  siResult: string;
  locale: AppLanguage;
};

// ホーム画面ウィジェットの文言。アプリ本体と同じ「英語のキー集合を正とするRecord」方式にして、
// 言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_COPY = {
  title: "Unit Calculator",
  siLabel: "SI base",
  latestLabel: "LATEST CALCULATION",
  emptyExpression: "Enter an expression",
} as const;

const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = {
  en: EN_COPY,
  ja: { title: "単位付き電卓", siLabel: "SI標準", latestLabel: "最新の計算", emptyExpression: "式を入力" },
  es: { title: "Calculadora de unidades", siLabel: "Base SI", latestLabel: "ÚLTIMO CÁLCULO", emptyExpression: "Escribe una expresión" },
  "pt-BR": { title: "Calculadora de unidades", siLabel: "Base SI", latestLabel: "ÚLTIMO CÁLCULO", emptyExpression: "Digite uma expressão" },
  de: { title: "Einheitenrechner", siLabel: "SI-Basis", latestLabel: "LETZTE BERECHNUNG", emptyExpression: "Ausdruck eingeben" },
  fr: { title: "Calculatrice d\u2019unités", siLabel: "Base SI", latestLabel: "DERNIER CALCUL", emptyExpression: "Saisir une expression" },
};

function UnitCalculatorWidget(
  props: UnitCalculatorWidgetProps,
  environment: WidgetEnvironment,
) {
  "widget";

  const compact = environment.widgetFamily === "systemSmall";
  const isDark = environment.colorScheme === "dark";
  const colors = isDark
    ? {
        accent: "#58B3D8",
        card: "#1A3441",
        expression: "#B8CBD4",
        result: "#D8F4FF",
        surface: "#111E26",
        title: "#EAF6FA",
      }
    : {
        accent: "#146C94",
        card: "#E5F4FB",
        expression: "#527280",
        result: "#0E4964",
        surface: "#F8FAFB",
        title: "#17212B",
      };
  const copy = COPY[props.locale];
  const title = copy.title;
  const siLabel = copy.siLabel;
  const latestLabel = copy.latestLabel;
  const expression = props.expression || copy.emptyExpression;

  return (
    <VStack
      spacing={compact ? 7 : 10}
      modifiers={[
        containerBackground(colors.surface, "widget"),
        padding({ all: compact ? 14 : 16 }),
      ]}
    >
      <VStack spacing={compact ? 2 : 3}>
        <Text
          modifiers={[
            font({ size: compact ? 12 : 13, weight: "bold", design: "rounded" }),
            foregroundStyle(colors.title),
          ]}
        >
          {title}
        </Text>
        <Text
          modifiers={[
            font({ size: 10, weight: "semibold" }),
            foregroundStyle(colors.accent),
          ]}
        >
          {latestLabel}
        </Text>
      </VStack>

      <Text
        modifiers={[
          font({ size: compact ? 12 : 13, weight: "medium", design: "monospaced" }),
          foregroundStyle(colors.expression),
          minimumScaleFactor(0.72),
          truncationMode("middle"),
        ]}
      >
        {expression}
      </Text>

      <VStack
        spacing={compact ? 3 : 5}
        modifiers={[
          background(colors.card),
          cornerRadius(compact ? 12 : 14),
          padding({ all: compact ? 10 : 12 }),
        ]}
      >
        <Text
          modifiers={[
            font({ size: compact ? 24 : 29, weight: "bold", design: "monospaced" }),
            foregroundStyle(colors.result),
            minimumScaleFactor(0.62),
            monospacedDigit(),
            truncationMode("middle"),
          ]}
        >
          {props.result || "—"}
        </Text>
        {!compact && (
          <Text
            modifiers={[
              font({ size: 12, weight: "medium", design: "monospaced" }),
              foregroundStyle(colors.expression),
              minimumScaleFactor(0.74),
              truncationMode("middle"),
            ]}
          >
            {siLabel}: {props.siResult || "—"}
          </Text>
        )}
      </VStack>
    </VStack>
  );
}

export default createWidget("UnitCalculatorWidget", UnitCalculatorWidget);
