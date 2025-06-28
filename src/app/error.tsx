"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

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
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">{t("error.title")}</h1>
      <p className="mb-4">{t("error.message")}</p>
      <div className="flex gap-4 justify-center">
        <button type="button" onClick={reset} className="underline">
          {t("error.retry")}
        </button>
        <Link
          href="https://github.com/antialias/photo-to-citation/issues"
          className="underline"
        >
          {t("error.reportIssue")}
        </Link>
      </div>
    </div>
  );
}
