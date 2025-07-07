import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Disable the built-in reset to avoid conflicts with Tailwind
  preflight: false,

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      semanticTokens: {
        colors: {
          "surface-default": {
            value: { base: "{colors.white}", _dark: "{colors.gray.900}" },
          },
          "surface-subtle": {
            value: { base: "{colors.gray.100}", _dark: "{colors.gray.800}" },
          },
          "text-muted": {
            value: { base: "{colors.gray.500}", _dark: "{colors.gray.400}" },
          },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
