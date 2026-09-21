import { describe, expect, it } from "vitest";

import {
  getPresetUnitExamples,
  resolveUnitContext,
  suggestCompanionUnits,
  unitExamplesFromHistory,
  unitGroupIdForSymbol,
  type UnitExample,
} from "../lib/unit-context-suggestions";
import { analyzeExpression } from "../lib/unit-input";
import { findRegisteredUnit } from "../lib/units";

const contextFor = (expression: string, caret: number = expression.length) =>
  resolveUnitContext({ analysis: analyzeExpression(expression), caret });

const symbols = (suggestions: { unit: { symbol: string } }[]) => suggestions.map((suggestion) => suggestion.unit.symbol);
const groupIds = (suggestions: { group: { id: string } }[]) => suggestions.map((suggestion) => suggestion.group.id);

describe("キャレットの直前の演算子から文脈を読む", () => {
  it("足し引きの直後は、左側の項の単位グループを返す", () => {
    // `1m+` は次元不一致のエラーがまだ出ない（裸の数値すら無い）ので、
    // requiredUnitGroupFromError では拾えない場面。
    expect(contextFor("1m+")).toEqual({ operator: "additive", leftSymbol: "m", leftGroupId: "length" });
    expect(contextFor("1m+2")).toEqual({ operator: "additive", leftSymbol: "m", leftGroupId: "length" });
    expect(contextFor("1m + ")).toEqual({ operator: "additive", leftSymbol: "m", leftGroupId: "length" });
  });

  it("掛け算・割り算の直後も左側の単位を返す（キーパッドの ÷ もキーボードの / も同じ）", () => {
    // `12V/4.7` はオームの法則を書いている途中。裸の数値の足し引きではないのでエラーは出ず、
    // 従来はよく使う単位（mm・cm・m・km・g…）が並んでいた。
    expect(contextFor("12V/4.7")).toEqual({ operator: "multiplicative", leftSymbol: "V", leftGroupId: "voltage" });
    expect(contextFor("12V ÷ ")).toEqual({ operator: "multiplicative", leftSymbol: "V", leftGroupId: "voltage" });
  });

  it("括弧の内側でも、その項の単位を見る", () => {
    // 2*(3m+ は括弧の中で長さを足している途中。
    expect(contextFor("2*(3m+")).toEqual({ operator: "additive", leftSymbol: "m", leftGroupId: "length" });
  });

  it("べき乗と閉じ括弧は跨いで左側の単位を探す", () => {
    // (2m)^2× は面積 × 何か だが、少なくとも「長さの分野の計算」であることは読める。
    expect(contextFor("(2m)^2×")).toEqual({ operator: "multiplicative", leftSymbol: "m", leftGroupId: "length" });
  });

  it("項の切れ目（+ − ( ,）を跨いだ単位は左側の単位にしない", () => {
    // 1m+2× の × の左は裸の 2。m は + の向こう側なので、掛ける相手の次元は決められない。
    expect(contextFor("1m+2×")).toBeNull();
    expect(contextFor("5+")).toBeNull();
  });

  it("演算子の直後でなければ何も返さない", () => {
    // 単位の上・数値の途中は、既存の差し替え・単位付けの経路が候補を出す場面。
    expect(contextFor("1m")).toBeNull();
    expect(contextFor("")).toBeNull();
  });

  it("キャレットより後ろの式は見ない", () => {
    // `12V ÷ |3kΩ` のように途中へ戻ってから単位を入れる場合も、左側だけで決める。
    expect(contextFor("12V ÷ 3kΩ", 6)).toEqual({ operator: "multiplicative", leftSymbol: "V", leftGroupId: "voltage" });
  });

  it("単位チップに無い記号でも、次元からグループを読む", () => {
    // kWh は BASE_UNITS に完全一致のキーが無く SI接頭語の分解でだけ解決する（＝UnitOption が
    // 無い）が、電気料金・消費電力量の計算でいちばん打たれる単位。登録の有無で判断すると
    // `1kWh÷` の候補が出せない。kΩ は登録済みなので従来どおり。
    expect(resolveUnitContext({ analysis: analyzeExpression("1kWh÷"), caret: 5 })).toEqual({ operator: "multiplicative", leftSymbol: "kWh", leftGroupId: "energy" });
    expect(contextFor("4.7kΩ×")).toEqual({ operator: "multiplicative", leftSymbol: "kΩ", leftGroupId: "resistance" });
    // グループを持たない合成次元・無次元は諦める（並べる単位の一覧が無い）。
    expect(unitGroupIdForSymbol("N*m²/C²")).toBeUndefined();
    expect(unitGroupIdForSymbol("m/m")).toBeUndefined();
    expect(unitGroupIdForSymbol("zzz")).toBeUndefined();
    expect(unitGroupIdForSymbol("kWh")).toBe("energy");
  });

  it("登録済み単位として引けない左辺は諦める", () => {
    // 綴りが崩れた単位（mpa）は修正候補を出す経路の担当。次元が合成のまま（N·m²/C²）で
    // 対応するグループが無い単位も、並べる候補の一覧が無いので諦める。
    expect(contextFor("3mpa×")).toBeNull();
    expect(contextFor("2N*m²/C²×")).toBeNull();
    // なお kN*m（トルク）は次元がエネルギーと同じなので、エネルギーの相手が出る。
    expect(contextFor("2kN*m×")?.leftGroupId).toBe("energy");
  });
});

