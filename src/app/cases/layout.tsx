import type { ReactNode } from "react";
import { getCases } from "../../lib/caseStore";
import ClientCasesPage from "./ClientCasesPage";

export const dynamic = "force-dynamic";

export default async function CasesLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;
  const cases = getCases();
  const hasCase = Boolean(id);
  return (
    <div className="md:grid md:grid-cols-[20%_80%] h-[calc(100vh-4rem)]">
      <div
        className={`${hasCase ? "hidden md:block" : ""} border-r overflow-y-auto`}
      >
        <ClientCasesPage initialCases={cases} />
      </div>
      <div className={`${hasCase ? "" : "hidden md:block"} overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}
