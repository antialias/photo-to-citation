"use client";
import { useTranslation } from "react-i18next";

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
  return (
    <main className="p-8 flex flex-col items-center text-center gap-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-lg max-w-xl">{t("landingDescription")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 shadow">
          <div className="text-2xl font-semibold">
            {formatCount(stats.casesLastWeek)}
          </div>
          <div className="text-sm">{t("casesLastWeek")}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 shadow">
          <div className="text-2xl font-semibold">
            {formatCount(stats.authorityNotifications)}
          </div>
          <div className="text-sm">{t("authorityNotifications")}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 shadow">
          <div className="text-2xl font-semibold">
            {`<${Math.ceil(stats.avgDaysToNotification)} days`}
          </div>
          <div className="text-sm">{t("avgTimeToNotify")}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 shadow">
          <div className="text-2xl font-semibold">
            {`>${Math.floor(stats.notificationSuccessRate * 100)}%`}
          </div>
          <div className="text-sm">{t("casesWithNotification")}</div>
        </div>
      </div>
      <p className="mt-4">
        <a href="/signin" className="text-blue-600 underline">
          {t("signIn")}
        </a>
      </p>
    </main>
  );
}
