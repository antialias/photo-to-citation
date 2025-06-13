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
    const fn = vi.fn();
    snailMailProviders.mock.send = fn;
    await sendSnailMail("mock", opts);
    expect(fn).toHaveBeenCalledWith(opts, undefined);
  });
});
