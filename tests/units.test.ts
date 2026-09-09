import { describe, expect, it } from "vitest";

import { resolveDisplayUnit } from "../lib/display-unit";

import {
  canonicalUnitSymbol,
  convertQuantity,
  evaluateExpression,
  formatNumberForLocale,
  formatQuantity,
  getCompatibleUnitGroups,
  getRegionalUnits,
  getUnitRegistration,
  parseConstantDefinition,
  parseUnit,
  searchUnitOptions,
  type UnitGroup,
  UNIT_GROUPS,
} from "../lib/units";
import { SAMPLE_CALCULATIONS } from "../lib/sample-calculations";
import { getUnitExplanation } from "../lib/unit-explanations";

describe("単位付き計算", () => {
  it("異なる長さの単位をSIへ換算して加算する", () => {
    const result = evaluateExpression("5cm + 1mm");
    expect(result.siValue).toBeCloseTo(0.051);
    expect(formatQuantity(result)).toBe("0.051 m");
    expect(formatQuantity(result, "cm")).toBe("5.1 cm");
  });

  it("乗算で次元を合成し、面積へ変換する", () => {
    const result = evaluateExpression("3cm × 20mm");
    expect(result.siValue).toBeCloseTo(0.0006);
    expect(formatQuantity(result)).toBe("0.0006 m²");
    expect(formatQuantity(result, "cm²")).toBe("6 cm²");
  });

  it("空白なしの単位付き乗算も正しく計算する", () => {
    const result = evaluateExpression("3cm×20mm");
    expect(formatQuantity(result, "cm²")).toBe("6 cm²");
  });

  it("定数を定義して式の中で参照する", () => {
    const width = parseConstantDefinition("W = 3cm");
    const height = parseConstantDefinition("H = 20mm", [
      { ...width, createdAt: "2026-01-01T00:00:00.000Z" },
    ]);
    const result = evaluateExpression("W × H", [
      { ...width, createdAt: "2026-01-01T00:00:00.000Z" },
      { ...height, createdAt: "2026-01-01T00:00:00.000Z" },
    ]);
    expect(formatQuantity(result, "cm²")).toBe("6 cm²");
  });

  it("無次元値を百分率とppmに変換する", () => {
    const result = evaluateExpression("0.125");
    expect(convertQuantity(result, "%").value).toBeCloseTo(12.5);
    expect(convertQuantity(result, "ppm").value).toBeCloseTo(125000);
  });

  it("複合単位を換算する", () => {
    const velocity = evaluateExpression("1m/s");
    expect(convertQuantity(velocity, "km/h").value).toBeCloseTo(3.6);
    const energy = evaluateExpression("1N × 1m");
    expect(formatQuantity(energy, "J")).toBe("1 J");
  });

  it("距離と秒・分・時から速度を計算し、速度と時間から距離を計算する", () => {
    const minuteVelocity = evaluateExpression("1km ÷ 1min");
    expect(convertQuantity(minuteVelocity, "m/min").value).toBeCloseTo(1000);
    expect(convertQuantity(minuteVelocity, "km/h").value).toBeCloseTo(60);

    const hourVelocity = evaluateExpression("12km ÷ 2h");
    expect(convertQuantity(hourVelocity, "km/h").value).toBeCloseTo(6);

    const distance = evaluateExpression("10m/s × 2min");
    expect(formatQuantity(distance, "km")).toBe("1.2 km");
  });

  it("加速度をSIへ正規化し、標準重力GとGal系で相互換算する", () => {
    expect(convertQuantity(evaluateExpression("1G"), "m/s²").value).toBeCloseTo(9.80665);
    expect(convertQuantity(evaluateExpression("1G"), "Gal").value).toBeCloseTo(980.665);
    expect(convertQuantity(evaluateExpression("1Gal"), "m/s²").value).toBeCloseTo(0.01);
    expect(convertQuantity(evaluateExpression("1000mGal"), "Gal").value).toBeCloseTo(1);
    expect(convertQuantity(evaluateExpression("1µGal"), "m/s²").value).toBeCloseTo(1e-8);
  });

  it("kineをSI速度へ正規化し、特殊単位の説明を取得する", () => {
    expect(convertQuantity(evaluateExpression("1kine"), "m/s").value).toBeCloseTo(0.01);
    expect(formatQuantity(evaluateExpression("100kine"), "km/h")).toBe("3.6 km/h");
    expect(getUnitExplanation("G")?.siConversion).toBe("1 G = 9.80665 m/s²");
    expect(getUnitExplanation("kine")?.name.ja).toBe("カイン");
    expect(getUnitExplanation("m")).toBeUndefined();
  });

  it("角度・三角関数・円周率を無次元結果として正しく計算する", () => {
    expect(convertQuantity(evaluateExpression("180deg"), "rad").value).toBeCloseTo(Math.PI);
    expect(evaluateExpression("sin(30deg)").siValue).toBeCloseTo(0.5);
    expect(evaluateExpression("cos(π)").siValue).toBeCloseTo(-1);
    expect(evaluateExpression("tan(pi / 4)").siValue).toBeCloseTo(1);
  });

  it("2πの整数倍・π/2の整数倍でのsin/cos/tanは浮動小数点誤差を消してちょうど0にする", () => {
    expect(evaluateExpression("sin(2π)").siValue).toBe(0);
    expect(evaluateExpression("sin(π)").siValue).toBe(0);
    expect(evaluateExpression("cos(π/2)").siValue).toBe(0);
    expect(evaluateExpression("tan(π)").siValue).toBe(0);
  });

  it("べき乗と平方根を次元整合性を保って計算する", () => {
    expect(evaluateExpression("2^3^2").siValue).toBe(512);
    expect(formatQuantity(evaluateExpression("(3m)^2"), "m²")).toBe("9 m²");
    expect(formatQuantity(evaluateExpression("sqrt(9m²)"), "m")).toBe("3 m");
    expect(evaluateExpression("sqrt(81)").siValue).toBe(9);
  });

  it("三角関数・べき乗・平方根の不正な次元と定義域を拒否する", () => {
    // Error.message はUnitError設計上つねに英語（表示側でunitErrorMessage()を使って言語別に訳す）。
    expect(() => evaluateExpression("sin(1m)")).toThrow("angle or a dimensionless");
    expect(() => evaluateExpression("(2m)^0.5")).toThrow("integer exponent");
    expect(() => evaluateExpression("sqrt(2m)")).toThrow("must be even");
    expect(() => evaluateExpression("sqrt(-1)")).toThrow("negative value");
  });

  it("逆三角関数・対数・atan2を計算し、角度へ変換する", () => {
    expect(convertQuantity(evaluateExpression("asin(0.5)"), "deg").value).toBeCloseTo(30);
    expect(convertQuantity(evaluateExpression("acos(0)"), "deg").value).toBeCloseTo(90);
    expect(convertQuantity(evaluateExpression("atan(1)"), "deg").value).toBeCloseTo(45);
    expect(convertQuantity(evaluateExpression("atan2(1m, 1m)"), "deg").value).toBeCloseTo(45);
    expect(evaluateExpression("ln(e)").siValue).toBeCloseTo(1);
    expect(evaluateExpression("log(1000)").siValue).toBeCloseTo(3);
    expect(evaluateExpression("log2(8)").siValue).toBeCloseTo(3);
  });

  it("逆三角関数・対数・atan2の不正な引数を拒否する", () => {
    expect(() => evaluateExpression("asin(2)")).toThrow("-1 and 1");
    expect(() => evaluateExpression("log(0)")).toThrow("greater than 0");
    expect(() => evaluateExpression("ln(1m)")).toThrow("angle or a dimensionless");
    expect(() => evaluateExpression("atan2(1m, 1s)")).toThrow("same dimension");
  });

  it("自作関数を引数付きで呼び出し、次元演算を再利用する", () => {
    const functions = [{ name: "circleArea", parameters: ["r"], expression: "pi × r^2" }];
    expect(convertQuantity(evaluateExpression("circleArea(3m)", [], functions), "m²").value).toBeCloseTo(9 * Math.PI);
  });

  it("自作関数の引数数と再帰呼び出しを拒否する", () => {
    expect(() => evaluateExpression("circleArea()", [], [{ name: "circleArea", parameters: ["r"], expression: "pi × r^2" }])).toThrow("requires 1 argument");
    expect(() => evaluateExpression("loop(1)", [], [{ name: "loop", parameters: ["x"], expression: "loop(x)" }])).toThrow("recursively");
  });

  it("質量と標準重力の乗算から力を計算し、加速度候補を地域別に提示する", () => {
    expect(convertQuantity(evaluateExpression("2kg × 1G"), "N").value).toBeCloseTo(19.6133);
    const accelerationGroup = UNIT_GROUPS.find((group) => group.id === "acceleration");
    expect(accelerationGroup).toBeDefined();
    expect(getRegionalUnits(accelerationGroup!, "metric").map((unit) => unit.symbol)).toEqual(["m/s²", "Gal", "mGal", "G"]);
    expect(getRegionalUnits(accelerationGroup!, "us").map((unit) => unit.symbol)).toEqual(["ft/s²", "G", "m/s²", "Gal", "mGal"]);
  });

  it("結果と同じ次元の単位グループだけを返す", () => {
    const length = evaluateExpression("5cm");
    const symbols = getCompatibleUnitGroups(length.dimension).flatMap((group: UnitGroup) => group.units.map((unit) => unit.symbol));
    expect(symbols).toContain("cm");
    expect(symbols).toContain("km");
    expect(symbols).not.toContain("kg");

    const ratio = evaluateExpression("0.25");
    const ratioSymbols = getCompatibleUnitGroups(ratio.dimension).flatMap((group: UnitGroup) => group.units.map((unit) => unit.symbol));
    expect(ratioSymbols).toContain("%");
    expect(ratioSymbols).toContain("ppm");
    expect(ratioSymbols).not.toContain("cm");
  });

  it("すべてのサンプル式を計算し、指定単位で表示できる", () => {
    SAMPLE_CALCULATIONS.forEach((sample) => {
      const result = evaluateExpression(sample.expression);
      expect(() => formatQuantity(result, sample.targetUnit)).not.toThrow();
    });
  });

  it("華氏・摂氏・ケルビンを温度次元として相互変換する", () => {
    expect(formatQuantity(evaluateExpression("32°F"), "°C")).toBe("0 °C");
    expect(formatQuantity(evaluateExpression("0°C"), "K")).toBe("273.15 K");
  });

  it("米国慣用単位をSI経由で正しく換算する", () => {
    expect(formatQuantity(evaluateExpression("1ft"), "in")).toBe("12 in");
    expect(formatQuantity(evaluateExpression("1mi ÷ 1h"), "mph")).toBe("1 mph");
  });

  it("地域別プリセットでは慣用単位を優先表示する", () => {
    const lengthGroup = UNIT_GROUPS.find((group) => group.id === "length");
    expect(lengthGroup).toBeDefined();
    expect(getRegionalUnits(lengthGroup!, "us").map((unit) => unit.symbol)).toEqual(["in", "ft", "yd", "mi"]);
    expect(getRegionalUnits(lengthGroup!, "metric").map((unit) => unit.symbol)).toEqual(["m", "km", "cm", "mm"]);
  });

  it("ロケール指定時は利用者の小数点表記で結果を整形する", () => {
    expect(formatNumberForLocale(5.1, "en-US")).toBe("5.1");
    expect(formatNumberForLocale(5.1, "de-DE")).toBe("5,1");
  });

  it("単位検索は地域別プリセット内から記号とカテゴリで候補を返す", () => {
    expect(searchUnitOptions("psi", "us").map((result) => result.unit.symbol)).toEqual(["psi"]);
    expect(searchUnitOptions("pressure", "us").map((result) => result.unit.symbol)).toEqual(["psi", "atm"]);
    // 燃費の mpg は読みが「マイル毎米ガロン」なので "gal" でも当たる（燃費を探している
    // 利用者にとっては当たった方がよい）。加速度のGalと同居するが、記号は別なので混同しない。
    expect(searchUnitOptions("gal", "metric").map((result) => result.unit.symbol)).toEqual(["Gal", "mGal", "mpg"]);
  });

  it("候補への登録済み・計算可能な候補外・未対応の単位を区別する", () => {
    expect(getUnitRegistration("cm").status).toBe("registered");
    expect(getUnitRegistration("Sv").status).toBe("supported");
    expect(getUnitRegistration("madeUpUnit").status).toBe("unknown");
  });

  it("別表記も登録済み候補として扱い、正式な記号へ寄せる", () => {
    const hour = getUnitRegistration("hour");
    expect(hour.status).toBe("registered");
    expect(hour.canonical).toBe("h");
    expect(hour.matchedAlias).toBe("hour");
    expect(getUnitRegistration("g0").canonical).toBe("G");
    expect(canonicalUnitSymbol("SEC")).toBe("s");
    expect(canonicalUnitSymbol("cm")).toBe("cm");
    expect(canonicalUnitSymbol("madeUpUnit")).toBe("madeUpUnit");
  });

  it("sec・hour など英語表記の時間単位でも計算できる", () => {
    expect(formatQuantity(evaluateExpression("90sec"), "min")).toBe("1.5 min");
    expect(formatQuantity(evaluateExpression("1hour"), "min")).toBe("60 min");
    expect(formatQuantity(evaluateExpression("2hours + 30min"), "h")).toBe("2.5 h");
    expect(formatQuantity(evaluateExpression("120km ÷ 2hour"), "km/h")).toBe("60 km/h");
    expect(formatQuantity(evaluateExpression("100m ÷ 10sec"), "m/s")).toBe("10 m/s");
    expect(formatQuantity(evaluateExpression("1day"), "hour")).toBe("24 hour");
    expect(formatQuantity(evaluateExpression("500msec"), "s")).toBe("0.5 s");
  });

  it("時間単位には読みと別表記を持たせ、min だけが浮かないようにする", () => {
    const timeGroup = UNIT_GROUPS.find((group) => group.id === "time");
    expect(timeGroup?.units.map((unitOption) => unitOption.name?.ja)).toEqual(["秒", "ミリ秒", "分", "時間", "日", "年"]);
    expect(timeGroup?.units.find((unitOption) => unitOption.symbol === "h")?.aliases).toContain("hour");
    expect(searchUnitOptions("hour", "metric")[0].unit.symbol).toBe("h");
    expect(searchUnitOptions("秒", "metric").map((result) => result.unit.symbol)).toContain("s");
  });

  it("異なる次元の加算を拒否する", () => {
    expect(() => evaluateExpression("1m + 1s")).toThrow("same dimension");
  });
});

