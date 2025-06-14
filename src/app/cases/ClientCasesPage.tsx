"use client";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Case } from "../../lib/caseStore";
import { getRepresentativePhoto } from "../../lib/caseUtils";
import AnalysisInfo from "../components/AnalysisInfo";
import MapPreview from "../components/MapPreview";
import useNewCaseFromFiles from "../useNewCaseFromFiles";
import useDragReset from "./useDragReset";

export default function ClientCasesPage({
  initialCases,
}: {
  initialCases: Case[];
}) {
  const [cases, setCases] = useState(initialCases);
  const router = useRouter();
  const uploadNewCase = useNewCaseFromFiles();
  const [dragging, setDragging] = useState(false);
  const [dropCase, setDropCase] = useState<string | null>(null);
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const selectedIds = searchParams.get("ids")
    ? searchParams.get("ids")?.split(",").filter(Boolean)
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

  useDragReset(() => {
    setDragging(false);
    setDropCase(null);
  });

  async function uploadFilesToCase(id: string, files: FileList) {
    await Promise.all(
      Array.from(files).map((file) => {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("caseId", id);
        return fetch("/api/upload", { method: "POST", body: formData });
      }),
    );
  }

  return (
    <div
      className="p-8 relative"
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) {
          setDragging(false);
          setDropCase(null);
        }
      }}
      onDrop={async (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (dropCase) {
          await uploadFilesToCase(dropCase, files);
        } else {
          await uploadNewCase(files);
        }
        setDragging(false);
        setDropCase(null);
      }}
    >
      <h1 className="text-xl font-bold mb-4">Cases</h1>
      <ul className="grid gap-4">
        {cases.map((c) => (
          <li
            key={c.id}
            onDragEnter={() => {
              setDropCase(c.id);
              setDragging(true);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setDropCase(null);
            }}
            className={`border p-2 ${
              selectedIds.includes(c.id)
                ? "bg-gray-100 dark:bg-gray-800 ring-2 ring-blue-500"
                : dropCase === c.id
                  ? "ring-2 ring-green-500"
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
                      <span className="text-gray-500 dark:text-gray-400">
                        Updating analysis...
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">
                    Analyzing photo...
                  </span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
      {dragging ? (
        <div className="fixed inset-0 bg-black/50 text-white flex items-center justify-center pointer-events-none text-xl">
          {dropCase
            ? `Add photos to case ${dropCase}`
            : "Drop photos to create case"}
        </div>
      ) : null}
    </div>
  );
}
