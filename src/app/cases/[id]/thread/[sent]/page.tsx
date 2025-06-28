import ThreadWrapper from "@/app/cases/[id]/ThreadWrapper";
import { getAuthorizedCase } from "@/lib/caseAccess";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string; sent: string }>;
}) {
  const { id, sent } = await params;
  const c = await getAuthorizedCase(id);
  if (!c) notFound();
  return (
    <ThreadWrapper
      caseId={id}
      startId={decodeURIComponent(sent)}
      caseData={c}
    />
  );
}
