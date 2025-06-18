import { withAuthorization } from "@/lib/authz";
import { isCaseMember } from "@/lib/caseMembers";
import { getCase, setCasePublic } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const PUT = withAuthorization(
  "cases",
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
    const userId = session?.user?.id;
    const role = session?.user?.role ?? "user";
    if (
      role !== "admin" &&
      role !== "superadmin" &&
      (!userId || !isCaseMember(id, userId))
    ) {
      return new Response(null, { status: 403 });
    }
    const { public: isPublic } = (await req.json()) as { public: boolean };
    const updated = setCasePublic(id, isPublic);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);
