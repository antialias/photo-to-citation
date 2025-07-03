import { loadAuthContext } from "@/lib/authz";
import { createEventStream } from "@/lib/eventStream";
import { profileEvents } from "@/lib/profileEvents";
import { getUser } from "@/lib/userStore";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: {
    params: Promise<Record<string, string>>;
    session?: { user?: { id?: string } };
  },
) {
  const { userId } = await loadAuthContext(ctx, "user");
  if (!userId) return new Response(null, { status: 401 });
  const user = getUser(userId);
  if (!user) return new Response(null, { status: 404 });
  return createEventStream(req, profileEvents, { initial: user });
}
