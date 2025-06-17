import { deleteUser } from "@/lib/adminStore";
import { withAuthorization } from "@/lib/authz";
import { NextResponse } from "next/server";

export const DELETE = withAuthorization(
  "admin",
  "delete",
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    deleteUser(id);
    return NextResponse.json({ ok: true });
  },
);
