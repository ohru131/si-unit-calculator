import { describe, expect, it } from "vitest";

import { FORMULA_CHARACTER_GROUPS } from "../lib/formula-characters";
import { IDENTIFIER_BODY_CHAR_CLASS } from "../lib/units";

// lib/units.tsの識別子文字集合（1文字だけの完全一致）と照合する。ここが一番重要な検証で、
// 「レールに出す文字を足したら、実は式で使えない文字だった」という罠を機械的に検出する。
const identifierCharPattern = new RegExp(`^[${IDENTIFIER_BODY_CHAR_CLASS}]$`, "u");

describe("計算ノート編集画面の変数名ボタンに出す文字", () => {
  it("全グループの全文字が、lib/units.tsの識別子文字集合に含まれている", () => {
    const offenders: string[] = [];
    for (const group of FORMULA_CHARACTER_GROUPS) {
      for (const char of group.chars) {
        if (!identifierCharPattern.test(char)) offenders.push(`${group.id}: "${char}" (U+${char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0")})`);
      }
    }
    // 落ちたときにどのグループのどの文字が原因かがそのままメッセージに出るようにする
    // （配列の長さだけを見る検証だと、原因の文字を特定できず意味が薄い）。
    expect(offenders, `識別子として使えない文字が紛れ込んでいます: ${offenders.join(", ")}`).toEqual([]);
  });

  it("単位専用でidentifierから明示的に除外されているΩ（U+03A9）とµ（U+00B5）を含まない", () => {
    const allChars = FORMULA_CHARACTER_GROUPS.flatMap((group) => group.chars);
    expect(allChars).not.toContain("Ω");
    expect(allChars).not.toContain("µ");
  });

  it("各グループ内で文字が重複していない", () => {
    for (const group of FORMULA_CHARACTER_GROUPS) {
      expect(new Set(group.chars).size).toBe(group.chars.length);
    }
  });

  it("各文字は1コードポイントちょうど（サロゲートペア等の合成文字が紛れていない）", () => {
    for (const group of FORMULA_CHARACTER_GROUPS) {
      for (const char of group.chars) {
        expect([...char].length, `${group.id}: "${char}" は1文字ではない`).toBe(1);
      }
    }
  });
});
