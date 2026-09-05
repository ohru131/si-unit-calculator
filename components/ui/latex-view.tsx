import { useEffect, useRef, useState, type ComponentRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { KATEX_CSS, KATEX_JS } from "@/lib/katex-assets.generated";

type Props = {
  latex: string;
  color: string;
  fontSize?: number;
  displayMode?: boolean;
  /** 数式の幅ぶんだけ場所を取る。単位ラベルなど、数式の右に何かを並べたいときに使う。 */
  fitContent?: boolean;
};

type Payload = { latex: string; color: string; fontSize: number; displayMode: boolean };

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
    window.ReactNativeWebView.postMessage(JSON.stringify({ height: document.body.scrollHeight, width: Math.ceil(width) + 1 }));
  }
  function renderLatex(payload) {
    var target = document.getElementById("target");
    target.style.color = payload.color;
    target.style.fontSize = payload.fontSize + "px";
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
export function LatexView({ latex, color, fontSize = 16, displayMode = true, fitContent = false }: Props) {
  const [height, setHeight] = useState(fontSize * 1.6);
  const [width, setWidth] = useState<number | null>(null);
  // WebViewの型は class WebView<P = undefined> extends Component<WebViewProps & P> という宣言で、
  // P=undefined のままだと props が never に潰れて ref を渡した瞬間に型が合わなくなる。
  // ComponentRef 経由でインスタンス型を取ると解決する。
  const webViewRef = useRef<ComponentRef<typeof WebView>>(null);
  const isLoadedRef = useRef(false);

  const payload: Payload = { latex, color, fontSize, displayMode };

  // 読み込むHTMLは初回の1回だけ組み立てて固定する（初期値関数で作るuseStateは初回しか評価されない）。
  // sourceを差し替えるとWebViewごと再読み込みになり、646KBのKaTeXアセット
  // （lib/katex-assets.generated.ts）を毎回読み直すため、電卓の結果のように数式が1文字ごとに
  // 変わる画面では描画が追いつかない。以降の更新はinjectJavaScriptでkatex.renderだけを呼び直す。
  const [html] = useState(() => buildHtml(payload, fitContent));

  useEffect(() => {
    if (!isLoadedRef.current) return;
    webViewRef.current?.injectJavaScript(`renderLatex(${encodePayload({ latex, color, fontSize, displayMode })});true;`);
  }, [color, displayMode, fontSize, latex]);

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
          webViewRef.current?.injectJavaScript(`renderLatex(${encodePayload({ latex, color, fontSize, displayMode })});true;`);
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
