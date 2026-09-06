#!/usr/bin/env node
// 提出用デモ動画（無音・英語字幕焼き込み）を Web 版から録画する。
//
// 台本は docs/shipaton-demo-script.md、字幕の文言とタイムコードは
// submission-assets/demo/demo-captions-en.srt が唯一の情報源。字幕は**SRTから読み込んで**
// 焼き込む（手で打ち直すと台本とズレる）。
//
// 使い方:
//   npx expo export --platform web          # 先に dist/ を作る
//   node scripts/record-demo-video.mjs
//   node scripts/record-demo-video.mjs --keep-raw   # トリム前の生録画を残す
//
// 出力:
//   submission-assets/demo/unit-calculator-demo-en-silent.webm
//   submission-assets/demo/caption-style-reference.png
//
// ## 字幕の焼き込み方式について
// この環境の ffmpeg は Playwright 同梱の極小ビルドしかなく、
// `--disable-everything` に対して有効なフィルタが pad / crop / scale だけ、
// エンコーダも libvpx_vp8 と png だけ（`ffmpeg-linux -version` の configuration 参照）。
// **drawtext も subtitles も overlay も concat も無い**ので、ffmpeg で字幕を焼くことは
// できない。したがって字幕は録画中のページ DOM に固定オーバーレイとして差し込み、
// Node 側のスケジューラが SRT のタイムコードちょうどで差し替える方式を採る。
// ffmpeg は「頭のセットアップ部分を切り落として尺を SRT に合わせる」再エンコードだけに使う。
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import { startDistServer } from "./capture-submission-assets.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEMO_DIR = join(ROOT, "submission-assets", "demo");
const SRT_PATH = join(DEMO_DIR, "demo-captions-en.srt");
const OUT_PATH = join(DEMO_DIR, "unit-calculator-demo-en-silent.webm");
const STYLE_REF_PATH = join(DEMO_DIR, "caption-style-reference.png");
const FFMPEG = process.env.FFMPEG_PATH ?? "/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux";
const CHROMIUM_PATH = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

// スクリーンショット素材と同じ 540×900 CSS px（＝端末幅 540dp 相当のレイアウト）のまま
// 2 倍の画素で描かせるので、動画は 1080×1800。旧素材の 540×900 から 4 倍の画素数。
//
// 倍率は **ブラウザ起動時の --force-device-scale-factor** で与えること。
// context の deviceScaleFactor はスクリーンショットには効くが録画には効かず、
// 540×900 の絵が 1080×1800 のキャンバスの左上に貼られただけの動画になる（実際に踏んだ）。
const VIEWPORT = { width: 540, height: 900 };
const SCALE = 2;
const VIDEO_SIZE = { width: VIEWPORT.width * SCALE, height: VIEWPORT.height * SCALE };
const FPS = 25;

// 録画は page 生成と同時に始まるので、オンボーディングを閉じる等のセットアップも写ってしまう。
// セットアップに十分な余裕を取り、本編の開始をこの時刻に固定して、あとから頭を切り落とす。
// （検証: page 生成時刻と動画の t=0 のズレは実測 50ms 未満）
const LEADER_SECONDS = 20;

const sleep = (ms) => new Promise((done) => setTimeout(done, Math.max(0, ms)));

// ---------------------------------------------------------------- SRT

function parseSrt(text) {
  const toSeconds = (stamp) => {
    const [hms, ms] = stamp.trim().split(",");
    const [h, m, s] = hms.split(":").map(Number);
    return h * 3600 + m * 60 + s + Number(ms) / 1000;
  };
  return text
    .replace(/\r/g, "")
    .trim()
    .split(/\n\n+/)
    .map((block) => {
      const lines = block.split("\n");
      const [start, end] = lines[1].split("-->");
      return { index: Number(lines[0]), start: toSeconds(start), end: toSeconds(end), text: lines.slice(2).join(" ").trim() };
    });
}

// ---------------------------------------------------------------- ページ内オーバーレイ

const CAPTION_ID = "demo-caption-bar";
const COVER_ID = "demo-cover";

