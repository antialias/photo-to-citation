import { loadAuthContext } from "@/lib/authz";
import { profileEvents } from "@/lib/profileEvents";
import { eventStream } from "@/lib/sse";
import { type UserRecord, getUser } from "@/lib/userStore";

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
  return eventStream<UserRecord>(req, profileEvents, {
    filter: (u) => u.id === userId,
    initial: user,
  });
}
