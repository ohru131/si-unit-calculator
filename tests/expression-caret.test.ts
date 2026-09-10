import { describe, expect, it } from "vitest";

import { buildCaretPreview, normalizeSelection } from "@/lib/expression-caret";
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

// 進数入力モードのプレビューは桁を解析しないので、セグメントではなく normalizeSelection だけを
// 通して「前 / 選択帯 or キャレット / 後ろ」の3つに割る。画面側と同じ割り方をここで再現する。
function renderBase(digits: string, start: number, end = start) {
  const { start: from, end: to, hasRange } = normalizeSelection(digits.length, start, end);
  const middle = hasRange ? `[${digits.slice(from, to)}]` : "|";
  return `${digits.slice(0, from)}${middle}${digits.slice(to)}`;
}

describe("normalizeSelection（進数入力プレビューと共有）", () => {
  it("範囲が無いときはキャレット1本になる", () => {
    expect(normalizeSelection(4, 2, 2)).toEqual({ start: 2, end: 2, hasRange: false });
    expect(renderBase("FF00", 2)).toBe("FF|00");
    expect(renderBase("FF00", 0)).toBe("|FF00");
    expect(renderBase("FF00", 4)).toBe("FF00|");
  });

  it("範囲選択中はキャレットではなく帯になる（進数でも複数桁がまとめて置換される）", () => {
    // pressKey は進数入力中も selection の範囲をまとめて置換・削除するので、
    // キャレット1本だと「1文字ぶんの挿入」に見えてしまう。
    expect(normalizeSelection(4, 2, 4)).toEqual({ start: 2, end: 4, hasRange: true });
    expect(renderBase("FF00", 2, 4)).toBe("FF[00]");
    expect(renderBase("1AF", 1, 3)).toBe("1[AF]");
  });

  it("逆順（後ろから前へドラッグ）でも前→後ろに正規化する", () => {
    expect(normalizeSelection(4, 4, 2)).toEqual({ start: 2, end: 4, hasRange: true });
    expect(renderBase("FF00", 4, 2)).toBe("FF[00]");
  });

  it("式が短くなった直後の古い位置・負の値・NaN を端に丸める", () => {
    // AC・履歴復元の直後は、前の式の位置のままの selection が残ることがある。
    expect(normalizeSelection(2, 99, 99)).toEqual({ start: 2, end: 2, hasRange: false });
    expect(normalizeSelection(2, -5, -5)).toEqual({ start: 0, end: 0, hasRange: false });
    expect(normalizeSelection(2, Number.NaN, Number.NaN)).toEqual({ start: 0, end: 0, hasRange: false });
    expect(renderBase("FF", 99)).toBe("FF|");
    // 一方の端だけが範囲外でも、帯は式の中に収まる
    expect(renderBase("FF", 1, 99)).toBe("F[F]");
  });

  it("空の桁列でもキャレットは0の位置に出る", () => {
    expect(normalizeSelection(0, 3, 3)).toEqual({ start: 0, end: 0, hasRange: false });
    expect(renderBase("", 0)).toBe("|");
  });

  it("buildCaretPreview と同じ丸め方をする（モードで表示位置が変わらない）", () => {
    const digits = "FF00";
    for (const [start, end] of [[0,0],[2,2],[4,4],[99,99],[-3,-3],[4,2],[1,3]] as const) {
      const shared = normalizeSelection(digits.length, start, end);
      const viaPreview = buildCaretPreview(analyze(digits), start, end);
      // 範囲選択の有無の判定が両者で一致すること
      expect(viaPreview.caretIndex === null).toBe(shared.hasRange);
    }
  });
});
