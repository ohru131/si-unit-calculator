import { describe, expect, it } from "vitest";

import {
  analyzeExpression,
  getCommonUnitSuggestions,
  getUnitInputHint,
  getUnitSuggestions,
  insertUnitAtEnd,
  replaceExpressionRange,
} from "../lib/unit-input";

const kinds = (input: string, identifiers: string[] = []) =>
  analyzeExpression(input, identifiers).segments.filter((segment) => segment.kind !== "space").map((segment) => `${segment.text}:${segment.kind}`);

describe("式の単位ハイライト", () => {
  it("数値と単位と演算子を区別する", () => {
    expect(kinds("5cm + 1mm")).toEqual(["5:number", "cm:unit", "+:operator", "1:number", "mm:unit"]);
  });

  it("m/s のような複合単位を一つの単位として扱う", () => {
    expect(kinds("10m/s × 2min")).toEqual(["10:number", "m/s:unit", "×:operator", "2:number", "min:unit"]);
  });

  it("保存済み定数と関数は単位ではなく識別子として扱う", () => {
    expect(kinds("W × H", ["W", "H"])).toEqual(["W:identifier", "×:operator", "H:identifier"]);
    expect(kinds("sin(30deg)")).toEqual(["sin:identifier", "(:operator", "30:number", "deg:unit", "):operator"]);
    expect(kinds("a1 + 2cm", ["a1"])).toEqual(["a1:identifier", "+:operator", "2:number", "cm:unit"]);
  });

  it("定義中の定数名は未登録として警告しない", () => {
    expect(kinds("W = 3cm")).toEqual(["W:identifier", "=:operator", "3:number", "cm:unit"]);
  });

  it("別表記の単位も単位として認識し、正式な記号を添える", () => {
    const analysis = analyzeExpression("2hours + 30min");
    const hours = analysis.segments.find((segment) => segment.text === "hours");
    expect(hours?.kind).toBe("unit");
    expect(hours?.canonical).toBe("h");
    expect(analysis.unresolved).toEqual([]);
  });

  it("登録も計算もできない単位だけを未解決として抜き出す", () => {
    const analysis = analyzeExpression("5kmh + 3cm");
    expect(analysis.unresolved.map((segment) => segment.text)).toEqual(["kmh"]);
    const target = analysis.unresolved[0];
    expect(replaceExpressionRange("5kmh + 3cm", target.start, target.end, "km/h")).toBe("5km/h + 3cm");
  });
});

describe("単位の候補提示", () => {
  it("記号の先頭一致で候補を返す", () => {
    const symbols = getUnitSuggestions("cm", { system: "metric" }).map((suggestion) => suggestion.unit.symbol);
    expect(symbols[0]).toBe("cm");
    expect(symbols).toContain("cm²");
  });

  it("英語表記や読みからも登録済み単位へ導く", () => {
    expect(getUnitSuggestions("hour", { system: "metric" })[0].unit.symbol).toBe("h");
    expect(getUnitSuggestions("sec", { system: "metric" })[0].unit.symbol).toBe("s");
    expect(getUnitSuggestions("inch", { system: "us" })[0].unit.symbol).toBe("in");
    expect(getUnitSuggestions("キロメートル", { system: "metric" })[0].unit.symbol).toBe("km");
  });

  it("打ち間違いにも近い候補を返す", () => {
    expect(getUnitSuggestions("kmh", { system: "metric" }).map((suggestion) => suggestion.unit.symbol)).toContain("km/h");
    expect(getUnitSuggestions("hoir", { system: "metric" }).map((suggestion) => suggestion.unit.symbol)).toContain("h");
  });

  it("表示から外している単位は候補にも出さない", () => {
    const symbols = getUnitSuggestions("k", { system: "metric", includeUnit: (_, unitOption) => unitOption.symbol !== "kt" }).map((suggestion) => suggestion.unit.symbol);
    expect(symbols).not.toContain("kt");
  });

  it("よく使う単位は直近に使ったものを先に並べる", () => {
    const symbols = getCommonUnitSuggestions("metric", ["km/h", "min"]).map((suggestion) => suggestion.unit.symbol);
    expect(symbols.slice(0, 2)).toEqual(["km/h", "min"]);
    expect(new Set(symbols).size).toBe(symbols.length);
  });
});

