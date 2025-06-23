"use client";
import { apiEventSource, apiFetch } from "@/apiClient";
import useDragReset from "@/app/cases/useDragReset";
import AnalysisInfo from "@/app/components/AnalysisInfo";
import CaseJobList from "@/app/components/CaseJobList";
import CaseLayout from "@/app/components/CaseLayout";
import CaseProgressGraph from "@/app/components/CaseProgressGraph";
import CaseToolbar from "@/app/components/CaseToolbar";
import DebugWrapper from "@/app/components/DebugWrapper";
import EditableText from "@/app/components/EditableText";
import ImageHighlights from "@/app/components/ImageHighlights";
import MapPreview from "@/app/components/MapPreview";
import useCaseAnalysisActive from "@/app/useCaseAnalysisActive";
import useCloseOnOutsideClick from "@/app/useCloseOnOutsideClick";
import { signIn, useSession } from "@/app/useSession";
import { withBasePath } from "@/basePath";
import ThumbnailImage from "@/components/thumbnail-image";
import { Progress } from "@/components/ui/progress";
import type { Case, SentEmail } from "@/lib/caseStore";
import {
  getCaseOwnerContact,
  getCasePlateNumber,
  getCasePlateState,
  getCaseVin,
  getOfficialCaseGps,
  getRepresentativePhoto,
  hasViolation,
} from "@/lib/caseUtils";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaShare } from "react-icons/fa";
import { useNotify } from "../../components/NotificationProvider";

function buildThreads(c: Case): SentEmail[] {
  const mails = c.sentEmails ?? [];
  const threads = new Map<string, SentEmail>();
  for (const mail of mails) {
    let root = mail;
    while (root.replyTo) {
      const parent = mails.find((m) => m.sentAt === root.replyTo);
      if (!parent) break;
      root = parent;
    }
    const current = threads.get(root.sentAt);
    if (!current || new Date(mail.sentAt) > new Date(current.sentAt)) {
      threads.set(root.sentAt, mail);
    }
  }
  return Array.from(threads.values()).sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );
}

