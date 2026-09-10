import { describe, expect, it } from "vitest";

import { buildCaretPreview } from "@/lib/expression-caret";
import { analyzeExpression } from "@/lib/unit-input";

const analyze = (input: string) => analyzeExpression(input).segments;

/** プレビュー行に実際に描かれる文字列を、キャレットを "|" として組み直す。
 * 「切り分けても式の字面が変わらない」ことと「位置が合っている」ことを一度に見る。 */
function render(input: string, start: number, end = start) {
  const { pieces, caretIndex } = buildCaretPreview(analyze(input), start, end);
  const parts = pieces.map((piece) => piece.text);
  if (caretIndex !== null) parts.splice(caretIndex, 0, "|");
  return parts.join("");
}

describe("buildCaretPreview", () => {
  it("キャレットを式の途中・先頭・末尾に置ける", () => {
    expect(render("12V/4.7kOhm", 0)).toBe("|12V/4.7kOhm");
    expect(render("12V/4.7kOhm", 3)).toBe("12V|/4.7kOhm");
    expect(render("12V/4.7kOhm", 11)).toBe("12V/4.7kOhm|");
  });

  it("セグメントの内側でも切れる（単位・数値の途中にカーソルを置ける）", () => {
    // "kOhm" の途中。単位チップの差し替え範囲を見るときにこの位置が要る。
    expect(render("12V/4.7kOhm", 8)).toBe("12V/4.7k|Ohm");
    expect(render("12V/4.7kOhm", 1)).toBe("1|2V/4.7kOhm");
  });

  it("切り分けても式の字面は変わらない", () => {
    const input = "2kg*9.8m/s^2";
    for (let caret = 0; caret <= input.length; caret += 1) {
      expect(render(input, caret).replace("|", "")).toBe(input);
    }
  });

  it("範囲選択中はキャレットを描かず、選択された一片だけにフラグが付く", () => {
    const { pieces, caretIndex } = buildCaretPreview(analyze("12V/4.7kOhm"), 4, 7);
    expect(caretIndex).toBeNull();
    const selected = pieces.filter((piece) => piece.selected).map((piece) => piece.text).join("");
    expect(selected).toBe("4.7");
    expect(pieces.map((piece) => piece.text).join("")).toBe("12V/4.7kOhm");
  });

  it("選択範囲が逆順（後ろから前へドラッグ）でも同じ結果になる", () => {
    const forward = buildCaretPreview(analyze("12V/4.7kOhm"), 4, 7);
    const backward = buildCaretPreview(analyze("12V/4.7kOhm"), 7, 4);
    expect(backward.pieces.map((p) => [p.text, p.selected])).toEqual(forward.pieces.map((p) => [p.text, p.selected]));
  });

  it("式の長さを超える位置・負の位置は端に丸める（ACや履歴復元の直後に来る）", () => {
    expect(render("5cm", 999)).toBe("5cm|");
    expect(render("5cm", -3)).toBe("|5cm");
    // NaN が来ても落ちない（selection は TextInput 由来なので防御しておく）
    expect(render("5cm", Number.NaN)).toBe("|5cm");
  });

  it("空の式でもキャレットは0の位置に出る", () => {
    const { pieces, caretIndex } = buildCaretPreview([], 0, 0);
    expect(pieces).toEqual([]);
    expect(caretIndex).toBe(0);
  });

  it("分割した一片は元のセグメントを保つ（未対応単位のタップ範囲が縮まない）", () => {
    // "kQ" は登録の無い単位なので unknown-unit になる。その途中にカーソルを置いても、
    // 修正候補を出すための範囲は分割前の全体でなければならない。
    const segments = analyze("12V/4.7kQ");
    const unknown = segments.find((segment) => segment.kind === "unknown-unit");
    expect(unknown).toBeDefined();
    const caretInside = unknown!.start + 1;
    const { pieces } = buildCaretPreview(segments, caretInside, caretInside);
    const halves = pieces.filter((piece) => piece.segment === unknown);
    expect(halves.length).toBe(2);
    for (const half of halves) {
      expect(half.segment.start).toBe(unknown!.start);
      expect(half.segment.end).toBe(unknown!.end);
    }
    // 警告アイコンは最後の一片だけに出す（分割で2つ並ばないこと）
    expect(halves.filter((half) => half.isSegmentEnd).length).toBe(1);
  });

  it("セグメントの境界に来たキャレットはセグメントを分割しない", () => {
    const segments = analyze("12V/4.7kOhm");
    const { pieces } = buildCaretPreview(segments, 3, 3);
    expect(pieces.length).toBe(segments.length);
    expect(pieces.every((piece) => piece.text === piece.segment.text)).toBe(true);
  });
});
