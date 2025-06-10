import { caseEvents } from "@/lib/caseEvents";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      function onUpdate(data: unknown) {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }
      caseEvents.on("update", onUpdate);
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(":\n\n"));
      }, 15000);
      controller.oncancel = () => {
        clearInterval(keepAlive);
        caseEvents.off("update", onUpdate);
      };
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
