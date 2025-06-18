import { listUsers } from "@/lib/adminStore";
import { withAuthorization } from "@/lib/authz";
import { NextResponse } from "next/server";

export const GET = withAuthorization(
  "admin",
  "read",
  async (
    _req: Request,
    _ctx: {
      params: Promise<Record<string, string>>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const users = listUsers();
    return NextResponse.json(users);
  },
);
