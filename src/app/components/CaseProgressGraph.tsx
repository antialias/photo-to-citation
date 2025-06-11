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
  { id: "email", label: "Email Sent" },
  { id: "notify", label: "Authorities Notified" },
  { id: "confirm", label: "Authority Response Confirmed" },
  { id: "sent", label: "Citation Sent" },
  { id: "received", label: "Citation Received" },
] as const;

export default function CaseProgressGraph({ caseData }: { caseData: Case }) {
  const status = useMemo(() => {
    return {
      uploaded: true,
      analysis: caseData.analysisStatus === "complete",
      plate: Boolean(caseData.analysis?.vehicle?.licensePlateNumber),
      vin: Boolean(caseData.vin),
      ownreq: false,
      own: false,
      email: (caseData.sentEmails?.length ?? 0) > 0,
      notify: (caseData.sentEmails?.length ?? 0) > 0,
      confirm: false,
      sent: false,
      received: false,
    } as Record<string, boolean>;
  }, [caseData]);

  const firstPending = steps.findIndex((s) => !status[s.id]);

  const chart = useMemo(() => {
    const nodes = steps.map((s) => `${s.id}["${s.label}"]`).join("\n");
    const edgesList: Array<[string, string, boolean]> = [
      ["uploaded", "analysis", true],
      ["analysis", "plate", true],
      ["plate", "vin", false],
      ["plate", "ownreq", true],
      ["vin", "email", false],
      ["ownreq", "own", true],
      ["own", "email", false],
      ["plate", "email", true],
      ["email", "notify", true],
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
  }, [status, firstPending]);

  return (
    <div className="max-w-full overflow-x-auto">
      <Mermaid chart={chart} />
    </div>
  );
}
