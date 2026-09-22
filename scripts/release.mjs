#!/usr/bin/env node
// Google Play へ出す「実行ファイル（AAB）とリリースノート一式」を作り、検査し、上げる。
//
// **掲載情報（タイトル・説明・スクリーンショット）は別系統**で、そちらは
// scripts/push-play-listing.mjs が担当する。こちらが触るのは AAB とトラック（配信先）と
// 「このバージョンの新機能」だけ。
//
// 使い方:
//   node scripts/release.mjs check                    # 検査だけ。鍵があれば Play の実測も突き合わせる
//   node scripts/release.mjs notes                    # リリースノートの雛形を作る
//   node scripts/release.mjs notes --from-play        # いま Play に載っている文面を下敷きにする
//   node scripts/release.mjs build                    # prebuild + gradlew bundleRelease
//   node scripts/release.mjs pack                     # release/vX.Y.Z/ に一式集める
//   node scripts/release.mjs upload                   # ドライラン（通信しない）
//   node scripts/release.mjs upload --validate        # Play を読んで衝突だけ確かめ、何も変えない
//   node scripts/release.mjs upload --commit          # **ここで初めて配信される**
//   node scripts/release.mjs ship                     # check → build → pack を通しで
//
// 安全設計（push-play-listing.mjs と同じ考え方）:
//   * upload の既定はドライラン。`--commit` を打つまで Play は一切変わらない。
//   * `--validate` は edit を作って読むだけで **AAB を送らない**。掲載情報の方の
//     --validate（実際に適用してから破棄）とはここだけ意味が違う——AAB は一度送ると
//     その versionCode が使用済みとして残りうるので、「お試しで送る」を用意しない。
//   * 数字（versionCode・使用済みの一覧・配信中の版）は**推測せず Play に問い合わせる**。
//
// 情報源（ここに数字や文言を写さない。写すと直したときに黙って食い違う）:
//   app.config.ts        … version / android.versionCode
//   package.json         … version
//   CHANGELOG.md         … リリースノートの下書きの元
//   docs/release-notes/  … Play へ送る「このバージョンの新機能」本体（言語ごと）
//   AAB そのもの         … 実際に入っている package / versionCode / versionName / 権限
//   Play Developer API   … 使用済み versionCode・各トラックの配信状況・掲載言語
import { createSign, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { inflateRawSync } from "node:zlib";
import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync, statSync,
} from "node:fs";
import { join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const APP_CONFIG = join(ROOT, "app.config.ts");
const PACKAGE_JSON = join(ROOT, "package.json");
const CHANGELOG = join(ROOT, "CHANGELOG.md");
const NOTES_ROOT = join(ROOT, "docs", "release-notes");
const RELEASE_ROOT = join(ROOT, "release");
const GRADLE_BUILD = join(ROOT, "android", "app", "build.gradle");
const DEFAULT_AAB = join(ROOT, "android", "app", "build", "outputs", "bundle", "release", "app-release.aab");
const DEFAULT_KEY = join(ROOT, "play-service-account-unitcalc.json");

const API = "https://androidpublisher.googleapis.com/androidpublisher/v3";
const UPLOAD_API = "https://androidpublisher.googleapis.com/upload/androidpublisher/v3";

// app.config.ts の rawBundleId と同じ値（あちらは env を読まず直書き）。--package で上書きできる。
const DEFAULT_PACKAGE = "com.app.siunitcalculator";

// Play の「このバージョンの新機能」は 500 字まで（言語ごと）。
const NOTE_LIMIT = 500;

// 掲載言語は**鍵があれば Play に問い合わせて確定する**（edits.listings.list）。
// これはその前段のフォールバックで、push-play-listing.mjs の PLAY_LOCALE と同じ7掲載。
const FALLBACK_LOCALES = ["en-US", "ja-JP", "es-ES", "es-419", "pt-BR", "de-DE", "fr-FR"];

// ---------------------------------------------------------------- 表示

const results = [];
const ok = (m) => { results.push(["ok", m]); console.log(`  OK   ${m}`); };
const warn = (m) => { results.push(["warn", m]); console.log(`  注意 ${m}`); };
const fail = (m) => { results.push(["fail", m]); console.log(`  NG   ${m}`); };
const head = (m) => console.log(`\n${m}`);
const hasFailure = () => results.some(([level]) => level === "fail");

const bytes = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

// ---------------------------------------------------------------- ローカルの読み取り

// **このリポジトリのテキストは CRLF と LF が混ざっている**（CHANGELOG.md と package.json は
// CRLF、app.config.ts は LF）。JS の正規表現では `\r` が行終端扱いなので、`/^- (.+)$/` は
// CRLF の行に**一致しない**——CHANGELOG から作るリリースノートの下書きが、末尾の1行
// （trim で `\r` が落ちた行）だけになる、という形で黙って壊れた。読む側で必ず潰す。
const readText = (path) => readFileSync(path, "utf8").replace(/\r\n?/g, "\n");

function readLocalVersions() {
  const appConfig = readText(APP_CONFIG);
  // トップレベルの `version: "x.y.z"`。プラグインの設定などにある別の version を拾わないよう
  // 字下げの深さで限定する。
  const version = appConfig.match(/^ {2}version: "([^"]+)"/m)?.[1] ?? null;
  const versionCode = Number(appConfig.match(/^ {4}versionCode: (\d+)/m)?.[1] ?? NaN);
  const pkgJson = JSON.parse(readText(PACKAGE_JSON));
  return { version, versionCode, packageVersion: pkgJson.version };
}

