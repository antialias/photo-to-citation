"use client";
import { useSession } from "@/app/useSession";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import useAddCredits from "../hooks/useAddCredits";
import useCreditBalance from "../hooks/useCreditBalance";

export default function UserSettingsPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"profile" | "credits">("profile");
  const [usd, setUsd] = useState("0");
  const { data: balanceData } = useCreditBalance(tab === "credits");
  const addCreditsMutation = useAddCredits();
  const balance = balanceData?.balance ?? 0;

  if (!session) {
    return <div className="p-8">{t("notLoggedIn")}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">{t("nav.userSettings")}</h1>
      <div className="flex gap-4 mb-4">
        <button
          type="button"
          onClick={() => setTab("profile")}
          className={`px-2 py-1 rounded ${
            tab === "profile"
              ? "bg-blue-600 text-white"
              : "bg-gray-300 dark:bg-gray-700"
          }`}
        >
          {t("profileTab")}
        </button>
        <button
          type="button"
          onClick={() => setTab("credits")}
          className={`px-2 py-1 rounded ${
            tab === "credits"
              ? "bg-blue-600 text-white"
              : "bg-gray-300 dark:bg-gray-700"
          }`}
        >
          {t("creditsTab")}
        </button>
      </div>
      {tab === "profile" && (
        <div>
          <p>
            {t("emailLabel")}{" "}
            {session.user?.email ?? session.user?.name ?? t("unknown")}
          </p>
          <p>
            {t("roleLabel")} {session.user?.role}
          </p>
        </div>
      )}
      {tab === "credits" && (
        <div className="grid gap-2 max-w-sm">
          <p>{t("balanceCredits", { balance })}</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={usd}
              onChange={(e) => setUsd(e.target.value)}
              className="border p-1 flex-1"
            />
            <button
              type="button"
              onClick={() =>
                addCreditsMutation.mutate(Number(usd), {
                  onSuccess() {
                    setUsd("0");
                  },
                })
              }
              className="bg-blue-600 text-white px-2 py-1 rounded"
            >
              {t("add")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
