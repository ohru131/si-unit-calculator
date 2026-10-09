import { describe, expect, it } from "vitest";

import { LATEX_MIN_FIT_SCALE, latexFitScale } from "../lib/latex-fit";

describe("latexFitScale", () => {
  it("枠に収まる式は縮めない", () => {
    expect(latexFitScale(200, 300)).toBe(1);
    expect(latexFitScale(300, 300)).toBe(1);
  });

  it("少しはみ出す式は枠に合わせて縮める", () => {
    const scale = latexFitScale(330, 300);
    expect(scale * 330).toBeLessThanOrEqual(300);
    expect(scale).toBeGreaterThan(0.85);
  });

  it("大きくはみ出す式は下限で止める（残りは横スクロール）", () => {
    expect(latexFitScale(600, 300)).toBe(LATEX_MIN_FIT_SCALE);
  });

  it("測れていない（0・NaN）ときは縮めない", () => {
    expect(latexFitScale(0, 300)).toBe(1);
    expect(latexFitScale(400, 0)).toBe(1);
    expect(latexFitScale(Number.NaN, 300)).toBe(1);
  });
});