function readGradleVersions() {
  // android/ は gitignore された生成物。prebuild していないと app.config.ts の変更がここへ
  // 届かず、**ビルドしたAABだけが古い versionCode を持つ**（Playに弾かれるまで気付けない）。
  if (!existsSync(GRADLE_BUILD)) return null;
  const text = readText(GRADLE_BUILD);
  return {
    versionCode: Number(text.match(/versionCode (\d+)/)?.[1] ?? NaN),
    versionName: text.match(/versionName "([^"]+)"/)?.[1] ?? null,
  };
}

function readChangelog() {
  const text = readText(CHANGELOG);
  const marks = [];
  const re = /^## \[([^\]]+)\](?: - (\S+))?\s*$/gm;
  let m;
  while ((m = re.exec(text))) marks.push({ name: m[1], date: m[2] ?? null, start: m.index, end: re.lastIndex });
  const sections = marks.map((mark, i) => ({
    ...mark,
    body: text.slice(mark.end, i + 1 < marks.length ? marks[i + 1].start : text.length).trim(),
  }));
  return {
    sections,
    unreleased: sections.find((s) => s.name === "Unreleased") ?? null,
    latest: sections.find((s) => s.name !== "Unreleased") ?? null,
  };
}

function git(args) {
  const r = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

function readGitState(version) {
  const tag = `v${version}`;
  const tagged = git(["tag", "-l", tag]) === tag;
  return {
    tag,
    tagged,
    tagCommit: tagged ? git(["rev-list", "-n", "1", tag]) : null,
    head: git(["rev-parse", "HEAD"]),
    branch: git(["rev-parse", "--abbrev-ref", "HEAD"]),
    dirty: (git(["status", "--short"]) ?? "").length > 0,
    // CLAUDE.md の失敗例（タグとReleaseだけ公開され、リリースコミットがローカルに取り残された）
    // をそのまま検出する。`git push origin vX.Y.Z` はタグだけを送るのでブランチのpushは別に要る。
    unpushed: (git(["log", "--oneline", "origin/main..HEAD"]) ?? "").split("\n").filter(Boolean).length,
  };
}

// ---------------------------------------------------------------- AAB を読む

// AAB は zip。中の base/manifest/AndroidManifest.xml は protobuf（aapt2 の pb 形式）なので、
// **AAB そのものから** package / versionCode / versionName / 権限を読める。
// 中間生成物（android/app/build/intermediates/...）にも同じ値はあるが、あちらは別の設定で
// 走らせた前回のビルドの残骸が混ざる（このリポジトリでも実際に `.smoketest` が残っていた）。
// 「いま上げようとしている実物」の保証になるのは AAB だけ。
function readZipEntry(buf, wanted) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 70000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("zip の EOCD が見つからない（AAB ではない？）");
  let cdOffset = buf.readUInt32LE(eocd + 16);
  let cdCount = buf.readUInt16LE(eocd + 10);
  if (cdOffset === 0xffffffff || cdCount === 0xffff) {
    for (let i = eocd - 20; i >= 0; i--) {
      if (buf.readUInt32LE(i) === 0x07064b50) {
        const z64 = Number(buf.readBigUInt64LE(i + 8));
        cdCount = Number(buf.readBigUInt64LE(z64 + 32));
        cdOffset = Number(buf.readBigUInt64LE(z64 + 48));
        break;
      }
    }
  }
  let p = cdOffset;
  for (let i = 0; i < cdCount; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (name === wanted) {
      // ローカルヘッダの名前長・拡張長は中央ディレクトリの値と一致しないことがあるので、
      // 必ずローカルヘッダ側を読み直してから中身の開始位置を出す。
      const nLen = buf.readUInt16LE(localOff + 26);
      const xLen = buf.readUInt16LE(localOff + 28);
      const start = localOff + 30 + nLen + xLen;
      const raw = buf.subarray(start, start + compSize);
      return method === 0 ? raw : inflateRawSync(raw);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

// protobuf の最小限の走査。スキーマは持たず、必要な入れ子だけを辿る
// （XmlNode.element=1 / XmlElement.name=3・attribute=4・child=5 / XmlAttribute.name=2・value=3）。
function* pbFields(buf) {
  let p = 0;
  while (p < buf.length) {
    let key = 0, shift = 0;
    while (true) { const c = buf[p++]; key |= (c & 0x7f) << shift; shift += 7; if (!(c & 0x80)) break; }
    const no = key >>> 3;
    const wire = key & 7;
    if (wire === 0) { while (buf[p++] & 0x80); yield { no, value: null }; }
    else if (wire === 2) {
      let len = 0, s = 0;
      while (true) { const c = buf[p++]; len |= (c & 0x7f) << s; s += 7; if (!(c & 0x80)) break; }
      yield { no, value: buf.subarray(p, p + len) };
      p += len;
    } else if (wire === 5) { p += 4; yield { no, value: null }; }
    else if (wire === 1) { p += 8; yield { no, value: null }; }
    else throw new Error(`未知の wire type ${wire}`);
  }
}
const pbSub = (buf, no) => { for (const f of pbFields(buf)) if (f.no === no && f.value) return f.value; return null; };
const pbStr = (buf, no) => pbSub(buf, no)?.toString("utf8") ?? null;
const pbAttrs = (element) => {
  const out = {};
  for (const f of pbFields(element)) {
    if (f.no !== 4 || !f.value) continue;
    out[pbStr(f.value, 2) ?? ""] = pbStr(f.value, 3) ?? "";
  }
  return out;
};

function readAab(path) {
  const buf = readFileSync(path);
  const manifest = readZipEntry(buf, "base/manifest/AndroidManifest.xml");
  if (!manifest) throw new Error("AAB に base/manifest/AndroidManifest.xml が無い");
  const element = pbSub(manifest, 1);
  const attrs = pbAttrs(element);
  const permissions = [];
  for (const f of pbFields(element)) {
    if (f.no !== 5 || !f.value) continue;
    const child = pbSub(f.value, 1);
    if (!child || pbStr(child, 3) !== "uses-permission") continue;
    const name = pbAttrs(child).name;
    if (name) permissions.push(name);
  }
  return {
    path,
    size: buf.length,
    mtime: statSync(path).mtime,
    sha1: createHash("sha1").update(buf).digest("hex"),
    sha256: createHash("sha256").update(buf).digest("hex"),
    package: attrs.package ?? null,
    versionCode: Number(attrs.versionCode),
    versionName: attrs.versionName ?? null,
    permissions: permissions.sort(),
  };
}

// AAB が「今のソースより古い」ことを検出する。型でもテストでも拾えず、気付くのは
// Play にアップロードしたあと（か、最悪ずっと気付かない）。
function newestSourceMtime() {
  let newest = 0;
  let newestPath = null;
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else {
        const t = statSync(full).mtimeMs;
        if (t > newest) { newest = t; newestPath = full; }
      }
    }
  };
  for (const d of ["app", "lib", "components", "hooks", "widgets", "plugins", "assets"]) walk(join(ROOT, d));
  for (const f of [APP_CONFIG, PACKAGE_JSON]) {
    const t = statSync(f).mtimeMs;
    if (t > newest) { newest = t; newestPath = f; }
  }
  return { mtime: newest, path: newestPath };
}

// ---------------------------------------------------------------- リリースノート

const notesDir = (version) => join(NOTES_ROOT, `v${version}`);

function readNotes(version) {
  const dir = notesDir(version);
  if (!existsSync(dir)) return {};
  const out = {};
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".txt")) continue;
    out[name.replace(/\.txt$/, "")] = readText(join(dir, name)).trim();
  }
  return out;
}

