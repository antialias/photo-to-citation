export const dynamic = "force-dynamic";

import type { Case } from "../../lib/caseStore";
import { getCase } from "../../lib/caseStore";
import CaseSummary from "../components/CaseSummary";

export default function CasesPage({
  searchParams = {},
}: {
  searchParams?: { ids?: string };
}) {
  const ids = searchParams.ids
    ? searchParams.ids.split(",").filter(Boolean)
    : [];
  if (ids.length > 1) {
    const cases = ids.map((id) => getCase(id)).filter(Boolean) as Case[];
    return <CaseSummary cases={cases} />;
  }
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Cases</h1>
      <p>Select a case to view details.</p>
    </div>
  );
}
