import { useEffect, useRef, useState, type ComponentRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { KATEX_CSS, KATEX_JS } from "@/lib/katex-assets.generated";
import { sanitizeCssFontFamily, sanitizeCssFontWeight } from "@/lib/latex-mathsf-font";

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
   * （KaTeX_SansSerif・400）のまま。**`.katex` 自体のフォントは変えない**——全グリフの
   * 字幅が変わってKaTeXの寸法計算（分数の横棒・根号の伸縮）が崩れるため。
   */
  mathsfFontFamily?: string;
  mathsfFontWeight?: string | number;
};

type Payload = {
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
function encodePayload(payload: Payload): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

function buildHtml(payload: Payload, fitContent: boolean): string {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>${KATEX_CSS}
html,body{margin:0;padding:0;background:transparent;overflow:hidden;}
#target{display:${fitContent ? "inline-flex" : "flex"};align-items:center;justify-content:flex-start;white-space:nowrap;}
.katex{color:inherit;}
/* mathsfのフォントはCSS変数で受ける。HTMLは初回の1回しか組み立てない（下のuseState）ので、
   propが変わっても再読み込みせずrenderLatex側の setProperty だけで差し替えられるようにする。
   セレクタを #target で始めることで .katex .mathsf（詳細度0,2,0）より強くなる。 */
#target .mathsf{font-family:var(--mathsf-family,KaTeX_SansSerif);font-weight:var(--mathsf-weight,400);}
</style></head>
<body><div id="target"></div>
<script>${KATEX_JS}</script>
<script>
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
    postSize();
  }
  renderLatex(${encodePayload(payload)});
  window.addEventListener("resize", postSize);
</script>
</body></html>`;
}

/** ネイティブ（iOS/Android）ではKaTeXをWebView内で描画し、実際の大きさをpostMessageで受け取ってサイズを合わせる。 */
export function LatexView({
  latex,
  color,
  fontSize = 16,
  displayMode = true,
  fitContent = false,
  mathsfFontFamily,
  mathsfFontWeight,
}: Props) {
  const mathsfFamily = sanitizeCssFontFamily(mathsfFontFamily) ?? "";
  const mathsfWeight = sanitizeCssFontWeight(mathsfFontWeight) ?? "";
  const [height, setHeight] = useState(fontSize * 1.6);
  const [width, setWidth] = useState<number | null>(null);
  // WebViewの型は class WebView<P = undefined> extends Component<WebViewProps & P> という宣言で、
  // P=undefined のままだと props が never に潰れて ref を渡した瞬間に型が合わなくなる。
  // ComponentRef 経由でインスタンス型を取ると解決する。
  const webViewRef = useRef<ComponentRef<typeof WebView>>(null);
  const isLoadedRef = useRef(false);

  const payload: Payload = { latex, color, fontSize, displayMode, mathsfFamily, mathsfWeight };

  // 読み込むHTMLは初回の1回だけ組み立てて固定する（初期値関数で作るuseStateは初回しか評価されない）。
  // sourceを差し替えるとWebViewごと再読み込みになり、646KBのKaTeXアセット
  // （lib/katex-assets.generated.ts）を毎回読み直すため、電卓の結果のように数式が1文字ごとに
  // 変わる画面では描画が追いつかない。以降の更新はinjectJavaScriptでkatex.renderだけを呼び直す。
  const [html] = useState(() => buildHtml(payload, fitContent));

  useEffect(() => {
    if (!isLoadedRef.current) return;
    webViewRef.current?.injectJavaScript(
      `renderLatex(${encodePayload({ latex, color, fontSize, displayMode, mathsfFamily, mathsfWeight })});true;`,
    );
  }, [color, displayMode, fontSize, latex, mathsfFamily, mathsfWeight]);

  // 実測できるまでは全幅で描く。最初から幅0/1pxにするとWebView内の描画幅がそれに合わせて潰れてしまい、
  // 測り直しても正しい幅にならない。
  const fitStyle = { alignSelf: "flex-start", width: width ?? "100%" } as const;

  return (
    <View style={[styles.container, fitContent ? fitStyle : styles.fullWidth, { height }]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        originWhitelist={["*"]}
        // 読み込み完了前にlatexが変わっているとinjectJavaScriptが空振りするので、
        // 完了時に現在の値でもう一度描き直す（同じ内容なら再描画されるだけで害はない）。
        onLoadEnd={() => {
          isLoadedRef.current = true;
          webViewRef.current?.injectJavaScript(
            `renderLatex(${encodePayload({ latex, color, fontSize, displayMode, mathsfFamily, mathsfWeight })});true;`,
          );
        }}
        onMessage={(event) => {
          try {
            const parsed = JSON.parse(event.nativeEvent.data) as { height?: number; width?: number };
            if (Number.isFinite(parsed.height) && (parsed.height ?? 0) > 0) setHeight(parsed.height as number);
            if (Number.isFinite(parsed.width) && (parsed.width ?? 0) > 0) setWidth(parsed.width as number);
          } catch {
            // 想定外の形式は無視する（サイズは直前の値のままで描画は続く）。
          }
        }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  fullWidth: { width: "100%" },
  webview: { backgroundColor: "transparent" },
});
