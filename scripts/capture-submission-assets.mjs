#!/usr/bin/env node
// ストア掲載用スクリーンショットを Web 版（`npx expo export --platform web` の出力）から自動撮影する。
//
// なぜ Web 版なのか: この環境には Android 実機もエミュレータも無い。素材はあくまで暫定
// （provisional）で、提出前に Android 実機で撮り直す前提（submission-assets/README.md を参照）。
//
// 使い方:
//   npx expo export --platform web        # dist/ を作る（このスクリプトは dist/ を作らない）
//   node scripts/capture-submission-assets.mjs
//   node scripts/capture-submission-assets.mjs --lang ja --only 10-exact-fraction,11-exact-pi
//   node scripts/capture-submission-assets.mjs --headed   # 目視デバッグ用
//
// フェーズ2（デモ動画）から再利用できるよう、サーバ起動とブラウザ準備は
// startDistServer() / withAppPage() として export してある。
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIST = join(ROOT, "dist");
const OUT_DIR = join(ROOT, "submission-assets", "screenshots");

// 既存素材と同じ 1080×1800px。CSS 側は 540×900 で、deviceScaleFactor 2 で 2 倍に伸ばす
// （既存の en-01-calc-basic.png と同じ文字サイズ・同じ折り返しになる組み合わせ）。
const VIEWPORT = { width: 540, height: 900 };
const SCALE = 2;

// この環境の Chromium は /opt/pw-browsers/chromium（symlink）に置かれていて、
// playwright パッケージが期待するリビジョンとは番号が違う。symlink があればそれを使う。
const CHROMIUM_PATH = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
};

// expo-router の静的書き出しは `/pro` を `pro.html` として出す。拡張子なしのパスを
// そのまま返すと 404 画面になるので、`.html` へフォールバックさせる。
export function startDistServer(root = DIST) {
  if (!existsSync(root)) {
    throw new Error(`dist が見つかりません: ${root}\n先に \`npx expo export --platform web\` を実行してください。`);
  }
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const candidates = [pathname, `${pathname}.html`, join(pathname, "index.html")];
    for (const candidate of candidates) {
      const filePath = join(root, candidate);
      if (!filePath.startsWith(root)) continue;
      if (!existsSync(filePath) || !statSync(filePath).isFile()) continue;
      res.writeHead(200, { "content-type": MIME[extname(filePath)] ?? "application/octet-stream" });
      createReadStream(filePath).pipe(res);
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  });
  return new Promise((resolvePromise) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolvePromise({ origin: `http://127.0.0.1:${port}`, close: () => new Promise((done) => server.close(done)) });
    });
  });
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

// ---------------------------------------------------------------- 画面操作の共通部品

const LABELS = {
  en: {
    expression: "Expression",
    result: "Result",
    compareUnits: "Compare units",
    decimalForm: "Decimal",
    exactForm: "Exact",
    languageOption: "English",
    deviceLocale: "en-US",
    languageSection: "App language",
    tabs: { calculator: "Unit Calculator", notebook: "Notebooks", library: "Library", settings: "Preferences" },
    search: "Search all notebooks",
    searchQuery: "solar",
    // Web 版だけに出る注記（Android 実機では出ない）。撮影前に要素ごと消す。
    webOnlyNotes: ["This is a web preview", "Purchases are available in the iOS or Android store version."],
  },
  ja: {
    expression: "式",
    result: "結果",
    compareUnits: "単位を比較",
    decimalForm: "小数",
    exactForm: "分数・π",
    languageOption: "日本語",
    deviceLocale: "ja-JP",
    languageSection: "アプリの言語",
    tabs: { calculator: "単位付き電卓", notebook: "ノート", library: "ライブラリ", settings: "設定" },
    search: "すべての計算ノートを検索",
    searchQuery: "太陽光",
    webOnlyNotes: ["現在はWebプレビューです", "購入はiOSまたはAndroidのストア版で利用できます。"],
  },
};

async function dismissOnboarding(page) {
  // 初回起動のオンボーディングは Modal で全面を覆う。Skip を押して閉じる。
  const skip = page.getByText(/^(Skip|スキップ|Omitir|Pular|Überspringen|Passer)$/).first();
  try {
    await skip.waitFor({ state: "visible", timeout: 8000 });
    await skip.click();
  } catch {
    // 2 回目以降のコンテキストでは既に閉じている
  }
  await sleep(400);
}

async function openTab(page, label) {
  await page.getByText(label, { exact: true }).last().click();
  await sleep(700);
}

// 設定画面の「言語」セクションを開く。折りたたみなので、開かないと選択肢が出ない。
async function openLanguageSection(page, lang) {
  const titles = [LABELS.en.languageSection, LABELS[lang].languageSection];
  await page.getByText(new RegExp(`^(${titles.join("|")})$`)).first().click();
  await sleep(500);
}