describe("計算履歴から単位の組み合わせを読む", () => {
  it("式の単位と表示単位を、出てきた順に1つの例としてまとめる", () => {
    // 12V / 4.7kΩ を mA で見た履歴は「電圧・抵抗・電流が一緒に出る」という実例そのもの。
    expect(unitExamplesFromHistory([{ expression: "12V / 4.7kΩ", targetUnit: "mA" }])).toEqual([{ symbols: ["V", "kΩ", "mA"] }]);
  });

  it("履歴の並び（新しい順）をそのまま保つ", () => {
    const examples = unitExamplesFromHistory([
      { expression: "2kg × 9.8m/s²", targetUnit: "N" },
      { expression: "12V / 4.7kΩ", targetUnit: "mA" },
    ]);
    expect(examples.map((example) => example.symbols[0])).toEqual(["kg", "V"]);
  });

  it("同じ単位は1度だけ、別表記は正式な記号に寄せる", () => {
    // 5Ohm は式では使えるが単位チップの記号は Ω。例の中で別物として数えると候補が重複する。
    expect(unitExamplesFromHistory([{ expression: "3m + 2m", targetUnit: "m" }])).toEqual([{ symbols: ["m"] }]);
    expect(unitExamplesFromHistory([{ expression: "5Ohm × 2A", targetUnit: "V" }])).toEqual([{ symbols: ["Ω", "A", "V"] }]);
  });

  it("単位チップに無い記号（kWh）は綴りのまま残す", () => {
    // チップとしては出せないが、「電力量と一緒に何が使われるか」というグループの数え上げに効く。
    expect(unitExamplesFromHistory([{ expression: "2kWh / 3h", targetUnit: "kW" }])).toEqual([{ symbols: ["kWh", "h", "kW"] }]);
  });

  it("単位が1つも無い履歴は例にしない", () => {
    // 裸の数値だけの計算（3 + 4）は「何と何が組むか」を語らない。
    expect(unitExamplesFromHistory([{ expression: "3 + 4", targetUnit: "" }])).toEqual([]);
  });
});

