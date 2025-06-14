"use client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

import "../globals.css";

const markerSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
    <path
      d="M12.5 1c6 0 11 5 11 11 0 9-11 28-11 28S1.5 21 1.5 12C1.5 6 6.5 1 12.5 1z"
      fill="#2563eb" stroke="white" stroke-width="2"
    />
    <circle cx="12.5" cy="12" r="3" fill="white" />
  </svg>
`;

const markerIcon = L.divIcon({
  html: markerSvg,
  className: "",
  iconSize: [25, 41],
  iconAnchor: [12.5, 41],
});

export interface MapCase {
  id: string;
  gps: { lat: number; lon: number };
  photo: string;
}

function FitBounds({ cases }: { cases: MapCase[] }) {
  const map = useMap();
  useEffect(() => {
    if (cases.length > 0) {
      const bounds = L.latLngBounds(
        cases.map((c) => [c.gps.lat, c.gps.lon]),
      ).pad(0.2);
      map.fitBounds(bounds);
    }
  }, [cases, map]);
  return null;
}

export default function MapPageClient({ cases }: { cases: MapCase[] }) {
  const router = useRouter();
  return (
    <MapContainer
      style={{ height: "calc(100vh - 4rem)", width: "100%" }}
      center={[0, 0]}
      zoom={2}
      scrollWheelZoom
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds cases={cases} />
      {cases.map((c) => (
        <Marker
          key={c.id}
          position={[c.gps.lat, c.gps.lon]}
          icon={markerIcon}
          eventHandlers={{ click: () => router.push(`/cases/${c.id}`) }}
        >
          <Tooltip direction="top">
            <a
              href={`/cases/${c.id}`}
              className="w-40 cursor-pointer block"
              onClick={(e) => {
                e.preventDefault();
                router.push(`/cases/${c.id}`);
              }}
            >
              <Image
                src={c.photo}
                alt={`Case ${c.id}`}
                width={160}
                height={120}
                className="object-cover"
              />
              <div>Case {c.id}</div>
            </a>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