describe("Unicode識別子（下付き文字・ギリシャ文字の定数名）", () => {
  it("下付き文字を含む定数名をevaluateExpressionで参照できる", () => {
    const mo = { ...parseConstantDefinition("mₒ = 200g"), createdAt: "" };
    const result = evaluateExpression("mₒ*2", [mo]);
    expect(formatQuantity(result, "g")).toBe("400 g");
  });

  it("ギリシャ文字を含む定数名をevaluateExpressionで参照できる", () => {
    const theta = { ...parseConstantDefinition("θ₁ = 30deg"), createdAt: "" };
    const result = evaluateExpression("θ₁", [theta]);
    expect(formatQuantity(result, "deg")).toBe("30 deg");
  });

  it("parseConstantDefinitionがUnicode識別子の名前を認識する", () => {
    const parsed = parseConstantDefinition("λ = 0.77m");
    expect(parsed.symbol).toBe("λ");
    expect(formatQuantity(parsed.quantity, "m")).toBe("0.77 m");
  });

  it("2μmは引き続き2マイクロメートルという単位として解釈される（数値直後は単位解決が優先）", () => {
    const result = evaluateExpression("2μm");
    expect(formatQuantity(result, "µm")).toBe("2 µm");
  });

  it("式中に単独で現れるμは定数として解決される（識別子解決が単位解決より先）", () => {
    const mu = { ...parseConstantDefinition("μ = 0.7"), createdAt: "" };
    const result = evaluateExpression("μ*9.8*50", [mu]);
    expect(result.siValue).toBeCloseTo(343);
  });

  it("Cという名前の定数はファラド単位をシャドーイングして参照でき、電気量C*Vはクーロン単位に変換できる", () => {
    const capacitance = { ...parseConstantDefinition("C = 100uF"), createdAt: "" };
    const result = evaluateExpression("C*12V", [capacitance]);
    expect(formatQuantity(result, "mC")).toBe("1.2 mC");
  });

  it("Ω・%・°・Ohmの解釈はUnicode識別子の追加後も変わらない", () => {
    expect(formatQuantity(evaluateExpression("5Ohm"), "Ω")).toBe("5 Ω");
    expect(evaluateExpression("Ω").dimension).toEqual(evaluateExpression("Ohm").dimension);
    expect(formatQuantity(evaluateExpression("350°F"), "°C")).toBe("176.6666667 °C");
    expect(formatQuantity(evaluateExpression("10%"))).toBe("0.1");
  });
});

