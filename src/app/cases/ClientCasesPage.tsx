"use client";
import { apiEventSource, apiFetch } from "@/apiClient";
import AnalysisInfo from "@/app/components/AnalysisInfo";
import MapPreview from "@/app/components/MapPreview";
import useNewCaseFromFiles from "@/app/useNewCaseFromFiles";
import type { Case } from "@/lib/caseStore";
import { getOfficialCaseGps, getRepresentativePhoto } from "@/lib/caseUtils";
import { distanceBetween } from "@/lib/distance";
import { getThumbnailUrl } from "@/lib/thumbnails";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useNotify } from "../components/NotificationProvider";
import useDragReset from "./useDragReset";

type Order = "createdAt" | "updatedAt" | "distance";
function sortList(
  list: Case[],
  key: Order,
  location?: { lat: number; lon: number } | null,
): Case[] {
  if (key === "distance" && location) {
    return [...list].sort((a, b) => {
      const ag = getOfficialCaseGps(a);
      const bg = getOfficialCaseGps(b);
      if (!ag && !bg) return 0;
      if (!ag) return 1;
      if (!bg) return -1;
      return distanceBetween(location, ag) - distanceBetween(location, bg);
    });
  }
  const k = key as Exclude<Order, "distance">;
  return [...list].sort(
    (a, b) =>
      new Date((b as Record<typeof k, string>)[k] ?? b.createdAt).getTime() -
      new Date((a as Record<typeof k, string>)[k] ?? a.createdAt).getTime(),
  );
}

export default function ClientCasesPage({
  initialCases,
}: {
  initialCases: Case[];
}) {
  const [orderBy, setOrderBy] = useState<Order>("createdAt");
  const [cases, setCases] = useState(() => sortList(initialCases, "createdAt"));
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const router = useRouter();
  const uploadNewCase = useNewCaseFromFiles();
  const [dragging, setDragging] = useState(false);
  const [dropCase, setDropCase] = useState<string | null>(null);
  const notify = useNotify();
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const selectedIds =
    searchParams.get("ids")?.split(",").filter(Boolean) ??
    (params.id ? [params.id] : []);

  useEffect(() => {
    const es = apiEventSource("/api/cases/stream");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as Case & { deleted?: boolean };
      setCases((prev) => {
        if (data.deleted) {
          return sortList(
            prev.filter((c) => c.id !== data.id),
            orderBy,
            userLocation,
          );
        }
        const idx = prev.findIndex((c) => c.id === data.id);
        if (idx === -1) return sortList([...prev, data], orderBy, userLocation);
        const copy = [...prev];
        copy[idx] = data;
        return sortList(copy, orderBy, userLocation);
      });
    };
    return () => es.close();
  }, [orderBy, userLocation]);

  useEffect(() => {
    setCases((prev) => sortList(prev, orderBy, userLocation));
  }, [orderBy, userLocation]);

  useEffect(() => {
    if (orderBy === "distance" && !userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      });
    }
  }, [orderBy, userLocation]);

  useDragReset(() => {
    setDragging(false);
    setDropCase(null);
  });

  async function uploadFilesToCase(id: string, files: FileList) {
    const results = await Promise.all(
      Array.from(files).map((file) => {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("caseId", id);
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
  }

  return (
    <div
      className="p-8 relative h-full"
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
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
      <div className="mb-4">
        <label className="mr-2" htmlFor="order">
          Order by:
        </label>
        <select
          id="order"
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value as Order)}
          className="border rounded p-1 bg-white dark:bg-gray-900"
        >
          <option value="createdAt">Creation Date</option>
          <option value="updatedAt">Last Updated</option>
          <option value="distance">Distance from My Location</option>
        </select>
      </div>
      <ul className="grid gap-4">
        {cases.map((c) => (
          <li
            key={c.id}
            onDragEnter={() => {
              setDropCase(c.id);
              setDragging(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDropCase(null);
              }
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
              className="flex flex-col sm:flex-row lg:flex-col items-start gap-2 sm:gap-4 w-full text-left"
            >
              <div className="relative">
                {(() => {
                  const photo = getRepresentativePhoto(c);
                  return photo ? (
                    <Image
                      src={getThumbnailUrl(photo, 128)}
                      alt="case thumbnail"
                      width={120}
                      height={90}
                    />
                  ) : null;
                })()}
                {c.photos.length > 1 ? (
                  <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs rounded px-1">
                    {c.photos.length}
                  </span>
                ) : null}
              </div>
              {(() => {
                const g = getOfficialCaseGps(c);
                return g ? (
                  <MapPreview
                    lat={g.lat}
                    lon={g.lon}
                    width={120}
                    height={90}
                    className="w-32 aspect-[4/3] lg:hidden"
                  />
                ) : null;
              })()}
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
        <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center pointer-events-none text-xl z-10">
          {dropCase
            ? `Add photos to case ${dropCase}`
            : "Drop photos to create case"}
        </div>
      ) : null}
    </div>
  );
}
