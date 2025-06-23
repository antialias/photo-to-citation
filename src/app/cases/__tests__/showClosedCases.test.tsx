import ClientCasesPage from "@/app/cases/ClientCasesPage";
import type { Case } from "@/lib/caseStore";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/useSession", () => ({ useSession: () => ({ data: null }) }));
vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.stubGlobal(
  "EventSource",
  class {
    onmessage: ((this: unknown, ev: MessageEvent) => void) | null = null;
    close() {}
  },
);

vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({ ok: true, json: async () => ({}) })),
);

const baseCase: Case = {
  id: "1",
  photos: [],
  photoTimes: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  analysisStatus: "pending",
  public: false,
  closed: false,
};

const closedCase: Case = { ...baseCase, id: "2", closed: true };

describe("show closed cases", () => {
  it("toggles closed case visibility", () => {
    const { getByLabelText, queryByText } = render(
      <ClientCasesPage initialCases={[baseCase, closedCase]} />,
    );
    expect(queryByText(/Case 2/)).toBeNull();
    const checkbox = getByLabelText(/show closed cases/i);
    fireEvent.click(checkbox);
    expect(queryByText(/Case 2/)).toBeInTheDocument();
  });
});
