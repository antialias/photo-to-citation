"use client";
import { apiFetch } from "@/apiClient";
import { useEffect, useState } from "react";
import useEventSource from "./hooks/useEventSource";

interface JobInfo {
  id: number;
  type: string;
  startedAt: number;
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
    return () => {
      closed = true;
    };
  }, [caseId, isPublic]);

  useEventSource<JobResponse>(
    `${isPublic ? "/api/public/cases" : "/api/cases"}/${encodeURIComponent(caseId)}/jobs/stream?type=analyzeCase`,
    (data) => {
      setActive(data.jobs.length > 0);
    },
  );

  return active;
}
