"use client";
import type { Case } from "@/lib/caseStore";
import dynamic from "next/dynamic";
import { useMemo } from "react";

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
  { id: "notify", label: "Authorities Notified" },
  { id: "confirm", label: "Authority Response Confirmed" },
  { id: "sent", label: "Citation Sent" },
  { id: "received", label: "Citation Received" },
] as const;

export default function CaseProgressGraph({ caseData }: { caseData: Case }) {
  const analysisDone = caseData.analysisStatus === "complete";
  const violation = analysisDone && Boolean(caseData.analysis?.violationType);
  const noviolation = analysisDone && !violation;

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
        violation && Boolean(caseData.analysis?.vehicle?.licensePlateNumber),
      vin: violation && Boolean(caseData.vin),
      ownreq: false,
      own: false,
      notify: violation,
      confirm: false,
      sent: false,
      received: false,
    } as Record<string, boolean>;
  }, [analysisDone, violation, noviolation, caseData]);

  const firstPending = steps.findIndex((s) => !status[s.id]);

  const chart = useMemo(() => {
    const nodes = steps.map((s) => `${s.id}["${s.label}"]`).join("\n");
    const edgesList: Array<[string, string, boolean]> = noviolation
      ? [
          ["uploaded", "analysis", true],
          ["analysis", "noviol", true],
        ]
      : [
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
    return `graph TD\n${nodes}\n${edges}\nclassDef completed fill:#D1FAE5,stroke:#047857;\nclassDef current fill:#FEF3C7,stroke:#92400E;\nclassDef pending fill:#F3F4F6,stroke:#6B7280;\n${classAssignments}`;
  }, [status, firstPending, noviolation, steps]);

  return (
    <div className="max-w-full overflow-x-auto">
      <Mermaid chart={chart} key={chart} />
    </div>
  );
}