// CHANGELOG の該当バージョンの節から下書きを作る。**作るのは日本語の下書きだけ**で、
// 他の言語は TODO のまま置く（機械翻訳を挟むと、誰も読まないまま en-US に日本語が出る）。
function draftFromChangelog(section) {
  if (!section) return "";
  const bullets = [];
  for (const line of section.body.split("\n")) {
    const m = line.match(/^- (.+)$/);
    if (!m) continue;
    const plain = m[1]
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();
    // 1文目だけ。CHANGELOG の各行は「何をしたか＋なぜか」で長く、そのままでは 500 字に入らない。
    bullets.push((plain.split(/(?<=。)/)[0] ?? plain).trim());
  }
  let out = "";
  for (const b of bullets) {
    const next = out ? `${out}\n・${b}` : `・${b}`;
    if (next.length > NOTE_LIMIT) break;
    out = next;
  }
  return out;
}

// ---------------------------------------------------------------- Play API

function resolveKeyPath(explicit) {
  if (explicit) {
    if (!existsSync(explicit)) throw new Error(`鍵が見つからない: ${explicit}`);
    return explicit;
  }
  return existsSync(DEFAULT_KEY) ? DEFAULT_KEY : null;
}

async function getAccessToken(keyPath) {
  const key = JSON.parse(readText(keyPath));
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
  try { parsed = text ? JSON.parse(text) : null; } catch { /* アップロードは空応答のことがある */ }
  if (!res.ok) throw new Error(`${method} ${path} が ${res.status}: ${parsed?.error?.message ?? text.slice(0, 400)}`);
  return parsed;
}

