import type { EventEmitter } from "node:events";
import { NextResponse } from "next/server";

export interface EventStreamOptions<T> {
  filter?: (data: T) => boolean;
  initial?: T;
}

export function eventStream<T>(
  req: Request,
  emitter: EventEmitter,
  opts: EventStreamOptions<T> = {},
): NextResponse {
  const { filter, initial } = opts;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      function sendData(data: T) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          cleanup();
        }
      }

      function sendKeepAlive() {
        try {
          controller.enqueue(encoder.encode(":\n\n"));
        } catch {
          cleanup();
        }
      }

      function onUpdate(data: T) {
        if (!filter || filter(data)) sendData(data);
      }

      function cleanup() {
        clearInterval(keepAlive);
        emitter.off("update", onUpdate);
      }

      emitter.on("update", onUpdate);
      if (initial !== undefined) onUpdate(initial);

      const keepAlive = setInterval(sendKeepAlive, 15000);

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
