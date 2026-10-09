import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import katex from "katex";

import { KATEX_CSS } from "@/lib/katex-assets.generated";
import { latexFitScale } from "@/lib/latex-fit";
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

  // 枠より広い式は縮め、それでも収まらなければ横スクロールにする（ネイティブ版の renderLatex と
  // 同じ判断。lib/latex-fit.ts）。文字サイズは React の style に入れず、ここで直接書く——
  // style に入れると再レンダーのたびに縮小前の大きさへ戻される。
  // ref は JSX の ref 属性で渡す（createElement の props に入れると react-hooks/refs が
  // 「レンダー中に ref を読んでいる」と誤検知する）。
  const rootRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    // KaTeX の CSS が入る前に測ると、組まれていない素の HTML の幅（数倍広い）で縮小率が決まって
    // しまう（実際に踏んだ。どの式も下限の 0.75 まで縮んでいた）。下の useEffect より先に走るので
    // ここでも呼ぶ（2回目以降は何もしない）。
    ensureCss();
    let cancelled = false;
    const fit = () => {
      if (cancelled) return;
      element.style.fontSize = `${fontSize}px`;
      if (fitContent) return;
      const scale = latexFitScale(element.scrollWidth, element.clientWidth);
      if (scale < 1) element.style.fontSize = `${fontSize * scale}px`;
    };
    fit();
    // KaTeX のフォントは CSS の中の base64 から非同期に読まれるので、読み終わると字幅が変わる。
    // 枠の幅は変わらず ResizeObserver が呼ばれないので、読み終わりで測り直す。
    void document.fonts?.ready.then(fit);
    if (fitContent || typeof ResizeObserver === "undefined") {
      return () => {
        cancelled = true;
      };
    }
    // 幅が変わったときだけ測り直す（縮めると高さが変わり、それでまた呼ばれるため）。
    let lastWidth = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === lastWidth) return;
      lastWidth = element.clientWidth;
      fit();
    });
    observer.observe(element);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [html, fontSize, fitContent]);

  const family = sanitizeCssFontFamily(mathsfFontFamily);
  const weight = sanitizeCssFontWeight(mathsfFontWeight);
  // CSS変数はReactのstyleオブジェクトにそのまま書けるが、CSSPropertiesの型には無いのでキャストする。
  const style = {
    color,
    display: fitContent ? "inline-block" : "block",
    // 横スクロールにすると縦方向も切り取られるので、分数の分子が枠の上へはみ出すぶんの余地を
    // ネイティブ版と同じだけ取る（latex-view.tsx の renderLatex の paddingTop と同じ理由・同じ値）。
    // 幅は親に合わせて固定する（ネイティブ版の fullWidth と同じ）。指定しないと、親が
    // alignItems:flex-start の列のとき要素が数式の幅まで広がり、縮小も横スクロールも効かないまま
    // カードの外へはみ出す（実際に踏んだ。scrollWidth と clientWidth がどちらも数式の幅になる）。
    ...(fitContent ? {} : { width: "100%", boxSizing: "border-box", whiteSpace: "nowrap", overflowX: "auto", overflowY: "hidden", paddingTop: html.includes("frac-line") ? "0.2em" : 0 }),
    ...(family ? { "--mathsf-family": family } : {}),
    ...(weight ? { "--mathsf-weight": weight } : {}),
  } as CSSProperties;

  return <div ref={rootRef} className={ROOT_CLASS} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
