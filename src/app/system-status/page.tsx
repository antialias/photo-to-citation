import { requirePageAuthorization } from "@/lib/authz";
import SystemStatusClient from "./SystemStatusClient";

export const dynamic = "force-dynamic";

export default async function SystemStatusPage() {
  await requirePageAuthorization({ obj: "superadmin" });
  return <SystemStatusClient />;
}
