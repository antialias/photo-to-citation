"use client";
import type { Case } from "@/lib/caseStore";
import { useRouter } from "next/navigation";
import ClientCasePage from "./ClientCasePage";
import DraftModal from "./draft/DraftModal";

export default function ComposeWrapper({
  caseData,
  caseId,
}: {
  caseData: Case | null;
  caseId: string;
}) {
  const router = useRouter();
  return (
    <>
      <ClientCasePage initialCase={caseData} caseId={caseId} />
      <DraftModal
        caseId={caseId}
        onClose={() => router.push(`/cases/${caseId}`)}
      />
    </>
  );
}