// edit を作って読むだけ。**commit しないので Play は何も変わらない**（読み終えたら消す）。
async function readPlayState(token, pkg) {
  const edit = await api(token, "POST", `/applications/${pkg}/edits`);
  try {
    const [bundles, tracks, listings] = await Promise.all([
      api(token, "GET", `/applications/${pkg}/edits/${edit.id}/bundles`),
      api(token, "GET", `/applications/${pkg}/edits/${edit.id}/tracks`),
      api(token, "GET", `/applications/${pkg}/edits/${edit.id}/listings`),
    ]);
    return {
      bundles: bundles.bundles ?? [],
      tracks: tracks.tracks ?? [],
      locales: (listings.listings ?? []).map((l) => l.language).sort(),
    };
  } finally {
    await api(token, "DELETE", `/applications/${pkg}/edits/${edit.id}`).catch(() => {});
  }
}

const trackReleases = (state, track) => state.tracks.find((t) => t.track === track)?.releases ?? [];

async function loadPlayState(args, onError) {
  const keyPath = resolveKeyPath(args.key);
  if (!keyPath) return { keyPath: null, playState: null };
  try {
    const token = await getAccessToken(keyPath);
    return { keyPath, playState: await readPlayState(token, args.package ?? DEFAULT_PACKAGE) };
  } catch (e) {
    onError?.(e);
    return { keyPath, playState: null };
  }
}

// ---------------------------------------------------------------- check

