import { evaluateCalculatorInput } from "@/lib/calculator-input";
import { IDENTIFIER_BODY_CHAR_CLASS, IDENTIFIER_START_CHAR_CLASS, type Quantity, type SavedConstant } from "@/lib/units";

/**
 * 定数の編集シート（電卓タブ・ライブラリタブの共用）の下書きを検証する純関数。
 *
 * 【なぜ `${symbol} = ${expression}` に組み直して既存の入口へ流すか】定数の名前の規則
 * （単位記号と衝突しない）と式の評価規則は、電卓で `W1 = 3cm` と打ったときの経路
 * （evaluateCalculatorInput）が既に全部持っている。シート専用の検証を別に
 * 書くと、**打って定義する道と欄で定義する道で通る／通らないが食い違う**（実際に旧シートは
 * 名前を `/^[A-Za-z_][A-Za-z0-9_]*$/` のASCII限定で見ていて、電卓からは定義できる `α` や `mₒ`
 * をシートからは保存できなかった）。
 */

/** 定数名として成立する文字列か。文字集合はエンジン（parseConstantDefinition）と同じものを使う。 */
const CONSTANT_SYMBOL_PATTERN = new RegExp(`^[${IDENTIFIER_START_CHAR_CLASS}][${IDENTIFIER_BODY_CHAR_CLASS}]*$`);

export type ConstantDraft = {
  symbol: string;
  expression: string;
  /** 保存ボタンを押せるか。 */
  canSave: boolean;
  /** 式が評価できたときの値（プレビュー用）。 */
  quantity: Quantity | null;
  /**
   * 理由を説明すべきエラー。**まだ何も書いていない欄では null**——開いた瞬間に赤字が出ると、
   * 打ち始める前から間違いを指摘されることになる。
   */
  error: Error | null;
  /** 名前の形式そのものが定数名になっていない（数字始まり・記号混じりなど）。 */
  hasInvalidSymbol: boolean;
};

export function evaluateConstantDraft(symbolInput: string, expressionInput: string, otherConstants: readonly SavedConstant[]): ConstantDraft {
  const symbol = symbolInput.trim();
  const expression = expressionInput.trim();
  const empty: ConstantDraft = { symbol, expression, canSave: false, quantity: null, error: null, hasInvalidSymbol: false };
  if (!symbol || !expression) return empty;
  // 名前の形式だけは先に見る。ここを通さずに組み立てると `1x = 3cm` が「代入ではない式」として
  // 評価され、名前の誤りが「式の構文エラー」として説明されてしまう。
  if (!CONSTANT_SYMBOL_PATTERN.test(symbol)) return { ...empty, hasInvalidSymbol: true };
  // 履歴の自動定数（a1・a2…）との衝突だけはここでは見ない。あれは保存済みの履歴の件数で決まる
  // ストア側の都合で、この純関数には渡ってこない。保存時に upsertConstant が投げるメッセージを
  // そのままシートのエラー欄へ出す（電卓で `a1 = 5` と打ったときと同じ経路・同じ文言）。
  try {
    const { quantity } = evaluateCalculatorInput(`${symbol} = ${expression}`, [...otherConstants]);
    return { symbol, expression, canSave: true, quantity, error: null, hasInvalidSymbol: false };
  } catch (cause) {
    return { ...empty, error: cause instanceof Error ? cause : new Error(String(cause)) };
  }
}