// 字幕は既存の caption-style-reference.png を踏襲した「画面下端の濃紺のバンド」。
// 入力欄・結果カードは画面上部にあるので、この位置なら台本の
// 「結果カードと入力欄の上に被せない」を全シーンで満たせる（隠れるのはタブバーだけ）。
async function installOverlays(page) {
  await page.evaluate(({ captionId, coverId }) => {
    const caption = document.createElement("div");
    caption.id = captionId;
    caption.style.cssText = [
      "position:fixed", "left:0", "right:0", "bottom:0",
      "min-height:56px", "box-sizing:border-box", "padding:11px 18px",
      "background:#123A4D", "color:#ffffff",
      "display:flex", "align-items:center", "justify-content:center",
      "font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
      "font-size:17px", "font-weight:700", "line-height:1.3", "letter-spacing:0.1px",
      "text-align:center", "white-space:pre-wrap",
      "z-index:2147483647", "pointer-events:none",
    ].join(";");
    document.body.appendChild(caption);

    // セットアップ中の目隠しと、最後のタイトルカードに使う全面カバー。
    // **中身は空のまま置いておく**こと。ここに "Unit Calculator" のような文字を入れると
    // getByText("Unit Calculator") がタブではなくこちらに当たり、pointer-events:none の
    // せいでクリックできない要素として掴まれてタブ操作が全滅する（実際に踏んだ）。
    const cover = document.createElement("div");
    cover.id = coverId;
    cover.style.cssText = [
      "position:fixed", "inset:0", "background:#F4F7F9", "color:#125D79",
      "display:none", "flex-direction:column", "align-items:center", "justify-content:center",
      "gap:14px", "text-align:center",
      "font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
      "z-index:2147483646", "pointer-events:none",
    ].join(";");
    document.body.appendChild(cover);
  }, { captionId: CAPTION_ID, coverId: COVER_ID });
}

const setCaption = (page, text) =>
  page.evaluate(({ id, value }) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }, { id: CAPTION_ID, value: text });

const setCover = (page, visible) =>
  page.evaluate(({ id, show }) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!show) el.innerHTML = "";
    el.style.display = show ? "flex" : "none";
  }, { id: COVER_ID, show: visible });

// クロージングのタイトルカード。文字を入れるのは全ての操作が終わった最後だけ。
const showClosingCard = (page) =>
  page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML =
      '<div style="font-size:76px;font-weight:800;line-height:1">&#x3A3;</div>' +
      '<div style="font-size:30px;font-weight:800">Unit&nbsp;Calculator</div>' +
      '<div style="font-size:16px;font-weight:600;color:#4A6472">Calculate with confidence,<br>in any compatible unit.</div>';
    el.style.display = "flex";
  }, COVER_ID);

// ---------------------------------------------------------------- 画面操作

const TABS = {
  en: { calculator: "Unit Calculator", notebook: "Notebooks", library: "Library", settings: "Preferences" },
  ja: { calculator: "単位付き電卓", notebook: "ノート", library: "ライブラリ", settings: "設定" },
  de: { calculator: "Einheitenrechner", notebook: "Rechenhefte", library: "Bibliothek", settings: "Einstellungen" },
};
const LANGUAGE_SECTION = /^(App language|アプリの言語|App-Sprache)$/;

const tab = (page, lang, key) => page.getByText(TABS[lang][key], { exact: true }).last().click();
const key = (page, label) => page.getByLabel(label, { exact: true }).first().click();

// 打ち終わったらフォーカスを外す。ブラウザのフォーカスリング（黒い枠）は実機の
// 見え方ではないので、静止して見せる区間には出したくない。
const blur = (page) => page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());

async function typeExpression(page, text, delay = 110) {
  const input = page.getByLabel("Expression").first();
  await input.click();
  await page.keyboard.type(text, { delay });
  await blur(page);
}

// Web 版だけに出る注記（Android 実機では出ない）。素材の方針としてスクリーンショットと
// 同じく、消してから見せる（submission-assets/README.md）。Pro 画面は録画の途中で
// クライアント側遷移してくるので、遷移後に何度か呼ぶ。
const WEB_ONLY_NOTES = [
  "This is a web preview",
  "Purchases are available in the iOS or Android store version.",
];
const hideWebOnlyNotes = (page) =>
  page.evaluate((needles) => {
    for (const el of document.querySelectorAll("div,span,p")) {
      if (el.children.length !== 0) continue;
      if (needles.some((needle) => el.textContent?.includes(needle))) el.style.display = "none";
    }
  }, WEB_ONLY_NOTES);

