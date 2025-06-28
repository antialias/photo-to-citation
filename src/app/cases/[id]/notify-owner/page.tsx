import NotifyOwnerWrapper from "@/app/cases/[id]/NotifyOwnerWrapper";
import { getAuthorizedCase } from "@/lib/caseAccess";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NotifyOwnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await getAuthorizedCase(id);
  if (!c) notFound();
  return <NotifyOwnerWrapper caseData={c} caseId={id} />;
}
