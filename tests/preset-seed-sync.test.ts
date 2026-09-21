import { describe, expect, it, vi } from "vitest";

import {
  applyPresetSeedUpdates,
  buildPresetNotebooksFromSeeds,
  isCalculationNotebook,
  normalizePresetUnitSpellings,
  sanitizeStoredLocalConstants,
  sanitizeStoredSteps,
  type CalculationNotebook,
} from "../lib/calculator-store";
import { PRESET_NOTEBOOK_SEEDS } from "../lib/notebook-formulas";
import { resolvePresetRegionalDefaults } from "../lib/preset-regional-defaults";

// calculator-store は global-settings 経由で React Native を芋づる式に読み込む（Flow構文の
// .js が混ざり vitest が解析できない）。tests/preset-regional-sync.test.ts と同じ形で切る。
vi.mock("@/lib/global-settings", () => ({ useGlobalSettings: () => ({ language: "en", currencyCode: null, regionCode: null }) }));

const NOW = "2026-01-01T00:00:00.000Z";
const DEFAULTS = resolvePresetRegionalDefaults(null, "JP", "ja");

function seeded(categoryId: string): CalculationNotebook[] {
  return buildPresetNotebooksFromSeeds([categoryId], "ja", DEFAULTS, NOW);
}

function dividerNotebook(notebooks: CalculationNotebook[]): CalculationNotebook {
  const found = notebooks.find((notebook) => notebook.title === "分圧回路の出力電圧");
  if (!found) throw new Error("分圧回路の出力電圧 が投入されていない");
  return found;
}

