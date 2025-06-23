import { withAuthorization } from "@/lib/authz";
import { getVinSourceStatuses } from "@/lib/vinSources";
import { NextResponse } from "next/server";

export const GET = withAuthorization({ obj: "vin_sources" }, async () => {
  const sources = getVinSourceStatuses();
  return NextResponse.json(sources);
});
