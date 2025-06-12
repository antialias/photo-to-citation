import { getCase } from "@/lib/caseStore";
import ThreadWrapper from "../../ThreadWrapper";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string; sent: string }>;
}) {
  const { id, sent } = await params;
  const c = getCase(id);
  return (
    <ThreadWrapper
      caseId={id}
      startId={decodeURIComponent(sent)}
      caseData={c ?? null}
    />
  );
}
