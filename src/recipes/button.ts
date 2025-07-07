import { defineRecipe } from "@pandacss/dev";

export const buttonRecipe = defineRecipe({
  className: "button",
  base: {
    px: "2",
    py: "1",
    borderRadius: "{radii.md}",
  },
  variants: {
    variant: {
      primary: { bg: "blue.600", color: "white" },
      danger: { bg: "red.600", color: "white" },
      warning: { bg: "orange.600", color: "black" },
      neutral: {
        bg: { base: "gray.200", _dark: "gray.700" },
        color: { base: "black", _dark: "white" },
      },
    },
  },
  defaultVariants: { variant: "primary" },
});
