import { getAnonymousSessionId } from "@/lib/anonymousSession";
import { getSessionDetails, withAuthorization } from "@/lib/authz";
import { claimCasesForSession } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const POST = withAuthorization(
  { obj: "cases", act: "update" },
  async (
    req: Request,
    {
      params: _params,
      session,
    }: {
      params: Promise<Record<string, string>>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { userId } = getSessionDetails({ session }, "user");
    if (!userId) {
      return new Response(null, { status: 403 });
    }
    const sessionId = getAnonymousSessionId(req);
    if (!sessionId) {
      return NextResponse.json([]);
    }
    const claimed = claimCasesForSession(userId, sessionId);
    return NextResponse.json(claimed);
  },
);
