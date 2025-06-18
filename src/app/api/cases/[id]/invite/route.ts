import { withCaseAuthorization } from "@/lib/authz";
import { addCaseMember, isCaseMember } from "@/lib/caseMembers";
import { getCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const POST = withCaseAuthorization(
  "read",
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
    const { userId } = (await req.json()) as { userId: string };
    const c = getCase(id);
    if (!c) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const requester = session?.user;
    const role = requester?.role ?? "user";
    if (
      role !== "admin" &&
      role !== "superadmin" &&
      (!requester?.id || !isCaseMember(id, requester.id, "owner"))
    ) {
      return new Response(null, { status: 403 });
    }
    if (!isCaseMember(id, userId)) {
      addCaseMember(id, userId, "collaborator");
    }
    return NextResponse.json(getCase(id));
  },
);
