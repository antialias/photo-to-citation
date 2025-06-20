"use client";
import type { Case } from "@/lib/caseStore";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
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
  return (
    <div className="md:grid md:grid-cols-[20%_80%] h-[calc(100vh-4rem)]">
      <div
        className={`${hasCase ? "hidden md:block" : ""} border-r overflow-y-auto`}
      >
        <ClientCasesPage initialCases={initialCases} />
      </div>
      <div className={`${hasCase ? "" : "hidden md:block"} overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}
