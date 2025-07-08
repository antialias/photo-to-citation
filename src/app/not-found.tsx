"use client";
import { withBasePath } from "@/basePath";
import { space } from "@/styleTokens";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";

export default function NotFound() {
  const { t } = useTranslation();
  const styles = {
    wrapper: css({ p: space.container, textAlign: "center" }),
    title: css({ fontSize: "2xl", fontWeight: "bold", mb: "4" }),
    message: css({ mb: "4" }),
    link: css({ textDecorationLine: "underline" }),
  };
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t("notFound.title")}</h1>
      <p className={styles.message}>{t("notFound.message")}</p>
      <Link href={withBasePath("/")} className={styles.link}>
        {t("notFound.back")}
      </Link>
    </div>
  );
}
