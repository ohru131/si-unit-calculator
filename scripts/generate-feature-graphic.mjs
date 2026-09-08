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
const CHROMIUM_PATH = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

const WIDTH = 1024;
const HEIGHT = 500;
// Play はデバイスによって左右を切り落とすことがあるので、文字とアイコンは中央 712px の安全域に収める。
const SAFE_WIDTH = 712;

// プリセット計算ノートの件数。lib/notebook-formulas から実測した値を渡す
// （掲載文と食い違わないよう、数字はここ1箇所だけに置く。docs/store-listing-copy.md と同じ値）。
const NOTEBOOK_COUNT = 194;

// 短い説明と同じ実例。抽象的な約束より実物1つの方が効く（docs/store-listing-copy.md と同じ値で、
// tests/sample-calculations.test.ts が実エンジンで 1kΩ × 1mA = 1V を検証している）。
const EXAMPLE = "1kΩ × 1mA ⇒ 1V";

// 見出し（title）はアプリ名 "UnitCalc"（lib/global-settings.tsx の `calculator`・app.config.ts の
// appName と同じ）。**固有名詞なので言語ごとに訳さない。**
// headline はその言語のターゲットに効く一言、sub は「件数＋誰向けか」。
// **訳文ではない。** 独語は Einheitenfehler と Klausur、西語は EBAU の採点基準の言い回し、
// 葡語は ENEM と NR-10、日本語は電験・電工、英語は FE と City & Guilds、仏語は各段階で単位を保つ話。
const LOCALES = {
  en: {
    title: "UnitCalc",
    headline: "Just type the units. Prefixes and conversions are automatic.",
    sub: `${NOTEBOOK_COUNT} formula notebooks · FE & City & Guilds`,
  },
  ja: {
    cjk: true,
    title: "UnitCalc",
    headline: "桁合わせや単位換算は、すべて自動。",
    sub: `${NOTEBOOK_COUNT}件の計算ノート・電験／電工の検算に`,
  },
  es: {
    title: "UnitCalc",
    headline: "Prefijos y conversiones, automáticos.",
    sub: `${NOTEBOOK_COUNT} cuadernos de fórmulas · EBAU y FP`,
  },
  "pt-BR": {
    title: "UnitCalc",
    headline: "Prefixos e conversões, automáticos.",
    sub: `${NOTEBOOK_COUNT} cadernos de fórmulas · ENEM e NR-10`,
  },
  de: {
    title: "UnitCalc",
    headline: "Vorsatzzeichen und Umrechnen: automatisch.",
    sub: `${NOTEBOOK_COUNT} Rechenhefte · Ausbildung & Prüfung`,
  },
  fr: {
    title: "UnitCalc",
    headline: "Préfixes et conversions, automatiques.",
    sub: `${NOTEBOOK_COUNT} carnets de formules · lycée, prépa, BTS`,
  },
};

const escapeHtml = (text) => text.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

function buildHtml(locale, iconDataUri) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; }
  body {
    /* アプリのテーマ色（theme.config.js の primaryStrong → primary）。 */
    background: linear-gradient(135deg, #0E4964 0%, #146C94 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: "Noto Sans", "Noto Sans CJK JP", "DejaVu Sans", system-ui, sans-serif;
    color: #FFFFFF;
    -webkit-font-smoothing: antialiased;
  }
  .safe { width: ${SAFE_WIDTH}px; display: flex; align-items: center; gap: 40px; }
  .icon { width: 176px; height: 176px; border-radius: 38px; flex: none; box-shadow: 0 10px 30px rgba(0,0,0,0.28); }
  .copy { flex: 1; min-width: 0; }
  /* タイトルは全言語 "UnitCalc" なので折り返さないが、行間の指定は残す
     （副題を入れる形に戻した場合に2行でも収まるようにしておくため）。 */
  .title { font-size: 46px; font-weight: 800; line-height: 1.1; letter-spacing: -0.5px; }
  .headline { font-size: 24px; font-weight: 700; line-height: 1.35; margin-top: 18px; color: #C9E7F4; }
  /* この環境の CJK フォントは IPAGothic（ボールド無し）しかなく、font-weight を上げても
     太くならないので、縁取りで太字相当にする。ラテン文字には既に実ボールドが当たるので
     掛けない（二重に太くなる）。Android 実機で撮り直すときは Noto Sans CJK に実ボールドが
     あるため、この補正は不要になる。 */
  body.cjk .title { -webkit-text-stroke: 1.1px currentColor; }
  /* 和文は字面が大きく行間が詰まって見えるので、見出しだけ少し小さくして余白を足す。 */
  body.cjk .headline { -webkit-text-stroke: 0.4px currentColor; font-size: 22px; margin-top: 22px; }
  /* 実例だけは等幅にして「これが入力そのもの」と分かるようにする（アプリの入力欄と同じ見え方）。 */
  .example { font-family: "DejaVu Sans Mono", monospace; font-size: 22px; font-weight: 700; margin-top: 14px; color: #FFFFFF; }
  .sub { font-size: 17px; font-weight: 600; line-height: 1.3; margin-top: 10px; color: #8FC6E2; }
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