async function setLanguage(page, lang) {
  // ブラウザのロケールで既にその言語になっていることもあるが、resolveDeviceLanguage 任せに
  // せず必ずアプリ内の設定画面から明示的に選ぶ（撮影言語を取り違えないため）。
  await openTab(page, LABELS[lang].tabs.settings);
  await openLanguageSection(page, lang);
  await page.getByRole("radio", { name: new RegExp(`: ${LABELS[lang].languageOption}$`) }).first().click();
  await sleep(1500);
}

async function typeExpression(page, lang, text) {
  const input = page.getByLabel(LABELS[lang].expression).first();
  await input.click();
  await input.fill("");
  await input.fill(text);
  await sleep(500);
}

async function submitExpression(page, lang) {
  await page.getByLabel(LABELS[lang].result).first().click();
  await sleep(700);
}

// フォーカスリング（黒枠）とキャレットは実機の見え方ではないので撮影前に外す。
async function blurInputs(page) {
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await sleep(250);
}

async function hideWebOnlyNotice(page, lang) {
  // Web では isNativePurchaseAvailable が false のため「Web プレビュー」の赤い注記が出る。
  // Android 実機では最初から出ないので、要素ごと消した方が実機に忠実になる。
  await page.evaluate((needles) => {
    for (const el of document.querySelectorAll("div,span,p")) {
      if (el.children.length !== 0) continue;
      if (needles.some((needle) => el.textContent?.includes(needle))) el.style.display = "none";
    }
  }, LABELS[lang].webOnlyNotes);
  await sleep(150);
}

// 結果カードは上部のスクロール領域に入っていて、下はキーパッドが固定で覆っている。
// 比較表のように背の高いカードは、少しスクロールしないと最終行が切れて見える。
async function scrollCardArea(page, dy) {
  await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height * 0.3);
  await page.mouse.wheel(0, dy);
  await sleep(500);
}

async function shoot(page, lang, name) {
  const file = join(OUT_DIR, `${lang}-${name}.png`);
  await page.screenshot({ path: file });
  console.log(`  ✓ ${lang}-${name}.png`);
}

// ---------------------------------------------------------------- カット定義

