"use client";
import { useSession } from "@/app/useSession";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { css, cx } from "styled-system/css";
import { useCaseContext } from "../CaseContext";

export default function PublicViewBanner({
  caseId,
  show = true,
  className,
}: {
  caseId: string;
  show?: boolean;
  className?: string;
}) {
  const { members } = useCaseContext();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const isMember = members.some((m) => m.userId === session?.user?.id);
  if (!show || !isMember) return null;
  const styles = {
    wrapper: css({
      bg: "blue.100",
      borderWidth: "1px",
      borderColor: "blue.300",
      color: "blue.800",
      p: "2",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }),
    link: css({ textDecorationLine: "underline" }),
  };
  return (
    <div className={cx(styles.wrapper, className)}>
      <span>{t("publicViewBanner.message")}</span>
      <Link href={`/cases/${caseId}`} className={styles.link}>
        {t("publicViewBanner.link")}
      </Link>
    </div>
  );
}
