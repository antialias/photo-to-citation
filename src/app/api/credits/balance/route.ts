import { withAuthorization } from "@/lib/authz";
import { getCreditBalance } from "@/lib/credits";
import { NextResponse } from "next/server";

export const GET = withAuthorization(
  { obj: "credits" },
  async (
    _req: Request,
    { session }: { session?: { user?: { id?: string; role?: string } } },
  ) => {
    if (!session?.user?.id) {
      return new Response(null, { status: 401 });
    }
    const balance = getCreditBalance(session.user.id);
    return NextResponse.json({ balance });
  },
);
