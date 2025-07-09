import { getCases } from "@/lib/caseStore";
import type { ReactNode } from "react";
import { SessionContext } from "../server-context";
import CasesLayoutClient from "./CasesLayoutClient";

export const dynamic = "force-dynamic";

export default async function CasesLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id?: string }>;
}) {
  await params;
  const session = SessionContext.read();
  const list = getCases();
  const cases = session ? list : list.filter((c) => c.public);
  return <CasesLayoutClient initialCases={cases}>{children}</CasesLayoutClient>;
}
