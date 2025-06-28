"use client";
import type { Case } from "@/lib/caseStore";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import ClientCasesPage from "./ClientCasesPage";

export default function CasesLayoutClient({
  children,
  initialCases,
  hasCase,
}: {
  children: ReactNode;
  initialCases: Case[];
  hasCase: boolean;
}) {
  const params = useParams<{ id?: string }>();
  const [currentHasCase, setCurrentHasCase] = useState(hasCase);
  useEffect(() => {
    setCurrentHasCase(Boolean(params.id));
  }, [params.id]);
  return (
    <div className="lg:grid lg:grid-cols-[20%_80%] h-[calc(100vh-4rem)]">
      <div
        className={`${currentHasCase ? "hidden lg:block" : ""} border-r overflow-y-auto`}
      >
        <ClientCasesPage initialCases={initialCases} />
      </div>
      <div
        className={`${currentHasCase ? "" : "hidden lg:block"} overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
}
