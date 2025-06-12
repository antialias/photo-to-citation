import { getCase } from "@/lib/caseStore";
import NotifyOwnerWrapper from "../NotifyOwnerWrapper";

export const dynamic = "force-dynamic";

export default async function NotifyOwnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = getCase(id);
  return <NotifyOwnerWrapper caseData={c ?? null} caseId={id} />;
}
