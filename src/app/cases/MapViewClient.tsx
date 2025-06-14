"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Marker, Overlay, Map as PigeonMap } from "pigeon-maps";
import { useEffect, useRef, useState } from "react";
import type { Case } from "../../lib/caseStore";
import { getRepresentativePhoto } from "../../lib/caseUtils";

export default function MapViewClient({ cases }: { cases: Case[] }) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [zoomLevel, setZoomLevel] = useState(11);
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight - 64 });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const coords = cases
      .filter((c): c is Case & { gps: { lat: number; lon: number } } =>
        Boolean(c.gps),
      )
      .map((c) => [c.gps.lat, c.gps.lon]);
    if (coords.length === 0) return;
    let minLat = coords[0][0];
    let maxLat = coords[0][0];
    let minLon = coords[0][1];
    let maxLon = coords[0][1];
    for (const [lat, lon] of coords) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    }
    const mapW = size.width;
    const mapH = size.height;

    function latRad(lat: number): number {
      const s = Math.sin((lat * Math.PI) / 180);
      const r = Math.log((1 + s) / (1 - s)) / 2;
      return Math.max(Math.min(r, Math.PI), -Math.PI) / 2;
    }
    function zoom(mapPx: number, worldPx: number, fraction: number): number {
      return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }
    const latFraction = (latRad(maxLat) - latRad(minLat)) / Math.PI;
    const lonDiff =
      maxLon - minLon < 0 ? maxLon - minLon + 360 : maxLon - minLon;
    const lonFraction = lonDiff / 360;
    const latZoom = zoom(mapH, 256, latFraction * 1.2);
    const lonZoom = zoom(mapW, 256, lonFraction * 1.2);
    const zoomLvl = Math.min(latZoom, lonZoom, 21);
    setZoomLevel(zoomLvl);
    setCenter([(minLat + maxLat) / 2, (minLon + maxLon) / 2]);
  }, [cases, size.height, size.width]);

  return (
    <PigeonMap
      height={size.height}
      width={size.width}
      center={center}
      zoom={zoomLevel}
      ref={mapRef}
    >
      {cases.map((c) =>
        c.gps ? (
          <Marker
            key={c.id}
            width={40}
            anchor={[c.gps.lat, c.gps.lon]}
            onClick={() => router.push(`/cases/${c.id}`)}
          >
            <Overlay anchor={[c.gps.lat, c.gps.lon]} offset={[0, -40]}>
              <button
                type="button"
                className="bg-white shadow rounded p-1 text-xs cursor-pointer"
                onClick={() => router.push(`/cases/${c.id}`)}
              >
                <Image
                  src={getRepresentativePhoto(c)}
                  alt="preview"
                  width={80}
                  height={60}
                />
              </button>
            </Overlay>
          </Marker>
        ) : null,
      )}
    </PigeonMap>
  );
}
