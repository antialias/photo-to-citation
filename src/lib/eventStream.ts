import type { EventEmitter } from "node:events";
import { NextResponse } from "next/server";

export function createEventStream(
  req: Request,
  emitter: EventEmitter,
  opts?: {
    sendInitial?: () => unknown;
    filter?: (data: unknown) => boolean;
  },
) {
  const sendInitial = opts?.sendInitial;
  const filter = opts?.filter;
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
        if (filter && !filter(data)) return;
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        send(payload);
      }

      function cleanup() {
        clearInterval(keepAlive);
        emitter.off("update", onUpdate);
      }

      emitter.on("update", onUpdate);
      if (sendInitial) onUpdate(sendInitial());

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
