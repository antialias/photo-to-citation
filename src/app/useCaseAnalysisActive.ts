"use client";
import { apiEventSource, apiFetch } from "@/apiClient";
import { subscribe as wsSubscribe } from "@/webSocketClient";
import { useEffect, useState } from "react";

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

    const off = wsSubscribe("jobUpdate", (data) => {
      const info = data as JobResponse;
      const filtered = info.jobs.filter(
        (j) => j.caseId === caseId && j.type === "analyzeCase",
      );
      setActive(filtered.length > 0);
    });
    if (off) {
      return () => {
        closed = true;
        off();
      };
    }
    const es = apiEventSource(
      `${base}/${encodeURIComponent(caseId)}/jobs/stream?type=analyzeCase`,
    );
    es.onmessage = (e) => {
      const info: JobResponse = JSON.parse(e.data);
      setActive(info.jobs.length > 0);
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
