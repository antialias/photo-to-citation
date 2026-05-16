import { requirePageAuthorization } from "@/lib/authz";
import SnailMailPageClient from "./SnailMailPageClient";

export const dynamic = "force-dynamic";

export default async function SnailMailPage() {
  await requirePageAuthorization({ obj: "cases" });
  return <SnailMailPageClient />;
}
