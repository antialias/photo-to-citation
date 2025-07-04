"use client";

import SnailMailStatusIcon from "@/components/SnailMailStatusIcon";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import useCase from "../hooks/useCase";
import useSnailMail from "../hooks/useSnailMail";

export default function SnailMailPageClient() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const caseId = params.get("case");

  const [openOnly, setOpenOnly] = useState(true);
  const [hideDelivered, setHideDelivered] = useState(true);
  const { data: mails = [] } = useSnailMail({
    openOnly,
    hideDelivered,
    caseId,
  });
  const { data: caseData } = useCase(caseId ?? "");
  const violation = caseData?.analysis?.violationType ?? null;

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
