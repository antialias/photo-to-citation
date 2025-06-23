"use client";
import { apiEventSource } from "@/apiClient";
import { useEffect, useState } from "react";

interface JobInfo {
  id: string | number;
  type: string;
  startedAt: number;
  caseId?: string;
  state: "queued" | "running" | "complete" | "failed" | "canceled";
}

interface JobResponse {
  jobs: JobInfo[];
  auditedAt: number;
  updatedAt: number;
}

export default function SystemStatusClient() {
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [auditedAt, setAuditedAt] = useState<number>(0);
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    const url =
      filter !== ""
        ? `/api/system/jobs/stream?type=${encodeURIComponent(filter)}`
        : "/api/system/jobs/stream";
    const es = apiEventSource(url);
    es.onmessage = (e) => {
      const data: JobResponse = JSON.parse(e.data);
      setJobs(data.jobs);
      setAuditedAt(data.auditedAt);
      setUpdatedAt(data.updatedAt);
    };
    return () => es.close();
  }, [filter]);

  const types = Array.from(new Set(jobs.map((j) => j.type)));

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">System Status</h1>
      <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
        Last audit: {auditedAt ? new Date(auditedAt).toLocaleString() : "n/a"}
        {" | "}
        Last update: {updatedAt ? new Date(updatedAt).toLocaleString() : "n/a"}
      </p>
      <label className="block mb-4">
        <span className="mr-2">Job Type:</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-1"
        >
          <option value="">All</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      {jobs.length === 0 ? (
        <p>No active jobs.</p>
      ) : (
        <ul className="grid gap-2">
          {jobs.map((j) => (
            <li
              key={j.id}
              className="border p-2 flex justify-between items-center"
            >
              <div>
                <span className="font-mono mr-2">{j.type}</span>
                {j.caseId ? (
                  <span className="mr-2 text-gray-500">case {j.caseId}</span>
                ) : null}
              </div>
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
      )}
    </div>
  );
}
