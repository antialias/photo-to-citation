import { getCasbinRules, listUsers } from "@/lib/adminStore";
import { authOptions } from "@/lib/authOptions";
import { withAuthorization } from "@/lib/authz";
import { log } from "@/lib/logger";
import { getServerSession } from "next-auth/next";
import type { ReactElement } from "react";
import AdminPageClient from "./AdminPageClient";

export const dynamic = "force-dynamic";

const handler = withAuthorization<
  {
    params: Promise<Record<string, string>>;
    session?: { user?: { role?: string } };
    searchParams?: Promise<{ tab?: string }>;
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
      searchParams?: Promise<{ tab?: string }>;
    },
  ) => {
    const s = session ?? (await getServerSession(authOptions));
    log("admin page session", s?.user?.role);
    if (s?.user?.role !== "admin" && s?.user?.role !== "superadmin") {
      return new Response(null, { status: 403 });
    }
    const users = listUsers();
    const rules = getCasbinRules();
    const { tab } = (await searchParams) ?? {};
    const t = tab === "config" ? "config" : "users";
    return (
      <AdminPageClient
        initialUsers={users}
        initialRules={rules}
        initialTab={t}
      />
    );
  },
);

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  return handler(new Request("http://localhost"), {
    params: Promise.resolve({}),
    session: session ?? undefined,
    searchParams,
  });
}
