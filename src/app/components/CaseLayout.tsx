import { space } from "@/styleTokens";
import type { ReactNode } from "react";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";

export default function CaseLayout({
  header,
  left,
  right,
  children,
}: {
  header: ReactNode;
  left: ReactNode;
  right: ReactNode;
  children?: ReactNode;
}) {
  const styles = {
    wrapper: css({
      p: space.container,
      display: "flex",
      flexDirection: "column",
      gap: space.gap,
    }),
    header: css({
      position: "sticky",
      top: 0,
      backgroundColor: {
        base: token("colors.white"),
        _dark: token("colors.gray.900"),
      },
      zIndex: "var(--z-sticky)",
    }),
    grid: css({
      display: "grid",
      gridTemplateColumns: { base: "1fr", md: "35% 65%", lg: "30% 70%" },
      gap: { base: space.gap, md: "6" },
    }),
    right: css({ display: "flex", flexDirection: "column", gap: space.gap }),
  };
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>{header}</div>
      <div className={styles.grid}>
        <div>{left}</div>
        <div className={styles.right}>{right}</div>
      </div>
      {children}
    </div>
  );
}
