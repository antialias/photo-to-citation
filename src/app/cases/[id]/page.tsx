import { getAuthorizedCase } from "@/lib/caseAccess";
import { notFound } from "next/navigation";
import ClientCasePage from "./ClientCasePage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CasePage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getAuthorizedCase(id);
  if (!c) notFound();
  return <ClientCasePage caseId={id} initialCase={c} />;
}
