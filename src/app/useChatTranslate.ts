"use client";
import { apiFetch } from "@/apiClient";
import { useTranslation } from "react-i18next";
import { useNotify } from "./components/NotificationProvider";

export default function useChatTranslate(caseId: string) {
  const notify = useNotify();
  const { t } = useTranslation();
  return async (text: string, lang: string): Promise<string> => {
    const res = await apiFetch(`/api/cases/${caseId}/chat/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
    });
    if (!res.ok) {
      notify(t("failedToTranslate"));
      throw new Error(t("failedToTranslate"));
    }
    const data = (await res.json()) as { translation: string };
    return data.translation;
  };
}
