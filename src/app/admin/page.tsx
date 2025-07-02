import { getCasbinRules, listUsers } from "@/lib/adminStore";
import { getAuthOptions } from "@/lib/authOptions";
import { withAuthorization } from "@/lib/authz";
import { log } from "@/lib/logger";
import { getServerSession } from "next-auth/next";
import AdminPageClient from "./AdminPageClient";

export const dynamic = "force-dynamic";

const handler = withAuthorization(
  { obj: "admin" },
  async (
    _req: Request,
    { session }: { session?: { user?: { role?: string } } },
  ) => {
    const s = session ?? (await getServerSession(getAuthOptions()));
    log("admin page session", s?.user?.role);
    if (s?.user?.role !== "admin" && s?.user?.role !== "superadmin") {
      return new Response(null, { status: 403 });
    }
    const users = listUsers();
    const rules = getCasbinRules();
    return <AdminPageClient initialUsers={users} initialRules={rules} />;
  },
);

export default async function AdminPage() {
  const session = await getServerSession(getAuthOptions());
  return handler(new Request("http://localhost"), {
    params: Promise.resolve({}),
    session: session ?? undefined,
  });
}