async function commandCheck(args, { quiet = false } = {}) {
  const local = readLocalVersions();
  const changelog = readChangelog();
  const gradle = readGradleVersions();
  const gitState = local.version ? readGitState(local.version) : null;

  head("バージョン（宣言）");
  if (!local.version) fail("app.config.ts から version を読めなかった");
  else ok(`app.config.ts version = ${local.version}`);
  if (local.packageVersion !== local.version) fail(`package.json version = ${local.packageVersion}（app.config.ts と違う）`);
  else ok(`package.json version = ${local.packageVersion}`);
  if (Number.isNaN(local.versionCode)) fail("app.config.ts から android.versionCode を読めなかった");
  else ok(`app.config.ts versionCode = ${local.versionCode}`);

  if (changelog.latest?.name === local.version) {
    ok(`CHANGELOG の最新の節 = [${changelog.latest.name}] - ${changelog.latest.date ?? "日付なし"}`);
    if (!changelog.latest.date) fail("CHANGELOG のその節に日付が無い（`## [x.y.z] - YYYY-MM-DD`）");
  } else {
    fail(`CHANGELOG の最新の節が [${changelog.latest?.name ?? "なし"}]（version は ${local.version}）`);
  }
  const unreleasedLines = (changelog.unreleased?.body ?? "").split("\n").filter((l) => l.startsWith("- ")).length;
  if (unreleasedLines > 0) warn(`CHANGELOG の [Unreleased] に ${unreleasedLines} 行残っている（次の版のぶんならこのままでよい）`);
  else ok("CHANGELOG の [Unreleased] は空");

  head("git");
  if (gitState) {
    if (gitState.dirty) fail("作業ツリーに未コミットの変更がある");
    else ok("作業ツリーは clean");
    if (!gitState.tagged) warn(`タグ ${gitState.tag} がまだ無い（ストアに出すコミットへ打つ）`);
    else if (gitState.tagCommit !== gitState.head) warn(`タグ ${gitState.tag} は HEAD ではなく ${gitState.tagCommit?.slice(0, 7)} を指す`);
    else ok(`タグ ${gitState.tag} = HEAD`);
    if (gitState.unpushed > 0) fail(`origin/main へ未pushのコミットが ${gitState.unpushed} 件（タグだけ公開されて本体が残る事故のもと）`);
    else ok("origin/main へ push 済み");
  }

  head("ネイティブ（prebuild の反映）");
  if (!gradle) warn("android/app/build.gradle が無い（prebuild していない）");
  else {
    if (gradle.versionCode !== local.versionCode) fail(`build.gradle versionCode = ${gradle.versionCode}（app.config.ts は ${local.versionCode}。prebuild が要る）`);
    else ok(`build.gradle versionCode = ${gradle.versionCode}`);
    if (gradle.versionName !== local.version) fail(`build.gradle versionName = ${gradle.versionName}（app.config.ts は ${local.version}。prebuild が要る）`);
    else ok(`build.gradle versionName = ${gradle.versionName}`);
  }

  head("AAB（実物）");
  const aabPath = args.aab ?? DEFAULT_AAB;
  const expectedPackage = args.package ?? DEFAULT_PACKAGE;
  let aab = null;
  if (!existsSync(aabPath)) {
    fail(`AAB が無い: ${aabPath.replace(ROOT, ".")}（node scripts/release.mjs build）`);
  } else {
    aab = readAab(aabPath);
    ok(`${basename(aab.path)} ${bytes(aab.size)} / ビルド ${aab.mtime.toISOString()}`);
    if (aab.package !== expectedPackage) fail(`AAB の package = ${aab.package}（期待は ${expectedPackage}）`);
    else ok(`AAB の package = ${aab.package}`);
    if (aab.versionName !== local.version) fail(`AAB の versionName = ${aab.versionName}（宣言は ${local.version}）`);
    else ok(`AAB の versionName = ${aab.versionName}`);
    if (aab.versionCode !== local.versionCode) fail(`AAB の versionCode = ${aab.versionCode}（宣言は ${local.versionCode}）`);
    else ok(`AAB の versionCode = ${aab.versionCode}`);
    const newest = newestSourceMtime();
    if (newest.mtime > aab.mtime.getTime()) fail(`AAB よりソースの方が新しい（${newest.path?.replace(ROOT, ".")}）。ビルドし直す`);
    else ok("AAB はいまのソースより新しい");
    ok(`sha1 ${aab.sha1}`);
    ok(`権限 ${aab.permissions.length} 個: ${aab.permissions.map((p) => p.replace("android.permission.", "")).join(", ")}`);
  }

  const { keyPath, playState } = await loadPlayState(args, (e) => warn(`Play に問い合わせられなかった: ${e.message}`));

  head("リリースノート");
  const locales = playState?.locales?.length ? playState.locales : FALLBACK_LOCALES;
  if (!playState) warn(`掲載言語を Play から取れないので既定の ${locales.length} 言語で見る（鍵: --key）`);
  const notes = readNotes(local.version);
  for (const locale of locales) {
    const text = notes[locale];
    if (!text) fail(`${locale} のリリースノートが無い（node scripts/release.mjs notes）`);
    else if (text.includes("TODO")) fail(`${locale} のリリースノートに TODO が残っている`);
    else if (text.length > NOTE_LIMIT) fail(`${locale} のリリースノートが ${text.length} 字（上限 ${NOTE_LIMIT}）`);
    else ok(`${locale} ${String(text.length).padStart(3)} 字`);
  }
  const extra = Object.keys(notes).filter((l) => !locales.includes(l));
  if (extra.length) warn(`掲載に無い言語のノートがある: ${extra.join(", ")}`);

  if (playState) {
    head("Play（実測）");
    const used = playState.bundles.map((b) => b.versionCode).sort((a, b) => a - b);
    ok(`使用済み versionCode: ${used.join(", ") || "なし"}（次に空いているのは ${Math.max(0, ...used) + 1}）`);
    const mine = playState.bundles.find((b) => b.versionCode === local.versionCode);
    if (!mine) ok(`versionCode ${local.versionCode} は未使用（アップロードできる）`);
    else if (aab && mine.sha1 === aab.sha1) ok(`versionCode ${local.versionCode} は**この AAB そのもの**がアップロード済み（sha1 一致）`);
    else fail(`versionCode ${local.versionCode} は別の AAB で使用済み（Play 側の sha1 ${mine.sha1}）。versionCode を上げる`);
    for (const track of playState.tracks) {
      const rel = (track.releases ?? []).map((r) => `${r.name ?? "(名前なし)"} [${(r.versionCodes ?? []).join(",")}] ${r.status}`);
      ok(`トラック ${track.track}: ${rel.join(" / ") || "配信なし"}`);
    }
  }

  if (!quiet) {
    head("結果");
    const counts = results.reduce((a, [l]) => ({ ...a, [l]: (a[l] ?? 0) + 1 }), {});
    console.log(`  OK ${counts.ok ?? 0} / 注意 ${counts.warn ?? 0} / NG ${counts.fail ?? 0}`);
  }
  return { local, changelog, gitState, aab, notes, locales, playState, keyPath };
}

// ---------------------------------------------------------------- notes

