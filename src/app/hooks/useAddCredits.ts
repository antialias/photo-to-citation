"use client";
import { apiFetch } from "@/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { creditBalanceQueryKey } from "./useCreditBalance";

export default function useAddCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    async mutationFn(usd: number) {
      await apiFetch("/api/credits/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usd }),
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: creditBalanceQueryKey });
    },
  });
}
