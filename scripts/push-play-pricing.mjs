#!/usr/bin/env node
// docs/pro-pricing.csv の価格を Google Play の買い切り商品へ反映する。
// 既定はドライラン。反映には --commit を明示する。
import { createSign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const CSV_PATH = join(ROOT, "docs", "pro-pricing.csv");
const API = "https://androidpublisher.googleapis.com/androidpublisher/v3";
const DEFAULT_PACKAGE = "com.app.siunitcalculator";
const DEFAULT_SKU = "pro_lifetime";

function parseArgs(argv) {
  const args = { mode: "dry-run", package: DEFAULT_PACKAGE, sku: DEFAULT_SKU, key: null, list: false };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--commit") args.mode = "commit";
    else if (value === "--dry-run") args.mode = "dry-run";
    else if (value === "--package") args.package = argv[++i];
    else if (value === "--sku") args.sku = argv[++i];
    else if (value === "--key") args.key = argv[++i];
    else if (value === "--list") args.list = true;
    else if (value === "--help" || value === "-h") args.help = true;
    else throw new Error(`不明な引数: ${value}`);
  }
  return args;
}

function parseCsv() {
  const lines = readFileSync(CSV_PATH, "utf8").replace(/\r\n/g, "\n").trim().split("\n");
  const header = lines.shift();
  if (header !== "region,currency,price_display,price_micros,basis") throw new Error("pro-pricing.csv の見出しが不正");

  const prices = {};
  for (const [index, line] of lines.entries()) {
    const [region, currency, display, micros] = line.split(",", 4);
    if (!/^[A-Z]{2}$/.test(region) || !/^[A-Z]{3}$/.test(currency)) throw new Error(`CSV ${index + 2}行目の地域・通貨が不正`);
    if (!/^\d+(\.\d{1,2})?$/.test(display) || !/^\d+$/.test(micros)) throw new Error(`CSV ${index + 2}行目の価格が不正`);
    prices[region] = { currency, priceMicros: micros };
  }
  if (Object.keys(prices).length !== lines.length) throw new Error("CSV内に重複した地域があります");
  return prices;
}

function microsToMoney(currencyCode, priceMicros) {
  const micros = BigInt(priceMicros);
  const units = micros / 1000000n;
  const nanos = Number((micros % 1000000n) * 1000n);
  return { currencyCode, units: units.toString(), nanos };
}

async function getAccessToken(keyPath) {
  const key = JSON.parse(readFileSync(keyPath, "utf8"));
  if (!key.client_email || !key.private_key) throw new Error(`サービスアカウントの鍵に見えない: ${keyPath}`);
  const now = Math.floor(Date.now() / 1000);
  const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
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
  const response = await fetch(claim.aud, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`トークン取得に失敗 (${response.status}): ${JSON.stringify(body)}`);
  return body.access_token;
}

async function api(token, method, path, json) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: json ? JSON.stringify(json) : undefined,
  });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* API gateway errors can be HTML */ }
  if (!response.ok) throw new Error(`${method} ${path} が ${response.status}: ${body?.error?.message ?? text.slice(0, 800)}`);
  return body;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("node scripts/push-play-pricing.mjs [--dry-run|--commit] [--sku pro_lifetime] [--key key.json]");
    return;
  }

  const prices = parseCsv();
  console.log(`商品: ${args.package}/${args.sku}`);
  console.log(`価格: ${Object.keys(prices).length}地域、CSV指定外は既存設定を保持`);
  for (const [region, price] of Object.entries(prices)) console.log(`  ${region}: ${price.currency} ${price.priceMicros} micros`);
  if (args.mode === "dry-run") {
    console.log("ドライラン。反映するには --commit を付ける。");
    return;
  }

  const keyPath = args.key ?? process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!keyPath || !existsSync(keyPath)) throw new Error("サービスアカウント鍵が必要（--key <path> または GOOGLE_PLAY_SERVICE_ACCOUNT_JSON）");
  const token = await getAccessToken(keyPath);
  if (args.list) {
    const result = await api(token, "GET", `/applications/${args.package}/oneTimeProducts`);
    const products = result?.oneTimeProducts ?? [];
    if (!products.length) console.log("買い切り商品が見つからない（販売アカウント設定または商品作成が必要）");
    for (const product of products) console.log(`${product.productId}: ${product.listings?.[0]?.title ?? "タイトルなし"}`);
    return;
  }
  const current = await api(token, "GET", `/applications/${args.package}/oneTimeProducts/${args.sku}`);
  if (!current.purchaseOptions?.length) throw new Error("購入オプションが見つからない");
  if (!current.regionsVersion?.version) throw new Error("商品のregionsVersionが見つからない");
  console.log(`既存商品を確認: ${current.productId} / ${current.purchaseOptions.length}購入オプション`);

  const purchaseOptions = current.purchaseOptions.map((purchaseOption, index) => {
    if (index !== 0) return purchaseOption;
    const existing = new Map((purchaseOption.regionalPricingAndAvailabilityConfigs ?? []).map((config) => [config.regionCode, config]));
    for (const [region, price] of Object.entries(prices)) {
      existing.set(region, { regionCode: region, price: microsToMoney(price.currency, price.priceMicros), availability: "AVAILABLE" });
    }
    return {
      ...purchaseOption,
      regionalPricingAndAvailabilityConfigs: [...existing.values()],
    };
  });
  const query = new URLSearchParams({
    updateMask: "purchaseOptions",
    "regionsVersion.version": current.regionsVersion.version,
  });
  const updated = await api(token, "PATCH", `/applications/${args.package}/onetimeproducts/${args.sku}?${query}`, {
    ...current,
    purchaseOptions,
  });
  const updatedConfigs = updated?.purchaseOptions?.[0]?.regionalPricingAndAvailabilityConfigs ?? [];
  const byRegion = new Map(updatedConfigs.map((config) => [config.regionCode, config.price]));
  for (const region of ["US", "JP", "GB", "BR"]) {
    const expected = prices[region];
    const actual = byRegion.get(region);
    const actualMicros = actual ? BigInt(actual.units ?? 0) * 1000000n + BigInt(actual.nanos ?? 0) / 1000n : null;
    if (!actual || actual.currencyCode !== expected.currency || actualMicros !== BigInt(expected.priceMicros)) {
      throw new Error(`${region} の反映確認に失敗（期待: ${expected.currency} ${expected.priceMicros}、実際: ${JSON.stringify(actual)}）`);
    }
  }
  console.log(`価格を反映した（${updatedConfigs.length}地域を確認、US/JP/GB/BR一致）。`);
}

main().catch((error) => {
  console.error(`\n失敗: ${error.message}`);
  process.exitCode = 1;
});