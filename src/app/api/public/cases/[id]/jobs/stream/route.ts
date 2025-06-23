import { authorize } from "@/lib/authz";
import { getCase } from "@/lib/caseStore";
import { jobEvents } from "@/lib/jobEvents";
import { listJobs } from "@/lib/jobScheduler";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await authorize("anonymous", "public_cases", "read"))) {
    return new Response(null, { status: 403 });
  }
  const { id } = await params;
  const c = getCase(id);
  if (!c || !c.public) {
    return new Response(null, { status: 403 });
  }
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? undefined;
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
        const payload = `data: ${JSON.stringify(listJobs(type, id))}\n\n`;
        send(payload);
      }

      function cleanup() {
        clearInterval(keepAlive);
        jobEvents.off("update", onUpdate);
      }

      jobEvents.on("update", onUpdate);
      onUpdate();

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
