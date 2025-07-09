import { getCasbinRules, listUsers } from "@/lib/adminStore";
import { withAuthorization } from "@/lib/authz";
import { log } from "@/lib/logger";
import { space } from "@/styleTokens";
import type { ReactElement } from "react";
import { css } from "styled-system/css";
import { SessionContext } from "../server-context";
import AdminDeploymentInfo from "./AdminDeploymentInfo";
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
    const s = session ?? SessionContext.read();
    log("admin page session", s?.user?.role);
    if (s?.user?.role !== "admin" && s?.user?.role !== "superadmin") {
      return new Response(null, { status: 403 });
    }
    const users = listUsers();
    const rules = getCasbinRules();
    const { tab } = (await searchParams) ?? {};
    const isSuperadmin = s?.user?.role === "superadmin";
    const t =
      tab === "config" || (tab === "status" && isSuperadmin)
        ? (tab as "config" | "status")
        : "users";
    const styles = { wrapper: css({ p: space.container }) };
    return (
      <div className={styles.wrapper}>
        <AdminPageClient
          initialUsers={users}
          initialRules={rules}
          initialTab={t}
        />
        {isSuperadmin && <AdminDeploymentInfo />}
      </div>
    );
  },
);

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = SessionContext.read();
  return handler(new Request("http://localhost"), {
    params: Promise.resolve({}),
    session: session ?? undefined,
    searchParams,
  });
}
