"use client";
import { apiEventSource, apiFetch } from "@/apiClient";
import { useEffect, useState } from "react";

interface JobInfo {
  id: string | number;
  type: string;
  startedAt: number;
  state: "queued" | "running" | "complete" | "failed" | "canceled";
}

interface JobResponse {
  jobs: JobInfo[];
}

export default function useCaseAnalysisActive(
  caseId: string,
  isPublic: boolean,
): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let closed = false;
    const base = isPublic ? "/api/public/cases" : "/api/cases";

    async function fetchStatus() {
      try {
        const res = await apiFetch(
          `${base}/${encodeURIComponent(caseId)}/jobs?type=analyzeCase`,
        );
        if (res.ok) {
          const data = (await res.json()) as JobResponse;
          if (!closed) setActive((data.jobs?.length ?? 0) > 0);
        }
      } catch {
        // ignore network errors in tests
      }
    }

    fetchStatus();

    const es = apiEventSource(
      `${base}/${encodeURIComponent(caseId)}/jobs/stream?type=analyzeCase`,
    );
    es.onmessage = (e) => {
      const data: JobResponse = JSON.parse(e.data);
      setActive(data.jobs.length > 0);
    };
    es.onerror = () => {
      /* ignore connection errors */
    };
    return () => {
      closed = true;
      es.close();
    };
  }, [caseId, isPublic]);

  return active;
}
