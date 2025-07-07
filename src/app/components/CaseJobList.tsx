"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";
import useEventSource from "../hooks/useEventSource";

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
  const { t } = useTranslation();

  const styles = {
    container: css({
      bg: { base: "gray.100", _dark: "gray.800" },
      p: "4",
      borderRadius: "sm",
      display: "flex",
      flexDirection: "column",
      gap: "2",
      fontSize: "sm",
    }),
    heading: css({ fontWeight: "semibold" }),
    list: css({ display: "grid", gap: "1" }),
    item: css({ display: "flex", justifyContent: "space-between" }),
    type: css({ fontFamily: "mono", mr: "2" }),
    footer: css({
      fontSize: "xs",
      color: {
        base: token("colors.gray.600"),
        _dark: token("colors.gray.400"),
      },
    }),
  };

  useEventSource<JobResponse>(
    `${isPublic ? "/api/public/cases" : "/api/cases"}/${encodeURIComponent(caseId)}/jobs/stream`,
    (data) => {
      setJobs(data.jobs);
      setAuditedAt(data.auditedAt);
      setUpdatedAt(data.updatedAt);
    },
  );

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{t("activeJobs")}</h2>
      <ul className={styles.list}>
        {jobs.map((j) => (
          <li key={j.id} className={styles.item}>
            <span className={styles.type}>{j.type}</span>
            {new Date(j.startedAt).toLocaleString()}
          </li>
        ))}
      </ul>
      <p className={styles.footer}>
        {t("lastAudit")}{" "}
        {auditedAt ? new Date(auditedAt).toLocaleString() : "n/a"}
        {" | "}
        {t("lastUpdate")}{" "}
        {updatedAt ? new Date(updatedAt).toLocaleString() : "n/a"}
      </p>
    </div>
  );
}
