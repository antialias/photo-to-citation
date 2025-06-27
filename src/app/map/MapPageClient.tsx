"use client";
import ThumbnailImage from "@/components/thumbnail-image";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { useRouter } from "next/navigation";
import { Marker, Overlay, Map as PigeonMap } from "pigeon-maps";
import { useState } from "react";

import "@/app/globals.css";

export interface MapCase {
  id: string;
  gps: { lat: number; lon: number };
  photo: string;
}

export default function MapPageClient({ cases }: { cases: MapCase[] }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <PigeonMap
      defaultCenter={[0, 0] as [number, number]}
      defaultZoom={2}
      style={{ height: "calc(100dvh - 4rem)", width: "100%" }}
    >
      {cases.map((c) => (
        <div key={c.id}>
          <Marker
            anchor={[c.gps.lat, c.gps.lon] as [number, number]}
            color="#2563eb"
            onClick={() => router.push(`/cases/${c.id}`)}
            onMouseOver={() => setHover(c.id)}
            onMouseOut={() => setHover(null)}
          />
          {hover === c.id && (
            <Overlay
              anchor={[c.gps.lat, c.gps.lon] as [number, number]}
              offset={[80, 150]}
            >
              <a
                href={`/cases/${c.id}`}
                className="w-40 cursor-pointer block bg-white rounded shadow"
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/cases/${c.id}`);
                }}
              >
                <ThumbnailImage
                  src={getThumbnailUrl(c.photo, 256)}
                  alt={`Case ${c.id}`}
                  width={160}
                  height={120}
                  imgClassName="object-cover"
                />
                <div>Case {c.id}</div>
              </a>
            </Overlay>
          )}
        </div>
      ))}
    </PigeonMap>
  );
}
