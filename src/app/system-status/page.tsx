import { authOptions } from "@/lib/authOptions";
import { authorize } from "@/lib/authz";
import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import SystemStatusClient from "./SystemStatusClient";

export const dynamic = "force-dynamic";

export default async function SystemStatusPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "anonymous";
  const ok = await authorize(role, "superadmin", "read");
  if (!ok) {
    notFound();
  }
  return <SystemStatusClient />;
}
