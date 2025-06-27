"use client";
import ThumbnailImage from "@/components/thumbnail-image";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { useRouter } from "next/navigation";
import { Marker, Overlay, Map as PigeonMap, ZoomControl } from "pigeon-maps";
import type { Bounds, Map as MapInstance } from "pigeon-maps";
import { useEffect, useRef } from "react";
import type React from "react";
import "@/app/globals.css";

function MarkerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="25"
      height="41"
      viewBox="0 0 25 41"
      aria-label="marker"
      role="img"
    >
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

function computeZoom(bounds: Bounds, width: number, height: number) {
  const WORLD_DIM = { height: 256, width: 256 };
  const ZOOM_MAX = 18;
  const latRad = (lat: number) => {
    const sin = Math.sin((lat * Math.PI) / 180);
    const rad = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(rad, Math.PI), -Math.PI) / 2;
  };
  const latFraction = (latRad(bounds.ne[0]) - latRad(bounds.sw[0])) / Math.PI;
  const lngDiff = bounds.ne[1] - bounds.sw[1];
  const lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;
  const latZoom = Math.floor(
    Math.log(height / WORLD_DIM.height / latFraction) / Math.LN2,
  );
  const lngZoom = Math.floor(
    Math.log(width / WORLD_DIM.width / lngFraction) / Math.LN2,
  );
  return Math.min(latZoom, lngZoom, ZOOM_MAX);
}

export default function MapPageClient({ cases }: { cases: MapCase[] }) {
  const router = useRouter();
  const mapRef = useRef<MapInstance | null>(null);

  useEffect(() => {
    if (!mapRef.current || cases.length === 0) return;
    const lats = cases.map((c) => c.gps.lat);
    const lons = cases.map((c) => c.gps.lon);
    const bounds: Bounds = {
      ne: [Math.max(...lats), Math.max(...lons)],
      sw: [Math.min(...lats), Math.min(...lons)],
    };
    const center: [number, number] = [
      (bounds.ne[0] + bounds.sw[0]) / 2,
      (bounds.ne[1] + bounds.sw[1]) / 2,
    ];
    const width = mapRef.current.state.width || window.innerWidth;
    const height = mapRef.current.state.height || window.innerHeight;
    const zoom = computeZoom(bounds, width, height);
    mapRef.current.setCenterZoom(center, zoom);
  }, [cases]);

  return (
    <PigeonMap
      ref={mapRef}
      height={typeof window === "undefined" ? 600 : window.innerHeight - 64}
      defaultCenter={[0, 0]}
      defaultZoom={2}
      twoFingerDrag={false}
    >
      <ZoomControl />
      {cases.map((c) => (
        <React.Fragment key={c.id}>
          <Marker
            anchor={[c.gps.lat, c.gps.lon] as [number, number]}
            width={25}
            height={41}
            onClick={() => router.push(`/cases/${c.id}`)}
          >
            <div style={{ transform: "translate(-12px, -41px)" }}>
              <MarkerIcon />
            </div>
          </Marker>
          <Overlay anchor={[c.gps.lat, c.gps.lon]} offset={[0, 45]}>
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
        </React.Fragment>
      ))}
    </PigeonMap>
  );
}
