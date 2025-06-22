import { inviteUser } from "@/lib/adminStore";
import { withAuthorization } from "@/lib/authz";
import { NextResponse } from "next/server";

export const POST = withAuthorization(
  { obj: "users" },
  async (
    req: Request,
    _ctx: {
      params: Promise<Record<string, string>>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const { email } = (await req.json()) as { email: string };
    const user = inviteUser(email);
    return NextResponse.json(user);
  },
);