describe("プリセット計算ノートとサンプルから作る例", () => {
  it("十分な件数があり、記号はすべて登録済み単位として引ける", () => {
    // 計算履歴がまだ無い利用者への代わりなので、少なすぎると `12V ÷ ` で何も出せない。
    const examples = getPresetUnitExamples();
    expect(examples.length).toBeGreaterThanOrEqual(100);
    examples.forEach((example) => {
      example.symbols.forEach((symbol) => expect(unitGroupIdForSymbol(symbol), symbol).toBeTruthy());
    });
  });

  it("2つ以上の次元が出てくる例だけを残す", () => {
    // 5cm + 1mm のように長さしか出てこない例は「長さと何が組むか」を何も語らない。
    getPresetUnitExamples().forEach((example) => {
      const ids = new Set(example.symbols.map((symbol) => unitGroupIdForSymbol(symbol)));
      expect(ids.size).toBeGreaterThanOrEqual(2);
    });
  });
});

describe("掛け算・割り算の相手の候補", () => {
  const voltageHistory: UnitExample[] = [{ symbols: ["V", "kΩ", "mA"] }];
  const companions = (options: Partial<Parameters<typeof suggestCompanionUnits>[0]> & { leftGroupId: string }) =>
    suggestCompanionUnits({ recentExamples: [], corpusExamples: [], system: "metric", limit: 8, ...options });

  it("計算履歴の例は、出てきた順（＝新しい順）のまま先頭に並べる", () => {
    // 12V / 4.7kΩ → mA を計算した履歴があるなら、次に `12V ÷ ` と打った人が欲しいのは kΩ。
    const suggestions = companions({ leftGroupId: "voltage", recentExamples: voltageHistory });
    expect(symbols(suggestions).slice(0, 2)).toEqual(["kΩ", "mA"]);
    // 実例の単位のあとは、その単位のグループ（抵抗・電流）で埋める。
    expect(groupIds(suggestions).slice(2)).toEqual(expect.arrayContaining(["resistance", "current"]));
  });

  it("計算履歴はプリセットより先に並ぶ", () => {
    // 自分がやった計算の方が、一般的な組み合わせより確か。
    const suggestions = companions({ leftGroupId: "voltage", recentExamples: voltageHistory, corpusExamples: getPresetUnitExamples() });
    expect(symbols(suggestions).slice(0, 2)).toEqual(["kΩ", "mA"]);
  });

  it("プリセット・サンプルの例は件数の多い順に並べる", () => {
    // 出てきた順で拾うと、1件の例にしか出てこない s・kJ がアンペアのすぐ隣に並んでしまう
    // （実測で A・s・kJ・Ω だった）。何件の例に出てくるかで並べると A・W・mA・Ω になる。
    const suggestions = companions({ leftGroupId: "voltage", corpusExamples: getPresetUnitExamples() });
    expect(symbols(suggestions).slice(0, 4)).toEqual(["A", "W", "mA", "Ω"]);
    // 力学・長さも同じ規則で、実際に一緒に計算されている単位が先に出る。
    // 質量の先頭は加速度（F = ma）で固定する。2番目以降は corpus の件数しだいで動く
    // （実験レポートの質量パーセント濃度が g と % を結び付けているので、いまは % が N より前）ので、
    // 「N が上位に残っていること」だけを見る——順位そのものを固定するとサンプルを1件足すたびに落ちる。
    const massCompanions = symbols(companions({ leftGroupId: "mass", corpusExamples: getPresetUnitExamples() }));
    expect(massCompanions[0]).toBe("m/s²");
    expect(massCompanions.slice(0, 4)).toContain("N");
    expect(symbols(companions({ leftGroupId: "length", corpusExamples: getPresetUnitExamples() }))[0]).toBe("m/s");
  });

  it("1つのグループで枠を埋め尽くさない（1巡3件ずつ）", () => {
    // 抵抗が8枠を独占すると、2番目に近い電流が1つも出ない。
    const suggestions = companions({ leftGroupId: "voltage", recentExamples: voltageHistory });
    expect(groupIds(suggestions).filter((id) => id === "resistance").length).toBeLessThanOrEqual(5);
    expect(groupIds(suggestions)).toContain("current");
  });

  it("左側と同じグループの単位は出さない", () => {
    // `12V ÷ ` の相手に V・mV を並べても、打ちたいものにならない。
    const suggestions = companions({ leftGroupId: "voltage", recentExamples: voltageHistory, corpusExamples: getPresetUnitExamples() });
    expect(groupIds(suggestions)).not.toContain("voltage");
  });

  it("長さの相手は、実例のとおり時間と速度になる", () => {
    // 1km ÷ 5m/s → min のような「距離 ÷ 速さ」の実例から引く。
    const suggestions = companions({ leftGroupId: "length", recentExamples: [{ symbols: ["km", "min", "km/h"] }] });
    expect(symbols(suggestions).slice(0, 2)).toEqual(["min", "km/h"]);
  });

  it("チップに出せない記号（kWh）は、グループの順位にだけ効かせる", () => {
    // kWh には UnitOption が無いのでチップとしては出せないが、「電力量と一緒に使われる」ことは
    // 数えられる。時間のグループが上位に来て、その中の単位（h・s…）がレールに並ぶ。
    const suggestions = companions({ leftGroupId: "energy", recentExamples: [{ symbols: ["kWh", "h"] }], limit: 5 });
    expect(symbols(suggestions)[0]).toBe("h");
    expect(symbols(suggestions)).not.toContain("kWh");
    expect(groupIds(suggestions).every((id) => id === "time")).toBe(true);
    // 左側が電力量でない場合も、例の中の kWh はエネルギーのグループを引き上げる。
    const fromVoltage = companions({ leftGroupId: "voltage", recentExamples: [{ symbols: ["V", "kWh"] }], limit: 3 });
    expect(groupIds(fromVoltage).every((id) => id === "energy")).toBe(true);
    expect(symbols(fromVoltage)).not.toContain("kWh");
  });

  it("計算履歴が無くても、プリセットの例から電気の候補を出せる", () => {
    // 初めて使う人の `12V ÷ ` でもオーム・アンペアの仲間が並ぶ。
    const suggestions = companions({ leftGroupId: "voltage", corpusExamples: getPresetUnitExamples() });
    expect(groupIds(suggestions)).toEqual(expect.arrayContaining(["resistance", "current"]));
  });

  it("例が空でも、同じ分野のグループから候補を出す", () => {
    // 履歴もプリセットも当たらない場合の最後の受け皿（分野は UNIT_GROUP_CLUSTERS）。
    const suggestions = companions({ leftGroupId: "voltage" });
    expect(groupIds(suggestions)).toEqual(expect.arrayContaining(["current", "resistance"]));
  });

  it("分野も実例も無いグループでは空を返す（呼び出し側がよく使う単位へ落とす）", () => {
    // 燃費はどのクラスタにも属していない。ここで無関係な単位を並べるより何も言わない方がよい。
    expect(companions({ leftGroupId: "fuelEconomy" })).toEqual([]);
    expect(companions({ leftGroupId: "", recentExamples: voltageHistory })).toEqual([]);
  });

  it("limit と includeUnit を尊重する", () => {
    // レールに並ぶのは8件で、表示モードで隠している単位は候補にも出さない。
    expect(companions({ leftGroupId: "voltage", recentExamples: voltageHistory, limit: 3 })).toHaveLength(3);
    const filtered = companions({
      leftGroupId: "voltage",
      recentExamples: voltageHistory,
      includeUnit: (group) => group.id !== "resistance",
    });
    expect(groupIds(filtered)).not.toContain("resistance");
    expect(symbols(filtered)[0]).toBe("mA");
  });

  it("直近に使った単位は、実例が引き上げたグループの中でだけ先頭に寄せる", () => {
    // `12V ÷ ` の1件目が直前に打った km になると、文脈の手掛かりが消える。
    const suggestions = companions({ leftGroupId: "voltage", recentExamples: voltageHistory, recentUnits: ["km", "mA"] });
    expect(symbols(suggestions)[0]).toBe("mA");
    expect(symbols(suggestions)).not.toContain("km");
  });
});
