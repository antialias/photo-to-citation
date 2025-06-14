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
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import tippy from "tippy.js";
if (typeof window !== "undefined" && !process.env.VITEST) {
  import("tippy.js/dist/tippy.css");
}

const UPLOADED_PREVIEW_COUNT = 4;

const Mermaid = dynamic(() => import("react-mermaid2"), { ssr: false });

const allSteps = [
  { id: "uploaded", label: "Photographs Uploaded" },
  { id: "analysis", label: "Analysis Complete" },
  { id: "violation", label: "Violation Identified" },
  { id: "noviol", label: "No Violation Identified" },
  { id: "plate", label: "License Plate Identified" },
  { id: "vin", label: "VIN Verified" },
  { id: "ownreq", label: "Ownership Info Requested" },
  { id: "own", label: "Ownership Info Obtained" },
  { id: "ownnotify", label: "Registered Owner Notified" },
  { id: "notify", label: "Authorities Notified" },
  { id: "confirm", label: "Authority Response Confirmed" },
  { id: "sent", label: "Citation Sent" },
  { id: "received", label: "Citation Received" },
] as const;

export default function CaseProgressGraph({ caseData }: { caseData: Case }) {
  const analysisDone = caseData.analysisStatus === "complete";
  const violation = analysisDone && hasViolation(caseData.analysis);
  const noviolation = analysisDone && !violation;

  const analysisPending =
    caseData.analysisStatus === "pending" && !caseData.analysis;
  const reanalysisPending =
    caseData.analysisStatus === "pending" && Boolean(caseData.analysis);

  const steps = useMemo(() => {
    return noviolation
      ? allSteps.filter((s) =>
          ["uploaded", "analysis", "noviol"].includes(s.id),
        )
      : allSteps.filter((s) => s.id !== "noviol");
  }, [noviolation]);

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
      analysisPending ? "analysis requested" : null,
    ]);
    if (reanalysisPending) {
      edgesList.push(["analysis", "analysis", true, "re-analysis requested"]);
    }
    if (noviolation) {
      edgesList.push(["analysis", "noviol", true, "no violation"]);
    } else {
      edgesList.push(["analysis", "violation", true, "evaluating"]);
      edgesList.push(["violation", "plate", true, "detecting plate"]);
      edgesList.push(["plate", "vin", true, "decoding VIN"]);
      edgesList.push(["plate", "ownreq", true, "requesting ownership"]);
      edgesList.push(["vin", "ownreq", false, "lookup ownership"]);
      edgesList.push(["ownreq", "own", true, "awaiting ownership info"]);
      edgesList.push(["own", "ownnotify", true, "notifying owner"]);
      edgesList.push(["violation", "notify", true, "notifying authorities"]);
      edgesList.push([
        "notify",
        "confirm",
        true,
        "awaiting response from authorities",
      ]);
      edgesList.push(["confirm", "sent", true, "citation processing"]);
      edgesList.push(["sent", "received", true, "awaiting delivery"]);
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
        return caseData.photos[0] ?? null;
      for (const [name, info] of Object.entries(caseData.analysis.images)) {
        if (
          info.paperworkInfo?.vehicle?.licensePlateNumber === plate ||
          info.highlights?.toLowerCase().includes("plate")
        ) {
          const file = caseData.photos.find((p) => p.split("/").pop() === name);
          if (file) return file;
        }
      }
      return caseData.photos[0] ?? null;
    })();
    const ownerDoc = (caseData.threadImages ?? []).find(
      (i) => i.ocrInfo?.contact,
    );
    const ownerLink = ownerDoc
      ? ownerDoc.threadParent
        ? `/cases/${caseData.id}/thread/${encodeURIComponent(ownerDoc.threadParent)}`
        : ownerDoc.url
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
        ? `click uploaded "${caseData.photos[0]}" "${clean(uploadedTip)}"`
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
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const instances: Array<import("tippy.js").Instance> = [];
    const apply = () => {
      for (const inst of instances) inst.destroy();
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
          return caseData.photos[0] ?? null;
        for (const [name, info] of Object.entries(caseData.analysis.images)) {
          if (
            info.paperworkInfo?.vehicle?.licensePlateNumber === plate ||
            info.highlights?.toLowerCase().includes("plate")
          ) {
            const file = caseData.photos.find(
              (p) => p.split("/").pop() === name,
            );
            if (file) return file;
          }
        }
        return caseData.photos[0] ?? null;
      })();
      const ownerDoc = (caseData.threadImages ?? []).find(
        (i) => i.ocrInfo?.contact,
      );
      const ownerLink = ownerDoc
        ? ownerDoc.threadParent
          ? `/cases/${caseData.id}/thread/${encodeURIComponent(ownerDoc.threadParent)}`
          : ownerDoc.url
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
          url: caseData.photos[0],
          preview: caseData.photos.slice(-UPLOADED_PREVIEW_COUNT),
          isImage: true,
          count: caseData.photos.length,
        };
      if (platePhoto)
        map.plate = { url: platePhoto, preview: platePhoto, isImage: true };
      if (ownerLink)
        map.own = {
          url: ownerLink,
          preview: ownerDoc?.url ?? ownerLink,
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
          url: bestViolation.photo,
          preview: bestViolation.photo,
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
          menu: true,
        } as Record<string, unknown>;
      const escapeHtml = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      for (const [id, info] of Object.entries(map)) {
        if (!info) continue;
        const el = container.querySelector(
          `[id^='flowchart-${id}-']`,
        ) as HTMLElement | null;
        if (!el) continue;
        let content: string;
        let interactive = false;
        let trigger: "click" | "mouseenter focus" = "mouseenter focus";
        if (id === "analysis" && caseData.analysis) {
          interactive = true;
          trigger = "click";
          content = `<div class="flex flex-col text-sm"><button type="button" class="reanalyze px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700">Re-run Analysis</button><a href="${info.url}" target="_blank" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">View Analysis</a></div>`;
        } else {
          content = (() => {
            if (info.isImage !== false) {
              if (Array.isArray(info.preview)) {
                const small = info.preview.length > 1;
                const imgClass = small ? "max-h-24 my-1" : "max-h-40";
                const imgs = (info.preview as string[])
                  .map((p) => `<img src="${p}" class="${imgClass}" />`)
                  .join("");
                const extra =
                  info.count && info.count > (info.preview as string[]).length
                    ? info.count - (info.preview as string[]).length
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
              return `<div class="flex flex-col items-center"><img src="${info.preview}" class="max-h-40" />${caption}</div>`;
            }
            return `<div class="max-w-xs whitespace-pre-wrap">${escapeHtml(
              info.preview as string,
            )}</div>`;
          })();
        }
        const inst = tippy(el, {
          content,
          allowHTML: true,
          interactive,
          trigger,
        });
        if (id === "analysis") {
          const btn = inst.popper.querySelector(
            ".reanalyze",
          ) as HTMLButtonElement | null;
          btn?.addEventListener("click", async () => {
            await fetch(`/api/cases/${caseData.id}/reanalyze`, {
              method: "POST",
            });
            window.location.reload();
          });
        } else {
          el.addEventListener("click", () => window.open(info.url, "_blank"));
        }
        instances.push(inst);
      }
    };
    const observer = new MutationObserver(() => apply());
    observer.observe(container, { childList: true, subtree: true });
    const timer = window.setTimeout(apply, 500);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      for (const inst of instances) inst.destroy();
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
