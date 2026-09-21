import { describe, expect, it, vi } from "vitest";

import { applyPresetExactConstants, buildPresetNotebooksFromSeeds, isCalculationNotebook, sanitizeStoredLocalConstants, type CalculationNotebook } from "../lib/calculator-store";
import { applyPresetNotebookOverrides, buildPresetNotebookOverrides } from "../lib/notebooks-backup";
import { resolvePresetRegionalDefaults } from "../lib/preset-regional-defaults";

// calculator-store は global-settings 経由で React Native を芋づる式に読み込む（Flow構文の
// .js が混ざり vitest が解析できない）。tests/preset-regional-sync.test.ts と同じ形で切る。
vi.mock("@/lib/global-settings", () => ({ useGlobalSettings: () => ({ language: "en", currencyCode: null, regionCode: null }) }));

const NOW = "2026-01-01T00:00:00.000Z";
const DEFAULTS = resolvePresetRegionalDefaults(null, "JP", "ja");

function seeded(): CalculationNotebook[] {
  return buildPresetNotebooksFromSeeds(["eng-stress"], "ja", DEFAULTS, NOW);
}

function holeNotebook(notebooks: CalculationNotebook[]): CalculationNotebook {
  const found = notebooks.find((notebook) => notebook.title === "穴まわりの応力集中");
  if (!found) throw new Error("穴まわりの応力集中 が投入されていない");
  return found;
}

