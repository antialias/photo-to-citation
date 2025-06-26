import path from "node:path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    exclude: [...configDefaults.exclude, "test/e2e/**"],
    maxThreads: 2,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      all: true,
      thresholds: {
        lines: 32.55,
        functions: 44.53,
        branches: 53.09,
        statements: 32.55,
      },
    },
  },
});
