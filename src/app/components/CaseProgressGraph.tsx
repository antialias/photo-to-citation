"use client";
import type { Case } from "@/lib/caseStore";
import {
  getCaseOwnerContact,
  getCasePlateNumber,
  getCasePlateState,
  getCaseVin,
  hasViolation,
} from "@/lib/caseUtils";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const Mermaid = dynamic(() => import("react-mermaid2"), { ssr: false });

const allSteps = [
  { id: "uploaded", label: "Photographs Uploaded" },
  { id: "analysisPending", label: "Analysis Requested" },
  { id: "analysis", label: "Analysis Complete" },
  { id: "reanalysis", label: "Re-analysis Requested" },
  { id: "violation", label: "Violation Identified" },
  { id: "noviol", label: "No Violation Identified" },
  { id: "plate", label: "License Plate Identified" },
  { id: "vin", label: "VIN Verified" },
  { id: "ownreq", label: "Ownership Info Requested" },
  { id: "own", label: "Ownership Info Obtained" },
  { id: "notify", label: "Authorities Notified" },
  { id: "confirm", label: "Authority Response Confirmed" },
  { id: "sent", label: "Citation Sent" },
  { id: "received", label: "Citation Received" },
] as const;

export default function CaseProgressGraph({ caseData }: { caseData: Case }) {
  const analysisDone = caseData.analysisStatus === "complete";
  const violation = analysisDone && hasViolation(caseData.analysis);
  const noviolation = analysisDone && !violation;

  const steps = useMemo(() => {
    return noviolation
      ? allSteps.filter((s) =>
          ["uploaded", "analysis", "noviol"].includes(s.id),
        )
      : allSteps.filter((s) => s.id !== "noviol");
  }, [noviolation]);

  const status = useMemo(() => {
    const analysisPending =
      caseData.analysisStatus === "pending" && !caseData.analysis;
    const reanalysisPending =
      caseData.analysisStatus === "pending" && Boolean(caseData.analysis);
    return {
      uploaded: true,
      analysisPending,
      analysis: analysisDone,
      reanalysis: reanalysisPending,
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
    const edgesList: Array<[string, string, boolean]> = noviolation
      ? [
          ["uploaded", "analysis", true],
          ["analysisPending", "analysis", true],
          ["analysis", "noviol", true],
        ]
      : [
          ["uploaded", "analysis", true],
          ["analysisPending", "analysis", true],
          ["analysis", "violation", true],
          ["reanalysis", "analysis", true],
          ["violation", "plate", true],
          ["plate", "vin", true],
          ["plate", "ownreq", true],
          ["vin", "ownreq", false],
          ["ownreq", "own", true],
          ["violation", "notify", true],
          ["notify", "confirm", true],
          ["confirm", "sent", true],
          ["sent", "received", true],
        ];
    const edges = edgesList
      .map(([a, b, hard]) => `${a}${hard ? "-->" : "-.->"}${b}`)
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
    const firstEmail = caseData.sentEmails?.[0];
    const notifyLink = firstEmail
      ? `/cases/${caseData.id}/thread/${encodeURIComponent(firstEmail.sentAt)}`
      : null;
    const links = [
      caseData.photos[0] ? `click uploaded "${caseData.photos[0]}"` : null,
      platePhoto ? `click plate "${platePhoto}"` : null,
      ownerLink ? `click own "${ownerLink}"` : null,
      notifyLink ? `click notify "${notifyLink}"` : null,
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
    const edgeStyle = `linkStyle default fill:none,stroke:${c.pendingStroke},stroke-width:2px;`;
    return `graph TD\n${nodes}\n${edges}\n${links}\nclassDef completed fill:${c.completedFill},stroke:${c.completedStroke};\nclassDef current fill:${c.currentFill},stroke:${c.currentStroke};\nclassDef pending fill:${c.pendingFill},stroke:${c.pendingStroke};\n${edgeStyle}\n${classAssignments}`;
  }, [status, firstPending, noviolation, steps, isDark, caseData]);

  return (
    <div className="max-w-full overflow-x-auto">
      <Mermaid chart={chart} key={chart} />
    </div>
  );
}
