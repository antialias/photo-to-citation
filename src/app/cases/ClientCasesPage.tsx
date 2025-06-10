"use client";
import type { Case } from "@/lib/caseStore";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import AnalysisInfo from "../components/AnalysisInfo";
import MapPreview from "../components/MapPreview";

export default function ClientCasesPage({
  initialCases,
}: {
  initialCases: Case[];
}) {
  const [cases, setCases] = useState(initialCases);

  useEffect(() => {
    const es = new EventSource("/api/cases/stream");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as Case;
      setCases((prev) => {
        const idx = prev.findIndex((c) => c.id === data.id);
        if (idx === -1) return [...prev, data];
        const copy = [...prev];
        copy[idx] = data;
        return copy;
      });
    };
    return () => es.close();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Cases</h1>
      <ul className="grid gap-4">
        {cases.map((c) => (
          <li key={c.id} className="border p-2">
            <Link href={`/cases/${c.id}`} className="flex items-start gap-4">
              <Image src={c.photos[0]} alt="" width={80} height={60} />
              {c.gps ? (
                <MapPreview
                  lat={c.gps.lat}
                  lon={c.gps.lon}
                  width={80}
                  height={60}
                />
              ) : null}
              <div className="flex flex-col text-sm gap-1">
                <span className="font-semibold">Case {c.id}</span>
                {c.analysis ? (
                  <AnalysisInfo analysis={c.analysis} />
                ) : (
                  <span className="text-gray-500">Processing...</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
