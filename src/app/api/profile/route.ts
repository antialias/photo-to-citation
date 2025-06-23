import { loadAuthContext } from "@/lib/authz";
import { getUser, updateUser } from "@/lib/userStore";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  ctx: {
    params: Promise<Record<string, string>>;
    session?: { user?: { id?: string } };
  },
) {
  const { userId } = await loadAuthContext(ctx, "user");
  if (!userId) return new Response(null, { status: 401 });
  const user = getUser(userId);
  if (!user) return new Response(null, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(
  req: Request,
  ctx: {
    params: Promise<Record<string, string>>;
    session?: { user?: { id?: string } };
  },
) {
  const { userId } = await loadAuthContext(ctx, "user");
  if (!userId) return new Response(null, { status: 401 });
  const { name, image } = (await req.json()) as {
    name?: string | null;
    image?: string | null;
  };
  const user = updateUser(userId, { name, image });
  if (!user) return new Response(null, { status: 404 });
  return NextResponse.json(user);
}
