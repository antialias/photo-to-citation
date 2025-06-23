"use client";
import { apiFetch } from "@/apiClient";
import type { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";

function ClaimCases() {
  const { status } = useSession();
  useEffect(() => {
    if (status === "authenticated") {
      apiFetch("/api/cases/claim", { method: "POST" });
    }
  }, [status]);
  return null;
}

export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <ClaimCases />
      {children}
    </SessionProvider>
  );
}
