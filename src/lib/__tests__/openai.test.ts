import { describe, expect, it } from "vitest";
import { openai } from "../openai";

describe("openai client", () => {
  it("exports a client instance", () => {
    expect(openai).toBeDefined();
  });
});
