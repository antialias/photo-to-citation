import type { ReactNode } from "react";

export default function WidgetActions({
  children,
  centered = false,
  wrap = false,
}: {
  children: ReactNode;
  centered?: boolean;
  wrap?: boolean;
}) {
  const classes = ["flex", "gap-1"];
  if (centered) classes.push("justify-center");
  if (wrap) classes.push("flex-wrap");
  return <div className={classes.join(" ")}>{children}</div>;
}
