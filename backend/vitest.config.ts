import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    setupFiles: [path.resolve(__dirname, "tests/setup/test-database.ts")],
  },
});
