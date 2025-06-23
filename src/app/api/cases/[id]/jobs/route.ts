import { getSessionDetails, withAuthorization } from "@/lib/authz";
import { isCaseMember } from "@/lib/caseMembers";
import { getCase } from "@/lib/caseStore";
import { listJobs } from "@/lib/jobScheduler";
import { NextResponse } from "next/server";

export const GET = withAuthorization(
  { obj: "cases" },
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
    const url = new URL(req.url);
    const type = url.searchParams.get("type") ?? undefined;
    const data = listJobs(type, id);
    return NextResponse.json(data);
  },
);
