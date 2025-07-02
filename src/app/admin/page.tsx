import { getCasbinRules, listUsers } from "@/lib/adminStore";
import { authOptions } from "@/lib/authOptions";
import { withAuthorization } from "@/lib/authz";
import { log } from "@/lib/logger";
import { getServerSession } from "next-auth/next";
import AdminPageClient from "./AdminPageClient";
import type { ReactElement } from "react";

export const dynamic = "force-dynamic";

const handler = withAuthorization<
  {
    params: Promise<Record<string, string>>;
    session?: { user?: { role?: string } };
    searchParams?: { tab?: string };
  },
  Response | ReactElement
>(
  { obj: "admin" },
  async (
    _req: Request,
    {
      session,
      searchParams,
    }: {
      session?: { user?: { role?: string } };
      searchParams?: { tab?: string };
    },
  ) => {
    const s = session ?? (await getServerSession(authOptions));
    log("admin page session", s?.user?.role);
    if (s?.user?.role !== "admin" && s?.user?.role !== "superadmin") {
      return new Response(null, { status: 403 });
    }
    const users = listUsers();
    const rules = getCasbinRules();
    const tab = searchParams?.tab === "config" ? "config" : "users";
    return (
      <AdminPageClient
        initialUsers={users}
        initialRules={rules}
        initialTab={tab}
      />
    );
  },
);

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  return handler(new Request("http://localhost"), {
    params: Promise.resolve({}),
    session: session ?? undefined,
    searchParams,
  });
}