const SHOTS = [
  {
    name: "01-calc-basic",
    run: async (page, lang) => {
      await openTab(page, LABELS[lang].tabs.calculator);
      await typeExpression(page, lang, "5cm + 1mm");
      await submitExpression(page, lang);
      await blurInputs(page);
      // 既定の表示単位は空（SI）なので `0.051 m` になる。結果カードの単位チップで cm に
      // 切り替え、「単位チップ 1 タップで読みたい単位に変わる」ことが分かる構図にする。
      // exact 必須。単位挿入レールのチップは aria-label が「cm センチメートル」で、
      // 部分一致だと（メートル法既定の端末では先頭に cm が来るので）そちらを押して
      // 式が「cm5cm + 1mm」になる。結果カードのチップは記号そのものがラベル。
      await page.getByLabel("cm", { exact: true }).first().click();
      await sleep(500);
    },
  },
  {
    name: "02-dimension-error",
    run: async (page, lang) => {
      await openTab(page, LABELS[lang].tabs.calculator);
      await typeExpression(page, lang, "5m + 1kg");
      await submitExpression(page, lang);
      await blurInputs(page);
    },
  },
  {
    name: "03-speed",
    run: async (page, lang) => {
      await openTab(page, LABELS[lang].tabs.calculator);
      await typeExpression(page, lang, "100km / 2h");
      await submitExpression(page, lang);
      await blurInputs(page);
    },
  },
  {
    name: "03-compare-units",
    run: async (page, lang) => {
      await openTab(page, LABELS[lang].tabs.calculator);
      await typeExpression(page, lang, "100km / 2h");
      await submitExpression(page, lang);
      await blurInputs(page);
      await page.getByLabel(LABELS[lang].compareUnits).first().click();
      await sleep(600);
      await scrollCardArea(page, 110);
    },
  },
  {
    name: "04-number-base",
    run: async (page, lang) => {
      await openTab(page, LABELS[lang].tabs.calculator);
      await typeExpression(page, lang, "1024 * 3");
      await submitExpression(page, lang);
      await blurInputs(page);
      // 結果カードの表示用チップ（DEC/BIN/OCT/HEX）。押しても入力欄は変わらない。
      await page.getByLabel("HEX", { exact: true }).first().click();
      await sleep(500);
    },
  },
  {
    name: "10-exact-fraction",
    run: async (page, lang) => {
      await openTab(page, LABELS[lang].tabs.calculator);
      await typeExpression(page, lang, "1/3");
      await submitExpression(page, lang);
      await blurInputs(page);
      await page.getByLabel(LABELS[lang].exactForm).first().click();
      await sleep(900); // KaTeX の描画待ち
    },
  },
  {
    name: "11-exact-pi",
    run: async (page, lang) => {
      await openTab(page, LABELS[lang].tabs.calculator);
      await typeExpression(page, lang, "2*pi*50");
      await submitExpression(page, lang);
      await blurInputs(page);
      await page.getByLabel(LABELS[lang].exactForm).first().click();
      await sleep(900);
    },
  },
  {
    name: "12-exact-sqrt",
    run: async (page, lang) => {
      await openTab(page, LABELS[lang].tabs.calculator);
      await typeExpression(page, lang, "sqrt(8)");
      await submitExpression(page, lang);
      await blurInputs(page);
      await page.getByLabel(LABELS[lang].exactForm).first().click();
      await sleep(900);
    },
  },
  {
    name: "05-library-grid",
    run: async (page, lang) => {
      await openTab(page, LABELS[lang].tabs.library);
      await sleep(600);
    },
  },
  {
    name: "13-notebook-search",
    run: async (page, lang) => {
      await openTab(page, LABELS[lang].tabs.library);
      const search = page.getByPlaceholder(LABELS[lang].search).first();
      await search.click();
      await search.fill(LABELS[lang].searchQuery);
      await sleep(800);
      await blurInputs(page);
    },
  },
  {
    name: "06-notebook-list",
    run: async (page, lang, ctx) => {
      await openTab(page, LABELS[lang].tabs.library);
      await page.getByText(ctx.category, { exact: true }).first().click();
      await sleep(600);
      if (ctx.subCategory) {
        await page.getByText(ctx.subCategory, { exact: true }).first().click();
        await sleep(600);
      }
    },
  },
  {
    name: "07-notebooks-tab",
    run: async (page, lang, ctx) => {
      // 「ノート」タブは最後に開いたノートを出す。先にライブラリからノートを開いておく。
      await openTab(page, LABELS[lang].tabs.library);
      await page.getByText(ctx.category, { exact: true }).first().click();
      await sleep(500);
      if (ctx.subCategory) {
        await page.getByText(ctx.subCategory, { exact: true }).first().click();
        await sleep(500);
      }
      await page.getByText(ctx.notebook, { exact: true }).first().click();
      await sleep(1500); // KaTeX（WebView 相当の DOM 描画）待ち
      await openTab(page, LABELS[lang].tabs.notebook);
      await sleep(1800);
    },
  },
  {
    name: "08-settings",
    run: async (page, lang) => {
      // 対応6言語が一目で分かるよう、言語セクションは開いたまま撮る
      //（withAppPage の setLanguage が開いた状態で終わるので、ここで触らない）。
      await openTab(page, LABELS[lang].tabs.settings);
      await sleep(600);
    },
  },
  {
    name: "09-pro",
    run: async (page, lang, ctx) => {
      await page.goto(`${ctx.origin}/pro`);
      await sleep(2500);
      await hideWebOnlyNotice(page, lang);
    },
  },
];

// ノート系カットで開くカテゴリ／ノート（#46 で再編した後の名前）
const NOTEBOOK_TARGETS = {
  en: { category: "High school physics", subCategory: "Mechanics", notebook: "Uniformly accelerated motion (velocity & displacement)" },
  ja: { category: "高校物理", subCategory: "力学", notebook: "等加速度運動（速度・変位）" },
};

// ---------------------------------------------------------------- 実行

function parseArgs(argv) {
  const args = { langs: ["en", "ja"], only: null, headed: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--lang") args.langs = argv[++i].split(",");
    else if (argv[i] === "--only") args.only = new Set(argv[++i].split(","));
    else if (argv[i] === "--headed") args.headed = true;
  }
  return args;
}

export async function withAppPage(origin, browser, lang, fn) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    locale: LABELS[lang].deviceLocale,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(origin);
  await page.waitForLoadState("networkidle").catch(() => {});
  await sleep(2500);
  await dismissOnboarding(page);
  await setLanguage(page, lang);
  try {
    return await fn(page);
  } finally {
    await context.close();
  }
}

async function main() {
  const args = parseArgs(process.argv);
  mkdirSync(OUT_DIR, { recursive: true });
  const server = await startDistServer();
  console.log(`serving dist at ${server.origin}`);
  const browser = await chromium.launch({
    headless: !args.headed,
    ...(existsSync(CHROMIUM_PATH) ? { executablePath: CHROMIUM_PATH } : {}),
  });
  try {
    for (const lang of args.langs) {
      console.log(`\n[${lang}]`);
      const shots = SHOTS.filter((shot) => !args.only || args.only.has(shot.name));
      for (const shot of shots) {
        // カットごとに新しいコンテキストを作る（前のカットの入力・展開状態を持ち越さない）。
        await withAppPage(server.origin, browser, lang, async (page) => {
          const ctx = { origin: server.origin, ...NOTEBOOK_TARGETS[lang] };
          await shot.run(page, lang, ctx);
          await shoot(page, lang, shot.name);
        });
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
