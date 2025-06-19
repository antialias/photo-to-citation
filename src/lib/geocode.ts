import { config } from "./config";

export interface Coordinates {
  lat: number;
  lon: number;
}

async function fetchGeocode(params: Record<string, string>): Promise<unknown> {
  const query = new URLSearchParams({
    key: config.GOOGLE_MAPS_API_KEY || "",
    ...params,
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${query}`,
  );
  if (!res.ok) throw new Error(`Geocode request failed: ${res.status}`);
  return res.json();
}

export async function reverseGeocode({
  lat,
  lon,
}: Coordinates): Promise<string | null> {
  const data = (await fetchGeocode({
    latlng: `${lat},${lon}`,
    result_type: "street_address",
  })) as { results?: Array<{ formatted_address?: string }> };
  return data.results?.[0]?.formatted_address ?? null;
}

export async function intersectionLookup({
  lat,
  lon,
}: Coordinates): Promise<string | null> {
  const data = (await fetchGeocode({
    latlng: `${lat},${lon}`,
    result_type: "intersection",
  })) as { results?: Array<{ formatted_address?: string }> };
  return data.results?.[0]?.formatted_address ?? null;
}
