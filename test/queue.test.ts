import { beforeEach, describe, expect, it, vi } from "vitest";

let queue: typeof import("@/lib/queue");

beforeEach(async () => {
  vi.resetModules();
  queue = await import("@/lib/queue");
});

describe("queue", () => {
  it("processes jobs by priority then FIFO", async () => {
    const order: number[] = [];
    queue.enqueue(1, 0);
    queue.enqueue(2, 1);
    queue.enqueue(3, 1);
    queue.enqueue(4, 2);
    queue.registerWorker(async (n: number) => {
      order.push(n);
    });
    await new Promise((resolve) => queue.on("idle", resolve));
    expect(order).toEqual([4, 2, 3, 1]);
  });
});