describe("πの定数定義（normalizeでpiへ書き換えないこと）", () => {
  it("π を定数として定義したら、円周率ではなくその値が使われる", () => {
    const constants = [{ ...parseConstantDefinition("π = 3"), createdAt: "" }];
    expect(evaluateExpression("π", constants).siValue).toBe(3);
    expect(evaluateExpression("π*2", constants).siValue).toBe(6);
  });

  it("定義が無ければ π は従来どおり円周率として解決される", () => {
    expect(evaluateExpression("π").siValue).toBeCloseTo(Math.PI);
    expect(evaluateExpression("pi").siValue).toBeCloseTo(Math.PI);
  });

  it("piという名前の定数も円周率より優先される", () => {
    const constants = [{ ...parseConstantDefinition("pi = 4"), createdAt: "" }];
    expect(evaluateExpression("pi", constants).siValue).toBe(4);
  });
});

describe("πを含む暗黙の掛け算", () => {
  it("数値に*なしでπが続いても円周率として解決される", () => {
    expect(evaluateExpression("2π").siValue).toBeCloseTo(2 * Math.PI);
    expect(evaluateExpression("sin(2π)").siValue).toBeCloseTo(Math.sin(2 * Math.PI));
  });

  it("πの直後に単位が続いても（πと単位の間に*が無くても）解決される", () => {
    expect(evaluateExpression("πrad").siValue).toBeCloseTo(Math.PI);
    expect(evaluateExpression("π rad").siValue).toBeCloseTo(Math.PI);
    expect(evaluateExpression("2πrad").siValue).toBeCloseTo(2 * Math.PI);
  });

  it("πを再定義していても暗黙の掛け算はその値を使う", () => {
    const constants = [{ ...parseConstantDefinition("π = 3"), createdAt: "" }];
    expect(evaluateExpression("2π", constants).siValue).toBe(6);
  });

  it("πradという名前の保存定数がある場合は、π×radへ分割せず保存値を使う", () => {
    const constants = [{ ...parseConstantDefinition("πrad = 3"), createdAt: "" }];
    expect(evaluateExpression("πrad", constants).siValue).toBe(3);
  });

  it("括弧が続く場合も暗黙の掛け算になる（数値の書き忘れ演算子の誤りとは区別する）", () => {
    expect(evaluateExpression("2(3+4)").siValue).toBe(14);
    expect(evaluateExpression("(2+3)m").siValue).toBeCloseTo(5);
  });

  it("数量どうしが並んだだけの入力（演算子の書き忘れ）は従来どおりエラーにする", () => {
    expect(() => evaluateExpression("2 3")).toThrow();
  });
});

