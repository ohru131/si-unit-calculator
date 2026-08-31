import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { KATEX_CSS, KATEX_JS } from "@/lib/katex-assets.generated";

type Props = {
  latex: string;
  color: string;
  fontSize?: number;
  displayMode?: boolean;
};

/** ネイティブ（iOS/Android）ではKaTeXをWebView内で描画し、実際の高さをpostMessageで受け取ってサイズを合わせる。 */
export function LatexView({ latex, color, fontSize = 16, displayMode = true }: Props) {
  const [height, setHeight] = useState(fontSize * 1.6);

  const html = useMemo(() => {
    const escaped = JSON.stringify(latex);
    return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>${KATEX_CSS}
html,body{margin:0;padding:0;background:transparent;overflow:hidden;}
#target{color:${color};font-size:${fontSize}px;display:flex;align-items:center;justify-content:flex-start;}
.katex{color:${color};}
</style></head>
<body><div id="target"></div>
<script>${KATEX_JS}</script>
<script>
  try {
    katex.render(${escaped}, document.getElementById("target"), { throwOnError: false, displayMode: ${displayMode ? "true" : "false"} });
  } catch (e) {
    document.getElementById("target").textContent = ${escaped};
  }
  function postHeight() {
    var h = document.body.scrollHeight;
    window.ReactNativeWebView.postMessage(String(h));
  }
  postHeight();
  window.addEventListener("resize", postHeight);
</script>
</body></html>`;
  }, [color, displayMode, fontSize, latex]);

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        originWhitelist={["*"]}
        onMessage={(event) => {
          const parsed = Number(event.nativeEvent.data);
          if (Number.isFinite(parsed) && parsed > 0) setHeight(parsed);
        }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  webview: { backgroundColor: "transparent" },
});
