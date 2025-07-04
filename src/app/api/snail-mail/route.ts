import { getSessionDetails, withAuthorization } from "@/lib/authz";
import { getSentMails } from "@/lib/snailMailStore";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = withAuthorization(
  { obj: "cases" },
  async (
    req: Request,
    {
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
    const url = new URL(req.url);
    const caseId = url.searchParams.get("caseId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const mails = getSentMails().filter((m) => {
      if (m.userId !== userId) return false;
      if (caseId && m.caseId !== caseId) return false;
      if (status && m.status !== status) return false;
      return true;
    });
    return NextResponse.json(mails);
  },
);
