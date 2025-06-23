import {
  getSessionDetails,
  withAuthorization,
  withCaseAuthorization,
} from "@/lib/authz";
import { isCaseMember } from "@/lib/caseMembers";
import { deleteCase, getCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const GET = withAuthorization(
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
    const c = getCase(id);
    if (!c) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { userId, role } = getSessionDetails({ session }, "user");
    if (!c.public && role !== "admin" && role !== "superadmin") {
      if (!userId || !isCaseMember(id, userId)) {
        return new Response(null, { status: 403 });
      }
    }
    return NextResponse.json(c);
  },
);

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
