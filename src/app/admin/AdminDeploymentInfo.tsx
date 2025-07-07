"use client";
import { getPublicEnv } from "@/publicEnv";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCopy } from "react-icons/fa";
import { css } from "styled-system/css";

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
  const styles = {
    root: css({
      mt: "4",
      fontSize: "sm",
      color: { base: "gray.600", _dark: "gray.400" },
      display: "grid",
      gap: "1",
    }),
    row: css({ display: "flex", alignItems: "center", gap: "1" }),
    link: css({
      textDecoration: "underline",
      color: "blue.500",
      _hover: { color: "blue.700" },
    }),
    button: css({ color: "blue.500", _hover: { color: "blue.700" } }),
    copied: css({ color: "green.600" }),
  };

  return (
    <div className={styles.root}>
      <p>{t("admin.deployedAt", { date: deployedAt })}</p>
      <p className={styles.row}>
        <span>{t("admin.deployCommit")}</span>
        {NEXT_PUBLIC_APP_COMMIT ? (
          <a
            href={`https://github.com/antialias/photo-to-citation/commit/${NEXT_PUBLIC_APP_COMMIT}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
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
            className={styles.button}
          >
            <FaCopy />
          </button>
        )}
        {copied && <span className={styles.copied}>{t("copied")}</span>}
      </p>
      <p>
        {t("admin.deployVersion", {
          version: NEXT_PUBLIC_APP_VERSION ?? t("unknown"),
        })}
      </p>
    </div>
  );
}
