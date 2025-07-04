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
    <div className="lg:grid lg:grid-cols-[20%_80%] h-[calc(100vh-4rem)]">
      <div className={`${hasCase ? "hidden lg:block" : ""} border-r h-full`}>
        <ClientCasesPage initialCases={initialCases} />
      </div>
      <div className={`${hasCase ? "" : "hidden lg:block"} overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}
