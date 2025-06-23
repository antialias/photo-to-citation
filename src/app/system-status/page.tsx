import { authOptions } from "@/lib/authOptions";
import { authorize, getSessionDetails } from "@/lib/authz";
import { getServerSession } from "next-auth/next";
import SystemStatusClient from "./SystemStatusClient";

export const dynamic = "force-dynamic";

export default async function SystemStatusPage() {
  const session = await getServerSession(authOptions);
  const { role, userId } = getSessionDetails({ session });
  if (!(await authorize(role, "superadmin", "read", { userId }))) {
    return new Response(null, { status: 403 });
  }
  return <SystemStatusClient />;
}
