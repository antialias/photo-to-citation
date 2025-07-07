import { cva } from "styled-system/css";

export const menuItem = cva({
  base: {
    px: "4",
    py: "2",
    w: "full",
    textAlign: "left",
    _hover: { bg: "colors.surface-subtle" },
  },
});
