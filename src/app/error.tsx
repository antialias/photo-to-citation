"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const { t } = useTranslation();
  return (
    <div className={css({ p: "8", textAlign: "center" })}>
      <h1 className={css({ fontSize: "2xl", fontWeight: "bold", mb: "4" })}>
        {t("error.title")}
      </h1>
      <p className={css({ mb: "4" })}>{t("error.message")}</p>
      <div
        className={css({ display: "flex", gap: "4", justifyContent: "center" })}
      >
        <button
          type="button"
          onClick={reset}
          className={css({ textDecoration: "underline" })}
        >
          {t("error.retry")}
        </button>
        <Link
          href="https://github.com/antialias/photo-to-citation/issues"
          className={css({ textDecoration: "underline" })}
        >
          {t("error.reportIssue")}
        </Link>
      </div>
    </div>
  );
}
