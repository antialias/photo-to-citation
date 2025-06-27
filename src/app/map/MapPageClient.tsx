"use client";
import { useRouter } from "next/navigation";
import { Marker, Overlay, Map as PigeonMap } from "pigeon-maps";
import { osm } from "pigeon-maps/providers";
import { useEffect, useRef, useState } from "react";
import type React from "react";

import ThumbnailImage from "@/components/thumbnail-image";
import { getThumbnailUrl } from "@/lib/clientThumbnails";

import "@/app/globals.css";

export interface MapCase {
  id: string;
  gps: { lat: number; lon: number };
  photo: string;
}

function computeView(
  cases: MapCase[],
  width: number,
  height: number,
): { center: [number, number]; zoom: number } {
  if (!cases.length) return { center: [0, 0], zoom: 2 };
  let minLat = cases[0].gps.lat;
  let maxLat = cases[0].gps.lat;
  let minLon = cases[0].gps.lon;
  let maxLon = cases[0].gps.lon;
  for (const c of cases) {
    if (c.gps.lat < minLat) minLat = c.gps.lat;
    if (c.gps.lat > maxLat) maxLat = c.gps.lat;
    if (c.gps.lon < minLon) minLon = c.gps.lon;
    if (c.gps.lon > maxLon) maxLon = c.gps.lon;
  }
  const center: [number, number] = [
    (minLat + maxLat) / 2,
    (minLon + maxLon) / 2,
  ];
  const WORLD_DIM = { width: 256, height: 256 };
  const ZOOM_MAX = 18;
  const latRad = (lat: number) => {
    const sin = Math.sin((lat * Math.PI) / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  };
  const zoom = (mapPx: number, worldPx: number, fraction: number) => {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  };
  const latFraction = (latRad(maxLat) - latRad(minLat)) / Math.PI;
  const lngDiff = maxLon - minLon;
  const lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;
  const latZoom =
    latFraction === 0 ? ZOOM_MAX : zoom(height, WORLD_DIM.height, latFraction);
  const lngZoom =
    lngFraction === 0 ? ZOOM_MAX : zoom(width, WORLD_DIM.width, lngFraction);
  const bestZoom = Math.min(latZoom, lngZoom, ZOOM_MAX);
  return { center, zoom: Number.isFinite(bestZoom) ? bestZoom : 2 };
}

export default function MapPageClient({ cases }: { cases: MapCase[] }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ width: 800, height: 600 });
  const [view, setView] = useState<{ center: [number, number]; zoom: number }>({
    center: [0, 0],
    zoom: 2,
  });
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    function update() {
      const width = containerRef.current?.clientWidth ?? 800;
      const height = containerRef.current?.clientHeight ?? 600;
      setMapSize({ width, height });
      setView(computeView(cases, width, height));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [cases]);

  return (
    <div
      ref={containerRef}
      style={{ height: "calc(100dvh - 4rem)", width: "100%" }}
    >
      <PigeonMap
        width={mapSize.width}
        height={mapSize.height}
        center={view.center}
        zoom={view.zoom}
        provider={osm}
      >
        {cases.map((c) => (
          <React.Fragment key={c.id}>
            <Marker
              anchor={[c.gps.lat, c.gps.lon] as [number, number]}
              onClick={() => router.push(`/cases/${c.id}`)}
              onMouseOver={() => setHover(c.id)}
              onMouseOut={() => setHover((h) => (h === c.id ? null : h))}
            />
            {hover === c.id && (
              <Overlay anchor={[c.gps.lat, c.gps.lon]} offset={[80, 100]}>
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
            )}
          </React.Fragment>
        ))}
      </PigeonMap>
    </div>
  );
}
