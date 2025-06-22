import { getSessionDetails, withCaseAuthorization } from "@/lib/authz";
import { isCaseMember, removeCaseMember } from "@/lib/caseMembers";
import { getCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const DELETE = withCaseAuthorization(
  { obj: "cases", act: "update" },
  async (
    _req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string; uid: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id, uid } = await params;
    const c = getCase(id);
    if (!c) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { role, userId: requesterId } = getSessionDetails(
      { session },
      "user",
    );
    if (
      role !== "admin" &&
      role !== "superadmin" &&
      (!requesterId || !isCaseMember(id, requesterId, "owner"))
    ) {
      return new Response(null, { status: 403 });
    }
    removeCaseMember(id, uid);
    return NextResponse.json(getCase(id));
  },
);
