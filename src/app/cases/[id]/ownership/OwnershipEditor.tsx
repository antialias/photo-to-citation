"use client";
import { apiFetch } from "@/apiClient";
import { useSession } from "@/app/useSession";
import type { OwnershipModule } from "@/lib/ownershipModules";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const { data: session } = useSession();
  const [info, setInfo] = useState({
    requesterName: session?.user?.name || "",
    requesterEmailAddress: session?.user?.email || "",
    requesterAddress: "",
    requesterCityStateZip: "",
  });
  const [requestType, setRequestType] = useState("titleSearch");
  const fees: Record<string, number> = {
    titleSearch: 5,
    registrationSearch: 5,
    certifiedTitleSearch: 5,
    certifiedRegistrationSearch: 5,
  };
  const total = module.fee + fees[requestType];
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const notify = useNotify();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    async function update() {
      if (!showPdf) return;
      const payload = {
        ...info,
        reasonH: true,
        reasonForRequestingRecords: "private investigation",
        [requestType]: true,
      };
      const res = await apiFetch(`/api/cases/${caseId}/ownership-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const blob = await res.blob();
        setPdfUrl(URL.createObjectURL(blob));
      }
    }
    void update();
  }, [info, requestType, showPdf, caseId]);

  async function record() {
    const res = await apiFetch(`/api/cases/${caseId}/ownership-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: module.id,
        checkNumber,
        ...(snailMail ? { snailMail: true } : {}),
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        case: { sentEmails?: { sentAt: string }[] };
      };
      const newEmail = data.case.sentEmails?.at(-1);
      const url = newEmail
        ? `/cases/${caseId}/thread/${encodeURIComponent(newEmail.sentAt)}`
        : null;
      if (url) {
        router.push(url);
        return;
      }
      notify(t("requestRecorded"));
    } else {
      notify(t("requestRecorded"));
    }
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
      {showPdf && pdfUrl ? (
        <iframe
          src={pdfUrl}
          className="w-full h-96 border"
          title="Ownership form"
        />
      ) : null}
      <label className="flex flex-col">
        Requester Name
        <input
          type="text"
          value={info.requesterName}
          onChange={(e) => setInfo({ ...info, requesterName: e.target.value })}
          className="border p-1"
        />
      </label>
      <label className="flex flex-col">
        Requester Address
        <input
          type="text"
          value={info.requesterAddress}
          onChange={(e) =>
            setInfo({ ...info, requesterAddress: e.target.value })
          }
          className="border p-1"
        />
      </label>
      <label className="flex flex-col">
        City/State/Zip
        <input
          type="text"
          value={info.requesterCityStateZip}
          onChange={(e) =>
            setInfo({ ...info, requesterCityStateZip: e.target.value })
          }
          className="border p-1"
        />
      </label>
      <label className="flex flex-col">
        Email
        <input
          type="text"
          value={info.requesterEmailAddress}
          onChange={(e) =>
            setInfo({ ...info, requesterEmailAddress: e.target.value })
          }
          className="border p-1"
        />
      </label>
      <label className="flex flex-col">
        Section 2 Option
        <select
          value={requestType}
          onChange={(e) => setRequestType(e.target.value)}
          className="border p-1"
        >
          <option value="titleSearch">Title Search</option>
          <option value="registrationSearch">Registration Search</option>
          <option value="certifiedTitleSearch">Certified Title Search</option>
          <option value="certifiedRegistrationSearch">
            Certified Registration Search
          </option>
        </select>
      </label>
      <p>Total Fee: ${total}</p>
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
        {snailMail ? t("sendSnailMailRequest") : t("markRequested")}
      </button>
    </div>
  );
}
