import { inviteUser } from "@/lib/adminStore";
import { withAuthorization } from "@/lib/authz";
import { NextResponse } from "next/server";

export const POST = withAuthorization(
  "admin",
  "create",
  async (req: Request) => {
    const { email } = (await req.json()) as { email: string };
    const user = inviteUser(email);
    return NextResponse.json(user);
  },
);
