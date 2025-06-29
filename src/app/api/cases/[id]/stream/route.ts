import { getAnonymousSessionId } from "@/lib/anonymousSession";
import { authorize, getSessionDetails, loadAuthContext } from "@/lib/authz";
import { caseEvents } from "@/lib/caseEvents";
import { isCaseMember } from "@/lib/caseMembers";
import { getCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  {
    params,
    session,
  }: {
    params: Promise<{ id: string }>;
    session?: { user?: { id?: string; role?: string } };
  },
) {
  const { id } = await params;
  const c = getCase(id);
  if (!c) {
    return new Response(null, { status: 404 });
  }
  const { role, userId } = await loadAuthContext({ session }, "anonymous");
  const anonId = getAnonymousSessionId(req);
  const sessionMatch = anonId && c.sessionId && c.sessionId === anonId;
  const authRole = sessionMatch ? "user" : role;
  if (!(await authorize(authRole, "cases", "read"))) {
    return new Response(null, { status: 403 });
  }
  if (!c.public && role !== "admin" && role !== "superadmin") {
    if (!(sessionMatch || (userId && isCaseMember(id, userId)))) {
      return new Response(null, { status: 403 });
    }
  }

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

      function onUpdate(data: unknown) {
        if (
          typeof data === "object" &&
          data &&
          (data as { id?: string }).id === id
        ) {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          send(payload);
        }
      }

      function cleanup() {
        clearInterval(keepAlive);
        caseEvents.off("update", onUpdate);
      }

      caseEvents.on("update", onUpdate);

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
