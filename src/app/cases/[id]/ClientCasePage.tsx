"use client";

import CaseChat from "@/app/cases/[id]/CaseChat";
import useDragReset from "@/app/cases/useDragReset";
import CaseJobList from "@/app/components/CaseJobList";
import CaseLayout from "@/app/components/CaseLayout";
import CaseProgressGraph from "@/app/components/CaseProgressGraph";
import DebugWrapper from "@/app/components/DebugWrapper";
import EditableText from "@/app/components/EditableText";
import MapPreview from "@/app/components/MapPreview";
import { useSession } from "@/app/useSession";
import type { Case } from "@/lib/caseStore";
import { getCaseOwnerContact, getOfficialCaseGps } from "@/lib/caseUtils";
import AnalysisStatus from "./components/AnalysisStatus";
import CaseExtraInfo from "./components/CaseExtraInfo";
import CaseHeader from "./components/CaseHeader";
import ClaimBanner from "./components/ClaimBanner";
import MemberList from "./components/MemberList";
import PhotoSection from "./components/PhotoSection";
import { CaseProvider, useCaseContext } from "./context/CaseContext";

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
      <ClientCasePageContent caseId={caseId} readOnly={readOnly} />
    </CaseProvider>
  );
}

function ClientCasePageContent({
  caseId,
  readOnly,
}: { caseId: string; readOnly: boolean }) {
  const {
    caseData,
    preview,
    dragging,
    setDragging,
    hideClaimBanner,
    setHideClaimBanner,
    chatExpanded,
    setChatExpanded,
    plate,
    vin,
    note,
    togglePublic,
    copied,
  } = useCaseContext();
  const { data: session } = useSession();
  const showClaimBanner = Boolean(
    caseData?.sessionId && !session?.user && !hideClaimBanner,
  );

  useDragReset(() => setDragging(false));

  if (!caseData) {
    return (
      <div className="p-8 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Uploading...</h1>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className="max-w-full" />
        ) : null}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Uploading photo...
        </p>
      </div>
    );
  }

  const ownerContact = getCaseOwnerContact(caseData);
  const g = getOfficialCaseGps(caseData);

  return (
    <div
      className={`relative h-full ${chatExpanded ? "md:grid md:grid-cols-2 gap-4 overflow-hidden" : ""}`}
      onDragOver={readOnly ? undefined : (e) => e.preventDefault()}
      onDragEnter={readOnly ? undefined : () => setDragging(true)}
      onDragLeave={
        readOnly
          ? undefined
          : (e) =>
              !e.currentTarget.contains(e.relatedTarget as Node) &&
              setDragging(false)
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
                <div className="order-first bg-gray-100 dark:bg-gray-800 p-4 rounded flex flex-col gap-2 text-sm">
                  <AnalysisStatus readOnly={readOnly} />
                  {ownerContact ? (
                    <p>
                      <span className="font-semibold">Owner:</span>{" "}
                      {ownerContact}
                    </p>
                  ) : null}
                  <p>
                    <span className="font-semibold">Created:</span>{" "}
                    {new Date(caseData.createdAt).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-semibold">Visibility:</span>{" "}
                    {caseData.public ? "Public" : "Private"}
                    {session?.user && !readOnly && (
                      <button
                        type="button"
                        onClick={togglePublic}
                        className="ml-2 text-blue-500 underline"
                        data-testid="toggle-public-button"
                      >
                        Make {caseData.public ? "Private" : "Public"}
                      </button>
                    )}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    {caseData.archived
                      ? "Archived"
                      : caseData.closed
                        ? "Closed"
                        : "Open"}
                  </p>
                  {caseData.streetAddress ? (
                    <p>
                      <span className="font-semibold">Address:</span>{" "}
                      {caseData.streetAddress}
                    </p>
                  ) : null}
                  {caseData.intersection ? (
                    <p>
                      <span className="font-semibold">Intersection:</span>{" "}
                      {caseData.intersection}
                    </p>
                  ) : null}
                  {g ? (
                    <MapPreview
                      lat={g.lat}
                      lon={g.lon}
                      width={600}
                      height={300}
                      className="w-full aspect-[2/1] md:max-w-xl"
                      link={`https://www.google.com/maps?q=${g.lat},${g.lon}`}
                    />
                  ) : null}
                  <p>
                    <span className="font-semibold">VIN:</span>{" "}
                    {readOnly ? (
                      <span>{vin || ""}</span>
                    ) : (
                      <EditableText
                        value={vin}
                        onSubmit={() => {}}
                        onClear={() => {}}
                        placeholder="VIN"
                      />
                    )}
                  </p>
                  <p>
                    <span className="font-semibold">Note:</span>{" "}
                    {readOnly ? (
                      <span>{note || ""}</span>
                    ) : (
                      <EditableText
                        value={note}
                        onSubmit={() => {}}
                        onClear={() => {}}
                        placeholder="Add note"
                      />
                    )}
                  </p>
                  <MemberList readOnly={readOnly} />
                </div>
              </DebugWrapper>
              <CaseJobList caseId={caseId} isPublic={caseData.public} />
              <PhotoSection readOnly={readOnly} />
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
