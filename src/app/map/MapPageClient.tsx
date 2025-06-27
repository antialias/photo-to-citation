"use client";
import ThumbnailImage from "@/components/thumbnail-image";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { useRouter } from "next/navigation";
import { Marker, Overlay, Map as PigeonMap, osm } from "pigeon-maps";
import { Fragment, useEffect, useRef } from "react";

import "@/app/globals.css";

export interface MapCase {
  id: string;
  gps: { lat: number; lon: number };
  photo: string;
}

function fitBounds(cases: MapCase[], width: number, height: number) {
  const lats = cases.map((c) => c.gps.lat);
  const lons = cases.map((c) => c.gps.lon);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLon = Math.min(...lons);
  let maxLon = Math.max(...lons);
  if (minLat === maxLat && minLon === maxLon) {
    return { center: [minLat, minLon] as [number, number], zoom: 14 };
  }
  const latPad = (maxLat - minLat) * 0.2;
  const lonPad = (maxLon - minLon) * 0.2;
  minLat -= latPad;
  maxLat += latPad;
  minLon -= lonPad;
  maxLon += lonPad;
  const WORLD_DIM = { height: 256, width: 256 };
  const ZOOM_MAX = 18;
  const latRad = (lat: number) => {
    const sin = Math.sin((lat * Math.PI) / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  };
  const zoom = (mapPx: number, worldPx: number, fraction: number) =>
    Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  const latFraction = (latRad(maxLat) - latRad(minLat)) / Math.PI;
  const lngDiff = maxLon - minLon < 0 ? maxLon - minLon + 360 : maxLon - minLon;
  const lngFraction = lngDiff / 360;
  const latZoom = zoom(height, WORLD_DIM.height, latFraction);
  const lngZoom = zoom(width, WORLD_DIM.width, lngFraction);
  const zoomLevel = Math.min(latZoom, lngZoom, ZOOM_MAX);
  return {
    center: [(minLat + maxLat) / 2, (minLon + maxLon) / 2] as [number, number],
    zoom: zoomLevel,
  };
}

export default function MapPageClient({ cases }: { cases: MapCase[] }) {
  const router = useRouter();
  const mapRef = useRef<Map>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mapRef.current || !containerRef.current || cases.length === 0) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const { center, zoom } = fitBounds(cases, width, height);
    mapRef.current.setCenterZoom(center, zoom);
  }, [cases]);
  return (
    <div
      ref={containerRef}
      style={{ height: "calc(100dvh - 4rem)", width: "100%" }}
    >
      <PigeonMap
        ref={mapRef}
        provider={osm}
        defaultCenter={[0, 0]}
        defaultZoom={2}
      >
        {cases.map((c) => (
          <Fragment key={c.id}>
            <Marker
              width={25}
              height={41}
              anchor={[c.gps.lat, c.gps.lon] as [number, number]}
              onClick={() => router.push(`/cases/${c.id}`)}
            />
            <Overlay
              anchor={[c.gps.lat, c.gps.lon] as [number, number]}
              offset={[0, -50]}
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
          </Fragment>
        ))}
      </PigeonMap>
    </div>
  );
}