describe("メートル馬力（PS / CV）", () => {
  it("PSとCVは同じ735.49875Wで、英馬力hpとは別の値になる", () => {
    expect(evaluateExpression("1PS").siValue).toBeCloseTo(735.49875);
    expect(evaluateExpression("1CV").siValue).toBeCloseTo(735.49875);
    // 75kgf·m/s = 75 × 9.80665。定義どおり厳密な値であることを確認する。
    expect(evaluateExpression("1PS").siValue).toBe(75 * 9.80665);
    expect(evaluateExpression("1hp").siValue).not.toBeCloseTo(735.49875);
  });

  it("独仏のカタログ値を kW へ正しく直す（hpと混同すると1.4%ずれる）", () => {
    expect(convertQuantity(evaluateExpression("100PS"), "kW").value).toBeCloseTo(73.549875);
    expect(convertQuantity(evaluateExpression("100hp"), "kW").value).toBeCloseTo(74.5699871582);
  });

  it("小文字の ps はピコ秒のまま（別表記に小文字を足していない）", () => {
    // PS を足したことで ps がメートル馬力へ化けると、時間の計算が黙って壊れる。
    expect(evaluateExpression("1ps").siValue).toBeCloseTo(1e-12);
    expect(formatQuantity(evaluateExpression("1ps"), "s")).toBe("1e-12 s");
  });

  it("CV は別表記として登録済み単位のPSへ寄せる", () => {
    const registration = getUnitRegistration("CV");
    expect(registration.status).toBe("registered");
    expect(registration.canonical).toBe("PS");
  });

  it("PSは電力グループの単位として選べる（比較表・単位チップに出る）", () => {
    const power = UNIT_GROUPS.find((group) => group.id === "power");
    expect(power?.units.map((unitOption) => unitOption.symbol)).toContain("PS");
  });
});

