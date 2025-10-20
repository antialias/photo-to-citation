import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["test/e2e/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    maxConcurrency: 1,
    isolate: false,
    sequence: { concurrent: false },
    fileParallelism: false,
  },
});
