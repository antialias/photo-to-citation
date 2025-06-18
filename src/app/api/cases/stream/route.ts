import { withAuthorization } from "@/lib/authz";
import { caseEvents } from "@/lib/caseEvents";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = withAuthorization(
  "cases",
  "read",
  async (
    req: Request,
    {
      session,
    }: {
      params: Promise<Record<string, string>>;
      session?: { user?: { role?: string } };
    },
  ) => {
    if (!session?.user) {
      return new Response(null, { status: 403 });
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
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          send(payload);
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

        const ctrl =
          controller as ReadableStreamDefaultController<Uint8Array> & {
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
  },
);
