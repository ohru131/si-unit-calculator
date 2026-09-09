#!/usr/bin/env node
// Google Play のフィーチャーグラフィック（1024×500）を**言語ごとに**生成する。
//
// なぜ言語ごとなのか: Play の掲載ページは言語ごとに画像を差し替えられる。掲載文だけ言語ごとに
// 書き分けても、一覧に出る絵が英語のままだとその言語のユーザーには「英語のアプリ」に見える。
// 見出しは訳文ではなく、その言語のターゲット層に効く一言に**書き分けて**ある
// （docs/target-users-by-locale-2026-09.md 第1節・第4節）。
//
// 使い方:
//   node scripts/generate-feature-graphic.mjs
//   node scripts/generate-feature-graphic.mjs --lang de,fr
//
// 以前の play-feature-graphic-1024x500.png は英語1枚きりで、しかも**旧アイコン（m²）**と
// **旧件数（112）**のまま凍結されていた（生成スクリプトが残っていなかったため、
// 数字が古くなっても誰も直せなかった）。このスクリプトはアイコンを assets/images/icon.png から、
// 件数を lib/notebook-formulas の実測値から受け取るので、同じ形で腐らない。
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUT_DIR = join(ROOT, "submission-assets", "store");
const ICON = join(ROOT, "assets", "images", "icon.png");
const CHROMIUM_PATH =
  process.env.CHROMIUM_PATH ??
  (existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : existsSync("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe")
      ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
      : "/opt/pw-browsers/chromium");

const WIDTH = 1024;
const HEIGHT = 500;
// Play はデバイスによって左右を切り落とすことがあるので、文字とアイコンは中央 712px の安全域に収める。
const SAFE_WIDTH = 712;

// 短い説明と同じ実例。抽象的な約束より実物1つの方が効く（docs/store-listing-copy.md と同じ値で、
// tests/sample-calculations.test.ts が実エンジンで 1kΩ × 1mA = 1V を検証している）。
const EXAMPLE = "1kΩ × 1mA → 1V";

// 見出し（title）はアプリ名 "UnitCalc"（lib/global-settings.tsx の `calculator`・app.config.ts の
// appName と同じ）。**固有名詞なので言語ごとに訳さない。**
// headline は計算への集中と単位処理の自動化、sub は資格・現場から科学・技術計算までの広がりを訴求。
const LOCALES = {
  en: {
    title: "UnitCalc",
    headline: "Focus on calculations.<br>Leave the units to UnitCalc.",
    sub: "From electrical exams to science & engineering.",
  },
  ja: {
    cjk: true,
    title: "UnitCalc",
    headline: "計算に集中。単位合わせはUnitCalcに。",
    sub: "電工試験から、科学・技術計算まで。",
  },
  es: {
    title: "UnitCalc",
    headline: "Concéntrate en el cálculo.<br>Deja las unidades a UnitCalc.",
    sub: "De exámenes de electricidad al cálculo científico y técnico.",
  },
  "pt-BR": {
    title: "UnitCalc",
    headline: "Foque no cálculo.<br>Deixe as unidades com o UnitCalc.",
    sub: "De provas de elétrica a cálculos científicos e técnicos.",
  },
  de: {
    title: "UnitCalc",
    headline: "Fokus aufs Rechnen.<br>Die Einheiten übernimmt UnitCalc.",
    sub: "Von Elektroprüfungen bis zu Wissenschaft & Technik.",
  },
  fr: {
    title: "UnitCalc",
    headline: "Concentrez-vous sur le calcul.<br>UnitCalc gère les unités.",
    sub: "Des examens d'électricité aux sciences & techniques.",
  },
};

const escapeHtml = (text) =>
  text.replace(/[&"']/g, (ch) => ({ "&": "&amp;", '"': "&quot;", "'": "&#39;" })[ch]);

function buildHtml(locale, iconDataUri) {
  return `<!doctype html><html><head><meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&family=JetBrains+Mono:wght@700&family=Noto+Sans+JP:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; }
  body {
    /* アプリのテーマ色（theme.config.js の primaryStrong → primary）。 */
    background: linear-gradient(135deg, #0E4964 0%, #146C94 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: "Inter", "Noto Sans JP", "Segoe UI", "Yu Gothic UI", system-ui, sans-serif;
    color: #FFFFFF;
    -webkit-font-smoothing: antialiased;
  }
  .safe { width: ${SAFE_WIDTH}px; display: flex; align-items: center; gap: 40px; }
  .icon { width: 176px; height: 176px; border-radius: 38px; flex: none; box-shadow: 0 10px 30px rgba(0,0,0,0.28); }
  .copy { flex: 1; min-width: 0; }
  /* タイトルは全言語 "UnitCalc" なので折り返さないが、行間の指定は残す */
  .title { font-size: 46px; font-weight: 800; line-height: 1.1; letter-spacing: -0.5px; }
  .headline { font-size: 24px; font-weight: 700; line-height: 1.35; margin-top: 18px; color: #C9E7F4; }
  body.cjk .headline { font-size: 23px; margin-top: 18px; letter-spacing: 0.2px; }
  /* 実例は等幅フォントで数式を美しく表示 */
  .example {
    font-family: "JetBrains Mono", "Consolas", "Roboto Mono", monospace;
    font-size: 23px;
    font-weight: 700;
    margin-top: 14px;
    color: #FFFFFF;
    letter-spacing: 0.5px;
  }
  .sub { font-size: 17px; font-weight: 600; line-height: 1.35; margin-top: 12px; color: #8FC6E2; }
</style></head><body class="${locale.cjk ? "cjk" : ""}">
  <div class="safe">
    <img class="icon" src="${iconDataUri}" alt="">
    <div class="copy">
      <div class="title">${escapeHtml(locale.title)}</div>
      <div class="headline">${escapeHtml(locale.headline)}</div>
      <div class="example">${escapeHtml(EXAMPLE)}</div>
      <div class="sub">${escapeHtml(locale.sub)}</div>
    </div>
  </div>
</body></html>`;
}

async function main() {
  const langs = process.argv.includes("--lang")
    ? process.argv[process.argv.indexOf("--lang") + 1].split(",")
    : Object.keys(LOCALES);

  mkdirSync(OUT_DIR, { recursive: true });
  const iconDataUri = `data:image/png;base64,${readFileSync(ICON).toString("base64")}`;
  const browser = await chromium.launch({ ...(existsSync(CHROMIUM_PATH) ? { executablePath: CHROMIUM_PATH } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    for (const lang of langs) {
      const locale = LOCALES[lang];
      if (!locale) throw new Error(`未知の言語: ${lang}`);
      await page.setContent(buildHtml(locale, iconDataUri), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const file = join(OUT_DIR, `play-feature-graphic-${lang}-1024x500.png`);
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
      console.log(`  ✓ play-feature-graphic-${lang}-1024x500.png`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
