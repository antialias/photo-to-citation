"use client";
import type { Case } from "@/lib/caseStore";
import { useRouter, useSearchParams } from "next/navigation";
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
  const params = useSearchParams();
  const replyTo = params.get("replyTo") || undefined;
  return (
    <>
      <ClientCasePage initialCase={caseData} caseId={caseId} />
      <FollowUpModal
        caseId={caseId}
        replyTo={replyTo || undefined}
        onClose={() => router.push(`/cases/${caseId}`)}
      />
    </>
  );
}
