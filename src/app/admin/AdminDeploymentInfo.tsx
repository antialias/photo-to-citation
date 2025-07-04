"use client";
import { getPublicEnv } from "@/publicEnv";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCopy } from "react-icons/fa";

export default function AdminDeploymentInfo() {
  const {
    NEXT_PUBLIC_DEPLOY_TIME,
    NEXT_PUBLIC_APP_COMMIT,
    NEXT_PUBLIC_APP_VERSION,
  } = getPublicEnv();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  function copyCommit() {
    if (!NEXT_PUBLIC_APP_COMMIT) return;
    navigator.clipboard.writeText(NEXT_PUBLIC_APP_COMMIT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  const deployedAt = NEXT_PUBLIC_DEPLOY_TIME
    ? new Date(NEXT_PUBLIC_DEPLOY_TIME).toLocaleString(undefined, {
        timeZoneName: "short",
      })
    : t("unknown");
  return (
    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-1">
      <p>{t("admin.deployedAt", { date: deployedAt })}</p>
      <p className="flex items-center gap-1">
        <span>{t("admin.deployCommit")}</span>
        {NEXT_PUBLIC_APP_COMMIT ? (
          <a
            href={`https://github.com/antialias/photo-to-citation/commit/${NEXT_PUBLIC_APP_COMMIT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500 hover:text-blue-700"
          >
            {NEXT_PUBLIC_APP_COMMIT}
          </a>
        ) : (
          <span>{t("unknown")}</span>
        )}
        {NEXT_PUBLIC_APP_COMMIT && (
          <button
            type="button"
            onClick={copyCommit}
            aria-label={t("admin.copyCommitHash")}
            className="text-blue-500 hover:text-blue-700"
          >
            <FaCopy />
          </button>
        )}
        {copied && <span className="text-green-600">{t("copied")}</span>}
      </p>
      <p>
        {t("admin.deployVersion", {
          version: NEXT_PUBLIC_APP_VERSION ?? t("unknown"),
        })}
      </p>
    </div>
  );
}
