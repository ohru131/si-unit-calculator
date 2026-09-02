import { describe, expect, it, vi } from "vitest";

import { presetConstantExpression } from "../lib/calculator-store";
import { APP_LANGUAGES, AppLanguage } from "../lib/i18n";
import { DEFAULT_PRESET_PRICE_CURRENCY, PRESET_PRICE_PROFILES, PresetPriceKind, resolvePresetPriceProfile } from "../lib/preset-price-defaults";

// vi.mock は vitest が import より上にホイストするため、importの後に書いてよい。
// lib/calculator-store.tsx は useGlobalSettings（@/lib/global-settings）をimportしており、
// その先で expo-localization → react-native の内部実装（Flow構文を含む生の .js）まで
// 読み込まれてしまい、このvitest環境ではパースできない。ここではReactに依存しない
// 純関数（presetConstantExpression）だけを検証したいので、実体を読み込ませずにモックする。
vi.mock("@/lib/global-settings", () => ({ useGlobalSettings: () => ({ language: "en", currencyCode: null, regionCode: null }) }));

const KINDS: PresetPriceKind[] = ["electricityPerKWh", "fuelPerLiter"];

describe("プリセットの金額の既定値", () => {
  it("端末の通貨が分かればそれを使う（言語より地域が優先される）", () => {
    // 日本在住で英語UIのユーザーは、ドル建てではなく円建ての値になるべき。
    expect(resolvePresetPriceProfile("JPY", "JP", "en")).toBe(PRESET_PRICE_PROFILES.JPY);
    expect(resolvePresetPriceProfile("EUR", "DE", "ja")).toBe(PRESET_PRICE_PROFILES.EUR);
  });

  it("通貨コードの大文字小文字と前後の空白を無視する", () => {
    expect(resolvePresetPriceProfile(" jpy ", null, "en")).toBe(PRESET_PRICE_PROFILES.JPY);
    expect(resolvePresetPriceProfile(null, " jp ", "en")).toBe(PRESET_PRICE_PROFILES.JPY);
  });

  it("通貨が取れなくても地域が分かれば地域から引く（Webはこの経路になる）", () => {
    // expo-localization の web 実装は currencyCode を常に null で返すが regionCode は取れる。
    // ここが効かないと、Webでは地域を全く見ずに言語だけで決まってしまう。
    expect(resolvePresetPriceProfile(null, "JP", "en")).toBe(PRESET_PRICE_PROFILES.JPY);
    expect(resolvePresetPriceProfile(null, "MX", "es")).toBe(PRESET_PRICE_PROFILES.MXN);
    expect(resolvePresetPriceProfile(null, "GB", "en")).toBe(PRESET_PRICE_PROFILES.GBP);
    // ユーロ圏の国は言語を問わずEURになる。
    expect(resolvePresetPriceProfile(null, "AT", "en")).toBe(PRESET_PRICE_PROFILES.EUR);
  });

  it("ユーロを使う地域がすべてEURに解決する", () => {
    // 地域→通貨の表からユーロ圏の国を1つ落とすと、その国の英語UIユーザーだけが
    // 黙ってUSDの値になり、他の地域のテストでは気付けない（実際にブルガリアが
    // 抜けていた）。加入国が増えたらこの一覧にも足す。
    const euroRegions = [
      // ユーロ圏21カ国（BGは2026年1月加入）。
      "AT", "BE", "BG", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR",
      "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK",
      // 通貨協定でユーロを使うミニ国家と、事実上ユーロを使っている地域。
      "AD", "MC", "SM", "VA", "ME", "XK",
    ];
    const notEuro = euroRegions.filter(
      (region) => resolvePresetPriceProfile(null, region, "en") !== PRESET_PRICE_PROFILES.EUR,
    );
    expect(notEuro).toEqual([]);
  });

  it("通貨も地域も分からないときだけ言語から推測する", () => {
    expect(resolvePresetPriceProfile(null, null, "ja")).toBe(PRESET_PRICE_PROFILES.JPY);
    expect(resolvePresetPriceProfile(undefined, undefined, "pt-BR")).toBe(PRESET_PRICE_PROFILES.BRL);
  });

  it("表に無い通貨・地域は次の段に落ちる（USDに飛ばさない）", () => {
    // スイスのドイツ語ならUSDよりEURの方が近い。
    expect(resolvePresetPriceProfile("CHF", "CH", "de")).toBe(PRESET_PRICE_PROFILES.EUR);
    expect(resolvePresetPriceProfile("KRW", "KR", "en")).toBe(PRESET_PRICE_PROFILES.USD);
  });

  it("どの対応言語でも意図した通貨にフォールバックする", () => {
    // 言語→通貨の対応を足し忘れると、その言語は黙って DEFAULT_PRESET_PRICE_CURRENCY(USD) に
    // 落ちる。戻り値が truthy かどうかだけを見ると必ず通ってしまう（この関数は最後に必ず
    // USDを返すため）ので、言語ごとに「どの通貨になるべきか」を明示して突き合わせる。
    // 言語を追加すると、この表に書き足すまで型エラーになる（＝チェックリストになる）。
    const expected: Record<AppLanguage, keyof typeof PRESET_PRICE_PROFILES> = {
      en: "USD",
      ja: "JPY",
      es: "EUR",
      "pt-BR": "BRL",
      de: "EUR",
      fr: "EUR",
    };
    const wrong = APP_LANGUAGES.filter(
      (language) => resolvePresetPriceProfile(null, null, language) !== PRESET_PRICE_PROFILES[expected[language]],
    );
    expect(wrong).toEqual([]);
    // 上の表がUSD以外を指している言語は、対応漏れ（USDへの暗黙のフォールバック）と
    // 区別できている必要がある。
    expect(APP_LANGUAGES.filter((language) => expected[language] !== DEFAULT_PRESET_PRICE_CURRENCY).length).toBeGreaterThan(0);
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
