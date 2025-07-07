"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const Mermaid = dynamic(() => import("react-mermaid2"), { ssr: false });

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
  const [chart, setChart] = useState<string | null>(null);

  async function handleGenerate() {
    const res = await fetch("/api/example-graph");
    if (res.ok) {
      const data = (await res.json()) as { chart: string };
      setChart(data.chart);
    }
  }
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
      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={handleGenerate}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Generate Graph
        </button>
        {chart ? (
          <div className="max-w-full overflow-x-auto">
            <Mermaid chart={chart} key={chart} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
