import type { Case } from "@/lib/caseStore";
import type { Meta, StoryObj } from "@storybook/react";
import ClientCasePage from "./ClientCasePage";

const meta: Meta<typeof ClientCasePage> = {
  component: ClientCasePage,
  title: "Pages/ClientCasePage",
};
export default meta;

type Story = StoryObj<typeof ClientCasePage>;

function setupMocks(data: Case) {
  (
    globalThis as unknown as { fetch: (input: string) => Promise<Response> }
  ).fetch = async () => new Response(JSON.stringify(data));
  (globalThis as unknown as { EventSource: typeof EventSource }).EventSource =
    class {
      onmessage: ((ev: MessageEvent) => void) | null = null;
      close() {}
    };
}

const base: Case = {
  id: "123",
  photos: [
    "https://placehold.co/600x400?text=main",
    "https://placehold.co/601x400?text=alt",
  ],
  photoTimes: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  gps: { lat: 41.88, lon: -87.78 },
  streetAddress: "123 Main St",
  intersection: "Main & 1st",
  vin: "1HGCM82633A004352",
  vinOverride: null,
  analysis: {
    violationType: "parking",
    details: "Blocking sidewalk",
    location: "Oak Park",
    vehicle: {
      licensePlateNumber: "ABC123",
      model: "Civic",
    },
    images: {},
  },
  analysisOverrides: null,
  analysisStatus: "complete",
  analysisStatusCode: 200,
  sentEmails: [],
  ownershipRequests: [],
};

export const Completed: Story = {
  render: () => {
    setupMocks(base);
    return <ClientCasePage caseId={base.id} initialCase={base} />;
  },
};

export const PendingAnalysis: Story = {
  render: () => {
    const data: Case = {
      ...base,
      id: "124",
      analysis: null,
      analysisStatus: "pending",
    };
    setupMocks(data);
    return <ClientCasePage caseId="124" initialCase={data} />;
  },
};
