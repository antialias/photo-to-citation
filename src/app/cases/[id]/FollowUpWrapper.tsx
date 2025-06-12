"use client";
import type { Case } from "@/lib/caseStore";
import { useRouter } from "next/navigation";
import ClientCasePage from "./ClientCasePage";
import FollowUpModal from "./followup/FollowUpModal";

export default function FollowUpWrapper({
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
      <FollowUpModal
        caseId={caseId}
        onClose={() => router.push(`/cases/${caseId}`)}
      />
    </>
  );
}
