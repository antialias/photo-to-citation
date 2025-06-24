"use client";
import type { EmailDraft } from "@/lib/caseReport";
import type { Case } from "@/lib/caseStore";
import type { ReportModule } from "@/lib/reportModules";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [draftData, setDraftData] = useState<{
    email: EmailDraft;
    attachments: string[];
    module: ReportModule;
  } | null>(null);

  useEffect(() => {
    interface HistoryState {
      draftData?: {
        email: EmailDraft;
        attachments: string[];
        module: ReportModule;
      };
    }
    const st: HistoryState | null =
      typeof window !== "undefined" ? (history.state as HistoryState) : null;
    if (st?.draftData) {
      setDraftData(st.draftData);
    }
  }, []);

  function handleClose() {
    router.push(`/cases/${caseId}`);
    if (typeof history !== "undefined") {
      const st = history.state ?? {};
      if (st.draftData) {
        st.draftData = undefined;
        history.replaceState(st, "", `/cases/${caseId}`);
      }
    }
  }
  return (
    <>
      <ClientCasePage initialCase={caseData} caseId={caseId} />
      <DraftModal
        caseId={caseId}
        initialData={draftData ?? undefined}
        onClose={handleClose}
      />
    </>
  );
}
