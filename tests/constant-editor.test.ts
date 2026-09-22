import { describe, expect, it } from "vitest";

import { evaluateConstantDraft } from "@/lib/constant-editor";
import { UnitError } from "@/lib/unit-errors";
import { formatQuantity, type SavedConstant } from "@/lib/units";

const existing: SavedConstant[] = [
  { symbol: "H1", expression: "20mm", quantity: { siValue: 0.02, dimension: [1, 0, 0, 0, 0, 0, 0] }, createdAt: new Date(0).toISOString() },
];

describe("evaluateConstantDraft", () => {
  // 開いた瞬間に赤字が出ると、打ち始める前から間違いを指摘されることになる。
  it("空の欄では何も言わない（保存もできない）", () => {
    expect(evaluateConstantDraft("", "", [])).toMatchObject({ canSave: false, error: null, hasInvalidSymbol: false });
    expect(evaluateConstantDraft("R", "", [])).toMatchObject({ canSave: false, error: null });
    expect(evaluateConstantDraft("", "3cm", [])).toMatchObject({ canSave: false, error: null });
  });

  it("成立する下書きは値を返す", () => {
    const draft = evaluateConstantDraft(" R ", " 3cm ", []);
    expect(draft).toMatchObject({ symbol: "R", expression: "3cm", canSave: true, error: null });
    expect(formatQuantity(draft.quantity!, "cm", "en")).toBe("3 cm");
  });

  it("保存済みの定数を参照できる", () => {
    const draft = evaluateConstantDraft("A1", "H1 * 2", existing);
    expect(draft.canSave).toBe(true);
    expect(formatQuantity(draft.quantity!, "mm", "en")).toBe("40 mm");
  });

  // 旧シートは名前を /^[A-Za-z_][A-Za-z0-9_]*$/ のASCII限定で見ていて、電卓からは定義できる
  // α や mₒ をシートからは保存できなかった。文字集合はエンジンと同じものを使う。
  it("ギリシャ文字・下付き文字の名前も通る（電卓から打てるものと同じ）", () => {
    expect(evaluateConstantDraft("α", "2", []).canSave).toBe(true);
    expect(evaluateConstantDraft("mₒ", "200g", []).canSave).toBe(true);
  });

  it("名前の形式が定数名になっていないときは、式の構文エラーではなく名前の誤りとして返す", () => {
    const draft = evaluateConstantDraft("1x", "3cm", []);
    expect(draft.hasInvalidSymbol).toBe(true);
    expect(draft.error).toBeNull();
    expect(draft.canSave).toBe(false);
  });

  it("単位記号と同じ名前は弾く（電卓で打ったときと同じ判定・同じ文言）", () => {
    const draft = evaluateConstantDraft("W", "3cm", []);
    expect(draft.canSave).toBe(false);
    expect(draft.error).toBeInstanceOf(UnitError);
    expect((draft.error as UnitError).code).toBe("constantSymbolIsUnit");
  });

  it("式が評価できないときは理由を返す", () => {
    const draft = evaluateConstantDraft("R", "3cm + 2kg", []);
    expect(draft.canSave).toBe(false);
    expect((draft.error as UnitError).code).toBe("dimensionMismatchAddSubtract");
  });
});

// 保存済みの `R` を、既にある `H1` へ改名すると `upsertConstant` が `H1` を置き換え、
// 改名の後始末で `R` も消える＝一度の保存で2つの値が失われる。シート側で弾く。
describe("別の保存済み定数と同じ名前", () => {
  const saved: SavedConstant[] = [
    { symbol: "R", expression: "4.7kΩ", quantity: { siValue: 4700, dimension: [2, 1, -3, -2, 0, 0, 0] }, createdAt: new Date(0).toISOString() },
    ...existing,
  ];

  it("式としては成立するので、下書きの評価そのものは通る", () => {
    // 弾くのは画面側（isDuplicateSymbol）で、この純関数は「その式が計算できるか」だけを見る。
    // ここが通ることが、重複の判定を別に持つ必要がある理由そのもの。
    expect(evaluateConstantDraft("H1", "3cm", saved.filter((item) => item.symbol !== "R")).canSave).toBe(true);
  });

  it("自分自身への保存は重複ではない（更新）", () => {
    // 編集中の記号は otherConstants から外れるので、同じ名前のまま値だけ変えられる。
    expect(evaluateConstantDraft("R", "10kΩ", saved.filter((item) => item.symbol !== "R")).canSave).toBe(true);
  });
});
