import { beforeEach, describe, expect, it, vi } from "vitest";

interface TestJob {
  name: string;
}

describe("queue", () => {
  beforeEach(() => {
    // Reset modules to clear queue state
    vi.resetModules();
  });

  it("processes higher priority first and preserves FIFO", async () => {
    const processed: string[] = [];
    const { enqueue, registerWorker } = await import("../queue");

    enqueue({ name: "low1" }, 0);
    enqueue({ name: "high" }, 10);
    enqueue({ name: "low2" }, 0);

    registerWorker<TestJob>((job) => {
      processed.push(job.data.name);
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(processed).toEqual(["high", "low1", "low2"]);
  });
});
