import { describe, expect, it } from "vitest";

import {
  getPaletteUnitSuggestions,
  getUnitInputHint,
  prefixEntryStillValid,
  resolveActivePrefix,
  resolvePaletteTarget,
  resolvePrefixCompletionRange,
  resolvePrefixKeyPress,
} from "../lib/unit-input";
import { UNIT_GROUPS, type UnitGroup } from "../lib/units";

const group = (id: string): UnitGroup => {
  const found = UNIT_GROUPS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`unknown group: ${id}`);
  return found;
};

const symbols = (suggestions: { unit: { symbol: string } }[]) => suggestions.map((suggestion) => suggestion.unit.symbol);

describe("単位パレットの候補", () => {
  it("接頭語が無ければ、そのカテゴリの単位を単位ピッカーと同じ並びで全部返す", () => {
    const result = getPaletteUnitSuggestions(group("length"), "", { system: "metric" });
    expect(symbols(result)).toEqual(["m", "km", "cm", "mm", "µm", "in", "ft", "yd", "mi", "au", "ly"]);
    expect(result.every((suggestion) => suggestion.group.id === "length")).toBe(true);
  });

  it("カテゴリが選ばれていなければ空を返す（呼び出し側が文脈依存の候補へ落とす）", () => {
    expect(getPaletteUnitSuggestions(undefined, "", { system: "metric" })).toEqual([]);
  });

  it("接頭語があれば、そのカテゴリの中で綴りが前方一致する単位だけに絞る", () => {
    expect(symbols(getPaletteUnitSuggestions(group("length"), "k", { system: "metric" }))).toEqual(["km"]);
  });

  it("記号そのものが単位でもある接頭語は、完全一致を先頭に置く", () => {
    // m（メートル）を先に出すのは、接頭語キーをメートルの近道として押す人が打ち直さずに済むようにするため。
    expect(symbols(getPaletteUnitSuggestions(group("length"), "m", { system: "metric" }))).toEqual(["m", "mm", "mi"]);
  });

  it("大文字小文字は別物として扱う（M＝メガ / m＝ミリ）", () => {
    expect(symbols(getPaletteUnitSuggestions(group("power"), "M", { system: "metric" }))).toEqual(["MW"]);
  });

  it("そのカテゴリに一致が無ければ、そのカテゴリの単位を丸ごと出す（パレットを空にしない・他のカテゴリは混ぜない）", () => {
    const result = getPaletteUnitSuggestions(group("time"), "k", { system: "metric" });
    expect(symbols(result)).toEqual(symbols(getPaletteUnitSuggestions(group("time"), "", { system: "metric" })));
    // 点いているチップと中身を食い違わせない（時間を選んでいるのに kg・km・kPa を並べない）。
    expect(result.every((suggestion) => suggestion.group.id === "time")).toBe(true);
  });

  it("includeUnit で隠された単位はパレットにも出さない", () => {
    const result = getPaletteUnitSuggestions(group("length"), "", { system: "metric", includeUnit: (_, unitOption) => unitOption.symbol !== "ly" });
    expect(symbols(result)).not.toContain("ly");
  });

  it("limit を渡したときだけ件数を絞る", () => {
    expect(symbols(getPaletteUnitSuggestions(group("length"), "", { system: "metric", limit: 3 }))).toEqual(["m", "km", "cm"]);
  });
});