describe("厳密値の印（exact）の投入と貼り直し", () => {
  it("投入時にシードの印が保存データへ写る", () => {
    const notebook = holeNotebook(seeded());
    const marked = notebook.localConstants.filter((constant) => constant.exact).map((constant) => constant.symbol);
    // 図面の呼び寸法だけに付き、荷重 F と応力集中係数 Kₜ（＝測定値）には付かない。
    expect(marked).toEqual(["w", "d", "t"]);
  });

  it("印が落ちた保存データへシードから貼り直す", () => {
    // 投入はカテゴリ単位で1回きりなので、既存インストールにはこの経路でしか届かない。
    const stored = seeded().map((notebook) => ({
      ...notebook,
      localConstants: notebook.localConstants.map(({ exact: _dropped, ...rest }) => rest),
    }));
    const applied = applyPresetExactConstants(stored);
    expect(applied.changed).toBe(true);
    expect(holeNotebook(applied.notebooks).localConstants.filter((constant) => constant.exact).map((constant) => constant.symbol)).toEqual(["w", "d", "t"]);
  });

  it("2回目は何も変えない（毎回呼んでよい＝自己修復する）", () => {
    // regionalDefault の付け直しと違い所有権の記録ではないので、1回きりに縛る必要がない。
    const once = applyPresetExactConstants(seeded());
    expect(once.changed).toBe(false);
    expect(applyPresetExactConstants(once.notebooks).changed).toBe(false);
  });

  it("利用者が値を書き換えても印は外れない", () => {
    // 「この欄は図面の寸法である」はノートの構造の話で、いま入っている値が誰のものか
    // （regionalDefault が表す所有権）とは別。板厚を 8mm→10mm に直しても寸法は寸法。
    const stored = seeded().map((notebook) => ({
      ...notebook,
      localConstants: notebook.localConstants.map((constant) => (constant.symbol === "t" ? { ...constant, expression: "10mm" } : constant)),
    }));
    const applied = applyPresetExactConstants(stored);
    const thickness = holeNotebook(applied.notebooks).localConstants.find((constant) => constant.symbol === "t");
    expect(thickness?.expression).toBe("10mm");
    expect(thickness?.exact).toBe(true);
  });

  it("シードから印が外れたら保存データからも外す", () => {
    const stored = seeded().map((notebook) => ({
      ...notebook,
      localConstants: notebook.localConstants.map((constant) => ({ ...constant, exact: true })),
    }));
    const applied = applyPresetExactConstants(stored);
    expect(applied.changed).toBe(true);
    expect(holeNotebook(applied.notebooks).localConstants.find((constant) => constant.symbol === "F")?.exact).toBeUndefined();
  });

  it("印が付いていてもノートの検証・sanitizeで捨てられない", () => {
    // 未知の目印でノートを丸ごと捨てると、利用者の手順ごと消えて二度と復活しない
    // （投入済みカテゴリは seededPresetIds に残るため）。exact も同じ轍を踏まないこと。
    const notebook = holeNotebook(seeded());
    expect(isCalculationNotebook(notebook)).toBe(true);
    expect(sanitizeStoredLocalConstants(notebook.localConstants).filter((constant) => constant.exact)).toHaveLength(3);
  });

  it("利用者が作ったノートには触らない", () => {
    const own: CalculationNotebook = { ...holeNotebook(seeded()), id: "own", isPreset: false };
    expect(applyPresetExactConstants([own]).changed).toBe(false);
  });

  it("利用者が切り替えた印はシードへ貼り直さない", () => {
    // 編集シートのトグルは exact と一緒に exactEdited を立てる。これが無いと、消した印が
    // 次の読み込みでシードから復活する（＝利用者が触れないのと同じになる）。
    const stored = seeded().map((notebook) => (notebook.id === holeNotebook(seeded()).id
      ? {
        ...notebook,
        localConstants: notebook.localConstants.map((constant) => {
          // 寸法 t の印を外し、係数 Kₜ に印を付ける。どちらもシードと逆向き。
          if (constant.symbol === "t") return { ...constant, exact: false, exactEdited: true };
          if (constant.symbol === "Kₜ") return { ...constant, exact: true, exactEdited: true };
          return constant;
        }),
      }
      : notebook));
    const applied = applyPresetExactConstants(stored);
    expect(applied.changed).toBe(false);
    const constants = holeNotebook(applied.notebooks).localConstants;
    expect(constants.find((constant) => constant.symbol === "t")?.exact).toBe(false);
    expect(constants.find((constant) => constant.symbol === "Kₜ")?.exact).toBe(true);
    // 触っていない定数は従来どおりシードへ揃える。
    expect(constants.filter((constant) => constant.exact).map((constant) => constant.symbol)).toEqual(["w", "d", "Kₜ"]);
  });

  it("バックアップは利用者が決めた印だけを持ち運ぶ", () => {
    // シードが付けた印を書き出さないのは、復元後に貼り直しが当たるうえ、書き出すと
    // シードを直したときに古いファイルが古い印を持ち込むため。
    const edited = seeded().map((notebook) => (notebook.id === holeNotebook(seeded()).id
      ? {
        ...notebook,
        localConstants: notebook.localConstants.map((constant) => (constant.symbol === "t" ? { ...constant, exact: false, exactEdited: true } : constant)),
        updatedAt: "2026-02-01T00:00:00.000Z",
      }
      : notebook));
    const overrides = buildPresetNotebookOverrides(edited);
    expect(overrides).toHaveLength(1);
    const exported = overrides[0].localConstants;
    // w・d はシードの印なので書き出さない。t だけが所有権付きで乗る。
    expect(exported.filter((constant) => constant.exactEdited).map((constant) => constant.symbol)).toEqual(["t"]);
    expect(exported.find((constant) => constant.symbol === "w")?.exact).toBeUndefined();

    const restored = applyPresetNotebookOverrides(seeded(), overrides, NOW);
    const restamped = applyPresetExactConstants(restored.notebooks);
    const constants = holeNotebook(restamped.notebooks).localConstants;
    // 復元しても利用者の判断（t は測定値）が残り、残りはシードへ揃う。
    expect(constants.find((constant) => constant.symbol === "t")?.exact).toBe(false);
    expect(constants.filter((constant) => constant.exact).map((constant) => constant.symbol)).toEqual(["w", "d"]);
  });

  it("バックアップから復元したプリセットにも印が戻る", () => {
    // バックアップのJSONは定数を { symbol, expression } だけで持ち運ぶので印は必ず落ちる。
    // さらに applyPresetNotebookOverrides が定数のidを組み直すため、idで突き合わせていると
    // 貼り直しも空振りし、復元しただけで表示が `≈ 47 MPa` から `46.875 MPa` へ戻ってしまう。
    const edited = seeded().map((notebook) => (notebook.id === holeNotebook(seeded()).id
      ? {
        ...notebook,
        localConstants: notebook.localConstants.map((constant) => (constant.symbol === "F" ? { ...constant, expression: "20kN" } : constant)),
        // upsertNotebook を通ったノート＝「編集済み」の目印（buildPresetNotebookOverrides の判定）。
        updatedAt: "2026-02-01T00:00:00.000Z",
      }
      : notebook));
    const overrides = buildPresetNotebookOverrides(edited);
    expect(overrides).toHaveLength(1);
    expect(JSON.stringify(overrides)).not.toContain("exact");

    const restored = applyPresetNotebookOverrides(seeded(), overrides, NOW);
    expect(restored.appliedCount).toBe(1);
    expect(holeNotebook(restored.notebooks).localConstants.filter((constant) => constant.exact)).toHaveLength(0);

    const restamped = applyPresetExactConstants(restored.notebooks);
    expect(restamped.changed).toBe(true);
    const marked = holeNotebook(restamped.notebooks).localConstants.filter((constant) => constant.exact).map((constant) => constant.symbol);
    expect(marked).toEqual(["w", "d", "t"]);
    // 利用者が書き換えた値はそのまま残る（印は値に触らない）。
    expect(holeNotebook(restamped.notebooks).localConstants.find((constant) => constant.symbol === "F")?.expression).toBe("20kN");
  });
});
