import { CaseProvider } from "@/app/cases/[id]/CaseContext";
import { caseQueryKey } from "@/app/hooks/useCase";
import queryClient from "@/app/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({
    ok: true,
    json: async () => ({
      id: "1",
      photos: [],
      photoTimes: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      analysisStatus: "pending",
      public: false,
      closed: false,
    }),
  })),
);

let es: { onmessage: ((e: MessageEvent) => void) | null; close: () => void };
vi.stubGlobal(
  "EventSource",
  class {
    onmessage: ((e: MessageEvent) => void) | null = null;
    close() {}
    constructor() {
      es = this;
    }
  },
);

afterEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
});

describe("CaseProvider cache", () => {
  it("updates cache from SSE", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CaseProvider initialCase={null} caseId="1">
          <div />
        </CaseProvider>
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(queryClient.getQueryData(caseQueryKey("1"))).toBeDefined(),
    );
    es.onmessage?.({
      data: JSON.stringify({ id: "1", public: true, photos: [] }),
    } as MessageEvent);
    await waitFor(() =>
      expect(queryClient.getQueryData(caseQueryKey("1"))).toMatchObject({
        public: true,
      }),
    );
  });
});
