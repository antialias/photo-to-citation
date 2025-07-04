"use client";
import { getPublicEnv } from "@/publicEnv";
import { useTranslation } from "react-i18next";

export default function AdminDeploymentInfo() {
  const {
    NEXT_PUBLIC_DEPLOY_TIME,
    NEXT_PUBLIC_APP_COMMIT,
    NEXT_PUBLIC_APP_VERSION,
  } = getPublicEnv();
  const { t } = useTranslation();
  const deployedAt = NEXT_PUBLIC_DEPLOY_TIME
    ? new Date(NEXT_PUBLIC_DEPLOY_TIME).toLocaleString(undefined, {
        timeZoneName: "short",
      })
    : t("unknown");
  return (
    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-1">
      <p>{t("admin.deployedAt", { date: deployedAt })}</p>
      <p>
        {t("admin.deployCommit", {
          commit: NEXT_PUBLIC_APP_COMMIT ?? t("unknown"),
        })}
      </p>
      <p>
        {t("admin.deployVersion", {
          version: NEXT_PUBLIC_APP_VERSION ?? t("unknown"),
        })}
      </p>
    </div>
  );
}
