"use client";
import type { ViolationReport } from "@/lib/openai";
import { violationReportSchema } from "@/lib/openai";
import { useEffect, useState } from "react";

export default function ManualAnalysisModal({
  caseId,
  onClose,
}: {
  caseId: string;
  onClose: () => void;
}) {
  const defaultReport: ViolationReport = {
    violationType: "",
    details: "",
    images: {},
    vehicle: {},
  };
  const [text, setText] = useState(JSON.stringify(defaultReport, null, 2));
  const [valid, setValid] = useState(true);

  useEffect(() => {
    try {
      const obj = JSON.parse(text);
      violationReportSchema.parse(obj);
      setValid(true);
    } catch {
      setValid(false);
    }
  }, [text]);

  async function save() {
    await fetch(`/api/cases/${caseId}/override`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: text,
    });
    onClose();
  }

  function reset() {
    setText(JSON.stringify(defaultReport, null, 2));
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow max-w-xl w-full p-4 flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="border p-1 font-mono text-sm"
        />
        <div className="flex justify-between items-center">
          <span className={valid ? "text-green-600" : "text-red-600"}>
            {valid ? "Valid" : "Invalid"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="bg-gray-200 px-2 py-1 rounded"
            >
              Reset
            </button>
            <button
              type="button"
              disabled={!valid}
              onClick={save}
              className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 px-2 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
