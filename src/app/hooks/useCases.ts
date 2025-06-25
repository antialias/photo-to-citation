"use client";
import type { Case } from "@/lib/caseStore";
import { useQuery } from "@tanstack/react-query";

export const casesQueryKey = ["/api/cases"] as const;

export default function useCases() {
  return useQuery<Case[]>({ queryKey: casesQueryKey });
}
