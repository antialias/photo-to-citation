import { updateUserRole } from "@/lib/adminStore";
import { getSessionDetails, withAuthorization } from "@/lib/authz";
import { NextResponse } from "next/server";

export const PUT = withAuthorization(
  { obj: "users" },
  async (
    req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const { role: requesterRole } = getSessionDetails({ session });
    if (requesterRole !== "superadmin") {
      return new Response(null, { status: 403 });
    }
    const { id } = await params;
    const { role } = (await req.json()) as { role: string };
    updateUserRole(id, role);
    return NextResponse.json({ ok: true });
  },
);
