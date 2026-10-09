/**
 * 数式が表示枠より広いときの縮小率。計算ノートの数式カードは1行に固定して描く（KaTeXの
 * インライン組版は分数・括弧の中で折り返せない）ので、幅を超えた式は以前は右端で黙って切れていた。
 *
 * - 枠に収まるならそのまま（1）。
 * - 超えたら枠に合わせて縮めるが、`LATEX_MIN_FIT_SCALE` より小さくはしない。それ以上縮めると
 *   添字・指数が読めなくなるので、残りは横スクロールで見せる（描画側で overflow-x:auto）。
 * - 端数の丸めで1pxはみ出して横スクロールが出るのを避けるため、少しだけ余分に縮める。
 *
 * 読ませたい長い式は、ここに頼らずシード側で `\begin{aligned}` を使って2行に組むこと
 * （縮小と横スクロールは「それでも収まらなかったもの」の保険）。
 */
export const LATEX_MIN_FIT_SCALE = 0.75;
export const LATEX_FIT_MARGIN = 0.99;

export function latexFitScale(naturalWidth: number, availableWidth: number, minScale = LATEX_MIN_FIT_SCALE): number {
  if (!(naturalWidth > 0) || !(availableWidth > 0) || naturalWidth <= availableWidth) return 1;
  return Math.max(minScale, (availableWidth / naturalWidth) * LATEX_FIT_MARGIN);
}
