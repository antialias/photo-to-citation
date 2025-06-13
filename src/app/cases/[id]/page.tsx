import type { Case } from "../../../lib/caseStore";
import { getCase } from "../../../lib/caseStore";
import CaseSummary from "../../components/CaseSummary";
import ClientCasePage from "./ClientCasePage";

export const dynamic = "force-dynamic";

/**
 * Render the case view for a single case.
 * If the optional "ids" query parameter contains multiple comma-separated
 * IDs, the page instead shows a summary of those cases.
 */
export default async function CasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ ids?: string }>;
}) {
  const { id } = await params;
  const { ids } = (await searchParams) ?? {};
  const parsed = ids ? ids.split(",").filter(Boolean) : [];
  if (parsed.length > 1) {
    const cases = parsed.map((cid) => getCase(cid)).filter(Boolean) as Case[];
    return <CaseSummary cases={cases} />;
  }
  const c = getCase(id);
  return <ClientCasePage caseId={id} initialCase={c ?? null} />;
}
