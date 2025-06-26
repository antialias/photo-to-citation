import { getAnonymousSessionId } from "@/lib/anonymousSession";
import { authorize, loadAuthContext, withCaseAuthorization } from "@/lib/authz";
import { isCaseMember } from "@/lib/caseMembers";
import { deleteCase, getCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  {
    params,
    session,
  }: {
    params: Promise<{ id: string }>;
    session?: { user?: { id?: string; role?: string } };
  },
) {
  const { id } = await params;
  const c = getCase(id);
  if (!c) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { role, userId } = await loadAuthContext({ session }, "anonymous");
  const anonId = getAnonymousSessionId(req);
  const sessionMatch = anonId && c.sessionId && c.sessionId === anonId;
  const authRole = sessionMatch ? "user" : role;
  if (!(await authorize(authRole, "cases", "read"))) {
    return new Response(null, { status: 403 });
  }
  if (!c.public && role !== "admin" && role !== "superadmin") {
    if (!(sessionMatch || (userId && isCaseMember(id, userId)))) {
      return new Response(null, { status: 403 });
    }
  }
  return NextResponse.json(c);
}

export const DELETE = withCaseAuthorization(
  { obj: "cases" },
  async (
    req: Request,
    {
      params,
      session: _session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id } = await params;
    const ok = deleteCase(id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  },
);
