"use client";
import type { Case } from "@/lib/caseStore";
import {
  getAnalysisSummary,
  getBestViolationPhoto,
  getCaseOwnerContact,
  getCaseOwnerContactInfo,
  getCasePlateNumber,
  getCasePlateState,
  getCaseVin,
  hasViolation,
} from "@/lib/caseUtils";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const UPLOADED_PREVIEW_COUNT = 4;

const Mermaid = dynamic(() => import("react-mermaid2"), { ssr: false });

const allSteps = [
  { id: "uploaded", key: "progress.uploaded" },
  { id: "analysis", key: "progress.analysis" },
  { id: "violation", key: "progress.violation" },
  { id: "noviol", key: "progress.noviol" },
  { id: "plate", key: "progress.plate" },
  { id: "vin", key: "progress.vin" },
  { id: "ownreq", key: "progress.ownreq" },
  { id: "own", key: "progress.own" },
  { id: "ownnotify", key: "progress.ownnotify" },
  { id: "notify", key: "progress.notify" },
  { id: "confirm", key: "progress.confirm" },
  { id: "sent", key: "progress.sent" },
  { id: "received", key: "progress.received" },
] as const;

export default function CaseProgressGraph({ caseData }: { caseData: Case }) {
  const { t } = useTranslation();
  const analysisDone = caseData.analysisStatus === "complete";
  const violation = analysisDone && hasViolation(caseData.analysis);
  const noviolation = analysisDone && !violation;

  const analysisPending =
    caseData.analysisStatus === "pending" &&
    !caseData.analysis &&
    caseData.analysisProgress;
  const reanalysisPending =
    caseData.analysisStatus === "pending" &&
    Boolean(caseData.analysis) &&
    caseData.analysisProgress;

  const steps = useMemo(() => {
    const translated = allSteps.map((s) => ({ id: s.id, label: t(s.key) }));
    return noviolation
      ? translated.filter((s) =>
          ["uploaded", "analysis", "noviol"].includes(s.id),
        )
      : translated.filter((s) => s.id !== "noviol");
  }, [noviolation, t]);

  const status = useMemo(() => {
    return {
      uploaded: true,
      analysis: analysisDone,
      violation,
      noviol: noviolation,
      plate:
        violation &&
        Boolean(getCasePlateNumber(caseData) || getCasePlateState(caseData)),
      vin: violation && Boolean(getCaseVin(caseData)),
      ownreq: Boolean(
        caseData.ownershipRequests && caseData.ownershipRequests.length > 0,
      ),
      own: Boolean(getCaseOwnerContact(caseData)),
      ownnotify: Boolean(
        (() => {
          const info = getCaseOwnerContactInfo(caseData);
          return info?.email
            ? (caseData.sentEmails ?? []).some((m) => m.to === info.email)
            : false;
        })(),
      ),
      notify: Boolean(caseData.sentEmails && caseData.sentEmails.length > 0),
      confirm: false,
      sent: false,
      received: false,
    } as Record<string, boolean>;
  }, [analysisDone, violation, noviolation, caseData]);

  const firstPending = steps.findIndex((s) => !status[s.id]);

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mql.matches);
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  const chart = useMemo(() => {
    const nodes = steps.map((s) => `${s.id}["${s.label}"]`).join("\n");
    const edgesList: Array<[string, string, boolean, string | null]> = [];
    edgesList.push([
      "uploaded",
      "analysis",
      true,
      analysisPending ? t("progressEdges.analysisRequested") : null,
    ]);
    if (reanalysisPending) {
      edgesList.push([
        "analysis",
        "analysis",
        true,
        t("progressEdges.reanalysisRequested"),
      ]);
    }
    if (noviolation) {
      edgesList.push([
        "analysis",
        "noviol",
        true,
        t("progressEdges.noViolation"),
      ]);
    } else {
      edgesList.push([
        "analysis",
        "violation",
        true,
        t("progressEdges.evaluating"),
      ]);
      edgesList.push([
        "violation",
        "plate",
        true,
        t("progressEdges.detectingPlate"),
      ]);
      edgesList.push(["plate", "vin", false, t("progressEdges.decodingVin")]);
      edgesList.push([
        "plate",
        "ownreq",
        true,
        t("progressEdges.requestingOwnership"),
      ]);
      edgesList.push([
        "vin",
        "ownreq",
        false,
        t("progressEdges.lookupOwnership"),
      ]);
      edgesList.push([
        "ownreq",
        "own",
        true,
        t("progressEdges.awaitingOwnershipInfo"),
      ]);
      edgesList.push([
        "own",
        "ownnotify",
        true,
        t("progressEdges.notifyingOwner"),
      ]);
      edgesList.push([
        "violation",
        "notify",
        true,
        t("progressEdges.notifyingAuthorities"),
      ]);
      edgesList.push([
        "notify",
        "confirm",
        true,
        t("progressEdges.awaitingAuthorityResponse"),
      ]);
      edgesList.push([
        "confirm",
        "sent",
        true,
        t("progressEdges.citationProcessing"),
      ]);
      edgesList.push([
        "sent",
        "received",
        true,
        t("progressEdges.awaitingDelivery"),
      ]);
    }
    const activeFromIdx = firstPending > 0 ? firstPending - 1 : -1;
    let activeFrom = activeFromIdx >= 0 ? steps[activeFromIdx].id : null;
    const activeTo = firstPending >= 0 ? steps[firstPending].id : null;
    if (reanalysisPending) activeFrom = "analysis";
    const edges = edgesList
      .map(([a, b, hard, label]) => {
        const show = label && a === activeFrom && b === activeTo;
        return `${a}${hard ? "-->" : "-.->"}${show ? `|${label}|` : ""}${b}`;
      })
      .join("\n");
    const classAssignments = steps
      .map((s, i) => {
        const cls = status[s.id]
          ? "completed"
          : i === firstPending
            ? "current"
            : "pending";
        return `class ${s.id} ${cls}`;
      })
      .join("\n");
    const platePhoto = (() => {
      const plate = getCasePlateNumber(caseData);
      if (!plate || !caseData.analysis?.images)
        return caseData.photos[0] ? `/uploads/${caseData.photos[0]}` : null;
      for (const [name, info] of Object.entries(caseData.analysis.images)) {
        const hi =
          typeof info.highlights === "string"
            ? info.highlights
            : (info.highlights?.[caseData.analysis?.language ?? "en"] ??
              Object.values(info.highlights ?? {})[0] ??
              "");
        if (
          info.paperworkInfo?.vehicle?.licensePlateNumber === plate ||
          hi.toLowerCase().includes("plate")
        ) {
          const file = caseData.photos.find((p) => p.split("/").pop() === name);
          if (file) return `/uploads/${file}`;
        }
      }
      return caseData.photos[0] ? `/uploads/${caseData.photos[0]}` : null;
    })();
    const ownerDoc = (caseData.threadImages ?? []).find(
      (i) => i.ocrInfo?.contact,
    );
    const ownerLink = ownerDoc
      ? ownerDoc.threadParent
        ? `/cases/${caseData.id}/thread/${encodeURIComponent(ownerDoc.threadParent)}`
        : `/uploads/${ownerDoc.url}`
      : null;
    const ownerInfo = getCaseOwnerContactInfo(caseData);
    const ownerNotifyEmail = ownerInfo?.email
      ? (caseData.sentEmails ?? []).find((m) => m.to === ownerInfo.email)
      : undefined;
    const ownerNotifyLink = ownerNotifyEmail
      ? `/cases/${caseData.id}/thread/${encodeURIComponent(ownerNotifyEmail.sentAt)}`
      : null;
    const firstEmail = caseData.sentEmails?.find(
      (m) => !ownerInfo?.email || m.to !== ownerInfo.email,
    );
    const notifyLink = firstEmail
      ? `/cases/${caseData.id}/thread/${encodeURIComponent(firstEmail.sentAt)}`
      : null;
    const clean = (t: string) => t.replace(/"/g, "'");
    const uploadedAt = caseData.photoTimes[caseData.photos[0]] ?? null;
    const uploadedTip = uploadedAt
      ? `Photo taken ${new Date(uploadedAt).toLocaleString()}`
      : "View uploaded photo";
    const plateTipParts = [] as string[];
    const plateNum = getCasePlateNumber(caseData);
    const plateState = getCasePlateState(caseData);
    if (plateNum) plateTipParts.push(`Plate: ${plateNum}`);
    if (plateState) plateTipParts.push(`State: ${plateState}`);
    if (platePhoto) plateTipParts.push("View plate photo");
    const plateTip = plateTipParts.join(" \u2013 ");
    const ownerContact = getCaseOwnerContact(caseData);
    const ownerTip = ownerContact
      ? `Owner info: ${ownerContact.slice(0, 40)}${
          ownerContact.length > 40 ? "…" : ""
        }`
      : "View paperwork";
    const notifyTip = firstEmail
      ? `Notification email to ${firstEmail.to} on ${new Date(firstEmail.sentAt).toLocaleString()}`
      : "View notification email";
    const ownerNotifyTip = ownerNotifyEmail
      ? `Notification email to ${ownerNotifyEmail.to} on ${new Date(ownerNotifyEmail.sentAt).toLocaleString()}`
      : "View owner notification";
    const analysisTip =
      caseData.analysis && getAnalysisSummary(caseData.analysis);
    const links = [
      caseData.photos[0]
        ? `click uploaded "/uploads/${caseData.photos[0]}" "${clean(uploadedTip)}"`
        : null,
      platePhoto ? `click plate "${platePhoto}" "${clean(plateTip)}"` : null,
      ownerLink ? `click own "${ownerLink}" "${clean(ownerTip)}"` : null,
      ownerNotifyLink
        ? `click ownnotify "${ownerNotifyLink}" "${clean(ownerNotifyTip)}"`
        : null,
      notifyLink ? `click notify "${notifyLink}" "${clean(notifyTip)}"` : null,
      analysisTip
        ? `click analysis "/cases/${caseData.id}" "${clean(analysisTip)}"`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    const light = {
      completedFill: "#D1FAE5",
      completedStroke: "#047857",
      currentFill: "#FEF3C7",
      currentStroke: "#92400E",
      pendingFill: "#F3F4F6",
      pendingStroke: "#6B7280",
    };
    const dark = {
      completedFill: "#064E3B",
      completedStroke: "#10B981",
      currentFill: "#78350F",
      currentStroke: "#FBBF24",
      pendingFill: "#1F2937",
      pendingStroke: "#9CA3AF",
    };
    const c = isDark ? dark : light;
    const textColor = isDark ? "#F9FAFB" : "#000000";
    const edgeStyle = `linkStyle default fill:none,stroke:${c.pendingStroke},stroke-width:2px;`;
    return `graph TD\n${nodes}\n${edges}\n${links}\nclassDef completed fill:${c.completedFill},stroke:${c.completedStroke},color:${textColor};\nclassDef current fill:${c.currentFill},stroke:${c.currentStroke},color:${textColor};\nclassDef pending fill:${c.pendingFill},stroke:${c.pendingStroke},color:${textColor};\n${edgeStyle}\n${classAssignments}`;
  }, [
    status,
    firstPending,
    noviolation,
    steps,
    isDark,
    caseData,
    analysisPending,
    reanalysisPending,
    t,
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const instances: Array<() => void> = [];
    const apply = () => {
      for (const cleanup of instances) cleanup();
      instances.length = 0;
      const map: Record<
        string,
        {
          url: string;
          preview: string | string[];
          isImage?: boolean;
          count?: number;
          caption?: string;
        } | null
      > = {};
      const platePhoto = (() => {
        const plate = getCasePlateNumber(caseData);
        if (!plate || !caseData.analysis?.images)
          return caseData.photos[0] ? `/uploads/${caseData.photos[0]}` : null;
        for (const [name, info] of Object.entries(caseData.analysis.images)) {
          const hi =
            typeof info.highlights === "string"
              ? info.highlights
              : (info.highlights?.[caseData.analysis?.language ?? "en"] ??
                Object.values(info.highlights ?? {})[0] ??
                "");
          if (
            info.paperworkInfo?.vehicle?.licensePlateNumber === plate ||
            hi.toLowerCase().includes("plate")
          ) {
            const file = caseData.photos.find(
              (p) => p.split("/").pop() === name,
            );
            if (file) return `/uploads/${file}`;
          }
        }
        return caseData.photos[0] ? `/uploads/${caseData.photos[0]}` : null;
      })();
      const ownerDoc = (caseData.threadImages ?? []).find(
        (i) => i.ocrInfo?.contact,
      );
      const ownerLink = ownerDoc
        ? ownerDoc.threadParent
          ? `/cases/${caseData.id}/thread/${encodeURIComponent(ownerDoc.threadParent)}`
          : `/uploads/${ownerDoc.url}`
        : null;
      const ownerInfo = getCaseOwnerContactInfo(caseData);
      const ownerNotifyEmail = ownerInfo?.email
        ? (caseData.sentEmails ?? []).find((m) => m.to === ownerInfo.email)
        : undefined;
      const ownerNotifyLink = ownerNotifyEmail
        ? `/cases/${caseData.id}/thread/${encodeURIComponent(ownerNotifyEmail.sentAt)}`
        : null;
      const firstEmail = caseData.sentEmails?.find(
        (m) => !ownerInfo?.email || m.to !== ownerInfo.email,
      );
      const notifyLink = firstEmail
        ? `/cases/${caseData.id}/thread/${encodeURIComponent(firstEmail.sentAt)}`
        : null;
      const bestViolation = getBestViolationPhoto(caseData);
      if (caseData.photos.length > 0)
        map.uploaded = {
          url: `/uploads/${caseData.photos[0]}`,
          preview: caseData.photos
            .slice(-UPLOADED_PREVIEW_COUNT)
            .map((p) => `/uploads/${p}`),
          isImage: true,
          count: caseData.photos.length,
        };
      if (platePhoto)
        map.plate = { url: platePhoto, preview: platePhoto, isImage: true };
      if (ownerLink)
        map.own = {
          url: ownerLink,
          preview: ownerDoc?.url ? `/uploads/${ownerDoc.url}` : ownerLink,
          isImage: true,
        };
      if (ownerNotifyLink)
        map.ownnotify = {
          url: ownerNotifyLink,
          preview: ownerNotifyEmail?.body ?? "",
          isImage: false,
        };
      if (notifyLink)
        map.notify = {
          url: notifyLink,
          preview: firstEmail?.body ?? "",
          isImage: false,
        };
      if (bestViolation)
        map.violation = {
          url: `/uploads/${bestViolation.photo}`,
          preview: `/uploads/${bestViolation.photo}`,
          isImage: true,
          caption: bestViolation.caption,
        };
      const vin = getCaseVin(caseData);
      if (vin)
        map.vin = {
          url: "",
          preview: vin,
          isImage: false,
        };
      if (caseData.analysis)
        map.analysis = {
          url: `/cases/${caseData.id}`,
          preview: getAnalysisSummary(caseData.analysis),
          isImage: false,
        };
      const escapeHtml = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      for (const [id, info] of Object.entries(map)) {
        if (!info) continue;
        const el = container.querySelector(
          `[id^='flowchart-${id}-']`,
        ) as HTMLElement | null;
        if (!el) continue;
        const content = (() => {
          if (info.isImage !== false) {
            if (Array.isArray(info.preview)) {
              const small = info.preview.length > 1;
              const imgClass = small ? "max-h-24 my-1" : "max-h-40";
              const imgs = info.preview
                .map(
                  (p) =>
                    `<img src="${p}" class="${imgClass}" alt="case preview" />`,
                )
                .join("");
              const extra =
                info.count && info.count > info.preview.length
                  ? info.count - info.preview.length
                  : 0;
              const extraLine =
                extra > 0
                  ? `<div class="text-xs text-center mt-1">and ${extra} more photo${extra === 1 ? "" : "s"} not shown</div>`
                  : "";
              return `<div class="flex flex-col items-center overflow-y-auto" style="max-height:60vh; max-width:80vw;">${imgs}${extraLine}</div>`;
            }
            const caption = info.caption
              ? `<div class="text-xs text-center mt-1">${escapeHtml(
                  info.caption,
                )}</div>`
              : "";
            return `<div class="flex flex-col items-center"><img src="${info.preview}" class="max-h-40" alt="case preview" />${caption}</div>`;
          }
          return `<div class="max-w-xs whitespace-pre-wrap">${escapeHtml(
            info.preview as string,
          )}</div>`;
        })();
        const tooltip = document.createElement("div");
        tooltip.innerHTML = content;
        tooltip.className =
          "z-50 rounded bg-black/80 text-white text-xs p-2 shadow";
        tooltip.style.position = "absolute";
        let cleanupAuto: (() => void) | null = null;
        const show = () => {
          document.body.appendChild(tooltip);
          const update = () => {
            computePosition(el, tooltip, {
              middleware: [offset(6), flip(), shift({ padding: 5 })],
            }).then(({ x, y }) => {
              Object.assign(tooltip.style, {
                left: `${x}px`,
                top: `${y}px`,
              });
            });
          };
          cleanupAuto = autoUpdate(el, tooltip, update);
          update();
        };
        const hide = () => {
          cleanupAuto?.();
          cleanupAuto = null;
          tooltip.remove();
        };
        const clickHandler = () => window.open(info.url, "_blank");
        el.addEventListener("mouseenter", show);
        el.addEventListener("mouseleave", hide);
        el.addEventListener("click", clickHandler);
        instances.push(() => {
          el.removeEventListener("mouseenter", show);
          el.removeEventListener("mouseleave", hide);
          el.removeEventListener("click", clickHandler);
          hide();
        });
      }
    };
    const observer = new MutationObserver(() => apply());
    observer.observe(container, { childList: true, subtree: true });
    const timer = window.setTimeout(apply, 500);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      for (const cleanup of instances) cleanup();
    };
  }, [caseData]);

  return (
    <div className="max-w-full overflow-x-auto" ref={containerRef}>
      <Mermaid
        chart={chart}
        key={chart}
        config={{
          theme: isDark ? "dark" : "default",
          themeVariables: isDark
            ? {
                primaryTextColor: "#F9FAFB",
                textColor: "#F9FAFB",
                nodeTextColor: "#F9FAFB",
              }
            : {},
        }}
      />
    </div>
  );
}
