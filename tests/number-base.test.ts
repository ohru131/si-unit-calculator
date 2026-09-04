import { describe, expect, it } from "vitest";

import { buildBaseRows, canRepresentInBase, formatInBase, parseBaseInput } from "../lib/number-base";
import { evaluateExpression } from "../lib/units";

describe("formatInBase", () => {
  it("255を各基数で表記する", () => {
    expect(formatInBase(255, 10)).toBe("255");
    expect(formatInBase(255, 2)).toBe("0b11111111");
    expect(formatInBase(255, 8)).toBe("0o377");
    expect(formatInBase(255, 16)).toBe("0xFF");
  });

  it("0を各基数で表記する", () => {
    expect(formatInBase(0, 10)).toBe("0");
    expect(formatInBase(0, 2)).toBe("0b0");
    expect(formatInBase(0, 8)).toBe("0o0");
    expect(formatInBase(0, 16)).toBe("0x0");
  });

  it("負数は符号＋絶対値にする（2の補数にしない）", () => {
    expect(formatInBase(-255, 10)).toBe("-255");
    expect(formatInBase(-255, 16)).toBe("-0xFF");
    expect(formatInBase(-255, 2)).toBe("-0b11111111");
  });

  it("非整数はnull", () => {
    expect(formatInBase(1.5, 10)).toBeNull();
    expect(formatInBase(1.5, 16)).toBeNull();
  });

  it("Number.MAX_SAFE_INTEGERは変換できる", () => {
    expect(formatInBase(Number.MAX_SAFE_INTEGER, 10)).toBe(String(Number.MAX_SAFE_INTEGER));
    expect(formatInBase(Number.MAX_SAFE_INTEGER, 16)).not.toBeNull();
  });

  it("2**53（安全整数を超える）はnull", () => {
    expect(formatInBase(2 ** 53, 10)).toBeNull();
  });
});

describe("parseBaseInput", () => {
  it("16進の基本形と接頭辞・大小文字混在を255として読める", () => {
    expect(parseBaseInput("FF", 16)).toEqual({ status: "ok", value: 255 });
    expect(parseBaseInput("0xFF", 16)).toEqual({ status: "ok", value: 255 });
    expect(parseBaseInput("0XfF", 16)).toEqual({ status: "ok", value: 255 });
  });

  it("負の16進数を読める", () => {
    expect(parseBaseInput("-FF", 16)).toEqual({ status: "ok", value: -255 });
  });

  it("2進数を読める（接頭辞あり/なし）", () => {
    expect(parseBaseInput("1010", 2)).toEqual({ status: "ok", value: 10 });
    expect(parseBaseInput("0b1010", 2)).toEqual({ status: "ok", value: 10 });
  });

  it("8進数を読める", () => {
    expect(parseBaseInput("777", 8)).toEqual({ status: "ok", value: 511 });
  });

  it("10進数を読める", () => {
    expect(parseBaseInput("255", 10)).toEqual({ status: "ok", value: 255 });
  });

  it("10進では接頭辞を受け付けない", () => {
    expect(parseBaseInput("0xFF", 10)).toEqual({ status: "error", code: "invalidDigits" });
  });

  it("parseIntが桁を打ち切って誤った値を返す罠の回帰テスト（12Gは16進として不正）", () => {
    expect(parseBaseInput("12G", 16)).toEqual({ status: "error", code: "invalidDigits" });
  });

  it("2進数として使えない桁は不正", () => {
    expect(parseBaseInput("2", 2)).toEqual({ status: "error", code: "invalidDigits" });
  });

  it("空文字・空白のみはempty", () => {
    expect(parseBaseInput("", 16)).toEqual({ status: "error", code: "empty" });
    expect(parseBaseInput("   ", 16)).toEqual({ status: "error", code: "empty" });
  });

  it("安全整数を超える巨大な16進数はoutOfRange", () => {
    expect(parseBaseInput("FFFFFFFFFFFFFFFFFF", 16)).toEqual({ status: "error", code: "outOfRange" });
  });
});

describe("canRepresentInBase / buildBaseRows", () => {
  it("単位の付かない整数は4行になる", () => {
    const quantity = evaluateExpression("255");
    expect(canRepresentInBase(quantity)).toBe(true);
    const rows = buildBaseRows(quantity, 10);
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.base)).toEqual([10, 2, 8, 16]);
    expect(rows.map((row) => row.text)).toEqual(["255", "0b11111111", "0o377", "0xFF"]);
  });

  it("単位付きの量は対象外（0件）", () => {
    const quantity = evaluateExpression("5kg");
    expect(canRepresentInBase(quantity)).toBe(false);
    expect(buildBaseRows(quantity, 10)).toEqual([]);
  });

  it("非整数は対象外（0件）", () => {
    const quantity = evaluateExpression("1.5");
    expect(canRepresentInBase(quantity)).toBe(false);
    expect(buildBaseRows(quantity, 10)).toEqual([]);
  });

  it("undefinedは対象外（0件）", () => {
    expect(canRepresentInBase(undefined)).toBe(false);
    expect(buildBaseRows(undefined, 10)).toEqual([]);
  });

  it("isActiveはactiveBaseと一致する行だけtrue", () => {
    const quantity = evaluateExpression("255");
    const rows = buildBaseRows(quantity, 16);
    expect(rows.filter((row) => row.isActive).map((row) => row.base)).toEqual([16]);
  });
});

describe("往復（formatInBase → parseBaseInput）", () => {
  it.each([0, 1, 255, -255, 1024, Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER])(
    "%iはどの基数でも往復して元に戻る",
    (value) => {
      for (const base of [2, 8, 10, 16] as const) {
        const formatted = formatInBase(value, base);
        expect(formatted).not.toBeNull();
        expect(parseBaseInput(formatted as string, base)).toEqual({ status: "ok", value });
      }
    },
  );
});
