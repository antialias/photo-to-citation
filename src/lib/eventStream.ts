import type { EventEmitter } from "node:events";
import { NextResponse } from "next/server";

export function createEventStream(
  req: Request,
  emitter: EventEmitter,
  opts: { initial?: unknown; eventName?: string } = {},
) {
  const { initial, eventName = "update" } = opts;
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

      function handleUpdate(data: unknown) {
        send(`data: ${JSON.stringify(data)}\n\n`);
      }

      function cleanup() {
        clearInterval(keepAlive);
        emitter.off(eventName, handleUpdate);
      }

      emitter.on(eventName, handleUpdate);
      if (initial !== undefined) handleUpdate(initial);

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