describe("燃費（走行距離÷燃料）", () => {
  it("mi/gal が逆面積のまま出ず、mpg として読める", () => {
    // 以前は 55mi/1gal が「2.33829e+7 1/m²」としか出せず、燃費として読めなかった。
    const economy = evaluateExpression("55mi/1gal");
    expect(convertQuantity(economy, "mpg").value).toBeCloseTo(55);
    expect(convertQuantity(economy, "km/L").value).toBeCloseTo(23.3829, 3);
  });

  it("米ガロンと英ガロンで同じ「mpg」が約20%違うことを別記号で区別する", () => {
    const economy = evaluateExpression("55mi/1gal");
    expect(convertQuantity(economy, "mpgUK").value).toBeCloseTo(66.0522, 3);
    expect(convertQuantity(evaluateExpression("20km/1L"), "mpg").value).toBeCloseTo(47.0428, 3);
  });

  it("燃費グループは逆面積の次元で、既存グループと衝突しない", () => {
    const groups = getCompatibleUnitGroups(evaluateExpression("20km/1L").dimension);
    expect(groups.map((group) => group.id)).toEqual(["fuelEconomy"]);
    // 逆向きの「100kmあたりの燃料」は面積と同じ次元なので、面積の単位チップを汚さないよう
    // グループにしていない（ノート側で「消費量 ÷ 距離 × 100km」を L で出す）。
    expect(getCompatibleUnitGroups(evaluateExpression("1L/100km").dimension).map((group) => group.id)).toEqual(["area"]);
  });

  it("地域ごとに先に出す燃費の単位を変える", () => {
    const fuelEconomy = UNIT_GROUPS.find((group) => group.id === "fuelEconomy");
    expect(getRegionalUnits(fuelEconomy!, "metric").map((unitOption) => unitOption.symbol)[0]).toBe("km/L");
    expect(getRegionalUnits(fuelEconomy!, "us").map((unitOption) => unitOption.symbol)[0]).toBe("mpg");
    expect(getRegionalUnits(fuelEconomy!, "uk").map((unitOption) => unitOption.symbol)[0]).toBe("mpgUK");
  });
});

