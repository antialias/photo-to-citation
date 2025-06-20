import FollowUpWrapper from "@/app/cases/[id]/FollowUpWrapper";
import { getCase } from "@/lib/caseStore";

export const dynamic = "force-dynamic";

export default async function FollowUpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = getCase(id);
  return <FollowUpWrapper caseData={c ?? null} caseId={id} />;
}
