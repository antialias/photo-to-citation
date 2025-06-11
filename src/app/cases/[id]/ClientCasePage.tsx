"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Case } from "../../../lib/caseStore";
import { getRepresentativePhoto } from "../../../lib/caseUtils";
import AnalysisInfo from "../../components/AnalysisInfo";
import CaseToolbar from "../../components/CaseToolbar";
import ImageHighlights from "../../components/ImageHighlights";
import MapPreview from "../../components/MapPreview";

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
    initialCase?.analysis?.vehicle?.licensePlateNumber || "",
  );
  const [model, setModel] = useState<string>(
    initialCase?.analysis?.vehicle?.model || "",
  );
  const [vin, setVin] = useState<string>(initialCase?.vin || "");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once per id
  useEffect(() => {
    if (!caseData) {
      const stored = sessionStorage.getItem(`preview-${caseId}`);
      if (stored) setPreview(stored);
    }
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
      setPlate(caseData.analysis?.vehicle?.licensePlateNumber || "");
      setModel(caseData.analysis?.vehicle?.model || "");
      setVin(caseData.vin || "");
      setSelectedPhoto(getRepresentativePhoto(caseData));
    }
  }, [caseData]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
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

  async function saveOverrides() {
    await fetch(`/api/cases/${caseId}/override`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle: {
          licensePlateNumber: plate || undefined,
          model: model || undefined,
        },
      }),
    });
    await fetch(`/api/cases/${caseId}/vin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vin: vin || null }),
    });
    const res = await fetch(`/api/cases/${caseId}`);
    if (res.ok) {
      const data = (await res.json()) as Case;
      setCaseData(data);
    }
  }

  async function clearOverrides() {
    await fetch(`/api/cases/${caseId}/override`, { method: "DELETE" });
    await fetch(`/api/cases/${caseId}/vin`, { method: "DELETE" });
    const res = await fetch(`/api/cases/${caseId}`);
    if (res.ok) {
      const data = (await res.json()) as Case;
      setCaseData(data);
    }
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
        <p className="text-sm text-gray-500">Uploading photo...</p>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Case {caseData.id}</h1>
      <CaseToolbar caseId={caseId} />
      {selectedPhoto ? (
        <>
          <div className="w-[600px] h-[400px] relative">
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
                {caseData.analysisStatus === "pending" ? (
                  <p>Updating analysis...</p>
                ) : null}
              </div>
            ) : (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
                Analyzing photo...
              </div>
            )}
          </div>
          {(() => {
            const t = caseData.photoTimes[selectedPhoto];
            return t ? (
              <p className="text-sm text-gray-500">
                Taken {new Date(t).toLocaleString()}
              </p>
            ) : null;
          })()}
        </>
      ) : null}
      <div className="flex gap-2 flex-wrap">
        {caseData.photos.map((p) => (
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
              <div className="relative w-[80px] h-[60px]">
                <Image src={p} alt="" fill className="object-cover" />
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
        <label className="flex items-center justify-center border rounded w-[80px] h-[60px] text-sm text-gray-500 cursor-pointer">
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
      <p className="text-sm text-gray-500">
        Created {new Date(caseData.createdAt).toLocaleString()}
      </p>
      {caseData.gps ? (
        <>
          <p className="text-sm text-gray-500">
            GPS: {caseData.gps.lat}, {caseData.gps.lon}
          </p>
          <MapPreview
            lat={caseData.gps.lat}
            lon={caseData.gps.lon}
            width={600}
            height={300}
          />
        </>
      ) : null}
      {caseData.streetAddress ? (
        <p className="text-sm text-gray-500">
          Address: {caseData.streetAddress}
        </p>
      ) : null}
      {caseData.intersection ? (
        <p className="text-sm text-gray-500">
          Intersection: {caseData.intersection}
        </p>
      ) : null}
      {caseData.vin ? (
        <p className="text-sm text-gray-500">VIN: {caseData.vin}</p>
      ) : null}
      {caseData.analysis ? (
        <div className="bg-gray-100 p-4 rounded flex flex-col gap-2">
          <AnalysisInfo analysis={caseData.analysis} />
          {caseData.analysisStatus === "pending" ? (
            <p className="text-sm text-gray-500">Updating analysis...</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Analyzing photo...</p>
      )}
      {caseData.analysis ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveOverrides();
          }}
          className="flex flex-col gap-2"
        >
          <label className="flex flex-col">
            License Plate
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              className="border p-1"
            />
          </label>
          <label className="flex flex-col">
            Vehicle Model
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="border p-1"
            />
          </label>
          <label className="flex flex-col">
            VIN
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              className="border p-1"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-500 text-white px-2 py-1 rounded"
            >
              Save
            </button>
            <button
              type="button"
              onClick={clearOverrides}
              className="bg-gray-200 px-2 py-1 rounded"
            >
              Clear Overrides
            </button>
          </div>
        </form>
      ) : null}
      {caseData.sentEmails && caseData.sentEmails.length > 0 ? (
        <div className="bg-gray-100 p-4 rounded flex flex-col gap-2">
          <h2 className="font-semibold">Email Log</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {caseData.sentEmails.map((mail) => (
              <li key={mail.sentAt} className="flex flex-col">
                <span>
                  {new Date(mail.sentAt).toLocaleString()} - {mail.subject}
                </span>
                <span className="text-gray-500 whitespace-pre-wrap">
                  {mail.body}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
