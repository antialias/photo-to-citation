"use client";
import { apiFetch } from "@/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNotify } from "./components/NotificationProvider";
import { caseQueryKey } from "./hooks/useCase";

export default function useCaseTranslate(caseId: string) {
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { t } = useTranslation();
  const mutation = useMutation({
    async mutationFn({ path, lang }: { path: string; lang: string }) {
      const res = await apiFetch(`/api/cases/${caseId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, lang }),
      });
      if (!res.ok) throw new Error(t("failedToTranslate"));
      return res.json();
    },
    onSuccess(data) {
      queryClient.setQueryData(caseQueryKey(caseId), data);
    },
    onError() {
      notify(t("failedToTranslate"));
    },
  });
  return (path: string, lang: string) =>
    mutation.mutateAsync({ path, lang }).then(() => {});
}
