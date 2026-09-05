/**
 * プリセット計算ノートのシードが全言語そろっているかを調べる開発用スクリプト。
 *
 * 使い方: npx tsx scripts/check-seed-translations.ts [対象ファイル...]
 *
 * LocalizedText は en 必須・他は任意（英語フォールバック）なので、翻訳が抜けていても
 * 型エラーにもテスト失敗にもならない。抜けたまま気付けるのは実機で英語が出たときだけなので、
 * 機械的に数える入口を用意する。
 */
import path from "node:path";

import { APP_LANGUAGES, AppLanguage } from "../lib/i18n";
import type { NotebookSeed } from "../lib/notebook-formulas/types";

type Localized = Record<string, unknown>;

const isLocalized = (value: unknown): value is Localized =>
  typeof value === "object" && value !== null && typeof (value as Localized).en === "string";

function missingFor(text: Localized): AppLanguage[] {
  return APP_LANGUAGES.filter((language) => typeof text[language] !== "string" || !(text[language] as string).trim());
}

function walk(value: unknown, trail: string, report: (path: string, missing: AppLanguage[]) => void) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${trail}[${index}]`, report));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  if (isLocalized(value as Localized)) {
    const missing = missingFor(value as Localized);
    if (missing.length) report(`${trail} "${(value as Localized).en}"`, missing);
    return;
  }
  for (const [key, child] of Object.entries(value)) walk(child, `${trail}.${key}`, report);
}

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) throw new Error("usage: npx tsx scripts/check-seed-translations.ts <file...>");
  let holes = 0;
  for (const file of files) {
    const module = (await import(path.resolve(file))) as Record<string, unknown>;
    for (const [name, value] of Object.entries(module)) {
      if (!Array.isArray(value)) continue;
      walk(value as NotebookSeed[], `${path.basename(file)}:${name}`, (where, missing) => {
        holes += 1;
        console.log(`✗ ${where} → 未翻訳: ${missing.join(", ")}`);
      });
    }
  }
  if (holes) {
    console.log(`\n${holes} 件の未翻訳`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${files.length} ファイルすべての文言が ${APP_LANGUAGES.join("/")} でそろっている`);
  }
}

void main();
