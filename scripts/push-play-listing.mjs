#!/usr/bin/env node
// Google Play の掲載情報（タイトル・短い説明・詳しい説明・スクリーンショット・
// フィーチャーグラフィック・ストアアイコン）を Play Developer API 経由で反映する。
//
// **ビルドは要らない。** 掲載情報の更新は AAB のアップロードと別系統なので、
// EAS のビルド枠を使い切っていても実行できる。
//
// 使い方:
//   node scripts/push-play-listing.mjs                       # ドライラン（通信しない）
//   node scripts/push-play-listing.mjs --validate --key sa.json
//   node scripts/push-play-listing.mjs --commit   --key sa.json
//   node scripts/push-play-listing.mjs --lang ja,de --validate --key sa.json
//
// モードは3段階。**既定はドライランで、ネットワークに一切出ない。**
//   （既定）    ローカルの検証と「何を送るか」の表示だけ。鍵も要らない。
//   --validate  edit を作って全部適用し、Google 側の検証（edits.validate）を通してから
//               **edit を破棄する**。ストアには何も反映されない。鍵が要る。
//   --commit    同じことをして edits.commit する。**ここで初めて反映され、審査に入る。**
//
// 文言と画像の並びは**このスクリプトに書かない**。情報源は:
//   docs/store-listing-copy.md      … タイトル・短い説明・詳しい説明（6言語）
//   submission-assets/README.md     … 言語ごとに Play へ上げる8枚とその順
//   submission-assets/screenshots/  … スクリーンショット本体
//   submission-assets/store/        … フィーチャーグラフィックとストアアイコン
// ここに数字や文言を写すと、資料を直したときに黙って食い違う（このリポジトリで
// 何度も起きている失敗なので、**必ずパースして読む**。読めなければ落とす）。
import { createSign } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const COPY_PATH = join(ROOT, "docs", "store-listing-copy.md");
const ASSETS_README = join(ROOT, "submission-assets", "README.md");
const SHOTS_DIR = join(ROOT, "submission-assets", "screenshots");
const STORE_DIR = join(ROOT, "submission-assets", "store");

const API = "https://androidpublisher.googleapis.com/androidpublisher/v3";
const UPLOAD_API = "https://androidpublisher.googleapis.com/upload/androidpublisher/v3";

// app.config.ts の rawBundleId と同じ値。あちらは env を読まず直書きなので、
// ここでも既定値として持ち、--package で上書きできるようにしてある。
const DEFAULT_PACKAGE = "com.app.siunitcalculator";

// 掲載文のキー（このリポジトリの言語コード）→ Play の掲載言語コード。
// **Play 側は地域まで含んだコードでしか受け取らない**ので、ここで対応付ける。
// es は EBAU（スペイン）を主なターゲットにしているので es-ES。中南米も取りに行くなら
// es-419 を別の掲載として足すことになる（同じ本文を両方へ上げる運用）。
const PLAY_LOCALE = {
  en: "en-US",
  ja: "ja-JP",
  es: "es-ES",
  "pt-BR": "pt-BR",
  de: "de-DE",
  fr: "fr-FR",
};

// 詳しい説明のブロック見出し（docs/store-listing-copy.md の `### 言語名（N字）`）。
const FULL_DESC_HEADING = {
  en: "English",
  ja: "日本語",
  es: "Español",
  "pt-BR": "Português (Brasil)",
  de: "Deutsch",
  fr: "Français",
};

const LIMITS = { title: 30, shortDescription: 80, fullDescription: 4000 };

// Play の画像要件。スクリーンショットは 320〜3840px・長辺が短辺の2倍以内。
// 素材は 1080×1800 で作ってあるので、ここは「作り直したときに気付く」ための網。
const IMAGE_RULES = {
  featureGraphic: { exact: [1024, 500] },
  icon: { exact: [512, 512] },
  phoneScreenshots: { min: 320, max: 3840, maxAspect: 2 },
};

// ---------------------------------------------------------------- 引数

function parseArgs(argv) {
  const args = { mode: "dry-run", package: DEFAULT_PACKAGE, langs: null, key: null, skipImages: false, skipText: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--validate") args.mode = "validate";
    else if (a === "--commit") args.mode = "commit";
    else if (a === "--dry-run") args.mode = "dry-run";
    else if (a === "--skip-images") args.skipImages = true;
    else if (a === "--skip-text") args.skipText = true;
    else if (a === "--key") args.key = argv[++i];
    else if (a === "--package") args.package = argv[++i];
    else if (a === "--lang") args.langs = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--help" || a === "-h") args.help = true;
    else throw new Error(`不明な引数: ${a}`);
  }
  return args;
}

