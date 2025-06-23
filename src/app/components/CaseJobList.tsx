"use client";
import { apiFetch } from "@/apiClient";
import { useCallback, useEffect, useState } from "react";

interface JobInfo {
  id: number;
  type: string;
  startedAt: number;
}

interface JobResponse {
  jobs: JobInfo[];
  auditedAt: number;
  updatedAt: number;
}

export default function CaseJobList({
  caseId,
  isPublic,
}: {
  caseId: string;
  isPublic: boolean;
}) {
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [auditedAt, setAuditedAt] = useState<number>(0);
  const [updatedAt, setUpdatedAt] = useState<number>(0);

  const refresh = useCallback(async () => {
    const base = isPublic ? "/api/public/cases" : "/api/cases";
    const res = await apiFetch(`${base}/${encodeURIComponent(caseId)}/jobs`);
    if (res.ok) {
      const data: JobResponse = await res.json();
      setJobs(data.jobs);
      setAuditedAt(data.auditedAt);
      setUpdatedAt(data.updatedAt);
    }
  }, [caseId, isPublic]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded flex flex-col gap-2 text-sm">
      <h2 className="font-semibold">Active Jobs</h2>
      <ul className="grid gap-1">
        {jobs.map((j) => (
          <li key={j.id} className="flex justify-between">
            <span className="font-mono mr-2">{j.type}</span>
            {new Date(j.startedAt).toLocaleString()}
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Last audit: {auditedAt ? new Date(auditedAt).toLocaleString() : "n/a"} |
        Last update: {updatedAt ? new Date(updatedAt).toLocaleString() : "n/a"}
      </p>
    </div>
  );
}
