"use client";
import { apiFetch } from "@/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "./components/NotificationProvider";
import { caseQueryKey } from "./hooks/useCase";

export default function useCaseTranslate(caseId: string) {
  const queryClient = useQueryClient();
  const notify = useNotify();
  const mutation = useMutation({
    async mutationFn({ path, lang }: { path: string; lang: string }) {
      const res = await apiFetch(`/api/cases/${caseId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, lang }),
      });
      if (!res.ok) throw new Error("Failed to translate.");
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify("Failed to translate.");
    },
  });
  return (path: string, lang: string) =>
    mutation.mutateAsync({ path, lang }).then(() => {});
}
