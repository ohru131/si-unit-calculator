import { describe, expect, it } from "vitest";

import { baseDigits, canRepresentInBase, formatInBase, formatInBaseParts, isBaseDigitAllowed, parseBaseInput } from "../lib/number-base";
import { evaluateExpression } from "../lib/units";

describe("formatInBaseParts", () => {
  it("255を各基数で符号・接頭辞・桁に分ける", () => {
    expect(formatInBaseParts(255, 10)).toEqual({ sign: "", prefix: "", digits: "255" });
    expect(formatInBaseParts(255, 2)).toEqual({ sign: "", prefix: "0b", digits: "11111111" });
    expect(formatInBaseParts(255, 8)).toEqual({ sign: "", prefix: "0o", digits: "377" });
    expect(formatInBaseParts(255, 16)).toEqual({ sign: "", prefix: "0x", digits: "FF" });
  });

  it("負数は符号を分けて持つ（2の補数にしない）", () => {
    expect(formatInBaseParts(-255, 16)).toEqual({ sign: "-", prefix: "0x", digits: "FF" });
    expect(formatInBaseParts(-255, 10)).toEqual({ sign: "-", prefix: "", digits: "255" });
  });

  it("非整数はnull", () => {
    expect(formatInBaseParts(1.5, 10)).toBeNull();
    expect(formatInBaseParts(1.5, 16)).toBeNull();
  });

  it("安全整数を超えるとnull", () => {
    expect(formatInBaseParts(2 ** 53, 10)).toBeNull();
  });
});

describe("baseDigits", () => {
  it("基数ごとに使える桁文字（大文字）を返す", () => {
    expect(baseDigits(2)).toBe("01");
    expect(baseDigits(8)).toBe("01234567");
    expect(baseDigits(10)).toBe("0123456789");
    expect(baseDigits(16)).toBe("0123456789ABCDEF");
  });
});

describe("isBaseDigitAllowed", () => {
  it("大文字小文字どちらも受け付ける", () => {
    expect(isBaseDigitAllowed("f", 16)).toBe(true);
    expect(isBaseDigitAllowed("F", 16)).toBe(true);
  });

  it("基数ごとの境界を判定する", () => {
    expect(isBaseDigitAllowed("1", 2)).toBe(true);
    expect(isBaseDigitAllowed("2", 2)).toBe(false);
    expect(isBaseDigitAllowed("7", 8)).toBe(true);
    expect(isBaseDigitAllowed("8", 8)).toBe(false);
    expect(isBaseDigitAllowed("9", 10)).toBe(true);
    expect(isBaseDigitAllowed("a", 10)).toBe(false);
    expect(isBaseDigitAllowed("g", 16)).toBe(false);
  });
});

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

  it("formatInBaseParts と整合する（sign+prefix+digitsの連結と一致）", () => {
    for (const value of [0, 255, -255, 1024]) {
      for (const base of [2, 8, 10, 16] as const) {
        const parts = formatInBaseParts(value, base);
        const text = formatInBase(value, base);
        expect(text).toBe(parts ? `${parts.sign}${parts.prefix}${parts.digits}` : null);
      }
    }
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

describe("canRepresentInBase", () => {
  it("単位の付かない整数は対象になる", () => {
    const quantity = evaluateExpression("255");
    expect(canRepresentInBase(quantity)).toBe(true);
  });

  it("単位付きの量は対象外", () => {
    const quantity = evaluateExpression("5kg");
    expect(canRepresentInBase(quantity)).toBe(false);
  });

  it("非整数は対象外", () => {
    const quantity = evaluateExpression("1.5");
    expect(canRepresentInBase(quantity)).toBe(false);
  });

  it("undefinedは対象外", () => {
    expect(canRepresentInBase(undefined)).toBe(false);
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
