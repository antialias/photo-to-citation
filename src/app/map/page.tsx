import { getCases } from "../../lib/caseStore";
import {
  getOfficialCaseGps,
  getRepresentativePhoto,
} from "../../lib/caseUtils";
import MapPageClient from "./MapPageClient";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const cases = getCases();
  const mapped = cases
    .map((c) => {
      const gps = getOfficialCaseGps(c);
      if (!gps) return null;
      return {
        id: c.id,
        gps,
        photo: getRepresentativePhoto(c),
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    gps: { lat: number; lon: number };
    photo: string;
  }>;
  return <MapPageClient cases={mapped} />;
}
