import { notify } from "@/components/NotificationProvider";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: vi.fn() }));
import { toast } from "sonner";

describe("notify", () => {
  afterEach(() => {
    (global as Record<string, unknown>).Notification =
      undefined as unknown as Notification;
    vi.clearAllMocks();
  });

  it("shows toast", () => {
    notify("hello");
    expect(toast).toHaveBeenCalledWith("hello");
  });

  it("requests permission and shows browser notification", async () => {
    const browserNotify = vi.fn();
    const requestPermission = vi.fn().mockResolvedValue("granted");
    (global as Record<string, unknown>).Notification = Object.assign(
      browserNotify,
      {
        permission: "default",
        requestPermission,
      },
    );
    notify("hi");
    await Promise.resolve();
    expect(requestPermission).toHaveBeenCalled();
    expect(browserNotify).toHaveBeenCalledWith("hi");
  });
});
