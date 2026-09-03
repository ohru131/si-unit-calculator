import { describe, expect, it } from "vitest";

import {
  analyzeExpression,
  getCommonUnitSuggestions,
  getSameDimensionUnitSuggestions,
  getUnitInputHint,
  getUnitInsertionRange,
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

  it("キャレットを指定すれば末尾ではなくその位置の単位を差し替える", () => {
    // "5cm + 1mm" の cm（インデックス1〜3）の上にキャレットがあるとき、末尾の mm ではなく cm を差し替える。
    expect(insertUnitAtEnd("5cm + 1mm", "km", [], 2)).toBe("5km + 1mm");
  });

  it("キャレットが数値の途中にあれば、数値の直後へ単位付けする", () => {
    // "12" の途中（インデックス1）にキャレットがあっても、数値をまたいで単位が入り込まないよう数値の直後へ付ける。
    expect(insertUnitAtEnd("12 + 3cm", "km", [], 1)).toBe("12km + 3cm");
  });

  it("キャレットが単位でも数値でもない位置なら、そのままキャレット位置へ挿入する", () => {
    expect(insertUnitAtEnd("+3cm", "km", [], 0)).toBe("km+3cm");
  });
});

describe("getUnitInsertionRange", () => {
  it("単位の上なら単位の範囲を返す", () => {
    expect(getUnitInsertionRange("5cm + 1mm", 2)).toEqual({ start: 1, end: 3 });
  });

  it("数値の途中なら数値の直後（挿入のみ）を返す", () => {
    expect(getUnitInsertionRange("120", 1)).toEqual({ start: 3, end: 3 });
  });
});

describe("キャレット位置に応じた入力補助", () => {
  it("式の途中にある単位の上にキャレットがあれば、末尾ではなくその単位を差し替え対象にする", () => {
    // "5cm + 1mm" の cm（インデックス1〜3）の直後（インデックス3）にキャレットを置く。
    const hint = getUnitInputHint("5cm + 1mm", { system: "metric", caret: 3 });
    expect(hint.kind).toBe("replace");
    expect(hint.fragment).toBe("cm");
    expect(hint.start).toBe(1);
    expect(hint.end).toBe(3);
    expect(replaceExpressionRange("5cm + 1mm", hint.start, hint.end, "km")).toBe("5km + 1mm");
  });

  it("キャレットが単位の途中にあっても同じ単位を対象にする", () => {
    const hint = getUnitInputHint("5cm + 1mm", { system: "metric", caret: 2 });
    expect(hint.kind).toBe("replace");
    expect(hint.fragment).toBe("cm");
  });

  it("差し替え候補は同じ次元（長さ）の単位だけに絞られる", () => {
    const hint = getUnitInputHint("5cm + 1mm", { system: "metric", caret: 2 });
    const symbols = hint.candidates.map((suggestion) => suggestion.unit.symbol);
    expect(symbols).toContain("mm");
    expect(symbols).toContain("m");
    expect(symbols).not.toContain("kg");
    expect(symbols).not.toContain("s");
  });

  it("キャレットが数値の途中にあれば、その数値への単位付けを案内する", () => {
    const hint = getUnitInputHint("120 + 3cm", { system: "metric", caret: 1 });
    expect(hint.kind).toBe("attach");
    expect(hint.start).toBe(3);
  });

  it("複数の不正な単位があっても、キャレットが乗っている方を優先して修正候補を出す", () => {
    // kmz と kmh の両方が不正だが、キャレットは前半の kmz（インデックス1〜4）の上にある。
    const hint = getUnitInputHint("5kmz + 1kmh", { system: "metric", caret: 3 });
    expect(hint.kind).toBe("fix");
    expect(hint.fragment).toBe("kmz");
  });

  it("キャレットが末尾のときは従来どおり最後に見つかった不正な単位を案内する", () => {
    // 末尾ではない位置の書き間違いなので、caret省略時（末尾扱い）は complete ではなく fix になる。
    const hint = getUnitInputHint("5kmz + 1kmh + 2cm", { system: "metric" });
    expect(hint.kind).toBe("fix");
    expect(hint.fragment).toBe("kmh");
  });
});

describe("getSameDimensionUnitSuggestions", () => {
  it("同じ次元の単位だけを返す", () => {
    const symbols = getSameDimensionUnitSuggestions("cm", { system: "metric" }).map((suggestion) => suggestion.unit.symbol);
    expect(symbols).toContain("mm");
    expect(symbols).toContain("km");
    expect(symbols).not.toContain("kg");
  });

  it("解決できない単位テキストには空配列を返す（呼び出し側でのフォールバックを促す）", () => {
    expect(getSameDimensionUnitSuggestions("notaunit", { system: "metric" })).toEqual([]);
  });

  it("表示から外している単位は候補にも出さない", () => {
    const symbols = getSameDimensionUnitSuggestions("m", { system: "metric", includeUnit: (_, unitOption) => unitOption.symbol !== "au" }).map((suggestion) => suggestion.unit.symbol);
    expect(symbols).not.toContain("au");
  });
});

