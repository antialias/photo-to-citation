import { getVinSourceStatuses } from "@/lib/vinSources";
import { NextResponse } from "next/server";

export async function GET() {
  const sources = getVinSourceStatuses();
  return NextResponse.json(sources);
}