async function commandNotes(args) {
  const { version, versionCode } = readLocalVersions();
  const changelog = readChangelog();
  const dir = notesDir(version);
  mkdirSync(dir, { recursive: true });

  const { playState } = await loadPlayState(args, (e) => console.log(`  注意 Play に問い合わせられなかった: ${e.message}`));
  const locales = playState?.locales?.length ? playState.locales : FALLBACK_LOCALES;

  // Play に載っているノートは2通りに分かれる。**この versionCode そのもののノートは確定した本文**
  // （既に配信されていて、利用者がその文面を読んでいる）なので TODO を付けずそのまま取り込む
  // ——リポジトリに控えが無いまま Play にだけ文面がある状態を解消するのがこの経路。
  // 別の versionCode のノートは前の版の文面なので、訳のトーンを引き継ぐ下敷きとしてだけ置き、
  // TODO を付けて書き直しを強制する。
  let current = null;
  let previous = null;
  if (playState) {
    for (const track of ["production", "beta", "alpha", "internal"]) {
      for (const rel of trackReleases(playState, track)) {
        if (!rel.releaseNotes?.length) continue;
        if ((rel.versionCodes ?? []).includes(String(versionCode))) current ??= rel;
        else previous ??= rel;
      }
    }
  }
  const fromPlay = current ?? (args.fromPlay ? previous : null);
  const verbatim = fromPlay === current && current !== null;

  // リリース済みの節が無ければ [Unreleased] を使う（リリース前に下書きを作る流れ）。
  const section = changelog.sections.find((s) => s.name === version) ?? changelog.unreleased;
  const draft = draftFromChangelog(section);

  console.log(`\nリリースノート: ${dir.replace(ROOT, ".")}`);
  console.log(verbatim
    ? `  元にするもの: Play の「${current.name}」（versionCode ${versionCode} の確定した本文）`
    : `  元にするもの: CHANGELOG の [${section?.name ?? "?"}]${fromPlay ? ` ＋ 下敷きに Play の「${fromPlay.name}」` : ""}`);
  for (const locale of locales) {
    const file = join(dir, `${locale}.txt`);
    if (existsSync(file) && !args.force) {
      console.log(`  そのまま ${locale}.txt（--force で作り直す）`);
      continue;
    }
    const played = fromPlay?.releaseNotes?.find((n) => n.language === locale)?.text;
    let body;
    if (verbatim && played) body = played;
    else if (locale === "ja-JP" && draft) body = draft;
    else if (played) body = `TODO: ${version} の内容へ書き直す（下は「${fromPlay.name}」の文面）\n${played}`;
    else body = `TODO: ${locale} のリリースノートを書く（${NOTE_LIMIT}字以内）`;
    writeFileSync(file, `${body}\n`, "utf8");
    console.log(`  作成   ${locale}.txt（${body.length} 字）`);
  }
  if (!verbatim) {
    console.log("\n日本語だけ下書きが入っている。**他の言語は訳して TODO を消すこと**");
    console.log("（機械翻訳をこのスクリプトに入れていないのは、誰も読まないまま en-US に日本語が出る事故を避けるため）");
  }
}

// ---------------------------------------------------------------- build

function run(cmd, cmdArgs, cwd = ROOT) {
  console.log(`\n$ ${cmd} ${cmdArgs.join(" ")}`);
  const r = spawnSync(cmd, cmdArgs, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) throw new Error(`${cmd} が失敗した（終了コード ${r.status}）`);
}

function commandBuild(args) {
  const local = readLocalVersions();
  console.log(`${local.version}（versionCode ${local.versionCode}）の release AAB を作る`);
  if (!existsSync(join(ROOT, "credentials.json"))) {
    // これが無いと release はデバッグ鍵で署名され、Play が受け取らない（plugins/withLocalReleaseSigning.js）。
    throw new Error("credentials.json が無い。デバッグ鍵で署名された AAB は Play に弾かれる（eas credentials -p android で落とす）");
  }
  if (!args.skipPrebuild) run("npx", ["expo", "prebuild", "-p", "android", "--no-install"]);
  // cmd.exe は cwd から実行ファイルを解決しない（PATH だけを見る）ので `.\` が要る。付け忘れると
  // 「内部コマンドまたは外部コマンド…として認識されていません」で prebuild だけ通って落ちる。
  run(process.platform === "win32" ? ".\\gradlew.bat" : "./gradlew", ["bundleRelease"], join(ROOT, "android"));
  const aab = readAab(DEFAULT_AAB);
  console.log(`\nできた: ${DEFAULT_AAB.replace(ROOT, ".")}`);
  console.log(`  ${aab.package} / ${aab.versionName} (${aab.versionCode}) / ${bytes(aab.size)} / sha1 ${aab.sha1}`);
}

// ---------------------------------------------------------------- pack

