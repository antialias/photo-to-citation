"use client";

import { apiEventSource, apiFetch } from "@/apiClient";
import CaseChat from "@/app/cases/[id]/CaseChat";
import useDragReset from "@/app/cases/useDragReset";
import AnalysisInfo from "@/app/components/AnalysisInfo";
import CaseJobList from "@/app/components/CaseJobList";
import CaseLayout from "@/app/components/CaseLayout";
import CaseProgressGraph from "@/app/components/CaseProgressGraph";
import DebugWrapper from "@/app/components/DebugWrapper";
import EditableText from "@/app/components/EditableText";
import MapPreview from "@/app/components/MapPreview";
import useCaseAnalysisActive from "@/app/useCaseAnalysisActive";
import { useSession } from "@/app/useSession";
import { withBasePath } from "@/basePath";
import type { Case } from "@/lib/caseStore";
import {
  getCaseOwnerContact,
  getCasePlateNumber,
  getCasePlateState,
  getCaseVin,
  getOfficialCaseGps,
  getRepresentativePhoto,
  hasViolation,
} from "@/lib/caseUtils";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useNotify } from "../../components/NotificationProvider";
import CaseExtraInfo from "./components/CaseExtraInfo";
import CaseHeader from "./components/CaseHeader";
import ClaimBanner from "./components/ClaimBanner";
import PhotoGallery from "./components/PhotoGallery";
import PhotoViewer from "./components/PhotoViewer";

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
  const [caseData, setCaseData] = useState<Case | null>(initialCase);
  const analysisActive = useCaseAnalysisActive(
    caseId,
    caseData?.public ?? false,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(
    initialCase ? getRepresentativePhoto(initialCase) : null,
  );
  const [plate, setPlate] = useState<string>(
    initialCase ? getCasePlateNumber(initialCase) || "" : "",
  );
  const [plateState, setPlateState] = useState<string>(
    initialCase ? getCasePlateState(initialCase) || "" : "",
  );
  const [vin, setVin] = useState<string>(
    initialCase ? getCaseVin(initialCase) || "" : "",
  );
  const [note, setNote] = useState<string>(initialCase?.note || "");
  const [photoNote, setPhotoNote] = useState<string>("");
  const [members, setMembers] = useState<
    Array<{
      userId: string;
      role: string;
      name: string | null;
      email: string | null;
    }>
  >([]);
  const [inviteUserId, setInviteUserId] = useState("");
  const [copied, setCopied] = useState(false);
  const [reanalyzingPhoto, setReanalyzingPhoto] = useState<string | null>(null);
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.role === "admin" ||
    session?.user?.role === "superadmin" ||
    initialIsAdmin;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hideClaimBanner, setHideClaimBanner] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const notify = useNotify();
  const showClaimBanner = Boolean(
    caseData?.sessionId && !session?.user && !hideClaimBanner,
  );

  /* -------------------------------------------------------------------- */
  /*                               EFFECTS                                */
  /* -------------------------------------------------------------------- */

  useDragReset(() => {
    setDragging(false);
  });

  useEffect(() => {
    void caseId;
    setHideClaimBanner(false);
  }, [caseId]);

  useEffect(() => {
    void caseData?.sessionId;
    if (!caseData?.sessionId) {
      setHideClaimBanner(false);
    }
  }, [caseData?.sessionId]);

  useEffect(() => {
    if (
      "mediaDevices" in navigator &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      (location.protocol === "https:" || location.hostname === "localhost")
    ) {
      setHasCamera(true);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(`preview-${caseId}`);
    if (stored) setPreview(stored);
    apiFetch(`/api/cases/${caseId}`).then(async (res) => {
      if (res.ok) {
        const data = (await res.json()) as Case;
        setCaseData(data);
      }
    });
    apiFetch(`/api/cases/${caseId}/members`).then(async (res) => {
      if (res.ok) setMembers(await res.json());
    });
    const es = apiEventSource("/api/cases/stream");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as Case & { deleted?: boolean };
      if (data.id !== caseId) return;
      if (data.deleted) {
        setCaseData(null);
      } else {
        setCaseData(data);
        sessionStorage.removeItem(`preview-${caseId}`);
      }
    };
    return () => es.close();
  }, [caseId]);

  useEffect(() => {
    if (caseData) {
      setPlate(getCasePlateNumber(caseData) || "");
      setPlateState(getCasePlateState(caseData) || "");
      setVin(getCaseVin(caseData) || "");
      setNote(caseData.note || "");
      setSelectedPhoto((prev) => {
        const all = new Set<string>([
          ...caseData.photos,
          ...(caseData.threadImages ?? []).map((img) => img.url),
        ]);
        return prev && all.has(prev) ? prev : getRepresentativePhoto(caseData);
      });
    }
  }, [caseData]);

  useEffect(() => {
    if (caseData && selectedPhoto) {
      setPhotoNote(caseData.photoNotes?.[selectedPhoto] || "");
    }
  }, [caseData, selectedPhoto]);

  useEffect(() => {
    if (caseData?.analysisStatus !== "pending") {
      setReanalyzingPhoto(null);
    }
  }, [caseData?.analysisStatus]);

  /* -------------------------------------------------------------------- */
  /*                            API helpers                               */
  /* -------------------------------------------------------------------- */

  async function uploadFiles(files: FileList) {
    if (!files || files.length === 0) return;
    const results = await Promise.all(
      Array.from(files).map((file) => {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("caseId", caseId);
        return apiFetch("/api/upload", {
          method: "POST",
          body: formData,
        });
      }),
    );
    if (results.some((r) => !r.ok)) {
      notify("Failed to upload one or more files.");
      return;
    }
    const res = await apiFetch(`/api/cases/${caseId}`);
    if (res.ok) {
      const data = (await res.json()) as Case;
      setCaseData(data);
    } else {
      notify("Failed to refresh case after upload.");
    }
    router.refresh();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) await uploadFiles(files);
  }

  async function refreshCase() {
    const res = await apiFetch(`/api/cases/${caseId}`);
    if (res.ok) {
      const data = (await res.json()) as Case;
      setCaseData(data);
    } else {
      notify("Failed to refresh case.");
    }
  }

  async function updateVehicle(plateNum: string, plateSt: string) {
    const res = await apiFetch(`/api/cases/${caseId}/override`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle: {
          licensePlateNumber: plateNum || undefined,
          licensePlateState: plateSt || undefined,
        },
      }),
    });
    if (!res.ok) {
      notify("Failed to update vehicle information.");
      return;
    }
    await refreshCase();
  }

  async function updatePlateNumber(value: string) {
    setPlate(value);
    await updateVehicle(value, plateState);
  }

  async function updatePlateStateFn(value: string) {
    setPlateState(value);
    await updateVehicle(plate, value);
  }

  async function clearPlateNumber() {
    setPlate("");
    await updateVehicle("", plateState);
  }

  async function clearPlateState() {
    setPlateState("");
    await updateVehicle(plate, "");
  }

  async function updateVinFn(value: string) {
    setVin(value);
    const res = await apiFetch(`/api/cases/${caseId}/vin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vin: value || null }),
    });
    if (!res.ok) {
      notify("Failed to update VIN.");
      return;
    }
    await refreshCase();
  }

  async function clearVin() {
    setVin("");
    const res = await apiFetch(`/api/cases/${caseId}/vin`, {
      method: "DELETE",
    });
    if (!res.ok) {
      notify("Failed to clear VIN.");
      return;
    }
    await refreshCase();
  }

  async function updateCaseNoteFn(value: string) {
    setNote(value);
    const res = await apiFetch(`/api/cases/${caseId}/note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: value || null }),
    });
    if (!res.ok) {
      notify("Failed to update note.");
      return;
    }
    await refreshCase();
  }

  async function updatePhotoNoteFn(value: string) {
    if (!selectedPhoto) return;
    setPhotoNote(value);
    const res = await apiFetch(`/api/cases/${caseId}/photo-note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: selectedPhoto, note: value || null }),
    });
    if (!res.ok) {
      notify("Failed to update note.");
      return;
    }
    await refreshCase();
  }

  async function togglePublic() {
    const res = await apiFetch(`/api/cases/${caseId}/public`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public: !(caseData?.public ?? false) }),
    });
    if (!res.ok) {
      notify("Failed to update visibility.");
      return;
    }
    await refreshCase();
  }

  async function toggleClosed() {
    const res = await apiFetch(`/api/cases/${caseId}/closed`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closed: !(caseData?.closed ?? false) }),
    });
    if (!res.ok) {
      notify("Failed to update status.");
      return;
    }
    await refreshCase();
  }

  async function toggleArchived() {
    const res = await apiFetch(`/api/cases/${caseId}/archived`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !(caseData?.archived ?? false) }),
    });
    if (!res.ok) {
      notify("Failed to update status.");
      return;
    }
    await refreshCase();
  }

  async function copyPublicUrl() {
    const url = `${window.location.origin}${withBasePath(
      `/public/cases/${caseId}`,
    )}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function reanalyzePhoto(
    photo: string,
    detailsEl?: HTMLDetailsElement | null,
  ) {
    const url = `/api/cases/${caseId}/reanalyze-photo?photo=${encodeURIComponent(
      photo,
    )}`;
    if (caseData) setCaseData({ ...caseData, analysisStatus: "pending" });
    setReanalyzingPhoto(photo);
    const res = await apiFetch(url, { method: "POST" });
    if (res.ok) {
      if (detailsEl) {
        detailsEl.open = false;
      }
    } else {
      notify("Failed to reanalyze photo.");
    }
    await refreshCase();
  }

  async function retryAnalysis() {
    if (caseData) setCaseData({ ...caseData, analysisStatus: "pending" });
    const res = await apiFetch(`/api/cases/${caseId}/reanalyze`, {
      method: "POST",
    });
    if (!res.ok) {
      notify("Failed to retry analysis.");
    }
    await refreshCase();
  }

  async function removePhoto(photo: string) {
    const delRes = await apiFetch(`/api/cases/${caseId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo }),
    });
    if (!delRes.ok) {
      notify("Failed to remove photo.");
      return;
    }
    const res = await apiFetch(`/api/cases/${caseId}`);
    if (res.ok) {
      const data = (await res.json()) as Case;
      setCaseData(data);
    } else {
      notify("Failed to refresh case after removing photo.");
    }
    router.refresh();
    const confirmed = window.confirm("Photo removed. Reanalyze this case now?");
    if (confirmed) {
      await apiFetch(`/api/cases/${caseId}/reanalyze`, { method: "POST" });
      router.refresh();
    }
  }

  async function refreshMembers() {
    const res = await apiFetch(`/api/cases/${caseId}/members`);
    if (res.ok) setMembers(await res.json());
  }

  async function inviteMember() {
    if (!inviteUserId) return;
    const res = await apiFetch(`/api/cases/${caseId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: inviteUserId }),
    });
    if (!res.ok) {
      notify("Failed to invite collaborator.");
      return;
    }
    setInviteUserId("");
    await refreshMembers();
  }

  async function removeMember(uid: string) {
    const res = await apiFetch(`/api/cases/${caseId}/members/${uid}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      notify("Failed to remove collaborator.");
      return;
    }
    await refreshMembers();
  }

  /* -------------------------------------------------------------------- */
  /*                              RENDER                                  */
  /* -------------------------------------------------------------------- */

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

  const violationIdentified =
    caseData.analysisStatus === "complete" && hasViolation(caseData.analysis);

  const vinOverridden = caseData.vinOverride !== null;
  const plateNumberOverridden =
    caseData.analysisOverrides?.vehicle?.licensePlateNumber !== undefined;
  const plateStateOverridden =
    caseData.analysisOverrides?.vehicle?.licensePlateState !== undefined;
  const ownerContact = getCaseOwnerContact(caseData);
  const isOwner = members.some(
    (m) => m.userId === session?.user?.id && m.role === "owner",
  );
  const canManageMembers = isAdmin || isOwner;

  const progress =
    caseData.analysisStatus === "pending" && caseData.analysisProgress
      ? caseData.analysisProgress
      : null;
  const isPhotoReanalysis = Boolean(
    reanalyzingPhoto && caseData.analysisStatus === "pending",
  );
  const requestValue = progress
    ? progress.stage === "upload"
      ? progress.index > 0
        ? (progress.index / progress.total) * 100
        : undefined
      : Math.min((progress.received / progress.total) * 100, 100)
    : undefined;
  const progressDescription = progress
    ? `${progress.steps ? `Step ${progress.step} of ${progress.steps}: ` : ""}${
        progress.stage === "upload"
          ? progress.index > 0
            ? `Uploading ${progress.index} of ${progress.total} photos (${Math.floor(
                (progress.index / progress.total) * 100,
              )}%)`
            : "Uploading photos..."
          : progress.done
            ? "Processing results..."
            : `Analyzing... ${progress.received} of ${progress.total} tokens`
      }`
    : caseData.analysisStatus === "pending"
      ? "Analyzing photo..."
      : caseData.analysisStatus === "canceled"
        ? "Analysis canceled."
        : "Analysis failed.";
  const failureReason = caseData.analysisError
    ? caseData.analysisError === "truncated"
      ? "Analysis failed because the AI response was cut off."
      : caseData.analysisError === "parse"
        ? "Analysis failed due to invalid JSON from the AI."
        : caseData.analysisError === "images"
          ? "Analysis failed because no images were provided or some photo files were missing."
          : "Analysis failed because the AI response did not match the expected format."
    : caseData.analysisStatusCode && caseData.analysisStatusCode >= 400
      ? "Analysis failed. Please try again later."
      : "Analysis failed.";
  const analysisBlock = caseData.analysis ? (
    <>
      <AnalysisInfo
        analysis={caseData.analysis}
        onPlateChange={readOnly ? undefined : updatePlateNumber}
        onStateChange={readOnly ? undefined : updatePlateStateFn}
        onClearPlate={
          readOnly
            ? undefined
            : plateNumberOverridden
              ? clearPlateNumber
              : undefined
        }
        onClearState={
          readOnly
            ? undefined
            : plateStateOverridden
              ? clearPlateState
              : undefined
        }
      />
    </>
  ) : caseData.analysisStatus === "canceled" ? (
    <p className="text-sm text-red-600">Analysis canceled.</p>
  ) : caseData.analysisStatus === "pending" && progress ? (
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {progressDescription}
    </p>
  ) : (
    <div className="text-sm text-red-600 flex flex-col gap-1">
      <p>{failureReason}</p>
      {readOnly ? null : (
        <button
          type="button"
          onClick={retryAnalysis}
          className="underline w-fit"
        >
          Retry
        </button>
      )}
      <details>
        <summary className="cursor-pointer underline">More info</summary>
        <p className="mt-1">
          Last attempt: {new Date(caseData.updatedAt).toLocaleString()}
        </p>
        <p className="mt-1">Possible causes:</p>
        <ul className="list-disc ml-4">
          <li>Missing photo files</li>
          <li>Invalid JSON response</li>
          <li>Server error</li>
        </ul>
      </details>
    </div>
  );

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
      <div
        className={
          chatExpanded ? "md:col-span-1 h-full overflow-y-auto" : undefined
        }
      >
        <CaseLayout
          header={
            <CaseHeader
              caseId={caseId}
              caseData={caseData}
              ownerContact={ownerContact}
              isAdmin={isAdmin}
              readOnly={readOnly}
              violationIdentified={violationIdentified}
              progress={progress}
              isPhotoReanalysis={isPhotoReanalysis}
              copyPublicUrl={copyPublicUrl}
              copied={copied}
            />
          }
          left={<CaseProgressGraph caseData={caseData} />}
          right={
            <>
              <DebugWrapper data={caseData}>
                <div className="order-first bg-gray-100 dark:bg-gray-800 p-4 rounded flex flex-col gap-2 text-sm">
                  {analysisBlock}
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
                    {(isAdmin || session?.user) && !readOnly && (
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
                  {(() => {
                    const g = getOfficialCaseGps(caseData);
                    return g ? (
                      <MapPreview
                        lat={g.lat}
                        lon={g.lon}
                        width={600}
                        height={300}
                        className="w-full aspect-[2/1] md:max-w-xl"
                        link={`https://www.google.com/maps?q=${g.lat},${g.lon}`}
                      />
                    ) : null;
                  })()}
                  <p>
                    <span className="font-semibold">VIN:</span>{" "}
                    {readOnly ? (
                      <span>{vin || ""}</span>
                    ) : (
                      <EditableText
                        value={vin}
                        onSubmit={updateVinFn}
                        onClear={vinOverridden ? clearVin : undefined}
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
                        onSubmit={updateCaseNoteFn}
                        onClear={note ? () => updateCaseNoteFn("") : undefined}
                        placeholder="Add note"
                      />
                    )}
                  </p>
                  <div>
                    <span className="font-semibold">Members:</span>
                    <ul className="ml-2 mt-1 flex flex-col gap-1">
                      {members.map((m) => (
                        <li key={m.userId} className="flex items-center gap-2">
                          <span className="flex-1">
                            {m.name ?? m.email ?? m.userId} ({m.role})
                          </span>
                          {readOnly ||
                          !canManageMembers ||
                          m.role === "owner" ? null : (
                            <button
                              type="button"
                              onClick={() => removeMember(m.userId)}
                              className="text-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                    {readOnly || !canManageMembers ? null : (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={inviteUserId}
                          onChange={(e) => setInviteUserId(e.target.value)}
                          placeholder="User ID"
                          className="border rounded p-1 flex-1 bg-white dark:bg-gray-900"
                        />
                        <button
                          type="button"
                          onClick={inviteMember}
                          className="bg-blue-600 text-white px-2 py-1 rounded"
                        >
                          Invite
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </DebugWrapper>

              <CaseJobList caseId={caseId} isPublic={caseData.public} />
              {selectedPhoto ? (
                <PhotoViewer
                  caseData={caseData}
                  selectedPhoto={selectedPhoto}
                  progress={progress}
                  progressDescription={progressDescription}
                  requestValue={requestValue}
                  isPhotoReanalysis={isPhotoReanalysis}
                  reanalyzingPhoto={reanalyzingPhoto}
                  analysisActive={analysisActive}
                  readOnly={readOnly}
                  photoNote={photoNote}
                  updatePhotoNote={updatePhotoNoteFn}
                  removePhoto={removePhoto}
                  reanalyzePhoto={reanalyzePhoto}
                />
              ) : null}
              <PhotoGallery
                caseId={caseId}
                caseData={caseData}
                selectedPhoto={selectedPhoto}
                setSelectedPhoto={setSelectedPhoto}
                handleUpload={handleUpload}
                fileInputRef={fileInputRef}
                hasCamera={hasCamera}
                removePhoto={removePhoto}
                readOnly={readOnly}
                isPhotoReanalysis={isPhotoReanalysis}
                reanalyzingPhoto={reanalyzingPhoto}
                requestValue={requestValue}
              />
            </>
          }
        >
          <CaseExtraInfo
            caseId={caseId}
            caseData={caseData}
            selectedPhoto={selectedPhoto}
            setSelectedPhoto={setSelectedPhoto}
          />
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
