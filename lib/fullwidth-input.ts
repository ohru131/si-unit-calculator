/**
 * 全角の英数字・記号（U+FF01〜U+FF5E）と全角スペース（U+3000）を対応する半角へ直す。
 *
 * なぜ必要か: 日本語IMEのままOSのキーボードで打つと `ｍ`・`３`・`（` のような全角文字が入り、
 * 評価器はこれを識別子でも数値でも括弧でも無いものとして扱う（`３ｍ` は解釈不能）。入力の受け口で
 * 揃えておけば、利用者がIMEを切り替え忘れても式として通る。
 *
 * `String.prototype.normalize("NFKC")` は使わない——このコードベースに前例が無く、Hermes で落ちると
 * 「テストは通るのに実機だけ動かない」形になる。範囲のずらしだけで足りる。
 */
export function toHalfWidthAscii(text: string): string {
  let result = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= 0xff01 && code <= 0xff5e) result += String.fromCodePoint(code - 0xfee0);
    else if (code === 0x3000) result += " ";
    else result += char;
  }
  return result;
}
