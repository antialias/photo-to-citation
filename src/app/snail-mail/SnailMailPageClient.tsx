"use client";

import SnailMailStatusIcon from "@/components/SnailMailStatusIcon";
import { space } from "@/styleTokens";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";
import useCase from "../hooks/useCase";
import useSnailMail from "../hooks/useSnailMail";

export default function SnailMailPageClient() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const caseId = params.get("case");

  const [openOnly, setOpenOnly] = useState(true);
  const [hideDelivered, setHideDelivered] = useState(true);
  const { data: mails = [] } = useSnailMail({
    openOnly,
    hideDelivered,
    caseId,
  });
  const { data: caseData } = useCase(caseId ?? "");
  const violation = caseData?.analysis?.violationType ?? null;

  const styles = {
    wrapper: css({ p: space.container }),
    title: css({ fontSize: "xl", fontWeight: "bold", mb: "4" }),
    controls: css({ display: "flex", gap: space.gap, mb: "4" }),
    checkboxLabel: css({ display: "flex", alignItems: "center", gap: "1" }),
    caseInfo: css({ mb: "4" }),
    caseTitle: css({ fontWeight: "semibold" }),
    table: css({
      width: "100%",
      borderWidth: "1px",
      borderCollapse: "collapse",
    }),
    th: css({ borderWidth: "1px", px: "2", py: "1", textAlign: "left" }),
    td: css({ borderWidth: "1px", px: "2", py: "1" }),
    link: css({ color: "blue.500", textDecorationLine: "underline" }),
  };
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t("nav.snailMail")}</h1>
      <div className={styles.controls}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
          />
          {t("open")}
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={hideDelivered}
            onChange={(e) => setHideDelivered(e.target.checked)}
          />
          {t("hideDelivered")}
        </label>
      </div>
      {caseId ? (
        <div className={styles.caseInfo}>
          <h2 className={styles.caseTitle}>{t("caseLabel", { id: caseId })}</h2>
          <p
            className={cx(
              "text-sm",
              css({ color: token("colors.text-muted") }),
            )}
          >
            {t("violationLabel", { type: violation || t("unknown") })}
          </p>
        </div>
      ) : null}
      {mails.length === 0 ? (
        <p>{t("noSnailMail")}</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr className={css({ textAlign: "left" })}>
              <th className={styles.th}>Case</th>
              <th className={styles.th}>{t("subjectLabel")}</th>
              <th className={styles.th}>{t("status")}</th>
              <th className={styles.th}>{t("sent")}</th>
              <th className={styles.th}>{t("thread")}</th>
            </tr>
          </thead>
          <tbody>
            {mails.map((m) => (
              <tr key={`${m.caseId}-${m.sentAt}`}>
                <td className={styles.td}>
                  <Link href={`/cases/${m.caseId}`} className={styles.link}>
                    {t("caseLabel", { id: m.caseId })}
                  </Link>
                </td>
                <td className={styles.td}>{m.subject}</td>
                <td className={styles.td}>
                  <SnailMailStatusIcon status={m.status} />
                </td>
                <td className={styles.td}>
                  {new Date(m.sentAt).toLocaleString()}
                </td>
                <td className={styles.td}>
                  <Link
                    href={`/cases/${m.caseId}/thread/${encodeURIComponent(m.sentAt)}`}
                    className={styles.link}
                  >
                    {t("viewThread")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
