"use client";
import { useQuery } from "@tanstack/react-query";

export const creditBalanceQueryKey = ["/api/credits/balance"] as const;

export default function useCreditBalance(enabled = true) {
  return useQuery<{ balance: number }>({
    queryKey: creditBalanceQueryKey,
    enabled,
  });
}
