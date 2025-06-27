import { getCases } from "@/lib/caseStore";
import { getOfficialCaseGps, getRepresentativePhoto } from "@/lib/caseUtils";
import nextDynamic from "next/dynamic";

// Leaflet relies on the `window` object which isn't available on the server.
// Dynamically import the client component to ensure it only loads in the
// browser.
const MapPageClient = nextDynamic(() => import("./MapPageClient"), {
  ssr: false,
});

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const cases = getCases();
  const mapped = cases
    .map((c) => {
      const gps = getOfficialCaseGps(c);
      const photo = getRepresentativePhoto(c);
      if (!gps || !photo) return null;
      return {
        id: c.id,
        gps,
        photo,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    gps: { lat: number; lon: number };
    photo: string;
  }>;
  return <MapPageClient cases={mapped} />;
}
