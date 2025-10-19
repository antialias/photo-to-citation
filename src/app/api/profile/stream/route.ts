import { loadAuthContext } from "@/lib/authz";
import { profileEvents } from "@/lib/profileEvents";
import { type UserRecord, getUser } from "@/lib/userStore";
import { NextResponse } from "next/server";

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
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      function send(chunk: string) {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      }

      function onUpdate(u: UserRecord) {
        if (u.id !== userId) return;
        const payload = `data: ${JSON.stringify(u)}\n\n`;
        send(payload);
      }

      function cleanup() {
        clearInterval(keepAlive);
        profileEvents.off("update", onUpdate);
      }

      profileEvents.on("update", onUpdate);
      onUpdate(user);

      const keepAlive = setInterval(() => {
        send(":\n\n");
      }, 15000);

      req.signal.addEventListener("abort", () => {
        cleanup();
        controller.close();
      });

      const ctrl = controller as ReadableStreamDefaultController<Uint8Array> & {
        oncancel?: () => void;
      };
      ctrl.oncancel = cleanup;
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
