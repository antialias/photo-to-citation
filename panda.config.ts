import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Enable Panda's reset now that Tailwind is removed
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        colors: {
          overlay: { value: "rgba(0,0,0,0.5)" },
        },
        shadows: {
          default: { value: "{shadows.md}" },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
