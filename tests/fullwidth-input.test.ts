import { describe, expect, it } from "vitest";

import { toHalfWidthAscii } from "@/lib/fullwidth-input";

describe("toHalfWidthAscii", () => {
  it("maps full-width letters, digits and punctuation to ASCII", () => {
    expect(toHalfWidthAscii("３ｍ＋２ｋｇ")).toBe("3m+2kg");
    expect(toHalfWidthAscii("（１２Ｖ）／４．７ｋΩ")).toBe("(12V)/4.7kΩ");
    expect(toHalfWidthAscii("ｍ＝５　ｋｇ")).toBe("m=5 kg");
  });

  it("leaves half-width text and non-ASCII symbols untouched", () => {
    expect(toHalfWidthAscii("12V / 4.7kΩ × µF ₀ θ")).toBe("12V / 4.7kΩ × µF ₀ θ");
    expect(toHalfWidthAscii("")).toBe("");
  });
});
