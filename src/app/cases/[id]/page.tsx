import { authOptions } from "@/lib/authOptions";
import { getCase } from "@/lib/caseStore";
import { getServerSession } from "next-auth/next";
import ClientCasePage from "./ClientCasePage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CasePage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCase(id);
  const session = await getServerSession(authOptions);
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "superadmin";
  return <ClientCasePage caseId={id} initialCase={c ?? null} />;
}
