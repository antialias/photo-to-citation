import type { ReactNode } from "react";
import { getCases } from "../../lib/caseStore";
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
  const cases = getCases();
  return <CasesLayoutClient initialCases={cases}>{children}</CasesLayoutClient>;
}