describe("シードの修正を既存インストールへ届ける", () => {
  it("投入時に「アプリが入れた値」を保存データへ残す", () => {
    const notebook = dividerNotebook(seeded("electronics"));
    // これが無いと「利用者が編集した」と「シードが変わった」を区別できない。
    expect(notebook.localConstants.map((constant) => constant.seededExpression)).toEqual(["12V", "10kΩ", "4.7kΩ"]);
    expect(notebook.steps[0].seededExpression).toBe(notebook.steps[0].expression);
    expect(notebook.steps[0].seededTargetUnit).toBe(notebook.steps[0].targetUnit);
  });

  it("未編集の定数はシードの新しい値へ差し替える", () => {
    // 「シードが古い値で投入された端末」を作る（投入時の値も古い値のまま）。
    const stored = seeded("electronics").map((notebook) => (notebook.id === dividerNotebook(seeded("electronics")).id
      ? {
        ...notebook,
        localConstants: notebook.localConstants.map((constant) => (constant.symbol === "R₁"
          ? { ...constant, expression: "1kΩ", seededExpression: "1kΩ" }
          : constant)),
      }
      : notebook));
    const applied = applyPresetSeedUpdates(stored);
    expect(applied.changed).toBe(true);
    const constants = dividerNotebook(applied.notebooks).localConstants;
    expect(constants.find((constant) => constant.symbol === "R₁")?.expression).toBe("10kΩ");
    // 投入時の値も一緒に更新する。しないと次回も「差し替えるべき」と判断され続ける。
    expect(constants.find((constant) => constant.symbol === "R₁")?.seededExpression).toBe("10kΩ");
  });

  it("利用者が編集した定数は触らない", () => {
    // 保存値だけが投入時の値と違う＝利用者の編集。
    const stored = seeded("electronics").map((notebook) => (notebook.id === dividerNotebook(seeded("electronics")).id
      ? {
        ...notebook,
        localConstants: notebook.localConstants.map((constant) => (constant.symbol === "R₁"
          ? { ...constant, expression: "22kΩ", seededExpression: "1kΩ" }
          : constant)),
      }
      : notebook));
    const applied = applyPresetSeedUpdates(stored);
    expect(dividerNotebook(applied.notebooks).localConstants.find((constant) => constant.symbol === "R₁")?.expression).toBe("22kΩ");
  });

  it("記録が無くシードと値が違う旧データは触らない（編集済みとして扱う）", () => {
    // 未編集と見なすと、この仕組みより前に行われた編集を黙って上書きしてしまう。
    const stored = seeded("electronics").map((notebook) => ({
      ...notebook,
      localConstants: notebook.localConstants.map(({ seededExpression: _dropped, ...rest }) => ({ ...rest, expression: "1kΩ" })),
    }));
    const applied = applyPresetSeedUpdates(stored);
    const constants = dividerNotebook(applied.notebooks).localConstants;
    expect(constants.every((constant) => constant.expression === "1kΩ")).toBe(true);
    // 記録も付かない（付けると次回「未編集」と誤判定してシードで上書きしてしまう）。
    expect(constants.every((constant) => constant.seededExpression === undefined)).toBe(true);
  });

  it("記録が無くてもシードと値が一致していれば記録を付ける（値は変えない）", () => {
    // これが無いと旧データには**永久にシードの修正が届かない**。一致している＝編集されていない
    // （かシードと同じ値に編集した）ので、以後の更新を届けてよい。
    const stored = seeded("electronics").map((notebook) => ({
      ...notebook,
      localConstants: notebook.localConstants.map(({ seededExpression: _dropped, ...rest }) => rest),
      steps: notebook.steps.map(({ seededExpression: _e, seededTargetUnit: _t, ...rest }) => rest),
    }));
    const applied = applyPresetSeedUpdates(stored);
    expect(applied.changed).toBe(true);
    const notebook = dividerNotebook(applied.notebooks);
    expect(notebook.localConstants.map((constant) => constant.expression)).toEqual(["12V", "10kΩ", "4.7kΩ"]);
    expect(notebook.localConstants.map((constant) => constant.seededExpression)).toEqual(["12V", "10kΩ", "4.7kΩ"]);
    expect(notebook.steps[0].seededExpression).toBe(notebook.steps[0].expression);
    expect(notebook.steps[0].seededTargetUnit).toBe(notebook.steps[0].targetUnit);
  });

  it("地域別の既定値が付いた定数は対象外", () => {
    // 端末の地域で値を決める側（applyPresetRegionalDefaults）が持ち主。両方が書き換えると取り合いになる。
    const stored = seeded("electricity-basics");
    const regional = stored.flatMap((notebook) => notebook.localConstants).filter((constant) => constant.regionalDefault);
    expect(regional.length).toBeGreaterThan(0);
    expect(regional.every((constant) => constant.seededExpression === undefined)).toBe(true);
  });

  it("並べ替えで別の定数に当たらないよう記号も一致させる", () => {
    const target = dividerNotebook(seeded("electronics"));
    const stored = seeded("electronics").map((notebook) => (notebook.id === target.id
      ? {
        ...notebook,
        // idはそのままで記号だけ別の定数に差し替える（シード内で並べ替えられた状態の再現）。
        localConstants: notebook.localConstants.map((constant) => (constant.symbol === "R₁"
          ? { ...constant, symbol: "R₉", expression: "1kΩ", seededExpression: "1kΩ" }
          : constant)),
      }
      : notebook));
    const applied = applyPresetSeedUpdates(stored);
    expect(dividerNotebook(applied.notebooks).localConstants.find((constant) => constant.symbol === "R₉")?.expression).toBe("1kΩ");
  });

  it("手順の数がシードと違うノートでは手順を同期しない", () => {
    // 手順のidは添字から決まるので、シードに手順を1つ挿入すると保存済みのidが別の計算に当たる。
    // 式だけ書き込むと数式・結果記号が前の手順のまま残る混ざりものになる。
    const target = dividerNotebook(seeded("electronics"));
    const stored = seeded("electronics").map((notebook) => (notebook.id === target.id
      ? {
        ...notebook,
        steps: notebook.steps.map((step) => ({ ...step, expression: "1", seededExpression: "1" })).slice(0, -1),
      }
      : notebook));
    const applied = applyPresetSeedUpdates(stored);
    expect(dividerNotebook(applied.notebooks).steps.every((step) => step.expression === "1")).toBe(true);
  });

  it("手順数が同じでも結果記号が食い違えば同期しない", () => {
    // 並べ替えは手順数が変わらないので、記号の一致まで見ないと別の手順へ書き込む。
    const target = dividerNotebook(seeded("electronics"));
    const stored = seeded("electronics").map((notebook) => (notebook.id === target.id
      ? {
        ...notebook,
        steps: notebook.steps.map((step, index) => (index === 0
          ? { ...step, resultSymbol: "X", expression: "1", seededExpression: "1" }
          : step)),
      }
      : notebook));
    const applied = applyPresetSeedUpdates(stored);
    expect(dividerNotebook(applied.notebooks).steps[0].expression).toBe("1");
  });

  it("結果記号を持たない手順どうしは同期しない（空文字を一致と見なさない）", () => {
    // 「大気圧の単位換算」はシードの2手順とも結果記号を持たない（`withDerivedResultSymbols` は
    // 左辺が衝突する手順に記号を補わないため。実測でそういうノートが8件）。空文字を手掛かりに
    // すると並べ替えをすり抜け、式だけが別の手順へ書き込まれてタイトルと数式が食い違う。
    const pressure = (notebooks: CalculationNotebook[]) => {
      const found = notebooks.find((notebook) => notebook.title === "大気圧の単位換算（hPa・Pa・atm）");
      if (!found) throw new Error("大気圧の単位換算 が投入されていない");
      return found;
    };
    const target = pressure(seeded("science-pressure"));
    expect(target.steps.every((step) => !step.resultSymbol)).toBe(true);
    // idはそのままで中身だけ入れ替える（シード内で手順が並べ替えられた状態の再現）。
    const swapped = [
      { ...target.steps[1], id: target.steps[0].id },
      { ...target.steps[0], id: target.steps[1].id },
    ];
    const stored = seeded("science-pressure").map((notebook) => (notebook.id === target.id ? { ...notebook, steps: swapped } : notebook));
    const applied = applyPresetSeedUpdates(stored);
    const steps = pressure(applied.notebooks).steps;
    // 入れ替わったままであること＝どちらの手順にも書き込んでいない（この2手順は式が同じ `P` で
    // 表示単位だけが違うので、食い違いは `targetUnit` に出る）。
    expect(steps.map((step) => step.targetUnit)).toEqual([target.steps[1].targetUnit, target.steps[0].targetUnit]);
    expect(applied.changed).toBe(false);
  });

  it("投入時の値が文字列でない保存データは印ごと落とす", () => {
    // 残すと綴り揃えの .split が起動時に例外を投げ、読み込みのcatchが空のデータで置き換える。
    const broken = [{ id: "c1", symbol: "R", expression: "10kΩ", seededExpression: 10 as unknown as string }];
    expect(sanitizeStoredLocalConstants(broken)[0].seededExpression).toBeUndefined();
    const brokenStep = [{
      id: "s1", title: "", expression: "R", targetUnit: "Ω",
      seededExpression: {} as unknown as string, seededTargetUnit: 1 as unknown as string,
    }];
    expect(sanitizeStoredSteps(brokenStep)[0].seededExpression).toBeUndefined();
    expect(sanitizeStoredSteps(brokenStep)[0].seededTargetUnit).toBeUndefined();
  });

  it("検証・sanitizeで投入時の値が捨てられない", () => {
    const notebook = dividerNotebook(seeded("electronics"));
    expect(isCalculationNotebook(notebook)).toBe(true);
    expect(sanitizeStoredLocalConstants(notebook.localConstants).every((constant) => constant.seededExpression !== undefined)).toBe(true);
  });
});

