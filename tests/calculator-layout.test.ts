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

// 結果カードの見出し行の高さ（アイコンボタン28dp）と、数字の marginTop。
// `app/(tabs)/index.tsx` の resultHeader / resultValue と同じ値。
const RESULT_CARD_LABEL_ROW_HEIGHT = 28;
const RESULT_VALUE_MARGIN_TOP = 2;

describe("resolveCalculatorLayout", () => {
  it("基準端末（360×640・等倍）ではキーまわりの寸法を1pxも詰めない", () => {
    const layout = resolveCalculatorLayout({ fontScale: 1, height: 640 });
    // screenPaddingBottom だけは 4 から 12 へ意図的に広げてある（`=` の真下にある「設定」タブの
    // 誤タップ対策。縮む先は middle で、この段階では下限に対して十分な余裕がある）。
    expect(layout).toEqual({ fontFactor: 1, inputRowHeight: 44, keyboardPanelOpenByDefault: true, keyHeight: 42, keyRowGap: 6, keyRowMinHeight: 30, middleMinHeight: 84, panelsScrollHorizontally: false, resultCardPaddingVertical: 10, resultValueFontSize: 36, resultValueMinHeight: 44, screenPaddingBottom: 12, screenGap: 6, showResultCardLabel: true });
  });

  it("画面が低い段階ではパネルを1行の横スクロールに畳む", () => {
    // 折り返したグリッド（`ABC` は4行）は縦を食い、結果カードが下限まで潰れて中身が切れる。
    // 基準端末では一覧できる方が速いので折り返しのまま、低い端末でだけ1行にする。
    expect(resolveCalculatorLayout({ fontScale: 1, height: 640 }).panelsScrollHorizontally).toBe(false);
    expect(resolveCalculatorLayout({ fontScale: 1, height: 600 }).panelsScrollHorizontally).toBe(true);
    expect(resolveCalculatorLayout({ fontScale: 1, height: 460 }).panelsScrollHorizontally).toBe(true);
    // 文字を最大まで大きくすると、画面が高くても実効の高さが下がって1行へ落ちる
    // （760 / 1.2 ＝ 633 で基準の 640 を割る。780 なら 650 で基準内のまま）。
    expect(resolveCalculatorLayout({ fontScale: 1.5, height: 760 }).panelsScrollHorizontally).toBe(true);
    expect(resolveCalculatorLayout({ fontScale: 1.5, height: 780 }).panelsScrollHorizontally).toBe(false);
  });

  it("画面が低いほどキーの高さと行間を詰める", () => {
    const compact = resolveCalculatorLayout({ fontScale: 1, height: 600 });
    const dense = resolveCalculatorLayout({ fontScale: 1, height: 520 });
    expect(compact.keyHeight).toBe(38);
    expect(dense.keyHeight).toBe(34);
    expect(dense.middleMinHeight).toBeLessThan(compact.middleMinHeight);
    expect(compact.middleMinHeight).toBeLessThan(84);
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
    expect(ultra.middleMinHeight).toBe(38);
  });

  it("どの段階でも middleMinHeight は結果の数字の行が入る高さ", () => {
    // 結果カードの上半分（見出し行があればそれと、数字まで）はスクロールの外に固定してある。
    // ここを割ると数字そのものが切り取られる＝「スクロールしないと計算結果が見えない」に戻る。
    for (const height of [780, 640, 600, 520, 460, 360]) {
      const layout = resolveCalculatorLayout({ fontScale: 1, height });
      const head = layout.resultCardPaddingVertical + (layout.showResultCardLabel ? RESULT_CARD_LABEL_ROW_HEIGHT : 0) + RESULT_VALUE_MARGIN_TOP + layout.resultValueMinHeight;
      expect(layout.middleMinHeight).toBeGreaterThanOrEqual(head);
    }
  });

  it("縦が足りない段階では、結果の数字を小さくしてでも1行を残す", () => {
    const regular = resolveCalculatorLayout({ fontScale: 1, height: 640 });
    const compact = resolveCalculatorLayout({ fontScale: 1, height: 600 });
    const ultra = resolveCalculatorLayout({ fontScale: 1, height: 460 });
    expect(regular.resultValueFontSize).toBeGreaterThan(compact.resultValueFontSize);
    expect(compact.resultValueFontSize).toBeGreaterThan(ultra.resultValueFontSize);
    // 見出し行（約28dp）は数字より上に積まれるので、低い段階では畳んでアイコンを数字の行へ移す。
    expect(regular.showResultCardLabel).toBe(true);
    expect(compact.showResultCardLabel).toBe(false);
  });

  it("低い段階ではキーボードのパネルを既定で畳む", () => {
    // 単位パネルは接頭語キー行＋レールで約70dp。そこが結果カードの表示域そのものになる段階では
    // 閉じておく（「単位」を押せば開く）。基準端末では従来どおり開いたまま。
    expect(resolveCalculatorLayout({ fontScale: 1, height: 640 }).keyboardPanelOpenByDefault).toBe(true);
    expect(resolveCalculatorLayout({ fontScale: 1, height: 600 }).keyboardPanelOpenByDefault).toBe(true);
    expect(resolveCalculatorLayout({ fontScale: 1, height: 520 }).keyboardPanelOpenByDefault).toBe(false);
    expect(resolveCalculatorLayout({ fontScale: 1, height: 460 }).keyboardPanelOpenByDefault).toBe(false);
  });

  it("バナー広告のぶんを引いてから段階を選ぶ", () => {
    // **無料ユーザーの画面は常に50dp低い。** 引かないと、同じ640dpの端末でも無料ユーザーだけ
    // 50dp足りない状態で「余裕のある段階」の寸法が使われ、結果カードが先に潰れる。
    // Webではバナーが出ないので、Playwrightの実測値はこの50dpを含まない。
    expect(resolveCalculatorLayout({ fontScale: 1, height: 640 }).keyHeight).toBe(42);
    expect(resolveCalculatorLayout({ bannerHeight: 50, fontScale: 1, height: 640 }).keyHeight).toBe(38);
    // Pro（バナーなし）は従来どおり。既定は0なので、渡さない呼び出し元の挙動は変わらない。
    expect(resolveCalculatorLayout({ bannerHeight: 0, fontScale: 1, height: 640 })).toEqual(resolveCalculatorLayout({ fontScale: 1, height: 640 }));
    // 高さが読めないときは従来どおり基準の寸法（引き算で段階が変わらない）。
    expect(resolveCalculatorLayout({ bannerHeight: 50, fontScale: 1, height: 0 }).keyHeight).toBe(42);
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

describe("screenPaddingBottom（キーパッド下段とタブバーの間の余白）", () => {
  it("縦に余裕がある段階だけ余白を広く取る", () => {
    // 右下の `=` を狙った指が行き過ぎると真下の「設定」タブに当たる。緩衝を広げられるのは
    // 画面が高い段階だけで、低い段階まで広げるとキーがタブバーへ潜る（このファイルの既定の優先順）。
    expect(resolveCalculatorLayout({ fontScale: 1, height: 780 }).screenPaddingBottom).toBe(12);
    expect(resolveCalculatorLayout({ fontScale: 1, height: 640 }).screenPaddingBottom).toBe(12);
    expect(resolveCalculatorLayout({ fontScale: 1, height: 600 }).screenPaddingBottom).toBe(4);
    expect(resolveCalculatorLayout({ fontScale: 1, height: 520 }).screenPaddingBottom).toBe(4);
    expect(resolveCalculatorLayout({ fontScale: 1, height: 460 }).screenPaddingBottom).toBe(4);
  });

  it("文字を大きくして実効の高さが下がると余白も戻る", () => {
    // 段階の判定は実効の高さ（画面の高さ ÷ min(fontScale, 1.2)）で行う。
    expect(resolveCalculatorLayout({ fontScale: 1.5, height: 640 }).screenPaddingBottom).toBe(4);
  });
});