async function wheel(page, dy, steps = 6, gap = 90) {
  await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height * 0.35);
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.wheel(0, dy / steps);
    await sleep(gap);
  }
}

// ---------------------------------------------------------------- 本編

function buildTimeline(cues) {
  const cueAt = (index) => cues[index - 1];
  // 各シーンは「SRT の cue 番号」と対応する。開始時刻は cue.start をそのまま使う。
  return [
    {
      cue: 1, // 0:00–0:07 電卓タブで 5cm + 1mm を打つ
      run: async (page, at) => {
        await typeExpression(page, "5cm + 1mm", 150);
        await at(cueAt(1).end);
      },
    },
    {
      cue: 2, // 0:07–0:15 = を押さないまま結果カードを見せる
      run: async (page, at) => {
        await at(cueAt(2).end - 0.2);
      },
    },
    {
      cue: 3, // 0:15–0:22 = で履歴に残してから AC → 5m + 1kg の次元エラー
      run: async (page, at) => {
        await key(page, "=");
        await at(cueAt(3).start + 1.2);
        await key(page, "Clear all");
        await typeExpression(page, "5m + 1kg", 130);
        // 次元エラーは確定操作（=）で出る。打っただけでは結果が空欄になるだけなので、
        // 台本どおり「結果の代わりにエラーが出ている」画にするには = が要る。
        await key(page, "=");
        await at(cueAt(3).end);
      },
    },
    {
      cue: 4, // 0:22–0:31 100km / 2h → Compare units を開く
      run: async (page, at) => {
        await key(page, "Clear all");
        await typeExpression(page, "100km / 2h", 120);
        await key(page, "=");
        await at(cueAt(4).start + 4.0);
        await page.getByLabel("Compare units", { exact: true }).first().click();
        await at(cueAt(4).start + 5.5);
        await wheel(page, 110, 5, 110);
        await at(cueAt(4).end);
      },
    },
    {
      cue: 5, // 0:31–0:40 1/3 → Exact をタップして組版された分数
      run: async (page, at) => {
        // 比較表は AC では閉じないので、厳密値の2シーンは畳んだ状態で見せる。
        await page.getByLabel("Compare units", { exact: true }).first().click();
        await key(page, "Clear all");
        await typeExpression(page, "1/3", 170);
        await key(page, "=");
        await at(cueAt(5).start + 3.0);
        await key(page, "Exact");
        await at(cueAt(5).end);
      },
    },
    {
      cue: 6, // 0:40–0:50 Exact のまま 2*pi*50 → 100π、sqrt(8) → 2√2
      run: async (page, at) => {
        await key(page, "Clear all");
        await typeExpression(page, "2*pi*50", 120);
        await key(page, "=");
        await at(cueAt(6).start + 4.6);
        await key(page, "Clear all");
        await typeExpression(page, "sqrt(8)", 120);
        await key(page, "=");
        await at(cueAt(6).end);
      },
    },
    {
      cue: 7, // 0:50–0:57 0x ピル → FF → DEC で 255
      run: async (page, at) => {
        await key(page, "Clear all");
        await key(page, "Base input");
        await at(cueAt(7).start + 1.4);
        await key(page, "F");
        await sleep(320);
        await key(page, "F");
        await at(cueAt(7).start + 3.8);
        await key(page, "DEC");
        await at(cueAt(7).end - 0.6);
        await key(page, "=");
        await at(cueAt(7).end);
      },
    },
    {
      cue: 8, // 0:57–1:04 ライブラリタブ：最上位9カテゴリ
      run: async (page, at) => {
        await tab(page, "en", "library");
        await at(cueAt(8).start + 2.6);
        await wheel(page, 130, 5, 130);
        await at(cueAt(8).start + 5.0);
        await wheel(page, -130, 5, 110);
        await at(cueAt(8).end);
      },
    },
    {
      cue: 9, // 1:04–1:12 ノート検索で photography
      run: async (page, at) => {
        const search = page.getByPlaceholder("Search all notebooks").first();
        await search.click();
        await page.keyboard.type("photography", { delay: 105 });
        await blur(page);
        await at(cueAt(9).end);
      },
    },
    {
      cue: 10, // 1:12–1:21 「Depth of field」を開いてノート詳細を見せる
      run: async (page, at) => {
        await page.getByText("Depth of field (near and far limits)", { exact: true }).first().click();
        await at(cueAt(10).start + 3.2); // KaTeX の描画待ちを兼ねてしっかり止める
        await wheel(page, 260, 7, 130);
        await at(cueAt(10).start + 6.4);
        await wheel(page, 260, 7, 130);
        await at(cueAt(10).end);
      },
    },
    {
      cue: 11, // 1:21–1:28 英語 → 日本語 → ドイツ語 の早い切り替え
      run: async (page, at) => {
        await tab(page, "en", "settings");
        await page.getByText(LANGUAGE_SECTION).first().click();
        await page.getByRole("radio", { name: /: 日本語$/ }).first().click();
        await at(cueAt(11).start + 1.7);
        await tab(page, "ja", "notebook");
        await at(cueAt(11).start + 3.2);
        await tab(page, "ja", "settings");
        await page.getByRole("radio", { name: /: Deutsch$/ }).first().click();
        await at(cueAt(11).start + 4.6);
        await tab(page, "de", "notebook");
        await at(cueAt(11).start + 6.1);
        await tab(page, "de", "settings");
        await page.getByRole("radio", { name: /: English$/ }).first().click();
        await at(cueAt(11).end);
      },
    },
    {
      cue: 12, // 1:28–1:38 ノートの共有ボタン → Pro 画面（クライアント側遷移なので再読込が無い）
      run: async (page, at) => {
        await tab(page, "en", "notebook");
        await at(cueAt(12).start + 1.2);
        await key(page, "Share notebook");
        await sleep(500);
        await hideWebOnlyNotes(page);
        await at(cueAt(12).start + 4.5);
        await hideWebOnlyNotes(page);
        await wheel(page, 200, 6, 130);
        await at(cueAt(12).start + 7.0);
        await hideWebOnlyNotes(page);
        await wheel(page, -200, 6, 110);
        await at(cueAt(12).end);
      },
    },
    {
      cue: 13, // 1:38–1:45 電卓タブ → 履歴シート
      run: async (page, at) => {
        await tab(page, "en", "calculator");
        await at(cueAt(13).start + 1.4);
        await key(page, "Saved calculations");
        await at(cueAt(13).start + 3.6);
        await wheel(page, 120, 5, 120);
        await at(cueAt(13).end);
      },
    },
    {
      cue: 14, // 1:45–1:53 クロージングのタイトルカード
      run: async (page, at) => {
        await showClosingCard(page);
        await at(cueAt(14).end);
      },
    },
  ];
}

