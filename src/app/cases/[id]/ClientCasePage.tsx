"use client";
import type { Case } from "@/lib/caseStore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const router = useRouter();

  useEffect(() => {
    if (!caseData) {
      const stored = sessionStorage.getItem(`preview-${caseId}`);
      if (stored) setPreview(stored);
      const interval = setInterval(async () => {
        const res = await fetch(`/api/cases/${caseId}`);
        if (res.ok) {
          const data = (await res.json()) as Case;
          setCaseData(data);
          sessionStorage.removeItem(`preview-${caseId}`);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [caseData, caseId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("caseId", caseId);
    await fetch("/api/upload", { method: "POST", body: formData });
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
      <div className="flex flex-col gap-2">
        {caseData.photos.map((p) => (
          <Image key={p} src={p} alt="uploaded" width={600} height={400} />
        ))}
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
      {caseData.analysis ? (
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(caseData.analysis, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-gray-500">Analyzing photo...</p>
      )}
      <input type="file" accept="image/*" onChange={handleUpload} />
    </div>
  );
}
