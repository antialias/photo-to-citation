"use client";
import type { Case } from "@/lib/caseStore";
import { useParams } from "next/navigation";
import { type ReactNode, useRef } from "react";
import { css } from "styled-system/css";
import ClientCasesPage from "./ClientCasesPage";

export default function CasesLayoutClient({
  children,
  initialCases,
}: {
  children: ReactNode;
  initialCases: Case[];
}) {
  const params = useParams<{ id?: string }>();
  const hasCase = Boolean(params.id);
  const listRef = useRef<HTMLDivElement>(null);
  const styles = {
    container: css({
      h: "calc(100vh - 4rem)",
      display: { lg: "grid" },
      gridTemplateColumns: { lg: "20% 80%" },
    }),
    list: (show: boolean) =>
      css({
        overflowY: "auto",
        borderRightWidth: "1px",
        display: show ? "block" : { base: "none", lg: "block" },
      }),
    content: (show: boolean) =>
      css({
        overflowY: "auto",
        display: show ? { base: "none", lg: "block" } : "block",
      }),
  };
  return (
    <div className={styles.container}>
      <div ref={listRef} className={styles.list(!hasCase)}>
        <ClientCasesPage initialCases={initialCases} scrollElement={listRef} />
      </div>
      <div className={styles.content(!hasCase)}>{children}</div>
    </div>
  );
}
