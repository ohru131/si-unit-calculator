// KaTeXの `\mathsf` グリフ（＝結果カードでは数字）だけを別のフォントで描くための、CSS値の検証。
//
// 値はアプリ自身のコード（`mono` = Menlo / monospace）から渡すものだが、最終的にCSSの宣言へ
// そのまま埋め込む。`}` や `;` が混ざると宣言やセレクタを閉じて別の指定を注入できてしまうので、
// フォント名として妥当な字面だけを通し、それ以外は null（＝KaTeX既定のまま）にする。
const FONT_FAMILY_PATTERN = /^[A-Za-z0-9 ,'"_-]+$/;

// CSSのfont-weightとして意味を持つ字面だけ。数値は100〜900の100刻み。
const FONT_WEIGHT_PATTERN = /^(?:[1-9]00|normal|bold)$/;

export function sanitizeCssFontFamily(value: string | undefined | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || !FONT_FAMILY_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export function sanitizeCssFontWeight(value: string | number | undefined | null): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  if (!FONT_WEIGHT_PATTERN.test(text)) return null;
  return text;
}
