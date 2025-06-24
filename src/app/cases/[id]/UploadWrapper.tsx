"use client";
import type { Case } from "@/lib/caseStore";
import { useRouter } from "next/navigation";
import ClientCasePage from "./ClientCasePage";
import UploadModal from "./upload/UploadModal";

export default function UploadWrapper({
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
      <UploadModal
        caseId={caseId}
        onClose={() => router.push(`/cases/${caseId}`)}
      />
    </>
  );
}
