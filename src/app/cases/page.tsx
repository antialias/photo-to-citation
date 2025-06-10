import { getCases } from "@/lib/caseStore";
import { getStaticMapUrl } from "@/lib/maps";
import Image from "next/image";
import Link from "next/link";

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
              <Image src={c.photo} alt="" width={80} height={60} />
              {c.gps ? (
                <Image
                  src={getStaticMapUrl(c.gps, { width: 80, height: 60 })}
                  alt="map"
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
