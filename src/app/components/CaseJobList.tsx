"use client";
import { apiEventSource } from "@/apiClient";
import { useEffect, useState } from "react";

interface JobInfo {
  id: string | number;
  type: string;
  startedAt: number;
  state: "queued" | "running" | "complete" | "failed" | "canceled";
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

  useEffect(() => {
    const base = isPublic ? "/api/public/cases" : "/api/cases";
    const es = apiEventSource(
      `${base}/${encodeURIComponent(caseId)}/jobs/stream`,
    );
    es.onmessage = (e) => {
      const data: JobResponse = JSON.parse(e.data);
      setJobs(data.jobs);
      setAuditedAt(data.auditedAt);
      setUpdatedAt(data.updatedAt);
    };
    return () => es.close();
  }, [caseId, isPublic]);

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded flex flex-col gap-2 text-sm">
      <h2 className="font-semibold">Active Jobs</h2>
      <ul className="grid gap-1">
        {jobs.map((j) => (
          <li key={j.id} className="flex justify-between items-center">
            <span className="font-mono mr-2">{j.type}</span>
            <span
              className={`px-1 rounded text-white text-xs mr-2 ${
                j.state === "queued"
                  ? "bg-gray-500"
                  : j.state === "running"
                    ? "bg-blue-600"
                    : j.state === "complete"
                      ? "bg-green-600"
                      : j.state === "failed"
                        ? "bg-red-600"
                        : "bg-yellow-600"
              }`}
            >
              {j.state === "queued"
                ? "⌛"
                : j.state === "running"
                  ? "🔄"
                  : j.state === "complete"
                    ? "✅"
                    : j.state === "failed"
                      ? "❌"
                      : "🚫"}{" "}
              {j.state}
            </span>
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
