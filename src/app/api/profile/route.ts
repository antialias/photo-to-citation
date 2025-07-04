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
  const { name, image, bio, socialLinks, address, cityStateZip, daytimePhone } =
    (await req.json()) as {
      name?: string | null;
      image?: string | null;
      bio?: string | null;
      socialLinks?: string | null;
      address?: string | null;
      cityStateZip?: string | null;
      daytimePhone?: string | null;
    };
  const user = updateUser(userId, {
    name,
    image,
    bio,
    socialLinks,
    address,
    cityStateZip,
    daytimePhone,
    profileStatus: "under_review",
    profileReviewNotes: null,
  });
  if (!user) return new Response(null, { status: 404 });
  reviewProfileInBackground(userId);
  return NextResponse.json(user);
}
