import type { ReactNode } from "react";
import { getCases } from "../../lib/caseStore";
import ClientCasesPage from "./ClientCasesPage";

export const dynamic = "force-dynamic";

export default function CasesLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { id?: string };
}) {
  const cases = getCases();
  const hasCase = Boolean(params.id);
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
