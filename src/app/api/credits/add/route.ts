import { withAuthorization } from "@/lib/authz";
import { getCreditSettings } from "@/lib/creditSettings";
import { addCredits } from "@/lib/credits";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const POST = withAuthorization(
  { obj: "credits", act: "update" },
  async (
    req: Request,
    { session }: { session?: { user?: { id?: string; role?: string } } },
  ) => {
    if (!session?.user?.id) {
      return new Response(null, { status: 401 });
    }
    const { usd } = (await req.json()) as { usd: number };
    const { usdPerCredit } = getCreditSettings();
    const credits = Math.floor(usd / usdPerCredit);
    const balance = addCredits(session.user.id, credits);
    return NextResponse.json({ balance });
  },
);
