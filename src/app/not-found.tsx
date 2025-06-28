"use client";
import { withBasePath } from "@/basePath";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">{t("notFound.title")}</h1>
      <p className="mb-4">{t("notFound.message")}</p>
      <Link href={withBasePath("/")} className="underline">
        {t("notFound.back")}
      </Link>
    </div>
  );
}
