import { createElement, useEffect, useMemo, type CSSProperties } from "react";
import katex from "katex";

import { KATEX_CSS } from "@/lib/katex-assets.generated";
import { sanitizeCssFontFamily, sanitizeCssFontWeight } from "@/lib/latex-mathsf-font";

// ラッパーのdivに付けるクラス名。mathsfのフォント差し替えをこのクラスの中に閉じることで、
// 同じKaTeXのCSSを共有している他の数式（計算ノートの数式カードなど）には影響しない。
const ROOT_CLASS = "latex-view-root";

let cssInjected = false;
function ensureCss() {
  if (cssInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  // KaTeXのCSSのあとに置くことで、同じ詳細度（0,2,0）の .katex .mathsf に後勝ちで勝てる。
  // `.katex` 自体のフォントには触らない（全グリフの字幅が変わって組みが崩れるため）。
  style.textContent = `${KATEX_CSS}\n.${ROOT_CLASS} .mathsf{font-family:var(--mathsf-family,KaTeX_SansSerif);font-weight:var(--mathsf-weight,400);}`;
  document.head.appendChild(style);
  cssInjected = true;
}

type Props = {
  latex: string;
  color: string;
  fontSize?: number;
  displayMode?: boolean;
  /** 数式の幅ぶんだけ場所を取る。単位ラベルなど、数式の右に何かを並べたいときに使う。 */
  fitContent?: boolean;
  /**
   * `\mathsf` で組んだ部分（電卓の結果では数字）だけを差し替えるフォント。
   * 隣に並ぶ小数表示と同じ等幅・太字で数字を出すために使う。指定しなければKaTeX既定
   * （KaTeX_SansSerif・400）のまま。
   */
  mathsfFontFamily?: string;
  mathsfFontWeight?: string | number;
};

/** Webでは実DOMがあるため、WebViewを使わずKaTeXのrenderToStringで直接HTMLを描画する。 */
export function LatexView({
  latex,
  color,
  fontSize = 16,
  displayMode = true,
  fitContent = false,
  mathsfFontFamily,
  mathsfFontWeight,
}: Props) {
  useEffect(() => {
    ensureCss();
  }, []);

  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, { throwOnError: false, displayMode });
    } catch {
      return latex;
    }
  }, [latex, displayMode]);

  const family = sanitizeCssFontFamily(mathsfFontFamily);
  const weight = sanitizeCssFontWeight(mathsfFontWeight);
  // CSS変数はReactのstyleオブジェクトにそのまま書けるが、CSSPropertiesの型には無いのでキャストする。
  const style = {
    color,
    fontSize,
    display: fitContent ? "inline-block" : "block",
    ...(family ? { "--mathsf-family": family } : {}),
    ...(weight ? { "--mathsf-weight": weight } : {}),
  } as CSSProperties;

  return createElement("div", {
    className: ROOT_CLASS,
    style,
    dangerouslySetInnerHTML: { __html: html },
  });
}
