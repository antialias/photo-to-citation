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
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";
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

  const styles = {
    container: css({ p: "8", position: "relative", h: "full" }),
    heading: css({ fontSize: "xl", fontWeight: "bold", mb: "4" }),
    controls: css({ mb: "4", display: "flex", alignItems: "center", gap: "4" }),
    label: css({ mr: "2" }),
    select: css({
      borderWidth: "1px",
      borderRadius: token("radii.md"),
      p: "1",
      backgroundColor: {
        base: token("colors.white"),
        _dark: token("colors.gray.900"),
      },
    }),
    filterLabel: css({ display: "flex", alignItems: "center", gap: "1" }),
    grid: css({ display: "grid", gap: "4" }),
    link: css({ display: "block", textAlign: "left" }),
    dropOverlay: css({
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
      fontSize: "xl",
      zIndex: "var(--z-nav)",
    }),
    listItem: (selected: boolean, dropping: boolean) =>
      css({
        borderWidth: "1px",
        borderRadius: token("radii.md"),
        p: "2",
        mb: "4",
        _last: { mb: 0 },
        ringWidth: selected || dropping ? "2px" : "1px",
        ringColor: selected
          ? token("colors.blue.500")
          : dropping
            ? token("colors.green.500")
            : "transparent",
        backgroundColor: selected
          ? { base: token("colors.gray.100"), _dark: token("colors.gray.800") }
          : undefined,
      }),
  };

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
      className={styles.container}
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
      <h1 className={styles.heading}>{t("nav.cases")}</h1>
      <div className={styles.controls}>
        <label className={styles.label} htmlFor="order">
          {t("orderBy")}
        </label>
        <select
          id="order"
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value as Order)}
          className={styles.select}
        >
          <option value="createdAt">{t("creationDate")}</option>
          <option value="updatedAt">{t("lastUpdated")}</option>
          <option value="distance">{t("distanceFromMe")}</option>
        </select>
        <label className={styles.filterLabel} htmlFor="case-states">
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
            className={styles.select}
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
                className={styles.listItem(
                  selectedIds.includes(c.id),
                  dropCase === c.id,
                )}
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
                  className={styles.link}
                >
                  <CaseCard caseData={c} />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <ul className={styles.grid}>
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
              className={styles.listItem(
                selectedIds.includes(c.id),
                dropCase === c.id,
              )}
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
                className={styles.link}
              >
                <CaseCard caseData={c} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {dragging ? (
        <div className={styles.dropOverlay} data-testid="drag-overlay">
          {dropCase
            ? t("addPhotosToCase", { id: dropCase })
            : t("dropPhotosToCreateCase")}
        </div>
      ) : null}
    </div>
  );
}
