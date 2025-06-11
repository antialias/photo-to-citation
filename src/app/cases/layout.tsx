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
  return (
    <div className="grid grid-cols-[20%_80%] h-[calc(100vh-4rem)]">
      <div className="border-r overflow-y-auto">
        <ClientCasesPage initialCases={cases} />
      </div>
      <div className="overflow-y-auto">{children}</div>
    </div>
  );
}
