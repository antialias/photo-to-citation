import ClientCasePage from "@/app/cases/[id]/ClientCasePage";
import { getCase } from "@/lib/caseStore";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PublicCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = getCase(id);
  if (!c || !c.public) {
    notFound();
  }
  return <ClientCasePage caseId={id} initialCase={c} readOnly />;
}
