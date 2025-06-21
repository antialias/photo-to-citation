import { getSessionDetails, withAuthorization } from "@/lib/authz";
import { getVinSourceStatuses, setVinSourceEnabled } from "@/lib/vinSources";
import { NextResponse } from "next/server";

export const PUT = withAuthorization(
  "cases",
  "read",
  async (
    req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const { id } = await params;
    const { role } = getSessionDetails({ session }, "anonymous");
    if (role !== "admin" && role !== "superadmin") {
      return new Response(null, { status: 403 });
    }
    const { enabled } = (await req.json()) as { enabled: boolean };
    const result = setVinSourceEnabled(id, enabled);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(getVinSourceStatuses());
  },
);
