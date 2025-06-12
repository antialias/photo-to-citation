"use client";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Case } from "../../lib/caseStore";
import { getRepresentativePhoto } from "../../lib/caseUtils";
import AnalysisInfo from "../components/AnalysisInfo";
import MapPreview from "../components/MapPreview";

export default function ClientCasesPage({
  initialCases,
}: {
  initialCases: Case[];
}) {
  const [cases, setCases] = useState(initialCases);
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");
  const selectedIds = idsParam
    ? idsParam.split(",").filter(Boolean)
    : params.id
      ? [params.id]
      : [];

  useEffect(() => {
    const es = new EventSource("/api/cases/stream");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as Case & { deleted?: boolean };
      setCases((prev) => {
        if (data.deleted) {
          return prev.filter((c) => c.id !== data.id);
        }
        const idx = prev.findIndex((c) => c.id === data.id);
        if (idx === -1) return [...prev, data];
        const copy = [...prev];
        copy[idx] = data;
        return copy;
      });
    };
    return () => es.close();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Cases</h1>
      <ul className="grid gap-4">
        {cases.map((c) => (
          <li
            key={c.id}
            className={`border p-2 ${
              selectedIds.includes(c.id)
                ? "bg-gray-100 ring-2 ring-blue-500"
                : "ring-1 ring-transparent"
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                if (e.shiftKey) {
                  const ids = Array.from(new Set([...selectedIds, c.id]));
                  router.push(`/cases?ids=${ids.join(",")}`);
                } else {
                  router.push(`/cases/${c.id}`);
                }
              }}
              className="flex items-start gap-4 w-full text-left"
            >
              <div className="relative">
                <Image
                  src={getRepresentativePhoto(c)}
                  alt="case thumbnail"
                  width={80}
                  height={60}
                />
                <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs rounded px-1">
                  {c.photos.length}
                </span>
              </div>
              {c.gps ? (
                <MapPreview
                  lat={c.gps.lat}
                  lon={c.gps.lon}
                  width={80}
                  height={60}
                  className="w-20 aspect-[4/3]"
                />
              ) : null}
              <div className="flex flex-col text-sm gap-1">
                <span className="font-semibold">Case {c.id}</span>
                {c.analysis ? (
                  <>
                    <AnalysisInfo analysis={c.analysis} />
                    {c.analysisStatus === "pending" ? (
                      <span className="text-gray-500">
                        Updating analysis...
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-gray-500">Analyzing photo...</span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
