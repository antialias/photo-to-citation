"use client";
import { apiFetch } from "@/apiClient";
import type { OwnershipModule } from "@/lib/ownershipModules";
import { useState } from "react";
import { useNotify } from "../../../components/NotificationProvider";

export default function OwnershipEditor({
  caseId,
  module,
}: {
  caseId: string;
  module: OwnershipModule;
}) {
  const [checkNumber, setCheckNumber] = useState("");
  const [snailMail, setSnailMail] = useState(false);
  const notify = useNotify();

  async function record() {
    await apiFetch(`/api/cases/${caseId}/ownership-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: module.id,
        checkNumber,
        ...(snailMail ? { snailMail: true } : {}),
      }),
    });
    notify("Request recorded");
  }

  return (
    <div className="p-8 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Ownership Request</h1>
      <p>State: {module.state}</p>
      <p>Send a check for ${module.fee} to:</p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-2 whitespace-pre-wrap">
        {module.address}
      </pre>
      <label className="flex flex-col">
        Check Number
        <input
          type="text"
          value={checkNumber}
          onChange={(e) => setCheckNumber(e.target.value)}
          className="border p-1"
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={snailMail}
          onChange={(e) => setSnailMail(e.target.checked)}
        />
        <span>Send snail mail automatically</span>
      </label>
      <button
        type="button"
        onClick={() => record()}
        className="bg-blue-500 text-white px-2 py-1 rounded"
      >
        Mark as Requested
      </button>
    </div>
  );
}