// ---------------------------------------------------------------- 情報源のパース

// 文字数は Python の len()（コードポイント数）に揃える。docs/store-listing-copy.md の
// 表に書いてある字数がその数え方なので、突き合わせが成立するようにする。
const charLen = (s) => [...s].length;

function readCopy() {
  const src = readFileSync(COPY_PATH, "utf8");

  // **`| 言語 | 数 | …` の形の表が2つある**（アプリ名と短い説明）。見出し行で切り分けないと
  // 取り違える（実際に一括置換でアプリ名の表を短い説明で上書きする事故を踏んでいる）。
  const sliceTable = (headerLine) => {
    const start = src.indexOf(headerLine);
    if (start < 0) throw new Error(`表が見つからない: ${headerLine}`);
    const end = src.indexOf("\n\n", start);
    return src.slice(start, end < 0 ? undefined : end);
  };

  const titleTable = sliceTable("| 言語 | 字数 | タイトル | 副題に入れたもの |");
  const shortTable = sliceTable("| 言語 | 文字数 | 本文 |");

  const listing = {};
  for (const lang of Object.keys(PLAY_LOCALE)) {
    const esc = lang.replace(/[-]/g, "\\-");

    const titleRow = new RegExp(`^\\| ${esc} \\| (\\d+) \\| ([^|]+?) \\|`, "m").exec(titleTable);
    if (!titleRow) throw new Error(`アプリ名の行が読めない: ${lang}`);

    const shortRow = new RegExp(`^\\| ${esc} \\| (\\d+) \\| (.+?) \\|$`, "m").exec(shortTable);
    if (!shortRow) throw new Error(`短い説明の行が読めない: ${lang}`);

    const heading = FULL_DESC_HEADING[lang];
    const fullRe = new RegExp(`### ${heading.replace(/[()]/g, "\\$&")}（([\\d,]+)字）\\n\\n\`\`\`\\n([\\s\\S]*?)\\n\`\`\``);
    const fullRow = fullRe.exec(src);
    if (!fullRow) throw new Error(`詳しい説明のブロックが読めない: ${lang} (${heading})`);

    listing[lang] = {
      title: titleRow[2].trim(),
      shortDescription: shortRow[2].trim(),
      fullDescription: fullRow[2],
      // 表とブロック見出しに書いてある字数。実測とズレていたら資料側が古い。
      stated: {
        title: Number(titleRow[1]),
        shortDescription: Number(shortRow[1]),
        fullDescription: Number(fullRow[1].replace(/,/g, "")),
      },
    };
  }
  return listing;
}

// submission-assets/README.md の「Playへ上げる順（言語ごとに8枚）」の表を読む。
// ここを固定値でスクリプトに持つと、並びを変えたときに黙って古い順で上がる。
function readScreenshotOrder() {
  const src = readFileSync(ASSETS_README, "utf8");
  const start = src.indexOf("| 言語 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |");
  if (start < 0) throw new Error("Playへ上げる順の表が見つからない（submission-assets/README.md）");
  const end = src.indexOf("\n\n", start);
  const table = src.slice(start, end < 0 ? undefined : end);

  const order = {};
  for (const lang of Object.keys(PLAY_LOCALE)) {
    const esc = lang.replace(/[-]/g, "\\-");
    const row = new RegExp(`^\\| ${esc} \\|(.+)\\|$`, "m").exec(table);
    if (!row) throw new Error(`Playへ上げる順の行が読めない: ${lang}`);
    const cuts = row[1].split("|").map((s) => s.trim()).filter(Boolean);
    if (cuts.length !== 8) throw new Error(`${lang} の枚数が8枚でない: ${cuts.length}枚`);
    order[lang] = cuts;
  }
  return order;
}

// PNG のヘッダから寸法を読む（画像ライブラリを足さないため）。
function pngSize(path) {
  const buf = readFileSync(path);
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`PNGではない: ${path}`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bytes: buf.length, buf };
}

function checkImage(path, kind) {
  const { width, height, bytes, buf } = pngSize(path);
  const rule = IMAGE_RULES[kind];
  const problems = [];
  if (rule.exact && (width !== rule.exact[0] || height !== rule.exact[1])) {
    problems.push(`寸法が ${rule.exact[0]}×${rule.exact[1]} でない（${width}×${height}）`);
  }
  if (rule.min && Math.min(width, height) < rule.min) problems.push(`短辺が ${rule.min}px 未満`);
  if (rule.max && Math.max(width, height) > rule.max) problems.push(`長辺が ${rule.max}px 超`);
  if (rule.maxAspect && Math.max(width, height) / Math.min(width, height) > rule.maxAspect) {
    problems.push(`アスペクト比が ${rule.maxAspect}:1 を超える`);
  }
  return { width, height, bytes, buf, problems };
}

