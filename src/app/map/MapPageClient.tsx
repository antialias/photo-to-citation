"use client";
import ThumbnailImage from "@/components/thumbnail-image";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { useRouter } from "next/navigation";
import { Marker, Overlay, Map as PigeonMap } from "pigeon-maps";
import { useEffect, useState } from "react";

import "@/app/globals.css";

function computeView(cases: MapCase[]) {
  if (cases.length === 0)
    return { center: [0, 0] as [number, number], zoom: 2 };
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLon = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  for (const c of cases) {
    minLat = Math.min(minLat, c.gps.lat);
    maxLat = Math.max(maxLat, c.gps.lat);
    minLon = Math.min(minLon, c.gps.lon);
    maxLon = Math.max(maxLon, c.gps.lon);
  }
  const center: [number, number] = [
    (minLat + maxLat) / 2,
    (minLon + maxLon) / 2,
  ];
  const diff = Math.max(maxLat - minLat, maxLon - minLon);
  let zoom = 2;
  if (diff < 0.01) zoom = 12;
  else if (diff < 0.1) zoom = 10;
  else if (diff < 1) zoom = 8;
  else if (diff < 5) zoom = 6;
  else if (diff < 20) zoom = 4;
  return { center, zoom };
}

export interface MapCase {
  id: string;
  gps: { lat: number; lon: number };
  photo: string;
}

export default function MapPageClient({ cases }: { cases: MapCase[] }) {
  const router = useRouter();
  const [{ center, zoom }, setView] = useState(computeView(cases));
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    setView(computeView(cases));
  }, [cases]);

  return (
    <PigeonMap
      center={center}
      zoom={zoom}
      animate={true}
      onBoundsChanged={({ center: c, zoom: z }) =>
        setView({ center: c, zoom: z })
      }
      style={{ height: "calc(100dvh - 4rem)", width: "100%" }}
    >
      {cases.map((c) => (
        <Marker
          key={c.id}
          anchor={[c.gps.lat, c.gps.lon] as [number, number]}
          width={30}
          color="#2563eb"
          onClick={() => router.push(`/cases/${c.id}`)}
          onMouseOver={() => setHover(c.id)}
          onMouseOut={() => setHover(null)}
        />
      ))}
      {cases.map(
        (c) =>
          hover === c.id && (
            <Overlay
              key={`${c.id}-overlay`}
              anchor={[c.gps.lat, c.gps.lon] as [number, number]}
              offset={[-80, -130]}
            >
              <a
                href={`/cases/${c.id}`}
                className="w-40 cursor-pointer block"
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
          ),
      )}
    </PigeonMap>
  );
}
