"use client";
import { apiFetch } from "@/apiClient";
import type { OwnershipModule } from "@/lib/ownershipModules";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotify } from "../../../components/NotificationProvider";
import { useSession } from "../../../useSession";

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
  const [form, setForm] = useState<Record<string, string>>({
    reasonForRequestingRecords: "private investigation",
    reasonH: "true",
  });
  const [option, setOption] = useState<string>("titleSearch");
  const [microfilmWithSearchOption, setMicrofilmWithSearchOption] =
    useState(false);
  const [microfilmOnly, setMicrofilmOnly] = useState(false);
  const notify = useNotify();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      const { name, email } = session.user;
      setForm((f) => ({
        ...f,
        requesterName: name ?? "",
        requesterEmailAddress: email ?? "",
      }));
    }
  }, [session]);

  const optionCost = useMemo(() => {
    let cost = 0;
    switch (option) {
      case "certifiedTitleSearch":
      case "certifiedRegistrationSearch":
        cost += 10;
        break;
      case "titleSearch":
      case "registrationSearch":
        cost += 5;
        break;
      default:
        break;
    }
    if (microfilmOnly) {
      cost += 5;
    }
    return cost;
  }, [option, microfilmOnly]);

  const total = module.fee + optionCost;

  const pdfUrl = useMemo(() => {
    const params = new URLSearchParams(form);
    params.set(option, "true");
    if (microfilmWithSearchOption) {
      params.set("microfilmWithSearchOption", "true");
    }
    if (microfilmOnly) {
      params.set("microfilmOnly", "true");
    }
    return `/api/cases/${caseId}/ownership-form?${params.toString()}`;
  }, [caseId, form, option, microfilmWithSearchOption, microfilmOnly]);

  async function record() {
    const res = await apiFetch(`/api/cases/${caseId}/ownership-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: module.id,
        checkNumber,
        snailMail: true,
        form: {
          ...form,
          [option]: true,
          ...(microfilmWithSearchOption
            ? { microfilmWithSearchOption: true }
            : {}),
          ...(microfilmOnly ? { microfilmOnly: true } : {}),
        },
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
      {showPdf ? (
        <iframe
          src={pdfUrl}
          className="w-full h-96 border"
          title="Ownership form"
        />
      ) : null}
      <label className="flex flex-col">
        Name
        <input
          type="text"
          value={form.requesterName ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, requesterName: e.target.value }))
          }
          className="border p-1"
        />
      </label>
      <label className="flex flex-col">
        Email
        <input
          type="text"
          value={form.requesterEmailAddress ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, requesterEmailAddress: e.target.value }))
          }
          className="border p-1"
        />
      </label>
      <label className="flex flex-col">
        Address
        <input
          type="text"
          value={form.requesterAddress ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, requesterAddress: e.target.value }))
          }
          className="border p-1"
        />
      </label>
      <label className="flex flex-col">
        City/State/Zip
        <input
          type="text"
          value={form.requesterCityStateZip ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, requesterCityStateZip: e.target.value }))
          }
          className="border p-1"
        />
      </label>
      <label className="flex flex-col">
        Section 2
        <select
          value={option}
          onChange={(e) => setOption(e.target.value)}
          className="border p-1"
        >
          <option value="titleSearch">Title Search — $5 each</option>
          <option value="registrationSearch">
            Registration Search — $5 each
          </option>
          <option value="certifiedTitleSearch">
            Certified Title Search — $10 each
          </option>
          <option value="certifiedRegistrationSearch">
            Certified Registration Search — $10 each
          </option>
        </select>
      </label>
      <label className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          checked={microfilmWithSearchOption}
          onChange={(e) => setMicrofilmWithSearchOption(e.target.checked)}
        />
        <span>Microfilm Requested with any Search Option, no charge</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={microfilmOnly}
          onChange={(e) => setMicrofilmOnly(e.target.checked)}
        />
        <span>Microfilm Only — $5</span>
      </label>
      <p>Total: ${total}</p>
      <label className="flex flex-col">
        {t("checkNumberLabel")}
        <input
          type="text"
          value={checkNumber}
          onChange={(e) => setCheckNumber(e.target.value)}
          className="border p-1"
        />
      </label>
      <button
        type="button"
        onClick={() => record()}
        className="bg-blue-500 text-white px-2 py-1 rounded"
      >
        {t("sendSnailMailRequest")}
      </button>
    </div>
  );
}