// ---------------------------------------------------------------- 検証

function buildPlan({ listing, order, langs, skipImages, skipText }) {
  const plan = [];
  const problems = [];

  for (const lang of langs) {
    const entry = { lang, playLocale: PLAY_LOCALE[lang], text: null, screenshots: [], featureGraphic: null, icon: null };

    if (!skipText) {
      const t = listing[lang];
      entry.text = { title: t.title, shortDescription: t.shortDescription, fullDescription: t.fullDescription };
      for (const [field, limit] of Object.entries(LIMITS)) {
        const actual = charLen(t[field]);
        if (actual > limit) problems.push(`${lang} ${field}: ${actual}字で上限${limit}字を超える`);
        // 資料に書いてある字数と実測が食い違う＝資料が古い。送る前に気付きたい。
        if (t.stated[field] !== actual) {
          problems.push(`${lang} ${field}: 資料の表記 ${t.stated[field]}字 と実測 ${actual}字 が違う（資料が古い可能性）`);
        }
      }
    }

    if (!skipImages) {
      for (const cut of order[lang]) {
        const path = join(SHOTS_DIR, `${lang}-${cut}.png`);
        if (!existsSync(path)) { problems.push(`${lang}: スクショが無い ${basename(path)}`); continue; }
        const img = checkImage(path, "phoneScreenshots");
        img.problems.forEach((p) => problems.push(`${lang} ${cut}: ${p}`));
        entry.screenshots.push({ cut, path, ...img });
      }

      const fg = join(STORE_DIR, `play-feature-graphic-${lang}-1024x500.png`);
      if (!existsSync(fg)) problems.push(`${lang}: フィーチャーグラフィックが無い`);
      else {
        const img = checkImage(fg, "featureGraphic");
        img.problems.forEach((p) => problems.push(`${lang} featureGraphic: ${p}`));
        entry.featureGraphic = { path: fg, ...img };
      }

      const icon = join(STORE_DIR, "play-store-icon-512.png");
      if (!existsSync(icon)) problems.push("ストアアイコンが無い");
      else {
        const img = checkImage(icon, "icon");
        img.problems.forEach((p) => problems.push(`icon: ${p}`));
        entry.icon = { path: icon, ...img };
      }
    }

    plan.push(entry);
  }
  return { plan, problems };
}

function printPlan(plan, { mode, pkg }) {
  console.log(`パッケージ: ${pkg}`);
  console.log(`モード: ${mode}${mode === "dry-run" ? "（通信しない）" : mode === "validate" ? "（検証のみ・反映しない）" : "（★反映する）"}`);
  for (const e of plan) {
    console.log(`\n[${e.lang} → ${e.playLocale}]`);
    if (e.text) {
      console.log(`  タイトル     ${charLen(e.text.title)}/30  ${e.text.title}`);
      console.log(`  短い説明     ${charLen(e.text.shortDescription)}/80  ${e.text.shortDescription}`);
      console.log(`  詳しい説明   ${charLen(e.text.fullDescription)}/4000  ${e.text.fullDescription.split("\n")[0].slice(0, 60)}…`);
    }
    if (e.screenshots.length) {
      console.log(`  スクショ ${e.screenshots.length}枚（この順で表示される）:`);
      e.screenshots.forEach((s, i) => console.log(`    ${i + 1}. ${s.cut}  ${s.width}×${s.height}  ${(s.bytes / 1024).toFixed(0)}KB`));
    }
    if (e.featureGraphic) console.log(`  図版         ${e.featureGraphic.width}×${e.featureGraphic.height}`);
    if (e.icon) console.log(`  アイコン     ${e.icon.width}×${e.icon.height}`);
  }
}

// ---------------------------------------------------------------- 認証

// サービスアカウントの JSON 鍵から署名付き JWT を作り、アクセストークンに交換する。
// google-auth-library を足さずに済ませるため Node 標準の crypto で RS256 を組む。
async function getAccessToken(keyPath) {
  const key = JSON.parse(readFileSync(keyPath, "utf8"));
  if (!key.client_email || !key.private_key) throw new Error(`サービスアカウントの鍵に見えない: ${keyPath}`);

  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const claim = {
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: key.token_uri ?? "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64(claim)}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const jwt = `${unsigned}.${signer.sign(key.private_key, "base64url")}`;

  const res = await fetch(claim.aud, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`トークン取得に失敗 (${res.status}): ${JSON.stringify(body)}`);
  return body.access_token;
}

// ---------------------------------------------------------------- API

async function api(token, method, path, { json, body, contentType } = {}) {
  const res = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(json ? { "content-type": "application/json" } : {}),
      ...(contentType ? { "content-type": contentType } : {}),
    },
    body: json ? JSON.stringify(json) : body,
  });
  const text = await res.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* 画像アップロードは空応答のことがある */ }
  if (!res.ok) {
    const detail = parsed?.error?.message ?? text.slice(0, 400);
    throw new Error(`${method} ${path} が ${res.status}: ${detail}`);
  }
  return parsed;
}

