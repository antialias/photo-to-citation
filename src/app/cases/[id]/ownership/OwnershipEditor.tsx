"use client";
import { apiFetch } from "@/apiClient";
import type { OwnershipModule } from "@/lib/ownershipModules";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotify } from "../../../components/NotificationProvider";

export default function OwnershipEditor({
  caseId,
  module,
  showPdf = false,
}: {
  caseId: string;
  module: Omit<OwnershipModule, "requestVin" | "requestContactInfo">;
  showPdf?: boolean;
}) {
  const [checkNumber, setCheckNumber] = useState("");
  const [snailMail, setSnailMail] = useState(false);
  const notify = useNotify();
  const { t } = useTranslation();

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
    notify(t("requestRecorded"));
  }

  return (
    <div className="p-8 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t("ownershipRequest")}</h1>
      <p>
        {t("stateLabel")} {module.state}
      </p>
      <p>{t("sendCheckTo", { fee: module.fee })}</p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-2 whitespace-pre-wrap">
        {module.address}
      </pre>
      {showPdf ? (
        <iframe
          src={`/api/cases/${caseId}/ownership-form`}
          className="w-full h-96 border"
          title="Ownership form"
        />
      ) : null}
      <label className="flex flex-col">
        {t("checkNumberLabel")}
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
        <span>{t("sendSnailAutomatically")}</span>
      </label>
      <button
        type="button"
        onClick={() => record()}
        className="bg-blue-500 text-white px-2 py-1 rounded"
      >
        {t("markRequested")}
      </button>
    </div>
  );
}
