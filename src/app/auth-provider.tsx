"use client";
import { BASE_PATH } from "@/basePath";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  const authPath = BASE_PATH ? `${BASE_PATH}/api/auth` : "/api/auth";
  return (
    <SessionProvider session={session} basePath={authPath}>
      {children}
    </SessionProvider>
  );
}
