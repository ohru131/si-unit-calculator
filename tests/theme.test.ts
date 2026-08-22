import { describe, expect, it } from "vitest";

import themeConfig from "../theme.config";

const { themeColors } = themeConfig;

describe("application theme palettes", () => {
  it("defines complete semantic palettes for both light and dark appearance", () => {
    for (const appearance of ["light", "dark"] as const) {
      expect(themeColors.background[appearance]).toMatch(/^#/);
      expect(themeColors.surface[appearance]).toMatch(/^#/);
      expect(themeColors.foreground[appearance]).toMatch(/^#/);
      expect(themeColors.primaryFill[appearance]).toMatch(/^#/);
      expect(themeColors.primarySurface[appearance]).toMatch(/^#/);
      expect(themeColors.successSurface[appearance]).toMatch(/^#/);
      expect(themeColors.errorSurface[appearance]).toMatch(/^#/);
      expect(themeColors.onPrimary[appearance]).toBe("#FFFFFF");
    }
  });

  it("uses distinct light and dark surfaces and preserves readable accent pairs", () => {
    expect(themeColors.background.light).not.toBe(themeColors.background.dark);
    expect(themeColors.surface.light).not.toBe(themeColors.surface.dark);
    expect(themeColors.primaryFill.light).not.toBe(themeColors.primaryFill.dark);
    expect(themeColors.primaryStrong.light).not.toBe(themeColors.primaryStrong.dark);
  });
});
