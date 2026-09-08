import { describe, expect, it, vi } from "vitest";

import { applyPresetRegionalDefaults, buildPresetNotebooksFromSeeds, type CalculationNotebook, type NotebookLocalConstant } from "../lib/calculator-store";
import { resolvePresetRegionalDefaults } from "../lib/preset-regional-defaults";
import { presetRegionalDefaultPatch, releaseEditedRegionalDefaults } from "../lib/preset-regional-sync";

// tests/preset-regional-defaults.test.ts と同じ理由（calculator-store → global-settings →
// expo-localization → react-native の生Flow構文を読み込めない）でモックする。
vi.mock("@/lib/global-settings", () => ({ useGlobalSettings: () => ({ language: "en", currencyCode: null, regionCode: null }) }));

const US = resolvePresetRegionalDefaults(null, "US", "en");
const JP = resolvePresetRegionalDefaults(null, "JP", "ja");

const constant = (overrides: Partial<NotebookLocalConstant> = {}): NotebookLocalConstant => ({
  id: "c1",
  symbol: "fuelEconomy",
  expression: "15km/L",
  regionalDefault: "fuelEconomy",
  ...overrides,
});

describe("地域別既定値の後追い反映", () => {
  it("目印が付いた定数は現在の地域の値へ揃う", () => {
    const patched = presetRegionalDefaultPatch([constant()], US);
    expect(patched?.[0].expression).toBe("35mpg");
    // 目印は残る。まだアプリのものなので、次に地域が変わればまた追従する必要がある。
    expect(patched?.[0].regionalDefault).toBe("fuelEconomy");
  });

  it("目印が無い定数は絶対に触らない（利用者が書き換えた値）", () => {
    const edited = constant({ regionalDefault: undefined, expression: "20km/L" });
    expect(presetRegionalDefaultPatch([edited], US)).toBeNull();
  });

  it("すでに同じ値なら変更なしとして null を返す（不要な書き込みをしない）", () => {
    expect(presetRegionalDefaultPatch([constant()], JP)).toBeNull();
  });

  it("単位ごと変わる差し替えでも成り立つ（km/L → mpg → 英mpg）", () => {
    // ここが「投入時のシード値と一致するか」で編集を推測する方式では扱えなかったケース。
    // 目印方式なら、いま入っている値が何であれ現在の地域の値へ揃うだけで済む。
    const gb = resolvePresetRegionalDefaults(null, "GB", "en");
    const afterUs = presetRegionalDefaultPatch([constant()], US);
    expect(afterUs?.[0].expression).toBe("35mpg");
    const afterGb = presetRegionalDefaultPatch(afterUs!, gb);
    expect(afterGb?.[0].expression).toBe("42mpgUK");
    const backToJp = presetRegionalDefaultPatch(afterGb!, JP);
    expect(backToJp?.[0].expression).toBe("15km/L");
  });

  it("未知の種類が保存されていても式を空にしない", () => {
    // 種類を減らしたアプリで古いデータを開いた場合。空文字を入れるとノートが動かなくなる。
    const unknown = constant({ regionalDefault: "somethingRemoved" as never });
    expect(presetRegionalDefaultPatch([unknown], US)).toBeNull();
  });
});

describe("所有権の移動（利用者が書き換えたら目印を外す）", () => {
  it("式を書き換えた定数の目印が外れる", () => {
    const previous = [constant()];
    const next = [constant({ expression: "18km/L" })];
    const released = releaseEditedRegionalDefaults(next, previous);
    expect(released[0].regionalDefault).toBeUndefined();
    expect(released[0].expression).toBe("18km/L");
  });

  it("触っていない定数の目印は残る（他の定数だけ編集して保存した場合）", () => {
    const previous = [constant(), constant({ id: "c2", symbol: "price", expression: "170", regionalDefault: "fuelPerLiter" })];
    const next = [constant(), constant({ id: "c2", symbol: "price", expression: "200", regionalDefault: "fuelPerLiter" })];
    const released = releaseEditedRegionalDefaults(next, previous);
    expect(released[0].regionalDefault).toBe("fuelEconomy");
    expect(released[1].regionalDefault).toBeUndefined();
  });

  it("一度外れた目印は、あとで地域が変わっても復活しない", () => {
    const released = releaseEditedRegionalDefaults([constant({ expression: "18km/L" })], [constant()]);
    expect(presetRegionalDefaultPatch(released, US)).toBeNull();
  });

  it("編集で新しく足した行（保存前に無いid）は目印を外す", () => {
    const released = releaseEditedRegionalDefaults([constant({ id: "new" })], [constant()]);
    expect(released[0].regionalDefault).toBeUndefined();
  });
});

describe("投入したプリセットとの結び付き", () => {
  const notebooksFor = (region: string, language: "en" | "ja") =>
    buildPresetNotebooksFromSeeds(["vehicles"], language, resolvePresetRegionalDefaults(null, region, language), "2026-01-01T00:00:00.000Z");

  const fuelConstant = (notebooks: CalculationNotebook[]) =>
    notebooks.flatMap((notebook) => notebook.localConstants).find((item) => item.symbol === "fuelEconomy");

  it("投入時に目印が保存される（これが無いと後追い反映ができない）", () => {
    const seeded = fuelConstant(notebooksFor("JP", "ja"));
    expect(seeded?.expression).toBe("15km/L");
    expect(seeded?.regionalDefault).toBe("fuelEconomy");
  });

  it("日本で投入したデータを米国で開くと燃費が mpg へ揃う", () => {
    // #54でCodeRabbitが指摘した「既存インストールに届かない」ケースそのもの。
    const seeded = notebooksFor("JP", "ja");
    const { notebooks, changed } = applyPresetRegionalDefaults(seeded, US);
    expect(changed).toBe(true);
    expect(fuelConstant(notebooks)?.expression).toBe("35mpg");
    // 金額（燃料単価）も同時に揃う。目印は種類ごとに付いているので4種すべてに効く。
    const price = notebooks.flatMap((item) => item.localConstants).find((item) => item.symbol === "price");
    expect(price?.expression).toBe(US.fuelPerLiter);
  });

  it("同じ地域で開き直しても書き込みが起きない", () => {
    const seeded = notebooksFor("JP", "ja");
    expect(applyPresetRegionalDefaults(seeded, JP).changed).toBe(false);
  });

  it("プリセット以外のノートには目印が付かない（利用者のノートは対象外）", () => {
    const own: CalculationNotebook = {
      id: "notebook-own",
      title: "own",
      description: "",
      categoryId: "vehicles",
      formulas: [],
      localConstants: [{ id: "x", symbol: "fuelEconomy", expression: "15km/L" }],
      steps: [{ id: "s", title: "", expression: "1km/(fuelEconomy)", targetUnit: "L" }],
      pinned: false,
      isPreset: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(applyPresetRegionalDefaults([own], US).changed).toBe(false);
  });
});
