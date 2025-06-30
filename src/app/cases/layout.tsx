import { getAuthOptions } from "@/lib/authOptions";
import { getCases } from "@/lib/caseStore";
import { getServerSession } from "next-auth/next";
import type { ReactNode } from "react";
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
  const session = await getServerSession(getAuthOptions());
  const list = getCases();
  const cases = session ? list : list.filter((c) => c.public);
  return <CasesLayoutClient initialCases={cases}>{children}</CasesLayoutClient>;
}
