import ClientCasesPage from "@/app/cases/ClientCasesPage";
import QueryProvider from "@/app/query-provider";
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

describe("case state filter", () => {
  it("toggles closed case visibility", () => {
    const { getByLabelText, queryByText } = render(
      <QueryProvider>
        <ClientCasesPage initialCases={[baseCase, closedCase]} />
      </QueryProvider>,
    );
    expect(queryByText(/Case 2/)).toBeNull();
    const select = getByLabelText(/show/i) as HTMLSelectElement;
    const closedOption = Array.from(select.options).find(
      (o) => o.value === "closed",
    ) as HTMLOptionElement;
    closedOption.selected = true;
    fireEvent.change(select);
    expect(queryByText(/Case 2/)).toBeInTheDocument();
  });
});
