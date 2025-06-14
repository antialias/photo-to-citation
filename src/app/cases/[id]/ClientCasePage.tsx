"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Case, SentEmail } from "../../../lib/caseStore";
import {
  getCaseOwnerContact,
  getCasePlateNumber,
  getCasePlateState,
  getCaseVin,
  getRepresentativePhoto,
  hasViolation,
} from "../../../lib/caseUtils";
import AnalysisInfo from "../../components/AnalysisInfo";
import CaseLayout from "../../components/CaseLayout";
import CaseProgressGraph from "../../components/CaseProgressGraph";
import CaseToolbar from "../../components/CaseToolbar";
import EditableText from "../../components/EditableText";
import ImageHighlights from "../../components/ImageHighlights";
import MapPreview from "../../components/MapPreview";
import useDragReset from "../useDragReset";

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
}: {
  initialCase: Case | null;
  caseId: string;
}) {
  const [caseData, setCaseData] = useState<Case | null>(initialCase);
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
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  useDragReset(() => {
    setDragging(false);
  });

  useEffect(() => {
    const stored = sessionStorage.getItem(`preview-${caseId}`);
    if (stored) setPreview(stored);
    fetch(`/api/cases/${caseId}`).then(async (res) => {
      if (res.ok) {
        const data = (await res.json()) as Case;
        setCaseData(data);
      }
    });
    const es = new EventSource("/api/cases/stream");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as Case;
      if (data.id === caseId) {
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
      setSelectedPhoto(getRepresentativePhoto(caseData));
    }
  }, [caseData]);

  async function uploadFiles(files: FileList) {
    if (!files || files.length === 0) return;
    await Promise.all(
      Array.from(files).map((file) => {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("caseId", caseId);
        return fetch("/api/upload", { method: "POST", body: formData });
      }),
    );
    const res = await fetch(`/api/cases/${caseId}`);
    if (res.ok) {
      const data = (await res.json()) as Case;
      setCaseData(data);
    }
    router.refresh();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) await uploadFiles(files);
  }

  async function refreshCase() {
    const res = await fetch(`/api/cases/${caseId}`);
    if (res.ok) {
      const data = (await res.json()) as Case;
      setCaseData(data);
    }
  }

  async function updateVehicle(plateNum: string, plateSt: string) {
    await fetch(`/api/cases/${caseId}/override`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle: {
          licensePlateNumber: plateNum || undefined,
          licensePlateState: plateSt || undefined,
        },
      }),
    });
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
    await fetch(`/api/cases/${caseId}/vin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vin: value || null }),
    });
    await refreshCase();
  }

  async function clearVin() {
    setVin("");
    await fetch(`/api/cases/${caseId}/vin`, { method: "DELETE" });
    await refreshCase();
  }

  async function reanalyzeCase() {
    await fetch(`/api/cases/${caseId}/reanalyze`, { method: "POST" });
    await refreshCase();
  }

  async function removePhoto(photo: string) {
    await fetch(`/api/cases/${caseId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo }),
    });
    const res = await fetch(`/api/cases/${caseId}`);
    if (res.ok) {
      const data = (await res.json()) as Case;
      setCaseData(data);
    }
    router.refresh();
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

  const progress =
    caseData.analysisStatus === "pending" ? caseData.analysisProgress : null;
  const analysisBlock = caseData.analysis ? (
    <>
      <AnalysisInfo
        analysis={caseData.analysis}
        onPlateChange={updatePlateNumber}
        onStateChange={updatePlateStateFn}
        onClearPlate={plateNumberOverridden ? clearPlateNumber : undefined}
        onClearState={plateStateOverridden ? clearPlateState : undefined}
      />
      {progress ? (
        <>
          <progress
            value={progress.stage === "upload" ? progress.index : undefined}
            max={progress.stage === "upload" ? progress.total : undefined}
            className="w-full"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {progress.stage === "upload"
              ? `Uploading ${progress.index} of ${progress.total} photos...`
              : progress.done
                ? "Processing results..."
                : `Analyzing... received ${progress.received} chars`}
          </p>
        </>
      ) : null}
    </>
  ) : caseData.analysisError ? (
    <p className="text-sm text-red-600">
      {caseData.analysisError === "truncated"
        ? "Analysis failed because the AI response was cut off. Please try again."
        : caseData.analysisError === "parse"
          ? "Analysis failed due to invalid JSON from the AI. Please try again."
          : caseData.analysisError === "images"
            ? "Analysis failed because no images were provided."
            : "Analysis failed because the AI response did not match the expected format. Please retry."}
    </p>
  ) : caseData.analysisStatusCode && caseData.analysisStatusCode >= 400 ? (
    <p className="text-sm text-red-600">
      Analysis failed. Please try again later.
    </p>
  ) : progress ? (
    <>
      <progress
        value={progress.stage === "upload" ? progress.index : undefined}
        max={progress.stage === "upload" ? progress.total : undefined}
        className="w-full"
      />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {progress.stage === "upload"
          ? `Uploading ${progress.index} of ${progress.total} photos...`
          : progress.done
            ? "Processing results..."
            : `Analyzing... received ${progress.received} chars`}
      </p>
    </>
  ) : (
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Analyzing photo...
    </p>
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
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragging(false);
        }
      }}
      onDrop={async (e) => {
        e.preventDefault();
        await uploadFiles(e.dataTransfer.files);
        setDragging(false);
      }}
    >
      <CaseLayout
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/cases" className="text-blue-500 underline md:hidden">
                Back to Cases
              </Link>
              <h1 className="text-xl font-semibold">Case {caseData.id}</h1>
            </div>
            <CaseToolbar
              caseId={caseId}
              disabled={!violationIdentified}
              hasOwner={Boolean(ownerContact)}
            />
          </div>
        }
        left={<CaseProgressGraph caseData={caseData} />}
        right={
          <>
            <div className="order-first bg-gray-100 dark:bg-gray-800 p-4 rounded flex flex-col gap-2 text-sm">
              {analysisBlock}
              <button
                type="button"
                onClick={reanalyzeCase}
                disabled={caseData.analysisStatus === "pending"}
                className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50 self-start"
              >
                Re-run Analysis
              </button>
              {ownerContact ? (
                <p>
                  <span className="font-semibold">Owner:</span> {ownerContact}
                </p>
              ) : null}
              <p>
                <span className="font-semibold">Created:</span>{" "}
                {new Date(caseData.createdAt).toLocaleString()}
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
              {caseData.gps ? (
                <>
                  <p>
                    <span className="font-semibold">GPS:</span>{" "}
                    {caseData.gps.lat}, {caseData.gps.lon}
                  </p>
                  <MapPreview
                    lat={caseData.gps.lat}
                    lon={caseData.gps.lon}
                    width={600}
                    height={300}
                    className="w-full aspect-[2/1] md:max-w-xl"
                  />
                </>
              ) : null}
              <p>
                <span className="font-semibold">VIN:</span>{" "}
                <EditableText
                  value={vin}
                  onSubmit={updateVinFn}
                  onClear={vinOverridden ? clearVin : undefined}
                  placeholder="VIN"
                />
              </p>
            </div>
            {selectedPhoto ? (
              <>
                <div className="relative w-full aspect-[3/2] md:max-w-2xl">
                  <Image
                    src={selectedPhoto}
                    alt="uploaded"
                    fill
                    className="object-contain"
                  />
                  {caseData.analysis ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 space-y-1 text-sm">
                      <ImageHighlights
                        analysis={caseData.analysis}
                        photo={selectedPhoto}
                      />
                      {progress ? (
                        <p>
                          {progress.stage === "upload"
                            ? `Uploading ${progress.index} of ${progress.total} photos...`
                            : progress.done
                              ? "Processing results..."
                              : `Analyzing... received ${progress.received} chars`}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
                      {progress
                        ? progress.stage === "upload"
                          ? `Uploading ${progress.index} of ${progress.total} photos...`
                          : progress.done
                            ? "Processing results..."
                            : `Analyzing... received ${progress.received} chars`
                        : "Analyzing photo..."}
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
              </>
            ) : null}
            <div className="flex gap-2 flex-wrap">
              {evidencePhotos.map((p) => (
                <div key={p} className="relative">
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
                      <Image
                        src={p}
                        alt="case photo"
                        fill
                        className="object-cover"
                      />
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
                  <button
                    type="button"
                    onClick={() => removePhoto(p)}
                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="flex items-center justify-center border rounded w-20 aspect-[4/3] text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                + add image
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
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
                {allPaperwork.map(({ url, time }) => (
                  <div key={url} className="relative">
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
                        <Image
                          src={url}
                          alt="paperwork"
                          fill
                          className="object-cover"
                        />
                      </div>
                      {time ? (
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs rounded px-1">
                          {new Date(time).toLocaleDateString()}
                        </span>
                      ) : null}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </CaseLayout>
      {dragging ? (
        <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center pointer-events-none text-xl z-10">
          Drop to add photos
        </div>
      ) : null}
    </div>
  );
}