async function commandPack(args) {
  const state = await commandCheck(args, { quiet: true });
  const { local, aab, notes, locales, playState, gitState } = state;
  if (!aab) throw new Error("AAB が無いので集められない（node scripts/release.mjs build）");

  const dir = join(RELEASE_ROOT, `v${local.version}`);
  mkdirSync(join(dir, "release-notes"), { recursive: true });
  const aabName = `unitcalc-v${local.version}-${aab.versionCode}.aab`;
  copyFileSync(aab.path, join(dir, aabName));
  for (const [locale, text] of Object.entries(notes)) {
    writeFileSync(join(dir, "release-notes", `${locale}.txt`), `${text}\n`, "utf8");
  }
  writeFileSync(
    join(dir, "checksums.txt"),
    [`file   ${aabName}`, `size   ${aab.size}`, `sha1   ${aab.sha1}`, `sha256 ${aab.sha256}`, ""].join("\n"),
    "utf8",
  );

  const mark = (l) => (l === "fail" ? "**NG**" : l === "warn" ? "注意" : "OK");
  // 「タグがある」だけでは足りない。**そのタグが HEAD を指していなければ**、ここで集めた
  // AAB とタグが別のコミットを指すことになる（CLAUDE.md にある v1.3.0 の食い違いと同じ形）。
  const taggedHere = Boolean(gitState?.tagged && gitState.tagCommit === gitState.head);
  const md = [
    `# UnitCalc ${local.version}（versionCode ${aab.versionCode}）`,
    "",
    `- AAB: \`${aabName}\` ${bytes(aab.size)}`,
    `- sha1: \`${aab.sha1}\``,
    `- package: \`${aab.package}\``,
    `- ビルド: ${aab.mtime.toISOString()}`,
    `- コミット: \`${gitState?.head?.slice(0, 7) ?? "?"}\`${taggedHere ? `（タグ ${gitState.tag}）` : gitState?.tagged ? `（タグ ${gitState.tag} は ${gitState.tagCommit?.slice(0, 7)} を指す）` : "（タグ未作成）"}`,
    "",
    "## 権限（AAB の実測）",
    "",
    ...aab.permissions.map((p) => `- \`${p}\``),
    "",
    "## リリースノート",
    "",
    ...locales.map((l) => `- ${l}: ${notes[l] ? `${notes[l].length} 字` : "**無し**"}`),
    "",
    ...(playState
      ? [
          "## Play の状況（このファイルを作った時点）",
          "",
          `- 使用済み versionCode: ${playState.bundles.map((b) => b.versionCode).join(", ") || "なし"}`,
          ...playState.tracks.map((t) => `- ${t.track}: ${(t.releases ?? []).map((r) => `${r.name} [${(r.versionCodes ?? []).join(",")}] ${r.status}`).join(" / ") || "配信なし"}`),
          "",
        ]
      : []),
    "## 検査",
    "",
    ...results.map(([l, m]) => `- ${mark(l)} ${m}`),
    "",
    "## 次の手順",
    "",
    // タグの扱いは3通りに分かれる。**別のコミットに付いているタグを付け替えないこと**——
    // タグは「実際にストアへ出したコードそのもの」を指す約束なので、動かすと嘘になる。
    ...(taggedHere || !gitState
      ? [`1. \`node scripts/release.mjs upload --commit --track ${args.track ?? "alpha"}\``]
      : gitState.tagged
        ? [
            `1. **タグ ${gitState.tag} は既に ${gitState.tagCommit?.slice(0, 7)} を指している。** 付け替えず、この AAB が本当にその版か確かめる（違うなら version を上げる）`,
            `2. \`node scripts/release.mjs upload --commit --track ${args.track ?? "alpha"}\``,
          ]
        : [
            `1. \`git tag -a ${gitState.tag} ${gitState.head?.slice(0, 7)} -m "UnitCalc ${local.version} (versionCode ${aab.versionCode}) sha1 ${aab.sha1}"\``,
            `2. \`git push origin main && git push origin ${gitState.tag}\``,
            `3. \`node scripts/release.mjs upload --commit --track ${args.track ?? "alpha"}\``,
          ]),
    "",
  ].join("\n");
  writeFileSync(join(dir, "SUMMARY.md"), md, "utf8");

  console.log(`\n集めた: ${dir.replace(ROOT, ".")}`);
  for (const f of readdirSync(dir)) console.log(`  ${f}`);
  if (hasFailure()) console.log("\n**NG がある。SUMMARY.md を見て直してからアップロードすること**");
}

// ---------------------------------------------------------------- upload

