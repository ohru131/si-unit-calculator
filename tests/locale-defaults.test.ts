import { describe, expect, it } from "vitest";

import { APP_LANGUAGES } from "../lib/i18n";
import { resolveDefaultMeasuringStandard, resolveDefaultUnitSystem } from "../lib/locale-defaults";
import { convertQuantity, evaluateExpression, MEASURING_STANDARDS, setMeasuringStandard } from "../lib/units";

describe("既定の単位系", () => {
  it("端末の計量系・地域から metric / us / uk を決める", () => {
    expect(resolveDefaultUnitSystem({ measurementSystem: "us", regionCode: "US" })).toBe("us");
    expect(resolveDefaultUnitSystem({ measurementSystem: "uk", regionCode: "GB" })).toBe("uk");
    expect(resolveDefaultUnitSystem({ measurementSystem: "metric", regionCode: "DE" })).toBe("metric");
    expect(resolveDefaultUnitSystem({ regionCode: "US" })).toBe("us");
    expect(resolveDefaultUnitSystem(undefined)).toBe("metric");
  });
});

describe("既定のカップ・大さじの規格", () => {
  it("地域で決める（言語ではない）", () => {
    // 日本在住で英語UIならJIS、米国在住で日本語UIなら米国式。使う言語ではなく住んでいる地域で決まる。
    expect(resolveDefaultMeasuringStandard({ measurementSystem: "metric", regionCode: "JP" }, "en")).toBe("jis");
    expect(resolveDefaultMeasuringStandard({ measurementSystem: "us", regionCode: "US" }, "ja")).toBe("us");
  });

  it("英国・アイルランドの英語ユーザーは米国式ではなくメートル法になる", () => {
    // 以前は言語から決めていたため、ここが us（カップ236.6mL）に落ちていた。
    expect(resolveDefaultMeasuringStandard({ measurementSystem: "uk", regionCode: "GB" }, "en")).toBe("metric");
    expect(resolveDefaultMeasuringStandard({ measurementSystem: "metric", regionCode: "IE" }, "en")).toBe("metric");
  });

  it("豪州だけ大さじ20mLの豪州基準にする", () => {
    expect(resolveDefaultMeasuringStandard({ measurementSystem: "metric", regionCode: "AU" }, "en")).toBe("au");
    // ニュージーランドはカップ250mLだが大さじは15mLなので metric。
    expect(resolveDefaultMeasuringStandard({ measurementSystem: "metric", regionCode: "NZ" }, "en")).toBe("metric");
  });

  it("地域が読めた時点で確定させ、言語へ落とさない", () => {
    // 表に無い地域＝米国でもJISでも豪州でもない、すなわちメートル法圏。ここで
    // 言語（ja→jis）へ落ちると、ドイツ在住の日本語UIがJISのカップになってしまう。
    expect(resolveDefaultMeasuringStandard({ measurementSystem: "metric", regionCode: "DE" }, "ja")).toBe("metric");
  });

  it("地域が全く読めない端末だけ言語を手掛かりにする", () => {
    expect(resolveDefaultMeasuringStandard({ regionCode: null }, "ja")).toBe("jis");
    expect(resolveDefaultMeasuringStandard(undefined, "de")).toBe("metric");
  });

  it("地域が読めない en は米国式にする（通貨・電気の推測と揃える）", () => {
    // 同じ状況で金額は USD、電圧は米国の120Vに落ちる。ここだけメートル法にすると
    // 「電気代はドル・電圧は120Vなのにカップは250mL」という食い違った端末になる。
    // 英国・豪州の可能性は残るが、地域が読めない以上どの資源も同じ推測に賭けるほかない。
    expect(resolveDefaultMeasuringStandard({ regionCode: null }, "en")).toBe("us");
    expect(resolveDefaultMeasuringStandard(undefined, "en")).toBe("us");
  });

  it("どの言語でも必ず解決できる（未定義を返さない）", () => {
    for (const language of APP_LANGUAGES) {
      expect(MEASURING_STANDARDS).toContain(resolveDefaultMeasuringStandard(undefined, language));
    }
  });
});

describe("規格ごとのカップ・大さじの実際の量", () => {
  const cupInMilliliters = (standard: (typeof MEASURING_STANDARDS)[number]) => {
    setMeasuringStandard(standard);
    return convertQuantity(evaluateExpression("1cup"), "mL").value;
  };
  const tablespoonInMilliliters = (standard: (typeof MEASURING_STANDARDS)[number]) => {
    setMeasuringStandard(standard);
    return convertQuantity(evaluateExpression("1tbsp"), "mL").value;
  };

  it("metric はカップ250mL・大さじ15mL", () => {
    expect(cupInMilliliters("metric")).toBeCloseTo(250);
    expect(tablespoonInMilliliters("metric")).toBeCloseTo(15);
  });

  it("豪州基準は大さじだけ20mLで、カップは metric と同じ250mL", () => {
    expect(cupInMilliliters("au")).toBeCloseTo(250);
    expect(tablespoonInMilliliters("au")).toBeCloseTo(20);
  });

  it("既存のUS・JISの値は変えない（保存済みの設定がそのまま動く）", () => {
    expect(cupInMilliliters("us")).toBeCloseTo(236.588);
    expect(cupInMilliliters("jis")).toBeCloseTo(200);
    // テスト間で漏れないよう既定へ戻す。
    setMeasuringStandard("us");
  });
});
