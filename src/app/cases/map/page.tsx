import { getCases } from "../../../lib/caseStore";
import MapViewClient from "../MapViewClient";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const cases = getCases();
  return <MapViewClient cases={cases} />;
}