async function pushListing({ token, pkg, plan, mode }) {
  const edit = await api(token, "POST", `/applications/${pkg}/edits`);
  const id = edit.id;
  console.log(`\nedit を作成: ${id}`);

  let committed = false;
  try {
    for (const e of plan) {
      const loc = e.playLocale;

      if (e.text) {
        await api(token, "PUT", `/applications/${pkg}/edits/${id}/listings/${loc}`, { json: e.text });
        console.log(`  [${loc}] 文言を更新`);
      }

      if (e.screenshots.length) {
        // **並び替えの手段が「消して入れ直す」しかない。** 既存を残したまま足すと
        // 古い枚数ぶん後ろに残り、順番も混ざる。
        await api(token, "DELETE", `/applications/${pkg}/edits/${id}/images/${loc}/phoneScreenshots`);
        for (const s of e.screenshots) {
          // **アップロードした順がそのまま掲載順になる。** 並列にすると順が崩れるので直列。
          await api(token, "POST",
            `${UPLOAD_API}/applications/${pkg}/edits/${id}/images/${loc}/phoneScreenshots?uploadType=media`,
            { body: s.buf, contentType: "image/png" });
        }
        console.log(`  [${loc}] スクショ ${e.screenshots.length}枚を差し替え`);
      }

      for (const [kind, asset] of [["featureGraphic", e.featureGraphic], ["icon", e.icon]]) {
        if (!asset) continue;
        await api(token, "DELETE", `/applications/${pkg}/edits/${id}/images/${loc}/${kind}`);
        await api(token, "POST",
          `${UPLOAD_API}/applications/${pkg}/edits/${id}/images/${loc}/${kind}?uploadType=media`,
          { body: asset.buf, contentType: "image/png" });
        console.log(`  [${loc}] ${kind} を差し替え`);
      }
    }

    if (mode === "commit") {
      await api(token, "POST", `/applications/${pkg}/edits/${id}:commit`);
      committed = true;
      console.log("\n★ commit した。Play Console に反映され、審査に入る。");
    } else {
      await api(token, "POST", `/applications/${pkg}/edits/${id}:validate`);
      console.log("\n検証を通過。反映はしていない。");
    }
  } finally {
    // commit 済みの edit は消せない（消そうとすると 400）。検証だけの場合は必ず片付ける。
    if (!committed) {
      try {
        await api(token, "DELETE", `/applications/${pkg}/edits/${id}`);
        console.log(`edit ${id} を破棄した（ストアには何も反映されていない）。`);
      } catch (e) {
        console.error(`edit ${id} の破棄に失敗: ${e.message}`);
      }
    }
  }
}

// ---------------------------------------------------------------- 本体

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 28).join("\n").replace(/^\/\/ ?/gm, ""));
    return;
  }

  const listing = readCopy();
  const order = readScreenshotOrder();
  const langs = args.langs ?? Object.keys(PLAY_LOCALE);
  for (const l of langs) if (!PLAY_LOCALE[l]) throw new Error(`未知の言語: ${l}（${Object.keys(PLAY_LOCALE).join(", ")} のいずれか）`);

  const { plan, problems } = buildPlan({ listing, order, langs, skipImages: args.skipImages, skipText: args.skipText });
  printPlan(plan, { mode: args.mode, pkg: args.package });

  if (problems.length) {
    console.error(`\n検証で ${problems.length} 件の問題:`);
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exitCode = 1;
    return;
  }
  console.log("\n検証OK（文字数・画像の寸法・枚数・資料との突き合わせ）。");

  if (args.mode === "dry-run") {
    console.log("ドライランなので通信しない。実際に送るなら --validate（検証のみ）か --commit（反映）を付ける。");
    return;
  }

  const keyPath = args.key ?? process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!keyPath) throw new Error("サービスアカウントの鍵が要る（--key <path> か GOOGLE_PLAY_SERVICE_ACCOUNT_JSON）");
  if (!existsSync(keyPath)) throw new Error(`鍵が見つからない: ${keyPath}`);

  const token = await getAccessToken(keyPath);
  await pushListing({ token, pkg: args.package, plan, mode: args.mode });
}

main().catch((e) => {
  console.error(`\n失敗: ${e.message}`);
  process.exitCode = 1;
});
