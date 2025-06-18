import { updateUserRole } from "@/lib/adminStore";
import { withAuthorization } from "@/lib/authz";
import { NextResponse } from "next/server";

export const PUT = withAuthorization(
  "admin",
  "update",
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
    if (session?.user?.role !== "superadmin") {
      return new Response(null, { status: 403 });
    }
    const { id } = await params;
    const { role } = (await req.json()) as { role: string };
    updateUserRole(id, role);
    return NextResponse.json({ ok: true });
  },
);
