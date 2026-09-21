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
    expect(evaluateConstantDraft("W1", "", [])).toMatchObject({ canSave: false, error: null });
    expect(evaluateConstantDraft("", "3cm", [])).toMatchObject({ canSave: false, error: null });
  });

  it("成立する下書きは値を返す", () => {
    const draft = evaluateConstantDraft(" W1 ", " 3cm ", []);
    expect(draft).toMatchObject({ symbol: "W1", expression: "3cm", canSave: true, error: null });
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
    const draft = evaluateConstantDraft("W1", "3cm + 2kg", []);
    expect(draft.canSave).toBe(false);
    expect((draft.error as UnitError).code).toBe("dimensionMismatchAddSubtract");
  });
});
