"use client";
import { subscribe } from "@/eventClient";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface JobInfo {
  id: number;
  type: string;
  startedAt: number;
  caseId?: string;
}

interface JobResponse {
  jobs: JobInfo[];
  auditedAt: number;
  updatedAt: number;
}

export default function CaseJobList({
  caseId,
}: {
  caseId: string;
}) {
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [auditedAt, setAuditedAt] = useState<number>(0);
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const { t } = useTranslation();

  useEffect(() => {
    const off = subscribe("jobUpdate", (data) => {
      const info = data as JobResponse;
      const filtered = info.jobs.filter((j) => j.caseId === caseId);
      setJobs(filtered);
      setAuditedAt(info.auditedAt);
      setUpdatedAt(info.updatedAt);
    });
    return off;
  }, [caseId]);

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded flex flex-col gap-2 text-sm">
      <h2 className="font-semibold">{t("activeJobs")}</h2>
      <ul className="grid gap-1">
        {jobs.map((j) => (
          <li key={j.id} className="flex justify-between">
            <span className="font-mono mr-2">{j.type}</span>
            {new Date(j.startedAt).toLocaleString()}
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        {t("lastAudit")}{" "}
        {auditedAt ? new Date(auditedAt).toLocaleString() : "n/a"}
        {" | "}
        {t("lastUpdate")}{" "}
        {updatedAt ? new Date(updatedAt).toLocaleString() : "n/a"}
      </p>
    </div>
  );
}