describe("科学表記（×10 のべき乗）", () => {
  it("上付き数字はべき乗として読む", () => {
    // ASCIIの桁に直すだけの実装では 10⁸ が 108 になり、エラーにならないまま別の値を返していた。
    expect(evaluateExpression("10⁸").siValue).toBe(1e8);
    expect(evaluateExpression("1.72×10⁻⁸").siValue).toBeCloseTo(1.72e-8, 20);
    expect(evaluateExpression("2⁻³").siValue).toBeCloseTo(0.125);
    // 連なった上付き（⁻¹¹ や ¹²）は1つの指数としてまとめる。桁ごとに ^ を挟むと 10^1^2 になる。
    expect(evaluateExpression("10¹²").siValue).toBe(1e12);
    expect(evaluateExpression("6.674×10⁻¹¹").siValue).toBeCloseTo(6.674e-11, 20);
  });

  it("べき乗のあとに単位を直接続けられる（括弧も * も要らない）", () => {
    // 指数の位置に来た数値の単位サフィックスを貪欲に取り込むと m/s が指数として読まれ、
    // 「指数は無次元でなければ」で落ちていた（3×10^8*m/s と書く必要があった）。
    expect(convertQuantity(evaluateExpression("3×10^8m/s"), "m/s").value).toBeCloseTo(3e8);
    expect(convertQuantity(evaluateExpression("3×10⁸m/s"), "m/s").value).toBeCloseTo(3e8);
    expect(convertQuantity(evaluateExpression("1.72×10⁻⁸Ohm*m"), "Ohm*m").value).toBeCloseTo(1.72e-8, 20);
    expect(convertQuantity(evaluateExpression("10⁻³m"), "mm").value).toBeCloseTo(1);
    // 後続の演算も普通に続けられる（以前は 3×108×2 = 648 m と黙って桁が違った）。
    expect(convertQuantity(evaluateExpression("3×10⁸m/s × 2s"), "m").value).toBeCloseTo(6e8);
  });

  it("従来の e 表記と単位付きの書き方は変わらない", () => {
    expect(convertQuantity(evaluateExpression("1.72e-8Ohm*m"), "Ohm*m").value).toBeCloseTo(1.72e-8, 20);
    expect(convertQuantity(evaluateExpression("6.674e-11N*m²/kg² × 5.97e24kg ÷ (6371km)^2"), "m/s²").value).toBeCloseTo(9.8162, 3);
    // 上付きの単位（m²）は従来どおり単位サフィックスとして解決する。
    expect(convertQuantity(evaluateExpression("100N ÷ 0.01m²"), "kPa").value).toBeCloseTo(10);
    expect(convertQuantity(evaluateExpression("20A² × 0.258Ohm"), "W").value).toBeCloseTo(5.16);
    expect(convertQuantity(evaluateExpression("(20A)^2 × 0.258Ohm"), "W").value).toBeCloseTo(103.2);
  });

  it("括弧のあとの上付きもべき乗になる", () => {
    // 以前は (2m)³ が (2m)3 になり「式の構文が正しくありません」で落ちていた。
    expect(convertQuantity(evaluateExpression("(2m)³"), "m³").value).toBeCloseTo(8);
    expect(convertQuantity(evaluateExpression("(20A)² × 0.258Ohm"), "W").value).toBeCloseTo(103.2);
  });

  it("無次元の単位は指数として意味を持つので取り込みを変えない", () => {
    // % と ° は無次元なので 2^3% = 2^0.03 は今も正しい式。ここまで切り離すと値が変わる。
    expect(evaluateExpression("2^3%").siValue).toBeCloseTo(1.0210121);
    // 次元を持つ単位を指数に置いた式は、切り離さず従来どおりエラーにする（意味が無いため）。
    expect(() => evaluateExpression("2^(3m)")).toThrow();
    expect(() => evaluateExpression("2^3°C")).toThrow();
  });
});