async function commandUpload(args) {
  const state = await commandCheck(args, { quiet: true });
  const { local, aab, notes, locales, playState, keyPath } = state;
  const pkg = args.package ?? DEFAULT_PACKAGE;
  const track = args.track ?? "alpha";
  const status = args.status ?? "completed";
  const mode = args.commit ? "commit" : args.validate ? "validate" : "dry-run";

  head("これから送るもの");
  console.log(`  モード   ${mode}${mode === "dry-run" ? "（通信しない。--validate / --commit で先へ）" : ""}`);
  console.log(`  package  ${pkg}`);
  console.log(`  トラック ${track} / status ${status}`);
  console.log(`  リリース UnitCalc ${local.version}`);
  console.log(`  AAB      ${aab ? `${basename(aab.path)} versionCode ${aab.versionCode} ${bytes(aab.size)}` : "**無し**"}`);
  for (const l of locales) console.log(`  ノート   ${l} ${notes[l] ? `${notes[l].length} 字` : "**無し**"}`);

  if (mode === "dry-run") {
    // ドライランは何も送らないので、NG があっても例外にしない（先に全部見せる。
    // 終了コードは main が results から立てる）。
    console.log(hasFailure()
      ? "\nドライラン終了。**上の NG を直すまで --commit は通らない。** Play は何も変わっていない。"
      : "\nドライラン終了。Play は何も変わっていない。");
    return;
  }
  if (hasFailure() && !args.force) throw new Error("検査に NG がある。直すか --force を付ける（--force は自己責任）");
  if (!keyPath) throw new Error("鍵が要る（--key path/to/service-account.json）");
  if (!aab) throw new Error("AAB が無い");

  const already = playState?.bundles.find((b) => b.versionCode === aab.versionCode && b.sha1 === aab.sha1);
  if (mode === "validate") {
    // **AAB は送らない。** 一度送った versionCode は edit を捨てても使用済みとして残りうるので、
    // 「お試しで送る」を用意しない。ここで見るのは衝突とトラックの現状だけ。
    console.log("\nvalidate: versionCode の衝突とトラックの現状を読んだだけ。AAB は送っていない。");
    console.log(already ? "  この AAB は既に Play にある（--commit ではアップロードを飛ばす）" : "  この AAB はまだ Play に無い");
    return;
  }

  const token = await getAccessToken(keyPath);
  const edit = await api(token, "POST", `/applications/${pkg}/edits`);
  console.log(`\nedit ${edit.id} を作った`);
  try {
    if (already) {
      console.log(`  versionCode ${aab.versionCode} は同じ sha1 で既にある。アップロードは飛ばす`);
    } else {
      console.log(`  AAB を送る（${bytes(aab.size)}。数分かかる）…`);
      const uploaded = await api(token, "POST", `${UPLOAD_API}/applications/${pkg}/edits/${edit.id}/bundles?uploadType=media`, {
        body: readFileSync(aab.path),
        contentType: "application/octet-stream",
      });
      console.log(`  送った: versionCode ${uploaded?.versionCode} sha1 ${uploaded?.sha1}`);
      if (uploaded?.sha1 && uploaded.sha1 !== aab.sha1) throw new Error("Play が返した sha1 がローカルと違う");
    }
    await api(token, "PUT", `/applications/${pkg}/edits/${edit.id}/tracks/${track}`, {
      json: {
        track,
        releases: [
          {
            name: `UnitCalc ${local.version}`,
            versionCodes: [String(aab.versionCode)],
            status,
            releaseNotes: locales.filter((l) => notes[l]).map((l) => ({ language: l, text: notes[l] })),
          },
        ],
      },
    });
    console.log(`  トラック ${track} を更新した`);
    await api(token, "POST", `/applications/${pkg}/edits/${edit.id}:commit`);
    console.log("\ncommit した。**ここから Play 側の処理（と審査）に入る**");
  } catch (e) {
    await api(token, "DELETE", `/applications/${pkg}/edits/${edit.id}`).catch(() => {});
    throw e;
  }
}

// ---------------------------------------------------------------- 引数

const USAGE = `
node scripts/release.mjs <command> [options]

  check    バージョンの整合・AAB の中身・リリースノート・Play の実測を突き合わせる（既定）
  notes    docs/release-notes/vX.Y.Z/ にリリースノートの雛形を作る（--from-play で前版を下敷きに）
  build    prebuild + gradlew bundleRelease で署名済み AAB を作る
  pack     release/vX.Y.Z/ に AAB・チェックサム・ノート・SUMMARY.md を集める
  upload   Play へ上げる（既定はドライラン。--validate で読むだけ、--commit で実行）
  ship     check → build → pack を通しで

  --key <path>      サービスアカウントの鍵（既定: play-service-account-unitcalc.json があれば使う）
  --package <id>    パッケージ名（既定: ${DEFAULT_PACKAGE}）
  --aab <path>      AAB のパス（既定: android/app/build/outputs/bundle/release/app-release.aab）
  --track <name>    alpha / beta / internal / production（既定: alpha）
  --status <s>      completed / draft / inProgress（既定: completed）
  --force           検査に NG があっても続ける
  --skip-prebuild   build で prebuild を飛ばす
`;

function parseArgs(argv) {
  const args = { command: "check" };
  const rest = [...argv];
  if (rest[0] && !rest[0].startsWith("-")) args.command = rest.shift();
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    const next = () => rest[++i];
    if (a === "--key") args.key = next();
    else if (a === "--package") args.package = next();
    else if (a === "--aab") args.aab = next();
    else if (a === "--track") args.track = next();
    else if (a === "--status") args.status = next();
    else if (a === "--commit") args.commit = true;
    else if (a === "--validate") args.validate = true;
    else if (a === "--from-play") args.fromPlay = true;
    else if (a === "--force") args.force = true;
    else if (a === "--skip-prebuild") args.skipPrebuild = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else throw new Error(`知らない引数: ${a}${USAGE}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(USAGE); return; }
  switch (args.command) {
    case "check": await commandCheck(args); break;
    case "notes": await commandNotes(args); break;
    case "build": commandBuild(args); break;
    case "pack": await commandPack(args); break;
    case "upload": await commandUpload(args); break;
    case "ship":
      await commandCheck(args, { quiet: true });
      if (hasFailure() && !args.force) throw new Error("検査に NG がある。直すか --force");
      commandBuild(args);
      results.length = 0;
      await commandPack(args);
      break;
    default: throw new Error(`知らないコマンド: ${args.command}${USAGE}`);
  }
  if (hasFailure()) process.exitCode = 1;
}

main().catch((e) => {
  console.error(`\n失敗: ${e.message}`);
  process.exitCode = 1;
});
