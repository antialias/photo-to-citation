"use client";
import type { Case } from "@/lib/caseStore";
import { useQuery } from "@tanstack/react-query";

export const caseQueryKey = (id: string) => [`/api/cases/${id}`] as const;

export default function useCase(id: string, initialData?: Case | null) {
  return useQuery<Case | null>({
    queryKey: caseQueryKey(id),
    initialData: initialData ?? undefined,
    enabled: !!id,
  });
}
