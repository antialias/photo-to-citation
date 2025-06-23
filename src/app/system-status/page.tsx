import { authOptions } from "@/lib/authOptions";
import { authorize } from "@/lib/authz";
import { getServerSession } from "next-auth/next";
import SystemStatusClient from "./SystemStatusClient";

export const dynamic = "force-dynamic";

export default async function SystemStatusPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "anonymous";
  const allowed = await authorize(role, "superadmin", "read");
  if (!allowed) {
    return <p className="p-8">You are not authorized to view this page.</p>;
  }
  return <SystemStatusClient />;
}
