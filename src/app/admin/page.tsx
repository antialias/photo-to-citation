import { getCasbinRules, listUsers } from "@/lib/adminStore";
import { requirePageAuthorization } from "@/lib/authz";
import { space } from "@/styleTokens";
import { css } from "styled-system/css";
import AdminDeploymentInfo from "./AdminDeploymentInfo";
import AdminPageClient from "./AdminPageClient";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { role } = await requirePageAuthorization({ obj: "admin" });
  const users = listUsers();
  const rules = getCasbinRules();
  const { tab } = (await searchParams) ?? {};
  const isSuperadmin = role === "superadmin";
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
}
