import { describe, expect, it, vi } from "vitest";

import { presetConstantExpression } from "../lib/calculator-store";
import { APP_LANGUAGES, AppLanguage } from "../lib/i18n";
import { evaluateExpression, parseUnit } from "../lib/units";
import {
  DEFAULT_PRESET_ELECTRICAL_PROFILE,
  DEFAULT_PRESET_PRICE_CURRENCY,
  PRESET_PRICE_PROFILES,
  PresetPriceKind,
  resolvePresetElectricalProfile,
  resolvePresetPriceProfile,
  resolvePresetRegionalDefaults,
} from "../lib/preset-regional-defaults";

// vi.mock は vitest が import より上にホイストするため、importの後に書いてよい。
// lib/calculator-store.tsx は useGlobalSettings（@/lib/global-settings）をimportしており、
// その先で expo-localization → react-native の内部実装（Flow構文を含む生の .js）まで
// 読み込まれてしまい、このvitest環境ではパースできない。ここではReactに依存しない
// 純関数（presetConstantExpression）だけを検証したいので、実体を読み込ませずにモックする。
vi.mock("@/lib/global-settings", () => ({ useGlobalSettings: () => ({ language: "en", currencyCode: null, regionCode: null }) }));

// 手で並べると種類を足したときに更新し忘れ、その種類だけ検証されないまま通ってしまう。
// PresetPriceProfile は Record<PresetPriceKind, number> なので、どのプロファイルのキーも
// 常に全種類そろっている（型で保証される）。そこから引けば増減に自動で追従する。
const KINDS = Object.keys(PRESET_PRICE_PROFILES[DEFAULT_PRESET_PRICE_CURRENCY]) as PresetPriceKind[];

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

  it("米ドルを自国通貨にしている地域がUSDに解決する", () => {
    // ここが抜けると、その国の西語ユーザーだけが言語からの推測に落ちてユーロ建ての値になる
    // （エクアドルはUSD圏なのに0.29ユーロ/kWhが入っていた）。
    ["EC", "SV", "PA", "PR"].forEach((region) => {
      expect(resolvePresetPriceProfile(null, region, "es"), region).toBe(PRESET_PRICE_PROFILES.USD);
    });
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
  const defaults = resolvePresetRegionalDefaults("EUR", "DE", "en");

  it("regionalDefault が無い定数はシードの式をそのまま使う", () => {
    const constant = { symbol: "P", expression: "1200W" };
    expect(presetConstantExpression(constant, defaults)).toBe("1200W");
  });

  it("regionalDefault が付いた金額の定数は地域に応じた値に差し替わる", () => {
    // expression（円建てのフォールバック）ではなく、渡した既定値の方になること。
    const constant = { symbol: "rate", expression: "31", regionalDefault: "electricityPerKWh" as const };
    expect(presetConstantExpression(constant, defaults)).toBe(String(PRESET_PRICE_PROFILES.EUR.electricityPerKWh));
    expect(presetConstantExpression(constant, resolvePresetRegionalDefaults("JPY", "JP", "en"))).toBe("31");
  });

  it("金額の式はロケール非依存の裸の数値になっている", () => {
    // 式の小数点はASCIIドット固定なので、ロケール依存のコンマが混ざってはいけない。
    const constant = { symbol: "price", expression: "170", regionalDefault: "fuelPerLiter" as const };
    Object.keys(PRESET_PRICE_PROFILES).forEach((currency) => {
      expect(presetConstantExpression(constant, resolvePresetRegionalDefaults(currency, null, "en"))).toMatch(/^\d+(\.\d+)?$/);
    });
  });

  it("電気の式は単位付きで、ノートエンジンがそのまま評価できる", () => {
    // 金額は裸の数値・電気は単位付き（"230V"）と形が違う。単位を落とすと
    // P=V*I が W ではなく無次元になり、targetUnit:"W" で表示できなくなる。
    const voltage = { symbol: "V", expression: "100V", regionalDefault: "mainsVoltage" as const };
    const current = { symbol: "I\u2098\u2090\u2093", expression: "30A", regionalDefault: "breakerCurrent" as const };
    [null, "JP", "US", "DE", "GB", "BR", "AU"].forEach((region) => {
      const resolved = resolvePresetRegionalDefaults(null, region, "en");
      expect(presetConstantExpression(voltage, resolved)).toMatch(/^\d+(\.\d+)?V$/);
      expect(presetConstantExpression(current, resolved)).toMatch(/^\d+(\.\d+)?A$/);
      expect(evaluateExpression(`${presetConstantExpression(voltage, resolved)}*${presetConstantExpression(current, resolved)}`).dimension)
        .toEqual(parseUnit("W").dimension);
    });
  });
});

