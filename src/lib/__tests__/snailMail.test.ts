import { describe, expect, it, vi } from "vitest";
import { sendSnailMail, snailMailProviders } from "../snailMail";

const opts = {
  to: { address1: "1 A St", city: "Nowhere", state: "IL", postalCode: "12345" },
  from: {
    address1: "2 B St",
    city: "Nowhere",
    state: "IL",
    postalCode: "12345",
  },
  contents: "/tmp/foo.pdf",
};

describe("sendSnailMail", () => {
  it("uses the specified provider", async () => {
    const fn = vi.fn().mockResolvedValue({ id: "1", status: "queued" });
    snailMailProviders.mock.send = fn as typeof snailMailProviders.mock.send;
    const result = await sendSnailMail("mock", opts);
    expect(fn).toHaveBeenCalledWith(opts, undefined);
    expect(result.id).toBe("1");
  });
});
