import { getCase } from "@/lib/caseStore";
import ComposeWrapper from "../ComposeWrapper";

export const dynamic = "force-dynamic";

export default async function ComposePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = getCase(id);
  return <ComposeWrapper caseData={c ?? null} caseId={id} />;
}
