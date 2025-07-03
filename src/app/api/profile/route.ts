import { loadAuthContext } from "@/lib/authz";
import { reviewProfileInBackground } from "@/lib/profileReview";
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
  const { name, image, socialLinks, bio } = (await req.json()) as {
    name?: string | null;
    image?: string | null;
    socialLinks?: string | null;
    bio?: string | null;
  };
  const user = updateUser(userId, {
    name,
    image,
    socialLinks,
    bio,
    profileStatus: "under_review",
    reviewReason: null,
  });
  reviewProfileInBackground(userId);
  if (!user) return new Response(null, { status: 404 });
  return NextResponse.json(user);
}
