import { authOptions } from "@/lib/authOptions";
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
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const list = getCases();
  const cases = session ? list : list.filter((c) => c.public);
  return (
    <CasesLayoutClient initialCases={cases} hasCase={Boolean(id)}>
      {children}
    </CasesLayoutClient>
  );
}
