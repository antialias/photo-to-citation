"use client";
import CaseChat from "@/app/cases/[id]/CaseChat";
import CaseLayout from "@/app/components/CaseLayout";
import CaseProgressGraph from "@/app/components/CaseProgressGraph";
import DebugWrapper from "@/app/components/DebugWrapper";
import type { Case } from "@/lib/caseStore";
import { CaseProvider, useCaseContext } from "./CaseContext";
import CaseDetails from "./components/CaseDetails";
import CaseExtraInfo from "./components/CaseExtraInfo";
import CaseHeader from "./components/CaseHeader";
import ClaimBanner from "./components/ClaimBanner";
import PhotoSection from "./components/PhotoSection";

function CasePageContent({
  caseId,
  readOnly,
}: { caseId: string; readOnly?: boolean }) {
  const {
    caseData,
    showClaimBanner,
    setHideClaimBanner,
    chatExpanded,
    setChatExpanded,
    dragging,
    setDragging,
    handleUpload,
    fileInputRef,
    hasCamera,
    removePhoto,
    reanalyzingPhoto,
    requestValue,
    progress,
    progressDescription,
    analysisActive,
    photoNote,
    updatePhotoNote,
    reanalyzePhoto,
    selectedPhoto,
    setSelectedPhoto,
    copied,
    copyPublicUrl,
    ownerContact,
    isAdmin,
    violationIdentified,
    isPhotoReanalysis,
    plateNumberOverridden,
    plateStateOverridden,
    vin,
    vinOverridden,
    note,
    updateVin,
    clearVin,
    updateNote,
    updatePlateNumber,
    updatePlateState,
    clearPlateNumber,
    clearPlateState,
    retryAnalysis,
    togglePublic,
    toggleClosed,
    toggleArchived,
    members,
    canManageMembers,
    inviteMember,
    removeMember,
  } = useCaseContext();

  if (!caseData) {
    return (
      <div className="p-8 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Uploading...</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Uploading photo...
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
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                setDragging(false);
            }
      }
      onDrop={
        readOnly
          ? undefined
          : async (e) => {
              e.preventDefault();
              await handleUpload(
                e as unknown as React.ChangeEvent<HTMLInputElement>,
              );
              setDragging(false);
            }
      }
    >
      <ClaimBanner
        show={showClaimBanner}
        onDismiss={() => setHideClaimBanner(true)}
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
        <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center pointer-events-none text-xl z-10">
          Drop to add photos
        </div>
      )}
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
    </div>
  );
}

export default function ClientCasePage({
  initialCase,
  caseId,
  initialIsAdmin = false,
  readOnly = false,
}: {
  initialCase: Case | null;
  caseId: string;
  initialIsAdmin?: boolean;
  readOnly?: boolean;
}) {
  return (
    <CaseProvider
      initialCase={initialCase}
      caseId={caseId}
      initialIsAdmin={initialIsAdmin}
      readOnly={readOnly}
    >
      <CasePageContent caseId={caseId} readOnly={readOnly} />
    </CaseProvider>
  );
}
