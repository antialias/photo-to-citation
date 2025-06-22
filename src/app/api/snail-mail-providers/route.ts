import { withAuthorization } from "@/lib/authz";
import { getSnailMailProviderStatuses } from "@/lib/snailMailProviders";
import { NextResponse } from "next/server";

export const GET = withAuthorization({ obj: "admin" }, async () => {
  const providers = getSnailMailProviderStatuses();
  return NextResponse.json(providers);
});
