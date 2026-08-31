// KaTeXのJS・CSS・フォントを1つのTSファイルへ埋め込み、オフラインでもLaTeX組版を
// WebView（ネイティブ）やDOM（Web）に表示できるようにする。katexパッケージ更新時は再実行する。
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const katexDist = path.resolve(__dirname, "../node_modules/katex/dist");
const fontsDir = path.join(katexDist, "fonts");
const outFile = path.resolve(__dirname, "../lib/katex-assets.generated.ts");

const js = readFileSync(path.join(katexDist, "katex.min.js"), "utf8");
let css = readFileSync(path.join(katexDist, "katex.min.css"), "utf8");

const fontFiles = readdirSync(fontsDir).filter((name) => name.endsWith(".woff2"));
for (const fileName of fontFiles) {
  const base64 = readFileSync(path.join(fontsDir, fileName)).toString("base64");
  const dataUri = `data:font/woff2;base64,${base64}`;
  const pattern = new RegExp(
    `src:url\\(fonts/${fileName.replace(".woff2", "")}\\.woff2\\) format\\("woff2"\\),url\\(fonts/${fileName.replace(".woff2", "")}\\.woff\\) format\\("woff"\\),url\\(fonts/${fileName.replace(".woff2", "")}\\.ttf\\) format\\("truetype"\\)`,
  );
  const replaced = css.replace(pattern, `src:url(${dataUri}) format("woff2")`);
  if (replaced === css) throw new Error(`フォント ${fileName} の@font-faceパターンが見つかりませんでした。`);
  css = replaced;
}

const header = "// このファイルは scripts/generate-katex-assets.mjs で自動生成されます。手動で編集しないでください。\n";
const content =
  `${header}export const KATEX_JS = ${JSON.stringify(js)};\n\n` +
  `export const KATEX_CSS = ${JSON.stringify(css)};\n`;

writeFileSync(outFile, content, "utf8");
console.log(`katex assets embedded: ${outFile} (${(content.length / 1024).toFixed(0)} KB)`);
