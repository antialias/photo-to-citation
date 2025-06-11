"use client";
import type { Case } from "@/lib/caseStore";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const Mermaid = dynamic(() => import("react-mermaid2"), { ssr: false });

const steps = [
  { id: "uploaded", label: "Photographs Uploaded" },
  { id: "analysis", label: "Analysis Complete" },
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
  const progress = useMemo(() => {
    let idx = 0;
    if (caseData.analysisStatus === "complete") idx = 1;
    if (caseData.analysis?.vehicle?.licensePlateNumber) idx = 2;
    if (caseData.vin) idx = 3;
    return idx;
  }, [caseData]);

  const chart = useMemo(() => {
    const nodes = steps.map((s) => `${s.id}["${s.label}"]`).join("\n");
    const edges = steps
      .map((s, i) => {
        if (i === steps.length - 1) return "";
        return `${steps[i].id}-->${steps[i + 1].id}`;
      })
      .join("\n");
    const classAssignments = steps
      .map((s, i) => {
        const cls =
          i < progress ? "completed" : i === progress ? "current" : "pending";
        return `class ${s.id} ${cls}`;
      })
      .join("\n");
    return `graph TD\n${nodes}\n${edges}\nclassDef completed fill:#D1FAE5,stroke:#047857;\nclassDef current fill:#FEF3C7,stroke:#92400E;\nclassDef pending fill:#F3F4F6,stroke:#6B7280;\n${classAssignments}`;
  }, [progress]);

  return (
    <div className="max-w-full overflow-x-auto">
      <Mermaid chart={chart} />
    </div>
  );
}