describe("圧力・応力の単位（N/mm² と重量キログラム）", () => {
  it("N/mm² は MPa と同じ値で、複合単位として解決する", () => {
    expect(convertQuantity(evaluateExpression("1N/mm²"), "MPa").value).toBeCloseTo(1);
    expect(convertQuantity(evaluateExpression("205000N/mm²"), "GPa").value).toBeCloseTo(205);
    // 別表記（上付きを使わない書き方）も同じ値。
    expect(convertQuantity(evaluateExpression("1N/mm2"), "MPa").value).toBeCloseTo(1);
    expect(convertQuantity(evaluateExpression("1N/mm^2"), "MPa").value).toBeCloseTo(1);
  });

  it("hPa / GPa と重量キログラム系が通る", () => {
    expect(convertQuantity(evaluateExpression("1013hPa"), "atm").value).toBeCloseTo(0.99975, 4);
    expect(convertQuantity(evaluateExpression("205GPa"), "MPa").value).toBeCloseTo(205000);
    expect(convertQuantity(evaluateExpression("1kgf"), "N").value).toBeCloseTo(9.80665);
    // 独語圏の Kilopond。英字の別表記は BASE_UNITS へ自動登録されるので式でも使える。
    expect(convertQuantity(evaluateExpression("1kp"), "N").value).toBeCloseTo(9.80665);
    expect(convertQuantity(evaluateExpression("1kgf/cm²"), "kPa").value).toBeCloseTo(98.0665);
    expect(convertQuantity(evaluateExpression("2kgf/cm²"), "psi").value).toBeCloseTo(28.4468, 3);
  });

  it("圧力・力グループへ足しても表示単位の自動選択が変わらない", () => {
    // N/mm² は MPa と同じ倍率1e6。**MPa より後ろに置いてある**ので、応力の結果は MPa のまま
    // （前に置くと同じ倍率の先着だけが残る仕様のせいで N/mm² と表示されるようになる）。
    const at = (expression: string) =>
      resolveDisplayUnit({ quantity: evaluateExpression(expression), requestedUnit: "", expressionUnits: [], system: "metric", isAdvancedMode: true }).unit;
    expect(at("1e6Pa")).toBe("MPa");
    expect(at("100N ÷ 0.01m²")).toBe("kPa");
    // hPa（倍率100）を足しても kPa の方が数字が小さくなるので選ばれない。
    expect(at("50000Pa")).toBe("kPa");
    expect(at("500Pa")).toBe("Pa");
    // kgf（倍率9.80665）は10のべき乗でないため自動選択の候補に入らない。
    expect(at("2kg × 9.8m/s²")).toBe("N");
    // GPa は新しく候補に入る倍率なので、ヤング率がSI表記のまま出ていたのが読めるようになる。
    expect(at("205e9Pa")).toBe("GPa");
  });
});

