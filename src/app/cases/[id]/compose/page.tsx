import ComposeWrapper from "@/app/cases/[id]/ComposeWrapper";
import { getAuthorizedCase } from "@/lib/caseAccess";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ComposePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await getAuthorizedCase(id);
  if (!c) notFound();
  return <ComposeWrapper caseData={c} caseId={id} />;
}
