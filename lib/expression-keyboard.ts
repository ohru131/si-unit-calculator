/**
 * 電卓と計算ノートが共用する式キーボード（components/ui/expression-keyboard.tsx）の定義。
 * 並びをここに1本化しておくことで、2画面のキー配置が食い違わない（実際に「電卓とノートで
 * キー配置が違う」と指摘された）。
 */

/**
 * キーパッド本体は5列4段。一般的な電卓（iOS・Android）と関数電卓（Casio fx 系）に共通する並び。
 *
 * ```
 * 7 8 9 ⌫ AC     ⌫ と AC は隣同士で右上
 * 4 5 6 ÷ ×      演算子は数字の右に2×2のひとかたまり
 * 1 2 3 - +
 * 0 . ( ) =      0 は 1 の真下、= は右下（ノートでは「確定して閉じる」）
 * ```
 * 列数と対応するのは EXPRESSION_KEY_COLUMNS だけ。4列に戻すなら並びも組み直すこと。
 */
export const EXPRESSION_KEYS: readonly string[] = [
  "7", "8", "9", "⌫", "AC",
  "4", "5", "6", "÷", "×",
  "1", "2", "3", "-", "+",
  "0", ".", "(", ")", "=",
];
export const EXPRESSION_KEY_COLUMNS = 5;

/** 見た目を数字と分ける演算子キー。 */
export const OPERATOR_KEYS: ReadonlySet<string> = new Set(["×", "÷", "+", "-"]);

/**
 * キーのセルの余白。外側の View に付くので、キー本体の Pressable にはこの値の hitSlop を付けて
 * 当たり判定をセル全体へ広げる（余白のぶんだけ隣のキーとの継ぎ目に無反応な帯ができる。実機で報告）。
 */
export const KEY_CELL_PADDING = 3;

/** `xⁿ` パネル。ラベルは電卓の慣例（上付き数字だけでは何のキーか分からない）。 */
export const POWER_KEYS: readonly { label: string; insert: string }[] = [
  { label: "x²", insert: "²" },
  { label: "x³", insert: "³" },
  { label: "xʸ", insert: "^" },
  { label: "×10ⁿ", insert: "×10^" },
];

/** SI 接頭語キー。単位パネルの上段に出す。 */
export const PREFIX_KEYS = ["p", "n", "µ", "m", "c", "k", "M", "G"] as const;

/**
 * `ABC` パネル（英字だけの自前キーボード）。OS のキーボードは日本語入力だと全角の `ｍ` が入って
 * 単位として認識されないので、半角英字だけを打てる列を持つ。`⇧` は1回ぶんの大文字化、
 * `_` は定数名に使える。
 */
export const ALPHABET_ROWS: readonly (readonly string[])[] = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["⇧", "z", "x", "c", "v", "b", "n", "m", "_"],
];
export const SHIFT_KEY = "⇧";

/** ツール行で選べるパネル。null はパネルを畳んだ状態。 */
export type KeyboardTool = "powers" | "functions" | "symbols" | "alphabet" | "units";