describe("接頭語キーのトグル", () => {
  const entry = { start: 2, end: 3, prefix: "k" };

  it("押した直後（キャレットがその1文字の直後・式も記録どおり）は有効", () => {
    expect(resolveActivePrefix("3 k", { start: 3, end: 3 }, entry)).toBe("k");
    expect(resolveActivePrefix("3 k", { start: 3, end: 3 }, null)).toBe(null);
  });

  it("記録した位置の文字が別の文字に打ち換わっていたら無効", () => {
    expect(resolveActivePrefix("3 M", { start: 3, end: 3 }, entry)).toBe(null);
  });

  it("キャレットが離れたら無効（あとから打ち換え・削除しても勝手に復活しない）", () => {
    expect(resolveActivePrefix("3 k", { start: 1, end: 1 }, entry)).toBe(null);
  });

  it("範囲選択中は無効（そのときのキーは選択範囲の置き換えで、接頭語の打ち直しではない）", () => {
    expect(resolveActivePrefix("3 k", { start: 0, end: 3 }, entry)).toBe(null);
  });

  it("AC で式が空になった後の古い記録は無効", () => {
    expect(resolveActivePrefix("", { start: 0, end: 0 }, entry)).toBe(null);
  });

  it("同じキーをもう一度押すと、入れた1文字を消して接頭語なしへ戻す", () => {
    expect(resolvePrefixKeyPress({ expression: "3 k", selection: { start: 3, end: 3 }, prefixEntry: entry, key: "k" }))
      .toEqual({ expression: "3 ", caret: 2, prefixEntry: null });
  });

  it("別の接頭語キーはその場で差し替え、キャレットはその直後に置く", () => {
    expect(resolvePrefixKeyPress({ expression: "3 k", selection: { start: 3, end: 3 }, prefixEntry: entry, key: "M" }))
      .toEqual({ expression: "3 M", caret: 3, prefixEntry: { start: 2, end: 3, prefix: "M" } });
  });

  it("有効な接頭語が無ければ null（呼び出し側は通常の挿入として続ける）", () => {
    expect(resolvePrefixKeyPress({ expression: "3 k", selection: { start: 1, end: 1 }, prefixEntry: entry, key: "M" })).toBe(null);
    expect(resolvePrefixKeyPress({ expression: "3 k", selection: { start: 0, end: 3 }, prefixEntry: entry, key: "M" })).toBe(null);
    expect(resolvePrefixKeyPress({ expression: "", selection: { start: 0, end: 0 }, prefixEntry: entry, key: "M" })).toBe(null);
    expect(resolvePrefixKeyPress({ expression: "3 k", selection: { start: 3, end: 3 }, prefixEntry: null, key: "M" })).toBe(null);
  });
});

describe("接頭語の記録が無効になったかの判定", () => {
  const entry = { start: 1, end: 2, prefix: "k" };

  it("押した直後は有効", () => {
    expect(prefixEntryStillValid(entry, "3k", { start: 2, end: 2 })).toBe(true);
  });

  it("キャレットが離れたら無効（画面側はここで記録を捨て、戻ってきても復活させない）", () => {
    expect(prefixEntryStillValid(entry, "3k", { start: 1, end: 1 })).toBe(false);
    // 戻ってきた位置そのものは「有効」に見えるが、画面側は一度捨てた記録を作り直さないので
    // トグルが勝手に復活することはない（app/(tabs)/index.tsx の placeCaret のコメントを参照）。
    expect(prefixEntryStillValid(entry, "3k", { start: 2, end: 2 })).toBe(true);
  });

  it("式を編集して記録した位置の文字が変わったら無効（⌫ で削ったあと等）", () => {
    expect(prefixEntryStillValid(entry, "3", { start: 1, end: 1 })).toBe(false);
    expect(prefixEntryStillValid(entry, "3M", { start: 2, end: 2 })).toBe(false);
    expect(prefixEntryStillValid(entry, "", { start: 0, end: 0 })).toBe(false);
  });

  it("範囲選択中と記録が無いときは無効", () => {
    expect(prefixEntryStillValid(entry, "3k", { start: 0, end: 2 })).toBe(false);
    expect(prefixEntryStillValid(null, "3k", { start: 2, end: 2 })).toBe(false);
  });
});

