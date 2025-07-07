"use client";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";

export interface LandingStats {
  casesLastWeek: number;
  authorityNotifications: number;
  avgDaysToNotification: number;
  notificationSuccessRate: number;
}

function formatCount(n: number): string {
  if (n < 10) return n.toString();
  const digits = Math.floor(Math.log10(n));
  const base = 10 ** digits;
  return `>${Math.floor(n / base) * base}`;
}

export default function LoggedOutLandingClient({
  stats,
}: {
  stats: LandingStats;
}) {
  const { t } = useTranslation();
  const styles = {
    main: css({
      p: "8",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: "6",
    }),
    heading: css({
      fontSize: token("fontSizes.3xl"),
      fontWeight: "700",
    }),
    description: css({ fontSize: "lg", maxWidth: token("sizes.xl") }),
    grid: css({
      display: "grid",
      gridTemplateColumns: { base: "1fr", sm: "repeat(2, 1fr)" },
      gap: "4",
      mt: "4",
    }),
    card: css({
      bg: { base: "gray.100", _dark: "gray.800" },
      borderRadius: token("radii.md"),
      p: "4",
      boxShadow: token("shadows.sm"),
    }),
    stat: css({ fontSize: token("fontSizes.2xl"), fontWeight: "semibold" }),
    label: css({ fontSize: "sm" }),
    signInWrapper: css({ mt: "4" }),
    signInLink: css({
      color: token("colors.blue.600"),
      textDecorationLine: "underline",
    }),
  };
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>{t("title")}</h1>
      <p className={styles.description}>{t("landingDescription")}</p>
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.stat}>{formatCount(stats.casesLastWeek)}</div>
          <div className={styles.label}>{t("casesLastWeek")}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.stat}>
            {formatCount(stats.authorityNotifications)}
          </div>
          <div className={styles.label}>{t("authorityNotifications")}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.stat}>
            {`<${Math.ceil(stats.avgDaysToNotification)} days`}
          </div>
          <div className={styles.label}>{t("avgTimeToNotify")}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.stat}>
            {`>${Math.floor(stats.notificationSuccessRate * 100)}%`}
          </div>
          <div className={styles.label}>{t("casesWithNotification")}</div>
        </div>
      </div>
      <p className={styles.signInWrapper}>
        <a href="/signin" className={styles.signInLink}>
          {t("signIn")}
        </a>
      </p>
    </main>
  );
}
