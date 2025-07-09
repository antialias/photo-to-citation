export const dynamic = "force-dynamic";

import CaseSummary from "@/app/components/CaseSummary";
import type { Case } from "@/lib/caseStore";
import { getCase } from "@/lib/caseStore";
import { css } from "styled-system/css";

export default async function CasesPage({
  searchParams,
}: {
  searchParams?: Promise<{ ids?: string }>;
}) {
  const { ids } = (await searchParams) ?? {};
  const parsed = ids ? ids.split(",").filter(Boolean) : [];
  if (parsed.length > 1) {
    const cases = parsed.map((id) => getCase(id)).filter(Boolean) as Case[];
    return <CaseSummary cases={cases} />;
  }
  return (
    <div className={css({ p: "8" })}>
      <h1 className={css({ fontSize: "xl", fontWeight: "bold", mb: "4" })}>
        Cases
      </h1>
      <p>Select a case to view details.</p>
    </div>
  );
}
