"use client";
import { useQuery } from "@tanstack/react-query";

export interface MailInfo {
  caseId: string;
  subject: string;
  status: "queued" | "saved" | "shortfall" | "error";
  sentAt: string;
}

export interface SnailMailOptions {
  openOnly: boolean;
  hideDelivered: boolean;
  caseId: string | null;
}

export function snailMailQueryKey(options: SnailMailOptions) {
  const params = new URLSearchParams();
  params.set("open", options.openOnly ? "true" : "false");
  if (options.caseId) params.set("case", options.caseId);
  if (options.hideDelivered) {
    params.append("status", "queued");
    params.append("status", "shortfall");
    params.append("status", "error");
  }
  return [`/api/snail-mail?${params.toString()}`] as const;
}

export default function useSnailMail(options: SnailMailOptions) {
  return useQuery<MailInfo[]>({ queryKey: snailMailQueryKey(options) });
}
