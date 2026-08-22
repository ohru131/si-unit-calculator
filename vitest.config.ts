import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** アプリ本体と同じ「@/」エイリアスでライブラリを読み込めるようにする。 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
