"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";
import useEventSource from "../hooks/useEventSource";

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

export default function SystemStatusClient() {
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [auditedAt, setAuditedAt] = useState<number>(0);
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const [filter, setFilter] = useState<string>("");
  const { t } = useTranslation();

  useEventSource<JobResponse>(
    filter !== ""
      ? `/api/system/jobs/stream?type=${encodeURIComponent(filter)}`
      : "/api/system/jobs/stream",
    (data) => {
      setJobs(data.jobs);
      setAuditedAt(data.auditedAt);
      setUpdatedAt(data.updatedAt);
    },
  );

  const types = Array.from(new Set(jobs.map((j) => j.type)));

  return (
    <div className={css({ p: "8" })}>
      <h1 className={css({ fontSize: "xl", fontWeight: "bold", mb: "4" })}>
        {t("nav.systemStatus")}
      </h1>
      <p
        className={cx(
          css({ mb: "2", fontSize: "sm" }),
          css({ color: token("colors.text-muted") }),
        )}
      >
        {t("lastAudit")}{" "}
        {auditedAt ? new Date(auditedAt).toLocaleString() : "n/a"}
        {" | "}
        {t("lastUpdate")}{" "}
        {updatedAt ? new Date(updatedAt).toLocaleString() : "n/a"}
      </p>
      <label className={css({ display: "block", mb: "4" })}>
        <span className={css({ mr: "2" })}>{t("jobType")}</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={css({ borderWidth: "1px", p: "1" })}
        >
          <option value="">{t("all")}</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      {jobs.length === 0 ? (
        <p>{t("noActiveJobs")}</p>
      ) : (
        <ul className={css({ display: "grid", gap: "2" })}>
          {jobs.map((j) => (
            <li key={j.id} className={css({ borderWidth: "1px", p: "2" })}>
              <span className={css({ fontFamily: "mono", mr: "2" })}>
                {j.type}
              </span>
              {j.caseId ? (
                <span
                  className={cx(
                    css({ mr: "2" }),
                    css({ color: token("colors.text-muted") }),
                  )}
                >
                  {t("caseLabel", { id: j.caseId })}
                </span>
              ) : null}
              {new Date(j.startedAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
