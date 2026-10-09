import { KATEX_CSS, KATEX_JS } from "@/lib/katex-assets.generated";
import { LATEX_FIT_MARGIN, LATEX_MIN_FIT_SCALE } from "@/lib/latex-fit";

// ネイティブの LatexView（components/ui/latex-view.tsx）が WebView に読ませる HTML。
// react-native を読み込まない純粋なモジュールに置いてあるのは、ブラウザで同じ HTML を開いて
// 縮小・横スクロールの挙動を確かめられるようにするため（WebView の中はこの環境では動かせない）。

export type LatexPayload = {
  latex: string;
  color: string;
  fontSize: number;
  displayMode: boolean;
  mathsfFamily: string;
  mathsfWeight: string;
};

// JSON.stringifyは"/"をエスケープしないため、latexに"</script>"相当の文字列が含まれると
// HTMLパーサーがJSより先にscriptタグを閉じてしまい、任意のHTML/JSが注入されうる。
// "<"を全て<に置き換えることで、生成したHTML/注入するJS中に"<"自体が現れないようにする。
export function encodeLatexPayload(payload: LatexPayload): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

export function buildLatexHtml(payload: LatexPayload, fitContent: boolean): string {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>${KATEX_CSS}
html,body{margin:0;padding:0;background:transparent;overflow:hidden;}
#target{display:${fitContent ? "inline-flex" : "flex"};align-items:center;justify-content:flex-start;white-space:nowrap;}
${fitContent ? "" : "#target{overflow-x:auto;overflow-y:hidden;}"}
.katex{color:inherit;}
/* mathsfのフォントはCSS変数で受ける。HTMLは初回の1回しか組み立てない（下のuseState）ので、
   propが変わっても再読み込みせずrenderLatex側の setProperty だけで差し替えられるようにする。
   セレクタを #target で始めることで .katex .mathsf（詳細度0,2,0）より強くなる。 */
#target .mathsf{font-family:var(--mathsf-family,KaTeX_SansSerif);font-weight:var(--mathsf-weight,400);}
</style></head>
<body><div id="target"></div>
<script>${KATEX_JS}</script>
<script>
  var FIT_CONTENT = ${fitContent ? "true" : "false"};
  var lastPayload = null;
  // lib/latex-fit.ts の latexFitScale と同じ計算。WebViewの中には import できず、Hermes では
  // 関数の toString() がソースを返さないので、定数だけ渡して同じ式をここに書く。
  function fitScale(natural, available) {
    if (!(natural > 0) || !(available > 0) || natural <= available) return 1;
    return Math.max(${LATEX_MIN_FIT_SCALE}, (available / natural) * ${LATEX_FIT_MARGIN});
  }
  function postSize() {
    // 幅は「はみ出したぶんを含む実際の内容幅」を返す。折り返しを止めてある(white-space:nowrap)ので、
    // #targetはビューポートより狭くても広くても内容幅そのものになり、scrollWidthで正しく取れる。
    // document.body.scrollWidth を混ぜてはいけない。bodyはビューポート全幅なので、数式が短いときに
    // 常にビューポート幅を返してしまい、fitContentの幅が永久に縮まらなくなる。
    var target = document.getElementById("target");
    var width = Math.max(target.scrollWidth, target.getBoundingClientRect().width);
    // 高さも同じくbodyだけを見ない。KaTeXのインライン描画（displayMode:false）は分数の分子や
    // 根号の上線が行ボックスの外へはみ出すことがあり、body.scrollHeightだけだとそのぶん足りず、
    // WebViewの高さを実測値ちょうどに合わせている都合で数式の上が欠ける。実際の内容高さと
    // 突き合わせたうえで、小数点以下の切り捨てぶんを1px足す。
    var height = Math.max(document.body.scrollHeight, target.scrollHeight, target.getBoundingClientRect().height);
    window.ReactNativeWebView.postMessage(JSON.stringify({ height: Math.ceil(height) + 1, width: Math.ceil(width) + 1 }));
  }
  function renderLatex(payload) {
    lastPayload = payload;
    var target = document.getElementById("target");
    target.style.color = payload.color;
    target.style.fontSize = payload.fontSize + "px";
    if (payload.mathsfFamily) target.style.setProperty("--mathsf-family", payload.mathsfFamily);
    else target.style.removeProperty("--mathsf-family");
    if (payload.mathsfWeight) target.style.setProperty("--mathsf-weight", payload.mathsfWeight);
    else target.style.removeProperty("--mathsf-weight");
    try {
      katex.render(payload.latex, target, { throwOnError: false, displayMode: payload.displayMode });
    } catch (e) {
      target.textContent = payload.latex;
    }
    // **分数は分子のインクが要素の枠より上へ出る。** html/body は overflow:hidden で、#target は
    // body の一番上にあるので、その分だけ分子の上が切れる（実機で「分子の数字の上が切れる」と
    // 報告された。22px の分数で実測2px、フォントを上げると 0.083em → 0.167em まで増える）。
    // **この「上へのはみ出し」はどの測定にも現れない**——scrollHeight は下と右へのはみ出ししか
    // 数えず、getBoundingClientRect で子孫を総なめしても KaTeX が top:-Xem で積む内部 span を
    // 拾ってしまい実際の描画範囲とはまるで違う値になる（実際に踏んだ）。なので測るのではなく、
    // **分数のときだけ上に余地を作る**。0.2em は実測の最大 0.167em に対する余裕分で、
    // 12〜48px のどの大きさでも収まることを確認済み。
    // 条件を .frac-line（KaTeXが分数の横棒に付けるクラス）に絞るのは、1段の形（√・π・10ⁿ）は
    // 枠に収まっていて余地が要らず、入れるとそのぶん結果カードが縦に伸びるため。
    target.style.paddingTop = target.querySelector(".frac-line") ? "0.2em" : "0px";
    // **枠より広い式は縮め、それでも収まらなければ横スクロールにする**（以前は html/body の
    // overflow:hidden で右端が黙って切れていた）。KaTeX の寸法はすべて em なので、文字サイズを
    // 掛け直せば分数・根号ごと比例して縮む。fitContent（電卓の結果）は幅を測って枠の方を
    // 合わせる側なので対象外。
    if (!FIT_CONTENT) {
      var scale = fitScale(target.scrollWidth, target.clientWidth);
      if (scale < 1) target.style.fontSize = payload.fontSize * scale + "px";
    }
    postSize();
  }
  renderLatex(${encodeLatexPayload(payload)});
  // KaTeX のフォントは CSS の中の base64 から非同期に読まれ、読み終わると字幅が変わる。
  // 最初の描画はフォールバックの字幅で測っているので、読み終わりで縮小率と大きさを測り直す。
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { if (lastPayload) renderLatex(lastPayload); });
  }
  // 画面の回転などで枠の幅が変わったら、縮小率を測り直す。高さだけの変化（postSize を受けて
  // RN 側が WebView の高さを合わせたとき）では描き直さない——毎回描き直すと resize と
  // postSize が互いを呼び合う。
  var lastWidth = window.innerWidth;
  window.addEventListener("resize", function () {
    if (lastPayload && window.innerWidth !== lastWidth) {
      lastWidth = window.innerWidth;
      renderLatex(lastPayload);
    } else {
      postSize();
    }
  });
</script>
</body></html>`;
}

