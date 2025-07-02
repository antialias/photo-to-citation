import { withAuthorization } from "@/lib/authz";
import { getOauthProviderStatuses } from "@/lib/oauthProviders";
import { NextResponse } from "next/server";

export const GET = withAuthorization({ obj: "oauth_providers" }, async () => {
  const list = getOauthProviderStatuses();
  return NextResponse.json(list);
});
