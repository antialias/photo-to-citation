import { withAuthorization } from "@/lib/authz";
import { jobEvents } from "@/lib/jobEvents";
import { listJobs } from "@/lib/jobScheduler";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuthorization(
  { obj: "superadmin" },
  async (req: Request) => {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") ?? undefined;
    const caseId = url.searchParams.get("caseId") ?? undefined;
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

        function onUpdate() {
          const payload = `data: ${JSON.stringify(listJobs(type, caseId))}\n\n`;
          send(payload);
        }

        function cleanup() {
          clearInterval(keepAlive);
          jobEvents.off("update", onUpdate);
        }

        jobEvents.on("update", onUpdate);

        // send initial state
        onUpdate();

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