describe("プリセットの電気の既定値", () => {
  it("地域が分かれば地域から引く（通貨より地域が優先される）", () => {
    // 電圧は通貨ではなく国で決まる。USDを使うエクアドルは120V、ユーロを使う
    // ドイツは230V。通貨だけで決めると、この2つを区別できない。
    expect(resolvePresetElectricalProfile("JPY", "JP", "en").mainsVoltage).toBe(100);
    expect(resolvePresetElectricalProfile("USD", "US", "en").mainsVoltage).toBe(120);
    expect(resolvePresetElectricalProfile("USD", "EC", "es").mainsVoltage).toBe(120);
    expect(resolvePresetElectricalProfile("EUR", "DE", "de").mainsVoltage).toBe(230);
  });

  it("地域コードの大文字小文字と前後の空白を無視する", () => {
    expect(resolvePresetElectricalProfile(null, " jp ", "en").mainsVoltage).toBe(100);
  });

  it("表に無い地域は230Vになる（未知を120Vへ倒さない）", () => {
    // オーストラリア・インド・韓国・中国は通貨表にも無いので金額はUSDに落ちるが、
    // 電圧まで北米式にすると明確な誤りになる。**この分岐が、電気を通貨から
    // 切り離した理由そのもの**なので消さないこと。
    ["AU", "IN", "KR", "CN", "ZA", "NZ"].forEach((region) => {
      expect(resolvePresetElectricalProfile(null, region, "en")).toBe(DEFAULT_PRESET_ELECTRICAL_PROFILE);
    });
  });

  it("地域が取れないときは通貨、それも無ければ言語から推測する", () => {
    expect(resolvePresetElectricalProfile("JPY", null, "en").mainsVoltage).toBe(100);
    expect(resolvePresetElectricalProfile("BRL", null, "en").mainsVoltage).toBe(127);
    expect(resolvePresetElectricalProfile(null, null, "ja").mainsVoltage).toBe(100);
    expect(resolvePresetElectricalProfile(null, null, "en").mainsVoltage).toBe(120);
    expect(resolvePresetElectricalProfile(null, null, "fr")).toBe(DEFAULT_PRESET_ELECTRICAL_PROFILE);
  });

  it("英国・アイルランドはリングファイナル回路なので定格が32Aになる", () => {
    expect(resolvePresetElectricalProfile(null, "GB", "en")).toEqual({ mainsVoltage: 230, breakerCurrent: 32 });
    expect(resolvePresetElectricalProfile(null, "IE", "en")).toEqual({ mainsVoltage: 230, breakerCurrent: 32 });
  });

  it("どの地域でもブレーカー容量が家庭用として妥当な範囲に収まる", () => {
    // 式（P=V*Iₘₐₓ）が正しくても、電圧と定格の組み合わせがちぐはぐだと
    // 「計算は通るのに何も教えないノート」になる。1.5kW〜8kWを目安にする。
    ["JP", "US", "CA", "MX", "BR", "DE", "GB", "AU", null].forEach((region) => {
      const { mainsVoltage, breakerCurrent } = resolvePresetElectricalProfile(null, region, "en");
      const watts = mainsVoltage * breakerCurrent;
      expect(watts, `${region}: ${watts}W`).toBeGreaterThanOrEqual(1500);
      expect(watts, `${region}: ${watts}W`).toBeLessThanOrEqual(8000);
    });
  });
});
