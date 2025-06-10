"use client";
import type { Case } from "@/lib/caseStore";
import { mergeAnalysis } from "@/lib/caseStore";
import type { ViolationReport } from "@/lib/openai";
import Image from "next/image";
import { useEffect, useState } from "react";

function computeDiff(
  base: ViolationReport,
  updated: ViolationReport,
): Partial<ViolationReport> | null {
  const result: Partial<ViolationReport> = {};
  if (updated.violationType !== base.violationType)
    result.violationType = updated.violationType;
  if (updated.details !== base.details) result.details = updated.details;
  if (updated.location !== base.location) result.location = updated.location;
  const vehicle: Partial<ViolationReport["vehicle"]> = {};
  if (updated.vehicle.make !== base.vehicle.make)
    vehicle.make = updated.vehicle.make;
  if (updated.vehicle.model !== base.vehicle.model)
    vehicle.model = updated.vehicle.model;
  if (updated.vehicle.type !== base.vehicle.type)
    vehicle.type = updated.vehicle.type;
  if (updated.vehicle.color !== base.vehicle.color)
    vehicle.color = updated.vehicle.color;
  if (updated.vehicle.licensePlateState !== base.vehicle.licensePlateState)
    vehicle.licensePlateState = updated.vehicle.licensePlateState;
  if (updated.vehicle.licensePlateNumber !== base.vehicle.licensePlateNumber)
    vehicle.licensePlateNumber = updated.vehicle.licensePlateNumber;
  if (Object.keys(vehicle).length) result.vehicle = vehicle;
  return Object.keys(result).length ? result : null;
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
  const finalAnalysis = mergeAnalysis(
    caseData?.analysis ?? null,
    caseData?.overrides ?? null,
  );
  const [form, setForm] = useState<ViolationReport | null>(finalAnalysis);

  useEffect(() => {
    setForm(finalAnalysis);
  }, [finalAnalysis]);

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
      <Image src={caseData.photo} alt="uploaded" width={600} height={400} />
      <p className="text-sm text-gray-500">
        Created {new Date(caseData.createdAt).toLocaleString()}
      </p>
      {caseData.gps ? (
        <p className="text-sm text-gray-500">
          GPS: {caseData.gps.lat}, {caseData.gps.lon}
        </p>
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
      {form ? (
        <form
          className="bg-gray-100 p-4 rounded flex flex-col gap-2 text-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!caseData?.analysis) return;
            const diff = computeDiff(caseData.analysis, form);
            await fetch(`/api/cases/${caseId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ overrides: diff }),
            });
            const res = await fetch(`/api/cases/${caseId}`);
            if (res.ok) setCaseData((await res.json()) as Case);
          }}
        >
          <label className="flex gap-2 items-center">
            <span className="w-40">License Plate #</span>
            <input
              className="border px-2 py-1 flex-1"
              value={form.vehicle.licensePlateNumber || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  vehicle: {
                    ...form.vehicle,
                    licensePlateNumber: e.target.value,
                  },
                })
              }
            />
          </label>
          <label className="flex gap-2 items-center">
            <span className="w-40">Vehicle Model</span>
            <input
              className="border px-2 py-1 flex-1"
              value={form.vehicle.model || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  vehicle: { ...form.vehicle, model: e.target.value },
                })
              }
            />
          </label>
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="px-4 py-1 bg-blue-600 text-white rounded"
            >
              Save Overrides
            </button>
            <button
              type="button"
              className="px-4 py-1 bg-gray-300 rounded"
              onClick={async () => {
                await fetch(`/api/cases/${caseId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ overrides: null }),
                });
                const res = await fetch(`/api/cases/${caseId}`);
                if (res.ok) setCaseData((await res.json()) as Case);
              }}
            >
              Clear Overrides
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-500">Analyzing photo...</p>
      )}
    </div>
  );
}
