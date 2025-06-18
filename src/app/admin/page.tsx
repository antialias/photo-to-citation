import { getCasbinRules, listUsers } from "@/lib/adminStore";
import { withAuthorization } from "@/lib/authz";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import AdminPageClient from "./AdminPageClient";

export const dynamic = "force-dynamic";

const handler = withAuthorization(
  "admin",
  "read",
  async (
    _req: Request,
    { session }: { session?: { user?: { role?: string } } },
  ) => {
    const s = session ?? (await getServerSession(authOptions));
    if (s?.user?.role !== "admin" && s?.user?.role !== "superadmin") {
      return new Response(null, { status: 403 });
    }
    const users = listUsers();
    const rules = getCasbinRules();
    return <AdminPageClient initialUsers={users} initialRules={rules} />;
  },
);

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  return handler(new Request("http://localhost"), {
    session: session ?? undefined,
  });
}
