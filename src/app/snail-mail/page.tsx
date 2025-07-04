"use client";
import { apiFetch } from "@/apiClient";
import useCase from "@/app/hooks/useCase";
import SnailMailStatusIcon from "@/components/SnailMailStatusIcon";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface SentMail {
  id: string;
  caseId?: string;
  subject?: string;
  status: "queued" | "saved" | "shortfall" | "error";
  sentAt: string;
}

function SnailMailItem({
  mail,
  openOnly,
}: { mail: SentMail; openOnly: boolean }) {
  const { data: caseData } = useCase(mail.caseId ?? "", null);
  if (openOnly && mail.caseId && caseData && caseData.closed) {
    return null;
  }
  return (
    <li className="border rounded p-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold">{mail.subject ?? mail.id}</span>
        <SnailMailStatusIcon status={mail.status} />
      </div>
      <div className="text-sm text-gray-500">
        {mail.caseId ? <span className="mr-2">Case: {mail.caseId}</span> : null}
        {new Date(mail.sentAt).toLocaleString()}
      </div>
    </li>
  );
}

export default function SnailMailPage() {
  const { t } = useTranslation();
  const [openOnly, setOpenOnly] = useState(false);
  const [pendingOnly, setPendingOnly] = useState(false);
  const { data: mails = [] } = useQuery<SentMail[]>({
    queryKey: ["/api/snail-mail"],
    async queryFn() {
      const res = await apiFetch("/api/snail-mail");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  const filtered = mails.filter((m) =>
    pendingOnly ? m.status === "queued" || m.status === "saved" : true,
  );

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Snail Mail</h1>
      <div className="mb-4 flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={() => setOpenOnly(!openOnly)}
          />
          {t("openCasesOnly")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={() => setPendingOnly(!pendingOnly)}
          />
          {t("pendingOnly")}
        </label>
      </div>
      <ul className="grid gap-2">
        {filtered.map((m) => (
          <SnailMailItem key={m.id} mail={m} openOnly={openOnly} />
        ))}
      </ul>
    </div>
  );
}
