"use client";

import { apiFetch } from "@/apiClient";
import SnailMailStatusIcon from "@/components/SnailMailStatusIcon";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface MailInfo {
  caseId: string;
  subject: string;
  status: "queued" | "saved" | "shortfall" | "error";
  sentAt: string;
}

export default function SnailMailPageClient() {
  const [openOnly, setOpenOnly] = useState(true);
  const [hideDelivered, setHideDelivered] = useState(true);
  const [mails, setMails] = useState<MailInfo[]>([]);
  const [violation, setViolation] = useState<string | null>(null);
  const { t } = useTranslation();
  const params = useSearchParams();
  const caseId = params.get("case");

  useEffect(() => {
    if (!caseId) {
      setViolation(null);
      return;
    }
    apiFetch(`/api/cases/${caseId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (c && typeof c === "object") {
          setViolation(c.analysis?.violationType ?? null);
        } else {
          setViolation(null);
        }
      })
      .catch(() => setViolation(null));
  }, [caseId]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("open", openOnly ? "true" : "false");
    if (caseId) params.set("case", caseId);
    if (hideDelivered) {
      params.append("status", "queued");
      params.append("status", "shortfall");
      params.append("status", "error");
    }
    apiFetch(`/api/snail-mail?${params.toString()}`)
      .then((r) => r.json() as Promise<MailInfo[]>)
      .then(setMails)
      .catch(() => setMails([]));
  }, [openOnly, hideDelivered, caseId]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">{t("nav.snailMail")}</h1>
      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
          />
          {t("open")}
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={hideDelivered}
            onChange={(e) => setHideDelivered(e.target.checked)}
          />
          {t("hideDelivered")}
        </label>
      </div>
      {caseId ? (
        <div className="mb-4">
          <h2 className="font-semibold">{t("caseLabel", { id: caseId })}</h2>
          <p className="text-sm text-gray-500">
            {t("violationLabel", { type: violation || t("unknown") })}
          </p>
        </div>
      ) : null}
      {mails.length === 0 ? (
        <p>{t("noSnailMail")}</p>
      ) : (
        <table className="min-w-full border border-collapse">
          <thead>
            <tr className="text-left">
              <th className="border px-2 py-1">Case</th>
              <th className="border px-2 py-1">{t("subjectLabel")}</th>
              <th className="border px-2 py-1">{t("status")}</th>
              <th className="border px-2 py-1">{t("sent")}</th>
            </tr>
          </thead>
          <tbody>
            {mails.map((m) => (
              <tr key={`${m.caseId}-${m.sentAt}`}>
                <td className="border px-2 py-1">
                  <Link
                    href={`/cases/${m.caseId}`}
                    className="text-blue-500 underline"
                  >
                    {t("caseLabel", { id: m.caseId })}
                  </Link>
                </td>
                <td className="border px-2 py-1">{m.subject}</td>
                <td className="border px-2 py-1">
                  <SnailMailStatusIcon status={m.status} />
                </td>
                <td className="border px-2 py-1">
                  {new Date(m.sentAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
