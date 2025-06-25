"use client";
import { useQuery } from "@tanstack/react-query";

export interface CaseMember {
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
}

export const caseMembersQueryKey = (id: string) =>
  [`/api/cases/${id}/members`] as const;

export default function useCaseMembers(id: string) {
  return useQuery<CaseMember[]>({
    queryKey: caseMembersQueryKey(id),
    enabled: !!id,
  });
}
