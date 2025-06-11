"use client";
import type { Case } from "@/lib/caseStore";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const Mermaid = dynamic(() => import("react-mermaid2"), { ssr: false });

const steps = [
  { id: "uploaded", label: "Photographs Uploaded" },
  { id: "analysis", label: "Analysis Complete" },
  { id: "noviol", label: "No Violation Identified" },
  { id: "violation", label: "Violation Identified" },
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
  const status = useMemo(() => {
    const analysisDone = caseData.analysisStatus === "complete";
    const violation = analysisDone && Boolean(caseData.analysis?.violationType);
    const noViolation = analysisDone && !caseData.analysis?.violationType;
    return {
      uploaded: true,
      analysis: analysisDone,
      noviol: noViolation,
      violation,
      plate: Boolean(caseData.analysis?.vehicle?.licensePlateNumber),
      vin: Boolean(caseData.vin),
      ownreq: false,
      own: false,
      notify: violation,
      confirm: false,
      sent: false,
      received: false,
    } as Record<string, boolean>;
  }, [caseData]);

  const visibleSteps = useMemo(() => {
    if (status.violation) {
      return steps.filter((s) => s.id !== "noviol");
    }
    const hidden = [
      "violation",
      "plate",
      "vin",
      "ownreq",
      "own",
      "notify",
      "confirm",
      "sent",
      "received",
    ];
    return steps.filter((s) => !hidden.includes(s.id));
  }, [status]);

  const firstPending = visibleSteps.findIndex((s) => !status[s.id]);

  const chart = useMemo(() => {
    const nodes = visibleSteps.map((s) => `${s.id}["${s.label}"]`).join("\n");
    let edgesList: Array<[string, string, boolean]> = [];
    if (status.violation) {
      edgesList = [
        ["uploaded", "analysis", true],
        ["analysis", "violation", true],
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
    } else {
      edgesList = [
        ["uploaded", "analysis", true],
        ["analysis", "noviol", true],
      ];
    }
    const edges = edgesList
      .map(([a, b, hard]) => `${a}${hard ? "-->" : "-.->"}${b}`)
      .join("\n");
    const classAssignments = visibleSteps
      .map((s, i) => {
        const cls = status[s.id]
          ? "completed"
          : i === firstPending
            ? "current"
            : "pending";
        return `class ${s.id} ${cls}`;
      })
      .join("\n");
    return `graph TD\n${nodes}\n${edges}\nclassDef completed fill:#D1FAE5,stroke:#047857;\nclassDef current fill:#FEF3C7,stroke:#92400E;\nclassDef pending fill:#F3F4F6,stroke:#6B7280;\n${classAssignments}`;
  }, [status, firstPending, visibleSteps]);

  return (
    <div className="max-w-full overflow-x-auto">
      <Mermaid chart={chart} />
    </div>
  );
}
