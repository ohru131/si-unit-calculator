import { describe, expect, it } from "vitest";

import { resolveSheetKeyboardLayout, SHEET_MAX_HEIGHT_RATIO, SHEET_MIN_HEIGHT_WITH_KEYBOARD, SHEET_PADDING_BOTTOM } from "@/lib/sheet-layout";

describe("resolveSheetKeyboardLayout", () => {
  it("キーボードが無いときは safe area の下端を足すだけ", () => {
    expect(resolveSheetKeyboardLayout(0, 800, 24)).toEqual({ paddingBottom: SHEET_PADDING_BOTTOM + 24 });
  });

  // marginBottom だけ足すと、86% のままのシートがそのぶん上へはみ出して見出しと入力欄が
  // 画面の外に出る（隠れる先がキーボードから画面の上端に変わるだけ）。
  it("キーボードのぶん持ち上げ、上限の高さも同時に縮める", () => {
    const layout = resolveSheetKeyboardLayout(300, 800, 24);
    expect(layout.marginBottom).toBe(300);
    expect(layout.maxHeight).toBe(800 * SHEET_MAX_HEIGHT_RATIO - 300);
    // キーボードの高さにナビゲーションバーのぶんが既に入っているので insets は足さない。
    expect(layout.paddingBottom).toBe(SHEET_PADDING_BOTTOM);
  });

  // 画面高600・キーボード400 なら 600*0.86-400 = 116 で下限（220）を下回る。下限をそのまま
  // 当てると 400+220=620 > 600 で今度は上へはみ出すので、残りの画面高で頭打ちにする。
  it("下限は残りの画面高で頭打ちにする（上へはみ出させない）", () => {
    const layout = resolveSheetKeyboardLayout(400, 600, 0);
    expect(layout.maxHeight).toBe(200);
    expect((layout.marginBottom ?? 0) + (layout.maxHeight ?? 0)).toBeLessThanOrEqual(600);
  });

  it("下限を上回るだけの余地があるときは下限まで戻す", () => {
    const layout = resolveSheetKeyboardLayout(400, 900, 0);
    // 900*0.86-400 = 374 の方が大きいのでそちらを採る。
    expect(layout.maxHeight).toBe(900 * SHEET_MAX_HEIGHT_RATIO - 400);
    expect(layout.maxHeight).toBeGreaterThan(SHEET_MIN_HEIGHT_WITH_KEYBOARD);
  });

  // シートごとに見た目の寸法が違う（計算ノートの編集シートは 92% / 下余白36）。
  it("比と下余白はシートごとに渡せる", () => {
    expect(resolveSheetKeyboardLayout(0, 800, 10, { paddingBottom: 36 })).toEqual({ paddingBottom: 46 });
    expect(resolveSheetKeyboardLayout(200, 800, 10, { maxHeightRatio: 0.92, paddingBottom: 36 })).toEqual({
      marginBottom: 200,
      maxHeight: 800 * 0.92 - 200,
      paddingBottom: 36,
    });
  });
});
