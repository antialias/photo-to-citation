import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["test/e2e/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 120000,
    threads: false,
  },
});