describe("指数表記の数値", () => {
  // 評価器（lib/units.ts）は 2e-6C や 8.99e9N を正しく計算できるのに、解析側だけが独自の
  // 「[0-9.]の並び」で数値を切っていたため、指数部が「使えない単位」として赤く表示されていた。
  // プリセット（クーロンの法則の q₁ = 2e-6C、k = 8.99e9N*m^2/C^2）が実際に踏んでいたケース。
  it("指数部を数値トークンに含める（2e-6C）", () => {
    const segments = analyzeExpression("2e-6C").segments.map((segment) => [segment.kind, segment.text]);
    expect(segments).toEqual([["number", "2e-6"], ["unit", "C"]]);
  });

  it("正の指数でも単位と分離できる（8.99e9N）", () => {
    const segments = analyzeExpression("8.99e9N").segments.map((segment) => [segment.kind, segment.text]);
    expect(segments).toEqual([["number", "8.99e9"], ["unit", "N"]]);
  });

  it("指数表記を含む式に「使えない単位」が残らない", () => {
    expect(analyzeExpression("2e-6C").unresolved).toEqual([]);
    expect(analyzeExpression("8.99e9N*m^2/C^2").unresolved).toEqual([]);
    expect(analyzeExpression("6.674e-11N*m^2/kg^2").unresolved).toEqual([]);
  });

  // e を単独で書いたとき（自然対数の底）は従来どおり識別子として扱われ、指数表記に吸われない。
  it("指数部として成立しない e は数値に吸収しない", () => {
    const segments = analyzeExpression("2*e").segments.map((segment) => [segment.kind, segment.text]);
    expect(segments).toEqual([["number", "2"], ["operator", "*"], ["identifier", "e"]]);
  });
});

describe("数値直後の単位サフィックス", () => {
  // 数値の直後は、評価器が識別子より先に単位として貪欲に読む区間（lib/units.ts の unitSuffixEnd）。
  // 解析側が識別子集合を先に見て語を切っていたため、定数名 m を持つノート（運動方程式など）で
  // "3m/s^2" が m（識別子）・/・s^2 に割れ、単位チップが s^2 だけを差し替えて "3m/G" になっていた。
  it("定数名と同じ綴りの単位でも複合単位を丸ごと1区間にする", () => {
    const segments = analyzeExpression("3m/s^2", ["m", "a"]).segments.map((segment) => [segment.kind, segment.text]);
    expect(segments).toEqual([["number", "3"], ["unit", "m/s^2"]]);
  });

  it("単位チップの差し替えが複合単位の全体に効く", () => {
    expect(insertUnitAtEnd("3m/s^2", "G", ["m", "a"])).toBe("3G");
    expect(insertUnitAtEnd("9.8m/s²", "G", ["m", "a"])).toBe("9.8G");
  });

  // "*" で繋いだ複合単位（N*m など）も1区間にする。以前は "*" を区切りとして扱っておらず、
  // "3N*m" の m だけが差し替え対象（定数名に m があると識別子扱いで追記）になっていた。
  it("アスタリスクで繋いだ複合単位も1区間にする", () => {
    const segments = analyzeExpression("3N*m", ["m"]).segments.map((segment) => [segment.kind, segment.text]);
    expect(segments).toEqual([["number", "3"], ["unit", "N*m"]]);
    expect(insertUnitAtEnd("3N*m", "J", ["m"])).toBe("3J");
  });

  // 数値と単位の間の空白は評価器が読み飛ばすので、解析側も同じ扱いにする。
  it("数値と単位の間に空白があっても単位として読む", () => {
    const segments = analyzeExpression("3 m/s^2", ["m"]).segments.map((segment) => [segment.kind, segment.text]);
    expect(segments).toEqual([["number", "3"], ["space", " "], ["unit", "m/s^2"]]);
  });

  // 単位の始まりでない文字が続くときは取り込まない（"2m*3" は m まで）。
  it("区切りの先が単位でなければ取り込まない", () => {
    const segments = analyzeExpression("2m*3", ["m"]).segments.map((segment) => [segment.kind, segment.text]);
    expect(segments).toEqual([["number", "2"], ["unit", "m"], ["operator", "*"], ["number", "3"]]);
  });

  // 数値の直後でない語は従来どおり識別子が優先される（"m*a" は定数の掛け算）。
  it("数値の直後でなければ識別子の解決を優先する", () => {
    const segments = analyzeExpression("m*a", ["m", "a"]).segments.map((segment) => [segment.kind, segment.text]);
    expect(segments).toEqual([["identifier", "m"], ["operator", "*"], ["identifier", "a"]]);
  });

  // 区切りの先が既知の識別子なら単位側へ巻き込まない（"kg*s" は単位として成立してしまうため、
  // s が手順の結果記号のときに式の意味が変わる）。
  it("区切りの先が既知の識別子なら単位に巻き込まない", () => {
    const segments = analyzeExpression("kg*s", ["s"]).segments.map((segment) => [segment.kind, segment.text]);
    expect(segments).toEqual([["unit", "kg"], ["operator", "*"], ["identifier", "s"]]);
  });
});
