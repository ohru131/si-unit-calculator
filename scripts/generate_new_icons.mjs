#!/usr/bin/env node
/**
 * scripts/generate_new_icons.mjs
 * 
 * Android端末の円形マスク対応・ボタン文字なし・LaTeXゴシック数式組版の新アプリアイコン一式を
 * Playwright (Chromium) でベクタークオリティで一括生成するスクリプト。
 * 
 * 改善のポイント:
 * 1. 円形マスク完全適合（セーフゾーン内に電卓を収め、四隅が丸く削られない）
 * 2. ボタンの文字を省き、洗練された立体キーパッドに
 * 3. 「1kΩ × 1mA」を LaTeX ゴシック体 (KaTeX_SansSerif-Bold) で精密組版:
 *    - 1, k, Ω のベースラインと高さを完全整列
 *    - k と Ω、m と A のサイズ比率を黄金調和
 *    - × の前後に LaTeX 的な美しい数学的対称マージン
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const CHROMIUM_PATH =
  process.env.CHROMIUM_PATH ??
  (existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : existsSync("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe")
      ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
      : undefined);

// KaTeX フォント読み込み
const fontsDir = join(ROOT, "node_modules", "katex", "dist", "fonts");
const sansBoldB64 = readFileSync(join(fontsDir, "KaTeX_SansSerif-Bold.woff2")).toString("base64");
const mainBoldB64 = readFileSync(join(fontsDir, "KaTeX_Main-Bold.woff2")).toString("base64");

function getCalculatorHtml({
  size = 512,
  includeBackground = true,
  bgColor = "#E6F4FE",
  isMonochrome = false,
}) {
  const scale = size / 512;
  const calcW = Math.round(258 * scale);
  const calcH = Math.round(302 * scale);
  const radius = Math.round(52 * scale);
  const padTop = Math.round(18 * scale);
  const padSides = Math.round(17 * scale);
  const padBottom = Math.round(21 * scale);

  // 液晶ディスプレイ（高さ96px）
  const screenH = Math.round(96 * scale);
  const screenRadius = Math.round(22 * scale);

  // LaTeXゴシック数式フォントサイズ
  const numFontSize = (42.5 * scale).toFixed(1);
  const kFontSize = (40.5 * scale).toFixed(1);
  const omegaFontSize = (42.0 * scale).toFixed(1);
  const timesFontSize = (32.0 * scale).toFixed(1);
  const mFontSize = (37.5 * scale).toFixed(1);
  const aFontSize = (42.0 * scale).toFixed(1);

  // キーパッド
  const keyH = Math.round(34 * scale);
  const keyRadius = Math.round(11 * scale);
  const keyGap = Math.round(8.5 * scale);
  const keypadMarginTop = Math.round(10 * scale);

  if (isMonochrome) {
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'KaTeX_SansSerif_Bold';
    src: url('data:font/woff2;base64,${sansBoldB64}') format('woff2');
    font-weight: bold;
    font-style: normal;
  }
  @font-face {
    font-family: 'KaTeX_Main_Bold';
    src: url('data:font/woff2;base64,${mainBoldB64}') format('woff2');
    font-weight: bold;
    font-style: normal;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${size}px;
    height: ${size}px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .calc {
    width: ${calcW}px;
    height: ${calcH}px;
    background: #000000;
    border: ${Math.max(2, Math.round(5 * scale))}px solid #ffffff;
    border-radius: ${radius}px;
    padding: ${padTop}px ${padSides}px ${padBottom}px ${padSides}px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .screen {
    width: 100%;
    height: ${screenH}px;
    background: #ffffff;
    border-radius: ${screenRadius}px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .formula {
    display: flex;
    align-items: baseline;
    justify-content: center;
    color: #000000;
    white-space: nowrap;
    line-height: 1;
    font-family: 'KaTeX_SansSerif_Bold', sans-serif;
    font-weight: bold;
  }
  .num { font-size: ${numFontSize}px; letter-spacing: -${(0.6 * scale).toFixed(1)}px; }
  .prefix-k { font-size: ${kFontSize}px; margin-left: ${(2.5 * scale).toFixed(1)}px; }
  .unit-omega { font-size: ${omegaFontSize}px; margin-left: ${(1.5 * scale).toFixed(1)}px; }
  .times {
    font-family: 'KaTeX_Main_Bold', sans-serif;
    font-size: ${timesFontSize}px;
    margin: 0 ${(11.5 * scale).toFixed(1)}px;
    transform: translateY(-${(3.5 * scale).toFixed(1)}px);
    display: inline-block;
  }
  .prefix-m { font-size: ${mFontSize}px; margin-left: ${(2.5 * scale).toFixed(1)}px; }
  .unit-a { font-size: ${aFontSize}px; margin-left: ${(1.2 * scale).toFixed(1)}px; }

  .keypad {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: ${keyGap}px;
    width: 100%;
    margin-top: ${keypadMarginTop}px;
  }
  .key { height: ${keyH}px; border-radius: ${keyRadius}px; background: #ffffff; }
  .key.op { background: #888888; }
</style>
</head>
<body>
  <div class="calc">
    <div class="screen">
      <div class="formula">
        <span class="num">1</span><span class="prefix-k">k</span><span class="unit-omega">Ω</span>
        <span class="times">×</span>
        <span class="num">1</span><span class="prefix-m">m</span><span class="unit-a">A</span>
      </div>
    </div>
    <div class="keypad">
      <div class="key"></div><div class="key"></div><div class="key"></div><div class="key op"></div>
      <div class="key"></div><div class="key"></div><div class="key"></div><div class="key op"></div>
      <div class="key"></div><div class="key"></div><div class="key"></div><div class="key op"></div>
      <div class="key"></div><div class="key"></div><div class="key"></div><div class="key op"></div>
    </div>
  </div>
</body>
</html>`;
  }

  const bgStyle = includeBackground ? `background: ${bgColor};` : "background: transparent;";

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'KaTeX_SansSerif_Bold';
    src: url('data:font/woff2;base64,${sansBoldB64}') format('woff2');
    font-weight: bold;
    font-style: normal;
  }
  @font-face {
    font-family: 'KaTeX_Main_Bold';
    src: url('data:font/woff2;base64,${mainBoldB64}') format('woff2');
    font-weight: bold;
    font-style: normal;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${size}px;
    height: ${size}px;
    ${bgStyle}
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  /* 電卓本体 */
  .calc {
    width: ${calcW}px;
    height: ${calcH}px;
    background: linear-gradient(168deg, #50a6eb 0%, #2578c4 52%, #165ca0 100%);
    border-radius: ${radius}px;
    padding: ${padTop}px ${padSides}px ${padBottom}px ${padSides}px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow:
      0 ${Math.round(18 * scale)}px ${Math.round(40 * scale)}px -${Math.round(3 * scale)}px rgba(10, 42, 80, 0.44),
      0 ${Math.round(8 * scale)}px ${Math.round(16 * scale)}px -${Math.round(2 * scale)}px rgba(10, 42, 80, 0.28),
      inset 0 ${Math.round(2.6 * scale)}px ${Math.round(3.5 * scale)}px rgba(255, 255, 255, 0.75),
      inset 0 -${Math.round(4 * scale)}px ${Math.round(5 * scale)}px rgba(8, 32, 65, 0.4);
    position: relative;
  }

  /* ディスプレイ（液晶画面） */
  .screen {
    width: 100%;
    height: ${screenH}px;
    background: linear-gradient(180deg, #f6faff 0%, #ffffff 55%, #ecf4fc 100%);
    border-radius: ${screenRadius}px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 ${Math.round(10 * scale)}px;
    box-shadow:
      inset 0 ${Math.round(4 * scale)}px ${Math.round(7 * scale)}px rgba(12, 45, 80, 0.25),
      0 ${Math.round(2 * scale)}px ${Math.round(2.5 * scale)}px rgba(255, 255, 255, 0.65);
    border: ${Math.max(1, Math.round(2 * scale))}px solid rgba(255, 255, 255, 0.9);
  }

  /* LaTeXゴシック数式精密組版 */
  .formula {
    display: flex;
    align-items: baseline;
    justify-content: center;
    color: #0b1f36;
    white-space: nowrap;
    line-height: 1;
    font-family: 'KaTeX_SansSerif_Bold', sans-serif;
    font-weight: bold;
  }

  .num {
    font-size: ${numFontSize}px;
    letter-spacing: -${(0.6 * scale).toFixed(1)}px;
  }

  .prefix-k {
    font-size: ${kFontSize}px;
    margin-left: ${(2.5 * scale).toFixed(1)}px;
  }

  .unit-omega {
    font-size: ${omegaFontSize}px;
    margin-left: ${(1.5 * scale).toFixed(1)}px;
  }

  .times {
    font-family: 'KaTeX_Main_Bold', sans-serif;
    font-size: ${timesFontSize}px;
    margin: 0 ${(11.5 * scale).toFixed(1)}px;
    color: #1771b7;
    transform: translateY(-${(3.5 * scale).toFixed(1)}px);
    display: inline-block;
  }

  .prefix-m {
    font-size: ${mFontSize}px;
    margin-left: ${(2.5 * scale).toFixed(1)}px;
  }

  .unit-a {
    font-size: ${aFontSize}px;
    margin-left: ${(1.2 * scale).toFixed(1)}px;
  }

  /* キーパッド グリッド */
  .keypad {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: ${keyGap}px;
    width: 100%;
    margin-top: ${keypadMarginTop}px;
  }

  /* ボタン共通（文字なし・美しい立体感） */
  .key {
    height: ${keyH}px;
    border-radius: ${keyRadius}px;
    position: relative;
  }

  /* 数字キー（白〜オフホワイト） */
  .key.num {
    background: linear-gradient(180deg, #ffffff 0%, #edf4fa 100%);
    box-shadow:
      0 ${Math.round(3 * scale)}px ${Math.round(5 * scale)}px -${Math.round(0.5 * scale)}px rgba(8, 35, 65, 0.22),
      inset 0 ${Math.round(1.5 * scale)}px ${Math.round(2 * scale)}px rgba(255, 255, 255, 0.98),
      inset 0 -${Math.round(2.2 * scale)}px 0 rgba(182, 205, 228, 0.8);
  }

  /* 演算子キー（淡いブルー） */
  .key.op {
    background: linear-gradient(180deg, #bfe2fd 0%, #91cef9 100%);
    box-shadow:
      0 ${Math.round(3 * scale)}px ${Math.round(5 * scale)}px -${Math.round(0.5 * scale)}px rgba(8, 35, 65, 0.25),
      inset 0 ${Math.round(1.5 * scale)}px ${Math.round(2 * scale)}px rgba(255, 255, 255, 0.95),
      inset 0 -${Math.round(2.2 * scale)}px 0 rgba(105, 172, 228, 0.85);
  }

  /* 最下段右（イコールキー） */
  .key.op.equal {
    background: linear-gradient(180deg, #a4d6fc 0%, #76bdf5 100%);
  }
</style>
</head>
<body>
  <div class="calc">
    <div class="screen">
      <div class="formula">
        <span class="num">1</span><span class="prefix-k">k</span><span class="unit-omega">Ω</span>
        <span class="times">×</span>
        <span class="num">1</span><span class="prefix-m">m</span><span class="unit-a">A</span>
      </div>
    </div>
    <div class="keypad">
      <div class="key num"></div>
      <div class="key num"></div>
      <div class="key num"></div>
      <div class="key op"></div>
      <div class="key num"></div>
      <div class="key num"></div>
      <div class="key num"></div>
      <div class="key op"></div>
      <div class="key num"></div>
      <div class="key num"></div>
      <div class="key num"></div>
      <div class="key op"></div>
      <div class="key num"></div>
      <div class="key num"></div>
      <div class="key num"></div>
      <div class="key op equal"></div>
    </div>
  </div>
</body>
</html>
`;
}

async function main() {
  console.log("Starting LaTeX Gothic Icon Asset Generation...");

  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1024, height: 1024 },
    deviceScaleFactor: 1,
  });

  // 1. assets/images/icon.png (1024x1024, #E6F4FE 背景つきマスター)
  console.log("Generating assets/images/icon.png (1024x1024)...");
  await page.setViewportSize({ width: 1024, height: 1024 });
  await page.setContent(getCalculatorHtml({ size: 1024, includeBackground: true, bgColor: "#E6F4FE" }), { waitUntil: "networkidle" });
  const iconBuffer = await page.screenshot({ type: "png" });
  writeFileSync(join(ROOT, "assets", "images", "icon.png"), iconBuffer);

  // 2. assets/images/android-icon-foreground.png (512x512, 透過背景)
  console.log("Generating assets/images/android-icon-foreground.png (512x512, transparent)...");
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(getCalculatorHtml({ size: 512, includeBackground: false }), { waitUntil: "networkidle" });
  const fgBuffer = await page.screenshot({ type: "png", omitBackground: true });
  writeFileSync(join(ROOT, "assets", "images", "android-icon-foreground.png"), fgBuffer);

  // 3. assets/images/android-icon-background.png (512x512, #E6F4FE)
  console.log("Generating assets/images/android-icon-background.png (512x512)...");
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;width:512px;height:512px;background:#E6F4FE;"></body></html>`);
  const bgBuffer = await page.screenshot({ type: "png" });
  writeFileSync(join(ROOT, "assets", "images", "android-icon-background.png"), bgBuffer);

  // 4. assets/images/android-icon-monochrome.png (432x432, モノクロ)
  console.log("Generating assets/images/android-icon-monochrome.png (432x432, monochrome)...");
  await page.setViewportSize({ width: 432, height: 432 });
  await page.setContent(getCalculatorHtml({ size: 432, isMonochrome: true }), { waitUntil: "networkidle" });
  const monoBuffer = await page.screenshot({ type: "png", omitBackground: true });
  writeFileSync(join(ROOT, "assets", "images", "android-icon-monochrome.png"), monoBuffer);

  // 5. assets/images/splash-icon.png (512x512, 透過スプラッシュ電卓)
  console.log("Generating assets/images/splash-icon.png (512x512)...");
  writeFileSync(join(ROOT, "assets", "images", "splash-icon.png"), fgBuffer);

  // 6. assets/images/favicon.png (512x512, #E6F4FE 背景つき)
  console.log("Generating assets/images/favicon.png (512x512)...");
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(getCalculatorHtml({ size: 512, includeBackground: true, bgColor: "#E6F4FE" }), { waitUntil: "networkidle" });
  const favBuffer = await page.screenshot({ type: "png" });
  writeFileSync(join(ROOT, "assets", "images", "favicon.png"), favBuffer);

  // 7. submission-assets/store/play-store-icon-512.png (512x512)
  console.log("Generating submission-assets/store/play-store-icon-512.png (512x512)...");
  const storeDir = join(ROOT, "submission-assets", "store");
  if (!existsSync(storeDir)) mkdirSync(storeDir, { recursive: true });
  writeFileSync(join(storeDir, "play-store-icon-512.png"), favBuffer);

  // 8. Android ネイティブ mipmap の更新（存在する場合）
  const resDir = join(ROOT, "android", "app", "src", "main", "res");
  if (existsSync(resDir)) {
    console.log("Updating Android native mipmap webp files...");
    const densities = [
      { dir: "mipmap-mdpi", launcherSize: 48, fgSize: 108 },
      { dir: "mipmap-hdpi", launcherSize: 72, fgSize: 162 },
      { dir: "mipmap-xhdpi", launcherSize: 96, fgSize: 216 },
      { dir: "mipmap-xxhdpi", launcherSize: 144, fgSize: 324 },
      { dir: "mipmap-xxxhdpi", launcherSize: 192, fgSize: 432 },
    ];

    for (const d of densities) {
      const targetDir = join(resDir, d.dir);
      if (!existsSync(targetDir)) continue;

      // ic_launcher.webp & ic_launcher_round.webp
      await page.setViewportSize({ width: d.launcherSize, height: d.launcherSize });
      await page.setContent(getCalculatorHtml({ size: d.launcherSize, includeBackground: true, bgColor: "#E6F4FE" }), { waitUntil: "networkidle" });
      const launcherWebp = await page.screenshot({ type: "webp", quality: 95 });
      writeFileSync(join(targetDir, "ic_launcher.webp"), launcherWebp);
      writeFileSync(join(targetDir, "ic_launcher_round.webp"), launcherWebp);

      // ic_launcher_foreground.webp
      await page.setViewportSize({ width: d.fgSize, height: d.fgSize });
      await page.setContent(getCalculatorHtml({ size: d.fgSize, includeBackground: false }), { waitUntil: "networkidle" });
      const fgWebp = await page.screenshot({ type: "webp", omitBackground: true, quality: 95 });
      writeFileSync(join(targetDir, "ic_launcher_foreground.webp"), fgWebp);

      // ic_launcher_background.webp
      await page.setContent(`<!DOCTYPE html><html><body style="margin:0;width:${d.fgSize}px;height:${d.fgSize}px;background:#E6F4FE;"></body></html>`);
      const bgWebp = await page.screenshot({ type: "webp", quality: 95 });
      writeFileSync(join(targetDir, "ic_launcher_background.webp"), bgWebp);

      // ic_launcher_monochrome.webp
      await page.setContent(getCalculatorHtml({ size: d.fgSize, isMonochrome: true }), { waitUntil: "networkidle" });
      const monoWebp = await page.screenshot({ type: "webp", omitBackground: true, quality: 95 });
      writeFileSync(join(targetDir, "ic_launcher_monochrome.webp"), monoWebp);
    }
  }

  await browser.close();
  console.log("All app icon assets generated successfully with LaTeX Gothic typography!");
}

main().catch(console.error);
