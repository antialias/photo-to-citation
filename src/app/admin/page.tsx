import { getCasbinRules, listUsers } from "@/lib/adminStore";
import { authOptions } from "@/lib/authOptions";
import { authorize } from "@/lib/authz";
import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import AdminPageClient from "./AdminPageClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "anonymous";
  const ok = await authorize(role, "admin", "read");
  const isSuper = await authorize(role, "superadmin", "read");
  if (!ok && !isSuper) {
    notFound();
  }
  const users = listUsers();
  const rules = getCasbinRules();
  return <AdminPageClient initialUsers={users} initialRules={rules} />;
}
