import { withAuthorization } from "@/lib/authz";
import {
  getOauthProviderStatuses,
  setOauthProviderEnabled,
} from "@/lib/oauthProviders";
import { NextResponse } from "next/server";

export const PUT = withAuthorization(
  { obj: "oauth_providers", act: "update" },
  async (
    req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id } = await params;
    const { enabled } = (await req.json()) as { enabled: boolean };
    const result = setOauthProviderEnabled(id, enabled);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(getOauthProviderStatuses());
  },
);
