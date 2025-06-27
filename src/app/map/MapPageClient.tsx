"use client";
import ThumbnailImage from "@/components/thumbnail-image";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { useRouter } from "next/navigation";
import { Map, Marker, Overlay } from "pigeon-maps";
import { osm } from "pigeon-maps/providers";


import "@/app/globals.css";

const markerSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
    <path
      d="M12.5 1c6 0 11 5 11 11 0 9-11 28-11 28S1.5 21 1.5 12C1.5 6 6.5 1 12.5 1z"
      fill="#2563eb" stroke="white" stroke-width="2"
    />
    <circle cx="12.5" cy="12" r="3" fill="white" />
  </svg>
`;

export interface MapCase {
  id: string;
  gps: { lat: number; lon: number };
  photo: string;
}


export default function MapPageClient({ cases }: { cases: MapCase[] }) {
  const router = useRouter();
  return (
    <div style={{ height: "calc(100dvh - 4rem)", width: "100%" }}>
      <Map defaultCenter={[0, 0]} defaultZoom={2} provider={osm}>
        {cases.map((c) => (
          <Marker
            key={c.id}
            anchor={[c.gps.lat, c.gps.lon] as [number, number]}
            width={25}
            onClick={() => router.push(`/cases/${c.id}`)}
          >
            <div style={{ pointerEvents: "auto" }} className="group relative">
              <div
                dangerouslySetInnerHTML={{ __html: markerSvg }}
                className="w-[25px] h-[41px]"
              />
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
          </Marker>
        ))}
      </Map>
    </div>
  );
}
