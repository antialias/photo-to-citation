"use client";
import type { Case } from "@/lib/caseStore";
import { useRouter } from "next/navigation";
import ClientCasePage from "./ClientCasePage";
import NotifyOwnerModal from "./notify-owner/NotifyOwnerModal";

export default function NotifyOwnerWrapper({
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
      <NotifyOwnerModal
        caseId={caseId}
        onClose={() => router.push(`/cases/${caseId}`)}
      />
    </>
  );
}
