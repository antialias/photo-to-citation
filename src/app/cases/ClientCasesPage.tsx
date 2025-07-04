"use client";
import { apiFetch } from "@/apiClient";
import useNewCaseFromFiles from "@/app/useNewCaseFromFiles";
import CaseCard from "@/components/CaseCard";
import type { Case } from "@/lib/caseStore";
import { getOfficialCaseGps } from "@/lib/caseUtils";
import { distanceBetween } from "@/lib/distance";
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { type RefObject, useEffect, useRef, useState } from "react";
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
  scrollElement,
}: {
  initialCases: Case[];
  scrollElement?: RefObject<HTMLDivElement | null>;
}) {
  const [orderBy, setOrderBy] = useState<Order>("createdAt");
  const [cases, setCases] = useState(() => sortList(initialCases, "createdAt"));
  const [states, setStates] = useState<string[]>(["open"]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const uploadNewCase = useNewCaseFromFiles();
  const [dragging, setDragging] = useState(false);
  const [dropCase, setDropCase] = useState<string | null>(null);
  const notify = useNotify();
  const { data: session } = useSession();
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const selectedIds =
    searchParams.get("ids")?.split(",").filter(Boolean) ??
    (params.id ? [params.id] : []);

  const localScrollRef = useRef<HTMLDivElement>(null);

  const filteredCases = cases.filter((c) => {
    const state = c.archived ? "archived" : c.closed ? "closed" : "open";
    return states.includes(state);
  });

  const rowVirtualizer = scrollElement
    ? useVirtualizer({
        count: filteredCases.length,
        getScrollElement: () => scrollElement.current,
        estimateSize: () => 150,
        overscan: 5,
      })
    : null;

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

  return (
    <div
      ref={scrollElement ? undefined : localScrollRef}
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
      {rowVirtualizer ? (
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const c = filteredCases[virtualRow.index];
            return (
              <div
                key={c.id}
                ref={rowVirtualizer.measureElement}
                onDragEnter={() => {
                  setDropCase(c.id);
                  setDragging(true);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDropCase(null);
                  }
                }}
                className={`border rounded p-2 mb-4 last:mb-0${
                  selectedIds.includes(c.id)
                    ? " bg-gray-100 dark:bg-gray-800 ring-2 ring-blue-500"
                    : dropCase === c.id
                      ? " ring-2 ring-green-500"
                      : " ring-1 ring-transparent"
                }`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
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
                  className="block text-left"
                >
                  <CaseCard caseData={c} />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <ul className="grid gap-4">
          {filteredCases.map((c) => (
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
              className={`border rounded p-2${
                selectedIds.includes(c.id)
                  ? " bg-gray-100 dark:bg-gray-800 ring-2 ring-blue-500"
                  : dropCase === c.id
                    ? " ring-2 ring-green-500"
                    : " ring-1 ring-transparent"
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
                className="block text-left"
              >
                <CaseCard caseData={c} />
              </Link>
            </li>
          ))}
        </ul>
      )}
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
