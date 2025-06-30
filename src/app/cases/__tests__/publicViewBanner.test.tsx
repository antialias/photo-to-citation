import { CaseProvider } from "@/app/cases/[id]/CaseContext";
import PublicViewBanner from "@/app/cases/[id]/components/PublicViewBanner";
import queryClient from "@/app/queryClient";
import type { Case } from "@/lib/caseStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/useSession", () => ({
  useSession: () => ({ data: { user: { id: "u1" } } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.stubGlobal(
  "fetch",
  vi.fn(async (input: RequestInfo) => ({
    ok: true,
    json: async () =>
      String(input).includes("/members")
        ? [
            {
              userId: "u1",
              role: "owner",
              name: "User",
              email: "user@example.com",
            },
          ]
        : caseData,
  })),
);

const caseData: Case = {
  id: "1",
  photos: [],
  photoTimes: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  analysisStatus: "pending",
  public: true,
};

describe("PublicViewBanner", () => {
  it("renders for case members", async () => {
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <CaseProvider initialCase={caseData} caseId="1">
          <PublicViewBanner caseId="1" show />
        </CaseProvider>
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(getByText(/Open non-public view/i)).toBeTruthy(),
    );
  });
});
