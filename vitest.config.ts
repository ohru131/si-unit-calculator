import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

// vitest はExpoの開発サーバーとは別プロセスで動くため、.env はここで明示的に読み込む必要がある。
const { parsed: envFromDotenv } = loadEnv();

/** アプリ本体と同じ「@/」エイリアスでライブラリを読み込めるようにする。 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    env: envFromDotenv,
  },
});
