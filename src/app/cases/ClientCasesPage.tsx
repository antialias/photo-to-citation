"use client";
import { apiFetch } from "@/apiClient";
import AnalysisInfo from "@/app/components/AnalysisInfo";
import MapPreview from "@/app/components/MapPreview";
import useNewCaseFromFiles from "@/app/useNewCaseFromFiles";
import type { Case } from "@/lib/caseStore";
import { getOfficialCaseGps, getRepresentativePhoto } from "@/lib/caseUtils";
import { distanceBetween } from "@/lib/distance";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotify } from "../components/NotificationProvider";
import { caseQueryKey } from "../hooks/useCase";
import useEventSource from "../hooks/useEventSource";
import { useSession } from "../useSession";
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
  const [states, setStates] = useState<string[]>(["open"]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const uploadNewCase = useNewCaseFromFiles();
  const [dragging, setDragging] = useState(false);
  const [dropCase, setDropCase] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { data: session } = useSession();
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const selectedIds =
    searchParams.get("ids")?.split(",").filter(Boolean) ??
    (params.id ? [params.id] : []);

  useEventSource<Case & { deleted?: boolean }>(
    session ? "/api/cases/stream" : null,
    (data) => {
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
    },
  );

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
      notify(t("failedUpload"));
      return;
    }
  }

  async function translate(id: string, path: string, lang: string) {
    const res = await apiFetch(`/api/cases/${id}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, lang }),
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(id) });
    } else {
      notify("Failed to translate.");
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
      <h1 className="text-xl font-bold mb-4">{t("nav.cases")}</h1>
      <div className="mb-4 flex items-center gap-4">
        <label className="mr-2" htmlFor="order">
          {t("orderBy")}
        </label>
        <select
          id="order"
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value as Order)}
          className="border rounded p-1 bg-white dark:bg-gray-900"
        >
          <option value="createdAt">{t("creationDate")}</option>
          <option value="updatedAt">{t("lastUpdated")}</option>
          <option value="distance">{t("distanceFromMe")}</option>
        </select>
        <label className="flex items-center gap-1" htmlFor="case-states">
          <span>{t("show")}</span>
          <select
            id="case-states"
            multiple
            value={states}
            onChange={(e) =>
              setStates(
                Array.from(e.target.selectedOptions).map((o) => o.value),
              )
            }
            className="border rounded p-1 bg-white dark:bg-gray-900"
          >
            <option value="open">{t("open")}</option>
            <option value="archived">{t("archived")}</option>
            <option value="closed">{t("closed")}</option>
          </select>
        </label>
      </div>
      <ul className="grid gap-4">
        {cases
          .filter((c) => {
            const state = c.archived
              ? "archived"
              : c.closed
                ? "closed"
                : "open";
            return states.includes(state);
          })
          .map((c) => (
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
              <Link
                href={session ? `/cases/${c.id}` : `/public/cases/${c.id}`}
                onClick={(e) => {
                  if (e.shiftKey) {
                    e.preventDefault();
                    const ids = Array.from(new Set([...selectedIds, c.id]));
                    router.push(`/cases?ids=${ids.join(",")}`);
                  }
                }}
                className="flex flex-wrap lg:flex-nowrap items-start gap-4 w-full text-left"
              >
                <div className="relative">
                  {(() => {
                    const photo = getRepresentativePhoto(c);
                    return photo ? (
                      <img
                        src={`/uploads/${photo}`}
                        alt={t("casePreview")}
                        width={80}
                        height={60}
                        loading="lazy"
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
                      className="w-20 aspect-[4/3]"
                    />
                  ) : null;
                })()}
                <div className="flex flex-col text-sm gap-1">
                  <span className="font-semibold">
                    {t("caseLabel", { id: c.id })}
                  </span>
                  {c.analysis ? (
                    <>
                      <AnalysisInfo
                        analysis={c.analysis}
                        onTranslate={() =>
                          translate(c.id, "analysis.details", i18n.language)
                        }
                      />
                      {c.analysisStatus === "pending" ? (
                        <span className="text-gray-500 dark:text-gray-400">
                          {t("updatingAnalysis")}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      {t("analyzingPhoto")}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
      </ul>
      {dragging ? (
        <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center pointer-events-none text-xl z-nav">
          {dropCase
            ? t("addPhotosToCase", { id: dropCase })
            : t("dropPhotosToCreateCase")}
        </div>
      ) : null}
    </div>
  );
}
