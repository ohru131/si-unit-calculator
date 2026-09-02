import { describe, expect, it, vi } from "vitest";

import { presetConstantExpression } from "../lib/calculator-store";
import { APP_LANGUAGES } from "../lib/i18n";
import { DEFAULT_PRESET_PRICE_CURRENCY, PRESET_PRICE_PROFILES, PresetPriceKind, resolvePresetPriceProfile } from "../lib/preset-price-defaults";

// vi.mock は vitest が import より上にホイストするため、importの後に書いてよい。
// lib/calculator-store.tsx は useGlobalSettings（@/lib/global-settings）をimportしており、
// その先で expo-localization → react-native の内部実装（Flow構文を含む生の .js）まで
// 読み込まれてしまい、このvitest環境ではパースできない。ここではReactに依存しない
// 純関数（presetConstantExpression）だけを検証したいので、実体を読み込ませずにモックする。
vi.mock("@/lib/global-settings", () => ({ useGlobalSettings: () => ({ language: "en", currencyCode: null }) }));

const KINDS: PresetPriceKind[] = ["electricityPerKWh", "fuelPerLiter"];

describe("プリセットの金額の既定値", () => {
  it("端末の通貨が分かればそれを使う（言語より地域が優先される）", () => {
    // 日本在住で英語UIのユーザーは、ドル建てではなく円建ての値になるべき。
    expect(resolvePresetPriceProfile("JPY", "en")).toBe(PRESET_PRICE_PROFILES.JPY);
    expect(resolvePresetPriceProfile("EUR", "ja")).toBe(PRESET_PRICE_PROFILES.EUR);
  });

  it("通貨コードの大文字小文字と前後の空白を無視する", () => {
    expect(resolvePresetPriceProfile(" jpy ", "en")).toBe(PRESET_PRICE_PROFILES.JPY);
  });

  it("端末が通貨を返さないときは言語から推測する", () => {
    expect(resolvePresetPriceProfile(null, "ja")).toBe(PRESET_PRICE_PROFILES.JPY);
    expect(resolvePresetPriceProfile(undefined, "pt-BR")).toBe(PRESET_PRICE_PROFILES.BRL);
  });

  it("表に無い通貨は言語からの推測に落ちる（USDに飛ばさない）", () => {
    // スイスのドイツ語ならUSDよりEURの方が近い。
    expect(resolvePresetPriceProfile("CHF", "de")).toBe(PRESET_PRICE_PROFILES.EUR);
    expect(resolvePresetPriceProfile("KRW", "en")).toBe(PRESET_PRICE_PROFILES.USD);
  });

  it("どの対応言語でもフォールバック先の通貨が表に存在する", () => {
    // 言語を追加したときに、対応する通貨を表に足し忘れると既定値が壊れるので機械的に検出する。
    const missing = APP_LANGUAGES.filter((language) => !resolvePresetPriceProfile(null, language));
    expect(missing).toEqual([]);
    expect(PRESET_PRICE_PROFILES[DEFAULT_PRESET_PRICE_CURRENCY]).toBeDefined();
  });

  it("全通貨の全項目が正の有限な数値である", () => {
    const invalid: string[] = [];
    Object.entries(PRESET_PRICE_PROFILES).forEach(([currency, profile]) => {
      KINDS.forEach((kind) => {
        const value = profile[kind];
        if (!Number.isFinite(value) || value <= 0) invalid.push(`${currency}/${kind}: ${value}`);
      });
    });
    expect(invalid).toEqual([]);
  });
});

describe("presetConstantExpression", () => {
  it("localizedPrice が無い定数はシードの式をそのまま使う", () => {
    const constant = { symbol: "P", expression: "1200W" };
    expect(presetConstantExpression(constant, PRESET_PRICE_PROFILES.EUR)).toBe("1200W");
  });

  it("localizedPrice が付いた定数は通貨に応じた値に差し替わる", () => {
    // expression（円建てのフォールバック）ではなく、渡したプロファイルの値になること。
    const constant = { symbol: "rate", expression: "31", localizedPrice: "electricityPerKWh" as const };
    expect(presetConstantExpression(constant, PRESET_PRICE_PROFILES.EUR)).toBe(String(PRESET_PRICE_PROFILES.EUR.electricityPerKWh));
    expect(presetConstantExpression(constant, PRESET_PRICE_PROFILES.JPY)).toBe("31");
  });

  it("差し替えた式がノートエンジンで扱える裸の数値になっている", () => {
    // 式の小数点はASCIIドット固定なので、ロケール依存のコンマが混ざってはいけない。
    const constant = { symbol: "price", expression: "170", localizedPrice: "fuelPerLiter" as const };
    Object.values(PRESET_PRICE_PROFILES).forEach((profile) => {
      expect(presetConstantExpression(constant, profile)).toMatch(/^\d+(\.\d+)?$/);
    });
  });
});
