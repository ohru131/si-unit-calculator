import { describe, expect, it } from "vitest";

import { baseDigits, canRepresentInBase, formatInBase, formatInBaseParts, isBaseDigitAllowed, parseBaseInput, reinterpretBaseInput, sanitizeBaseInput } from "../lib/number-base";
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

// 独自レビュー＋CodeRabbitの指摘で見つかった「入力経路がキーパッドだけではない」問題の回帰テスト。
describe("sanitizeBaseInput", () => {
  it("その基数で使えない文字を落とし、16進は大文字に揃える", () => {
    expect(sanitizeBaseInput("ff", 16)).toBe("FF");
    expect(sanitizeBaseInput("sin(FF)", 16)).toBe("FF");
    expect(sanitizeBaseInput("1012", 2)).toBe("101");
    expect(sanitizeBaseInput("789", 8)).toBe("7");
    expect(sanitizeBaseInput("12.5", 10)).toBe("125");
    expect(sanitizeBaseInput("", 16)).toBe("");
  });

  // CodeRabbitの指摘（PR #40）の回帰テスト。-255から入ると入力欄は -FF になるので、
  // 符号を落とすと編集した瞬間に値が正へ反転する（-4090 が 4090 になっていた）。
  it("先頭のマイナスは残し、値の符号が勝手に反転しないようにする", () => {
    expect(sanitizeBaseInput("-FF", 16)).toBe("-FF");
    expect(sanitizeBaseInput("-FFA", 16)).toBe("-FFA");
    expect(parseBaseInput(sanitizeBaseInput("-FFA", 16), 16)).toEqual({ status: "ok", value: -4090 });
    expect(sanitizeBaseInput("-1010", 2)).toBe("-1010");
  });

  it("2文字目以降の符号は桁ではないので落とす", () => {
    expect(sanitizeBaseInput("F-F", 16)).toBe("FF");
    expect(sanitizeBaseInput("1-0", 2)).toBe("10");
  });

  it("プラスは落とす（落としても値が変わらないため）", () => {
    expect(sanitizeBaseInput("+FF", 16)).toBe("FF");
  });

  it("桁が1つも残らないときは符号だけを残さない", () => {
    expect(sanitizeBaseInput("-", 16)).toBe("");
    expect(sanitizeBaseInput("-xyz", 16)).toBe("");
  });
});

// 基数を切り替えるたびに入力をクリアしていたのを「値を保ったまま表記だけ書き換える」に変えた回帰テスト。
// DECを押しただけで打った値が消えるのがユーザー報告の不具合だった。
describe("reinterpretBaseInput", () => {
  it("値を保ったまま表記だけ別の基数へ書き換える", () => {
    expect(reinterpretBaseInput("FF", 16, 10)).toBe("255");
    expect(reinterpretBaseInput("FF", 16, 2)).toBe("11111111");
    expect(reinterpretBaseInput("FF", 16, 8)).toBe("377");
    expect(reinterpretBaseInput("255", 10, 16)).toBe("FF");
    expect(reinterpretBaseInput("1010", 2, 16)).toBe("A");
  });

  it("同じ基数へ書き換えても値は変わらない", () => {
    for (const base of [2, 8, 10, 16] as const) {
      expect(reinterpretBaseInput("101", base, base)).toBe("101");
    }
  });

  it("接頭辞は付けない（表示側が別の色で描くため）", () => {
    expect(reinterpretBaseInput("255", 10, 16)).not.toContain("0x");
    expect(reinterpretBaseInput("255", 10, 2)).not.toContain("0b");
  });

  it("空・不正な桁・安全整数を超える値はnullを返し、呼び出し側が入力を残せるようにする", () => {
    expect(reinterpretBaseInput("", 16, 10)).toBeNull();
    expect(reinterpretBaseInput("   ", 16, 10)).toBeNull();
    expect(reinterpretBaseInput("FF", 2, 10)).toBeNull();
    expect(reinterpretBaseInput("FFFFFFFFFFFFFFFFFF", 16, 10)).toBeNull();
  });

  it("どの組み合わせでも値は変わらない（往復で確認）", () => {
    for (const value of [0, 1, 7, 255, 4096, Number.MAX_SAFE_INTEGER]) {
      for (const from of [2, 8, 10, 16] as const) {
        const source = formatInBase(value, from);
        expect(source).not.toBeNull();
        for (const to of [2, 8, 10, 16] as const) {
          const converted = reinterpretBaseInput(source as string, from, to);
          expect(converted).not.toBeNull();
          expect(parseBaseInput(converted as string, to)).toEqual({ status: "ok", value });
        }
      }
    }
  });
});
