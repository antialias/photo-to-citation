"use client";
import type { Case } from "@/lib/caseStore";
import { useRouter, useSearchParams } from "next/navigation";
import FollowUpModal from "./followup/FollowUpModal";
import ClientThreadPage from "./thread/ClientThreadPage";

export default function ThreadWrapper({
  caseData,
  caseId,
  startId,
}: {
  caseData: Case | null;
  caseId: string;
  startId: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const followup = params.get("followup");
  return (
    <>
      <ClientThreadPage
        caseId={caseId}
        initialCase={caseData}
        startId={startId}
      />
      {followup ? (
        <FollowUpModal
          caseId={caseId}
          replyTo={startId}
          onClose={() =>
            router.push(
              `/cases/${caseId}/thread/${encodeURIComponent(startId)}`,
            )
          }
        />
      ) : null}
    </>
  );
}