// ---------------------------------------------------------------- 実行

async function record({ keepRaw }) {
  if (!existsSync(FFMPEG)) throw new Error(`ffmpeg が見つかりません: ${FFMPEG}`);
  const cues = parseSrt(readFileSync(SRT_PATH, "utf8"));
  const total = cues[cues.length - 1].end;
  console.log(`SRT: ${cues.length} cues, total ${total}s`);

  const rawDir = mkdtempSync(join(tmpdir(), "demo-raw-"));
  const server = await startDistServer();
  const browser = await chromium.launch({
    headless: true,
    args: [`--force-device-scale-factor=${SCALE}`],
    ...(existsSync(CHROMIUM_PATH) ? { executablePath: CHROMIUM_PATH } : {}),
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: "en-US",
    colorScheme: "light",
    reducedMotion: "reduce",
    recordVideo: { dir: rawDir, size: VIDEO_SIZE },
  });
  const page = await context.newPage();
  const recordingStart = Date.now(); // 動画の t=0（実測ズレ < 50ms）

  // --- セットアップ（この区間はあとから切り落とす）
  await page.goto(server.origin);
  await page.waitForLoadState("networkidle").catch(() => {});
  await sleep(2500);
  await installOverlays(page);
  await setCover(page, true);
  await setCaption(page, "");
  const skip = page.getByText(/^Skip$/).first();
  try {
    await skip.waitFor({ state: "visible", timeout: 8000 });
    await skip.click();
  } catch {
    /* すでに閉じている */
  }
  await tab(page, "en", "calculator");
  await sleep(400);

  const takeStart = recordingStart + LEADER_SECONDS * 1000;
  const at = async (seconds) => sleep(takeStart + seconds * 1000 - Date.now());
  await at(-0.3);
  await setCover(page, false);
  await at(0);

  // --- 本編
  const drift = [];
  let sceneError = null;
  for (const scene of buildTimeline(cues)) {
    const cue = cues[scene.cue - 1];
    await at(cue.start);
    await setCaption(page, cue.text);
    const before = (Date.now() - takeStart) / 1000;
    drift.push({ cue: cue.index, plannedStart: cue.start, actualStart: Number(before.toFixed(2)) });
    try {
      await scene.run(page, at);
    } catch (error) {
      // 失敗したシーンをログだけ出して先へ進むと、そのシーンが空白のまま
      // 「成功」として書き出されてしまう。撮り直しの必要な動画を成功扱いに
      // しないため、録画資源を閉じてから投げ直す（ffmpeg には進ませない）。
      sceneError = error;
      console.error(`  ! scene ${cue.index} failed: ${error.message.split("\n")[0]}`);
      break;
    }
    await at(cue.end);
    console.log(`  cue ${String(cue.index).padStart(2)} ${cue.start.toFixed(0)}s → ok`);
  }
  await setCaption(page, "");
  await sleep(400);

  const video = page.video();
  await context.close();
  const rawPath = await video.path();
  await browser.close();
  await server.close();

  if (sceneError) {
    rmSync(rawDir, { recursive: true, force: true });
    throw sceneError;
  }

  console.table(drift);

  // --- 頭のセットアップを切り落として尺を SRT に合わせる（出力側 -ss なのでフレーム精度）
  mkdirSync(DEMO_DIR, { recursive: true });
  const tmpOut = join(rawDir, "trimmed.webm");
  execFileSync(FFMPEG, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", rawPath,
    "-ss", String(LEADER_SECONDS),
    "-t", String(total),
    "-an",
    "-c:v", "libvpx", "-b:v", "2500k", "-crf", "26", "-qmin", "0", "-qmax", "42",
    "-r", String(FPS),
    tmpOut,
  ], { stdio: "inherit" });
  // rawDir は tmpdir() の下にあり、/tmp がリポジトリと別ファイルシステムだと
  // renameSync が EXDEV で落ちる。録画も再エンコードも終わった後に落ちるので
  // 損失が大きい。コピーしてから消す。
  copyFileSync(tmpOut, OUT_PATH);
  console.log(`wrote ${OUT_PATH}`);

  if (keepRaw) {
    const kept = join(DEMO_DIR, "raw-take.webm");
    copyFileSync(rawPath, kept);
    console.log(`kept raw take at ${kept}`);
  }
  rmSync(rawDir, { recursive: true, force: true });
  return { total };
}

// 動画から任意秒のフレームを PNG で抜く（目視確認用。字幕スタイルの見本もこれで作る）。
export function extractFrame(videoPath, seconds, outPath) {
  execFileSync(FFMPEG, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", videoPath, "-ss", String(seconds), "-frames:v", "1", outPath,
  ], { stdio: "inherit" });
  return outPath;
}

async function main() {
  const keepRaw = process.argv.includes("--keep-raw");
  const { total } = await record({ keepRaw });
  // 字幕スタイルの見本は「比較表を開いた 0:28 あたり」を使う（旧 caption-style-reference.png と同じ絵）。
  extractFrame(OUT_PATH, 28, STYLE_REF_PATH);
  console.log(`wrote ${STYLE_REF_PATH}`);
  const info = execFileSync("sh", ["-c", `${FFMPEG} -hide_banner -i ${JSON.stringify(OUT_PATH)} 2>&1 | sed -n '1,12p'`], { encoding: "utf8" });
  console.log(`target duration ${total}s`);
  console.log(info);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
