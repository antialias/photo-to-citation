import { defineConfig } from "@pandacss/dev";
import { buttonRecipe } from "./src/recipes/button";

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
          surface: { value: "var(--color-surface)" },
          "surface-subtle": { value: "var(--color-surface-subtle)" },
          "text-muted": { value: "var(--color-text-muted)" },
        },
        shadows: {
          default: { value: "{shadows.md}" },
        },
      },
      recipes: {
        button: buttonRecipe,
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
