import { getCases } from "../../lib/caseStore";
import ClientCasesPage from "./ClientCasesPage";

export const dynamic = "force-dynamic";

export default function CasesPage() {
  const cases = getCases();
  return <ClientCasesPage initialCases={cases} />;
}
