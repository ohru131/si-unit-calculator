import { describe, expect, it } from "vitest";

import { CALCULATOR_MAX_FONT_SCALE, resolveCalculatorLayout, resolveFontFactor, scaleFontSizes } from "@/lib/calculator-layout";

describe("resolveFontFactor", () => {
  it("上限までの拡大には手を出さない", () => {
    expect(resolveFontFactor(1)).toBe(1);
    expect(resolveFontFactor(1.15)).toBe(1);
    expect(resolveFontFactor(CALCULATOR_MAX_FONT_SCALE)).toBe(1);
  });

  it("上限を超えた拡大は、掛け合わせて上限になる係数へ落とす", () => {
    // 端末が1.5倍なら style を0.8倍しておくことで、実際の表示は1.2倍で頭打ちになる。
    expect(resolveFontFactor(1.5)).toBeCloseTo(0.8, 10);
    expect(1.5 * resolveFontFactor(1.5)).toBeCloseTo(CALCULATOR_MAX_FONT_SCALE, 10);
    expect(2 * resolveFontFactor(2)).toBeCloseTo(CALCULATOR_MAX_FONT_SCALE, 10);
  });

  it("読めない値では等倍に戻す（縮める方向にしか働かせない）", () => {
    expect(resolveFontFactor(0)).toBe(1);
    expect(resolveFontFactor(-1)).toBe(1);
    expect(resolveFontFactor(Number.NaN)).toBe(1);
    expect(resolveFontFactor(0.85)).toBe(1);
  });
});

describe("resolveCalculatorLayout", () => {
  it("基準端末（360×640・等倍）では今までの寸法のまま", () => {
    const layout = resolveCalculatorLayout({ fontScale: 1, height: 640 });
    expect(layout).toEqual({ fontFactor: 1, inputRowHeight: 44, keyHeight: 42, keyRowGap: 6, keyRowMinHeight: 30, middleMinHeight: 56, screenGap: 6 });
  });

  it("画面が低いほどキーの高さと行間を詰める", () => {
    const compact = resolveCalculatorLayout({ fontScale: 1, height: 600 });
    const dense = resolveCalculatorLayout({ fontScale: 1, height: 520 });
    expect(compact.keyHeight).toBe(38);
    expect(dense.keyHeight).toBe(34);
    expect(dense.middleMinHeight).toBeLessThan(compact.middleMinHeight);
    expect(compact.middleMinHeight).toBeLessThan(56);
  });

  it("文字を大きくした端末は、画面が高くても段階を1つ下げる", () => {
    // 文字が1.2倍なら必要な縦も概ね1.2倍。高さをその倍率で割った値で段階を選ぶ。
    const enlarged = resolveCalculatorLayout({ fontScale: 1.3, height: 720 });
    expect(enlarged.keyHeight).toBe(38);
    expect(enlarged.fontFactor).toBeCloseTo(CALCULATOR_MAX_FONT_SCALE / 1.3, 10);

    const veryEnlarged = resolveCalculatorLayout({ fontScale: 1.5, height: 640 });
    expect(veryEnlarged.keyHeight).toBe(34);
  });

  it("最大まで拡大した低い端末では、結果カードを畳んででもキーパッドを入れる", () => {
    const ultra = resolveCalculatorLayout({ fontScale: 1.3, height: 560 });
    expect(ultra.keyHeight).toBe(30);
    expect(ultra.middleMinHeight).toBe(24);
  });

  it("高さが読めないときは基準の寸法にする", () => {
    expect(resolveCalculatorLayout({ fontScale: 1, height: 0 }).keyHeight).toBe(42);
    expect(resolveCalculatorLayout({ fontScale: Number.NaN, height: Number.NaN }).fontFactor).toBe(1);
  });
});

describe("scaleFontSizes", () => {
  it("等倍なら同じ定義をそのまま返す（無駄な再生成をしない）", () => {
    const defs = { a: { fontSize: 18 } };
    expect(scaleFontSizes(defs, 1)).toBe(defs);
  });

  it("文字まわりの寸法だけを縮め、他の寸法には触らない", () => {
    const scaled = scaleFontSizes(
      {
        key: { fontSize: 18, height: 42, fontWeight: "600" },
        token: { fontSize: 19, lineHeight: 24 },
        card: { borderRadius: 16, paddingVertical: 8 },
      },
      0.8,
    );
    expect(scaled.key).toEqual({ fontSize: 14.5, height: 42, fontWeight: "600" });
    expect(scaled.token).toEqual({ fontSize: 15, lineHeight: 19 });
    expect(scaled.card).toEqual({ borderRadius: 16, paddingVertical: 8 });
  });
});
