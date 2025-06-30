"use client";
import ThumbnailImage from "@/components/thumbnail-image";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { useRouter } from "next/navigation";
import { Map as PigeonMap, Marker as PigeonMarker } from "pigeon-maps";
import { osm } from "pigeon-maps/providers";
import type React from "react";
import { useEffect, useRef, useState } from "react";

function MarkerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="25"
      height="41"
      viewBox="0 0 25 41"
      role="img"
      aria-labelledby="markerTitle"
    >
      <title id="markerTitle">Case marker</title>
      <path
        d="M12.5 1c6 0 11 5 11 11 0 9-11 28-11 28S1.5 21 1.5 12C1.5 6 6.5 1 12.5 1z"
        fill="#2563eb"
        stroke="white"
        strokeWidth="2"
      />
      <circle cx="12.5" cy="12" r="3" fill="white" />
    </svg>
  );
}

export interface MapCase {
  id: string;
  gps: { lat: number; lon: number };
  photo: string;
}

export default function MapPageClient({ cases }: { cases: MapCase[] }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [zoom, setZoom] = useState(2);

  useEffect(() => {
    if (!containerRef.current || cases.length === 0) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const lats = cases.map((c) => c.gps.lat);
    const lons = cases.map((c) => c.gps.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const latPad = (maxLat - minLat) * 0.2;
    const lonPad = (maxLon - minLon) * 0.2;
    const paddedNeLat = maxLat + latPad;
    const paddedNeLon = maxLon + lonPad;
    const paddedSwLat = minLat - latPad;
    const paddedSwLon = minLon - lonPad;

    const centerLat = (paddedNeLat + paddedSwLat) / 2;
    const centerLon = (paddedNeLon + paddedSwLon) / 2;

    const WORLD_DIM = { width: 256, height: 256 };
    const ZOOM_MAX = 21;
    const latRad = (lat: number) => {
      const sin = Math.sin((lat * Math.PI) / 180);
      const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
      return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    };
    const zoomLevel = (mapPx: number, worldPx: number, fraction: number) => {
      return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    };
    const latFraction = (latRad(paddedNeLat) - latRad(paddedSwLat)) / Math.PI;
    const lonDiff = paddedNeLon - paddedSwLon;
    const lonFraction = (lonDiff < 0 ? lonDiff + 360 : lonDiff) / 360;
    const latZoom = zoomLevel(height, WORLD_DIM.height, latFraction);
    const lonZoom = zoomLevel(width, WORLD_DIM.width, lonFraction);
    const nextZoom = Math.min(latZoom, lonZoom, ZOOM_MAX);
    setCenter([centerLat, centerLon]);
    setZoom(nextZoom);
  }, [cases]);

  return (
    <div
      ref={containerRef}
      style={{ height: "calc(100dvh - 4rem)", width: "100%" }}
    >
      <PigeonMap center={center} zoom={zoom} provider={osm}>
        {cases.map((c) => (
          <PigeonMarker
            key={c.id}
            anchor={[c.gps.lat, c.gps.lon] as [number, number]}
            width={25}
            onClick={() => router.push(`/cases/${c.id}`)}
          >
            <div style={{ pointerEvents: "auto" }} className="group relative">
              <MarkerIcon />
              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-full hidden group-hover:block">
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
              </div>
            </div>
          </PigeonMarker>
        ))}
      </PigeonMap>
    </div>
  );
}
