import { withAuthorization } from "@/lib/authz";
import { cancelCaseAnalysis } from "@/lib/caseAnalysis";
import { isCaseMember } from "@/lib/caseMembers";
import { getCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const POST = withAuthorization(
  "cases",
  "read",
  async (
    _req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id } = await params;
    const userId = session?.user?.id;
    const role = session?.user?.role ?? "user";
    if (
      role !== "admin" &&
      role !== "superadmin" &&
      (!userId || !isCaseMember(id, userId))
    ) {
      return new Response(null, { status: 403 });
    }
    const ok = cancelCaseAnalysis(id);
    const c = getCase(id);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!ok) return NextResponse.json(c);
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);