function baseName(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1];
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
  const addMenuRef = useRef<HTMLDetailsElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hideClaimBanner, setHideClaimBanner] = useState(false);
  const photoMenuRef = useRef<HTMLDetailsElement>(null);
  useCloseOnOutsideClick(photoMenuRef);
  useCloseOnOutsideClick(addMenuRef);
  const notify = useNotify();
  const showClaimBanner = Boolean(
    caseData?.sessionId && !session?.user && !hideClaimBanner,
  );

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
      navigator.mediaDevices?.getUserMedia &&
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

  const analysisImages = caseData.analysis?.images ?? {};
  const evidencePhotos = caseData.photos.filter(
    (p) => !analysisImages[baseName(p)]?.paperwork,
  );
  const paperworkPhotos = caseData.photos.filter(
    (p) => analysisImages[baseName(p)]?.paperwork,
  );
  const paperworkScans = (caseData.threadImages ?? []).map((img) => ({
    url: img.url,
    time: img.uploadedAt,
  }));
  const allPaperwork = [
    ...paperworkPhotos.map((p) => ({ url: p, time: caseData.photoTimes[p] })),
    ...paperworkScans,
  ];

  return (
    <div
      className="relative h-full"
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
      {showClaimBanner ? (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-2 flex items-center justify-between">
          <span>
            Sign in to claim this case or it will be lost when the session ends.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                signIn(undefined, { callbackUrl: withBasePath("/claim") })
              }
              className="underline"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setHideClaimBanner(true)}
              aria-label="Dismiss"
              className="text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
      <CaseLayout
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/cases" className="text-blue-500 underline md:hidden">
                Back to Cases
              </Link>
              <h1 className="text-xl font-semibold">Case {caseData.id}</h1>
              {caseData.public ? (
                <button
                  type="button"
                  onClick={copyPublicUrl}
                  aria-label="Copy public link"
                  className="text-blue-500 hover:text-blue-700"
                >
                  <FaShare />
                </button>
              ) : null}
              {copied ? (
                <span className="text-sm text-green-600">Copied!</span>
              ) : null}
            </div>
            <CaseToolbar
              caseId={caseId}
              disabled={!violationIdentified}
              hasOwner={Boolean(ownerContact)}
              progress={isPhotoReanalysis ? null : progress}
              canDelete={isAdmin}
              closed={caseData.closed}
              archived={caseData.archived}
              readOnly={readOnly}
            />
          </div>
        }
        left={<CaseProgressGraph caseData={caseData} />}
        right={
          <>
            <DebugWrapper data={caseData}>
              <div className="order-first bg-gray-100 dark:bg-gray-800 p-4 rounded flex flex-col gap-2 text-sm">
                {analysisBlock}
                {ownerContact ? (
                  <p>
                    <span className="font-semibold">Owner:</span> {ownerContact}
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
              <>
                <div className="relative w-full aspect-[3/2] md:max-w-2xl shrink-0">
                  <Image
                    src={selectedPhoto}
                    alt="uploaded"
                    fill
                    className="object-contain"
                  />
                  {isPhotoReanalysis && reanalyzingPhoto === selectedPhoto ? (
                    <div className="absolute top-0 left-0 right-0">
                      <Progress
                        value={requestValue}
                        indeterminate={requestValue === undefined}
                      />
                    </div>
                  ) : null}
                  {readOnly ? null : (
                    <details
                      ref={photoMenuRef}
                      className="absolute top-1 right-1 text-white"
                      onToggle={() => {
                        if (photoMenuRef.current?.open) {
                          photoMenuRef.current
                            .querySelector<HTMLElement>("button, a")
                            ?.focus();
                        }
                      }}
                    >
                      <summary
                        className="cursor-pointer select-none bg-black/40 rounded px-1 opacity-70"
                        aria-label="Photo actions menu"
                      >
                        ⋮
                      </summary>
                      <div
                        className="absolute right-0 mt-1 bg-white dark:bg-gray-900 border rounded shadow text-black dark:text-white"
                        role="menu"
                      >
                        <button
                          type="button"
                          onClick={(e) =>
                            reanalyzePhoto(
                              selectedPhoto,
                              e.currentTarget.closest("details"),
                            )
                          }
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                          disabled={
                            caseData.analysisStatus === "pending" &&
                            analysisActive
                          }
                        >
                          Reanalyze Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => removePhoto(selectedPhoto)}
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                        >
                          Delete Image
                        </button>
                      </div>
                    </details>
                  )}
                  {caseData.analysis ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 space-y-1 text-sm">
                      <ImageHighlights
                        analysis={caseData.analysis}
                        photo={selectedPhoto}
                      />
                      {progress ? <p>{progressDescription}</p> : null}
                    </div>
                  ) : (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
                      {progressDescription}
                    </div>
                  )}
                </div>
                {(() => {
                  const t = caseData.photoTimes[selectedPhoto];
                  return t ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Taken {new Date(t).toLocaleString()}
                    </p>
                  ) : null;
                })()}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Note:</span>{" "}
                  {readOnly ? (
                    <span>{photoNote || ""}</span>
                  ) : (
                    <EditableText
                      value={photoNote}
                      onSubmit={updatePhotoNoteFn}
                      onClear={
                        photoNote ? () => updatePhotoNoteFn("") : undefined
                      }
                      placeholder="Add note"
                    />
                  )}
                </p>
              </>
            ) : null}
            <div className="flex gap-2 flex-wrap">
              {evidencePhotos.map((p) => {
                const info = {
                  url: p,
                  takenAt: caseData.photoTimes[p] ?? null,
                  gps: caseData.photoGps?.[p] ?? null,
                  analysis: analysisImages[baseName(p)] ?? null,
                };
                return (
                  <DebugWrapper key={p} data={info}>
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(p)}
                        className={
                          selectedPhoto === p
                            ? "ring-2 ring-blue-500"
                            : "ring-1 ring-transparent"
                        }
                      >
                        <div className="relative w-20 aspect-[4/3]">
                          <ThumbnailImage
                            src={getThumbnailUrl(p, 128)}
                            alt="case photo"
                            width={80}
                            height={60}
                            className="object-contain"
                          />
                          {isPhotoReanalysis && reanalyzingPhoto === p ? (
                            <div className="absolute top-0 left-0 right-0">
                              <Progress
                                value={requestValue}
                                indeterminate={requestValue === undefined}
                              />
                            </div>
                          ) : null}
                        </div>
                        {(() => {
                          const t = caseData.photoTimes[p];
                          return t ? (
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs rounded px-1">
                              {new Date(t).toLocaleDateString()}
                            </span>
                          ) : null;
                        })()}
                      </button>
                      {readOnly ? null : (
                        <button
                          type="button"
                          onClick={() => removePhoto(p)}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </DebugWrapper>
                );
              })}
              {readOnly ? null : (
                <details ref={addMenuRef} className="relative">
                  <summary className="flex items-center justify-center border rounded w-20 aspect-[4/3] text-sm text-gray-500 dark:text-gray-400 cursor-pointer select-none">
                    + add image
                  </summary>
                  <div
                    className="absolute right-0 mt-1 bg-white dark:bg-gray-900 border rounded shadow text-black dark:text-white"
                    role="menu"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        addMenuRef.current?.removeAttribute("open");
                        fileInputRef.current?.click();
                      }}
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      Upload Image
                    </button>
                    {hasCamera ? (
                      <Link
                        href={`/point?case=${caseId}`}
                        className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                      >
                        Take Photo
                      </Link>
                    ) : null}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUpload}
                    className="hidden"
                  />
                </details>
              )}
            </div>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {caseData.sentEmails && caseData.sentEmails.length > 0 ? (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded flex flex-col gap-2">
              <h2 className="font-semibold">Email Log</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {buildThreads(caseData).map((mail) => (
                  <li
                    key={mail.sentAt}
                    id={`email-${mail.sentAt}`}
                    className="flex flex-col gap-1"
                  >
                    <span>
                      {new Date(mail.sentAt).toLocaleString()} - {mail.subject}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      To: {mail.to}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                      {mail.body}
                    </span>
                    <a
                      href={`/cases/${caseId}/thread/${encodeURIComponent(mail.sentAt)}`}
                      className="self-start text-blue-500 underline"
                    >
                      View Thread
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {allPaperwork.length > 0 ? (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded flex flex-col gap-2">
              <h2 className="font-semibold">Paperwork</h2>
              <div className="flex gap-2 flex-wrap">
                {allPaperwork.map(({ url, time }) => {
                  const info = {
                    url,
                    time,
                    analysis: analysisImages[baseName(url)] ?? null,
                  };
                  return (
                    <DebugWrapper key={url} data={info}>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(url)}
                          className={
                            selectedPhoto === url
                              ? "ring-2 ring-blue-500"
                              : "ring-1 ring-transparent"
                          }
                        >
                          <div className="relative w-20 aspect-[4/3]">
                            <ThumbnailImage
                              src={getThumbnailUrl(url, 128)}
                              alt="paperwork"
                              width={80}
                              height={60}
                              className="object-contain"
                            />
                          </div>
                          {time ? (
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs rounded px-1">
                              {new Date(time).toLocaleDateString()}
                            </span>
                          ) : null}
                        </button>
                      </div>
                    </DebugWrapper>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </CaseLayout>
      {readOnly || !dragging ? null : (
        <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center pointer-events-none text-xl z-10">
          Drop to add photos
        </div>
      )}
    </div>
  );
}
