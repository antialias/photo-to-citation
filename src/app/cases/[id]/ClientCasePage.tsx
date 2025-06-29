"use client";

import CaseChat from "@/app/cases/[id]/CaseChat";
import useDragReset from "@/app/cases/useDragReset";
import CaseLayout from "@/app/components/CaseLayout";
import CaseProgressGraph from "@/app/components/CaseProgressGraph";
import DebugWrapper from "@/app/components/DebugWrapper";
import { useSession } from "@/app/useSession";
import type { Case } from "@/lib/caseStore";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CaseProvider, useCaseContext } from "./CaseContext";
import CaseDetails from "./components/CaseDetails";
import CaseExtraInfo from "./components/CaseExtraInfo";
import CaseHeader from "./components/CaseHeader";
import ClaimBanner from "./components/ClaimBanner";
import PhotoSection from "./components/PhotoSection";
import PublicViewBanner from "./components/PublicViewBanner";

function ClientCasePage({
  caseId,
  readOnly = false,
}: { caseId: string; readOnly?: boolean }) {
  const { caseData, uploadFiles } = useCaseContext();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const [hideClaimBanner, setHideClaimBanner] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useDragReset(() => setDragging(false));

  useEffect(() => {
    const stored = sessionStorage.getItem(`preview-${caseId}`);
    if (stored) setPreview(stored);
  }, [caseId]);

  const showClaimBanner = Boolean(
    caseData?.sessionId && !session?.user && !hideClaimBanner,
  );

  if (!caseData) {
    return (
      <div className="p-8 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">{t("uploading")}</h1>
        {preview ? (
          <img
            src={preview}
            alt="preview"
            className="max-w-full"
            loading="lazy"
          />
        ) : null}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("uploadingPhoto")}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative h-full ${chatExpanded ? "md:grid md:grid-cols-2 gap-4 overflow-hidden" : ""}`}
      onDragOver={readOnly ? undefined : (e) => e.preventDefault()}
      onDragEnter={
        readOnly
          ? undefined
          : (e) => {
              e.preventDefault();
              setDragging(true);
            }
      }
      onDragLeave={
        readOnly
          ? undefined
          : (e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragging(false);
              }
            }
      }
      onDrop={
        readOnly
          ? undefined
          : async (e) => {
              e.preventDefault();
              await uploadFiles(e.dataTransfer.files);
              setDragging(false);
            }
      }
    >
      <ClaimBanner
        show={showClaimBanner}
        onDismiss={() => setHideClaimBanner(true)}
        className={chatExpanded ? "md:col-span-2" : undefined}
      />
      <PublicViewBanner
        caseId={caseId}
        show={readOnly}
        className={chatExpanded ? "md:col-span-2" : undefined}
      />
      <div
        className={
          chatExpanded ? "md:col-span-1 h-full overflow-y-auto" : undefined
        }
      >
        <CaseLayout
          header={<CaseHeader caseId={caseId} readOnly={readOnly} />}
          left={<CaseProgressGraph caseData={caseData} />}
          right={
            <>
              <DebugWrapper data={caseData}>
                <CaseDetails readOnly={readOnly} />
              </DebugWrapper>
              <PhotoSection caseId={caseId} readOnly={readOnly} />
            </>
          }
        >
          <CaseExtraInfo caseId={caseId} />
        </CaseLayout>
      </div>
      {readOnly || !dragging ? null : (
        <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center pointer-events-none text-xl z-nav">
          {t("dropToAddPhotos")}
        </div>
      )}
      {readOnly ? null : (
        <div
          className={
            chatExpanded ? "md:col-span-1 h-full overflow-y-auto" : undefined
          }
        >
          <CaseChat
            caseId={caseId}
            expanded={chatExpanded}
            onExpandChange={setChatExpanded}
          />
        </div>
      )}
    </div>
  );
}

export default function ClientCasePageWithProvider(props: {
  initialCase: Case | null;
  caseId: string;
  readOnly?: boolean;
}) {
  return (
    <CaseProvider caseId={props.caseId} initialCase={props.initialCase}>
      <ClientCasePage caseId={props.caseId} readOnly={props.readOnly} />
    </CaseProvider>
  );
}