describe("単位記号の綴りをそろえる（Ohm → Ω）", () => {
  it("旧データの Ohm を Ω に直す（投入時の値も一緒に）", () => {
    // 実機で報告された状態の再現。プリセットをリセットするしか直す手が無かった。
    const stored = seeded("electronics").map((notebook) => ({
      ...notebook,
      localConstants: notebook.localConstants.map((constant) => ({
        ...constant,
        expression: constant.expression.split("Ω").join("Ohm"),
        ...(constant.seededExpression === undefined ? {} : { seededExpression: constant.seededExpression.split("Ω").join("Ohm") }),
      })),
    }));
    expect(dividerNotebook(stored).localConstants.map((constant) => constant.expression)).toContain("10kOhm");

    const fixed = normalizePresetUnitSpellings(stored);
    expect(fixed.changed).toBe(true);
    const constants = dividerNotebook(fixed.notebooks).localConstants;
    expect(constants.map((constant) => constant.expression)).toEqual(["12V", "10kΩ", "4.7kΩ"]);
    // **投入時の値も直すこと。** 直さないと綴りだけ違う旧データが「編集済み」に見えて、
    // このあとのシード更新が届かなくなる。
    expect(constants.map((constant) => constant.seededExpression)).toEqual(["12V", "10kΩ", "4.7kΩ"]);
  });

  it("投入時の値が無い旧データでも直る（所有権の判定を通さない）", () => {
    const stored = seeded("electronics").map((notebook) => ({
      ...notebook,
      localConstants: notebook.localConstants.map(({ seededExpression: _dropped, ...rest }) => ({
        ...rest,
        expression: rest.expression.split("Ω").join("Ohm"),
      })),
    }));
    const fixed = normalizePresetUnitSpellings(stored);
    expect(dividerNotebook(fixed.notebooks).localConstants.map((constant) => constant.expression)).toEqual(["12V", "10kΩ", "4.7kΩ"]);
  });

  it("定数名の Ohm は書き換えない（Ω は識別子に使えない）", () => {
    // `OhmicLoss` を `ΩicLoss` にすると二度と解決できない式になる。単位サフィックスの範囲
    // （数値の直後）だけを書き換えるので、識別子と裸の `Ohm` はそのまま残る。
    const target = dividerNotebook(seeded("electronics"));
    const stored = seeded("electronics").map((notebook) => (notebook.id === target.id
      ? {
        ...notebook,
        localConstants: [
          { id: "c-own-1", symbol: "OhmicLoss", expression: "3W" },
          { id: "c-own-2", symbol: "R", expression: "10kOhm" },
          { id: "c-own-3", symbol: "S", expression: "2*Ohm" },
          { id: "c-own-4", symbol: "T", expression: "0.0175Ohm*mm^2/m" },
          { id: "c-own-5", symbol: "U", expression: "10 kOhm" },
        ],
        steps: [{ id: "s-own-1", title: "", expression: "OhmicLoss/R", targetUnit: "kOhm" }],
      }
      : notebook));
    const fixed = normalizePresetUnitSpellings(stored);
    const notebook = dividerNotebook(fixed.notebooks);
    expect(notebook.localConstants.map((constant) => constant.expression)).toEqual(["3W", "10kΩ", "2*Ohm", "0.0175Ω*mm^2/m", "10 kΩ"]);
    expect(notebook.localConstants[0].symbol).toBe("OhmicLoss");
    expect(notebook.steps[0].expression).toBe("OhmicLoss/R");
    // 表示単位は単位記号そのものなので丸ごと置き換える。
    expect(notebook.steps[0].targetUnit).toBe("kΩ");
  });

  it("保存値が既に Ω でも投入時の値の綴りを揃える", () => {
    // 揃えないと `expression: "10kΩ"` と `seededExpression: "10kOhm"` の食い違いが残り、
    // シードの更新が「利用者の編集」と読まれて永久に届かなくなる（同じ値を Ω で打ち直した端末）。
    const target = dividerNotebook(seeded("electronics"));
    const stored = seeded("electronics").map((notebook) => (notebook.id === target.id
      ? {
        ...notebook,
        localConstants: notebook.localConstants.map((constant) => (constant.symbol === "R₁"
          ? { ...constant, seededExpression: "1kOhm" }
          : constant)),
        steps: notebook.steps.map((step, index) => (index === 0 ? { ...step, seededTargetUnit: "kOhm" } : step)),
      }
      : notebook));
    const fixed = normalizePresetUnitSpellings(stored);
    expect(fixed.changed).toBe(true);
    const notebook = dividerNotebook(fixed.notebooks);
    expect(notebook.localConstants.find((constant) => constant.symbol === "R₁")?.seededExpression).toBe("1kΩ");
    expect(notebook.steps[0].seededTargetUnit).toBe("kΩ");
  });

  it("Ω を含むプリセット14件すべてで、Ohm から元の綴りへ戻る", () => {
    // 単位サフィックスの範囲だけを書き換える走査が、実在するプリセットの式の形
    // （`0.0175Ohm*mm^2/m`・`targetUnit: "kOhm"`・添字付きの定数名）を取りこぼさないことの裏取り。
    const all = buildPresetNotebooksFromSeeds(Object.keys(PRESET_NOTEBOOK_SEEDS), "ja", DEFAULTS, NOW);
    const legacy = all.map((notebook) => ({
      ...notebook,
      localConstants: notebook.localConstants.map((constant) => ({ ...constant, expression: constant.expression.split("Ω").join("Ohm") })),
      steps: notebook.steps.map((step) => ({ ...step, expression: step.expression.split("Ω").join("Ohm"), targetUnit: step.targetUnit.split("Ω").join("Ohm") })),
    }));
    const shape = (notebooks: CalculationNotebook[]) => notebooks.map((notebook) => [
      notebook.localConstants.map((constant) => constant.expression),
      notebook.steps.map((step) => [step.expression, step.targetUnit]),
    ]);
    expect(shape(normalizePresetUnitSpellings(legacy).notebooks)).toEqual(shape(all));
    expect(all.filter((notebook) => JSON.stringify([notebook.localConstants, notebook.steps]).includes("Ω"))).toHaveLength(14);
  });

  it("利用者が作ったノートは書き換えない", () => {
    const own: CalculationNotebook = { ...dividerNotebook(seeded("electronics")), id: "own", isPreset: false };
    expect(normalizePresetUnitSpellings([own]).changed).toBe(false);
  });

  it("綴りを直したあとならシードの更新も届く", () => {
    // 綴りの揃え → シードの更新 の順であることの裏取り（逆順だと弾かれる）。
    const target = dividerNotebook(seeded("electronics"));
    const stored = seeded("electronics").map((notebook) => (notebook.id === target.id
      ? {
        ...notebook,
        localConstants: notebook.localConstants.map((constant) => (constant.symbol === "R₁"
          ? { ...constant, expression: "1kOhm", seededExpression: "1kOhm" }
          : constant)),
      }
      : notebook));
    const fixed = normalizePresetUnitSpellings(stored);
    const updated = applyPresetSeedUpdates(fixed.notebooks);
    expect(dividerNotebook(updated.notebooks).localConstants.find((constant) => constant.symbol === "R₁")?.expression).toBe("10kΩ");
  });
});
