import tsParser from "@typescript-eslint/parser";
import eslintComments from "eslint-plugin-eslint-comments";

export default [
  {
    files: ["**/*.{js,ts,tsx,jsx}"],
    ignores: ["styled-system/**"],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      "eslint-comments": eslintComments,
    },
    rules: {
      "eslint-comments/no-use": "error",
    },
  },
  {
    files: ["src/jobs/workerWrapper.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
