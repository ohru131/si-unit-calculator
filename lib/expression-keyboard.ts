/**
 * 電卓と計算ノートが共用する式キーボード（components/ui/expression-keyboard.tsx）の定義。
 * 並びをここに1本化しておくことで、2画面のキー配置が食い違わない（実際に「電卓とノートで
 * キー配置が違う」と指摘された）。
 */

/** キーパッドの1キー。`insert` が無ければ `label` をそのまま式へ入れる。 */
export type ExpressionKey = {
  label: string;
  /** ラベルと実際に入る文字が違うキー。 */
  insert?: string;
  /** 式を動かすだけで文字を入れないキー。 */
  action?: "caretLeft" | "caretRight";
};

/** 1セルに2つ並べるキー（括弧だけ）。他のセルは1キーで1セル。 */
export type ExpressionCell = { key: ExpressionKey } | { split: readonly [ExpressionKey, ExpressionKey] };

/**
 * キーパッド本体は5列4段。
 *
 * ```
 * 7 8 9  ⌫ AC
 * 4 5 6  ◀ ▶     キャレット移動はここ（ツール行はパネルの入口だけに絞る）
 * 1 2 3  ÷ ×     **演算子は ÷ × − + の順で2×2のひとかたまり**
 * 0 . ()  − +     括弧は1セルを半分ずつ分け合う
 * ```
 *
 * 【なぜこの並びか】
 * - **演算子を分断しない。** 一度 `0 . ^ + ×10ⁿ =` の6列にしたところ、`+` だけが `^` と `×10ⁿ` の
 *   間に挟まって演算子の塊が割れた（利用者から「いまいち」と指摘された）。÷ × − + は
 *   右下の2×2に固めておく。
 * - **`=` はキーパッドに置かない。** この電卓は打つそばから答えが出る（`=` は履歴に残す確定操作）
 *   ので、入力欄の右にある `=` だけで足りる。1枠浮いたぶんを括弧と演算子の配置に回せる。
 * - **`^`・`×10ⁿ` は `xⁿ` パネルへ。** キーパッド本体に入れると上の2つが両立しない。
 *
 * 列数と対応するのは EXPRESSION_KEY_COLUMNS だけ。並びを変えるならここだけを直す。
 */
export const EXPRESSION_CELLS: readonly ExpressionCell[] = [
  { key: { label: "7" } }, { key: { label: "8" } }, { key: { label: "9" } }, { key: { label: "⌫" } }, { key: { label: "AC" } },
  { key: { label: "4" } }, { key: { label: "5" } }, { key: { label: "6" } }, { key: { label: "◀", action: "caretLeft" } }, { key: { label: "▶", action: "caretRight" } },
  { key: { label: "1" } }, { key: { label: "2" } }, { key: { label: "3" } }, { key: { label: "÷" } }, { key: { label: "×" } },
  { key: { label: "0" } }, { key: { label: "." } }, { split: [{ label: "(" }, { label: ")" }] }, { key: { label: "-" } }, { key: { label: "+" } },
];
export const EXPRESSION_KEY_COLUMNS = 5;

/** 見た目を数字と分ける演算子キー。 */
export const OPERATOR_KEYS: ReadonlySet<string> = new Set(["×", "÷", "+", "-"]);

/**
 * キーのセルの余白。外側の View に付くので、キー本体の Pressable にはこの値の hitSlop を付けて
 * 当たり判定をセル全体へ広げる（余白のぶんだけ隣のキーとの継ぎ目に無反応な帯ができる。実機で報告）。
 */
export const KEY_CELL_PADDING = 3;

/** SI 接頭語キー。単位パネルの上段に出す。 */
export const PREFIX_KEYS = ["p", "n", "µ", "m", "c", "k", "M", "G"] as const;

/**
 * `ABC` パネル（英字だけの自前キーボード）。OS のキーボードは日本語入力だと全角の `ｍ` が入って
 * 単位として認識されないので、半角英字だけを打てる列を持つ。
 *
 * **並びは QWERTY ではなく abc 順**（2026-09-20）。ここで打つのは文章ではなく単位記号と定数名の
 * 1〜3文字で、QWERTY の指の記憶が働く長さではない。`kΩ` の `k`、`mpa` の `p` のように**1文字を
 * 探す**操作なので、五十音順の索引と同じく abc 順の方が早く見つかる。
 *
 * `_` は定数名に使える（`lib/units.ts` の識別子文字集合に含まれる）。大文字は `⇧` で切り替える
 * （`SHIFT_KEY`。1文字ぶんではなく**固定**——`MPa`・`kWh` のように大文字が続く単位記号が多い）。
 *
 * **英字以外に `=` も置く。** 定数の定義（`W = 3cm`）に要るが、キーパッド本体にも他のパネルにも
 * 無いため（`⇧` を押しても大文字にならない——記号なので `_` と同じ扱い）。
 * **階乗の `!` はここに置かない**——押した時点で値が変わる「計算するキー」なので、打った文字が
 * そのまま残る英字に混ぜると何が起きるか分からない。`xⁿ` パネル（POWER_KEYS）の側。
 */
export const ALPHABET_ROWS: readonly (readonly string[])[] = [
  ["a", "b", "c", "d", "e", "f", "g", "h"],
  ["i", "j", "k", "l", "m", "n", "o", "p"],
  ["q", "r", "s", "t", "u", "v", "w", "x"],
  ["y", "z", "_", "=", "⇧"],
];
export const SHIFT_KEY = "⇧";

/**
 * `xⁿ` パネル。ラベルは電卓の慣例（上付き数字だけでは何のキーか分からない）。
 * キーパッド本体には入れない——入れると演算子の 2×2 の塊が割れる（EXPRESSION_CELLS の注記）。
 */
export const POWER_KEYS: readonly { label: string; insert: string }[] = [
  { label: "x²", insert: "²" },
  { label: "x³", insert: "³" },
  { label: "xʸ", insert: "^" },
  { label: "×10ⁿ", insert: "×10^" },
  // 階乗。**`ABC` ではなくここ**——`!` は打った文字がそのまま残る英字と違い、押した時点で
  // 値が変わる「計算するキー」なので、英字に混ぜると何が起きるか分からない（実機で指摘された）。
  { label: "x!", insert: "!" },
];

/**
 * `定数` パネルに出す数学定数。`π`・`e` は評価器（lib/units.ts）がそのまま読む。
 * 以前は `f(x)` の末尾にあったが、**関数ではなく値**なので定数側へ移した。
 */
export const MATH_CONSTANT_KEYS: readonly string[] = ["π", "e"];

/**
 * パネルの中のキーを何列で並べるか。`ABC` が行ごとに並ぶのと同じ見え方にするため、関数も記号も
 * 横スクロールではなく**固定幅のセルを折り返す**グリッドで出す（横スクロールは端に何が隠れているか
 * 分からず、目的の関数を探すのに毎回スクロールが要る、と指摘された）。
 *
 * 列数が違うのはラベルの長さが違うため: 関数は `atan2(` の6文字が入る幅が要り、記号は1文字なので
 * `ABC` と同じ10列に揃えられる。**余った枠は引き伸ばさず空けること**——`flex: 1` で埋めると
 * 最終行のキーだけ極端に広くなる（下付き文字は22文字＝10列で最終行が2個）。
 */
export const FUNCTION_KEY_COLUMNS = 5;
export const SYMBOL_KEY_COLUMNS = 10;

/** ツール行で選べるパネル。null はパネルを畳んだ状態。 */
export type KeyboardTool = "powers" | "constants" | "functions" | "symbols" | "alphabet" | "units";