describe("入力補助の切り替え", () => {
  it("数値だけのときは単位付けを案内する", () => {
    const hint = getUnitInputHint("120", { system: "metric" });
    expect(hint.kind).toBe("attach");
    expect(hint.start).toBe(3);
    expect(hint.candidates.length).toBeGreaterThan(0);
    expect(replaceExpressionRange("120", hint.start, hint.end, "km")).toBe("120km");
  });

  it("書きかけの単位は補完として案内する", () => {
    const hint = getUnitInputHint("5c", { system: "metric" });
    expect(hint.kind).toBe("complete");
    expect(hint.fragment).toBe("c");
    expect(hint.candidates.map((suggestion) => suggestion.unit.symbol)).toContain("cm");
    expect(replaceExpressionRange("5c", hint.start, hint.end, "cm")).toBe("5cm");
  });

  it("式の途中に解釈できない単位があれば修正として案内する", () => {
    const hint = getUnitInputHint("5kmh + 1cm", { system: "metric" });
    expect(hint.kind).toBe("fix");
    expect(hint.fragment).toBe("kmh");
    expect(hint.candidates.map((suggestion) => suggestion.unit.symbol)).toContain("km/h");
  });

  it("末尾が単位まで書き終えていれば追加ではなく差し替えとして案内する", () => {
    const hint = getUnitInputHint("5cm + 1mm", { system: "metric", recentUnits: ["mm"] });
    expect(hint.kind).toBe("replace");
    expect(hint.fragment).toBe("mm");
    expect(hint.candidates[0].unit.symbol).toBe("mm");
    expect(replaceExpressionRange("5cm + 1mm", hint.start, hint.end, "cm")).toBe("5cm + 1cm");
  });

  it("末尾に空白があっても直前の単位を差し替え対象として案内する", () => {
    const hint = getUnitInputHint("5cm + 1mm ", { system: "metric" });
    expect(hint.kind).toBe("replace");
    expect(hint.fragment).toBe("mm");
  });

  it("単位まで入力済みなら挿入候補に戻す", () => {
    const hint = getUnitInputHint("5cm + ", { system: "metric", recentUnits: ["cm"] });
    expect(hint.kind).toBe("insert");
    expect(hint.start).toBe(6);
    expect(hint.candidates[0].unit.symbol).toBe("cm");
  });

  it("未定義の定数・関数参照は単位の修正候補として扱わない", () => {
    // a1 は履歴が無い段階では未定義の識別子であり、「使えない単位」ではない。
    const hint = getUnitInputHint("a1 + 2cm", { system: "metric" });
    expect(hint.kind).not.toBe("fix");
    expect(hint.kind).not.toBe("complete");
  });

  it("同じ式の解析結果を渡せば再解析せずそのまま使う", () => {
    const analysis = analyzeExpression("5kmh + 1cm");
    const hint = getUnitInputHint("5kmh + 1cm", { system: "metric", analysis });
    expect(hint.kind).toBe("fix");
    expect(hint.fragment).toBe("kmh");
  });
});

describe("べき乗を含む複合単位", () => {
  it("m/s^2 のような ^ を含む別表記も一つの単位として認識する", () => {
    expect(kinds("10m/s^2")).toEqual(["10:number", "m/s^2:unit"]);
  });
});

describe("insertUnitAtEnd", () => {
  it("末尾が単位なら差し替える", () => {
    expect(insertUnitAtEnd("5cm + 1mm", "cm")).toBe("5cm + 1cm");
  });

  it("末尾に空白があっても直前の単位を差し替える", () => {
    expect(insertUnitAtEnd("5cm + 1mm ", "cm")).toBe("5cm + 1cm ");
  });

  it("末尾が数値のみなら末尾へ挿入する", () => {
    expect(insertUnitAtEnd("120", "km")).toBe("120km");
  });

  it("既知の識別子（他の定数の参照）は単位記号と同じ綴りでも上書きせず、末尾へ追加する", () => {
    // min という名前のローカル定数を参照しているとき、min が単位記号でもあるからといって差し替えてはならない。
    expect(insertUnitAtEnd("2 * min", "s", ["min"])).toBe("2 * mins");
  });
});
