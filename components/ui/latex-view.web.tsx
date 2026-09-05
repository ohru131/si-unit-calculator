import { createElement, useEffect, useMemo } from "react";
import katex from "katex";

import { KATEX_CSS } from "@/lib/katex-assets.generated";

let cssInjected = false;
function ensureCss() {
  if (cssInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = KATEX_CSS;
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
};

/** Webでは実DOMがあるため、WebViewを使わずKaTeXのrenderToStringで直接HTMLを描画する。 */
export function LatexView({ latex, color, fontSize = 16, displayMode = true, fitContent = false }: Props) {
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

  return createElement("div", {
    style: { color, fontSize, display: fitContent ? "inline-block" : "block" },
    dangerouslySetInnerHTML: { __html: html },
  });
}
