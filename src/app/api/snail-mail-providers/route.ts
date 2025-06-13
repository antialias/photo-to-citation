import { getSnailMailProviderStatuses } from "@/lib/snailMailProviders";
import { NextResponse } from "next/server";

export async function GET() {
  const providers = getSnailMailProviderStatuses();
  return NextResponse.json(providers);
}
