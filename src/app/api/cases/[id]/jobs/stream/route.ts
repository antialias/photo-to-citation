import { getSessionDetails, withAuthorization } from "@/lib/authz";
import { isCaseMember } from "@/lib/caseMembers";
import { getCase } from "@/lib/caseStore";
import { jobEvents } from "@/lib/jobEvents";
import { listJobs } from "@/lib/jobScheduler";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuthorization(
  { obj: "cases" },
  async (
    req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id } = await params;
    const c = getCase(id);
    if (!c) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { userId, role } = getSessionDetails({ session }, "user");
    if (!c.public && role !== "admin" && role !== "superadmin") {
      if (!userId || !isCaseMember(id, userId)) {
        return new Response(null, { status: 403 });
      }
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
