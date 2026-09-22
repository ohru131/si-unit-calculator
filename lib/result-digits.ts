import { RESULT_DIGITS_UNLIMITED } from "@/lib/units";

/**
 * 設定タブの「表示する桁数」（`resultDigits`）の選択肢と、保存値の読み戻し。
 *
 * **Reactに依存しない純データとして切り出してある。** 判定を `lib/global-settings.tsx`（.tsx）に
 * 置くとテストから読めない（RNのソースをそのまま解析しに行って落ちる）ため、`lib/unit-group-names.ts`
 * を切り出したのと同じ理由でここに置く。画面向けの再exportは global-settings 側にある。
 */

/**
 * 設定タブで選べる上限。10は `MAX_DISPLAY_DIGITS` と同じ＝この仕組みが入る前の挙動。
 * `RESULT_DIGITS_UNLIMITED`（0）は「丸めなし」で、**10桁では表せない値**
 * （`3333333333333` のような13桁の整数）を打った人のための逃げ道。
 */
export const RESULT_DIGITS_OPTIONS = [4, 6, 8, 10, RESULT_DIGITS_UNLIMITED] as const;

/**
 * 既定は6桁。利用者の指示。**10桁のまま出すと、丸めが効かない手順（有効1桁の入力しか
 * 無い・桁が読めない）で `3.677749375 kW` のような数字が並ぶ**（プリセット376手順のうち91件）。
 */
export const DEFAULT_RESULT_DIGITS = 6;

function isResultDigits(value: unknown): value is number {
  return typeof value === "number" && (RESULT_DIGITS_OPTIONS as readonly number[]).includes(value);
}

/**
 * 保存済みの文字列を設定値へ戻す。保存が無ければ既定（6桁）。
 *
 * **`Number(raw)` を直接書かないこと。** `Number(null)` は `0` で、`0` は
 * `RESULT_DIGITS_UNLIMITED`＝妥当な設定値なので、**まだ一度も設定していない端末が黙って
 * 「丸めなし」になる**（この選択肢を足した直後に実際に踏んだ。`12V / 4.7kΩ` の結果が
 * `2.553191489361702 mA` と16桁で出た）。「保存が無い」と「0 が保存されている」を先に分ける。
 */
export function parseStoredResultDigits(raw: string | null | undefined): number {
  if (raw === null || raw === undefined || raw.trim() === "") return DEFAULT_RESULT_DIGITS;
  const parsed = Number(raw);
  return isResultDigits(parsed) ? parsed : DEFAULT_RESULT_DIGITS;
}
