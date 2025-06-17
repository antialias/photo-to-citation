import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Case } from "../../../lib/caseStore";
import ClientCasesPage from "../ClientCasesPage";
import ClientCasePage from "../[id]/ClientCasePage";
vi.mock("../../useSession", () => ({ useSession: () => ({ data: null }) }));

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
  vi.fn(async () => ({ ok: true, json: async () => baseCase })),
);

vi.stubGlobal(
  "matchMedia",
  vi.fn(() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })),
);

const baseCase: Case = {
  id: "1",
  photos: [],
  photoTimes: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  analysisStatus: "pending",
  public: false,
};

describe("drag overlays", () => {
  it("uses absolute positioning in cases list", () => {
    const { container } = render(<ClientCasesPage initialCases={[baseCase]} />);
    const target = container.firstElementChild as HTMLElement;
    fireEvent.dragEnter(target);
    const overlay = container.querySelector("div.absolute.inset-0");
    expect(overlay).toBeInTheDocument();
  });

  it("uses absolute positioning in single case page", () => {
    const { container } = render(
      <ClientCasePage initialCase={baseCase} caseId="1" />,
    );
    const target = container.firstElementChild as HTMLElement;
    fireEvent.dragEnter(target);
    const overlay = container.querySelector("div.absolute.inset-0");
    expect(overlay).toBeInTheDocument();
  });
});