describe("パレット選択中にチップが書き換える範囲", () => {
  const hintAt = (expression: string, caret: number) => getUnitInputHint(expression, { system: "metric", caret });

  it("カテゴリを選んでいなければ、従来どおり案内された範囲をそのまま使う", () => {
    const hint = hintAt("3 + 5mpa", 1);
    expect(hint.kind).toBe("fix");
    expect(resolvePaletteTarget({ hint, expression: "3 + 5mpa", caret: 1, hasPaletteGroup: false }))
      .toEqual({ kind: "fix", start: 5, end: 8 });
  });

  it("カテゴリを選んでいて、キャレットが指摘の外にあるならキャレット位置へ入れる", () => {
    // getUnitInputHint の fix は式の中の最後の未解決の単位を指す（キャレットの近くとは限らない）。
    // レールに並ぶのが修正候補ではなくそのカテゴリの単位になる以上、離れた 5mpa を書き換えてはいけない。
    const hint = hintAt("3 + 5mpa", 1);
    // 数値 3 の直後なので、getUnitInputHint がこの位置に付けるのと同じ「単位付け」になる。
    expect(resolvePaletteTarget({ hint, expression: "3 + 5mpa", caret: 1, hasPaletteGroup: true }))
      .toEqual({ kind: "attach", start: 1, end: 1 });
  });

  it("キャレットが指摘の単位の上にあるなら、カテゴリを選んでいても丸ごと差し替える", () => {
    const hint = hintAt("3 + 5mpa", 8);
    expect(resolvePaletteTarget({ hint, expression: "3 + 5mpa", caret: 8, hasPaletteGroup: true }))
      .toEqual({ kind: hint.kind, start: 5, end: 8 });
  });

  it("演算子の直後のような場所では挿入になる", () => {
    const hint = hintAt("3 + 5mpa", 3);
    expect(resolvePaletteTarget({ hint, expression: "3 + 5mpa", caret: 3, hasPaletteGroup: true }))
      .toEqual({ kind: "insert", start: 3, end: 3 });
  });

  it("キャレットが別の単位の上にあれば、その単位を差し替える", () => {
    const hint = hintAt("3cm + 5mpa", 3);
    expect(hint.kind).toBe("fix");
    expect(resolvePaletteTarget({ hint, expression: "3cm + 5mpa", caret: 3, hasPaletteGroup: true }))
      .toEqual({ kind: "replace", start: 1, end: 3 });
  });

  it("fix 以外（補完・差し替え・単位付け）はカテゴリを選んでいても案内された範囲のまま", () => {
    const hint = hintAt("5cm", 3);
    expect(hint.kind).toBe("replace");
    expect(resolvePaletteTarget({ hint, expression: "5cm", caret: 3, hasPaletteGroup: true }))
      .toEqual({ kind: "replace", start: 1, end: 3 });
  });
});

describe("接頭語を確定するときの置き換え範囲", () => {
  const entry = { start: 1, end: 2, prefix: "k" };

  it("直後の単位まで含める（3|m で k を押した 3km に km を当てても m が余らない）", () => {
    expect(resolvePrefixCompletionRange("3km", entry)).toEqual({ start: 1, end: 3 });
  });

  it("伸ばすのは1因子ぶんだけ（分母は残す）", () => {
    expect(resolvePrefixCompletionRange("3km/s", entry)).toEqual({ start: 1, end: 3 });
  });

  it("複数文字の単位も、その一続きが登録済みなら含める", () => {
    expect(resolvePrefixCompletionRange("3kmA", entry)).toEqual({ start: 1, end: 4 });
  });

  it("単位専用の記号（Ω）も含める", () => {
    expect(resolvePrefixCompletionRange("3kΩ", entry)).toEqual({ start: 1, end: 3 });
  });

  it("登録済みの単位でなければ伸ばさない（ローカル定数 x を巻き込まない）", () => {
    expect(resolvePrefixCompletionRange("3kx", entry)).toEqual({ start: 1, end: 2 });
  });

  it("直後に何も無ければ接頭語の1文字のまま", () => {
    expect(resolvePrefixCompletionRange("3k", entry)).toEqual({ start: 1, end: 2 });
  });

  it("空白を跨いで伸ばさない", () => {
    expect(resolvePrefixCompletionRange("3k m", entry)).toEqual({ start: 1, end: 2 });
  });

  it("上付き数字まで含めた記号も1因子として扱う", () => {
    expect(resolvePrefixCompletionRange("3km²", entry)).toEqual({ start: 1, end: 4 });
  });

  it("前方向へは伸ばさない", () => {
    expect(resolvePrefixCompletionRange("12kg", { start: 2, end: 3, prefix: "k" })).toEqual({ start: 2, end: 4 });
  });
});
