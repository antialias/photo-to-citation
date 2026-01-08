import { authOptions } from "@/lib/authOptions";
import { authorize, getSessionDetails } from "@/lib/authz";
import { getServerSession } from "next-auth/next";
import type { ReactElement } from "react";
import SystemStatusClient from "./SystemStatusClient";

export const dynamic = "force-dynamic";

export default async function SystemStatusPage(): Promise<ReactElement> {
  const session = await getServerSession(authOptions);
  const { role, userId } = getSessionDetails({ session });
  if (!(await authorize(role, "superadmin", "read", { userId }))) {
    return <p>Access denied</p>;
  }
  return <SystemStatusClient />;
}
