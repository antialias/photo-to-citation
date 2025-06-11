import { getCase } from "@/lib/caseStore";
import ComposeWrapper from "../ComposeWrapper";

export const dynamic = "force-dynamic";

export default async function ComposePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const c = getCase(id);
  return <ComposeWrapper caseData={c ?? null} caseId={id} />;
}