describe("指数と単位サフィックスの境界（CodeRabbitの提案で明示的に固定）", () => {
  it("引き算の右辺を指数と誤判定しない", () => {
    // isExponentPosition は単項の符号（+ / -）を跨いで `^` を探すので、`2^3 - 8m` の
    // `8m` を指数と読む余地がある。指数として読まれると「指数は無次元でなければ」で
    // 落ちるので、**どのエラーで落ちるか**で判別できる（次元不一致＝8mは量として読めている）。
    let code = "";
    try {
      evaluateExpression("2^3 - 8m");
    } catch (error) {
      code = (error as { code?: string }).code ?? "";
    }
    expect(code).toBe("dimensionMismatchAddSubtract");
    // 引き算の中でも指数の切り離しは効く（`2^3m` は 2^3 × 1m ＝ 8 m）。
    expect(convertQuantity(evaluateExpression("100m - 2^3m"), "m").value).toBeCloseTo(92);
    expect(convertQuantity(evaluateExpression("2^-3m"), "mm").value).toBeCloseTo(125);
  });

  it("上付き数字を ^n へ書き換えても単位サフィックスは従来どおり解決する", () => {
    // normalize が上付きを桁だけに直していた頃は `m²` が `m2` として通っていた。
    // `^` を補う形に変えたので、`m^2` としても同じ単位に解決できることを固定する。
    expect(parseUnit("m²").scale).toBe(1);
    expect(parseUnit("m²").dimension).toEqual(parseUnit("m^2").dimension);
    expect(parseUnit("m²").dimension).toEqual(parseUnit("m2").dimension);
    expect(parseUnit("N/mm²").scale).toBeCloseTo(1e6);
    expect(parseUnit("N/mm²").dimension).toEqual(parseUnit("MPa").dimension);
    // 負の指数（`m⁻²` → `m^-2`）も1因子あたりの正規表現が受け付ける。逆面積の次元になる
    // （`1/m²` は parseUnit では書けない——1因子あたり数字を受け付けないため）。
    expect(parseUnit("m⁻²").dimension).toEqual([-2, 0, 0, 0, 0, 0, 0]);
  });
});
