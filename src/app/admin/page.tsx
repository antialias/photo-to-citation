import { getCasbinRules, listUsers } from "@/lib/adminStore";
import AdminPageClient from "./AdminPageClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const users = listUsers();
  const rules = getCasbinRules();
  return <AdminPageClient initialUsers={users} initialRules={rules} />;
}
