import { disableUser } from "@/lib/adminStore";
import { withAuthorization } from "@/lib/authz";
import { NextResponse } from "next/server";

export const PUT = withAuthorization(
  { obj: "users" },
  async (
    _req: Request,
    {
      params,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const { id } = await params;
    disableUser(id);
    return NextResponse.json({ ok: true });
  },
);
