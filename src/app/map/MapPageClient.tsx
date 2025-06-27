"use client";
import ThumbnailImage from "@/components/thumbnail-image";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { useRouter } from "next/navigation";
import { Overlay, Map as PigeonMap } from "pigeon-maps";
import { osm } from "pigeon-maps/providers";
import { useEffect, useRef, useState } from "react";

export interface MapCase {
  id: string;
  gps: { lat: number; lon: number };
  photo: string;
}

const markerIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="25"
    height="41"
    viewBox="0 0 25 41"
  >
    <title>Case marker</title>
    <path
      d="M12.5 1c6 0 11 5 11 11 0 9-11 28-11 28S1.5 21 1.5 12C1.5 6 6.5 1 12.5 1z"
      fill="#2563eb"
      stroke="white"
      strokeWidth="2"
    />
    <circle cx="12.5" cy="12" r="3" fill="white" />
  </svg>
);

export default function MapPageClient({ cases }: { cases: MapCase[] }) {
  const router = useRouter();
  const mapRef = useRef<PigeonMap>(null);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [zoom, setZoom] = useState(2);

  useEffect(() => {
    if (cases.length === 0) return;
    const lats = cases.map((c) => c.gps.lat);
    const lons = cases.map((c) => c.gps.lon);
    const ne = [Math.max(...lats), Math.max(...lons)];
    const sw = [Math.min(...lats), Math.min(...lons)];

    const width = typeof window !== "undefined" ? window.innerWidth : 1024;
    const height =
      typeof window !== "undefined" ? window.innerHeight - 64 : 768;

    const latRad = (lat: number) => {
      const sin = Math.sin((lat * Math.PI) / 180);
      const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
      return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    };

    const zoomFor = (nePt: number[], swPt: number[]) => {
      const WORLD_DIM = { width: 256, height: 256 };
      const ZOOM_MAX = 18;
      const latFraction = (latRad(nePt[0]) - latRad(swPt[0])) / Math.PI;
      const lngDiff = nePt[1] - swPt[1];
      const lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;
      const latZoom = Math.floor(
        Math.log(height / WORLD_DIM.height / latFraction) / Math.LN2,
      );
      const lngZoom = Math.floor(
        Math.log(width / WORLD_DIM.width / lngFraction) / Math.LN2,
      );
      return Math.min(latZoom, lngZoom, ZOOM_MAX);
    };

    setCenter([(ne[0] + sw[0]) / 2, (ne[1] + sw[1]) / 2]);
    setZoom(zoomFor(ne, sw));
  }, [cases]);

  return (
    <PigeonMap
      ref={mapRef}
      center={center}
      zoom={zoom}
      onBoundsChanged={({ center, zoom }) => {
        setCenter(center);
        setZoom(zoom);
      }}
      provider={osm()}
      boxClassname="w-full h-[calc(100dvh_-_4rem)]"
    >
      {cases.map((c) => (
        <Overlay key={c.id} anchor={[c.gps.lat, c.gps.lon]} offset={[12.5, 41]}>
          <button
            type="button"
            className="group relative"
            onClick={() => router.push(`/cases/${c.id}`)}
          >
            <div className="select-none">{markerIcon}</div>
            <div className="absolute bottom-full left-1/2 hidden -translate-x-1/2 translate-y-[-0.5rem] group-hover:block bg-white p-1 shadow">
              <a
                href={`/cases/${c.id}`}
                className="w-40 block"
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
          </button>
        </Overlay>
      ))}
    </PigeonMap>
  );
}
