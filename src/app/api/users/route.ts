import { listUsers } from "@/lib/adminStore";
import { withAuthorization } from "@/lib/authz";
import { NextResponse } from "next/server";

export const GET = withAuthorization("admin", "read", async () => {
  const users = listUsers();
  return NextResponse.json(users);
});
