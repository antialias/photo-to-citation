import { getCases } from "@/lib/caseStore";
import Image from "next/image";
import Link from "next/link";
import MapPreview from "../components/MapPreview";

export const dynamic = "force-dynamic";

export default function CasesPage() {
  const cases = getCases();
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Cases</h1>
      <ul className="grid gap-4">
        {cases.map((c) => (
          <li key={c.id} className="border p-2">
            <Link href={`/cases/${c.id}`} className="flex items-center gap-4">
              <Image src={c.photos[0]} alt="" width={80} height={60} />
              {c.gps ? (
                <MapPreview
                  lat={c.gps.lat}
                  lon={c.gps.lon}
                  width={80}
                  height={60}
                />
              ) : null}
              <span>
                Case {c.id}
                {c.analysis ? "" : " (processing...)"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
